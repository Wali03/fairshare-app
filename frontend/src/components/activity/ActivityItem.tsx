import { formatDistanceToNow } from 'date-fns';
import { Activity } from '@/lib/stores/activityStore';
import { useRouter } from 'next/navigation';
import { 
  FaUserPlus, 
  FaUsers, 
  FaUserMinus, 
  FaMoneyBill, 
  FaPlus, 
  FaUser,
  FaComment,
  FaUserSlash
} from 'react-icons/fa';

interface ActivityItemProps {
  activity: Activity;
  onMarkAsRead: (activityId: string) => void;
}

export default function ActivityItem({ activity, onMarkAsRead }: ActivityItemProps) {
  const router = useRouter();
  
  // Check if the activity involves a deleted user
  const isDeletedUserActivity = !activity.user || activity.desc?.includes('deleted their account');
  
  // Function to get the appropriate icon based on activity type
  const getActivityIcon = () => {
    // If this is a deleted user activity, show a special icon
    if (isDeletedUserActivity) {
      return <FaUserSlash className="text-gray-500 text-lg" />;
    }
    
    switch (activity.type) {
      case 'FRIEND_ADDED':
        return <FaUserPlus className="text-primary text-lg" />;
      case 'GROUP_ADDED':
        return <FaUsers className="text-primary text-lg" />;
      case 'GROUP_REMOVED':
        return <FaUserMinus className="text-red-500 text-lg" />;
      case 'EXPENSE_ADDED':
        return <FaMoneyBill className="text-green-500 text-lg" />;
      case 'GROUP_CREATED':
        return <FaPlus className="text-blue-500 text-lg" />;
      case 'GROUP_MEMBER_ADDED':
        return <FaUser className="text-purple-500 text-lg" />;
      case 'MESSAGE_RECEIVED':
        return <FaComment className="text-indigo-500 text-lg" />;
      case 'FRIEND_REQUEST':
        return <FaUserPlus className="text-primary text-lg" />;
      default:
        return <FaUser className="text-gray-500 text-lg" />;
    }
  };
  
  // Get profile image for the actor
  const getProfileImage = () => {
    // Handle deleted user case
    if (isDeletedUserActivity) {
      return null; // No profile image for deleted users
    }
    
    // For friend activities, check if we have a friend with an image
    if ((activity.type === 'FRIEND_ADDED' || activity.type === 'MESSAGE_RECEIVED') && activity.friend?.profileImage) {
      return activity.friend.profileImage;
    }
    
    // For group activities, use the group image if available
    if ((activity.type === 'GROUP_ADDED' || activity.type === 'GROUP_CREATED' || activity.type === 'MESSAGE_RECEIVED') && activity.group?.image) {
      return activity.group.image;
    }
    
    // Finally fall back to the actor's image
    return activity.actorImage;
  };
  
  // Calculate relative time
  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Some time ago';
    }
  };
  
  // Determine what to do when clicked
  const handleClick = () => {
    // Don't navigate for deleted user activities
    if (isDeletedUserActivity) {
      onMarkAsRead(activity._id);
      return;
    }
    
    // Mark as read if not already
    if (!activity.isRead) {
      onMarkAsRead(activity._id);
    }
    
    // Navigate to the relevant page based on activity type
    if (activity.group && (
      activity.type === 'GROUP_ADDED' || 
      activity.type === 'GROUP_CREATED' || 
      activity.type === 'GROUP_MEMBER_ADDED' ||
      (activity.type === 'MESSAGE_RECEIVED' && activity.group)
    )) {
      router.push(`/groups/${activity.group._id}`);
    } else if (activity.friend && (
      activity.type === 'FRIEND_ADDED' || 
      (activity.type === 'MESSAGE_RECEIVED' && !activity.group)
    )) {
      router.push(`/friends/${activity.friend._id}`);
    } else if (activity.expense && activity.type === 'EXPENSE_ADDED') {
      // For expenses, might want to navigate to a specific expense view
      // or the relevant group/friend that the expense is associated with
      if (activity.group) {
        router.push(`/groups/${activity.group._id}`);
      } else if (activity.friend) {
        router.push(`/friends/${activity.friend._id}`);
      }
    }
  };

  const profileImage = getProfileImage();
  
  return (
    <div 
      className={`p-4 border-b ${!activity.isRead ? 'bg-blue-50' : ''} hover:bg-gray-50 cursor-pointer`}
      onClick={handleClick}
    >
      <div className="flex">
        <div className="mr-3 mt-1">
          {profileImage ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <img
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
              {getActivityIcon()}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <p className={`text-gray-800 flex-1 ${isDeletedUserActivity ? 'italic' : ''}`}>{activity.desc}</p>
            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
              {getTimeAgo(activity.date)}
            </span>
          </div>
          
          {/* Additional details if relevant */}
          {activity.group && (
            <p className="text-sm text-gray-600 mt-1">
              Group: {activity.group.name}
            </p>
          )}
          
          {activity.expense && (
            <p className="text-sm text-gray-600 mt-1">
              Expense: {activity.expense.description} - ₹{activity.expense.amount}
            </p>
          )}
          
          {activity.message && (
            <p className="text-sm bg-gray-100 p-2 rounded mt-1 italic">
              &ldquo;{activity.message}&rdquo;
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 