
import React from 'react';
import { X, Filter, Download, ArrowRight, AlertTriangle, Clock, MapPin, Phone } from 'lucide-react';
import { Button } from '../../ui/Button';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: string;
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({ isOpen, onClose, title, type }) => {
  if (!isOpen) return null;

  // Mock data generator based on type
  const getMockItems = () => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: `TR-2024-${1000 + i}`,
      vehicle: `MH-${Math.floor(Math.random()*50 + 10)}-AB-${1234 + i}`,
      client: ['Acme Corp', 'TechStart', 'Global Foods', 'BuildRight'][i % 4],
      location: type.includes('Loading') ? 'Andheri Hub, Mumbai' : type.includes('Unloading') ? 'Okhla DC, Delhi' : 'NH-48, Gujarat',
      status: type === 'Exceptions' ? 'Delayed' : 'On Track',
      duration: `${(Math.random() * 4).toFixed(1)} hrs`,
      driver: 'Ramesh Kumar',
      phone: '+91 98765 43210'
    }));
  };

  const items = getMockItems();

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl w-full">
          
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">Detailed breakdown of {items.length} records</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 p-1">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Filters Toolbar */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
             <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="bg-white text-xs">
                   <Filter className="h-3 w-3 mr-1" /> Filter
                </Button>
                <div className="flex bg-white rounded-md border border-gray-300 overflow-hidden">
                   <button className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-900">All</button>
                   <button className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">Critical</button>
                   <button className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">Warning</button>
                </div>
             </div>
             <Button variant="outline" size="sm" className="bg-white text-xs">
                <Download className="h-3 w-3 mr-1" /> Export List
             </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                   <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trip ID / Vehicle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         {type.includes('Location') ? 'Wait Time' : 'Status'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                   </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                   {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                         <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-primary">{item.id}</div>
                            <div className="text-xs text-gray-500">{item.vehicle}</div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.client}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-600">
                               <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                               {item.location}
                            </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                            {type === 'Exceptions' || parseFloat(item.duration) > 2 ? (
                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <AlertTriangle className="h-3 w-3 mr-1" /> {item.duration} (High)
                               </span>
                            ) : (
                               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Clock className="h-3 w-3 mr-1" /> {item.duration}
                               </span>
                            )}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-3">
                               <button className="text-primary hover:text-blue-800 font-medium text-xs flex items-center">
                                  View <ArrowRight className="h-3 w-3 ml-1" />
                               </button>
                               <button className="text-gray-500 hover:text-gray-700" title="Call Driver">
                                  <Phone className="h-4 w-4" />
                               </button>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>

          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
             <span className="text-xs text-gray-500">Showing 8 of 38 records</span>
             <div className="flex space-x-2">
                <Button size="sm" variant="outline" disabled>Prev</Button>
                <Button size="sm" variant="outline">Next</Button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
