import React from 'react';
import { Card } from '../../ui/Card';

const HUBS = [
  { name: 'Mumbai', vol: 82, wgt: 78, status: 'warning' },
  { name: 'Delhi', vol: 58, wgt: 52, status: 'good' },
  { name: 'Bangalore', vol: 31, wgt: 28, status: 'good' },
];

export const HubCapacity: React.FC = () => {
  return (
    <Card title="Hub Capacity" className="h-full">
       <div className="space-y-4">
          {HUBS.map(hub => (
             <div key={hub.name}>
                <div className="flex justify-between items-end mb-1">
                   <span className="text-sm font-medium text-slate-700">{hub.name}</span>
                   <span className={`text-xs font-bold ${hub.status === 'warning' ? 'text-amber-600' : 'text-slate-500'}`}>
                      {hub.vol}% Vol
                   </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
                   <div 
                     className={`h-2 rounded-full ${hub.status === 'warning' ? 'bg-amber-500' : 'bg-primary'}`} 
                     style={{width: `${hub.vol}%`}}
                   ></div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1">
                   <div className="bg-slate-400 h-1 rounded-full" style={{width: `${hub.wgt}%`}}></div>
                </div>
             </div>
          ))}
       </div>
    </Card>
  );
};
