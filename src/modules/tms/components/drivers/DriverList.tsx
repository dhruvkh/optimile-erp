import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Search, LayoutGrid, List as ListIcon, Download, UserPlus, Users, AlertCircle, Shield, X } from 'lucide-react';
import { DriverCard } from './DriverCard';
import { AddDriverWizard } from './wizard/AddDriverWizard';
import { Driver } from './types';

// Mock Data
const MOCK_DRIVERS: Driver[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `DRV-${100 + i}`,
  name: ['Ramesh Kumar', 'Suresh Singh', 'Vijay Patil', 'Amit Das', 'Rajesh Sharma', 'Mohammed Khan'][i % 6],
  phone: '+91-98765-4321' + i,
  status: i === 2 ? 'On Leave' : i === 5 ? 'Inactive' : 'Active',
  employmentType: i % 3 === 0 ? 'Permanent' : 'Contract',
  currentVehicle: i % 2 === 0 ? `MH-01-${1000 + i}` : undefined,
  currentStatus: i === 2 ? 'On Leave' : i % 2 === 0 ? 'On Trip' : 'Available',
  license: {
    number: `MH${12 + i}2022000${i}`,
    type: 'HMV',
    validity: i === 1 ? '2024-03-01' : '2026-05-15', // i=1 expiring soon mock
    status: i === 1 ? 'Expiring Soon' : 'Valid'
  },
  rating: 4.0 + (i % 10) / 10,
  totalTrips: 120 + i * 5,
  onTimeDelivery: 90 + (i % 10),
  safetyScore: 85 + (i % 15),
  joinDate: '2021-06-15',
  location: ['Mumbai', 'Delhi', 'Bangalore'][i % 3]
}));

export const DriverList: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showWizard, setShowWizard] = useState(false);

  const filteredDrivers = MOCK_DRIVERS.filter(d => 
    (filterStatus === 'All' || d.status === filterStatus) &&
    (d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.phone.includes(searchTerm))
  );

  return (
    <>
    {showWizard && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-6 px-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl relative">
          <button
            onClick={() => setShowWizard(false)}
            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="p-6">
            <AddDriverWizard onClose={() => setShowWizard(false)} />
          </div>
        </div>
      </div>
    )}
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Total Drivers</p>
                  <h3 className="text-2xl font-bold text-gray-900">{MOCK_DRIVERS.length}</h3>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Users className="h-5 w-5" />
              </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Active & Available</p>
                  <h3 className="text-2xl font-bold text-green-600">{MOCK_DRIVERS.filter(d => d.currentStatus === 'Available').length}</h3>
              </div>
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                  <Users className="h-5 w-5" />
              </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Compliance Issues</p>
                  <h3 className="text-2xl font-bold text-orange-600">1</h3>
              </div>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
              </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Avg Safety Score</p>
                  <h3 className="text-2xl font-bold text-indigo-600">92</h3>
              </div>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Shield className="h-5 w-5" />
              </div>
          </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Driver Roster</h1>
        <div className="flex space-x-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none">
             <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button onClick={() => setShowWizard(true)} className="flex-1 md:flex-none">
             <UserPlus className="h-4 w-4 mr-2" /> Onboard Driver
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by name, phone..." 
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          <div className="flex items-center space-x-2">
              <select 
                className="block w-40 border-gray-300 rounded-md text-sm py-2 px-3 border focus:ring-primary focus:border-primary"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
              </select>
              
              <div className="flex bg-gray-100 p-1 rounded-md">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <LayoutGrid className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <ListIcon className="h-4 w-4" />
                </button>
              </div>
          </div>
      </div>

      {/* Driver List */}
      {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDrivers.map(driver => (
                <DriverCard key={driver.id} driver={driver} />
              ))}
          </div>
      ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">License</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">Assigned To</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">Performance</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDrivers.map((driver) => (
                          <tr key={driver.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{driver.name}</div>
                                <div className="text-xs text-gray-500">{driver.phone}</div>
                            </td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  driver.status === 'Active' ? 'bg-green-100 text-green-800' : 
                                  driver.status === 'On Leave' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {driver.status}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                                {driver.license.type}
                                {driver.license.status !== 'Valid' && (
                                    <span className="ml-2 text-xs text-red-600 font-bold">Expiring</span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                                {driver.currentVehicle || '-'}
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center text-xs">
                                    <span className="font-bold text-gray-900 mr-2">{driver.rating} ★</span>
                                    <span className="text-gray-500">{driver.onTimeDelivery}% OTD</span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <button className="text-primary hover:underline font-medium">View</button>
                            </td>
                          </tr>
                      ))}
                    </tbody>
                </table>
              </div>
          </div>
      )}
    </div>
    </>
  );
};
