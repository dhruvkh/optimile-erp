
import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Layers, ZoomIn, ZoomOut, Filter } from 'lucide-react';

type MarkerStatus = 'ontime' | 'delayed-minor' | 'delayed-major' | 'loading' | 'delivery';

interface VehicleMarker {
  id: string;
  x: number;
  y: number;
  status: MarkerStatus;
  plate: string;
}

const STATUSES: MarkerStatus[] = ['ontime', 'ontime', 'ontime', 'ontime', 'delayed-minor', 'loading', 'delivery'];

const VEHICLES: VehicleMarker[] = Array.from({ length: 40 }, (_, i) => ({
  id: `V${i + 1}`,
  x: Math.random() * 90 + 5,
  y: Math.random() * 80 + 10,
  status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
  plate: `MH-${String(Math.floor(Math.random() * 99)).padStart(2, '0')}-AB-${String(1000 + i).padStart(4, '0')}`,
}));

export const ControlTowerMap: React.FC = () => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  const vehicleMarkers = VEHICLES;

  const getStatusColor = (status: MarkerStatus) => {
    switch (status) {
      case 'ontime':        return 'bg-emerald-500 ring-emerald-200';
      case 'delayed-minor': return 'bg-amber-500 ring-amber-200';
      case 'delayed-major': return 'bg-red-600 ring-red-200';
      case 'loading':       return 'bg-blue-500 ring-blue-200';
      case 'delivery':      return 'bg-purple-500 ring-purple-200';
      default:              return 'bg-gray-500';
    }
  };

  return (
    <Card className="h-full min-h-[500px] relative overflow-hidden p-0 border border-gray-200 shadow-md flex flex-col">
      {/* Header overlay */}
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        <div className="bg-white/95 backdrop-blur shadow-sm px-3 py-1.5 rounded-md border border-gray-200 text-sm font-bold text-gray-800 flex items-center">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live Operations Map
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <div className="bg-white rounded-md shadow-sm border border-gray-200 flex flex-col">
          <button className="p-2 hover:bg-gray-50 text-gray-600 border-b border-gray-100" onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2))}>
            <ZoomIn className="h-4 w-4" />
          </button>
          <button className="p-2 hover:bg-gray-50 text-gray-600" onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.8))}>
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>
        <button className="bg-white p-2 rounded-md shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-600">
          <Layers className="h-4 w-4" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 flex space-x-2">
        <button className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-md shadow-sm border border-gray-200 text-xs font-medium text-gray-700 flex items-center hover:bg-white">
          <Filter className="h-3 w-3 mr-1.5" /> Filter Map
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-sm border border-gray-100 text-xs z-10">
        <div className="flex items-center mb-1"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> On Time (34)</div>
        <div className="flex items-center mb-1"><span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span> Minor Delay (3)</div>
        <div className="flex items-center mb-1"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> Loading (2)</div>
        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span> Delivery (1)</div>
      </div>

      {/* Map Area */}
      <div className="flex-1 bg-slate-100 relative group overflow-hidden" onClick={() => setSelectedVehicle(null)}>
        <div className="absolute inset-0 bg-[#e5e7eb]"></div>

        {/* Grid */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: 'transform 0.5s ease-out'
          }}>
        </div>

        {/* Simplified India Map Shape */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-slate-300 fill-current pointer-events-none" preserveAspectRatio="none"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.5s ease-out' }}>
          <path d="M20,10 Q50,0 80,10 T95,40 T80,80 T50,95 T20,80 T5,40 Z" opacity="0.5" />
        </svg>

        {/* Vehicle Markers */}
        <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.5s ease-out', width: '100%', height: '100%', position: 'absolute' }}>
          {vehicleMarkers.map((v) => (
            <div
              key={v.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transition-all duration-500 ease-in-out"
              style={{ left: `${v.x}%`, top: `${v.y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedVehicle(v.id);
              }}
            >
              {/* Ping for delayed */}
              {(v.status === 'delayed-major' || v.status === 'delayed-minor') && (
                <div className={`absolute -inset-3 rounded-full opacity-50 animate-ping ${getStatusColor(v.status).split(' ')[0]}`}></div>
              )}

              {/* Marker dot */}
              <div className={`w-3 h-3 rounded-full shadow-sm ring-2 flex items-center justify-center transition-transform hover:scale-150 ${getStatusColor(v.status)} ${selectedVehicle === v.id ? 'scale-150 ring-offset-2' : ''}`}>
              </div>

              {/* Tooltip */}
              <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 ${selectedVehicle === v.id ? 'opacity-100' : ''}`}>
                <div className="font-bold">{v.plate}</div>
                <div className="text-slate-300 capitalize">{v.status.replace('-', ' ')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
