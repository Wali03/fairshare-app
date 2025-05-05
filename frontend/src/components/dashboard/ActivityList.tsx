import { Activity } from '@/types';
import { 
  FaShoppingBag, 
  FaExchangeAlt, 
  FaCommentAlt, 
  FaUserPlus, 
  FaClock
} from 'react-icons/fa';
import { format, formatDistance } from 'date-fns';

interface ActivityItemProps {
  activity: {
    id: string;
    type: 'expense' | 'payment' | 'group' | 'message';
    description: string;
    date: string;
    amount?: number;
    currency?: string;
    groupName?: string;
  };
}

function ActivityItem({ activity }: ActivityItemProps) {
  const { type, description, date, amount, currency = 'INR', groupName } = activity;
  
  // Format relative time like "2 days ago"
  const timeAgo = formatDistance(new Date(date), new Date(), { addSuffix: true });
  
  // Get the appropriate icon based on activity type
  const getActivityIcon = () => {
    switch (type) {
      case 'expense':
        return <FaShoppingBag />;
      case 'payment':
        return <FaExchangeAlt />;
      case 'message':
        return <FaCommentAlt />;
      case 'group':
        return <FaUserPlus />;
      default:
        return <FaClock />;
    }
  };
  
  return (
    <div className="flex items-start py-4 border-b border-gray-100 last:border-0">
      <div className="bg-gray-100 p-3 rounded-full mr-4">
        {getActivityIcon()}
      </div>
      
      <div className="flex-1">
        <p className="text-sm">{description}</p>
        
        {groupName && (
          <p className="text-xs text-gray-500 mt-1">
            in {groupName}
          </p>
        )}
        
        <div className="flex items-center mt-1">
          <p className="text-xs text-gray-500">{timeAgo}</p>
          
          {amount && (
            <>
              <span className="mx-2 text-gray-300">•</span>
              <p className="text-xs font-semibold text-warning">
                {currency === 'INR' ? '₹' : currency}{amount.toLocaleString()}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ActivityList() {
  // Mocked activity data
  const activities = [
    {
      id: '1',
      type: 'expense' as const,
      description: 'You added "Grocery shopping" expense',
      date: '2022-08-12T14:30:00',
      amount: 150,
      groupName: 'Roommates'
    },
    {
      id: '2',
      type: 'payment' as const,
      description: 'John paid you',
      date: '2022-08-11T09:15:00',
      amount: 75,
    },
    {
      id: '3',
      type: 'group' as const,
      description: 'You created "Trip to Paris" group',
      date: '2022-08-10T18:45:00',
    },
    {
      id: '4',
      type: 'message' as const,
      description: 'Mike commented on "Dinner" expense',
      date: '2022-08-09T12:30:00',
      groupName: 'Weekly Lunch'
    },
    {
      id: '5',
      type: 'expense' as const,
      description: 'Sarah added "Medical check-up" expense',
      date: '2022-08-09T10:15:00',
      amount: 2154,
      groupName: 'Family'
    }
  ];
  
  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Recent Activity</h3>
        <button className="text-sm text-accent">View all</button>
      </div>
      
      <div className="divide-y divide-gray-100">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
} 