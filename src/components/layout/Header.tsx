import React, { useState, useEffect, useRef } from 'react';
import { Bell, Menu, User, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchBox from '../search/SearchBox';
import { authService } from '../../services/auth';
import type { User as UserType } from '../../types/index';

const Header: React.FC = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/auth/login');
  };

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        // Only try to load user if we have a token
        if (authService.isAuthenticated()) {
          const user = await authService.getCurrentUser();
          setCurrentUser(user);
        } else {
          // If not authenticated, set to null and don't try to load
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Failed to load current user:', error);
        setCurrentUser(null);
      }
    };

    loadCurrentUser();
  }, []);

  // Handle click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button className="lg:hidden">
            <Menu className="w-6 h-6 text-gray-600" />
          </button>

          <div className="relative max-w-md w-full sm:w-80">
            <SearchBox className="w-full" />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900">
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
          </button>

          {/* User menu */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {currentUser ? currentUser.first_name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <span className="hidden md:block text-gray-700 font-medium">
                {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Loading...'}
              </span>
            </button>

            {/* User dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Loading...'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {currentUser ? currentUser.email : 'Loading...'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Profile functionality can be added later
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>

                  <div className="border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;