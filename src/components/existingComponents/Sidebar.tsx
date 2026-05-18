'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Package, History, BarChart3, Settings, Zap, LogOut } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/src/lib/store/hooks';
import { clearAuth } from '@/src/lib/store/authSlice';
import { apiClient } from '@/src/services/api/ApiClient';

const navigation = [
  { name: 'Apps', href: '/', icon: Package },
  { name: 'History', href: '/history', icon: History },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('codepush_token');

    // Clear API client token
    apiClient.clearAccessToken();

    // Clear Redux state
    dispatch(clearAuth());

    // Redirect to login
    router.push('/login');
  };

  return (
    <div className="flex h-full w-64 flex-shrink-0 flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 flex-shrink-0 items-center gap-3 px-6 border-b border-gray-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">CodePush</h1>
          <p className="text-xs text-gray-400">Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      {user && (
        <div className="flex-shrink-0 border-t border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors group"
              title="Logout"
            >
              <LogOut className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

