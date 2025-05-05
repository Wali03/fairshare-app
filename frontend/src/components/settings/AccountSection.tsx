'use client';

import { useState } from 'react';
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { useAuthStore } from '@/lib/stores/authStore';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function AccountSection() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { deleteAccount, user } = useAuthStore();
  const router = useRouter();
  
  const handleRequestDelete = () => {
    setShowDeleteConfirm(true);
    setError('');
  };
  
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletePassword('');
    setError('');
  };
  
  const handleConfirmDelete = async () => {
    if (!deletePassword) {
      setError('Please enter your password to confirm account deletion');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // First verify the password
      await api.post('/auth/verify-password', {
        email: user?.email,
        password: deletePassword
      });
      
      // If password verification succeeds, delete the account
      await deleteAccount();
      
      // Redirect to login page after successful deletion
      router.push('/auth/login');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-6">Account</h2>
      
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-red-600 mb-4 flex items-center">
          <FaExclamationTriangle className="mr-2" />
          Danger Zone
        </h3>
        
        <p className="text-sm text-gray-500 mb-4">
          Once you delete your account, there is no going back. This is a permanent action.
        </p>
        
        {!showDeleteConfirm ? (
          <button 
            onClick={handleRequestDelete}
            className="btn-danger flex items-center justify-center"
          >
            <FaTrash className="mr-2" />
            Delete My Account
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h4 className="text-md font-medium text-red-700 mb-2">
              Are you absolutely sure?
            </h4>
            
            <p className="text-sm text-red-600 mb-4">
              This action cannot be undone. All your data, including expenses, groups, and personal information will be permanently deleted.
            </p>
            
            {error && (
              <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To verify, enter your password
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="Your password"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={handleCancelDelete}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="btn-danger"
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 