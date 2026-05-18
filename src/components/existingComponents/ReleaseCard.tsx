'use client';

import { Calendar, User, Package, TrendingUp, AlertCircle, Ban, Percent } from 'lucide-react';
import { Release } from '@/src/lib/types';

interface ReleaseCardProps {
  release: Release;
}

export default function ReleaseCard({ 
  release
}: ReleaseCardProps) {
  const adoptionRate = Math.round(
    (release.metrics.installed / release.metrics.totalDevices) * 100
  );

  const hasRollout = release.rollout !== undefined && release.rollout !== null && release.rollout < 100;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={`rounded-xl border bg-white p-4 md:p-6 shadow-sm ${
      release.isDisabled 
        ? 'border-gray-300 opacity-60' 
        : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base md:text-lg font-semibold text-gray-900">{release.label}</h4>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 whitespace-nowrap">
              {release.appVersion}
            </span>
            {release.isMandatory && (
              <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 whitespace-nowrap">
                Mandatory
              </span>
            )}
            {release.isDisabled && (
              <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 whitespace-nowrap">
                <Ban className="h-3 w-3" />
                Disabled
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-600 break-words">{release.description}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-gray-500">Active</p>
          <p className="mt-1 text-lg font-semibold text-green-600">
            {release.metrics.active.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Downloaded</p>
          <p className="mt-1 text-lg font-semibold text-blue-600">
            {release.metrics.downloaded.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Installed</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {release.metrics.installed.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Failed</p>
          <p className="mt-1 text-lg font-semibold text-red-600">
            {release.metrics.failed.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-100 pt-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">{formatDate(release.uploadTime)}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{release.releasedBy}</span>
          </div>
          <div className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">{formatBytes(release.size)}</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="capitalize">{release.releaseMethod}</span>
          </div>
          {hasRollout && (
            <div className="flex items-center gap-1">
              <Percent className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
              <span className="whitespace-nowrap font-medium text-blue-600">
                {release.rollout}% rollout
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-green-600 whitespace-nowrap">{adoptionRate}%</span>
        </div>
      </div>
    </div>
  );
}

