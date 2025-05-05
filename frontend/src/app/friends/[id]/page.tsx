'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Friend } from '@/lib/stores/friendStore';
import { useExpenseStore } from '@/lib/stores/expenseStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { useUserStore } from '@/lib/stores/userStore';
import ChatComponent from '@/components/chat/ChatComponent';
import ExpandableExpensesList from '@/components/expenses/ExpandableExpensesList';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import FriendBalances from '@/components/balances/FriendBalances';
import api from '@/lib/api';
import { FaPlus } from 'react-icons/fa';
import AppLayout from '@/components/layout/AppLayout';

export default function FriendDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'chat' | 'expenses' | 'balances'>('chat');
  const [userCache, setUserCache] = useState<{
    [key: string]: {
      name: string;
      email: string;
      fetching?: boolean;
    }
  }>({});
  
  const { 
    fetchFriendExpenses, 
    friendExpenses, 
    isLoading: expensesLoading,
    error: expensesError
  } = useExpenseStore();
  
  const { user } = useAuthStore();
  const { fetchCategories } = useCategoryStore();
  const { fetchAllUsers, getUserName: getUserNameFromStore } = useUserStore();
  const [friend, setFriend] = useState<Friend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getFriendDetails = async () => {
      try {
        console.log('Fetching friend details for ID:', id);
        const response = await api.get(`/friend/getFriend/${id}`);
        console.log('Friend details response:', response.data);
        setFriend(response.data.data);
        setLoading(false);
      } catch (err: unknown) {
        console.error('Error fetching friend details:', err);
        const errorMessage = err && typeof err === 'object' && 'response' in err 
          ? (err.response as {data?: {message?: string}})?.data?.message || 'Failed to load friend details'
          : 'Failed to load friend details';
        setError(errorMessage);
        setLoading(false);
      }
    };

    if (id) {
      console.log('Friend detail page initialized with ID:', id);
      getFriendDetails();
      fetchFriendExpenses(id as string);
      fetchCategories();
      fetchAllUsers();
    }
  }, [id, fetchFriendExpenses, fetchCategories, fetchAllUsers]);

  const handleAddFriendExpense = () => {
    // Redirect to the main expenses page with query parameters
    router.push(`/expenses?type=friend&id=${id}`);
  };

  const getUserName = (userId: string) => {
    if (!userId) return "Unknown User";
    
    // First check if we have cached this user
    if (userCache[userId]) {
      return userCache[userId].name || userCache[userId].email || userId;
    }
    
    // If user is current user
    if (user && (userId === user._id || userId === user.id)) {
      return 'You';
    }
    
    // If it's the friend we're viewing
    if (friend && userId === friend._id) {
      return friend.name;
    }
    
    // If not found, try to get from all users store
    const userNameFromStore = getUserNameFromStore(userId);
    if (userNameFromStore && !userNameFromStore.startsWith('User ')) {
      // Cache this result for future use
      setUserCache(prev => ({
        ...prev,
        [userId]: { name: userNameFromStore, email: '', fetching: false }
      }));
      return userNameFromStore;
    }
    
    // Trigger async fetch but return a formatted ID for now
    fetchUserDetails(userId);
    
    // If userId looks like an email, extract username part
    if (typeof userId === 'string' && userId.includes('@')) {
      return userId.split('@')[0];
    }
    
    // Format user ID to look better
    const shortId = userId.length > 8 ? userId.substring(0, 8) + '...' : userId;
    return `User ${shortId}`;
  };

  // Fetch user details from backend
  const fetchUserDetails = async (userId: string) => {
    if (!userId) return;
    
    try {
      // Check if we're already fetching details for this user
      if (userCache[userId] && userCache[userId].fetching) return;
      
      // Mark as fetching to avoid duplicate requests
      const shortId = userId.length > 8 ? userId.substring(0, 8) + '...' : userId;
      setUserCache(prev => ({
        ...prev,
        [userId]: { 
          ...prev[userId], 
          fetching: true, 
          name: prev[userId]?.name || `User ${shortId}`, 
          email: prev[userId]?.email || '' 
        }
      }));
      
      // Fetch user details from API
      const response = await api.get(`/profile/getUserDetailsById/${userId}`);
      const userDetails = response.data.data;
      
      if (userDetails) {
        let name = '';
        
        if (userDetails.name) {
          name = userDetails.name;
        } else if (userDetails.firstName && userDetails.lastName) {
          name = `${userDetails.firstName} ${userDetails.lastName}`;
        } else if (userDetails.email && userDetails.email.includes('@')) {
          name = userDetails.email.split('@')[0];
        } else if (userDetails.email) {
          name = userDetails.email;
        } else {
          name = `User ${shortId}`;
        }
        
        // Cache this user and mark as no longer fetching
        setUserCache(prev => ({
          ...prev,
          [userId]: { name, email: userDetails.email || '', fetching: false }
        }));
        
        // Force a re-render to update any components using this user
        setTimeout(() => setActiveTab(activeTab), 50);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      // Mark as no longer fetching even if there was an error
      setUserCache(prev => ({
        ...prev,
        [userId]: { ...prev[userId], fetching: false }
      }));
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error || !friend) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error || 'Friend not found'}</div>;
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-4 flex flex-col min-h-0">
          <div className="flex items-center space-x-4 mb-6">
            {friend.profilePicture ? (
              <img 
                src={friend.profilePicture} 
                alt={friend.name} 
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                {friend.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{friend.name}</h1>
              <p className="text-gray-600">{friend.email}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'chat'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'expenses'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Expenses
                </button>
                <button
                  onClick={() => setActiveTab('balances')}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'balances'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Balances
                </button>
              </nav>
            </div>

            <div className="flex-1 overflow-auto">
              {activeTab === 'chat' ? (
                <ChatComponent
                  targetId={id as string}
                  isFriendChat={true}
                  targetName={friend.name}
                />
              ) : activeTab === 'expenses' ? (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Expenses with {friend.name}</h2>
                    <button 
                      className="btn-primary flex items-center gap-2"
                      onClick={handleAddFriendExpense}
                    >
                      <FaPlus size={14} />
                      <span>Add Expense</span>
                    </button>
                  </div>

                  <div className="card overflow-hidden">
                    <ExpandableExpensesList
                      expenses={friendExpenses}
                      isLoading={expensesLoading}
                      error={expensesError}
                      getUserName={getUserName}
                      currentUserId={user?._id}
                      friendId={friend._id as string}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold">Balance with {friend.name}</h2>
                    <p className="text-gray-600">Track what you owe and what you&apos;re owed</p>
                  </div>
                  <FriendBalances friendId={id as string} className="mt-4" />
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
} 