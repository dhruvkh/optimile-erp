import React, { useEffect } from 'react';
import { useBooking, HandlingUnit } from '../../../context/BookingContext';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Trash2, Plus, Package, Info, AlertTriangle, Lightbulb } from 'lucide-react';

export const LTLHandlingUnits: React.FC = () => {
  const { data, updateData } = useBooking();

  const addUnit = () => {
    const newUnit: HandlingUnit = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'Pallet',
      quantity: 1,
      length: 48,
      width: 40,
      height: 48,
      weight: 500,
      stackable: false,
      hazmat: false,
    };
    updateData({ handlingUnits: [...data.handlingUnits, newUnit] });
  };

  const removeUnit = (id: string) => {
    updateData({ handlingUnits: data.handlingUnits.filter(u => u.id !== id) });
  };

  const updateUnit = (id: string, field: keyof HandlingUnit, value: any) => {
    const updatedUnits = data.handlingUnits.map(u => 
      u.id === id ? { ...u, [field]: value } : u
    );
    updateData({ handlingUnits: updatedUnits });
  };

  // Recalculate metrics whenever units change
  useEffect(() => {
    let totalWeightLbs = 0;
    let totalVolumeCuFt = 0;

    data.handlingUnits.forEach(unit => {
      const unitWeight = unit.weight * unit.quantity; // Assuming input is lbs
      const unitVolume = (unit.length * unit.width * unit.height * unit.quantity) / 1728; // inches to cu ft
      
      totalWeightLbs += unitWeight;
      totalVolumeCuFt += unitVolume;
    });

    const density = totalVolumeCuFt > 0 ? totalWeightLbs / totalVolumeCuFt : 0;
    
    // Auto-assign Freight Class based on Density (Simplified NMFC logic)
    let freightClass = '60'; // Default
    if (density < 1) freightClass = '400';
    else if (density < 2) freightClass = '300';
    else if (density < 4) freightClass = '250';
    else if (density < 6) freightClass = '175';
    else if (density < 8) freightClass = '125';
    else if (density < 10) freightClass = '100';
    else if (density < 12) freightClass = '92.5';
    else if (density < 15) freightClass = '85';
    else if (density < 22.5) freightClass = '70';
    else if (density < 30) freightClass = '65';
    else if (density > 50) freightClass = '50';

    updateData({
      ltlMetrics: {
        density: parseFloat(density.toFixed(2)),
        cubicFeet: parseFloat(totalVolumeCuFt.toFixed(2)),
        freightClass: freightClass
      },
      weight: totalWeightLbs, // Update main weight field
      weightUnit: 'lbs',
      volume: parseFloat(totalVolumeCuFt.toFixed(2)), // Update main volume field
      volumeUnit: 'CFT'
    });
  }, [data.handlingUnits]); // Dependency on handlingUnits array structure

  // If no units, add one by default
  useEffect(() => {
    if (data.handlingUnits.length === 0) {
      addUnit();
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-gray-900 flex items-center">
          <Package className="h-5 w-5 mr-2 text-gray-500" />
          Handling Units
        </h4>
        <Button size="sm" onClick={addUnit}>
          <Plus className="h-4 w-4 mr-1" /> Add Unit
        </Button>
      </div>

      <div className="space-y-4">
        {data.handlingUnits.map((unit, index) => (
          <div key={unit.id} className="border border-gray-200 rounded-lg p-4 bg-white relative hover:shadow-sm transition-shadow">
            <button 
              onClick={() => removeUnit(unit.id)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select 
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 border"
                  value={unit.type}
                  onChange={(e) => updateUnit(unit.id, 'type', e.target.value)}
                >
                  <option>Pallet</option>
                  <option>Crate</option>
                  <option>Box</option>
                  <option>Drum</option>
                  <option>Other</option>
                </select>
              </div>
              
              <div className="md:col-span-1">
                <Input 
                  label="Quantity" 
                  type="number" 
                  value={unit.quantity} 
                  onChange={(e) => updateUnit(unit.id, 'quantity', Number(e.target.value))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Dimensions (L x W x H) inches</label>
                <div className="grid grid-cols-3 gap-2">
                  <input 
                    type="number" 
                    placeholder="L" 
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-2 border"
                    value={unit.length}
                    onChange={(e) => updateUnit(unit.id, 'length', Number(e.target.value))}
                  />
                  <input 
                    type="number" 
                    placeholder="W" 
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-2 border"
                    value={unit.width}
                    onChange={(e) => updateUnit(unit.id, 'width', Number(e.target.value))}
                  />
                  <input 
                    type="number" 
                    placeholder="H" 
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-2 border"
                    value={unit.height}
                    onChange={(e) => updateUnit(unit.id, 'height', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="md:col-span-1">
                <Input 
                  label="Weight (lbs/unit)" 
                  type="number" 
                  value={unit.weight} 
                  onChange={(e) => updateUnit(unit.id, 'weight', Number(e.target.value))}
                />
              </div>

              <div className="md:col-span-1 flex flex-col justify-center space-y-2 pb-2">
                 <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={unit.stackable}
                      onChange={(e) => updateUnit(unit.id, 'stackable', e.target.checked)}
                      className="rounded text-primary focus:ring-primary h-3 w-3" 
                    />
                    <span>Stackable</span>
                 </label>
                 <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={unit.hazmat}
                      onChange={(e) => updateUnit(unit.id, 'hazmat', e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-600 h-3 w-3" 
                    />
                    <span className={unit.hazmat ? 'text-red-600 font-bold' : ''}>Hazmat</span>
                 </label>
              </div>
            </div>
            
            {/* Unit Metrics */}
            <div className="mt-3 pt-2 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
               <span>Vol: {((unit.length * unit.width * unit.height)/1728).toFixed(2)} ft³</span>
               <span>Density: {(unit.weight / ((unit.length * unit.width * unit.height)/1728)).toFixed(2)} PCF</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Metrics */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
         <h5 className="text-sm font-bold text-gray-900 mb-3">Total Shipment Summary</h5>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
               <span className="block text-gray-500 text-xs">Total Weight</span>
               <span className="font-bold text-gray-900">{data.weight.toLocaleString()} lbs</span>
            </div>
            <div>
               <span className="block text-gray-500 text-xs">Total Volume</span>
               <span className="font-bold text-gray-900">{data.ltlMetrics.cubicFeet} ft³</span>
            </div>
            <div>
               <span className="block text-gray-500 text-xs">Avg Density</span>
               <span className="font-bold text-gray-900">{data.ltlMetrics.density} PCF</span>
            </div>
            <div>
               <span className="block text-gray-500 text-xs">Freight Class</span>
               <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  Class {data.ltlMetrics.freightClass}
               </span>
            </div>
         </div>

         {/* Density Tip */}
         <div className="mt-4 flex items-start p-2 bg-blue-50 text-blue-800 rounded text-xs border border-blue-100">
            <Lightbulb className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
            <div>
               <span className="font-bold">Optimization Tip:</span> Your current density ({data.ltlMetrics.density} PCF) puts you in Class {data.ltlMetrics.freightClass}. 
               {data.ltlMetrics.density < 10 && data.ltlMetrics.density > 8 && (
                 <span> If you can reduce packaging volume to increase density to 10 PCF, you could qualify for Class 100 and save approx. 15%.</span>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};
