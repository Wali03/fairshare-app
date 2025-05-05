'use client';

import { Suspense } from 'react';
import ActivityFeed from '@/components/activity/ActivityFeed';
import AppLayout from '@/components/layout/AppLayout';

export default function ActivityPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Activity Feed</h1>
        </div>
        
        <Suspense fallback={<div className="text-center py-10">Loading activities...</div>}>
          <ActivityFeed />
        </Suspense>
      </div>
    </AppLayout>
  );
} 