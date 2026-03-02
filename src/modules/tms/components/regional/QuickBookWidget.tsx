import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Calendar, MapPin, Truck } from 'lucide-react';

export const QuickBookWidget: React.FC = () => {
  return (
    <Card title="Quick Booking" className="bg-indigo-50 border-indigo-100">
      <form className="space-y-3">
         <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Client</label>
            <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border bg-white">
                <option>Acme Corporation</option>
                <option>TechStart Logistics</option>
                <option>Global Foods Inc</option>
            </select>
         </div>
         
         <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Origin" icon={<MapPin className="h-3 w-3" />} className="text-xs" />
            <Input placeholder="Destination" icon={<MapPin className="h-3 w-3" />} className="text-xs" />
         </div>
         
         <div className="grid grid-cols-2 gap-2">
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400">
                    <Calendar className="h-3 w-3" />
                </div>
                <input type="date" className="block w-full pl-8 pr-2 py-2 border border-gray-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500" />
             </div>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400">
                    <Truck className="h-3 w-3" />
                </div>
                <select className="block w-full pl-8 pr-2 py-2 border border-gray-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                    <option>FTL - 20T</option>
                    <option>LTL</option>
                    <option>Container</option>
                </select>
             </div>
         </div>

         <div className="pt-2">
            <Button className="w-full justify-center bg-indigo-600 hover:bg-indigo-700" size="sm">
                Create Booking Request
            </Button>
         </div>
      </form>
      
      <div className="mt-4 pt-3 border-t border-indigo-200/50">
         <p className="text-xs font-medium text-indigo-900 mb-2">Recent Routes</p>
         <div className="flex flex-wrap gap-2">
            <button className="text-[10px] bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded-full hover:bg-indigo-50 transition-colors">
                Delhi → Jaipur
            </button>
            <button className="text-[10px] bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded-full hover:bg-indigo-50 transition-colors">
                Mumbai → Pune
            </button>
         </div>
      </div>
    </Card>
  );
};
