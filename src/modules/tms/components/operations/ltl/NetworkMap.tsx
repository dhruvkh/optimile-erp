import React from 'react';
import { Card } from '../../ui/Card';
import { Truck, MapPin, Layers } from 'lucide-react';

const HUBS = [
  { id: 'h1', name: 'Mumbai Hub', x: 25, y: 65, status: 'warning', util: 82 },
  { id: 'h2', name: 'Delhi Hub', x: 28, y: 30, status: 'normal', util: 58 },
  { id: 'h3', name: 'Bangalore Hub', x: 45, y: 75, status: 'normal', util: 31 },
  { id: 'h4', name: 'Kolkata Hub', x: 65, y: 45, status: 'normal', util: 45 },
];

const ROUTES = [
  { from: 'h1', to: 'h2', load: 85, active: true }, // Mum-Del
  { from: 'h1', to: 'h3', load: 60, active: true }, // Mum-Blr
  { from: 'h2', to: 'h4', load: 40, active: false }, // Del-Kol
  { from: 'h3', to: 'h4', load: 55, active: true }, // Blr-Kol
];

export const NetworkMap: React.FC = () => {
  return (
    <Card className="h-[400px] relative overflow-hidden bg-slate-900 border-slate-800 p-0">
      <div className="absolute top-4 left-4 z-10 text-white">
        <h3 className="font-bold flex items-center"><Layers className="h-4 w-4 mr-2" /> Network Status</h3>
      </div>

      <div className="absolute inset-0">
        {/* Map Background */}
        <div className="absolute inset-0 opacity-10" 
             style={{ 
               backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', 
               backgroundSize: '20px 20px' 
             }}>
        </div>
        
        <svg className="w-full h-full pointer-events-none">
           {/* India Outline Approximation */}
           <path d="M30,10 Q50,0 70,10 T90,30 T70,60 T50,90 T30,60 T10,30 Z" fill="none" stroke="#334155" strokeWidth="2" opacity="0.5" />

           {/* Routes */}
           {ROUTES.map((route, i) => {
             const start = HUBS.find(h => h.id === route.from);
             const end = HUBS.find(h => h.id === route.to);
             if (!start || !end) return null;

             return (
               <g key={i}>
                 {/* Route Line */}
                 <line 
                   x1={`${start.x}%`} y1={`${start.y}%`} 
                   x2={`${end.x}%`} y2={`${end.y}%`} 
                   stroke={route.active ? "#6366f1" : "#475569"} 
                   strokeWidth={route.load / 20} 
                   strokeOpacity="0.6"
                 />
                 {/* Animated Traffic */}
                 {route.active && (
                   <circle r="3" fill="#818cf8">
                     <animateMotion 
                       dur={`${5 + Math.random() * 5}s`} 
                       repeatCount="indefinite"
                       path={`M${start.x * 10},${start.y * 10} L${end.x * 10},${end.y * 10}`} // Scaling needs adjustment for real SVG coords, simplified here
                       calcMode="linear"
                     />
                     {/* CSS Animation fallback for simple line interpolation */}
                     <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
                   </circle>
                 )}
               </g>
             );
           })}
        </svg>

        {/* Hub Markers */}
        {HUBS.map(hub => (
          <div 
            key={hub.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: `${hub.x}%`, top: `${hub.y}%` }}
          >
            {/* Hub Dot */}
            <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
              hub.status === 'warning' ? 'bg-amber-500 animate-pulse' : 
              hub.status === 'critical' ? 'bg-red-500' : 'bg-emerald-500'
            }`}></div>
            
            {/* Tooltip */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs p-2 rounded border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
               <p className="font-bold">{hub.name}</p>
               <p className="text-slate-400">Cap: {hub.util}%</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-slate-800/80 backdrop-blur p-2 rounded border border-slate-700 text-xs text-slate-300">
         <div className="flex items-center mb-1"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> Normal</div>
         <div className="flex items-center mb-1"><span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span> High Load</div>
         <div className="flex items-center"><span className="w-8 h-0.5 bg-indigo-500 mr-2"></span> Active Line Haul</div>
      </div>
    </Card>
  );
};
