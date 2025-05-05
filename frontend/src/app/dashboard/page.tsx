'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import BalanceCard from '@/components/dashboard/BalanceCard';
import SummaryCards from '@/components/dashboard/SummaryCards';
import TransactionHistory from '@/components/dashboard/TransactionHistory';
import ExpenseStatistics from '@/components/dashboard/ExpenseStatistics';
import { dashboardService, BalanceData } from '@/lib/services/dashboardService';
import { useAuthStore } from '@/lib/stores/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchBalanceData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getUserBalance();
        setBalanceData(data);
      } catch (err) {
        console.error('Error fetching balance data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBalanceData();
  }, []);
  
  // Get current hour to display appropriate greeting
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) {
    greeting = 'Good afternoon';
  } else if (currentHour >= 18) {
    greeting = 'Good evening';
  }
  
  const userName = user?.name ? user.name.split(' ')[0] : 'User';
  
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{greeting}, {userName}!</h1>
        <p className="text-gray-500">Here&apos;s your financial summary</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="h-full">
          <BalanceCard 
            balanceData={balanceData || undefined}
            isLoading={loading}
            userName={user?.name}
          />
        </div>
        <div className="h-full">
          <SummaryCards />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-full">
          <ExpenseStatistics />
        </div>
        <div className="h-full">
          <TransactionHistory />
        </div>
      </div>
    </AppLayout>
  );
} 