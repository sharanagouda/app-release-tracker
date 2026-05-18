'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Apple, Smartphone } from 'lucide-react';
import DashboardLayout from '@/src/components/DashboardLayout';
import AppList from '@/src/components/AppList';
import { CodePushApp } from '@/src/services/api/interfaces';
import { extractPlatform } from '@/src/utils/ImageUtils';
import { mockAppsData } from '@/src/lib/MockData/apps';
import { codePushService } from '../services/api';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [apps] = useState<CodePushApp[]>(mockAppsData);

  // Filter apps based on search query
  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) {
      return apps;
    }
    const query = searchQuery.toLowerCase();
    return apps.filter((app) => app.name.toLowerCase().includes(query));
  }, [apps, searchQuery]);

  // Calculate stats
  const iosApps = apps.filter((app) => extractPlatform(app.name) === 'ios');
  const androidApps = apps.filter((app) => extractPlatform(app.name) === 'android');
  const totalDeployments = apps.reduce((sum, app) => sum + app.deployments.length, 0);

  useEffect(() => {
    codePushService.getApps().then((res) => console.log('getApps res', res)).catch((err) => console.log('error fetching apps', err));
  }, [])
  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Applications
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Manage and monitor your CodePush applications
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Smartphone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Apps</p>
                <p className="text-2xl font-bold text-gray-900">{apps.length}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {iosApps.length} iOS · {androidApps.length} Android
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <Apple className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">iOS Apps</p>
                <p className="text-2xl font-bold text-gray-900">{iosApps.length}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {iosApps.reduce((sum, app) => sum + app.deployments.length, 0)} deployments
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Smartphone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Android Apps</p>
                <p className="text-2xl font-bold text-gray-900">{androidApps.length}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {androidApps.reduce((sum, app) => sum + app.deployments.length, 0)} deployments
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Smartphone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Deployments</p>
                <p className="text-2xl font-bold text-gray-900">{totalDeployments}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">Across all applications</p>
          </div>
        </div>

        {/* App List */}
        <AppList apps={filteredApps} />
      </div>
    </DashboardLayout>
  );
}
