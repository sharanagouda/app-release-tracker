import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Rocket,
  FileText,
  GitCompare,
  Settings,
  Bell,
  Search,
  Moon,
  Sun,
  LogOut,
  Plus,
  Menu,
  X,
  ChevronLeft,
  UserCircle,
  BookOpen,
  Edit2,
  Check
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  toggleDarkMode: () => void;
  user: FirebaseUser | null;
  isAdmin: boolean;
  handleLogout: () => void;
  getDisplayName: (user: FirebaseUser | null) => string;
  onCreateRelease?: () => void;
  sidebarSettings?: {
    showAppRelease: boolean;
    showReleaseNotes: boolean;
    showWiki: boolean;
  };
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  darkMode,
  toggleDarkMode,
  user,
  isAdmin,
  handleLogout,
  getDisplayName,
  onCreateRelease,
  sidebarSettings = { showAppRelease: true, showReleaseNotes: true, showWiki: true },
}) => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState('Release Lead');
  const [isEditingRole, setIsEditingRole] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      setUserRole(savedRole);
    }
  }, []);

  const handleSaveRole = () => {
    localStorage.setItem('userRole', userRole);
    setIsEditingRole(false);
  };

  const allNavItems = [
    { path: '/', label: 'App Release', icon: Rocket, show: sidebarSettings.showAppRelease },
    { path: '/release-notes', label: 'Release Notes', icon: FileText, show: sidebarSettings.showReleaseNotes },
    { path: '/wiki', label: 'Wiki', icon: BookOpen, show: sidebarSettings.showWiki },
  ];

  const navItems = allNavItems.filter(item => item.show);

  const configItems = [
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getPageTitle = () => {
    const currentNav = [...navItems, ...configItems].find(item => isActive(item.path));
    return currentNav?.label || 'App Release';
  };

  return (
    <div className={`h-screen flex overflow-hidden ${darkMode ? 'bg-[#0B1120]' : 'bg-gray-50'}`}>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${darkMode ? 'bg-[#0F1629] border-[#1E293B]' : 'bg-white border-gray-200'
        } border-r flex-shrink-0`}>

        {/* Logo */}
        <div className={`flex items-center gap-3 px-5 py-5 border-b flex-shrink-0 ${darkMode ? 'border-[#1E293B]' : 'border-gray-200'
          }`}>
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className={`font-bold text-sm leading-tight ${darkMode ? 'text-white' : 'text-gray-900'
                }`}>Release Manager</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Enterprise Edition</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${active
                    ? darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-700'
                    : darkMode ? 'text-gray-400 hover:bg-[#1E293B] hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active
                    ? darkMode ? 'text-blue-400' : 'text-blue-700'
                    : darkMode ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                {!sidebarCollapsed && (
                  <>
                    <span>{item.label}</span>
                  </>
                )}
              </Link>
            );
          })}

          {/* Configuration Section */}
          <div className="pt-6">
            {!sidebarCollapsed && (
              <p className={`px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-600' : 'text-gray-400'
                }`}>
                Configuration
              </p>
            )}
            {configItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${active
                      ? darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-700'
                      : darkMode ? 'text-gray-400 hover:bg-[#1E293B] hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active
                      ? darkMode ? 'text-blue-400' : 'text-blue-700'
                      : darkMode ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Bar */}
        <header className={`sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-8 border-b flex-shrink-0 ${darkMode ? 'bg-[#0F1629] border-[#1E293B]' : 'bg-white border-gray-200'
          }`}>
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:text-white hover:bg-[#1E293B]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar collapse button (desktop) */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`hidden lg:flex p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:text-white hover:bg-[#1E293B]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <ChevronLeft className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>

            <h2 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'
              }`}>{getPageTitle()}</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:text-white hover:bg-[#1E293B]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Profile */}
            <div className={`flex items-center gap-3 pl-3 border-l ${darkMode ? 'border-[#1E293B]' : 'border-gray-200'
              }`}>
              {user ? (
                <>
                  <div className="hidden sm:block text-right">
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'
                      }`}>{getDisplayName(user)}</p>

                    {isEditingRole ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={userRole}
                          onChange={(e) => setUserRole(e.target.value)}
                          className={`text-xs px-1 py-0.5 rounded border ${darkMode ? 'bg-[#111827] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          autoFocus
                          onBlur={handleSaveRole}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRole()}
                        />
                        <button onClick={handleSaveRole} className="text-green-500 hover:text-green-600">
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 group">
                        <p className="text-xs text-gray-500">{userRole}</p>
                        <button
                          onClick={() => setIsEditingRole(true)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-500"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {getDisplayName(user).charAt(0)}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={handleLogout}
                      className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:text-red-400 hover:bg-[#1E293B]' : 'text-gray-600 hover:text-red-600 hover:bg-gray-100'
                        }`}
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </>
              ) : (
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${darkMode ? 'bg-[#1E293B] text-gray-500' : 'bg-gray-200 text-gray-600'
                  }`}>
                  <UserCircle className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 p-4 lg:p-8 overflow-auto ${darkMode ? 'bg-[#0B1120]' : 'bg-gray-50'
          }`}>
          {children}
        </main>
      </div>
    </div>
  );
};
