'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/dashboard');
  }, [router]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-primary">
      <div className="text-center bg-white p-10 rounded-xl shadow-lg max-w-md">
        <h1 className="text-3xl font-bold text-primary mb-4">Welcome to FairShare</h1>
        <p className="text-gray-500 mb-8">Split expenses easily with friends and family</p>
        
        <div className="flex gap-4 justify-center">
          <Link href="/auth/login" className="btn-primary">
            Login
          </Link>
          <Link href="/auth/signup" className="btn-secondary">
            Sign Up
          </Link>
        </div>
        
        <div className="mt-8">
          <Link href="/dashboard" className="text-blue-500 hover:underline">
            Demo Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
