'use client';

import DashboardLayout from '@/src/components/DashboardLayout';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 w-full">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your CodePush server settings and preferences
          </p>
        </div>

        <div className="flex h-96 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="text-center px-4">
            <SettingsIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Coming Soon</h3>
            <p className="mt-2 text-sm text-gray-500">
              Settings panel will be available here
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

