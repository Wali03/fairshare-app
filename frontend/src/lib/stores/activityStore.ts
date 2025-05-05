import { create } from 'zustand';
import api from '../api';
import { AxiosError } from 'axios';

// Activity interfaces
export interface Activity {
  _id: string;
  user: string;
  actor?: {
    _id: string;
    name?: string;
    email?: string;
    profileImage?: string;
  };
  type: string;
  desc: string;
  date: string;
  group?: {
    _id: string;
    name: string;
    image?: string;
  };
  expense?: {
    _id: string;
    description: string;
    amount: number;
    date: string;
  };
  friend?: {
    _id: string;
    name?: string;
    email?: string;
    profileImage?: string;
  };
  image?: string;
  actorImage?: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityState {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  fetchActivities: () => Promise<void>;
  markAsRead: (activityIds: string[]) => Promise<void>;
  getUnreadCount: () => Promise<void>;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  isLoading: false,
  error: null,
  unreadCount: 0,
  
  fetchActivities: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/activity/getAllActivities');
      
      if (response.data && response.data.success) {
        set({ 
          activities: response.data.activities, 
          isLoading: false 
        });
      } else {
        set({ 
          isLoading: false, 
          error: 'Failed to fetch activities' 
        });
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to fetch activities'
      });
    }
  },
  
  markAsRead: async (activityIds: string[]) => {
    try {
      if (activityIds.length === 0) return;
      
      await api.post('/activity/markAsRead', { activityIds });
      
      // Update local state to mark these as read
      set(state => ({
        activities: state.activities.map(activity => 
          activityIds.includes(activity._id) 
            ? { ...activity, isRead: true } 
            : activity
        ),
        unreadCount: Math.max(0, state.unreadCount - activityIds.length)
      }));
    } catch (error) {
      console.error('Error marking activities as read:', error);
    }
  },
  
  getUnreadCount: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get('/activity/unreadCount');
      set({ unreadCount: response.data.count, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred', 
        isLoading: false 
      });
    }
  }
})); 