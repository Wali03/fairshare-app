import { create } from 'zustand';
import api from '../api';
import { AxiosError } from 'axios';
import Cookies from 'js-cookie';

export interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  additionalDetails?: {
    dateOfBirth?: string;
    gender?: string;
    about?: string;
    contactNumber?: string;
  };
}

export interface BasicUserInfo {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  profileImage?: string;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUserDetails: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  resetPasswordRequest: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<void>;
  allUsers: BasicUserInfo[];
  userMap: Record<string, BasicUserInfo>;
  fetchAllUsers: () => Promise<void>;
  getUserById: (userId: string) => BasicUserInfo | null;
  getUserName: (userId: string) => string;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: !!Cookies.get('token'),
  allUsers: [],
  userMap: {},

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        set({ 
          isAuthenticated: true,
          user: response.data.user,
          isLoading: false 
        });
      } else {
        set({ 
          isLoading: false,
          error: response.data.message || 'Login failed'
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to login'
      });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      // Call logout endpoint if needed
      Cookies.remove('token');
      set({ 
        isAuthenticated: false, 
        user: null, 
        isLoading: false 
      });
    } catch (error) {
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to logout'
      });
    }
  },

  fetchUserDetails: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/profile/getUserDetails');
      if (response.data.success) {
        set({ 
          user: response.data.data,
          isLoading: false 
        });
      } else {
        set({ 
          isLoading: false,
          error: response.data.message || 'Failed to fetch user details'
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to fetch user details'
      });
    }
  },

  updateProfile: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put('/profile/updateProfile', userData);
      
      if (response.data.success) {
        set({ 
          user: response.data.updatedUserDetails,
          isLoading: false 
        });
      } else {
        set({ 
          isLoading: false,
          error: response.data.message || 'Failed to update profile'
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to update profile'
      });
    }
  },

  uploadProfilePicture: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('displayPicture', file);
      
      const response = await api.post('/profile/updateDisplayPicture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        set({ 
          user: response.data.data,
          isLoading: false 
        });
      } else {
        set({ 
          isLoading: false,
          error: response.data.message || 'Failed to upload profile picture'
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to upload profile picture'
      });
    }
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/changePassword', {
        oldPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      });
      
      if (response.data.success) {
        set({ isLoading: false });
        return;
      } else {
        set({ 
          isLoading: false,
          error: response.data.message || 'Failed to change password'
        });
        throw new Error(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to change password'
      });
      throw error; // Re-throw the error to be caught by the component
    }
  },

  resetPasswordRequest: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/reset-password-token', { email });
      
      if (response.data.success) {
        set({ isLoading: false });
        return;
      } else {
        set({ 
          isLoading: false,
          error: response.data.message || 'Failed to send reset password email'
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to send reset password email'
      });
    }
  },

  resetPassword: async (token, password, confirmPassword) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password,
        confirmPassword
      });
      
      if (response.data.success) {
        set({ isLoading: false });
        return;
      } else {
        set({ 
          isLoading: false,
          error: response.data.message || 'Failed to reset password'
        });
        throw new Error(response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to reset password'
      });
      throw error; // Re-throw the error to be caught by the component
    }
  },

  fetchAllUsers: async () => {
    // Check if we already have users
    if (get().allUsers.length > 0) return;
    
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/profile/fetchAllUsers');
      
      if (response.data.success && Array.isArray(response.data.users)) {
        const users = response.data.users as BasicUserInfo[];
        
        // Create a map for quick lookup by ID
        const userMap: Record<string, BasicUserInfo> = {};
        users.forEach(user => {
          userMap[user._id] = user;
        });
        
        set({ 
          allUsers: users, 
          userMap,
          isLoading: false 
        });
      } else {
        set({ 
          allUsers: [], 
          userMap: {},
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to fetch users'
      });
    }
  },

  getUserById: (userId: string) => {
    if (!userId) return null;
    return get().userMap[userId] || null;
  },

  getUserName: (userId: string) => {
    if (!userId) return 'Unknown User';
    
    const user = get().userMap[userId];
    if (!user) return `User ${userId.substring(0, 6)}...`;
    
    if (user.name) return user.name;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.email) {
      // Extract username from email
      return user.email.split('@')[0];
    }
    
    // Fallback to shortened ID
    return `User ${userId.substring(0, 6)}...`;
  }
})); 