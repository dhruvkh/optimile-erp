import React from 'react';
import { Card } from '../ui/Card';
import { Driver } from './types';
import { User, Phone, Truck, Star, ShieldCheck, Clock, MapPin, MoreVertical, FileText } from 'lucide-react';

interface DriverCardProps {
  driver: Driver;
}

export const DriverCard: React.FC<DriverCardProps> = ({ driver }) => {
  const getStatusColor = (status: Driver['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'On Leave': return 'bg-yellow-100 text-yellow-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLicenseStatusColor = (status: Driver['license']['status']) => {
    switch (status) {
      case 'Valid': return 'text-green-600';
      case 'Expiring Soon': return 'text-orange-600';
      case 'Expired': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
      <div className="p-4 flex items-start justify-between border-b border-gray-50 bg-gray-50/50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {driver.photo ? (
              <img src={driver.photo} alt={driver.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border-2 border-white shadow-sm">
                <User className="h-6 w-6" />
              </div>
            )}
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${driver.currentStatus === 'On Trip' ? 'bg-blue-500' : driver.currentStatus === 'Available' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{driver.name}</h3>
            <p className="text-xs text-gray-500">{driver.employmentType}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
           <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(driver.status)}`}>
              {driver.status}
           </span>
           <button className="mt-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
           </button>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Contact & Location */}
        <div className="space-y-2 text-sm">
           <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-600">
                 <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" />
                 {driver.phone}
              </div>
              <button className="text-[10px] text-primary hover:underline">Call</button>
           </div>
           <div className="flex items-center text-gray-600">
              <MapPin className="h-3.5 w-3.5 mr-2 text-gray-400" />
              {driver.location}
           </div>
           <div className="flex items-center text-gray-600">
              <Truck className="h-3.5 w-3.5 mr-2 text-gray-400" />
              {driver.currentVehicle ? (
                  <span className="text-primary font-medium">{driver.currentVehicle}</span>
              ) : (
                  <span className="text-gray-400 italic">No Vehicle Assigned</span>
              )}
           </div>
        </div>

        {/* License Info */}
        <div className="bg-gray-50 p-2 rounded border border-gray-100 flex items-center justify-between text-xs">
            <div className="flex items-center text-gray-600">
                <FileText className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                <span className="font-medium">{driver.license.type}</span>
            </div>
            <div className={`flex items-center ${getLicenseStatusColor(driver.license.status)}`}>
                <span className="font-medium">{driver.license.status}</span>
                {driver.license.status !== 'Valid' && <Clock className="h-3 w-3 ml-1" />}
            </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center">
           <div>
              <div className="flex items-center justify-center text-yellow-500 font-bold text-sm">
                 {driver.rating} <Star className="h-3 w-3 ml-0.5 fill-current" />
              </div>
              <p className="text-[10px] text-gray-400">Rating</p>
           </div>
           <div>
              <div className="text-sm font-bold text-gray-900">{driver.totalTrips}</div>
              <p className="text-[10px] text-gray-400">Trips</p>
           </div>
           <div>
              <div className="flex items-center justify-center text-green-600 font-bold text-sm">
                 {driver.safetyScore} <ShieldCheck className="h-3 w-3 ml-0.5" />
              </div>
              <p className="text-[10px] text-gray-400">Safety</p>
           </div>
        </div>
      </div>

      <div className="p-3 border-t border-gray-100 grid grid-cols-2 gap-2">
         <button className="flex items-center justify-center py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded transition-colors">
            Profile
         </button>
         <button className="flex items-center justify-center py-1.5 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded transition-colors">
            Assign
         </button>
      </div>
    </div>
  );
};
