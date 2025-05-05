'use client';

import { useState, useEffect } from 'react';
import GroupCard from './GroupCard';
import { FaPlus, FaSearch, FaImage, FaUser } from 'react-icons/fa';
import { useGroupStore } from '@/lib/stores/groupStore';
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

export default function GroupList() {
  const { groups, fetchGroups, createGroup, isLoading, error } = useGroupStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupData, setNewGroupData] = useState({ 
    name: '', 
    description: '', 
    emails: [] as string[],
    image: ''
  });
  const [emailInput, setEmailInput] = useState('');
  const [createGroupError, setCreateGroupError] = useState('');

  useEffect(() => {
    console.log('Fetching groups...');
    fetchGroups()
      .then(() => {
        // Access groups from the store rather than dependency array
        const currentGroups = useGroupStore.getState().groups;
        console.log('Groups fetched:', currentGroups);
      })
      .catch((err: Error) => {
        console.error('Error fetching groups:', err);
      });
  }, [fetchGroups]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateGroupError('');
    
    if (newGroupData.name.trim() === '') {
      setCreateGroupError('Group name is required');
      return;
    }
    
    try {
      await createGroup(newGroupData);
      setNewGroupData({ name: '', description: '', emails: [], image: '' });
      setShowCreateGroup(false);
      toast.success('Group created successfully');
    } catch (error) {
      const axiosError = error as AxiosError<{message?: string}>;
      setCreateGroupError(axiosError.response?.data?.message || 'Failed to create group');
    }
  };

  const addEmail = () => {
    if (emailInput.trim() === '') return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      setCreateGroupError('Please enter a valid email address');
      return;
    }
    
    // Check if email already exists in the list
    if (newGroupData.emails.includes(emailInput)) {
      setCreateGroupError('This email is already added');
      return;
    }
    
    setNewGroupData({
      ...newGroupData,
      emails: [...newGroupData.emails, emailInput]
    });
    setEmailInput('');
    setCreateGroupError('');
  };

  const removeEmail = (email: string) => {
    setNewGroupData({
      ...newGroupData,
      emails: newGroupData.emails.filter(e => e !== email)
    });
  };

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="p-4 md:p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h2 className="text-xl font-semibold">Your Groups</h2>
          <button 
            onClick={() => setShowCreateGroup(!showCreateGroup)}
            className="bg-primary text-white p-2 rounded-full hover:bg-primary-dark transition w-10 h-10 flex items-center justify-center self-end sm:self-auto"
          >
            <FaPlus />
          </button>
        </div>

        {showCreateGroup && (
          <div className="mt-4 p-3 md:p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Create a New Group</h3>
            {createGroupError && (
              <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-sm">
                {createGroupError}
              </div>
            )}
            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label htmlFor="groupName" className="block text-sm font-medium mb-1">Group Name *</label>
                <input 
                  type="text" 
                  id="groupName"
                  value={newGroupData.name}
                  onChange={(e) => setNewGroupData({...newGroupData, name: e.target.value})}
                  placeholder="Enter group name" 
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label htmlFor="groupImage" className="block text-sm font-medium mb-1">Group Image URL (optional)</label>
                <div className="flex">
                  <input 
                    type="text" 
                    id="groupImage"
                    value={newGroupData.image}
                    onChange={(e) => setNewGroupData({...newGroupData, image: e.target.value})}
                    placeholder="Enter image URL" 
                    className="w-full p-2 border rounded-l"
                  />
                  <div className="bg-gray-100 px-3 flex items-center border border-l-0 rounded-r">
                    <FaImage className="text-gray-500" />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="groupMembers" className="block text-sm font-medium mb-1">Add Members (by email)</label>
                <div className="flex mb-2">
                  <input 
                    type="email" 
                    id="groupMembers"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                    placeholder="Enter email address" 
                    className="w-full p-2 border rounded-l"
                  />
                  <button 
                    type="button"
                    onClick={addEmail}
                    className="bg-primary text-white px-4 py-2 rounded-r"
                  >
                    Add
                  </button>
                </div>
                
                {/* Display added emails */}
                {newGroupData.emails.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Added members:</p>
                    <div className="flex flex-wrap gap-2">
                      {newGroupData.emails.map(email => (
                        <div 
                          key={email} 
                          className="flex items-center bg-gray-100 px-3 py-1 rounded-full"
                        >
                          <FaUser className="text-gray-500 mr-2 text-xs" />
                          <span className="text-sm truncate max-w-[150px]">{email}</span>
                          <button 
                            type="button"
                            onClick={() => removeEmail(email)}
                            className="ml-2 text-red-500 hover:text-red-700 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="groupDescription" className="block text-sm font-medium mb-1">Description (optional)</label>
                <textarea 
                  id="groupDescription"
                  value={newGroupData.description}
                  onChange={(e) => setNewGroupData({...newGroupData, description: e.target.value})}
                  placeholder="Enter group description" 
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreateGroup(false)}
                  className="px-3 py-2 text-sm md:px-4 md:py-2 md:text-base border rounded text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-primary text-white px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded hover:bg-primary-dark"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-4 relative">
          <input
            type="text"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border rounded"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="p-4 md:p-6 text-center">Loading groups...</div>
      ) : error ? (
        <div className="p-4 md:p-6 text-center text-red-500">{error}</div>
      ) : (
        <div className="p-4 md:p-6">
          {filteredGroups.length === 0 ? (
            <div className="text-center text-gray-500">
              {searchTerm ? 'No groups found matching your search' : 'No groups yet. Create your first group!'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {filteredGroups.map((group, index) => (
                <GroupCard key={group._id || `group-${index}`} group={group} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 