import React from 'react';
import { MoreVertical, Calendar, IndianRupee, ArrowRight, Truck, Clock, Eye, Edit2, XCircle, CheckCircle, AlertTriangle, Box, Layers } from 'lucide-react';
import { Card } from '../../ui/Card';
import { useToast } from '../../../../../shared/context/ToastContext';

export interface BookingPipelineItem {
  id: string;
  clientName: string;
  isPremium: boolean;
  origin: string;
  destination: string;
  value: number;
  vehicleType: string;
  bookingType: 'FTL' | 'LTL'; // Added field
  pickupDate: string;
  status: string;
  priority: 'Normal' | 'High' | 'Urgent';
  createdAt: string; // ISO string
  tags: string[];
  assignedTo?: string;
  slaBreach?: boolean;
  slaWarning?: boolean;
}

interface BookingCardProps {
  item: BookingPipelineItem;
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: () => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  item,
  isSelected,
  onSelect,
  onDragStart,
  onClick
}) => {
  const { showToast } = useToast();
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'border-l-red-500 bg-red-50/30';
      case 'High': return 'border-l-orange-500 bg-orange-50/30';
      default: return 'border-l-gray-200 hover:border-l-primary';
    }
  };

  const getSLAIndicator = () => {
    if (item.slaBreach) return <span className="absolute top-2 right-8 flex h-2 w-2 rounded-full bg-red-500" title="SLA Breached"></span>;
    if (item.slaWarning) return <span className="absolute top-2 right-8 flex h-2 w-2 rounded-full bg-yellow-500 animate-pulse" title="Approaching SLA"></span>;
    return null;
  };

  const isNew = (dateString: string) => {
    const diff = new Date().getTime() - new Date(dateString).getTime();
    return diff < 3600000; // 1 hour
  };

  return (
    <div 
      draggable 
      onDragStart={(e) => onDragStart(e, item.id)}
      className={`
        relative group bg-white rounded-lg shadow-sm border p-3 mb-3 cursor-pointer transition-all duration-200 hover:shadow-md
        border-l-4 ${getPriorityColor(item.priority)}
        ${isSelected ? 'ring-2 ring-primary border-primary z-10' : 'border-t-gray-100 border-r-gray-100 border-b-gray-100'}
      `}
      onClick={(e) => {
        if (!e.ctrlKey && !e.metaKey) onClick();
      }}
    >
      {/* Selection Checkbox (visible on hover or selected) */}
      <div 
        className={`absolute top-3 right-3 z-20 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(item.id, true);
        }}
      >
        <input 
          type="checkbox" 
          checked={isSelected} 
          onChange={() => {}} // Handled by parent div click for simpler UX in this demo, or specific click handler
          className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer" 
        />
      </div>

      {getSLAIndicator()}

      {/* Header */}
      <div className="flex justify-between items-start mb-2 pr-6">
        <div>
          <div className="flex items-center space-x-2">
             <span className="text-xs font-bold text-primary hover:underline block">{item.id}</span>
             {/* Bifurcation Badge */}
             <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center ${
                 item.bookingType === 'FTL' 
                 ? 'bg-indigo-100 text-indigo-700' 
                 : 'bg-orange-100 text-orange-800'
             }`}>
                 {item.bookingType === 'FTL' ? <Truck className="h-3 w-3 mr-1" /> : <Layers className="h-3 w-3 mr-1" />}
                 {item.bookingType}
             </span>
          </div>
          <div className="flex items-center mt-1">
            <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]" title={item.clientName}>{item.clientName}</span>
            {item.isPremium && <span className="ml-1 text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded flex items-center">👑</span>}
            {isNew(item.createdAt) && <span className="ml-1 text-[10px] bg-blue-100 text-blue-800 px-1 rounded font-bold">NEW</span>}
          </div>
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center text-xs text-gray-600 mb-2 bg-gray-50 p-1.5 rounded">
         <span className="truncate max-w-[45%] font-medium">{item.origin}</span>
         <ArrowRight className="h-3 w-3 mx-1 text-gray-400 flex-shrink-0" />
         <span className="truncate max-w-[45%] font-medium">{item.destination}</span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-xs text-gray-500 mb-3">
         <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1.5 text-gray-400" />
            <span>{new Date(item.pickupDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
         </div>
         <div className="flex items-center font-medium text-gray-700">
            <IndianRupee className="h-3 w-3 mr-1 text-gray-400" />
            <span>{item.value.toLocaleString()}</span>
         </div>
         <div className="flex items-center col-span-2">
            <Box className="h-3 w-3 mr-1.5 text-gray-400" />
            <span className="truncate">{item.vehicleType}</span>
         </div>
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.map(tag => (
            <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer / Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
         <div className="flex items-center text-[10px] text-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            <span>2h ago</span>
         </div>
         
         {/* Quick Actions (visible on hover) */}
         <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1 hover:bg-gray-100 rounded text-gray-500" title="View Details" onClick={(e) => { e.stopPropagation(); onClick(); }}>
               <Eye className="h-3.5 w-3.5" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded text-blue-600" title="Edit" onClick={(e) => { e.stopPropagation(); showToast({ type: 'info', title: 'Edit Booking', message: 'Full edit functionality coming soon.' }); }}>
               <Edit2 className="h-3.5 w-3.5" />
            </button>
            {item.status === 'Draft' && (
                <button className="p-1 hover:bg-red-50 rounded text-red-600" title="Delete" onClick={(e) => { e.stopPropagation(); showToast({ type: 'warning', title: 'Delete', message: 'Booking deletion requires manager approval.' }); }}>
                   <XCircle className="h-3.5 w-3.5" />
                </button>
            )}
         </div>
      </div>
    </div>
  );
};