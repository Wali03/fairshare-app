import { create } from 'zustand';
import api from '../api';

export interface Friend {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface FriendState {
  friends: Friend[];
  isLoading: boolean;
  error: string | null;
  fetchFriends: () => Promise<void>;
  addFriend: (email: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  isLoading: false,
  error: null,

  fetchFriends: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/friend/getAllFriends');
      const friendsData = response.data.data;
      
      console.log('Raw friends data:', friendsData);
      
      // If we just have an array of IDs or need to handle object IDs
      if (Array.isArray(friendsData)) {
        if (friendsData.length === 0) {
          // Empty friends list
          set({ friends: [], isLoading: false });
          return;
        }
        
        // Check if we have full friend objects or just IDs
        if (typeof friendsData[0] === 'string' || 
            (typeof friendsData[0] === 'object' && !friendsData[0].name && !friendsData[0].email)) {
          console.log('Detected friend IDs, fetching details...');
          // Get friend details for each ID
          const friendPromises = friendsData.map(async (friendId) => {
            try {
              // Handle ObjectId which might be an object with _id property
              const id = typeof friendId === 'object' && friendId._id ? friendId._id : friendId;
              const friendResponse = await api.get(`/friend/getFriend/${id}`);
              return friendResponse.data.data;
            } catch (err) {
              console.error(`Failed to fetch details for friend ${friendId}`, err);
              return null;
            }
          });
          
          const friendsWithDetails = await Promise.all(friendPromises);
          // Filter out any null values from failed requests
          const validFriends = friendsWithDetails.filter(f => f !== null);
          console.log('Processed friends with details:', validFriends);
          set({ friends: validFriends, isLoading: false });
        } else if (typeof friendsData[0] === 'object' && (friendsData[0].name || friendsData[0].email)) {
          // We already have full friend objects
          console.log('Friend objects already complete');
          set({ friends: friendsData, isLoading: false });
        } else {
          console.log('Unknown friend data format, storing as is');
          set({ friends: friendsData, isLoading: false });
        }
      } else {
        console.log('Non-array friends data, storing as is');
        set({ friends: [], isLoading: false });
      }
    } catch (error: any) {
      console.error('Failed to fetch friends:', error);
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch friends'
      });
    }
  },

  addFriend: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/friend/addFriend', { email });
      // Refresh the friends list
      await get().fetchFriends();
      return response.data;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to add friend'
      });
      throw error;
    }
  },

  removeFriend: async (friendId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/friend/removeFriend/${friendId}`);
      set({
        friends: get().friends.filter(friend => friend._id !== friendId),
        isLoading: false
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to remove friend'
      });
      throw error;
    }
  }
})); 