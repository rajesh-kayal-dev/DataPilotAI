import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to attach the token
axiosInstance.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    // Let the browser set multipart boundaries for file uploads
    if (config.headers) {
      delete (config.headers as any)['Content-Type'];
    }
  }

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const hasToken = Boolean(localStorage.getItem('token'));
      const authPaths = ['/login', '/signup'];
      const isOnAuthPage = authPaths.includes(window.location.pathname);

      localStorage.removeItem('token');
      if (hasToken && !isOnAuthPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;