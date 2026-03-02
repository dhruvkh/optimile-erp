import React from 'react';
import { Card } from '../../ui/Card';
import { Box, MapPin, Calendar, GripVertical, AlertTriangle } from 'lucide-react';

const PENDING = [
  { id: 'BK-1001', from: 'Andheri', to: 'Delhi', units: 2, weight: 450, class: '85', type: 'General' },
  { id: 'BK-1005', from: 'Vashi', to: 'Bangalore', units: 1, weight: 120, class: '100', type: 'Fragile' },
  { id: 'BK-1008', from: 'Thane', to: 'Delhi', units: 5, weight: 1200, class: '70', type: 'General' },
  { id: 'BK-1012', from: 'Bhiwandi', to: 'Pune', units: 2, weight: 800, class: '50', type: 'Heavy' },
  { id: 'BK-1015', from: 'Andheri', to: 'Delhi', units: 1, weight: 150, class: '125', type: 'Hazmat' },
];

export const PendingShipments: React.FC = () => {
  return (
    <Card title="Pending Shipments" className="h-full flex flex-col p-0">
       <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-500 flex justify-between">
          <span>{PENDING.length} shipments waiting</span>
          <button className="text-primary hover:underline">Filter</button>
       </div>
       <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {PENDING.map(item => (
             <div key={item.id} className="bg-white border border-slate-200 rounded p-2 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing flex items-center group">
                <GripVertical className="h-4 w-4 text-slate-300 mr-2 opacity-0 group-hover:opacity-100" />
                <div className="flex-1">
                   <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-xs text-slate-800">{item.id}</span>
                      <span className={`text-[10px] px-1.5 rounded ${
                         item.type === 'Hazmat' ? 'bg-red-100 text-red-700 font-bold' : 
                         item.type === 'Fragile' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'
                      }`}>{item.type}</span>
                   </div>
                   <div className="flex items-center text-xs text-slate-500 mb-1">
                      <MapPin className="h-3 w-3 mr-1" /> {item.from} <span className="mx-1">→</span> {item.to}
                   </div>
                   <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{item.units} Units • {item.weight} lbs</span>
                      <span>Cl {item.class}</span>
                   </div>
                </div>
             </div>
          ))}
       </div>
    </Card>
  );
};
