import { useEffect, useState } from 'react';
import { useBalanceStore } from '@/lib/stores/balanceStore';
import { FaEquals, FaArrowRight } from 'react-icons/fa';

interface GroupBalancesProps {
  groupId: string;
  getUserName: (userId: string) => string;
  className?: string;
}

export default function GroupBalances({ groupId, getUserName, className = '' }: GroupBalancesProps) {
  const { 
    groupBalance, 
    groupBalanceLoading, 
    groupBalanceError, 
    fetchGroupBalance 
  } = useBalanceStore();
  
  const [activeTab, setActiveTab] = useState<'balances' | 'transactions'>('balances');

  useEffect(() => {
    if (groupId) {
      fetchGroupBalance(groupId);
    }
  }, [groupId, fetchGroupBalance]);

  if (groupBalanceLoading) {
    return <div className="flex justify-center items-center p-6">Loading group balances...</div>;
  }

  if (groupBalanceError) {
    return <div className="text-red-500 p-6">Error: {groupBalanceError}</div>;
  }

  if (!groupBalance) {
    return <div className="text-center p-6 text-gray-500">No balance data available</div>;
  }

  // Sort balances by amount (high to low)
  const sortedBalances = Object.entries(groupBalance.balances)
    .map(([userId, amount]) => ({ userId, amount }))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  // Separate positive and negative balances
  const positiveBalances = sortedBalances.filter(b => b.amount > 0);
  const negativeBalances = sortedBalances.filter(b => b.amount < 0);
  const zeroBalances = sortedBalances.filter(b => b.amount === 0);

  const { optimizedTransactions } = groupBalance;

  return (
    <div className={`${className}`}>
      <div className="mb-4 border-b">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('balances')}
            className={`py-2 px-4 text-center border-b-2 font-medium ${
              activeTab === 'balances'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Current Balances
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-4 text-center border-b-2 font-medium ${
              activeTab === 'transactions'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Settlement Plan
          </button>
        </nav>
      </div>

      {activeTab === 'balances' ? (
        <div>
          {positiveBalances.length === 0 && negativeBalances.length === 0 && (
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <FaEquals className="text-gray-400 mx-auto mb-2 text-xl" />
              <p className="text-gray-600 font-medium">Everyone is settled up!</p>
            </div>
          )}

          {positiveBalances.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-success">Positive Balances (Getting Money)</h3>
              <div className="space-y-2">
                {positiveBalances.map(balance => (
                  <div 
                    key={balance.userId}
                    className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                        {getUserName(balance.userId).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{getUserName(balance.userId)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-success">₹{balance.amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {negativeBalances.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-warning">Negative Balances (Owing Money)</h3>
              <div className="space-y-2">
                {negativeBalances.map(balance => (
                  <div 
                    key={balance.userId}
                    className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                        {getUserName(balance.userId).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{getUserName(balance.userId)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-warning">₹{Math.abs(balance.amount).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {zeroBalances.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Settled</h3>
              <div className="space-y-2">
                {zeroBalances.map(balance => (
                  <div 
                    key={balance.userId}
                    className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 mr-3">
                        {getUserName(balance.userId).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{getUserName(balance.userId)}</p>
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
      ) : (
        <div>
          <h3 className="text-lg font-semibold mb-4">Suggested Payments</h3>
          
          {optimizedTransactions.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <FaEquals className="text-gray-400 mx-auto mb-2 text-xl" />
              <p className="text-gray-600 font-medium">No payments needed - everyone is settled up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {optimizedTransactions.map((transaction, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                        {getUserName(transaction.from).charAt(0).toUpperCase()}
                      </div>
                      <div className="mx-3">
                        <p className="font-medium">{getUserName(transaction.from)}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center mx-2">
                      <FaArrowRight className="text-primary" />
                      <span className="font-semibold mt-1">₹{transaction.amount.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="mr-3">
                        <p className="font-medium">{getUserName(transaction.to)}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                        {getUserName(transaction.to).charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 