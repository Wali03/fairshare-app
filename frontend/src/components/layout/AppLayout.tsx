'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { FaSignOutAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import ActivityBadge from '@/components/activity/ActivityBadge';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const { logout } = useAuthStore();
  
  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 md:ml-0">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 md:px-6 pl-16 md:pl-6">
          <div className="md:block">
            <h1 className="text-xl font-medium text-gray-800">Welcome back!</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <ActivityBadge />
            
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100 flex items-center gap-2"
              title="Logout"
            >
              <FaSignOutAlt className="text-xl" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>
        
        <div className="p-3 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
} 