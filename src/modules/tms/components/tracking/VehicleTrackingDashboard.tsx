import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { DashboardVehicle, VehicleStatusType } from './types';
import { generateMockFleet } from './utils';
import { Search, Filter, MapPin, Activity, Navigation, AlertTriangle, Info, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Marker Icons based on status
const createCustomIcon = (color: string) => {
   const truckSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5)); transform: translateY(-4px);">
         <rect x="1" y="3" width="15" height="13"></rect>
         <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
         <circle cx="5.5" cy="18.5" r="2.5"></circle>
         <circle cx="18.5" cy="18.5" r="2.5"></circle>
      </svg>
   `;

   return new L.DivIcon({
      className: 'custom-div-icon bg-transparent border-none',
      html: truckSvg,
      iconSize: [28, 28],
      iconAnchor: [14, 20],
   });
};

const statusColors: Record<VehicleStatusType, string> = {
   moving: '#22c55e', // Green
   short_stop: '#eab308', // Yellow
   long_stop: '#f97316', // Orange
   offline: '#ef4444', // Red
   deviated: '#a855f7', // Purple
};

const statusLabels: Record<VehicleStatusType, string> = {
   moving: 'Moving',
   short_stop: 'Short Stop',
   long_stop: 'Long Stop',
   offline: 'Offline / No Track',
   deviated: 'Route Deviated',
};


// Component to handle dynamic map centering
const MapCenterUpdater = ({ position }: { position: [number, number] | null }) => {
   const map = useMap();
   useEffect(() => {
      if (position) {
         map.flyTo(position, 14, { duration: 1.5 });
      }
   }, [position, map]);
   return null;
};

// Component to fix Leaflet grey map loading issue by triggering a resize event
const MapResizeFix = () => {
   const map = useMap();
   useEffect(() => {
      const timer = setTimeout(() => {
         map.invalidateSize();
      }, 250);
      return () => clearTimeout(timer);
   }, [map]);
   return null;
};


export const VehicleTrackingDashboard: React.FC = () => {
   const [vehicles, setVehicles] = useState<DashboardVehicle[]>([]);
   const [searchQuery, setSearchQuery] = useState('');
   const [statusFilter, setStatusFilter] = useState<VehicleStatusType | 'all'>('all');
   const [selectedVehicle, setSelectedVehicle] = useState<DashboardVehicle | null>(null);

   // Initial Data Load & Simulation Loop
   useEffect(() => {
      const initialFleet = generateMockFleet();
      setVehicles(initialFleet);

      const interval = setInterval(() => {
         setVehicles(current =>
            current.map(v => {
               // Simulate movement for 'moving' vehicles
               if (v.status === 'moving') {
                  return {
                     ...v,
                     position: {
                        ...v.position,
                        latitude: v.position.latitude + (Math.random() - 0.5) * 0.001,
                        longitude: v.position.longitude + (Math.random() - 0.5) * 0.001,
                     }
                  };
               }
               return v;
            })
         );
      }, 5000);

      return () => clearInterval(interval);
   }, []);


   const filteredVehicles = useMemo(() => {
      return vehicles.filter(v => {
         const matchesSearch = v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.id.toLowerCase().includes(searchQuery.toLowerCase());
         const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
         return matchesSearch && matchesStatus;
      });
   }, [vehicles, searchQuery, statusFilter]);


   const handleSelectVehicle = (vehicle: DashboardVehicle) => {
      setSelectedVehicle(vehicle);
   };


   return (
      <div className="flex flex-col h-[calc(100vh-6rem)] relative animate-in fade-in duration-300">

         {/* Top Controls Bar */}
         <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-t-xl shadow-sm border-b border-gray-100 gap-4 z-10">
            <div>
               <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  Fleet Overview
                  <Badge variant="success" className="ml-3">
                     {vehicles.filter(v => v.status === 'moving').length} Active
                  </Badge>
               </h1>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
               {/* Search */}
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                     type="text"
                     placeholder="Search plate or ID..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all w-full sm:w-64"
                  />
               </div>

               {/* Filter */}
               <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                     value={statusFilter}
                     onChange={(e) => setStatusFilter(e.target.value as any)}
                     className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:ring-2 focus:ring-primary outline-none"
                  >
                     <option value="all">All Statuses</option>
                     {Object.entries(statusLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                     ))}
                  </select>
               </div>
            </div>
         </div>

         {/* Main Map Area */}
         <div className="flex-1 relative bg-gray-100 rounded-b-xl overflow-hidden border border-t-0 border-gray-200 shadow-sm flex">

            {/* The Map itself */}
            <div className="flex-1 h-full relative z-0">
               <MapContainer
                  center={[22.5937, 78.9629]} // Center of India
                  zoom={5}
                  className="h-full w-full"
                  zoomControl={false}
               >
                  <MapResizeFix />
                  <TileLayer
                     attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
                     url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                     maxZoom={20}
                  />

                  {/* Control map center smoothly via state */}
                  {selectedVehicle && (
                     <MapCenterUpdater position={[selectedVehicle.position.latitude, selectedVehicle.position.longitude]} />
                  )}

                  {filteredVehicles.map(vehicle => (
                     <Marker
                        key={vehicle.id}
                        position={[vehicle.position.latitude, vehicle.position.longitude]}
                        icon={createCustomIcon(statusColors[vehicle.status])}
                        eventHandlers={{
                           click: () => handleSelectVehicle(vehicle)
                        }}
                     >
                        {/* Optional: Small hover popup */}
                        <Popup>
                           <div className="text-center">
                              <b>{vehicle.plateNumber}</b><br />
                              {statusLabels[vehicle.status]} ({Math.round(vehicle.speed)} km/h)
                           </div>
                        </Popup>
                     </Marker>
                  ))}
               </MapContainer>

               {/* Map Legend Overlay */}
               <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur shadow-lg rounded-lg p-3 z-[1000] border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Legend</h4>
                  <div className="space-y-2">
                     {Object.entries(statusColors).map(([status, color]) => (
                        <div key={status} className="flex items-center text-xs">
                           <span className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: color }}></span>
                           <span className="text-gray-700">{statusLabels[status as VehicleStatusType]}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Selected Vehicle Info Overlay / Sidebar */}
            {selectedVehicle && (
               <div className="absolute top-4 right-4 w-80 bg-white rounded-xl shadow-2xl z-[1000] border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                     <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: statusColors[selectedVehicle.status] }}></span>
                        <h3 className="font-bold text-gray-900">{selectedVehicle.plateNumber}</h3>
                     </div>
                     <button onClick={() => setSelectedVehicle(null)} className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <X className="w-4 h-4" />
                     </button>
                  </div>

                  <div className="p-4 space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-2 rounded-lg">
                           <p className="text-xs text-gray-500 mb-1 flex items-center"><Activity className="w-3 h-3 mr-1" /> Status</p>
                           <p className="text-sm font-semibold">{statusLabels[selectedVehicle.status]}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                           <p className="text-xs text-gray-500 mb-1 flex items-center"><Navigation className="w-3 h-3 mr-1" /> Speed</p>
                           <p className="text-sm font-semibold">{Math.round(selectedVehicle.speed)} km/h</p>
                        </div>
                     </div>

                     <div>
                        <p className="text-xs text-gray-500 mb-1">Driver</p>
                        <p className="text-sm font-medium">{selectedVehicle.driverName}</p>
                     </div>

                     <div className="border border-gray-100 rounded-lg p-3 bg-blue-50/50">
                        <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center"><MapPin className="w-3 h-3 mr-1" /> Trip Details</p>
                        {selectedVehicle.tripDetails ? (
                           <div className="relative pl-4 space-y-3">
                              {/* Route line */}
                              <div className="absolute top-1.5 bottom-1.5 left-[5px] w-0.5 bg-blue-200"></div>

                              <div className="relative">
                                 <span className="absolute -left-[14.5px] top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white"></span>
                                 <p className="text-xs text-gray-500">Origin</p>
                                 <p className="text-sm font-medium">{selectedVehicle.tripDetails.origin}</p>
                              </div>

                              <div className="relative">
                                 <span className="absolute -left-[14.5px] top-1.5 w-2 h-2 rounded-full border-2 border-blue-500 bg-white shadow-sm ring-2 ring-white"></span>
                                 <p className="text-xs text-gray-500">Destination</p>
                                 <p className="text-sm font-medium">{selectedVehicle.tripDetails.destination}</p>
                              </div>

                              <div className="mt-2 pt-2 border-t border-blue-100/50">
                                 <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">Progress</span>
                                    <span className="font-medium text-blue-700">{selectedVehicle.tripDetails.progress}%</span>
                                 </div>
                                 <div className="w-full bg-blue-100 rounded-full h-1.5">
                                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${selectedVehicle.tripDetails.progress}%` }}></div>
                                 </div>
                              </div>
                           </div>
                        ) : (
                           <p className="text-xs text-gray-500 italic">No active trip assigned.</p>
                        )}
                     </div>

                     <Button className="w-full text-xs" variant="outline">View Full History</Button>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};
