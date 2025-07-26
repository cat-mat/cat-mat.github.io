import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../stores/appStore.js';

const AppHeader = ({
  bannerHeight = 0,
  onExportConfig,
  onImportConfig,
  onResetConfig,
  configImportError,
  configImportSuccess,
  setShowImportModal,
  setShowResetConfirmModal,
  ...rest
}) => {
  const { auth, signOut, addNotification } = useAppStore();
  const user = auth?.user;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 shadow-wildflower"
      style={{ top: bannerHeight }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="text-2xl mr-3 animate-bloom">🐦‍🔥 ❤️‍🔥</div>
            <h1 className="text-xl font-bold text-white wildflower-text-shadow">
              What Even With My Hot Self?!
            </h1>
          </div>
          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-cream-500 rounded-xl shadow-wildflower py-1 z-50 border border-cream-400">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-cream-300">
                  <div className="font-medium">{user?.name || 'User'}</div>
                  <div className="text-gray-500">{user?.email}</div>
                </div>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-cream-400 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  🌸 Settings
                </Link>
                <Link
                  to="/insights"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-cream-400 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  📊 Insights
                </Link>
                <Link
                  to="/logs"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-cream-400 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  📝 Logs
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut();
                    addNotification({
                      type: 'success',
                      title: 'Signed out',
                      message: 'You have been successfully signed out.'
                    });
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-cream-400 transition-colors duration-200"
                >
                  🚪 Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader; 