
import React from 'react';
import { useBooking } from '../../../context/BookingContext';
import { Input } from '../../ui/Input';
import { MapPin, Phone, Package, Box, Navigation } from 'lucide-react';
import { FTLRequestForm } from '../ftl/FTLRequestForm';
import { RouteOptimizer } from '../ftl/RouteOptimizer';

export const CargoRouteStep: React.FC = () => {
  const { data, updateData } = useBooking();

  const isFTL = data.bookingType === 'FTL';

  const handleSpecialReqChange = (req: string) => {
    if (data.specialReqs.includes(req)) {
      updateData({ specialReqs: data.specialReqs.filter(r => r !== req) });
    } else {
      updateData({ specialReqs: [...data.specialReqs, req] });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Map Visualization Placeholder */}
      <div className="w-full h-48 bg-slate-100 rounded-lg border border-slate-200 relative overflow-hidden flex items-center justify-center group">
         <div className="absolute inset-0 opacity-10" 
             style={{ 
               backgroundImage: 'radial-gradient(#1F4E78 1px, transparent 1px)', 
               backgroundSize: '20px 20px' 
             }}>
         </div>
         <div className="text-center z-10">
             <Navigation className="h-8 w-8 text-primary mx-auto mb-2 opacity-50" />
             <p className="text-sm text-gray-500 font-medium">Map Route Visualization</p>
             <p className="text-xs text-gray-400">Distance: 1,420 km • Est. Time: 28h</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Origin Section */}
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
            <h4 className="font-semibold text-gray-900 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Origin Details
            </h4>
            
            <div className="space-y-3">
                <select 
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 border"
                    value={data.originType}
                    onChange={(e) => updateData({ originType: e.target.value as any })}
                >
                    <option>Customer Site</option>
                    <option>Warehouse</option>
                    <option>Other</option>
                </select>
                
                <Input 
                    placeholder="Search Address..."
                    icon={<MapPin className="h-4 w-4 text-gray-400" />}
                    value={data.originAddress}
                    onChange={(e) => updateData({ originAddress: e.target.value })}
                />
                
                <div className="grid grid-cols-2 gap-2">
                    <Input 
                        placeholder="Contact Person"
                        value={data.originContact}
                        onChange={(e) => updateData({ originContact: e.target.value })}
                    />
                    <Input 
                        placeholder="Phone"
                        icon={<Phone className="h-4 w-4 text-gray-400" />}
                        value={data.originPhone}
                        onChange={(e) => updateData({ originPhone: e.target.value })}
                    />
                </div>
            </div>
        </div>

        {/* Destination Section */}
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
            <h4 className="font-semibold text-gray-900 flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                Destination Details
            </h4>
            
            <div className="space-y-3">
                <select 
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 border"
                    value={data.destinationType}
                    onChange={(e) => updateData({ destinationType: e.target.value as any })}
                >
                    <option>Customer Site</option>
                    <option>Warehouse</option>
                    <option>Other</option>
                </select>
                
                <Input 
                    placeholder="Search Address..."
                    icon={<MapPin className="h-4 w-4 text-gray-400" />}
                    value={data.destinationAddress}
                    onChange={(e) => updateData({ destinationAddress: e.target.value })}
                />
                
                <div className="grid grid-cols-2 gap-2">
                    <Input 
                        placeholder="Contact Person"
                        value={data.destinationContact}
                        onChange={(e) => updateData({ destinationContact: e.target.value })}
                    />
                    <Input 
                        placeholder="Phone"
                        icon={<Phone className="h-4 w-4 text-gray-400" />}
                        value={data.destinationPhone}
                        onChange={(e) => updateData({ destinationPhone: e.target.value })}
                    />
                </div>
            </div>
        </div>
      </div>

      {/* Estimated Distance */}
      <div className="border-t border-gray-200 pt-4">
        <div className="max-w-xs">
          <Input
            label="Estimated Distance (km)"
            type="number"
            placeholder="e.g. 1385"
            value={data.distanceKm || ''}
            onChange={(e) => updateData({ distanceKm: Number(e.target.value) })}
            icon={<Navigation className="h-4 w-4 text-gray-400" />}
          />
          <p className="text-xs text-gray-500 mt-1">Used for cost calculation and invoice line items.</p>
        </div>
      </div>

      {/* Cargo Details */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2 text-gray-500" />
            Cargo Information
        </h4>

        {isFTL ? (
            // FTL Cargo Form
            <>
                <FTLRequestForm />
                <RouteOptimizer />
            </>
        ) : (
            // Spot/Standard Cargo Form
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ... existing fields ... */}
                <div className="space-y-4">
                    <Input 
                        label="Description"
                        value={data.description}
                        onChange={(e) => updateData({ description: e.target.value })}
                        placeholder="e.g. Industrial Machinery Parts"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select 
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 border"
                                value={data.cargoType}
                                onChange={(e) => updateData({ cargoType: e.target.value })}
                            >
                                <option>General</option>
                                <option>Electronics</option>
                                <option>Perishable</option>
                                <option>Hazardous</option>
                                <option>Machinery</option>
                            </select>
                        </div>
                        <Input 
                            label="No. of Packages"
                            type="number"
                            icon={<Box className="h-4 w-4 text-gray-400" />}
                            value={data.packages}
                            onChange={(e) => updateData({ packages: Number(e.target.value) })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex space-x-2">
                            <Input 
                                label="Weight"
                                type="number"
                                value={data.weight}
                                onChange={(e) => updateData({ weight: Number(e.target.value) })}
                            />
                            <div className="pt-6">
                                <select 
                                    className="block w-20 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-2 border"
                                    value={data.weightUnit}
                                    onChange={(e) => updateData({ weightUnit: e.target.value as any })}
                                >
                                    <option>Ton</option>
                                    <option>KG</option>
                                    <option>lbs</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Input 
                                label="Volume"
                                type="number"
                                value={data.volume}
                                onChange={(e) => updateData({ volume: Number(e.target.value) })}
                            />
                            <div className="pt-6">
                                <select 
                                    className="block w-20 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-2 border"
                                    value={data.volumeUnit}
                                    onChange={(e) => updateData({ volumeUnit: e.target.value as any })}
                                >
                                    <option>CFT</option>
                                    <option>CBM</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <Input 
                        label="Commodity Value (₹)"
                        type="number"
                        value={data.commodityValue}
                        onChange={(e) => updateData({ commodityValue: Number(e.target.value) })}
                        placeholder="0.00"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Special Requirements</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {['Fragile', 'Temp. Control', 'Hazardous', 'Oversized', 'High Value', 'Stackable'].map((req) => (
                                <label key={req} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="rounded text-primary focus:ring-primary h-4 w-4 border-gray-300"
                                        checked={data.specialReqs.includes(req)}
                                        onChange={() => handleSpecialReqChange(req)}
                                    />
                                    <span className="text-sm text-gray-700">{req}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
