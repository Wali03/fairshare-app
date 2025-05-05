import { useState, useEffect } from 'react';
import { dashboardService, MonthSummary } from '@/lib/services/dashboardService';

interface SummaryCardProps {
  data?: MonthSummary;
  isLoading?: boolean;
}

export function SummaryCard({ 
  data,
  isLoading
}: SummaryCardProps) {
  // Default values if no data is available
  const currentAmount = data?.currentMonth?.total || 0;
  const lastAmount = data?.lastMonth?.total || 0;
  const changePercentage = data?.percentageChange || 0;
  
  return (
    <div className="card h-full">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-gray-500 text-sm">Total expenses</h3>
          {isLoading ? (
            <div className="animate-pulse h-6 w-32 bg-gray-200 rounded mt-2"></div>
          ) : (
            <div className="flex items-center mt-1">
              <span className="text-xl font-bold">₹{currentAmount.toLocaleString()}</span>
            </div>
          )}
        </div>
        <div className="text-4xl">💸</div>
      </div>
      
      {isLoading ? (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="animate-pulse h-12 bg-gray-200 rounded"></div>
          <div className="animate-pulse h-12 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Last month</p>
            <p className="text-lg font-medium">
              -₹{lastAmount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">This month</p>
            <p className="text-lg font-medium">
              -₹{currentAmount.toLocaleString()}
            </p>
            <span className={`text-xs ${changePercentage >= 0 ? 'text-warning' : 'text-success'}`}>
              {changePercentage >= 0 ? '▲' : '▼'} {Math.abs(changePercentage).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SummaryCards() {
  const [expenseData, setExpenseData] = useState<MonthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const expenses = await dashboardService.getExpensesSummary();
        setExpenseData(expenses);
        setError('');
      } catch (err) {
        console.error('Error fetching dashboard summary data:', err);
        setError('Failed to load summary data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="h-full">
        <div className="card h-full p-4 text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <SummaryCard 
        data={expenseData || undefined}
        isLoading={loading}
      />
    </div>
  );
} 