
import React, { useState } from 'react';
import { IconDashboard, IconTruck, IconUsers, IconMap, IconWrench, IconFuel, IconCircleDollar, IconTyre, IconGlobe, IconFile, IconZap, IconBell, IconChart, IconClipboardCheck, IconDatabase, IconBox, IconBriefcase, IconMechanic, IconMenu, IconX, IconBattery } from './Icons';
import Logo from '../customer_logo.jpeg';
export type Tab = 'dashboard' | 'live-map' | 'fleet' | 'drivers' | 'dispatch' | 'maintenance' | 'fuel' | 'cost' | 'compliance' | 'behavior' | 'tyres' | 'exceptions' | 'ops-intel' | 'coverage' | 'reconciliation' | 'inventory' | 'vendors' | 'garage' | 'batteries' | 'settings';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: IconDashboard },
    { id: 'ops-intel', label: 'Ops Intelligence', icon: IconChart },
    { id: 'exceptions', label: 'Exception Center', icon: IconBell },
    { id: 'coverage', label: 'Data Coverage', icon: IconDatabase },
    { id: 'reconciliation', label: 'Reconciliation', icon: IconClipboardCheck },
    { id: 'live-map', label: 'Live Map', icon: IconGlobe },
    { id: 'dispatch', label: 'Dispatch Console', icon: IconMap },
    { id: 'fleet', label: 'Fleet Management', icon: IconTruck },
    { id: 'drivers', label: 'Driver Management', icon: IconUsers },
    { id: 'compliance', label: 'Compliance', icon: IconFile },
    { id: 'maintenance', label: 'Maintenance', icon: IconWrench },
    { id: 'garage', label: 'Garage Mgmt', icon: IconMechanic },
    { id: 'batteries', label: 'Battery Mgmt', icon: IconBattery },
    { id: 'tyres', label: 'Tyre Mgmt', icon: IconTyre },
    { id: 'vendors', label: 'Vendor & Ledger', icon: IconBriefcase },
    { id: 'inventory', label: 'Inventory', icon: IconBox },
    { id: 'fuel', label: 'Fuel & Energy', icon: IconFuel },
    { id: 'behavior', label: 'Driver Behavior', icon: IconZap },
    { id: 'cost', label: 'Cost Health', icon: IconCircleDollar },
    { id: 'settings', label: 'Settings', icon: IconWrench },
  ] as const;

  const renderNavLinks = () => (
    <nav className="flex-1 px-2 space-y-1 bg-white">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              onNavigate(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors ${isActive
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <item.icon
              className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}
            />
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  const UserProfile = () => (
    <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
      <div className="flex items-center">
        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
          RS
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-700">Rahul Sharma</p>
          <p className="text-xs font-medium text-gray-500">Fleet Manager</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-gray-200 h-16 flex items-center px-4 justify-between shadow-sm">
        <div className="px-6 pt-4">
          <div className="flex items-center justify-left">
            <img src={Logo} alt="Optimile logo" className="object-cover" style={{ width: '80%', height: '100%' }} />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-2 text-left">powered by Optimile</p>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-500 hover:text-gray-700 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
          <IconMenu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 md:hidden flex">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>

          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white h-full transform transition-transform duration-300 ease-in-out">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <IconX className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pt-5 pb-4">
              <div className="flex-shrink-0 flex items-center px-4 mb-5">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-xl">O</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Optimile Fleet Control</span>
              </div>
              {renderNavLinks()}
            </div>
            <UserProfile />
          </div>
          <div className="flex-shrink-0 w-14"></div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow min-h-0 pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
            <div className="px-3  mb-5">
              <div className="flex items-center justify-left">
                <img src={Logo} alt="Optimile logo" className="object-cover" style={{ width: '80%', height: '100%' }} />
              </div>
              <p className="text-[10px]  tracking-widest text-slate-500 mt-2 text-left">Powered by Optimile</p>
            </div>
            {renderNavLinks()}
            <UserProfile />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden pt-16 md:pt-0">
        <main className="flex-1 relative overflow-y-auto focus:outline-none scrollbar-hide">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
