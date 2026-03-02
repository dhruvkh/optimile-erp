
import React from 'react';
import { useBooking, StopPoint } from '../../../context/BookingContext';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Truck, Thermometer, Box, Clock, MapPin, Plus, Trash2, AlertTriangle, Shield, Settings } from 'lucide-react';

export const FTLRequestForm: React.FC = () => {
  const { data, updateFTLData } = useBooking();
  const { ftl } = data;

  const handleAddStop = (type: 'Pickup' | 'Delivery') => {
    const newStop: StopPoint = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      location: '',
      sequence: ftl.stops.length + 1
    };
    updateFTLData({ stops: [...ftl.stops, newStop] });
  };

  const handleRemoveStop = (id: string) => {
    updateFTLData({ stops: ftl.stops.filter(s => s.id !== id) });
  };

  const handleStopChange = (id: string, field: keyof StopPoint, value: any) => {
    updateFTLData({
      stops: ftl.stops.map(s => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Load & Container Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-gray-900 flex items-center">
            <Box className="h-4 w-4 mr-2 text-primary" /> Load Specification
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Load Type</label>
              <select 
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 border"
                value={ftl.loadType}
                onChange={(e) => updateFTLData({ loadType: e.target.value as any })}
              >
                <option>Full Container</option>
                <option>Bulk</option>
                <option>Break Bulk</option>
                <option>Project Cargo</option>
              </select>
            </div>
            
            {ftl.loadType === 'Full Container' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Container Type</label>
                <div className="flex gap-2">
                  {['20ft', '40ft', '40ft HC'].map(t => (
                    <button
                      key={t}
                      onClick={() => updateFTLData({ containerType: t as any })}
                      className={`flex-1 py-1.5 text-xs border rounded transition-colors ${
                        ftl.containerType === t ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold text-gray-900 flex items-center">
            <Settings className="h-4 w-4 mr-2 text-primary" /> Handling Requirements
          </h4>
          
          <div className="bg-gray-50 p-3 rounded-lg space-y-3 border border-gray-200">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={ftl.temperatureControlled}
                onChange={(e) => updateFTLData({ temperatureControlled: e.target.checked })}
                className="rounded text-primary focus:ring-primary" 
              />
              <span className="text-sm font-medium text-gray-700 flex items-center">
                <Thermometer className="h-3 w-3 mr-1" /> Temperature Controlled
              </span>
            </label>
            
            {ftl.temperatureControlled && (
              <div className="flex items-center space-x-2 pl-6 animate-in slide-in-from-top-1">
                <Input 
                  type="number" 
                  placeholder="Min" 
                  className="h-8 text-xs w-20" 
                  value={ftl.temperatureRange.min}
                  onChange={(e) => updateFTLData({ temperatureRange: { ...ftl.temperatureRange, min: Number(e.target.value) } })}
                />
                <span className="text-xs text-gray-500">to</span>
                <Input 
                  type="number" 
                  placeholder="Max" 
                  className="h-8 text-xs w-20"
                  value={ftl.temperatureRange.max}
                  onChange={(e) => updateFTLData({ temperatureRange: { ...ftl.temperatureRange, max: Number(e.target.value) } })}
                />
                <span className="text-xs text-gray-500">°C</span>
              </div>
            )}

            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={ftl.oversizedCargo}
                onChange={(e) => updateFTLData({ oversizedCargo: e.target.checked })}
                className="rounded text-primary focus:ring-primary" 
              />
              <span className="text-sm font-medium text-gray-700 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" /> Oversized / ODC Cargo
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Loading / Unloading */}
           <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                 <Truck className="h-4 w-4 mr-2 text-primary" /> Loading & Unloading
              </h4>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Loading Method</label>
                    <select 
                      className="block w-full border-gray-300 rounded-md text-xs py-1.5"
                      value={ftl.loadingType}
                      onChange={(e) => updateFTLData({ loadingType: e.target.value as any })}
                    >
                       <option>Side Load</option>
                       <option>Back Load</option>
                       <option>Top Load (Crane)</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Est. Time (Hrs)</label>
                    <input 
                      type="number" 
                      className="block w-full border-gray-300 rounded-md text-xs py-1.5 px-2"
                      value={ftl.loadingTime}
                      onChange={(e) => updateFTLData({ loadingTime: Number(e.target.value) })}
                    />
                 </div>
              </div>
           </div>

           {/* Vehicle Service Level */}
           <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                 <Shield className="h-4 w-4 mr-2 text-primary" /> Service Level
              </h4>
              <div className="space-y-2">
                 <label className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={ftl.dedicatedVehicle}
                          onChange={(e) => updateFTLData({ dedicatedVehicle: e.target.checked })}
                          className="rounded text-primary focus:ring-primary mr-2" 
                        />
                        <div>
                           <p className="text-xs font-bold text-gray-900">Dedicated Vehicle</p>
                           <p className="text-[10px] text-gray-500">Vehicle reserved solely for this shipment</p>
                        </div>
                    </div>
                 </label>
                 <label className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={ftl.exclusiveUse}
                          onChange={(e) => updateFTLData({ exclusiveUse: e.target.checked })}
                          className="rounded text-primary focus:ring-primary mr-2" 
                        />
                        <div>
                           <p className="text-xs font-bold text-gray-900">Exclusive Use (Direct)</p>
                           <p className="text-[10px] text-gray-500">No intermediate stops or transshipment</p>
                        </div>
                    </div>
                 </label>
              </div>
           </div>
        </div>
      </div>

      {/* Multi-Stop Routing */}
      <div className="border-t border-gray-200 pt-6">
         <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-gray-900 flex items-center">
               <MapPin className="h-4 w-4 mr-2 text-primary" /> Multi-Point Routing
            </h4>
            <div className="flex space-x-2">
               <Button size="sm" variant="outline" onClick={() => handleAddStop('Pickup')} className="text-xs h-7">
                  <Plus className="h-3 w-3 mr-1" /> Pickup
               </Button>
               <Button size="sm" variant="outline" onClick={() => handleAddStop('Delivery')} className="text-xs h-7">
                  <Plus className="h-3 w-3 mr-1" /> Delivery
               </Button>
            </div>
         </div>

         {ftl.stops.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 text-xs">
               Standard Point-to-Point Route. Add stops if required.
            </div>
         ) : (
            <div className="space-y-2">
               {ftl.stops.map((stop, index) => (
                  <div key={stop.id} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-md animate-in slide-in-from-left-2">
                     <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase w-16 text-center ${stop.type === 'Pickup' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {stop.type} {index + 1}
                     </span>
                     <div className="flex-1">
                        <input 
                           type="text" 
                           placeholder="Address / Location" 
                           className="w-full text-xs border-0 border-b border-gray-200 focus:ring-0 focus:border-primary p-1"
                           value={stop.location}
                           onChange={(e) => handleStopChange(stop.id, 'location', e.target.value)}
                        />
                     </div>
                     <div className="w-32">
                        <input 
                           type="text" 
                           placeholder="Contact Person" 
                           className="w-full text-xs border-0 border-b border-gray-200 focus:ring-0 focus:border-primary p-1"
                           value={stop.contact}
                           onChange={(e) => handleStopChange(stop.id, 'contact', e.target.value)}
                        />
                     </div>
                     <button onClick={() => handleRemoveStop(stop.id)} className="text-gray-400 hover:text-red-500 p-1">
                        <Trash2 className="h-3 w-3" />
                     </button>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
};
