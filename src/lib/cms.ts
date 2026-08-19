export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CatalogProduct = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CatalogData = {
  categories: CatalogCategory[];
  products: CatalogProduct[];
  updated_at: string;
};

export const CATALOG_STORAGE_KEY = 'eis-cms-catalog-v1';
export const ADMIN_SESSION_KEY = 'eis-admin-session-v1';

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'category';

export const formatPrice = (value: number | string) => {
  const numericValue = Number(value ?? 0);
  return `PHP ${numericValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const nowIso = () => new Date().toISOString();

const safeRead = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem(CATALOG_STORAGE_KEY) ?? 'null');
  } catch {
    return null;
  }
};

export const readCatalogData = (legacyCategories: Record<string, any[]>) => {
  const stored = safeRead();
  if (stored && Array.isArray(stored.categories) && Array.isArray(stored.products)) {
    return stored as CatalogData;
  }

  return buildLegacyCatalogData(legacyCategories);
};

export const writeCatalogData = (data: CatalogData) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(data));
};

export const buildLegacyCatalogData = (legacyCategories: Record<string, any[]>) => {
  const categoryEntries = Object.entries(legacyCategories).map(([key, items], index) => {
    const displayName = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/\s+/g, ' ')
      .trim();

    const categoryName = displayName
      .split(' ')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ')
      .replace(/\bAnd\b/g, '&');

    const slug = slugify(categoryName === 'Drinkware' ? 'Drinkwares' : categoryName);

    return {
      id: `legacy-${slug}`,
      name: categoryName === 'Drinkware' ? 'Drinkwares' : categoryName,
      slug,
      display_order: index + 1,
      is_active: true,
      created_at: nowIso(),
      updated_at: nowIso(),
    } satisfies CatalogCategory;
  });

  const productEntries = Object.entries(legacyCategories).flatMap(([key, items]) => {
    const category = categoryEntries.find((item) => item.slug === slugify((key === 'drinkware' ? 'Drinkwares' : key).replace(/([A-Z])/g, ' $1')));
    if (!category || !Array.isArray(items)) {
      return [];
    }

    return items.map((item, itemIndex) => ({
      id: `${category.slug}-${itemIndex + 1}`,
      category_id: category.id,
      name: String(item.title ?? `Product ${itemIndex + 1}`),
      slug: slugify(String(item.title ?? `Product ${itemIndex + 1}`)),
      description: String(item.subtitle ?? 'Product description'),
      price: Number(String(item.price ?? '0').replace(/[^\d.]/g, '')) || 0,
      image_url: String(item.image ?? ''),
      is_active: true,
      created_at: nowIso(),
      updated_at: nowIso(),
    } satisfies CatalogProduct));
  });

  return {
    categories: categoryEntries,
    products: productEntries,
    updated_at: nowIso(),
  } satisfies CatalogData;
};

export const createBlankCatalog = () => ({
  categories: [],
  products: [],
  updated_at: nowIso(),
} satisfies CatalogData);

export const buildPublicCategoryList = (catalog: CatalogData) =>
  [...catalog.categories]
    .filter((category) => category.is_active)
    .sort((left, right) => left.display_order - right.display_order)
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      display_order: category.display_order,
      is_active: category.is_active,
    }));

export const getProductsForCategory = (catalog: CatalogData, categoryId: string) =>
  catalog.products.filter((product) => product.category_id === categoryId && product.is_active);

export const getCategoryBySlug = (catalog: CatalogData, slug: string) =>
  catalog.categories.find((category) => category.slug === slug);

export const ensureUniqueProductSlug = (catalog: CatalogData, name: string, currentId?: string) => {
  const base = slugify(name) || 'product';
  let candidate = base;
  let suffix = 1;

  while (
    catalog.products.some(
      (product) => product.slug === candidate && product.id !== currentId,
    )
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

export const ensureUniqueCategorySlug = (catalog: CatalogData, name: string, currentId?: string) => {
  const base = slugify(name) || 'category';
  let candidate = base;
  let suffix = 1;

  while (
    catalog.categories.some(
      (category) => category.slug === candidate && category.id !== currentId,
    )
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};
