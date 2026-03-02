
import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { RateTemplate, INITIAL_RATE_TEMPLATE } from './types';
import { 
  IndianRupee, Truck, Calendar, Settings, Fuel, 
  Save, AlertCircle, Plus, Trash2, Map, Users
} from 'lucide-react';

interface RateFormProps {
  initialData?: RateTemplate | null;
  onSave: (template: RateTemplate) => void;
  onCancel: () => void;
}

export const RateForm: React.FC<RateFormProps> = ({ initialData, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'charges' | 'fuel' | 'conditions'>('basic');
  const [formData, setFormData] = useState<RateTemplate>(initialData || {
    ...INITIAL_RATE_TEMPLATE,
    id: `RATE-${Math.floor(Math.random() * 10000)}`,
    code: `RT-${Math.floor(Math.random() * 10000)}`
  });
  const [formError, setFormError] = useState('');

  const handleSave = () => {
    if (!formData.name) {
      setFormError('Template Name is required.');
      return;
    }
    setFormError('');
    onSave(formData);
  };

  const addDiscountTier = () => {
    setFormData(prev => ({
      ...prev,
      specialConditions: {
        ...prev.specialConditions,
        bulkDiscount: [...prev.specialConditions.bulkDiscount, { minTrips: 10, discountPercent: 2 }]
      }
    }));
  };

  const removeDiscountTier = (index: number) => {
    const newDiscounts = [...formData.specialConditions.bulkDiscount];
    newDiscounts.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      specialConditions: { ...prev.specialConditions, bulkDiscount: newDiscounts }
    }));
  };

  const updateDiscountTier = (index: number, field: string, value: number) => {
    const newDiscounts = [...formData.specialConditions.bulkDiscount];
    newDiscounts[index] = { ...newDiscounts[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      specialConditions: { ...prev.specialConditions, bulkDiscount: newDiscounts }
    }));
  };

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        activeTab === id 
          ? 'border-primary text-primary bg-primary/5' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
    </button>
  );

  return (
    <Card className="h-full flex flex-col p-0 overflow-hidden" bodyClassName="p-0 h-full min-h-0 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {initialData ? 'Edit Rate Template' : 'Create Rate Template'}
          </h2>
          <p className="text-sm text-gray-500">Code: {formData.code}</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" /> Save Template
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <TabButton id="basic" label="Basic & Structure" icon={IndianRupee} />
        <TabButton id="charges" label="Additional Charges" icon={Settings} />
        <TabButton id="fuel" label="Fuel Surcharge" icon={Fuel} />
        <TabButton id="conditions" label="Validity & Conditions" icon={Calendar} />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        
        {/* BASIC TAB */}
        {activeTab === 'basic' && (
          <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Template Name"
                  required
                  value={formData.name}
                  onChange={(e) => { setFormData({...formData, name: e.target.value}); if (formError) setFormError(''); }}
                  placeholder="e.g. Standard FTL North Zone"
                />
                {formError && <p className="text-red-500 text-sm mt-1">{formError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 border"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Input 
                  label="Description" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Internal notes about this rate card..."
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-bold text-gray-900 mb-4">Applicability</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Types</label>
                  <select 
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm py-2 px-3 border"
                    // Multi-select logic would be more complex, simplifying for demo
                    onChange={(e) => {
                       const val = e.target.value;
                       if (!formData.applicableFor.vehicleTypes.includes(val)) {
                          setFormData(prev => ({
                             ...prev, 
                             applicableFor: {
                                ...prev.applicableFor, 
                                vehicleTypes: [...prev.applicableFor.vehicleTypes, val]
                             }
                          }));
                       }
                    }}
                  >
                    <option value="">Add Vehicle Type...</option>
                    <option value="20 Ton Closed Body">20 Ton Closed Body</option>
                    <option value="32 Ton Multi-Axle">32 Ton Multi-Axle</option>
                    <option value="Container 20ft">Container 20ft</option>
                  </select>
                  <div className="flex flex-wrap gap-2 mt-2">
                     {formData.applicableFor.vehicleTypes.map(vt => (
                        <span key={vt} className="text-xs bg-gray-100 px-2 py-1 rounded-full flex items-center border border-gray-200">
                           {vt}
                           <button 
                              className="ml-1 text-gray-400 hover:text-red-500"
                              onClick={() => setFormData(prev => ({
                                 ...prev,
                                 applicableFor: {
                                    ...prev.applicableFor,
                                    vehicleTypes: prev.applicableFor.vehicleTypes.filter(t => t !== vt)
                                 }
                              }))}
                           >
                              ×
                           </button>
                        </span>
                     ))}
                  </div>
                </div>
                
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Client Applicability</label>
                   <div className="flex items-center space-x-4 mt-2">
                      <label className="flex items-center">
                         <input 
                            type="radio" 
                            checked={formData.applicableFor.clients.includes('All')}
                            onChange={() => setFormData(prev => ({...prev, applicableFor: {...prev.applicableFor, clients: ['All']}}))}
                            className="text-primary focus:ring-primary h-4 w-4 mr-2"
                         />
                         <span className="text-sm">All Clients</span>
                      </label>
                      <label className="flex items-center">
                         <input 
                            type="radio" 
                            checked={!formData.applicableFor.clients.includes('All')}
                            onChange={() => setFormData(prev => ({...prev, applicableFor: {...prev.applicableFor, clients: []}}))}
                            className="text-primary focus:ring-primary h-4 w-4 mr-2"
                         />
                         <span className="text-sm">Specific Clients</span>
                      </label>
                   </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
               <h4 className="text-sm font-bold text-gray-900 mb-4">Base Rate Structure</h4>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input 
                     label="Base Rate Amount" 
                     type="number"
                     value={formData.rateStructure.baseRate}
                     onChange={(e) => setFormData(prev => ({...prev, rateStructure: {...prev.rateStructure, baseRate: Number(e.target.value)}}))}
                  />
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                     <select 
                        className="block w-full border-gray-300 rounded-md shadow-sm text-sm py-2 px-3 border"
                        value={formData.rateStructure.unit}
                        onChange={(e) => setFormData(prev => ({...prev, rateStructure: {...prev.rateStructure, unit: e.target.value as any}}))}
                     >
                        <option>Per Trip</option>
                        <option>Per KM</option>
                        <option>Per Ton</option>
                     </select>
                  </div>
                  <Input 
                     label="Minimum Charge" 
                     type="number"
                     value={formData.rateStructure.minimumCharge}
                     onChange={(e) => setFormData(prev => ({...prev, rateStructure: {...prev.rateStructure, minimumCharge: Number(e.target.value)}}))}
                  />
               </div>
            </div>
          </div>
        )}

        {/* CHARGES TAB */}
        {activeTab === 'charges' && (
          <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                   label="Loading Charges (₹)" 
                   type="number"
                   value={formData.additionalCharges.loading}
                   onChange={(e) => setFormData(prev => ({...prev, additionalCharges: {...prev.additionalCharges, loading: Number(e.target.value)}}))}
                />
                <Input 
                   label="Unloading Charges (₹)" 
                   type="number"
                   value={formData.additionalCharges.unloading}
                   onChange={(e) => setFormData(prev => ({...prev, additionalCharges: {...prev.additionalCharges, unloading: Number(e.target.value)}}))}
                />
             </div>

             <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Detention Policy</h4>
                <div className="grid grid-cols-2 gap-4">
                   <Input 
                      label="Free Hours" 
                      type="number"
                      value={formData.additionalCharges.detention.afterHours}
                      onChange={(e) => setFormData(prev => ({...prev, additionalCharges: {...prev.additionalCharges, detention: {...prev.additionalCharges.detention, afterHours: Number(e.target.value)}} }))}
                   />
                   <Input 
                      label="Rate per Hour (₹)" 
                      type="number"
                      value={formData.additionalCharges.detention.ratePerHour}
                      onChange={(e) => setFormData(prev => ({...prev, additionalCharges: {...prev.additionalCharges, detention: {...prev.additionalCharges.detention, ratePerHour: Number(e.target.value)}} }))}
                   />
                </div>
             </div>

             <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Toll Charges</h4>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Billing Method</label>
                      <select 
                         className="block w-full border-gray-300 rounded-md shadow-sm text-sm py-2 px-3 border"
                         value={formData.additionalCharges.toll}
                         onChange={(e) => setFormData(prev => ({...prev, additionalCharges: {...prev.additionalCharges, toll: e.target.value as any}}))}
                      >
                         <option value="Actual">Actual (As per Receipt)</option>
                         <option value="Fixed">Fixed Amount</option>
                      </select>
                   </div>
                   {formData.additionalCharges.toll === 'Fixed' && (
                      <Input 
                         label="Fixed Toll Amount (₹)" 
                         type="number"
                         value={formData.additionalCharges.tollAmount || 0}
                         onChange={(e) => setFormData(prev => ({...prev, additionalCharges: {...prev.additionalCharges, tollAmount: Number(e.target.value)}}))}
                      />
                   )}
                </div>
             </div>
          </div>
        )}

        {/* FUEL TAB */}
        {activeTab === 'fuel' && (
          <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                   <Fuel className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                   <div>
                      <h4 className="text-sm font-bold text-blue-900">Fuel Surcharge Mechanism</h4>
                      <p className="text-xs text-blue-700 mt-1">
                         Define how fluctuations in diesel prices affect the base rate.
                      </p>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Surcharge Type</label>
                   <select 
                      className="block w-full border-gray-300 rounded-md shadow-sm text-sm py-2 px-3 border"
                      value={formData.fuelSurcharge.type}
                      onChange={(e) => setFormData(prev => ({...prev, fuelSurcharge: {...prev.fuelSurcharge, type: e.target.value as any}}))}
                   >
                      <option value="Variable">Variable (Based on Price)</option>
                      <option value="Fixed">Fixed Amount</option>
                      <option value="Percentage">Flat Percentage</option>
                   </select>
                </div>
                
                {formData.fuelSurcharge.type === 'Variable' && (
                   <Input 
                      label="Base Diesel Price (₹/L)" 
                      type="number"
                      value={formData.fuelSurcharge.baseDieselPrice}
                      onChange={(e) => setFormData(prev => ({...prev, fuelSurcharge: {...prev.fuelSurcharge, baseDieselPrice: Number(e.target.value)}}))}
                   />
                )}
             </div>

             {formData.fuelSurcharge.type === 'Variable' && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                   <label className="block text-sm font-medium text-gray-700 mb-2">Calculation Formula Description</label>
                   <textarea 
                      className="block w-full border-gray-300 rounded-md shadow-sm text-sm py-2 px-3 border"
                      rows={3}
                      value={formData.fuelSurcharge.calculation}
                      onChange={(e) => setFormData(prev => ({...prev, fuelSurcharge: {...prev.fuelSurcharge, calculation: e.target.value}}))}
                      placeholder="e.g. 1% increase in freight for every Rs 1 increase in fuel price"
                   ></textarea>
                </div>
             )}
          </div>
        )}

        {/* CONDITIONS TAB */}
        {activeTab === 'conditions' && (
          <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                   label="Valid From" 
                   type="date"
                   value={formData.validity.from}
                   onChange={(e) => setFormData(prev => ({...prev, validity: {...prev.validity, from: e.target.value}}))}
                />
                <Input 
                   label="Valid To" 
                   type="date"
                   value={formData.validity.to}
                   onChange={(e) => setFormData(prev => ({...prev, validity: {...prev.validity, to: e.target.value}}))}
                />
             </div>

             <div className="border-t border-gray-100 pt-6">
                <div className="flex justify-between items-center mb-4">
                   <h4 className="text-sm font-bold text-gray-900">Bulk Discounts</h4>
                   <Button size="sm" variant="outline" onClick={addDiscountTier}>
                      <Plus className="h-3 w-3 mr-1" /> Add Tier
                   </Button>
                </div>

                {formData.specialConditions.bulkDiscount.length === 0 ? (
                   <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      No bulk discounts defined.
                   </p>
                ) : (
                   <div className="space-y-3">
                      {formData.specialConditions.bulkDiscount.map((tier, idx) => (
                         <div key={idx} className="flex items-center gap-4 bg-gray-50 p-2 rounded border border-gray-200">
                            <div className="flex-1 flex items-center gap-2">
                               <span className="text-sm text-gray-600">If trips &gt;</span>
                               <input 
                                  type="number" 
                                  className="w-20 text-sm border-gray-300 rounded px-2 py-1 border"
                                  value={tier.minTrips}
                                  onChange={(e) => updateDiscountTier(idx, 'minTrips', Number(e.target.value))}
                               />
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                               <span className="text-sm text-gray-600">Discount</span>
                               <input 
                                  type="number" 
                                  className="w-20 text-sm border-gray-300 rounded px-2 py-1 border"
                                  value={tier.discountPercent}
                                  onChange={(e) => updateDiscountTier(idx, 'discountPercent', Number(e.target.value))}
                               />
                               <span className="text-sm text-gray-600">%</span>
                            </div>
                            <button onClick={() => removeDiscountTier(idx)} className="text-red-500 hover:text-red-700 p-1">
                               <Trash2 className="h-4 w-4" />
                            </button>
                         </div>
                      ))}
                   </div>
                )}
             </div>
          </div>
        )}

      </div>
    </Card>
  );
};
