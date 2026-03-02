
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CalculationInput, ChargeCalculation } from './charge-engine/types';
import { calculateCharges } from './charge-engine/utils';
import { Calculator, Download, RefreshCw, Truck, Box, Calendar, IndianRupee, FileText, AlertTriangle, TrendingUp, Info } from 'lucide-react';

export const ChargeCalculator: React.FC = () => {
  // Initial State
  const [input, setInput] = useState<CalculationInput>({
    type: 'LTL',
    actualWeight: 250,
    dimensions: [{ l: 48, w: 40, h: 48, q: 1 }],
    pickupPincode: '560001',
    deliveryPincode: '400099', // Ends in 9 triggers ODA in mock
    pickupDate: new Date(),
    deliveryDate: new Date(new Date().setDate(new Date().getDate() + 3)),
    declaredValue: 50000,
    freightToCollect: true,
    codAmount: 0,
    daccRequired: false,
    appointmentDelivery: false,
    reDeliveryAttempts: 0,
    storageDays: 0
  });

  const [result, setResult] = useState<ChargeCalculation | null>(null);

  // Auto-calculate on change
  useEffect(() => {
    setResult(calculateCharges(input));
  }, [input]);

  const handleDimensionChange = (idx: number, field: string, value: number) => {
    const newDims = [...input.dimensions];
    newDims[idx] = { ...newDims[idx], [field]: value };
    setInput({ ...input, dimensions: newDims });
  };

  if (!result) return <div>Calculating...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      
      {/* LEFT PANE: INPUTS */}
      <div className="lg:w-1/3 flex flex-col gap-4 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
        <Card title="Shipment Details">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Service Type</label>
              <div className="flex rounded-md shadow-sm">
                {['FTL', 'LTL', 'Air'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setInput({ ...input, type: type as any })}
                    className={`flex-1 py-2 text-xs font-medium border first:rounded-l-md last:rounded-r-md ${
                      input.type === type 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <Input 
                 label="Weight (kg)" 
                 type="number" 
                 value={input.actualWeight} 
                 onChange={(e) => setInput({...input, actualWeight: Number(e.target.value)})}
               />
               <Input 
                 label="Declared Value (₹)" 
                 type="number" 
                 value={input.declaredValue} 
                 onChange={(e) => setInput({...input, declaredValue: Number(e.target.value)})}
               />
            </div>

            <div>
               <label className="block text-xs font-medium text-gray-700 mb-1">Dimensions (L x W x H in inches)</label>
               {input.dimensions.map((dim, idx) => (
                 <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
                    <input type="number" className="border rounded px-2 py-1 text-xs" value={dim.l} onChange={(e) => handleDimensionChange(idx, 'l', Number(e.target.value))} placeholder="L" />
                    <input type="number" className="border rounded px-2 py-1 text-xs" value={dim.w} onChange={(e) => handleDimensionChange(idx, 'w', Number(e.target.value))} placeholder="W" />
                    <input type="number" className="border rounded px-2 py-1 text-xs" value={dim.h} onChange={(e) => handleDimensionChange(idx, 'h', Number(e.target.value))} placeholder="H" />
                    <input type="number" className="border rounded px-2 py-1 text-xs" value={dim.q} onChange={(e) => handleDimensionChange(idx, 'q', Number(e.target.value))} placeholder="Qty" />
                 </div>
               ))}
            </div>
          </div>
        </Card>

        <Card title="Route & Dates">
           <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                 <Input 
                   label="Pickup Pincode" 
                   value={input.pickupPincode}
                   onChange={(e) => setInput({...input, pickupPincode: e.target.value})}
                 />
                 <Input 
                   label="Delivery Pincode" 
                   value={input.deliveryPincode}
                   onChange={(e) => setInput({...input, deliveryPincode: e.target.value})}
                 />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <Input 
                   label="Pickup Date" 
                   type="date"
                   value={input.pickupDate.toISOString().split('T')[0]}
                   onChange={(e) => setInput({...input, pickupDate: new Date(e.target.value)})}
                 />
                 <Input 
                   label="Delivery Date" 
                   type="date"
                   value={input.deliveryDate.toISOString().split('T')[0]}
                   onChange={(e) => setInput({...input, deliveryDate: new Date(e.target.value)})}
                 />
              </div>
           </div>
        </Card>

        <Card title="Value Added Services">
           <div className="space-y-3">
              <label className="flex items-center justify-between text-sm">
                 <span className="flex items-center text-gray-700"><IndianRupee className="h-3 w-3 mr-2" /> Freight To Collect</span>
                 <input type="checkbox" checked={input.freightToCollect} onChange={(e) => setInput({...input, freightToCollect: e.target.checked})} className="rounded text-primary focus:ring-primary" />
              </label>
              <label className="flex items-center justify-between text-sm">
                 <span className="flex items-center text-gray-700"><FileText className="h-3 w-3 mr-2" /> DACC (Consignee Copy)</span>
                 <input type="checkbox" checked={input.daccRequired} onChange={(e) => setInput({...input, daccRequired: e.target.checked})} className="rounded text-primary focus:ring-primary" />
              </label>
              <label className="flex items-center justify-between text-sm">
                 <span className="flex items-center text-gray-700"><Calendar className="h-3 w-3 mr-2" /> Appointment Delivery</span>
                 <input type="checkbox" checked={input.appointmentDelivery} onChange={(e) => setInput({...input, appointmentDelivery: e.target.checked})} className="rounded text-primary focus:ring-primary" />
              </label>
              
              <div className="border-t border-gray-100 pt-3 mt-2">
                 <Input 
                   label="COD Amount (₹)" 
                   type="number" 
                   value={input.codAmount} 
                   onChange={(e) => setInput({...input, codAmount: Number(e.target.value)})}
                 />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                 <Input 
                   label="Re-Delivery Attempts" 
                   type="number" 
                   value={input.reDeliveryAttempts} 
                   onChange={(e) => setInput({...input, reDeliveryAttempts: Number(e.target.value)})}
                 />
                 <Input 
                   label="Storage Days" 
                   type="number" 
                   value={input.storageDays} 
                   onChange={(e) => setInput({...input, storageDays: Number(e.target.value)})}
                 />
              </div>
           </div>
        </Card>
      </div>

      {/* RIGHT PANE: INVOICE */}
      <div className="lg:w-2/3 bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col h-full overflow-hidden">
         
         {/* Invoice Header */}
         <div className="bg-slate-800 text-white p-6 flex justify-between items-start">
            <div>
               <h2 className="text-2xl font-bold">Proforma Invoice</h2>
               <p className="text-slate-300 text-sm mt-1">Generated by Optimile Charge Engine</p>
            </div>
            <div className="text-right">
               <div className="text-3xl font-bold">₹ {result.summary.grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
               <p className="text-slate-400 text-xs mt-1">Inclusive of GST</p>
            </div>
         </div>

         {/* Scrollable Content */}
         <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
            
            {/* 1. Base Charges */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
               <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3 flex justify-between">
                  <span>Base Freight</span>
                  <span className="text-primary">₹ {result.baseCharges.baseFreight.toFixed(2)}</span>
               </h3>
               
               {/* Volumetric Logic Display */}
               <div className="bg-blue-50 rounded p-3 text-xs text-blue-800 mb-3 flex items-start">
                  <Info className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                     <p className="font-bold mb-1">Volumetric Calculation</p>
                     <p>{result.baseCharges.volumetricWeight?.calculation}</p>
                  </div>
               </div>

               {/* Minimum Logic */}
               {result.baseCharges.minimumCharge.applied && (
                  <div className="flex items-center text-xs text-orange-600 mb-2 font-medium">
                     <AlertTriangle className="h-3 w-3 mr-1" />
                     Minimum charge of ₹{result.baseCharges.minimumCharge.threshold} applied.
                  </div>
               )}
               
               <div className="text-xs text-gray-500">
                  Calculation: {result.baseCharges.calculation}
               </div>
            </div>

            {/* 2. Fuel Surcharge */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
               <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3 flex justify-between">
                  <span>Fuel Surcharge (FSC)</span>
                  <span className="text-primary">₹ {result.fuelSurcharge.totalFSC.toFixed(2)}</span>
               </h3>
               <div className="grid grid-cols-2 gap-4 text-xs mb-2">
                  <div>
                     <span className="text-gray-500 block">Base Diesel Price</span>
                     <span className="font-medium">₹ {result.fuelSurcharge.baseDieselPrice}</span>
                  </div>
                  <div>
                     <span className="text-gray-500 block">Current Price</span>
                     <span className="font-medium">₹ {result.fuelSurcharge.currentDieselPrice}</span>
                  </div>
               </div>
               {result.fuelSurcharge.totalFSC > 0 && (
                  <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                     <TrendingUp className="h-3 w-3 mr-1 inline" />
                     Price increased by ₹{result.fuelSurcharge.priceIncrease.toFixed(2)}. 
                     Applied {result.fuelSurcharge.matrix.increments} steps of {result.fuelSurcharge.matrix.percentPerStep}%.
                     Total FSC: <strong>{result.fuelSurcharge.matrix.totalPercent}%</strong>
                  </div>
               )}
            </div>

            {/* 3. Surcharges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
               {/* ODA */}
               <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-xs font-bold text-gray-700 mb-2 flex justify-between">
                     ODA Charges <span>₹ {result.odaCharges.total.toFixed(2)}</span>
                  </h4>
                  <div className="space-y-1 text-xs text-gray-500">
                     <div className="flex justify-between">
                        <span>Pickup ({input.pickupPincode})</span>
                        <span>{result.odaCharges.pda.charge.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                        <span>Delivery ({input.deliveryPincode})</span>
                        <span>{result.odaCharges.dda.charge.toFixed(2)}</span>
                     </div>
                  </div>
                  {(result.odaCharges.pda.applied || result.odaCharges.dda.applied) && (
                     <div className="text-[10px] text-gray-400 mt-2 italic">
                        {result.odaCharges.pda.calculation}
                     </div>
                  )}
               </div>

               {/* Storage */}
               <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-xs font-bold text-gray-700 mb-2 flex justify-between">
                     Storage / Demurrage <span>₹ {result.storageCharges.demurrage.totalDemurrage.toFixed(2)}</span>
                  </h4>
                  <div className="text-xs text-gray-500">
                     <p>{input.storageDays} Days (Free: {result.storageCharges.freeStorageDays})</p>
                     <p className="mt-1 text-[10px]">{result.storageCharges.demurrage.calculation}</p>
                  </div>
               </div>

               {/* Special */}
               <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-xs font-bold text-gray-700 mb-2 flex justify-between">
                     Value Added Services <span>₹ {result.specialCharges.total + result.collectionCharges.total + result.appointmentDelivery.charge}</span>
                  </h4>
                  <div className="space-y-1 text-xs text-gray-500">
                     {result.collectionCharges.freightToCollect.enabled && <div className="flex justify-between"><span>Freight To Collect</span><span>{result.collectionCharges.freightToCollect.charge}</span></div>}
                     {result.collectionCharges.valueToCollect.enabled && <div className="flex justify-between"><span>COD Charge</span><span>{result.collectionCharges.valueToCollect.charge}</span></div>}
                     {result.specialCharges.daccCharges.enabled && <div className="flex justify-between"><span>DACC</span><span>{result.specialCharges.daccCharges.charge}</span></div>}
                     {result.appointmentDelivery.enabled && <div className="flex justify-between"><span>Appointment Del.</span><span>{result.appointmentDelivery.charge}</span></div>}
                  </div>
               </div>

               {/* FOV & Docket */}
               <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-xs font-bold text-gray-700 mb-2 flex justify-between">
                     Other Charges <span>₹ {(result.fov.applied + result.docketCharges.total + result.holidaySurcharges.totalHolidayCharge).toFixed(2)}</span>
                  </h4>
                  <div className="space-y-1 text-xs text-gray-500">
                     <div className="flex justify-between"><span>FOV (Risk Charge)</span><span>{result.fov.applied.toFixed(2)}</span></div>
                     <div className="flex justify-between"><span>Docket Fee</span><span>{result.docketCharges.total}</span></div>
                     {result.holidaySurcharges.totalHolidayCharge > 0 && (
                        <div className="flex justify-between text-orange-600"><span>Holiday Surcharge</span><span>{result.holidaySurcharges.totalHolidayCharge}</span></div>
                     )}
                  </div>
               </div>
            </div>

         </div>

         {/* Footer Totals */}
         <div className="bg-white border-t border-gray-200 p-6">
            <div className="space-y-2 text-sm">
               <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹ {result.summary.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
               </div>
               <div className="flex justify-between text-gray-600">
                  <span>GST ({result.summary.gst.rate}%)</span>
                  <span>₹ {result.summary.gst.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
               </div>
               <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-100">
                  <span>Total Payable</span>
                  <span>₹ {result.summary.grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
               </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
               <Button className="flex-1">
                  <FileText className="h-4 w-4 mr-2" /> Generate Quote
               </Button>
               <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" /> Download PDF
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
};
