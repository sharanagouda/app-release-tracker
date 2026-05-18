'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Apple, Smartphone, Calendar, TrendingUp } from 'lucide-react';
import { App } from '@/src/lib/types';
import { getAppIcon, hasCustomIcon } from '@/src/utils/ImageUtils';

interface AppCardProps {
  app: App;
}

export default function AppCard({ app }: AppCardProps) {
  const latestRelease = app.deployments[0]?.releases[0];
  const totalActive = app.deployments.reduce(
    (sum, dep) => sum + (dep.releases[0]?.metrics.active || 0),
    0
  );

  return (
    <Link href={`/apps/${app.id}`} className="block w-full">
      <div className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-300 h-full">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg overflow-hidden ${
              hasCustomIcon(app.name) 
                ? 'bg-white' 
                : app.os === 'ios' 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                  : 'bg-gradient-to-br from-green-500 to-green-600'
            }`}>
              {hasCustomIcon(app.name) ? (
                <Image
                  src={getAppIcon(app.name)}
                  alt={`${app.name} icon`}
                  width={48}
                  height={48}
                  className="object-contain"
                />
              ) : app.os === 'ios' ? (
                <Apple className="h-6 w-6 text-white" />
              ) : (
                <Smartphone className="h-6 w-6 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {app.name}
              </h3>
              <p className="text-sm text-gray-500 capitalize mt-0.5">{app.os}</p>
            </div>
          </div>
          
          <span className="inline-flex items-center flex-shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Active
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Deployments</p>
            <p className="text-lg font-semibold text-gray-900">
              {app.deployments.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Active Users</p>
            <p className="text-lg font-semibold text-gray-900">
              {totalActive.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Latest Version</p>
            <p className="text-lg font-semibold text-gray-900 truncate">
              {latestRelease?.appVersion || 'N/A'}
            </p>
          </div>
        </div>

        {latestRelease && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>
              Updated {new Date(latestRelease.uploadTime).toLocaleDateString()}
            </span>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-600 font-medium">
            {latestRelease 
              ? `${Math.round((latestRelease.metrics.installed / latestRelease.metrics.totalDevices) * 100)}% adoption`
              : 'No releases'
            }
          </span>
        </div>
      </div>
    </Link>
  );
}

