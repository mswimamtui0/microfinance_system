import axios from 'axios';

// Use Render backend URL
const API_URL = 'https://microfinance-system-df49.onrender.com/api';

console.log('API URL:', API_URL);

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
    console.log('API Request:', config.method.toUpperCase(), config.url);
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
    console.log('Login API called for:', credentials.username);
    return api.post('/auth/login/', credentials);
  },
  logout: () => {
    console.log('Logout API called');
    return api.post('/auth/logout/');
  },
  refresh: (refresh) => {
    console.log('Refresh token API called');
    return api.post('/auth/refresh/', { refresh });
  },
  profile: () => {
    console.log('Profile API called');
    return api.get('/auth/profile/');
  },
  register: (data) => {
    console.log('Register API called with:', data);
    return api.post('/auth/register/', data);
  },
  branches: () => {
    console.log('Branches API called');
    return api.get('/auth/branches/');
  },
  updateProfile: (data) => {
    console.log('Update profile API called');
    return api.put('/auth/update_profile/', data);
  },
  changePassword: (data) => {
    console.log('Change password API called');
    return api.post('/auth/change_password/', data);
  },
};

// ============================================
// LOAN API
// ============================================
export const loanAPI = {
  getAll: (params) => {
    console.log('Get loans API called');
    return api.get('/loans/', { params });
  },
  getById: (id) => {
    console.log('Get loan by ID:', id);
    return api.get(`/loans/${id}/`);
  },
  create: (data) => {
    console.log('Create loan API called');
    return api.post('/loans/', data);
  },
  approve: (id) => {
    console.log('Approve loan API called:', id);
    return api.post(`/loans/${id}/approve/`);
  },
  disburse: (id) => {
    console.log('Disburse loan API called:', id);
    return api.post(`/loans/${id}/disburse/`);
  },
  getSchedule: (id) => {
    console.log('Get loan schedule API called:', id);
    return api.get(`/loans/${id}/schedule/`);
  },
  calculatePenalty: (id, data) => {
    console.log('Calculate penalty API called:', id);
    return api.post(`/loans/${id}/calculate_penalty/`, data);
  },
  update: (id, data) => {
    console.log('Update loan API called:', id);
    return api.put(`/loans/${id}/`, data);
  },
  delete: (id) => {
    console.log('Delete loan API called:', id);
    return api.delete(`/loans/${id}/`);
  },
};

// ============================================
// CUSTOMER API
// ============================================
export const customerAPI = {
  getAll: (params) => {
    console.log('Get customers API called');
    return api.get('/customers/', { params });
  },
  getById: (id) => {
    console.log('Get customer by ID:', id);
    return api.get(`/customers/${id}/`);
  },
  create: (data) => {
    console.log('Create customer API called');
    return api.post('/customers/', data);
  },
  update: (id, data) => {
    console.log('Update customer API called:', id);
    return api.put(`/customers/${id}/`, data);
  },
  delete: (id) => {
    console.log('Delete customer API called:', id);
    return api.delete(`/customers/${id}/`);
  },
  getGuarantors: (id) => {
    console.log('Get guarantors API called:', id);
    return api.get(`/customers/${id}/guarantors/`);
  },
  addGuarantor: (id, data) => {
    console.log('Add guarantor API called:', id);
    return api.post(`/customers/${id}/add_guarantor/`, data);
  },
};

// ============================================
// PAYMENT API
// ============================================
export const paymentAPI = {
  getAll: (params) => {
    console.log('Get payments API called');
    return api.get('/payments/', { params });
  },
  getById: (id) => {
    console.log('Get payment by ID:', id);
    return api.get(`/payments/${id}/`);
  },
  create: (data) => {
    console.log('Create payment API called');
    return api.post('/payments/', data);
  },
  update: (id, data) => {
    console.log('Update payment API called:', id);
    return api.put(`/payments/${id}/`, data);
  },
  delete: (id) => {
    console.log('Delete payment API called:', id);
    return api.delete(`/payments/${id}/`);
  },
  getByLoan: (loanId) => {
    console.log('Get payments by loan:', loanId);
    return api.get(`/payments/?loan=${loanId}`);
  },
  getSummary: () => {
    console.log('Get payment summary API called');
    return api.get('/payments/summary/');
  },
};

// ============================================
// PRODUCT API
// ============================================
export const productAPI = {
  getAll: (params) => {
    console.log('Get products API called');
    return api.get('/loan-products/', { params });
  },
  getById: (id) => {
    console.log('Get product by ID:', id);
    return api.get(`/loan-products/${id}/`);
  },
  create: (data) => {
    console.log('Create product API called');
    return api.post('/loan-products/', data);
  },
  update: (id, data) => {
    console.log('Update product API called:', id);
    return api.put(`/loan-products/${id}/`, data);
  },
  delete: (id) => {
    console.log('Delete product API called:', id);
    return api.delete(`/loan-products/${id}/`);
  },
};

// ============================================
// REPORT API
// ============================================
export const reportAPI = {
  getPortfolio: (params) => {
    console.log('Get portfolio report API called');
    return api.get('/reports/portfolio/', { params });
  },
  getCollections: (params) => {
    console.log('Get collections report API called');
    return api.get('/reports/collections/', { params });
  },
};

// ============================================
// BRANCH API
// ============================================
export const branchAPI = {
  getAll: (params) => {
    console.log('Get branches API called');
    return api.get('/branches/', { params });
  },
  getById: (id) => {
    console.log('Get branch by ID:', id);
    return api.get(`/branches/${id}/`);
  },
  create: (data) => {
    console.log('Create branch API called');
    return api.post('/branches/', data);
  },
  update: (id, data) => {
    console.log('Update branch API called:', id);
    return api.put(`/branches/${id}/`, data);
  },
  delete: (id) => {
    console.log('Delete branch API called:', id);
    return api.delete(`/branches/${id}/`);
  },
};

export default api;