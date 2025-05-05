'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import ExpenseList from '@/components/expenses/ExpenseList';
import FriendBalances from '@/components/balances/FriendBalances';

function ExpensePageContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const id = searchParams.get('id');
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');
  
  return (
    <>
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">My Expenses</h1>
        <p className="text-sm md:text-base text-gray-600">Track your expenses and balances with friends</p>
      </div>
      
      <div className="mb-4 md:mb-6 border-b overflow-x-auto">
        <nav className="flex -mb-px min-w-max">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-3 px-4 md:py-4 md:px-6 text-center border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
              activeTab === 'expenses'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            className={`py-3 px-4 md:py-4 md:px-6 text-center border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
              activeTab === 'balances'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Friend Balances
          </button>
        </nav>
      </div>
      
      {activeTab === 'expenses' ? (
        <ExpenseList initialType={type as 'friend' | 'group' | null} initialTargetId={id} />
      ) : (
        <FriendBalances className="my-4" />
      )}
    </>
  );
}

export default function ExpensesPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-4 text-center">Loading expenses...</div>}>
        <ExpensePageContent />
      </Suspense>
    </AppLayout>
  );
}