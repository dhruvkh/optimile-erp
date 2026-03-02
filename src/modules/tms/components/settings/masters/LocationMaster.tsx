
import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { 
  Search, Plus, MapPin, Building, Warehouse, Coffee, 
  Phone, Clock, Edit, Navigation
} from 'lucide-react';
import { Location } from './types';
import { LocationForm } from './LocationForm';

// MOCK LOCATIONS
const generateMockLocations = (): Location[] => {
  return [
    {
      id: 'LOC-001',
      code: 'LOC-001',
      name: 'Andheri Hub - Mumbai',
      type: 'Hub',
      address: { street: 'Plot 45, Andheri MIDC', city: 'Mumbai', state: 'Maharashtra', pincode: '400093', coordinates: { lat: 30, lng: 20 } },
      contact: { person: 'Site Manager', phone: '+91-98765-11111', email: 'andheri@company.com' },
      operatingHours: {
        weekday: { open: '06:00', close: '22:00' },
        saturday: { open: '06:00', close: '20:00' },
        sunday: { open: '08:00', close: '18:00' }
      },
      facilities: { loadingBays: 12, parkingSpaces: 50, restrooms: true, fuel: true, mechanic: true, security: true },
      geofence: { radius: 500, alertOnEntry: true, alertOnExit: true },
      linkedClients: [],
      status: 'Active'
    },
    {
      id: 'LOC-002',
      code: 'LOC-002',
      name: 'Bhiwandi Warehouse',
      type: 'Warehouse',
      address: { street: 'Building 4, Logistics Park', city: 'Bhiwandi', state: 'Maharashtra', pincode: '421302', coordinates: { lat: 35, lng: 25 } },
      contact: { person: 'Rajesh Kumar', phone: '+91-98765-22222', email: 'bhiwandi@company.com' },
      operatingHours: {
        weekday: { open: '00:00', close: '23:59' },
        saturday: { open: '00:00', close: '23:59' },
        sunday: { open: '00:00', close: '23:59' }
      },
      facilities: { loadingBays: 20, parkingSpaces: 100, restrooms: true, fuel: false, mechanic: false, security: true },
      geofence: { radius: 1000, alertOnEntry: true, alertOnExit: true },
      linkedClients: [],
      status: 'Active'
    },
    {
      id: 'LOC-003',
      code: 'LOC-003',
      name: 'Pune Customer Site',
      type: 'Customer Site',
      address: { street: 'Tech Park, Hinjewadi', city: 'Pune', state: 'Maharashtra', pincode: '411057', coordinates: { lat: 40, lng: 30 } },
      contact: { person: 'Client Rep', phone: '+91-98765-33333', email: 'pune@client.com' },
      operatingHours: {
        weekday: { open: '09:00', close: '18:00' },
        saturday: { open: '', close: '' },
        sunday: { open: '', close: '' }
      },
      facilities: { loadingBays: 2, parkingSpaces: 5, restrooms: true, fuel: false, mechanic: false, security: true },
      geofence: { radius: 200, alertOnEntry: true, alertOnExit: true },
      linkedClients: [],
      status: 'Active'
    }
  ];
};

export const LocationMaster: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null); // For map highlight
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formLocation, setFormLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    setLocations(generateMockLocations());
  }, []);

  const filteredLocations = locations.filter(l => 
    (l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.code.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterType === 'All' || l.type === filterType)
  );

  const handleEdit = (loc: Location) => {
    setFormLocation(loc);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setFormLocation(null);
    setIsFormOpen(true);
  };

  const handleSave = (location: Location) => {
    if (formLocation) {
      setLocations(prev => prev.map(l => l.id === location.id ? location : l));
    } else {
      setLocations(prev => [...prev, location]);
    }
    setIsFormOpen(false);
  };

  if (isFormOpen) {
    return <LocationForm initialData={formLocation} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />;
  }

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Hub': return <Building className="h-4 w-4" />;
      case 'Warehouse': return <Warehouse className="h-4 w-4" />;
      case 'Rest Stop': return <Coffee className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Hub': return 'bg-blue-500 border-blue-600';
      case 'Warehouse': return 'bg-green-500 border-green-600';
      case 'Customer Site': return 'bg-yellow-500 border-yellow-600';
      default: return 'bg-gray-500 border-gray-600';
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
            <h2 className="text-lg font-bold text-gray-900">Location Master</h2>
            <p className="text-sm text-gray-500">Manage hubs, warehouses, and customer sites with geofencing.</p>
        </div>
        <Button size="sm" onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" /> Add Location
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Pane: List */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
            
            {/* Search & Filters */}
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search locations..." 
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex space-x-2 overflow-x-auto pb-1">
                    {['All', 'Hub', 'Warehouse', 'Customer Site'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                filterType === type 
                                    ? 'bg-primary text-white' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {filteredLocations.map(loc => (
                    <div 
                        key={loc.id}
                        onClick={() => setSelectedLocation(loc)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedLocation?.id === loc.id 
                                ? 'bg-blue-50 border-primary shadow-sm' 
                                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className={`p-1.5 rounded text-white ${
                                    loc.type === 'Hub' ? 'bg-blue-500' : 
                                    loc.type === 'Warehouse' ? 'bg-green-500' : 'bg-yellow-500'
                                }`}>
                                    {getTypeIcon(loc.type)}
                                </span>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">{loc.name}</h4>
                                    <p className="text-xs text-gray-500">{loc.code} • {loc.type}</p>
                                </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleEdit(loc); }} className="text-gray-400 hover:text-primary p-1">
                                <Edit className="h-4 w-4" />
                            </button>
                        </div>
                        
                        <div className="space-y-1.5 ml-9">
                            <p className="text-xs text-gray-600 flex items-start">
                                <MapPin className="h-3 w-3 mr-1.5 mt-0.5 flex-shrink-0 text-gray-400" />
                                {loc.address.city}, {loc.address.pincode}
                            </p>
                            <p className="text-xs text-gray-600 flex items-center">
                                <Phone className="h-3 w-3 mr-1.5 text-gray-400" />
                                {loc.contact.phone}
                            </p>
                            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex items-center">
                                    <Clock className="h-3 w-3 mr-1" /> {loc.operatingHours.weekday.open} - {loc.operatingHours.weekday.close}
                                </span>
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                    {loc.facilities.loadingBays} Bays
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Right Pane: Map */}
        <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative">
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded shadow text-xs font-medium text-gray-700">
                Visualizing {filteredLocations.length} locations
            </div>

            {/* Map Visualization */}
            <div className="w-full h-full bg-slate-100 relative" onClick={() => setSelectedLocation(null)}>
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-20" 
                     style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
                </div>
                
                {/* Abstract Map SVG */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none text-slate-300 fill-current opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M10,10 Q30,5 50,10 T90,30 T80,70 T50,90 T20,70 T10,30 Z" />
                </svg>

                {/* Markers */}
                {filteredLocations.map(loc => (
                    <div
                        key={loc.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                        style={{ left: `${loc.address.coordinates.lng + 20}%`, top: `${loc.address.coordinates.lat + 20}%` }}
                        onClick={(e) => { e.stopPropagation(); setSelectedLocation(loc); }}
                    >
                        {/* Geofence Circle (Visible on hover or select) */}
                        <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed opacity-0 transition-opacity pointer-events-none ${
                            selectedLocation?.id === loc.id ? 'opacity-100 border-primary bg-primary/10' : 'group-hover:opacity-30 border-gray-400'
                        }`}
                        style={{ width: '80px', height: '80px' }} // Mock radius
                        ></div>

                        {/* Pin */}
                        <div className={`w-8 h-8 rounded-full shadow-lg border-2 border-white flex items-center justify-center text-white transition-transform ${
                            selectedLocation?.id === loc.id ? 'scale-125 z-30' : 'scale-100 hover:scale-110 z-20'
                        } ${getTypeColor(loc.type)}`}>
                            {getTypeIcon(loc.type)}
                        </div>
                        
                        {/* Tooltip */}
                        <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs whitespace-nowrap z-30 pointer-events-none transition-opacity ${
                            selectedLocation?.id === loc.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                            <span className="font-bold text-gray-800">{loc.name}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Selected Location Details Overlay */}
            {selectedLocation && (
                <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 animate-in slide-in-from-bottom-2 z-30 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-gray-900">{selectedLocation.name}</h3>
                        <p className="text-xs text-gray-500">{selectedLocation.address.street}, {selectedLocation.address.city}</p>
                        <div className="flex gap-3 mt-2 text-xs">
                            <span className="flex items-center text-gray-600"><Navigation className="h-3 w-3 mr-1" /> Geofence: {selectedLocation.geofence.radius}m</span>
                            <span className="flex items-center text-gray-600"><Building className="h-3 w-3 mr-1" /> {selectedLocation.facilities.loadingBays} Bays</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(selectedLocation)}>
                            Edit Details
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setSelectedLocation(null)}>
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};
