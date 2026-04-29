import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from zustand-persisted store
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const auth = JSON.parse(localStorage.getItem('saq-auth') || '{}');
      const token = auth?.state?.accessToken;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const auth = JSON.parse(localStorage.getItem('saq-auth') || '{}');
        const refresh = auth?.state?.refreshToken;
        if (!refresh) throw new Error('no refresh');
        const { data } = await axios.post(`${BASE}/auth/token/refresh/`, { refresh });
        // Update store
        const updated = { ...auth, state: { ...auth.state, accessToken: data.access } };
        localStorage.setItem('saq-auth', JSON.stringify(updated));
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.removeItem('saq-auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Users (Admin) ───────────────────────────────────
export const usersApi = {
  adminCustomers:  (params?: Record<string, unknown>) => api.get('/auth/admin/customers/', { params }),
  verifyUser:      (id: number) => api.patch(`/auth/admin/users/${id}/verify/`),
};

// ─── Auth ────────────────────────────────────────────
export const authApi = {
  register: (data: Record<string, unknown>) => api.post('/auth/register/', data),
  login:    (email: string, password: string) => api.post('/auth/login/', { email, password }),
  me:       () => api.get('/auth/me/'),
  updateMe: (data: Record<string, unknown>) => api.patch('/auth/me/', data),
  changePassword: (data: Record<string, unknown>) => api.post('/auth/change-password/', data),
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return api.patch('/auth/me/avatar/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// ─── Addresses ───────────────────────────────────────
export const addressesApi = {
  list:       () => api.get('/auth/addresses/'),
  create:     (data: Record<string, unknown>) => api.post('/auth/addresses/', data),
  update:     (id: number, data: Record<string, unknown>) => api.patch(`/auth/addresses/${id}/`, data),
  delete:     (id: number) => api.delete(`/auth/addresses/${id}/`),
  setDefault: (id: number) => api.post(`/auth/addresses/${id}/default/`),
};

// ─── Products ────────────────────────────────────────
export const productsApi = {
  list:       (params?: Record<string, unknown>) => api.get('/products/', { params }),
  detail:     (slug: string)  => api.get(`/products/${slug}/`),
  categories: ()              => api.get('/products/categories/'),
  // Vendor/admin
  manage:       (params?: Record<string, unknown>) => api.get('/products/manage/', { params }),
  manageDetail: (id: number)  => api.get(`/products/manage/${id}/`),
  create:       (data: Record<string, unknown>) => api.post('/products/manage/', data),
  update:       (id: number, data: Record<string, unknown>) => api.patch(`/products/manage/${id}/`, data),
  delete:       (id: number)  => api.delete(`/products/manage/${id}/`),
  uploadImage:  (productId: number, formData: FormData) =>
    api.post(`/products/manage/${productId}/images/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteImage:  (productId: number, imageId: number) =>
    api.delete(`/products/manage/${productId}/images/${imageId}/`),
  addVariant: (productId: number, data: Record<string, unknown>) =>
    api.post(`/products/manage/${productId}/variants/`, data),
  deleteVariant: (productId: number, variantId: number) =>
    api.delete(`/products/manage/${productId}/variants/${variantId}/`),
  updateVariant: (productId: number, variantId: number, data: Record<string, unknown>) =>
    api.patch(`/products/manage/${productId}/variants/${variantId}/`, data),
  bulkUpload: (formData: FormData, onProgress?: (pct: number) => void) =>
    api.post('/products/manage/bulk-upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => { if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100)); },
    }),
  csvTemplate: () => api.get('/products/manage/bulk-upload/', { responseType: 'blob' }),
  // Admin category management
  storeStats:      () => api.get('/products/stats/'),
  adminCategories: (params?: Record<string, unknown>) => api.get('/products/admin/categories/', { params }),
  createCategory:  (data: Record<string, unknown>) => api.post('/products/admin/categories/', data),
  updateCategory:  (id: number, data: Record<string, unknown>) => api.patch(`/products/admin/categories/${id}/`, data),
  deleteCategory:  (id: number) => api.delete(`/products/admin/categories/${id}/`),
};

// ─── Orders ──────────────────────────────────────────
export const ordersApi = {
  list:         () => api.get('/orders/'),
  detail:       (orderNumber: string) => api.get(`/orders/${orderNumber}/`),
  create:       (data: Record<string, unknown>) => api.post('/orders/create/', data),
  vendorOrders:    () => api.get('/orders/vendor/orders/'),
  vendorAnalytics: () => api.get('/orders/vendor/analytics/'),
  updateStatus: (orderNumber: string, status: string) =>
    api.patch(`/orders/vendor/orders/${orderNumber}/status/`, { status }),
  adminOrders:    (params?: Record<string, unknown>) => api.get('/orders/admin/orders/', { params }),
  adminAnalytics: () => api.get('/orders/admin/analytics/'),
};

// ─── Cart ────────────────────────────────────────────
export const cartApi = {
  get:    () => api.get('/cart/'),
  add:    (data: Record<string, unknown>) => api.post('/cart/add/', data),
  update: (itemId: number, quantity: number) => api.patch(`/cart/items/${itemId}/`, { quantity }),
  remove: (itemId: number) => api.delete(`/cart/items/${itemId}/`),
  clear:  () => api.delete('/cart/'),
};

// ─── Vendors ─────────────────────────────────────────
export const vendorsApi = {
  list:                (params?: Record<string, unknown>) => api.get('/vendors/', { params }),
  detail:              (slug: string) => api.get(`/vendors/${slug}/`),
  me:                  () => api.get('/vendors/me/'),
  updateMe:            (data: Record<string, unknown>) => api.patch('/vendors/me/', data),
  register:            (data: Record<string, unknown>) => api.post('/vendors/register/', data),
  adminList:           (params?: Record<string, unknown>) => api.get('/vendors/admin/list/', { params }),
  updateStatus:        (id: number, status: string) => api.patch(`/vendors/admin/${id}/status/`, { status }),
  // Commissions
  myCommissions:       () => api.get('/vendors/my-commissions/'),
  adminCommissions:    () => api.get('/vendors/admin/commissions/'),
  updateCommissionRate:(id: number, rate: number) => api.patch(`/vendors/admin/${id}/commission-rate/`, { commission_rate: rate }),
  settleCommissions:   (vendorId: number) => api.post(`/vendors/admin/${vendorId}/settle/`),
  togglePremium:       (id: number) => api.post(`/vendors/admin/${id}/toggle-premium/`),
  // Site-wide settings
  getSiteSettings:     () => api.get('/vendors/admin/site-settings/'),
  updateSiteSettings:  (data: Record<string, unknown>) => api.patch('/vendors/admin/site-settings/', data),
};

// ─── Reviews ─────────────────────────────────────────
export const reviewsApi = {
  list:   (slug: string) => api.get(`/reviews/products/${slug}/reviews/`),
  create: (slug: string, data: Record<string, unknown>) =>
    api.post(`/reviews/products/${slug}/reviews/`, data),
  update: (id: number, data: Record<string, unknown>) => api.patch(`/reviews/${id}/`, data),
  delete: (id: number) => api.delete(`/reviews/${id}/`),
};

// ─── Payments ────────────────────────────────────────
export const paymentsApi = {
  initiate:         (data: Record<string, unknown>) => api.post('/payments/initiate/', data),
  bangoPayInitiate: (order_number: string) => api.post('/payments/bangopay/initiate/', { order_number }),
  bangoPayVerify:   (transaction_id: string, order_number: string) =>
    api.post('/payments/bangopay/verify/', { transaction_id, order_number }),
  invoice:          (order_number: string) => api.get(`/payments/invoice/${order_number}/`),
};

// ─── Super Admin ─────────────────────────────────────
export const superAdminApi = {
  stats:         () => api.get('/auth/superadmin/stats/'),
  users:         (params?: Record<string, unknown>) => api.get('/auth/superadmin/users/', { params }),
  userDetail:    (id: number) => api.get(`/auth/superadmin/users/${id}/`),
  updateUser:    (id: number, data: Record<string, unknown>) => api.patch(`/auth/superadmin/users/${id}/`, data),
  deleteUser:    (id: number) => api.delete(`/auth/superadmin/users/${id}/`),
  createAdmin:   (data: Record<string, unknown>) => api.post('/auth/superadmin/create-admin/', data),
};
