import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { X, Truck } from 'lucide-react';
import { NAV_ITEMS } from '../../constants';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { OptimileLogo } from '../common/OptimileLogo';

export const Sidebar: React.FC = () => {
  const { sidebarOpen, closeSidebar } = useUI();
  const { hasPermission } = useAuth();
  const location = useLocation();

  // Filter navigation items based on user permissions
  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (!item.requiredPermissions) return true;
    return hasPermission(item.requiredPermissions);
  });

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
      />

      {/* Sidebar container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shadow-none border-r border-gray-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-primary text-white">
          <div className="flex items-center space-x-2">
            <OptimileLogo className="h-10 w-auto text-white" />
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-1 rounded-md hover:bg-white/10 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-5 px-3 space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) closeSidebar();
                }}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                    isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="text-xs text-gray-400">
              © 2024 Optimile TMS <br /> v1.0.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
};