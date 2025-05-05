import { useEffect } from 'react';
import { useBalanceStore, FriendBalance } from '@/lib/stores/balanceStore';
import { useRouter } from 'next/navigation';
import { FaArrowCircleRight, FaArrowCircleLeft, FaEquals } from 'react-icons/fa';

interface FriendBalancesProps {
  friendId?: string; // Optional - if provided, will filter to show only this friend
  className?: string;
}

export default function FriendBalances({ friendId, className = '' }: FriendBalancesProps) {
  const { 
    friendBalances, 
    friendBalancesLoading, 
    friendBalancesError, 
    fetchFriendBalances 
  } = useBalanceStore();
  const router = useRouter();

  useEffect(() => {
    fetchFriendBalances();
  }, [fetchFriendBalances]);

  // Filter balances if a specific friendId is provided
  const filteredBalances = friendId
    ? friendBalances.filter(balance => balance.friend.id === friendId)
    : friendBalances;

  // Separate balances into people you owe and who owe you
  const youOwe: FriendBalance[] = [];
  const theyOwe: FriendBalance[] = [];
  const settled: FriendBalance[] = [];

  filteredBalances.forEach(balance => {
    if (balance.balance < 0) {
      youOwe.push({ ...balance, balance: Math.abs(balance.balance) });
    } else if (balance.balance > 0) {
      theyOwe.push(balance);
    } else {
      settled.push(balance);
    }
  });

  if (friendBalancesLoading) {
    return <div className="flex justify-center items-center p-6">Loading balances...</div>;
  }

  if (friendBalancesError) {
    return <div className="text-red-500 p-6">Error loading balances: {friendBalancesError}</div>;
  }

  const handleFriendClick = (id: string) => {
    router.push(`/friends/${id}`);
  };

  return (
    <div className={`${className}`}>
      {filteredBalances.length === 0 && (
        <div className="text-center p-6 text-gray-500">
          {friendId ? "No balance with this friend" : "No balances with friends yet"}
        </div>
      )}

      {youOwe.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-warning">You owe</h3>
          <div className="space-y-2">
            {youOwe.map(balance => (
              <div 
                key={balance.friend.id}
                className="bg-white p-4 rounded-lg shadow flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => handleFriendClick(balance.friend.id)}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                    {balance.friend.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{balance.friend.name}</p>
                    <p className="text-sm text-gray-500">{balance.friend.email}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaArrowCircleRight className="text-warning mr-2" />
                  <span className="font-semibold text-warning">${balance.balance.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {theyOwe.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-success">You are owed</h3>
          <div className="space-y-2">
            {theyOwe.map(balance => (
              <div 
                key={balance.friend.id}
                className="bg-white p-4 rounded-lg shadow flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => handleFriendClick(balance.friend.id)}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                    {balance.friend.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{balance.friend.name}</p>
                    <p className="text-sm text-gray-500">{balance.friend.email}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaArrowCircleLeft className="text-success mr-2" />
                  <span className="font-semibold text-success">${balance.balance.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {settled.length > 0 && !friendId && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Settled</h3>
          <div className="space-y-2">
            {settled.map(balance => (
              <div 
                key={balance.friend.id}
                className="bg-white p-4 rounded-lg shadow flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => handleFriendClick(balance.friend.id)}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 mr-3">
                    {balance.friend.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{balance.friend.name}</p>
                    <p className="text-sm text-gray-500">{balance.friend.email}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaEquals className="text-gray-400 mr-2" />
                  <span className="font-semibold text-gray-500">Settled up</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 