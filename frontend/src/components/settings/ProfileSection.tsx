'use client';

import { useState, useEffect, useRef } from 'react';
import { FaCamera, FaUser, FaCalendarAlt, FaVenusMars, FaPhone, FaInfo } from 'react-icons/fa';
import { useUserStore } from '@/lib/stores/userStore';

export default function ProfileSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, fetchUserDetails, updateProfile, uploadProfilePicture, isLoading, error } = useUserStore();
  
  const [profile, setProfile] = useState({
    name: '',
    dob: '',
    gender: '',
    contact: '',
    about: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);
  
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        dob: user.additionalDetails?.dateOfBirth || '',
        gender: user.additionalDetails?.gender || '',
        contact: user.additionalDetails?.contactNumber || '',
        about: user.additionalDetails?.about || ''
      });
    }
  }, [user]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile({
        name: profile.name,
        additionalDetails: {
          dateOfBirth: profile.dob,
          gender: profile.gender,
          contactNumber: profile.contact,
          about: profile.about
        }
      });
      
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: error || 'Failed to update profile' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };
  
  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ 
        type: 'error', 
        text: 'Invalid file type. Only JPEG, PNG, JPG and GIF are allowed.' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setMessage({ 
        type: 'error', 
        text: 'File too large. Maximum size is 5MB.' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    
    try {
      // Show loading state
      setMessage({ type: 'info', text: 'Uploading profile picture...' });
      
      await uploadProfilePicture(file);
      
      // Show success message
      setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err: unknown) {
      console.error('Error uploading profile picture:', err);
      
      // Try to extract detailed error message
      const errorResponse = err as { response?: { data?: { message?: string } } };
      const errorMsg = errorResponse.response?.data?.message || error || 'Failed to upload profile picture';
      
      setMessage({ type: 'error', text: errorMsg });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };
  
  if (!user) {
    return <div className="card mb-6 p-6">Loading profile data...</div>;
  }
  
  return (
    <div className="card mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Personal Information</h2>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="btn-secondary text-sm"
          >
            Edit Profile
          </button>
        )}
      </div>
      
      {message.text && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 
          message.type === 'error' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="flex items-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {user.image ? (
              <img
                src={user.image}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="bg-primary text-white text-2xl font-bold flex items-center justify-center w-full h-full">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
          <button 
            onClick={handleProfilePictureClick}
            className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 text-white hover:bg-blue-600 transition-colors"
          >
            <FaCamera size={14} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
        
        <div className="ml-6">
          <h3 className="text-lg font-medium">{user.name}</h3>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>
      
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <FaUser className="mr-2 text-gray-500" />
                  <span>Full Name</span>
                </div>
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2 text-gray-500" />
                  <span>Date of Birth</span>
                </div>
              </label>
              <input
                type="date"
                name="dob"
                value={profile.dob}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <FaVenusMars className="mr-2 text-gray-500" />
                  <span>Gender</span>
                </div>
              </label>
              <select
                name="gender"
                value={profile.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <FaPhone className="mr-2 text-gray-500" />
                  <span>Contact Number</span>
                </div>
              </label>
              <input
                type="text"
                name="contact"
                value={profile.contact}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <FaInfo className="mr-2 text-gray-500" />
                  <span>About</span>
                </div>
              </label>
              <textarea
                name="about"
                value={profile.about}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-4 mt-6">
            <button 
              type="button" 
              onClick={() => setIsEditing(false)}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Full Name</p>
            <p className="font-medium">{profile.name || 'Not provided'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Date of Birth</p>
            <p className="font-medium">{profile.dob ? new Date(profile.dob).toLocaleDateString() : 'Not provided'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Gender</p>
            <p className="font-medium">{profile.gender || 'Not provided'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Contact Number</p>
            <p className="font-medium">{profile.contact || 'Not provided'}</p>
          </div>

          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">About</p>
            <p className="font-medium">{profile.about || 'Not provided'}</p>
          </div>
        </div>
      )}
    </div>
  );
} 