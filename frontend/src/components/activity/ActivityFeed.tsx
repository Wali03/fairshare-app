import { useEffect } from 'react';
import { useActivityStore } from '@/lib/stores/activityStore';
import ActivityItem from './ActivityItem';
import { FaCheckCircle } from 'react-icons/fa';

export default function ActivityFeed() {
  const { activities, isLoading, error, fetchActivities, markAsRead } = useActivityStore();
  
  useEffect(() => {
    fetchActivities();
    
    // Polling for new activities
    const interval = setInterval(() => {
      fetchActivities();
    }, 60000); // Check for new activities every minute
    
    return () => clearInterval(interval);
  }, [fetchActivities]);
  
  const handleMarkAsRead = async (activityId: string) => {
    await markAsRead([activityId]);
  };
  
  const handleMarkAllAsRead = async () => {
    const unreadActivityIds = activities
      .filter(activity => !activity.isRead)
      .map(activity => activity._id);
    
    if (unreadActivityIds.length > 0) {
      await markAsRead(unreadActivityIds);
    }
  };
  
  if (isLoading && activities.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse h-6 w-3/4 bg-gray-200 rounded mx-auto mb-4"></div>
        <div className="animate-pulse h-24 w-full bg-gray-200 rounded mb-4"></div>
        <div className="animate-pulse h-24 w-full bg-gray-200 rounded mb-4"></div>
        <div className="animate-pulse h-24 w-full bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>Failed to load activities: {error}</p>
        <button 
          onClick={() => fetchActivities()}
          className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (activities.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No activities to display yet.</p>
      </div>
    );
  }
  
  const hasUnreadActivities = activities.some(activity => !activity.isRead);
  
  return (
    <div className="space-y-4">
      {hasUnreadActivities && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <FaCheckCircle className="text-primary" />
            Mark all as read
          </button>
        </div>
      )}
      
      {activities.map((activity) => (
        <ActivityItem 
          key={activity._id} 
          activity={activity} 
          onMarkAsRead={handleMarkAsRead} 
        />
      ))}
    </div>
  );
} 