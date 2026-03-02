import React from 'react';
import { Search, Filter, Calendar, X } from 'lucide-react';
import { Button } from '../../ui/Button';

interface FilterState {
  search: string;
  clients: string[];
  priority: string[];
}

interface PipelineFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  activeCount: number;
}

export const PipelineFilters: React.FC<PipelineFiltersProps> = ({ filters, onFilterChange, activeCount }) => {
  return (
    <div className="bg-white border-b border-gray-200 p-4 space-y-4">
       <div className="flex flex-col md:flex-row justify-between gap-4">
          
          {/* Search */}
          <div className="relative w-full md:w-96">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
             <input 
               type="text" 
               placeholder="Search by ID, Client, Route..." 
               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
               value={filters.search}
               onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
             />
          </div>

          {/* Filters & Actions */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
             <Button variant="outline" size="sm" className="whitespace-nowrap">
                <Calendar className="h-4 w-4 mr-2" /> Date Range
             </Button>
             <Button variant="outline" size="sm" className="whitespace-nowrap">
                <Filter className="h-4 w-4 mr-2" /> More Filters
             </Button>
             <div className="h-6 w-px bg-gray-300 mx-2"></div>
             
             {/* Filter Chips (Mock functionality) */}
             <div className="flex space-x-2">
                 <button 
                   onClick={() => onFilterChange({...filters, priority: filters.priority.includes('Urgent') ? [] : ['Urgent']})}
                   className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                     filters.priority.includes('Urgent') 
                       ? 'bg-red-50 text-red-700 border-red-200' 
                       : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                   }`}
                 >
                    Urgent Only
                 </button>
             </div>
             
             {/* Clear */}
             {(filters.search || filters.priority.length > 0) && (
                 <button 
                   onClick={() => onFilterChange({ search: '', clients: [], priority: [] })}
                   className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center"
                 >
                    <X className="h-3 w-3 mr-1" /> Clear
                 </button>
             )}
          </div>
       </div>

       {/* Active Count */}
       <div className="text-xs text-gray-500">
          Showing {activeCount} bookings based on current filters
       </div>
    </div>
  );
};
