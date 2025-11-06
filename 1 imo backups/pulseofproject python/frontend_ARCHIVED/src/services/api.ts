import axios from 'axios';
import { getAccessToken } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Supabase auth token
api.interceptors.request.use(
  async (config) => {
    // Try to get Supabase token first
    const supabaseToken = await getAccessToken();

    if (supabaseToken) {
      config.headers.Authorization = `Bearer ${supabaseToken}`;
    } else {
      // Fallback to Django JWT token for backward compatibility
      const djangoToken = localStorage.getItem('access_token');
      if (djangoToken) {
        config.headers.Authorization = `Bearer ${djangoToken}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Supabase handles token refresh automatically
        // Just retry getting the token
        const supabaseToken = await getAccessToken();

        if (supabaseToken) {
          // Retry original request with refreshed token
          originalRequest.headers.Authorization = `Bearer ${supabaseToken}`;
          return api(originalRequest);
        }

        // If no token available, redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired'));
      } catch (refreshError) {
        // If refresh fails, clear storage and redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login/', { username, password });
    const { access, refresh } = response.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    return response.data;
  },

  register: async (userData: { username: string; email: string; password: string; password_confirm: string }) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/profile/me/');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('username');

    // Clear permissions cache
    import('../hooks/usePermission').then(module => {
      module.clearPermissions();
    });
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  getUserRole: () => {
    return localStorage.getItem('user_role');
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/profile/me/');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.patch('/profile/me/', data);
    return response.data;
  },
};

// Task API
export const taskAPI = {
  getTasks: async () => {
    const response = await api.get('/tasks/');
    return response.data;
  },

  getTask: async (id: number) => {
    const response = await api.get(`/tasks/${id}/`);
    return response.data;
  },

  createTask: async (data: any) => {
    const response = await api.post('/tasks/', data);
    return response.data;
  },

  updateTask: async (id: number, data: any) => {
    const response = await api.patch(`/tasks/${id}/`, data);
    return response.data;
  },

  deleteTask: async (id: number) => {
    await api.delete(`/tasks/${id}/`);
  },
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health/');
  return response.data;
};

export default api;
