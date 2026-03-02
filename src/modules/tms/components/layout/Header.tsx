import React from 'react';
import { Menu, Bell, Search, User as UserIcon, LogOut } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';

export const Header: React.FC = () => {
  const { toggleSidebar } = useUI();
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30 relative">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" />
        </button>
        
        {/* Search Bar - hidden on mobile, visible on tablet+ */}
        <div className="hidden sm:flex ml-4 lg:ml-0 relative rounded-md shadow-sm max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            name="search"
            id="search"
            className="block w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Search bookings, drivers..."
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-1.5 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary relative">
          <span className="sr-only">View notifications</span>
          <Bell className="h-6 w-6" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger border-2 border-white"></span>
        </button>

        {/* User Dropdown */}
        <div className="relative flex items-center space-x-3 border-l border-gray-200 pl-4 ml-2">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
            <p className="text-xs text-gray-500 uppercase">{user?.role}</p>
          </div>
          <div className="group relative">
             <button className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-gray-300 transition duration-150 ease-in-out">
              <span className="sr-only">User menu</span>
              {user?.avatarUrl ? (
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={user.avatarUrl}
                  alt={user.name}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UserIcon className="h-5 w-5" />
                </div>
              )}
            </button>
            {/* Simple dropdown simulation on hover/focus for demo */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 hidden group-hover:block z-50">
                <a href="#/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</a>
                <a href="#/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
                <button 
                  onClick={logout}
                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2"/> Sign out
                </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
