'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGroupStore } from '@/lib/stores/groupStore';
import { useExpenseStore } from '@/lib/stores/expenseStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { useUserStore } from '@/lib/stores/userStore';
import ChatComponent from '@/components/chat/ChatComponent';
import ExpandableExpensesList from '@/components/expenses/ExpandableExpensesList';
import GroupBalances from '@/components/balances/GroupBalances';
import AppLayout from '@/components/layout/AppLayout';
import { FaPlus, FaUserMinus } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

// Add this type definition after the imports
interface GroupMemberObject {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
}

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'chat' | 'expenses' | 'members' | 'balances'>('chat');
  const [userCache, setUserCache] = useState<{
    [key: string]: {
      name: string;
      email: string;
      fetching?: boolean;
    }
  }>({});
  
  const { 
    fetchGroupDetails, 
    currentGroup, 
    isLoading: groupLoading, 
    error: groupError,
    removeMemberFromGroup,
    getUserDetails,
    leaveGroup,
    deleteGroup
  } = useGroupStore();

  const {
    fetchGroupExpenses,
    groupExpenses,
    isLoading: expensesLoading,
    error: expensesError
  } = useExpenseStore();

  const { user } = useAuthStore();
  const { fetchCategories } = useCategoryStore();
  const { fetchAllUsers, getUserName: getUserNameFromStore } = useUserStore();

  useEffect(() => {
    if (id) {
      fetchGroupDetails(id as string);
      fetchGroupExpenses(id as string);
      fetchCategories();
      fetchAllUsers();
    }
  }, [id, fetchGroupDetails, fetchGroupExpenses, fetchCategories, fetchAllUsers]);

  const getUserName = (userId: string) => {
    if (!userId) return "Unknown User";
    
    // First check if we have cached this user
    if (userCache[userId]) {
      return userCache[userId].name || userCache[userId].email || userId;
    }
    
    // If user is current user
    if (user && userId === user._id) {
      return user.name || user.email || userId;
    }

    // Try to find the user in the group members
    if (currentGroup && currentGroup.people) {
      const member = currentGroup.people.find(person => {
        if (typeof person === 'string') {
          return person === userId;
        } else if (person && typeof person === 'object') {
          // Use type definition from earlier in the file
          const memberObj = person as GroupMemberObject;
          return (memberObj._id === userId || memberObj.id === userId);
        }
        return false;
      });

      if (member && typeof member === 'object') {
        const memberObj = member as GroupMemberObject;
        if (memberObj.name) return memberObj.name;
        if (memberObj.email) return memberObj.email.split('@')[0];
      }
    }
    
    // If not found in the group, try to get from all users store
    const userNameFromStore = getUserNameFromStore(userId);
    if (userNameFromStore && !userNameFromStore.startsWith('User ')) {
      // Instead of updating state during render, schedule it for the next cycle
      // This avoids the "Cannot update during rendering" error
      setTimeout(() => {
        setUserCache(prev => ({
          ...prev,
          [userId]: { name: userNameFromStore, email: '', fetching: false }
        }));
      }, 0);
      
      return userNameFromStore;
    }
    
    // Trigger async fetch but return a formatted ID for now
    // Use setTimeout to avoid setState during render
    setTimeout(() => {
      fetchUserDetails(userId);
    }, 0);
    
    // If userId looks like an email, extract username part
    if (typeof userId === 'string' && userId.includes('@')) {
      return userId.split('@')[0];
    }
    
    // Format user ID to look better
    const shortId = userId.length > 8 ? userId.substring(0, 8) + '...' : userId;
    return `User ${shortId}`;
  };

  // Update fetchUserDetails to match the UserDetails type
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
      const userDetails = await getUserDetails(userId);
      
      if (userDetails) {
        let name = '';
        
        if (userDetails.firstName && userDetails.lastName) {
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

  // Add a handler for adding new members to the group
  const handleAddMember = async (email: string) => {
    if (!currentGroup || !email) return;
    
    try {
      await api.post('/group/addPeopleInGroup', { 
        groupId: currentGroup._id, 
        emails: [email]
      });
      
      toast.success(`Added ${email} to the group`);
      // Refresh group details
      fetchGroupDetails(currentGroup._id);
    } catch (error: unknown) {
      // Handle errors in a type-safe way
      const errorMessage = 
        error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object' && 'data' in error.response && 
        error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
          ? String(error.response.data.message)
          : 'Failed to add member to group';
          
      toast.error(errorMessage);
    }
  };

  // Update the handleRemoveMember function
  const handleRemoveMember = async (memberId: string) => {
    if (!currentGroup) return;
    
    try {
      await removeMemberFromGroup(currentGroup._id, memberId);
      toast.success('Member removed successfully');
      fetchGroupDetails(currentGroup._id);
    } catch {
      toast.error('Failed to remove member');
    }
  };

  // Update the handleLeaveGroup function to fix TypeScript errors
  const handleLeaveGroup = async () => {
    if (!currentGroup) return;
    
    try {
      await leaveGroup(currentGroup._id);
      toast.success('You left the group successfully');
      router.push('/groups');
    } catch (error: unknown) {
      const errorMessage = 
        error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object' && 'data' in error.response && 
        error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
          ? String(error.response.data.message)
          : 'Failed to leave group';
          
      toast.error(errorMessage);
    }
  };

  // Update the handleDeleteGroup function to fix TypeScript errors
  const handleDeleteGroup = async () => {
    if (!currentGroup) return;
    
    try {
      await deleteGroup(currentGroup._id);
      toast.success('Group deleted successfully');
      router.push('/groups');
    } catch (error: unknown) {
      const errorMessage = 
        error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object' && 'data' in error.response && 
        error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
          ? String(error.response.data.message)
          : 'Failed to delete group';
          
      toast.error(errorMessage);
    }
  };

  if (groupLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (groupError || !currentGroup) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {groupError || 'Group not found'}
      </div>
    );
  }
  console.log(currentGroup)
  return (
    <AppLayout>
      <div className="container mx-auto p-2 md:p-4 flex flex-col">
        {/* Group header with responsive layout */}
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4 md:mb-6">
          {/* Group image/avatar */}
          <div className="flex items-center mb-3 md:mb-0">
            {currentGroup.image ? (
              <img 
                src={currentGroup.image} 
                alt={currentGroup.name} 
                className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary flex items-center justify-center text-white text-lg md:text-xl font-bold">
                {currentGroup.name.charAt(0)}
              </div>
            )}
            
            {/* Group name and description */}
            <div className="ml-3">
              <h1 className="text-xl md:text-2xl font-bold">{currentGroup.name}</h1>
              <p className="text-gray-600 text-sm hidden md:block">{currentGroup.description || 'No description'}</p>
            </div>
          </div>
          
          {/* Action buttons - move below on small screens */}
          <div className="flex flex-wrap gap-2 md:ml-auto mt-2 md:mt-0">
            {user && currentGroup && user._id !== currentGroup.admin && (
              <button 
                className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1.5 md:px-4 md:py-2 rounded"
                onClick={() => {
                  if (window.confirm("Are you sure you want to leave this group?")) {
                    handleLeaveGroup();
                  }
                }}
              >
                Leave Group
              </button>
            )}
            
            {user && currentGroup && user._id === currentGroup.admin && (
              <button 
                className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1.5 md:px-4 md:py-2 rounded"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
                    handleDeleteGroup();
                  }
                }}
              >
                Delete Group
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-3 px-4 md:py-4 md:px-6 text-center border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                  activeTab === 'chat'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`py-3 px-4 md:py-4 md:px-6 text-center border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                  activeTab === 'expenses'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Expenses
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`py-3 px-4 md:py-4 md:px-6 text-center border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                  activeTab === 'members'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Members {currentGroup.people ? `(${currentGroup.people.length})` : ''}
              </button>
              <button
                onClick={() => setActiveTab('balances')}
                className={`py-3 px-4 md:py-4 md:px-6 text-center border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                  activeTab === 'balances'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Balances
              </button>
            </nav>
          </div>

          <div className="flex-1 overflow-x-auto">
            {activeTab === 'chat' && (
              <ChatComponent
                targetId={id as string}
                isFriendChat={false}
                targetName={currentGroup.name}
              />
            )}
            
            {activeTab === 'expenses' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Group Expenses</h2>
                  
                  <div className="flex gap-3">
                    <button 
                      className="btn-primary flex items-center gap-2"
                      onClick={() => {
                        // Redirect to the main expenses page with query parameters
                        router.push(`/expenses?type=group&id=${id}`);
                      }}
                    >
                      <FaPlus size={14} />
                      <span>Add Group Expense</span>
                    </button>
                  </div>
                </div>
                
                <div className="card overflow-hidden">
                  <ExpandableExpensesList
                    expenses={groupExpenses}
                    isLoading={expensesLoading}
                    error={expensesError}
                    getUserName={getUserName}
                    currentUserId={user?._id}
                  />
                </div>
              </div>
            )}
            
            {activeTab === 'members' && (
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <h2 className="text-xl font-semibold">Group Members</h2>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded flex items-center gap-2"
                      onClick={() => {
                        const email = prompt("Enter the email of the person you want to add:");
                        if (email) {
                          handleAddMember(email);
                        }
                      }}
                    >
                      <span>Add Member</span>
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentGroup && currentGroup.people && currentGroup.people.map((member, index) => {
                    // Handle member data safely regardless of format
                    let memberId = '';
                    let memberEmail = '';
                    let displayName = '';
                    
                    if (typeof member === 'string') {
                      memberId = member;
                      // Try to get from cache
                      if (userCache[memberId]) {
                        displayName = userCache[memberId].name || '';
                        memberEmail = userCache[memberId].email || '';
                      } else {
                        // Trigger fetch if not in cache
                        fetchUserDetails(memberId);
                        // Use short ID format for display until data is fetched
                        displayName = `User ${memberId.substring(0, 8)}...`;
                      }
                    } else if (member && typeof member === 'object') {
                      // Use explicit type definition to avoid 'any' error
                      type MemberObject = {
                        _id?: string;
                        id?: string;
                        name?: string;
                        email?: string;
                      };
                      
                      const memberObj = member as MemberObject;
                      memberId = String(memberObj._id || memberObj.id || '');
                      memberEmail = String(memberObj.email || '');
                      
                      // Derive display name from available data
                      if (memberObj.name) {
                        displayName = memberObj.name;
                      } else if (memberEmail && memberEmail.includes('@')) {
                        displayName = memberEmail.split('@')[0];
                      } else {
                        displayName = memberEmail || `User ${memberId.substring(0, 8)}...`;
                      }
                    }
                    
                    const isAdmin = currentGroup && memberId === currentGroup.admin;
                    const isCurrentUser = user && memberId === user._id;
                    const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : 'U';
                    
                    return (
                      <div 
                        key={`member-${memberId || index}`} 
                        className="border rounded-lg p-4 flex items-center gap-3 hover:shadow-md transition-shadow relative"
                      >
                        <div className="min-w-[3rem] w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xl font-semibold flex-shrink-0">
                          {firstLetter}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {isAdmin ? (
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="truncate">{displayName}</span>
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded ml-2 whitespace-nowrap">Admin</span>
                              </div>
                            ) : (
                              <span className="truncate">{displayName}</span>
                            )}
                          </div>
                          {memberEmail && (
                            <div className="text-sm text-gray-500 truncate">{memberEmail}</div>
                          )}
                        </div>
                        {user && currentGroup && user._id === currentGroup.admin && !isCurrentUser && (
                          <button 
                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 flex-shrink-0 absolute right-2"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to remove ${displayName} from the group?`)) {
                                handleRemoveMember(memberId);
                              }
                            }}
                            aria-label="Remove member"
                          >
                            <FaUserMinus size={20} className="text-red-500" />
                          </button>
                        )}
                        {isCurrentUser && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded whitespace-nowrap">You</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'balances' && (
              <div>
                <div className="m-6">
                  <h2 className="text-xl font-semibold">Group Balances</h2>
                  <p className="text-gray-500">See who owes money and suggested settlements</p>
                </div>
                
                <div className="card p-6">
                  <GroupBalances
                    groupId={id as string}
                    getUserName={getUserName}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 