import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import {
  Truck, Package, BarChart3, Wallet, Users, Activity,
  TrendingUp, AlertTriangle, Clock, CheckCircle,
} from 'lucide-react';

export const ERPDashboard: React.FC = () => {
  const { user, hasModuleAccess } = useAuth();
  const navigate = useNavigate();

  const moduleCards = [
    {
      module: 'tms' as const,
      title: 'Transport Management',
      description: 'Bookings, operations, tracking, and dispatch',
      icon: Package,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      path: '/tms/dashboard',
      stats: [
        { label: 'Active Trips', value: '47' },
        { label: 'Pending Bookings', value: '12' },
      ],
    },
    {
      module: 'fleet-control' as const,
      title: 'Fleet Control',
      description: 'Vehicles, drivers, maintenance, tyres, and fuel',
      icon: Truck,
      color: 'bg-green-50 text-green-600 border-green-200',
      path: '/fleet/dashboard',
      stats: [
        { label: 'Active Vehicles', value: '156' },
        { label: 'Due for Service', value: '8' },
      ],
    },
    {
      module: 'ams' as const,
      title: 'Procurement (AMS)',
      description: 'Auctions, contracts, vendors, and SLA',
      icon: BarChart3,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      path: '/ams/dashboard',
      stats: [
        { label: 'Live Auctions', value: '3' },
        { label: 'Active Contracts', value: '28' },
      ],
    },
    {
      module: 'finance' as const,
      title: 'Finance',
      description: 'Invoices, ledgers, reconciliation, and reports',
      icon: Wallet,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      path: '/finance/dashboard',
      stats: [
        { label: 'Receivables', value: '₹12.5L' },
        { label: 'Pending Invoices', value: '23' },
      ],
    },
  ];

  const visibleModules = moduleCards.filter(m => hasModuleAccess(m.module));

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {user?.role} • {user?.department} — Here's your Optimile ERP overview
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Activity, label: 'Active Operations', value: '47', color: 'text-blue-500' },
          { icon: TrendingUp, label: 'Revenue (MTD)', value: '₹2.8Cr', color: 'text-green-500' },
          { icon: AlertTriangle, label: 'Open Exceptions', value: '5', color: 'text-amber-500' },
          { icon: CheckCircle, label: 'On-Time Delivery', value: '94.2%', color: 'text-emerald-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Module Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Modules</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {visibleModules.map(m => {
            const Icon = m.icon;
            return (
              <button
                key={m.module}
                onClick={() => navigate(m.path)}
                className={`text-left border rounded-xl p-6 transition-all hover:shadow-lg hover:-translate-y-0.5 ${m.color}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Icon className="h-8 w-8 mb-2" />
                    <h3 className="text-lg font-bold text-gray-900">{m.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{m.description}</p>
                  </div>
                </div>
                <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
                  {m.stats.map(s => (
                    <div key={s.label}>
                      <p className="text-xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {visibleModules.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No modules have been assigned to your account.</p>
          <p className="text-sm mt-1">Contact your administrator.</p>
        </div>
      )}
    </div>
  );
};
