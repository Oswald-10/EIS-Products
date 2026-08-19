export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CatalogProductVariant = {
  id: string;
  name: string;
  image_url: string;
  display_order: number;
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
  image_url: string; // fallback/main image
  variants?: CatalogProductVariant[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type HomepageImage = {
  id: string;
  key: string; // e.g. eisBanner, caps, toteBags
  image_url: string;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type CategorySampleImage = {
  id: string;
  category_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type CatalogData = {
  categories: CatalogCategory[];
  products: CatalogProduct[];
  homepageImages?: HomepageImage[];
  categorySampleImages?: CategorySampleImage[];
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

    return items.map((item, itemIndex) => {
      const baseId = `${category.slug}-${itemIndex + 1}`;
      const legacyImage = String(item.image ?? '');

      // Migrate colorOptions from legacy data into variants when present
      const legacyColorOptions = Array.isArray(item.colorOptions) ? item.colorOptions : undefined;

      let variants: CatalogProductVariant[] | undefined = undefined;

      if (legacyColorOptions && legacyColorOptions.length > 0) {
        variants = legacyColorOptions.map((opt: any, vIndex: number) => ({
          id: `${baseId}-v-${vIndex + 1}`,
          name: String(opt.name ?? `Variant ${vIndex + 1}`),
          image_url: String(opt.image ?? legacyImage ?? ''),
          display_order: vIndex + 1,
          created_at: nowIso(),
          updated_at: nowIso(),
        }));
      }

      return {
        id: baseId,
        category_id: category.id,
        name: String(item.title ?? `Product ${itemIndex + 1}`),
        slug: slugify(String(item.title ?? `Product ${itemIndex + 1}`)),
        description: String(item.subtitle ?? 'Product description'),
        price: Number(String(item.price ?? '0').replace(/[^\d.]/g, '')) || 0,
        image_url: legacyImage || (variants && variants[0]?.image_url) || '',
        variants,
        is_active: true,
        created_at: nowIso(),
        updated_at: nowIso(),
      } as CatalogProduct;
    });
  });

  return {
    categories: categoryEntries,
    products: productEntries,
    homepageImages: [],
    categorySampleImages: [],
    updated_at: nowIso(),
  } satisfies CatalogData;
};

export const createBlankCatalog = () => ({
  categories: [],
  products: [],
  homepageImages: [],
  categorySampleImages: [],
  updated_at: nowIso(),
} satisfies CatalogData);

// Header nav (source of truth). Keep full nav and a canonical list of product categories (exclude Home/About from product category list)
export const HEADER_NAVIGATION = [
  { name: 'Home', slug: 'home' },
  { name: 'Drinkwares', slug: 'drinkware' },
  { name: 'Kitchenwares', slug: 'kitchenware' },
  { name: 'Umbrellas & Bags', slug: 'umbrellasAndBags' },
  { name: 'Caps & Apparel', slug: 'capsAndApparel' },
  { name: 'Notebooks & Pens', slug: 'notebooksAndPens' },
  { name: 'Accessories', slug: 'accessories' },
  { name: 'Digital & Large Format', slug: 'digital' },
  { name: 'Sets & Bundles', slug: 'setsAndBundles' },
  { name: 'About Us', slug: 'about' },
];

export const CANONICAL_CATEGORIES = HEADER_NAVIGATION.filter((c) => c.slug !== 'home' && c.slug !== 'about').map((c, i) => ({
  id: `canonical-${c.slug}`,
  name: c.name,
  slug: c.slug,
  display_order: i + 2, // keep Home as 1, About as last
  is_active: true,
} as CatalogCategory));

// Ensure catalog contains canonical categories and migrate products/categorySampleImages from legacy categories into canonical ones when possible.
export const ensureCanonicalCategories = (catalog: CatalogData): CatalogData => {
  const next = { ...catalog } as CatalogData;
  next.categories = [...(next.categories || [])];

  // Ensure canonical categories exist in catalog.categories
  for (const canonical of CANONICAL_CATEGORIES) {
    const existing = next.categories.find((c) => c.slug === canonical.slug);
    if (existing) {
      existing.name = canonical.name;
      existing.display_order = canonical.display_order;
      existing.is_active = true;
    } else {
      next.categories.push({
        id: canonical.id,
        name: canonical.name,
        slug: canonical.slug,
        display_order: canonical.display_order,
        is_active: true,
        created_at: nowIso(),
        updated_at: nowIso(),
      });
    }
  }

  // Build a map from legacy category id -> legacy category record
  const legacyById = new Map<string, CatalogCategory>();
  for (const c of next.categories) legacyById.set(c.id, c);

  // Map legacy category to best canonical id using token intersection
  const canonicalList = next.categories.filter((c) => CANONICAL_CATEGORIES.some((cc) => cc.slug === c.slug));
  const canonicalBySlug = new Map(canonicalList.map((c) => [c.slug, c]));

  const tokenize = (s: string) => (s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter(Boolean);

  const findBestCanonicalFor = (legacy: CatalogCategory) => {
    const legacyText = `${legacy.name} ${legacy.slug}`.toLowerCase();
    const legacyTokens = tokenize(legacyText);
    let best: { canonical?: CatalogCategory; score: number } = { score: 0 };
    for (const cand of canonicalList) {
      const candTokens = tokenize(`${cand.name} ${cand.slug}`);
      const score = candTokens.reduce((acc, t) => acc + (legacyTokens.includes(t) ? 1 : 0), 0);
      if (score > best.score) best = { canonical: cand, score };
    }
    return best.canonical;
  };

  // Reassign products whose category is non-canonical to canonical if a match exists
  next.products = (next.products || []).map((p) => {
    const cat = next.categories.find((c) => c.id === p.category_id);
    if (!cat) return p;
    // if cat is canonical already, keep
    if (canonicalList.some((cc) => cc.id === cat.id || cc.slug === cat.slug)) return p;

    const mapped = findBestCanonicalFor(cat);
    if (mapped) {
      return { ...p, category_id: mapped.id };
    }
    return p;
  });

  // Reassign categorySampleImages category_id similarly
  if (Array.isArray(next.categorySampleImages)) {
    next.categorySampleImages = next.categorySampleImages.map((ci) => {
      const cat = next.categories.find((c) => c.id === ci.category_id);
      if (!cat) return ci;
      if (canonicalList.some((cc) => cc.id === cat.id || cc.slug === cat.slug)) return ci;
      const mapped = findBestCanonicalFor(cat);
      if (mapped) return { ...ci, category_id: mapped.id };
      return ci;
    });
  }

  next.updated_at = nowIso();
  return next;
};

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
