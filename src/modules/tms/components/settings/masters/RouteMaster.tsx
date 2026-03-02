
import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { 
  Search, Plus, MapPin, Navigation, Clock, Map as MapIcon, 
  List as ListIcon, Upload, IndianRupee, MoreVertical, Edit
} from 'lucide-react';
import { Route } from './types';
import { RouteForm } from './RouteForm';

// MOCK ROUTES GENERATOR
const generateMockRoutes = (): Route[] => {
  return [
    {
      id: 'ROU-001',
      code: 'ROU-001',
      name: 'Mumbai - Delhi Express',
      origin: { city: 'Mumbai', state: 'Maharashtra', hub: 'Andheri Hub' },
      destination: { city: 'Delhi', state: 'Delhi', hub: 'Okhla Hub' },
      distance: 1450,
      estimatedTime: 24,
      highways: ['NH-48', 'NH-8'],
      tolls: [
        { id: 't1', name: 'Vadodara Toll', cost: 450 },
        { id: 't2', name: 'Udaipur Toll', cost: 380 },
        { id: 't3', name: 'Jaipur Toll', cost: 290 }
      ],
      totalTollCost: 1120,
      stopsRecommended: [
        { id: 's1', name: 'Vadodara Dhaba', km: 450, facilities: ['Food', 'Fuel'] }
      ],
      historical: { avgRate: 52000, avgTime: 26, lastUpdated: '2024-02-01' },
      status: 'Active'
    },
    {
      id: 'ROU-002',
      code: 'ROU-002',
      name: 'Bangalore - Chennai',
      origin: { city: 'Bangalore', state: 'Karnataka', hub: 'Peenya' },
      destination: { city: 'Chennai', state: 'Tamil Nadu', hub: 'Guindy' },
      distance: 350,
      estimatedTime: 6.5,
      highways: ['NH-44', 'NH-48'],
      tolls: [{ id: 't4', name: 'Hosur Toll', cost: 120 }],
      totalTollCost: 120,
      stopsRecommended: [],
      historical: { avgRate: 18000, avgTime: 7, lastUpdated: '2024-02-05' },
      status: 'Active'
    },
    {
      id: 'ROU-003',
      code: 'ROU-003',
      name: 'Kolkata - Patna',
      origin: { city: 'Kolkata', state: 'West Bengal' },
      destination: { city: 'Patna', state: 'Bihar' },
      distance: 580,
      estimatedTime: 11,
      highways: ['NH-19'],
      tolls: [],
      totalTollCost: 0,
      stopsRecommended: [],
      historical: { avgRate: 28000, avgTime: 12, lastUpdated: '2024-01-20' },
      status: 'Inactive'
    }
  ];
};

export const RouteMaster: React.FC = () => {
  const [view, setView] = useState<'list' | 'map'>('list');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  useEffect(() => {
    setRoutes(generateMockRoutes());
  }, []);

  const filteredRoutes = routes.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.origin.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.destination.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNew = () => {
    setSelectedRoute(null);
    setIsFormOpen(true);
  };

  const handleEdit = (route: Route) => {
    setSelectedRoute(route);
    setIsFormOpen(true);
  };

  const handleSave = (route: Route) => {
    if (selectedRoute) {
      setRoutes(prev => prev.map(r => r.id === route.id ? route : r));
    } else {
      setRoutes(prev => [...prev, route]);
    }
    setIsFormOpen(false);
  };

  if (isFormOpen) {
    return (
      <RouteForm 
        initialData={selectedRoute} 
        onSave={handleSave} 
        onCancel={() => setIsFormOpen(false)} 
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-lg font-bold text-gray-900">Route Master</h2>
            <p className="text-sm text-gray-500">Manage standard routes, distances, and toll details.</p>
        </div>
        <div className="flex space-x-2">
            <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" /> Bulk Upload
            </Button>
            <Button size="sm" onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" /> Add Route
            </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col h-full gap-4">
          
          {/* Controls */}
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                      type="text" 
                      placeholder="Search routes..." 
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <div className="flex bg-gray-100 p-1 rounded-md self-start sm:self-auto">
                  <button 
                      onClick={() => setView('list')}
                      className={`p-2 rounded-md flex items-center transition-colors ${view === 'list' ? 'bg-white shadow text-primary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      <ListIcon className="h-4 w-4 mr-2" /> List
                  </button>
                  <button 
                      onClick={() => setView('map')}
                      className={`p-2 rounded-md flex items-center transition-colors ${view === 'map' ? 'bg-white shadow text-primary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      <MapIcon className="h-4 w-4 mr-2" /> Map View
                  </button>
              </div>
          </div>

          {/* List View */}
          {view === 'list' && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route Info</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origin → Destination</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance / Time</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Financials</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                              {filteredRoutes.map((route) => (
                                  <tr key={route.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => handleEdit(route)}>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="text-sm font-bold text-gray-900">{route.name}</div>
                                          <div className="text-xs text-gray-500">{route.code}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex items-center text-sm text-gray-900">
                                              <span className="font-medium">{route.origin.city}</span>
                                              <Navigation className="h-3 w-3 mx-2 text-primary rotate-90" />
                                              <span className="font-medium">{route.destination.city}</span>
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                              Via {route.highways.join(', ')}
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                          <div className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {route.distance} km</div>
                                          <div className="flex items-center mt-1"><Clock className="h-3 w-3 mr-1" /> ~{route.estimatedTime} hrs</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="text-sm font-medium text-gray-900">
                                              Avg Rate: ₹{route.historical.avgRate.toLocaleString()}
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                              Tolls: ₹{route.totalTollCost}
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                              route.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                          }`}>
                                              {route.status}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                          <button 
                                              onClick={(e) => { e.stopPropagation(); handleEdit(route); }}
                                              className="text-gray-400 hover:text-primary transition-colors"
                                          >
                                              <Edit className="h-4 w-4" />
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* Map View Placeholder */}
          {view === 'map' && (
              <Card className="h-[600px] p-0 overflow-hidden relative bg-slate-100 border border-gray-300" bodyClassName="p-0 h-full">
                  <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur p-3 rounded-lg shadow-sm border border-gray-200 max-w-xs">
                      <h4 className="font-bold text-gray-900 text-sm mb-1">Network Visualization</h4>
                      <p className="text-xs text-gray-500">
                          Displaying {filteredRoutes.length} active routes. Click on a route line to view details.
                      </p>
                  </div>

                  {/* Abstract Map Visualization */}
                  <div className="w-full h-full relative">
                      {/* Grid Background */}
                      <div className="absolute inset-0 opacity-10" 
                           style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
                      </div>
                      
                      {/* SVG Layer for Lines */}
                      <svg className="absolute inset-0 w-full h-full">
                          {/* Simplified representation of India-like connectivity */}
                          {filteredRoutes.map((route, i) => (
                              <g key={route.id} className="cursor-pointer hover:opacity-80 group" onClick={() => handleEdit(route)}>
                                  {/* Route Line */}
                                  <line 
                                      x1={`${20 + (i * 15)}%`} y1={`${30 + (i * 10)}%`} 
                                      x2={`${60 + (i * 5)}%`} y2={`${20 + (i * 15)}%`} 
                                      stroke={route.status === 'Active' ? '#3b82f6' : '#94a3b8'} 
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                  />
                                  {/* Origin Dot */}
                                  <circle cx={`${20 + (i * 15)}%`} cy={`${30 + (i * 10)}%`} r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
                                  {/* Dest Dot */}
                                  <circle cx={`${60 + (i * 5)}%`} cy={`${20 + (i * 15)}%`} r="4" fill="white" stroke="#ef4444" strokeWidth="2" />
                                  
                                  {/* Tooltip on hover (simulated via title for simplicity in SVG) */}
                                  <title>{route.name} ({route.distance} km)</title>
                              </g>
                          ))}
                      </svg>
                  </div>
              </Card>
          )}
      </div>
    </div>
  );
};
