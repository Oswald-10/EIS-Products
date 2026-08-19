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
}: {
  catalogData: CatalogData;
  onCatalogChange: (next: CatalogData) => void;
  onBackToSite: () => void;
}) {
  const [authenticated, setAuthenticated] = useState<boolean>(Boolean(getInitialSession()));
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
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
    is_active: boolean;
  }>({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
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
    setCurrentCatalog(catalogData);
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

  const handleImageSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      if (isSupabaseConfigured && supabase) {
        const bucketName = 'product-images';
        const path = `products/${Date.now()}-${slugify(file.name)}`;
        const { error } = await supabase.storage.from(bucketName).upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

        if (error) {
          throw new Error(error.message);
        }

        const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
        setProductForm((previous) => ({ ...previous, image_url: data.publicUrl ?? '' }));
      } else {
        const dataUrl = await fileToDataUrl(file);
        setProductForm((previous) => ({ ...previous, image_url: dataUrl }));
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
      const normalizedProduct = {
        id: productForm.id ?? makeId('product'),
        category_id: productForm.category_id,
        name: productForm.name.trim(),
        slug: ensureUniqueProductSlug(
          nextCatalog,
          productForm.name.trim(),
          productForm.id,
        ),
        description: productForm.description.trim() || 'No description provided.',
        price: Number(productForm.price),
        image_url: productForm.image_url || categories.find((category) => category.id === productForm.category_id)?.name ? 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80' : '',
        is_active: productForm.is_active,
        created_at: productForm.id ? nextCatalog.products.find((entry) => entry.id === productForm.id)?.created_at ?? new Date().toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } satisfies CatalogProduct;

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
                                      {product.image_url ? (
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
            ) : (
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
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
