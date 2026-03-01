import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  CreditCard,
  Receipt,
  TrendingUp,
  Target,
  Settings,
  Tag,
  PiggyBank,
  Users,
} from 'lucide-react';
import { authService } from '../../services/auth';
import type { User } from '../../types/index';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Categories', href: '/categories', icon: Tag },
  { name: 'Accounts', href: '/accounts', icon: CreditCard },
  { name: 'Budgets', href: '/budgets', icon: PiggyBank },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Split Expenses', href: '/split-expenses', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">MoneyMind</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `sidebar-item ${
                isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
              }`
            }
            onClick={(e) => {
              // Only reload if navigating to a different page
              if (window.location.pathname !== item.href) {
                e.preventDefault();
                window.location.href = item.href;
              }
            }}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {currentUser ? currentUser.first_name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">
              {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Loading...'}
            </p>
            <p className="text-xs text-gray-500">
              {currentUser ? currentUser.email : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;