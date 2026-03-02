import React from 'react';
import { Card } from '../ui/Card';
import { Vehicle } from './types';
import { Truck, MapPin, Calendar, FileText, AlertTriangle, User, MoreVertical, Gauge } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle }) => {
  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white rounded-lg border border-gray-200">
            <Truck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{vehicle.registrationNumber}</h3>
            <p className="text-xs text-gray-500">{vehicle.type} • {vehicle.subType || vehicle.capacity.weight + ' ' + vehicle.capacity.unit}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
           <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(vehicle.status)}`}>
              {vehicle.status}
           </span>
           <span className="text-[10px] text-gray-400 border border-gray-200 px-1.5 rounded bg-white">
              {vehicle.ownership}
           </span>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Driver & Location */}
        <div className="space-y-2">
           <div className="flex items-start text-sm">
              <User className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
              <div>
                 <p className="text-gray-900 font-medium">{vehicle.driver?.name || 'Unassigned'}</p>
                 {vehicle.driver && <p className="text-xs text-gray-500">{vehicle.driver.phone}</p>}
              </div>
           </div>
           <div className="flex items-start text-sm">
              <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
              <span className="text-gray-600 truncate">{vehicle.location}</span>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
           <div>
              <span className="block text-gray-400">Utilization</span>
              <div className="flex items-center mt-1">
                 <Gauge className="h-3 w-3 mr-1 text-primary" />
                 <span className="font-bold text-gray-900">{vehicle.utilizationRate}%</span>
              </div>
           </div>
           <div>
              <span className="block text-gray-400">Trips</span>
              <span className="font-bold text-gray-900 mt-1 block">{vehicle.totalTrips}</span>
           </div>
           <div>
              <span className="block text-gray-400">Mileage</span>
              <span className="font-medium text-gray-700 mt-1 block">{vehicle.mileage} km/l</span>
           </div>
           <div>
              <span className="block text-gray-400">Next Service</span>
              <span className={`font-medium mt-1 block ${vehicle.maintenance.status === 'Overdue' ? 'text-red-600' : 'text-gray-700'}`}>
                 {new Date(vehicle.maintenance.nextDue).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
              </span>
           </div>
        </div>

        {/* Documents Warning */}
        {(!vehicle.documentsStatus.allValid || vehicle.documentsStatus.expiringSoon.length > 0) && (
           <div className="flex items-start text-xs p-2 bg-yellow-50 text-yellow-800 rounded border border-yellow-100">
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0" />
              <span>
                 {vehicle.documentsStatus.expired.length > 0 
                    ? `${vehicle.documentsStatus.expired[0]} Expired`
                    : `${vehicle.documentsStatus.expiringSoon[0]} Expiring Soon`}
              </span>
           </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-100 grid grid-cols-2 gap-2">
         <button className="flex items-center justify-center py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded transition-colors">
            View Details
         </button>
         <button className="flex items-center justify-center py-1.5 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded transition-colors">
            Manage
         </button>
      </div>
    </div>
  );
};
