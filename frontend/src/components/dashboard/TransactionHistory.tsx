import { useState, useEffect } from 'react';
import { 
  FaShoppingBag, 
  FaGamepad, 
  FaMedkit, 
  FaGraduationCap, 
  FaBriefcase,
  FaUtensils,
  FaHome,
  FaCar,
  FaPlane,
  FaLightbulb
} from 'react-icons/fa';
import { dashboardService, Transaction } from '@/lib/services/dashboardService';
import { useRouter } from 'next/navigation';

interface TransactionRowProps {
  transaction: Transaction;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Daily': <FaShoppingBag />,
  'Entertainment': <FaGamepad />,
  'Medical': <FaMedkit />,
  'Education': <FaGraduationCap />,
  'Income': <FaBriefcase />,
  'Food': <FaUtensils />,
  'Groceries': <FaShoppingBag />,
  'Transport': <FaCar />,
  'Rent': <FaHome />,
  'Travel': <FaPlane />,
  'Utilities': <FaLightbulb />
};

function TransactionRow({ transaction }: TransactionRowProps) {
  const { category, description, amount, formattedDate, isPositive } = transaction;
  
  return (
    <div className="flex items-center py-4 border-b border-gray-100">
      <div className="bg-gray-100 p-3 rounded-lg mr-4">
        {categoryIcons[category] || <FaShoppingBag />}
      </div>
      
      <div className="flex-1">
        <h4 className="font-medium">{category || 'Uncategorized'}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      
      <div className="text-right">
        <p className={`font-bold ${isPositive ? 'text-success' : 'text-warning'}`}>
          {isPositive ? '+' : '-'}₹{Math.abs(amount).toLocaleString()}
        </p>
        <p className="text-xs text-gray-500">{formattedDate}</p>
      </div>
    </div>
  );
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getRecentTransactions(5);
        setTransactions(data);
        setError('');
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load recent transactions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, []);
  
  const handleViewAll = () => {
    router.push('/expenses');
  };
  
  return (
    <div className="card h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Transactions history</h3>
        <button 
          className="btn-secondary text-sm"
          onClick={handleViewAll}
        >
          View all
        </button>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center py-4 border-b border-gray-100 animate-pulse">
              <div className="bg-gray-200 w-12 h-12 rounded-lg mr-4"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">{error}</div>
      ) : transactions.length === 0 ? (
        <div className="p-4 text-center text-gray-500">No recent transactions</div>
      ) : (
        <div className="space-y-0">
          {transactions.map(transaction => (
            <TransactionRow key={transaction._id} transaction={transaction} />
          ))}
        </div>
      )}
    </div>
  );
} 