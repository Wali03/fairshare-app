'use client';

import { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';

export default function NotificationSection() {
  const [notifications, setNotifications] = useState({
    addedToGroup: true,
    addedAsFriend: true,
    expenseAdded: true,
    expenseEdited: true,
    expenseDeleted: true,
    chatMessage: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  
  // Fetch user's notification preferences on component mount
  useEffect(() => {
    const fetchNotificationPreferences = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const response = await api.get('/notifications/preferences');
        if (response.data.success) {
          setNotifications(response.data.preferences);
        }
      } catch (error) {
        console.error('Error fetching notification preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotificationPreferences();
  }, [user]);
  
  const handleToggle = (setting: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };
  
  const handleSave = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/notifications/preferences', { preferences: notifications });
      
      if (response.data.success) {
        toast.success('Notification preferences saved');
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="card mb-6">
      <div className="flex items-center mb-6">
        <FaBell className="text-primary mr-3 text-xl" />
        <h2 className="text-xl font-bold">Notification Preferences</h2>
      </div>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-md font-semibold mb-4">Social</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm">When someone adds me to a group</label>
              <Switch 
                checked={notifications.addedToGroup}
                onCheckedChange={() => handleToggle('addedToGroup')}
                className="scale-90"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">When someone adds me as a friend</label>
              <Switch 
                checked={notifications.addedAsFriend}
                onCheckedChange={() => handleToggle('addedAsFriend')}
                className="scale-90"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-md font-semibold mb-4">Expenses</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm">When an expense is added</label>
              <Switch 
                checked={notifications.expenseAdded}
                onCheckedChange={() => handleToggle('expenseAdded')}
                className="scale-90"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">When an expense is edited</label>
              <Switch 
                checked={notifications.expenseEdited}
                onCheckedChange={() => handleToggle('expenseEdited')}
                className="scale-90"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm">When an expense is deleted</label>
              <Switch 
                checked={notifications.expenseDeleted}
                onCheckedChange={() => handleToggle('expenseDeleted')}
                className="scale-90"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">When someone sends a message</label>
              <Switch 
                checked={notifications.chatMessage}
                onCheckedChange={() => handleToggle('chatMessage')}
                className="scale-90"
                disabled={isLoading}
              />
            </div>
            
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <button 
          onClick={handleSave}
          className="btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
} 