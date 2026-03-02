
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Maximize2, RefreshCw, Truck, MapPin, Navigation, Layers, ZoomIn, ZoomOut, AlertOctagon } from 'lucide-react';
import { useOperationalData } from '../../../../shared/context/OperationalDataContext';

interface VehicleMarker {
  id: string;
  tripId: string; // Add trip ID reference
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  status: 'ontime' | 'delayed-minor' | 'delayed-major' | 'loading' | 'breakdown';
  plate: string;
  driver: string;
  route: string;
  eta: string;
  speed: number;
}

// Mock locations roughly mapped to an abstract map layout
const MOCK_VEHICLES_CONFIG: { x: number; y: number; status: VehicleMarker['status']; eta: string; speed: number }[] = [
  { x: 28, y: 35, status: 'ontime', eta: '4h 20m', speed: 65 },
  { x: 25, y: 65, status: 'delayed-major', eta: '2h 10m', speed: 12 },
  { x: 45, y: 75, status: 'loading', eta: 'Loading', speed: 0 },
  { x: 65, y: 45, status: 'ontime', eta: '6h 15m', speed: 58 },
  { x: 30, y: 25, status: 'delayed-minor', eta: '3h 30m', speed: 45 },
  { x: 40, y: 55, status: 'breakdown', eta: 'Unknown', speed: 0 },
  { x: 35, y: 85, status: 'ontime', eta: '5h 00m', speed: 62 },
  { x: 15, y: 45, status: 'ontime', eta: '3h 15m', speed: 70 },
];

interface LiveMapProps {
  onVehicleSelect?: (vehicleId: string) => void;
}

export const LiveMap: React.FC<LiveMapProps> = ({ onVehicleSelect }) => {
  const { completedTrips } = useOperationalData();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleMarker | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Map completed trips to vehicle markers
  const MOCK_VEHICLES: VehicleMarker[] = completedTrips.slice(0, 8).map((trip, index) => {
    const config = MOCK_VEHICLES_CONFIG[index];
    return {
      id: String(index + 1),
      tripId: trip.id,
      x: config.x,
      y: config.y,
      status: config.status,
      plate: trip.vehicleRegNumber || 'Unassigned',
      driver: trip.driverName || 'Unassigned',
      route: `${trip.origin} → ${trip.destination}`,
      eta: config.eta,
      speed: config.speed,
    };
  });

  const getStatusColor = (status: VehicleMarker['status']) => {
    switch (status) {
      case 'ontime': return 'bg-emerald-500 ring-emerald-200';
      case 'delayed-minor': return 'bg-amber-500 ring-amber-200';
      case 'delayed-major': return 'bg-orange-500 ring-orange-200';
      case 'loading': return 'bg-blue-500 ring-blue-200';
      case 'breakdown': return 'bg-red-600 ring-red-200';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: VehicleMarker['status']) => {
      if (status === 'breakdown') return <AlertOctagon className="w-3 h-3 text-white" />;
      if (status === 'loading') return <Navigation className="w-3 h-3 text-white" />;
      return <Truck className="w-3 h-3 text-white" />;
  };

  return (
    <Card className="h-full flex flex-col min-h-[500px] relative overflow-hidden p-0 border border-gray-200 shadow-md">
      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        <div className="bg-white/90 backdrop-blur shadow-sm px-3 py-1.5 rounded-md border border-gray-200 text-sm font-medium text-gray-700 flex items-center">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></span>
          Live Operations
        </div>
      </div>
      
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
         <div className="bg-white rounded-md shadow-sm border border-gray-200 flex flex-col">
            <button className="p-2 hover:bg-gray-50 text-gray-600 border-b border-gray-100" onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 3))}>
                <ZoomIn className="h-4 w-4" />
            </button>
            <button className="p-2 hover:bg-gray-50 text-gray-600" onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 1))}>
                <ZoomOut className="h-4 w-4" />
            </button>
         </div>
         <button className="bg-white p-2 rounded-md shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-600">
            <Layers className="h-4 w-4" />
         </button>
         <button className="bg-white p-2 rounded-md shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-600">
            <Maximize2 className="h-4 w-4" />
         </button>
      </div>

      {/* Map Area */}
      <div className="flex-1 bg-slate-100 relative group overflow-hidden" onClick={() => setSelectedVehicle(null)}>
        {/* Abstract Map Background */}
        <div className="absolute inset-0 bg-[#e5e9ec]"></div>
        
        {/* Map Grid/Water Simulation */}
        <div className="absolute inset-0 opacity-20" 
             style={{ 
               backgroundImage: 'linear-gradient(#1F4E78 1px, transparent 1px), linear-gradient(90deg, #1F4E78 1px, transparent 1px)', 
               backgroundSize: '40px 40px',
               transform: `scale(${zoomLevel})`,
               transformOrigin: 'center center',
               transition: 'transform 0.3s ease-in-out'
             }}>
        </div>
        
        {/* Approximate Map Shape (Using an SVG path) */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-slate-300 fill-current pointer-events-none" preserveAspectRatio="none"
             style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.3s ease-in-out' }}>
             <path d="M30,10 Q50,0 70,10 T90,30 T70,60 T50,90 T30,60 T10,30 Z" opacity="0.6" />
             {/* Mock Route Lines */}
             <path d="M28,35 L65,45" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2,1" fill="none" />
             <path d="M25,65 L28,35" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2,1" fill="none" />
             <path d="M40,55 L35,85" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2,1" fill="none" />
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-sm border border-gray-100 text-xs z-10 hidden sm:block">
           <div className="font-semibold mb-2 text-gray-700">Vehicle Status</div>
           <div className="flex items-center mb-1"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> On Time</div>
           <div className="flex items-center mb-1"><span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span> Minor Delay</div>
           <div className="flex items-center mb-1"><span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span> Major Delay</div>
           <div className="flex items-center mb-1"><span className="w-2 h-2 rounded-full bg-red-600 mr-2"></span> Breakdown</div>
           <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> At Hub</div>
        </div>

        {/* Vehicle Markers */}
        <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.3s ease-in-out', width: '100%', height: '100%', position: 'absolute' }}>
            {MOCK_VEHICLES.map((v) => (
            <div
                key={v.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                style={{ left: `${v.x}%`, top: `${v.y}%` }}
                onClick={(e) => {
                e.stopPropagation();
                setSelectedVehicle(v);
                }}
            >
                {/* Ping animation for issues */}
                {(v.status === 'delayed-major' || v.status === 'breakdown') && (
                    <div className={`absolute -inset-3 rounded-full opacity-50 animate-ping ${getStatusColor(v.status).split(' ')[0]}`}></div>
                )}
                
                {/* Marker */}
                <div className={`w-6 h-6 rounded-full shadow-lg ring-2 flex items-center justify-center transition-transform hover:scale-110 ${getStatusColor(v.status)}`}>
                    {getStatusIcon(v.status)}
                </div>
                
                {/* Tooltip on hover */}
                <div className="absolute top-7 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {v.plate}
                </div>
            </div>
            ))}
        </div>

        {/* Vehicle Popup Card */}
        {selectedVehicle && (
          <div 
            className="absolute z-30 w-72 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200"
            style={{ 
                left: `min(calc(${selectedVehicle.x * zoomLevel}% + 20px), calc(100% - 300px))`, 
                top: `min(${selectedVehicle.y * zoomLevel}%, calc(100% - 200px))` 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm flex items-center">
                    <Truck className="h-4 w-4 mr-2 text-gray-500" />
                    {selectedVehicle.plate}
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full 
                    ${selectedVehicle.status === 'ontime' ? 'bg-green-100 text-green-700' : 
                      selectedVehicle.status === 'delayed-major' ? 'bg-orange-100 text-orange-700' :
                      selectedVehicle.status === 'breakdown' ? 'bg-red-100 text-red-700' :
                      selectedVehicle.status === 'delayed-minor' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'}`}>
                    {selectedVehicle.status.replace('-', ' ')}
                </span>
            </div>
            <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-gray-500">Speed</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedVehicle.speed} km/h</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">ETA</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedVehicle.eta}</p>
                    </div>
                </div>
                
                <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-start mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 mr-2"></div>
                        <div>
                            <p className="text-xs text-gray-500">Current Route</p>
                            <p className="text-sm font-medium text-gray-900">{selectedVehicle.route}</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 mr-2"></div>
                        <div>
                            <p className="text-xs text-gray-500">Driver</p>
                            <p className="text-sm text-gray-900">{selectedVehicle.driver}</p>
                        </div>
                    </div>
                </div>
                
                <div className="pt-3 flex space-x-2">
                    <button 
                      className="flex-1 bg-primary text-white text-xs py-2 rounded hover:bg-primary/90 transition-colors"
                      onClick={() => onVehicleSelect && onVehicleSelect(selectedVehicle.tripId)}
                    >
                        View Trip Details
                    </button>
                    <button className="flex-1 bg-white border border-gray-300 text-gray-700 text-xs py-2 rounded hover:bg-gray-50 transition-colors">
                        Call Driver
                    </button>
                </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
