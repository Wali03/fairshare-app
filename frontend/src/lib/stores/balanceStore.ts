import { create } from 'zustand';
import api from '../api';
import { AxiosError } from 'axios';

// Friend balance interfaces
export interface FriendBalance {
  friend: {
    id: string;
    name: string;
    email: string;
  };
  balance: number;
}

// Group balance interfaces
export interface UserBalance {
  userId: string;
  amount: number;
}

export interface GroupTransaction {
  from: string;
  to: string;
  amount: number;
}

export interface GroupBalance {
  balances: Record<string, number>;
  optimizedTransactions: GroupTransaction[];
}

interface BalanceState {
  // Friend balances
  friendBalances: FriendBalance[];
  friendBalancesLoading: boolean;
  friendBalancesError: string | null;
  
  // Group balances
  groupBalance: GroupBalance | null;
  groupBalanceLoading: boolean;
  groupBalanceError: string | null;
  
  // Methods
  fetchFriendBalances: () => Promise<void>;
  fetchGroupBalance: (groupId: string) => Promise<void>;
}

export const useBalanceStore = create<BalanceState>((set) => ({
  // Friend balances
  friendBalances: [],
  friendBalancesLoading: false,
  friendBalancesError: null,
  
  // Group balances
  groupBalance: null,
  groupBalanceLoading: false,
  groupBalanceError: null,
  
  // Fetch all friend balances
  fetchFriendBalances: async () => {
    set({ friendBalancesLoading: true, friendBalancesError: null });
    try {
      const response = await api.get('/friend/getFriendBalance');
      
      if (response.data && response.data.success) {
        set({ 
          friendBalances: response.data.balances, 
          friendBalancesLoading: false 
        });
      } else {
        set({ 
          friendBalancesLoading: false, 
          friendBalancesError: 'Failed to fetch friend balances' 
        });
      }
    } catch (error) {
      console.error('Error fetching friend balances:', error);
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        friendBalancesLoading: false,
        friendBalancesError: axiosError.response?.data?.message || 'Failed to fetch friend balances'
      });
    }
  },
  
  // Fetch group balances for a specific group
  fetchGroupBalance: async (groupId: string) => {
    set({ groupBalanceLoading: true, groupBalanceError: null });
    try {
      const response = await api.get(`/group/getGroupwiseBalances/${groupId}`);
      
      if (response.data && response.data.success) {
        set({ 
          groupBalance: {
            balances: response.data.balances,
            optimizedTransactions: response.data.optimizedTransactions
          },
          groupBalanceLoading: false 
        });
      } else {
        set({ 
          groupBalanceLoading: false, 
          groupBalanceError: 'Failed to fetch group balances' 
        });
      }
    } catch (error) {
      console.error('Error fetching group balances:', error);
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        groupBalanceLoading: false,
        groupBalanceError: axiosError.response?.data?.message || 'Failed to fetch group balances'
      });
    }
  }
})); 