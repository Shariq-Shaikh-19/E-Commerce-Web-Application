// Thin wrapper around fetch that attaches JWT and normalizes error handling
const api = {
  async request(path, { method = 'GET', body, auth = false } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = { success: false, message: 'Invalid server response' };
    }

    if (!res.ok || data.success === false) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  },

  // Auth
  register: (payload) => api.request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => api.request('/auth/login', { method: 'POST', body: payload }),
  getMe: () => api.request('/auth/me', { auth: true }),

  // Products
  getProducts: (query = '') => api.request(`/products${query}`),
  getProduct: (id) => api.request(`/products/${id}`),
  createProduct: (payload) => api.request('/products', { method: 'POST', body: payload, auth: true }),
  updateProduct: (id, payload) => api.request(`/products/${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteProduct: (id) => api.request(`/products/${id}`, { method: 'DELETE', auth: true }),

  // Orders
  createOrder: (payload) => api.request('/orders', { method: 'POST', body: payload, auth: true }),
  getMyOrders: () => api.request('/orders/my', { auth: true }),
  getAllOrders: () => api.request('/orders', { auth: true }),
  updateOrderStatus: (id, status) =>
    api.request(`/orders/${id}/status`, { method: 'PUT', body: { status }, auth: true }),
};
