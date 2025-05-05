import { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import ExpenseForm from './ExpenseForm';
import ExpandableExpensesList from './ExpandableExpensesList';
import { useExpenseStore } from '@/lib/stores/expenseStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { useFriendStore } from '@/lib/stores/friendStore';
import { useGroupStore } from '@/lib/stores/groupStore';
import { useCategoryStore } from '@/lib/stores/categoryStore';
import { useUserStore } from '@/lib/stores/userStore';

interface ExpenseListProps {
  initialType?: 'friend' | 'group' | null;
  initialTargetId?: string | null;
}

interface GroupMemberObject {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export default function ExpenseList({ initialType, initialTargetId }: ExpenseListProps = {}) {
  const [showExpenseForm, setShowExpenseForm] = useState(!!initialType && !!initialTargetId);
  const { fetchUserExpenses, expenses, isLoading, error } = useExpenseStore();
  const { user } = useAuthStore();
  const { friends, fetchFriends } = useFriendStore();
  const { groups, fetchGroups } = useGroupStore();
  const { fetchCategories } = useCategoryStore();
  const { fetchAllUsers, getUserName: getUserNameFromStore } = useUserStore();
  
  useEffect(() => {
    fetchUserExpenses();
    fetchFriends();
    fetchGroups();
    fetchCategories();
    fetchAllUsers(); // Fetch all users for name lookups
  }, [fetchUserExpenses, fetchFriends, fetchGroups, fetchCategories, fetchAllUsers]);

  // Show expense form if initialType and initialTargetId are provided
  useEffect(() => {
    if (initialType && initialTargetId) {
      setShowExpenseForm(true);
    }
  }, [initialType, initialTargetId]);

  const handleAddExpense = () => {
    setShowExpenseForm(true);
  };

  const handleExpenseSubmit = () => {
    fetchUserExpenses();
    setShowExpenseForm(false);
  };

  const getUserName = (userId: string): string => {
    // Handle null/undefined userId (might happen if user was deleted)
    if (!userId) {
      return 'Deleted User';
    }
    
    // First check if this is the current user
    if (user) {
      if ((user.id && user.id === userId) || (user._id && user._id === userId)) {
        return user.name || 'You';
      }
    }
    
    // Try to find the friend by _id
    const friend = friends.find((f) => f._id === userId);
    if (friend) return friend.name;
    
    // Try to find in groups
    for (const group of groups) {
      // If group has detailed people objects
      if (group.people && Array.isArray(group.people)) {
        const groupMember = group.people.find(person => {
          if (typeof person === 'string') {
            return person === userId;
          } else if (person && typeof person === 'object') {
            const memberObj = person as GroupMemberObject;
            return (memberObj._id === userId || memberObj.id === userId);
          }
          return false;
        });
        
        if (groupMember) {
          if (typeof groupMember === 'object') {
            const memberObj = groupMember as GroupMemberObject;
            if (memberObj.name) return memberObj.name;
            if (memberObj.firstName && memberObj.lastName) {
              return `${memberObj.firstName} ${memberObj.lastName}`;
            }
            if (memberObj.email) return memberObj.email.split('@')[0]; // Get username from email
          }
          return `Group member (${group.name || 'Unknown group'})`;
        }
      }
    }
    
    // If not found in friends or groups, try to get from all users store
    const userNameFromStore = getUserNameFromStore(userId);
    if (userNameFromStore && !userNameFromStore.startsWith('User ')) {
      return userNameFromStore;
    }
    
    // Return a consistent name for deleted users
    return 'Deleted User';
  };

  return (
    <div className="bg-white rounded-lg p-3 md:p-6 shadow-md">
      {showExpenseForm ? (
        <div>
          <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6">
            {initialType === 'friend' ? 'Add Friend Expense' : 
             initialType === 'group' ? 'Add Group Expense' : 
             'Add New Expense'}
          </h2>
          <ExpenseForm
            onCancel={() => setShowExpenseForm(false)}
            onSubmit={handleExpenseSubmit}
            initialType={initialType || undefined}
            initialTargetId={initialTargetId || undefined}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 md:mb-6">
            <div>
              <h2 className="text-lg md:text-xl font-bold">All Expenses</h2>
              <p className="text-xs md:text-sm text-gray-500">
                {!isLoading && `Showing ${expenses.length} expenses`}
              </p>
            </div>
            <div className="flex gap-2 md:gap-3 self-end sm:self-auto mt-2 sm:mt-0">
              <button
                className="btn-outline-primary flex items-center gap-1 md:gap-2 text-xs md:text-sm py-1.5 px-2 md:py-2 md:px-3"
                onClick={() => {
                  /* Implement filter UI later */
                }}
              >
                {/* <FaFilter size={12} className="md:text-base" />
                <span>Filter</span> */}
              </button>
              <button
                className="btn-primary flex items-center gap-1 md:gap-2 text-xs md:text-sm py-1.5 px-2 md:py-2 md:px-3"
                onClick={handleAddExpense}
              >
                <FaPlus size={12} className="md:text-base" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <ExpandableExpensesList
              expenses={expenses}
              isLoading={isLoading}
              error={error}
              getUserName={getUserName}
              currentUserId={user?._id}
            />
          </div>
        </>
      )}
    </div>
  );
} 