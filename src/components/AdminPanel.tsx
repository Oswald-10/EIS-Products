import { useEffect, useMemo, useState } from 'react';
import {
  ADMIN_SESSION_KEY,
  buildPublicCategoryList,
  createBlankCatalog,
  ensureUniqueCategorySlug,
  ensureUniqueProductSlug,
  formatPrice,
  getProductsForCategory,
  readCatalogData,
  slugify,
  writeCatalogData,
  ensureCanonicalCategories,
  CANONICAL_CATEGORIES,
  type CatalogCategory,
  type CatalogData,
  type CatalogProduct,
} from '../lib/cms';
import { isSupabaseConfigured, supabase, supabaseSetupMessage } from '../lib/supabase';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const defaultAdminCredentials = {
  email: import.meta.env.VITE_DEMO_ADMIN_EMAIL ?? '',
  password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD ?? '',
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read the selected image.'));
    reader.readAsDataURL(file);
  });

const uploadFileToStorage = async (file: File, destPath: string) => {
  if (!isSupabaseConfigured || !supabase) {
    // fallback: data URL
    return await fileToDataUrl(file);
  }

  // allow overriding the primary bucket via env var (useful for Netlify config)
  const primaryBucket = (import.meta.env.VITE_SUPABASE_IMAGE_BUCKET as string) || 'product-images';

  const attemptUpload = async (bucketName: string) => {
    const { error } = await supabase.storage.from(bucketName).upload(destPath, file, { cacheControl: '3600', upsert: false });
    if (error) {
      const msg = error.message ?? String(error);
      const err: any = new Error(msg);
      err.code = (error as any).status ?? null;
      throw err;
    }
    const { data } = supabase.storage.from(bucketName).getPublicUrl(destPath);
    return data.publicUrl ?? '';
  };

  // Try primary bucket first
  try {
    return await attemptUpload(primaryBucket);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // If bucket not found, attempt to discover an existing bucket from current catalog image URLs or stored runtime override
    if (message.toLowerCase().includes('bucket not found') || message.toLowerCase().includes('not found')) {
      try {
        // 1) Check runtime override persisted in localStorage
        const runtimeOverride = typeof window !== 'undefined' ? window.localStorage.getItem('eis-supabase-image-bucket') : null;
        if (runtimeOverride && runtimeOverride !== primaryBucket) {
          try {
            return await attemptUpload(runtimeOverride);
          } catch (e) {
            // continue to discovery
          }
        }

        // 2) Try to infer bucket from existing product or variant image URLs in the current catalog
        const findBucketFromUrl = (url: string | undefined) => {
          if (!url) return null;
          const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\//i);
          if (m) return m[1];
          return null;
        };

        let inferredBucket: string | null = null;
        // look through products, variants, homepageImages, categorySampleImages if we have catalog access
        try {
          const raw = typeof window !== 'undefined' ? window.localStorage.getItem('eis-cms-catalog-v1') : null;
          if (raw) {
            const parsed = JSON.parse(raw);
            for (const p of parsed.products || []) {
              inferredBucket = findBucketFromUrl(p.image_url) || inferredBucket;
              if (p.variants) {
                for (const v of p.variants) {
                  inferredBucket = findBucketFromUrl(v.image_url) || inferredBucket;
                  if (inferredBucket) break;
                }
              }
              if (inferredBucket) break;
            }
            if (!inferredBucket && Array.isArray(parsed.homepageImages)) {
              for (const h of parsed.homepageImages) {
                inferredBucket = findBucketFromUrl(h.image_url) || inferredBucket;
                if (inferredBucket) break;
              }
            }
          }
        } catch (inner) {
          // ignore parsing errors
        }

        const triedBuckets: string[] = [];
        if (inferredBucket) {
          triedBuckets.push(inferredBucket);
          try {
            // store runtime override for future uploads
            if (typeof window !== 'undefined') window.localStorage.setItem('eis-supabase-image-bucket', inferredBucket);
            return await attemptUpload(inferredBucket);
          } catch (e) {
            // fall through to try other candidates
          }
        }

        // try some common bucket names as last resort (do not delete existing buckets)
        const candidates = [primaryBucket, 'product-images', 'images', 'website-images', 'public', 'public-images', 'eis-images'];
        for (const candidate of candidates) {
          if (triedBuckets.includes(candidate)) continue;
          try {
            const url = await attemptUpload(candidate);
            // persist discovered bucket override for admin convenience
            if (typeof window !== 'undefined') window.localStorage.setItem('eis-supabase-image-bucket', candidate);
            return url;
          } catch (e) {
            // continue trying
          }
        }
      } catch (inner) {
        // ignore and fall through to error below
      }
    }

    // if we reach here, all attempts failed — provide a helpful message
    const hint = `Upload failed. ${message}. Ensure the Supabase project contains a storage bucket named '${primaryBucket}' (or set VITE_SUPABASE_IMAGE_BUCKET to the correct bucket name or configure via the Admin 'Detect storage bucket' button) and that the anon key has upload permissions.`;
    throw new Error(hint);
  }
};

const getInitialSession = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function AdminPanel({
  catalogData,
  onCatalogChange,
  onBackToSite,
  cardImages,
}: {
  catalogData: CatalogData;
  onCatalogChange: (next: CatalogData) => void;
  onBackToSite: () => void;
  cardImages?: Record<string, string>;
}) {
  const [authenticated, setAuthenticated] = useState<boolean>(Boolean(getInitialSession()));
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'website'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentCatalog, setCurrentCatalog] = useState<CatalogData>(catalogData);
  const [productForm, setProductForm] = useState<{
    id?: string;
    name: string;
    description: string;
    price: string;
    category_id: string;
    image_url: string;
    variants: Array<{ id?: string; name: string; image_url: string; display_order: number }>;
    is_active: boolean;
  }>({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    variants: [],
    is_active: true,
  });
  const [categoryForm, setCategoryForm] = useState<{
    id?: string;
    name: string;
    is_active: boolean;
    display_order: number;
  }>({
    name: '',
    is_active: true,
    display_order: 1,
  });
  const [pendingImageFileName, setPendingImageFileName] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  useEffect(() => {
    // Ensure canonical categories exist and migrate legacy category assignments when admin opens the panel
    const migrated = ensureCanonicalCategories(catalogData);
    setCurrentCatalog(migrated);
    // Persist migration if it changed anything
    if (JSON.stringify(migrated) !== JSON.stringify(catalogData)) {
      writeCatalogData(migrated);
      onCatalogChange(migrated);
    }
  }, [catalogData]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedSession = getInitialSession();
    if (!storedSession) {
      return;
    }

    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data, error }) => {
        if (!error && data.session) {
          setAuthenticated(true);
          return;
        }

        setAuthenticated(false);
        window.localStorage.removeItem(ADMIN_SESSION_KEY);
      });
    }
  }, []);

  const categories = useMemo(
    () => [...currentCatalog.categories].sort((left, right) => left.display_order - right.display_order),
    [currentCatalog.categories],
  );

  const products = useMemo(
    () => [...currentCatalog.products].sort((left, right) => left.name.localeCompare(right.name)),
    [currentCatalog.products],
  );

  const filteredProducts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search);
      const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const persistCatalog = (nextCatalog: CatalogData) => {
    setCurrentCatalog(nextCatalog);
    writeCatalogData(nextCatalog);
    onCatalogChange(nextCatalog);
  };

  const saveSession = (email: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      ADMIN_SESSION_KEY,
      JSON.stringify({ email, authenticatedAt: new Date().toISOString() }),
    );
  };

  const clearSession = () => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut();
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginData.email,
          password: loginData.password,
        });

        if (error || !data.user) {
          throw new Error(error?.message ?? 'Invalid credentials.');
        }

        saveSession(data.user.email ?? loginData.email);
        setAuthenticated(true);
        return;
      }

      if (!defaultAdminCredentials.email || !defaultAdminCredentials.password) {
        throw new Error(
          'Admin credentials are not configured. Set VITE_DEMO_ADMIN_EMAIL and VITE_DEMO_ADMIN_PASSWORD in .env.local or configure Supabase auth.',
        );
      }

      if (
        loginData.email.trim().toLowerCase() !== defaultAdminCredentials.email.trim().toLowerCase() ||
        loginData.password !== defaultAdminCredentials.password
      ) {
        throw new Error('Invalid email or password.');
      }

      saveSession(loginData.email.trim());
      setAuthenticated(true);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Failed to sign in.');
      setAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setAuthenticated(false);
    setLoginData({ email: '', password: '' });
    setAuthError('');
  };

  const handleImageSelection = async (event: React.ChangeEvent<HTMLInputElement>, variantIndex?: number) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAuthError('Only image files are allowed.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setAuthError('Please upload an image smaller than 2MB.');
      return;
    }

    setPendingImageFileName(file.name);
    setIsUploadingImage(true);
    setAuthError('');

    try {
      const destPath = `products/${Date.now()}-${slugify(file.name)}`;
      const uploadedUrl = await uploadFileToStorage(file, destPath);

      if (typeof variantIndex === 'number') {
        setProductForm((previous) => {
          const nextVariants = [...previous.variants];
          nextVariants[variantIndex] = { ...nextVariants[variantIndex], image_url: uploadedUrl };
          return { ...previous, variants: nextVariants };
        });
      } else {
        setProductForm((previous) => ({ ...previous, image_url: uploadedUrl }));
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Image upload failed.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      category_id: categories[0]?.id ?? '',
      image_url: '',
      variants: [],
      is_active: true,
    });
    setPendingImageFileName('');
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      is_active: true,
      display_order: Math.max(1, categories.length + 1),
    });
  };

  const handleProductSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!productForm.name.trim()) {
      setAuthError('Product name is required.');
      return;
    }

    if (!productForm.category_id) {
      setAuthError('Please select a category.');
      return;
    }

    if (!productForm.price || Number(productForm.price) <= 0) {
      setAuthError('Price must be greater than zero.');
      return;
    }

    setIsSavingProduct(true);
    setAuthError('');

    try {
      const nextCatalog = { ...currentCatalog };
      const productId = productForm.id ?? makeId('product');

      const normalizedVariants = productForm.variants
        .map((v, idx) => ({
          id: v.id ?? `${productId}-v-${idx + 1}`,
          name: v.name.trim() || `Variant ${idx + 1}`,
          image_url: v.image_url || '',
          display_order: v.display_order || idx + 1,
          created_at: v.id ? nextCatalog.products.find((p) => p.id === productForm.id)?.variants?.find((vv) => vv.id === v.id)?.created_at ?? new Date().toISOString() : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

      const normalizedProduct = {
        id: productId,
        category_id: productForm.category_id,
        name: productForm.name.trim(),
        slug: ensureUniqueProductSlug(nextCatalog, productForm.name.trim(), productForm.id),
        description: productForm.description.trim() || 'No description provided.',
        price: Number(productForm.price),
        image_url: productForm.image_url || normalizedVariants[0]?.image_url || '',
        variants: normalizedVariants.length > 0 ? normalizedVariants : undefined,
        is_active: productForm.is_active,
        created_at: productForm.id ? nextCatalog.products.find((entry) => entry.id === productForm.id)?.created_at ?? new Date().toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as CatalogProduct;

      const existingIndex = nextCatalog.products.findIndex((entry) => entry.id === productForm.id);
      if (existingIndex >= 0) {
        nextCatalog.products.splice(existingIndex, 1, normalizedProduct);
      } else {
        nextCatalog.products.push(normalizedProduct);
      }

      nextCatalog.updated_at = new Date().toISOString();
      persistCatalog(nextCatalog);
      resetProductForm();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Failed to save the product.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleEditProduct = (product: CatalogProduct) => {
    setProductForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: String(product.price),
      category_id: product.category_id,
      image_url: product.image_url,
      variants: (product.variants ?? []).map((v) => ({ id: v.id, name: v.name, image_url: v.image_url, display_order: v.display_order })),
      is_active: product.is_active,
    });
    setActiveTab('products');
  };

  const handleDeleteProduct = (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    const nextCatalog = { ...currentCatalog, products: currentCatalog.products.filter((product) => product.id !== productId) };
    persistCatalog(nextCatalog);
  };

  const handleCategorySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!categoryForm.name.trim()) {
      setAuthError('Category name is required.');
      return;
    }

    setIsSavingCategory(true);
    setAuthError('');

    try {
      const nextCatalog = { ...currentCatalog };
      const slug = ensureUniqueCategorySlug(nextCatalog, categoryForm.name.trim(), categoryForm.id);
      const categoryId = categoryForm.id ?? makeId('category');
      const existing = nextCatalog.categories.find((category) => category.id === categoryId);

      if (existing) {
        existing.name = categoryForm.name.trim();
        existing.slug = slug;
        existing.is_active = categoryForm.is_active;
        existing.display_order = Math.max(1, categoryForm.display_order || existing.display_order);
        existing.updated_at = new Date().toISOString();
      } else {
        nextCatalog.categories.push({
          id: categoryId,
          name: categoryForm.name.trim(),
          slug,
          is_active: categoryForm.is_active,
          display_order: Math.max(1, categoryForm.display_order || nextCatalog.categories.length + 1),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      nextCatalog.updated_at = new Date().toISOString();
      persistCatalog(nextCatalog);
      resetCategoryForm();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Failed to save the category.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleEditCategory = (category: CatalogCategory) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      is_active: category.is_active,
      display_order: category.display_order,
    });
    setActiveTab('categories');
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category? This will also remove products assigned to it.')) {
      return;
    }

    const nextCatalog = {
      ...currentCatalog,
      categories: currentCatalog.categories.filter((category) => category.id !== categoryId),
      products: currentCatalog.products.filter((product) => product.category_id !== categoryId),
    };
    persistCatalog(nextCatalog);
  };

  const canRenderLogin = !authenticated;

  if (canRenderLogin) {
    return (
      <main className="d-flex min-vh-100 align-items-center justify-content-center bg-light">
        <div className="card shadow-lg border-0" style={{ maxWidth: '480px', width: '100%' }}>
          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-4">
              <h1 className="h3 fw-bold mb-1">EIS Admin</h1>
              <p className="text-muted mb-0">Secure content management</p>
            </div>

            {supabaseSetupMessage ? (
              <div className="alert alert-warning small mb-3">{supabaseSetupMessage}</div>
            ) : null}

            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label">Email or username</label>
                <input
                  type="email"
                  className="form-control"
                  value={loginData.email}
                  onChange={(event) => setLoginData((previous) => ({ ...previous, email: event.target.value }))}
                  placeholder="admin@eisprintingservices.com"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={loginData.password}
                  onChange={(event) => setLoginData((previous) => ({ ...previous, password: event.target.value }))}
                  placeholder="Password"
                  required
                />
              </div>

              {authError ? <div className="alert alert-danger small">{authError}</div> : null}

              <button type="submit" className="btn btn-dark w-100" disabled={authLoading}>
                {authLoading ? 'Signing in…' : 'Login'}
              </button>
            </form>

            <div className="d-flex justify-content-between mt-4 pt-3 border-top small text-muted">
              <button type="button" className="btn btn-link p-0" onClick={onBackToSite}>
                Back to website
              </button>
              <span>Protected admin route</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-vh-100 bg-light">
      <div className="container-fluid py-4">
        <div className="row g-4">
          <aside className="col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4">
                <h2 className="h4 fw-bold mb-4">Admin Dashboard</h2>
                <div className="d-grid gap-2">
                  <button
                    type="button"
                    className={`btn text-start ${activeTab === 'products' ? 'btn-dark' : 'btn-outline-secondary'}`}
                    onClick={() => setActiveTab('products')}
                  >
                    Products
                  </button>
                  <button
                    type="button"
                    className={`btn text-start ${activeTab === 'categories' ? 'btn-dark' : 'btn-outline-secondary'}`}
                    onClick={() => setActiveTab('categories')}
                  >
                    Categories
                  </button>
                  <button
                    type="button"
                    className={`btn text-start ${activeTab === 'website' ? 'btn-dark' : 'btn-outline-secondary'}`}
                    onClick={() => setActiveTab('website')}
                  >
                    Website Images
                  </button>
                  <button type="button" className="btn btn-outline-dark" onClick={onBackToSite}>
                    View website
                  </button>
                  <button type="button" className="btn btn-outline-danger" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <section className="col-lg-9">
            {authError ? <div className="alert alert-danger">{authError}</div> : null}

            {activeTab === 'products' ? (
              <div className="row g-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body p-4">
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                        <div>
                          <h3 className="h4 mb-1">Products</h3>
                          <p className="text-muted mb-0">Search, edit, or create products.</p>
                        </div>
                        <button type="button" className="btn btn-dark" onClick={resetProductForm}>
                          Add Product
                        </button>
                      </div>

                      <div className="row g-3 mb-4">
                        <div className="col-md-6">
                          <input
                            type="search"
                            className="form-control"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search products"
                          />
                        </div>
                        <div className="col-md-6">
                          <select
                            className="form-select"
                            value={categoryFilter}
                            onChange={(event) => setCategoryFilter(event.target.value)}
                          >
                            <option value="all">All categories</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <form onSubmit={handleProductSubmit} className="row g-3 mb-4">
                        <div className="col-12">
                          <h5 className="mb-2">Variants (optional)</h5>
                          <div className="mb-3">
                            {(productForm.variants || []).map((variant, idx) => (
                              <div key={variant.id ?? idx} className="d-flex gap-2 align-items-start mb-2">
                                <input
                                  className="form-control"
                                  style={{ maxWidth: 240 }}
                                  value={variant.name}
                                  placeholder={`Variant name`}
                                  onChange={(e) => setProductForm((prev) => {
                                    const next = { ...prev };
                                    next.variants = [...next.variants];
                                    next.variants[idx] = { ...next.variants[idx], name: e.target.value };
                                    return next;
                                  })}
                                />
                                <input type="file" className="form-control" accept="image/png,image/jpeg,image/webp" onChange={(e) => handleImageSelection(e, idx)} />
                                <button type="button" className="btn btn-outline-danger" onClick={() => setProductForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }))}>
                                  Remove
                                </button>
                              </div>
                            ))}

                            <div>
                              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setProductForm((prev) => ({ ...prev, variants: [...prev.variants, { name: '', image_url: '', display_order: prev.variants.length + 1 }] }))}>
                                Add Variant
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Product name</label>
                          <input
                            className="form-control"
                            value={productForm.name}
                            onChange={(event) => setProductForm((previous) => ({ ...previous, name: event.target.value }))}
                            required
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Price</label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="form-control"
                            value={productForm.price}
                            onChange={(event) => setProductForm((previous) => ({ ...previous, price: event.target.value }))}
                            required
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Category</label>
                          <select
                            className="form-select"
                            value={productForm.category_id}
                            onChange={(event) => setProductForm((previous) => ({ ...previous, category_id: event.target.value }))}
                          >
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-12">
                          <label className="form-label">Description</label>
                          <textarea
                            className="form-control"
                            rows={4}
                            value={productForm.description}
                            onChange={(event) => setProductForm((previous) => ({ ...previous, description: event.target.value }))}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Product image</label>
                          <input type="file" className="form-control" accept="image/png,image/jpeg,image/webp" onChange={handleImageSelection} />
                          {pendingImageFileName ? <small className="text-muted d-block mt-2">Selected: {pendingImageFileName}</small> : null}
                          {isUploadingImage ? <div className="small text-primary mt-2">Uploading image…</div> : null}
                        </div>
                        <div className="col-md-3 d-flex align-items-end">
                          <label className="form-check-label w-100 border rounded p-2 bg-light">
                            <input
                              type="checkbox"
                              className="form-check-input me-2"
                              checked={productForm.is_active}
                              onChange={(event) => setProductForm((previous) => ({ ...previous, is_active: event.target.checked }))}
                            />
                            Active / visible
                          </label>
                        </div>
                        <div className="col-md-3 d-flex align-items-end justify-content-end">
                          <button type="submit" className="btn btn-dark" disabled={isSavingProduct}>
                            {isSavingProduct ? 'Saving…' : productForm.id ? 'Update Product' : 'Create Product'}
                          </button>
                        </div>
                      </form>

                      {productForm.image_url ? (
                        <div className="mb-4">
                          <img src={productForm.image_url} alt="Preview" className="img-fluid rounded border" style={{ maxHeight: '220px', objectFit: 'cover' }} />
                        </div>
                      ) : null}

                      {productForm.variants && productForm.variants.length > 0 ? (
                        <div className="mb-4">
                          <h6 className="mb-2">Variant previews</h6>
                          <div className="d-flex flex-wrap gap-2">
                            {productForm.variants.map((v, i) => (
                              <div key={v.id ?? i} className="text-center" style={{ width: 100 }}>
                                {v.image_url ? <img src={v.image_url} alt={v.name} style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 6 }} /> : <div className="bg-light border" style={{ width: 100, height: 80 }} />}
                                <div className="small text-muted mt-1">{v.name || 'Unnamed'}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="table-responsive">
                        <table className="table align-middle">
                          <thead>
                            <tr>
                              <th>Thumbnail</th>
                              <th>Product</th>
                              <th>Category</th>
                              <th>Price</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredProducts.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="text-center text-muted py-4">
                                  No products match your search.
                                </td>
                              </tr>
                            ) : (
                              filteredProducts.map((product) => {
                                const categoryName = categories.find((category) => category.id === product.category_id)?.name ?? 'Unassigned';
                                return (
                                  <tr key={product.id}>
                                    <td>
                                          {product.variants && product.variants.length > 0 ? (
                                            <img src={product.variants[0].image_url} alt={product.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                                          ) : product.image_url ? (
                                            <img src={product.image_url} alt={product.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                                          ) : (
                                            <div className="bg-light border rounded" style={{ width: '60px', height: '60px' }} />
                                          )}
                                        </td>
                                    <td>
                                      <div className="fw-semibold">{product.name}</div>
                                      <small className="text-muted">{product.slug}</small>
                                    </td>
                                    <td>{categoryName}</td>
                                    <td>{formatPrice(product.price)}</td>
                                    <td>
                                      <span className={`badge ${product.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                        {product.is_active ? 'Active' : 'Hidden'}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="d-flex gap-2">
                                        <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => handleEditProduct(product)}>
                                          Edit
                                        </button>
                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteProduct(product.id)}>
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'categories' ? (
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                    <div>
                      <h3 className="h4 mb-1">Categories</h3>
                      <p className="text-muted mb-0">Manage category visibility, order, and display.</p>
                    </div>
                    <button type="button" className="btn btn-dark" onClick={resetCategoryForm}>
                      Add Category
                    </button>
                  </div>

                  <form onSubmit={handleCategorySubmit} className="row g-3 mb-4">
                    <div className="col-md-5">
                      <label className="form-label">Category name</label>
                      <input
                        className="form-control"
                        value={categoryForm.name}
                        onChange={(event) => setCategoryForm((previous) => ({ ...previous, name: event.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Display order</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={categoryForm.display_order}
                        onChange={(event) => setCategoryForm((previous) => ({ ...previous, display_order: Number(event.target.value) || 1 }))}
                      />
                    </div>
                    <div className="col-md-2 d-flex align-items-end">
                      <label className="form-check-label w-100 border rounded p-2 bg-light">
                        <input
                          type="checkbox"
                          className="form-check-input me-2"
                          checked={categoryForm.is_active}
                          onChange={(event) => setCategoryForm((previous) => ({ ...previous, is_active: event.target.checked }))}
                        />
                        Active
                      </label>
                    </div>
                    <div className="col-md-2 d-flex align-items-end justify-content-end">
                      <button type="submit" className="btn btn-dark" disabled={isSavingCategory}>
                        {isSavingCategory ? 'Saving…' : categoryForm.id ? 'Update Category' : 'Create Category'}
                      </button>
                    </div>
                  </form>

                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Slug</th>
                          <th>Order</th>
                          <th>Status</th>
                          <th>Products</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center text-muted py-4">No categories available.</td>
                          </tr>
                        ) : (
                          categories.map((category) => (
                            <tr key={category.id}>
                              <td>{category.name}</td>
                              <td>{category.slug}</td>
                              <td>{category.display_order}</td>
                              <td>
                                <span className={`badge ${category.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                  {category.is_active ? 'Visible' : 'Hidden'}
                                </span>
                              </td>
                              <td>{getProductsForCategory(currentCatalog, category.id).length}</td>
                              <td>
                                <div className="d-flex gap-2">
                                  <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => handleEditCategory(category)}>
                                    Edit
                                  </button>
                                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCategory(category.id)}>
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <h3 className="h4 mb-1">Website Images</h3>
                  <p className="text-muted">Manage homepage and category sample images. Changes persist to the local CMS (and to Supabase when configured).</p>
                  <hr />
                  <h5>Homepage Images</h5>
                  <div className="mb-2 small text-muted">Current storage bucket: <strong>{(currentCatalog && currentCatalog['imageBucket']) || (typeof window !== 'undefined' && window.localStorage.getItem('eis-supabase-image-bucket')) || import.meta.env.VITE_SUPABASE_IMAGE_BUCKET || 'product-images'}</strong></div>
                  <div className="mb-2">
                    <button type="button" className="btn btn-sm btn-outline-secondary me-2" onClick={async () => {
                      if (!isSupabaseConfigured || !supabase) {
                        setAuthError('Supabase is not configured; cannot detect buckets.');
                        return;
                      }

                      setIsUploadingImage(true);
                      setAuthError('');
                      const candidates = [import.meta.env.VITE_SUPABASE_IMAGE_BUCKET, 'product-images', 'images', 'website-images', 'public', 'public-images', 'eis-images'].filter(Boolean) as string[];
                      let found: string | null = null;
                      for (const candidate of candidates) {
                        try {
                          // try listing the root; if bucket doesn't exist this returns an error
                          const { data, error } = await supabase.storage.from(candidate).list('', { limit: 1 });
                          if (!error) { found = candidate; break; }
                        } catch (e) {
                          // continue
                        }
                      }

                      if (found) {
                        // persist runtime override and in catalog
                        if (typeof window !== 'undefined') window.localStorage.setItem('eis-supabase-image-bucket', found);
                        const next = { ...currentCatalog } as CatalogData;
                        (next as any).imageBucket = found;
                        persistCatalog(next);
                        setAuthError(`Detected and set storage bucket to '${found}'. Please retry the upload.`);
                      } else {
                        setAuthError('Could not detect a usable bucket. Please confirm the Supabase project has a public storage bucket (e.g., product-images) and that environment variables are configured.');
                      }

                      setIsUploadingImage(false);
                    }}>
                      Detect storage bucket
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-info" onClick={() => {
                      // clear runtime override
                      if (typeof window !== 'undefined') window.localStorage.removeItem('eis-supabase-image-bucket');
                      const next = { ...currentCatalog } as CatalogData; (next as any).imageBucket = undefined; persistCatalog(next); setAuthError('Cleared runtime storage bucket override.');
                    }}>
                      Clear override
                    </button>
                  </div>
                  <div className="mb-3">
                    {['eisBanner','caps','toteBags','businessCards','plannersNotebooks','tShirts','jackets','aprons','tumblers','pens','kitchenware','accessories'].map((key) => {
                      const existing = (currentCatalog.homepageImages || []).find((h) => h.key === key);
                      const preview = existing?.image_url ?? (cardImages && (cardImages as any)[key]) ?? '';
                      return (
                        <div key={key} className="d-flex align-items-center gap-3 mb-2">
                          <div style={{ width: 120, height: 70, overflow: 'hidden', borderRadius: 6, border: '1px solid #e9ecef' }}>
                            {preview ? <img src={preview} alt={key} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#f8f9fa' }} />}
                          </div>
                          <div className="flex-grow-1">
                            <div className="small text-muted">{key}</div>
                            <div className="mt-1">
                              <input type="file" accept="image/*" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setIsUploadingImage(true);
                                try {
                                  const dest = `homepage/${Date.now()}-${slugify(file.name)}`;
                                  const url = await uploadFileToStorage(file, dest);
                                  const next = { ...currentCatalog } as CatalogData;
                                  next.homepageImages = next.homepageImages || [];
                                  const found = next.homepageImages.find((h) => h.key === key);
                                  if (found) { found.image_url = url; found.updated_at = new Date().toISOString(); }
                                  else { next.homepageImages.push({ id: makeId('hp'), key, image_url: url, display_order: (next.homepageImages.length||0)+1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }); }
                                  persistCatalog(next);
                                } catch (err) {
                                  setAuthError(err instanceof Error ? err.message : 'Upload failed');
                                } finally { setIsUploadingImage(false); }
                              }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <hr />
                  <h5>Category Sample Images</h5>
                  <div className="mb-3">
                    <select className="form-select mb-2" onChange={(e) => setCategoryFilter(e.target.value)} value={categoryFilter}>
                      <option value="all">Select a category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {categoryFilter !== 'all' ? (
                      <div>
                        {(currentCatalog.categorySampleImages || []).filter((ci) => ci.category_id === categoryFilter).sort((a,b)=> (a.display_order||0)-(b.display_order||0)).map(ci => (
                          <div key={ci.id} className="d-flex gap-3 align-items-center mb-2">
                            <div style={{ width: 120, height: 70, overflow: 'hidden', borderRadius: 6, border: '1px solid #e9ecef' }}>
                              <img src={ci.image_url} alt="sample" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div className="flex-grow-1">
                              <button className="btn btn-sm btn-outline-danger" onClick={() => { if (!confirm('Remove image?')) return; const next = { ...currentCatalog }; next.categorySampleImages = (next.categorySampleImages||[]).filter(x => x.id !== ci.id); persistCatalog(next); }}>Remove</button>
                            </div>
                          </div>
                        ))}
                        <div className="mt-2">
                          <input type="file" accept="image/*" onChange={async (e) => {
                            const file = e.target.files?.[0]; if (!file) return; setIsUploadingImage(true);
                            try { const dest = `category-sample/${Date.now()}-${slugify(file.name)}`; const url = await uploadFileToStorage(file, dest); const next = { ...currentCatalog }; next.categorySampleImages = next.categorySampleImages || []; next.categorySampleImages.push({ id: makeId('csi'), category_id: categoryFilter, image_url: url, display_order: (next.categorySampleImages.filter(x=>x.category_id===categoryFilter).length||0)+1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }); persistCatalog(next); } catch (err) { setAuthError(err instanceof Error ? err.message : 'Upload failed'); } finally { setIsUploadingImage(false); } }} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
