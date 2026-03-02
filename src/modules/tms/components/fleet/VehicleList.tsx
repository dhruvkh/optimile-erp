import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Search, Filter, Plus, LayoutGrid, List as ListIcon, Download, X } from 'lucide-react';
import { VehicleCard } from './VehicleCard';
import { DocumentExpiryWidget } from './DocumentExpiryWidget';
import { AddVehicleWizard } from './wizard/AddVehicleWizard';
import { Vehicle } from './types';

// Mock Data
const MOCK_VEHICLES: Vehicle[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `VEH-${i + 1}`,
  registrationNumber: `${['MH', 'DL', 'KA', 'TN'][i % 4]}-${String(i + 10).padStart(2, '0')}-${1000 + i}`,
  type: i % 3 === 0 ? 'Container' : i % 2 === 0 ? 'Truck' : 'Trailer',
  subType: i % 3 === 0 ? '32 Ft MXL' : '20 Ton Closed',
  status: i === 2 ? 'Maintenance' : i === 5 ? 'Inactive' : 'Active',
  capacity: { weight: 20000, unit: 'kg' },
  ownership: i % 4 === 0 ? 'Leased' : 'Own',
  driver: i === 5 ? undefined : { id: `DRV-${i}`, name: ['Ramesh Kumar', 'Suresh Singh', 'Rajesh P', 'Amit Das'][i % 4], phone: '+91-9876543210' },
  location: ['Mumbai, MH', 'Delhi, DL', 'Bangalore, KA', 'Chennai, TN'][i % 4],
  totalTrips: 150 + (i * 10),
  documentsStatus: {
    allValid: i !== 1,
    expiringSoon: i === 1 ? ['Insurance'] : [],
    expired: []
  },
  maintenance: {
    last: '2024-01-15',
    nextDue: '2024-03-15',
    status: i === 2 ? 'Overdue' : 'Good'
  },
  utilizationRate: 75 + (i % 20),
  fuelType: 'Diesel',
  mileage: 3.5
}));

export const VehicleList: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  const filteredVehicles = MOCK_VEHICLES.filter(v => 
    v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.type.toLowerCase().includes(searchTerm.toLowerCase())
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
            <AddVehicleWizard onClose={() => setShowWizard(false)} />
          </div>
        </div>
      </div>
    )}
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage {MOCK_VEHICLES.length} vehicles across 4 regions</p>
        </div>
        <div className="flex space-x-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none">
             <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button onClick={() => setShowWizard(true)} className="flex-1 md:flex-none">
             <Plus className="h-4 w-4 mr-2" /> Add Vehicle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
           {/* Filters Bar */}
           <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between gap-3">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <input 
                    type="text" 
                    placeholder="Search by reg number, type..." 
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="flex items-center space-x-2">
                 <Button variant="outline" size="sm" onClick={() => setFilterOpen(!filterOpen)}>
                    <Filter className="h-4 w-4 mr-2" /> Filter
                 </Button>
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

           {/* Filter Panel (Collapsible) */}
           {filterOpen && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
                 <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select className="block w-full border-gray-300 rounded-md text-sm py-1.5">
                       <option>All Statuses</option>
                       <option>Active</option>
                       <option>Maintenance</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select className="block w-full border-gray-300 rounded-md text-sm py-1.5">
                       <option>All Types</option>
                       <option>Truck</option>
                       <option>Trailer</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ownership</label>
                    <select className="block w-full border-gray-300 rounded-md text-sm py-1.5">
                       <option>All</option>
                       <option>Own</option>
                       <option>Leased</option>
                    </select>
                 </div>
                 <div className="flex items-end">
                    <button className="text-xs text-primary hover:underline">Reset Filters</button>
                 </div>
              </div>
           )}

           {/* List/Grid View */}
           {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                 {filteredVehicles.map(vehicle => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                 ))}
              </div>
           ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                       <thead className="bg-gray-50">
                          <tr>
                             <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                             <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Type</th>
                             <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                             <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                             <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                             <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-gray-200">
                          {filteredVehicles.map((vehicle) => (
                             <tr key={vehicle.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{vehicle.registrationNumber}</td>
                                <td className="px-4 py-3 text-gray-500">{vehicle.type}</td>
                                <td className="px-4 py-3">
                                   <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                      vehicle.status === 'Active' ? 'bg-green-100 text-green-800' : 
                                      vehicle.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                   }`}>
                                      {vehicle.status}
                                   </span>
                                </td>
                                <td className="px-4 py-3 text-gray-500">{vehicle.driver?.name || '-'}</td>
                                <td className="px-4 py-3 text-gray-900 font-bold">{vehicle.utilizationRate}%</td>
                                <td className="px-4 py-3 text-right">
                                   <button className="text-primary hover:underline">View</button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-6">
           <DocumentExpiryWidget />
           
           {/* Quick Stats */}
           <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Fleet Overview</h3>
              <div className="space-y-3">
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Vehicles</span>
                    <span className="font-bold">{MOCK_VEHICLES.length}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Active</span>
                    <span className="font-bold text-green-600">{MOCK_VEHICLES.filter(v => v.status === 'Active').length}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Maintenance</span>
                    <span className="font-bold text-yellow-600">{MOCK_VEHICLES.filter(v => v.status === 'Maintenance').length}</span>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
    </>
  );
};
