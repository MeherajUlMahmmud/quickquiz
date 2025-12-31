import axios from 'axios';
import { API_URL, APP_ROUTES } from '../utils/constants';

/**
 * Generate a unique trace ID for request tracking
 */
function generateTraceId(): string {
  return crypto.randomUUID();
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token and trace ID to requests
api.interceptors.request.use(
  (config) => {
    // Add trace ID for request tracking
    if (!config.headers['X-Request-ID']) {
      config.headers['X-Request-ID'] = generateTraceId();
    }

    // Add authentication token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = APP_ROUTES.LOGIN;
    }
    return Promise.reject(error);
  }
);

export default api;

