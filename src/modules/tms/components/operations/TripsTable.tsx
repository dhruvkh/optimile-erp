import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Search, Download, MoreVertical, RefreshCw, Phone, ChevronLeft, ChevronRight, Truck } from 'lucide-react';

interface Trip {
  id: string;
  vehicle: string;
  driver: string;
  client: string;
  route: string;
  status: 'Pending Assignment' | 'Loading' | 'In-Transit' | 'Delayed' | 'At Delivery' | 'Completed' | 'Exception';
  progress: number;
  eta: string;
  lastUpdate: string;
  isUnassigned?: boolean;
}

// Mock Data Generation removed in favor of real context data

import { useOperationalData } from '../../../../shared/context/OperationalDataContext';

interface TripsTableProps {
  onTripSelect: (tripId: string) => void;
}

export const TripsTable: React.FC<TripsTableProps> = ({ onTripSelect }) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getStatusStyle = (status: Trip['status']) => {
    switch (status) {
      case 'Pending Assignment': return 'bg-amber-100 text-amber-800';
      case 'Loading': return 'bg-blue-100 text-blue-800';
      case 'In-Transit': return 'bg-green-100 text-green-800';
      case 'Delayed': return 'bg-yellow-100 text-yellow-800';
      case 'At Delivery': return 'bg-purple-100 text-purple-800';
      case 'Exception': return 'bg-red-100 text-red-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Map trips from context
  const { completedTrips } = useOperationalData();

  const activeTrips: Trip[] = completedTrips.map(t => {
    const isUnassigned = !t.vehicleId || t.vehicleRegNumber === 'Unassigned';
    let status: Trip['status'] = 'Loading';
    if (t.status === 'booked' && isUnassigned) status = 'Pending Assignment';
    else if (t.status === 'in_transit') status = 'In-Transit';
    else if (['delivered', 'pod_received', 'invoiced'].includes(t.status)) status = 'Completed';

    return {
      id: t.id,
      vehicle: t.vehicleRegNumber || 'Unassigned',
      driver: t.driverName || 'Unassigned',
      client: t.clientName,
      route: `${t.origin} → ${t.destination}`,
      status,
      progress: status === 'Completed' ? 100 : status === 'In-Transit' ? 50 : status === 'Pending Assignment' ? 0 : 10,
      eta: status === 'Completed' ? 'Delivered' : status === 'Pending Assignment' ? 'Awaiting vehicle' : '24h 00m',
      lastUpdate: 'Just now',
      isUnassigned,
    };
  });

  // Filter Logic
  const filteredData = activeTrips.filter(trip => {
    const matchesStatus = filterStatus === 'All' ||
      (filterStatus === 'Exceptions Only' ? (trip.status === 'Delayed' || trip.status === 'Exception') : trip.status === filterStatus);
    const matchesSearch = trip.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.vehicle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const FilterChip = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${active
        ? 'bg-primary text-white shadow-sm'
        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
        }`}
    >
      {label}
    </button>
  );

  return (
    <Card className="p-0 border border-gray-200 shadow-sm h-full flex flex-col">
      {/* Header Controls */}
      <div className="p-4 border-b border-gray-200 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            Active Trips
            <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-normal px-2 py-0.5 rounded-full border border-gray-200">
              {filteredData.length} records
            </span>
          </h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Download className="h-3.5 w-3.5 mr-2" /> Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-end lg:items-center">
          <div className="flex flex-wrap gap-2">
            <FilterChip label="All Active" active={filterStatus === 'All'} onClick={() => setFilterStatus('All')} />
            <FilterChip label="In-Transit" active={filterStatus === 'In-Transit'} onClick={() => setFilterStatus('In-Transit')} />
            <FilterChip label="Delayed" active={filterStatus === 'Delayed'} onClick={() => setFilterStatus('Delayed')} />
            <FilterChip label="Exceptions" active={filterStatus === 'Exceptions Only'} onClick={() => setFilterStatus('Exceptions Only')} />
          </div>

          <div className="flex gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search trip, vehicle..."
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trip ID / Vehicle</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client / Driver</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ETA</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((trip) => (
              <tr
                key={trip.id}
                className={`transition-colors group cursor-pointer ${trip.isUnassigned ? 'bg-amber-50/40 hover:bg-amber-50' : 'hover:bg-blue-50/30'}`}
                onClick={() => onTripSelect(trip.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-primary hover:underline">{trip.id}</span>
                    <span className={`text-xs flex items-center mt-0.5 ${trip.isUnassigned ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                      <Truck className="h-3 w-3 mr-1" />
                      {trip.isUnassigned ? 'No vehicle — click to assign' : trip.vehicle}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-900">{trip.client}</span>
                    <span className="text-xs text-gray-500">{trip.driver}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{trip.route}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(trip.status)}`}>
                    {trip.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap align-middle">
                  <div className="w-full max-w-[140px]">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${trip.status === 'Exception' || trip.status === 'Delayed' ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${trip.progress}%` }}></div>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 block text-right">{trip.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{trip.eta}</span>
                    <span className="text-[10px] text-gray-400">Updated {trip.lastUpdate}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Call Driver">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-500" title="More">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-gray-700">
              Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </div>
    </Card>
  );
};
