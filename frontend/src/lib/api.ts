import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Use the exact format that the server's auth middleware expects
      config.headers.Authorization = token;
    }
    
    // Log outgoing requests for debugging
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    // Log errors for debugging
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    
    // Handle session expiry or auth issues
    if (error.response && error.response.status === 401) {
      // Skip redirect for password-related endpoints
      const url = error.config?.url || '';
      const isPasswordEndpoint = 
        url.includes('/changePassword') || 
        url.includes('/reset-password') || 
        url.includes('/reset-password-token');
      
      if (!isPasswordEndpoint) {
        // Clear storage and redirect to login if unauthorized (but not for password endpoints)
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export async function fetchCategories() {
  return api.get('/general/showAllCategories');
}

export async function fetchSubcategories(categoryId: string) {
  return api.post('/general/showSubcategories', { categoryid: categoryId });
} 