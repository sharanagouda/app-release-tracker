'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Apple, Smartphone } from 'lucide-react';
import { CodePushApp } from '@/src/services/api/interfaces';
import { getAppIcon, hasCustomIcon, extractPlatform } from '@/src/utils/ImageUtils';

interface AppListProps {
  apps: CodePushApp[];
}

interface AppListItemProps {
  app: CodePushApp;
}

function AppListItem({ app }: AppListItemProps) {
  const platform = extractPlatform(app.name);
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';

  return (
    <Link href={`/apps/${encodeURIComponent(app.name)}`} className="block w-full">
      <div className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-blue-300">
        <div className="flex items-center gap-4">
          {/* App Logo */}
          <div
            className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl overflow-hidden ${
              hasCustomIcon(app.name)
                ? 'bg-white border border-gray-100'
                : isIOS
                ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                : isAndroid
                ? 'bg-gradient-to-br from-green-500 to-green-600'
                : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}
          >
            {hasCustomIcon(app.name) ? (
              <Image
                src={getAppIcon(app.name)}
                alt={`${app.name} icon`}
                width={56}
                height={56}
                className="object-contain p-1"
              />
            ) : isIOS ? (
              <Apple className="h-7 w-7 text-white" />
            ) : isAndroid ? (
              <Smartphone className="h-7 w-7 text-white" />
            ) : (
              <Smartphone className="h-7 w-7 text-white" />
            )}
          </div>

          {/* App Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {app.name}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              {/* Platform Badge */}
              {isIOS && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  <Apple className="h-3 w-3" />
                  iOS
                </span>
              )}
              {isAndroid && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  <Smartphone className="h-3 w-3" />
                  Android
                </span>
              )}
              {!isIOS && !isAndroid && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  Unknown
                </span>
              )}
              
              {/* Deployments Count */}
              <span className="text-xs text-gray-500">
                {app.deployments.length} deployment{app.deployments.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="flex-shrink-0 text-gray-400 group-hover:text-blue-500 transition-colors">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function AppList({ apps }: AppListProps) {
  const iosApps = apps.filter((app) => extractPlatform(app.name) === 'ios');
  const androidApps = apps.filter((app) => extractPlatform(app.name) === 'android');
  const otherApps = apps.filter((app) => extractPlatform(app.name) === null);

  if (apps.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Smartphone className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No applications found</h3>
        <p className="mt-2 text-sm text-gray-500">
          There are no applications available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* iOS Apps Section */}
      {iosApps.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <Apple className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              iOS Applications
            </h2>
            <span className="text-sm text-gray-500">({iosApps.length})</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {iosApps.map((app) => (
              <AppListItem key={app.name} app={app} />
            ))}
          </div>
        </div>
      )}

      {/* Android Apps Section */}
      {androidApps.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
              <Smartphone className="h-4 w-4 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Android Applications
            </h2>
            <span className="text-sm text-gray-500">({androidApps.length})</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {androidApps.map((app) => (
              <AppListItem key={app.name} app={app} />
            ))}
          </div>
        </div>
      )}

      {/* Other Apps Section */}
      {otherApps.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <Smartphone className="h-4 w-4 text-gray-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Other Applications
            </h2>
            <span className="text-sm text-gray-500">({otherApps.length})</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {otherApps.map((app) => (
              <AppListItem key={app.name} app={app} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
