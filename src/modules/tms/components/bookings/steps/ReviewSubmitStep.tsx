
import React from 'react';
import { useBooking } from '../../../context/BookingContext';
import { Card } from '../../ui/Card';
import { MapPin, Calendar, Box, IndianRupee, Truck, FileText, Layers, Tag, CheckCircle } from 'lucide-react';

export const ReviewSubmitStep: React.FC = () => {
  const { data, setStep } = useBooking();

  const isLTL = data.bookingType === 'PTL';
  const totalRate = data.baseRate + data.loadingCharges + data.unloadingCharges + data.tollCharges + data.otherCharges;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Consolidation Banner */}
      {data.isConsolidated && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-md flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
              <div>
                  <h4 className="text-sm font-bold text-green-800">Consolidated Shipment</h4>
                  <p className="text-sm text-green-700 mt-1">
                      This booking has been consolidated with Match ID: <strong>{data.consolidationMatchId}</strong>.
                      Cost savings of ₹ {Math.abs(data.otherCharges).toLocaleString()} have been applied.
                  </p>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Overview */}
          <Card title="Booking Overview" action={<button onClick={() => setStep(1)} className="text-xs text-primary hover:underline">Edit</button>}>
              <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                      <span className="text-gray-500">Client</span>
                      <span className="font-medium">{data.clientName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-gray-500">Reference</span>
                      <span className="font-medium">{data.customerReference || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-gray-500">Type</span>
                      <span className="font-medium">{data.bookingType}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-gray-500">Priority</span>
                      <span className={`font-medium ${data.priority === 'Urgent' ? 'text-red-600' : ''}`}>{data.priority}</span>
                  </div>
              </div>
          </Card>

           {/* Section 2: Route */}
           <Card title="Route" action={<button onClick={() => setStep(2)} className="text-xs text-primary hover:underline">Edit</button>}>
              <div className="space-y-4 relative">
                  <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200"></div>
                  
                  <div className="relative pl-8">
                      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
                      <p className="text-xs text-gray-500 mb-1">PICKUP • {data.pickupDate}</p>
                      <p className="font-medium text-sm text-gray-900">{data.originAddress || 'Origin Address'}</p>
                  </div>
                  
                  <div className="relative pl-8">
                      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
                      <p className="text-xs text-gray-500 mb-1">DELIVERY • {data.deliveryDate}</p>
                      <p className="font-medium text-sm text-gray-900">{data.destinationAddress || 'Destination Address'}</p>
                  </div>
              </div>
           </Card>

           {/* Section 3: Cargo & Vehicle */}
           <Card title={isLTL ? "Cargo Details (LTL)" : "Cargo & Vehicle"} action={<button onClick={() => setStep(2)} className="text-xs text-primary hover:underline">Edit</button>}>
               {isLTL ? (
                   <div className="space-y-3 text-sm">
                       <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                           <div className="flex items-center text-gray-700">
                               <Layers className="h-4 w-4 mr-2" />
                               <span>Handling Units</span>
                           </div>
                           <span className="font-bold">{data.handlingUnits.length}</span>
                       </div>
                       <div className="grid grid-cols-2 gap-2 text-xs">
                           <div><span className="text-gray-500">Total Weight:</span> <span className="font-medium">{data.weight} {data.weightUnit}</span></div>
                           <div><span className="text-gray-500">Total Volume:</span> <span className="font-medium">{data.ltlMetrics.cubicFeet} ft³</span></div>
                           <div><span className="text-gray-500">Density:</span> <span className="font-medium">{data.ltlMetrics.density} PCF</span></div>
                           <div><span className="text-gray-500">Freight Class:</span> <span className="font-bold text-primary">Class {data.ltlMetrics.freightClass}</span></div>
                       </div>
                       {data.specialReqs.length > 0 && (
                           <div className="pt-2 flex flex-wrap gap-1">
                               {data.specialReqs.map(req => (
                                   <span key={req} className="text-[10px] bg-yellow-50 text-yellow-800 px-1.5 py-0.5 rounded border border-yellow-100 flex items-center">
                                       <Tag className="h-3 w-3 mr-1" /> {req}
                                   </span>
                               ))}
                           </div>
                       )}
                   </div>
               ) : (
                   <div className="grid grid-cols-2 gap-4 text-sm">
                       <div className="flex items-center space-x-2">
                           <Box className="h-4 w-4 text-gray-400" />
                           <div className="flex flex-col">
                               <span className="text-gray-500 text-xs">Cargo</span>
                               <span className="font-medium">{data.cargoType}</span>
                           </div>
                       </div>
                       <div className="flex items-center space-x-2">
                           <Truck className="h-4 w-4 text-gray-400" />
                           <div className="flex flex-col">
                               <span className="text-gray-500 text-xs">Vehicle</span>
                               <span className="font-medium">{data.vehicleType}</span>
                           </div>
                       </div>
                       <div className="col-span-2 bg-gray-50 p-2 rounded text-xs text-gray-600">
                           {data.packages} Pkgs • {data.weight} {data.weightUnit} • {data.volume} {data.volumeUnit}
                       </div>
                   </div>
               )}
           </Card>

           {/* Section 4: Financials */}
           <Card title="Financials" action={<button onClick={() => setStep(isLTL ? 4 : 3)} className="text-xs text-primary hover:underline">Edit</button>}>
               <div className="space-y-2 text-sm">
                    {isLTL && data.selectedCarrier ? (
                        <>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Carrier</span>
                                <span className="font-medium">{data.selectedCarrier.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Base Rate</span>
                                <span>₹{data.selectedCarrier.rate.toLocaleString()}</span>
                            </div>
                            {data.otherCharges < 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span className="">Consolidation Savings</span>
                                    <span>- ₹{Math.abs(data.otherCharges).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                                <span className="font-bold text-gray-900">Total Charges</span>
                                <span className="font-bold text-primary text-lg">₹{totalRate.toLocaleString()}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Rate Type</span>
                                <span>{data.rateType}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Base Rate</span>
                                <span>₹ {data.baseRate.toLocaleString()}</span>
                            </div>
                             <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                                <span className="font-bold text-gray-900">Total Estimate</span>
                                <span className="font-bold text-primary text-lg">₹ {totalRate.toLocaleString()}</span>
                            </div>
                        </>
                    )}
               </div>
           </Card>
      </div>

      {/* T&C */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <label className="flex items-start space-x-3 cursor-pointer">
              <input type="checkbox" className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
              <div className="text-sm">
                  <span className="font-medium text-gray-900">I confirm the details above are accurate.</span>
                  <p className="text-gray-500">By submitting this booking, you agree to the Standard Terms of Carriage and acknowledge that rates may be subject to final verification.</p>
              </div>
          </label>
      </div>
    </div>
  );
};
