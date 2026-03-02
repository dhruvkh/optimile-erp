import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Clock, MapPin, Truck, Check, AlertCircle } from 'lucide-react';

interface Dispatch {
  id: string;
  time: string;
  client: string;
  location: string;
  vehicle: string;
  status: 'Completed' | 'In Progress' | 'Delayed' | 'Scheduled';
  type: 'pickup' | 'delivery';
}

const DISPATCHES: Dispatch[] = [
  { id: '1', time: '09:00 AM', client: 'Acme Corp', location: 'Warehouse A', vehicle: 'DL-01-1234', status: 'Completed', type: 'pickup' },
  { id: '2', time: '10:30 AM', client: 'TechStart', location: 'Tech Park Hub', vehicle: 'MH-04-9988', status: 'In Progress', type: 'pickup' },
  { id: '3', time: '11:45 AM', client: 'Global Foods', location: 'Cold Storage 4', vehicle: 'UP-32-5566', status: 'Delayed', type: 'delivery' },
  { id: '4', time: '02:00 PM', client: 'BuildRight', location: 'Site B', vehicle: 'HR-26-1122', status: 'Scheduled', type: 'delivery' },
  { id: '5', time: '04:15 PM', client: 'ElectroWorld', location: 'Retail Outlet', vehicle: 'KA-05-3344', status: 'Scheduled', type: 'pickup' },
];

export const DispatchBoard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'pickup' | 'delivery'>('all');

  const filtered = activeTab === 'all' ? DISPATCHES : DISPATCHES.filter(d => d.type === activeTab);

  const getStatusColor = (status: Dispatch['status']) => {
    switch(status) {
        case 'Completed': return 'bg-green-100 text-green-700';
        case 'In Progress': return 'bg-blue-100 text-blue-700';
        case 'Delayed': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="h-full flex flex-col p-0">
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-900 text-sm">Daily Dispatch Board</h3>
            <span className="text-xs text-gray-500">{new Date().toLocaleDateString()}</span>
        </div>

        <div className="flex border-b border-gray-200">
           <button 
             onClick={() => setActiveTab('all')}
             className={`flex-1 py-2 text-xs font-medium ${activeTab === 'all' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             All
           </button>
           <button 
             onClick={() => setActiveTab('pickup')}
             className={`flex-1 py-2 text-xs font-medium ${activeTab === 'pickup' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Pickups
           </button>
           <button 
             onClick={() => setActiveTab('delivery')}
             className={`flex-1 py-2 text-xs font-medium ${activeTab === 'delivery' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:bg-gray-50'}`}
           >
             Deliveries
           </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {filtered.map((item) => (
                    <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        {/* Dot */}
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${
                            item.status === 'Completed' ? 'bg-green-500' :
                            item.status === 'Delayed' ? 'bg-red-500' :
                            item.status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-400'
                        }`}>
                            {item.status === 'Completed' ? <Check className="w-4 h-4 text-white" /> : 
                             item.status === 'Delayed' ? <AlertCircle className="w-4 h-4 text-white" /> :
                             <Clock className="w-4 h-4 text-white" />}
                        </div>
                        
                        {/* Content Card */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-1">
                                <time className="font-mono text-xs font-bold text-gray-500">{item.time}</time>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getStatusColor(item.status)}`}>
                                    {item.status}
                                </span>
                            </div>
                            <div className="text-sm font-bold text-gray-900">{item.client}</div>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" /> {item.location}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center mt-0.5">
                                <Truck className="h-3 w-3 mr-1" /> {item.vehicle}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </Card>
  );
};
