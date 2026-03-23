import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Maximize2, RefreshCw, Truck, MapPin, Navigation } from 'lucide-react';
import { fleetFeed } from '../../services/fleetFeed';
import { DashboardVehicle } from '../tracking/types';

interface VehicleMarker {
  id: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  status: 'ontime' | 'delayed-minor' | 'delayed-major' | 'loading';
  plate: string;
  driver: string;
  route: string;
  eta: string;
}

const convertFleetToMarkers = (fleet: DashboardVehicle[]): VehicleMarker[] => {
  const latMin = 8, latMax = 35.5;
  const lngMin = 68.2, lngMax = 97.4;

  return fleet.map((vehicle) => {
    const x = ((vehicle.position.longitude - lngMin) / (lngMax - lngMin)) * 100;
    const y = 100 - ((vehicle.position.latitude - latMin) / (latMax - latMin)) * 100;

    let status: 'ontime' | 'delayed-minor' | 'delayed-major' | 'loading' = 'ontime';
    switch (vehicle.status) {
      case 'moving':
        status = 'ontime';
        break;
      case 'short_stop':
        status = 'delayed-minor';
        break;
      case 'long_stop':
        status = 'delayed-major';
        break;
      case 'offline':
        status = 'loading';
        break;
      case 'deviated':
        status = 'delayed-major';
        break;
    }

    const destination = vehicle.tripDetails?.destination || 'Unknown';
    const eta = vehicle.tripDetails?.eta 
      ? new Date(vehicle.tripDetails.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : '—';

    return {
      id: vehicle.id,
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
      status,
      plate: vehicle.plateNumber,
      driver: vehicle.driverName || 'Unknown',
      route: `${vehicle.tripDetails?.origin || 'Origin'} -> ${destination}`,
      eta: vehicle.status === 'offline' ? 'Offline' : eta,
    };
  });
};

export const OperationsMap: React.FC = () => {
  const [vehicles, setVehicles] = useState<DashboardVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleMarker | null>(null);

  // Subscribe to fleet feed for live updates
  useEffect(() => {
    const unsubscribe = fleetFeed.subscribe((fleet: DashboardVehicle[]) => {
      setVehicles(fleet);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const vehicleMarkers = convertFleetToMarkers(vehicles);

  const getStatusColor = (status: VehicleMarker['status']) => {
    switch (status) {
      case 'ontime': return 'bg-emerald-500 ring-emerald-200';
      case 'delayed-minor': return 'bg-amber-500 ring-amber-200';
      case 'delayed-major': return 'bg-red-500 ring-red-200';
      case 'loading': return 'bg-blue-500 ring-blue-200';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="h-full flex flex-col relative overflow-hidden p-0" bodyClassName="p-0 h-full flex">
      {/* Header overlay */}
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        <div className="bg-white/90 backdrop-blur shadow-sm px-3 py-1.5 rounded-md border border-gray-200 text-sm font-medium text-gray-700">
          Live Operations View ({vehicles.length} vehicles)
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button className="bg-white p-2 rounded-md shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-600">
          <RefreshCw className="h-4 w-4" />
        </button>
        <button className="bg-white p-2 rounded-md shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-600">
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Map Area */}
      <div className="flex-1 bg-slate-100 relative group overflow-hidden" onClick={() => setSelectedVehicle(null)}>
        {/* Loading state */}
        {vehicles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm">Initializing fleet data...</p>
            </div>
          </div>
        )}
        {/* Abstract Map Background - CSS Pattern to simulate terrain/grid */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(#1F4E78 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}>
        </div>

        {/* Approximate Map Shape (Using an SVG path for a simplified India silhouette visualization) */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-slate-200 fill-current pointer-events-none" preserveAspectRatio="none">
          {/* Abstract shape for visualization context */}
          <path d="M30,10 Q50,0 70,10 T90,30 T70,60 T50,90 T30,60 T10,30 Z" opacity="0.5" />
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-sm border border-gray-100 text-xs z-10">
          <div className="text-gray-900 font-semibold mb-2">Status</div>
          <div className="flex items-center mb-1"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> On Time ({vehicleMarkers.filter(v => v.status === 'ontime').length})</div>
          <div className="flex items-center mb-1"><span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span> Minor Delay ({vehicleMarkers.filter(v => v.status === 'delayed-minor').length})</div>
          <div className="flex items-center mb-1"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span> Major Delay ({vehicleMarkers.filter(v => v.status === 'delayed-major').length})</div>
          <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> At Hub/Offline ({vehicleMarkers.filter(v => v.status === 'loading').length})</div>
        </div>

        {/* Vehicle Markers */}
        {vehicleMarkers.map((v) => (
          <div
            key={v.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 z-20"
            style={{ left: `${v.x}%`, top: `${v.y}%` }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedVehicle(v);
            }}
          >
            <div className={`w-3 h-3 rounded-full shadow-lg ring-4 ${getStatusColor(v.status)}`} />
            {/* Pulse effect for delayed vehicles */}
            {(v.status === 'delayed-major' || v.status === 'delayed-minor') && (
              <div className={`absolute -inset-2 rounded-full opacity-50 animate-ping ${getStatusColor(v.status).split(' ')[0]}`}></div>
            )}
          </div>
        ))}

        {/* Vehicle Popup */}
        {selectedVehicle && (
          <div
            className="absolute z-30 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200"
            style={{
              left: `min(calc(${selectedVehicle.x}% + 20px), calc(100% - 270px))`,
              top: `min(${selectedVehicle.y}%, calc(100% - 150px))`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 flex justify-between items-center">
              <span className="font-semibold text-gray-900 text-sm flex items-center">
                <Truck className="h-3 w-3 mr-1 text-gray-500" />
                {selectedVehicle.plate}
              </span>
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full 
                    ${selectedVehicle.status === 'ontime' ? 'bg-green-100 text-green-700' :
                  selectedVehicle.status === 'delayed-major' ? 'bg-red-100 text-red-700' :
                    selectedVehicle.status === 'delayed-minor' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'}`}>
                {selectedVehicle.status.replace('-', ' ')}
              </span>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-start">
                <div className="w-1.5 mt-1.5 h-1.5 rounded-full bg-gray-300 mr-2 flex-shrink-0"></div>
                <div>
                  <p className="text-xs text-gray-500">Route</p>
                  <p className="text-sm font-medium text-gray-900">{selectedVehicle.route}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-1.5 mt-1.5 h-1.5 rounded-full bg-gray-300 mr-2 flex-shrink-0"></div>
                <div>
                  <p className="text-xs text-gray-500">Driver</p>
                  <p className="text-sm text-gray-900">{selectedVehicle.driver}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-1.5 mt-1.5 h-1.5 rounded-full bg-gray-300 mr-2 flex-shrink-0"></div>
                <div>
                  <p className="text-xs text-gray-500">ETA</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedVehicle.eta}</p>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-gray-100 flex space-x-2">
                <button className="flex-1 bg-primary text-white text-xs py-1.5 rounded hover:bg-primary/90 transition-colors">
                  Details
                </button>
                <button className="flex-1 bg-gray-100 text-gray-700 text-xs py-1.5 rounded hover:bg-gray-200 transition-colors">
                  Notify
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
