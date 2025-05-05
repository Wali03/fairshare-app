'use client';

import { useState } from 'react';
import { FaLock, FaEye, FaEyeSlash, FaQuestion } from 'react-icons/fa';
import { useUserStore } from '@/lib/stores/userStore';

export default function PasswordSection() {
  const { changePassword, resetPasswordRequest, isLoading, error } = useUserStore();
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: "New password and confirm password don't match" });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: "Password must be at least 8 characters long" });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    
    try {
      await changePassword(
        passwordData.currentPassword, 
        passwordData.newPassword,
        passwordData.confirmPassword
      );
      
      // Show success message
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      // Handle specific error for incorrect current password
      if (err.response?.status === 401) {
        setMessage({ type: 'error', text: "Current password is incorrect" });
      } else {
        setMessage({ type: 'error', text: error || 'Failed to change password' });
      }
      
      // Keep the form values so user can correct and try again
      // Don't reset the form or redirect
      
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };
  
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ type: 'error', text: "Please enter your email" });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    
    try {
      await resetPasswordRequest(email);
      
      // Show success message
      setMessage({ 
        type: 'success', 
        text: 'Password reset link has been sent to your email. Please check your inbox.' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      
      // Reset form and hide the forgot password section only on success
      setEmail('');
      setShowForgotPassword(false);
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      const errorMsg = errorResponse.response?.data?.message || error || 'Failed to send password reset email';
      
      setMessage({ type: 'error', text: errorMsg });
      
      // Keep the form visible and the email value intact for correction
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };
  
  return (
    <div className="card mb-6">
      <h2 className="text-xl font-bold mb-6">Password Management</h2>
      
      {message.text && (
        <div className={`mb-4 p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}
      
      {showForgotPassword ? (
        <div>
          <p className="mb-4 text-gray-600">
            Enter your email address, and we'll send you a link to reset your password.
          </p>
          
          <form onSubmit={handleForgotPassword} className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                required
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button 
                type="button" 
                className="text-primary hover:underline"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to change password
              </button>
              
              <button 
                type="submit" 
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <FaLock className="mr-2 text-gray-500" />
                    <span>Current Password</span>
                  </div>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    required
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <FaLock className="mr-2 text-gray-500" />
                    <span>New Password</span>
                  </div>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    required
                    minLength={8}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
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
                    type={showPasswords.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    required
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <button 
                type="button" 
                className="flex items-center text-primary hover:underline"
                onClick={() => setShowForgotPassword(true)}
              >
                <FaQuestion className="mr-1" size={12} /> 
                Forgot password?
              </button>
              
              <button 
                type="submit" 
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 