import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api';

interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  sendOtp: (email: string) => Promise<string>;
  signup: (name: string, email: string, password: string, confirmPassword: string, otp: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('token');
          const userStr = localStorage.getItem('user');
          
          if (!token || !userStr) {
            set({ isAuthenticated: false, user: null, token: null });
            return false;
          }
          
          await api.get('/profile/getUserDetails');
          
          const user = JSON.parse(userStr);
          set({ isAuthenticated: true, user, token });
          return true;
        } catch (error) {
          console.error('Auth check failed:', error);
          set({ isAuthenticated: false, user: null, token: null });
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return false;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, token } = response.data;
          
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.message || 'Login failed' 
          });
          throw error;
        }
      },

      sendOtp: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/sendotp', { email });
          set({ isLoading: false });
          return response.data.otp; // Return the OTP for development purposes
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.message || 'Failed to send OTP' 
          });
          throw error;
        }
      },

      signup: async (name, email, password, confirmPassword, otp) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/signup', { 
            name,
            email, 
            password,
            confirmPassword,
            otp
          });
          set({ isLoading: false });
          return response.data;
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.message || 'Signup failed' 
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        });
      },
      
      deleteAccount: async () => {
        set({ isLoading: true, error: null });
        try {
          await api.delete('/auth/delete-account');
          // Clear storage and state after successful deletion
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false,
            isLoading: false
          });
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.message || 'Failed to delete account' 
          });
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
); 