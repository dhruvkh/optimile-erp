
import React, { useEffect } from 'react';
import { useBooking } from '../../../context/BookingContext';
import { Input } from '../../ui/Input';
import { MapPin, Phone, Package, Box, Navigation, Users, Clock, AlertTriangle, Thermometer } from 'lucide-react';
import { LTLHandlingUnits } from '../ltl/LTLHandlingUnits';
import { FTLRequestForm } from '../ftl/FTLRequestForm';
import { RouteOptimizer } from '../ftl/RouteOptimizer';

export const CargoRouteStep: React.FC = () => {
  const { data, updateData, updatePTLData } = useBooking();

  const isPTL = data.bookingType === 'PTL';
  const isLTL = isPTL;
  const isFTL = data.bookingType === 'FTL';

  const handleSpecialReqChange = (req: string) => {
    if (data.specialReqs.includes(req)) {
      updateData({ specialReqs: data.specialReqs.filter(r => r !== req) });
    } else {
      updateData({ specialReqs: [...data.specialReqs, req] });
    }
  };

  // Auto-calculate PTL percent
  useEffect(() => {
    if (isPTL && data.weight > 0) {
        // Assume 9000kg capacity for 32ft for demo
        const percent = Math.min(100, Math.round((data.weight / 9000) * 100));
        updatePTLData({ 
            requestedCapacity: { ...data.ptl.requestedCapacity, percentOfTruck: percent } 
        });
    }
  }, [data.weight, isPTL]);

  // Set default flexible timing if empty
  useEffect(() => {
    if (isPTL && !data.ptl.flexibleTiming.pickupWindow.earliest) {
        updatePTLData({
            flexibleTiming: {
                pickupWindow: {
                    earliest: `${data.pickupDate}T08:00`,
                    latest: `${data.pickupDate}T12:00`
                },
                deliveryWindow: {
                    earliest: `${data.deliveryDate || data.pickupDate}T14:00`,
                    latest: `${data.deliveryDate || data.pickupDate}T18:00`
                }
            }
        });
    }
  }, [isPTL, data.pickupDate, data.deliveryDate]);

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

        {isLTL ? (
            // LTL Specific Cargo Form
            <div className="space-y-6">
               <LTLHandlingUnits />
               <div className="space-y-4 mt-6 border-t border-gray-200 pt-4">
                  <Input 
                      label="Cargo Description"
                      value={data.description}
                      onChange={(e) => updateData({ description: e.target.value })}
                      placeholder="e.g. Auto Parts, Palletized"
                  />
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Special Requirements</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
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
        ) : isFTL ? (
            // Enhanced FTL Form
            <>
                <FTLRequestForm />
                <RouteOptimizer />
            </>
        ) : isPTL ? (
            // PTL Specific Form
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input 
                        label="Weight (Kg)" 
                        type="number" 
                        value={data.weight} 
                        onChange={(e) => updateData({ weight: Number(e.target.value) })} 
                    />
                    <Input 
                        label="Volume (Cubic Meters)" 
                        type="number" 
                        value={data.volume} 
                        onChange={(e) => updateData({ volume: Number(e.target.value) })} 
                    />
                    <Input 
                        label="Handling Units (Pallets)" 
                        type="number" 
                        value={data.ptl.requestedCapacity.handlingUnits} 
                        onChange={(e) => updatePTLData({ requestedCapacity: { ...data.ptl.requestedCapacity, handlingUnits: Number(e.target.value) } })} 
                    />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-blue-900">Estimated Truck Capacity Required</span>
                        <span className="text-xl font-bold text-blue-700">{data.ptl.requestedCapacity.percentOfTruck || 0}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2.5 mt-2">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(data.ptl.requestedCapacity.percentOfTruck || 0, 100)}%` }}></div>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">Based on 32 Ton / 90 cu.m capacity</p>
                </div>

                {/* Sharing Preferences */}
                <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-md font-bold text-gray-900 mb-3 flex items-center">
                        <Users className="h-4 w-4 mr-2 text-primary" /> Sharing Preferences
                    </h4>
                    
                    <div className="space-y-3">
                        <label className="flex items-start space-x-3 p-3 border rounded-lg bg-green-50/50 border-green-200 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={data.ptl.sharingPreferences.allowCoLoading}
                                onChange={(e) => updatePTLData({ sharingPreferences: { ...data.ptl.sharingPreferences, allowCoLoading: e.target.checked } })}
                                className="mt-1 rounded text-green-600 focus:ring-green-500 h-4 w-4"
                            />
                            <div>
                                <span className="block text-sm font-bold text-gray-900">I'm okay sharing the truck with other customers</span>
                                <span className="block text-xs text-green-700">This significantly reduces shipping costs (40-60%)</span>
                            </div>
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border rounded-lg p-3 space-y-2">
                                <label className="flex items-center space-x-2">
                                    <input 
                                        type="checkbox" 
                                        checked={data.ptl.sharingPreferences.noCompetitors}
                                        onChange={(e) => updatePTLData({ sharingPreferences: { ...data.ptl.sharingPreferences, noCompetitors: e.target.checked } })}
                                        className="rounded text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium">No Competitor Products</span>
                                </label>
                                {data.ptl.sharingPreferences.noCompetitors && (
                                    <textarea 
                                        placeholder="Enter competitor names (e.g. CompanyX, CompanyY)"
                                        className="w-full text-xs border-gray-300 rounded p-2 h-16"
                                        value={data.ptl.sharingPreferences.competitors.join(', ')}
                                        onChange={(e) => updatePTLData({ sharingPreferences: { ...data.ptl.sharingPreferences, competitors: e.target.value.split(',').map(s=>s.trim()) } })}
                                    />
                                )}
                            </div>

                            <div className="border rounded-lg p-3 space-y-3">
                                <label className="flex items-center space-x-2">
                                    <input 
                                        type="checkbox" 
                                        checked={data.ptl.sharingPreferences.noHazmat}
                                        onChange={(e) => updatePTLData({ sharingPreferences: { ...data.ptl.sharingPreferences, noHazmat: e.target.checked } })}
                                        className="rounded text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium">No Hazmat Co-loading</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input 
                                        type="checkbox" 
                                        checked={data.ptl.sharingPreferences.temperatureControlOnly}
                                        onChange={(e) => updatePTLData({ sharingPreferences: { ...data.ptl.sharingPreferences, temperatureControlOnly: e.target.checked } })}
                                        className="rounded text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium">Temperature Control Only</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Flexible Timing */}
                <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-md font-bold text-gray-900 mb-3 flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-primary" /> Flexible Timing
                    </h4>
                    <p className="text-xs text-gray-500 mb-4">Wider pickup/delivery windows increase consolidation chances.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
                            <span className="text-xs font-bold uppercase text-gray-500">Pickup Window</span>
                            <div>
                                <label className="block text-xs mb-1">Earliest</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full text-xs border-gray-300 rounded"
                                    value={data.ptl.flexibleTiming.pickupWindow.earliest}
                                    onChange={(e) => updatePTLData({ flexibleTiming: { ...data.ptl.flexibleTiming, pickupWindow: { ...data.ptl.flexibleTiming.pickupWindow, earliest: e.target.value } } })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs mb-1">Latest</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full text-xs border-gray-300 rounded"
                                    value={data.ptl.flexibleTiming.pickupWindow.latest}
                                    onChange={(e) => updatePTLData({ flexibleTiming: { ...data.ptl.flexibleTiming, pickupWindow: { ...data.ptl.flexibleTiming.pickupWindow, latest: e.target.value } } })}
                                />
                            </div>
                        </div>

                        <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
                            <span className="text-xs font-bold uppercase text-gray-500">Delivery Window</span>
                            <div>
                                <label className="block text-xs mb-1">Earliest</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full text-xs border-gray-300 rounded"
                                    value={data.ptl.flexibleTiming.deliveryWindow.earliest}
                                    onChange={(e) => updatePTLData({ flexibleTiming: { ...data.ptl.flexibleTiming, deliveryWindow: { ...data.ptl.flexibleTiming.deliveryWindow, earliest: e.target.value } } })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs mb-1">Latest</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full text-xs border-gray-300 rounded"
                                    value={data.ptl.flexibleTiming.deliveryWindow.latest}
                                    onChange={(e) => updatePTLData({ flexibleTiming: { ...data.ptl.flexibleTiming, deliveryWindow: { ...data.ptl.flexibleTiming.deliveryWindow, latest: e.target.value } } })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
