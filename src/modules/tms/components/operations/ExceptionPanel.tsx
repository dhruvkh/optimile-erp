import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertTriangle, Wrench, Map, MessageSquare, ChevronRight, Clock, AlertCircle } from 'lucide-react';

interface Exception {
  id: string;
  type: 'Delay' | 'Breakdown' | 'Route Deviation' | 'Fuel Issue';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  vehicle: string;
  tripId: string;
  description: string;
  time: string;
  status: 'Open' | 'In Progress' | 'Resolved';
}

const EXCEPTIONS: Exception[] = [
  { id: 'EX-001', type: 'Delay', severity: 'High', vehicle: 'MH-01-1234', tripId: 'TR-1001', description: 'Vehicle delayed by 2h due to traffic', time: '10m ago', status: 'Open' },
  { id: 'EX-002', type: 'Route Deviation', severity: 'Medium', vehicle: 'DL-02-5678', tripId: 'TR-1002', description: 'Deviated 5km from planned route', time: '25m ago', status: 'In Progress' },
  { id: 'EX-003', type: 'Breakdown', severity: 'Critical', vehicle: 'KA-03-9012', tripId: 'TR-1003', description: 'Engine breakdown reported', time: '45m ago', status: 'Open' },
  { id: 'EX-004', type: 'Fuel Issue', severity: 'Medium', vehicle: 'TN-05-1122', tripId: 'TR-1004', description: 'Unusual fuel drop detected', time: '1h ago', status: 'Open' },
  { id: 'EX-005', type: 'Delay', severity: 'Low', vehicle: 'WB-09-3344', tripId: 'TR-1005', description: 'Loading delay at warehouse', time: '2h ago', status: 'In Progress' },
];

export const ExceptionPanel: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Critical'>('All');

  const filtered = filter === 'All' ? EXCEPTIONS : EXCEPTIONS.filter(e => e.severity === 'Critical' || e.severity === 'High');

  const getTypeIcon = (type: Exception['type']) => {
    switch (type) {
        case 'Delay': return <Clock className="h-4 w-4 text-orange-500" />;
        case 'Breakdown': return <Wrench className="h-4 w-4 text-red-500" />;
        case 'Route Deviation': return <Map className="h-4 w-4 text-blue-500" />;
        default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBorderColor = (severity: Exception['severity']) => {
      switch(severity) {
          case 'Critical': return 'border-l-red-500 bg-red-50/20';
          case 'High': return 'border-l-orange-500 bg-orange-50/20';
          case 'Medium': return 'border-l-yellow-500 bg-yellow-50/20';
          default: return 'border-l-blue-500 bg-blue-50/20';
      }
  };

  return (
    <Card className="h-full flex flex-col p-0 border border-gray-200">
       <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-sm">Active Exceptions</h3>
          <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">
             {EXCEPTIONS.filter(e => e.status !== 'Resolved').length} Active
          </span>
       </div>

       {/* Tabs */}
       <div className="flex border-b border-gray-200">
          <button 
            className={`flex-1 py-2 text-xs font-medium text-center ${filter === 'All' ? 'text-primary border-b-2 border-primary bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setFilter('All')}
          >
             All
          </button>
          <button 
            className={`flex-1 py-2 text-xs font-medium text-center ${filter === 'Critical' ? 'text-red-600 border-b-2 border-red-500 bg-red-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setFilter('Critical')}
          >
             Critical Only
          </button>
       </div>

       {/* List */}
       <div className="flex-1 overflow-y-auto p-0 max-h-[500px] lg:max-h-[calc(100vh-400px)] custom-scrollbar">
          {filtered.map((ex) => (
             <div key={ex.id} className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group border-l-4 ${getBorderColor(ex.severity)}`}>
                <div className="flex justify-between items-start mb-1">
                   <div className="flex items-center space-x-2">
                      {getTypeIcon(ex.type)}
                      <span className="text-xs font-bold text-gray-800">{ex.type}</span>
                   </div>
                   <span className="text-[10px] text-gray-400">{ex.time}</span>
                </div>
                
                <p className="text-sm font-medium text-gray-900 mb-1">{ex.description}</p>
                
                <div className="flex justify-between items-center mt-2">
                   <div className="text-xs text-gray-500">
                      <span className="font-mono bg-white border border-gray-200 px-1.5 py-0.5 rounded mr-2">{ex.vehicle}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${ex.status === 'Open' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                         {ex.status}
                      </span>
                   </div>
                   <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                        <button className="text-[10px] bg-white border border-gray-200 hover:bg-gray-100 px-2 py-1 rounded text-gray-600">
                            Details
                        </button>
                   </div>
                </div>
             </div>
          ))}
       </div>
       
       <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
          <button className="text-xs font-medium text-primary hover:text-secondary flex items-center justify-center w-full">
             View All Exceptions <ChevronRight className="h-3 w-3 ml-1" />
          </button>
       </div>
    </Card>
  );
};
