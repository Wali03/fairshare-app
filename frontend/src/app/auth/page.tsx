'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/auth/login');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary mb-2">FairShare</h1>
        <p className="text-gray-500">Redirecting to login...</p>
      </div>
    </div>
  );
} 