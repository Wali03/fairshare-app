'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaUser, FaMoneyBillAlt, FaCommentAlt } from 'react-icons/fa';
import { Button } from '@/components/ui/button';

interface FriendCardProps {
  friend: {
    id: string;
    name: string;
    email?: string;
    totalExpenses: number;
    yourBalance: number;
    lastActivity?: string;
    image?: string;
  };
}

export default function FriendCard({ friend }: FriendCardProps) {
  const { id, name, totalExpenses, yourBalance, lastActivity, image } = friend;
  const router = useRouter();
  
  // Determine if you owe money or are owed money
  const youOwe = yourBalance > 0;
  const balanceText = youOwe 
    ? `You owe ${name}` 
    : yourBalance < 0 
      ? `${name} owes you` 
      : 'Settled up';
  
  const balanceAmount = Math.abs(yourBalance);

  const handleOpenChat = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/friends/${id}/chat`);
  };
  
  return (
    <Link href={`/friends/${id}`}>
      <div className="card hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {image ? (
              <img src={image} alt={name} className="w-full h-full object-cover" />
            ) : (
              <FaUser className="text-gray-400 text-xl" />
            )}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium">{name}</h3>
            {lastActivity && (
              <p className="text-xs text-gray-500">Last activity: {lastActivity}</p>
            )}
          </div>
          <Button 
            onClick={handleOpenChat}
            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-10 w-10 p-0"
            title="Chat"
          >
            <FaCommentAlt className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <FaMoneyBillAlt className="text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">Total expenses</span>
            </div>
            <span className="font-medium">₹{totalExpenses.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {balanceText}
            </span>
            <span className={`font-medium ${yourBalance === 0 ? 'text-gray-500' : youOwe ? 'text-warning' : 'text-success'}`}>
              {yourBalance === 0 ? '' : `₹${balanceAmount.toLocaleString()}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
} 