import React from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Map, Zap, UserCheck } from 'lucide-react';

export const MilePlanner: React.FC = () => {
  return (
    <Card className="h-full flex flex-col">
       <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
          <h3 className="font-bold text-gray-900">Mile Planner</h3>
          <div className="flex text-xs bg-gray-100 rounded p-0.5">
             <button className="px-2 py-1 bg-white shadow rounded text-primary font-medium">First Mile</button>
             <button className="px-2 py-1 text-gray-500 hover:text-gray-700">Last Mile</button>
          </div>
       </div>

       <div className="space-y-4">
          <div className="p-3 border border-indigo-100 bg-indigo-50 rounded-lg">
             <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-indigo-900">Run #MR-101 (Andheri)</span>
                <span className="text-[10px] bg-indigo-200 text-indigo-800 px-1.5 rounded">Planning</span>
             </div>
             <p className="text-xs text-indigo-700 mb-2">5 Pickups • 850 lbs • Est: 3.5h</p>
             <div className="flex -space-x-1 mb-3">
                {[1,2,3,4,5].map(i => (
                   <div key={i} className="w-5 h-5 rounded-full bg-white border border-indigo-200 flex items-center justify-center text-[8px] text-indigo-500 font-bold">{i}</div>
                ))}
             </div>
             <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-xs h-7">
                   <Zap className="h-3 w-3 mr-1" /> Optimize
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs h-7">
                   <Map className="h-3 w-3 mr-1" /> Map
                </Button>
             </div>
          </div>

          <div className="p-3 border border-slate-200 rounded-lg opacity-75">
             <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-slate-700">Run #MR-102 (Thane)</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded">Pending</span>
             </div>
             <p className="text-xs text-slate-500 mb-3">3 Pickups • 400 lbs</p>
             <Button size="sm" variant="outline" className="w-full text-xs h-7">Assign Vehicle</Button>
          </div>
       </div>
    </Card>
  );
};
