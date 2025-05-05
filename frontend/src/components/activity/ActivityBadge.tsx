import { useEffect } from 'react';
import { useActivityStore } from '@/lib/stores/activityStore';
import { useRouter } from 'next/navigation';
import { FaBell } from 'react-icons/fa';

interface ActivityBadgeProps {
  className?: string;
}

export default function ActivityBadge({ className = '' }: ActivityBadgeProps) {
  const { unreadCount, getUnreadCount } = useActivityStore();
  const router = useRouter();
  
  useEffect(() => {
    getUnreadCount();
    
    // Polling for new activities
    const interval = setInterval(() => {
      getUnreadCount();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [getUnreadCount]);
  
  const handleClick = () => {
    router.push('/activity');
  };
  
  return (
    <button 
      onClick={handleClick}
      className={`relative p-2 rounded-full hover:bg-gray-100 ${className}`}
      aria-label="Notifications"
    >
      <FaBell className="text-gray-600" size={18} />
      
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
} 