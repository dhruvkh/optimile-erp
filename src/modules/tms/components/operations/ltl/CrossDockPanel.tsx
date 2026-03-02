import React from 'react';
import { Card } from '../../ui/Card';
import { ArrowRight, Clock, Box, Check, AlertCircle } from 'lucide-react';

export const CrossDockPanel: React.FC = () => {
  const lanes = [
    { id: 1, name: 'Delhi Lane', truck: 'DL-01-8899', status: 'Loading', progress: 45, items: 12 },
    { id: 2, name: 'Bangalore Lane', truck: 'KA-05-2233', status: 'Waiting', progress: 0, items: 8 },
    { id: 3, name: 'Local Dist', truck: 'MH-04-1122', status: 'Full', progress: 100, items: 25 },
  ];

  return (
    <Card title="Cross-Dock Operations" className="h-full">
       <div className="space-y-4">
          <div className="flex items-center justify-between text-sm bg-blue-50 p-2 rounded border border-blue-100">
             <div className="flex items-center text-blue-800">
                <TruckIcon className="h-4 w-4 mr-2" />
                <span className="font-bold">Inbound: MH-02-9988</span>
             </div>
             <span className="text-xs text-blue-600">Arriving in 15m</span>
          </div>

          <div className="space-y-3">
             <h4 className="text-xs font-bold text-slate-500 uppercase">Outbound Lanes</h4>
             {lanes.map(lane => (
                <div key={lane.id} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                   <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm text-slate-800">{lane.name}</span>
                      <span className={`text-[10px] px-1.5 rounded-full ${
                         lane.status === 'Full' ? 'bg-green-100 text-green-700' :
                         lane.status === 'Loading' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>{lane.status}</span>
                   </div>
                   <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                      <div className={`h-1.5 rounded-full ${lane.status === 'Full' ? 'bg-green-500' : 'bg-blue-500'}`} style={{width: `${lane.progress}%`}}></div>
                   </div>
                   <div className="flex justify-between text-xs text-slate-500">
                      <span>{lane.truck}</span>
                      <span>{lane.items} items queued</span>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </Card>
  );
};

const TruckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
);
