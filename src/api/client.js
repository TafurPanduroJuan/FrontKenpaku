import axios from 'axios';
import { ADMIN_ENTRY_PATH } from '../utils/constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Intercept request to attach Admin Bearer Token if present
apiClient.interceptors.request.use((config) => {
  if (config.params && typeof config.params === 'object') {
    config.params = Object.fromEntries(
      Object.entries(config.params).filter(
        ([, v]) => v !== '' && v !== null && v !== undefined
      )
    );
  }
  const token = localStorage.getItem('kenpaku_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Intercept response to handle 401 Unauthorized (Auto-logout)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('kenpaku_admin_token');
      localStorage.removeItem('kenpaku_user_role');
      localStorage.removeItem('kenpaku_user_email');
      const isStaffRoute = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/caja');
      if (isStaffRoute && window.location.pathname !== ADMIN_ENTRY_PATH) {
        window.location.href = ADMIN_ENTRY_PATH;
      }
    }
    return Promise.reject(error);
  }
);
