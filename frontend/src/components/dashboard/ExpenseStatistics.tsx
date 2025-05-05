import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardService, ChartDataPoint, CategoryExpense } from '@/lib/services/dashboardService';
import { PieChart, Pie, Cell } from 'recharts';

export default function ExpenseStatistics() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryExpense[]>([]);
  const [activeChart, setActiveChart] = useState<'line' | 'pie'>('line');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [chartData, categoryData] = await Promise.all([
          dashboardService.getExpensesChartData(),
          dashboardService.getExpensesByCategory()
        ]);
        
        setChartData(chartData);
        setCategoryData(categoryData);
        setError('');
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate total amount for the visible period
  const totalAmount = chartData.reduce((total, item) => total + item.value, 0);
  const categoryTotal = categoryData.reduce((total, item) => total + item.amount, 0);

  return (
    <div className="card h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium">Statistics</h3>
          <div className="mt-2">
            <button 
              className={`mr-2 text-sm font-medium ${activeChart === 'line' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-700'}`}
              onClick={() => setActiveChart('line')}
            >
              Daily Expense
            </button>
            <button 
              className={`text-sm font-medium ${activeChart === 'pie' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-700'}`}
              onClick={() => setActiveChart('pie')}
            >
              Categories
            </button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="h-64 flex items-center justify-center text-red-500">{error}</div>
      ) : activeChart === 'line' ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 12 }}
                domain={[0, 'dataMax + 10']}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#3b82f6", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
                nameKey="category"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      
      <div className="mt-4 text-right">
        <p className="text-sm font-medium">
          Total: <span className="text-primary">
            ₹{activeChart === 'line' ? totalAmount.toFixed(2) : categoryTotal.toFixed(2)}
          </span>
        </p>
      </div>
    </div>
  );
} 