'use client';

import AppLayout from '@/components/layout/AppLayout';
import GroupList from '@/components/groups/GroupList';

export default function GroupsPage() {
  return (
    <AppLayout>
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">My Groups</h1>
        <p className="text-sm md:text-base text-gray-600">Manage your shared expenses with groups</p>
      </div>
      
      <GroupList />
    </AppLayout>
  );
} 