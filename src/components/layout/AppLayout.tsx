import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { TabNavigation } from '../common/TabNavigation';

export const AppLayout: React.FC = () => {
  const { darkMode, toggleDarkMode, toastMessage, setToastMessage } = useAppContext();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header: Title left, Tabs + Dark Mode right */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Release Tracker
            </h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Track and manage your application releases across all platforms
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TabNavigation darkMode={darkMode} />
            <button
              onClick={toggleDarkMode}
              className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                darkMode
                  ? 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Page content rendered here */}
        <Outlet />
      </div>

      {/* Global Toast */}
      {toastMessage && (
        <div
          className="fixed inset-0 z-40 cursor-pointer"
          onClick={() => setToastMessage(null)}
        >
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 cursor-auto">
            <div
              className={`px-4 py-3 rounded-lg shadow-lg max-w-md ${
                darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-800 text-white'
              }`}
            >
              <div className="text-sm whitespace-pre-line">{toastMessage}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setToastMessage(null);
                }}
                className={`absolute top-2 right-2 ${
                  darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-white'
                }`}
              >
                x
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
