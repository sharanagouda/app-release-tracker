'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Apple, Smartphone, Download, Upload, GitBranch, Users, CheckCircle, XCircle } from 'lucide-react';
import DashboardLayout from '@/src/components/DashboardLayout';
import { getAppIcon, hasCustomIcon, extractPlatform } from '@/src/utils/ImageUtils';
import AdoptionChart from '@/src/components/AdoptionChart';
import MetricsChart from '@/src/components/MetricsChart';
import ReleaseCard from '@/src/components/ReleaseCard';
import RolloutModal from '@/src/components/RolloutModal';
import { mockAppsData } from '@/src/lib/MockData/apps';
import { mockDeploymentHistory } from '@/src/lib/MockData/deploymentHistory';
import { mockDeploymentMetrics } from '@/src/lib/MockData/deploymentMetrics';
import { Deployment, Release, ReleaseMetrics } from '@/src/lib/types';
import { codePushService } from '@/src/services/api/CodePushService';

// Get metrics for a specific release label
function getMetricsForLabel(label: string): ReleaseMetrics {
  const metrics = mockDeploymentMetrics[label];
  if (metrics) {
    const { active, downloaded, installed, failed } = metrics;
    // Calculate total devices as max of installed or active + some buffer
    const totalDevices = Math.max(installed, active) + Math.floor(downloaded * 0.1) + 100;
    return { active, downloaded, failed, installed, totalDevices };
  }
  return { active: 0, downloaded: 0, failed: 0, installed: 0, totalDevices: 0 };
}

// Convert mock history to Release format
function convertToReleases(): Release[] {
  return mockDeploymentHistory
    .map((item, index) => {
      const metrics = getMetricsForLabel(item.label);
      return {
        id: `release-${item.label}-${index}`,
        label: item.label,
        appVersion: item.appVersion,
        description: item.description?.replace(/^'|'$/g, '') || 'No description',
        releaseMethod: item.releaseMethod,
        releasedBy: item.releasedBy,
        size: item.size,
        uploadTime: new Date(Number(item.uploadTime)).toISOString(),
        isMandatory: item.isMandatory,
        isDisabled: item.isDisabled,
        rollout: item.rollout,
        metrics,
      };
    })
    .sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime());
}

// Build deployment with all releases (no filtering)
function buildDeployment(releases: Release[]): Deployment {
  return {
    id: 'dep-production',
    name: 'Production',
    key: 'key-production',
    releases: releases,
  };
}

export default function AppDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isUpdatingRollout, setIsUpdatingRollout] = useState(false);
  
  // Get decoded app name from URL
  const decodedAppName = decodeURIComponent(params.id as string);

  // Find the app from mock data
  const app = mockAppsData.find(a => a.name === decodedAppName);

  // Convert mock history data to releases
  const releases = useMemo(() => convertToReleases(), []);

  // Build single deployment with all releases
  const deployment = useMemo(() => {
    if (!app) return null;
    return buildDeployment(releases);
  }, [app, releases]);

  const appName = app?.name || '';
  const deploymentName = 'Production';

  if (!app) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center flex-col gap-4">
          <p className="text-gray-500">App not found</p>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Go back to apps
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const latestRelease = deployment?.releases[0];
  const platform = extractPlatform(appName);
  
  // Check if latest release has an active rollout
  const hasActiveRollout = latestRelease?.rollout !== undefined && 
                          latestRelease?.rollout !== null && 
                          latestRelease?.rollout < 100;

  // Handle rollout update (increase percentage)
  const handleRolloutUpdate = async (rollout: number) => {
    if (!latestRelease) return;
    
    setIsUpdatingRollout(true);
    try {
      const response = await codePushService.updateRollout(appName, deploymentName, {
        label: latestRelease.label,
        rollout,
      });
      
      // Show success message or refresh data
      console.log('Rollout updated successfully:', response.data);
      // In a real app, you would refetch the deployment history here
      alert(`Successfully updated rollout to ${rollout}%`);
    } catch (error) {
      console.error('Error updating rollout:', error);
      const errorMessage = (error as { message?: string })?.message || 'Unknown error';
      alert(`Failed to update rollout: ${errorMessage}`);
      throw error;
    } finally {
      setIsUpdatingRollout(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 w-full">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Apps
        </button>

        {/* App Header */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className={`flex h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-xl overflow-hidden ${
                hasCustomIcon(appName) 
                  ? 'bg-white border border-gray-100' 
                  : platform === 'ios' 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                    : 'bg-gradient-to-br from-green-500 to-green-600'
              }`}>
                {hasCustomIcon(appName) ? (
                  <Image
                    src={getAppIcon(appName)}
                    alt={`${appName} icon`}
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                ) : platform === 'ios' ? (
                  <Apple className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                ) : (
                  <Smartphone className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{appName}</h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {platform === 'ios' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      <Apple className="h-3 w-3" />
                      iOS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      <Smartphone className="h-3 w-3" />
                      Android
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    Production
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Release</span>
              </button>
              <button 
                onClick={() => setIsPromoteModalOpen(true)}
                disabled={!hasActiveRollout}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  hasActiveRollout 
                    ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700' 
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <GitBranch className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {hasActiveRollout ? `Promote (${latestRelease?.rollout}%)` : 'Promote'}
                </span>
                <span className="sm:hidden">Promote</span>
              </button>
            </div>
          </div>
        </div>

        {deployment && latestRelease && (
          <>
            {/* Stats Grid */}
            <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <AdoptionChart metrics={latestRelease.metrics} />
              <MetricsChart releases={deployment.releases} />
            </div>

            {/* Quick Stats */}
            <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-500">Active Users</p>
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {latestRelease.metrics.active.toLocaleString()}
                </p>
                <p className="mt-3 text-xs text-gray-500">
                  {latestRelease.metrics.totalDevices.toLocaleString()} total devices
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-500">Downloads</p>
                  <Download className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {latestRelease.metrics.downloaded.toLocaleString()}
                </p>
                <p className="mt-3 text-xs text-gray-500">
                  {latestRelease.metrics.installed.toLocaleString()} installed
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-500">Latest Version</p>
                  <CheckCircle className="h-5 w-5 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {latestRelease.appVersion}
                </p>
                <p className="mt-3 text-xs text-gray-500">
                  {latestRelease.label} · {deployment.releases.length} releases
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-500">Success Rate</p>
                  {latestRelease.metrics.failed > 0 ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <p className={`text-3xl font-bold ${
                  latestRelease.metrics.installed > 0 
                    ? Math.round(((latestRelease.metrics.installed - latestRelease.metrics.failed) / latestRelease.metrics.installed) * 100) >= 95 
                      ? 'text-green-600' 
                      : 'text-yellow-600'
                    : 'text-gray-400'
                }`}>
                  {latestRelease.metrics.installed > 0 
                    ? `${Math.round(((latestRelease.metrics.installed - latestRelease.metrics.failed) / latestRelease.metrics.installed) * 100)}%`
                    : 'N/A'
                  }
                </p>
                <p className="mt-3 text-xs text-gray-500">
                  {latestRelease.metrics.failed.toLocaleString()} failed installs
                </p>
              </div>
            </div>

            {/* Release History */}
            <div>
              <h2 className="mb-6 text-xl font-semibold text-gray-900">Release History</h2>
              <div className="space-y-5">
                {deployment.releases.map((release) => (
                  <ReleaseCard 
                    key={release.id} 
                    release={release}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {deployment && !latestRelease && (
          <div className="mt-12 text-center">
            <p className="text-gray-500">No releases yet</p>
          </div>
        )}

        {/* Rollout Modal */}
        {hasActiveRollout && latestRelease && (
          <RolloutModal
            isOpen={isPromoteModalOpen}
            onClose={() => setIsPromoteModalOpen(false)}
            onConfirm={handleRolloutUpdate}
            currentRollout={latestRelease.rollout}
            releaseLabel={latestRelease.label}
            appName={appName}
            deploymentName={deploymentName}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

