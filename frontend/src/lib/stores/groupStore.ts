import { create } from 'zustand';
import api from '../api';
import { AxiosError } from 'axios';

export interface Group {
  _id: string;
  name: string;
  description?: string;
  people: string[];
  members: string[];
  admin: string;
  image?: string;
  createdAt: string;
}

export interface UserDetails {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
}

interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  isLoading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  fetchGroupDetails: (groupId: string) => Promise<Group | null>;
  createGroup: (groupData: { 
    name: string; 
    description?: string; 
    emails: string[];
    image?: string;
  }) => Promise<void>;
  addMemberToGroup: (groupId: string, memberId: string) => Promise<void>;
  removeMemberFromGroup: (groupId: string, userId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  getUserDetails: (userId: string) => Promise<UserDetails | null>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  currentGroup: null,
  isLoading: false,
  error: null,

  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/group/showAllGroups');
      console.log('Group response:', response.data);

      if (response.data.success && Array.isArray(response.data.groups)) {
        // Map the response data to our Group type
        const groupsData = response.data.groups.map((item: unknown) => {
          // If group is just an ID string, convert it to a minimal group object
          if (typeof item === 'string') {
            return {
              _id: item,
              name: 'Loading...',
              description: '',
              people: [],
              members: [],
              admin: '',
              image: '',
              createdAt: new Date().toISOString()
            } as Group;
          }
          // If it's already an object, return it with proper typing
          return item as Group;
        });
        
        set({ groups: groupsData, isLoading: false });
        
        // If any group is just an ID, we should fetch its full details
        // by calling fetchGroupDetails for each one
        groupsData.forEach((group: Group) => {
          if (group.name === 'Loading...') {
            get().fetchGroupDetails(group._id);
          }
        });
      } else {
        set({ groups: [], isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to fetch groups'
      });
    }
  },

  fetchGroupDetails: async (groupId: string) => {
    try {
      const response = await api.get(`/group/getGroup/${groupId}`);
      console.log('Group details response:', response.data);
      
      if (response.data && response.data.group) {
        const groupData = response.data.group as Group;
        
        // Update this group in the store and set as current group
        set(state => ({
          groups: state.groups.map(g => 
            g._id === groupId ? { ...g, ...groupData } : g
          ),
          currentGroup: groupData,
          error: null
        }));
        
        return groupData;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching group details for ${groupId}:`, error);
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        error: axiosError.response?.data?.message || `Failed to fetch group details`
      });
      return null;
    }
  },

  createGroup: async (groupData) => {
    set({ isLoading: true, error: null });
    try {
      // The backend already expects name, emails, and image
      const formattedData = {
        name: groupData.name,
        emails: groupData.emails || [],
        image: groupData.image || '',
        description: groupData.description || ''
      };
      await api.post('/group/createGroup', formattedData);
      await get().fetchGroups();
      set({ isLoading: false });
    } catch (error) {
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to create group'
      });
      throw error;
    }
  },

  addMemberToGroup: async (groupId, memberId) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/group/addPeople/${groupId}`, { people: [memberId] });
      // Refresh group details
      if (get().currentGroup?._id === groupId) {
        await get().fetchGroupDetails(groupId);
      }
      set({ isLoading: false });
    } catch (error) {
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to add member to group'
      });
      throw error;
    }
  },

  removeMemberFromGroup: async (groupId, userId) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/group/removeFromGroup', { groupId, userId });
      // Refresh group details
      if (get().currentGroup?._id === groupId) {
        await get().fetchGroupDetails(groupId);
      }
      set({ isLoading: false });
    } catch (error) {
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to remove member from group'
      });
      throw error;
    }
  },

  leaveGroup: async (groupId) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/group/leaveGroup`, { groupId });
      // Update groups list
      set({
        groups: get().groups.filter(group => group._id !== groupId),
        currentGroup: null,
        isLoading: false
      });
    } catch (error) {
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to leave group'
      });
      throw error;
    }
  },
  
  deleteGroup: async (groupId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/group/deleteGroup`, { 
        data: { groupId } 
      });
      // Update groups list
      set({
        groups: get().groups.filter(group => group._id !== groupId),
        currentGroup: null,
        isLoading: false
      });
    } catch (error) {
      const axiosError = error as AxiosError<{message?: string}>;
      set({
        isLoading: false,
        error: axiosError.response?.data?.message || 'Failed to delete group'
      });
      throw error;
    }
  },

  getUserDetails: async (userId) => {
    try {
      const response = await api.get(`/group/getUserDetails/${userId}`);
      if (response.data.success && response.data.user) {
        return response.data.user as UserDetails;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching user details for ${userId}:`, error);
      return null;
    }
  }
})); 