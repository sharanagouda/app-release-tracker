'use client';

import { useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import DashboardLayout from '@/src/components/DashboardLayout';
import AppCard from '@/src/components/AppCard';
import { useAppDispatch, useAppSelector } from '@/src/lib/store/hooks';
import { setApps, fetchDeploymentHistory } from '@/src/lib/store/appsSlice';
import { mockApps } from '@/src/lib/mockData';
import { apiClient } from '@/src/services/api';

export default function Home() {
  const dispatch = useAppDispatch();
  const { apps } = useAppSelector((state) => state.apps);

  useEffect(() => {
    // Load mock data (replace with API call later)
    dispatch(setApps(mockApps));

    // Set the access token for API calls
    // In a real app, this would come from authentication
    const accessToken = process.env.NEXT_PUBLIC_CODEPUSH_ACCESS_TOKEN;
    if (accessToken) {
      apiClient.setAccessToken(accessToken);
    }

    // Call the deployment history API (not using response, just making the call)
    // This demonstrates the API integration
    dispatch(
      fetchDeploymentHistory({
        appName: 'RN_HomecentreAE_iOS',
        deploymentName: 'Production',
      })
    );
  }, [dispatch]);

  const iosApps = apps.filter((app) => app.os === 'ios');
  const androidApps = apps.filter((app) => app.os === 'android');

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 w-full">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Applications
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Manage and monitor your CodePush applications
              </p>
            </div>
            <button className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Add Application
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search apps"
                className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-3">Total Apps</p>
            <p className="text-3xl font-bold text-gray-900">{apps.length}</p>
            <p className="mt-3 text-xs text-gray-500">
              {iosApps.length} iOS · {androidApps.length} Android
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-3">
              Active Deployments
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {apps.reduce((sum, app) => sum + app.deployments.length, 0)}
            </p>
            <p className="mt-3 text-xs text-green-600">↑ All active</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-3">
              Total Releases
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {apps.reduce(
                (sum, app) =>
                  sum +
                  app.deployments.reduce(
                    (dSum, dep) => dSum + dep.releases.length,
                    0
                  ),
                0
              )}
            </p>
            <p className="mt-3 text-xs text-gray-500">Across all apps</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-3">
              Active Users
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {apps
                .reduce(
                  (sum, app) =>
                    sum +
                    app.deployments.reduce(
                      (dSum, dep) =>
                        dSum + (dep.releases[0]?.metrics.active || 0),
                      0
                    ),
                  0
                )
                .toLocaleString()}
            </p>
            <p className="mt-3 text-xs text-green-600">↑ 12% from last week</p>
          </div>
        </div>

        {/* iOS Apps */}
        {iosApps.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              iOS Applications
            </h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {iosApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </div>
        )}

        {/* Android Apps */}
        {androidApps.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              Android Applications
            </h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {androidApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </div>
        )}

        {apps.length === 0 && (
          <div className="mt-12 text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No applications yet
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by creating your first application
            </p>
            <button className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Add Application
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
