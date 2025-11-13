import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  tenant: {
    id: string;
    name: string;
  };
}

interface SuperAdmin {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  superAdmin: SuperAdmin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  superAdminLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  superAdmin: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      set({ user, isAuthenticated: true, superAdmin: null });
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Erro ao fazer login';
      toast.error(message);
      throw error;
    }
  },

  superAdminLogin: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/super-admin/login', { email, password });
      const { superAdmin, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      set({ superAdmin, isAuthenticated: true, user: null });
      toast.success('Login de Super Admin realizado!');
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Erro ao fazer login';
      toast.error(message);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, superAdmin: null, isAuthenticated: false });
      window.location.href = '/login';
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const response = await api.get('/auth/me');
      const userData = response.data.data;

      // Check if it's a super admin or regular user
      if (userData.tenant) {
        set({ user: userData, isAuthenticated: true, isLoading: false });
      } else {
        set({ superAdmin: userData, isAuthenticated: true, isLoading: false });
      }
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, superAdmin: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
