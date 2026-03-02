import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Truck, Clock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

interface Bay {
  id: string;
  name: string;
  status: 'Occupied' | 'Available' | 'Maintenance';
  vehicle: string | null;
  progress: number;
  timeRemaining: string | null;
}

const BAYS: Bay[] = [
  { id: 'BAY-01', name: 'Bay 1', status: 'Occupied', vehicle: 'MH-01-1234', progress: 65, timeRemaining: '45m' },
  { id: 'BAY-02', name: 'Bay 2', status: 'Available', vehicle: null, progress: 0, timeRemaining: null },
  { id: 'BAY-03', name: 'Bay 3', status: 'Occupied', vehicle: 'DL-02-5678', progress: 85, timeRemaining: '15m' },
  { id: 'BAY-04', name: 'Bay 4', status: 'Maintenance', vehicle: null, progress: 0, timeRemaining: null },
];

export const BayManagement: React.FC = () => {
  return (
    <Card title="Loading Bay Status" className="h-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BAYS.map((bay) => (
          <div key={bay.id} className={`border-l-4 rounded-r-lg p-3 shadow-sm border border-gray-100 ${
            bay.status === 'Available' ? 'border-l-green-500 bg-green-50/30' : 
            bay.status === 'Occupied' ? 'border-l-blue-500 bg-blue-50/30' : 'border-l-red-500 bg-red-50/30'
          }`}>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-gray-900">{bay.name}</h4>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                     bay.status === 'Available' ? 'bg-green-100 text-green-700' : 
                     bay.status === 'Occupied' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                }`}>
                    {bay.status}
                </span>
            </div>

            {bay.status === 'Occupied' ? (
                <div className="space-y-2">
                    <div className="flex items-center text-sm font-medium text-gray-800">
                        <Truck className="h-4 w-4 mr-2 text-gray-500" />
                        {bay.vehicle}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${bay.progress}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>{bay.progress}% Loaded</span>
                        <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {bay.timeRemaining} left</span>
                    </div>
                    <Button size="sm" variant="outline" className="w-full mt-1 h-7 text-xs">Mark Complete</Button>
                </div>
            ) : bay.status === 'Available' ? (
                <div className="flex flex-col items-center justify-center h-24 space-y-2">
                    <CheckCircle className="h-8 w-8 text-green-300" />
                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-xs">Assign Vehicle</Button>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-24 space-y-2 text-red-400">
                    <AlertTriangle className="h-8 w-8" />
                    <span className="text-xs font-medium">Under Maintenance</span>
                </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
