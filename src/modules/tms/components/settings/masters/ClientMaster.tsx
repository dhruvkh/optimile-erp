
import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import {
  Search, Plus, Phone, Crown, AlertTriangle, FileText, MoreVertical,
  Building, CheckCircle, Info
} from 'lucide-react';
import { masterDataStore } from '../../../../../shared/services/masterDataStore';
import { PlatformCustomer, CustomerTier } from '../../../../../shared/types/customer';
import { ClientForm } from './ClientForm';

const TIER_STYLES: Record<CustomerTier, { bg: string; text: string; border: string }> = {
  Premium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  Standard: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
  Basic: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
};

export const ClientMaster: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterOutstanding, setFilterOutstanding] = useState<string>('All');

  // Subscribe to shared store
  useEffect(() => {
    const unsub = masterDataStore.subscribe(() => setTick(t => t + 1));
    return unsub;
  }, []);

  const customers = masterDataStore.getCustomers();

  // Filter Logic
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.gstin || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'All' || c.tier === filterTier;
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;

    let matchesOutstanding = true;
    if (filterOutstanding === '> 80% Limit') {
      matchesOutstanding = c.financial.creditLimit > 0 && (c.financial.outstanding / c.financial.creditLimit) > 0.8;
    } else if (filterOutstanding === 'Zero') {
      matchesOutstanding = c.financial.outstanding === 0;
    } else if (filterOutstanding === 'Over Limit') {
      matchesOutstanding = c.financial.outstanding > c.financial.creditLimit;
    }

    return matchesSearch && matchesTier && matchesStatus && matchesOutstanding;
  });

  const handleEdit = (customer: PlatformCustomer) => {
    setSelectedCustomerId(customer.id);
    setView('form');
  };

  const handleAddNew = () => {
    setSelectedCustomerId(null);
    setView('form');
  };

  const handleSave = (customer: PlatformCustomer) => {
    if (selectedCustomerId) {
      masterDataStore.updateCustomer(selectedCustomerId, customer);
    } else {
      masterDataStore.createCustomer(customer);
    }
    setView('list');
  };

  const calculateUtilization = (c: PlatformCustomer) => {
    if (!c.financial.creditLimit || c.financial.creditLimit === 0) return 0;
    return (c.financial.outstanding / c.financial.creditLimit) * 100;
  };

  const isOverLimit = (c: PlatformCustomer) => masterDataStore.isCustomerOverCreditLimit(c.id);

  // Stats
  const activeCount = customers.filter(c => c.status === 'Active').length;
  const premiumCount = customers.filter(c => c.tier === 'Premium').length;
  const overLimitCount = customers.filter(c => isOverLimit(c)).length;
  const totalOutstanding = customers.reduce((sum, c) => sum + c.financial.outstanding, 0);

  if (view === 'form') {
    const customerData = selectedCustomerId ? masterDataStore.getCustomer(selectedCustomerId) : null;
    return (
      <ClientForm
        initialData={customerData ?? null}
        onSave={handleSave}
        onCancel={() => setView('list')}
      />
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in slide-in-from-right-4 duration-300">

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Customer Master</h2>
          <p className="text-sm text-gray-500">Manage {customers.length} customer profiles <span className="text-xs text-blue-600">(TMS Owned · Platform Shared)</span></p>
        </div>
        <div className="flex space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleAddNew} className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" /> Add Customer
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-500">Total Customers</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{customers.length}</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-lg p-3">
          <div className="text-xs text-gray-500">Active</div>
          <div className="text-2xl font-bold text-green-700 mt-1">{activeCount}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
          <div className="text-xs text-gray-500 flex items-center"><Crown className="h-3 w-3 mr-1" /> Premium</div>
          <div className="text-2xl font-bold text-yellow-700 mt-1">{premiumCount}</div>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
          <div className="text-xs text-gray-500">Total Outstanding</div>
          <div className="text-lg font-bold text-purple-700 mt-1">₹{(totalOutstanding / 100000).toFixed(1)}L</div>
        </div>
        {overLimitCount > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <div className="text-xs text-gray-500 flex items-center"><AlertTriangle className="h-3 w-3 mr-1" /> Over Credit Limit</div>
            <div className="text-2xl font-bold text-red-700 mt-1">{overLimitCount}</div>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">

        {/* Main Table Area */}
        <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GSTIN</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit Utilization</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => {
                  const util = calculateUtilization(customer);
                  const overLimit = isOverLimit(customer);
                  const tierStyle = TIER_STYLES[customer.tier];
                  return (
                    <tr key={customer.id} className={`hover:bg-gray-50 transition-colors group ${overLimit ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-bold text-gray-900">{customer.name}</div>
                          <div className="text-xs text-gray-500">{customer.id}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tierStyle.bg} ${tierStyle.text} border ${tierStyle.border}`}>
                          {customer.tier === 'Premium' && <Crown className="w-3 h-3 mr-1" />}
                          {customer.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.contacts.primary.name}</div>
                        <div className="text-xs text-gray-500 flex items-center mt-0.5">
                          <Phone className="h-3 w-3 mr-1" /> {customer.contacts.primary.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs font-mono text-gray-600">{customer.gstin || '-'}</div>
                        {customer.gstinVerified && (
                          <span className="flex items-center text-green-600 text-[10px]"><CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Verified</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap w-48">
                        <div className="text-xs mb-1 flex justify-between">
                          <span>₹{customer.financial.outstanding.toLocaleString()}</span>
                          <span className="text-gray-400">/ {customer.financial.creditLimit.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${util > 100 ? 'bg-red-600' : util > 90 ? 'bg-red-500' : util > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(util, 100)}%` }}
                          ></div>
                        </div>
                        {overLimit && (
                          <p className="text-[10px] text-red-600 mt-1 flex items-center font-medium">
                            <AlertTriangle className="h-3 w-3 mr-1" /> OVER LIMIT — Block Bookings
                          </p>
                        )}
                        {util > 80 && !overLimit && (
                          <p className="text-[10px] text-amber-600 mt-1 flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" /> High Utilization ({util.toFixed(0)}%)
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${customer.financial.gstChargeType === 'FORWARD' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                          }`}>
                          {customer.financial.gstChargeType === 'FORWARD' ? 'Forward (12%)' : 'RCM (5%)'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${customer.status === 'Active' ? 'bg-green-100 text-green-800' :
                            customer.status === 'On Hold' ? 'bg-red-100 text-red-800' :
                              customer.status === 'Suspended' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                          }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => handleEdit(customer)}>Edit</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2"><MoreVertical className="h-3 w-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
            <span>Showing {filteredCustomers.length} of {customers.length} customers</span>
          </div>
        </div>

        {/* Filters Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
          <Card title="Filters" className="h-auto">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tier</label>
                <select
                  className="block w-full border-gray-300 rounded-md text-xs py-1.5 focus:ring-primary focus:border-primary border"
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                >
                  <option value="All">All Tiers</option>
                  <option value="Premium">Premium</option>
                  <option value="Standard">Standard</option>
                  <option value="Basic">Basic</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="block w-full border-gray-300 rounded-md text-xs py-1.5 focus:ring-primary focus:border-primary border"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Credit Utilization</label>
                <select
                  className="block w-full border-gray-300 rounded-md text-xs py-1.5 focus:ring-primary focus:border-primary border"
                  value={filterOutstanding}
                  onChange={(e) => setFilterOutstanding(e.target.value)}
                >
                  <option value="All">Any Amount</option>
                  <option value="Over Limit">Over Credit Limit</option>
                  <option value="> 80% Limit">Critical (&gt; 80%)</option>
                  <option value="Zero">Zero Outstanding</option>
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => {
                  setFilterTier('All');
                  setFilterStatus('All');
                  setFilterOutstanding('All');
                  setSearchTerm('');
                }}
              >
                Reset All
              </Button>
            </div>
          </Card>

          <Card className="bg-blue-50 border-blue-100">
            <div className="flex items-start">
              <Info className="h-4 w-4 text-blue-600 mr-2 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-blue-900">GST Charge Models</h4>
                <p className="text-[10px] text-blue-700 mt-1"><strong>Forward (12%)</strong> — Transporter charges GST on invoice</p>
                <p className="text-[10px] text-blue-700"><strong>RCM (5%)</strong> — Customer pays GST under Reverse Charge</p>
              </div>
            </div>
          </Card>

          {overLimitCount > 0 && (
            <Card className="bg-red-50 border-red-100">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-900">Credit Alert</h4>
                  <p className="text-xs text-red-700 mt-1">{overLimitCount} customer(s) over credit limit. New bookings should be blocked until outstanding is cleared.</p>
                </div>
              </div>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
};
