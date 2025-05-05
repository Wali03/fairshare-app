'use client';

import AppLayout from '@/components/layout/AppLayout';
import FriendList from '@/components/friends/FriendList';
import { FaUserFriends } from 'react-icons/fa';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useUserStore } from '@/lib/stores/userStore';
import { useEffect } from 'react';

export default function FriendsPage() {
  const { fetchAllUsers } = useUserStore();
  
  useEffect(() => {
    // Fetch all users on page load to populate the user store
    fetchAllUsers();
  }, [fetchAllUsers]);
  
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="mb-6">
          <div className="flex items-center">
            <FaUserFriends className="text-2xl mr-3 text-primary" />
            <h1 className="text-2xl font-bold">Friends</h1>
          </div>
          <p className="text-gray-500 mt-2">Manage your friends and track shared expenses</p>
        </div>
        
        <FriendList />
      </AppLayout>
    </ProtectedRoute>
  );
} 