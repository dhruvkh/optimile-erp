import React from 'react';
import { Calendar, Filter, Download, Mail, Printer } from 'lucide-react';
import { Button } from '../ui/Button';

interface ReportFiltersProps {
  showRegion?: boolean;
  showClient?: boolean;
  showVehicle?: boolean;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({ 
  showRegion = true, 
  showClient = true,
  showVehicle = false 
}) => {
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Calendar className="h-4 w-4" />
             </div>
             <select className="block w-full pl-10 pr-8 py-2 text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary border cursor-pointer hover:bg-gray-50">
                <option>Today</option>
                <option>Yesterday</option>
                <option>Last 7 Days</option>
                <option selected>Last 30 Days</option>
                <option>This Month</option>
                <option>Last Month</option>
                <option>Custom Range</option>
             </select>
          </div>

          {showRegion && (
            <select className="block w-40 py-2 px-3 text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary border">
               <option>All Regions</option>
               <option>North</option>
               <option>South</option>
               <option>East</option>
               <option>West</option>
            </select>
          )}

          {showClient && (
            <select className="block w-48 py-2 px-3 text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary border">
               <option>All Clients</option>
               <option>Acme Corp</option>
               <option>TechStart</option>
               <option>Global Foods</option>
            </select>
          )}
          
          {showVehicle && (
             <select className="block w-40 py-2 px-3 text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary border">
                <option>All Vehicles</option>
                <option>Truck</option>
                <option>Trailer</option>
                <option>Container</option>
             </select>
          )}

          <Button variant="outline" size="sm" className="bg-gray-50">
             <Filter className="h-4 w-4 mr-2" /> More
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
           <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded" title="Print">
              <Printer className="h-4 w-4" />
           </button>
           <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded" title="Email Report">
              <Mail className="h-4 w-4" />
           </button>
           <div className="h-6 w-px bg-gray-300 mx-2"></div>
           <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Export
           </Button>
        </div>
      </div>
    </div>
  );
};
