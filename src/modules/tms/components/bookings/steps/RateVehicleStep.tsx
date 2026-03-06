
import React, { useEffect } from 'react';
import { useBooking } from '../../../context/BookingContext';
import { Input } from '../../ui/Input';
import { IndianRupee, Truck, ShieldCheck, AlertCircle } from 'lucide-react';
import { Card } from '../../ui/Card';
import { LoadPlanner } from '../ftl/LoadPlanner';
import { VehicleMatcher } from '../ftl/VehicleMatcher';
import { amsContractStore } from '../../../../../shared/services/amsContractStore';

export const RateVehicleStep: React.FC = () => {
  const { data, updateData } = useBooking();

  const isFTL = data.bookingType === 'FTL';

  // Derive origin/destination city names (strip state suffix if present)
  const originCity = data.originAddress?.split(',')[0]?.trim() || '';
  const destinationCity = data.destinationAddress?.split(',')[0]?.trim() || '';

  // Look up AMS contract rate for this lane
  const contractRate = data.rateType === 'Contract' && data.clientId
    ? amsContractStore.getContractRate(data.clientId, originCity, destinationCity, data.vehicleType)
    : undefined;

  // Auto-populate base rate when a contract is found and rate hasn't been manually set
  useEffect(() => {
    if (data.rateType === 'Contract' && contractRate && data.baseRate === 0) {
      updateData({ baseRate: contractRate.ratePerTrip });
    }
    // Reset base rate when switching away from Contract if it was auto-filled
    if (data.rateType === 'Spot' && data.baseRate === 0) {
      const simulatedRate = (data.weight * 2000) + 15000;
      updateData({ baseRate: simulatedRate });
    }
  }, [data.rateType, contractRate?.id, data.weight]); // eslint-disable-line react-hooks/exhaustive-deps

  // FTL / Standard Rate Logic
  const totalRate = data.baseRate + data.loadingCharges + data.unloadingCharges + data.tollCharges + data.otherCharges;
  // Mock cost to calculate margin
  const estimatedCost = totalRate * 0.75; 
  const margin = totalRate - estimatedCost;
  const marginPercent = Math.round((margin / totalRate) * 100) || 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {isFTL && (
          <>
            <LoadPlanner />
            <div className="my-6 border-b border-gray-200"></div>
          </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Financials */}
        <div className="space-y-6">
           <Card title="Rate Details">
               <div className="mb-4">
                  <div className="flex space-x-4 mb-4">
                     <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="rateType"
                            checked={data.rateType === 'Contract'}
                            onChange={() => updateData({ rateType: 'Contract' })}
                            className="text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="font-medium text-sm">Contract Rate</span>
                     </label>
                     <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="rateType"
                            checked={data.rateType === 'Spot'}
                            onChange={() => updateData({ rateType: 'Spot' })}
                            className="text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="font-medium text-sm">Spot Rate</span>
                     </label>
                  </div>

                  {data.rateType === 'Contract' && (
                    contractRate ? (
                      <div className="bg-green-50 p-3 rounded-md border border-green-200 mb-4">
                          <p className="text-sm text-green-800 flex items-center font-medium">
                              <ShieldCheck className="h-4 w-4 mr-2 flex-shrink-0" />
                              AMS Contract #{contractRate.id} — ₹{contractRate.ratePerTrip.toLocaleString('en-IN')} per trip
                          </p>
                          <p className="text-xs text-green-700 mt-1 ml-6">
                              Valid until {new Date(contractRate.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {contractRate.vendorId ? ` • Vendor: ${contractRate.vendorId}` : ''}
                          </p>
                      </div>
                    ) : (
                      <div className="bg-amber-50 p-3 rounded-md border border-amber-200 mb-4">
                          <p className="text-sm text-amber-800 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                              No AMS contract found for this lane / vehicle type. Switch to Spot Rate or update origin & destination.
                          </p>
                      </div>
                    )
                  )}

                  <div className="space-y-3">
                      <Input 
                          label="Base Rate (₹)"
                          type="number"
                          value={data.baseRate}
                          onChange={(e) => updateData({ baseRate: Number(e.target.value) })}
                          icon={<IndianRupee className="h-4 w-4 text-gray-400" />}
                      />
                      
                      <div className="grid grid-cols-2 gap-3">
                          <Input 
                              label="Loading (₹)"
                              type="number"
                              value={data.loadingCharges}
                              onChange={(e) => updateData({ loadingCharges: Number(e.target.value) })}
                          />
                          <Input 
                              label="Unloading (₹)"
                              type="number"
                              value={data.unloadingCharges}
                              onChange={(e) => updateData({ unloadingCharges: Number(e.target.value) })}
                          />
                          <Input 
                              label="Toll (₹)"
                              type="number"
                              value={data.tollCharges}
                              onChange={(e) => updateData({ tollCharges: Number(e.target.value) })}
                          />
                          <Input 
                              label="Other (₹)"
                              type="number"
                              value={data.otherCharges}
                              onChange={(e) => updateData({ otherCharges: Number(e.target.value) })}
                          />
                      </div>
                  </div>
               </div>

               {/* Summary Box */}
               <div className="bg-gray-50 p-4 rounded-lg border-t border-gray-200">
                   <div className="flex justify-between items-center mb-2">
                       <span className="text-sm font-medium text-gray-700">Total Rate</span>
                       <span className="text-lg font-bold text-primary">₹ {totalRate.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs text-gray-500">
                       <span>Est. Cost: ₹ {estimatedCost.toLocaleString()}</span>
                       <span className={marginPercent < 15 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                           Margin: {marginPercent}% (₹ {margin.toLocaleString()})
                       </span>
                   </div>
               </div>
           </Card>
        </div>

        {/* Right: Vehicle Requirements */}
        <div className="space-y-6">
            {isFTL ? (
                // Use Advanced Vehicle Matcher for FTL
                <VehicleMatcher />
            ) : (
                // Standard Vehicle Selector for Spot
                <Card title="Vehicle Requirements">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                            <select 
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 border"
                                value={data.vehicleType}
                                onChange={(e) => updateData({ vehicleType: e.target.value })}
                            >
                                <option>20 Ft Truck (Open)</option>
                                <option>32 Ft Multi-Axle</option>
                                <option>Container 20ft</option>
                                <option>Container 40ft</option>
                                <option>LCV (Light Commercial)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Body Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Open', 'Closed', 'Refrigerated', 'Flatbed'].map(body => (
                                    <div 
                                        key={body}
                                        onClick={() => updateData({ vehicleBody: body as any })}
                                        className={`cursor-pointer border rounded px-3 py-2 text-sm text-center transition-colors ${
                                            data.vehicleBody === body ? 'bg-primary text-white border-primary' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        {body}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Input 
                            label="Quantity"
                            type="number"
                            value={data.vehicleQuantity}
                            onChange={(e) => updateData({ vehicleQuantity: Number(e.target.value) })}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Special Equipment</label>
                            <div className="space-y-2">
                                {['Hydraulic Lift', 'GPS Tracking', 'Tarpaulin', 'Side Loading'].map(eq => (
                                    <label key={eq} className="flex items-center space-x-2 text-sm text-gray-600">
                                        <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                                        <span>{eq}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 bg-blue-50 p-3 rounded border border-blue-100 flex items-start">
                        <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-blue-800">Vehicle Availability</p>
                            <p className="text-xs text-blue-600 mt-0.5">
                                Approx. 5 vehicles of this type available near origin.
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
};

const InfoIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
);
