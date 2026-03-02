import React from 'react';
import { Check, X, Clock, MapPin, IndianRupee, Truck, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface Approval {
  id: string;
  client: string;
  route: string;
  value: string;
  vehicleType: string;
  submittedBy: string;
  submittedAt: string;
  priority: 'high' | 'normal';
  reason?: string;
}

const MOCK_APPROVALS: Approval[] = [
  {
    id: 'BK-2024-001',
    client: 'Acme Corp',
    route: 'Mumbai → Delhi',
    value: '₹45,000',
    vehicleType: 'FTL - 20 Ton',
    submittedBy: 'Regional Manager - West',
    submittedAt: '2h ago',
    priority: 'high',
    reason: 'High value shipment'
  },
  {
    id: 'BK-2024-002',
    client: 'TechStart Ltd',
    route: 'Bangalore → Chennai',
    value: '₹22,000',
    vehicleType: 'LTL - 10 Ton',
    submittedBy: 'RM - South',
    submittedAt: '4h ago',
    priority: 'normal'
  },
  {
    id: 'BK-2024-003',
    client: 'Global Logistics',
    route: 'Kolkata → Patna',
    value: '₹35,000',
    vehicleType: 'FTL - 15 Ton',
    submittedBy: 'RM - East',
    submittedAt: '5h ago',
    priority: 'normal'
  }
];

export const ApprovalsQueue: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6 shadow-sm">
      <div className="bg-indigo-50/50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center space-x-2">
           <div className="bg-indigo-100 p-1.5 rounded-md text-indigo-700">
             <Clock className="h-4 w-4" />
           </div>
           <h3 className="font-semibold text-gray-900 text-sm">Pending Approvals Queue</h3>
           <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
             {MOCK_APPROVALS.length}
           </span>
        </div>
        <div className="text-xs text-gray-500">
           Sorted by Priority
        </div>
      </div>
      
      <div className="p-4 overflow-x-auto">
        <div className="flex space-x-4 min-w-full pb-2">
          {MOCK_APPROVALS.map((item) => (
            <div key={item.id} className="min-w-[320px] w-[320px] bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative group">
              {item.priority === 'high' && (
                <div className="absolute top-3 right-3 flex items-center text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                   <AlertCircle className="h-3 w-3 mr-1" /> High Priority
                </div>
              )}
              
              <div className="flex justify-between items-start mb-3">
                 <div>
                    <h4 className="font-bold text-gray-900">{item.id}</h4>
                    <p className="text-xs text-gray-500">{item.submittedAt} • by {item.submittedBy}</p>
                 </div>
              </div>
              
              <div className="space-y-2 mb-4">
                 <div className="flex items-center text-sm text-gray-700">
                    <Truck className="h-3.5 w-3.5 mr-2 text-gray-400" />
                    <span className="font-medium">{item.client}</span>
                 </div>
                 <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-3.5 w-3.5 mr-2 text-gray-400" />
                    {item.route}
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center text-gray-600">
                        <Truck className="h-3.5 w-3.5 mr-2 text-gray-400" />
                        <span className="text-xs">{item.vehicleType}</span>
                    </div>
                    <div className="flex items-center font-bold text-gray-900">
                        <IndianRupee className="h-3.5 w-3.5 mr-1" />
                        {item.value}
                    </div>
                 </div>
                 {item.reason && (
                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded mt-2 border border-orange-100">
                        Note: {item.reason}
                    </div>
                 )}
              </div>
              
              <div className="flex space-x-2 pt-2 border-t border-gray-100">
                <Button variant="outline" size="sm" className="flex-1 text-green-700 hover:text-green-800 hover:bg-green-50 hover:border-green-200">
                   <Check className="h-3.5 w-3.5 mr-1.5" /> Approve
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-red-700 hover:text-red-800 hover:bg-red-50 hover:border-red-200">
                   <X className="h-3.5 w-3.5 mr-1.5" /> Reject
                </Button>
              </div>
            </div>
          ))}
          
          {/* View All Card */}
          <div className="min-w-[100px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
             <span className="text-sm font-medium text-gray-500">View All</span>
          </div>
        </div>
      </div>
    </div>
  );
};
