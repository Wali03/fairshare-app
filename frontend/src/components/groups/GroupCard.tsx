'use client';

import { useState } from 'react';
import { FaUsers, FaMoneyBillAlt, FaCommentAlt, FaSignOutAlt, FaTrash } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useGroupStore } from '@/lib/stores/groupStore';
import { toast } from 'react-hot-toast';

interface GroupCardProps {
  group: {
    _id: string;
    name: string;
    people: string[];
    description?: string;
    admin?: string;
    image?: string;
  };
}

export default function GroupCard({ group }: GroupCardProps) {
  const { _id, name, people, image } = group;
  const router = useRouter();
  const { leaveGroup, deleteGroup } = useGroupStore();
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  
  const memberCount = people ? people.length : 0;
  // We'll use a random color if none is provided
  const colorClasses = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-yellow-500'];
  const color = colorClasses[Math.floor(Math.random() * colorClasses.length)];

  const handleOpenChat = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/groups/${_id}/chat`);
  };
  
  const handleLeaveGroup = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to leave the group "${name}"?`)) {
      setIsLeaving(true);
      setError('');
      
      try {
        await leaveGroup(_id);
        toast.success(`You've left the group "${name}"`);
        // No need to navigate - the group will be removed from the list
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message || 'Failed to leave group');
        toast.error('Failed to leave group');
        setIsLeaving(false);
      }
    }
  };
  
  const handleDeleteGroup = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete the group "${name}"? This action cannot be undone.`)) {
      setIsDeleting(true);
      setError('');
      
      try {
        await deleteGroup(_id);
        toast.success(`Group "${name}" has been deleted`);
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message || 'Failed to delete group');
        toast.error('Failed to delete group');
        setIsDeleting(false);
      }
    }
  };
  
  return (
    <Link href={`/groups/${_id}`}>
      <div className="card hover:shadow-lg transition-shadow cursor-pointer relative p-3 md:p-4">
        {error && (
          <div className="absolute top-0 left-0 right-0 bg-red-100 text-red-700 p-2 text-sm text-center">
            {error}
          </div>
        )}
        
        <div className="flex items-center mb-4">
          {image ? (
            <img 
              src={image} 
              alt={name} 
              className="w-10 h-10 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white ${color} flex-shrink-0`}>
              <FaUsers className="text-lg md:text-xl" />
            </div>
          )}
          <div className="ml-3 flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-medium truncate">{name}</h3>
            <p className="text-xs md:text-sm text-gray-500">{memberCount} members</p>
          </div>
          <div className="flex space-x-1">
            <Button 
              onClick={handleDeleteGroup}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-800 hover:bg-red-50 h-6 w-6 xl:h-10 xl:w-10 p-1"
              title="Delete Group"
            >
              {isDeleting ? (
                <div className="w-4 h-4 md:w-5 md:h-5 border-t-2 border-red-500 border-solid rounded-full animate-spin"></div>
              ) : (
                <FaTrash className="h-3 w-3 md:h-4 md:w-4" />
              )}
            </Button>
            <Button 
              onClick={handleLeaveGroup}
              disabled={isLeaving}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 xl:h-10 xl:w-10 p-1"
              title="Leave Group"
            >
              {isLeaving ? (
                <div className="w-4 h-4 md:w-5 md:h-5 border-t-2 border-red-500 border-solid rounded-full animate-spin"></div>
              ) : (
                <FaSignOutAlt className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </Button>
            <Button 
              onClick={handleOpenChat}
              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-6 w-6 xl:h-10 xl:w-10 p-1"
              title="Chat"
            >
              <FaCommentAlt className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-3 md:pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <FaMoneyBillAlt className="text-gray-400 mr-2 text-sm md:text-base" />
              <span className="text-xs md:text-sm text-gray-500">Group Info</span>
            </div>
          </div>
          
          <p className="text-xs md:text-sm text-gray-500 line-clamp-2">
            {group.description || 'No description provided.'}
          </p>
        </div>
      </div>
    </Link>
  );
} 