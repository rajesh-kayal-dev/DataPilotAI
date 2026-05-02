import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/v1`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // As per instruction: Use key: token
    config.headers['token'] = token;
    // Also include standard Authorization header just in case
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    if (config.headers) {
      delete (config.headers as any)['Content-Type'];
    }
  }

  return config;
});

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize error message
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'An unexpected error occurred';
    
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Create a normalized error object
    const normalizedError = new Error(message);
    (normalizedError as any).status = error.response?.status;
    (normalizedError as any).data = error.response?.data;
    
    return Promise.reject(normalizedError);
  }
);

export default axiosInstance;