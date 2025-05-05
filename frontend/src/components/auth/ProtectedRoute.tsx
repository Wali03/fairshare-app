'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      setIsLoading(true);
      const isAuthed = await checkAuth();
      setIsLoading(false);
      
      if (!isAuthed) {
        router.push('/auth/login');
      }
    };

    verifyAuth();
  }, [checkAuth, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-600 mb-4" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
} 