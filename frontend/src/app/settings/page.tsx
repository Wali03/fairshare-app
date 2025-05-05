'use client';

import AppLayout from '@/components/layout/AppLayout';
import ProfileSection from '@/components/settings/ProfileSection';
import PasswordSection from '@/components/settings/PasswordSection';
import NotificationSection from '@/components/settings/NotificationSection';
import AccountSection from '@/components/settings/AccountSection';
import { FaUserCog } from 'react-icons/fa';

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center">
          <FaUserCog className="text-2xl mr-3 text-primary" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <p className="text-gray-500 mt-2">Manage your account preferences and settings</p>
      </div>
      
      <div>
        <ProfileSection />
        <PasswordSection />
        <NotificationSection />
        <AccountSection />
      </div>
    </AppLayout>
  );
} 