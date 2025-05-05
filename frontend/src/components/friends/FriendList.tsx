'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFriendStore } from '@/lib/stores/friendStore';
import { useUserStore } from '@/lib/stores/userStore';
import { FaPlus, FaSearch, FaUserMinus } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import api from '@/lib/api';

export default function FriendList() {
  const { friends, fetchFriends, addFriend, removeFriend, isLoading, error } = useFriendStore();
  const { getUserName } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [addFriendError, setAddFriendError] = useState('');
  const [removingFriend, setRemovingFriend] = useState<string | null>(null);
  const [userCache, setUserCache] = useState<{
    [key: string]: {
      name: string;
      email: string;
      profilePicture?: string;
      fetching?: boolean;
    }
  }>({});

  useEffect(() => {
    console.log('Fetching friends...');
    fetchFriends()
      .then(() => {
        // Access friends from the store rather than dependency array
        const currentFriends = useFriendStore.getState().friends;
        console.log('Friends fetched:', currentFriends);
      })
      .catch((err: Error) => {
        console.error('Error fetching friends:', err);
      });
  }, [fetchFriends]);

  const getFriendName = (friendId: string) => {
    // First check if we have cached this user
    if (userCache[friendId]) {
      return userCache[friendId].name || userCache[friendId].email;
    }
    
    // If not found, try to get from user store
    const userNameFromStore = getUserName(friendId);
    if (userNameFromStore && !userNameFromStore.startsWith('User ')) {
      // Cache this result for future use
      setUserCache(prev => ({
        ...prev,
        [friendId]: { name: userNameFromStore, email: '' }
      }));
      return userNameFromStore;
    }
    
    // Trigger async fetch but return a formatted ID for now
    fetchUserDetails(friendId);
    
    // Format user ID to look better until real name is fetched
    const shortId = friendId.length > 8 ? friendId.substring(0, 8) + '...' : friendId;
    return `User ${shortId}`;
  };

  const fetchUserDetails = async (userId: string) => {
    if (!userId) return;
    
    try {
      // Check if we're already fetching details for this user
      if (userCache[userId] && userCache[userId].fetching) return;
      
      // Mark as fetching to avoid duplicate requests
      setUserCache(prev => ({
        ...prev,
        [userId]: { 
          ...prev[userId], 
          fetching: true 
        }
      }));
      
      // Fetch user details from API
      const response = await api.get(`/profile/getUserDetailsById/${userId}`);
      const userDetails = response.data.data;
      
      if (userDetails) {
        // Create a name from available data
        let name = '';
        if (userDetails.name) {
          name = userDetails.name;
        } else if (userDetails.firstName && userDetails.lastName) {
          name = `${userDetails.firstName} ${userDetails.lastName}`;
        } else if (userDetails.email) {
          name = userDetails.email.split('@')[0];
        } else {
          name = `User ${userId.substring(0, 8)}...`;
        }
        
        // Cache this user
        setUserCache(prev => ({
          ...prev,
          [userId]: { 
            name, 
            email: userDetails.email || '', 
            profilePicture: userDetails.profilePicture || '',
            fetching: false 
          }
        }));
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      setUserCache(prev => ({
        ...prev,
        [userId]: { ...prev[userId], fetching: false }
      }));
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFriendError('');
    
    try {
      await addFriend(newFriendEmail);
      setNewFriendEmail('');
      setShowAddFriend(false);
      toast.success('Friend added successfully');
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{message?: string}>;
      setAddFriendError(axiosError.response?.data?.message || 'Failed to add friend');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      setRemovingFriend(friendId);
      await removeFriend(friendId);
      toast.success('Friend removed successfully');
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{message?: string}>;
      toast.error(axiosError.response?.data?.message || 'Failed to remove friend');
    } finally {
      setRemovingFriend(null);
    }
  };

  const filteredFriends = friends.filter(friend => {
    const friendName = friend.name || getFriendName(friend._id);
    const friendEmail = friend.email || userCache[friend._id]?.email || '';
    
    return (
      friendName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friendEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Friends</h2>
          <button 
            onClick={() => setShowAddFriend(!showAddFriend)}
            className="bg-primary text-white p-2 rounded-full hover:bg-primary-dark transition"
          >
            <FaPlus />
          </button>
        </div>

        {showAddFriend && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Add a Friend</h3>
            {addFriendError && (
              <div className="bg-red-100 text-red-700 p-2 rounded mb-2">
                {addFriendError}
              </div>
            )}
            <form onSubmit={handleAddFriend} className="flex">
              <input 
                type="email" 
                value={newFriendEmail}
                onChange={(e) => setNewFriendEmail(e.target.value)}
                placeholder="Enter email address" 
                className="flex-1 p-2 border rounded-l"
                required
              />
              <button 
                type="submit" 
                className="bg-primary text-white px-4 py-2 rounded-r"
              >
                Add
              </button>
            </form>
          </div>
        )}

        <div className="mt-4 relative">
          <input
            type="text"
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border rounded"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-center">Loading friends...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-500">{error}</div>
      ) : (
        <div>
          {filteredFriends.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {searchTerm ? 'No friends found matching your search' : 'No friends yet. Add your first friend!'}
            </div>
          ) : (
            <ul className="divide-y">
              {filteredFriends.map(friend => {
                // Get the name from friend object or cache
                const displayName = friend.name || getFriendName(friend._id);
                const profilePic = friend.profilePicture || userCache[friend._id]?.profilePicture;
                const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : 'U';
                
                return (
                  <li key={friend._id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <Link href={`/friends/${friend._id}`} className="flex items-center flex-grow">
                        {profilePic ? (
                          <img 
                            src={profilePic} 
                            alt={displayName} 
                            className="w-12 h-12 rounded-full mr-4 object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mr-4">
                            {firstLetter}
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium">{displayName}</h3>
                          <p className="text-gray-500 text-sm">{friend.email || userCache[friend._id]?.email || ''}</p>
                        </div>
                      </Link>
                      <button 
                        onClick={() => handleRemoveFriend(friend._id)}
                        disabled={removingFriend === friend._id}
                        className="text-red-500 hover:text-red-700 p-2 rounded transition-colors"
                        title="Remove friend"
                      >
                        {removingFriend === friend._id ? (
                          <div className="w-5 h-5 border-t-2 border-red-500 border-solid rounded-full animate-spin"></div>
                        ) : (
                          <FaUserMinus />
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
} 