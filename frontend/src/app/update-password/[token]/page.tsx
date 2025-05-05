'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useUserStore } from '@/lib/stores/userStore';
import Link from 'next/link';

export default function UpdatePassword() {
  const { token } = useParams();
  const { resetPassword, isLoading, error } = useUserStore();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    setMessage({ type: '', text: '' });
    
    // Basic validation
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: "New password and confirm password don't match" });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      return;
    }
    
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: "Password must be at least 8 characters long" });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      return;
    }
    
    try {
      // Attempt to reset password
      await resetPassword(token as string, newPassword, confirmPassword);
      
      // Only if we reach here (no errors thrown), show success and set resetCompleted
      setMessage({ 
        type: 'success', 
        text: 'Password updated successfully! You can now log in with your new password.' 
      });
      
      // Only set resetCompleted to true upon successful password reset
      setResetCompleted(true);
    } catch (err: unknown) {
      // Handle error - don't set resetCompleted
      let errorMessage = error || 'Failed to update password. Please try again.';
      
      // Check for specific error messages from the server
      const errorResponse = err as { response?: { data?: { message?: string } } };
      if (errorResponse.response?.data?.message) {
        errorMessage = errorResponse.response.data.message;
      }
      
      // Set error message
      setMessage({ type: 'error', text: errorMessage });
      
      // Ensure resetCompleted remains false so no redirect happens
      setResetCompleted(false);
      
      // Keep the form values so user can correct and try again
      setTimeout(() => setMessage({ type: '', text: '' }), 6000);
    }
  };
  
  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Update Your Password</h1>
        
        {message.text && (
          <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}
        
        {resetCompleted ? (
          <div className="text-center">
            <Link href="/auth/login" className="btn-primary block w-full">
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <FaLock className="mr-2 text-gray-500" />
                    <span>New Password</span>
                  </div>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    required
                    minLength={8}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 8 characters long.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <FaLock className="mr-2 text-gray-500" />
                    <span>Confirm New Password</span>
                  </div>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    required
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 