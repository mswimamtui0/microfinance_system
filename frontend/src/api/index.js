import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        localStorage.setItem('access_token', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  login: (credentials) => {
    console.log('Login API called with:', credentials.username);
    return api.post('/auth/login/', credentials);
  },
  logout: () => api.post('/auth/logout/'),
  refresh: (refresh) => api.post('/auth/refresh/', { refresh }),
  profile: () => api.get('/auth/profile/'),
  register: (data) => {
    console.log('Register API called with:', data);
    return api.post('/auth/register/', data);
  },
  branches: () => {
    console.log('Fetching branches...');
    return api.get('/auth/branches/');
  },
  updateProfile: (data) => api.put('/auth/update_profile/', data),
  changePassword: (data) => api.post('/auth/change_password/', data),
};

// ============================================
// LOAN API
// ============================================
// LOAN API - Make sure this is correct
export const loanAPI = {
  getAll: (params) => api.get('/loans/', { params }),
  getById: (id) => api.get(`/loans/${id}/`),
  create: (data) => {
    console.log('📤 API - Creating loan with data:', data);
    return api.post('/loans/', data);
  },
  approve: (id) => api.post(`/loans/${id}/approve/`),
  disburse: (id) => api.post(`/loans/${id}/disburse/`),
  getSchedule: (id) => api.get(`/loans/${id}/schedule/`),
  calculatePenalty: (id, data) => api.post(`/loans/${id}/calculate_penalty/`, data),
  update: (id, data) => api.put(`/loans/${id}/`, data),
  delete: (id) => api.delete(`/loans/${id}/`),
};
// ============================================
// CUSTOMER API
// ============================================
export const customerAPI = {
  getAll: (params) => api.get('/customers/', { params }),
  getById: (id) => api.get(`/customers/${id}/`),
  create: (data) => api.post('/customers/', data),
  update: (id, data) => api.put(`/customers/${id}/`, data),
  delete: (id) => api.delete(`/customers/${id}/`),
  getGuarantors: (id) => api.get(`/customers/${id}/guarantors/`),
  addGuarantor: (id, data) => api.post(`/customers/${id}/add_guarantor/`, data),
};

// ============================================
// PAYMENT API
// ============================================
export const paymentAPI = {
  getAll: (params) => api.get('/payments/', { params }),
  getById: (id) => api.get(`/payments/${id}/`),
  create: (data) => api.post('/payments/', data),
  update: (id, data) => api.put(`/payments/${id}/`, data),
  delete: (id) => api.delete(`/payments/${id}/`),
  getByLoan: (loanId) => api.get(`/payments/?loan=${loanId}`),
  getSummary: () => api.get('/payments/summary/'),
};

// ============================================
// PRODUCT API
// ============================================
export const productAPI = {
  getAll: (params) => api.get('/loan-products/', { params }),
  getById: (id) => api.get(`/loan-products/${id}/`),
  create: (data) => api.post('/loan-products/', data),
  update: (id, data) => api.put(`/loan-products/${id}/`, data),
  delete: (id) => api.delete(`/loan-products/${id}/`),
};

// ============================================
// REPORT API
// ============================================
export const reportAPI = {
  getPortfolio: (params) => api.get('/reports/portfolio/', { params }),
  getCollections: (params) => api.get('/reports/collections/', { params }),
};

// ============================================
// BRANCH API
// ============================================
export const branchAPI = {
  getAll: (params) => api.get('/branches/', { params }),
  getById: (id) => api.get(`/branches/${id}/`),
  create: (data) => api.post('/branches/', data),
  update: (id, data) => api.put(`/branches/${id}/`, data),
  delete: (id) => api.delete(`/branches/${id}/`),
};

// ============================================
// DEFAULT EXPORT
// ============================================
export default api;