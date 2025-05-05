import { BalanceData } from '@/lib/services/dashboardService';
import { useAuthStore } from '@/lib/stores/authStore';

interface BalanceCardProps {
  balance?: number;
  cardNumber?: string;
  userName?: string;
  balanceData?: BalanceData;
  isLoading?: boolean;
}

export default function BalanceCard({ 
  balance: propBalance, 
  cardNumber = '•••• •••• •••• ••••', 
  userName,
  balanceData,
  isLoading
}: BalanceCardProps) {
  const { user } = useAuthStore();
  const displayName = userName || user?.name || 'USER';
  
  // Use balance from props or from balanceData
  const balance = balanceData ? balanceData.netBalance : propBalance || 0;
  
  // Format card number with spaces every 4 digits
  const formattedCardNumber = cardNumber 
    ? cardNumber.replace(/(.{4})/g, '$1 ').trim() 
    : '•••• •••• •••• ••••';
  
  return (
    <div className="card h-full relative overflow-hidden bg-primary text-white">
      <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-opacity-10 bg-white rounded-full transform translate-x-1/4 translate-y-1/4"></div>
      
      <h2 className="text-lg font-medium mb-4">My balance</h2>
      
      <div>
        {isLoading ? (
          <div className="animate-pulse h-10 w-40 bg-white/20 rounded mb-2"></div>
        ) : (
          <p className="text-3xl font-bold">₹{balance.toLocaleString()}</p>
        )}
        <div className="flex mt-2 text-gray-300 text-sm">
          <p>{formattedCardNumber}</p>
        </div>
        <div className="mt-2 text-gray-300 text-sm">
          <p>{displayName.toUpperCase()}</p>
        </div>
        
        {balanceData && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-300">You lent</p>
              <p className="text-xl mt-1">₹{balanceData.lent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-300">You owe</p>
              <p className="text-xl mt-1">₹{balanceData.owed.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 