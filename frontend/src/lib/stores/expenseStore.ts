import { create } from 'zustand';
import api from '../api';
import { AxiosError } from 'axios';

export interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  subcategory?: string;
  paidBy: Array<{
    userId: string;
    amountPaid: number;
  }>;
  paidFor: Array<{
    person: string;
    amountOwed: number;
  }>;
  groupId?: string;
  date: string;
  image?: string;
  createdAt: string;
  createdBy?: string;
}

interface ExpenseState {
  expenses: Expense[];
  friendExpenses: Expense[];
  groupExpenses: Expense[];
  isLoading: boolean;
  error: string | null;
  fetchUserExpenses: () => Promise<void>;
  fetchFriendExpenses: (friendId: string) => Promise<void>;
  fetchGroupExpenses: (groupId: string) => Promise<void>;
  createFriendExpense: (friendId: string, data: Omit<Expense, '_id' | 'createdAt'>) => Promise<void>;
  createGroupExpense: (groupId: string, data: Omit<Expense, '_id' | 'createdAt'>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  updateExpense: (expenseId: string, data: Partial<Omit<Expense, '_id' | 'createdAt'>>) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  friendExpenses: [],
  groupExpenses: [],
  isLoading: false,
  error: null,

  fetchUserExpenses: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/expense/showAllExpenses');
      console.log('Expense response:', response.data);
      
      // Check if userExpenses exists and is an array
      if (Array.isArray(response.data.userExpenses)) {
        // If userExpenses contains objects with _id, use them directly
        const rawExpenses = response.data.userExpenses.map((expense: unknown) => {
          // If expense is just an ID string, convert it to a minimal expense object
          if (typeof expense === 'string') {
            return {
              _id: expense,
              description: `Loading...`, // Will be fetched later
              amount: 0,
              date: new Date().toISOString(),
              category: 'Other',
              paidBy: [],
              paidFor: [],
              createdAt: new Date().toISOString()
            } as Expense;
          }
          // If it's already an object, return it
          return expense as Expense;
        });
        
        // Deduplicate expenses based on _id
        const expenseMap = new Map<string, Expense>();
        rawExpenses.forEach((exp: Expense) => {
          if (exp._id && !expenseMap.has(exp._id)) {
            expenseMap.set(exp._id, exp);
          }
        });
        
        const expensesData = Array.from(expenseMap.values());
        console.log(`Fetched ${rawExpenses.length} expenses, deduplicated to ${expensesData.length}`);
        
        set({ expenses: expensesData, isLoading: false });
        
        // For any ID-only expenses, fetch the full details
        const idsToFetch = expensesData
          .filter((exp: Expense) => exp.description === 'Loading...')
          .map((exp: Expense) => exp._id);
          
        if (idsToFetch.length > 0) {
          idsToFetch.forEach(async (id: string) => {
            try {
              const detailResponse = await api.get(`/expense/${id}`);
              if (detailResponse.data && detailResponse.data.expense) {
                // Update this expense in the store
                set(state => ({
                  expenses: state.expenses.map(e => 
                    e._id === id ? { ...e, ...detailResponse.data.expense } : e
                  )
                }));
              }
            } catch (err) {
              console.error(`Error fetching expense details for ${id}:`, err);
            }
          });
        }
      } else {
        // If userExpenses doesn't exist or isn't an array, set empty array
        set({ expenses: [], isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to fetch expenses'
      });
    }
  },

  fetchFriendExpenses: async (friendId) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Fetching friend expenses for friendId:', friendId);
      const response = await api.post('/friend/showAllFriendExpenses', { friendId });
      console.log('Friend expenses response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        // The API returns an array of arrays that needs to be flattened
        const flattened = response.data.data.flat();
        console.log(`Fetched ${flattened.length} friend expenses after flattening`);
        
        // If we have expenses, use them
        if (flattened.length > 0) {
          set({ friendExpenses: flattened, isLoading: false });
        } else {
          set({ friendExpenses: [], isLoading: false });
        }
      } else {
        // If the response doesn't match the expected format
        console.warn('Unexpected response format for friend expenses:', response.data);
        set({ friendExpenses: [], isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching friend expenses:', error);
      
      // Log detailed error info
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosError<{message?: string}>;
        console.error('Error details:', {
          status: axiosError.response?.status,
          message: axiosError.response?.data?.message,
          data: axiosError.response?.data
        });
        
        set({
          isLoading: false,
          error: axiosError.response?.data?.message || 'Failed to fetch friend expenses'
        });
      } else {
        set({
          isLoading: false,
          error: 'Failed to fetch friend expenses: Unknown error'
        });
      }
    }
  },

  fetchGroupExpenses: async (groupId) => {
    set({ isLoading: true, error: null });
    try {
      // The endpoint expects groupId in the request body
      const response = await api.post('/group/showAllGroupExpense', { groupId });
      console.log('Group expenses response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.expenses)) {
        // The response contains expense IDs, we need to fetch each expense's full details
        const expenseIds = response.data.expenses;
        const detailedExpenses: Expense[] = [];
        
        // If there are expenses, fetch their details
        if (expenseIds.length > 0) {
          // Create a loading state with placeholder data
          const loadingExpenses = expenseIds.map((id: string) => ({
            _id: id,
            description: 'Loading...',
            amount: 0,
            category: 'Loading...',
            paidBy: [],
            paidFor: [],
            date: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          }));
          
          // Set initial loading state
          set({ groupExpenses: loadingExpenses, isLoading: true });
          
          // Fetch each expense's details
          for (const expenseId of expenseIds) {
            try {
              const detailResponse = await api.get(`/expense/${expenseId}`);
              if (detailResponse.data && detailResponse.data.expense) {
                detailedExpenses.push(detailResponse.data.expense);
              }
            } catch (err) {
              console.error(`Error fetching expense details for ${expenseId}:`, err);
            }
          }
          
          set({ 
            groupExpenses: detailedExpenses.length > 0 ? detailedExpenses : loadingExpenses,
            isLoading: false 
          });
        } else {
          set({ groupExpenses: [], isLoading: false });
        }
      } else {
        set({ groupExpenses: [], isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching group expenses:', error);
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to fetch group expenses'
      });
    }
  },

  createFriendExpense: async (friendId, data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/friend/createExpenseForFriend', {
        friendId,
        ...data
      });
      await get().fetchFriendExpenses(friendId);
      set({ isLoading: false });
    } catch (error) {
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to create expense'
      });
      throw error;
    }
  },

  createGroupExpense: async (groupId, data) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Creating group expense with data:', {
        groupId,
        ...data
      });
      
      const response = await api.post('/group/createGroupExpense', {
        groupId,
        ...data
      });
      
      console.log('Group expense created successfully:', response.data);
      
      // Wait a moment before fetching updated expenses
      setTimeout(async () => {
        await get().fetchGroupExpenses(groupId);
        set({ isLoading: false });
      }, 1000);
    } catch (error) {
      console.error('Failed to create group expense:', error);
      
      // Log detailed error info
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosError<{message?: string}>;
        console.error('Error details:', {
          status: axiosError.response?.status,
          message: axiosError.response?.data?.message,
          data: axiosError.response?.data
        });
        
        set({
          isLoading: false,
          error: axiosError.response?.data?.message || 'Failed to create group expense'
        });
      } else {
        set({
          isLoading: false,
          error: 'Failed to create group expense: Unknown error'
        });
      }
      throw error;
    }
  },

  deleteExpense: async (expenseId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/expense/${expenseId}`);
      
      // Update all expense lists
      set(state => ({
        expenses: state.expenses.filter(e => e._id !== expenseId),
        friendExpenses: state.friendExpenses.filter(e => e._id !== expenseId),
        groupExpenses: state.groupExpenses.filter(e => e._id !== expenseId),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error deleting expense:', error);
      const axiosError = error as AxiosError<{message?: string}>;
      
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to delete expense'
      });
      
      throw error;
    }
  },

  updateExpense: async (expenseId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/expense/${expenseId}`, data);
      const updatedExpense = response.data.expense;
      
      // Update the expense in all lists
      const updateExpenseInList = (list: Expense[]) => 
        list.map(e => e._id === expenseId ? { ...e, ...updatedExpense } : e);
      
      set(state => ({
        expenses: updateExpenseInList(state.expenses),
        friendExpenses: updateExpenseInList(state.friendExpenses),
        groupExpenses: updateExpenseInList(state.groupExpenses),
        isLoading: false
      }));
      
      return updatedExpense;
    } catch (error) {
      console.error('Error updating expense:', error);
      const axiosError = error as AxiosError<{message?: string}>;
      
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to update expense'
      });
      
      throw error;
    }
  }
})); 