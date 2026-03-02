import React, { useState, useEffect } from 'react';
import { useBooking, CarrierOption } from '../../../context/BookingContext';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Star, Truck, Info, Check, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

const CARRIERS: CarrierOption[] = [
  { id: 'c1', name: 'ABC Freight Lines', transitTime: '3 Days', rate: 28500, rating: 4.8, onTime: 96, isRecommended: true },
  { id: 'c2', name: 'XYZ Logistics', transitTime: '4 Days', rate: 26000, rating: 4.5, onTime: 92, isCheapest: true },
  { id: 'c3', name: 'FastShip Express', transitTime: '2 Days', rate: 32000, rating: 4.9, onTime: 98, isFastest: true },
];

const ACCESSORIALS_LIST = [
  { id: 'lg_pickup', label: 'Liftgate Pickup', cost: 2500 },
  { id: 'lg_delivery', label: 'Liftgate Delivery', cost: 2500 },
  { id: 'inside_pickup', label: 'Inside Pickup', cost: 3500 },
  { id: 'inside_delivery', label: 'Inside Delivery', cost: 3500 },
  { id: 'residential_pickup', label: 'Residential Pickup', cost: 4000 },
  { id: 'residential_delivery', label: 'Residential Delivery', cost: 4000 },
  { id: 'hazmat', label: 'Hazardous Materials', cost: 5000 },
  { id: 'notify', label: 'Notify Before Delivery', cost: 1000 },
];

export const LTLRateCalculator: React.FC = () => {
  const { data, updateData } = useBooking();
  const [accessorialCost, setAccessorialCost] = useState(0);
  const [weightBreakSavings, setWeightBreakSavings] = useState(0);
  const [fscAmount, setFscAmount] = useState(0);

  // Toggle Accessorial
  const toggleAccessorial = (id: string, cost: number) => {
    const exists = data.accessorials.includes(id);
    let newAccessorials;
    if (exists) {
      newAccessorials = data.accessorials.filter(a => a !== id);
    } else {
      newAccessorials = [...data.accessorials, id];
    }
    updateData({ accessorials: newAccessorials });
  };

  // Calculate Costs
  useEffect(() => {
    // 1. Accessorials
    const accTotal = ACCESSORIALS_LIST
      .filter(a => data.accessorials.includes(a.id))
      .reduce((sum, a) => sum + a.cost, 0);
    setAccessorialCost(accTotal);

    // 2. Weight Break Mock Logic
    // If weight is close to next break (e.g. 500), suggest paying for 500 at lower rate
    let savings = 0;
    if (data.weight > 400 && data.weight < 500 && !data.weightBreakApplied) {
       savings = 1250; // Mock savings in INR
    }
    setWeightBreakSavings(savings);

    // 3. Update FSC
    // Assuming base rate comes from selected carrier
    const base = data.selectedCarrier ? data.selectedCarrier.rate : 0;
    const fsc = (base + accTotal) * (data.fscPercentage / 100);
    setFscAmount(fsc);

    // Update global base rate for consistency
    if (data.selectedCarrier) {
        updateData({ 
            baseRate: data.selectedCarrier.rate,
            otherCharges: accTotal + fsc
        });
    }

  }, [data.accessorials, data.weight, data.selectedCarrier, data.fscPercentage, data.weightBreakApplied]);

  // Select Carrier
  const handleSelectCarrier = (carrier: CarrierOption) => {
    updateData({ selectedCarrier: carrier });
  };

  return (
    <div className="space-y-6">
      
      {/* Accessorials Selection */}
      <Card title="Additional Services (Accessorials)">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {ACCESSORIALS_LIST.map((acc) => (
               <label key={acc.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                  data.accessorials.includes(acc.id) ? 'bg-primary/5 border-primary shadow-sm' : 'border-gray-200 hover:bg-gray-50'
               }`}>
                  <div className="flex items-center">
                     <input 
                        type="checkbox" 
                        className="rounded text-primary focus:ring-primary h-4 w-4 mr-2"
                        checked={data.accessorials.includes(acc.id)}
                        onChange={() => toggleAccessorial(acc.id, acc.cost)}
                     />
                     <span className="text-sm font-medium text-gray-700">{acc.label}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">+₹{acc.cost}</span>
               </label>
            ))}
         </div>
         {data.accessorials.length > 0 && (
             <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                 <span className="text-sm font-medium text-gray-700">Accessorial Total: <span className="font-bold text-gray-900">₹{accessorialCost.toLocaleString()}</span></span>
             </div>
         )}
      </Card>

      {/* Weight Break Optimization Alert */}
      {weightBreakSavings > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start justify-between">
              <div className="flex items-start">
                  <div className="p-2 bg-yellow-100 rounded-full mr-3 text-yellow-700">
                      <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                      <h4 className="font-bold text-yellow-900 text-sm">Weight Break Opportunity!</h4>
                      <p className="text-xs text-yellow-800 mt-1">
                          You are shipping {data.weight} lbs. By declaring 500 lbs (deficit weight), you qualify for a lower rate tier.
                      </p>
                      <p className="text-sm font-bold text-green-700 mt-2">Potential Savings: ₹{weightBreakSavings.toLocaleString()}</p>
                  </div>
              </div>
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white border-none" onClick={() => updateData({ weightBreakApplied: true })}>
                  Apply Optimization
              </Button>
          </div>
      )}

      {/* Carrier Selection Table */}
      <Card title="Carrier Rate Comparison">
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                      <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carrier</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transit</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Rate</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Total*</th>
                          <th className="px-6 py-3"></th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {CARRIERS.map((carrier) => {
                          const estimatedTotal = carrier.rate + accessorialCost + ((carrier.rate + accessorialCost) * (data.fscPercentage / 100));
                          const isSelected = data.selectedCarrier?.id === carrier.id;
                          
                          return (
                              <tr key={carrier.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center">
                                          <div className="mr-3">
                                              {carrier.isRecommended && <span className="block text-[10px] text-green-600 font-bold uppercase mb-1">Recommended</span>}
                                              {carrier.isCheapest && <span className="block text-[10px] text-blue-600 font-bold uppercase mb-1">Lowest Cost</span>}
                                              {carrier.isFastest && <span className="block text-[10px] text-purple-600 font-bold uppercase mb-1">Fastest</span>}
                                              <span className="font-bold text-gray-900 block">{carrier.name}</span>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{carrier.transitTime}</td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center text-sm text-gray-600">
                                          <span className="font-bold mr-1">{carrier.rating}</span>
                                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                          <span className="text-xs text-gray-400 ml-2">({carrier.onTime}% On-Time)</span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm font-medium text-gray-500">₹{carrier.rate.toLocaleString()}</td>
                                  <td className="px-6 py-4">
                                      <span className="text-lg font-bold text-gray-900">₹{estimatedTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <Button 
                                        size="sm" 
                                        variant={isSelected ? "primary" : "outline"}
                                        onClick={() => handleSelectCarrier(carrier)}
                                        className={isSelected ? "bg-green-600 hover:bg-green-700" : ""}
                                      >
                                          {isSelected ? <><Check className="h-3 w-3 mr-1" /> Selected</> : 'Select'}
                                      </Button>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
          <p className="text-xs text-gray-400 mt-2 p-2">* Est. Total includes Base Rate + Accessorials + FSC ({data.fscPercentage}%). Subject to final weight verification.</p>
      </Card>

      {/* Breakdown Panel */}
      {data.selectedCarrier && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Rate Breakdown
              </h4>
              <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                      <span className="text-gray-600">Base Freight ({data.ltlMetrics.freightClass}, {data.weight} lbs)</span>
                      <span className="font-medium">₹{data.selectedCarrier.rate.toLocaleString()}</span>
                  </div>
                  {data.weightBreakApplied && (
                      <div className="flex justify-between text-green-700">
                          <span className="flex items-center"><TrendingUp className="h-3 w-3 mr-1" /> Weight Break Optimization</span>
                          <span className="font-medium">Applied</span>
                      </div>
                  )}
                  {accessorialCost > 0 && (
                      <div className="flex justify-between">
                          <span className="text-gray-600">Accessorials</span>
                          <span className="font-medium">₹{accessorialCost.toLocaleString()}</span>
                      </div>
                  )}
                  <div className="flex justify-between">
                      <span className="text-gray-600">Fuel Surcharge ({data.fscPercentage}%)</span>
                      <span className="font-medium">₹{fscAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center mt-2">
                      <span className="font-bold text-gray-900">Total Estimated Cost</span>
                      <span className="font-bold text-xl text-primary">
                          ₹{(data.selectedCarrier.rate + accessorialCost + fscAmount).toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </span>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
