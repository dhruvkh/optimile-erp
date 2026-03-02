
import React, { useState } from 'react';
import { TripDataFull, TRIP_STATUS_FLOW, TripCheckpoint } from './types';
import { 
  CheckCircle, Clock, MapPin, AlertCircle, Camera, FileText, 
  ChevronDown, ChevronUp, User, MoreVertical 
} from 'lucide-react';
import { Card } from '../../ui/Card';

interface TripTimelineProps {
  data: TripDataFull;
}

export const TripTimeline: React.FC<TripTimelineProps> = ({ data }) => {
  const [expandedId, setExpandedId] = useState<string | null>(data.timeline[data.timeline.length - 1].id);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const currentStatusIndex = TRIP_STATUS_FLOW[data.currentStatus].code;

  // Render a single timeline item
  const renderCheckpoint = (checkpoint: TripCheckpoint, index: number, isLast: boolean) => {
    const statusDef = TRIP_STATUS_FLOW[checkpoint.status];
    const isCompleted = statusDef.code <= currentStatusIndex;
    const isCurrent = statusDef.code === currentStatusIndex;
    const isExpanded = expandedId === checkpoint.id;

    return (
      <div key={checkpoint.id} className="relative pl-8 sm:pl-10 py-1 group">
        {/* Connector Line */}
        {!isLast && (
          <div 
            className={`absolute left-[15px] sm:left-[19px] top-8 bottom-0 w-0.5 ${isCompleted ? 'bg-indigo-200' : 'bg-gray-200'}`} 
          />
        )}

        {/* Status Dot */}
        <div 
          className={`absolute left-0 sm:left-1 top-2 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-colors
            ${isCurrent ? 'bg-white border-primary shadow-md scale-110' : 
              isCompleted ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}
          `}
        >
          {isCompleted ? (
             <statusDef.icon className={`w-4 h-4 ${isCurrent ? 'text-primary' : 'text-indigo-600'}`} />
          ) : (
             <div className="w-2 h-2 rounded-full bg-gray-300" />
          )}
        </div>

        {/* Card Content */}
        <div 
          className={`rounded-lg border transition-all duration-200 cursor-pointer 
            ${isCurrent ? 'border-primary ring-1 ring-primary/30 bg-blue-50/20' : 
              'border-gray-200 bg-white hover:border-gray-300'}
          `}
          onClick={() => toggleExpand(checkpoint.id)}
        >
          {/* Header Row */}
          <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
             <div className="flex-1">
                <div className="flex items-center justify-between">
                   <h4 className={`text-sm font-bold ${isCurrent ? 'text-primary' : 'text-gray-900'}`}>
                      {statusDef.name}
                   </h4>
                   <div className="flex items-center text-xs sm:hidden text-gray-500">
                      {new Date(checkpoint.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </div>
                </div>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                   <span className="mr-3">{new Date(checkpoint.timestamp).toLocaleDateString()}</span>
                   <span className="hidden sm:inline mr-3">{new Date(checkpoint.timestamp).toLocaleTimeString()}</span>
                   <span className="flex items-center truncate max-w-[150px] sm:max-w-xs">
                      <MapPin className="h-3 w-3 mr-1" /> {checkpoint.locationName}
                   </span>
                </div>
             </div>

             {/* SLA Badge */}
             <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0">
                {checkpoint.isDelay ? (
                   <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      <Clock className="w-3 h-3 mr-1" /> {checkpoint.delayReason || 'Delayed'}
                   </span>
                ) : (
                   <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" /> On Time
                   </span>
                )}
                {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
             </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
             <div className="px-4 pb-4 pt-0 border-t border-gray-100 mt-2 animate-in slide-in-from-top-1">
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                   
                   {/* Capture Info */}
                   <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Captured By</p>
                      <div className="flex items-center">
                         <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-2">
                            <User className="h-4 w-4" />
                         </div>
                         <div>
                            <p className="font-medium text-gray-900">{checkpoint.capturedBy.name}</p>
                            <p className="text-xs text-gray-500">{checkpoint.capturedBy.role}</p>
                         </div>
                      </div>
                   </div>

                   {/* Data Fields */}
                   {checkpoint.data && (
                      <div>
                         <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Details</p>
                         <div className="grid grid-cols-2 gap-2">
                            {Object.entries(checkpoint.data).map(([key, val]) => (
                               <div key={key}>
                                  <span className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                  <span className="text-xs font-medium text-gray-900 ml-1">{val}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   )}
                </div>

                {/* Evidence Gallery */}
                {checkpoint.evidence && checkpoint.evidence.photos && (
                   <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center">
                         <Camera className="h-3 w-3 mr-1" /> Evidence
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                         {checkpoint.evidence.photos.map((photo, i) => (
                            <div key={i} className="h-20 w-20 flex-shrink-0 rounded border border-gray-200 overflow-hidden relative group">
                               <img src={photo} alt="Evidence" className="h-full w-full object-cover" />
                               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </div>
                         ))}
                         {checkpoint.evidence.documents && checkpoint.evidence.documents.map((doc, i) => (
                            <div key={i} className="h-20 w-20 flex-shrink-0 rounded border border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-500">
                               <FileText className="h-6 w-6 mb-1" />
                               <span className="text-[10px]">Doc {i+1}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                )}
             </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
       {/* SLA Summary */}
       <div className={`mb-6 p-4 rounded-lg border ${
          data.sla.overallStatus === 'On Track' ? 'bg-green-50 border-green-200' : 
          data.sla.overallStatus === 'At Risk' ? 'bg-yellow-50 border-yellow-200' : 
          'bg-red-50 border-red-200'
       }`}>
          <div className="flex justify-between items-center">
             <div>
                <h3 className="font-bold text-gray-900">SLA Performance</h3>
                <p className="text-xs text-gray-600 mt-1">
                   {data.sla.onTimeCheckpoints} checkpoints on time, {data.sla.delayedCheckpoints} delayed.
                </p>
             </div>
             <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                data.sla.overallStatus === 'On Track' ? 'bg-green-100 text-green-800' : 
                data.sla.overallStatus === 'At Risk' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'
             }`}>
                {data.sla.overallStatus}
             </div>
          </div>
       </div>

       {/* Timeline */}
       <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-0">
             {data.timeline.map((cp, idx) => renderCheckpoint(cp, idx, idx === data.timeline.length - 1))}
             
             {/* Show next pending step if not closed */}
             {data.currentStatus !== 'TRIP_CLOSED' && (
                <div className="relative pl-10 py-4 opacity-50">
                   <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200 border-l border-dashed border-gray-300" />
                   <div className="absolute left-1 top-2 w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-white">
                      <Clock className="w-4 h-4 text-gray-400" />
                   </div>
                   <p className="text-sm font-medium text-gray-500 pt-1">Next Step Pending...</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};
