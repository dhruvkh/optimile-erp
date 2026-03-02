
import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Route, INITIAL_ROUTE, Toll, Stop } from './types';
import { 
  MapPin, Navigation, IndianRupee, Clock, Save, Plus, 
  Trash2, Map, Coffee, Truck 
} from 'lucide-react';

interface RouteFormProps {
  initialData?: Route | null;
  onSave: (route: Route) => void;
  onCancel: () => void;
}

export const RouteForm: React.FC<RouteFormProps> = ({ initialData, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'path' | 'stops'>('basic');
  const [formData, setFormData] = useState<Route>(initialData || {
    ...INITIAL_ROUTE,
    id: `ROU-${Math.floor(Math.random() * 10000)}`,
    code: `ROU-${Math.floor(Math.random() * 10000)}`
  });
  const [formError, setFormError] = useState('');
  const [mapsError, setMapsError] = useState('');

  // Calculate total toll cost whenever tolls change
  useEffect(() => {
    const total = formData.tolls.reduce((sum, toll) => sum + toll.cost, 0);
    setFormData(prev => ({ ...prev, totalTollCost: total }));
  }, [formData.tolls]);

  const handleSave = () => {
    if (!formData.name || !formData.origin.city || !formData.destination.city) {
      setFormError('Route Name, Origin City, and Destination City are required.');
      return;
    }
    setFormError('');
    onSave(formData);
  };

  const updateLocation = (type: 'origin' | 'destination', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  const simulateGoogleMapsCalculation = () => {
    // Mock API call simulation
    if (formData.origin.city && formData.destination.city) {
        setMapsError('');
        setFormData(prev => ({
            ...prev,
            distance: Math.floor(Math.random() * 1500) + 200,
            estimatedTime: Math.floor(Math.random() * 30) + 5,
            highways: ['NH-48', 'NH-66']
        }));
    } else {
        setMapsError('Please enter Origin and Destination cities before calculating.');
    }
  };

  const addToll = () => {
    const newToll: Toll = { id: Math.random().toString(), name: 'New Toll Plaza', cost: 0 };
    setFormData(prev => ({ ...prev, tolls: [...prev.tolls, newToll] }));
  };

  const updateToll = (index: number, field: keyof Toll, value: any) => {
    const newTolls = [...formData.tolls];
    newTolls[index] = { ...newTolls[index], [field]: value };
    setFormData(prev => ({ ...prev, tolls: newTolls }));
  };

  const removeToll = (index: number) => {
    const newTolls = [...formData.tolls];
    newTolls.splice(index, 1);
    setFormData(prev => ({ ...prev, tolls: newTolls }));
  };

  const addStop = () => {
    const newStop: Stop = { id: Math.random().toString(), name: 'New Stop', km: 0, facilities: [] };
    setFormData(prev => ({ ...prev, stopsRecommended: [...prev.stopsRecommended, newStop] }));
  };

  const updateStop = (index: number, field: keyof Stop, value: any) => {
    const newStops = [...formData.stopsRecommended];
    newStops[index] = { ...newStops[index], [field]: value };
    setFormData(prev => ({ ...prev, stopsRecommended: newStops }));
  };

  const removeStop = (index: number) => {
    const newStops = [...formData.stopsRecommended];
    newStops.splice(index, 1);
    setFormData(prev => ({ ...prev, stopsRecommended: newStops }));
  };

  const toggleFacility = (stopIndex: number, facility: string) => {
    const stop = formData.stopsRecommended[stopIndex];
    const newFacilities = stop.facilities.includes(facility)
      ? stop.facilities.filter(f => f !== facility)
      : [...stop.facilities, facility];
    updateStop(stopIndex, 'facilities', newFacilities);
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
            {initialData ? 'Edit Route' : 'Create New Route'}
          </h2>
          <p className="text-sm text-gray-500">Code: {formData.code}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {formError && <p className="text-red-500 text-sm mt-1">{formError}</p>}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" /> Save Route
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <TabButton id="basic" label="Basic Details" icon={Navigation} />
        <TabButton id="path" label="Path & Tolls" icon={IndianRupee} />
        <TabButton id="stops" label="Recommended Stops" icon={Coffee} />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        
        {/* BASIC TAB */}
        {activeTab === 'basic' && (
          <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Route Name" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Mumbai - Delhi Express"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 border"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
               {/* Origin */}
               <div className="flex-1 bg-gray-50 p-4 rounded-lg border border-gray-200 w-full">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                     <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div> Origin
                  </h4>
                  <div className="space-y-3">
                     <Input 
                        label="City" 
                        value={formData.origin.city}
                        onChange={(e) => updateLocation('origin', 'city', e.target.value)}
                     />
                     <Input 
                        label="State" 
                        value={formData.origin.state}
                        onChange={(e) => updateLocation('origin', 'state', e.target.value)}
                     />
                     <Input 
                        label="Hub (Optional)" 
                        value={formData.origin.hub || ''}
                        onChange={(e) => updateLocation('origin', 'hub', e.target.value)}
                     />
                  </div>
               </div>

               {/* Destination */}
               <div className="flex-1 bg-gray-50 p-4 rounded-lg border border-gray-200 w-full">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                     <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div> Destination
                  </h4>
                  <div className="space-y-3">
                     <Input 
                        label="City" 
                        value={formData.destination.city}
                        onChange={(e) => updateLocation('destination', 'city', e.target.value)}
                     />
                     <Input 
                        label="State" 
                        value={formData.destination.state}
                        onChange={(e) => updateLocation('destination', 'state', e.target.value)}
                     />
                     <Input 
                        label="Hub (Optional)" 
                        value={formData.destination.hub || ''}
                        onChange={(e) => updateLocation('destination', 'hub', e.target.value)}
                     />
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* PATH & TOLLS TAB */}
        {activeTab === 'path' && (
          <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Distance Calc */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
               <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-blue-900 flex items-center">
                     <Map className="h-4 w-4 mr-2" /> Route Metrics
                  </h4>
                  <div className="flex flex-col items-end gap-1">
                     {mapsError && <p className="text-red-500 text-sm">{mapsError}</p>}
                     <Button size="sm" onClick={simulateGoogleMapsCalculation} className="bg-blue-600 hover:bg-blue-700">
                        Calculate from Maps
                     </Button>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input 
                     label="Distance (KM)" 
                     type="number"
                     value={formData.distance}
                     onChange={(e) => setFormData({...formData, distance: Number(e.target.value)})}
                  />
                  <Input 
                     label="Est. Time (Hours)" 
                     type="number"
                     value={formData.estimatedTime}
                     onChange={(e) => setFormData({...formData, estimatedTime: Number(e.target.value)})}
                  />
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Highways</label>
                     <input 
                        type="text"
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 border"
                        placeholder="e.g. NH-48, NH-66"
                        value={formData.highways.join(', ')}
                        onChange={(e) => setFormData({...formData, highways: e.target.value.split(',').map(s => s.trim())})}
                     />
                  </div>
               </div>
            </div>

            {/* Tolls Section */}
            <div>
               <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-gray-900">Toll Plazas</h4>
                  <div className="flex items-center space-x-4">
                     <span className="text-sm font-bold text-gray-700">Total Toll: ₹ {formData.totalTollCost}</span>
                     <Button size="sm" variant="outline" onClick={addToll}>
                        <Plus className="h-3 w-3 mr-1" /> Add Toll
                     </Button>
                  </div>
               </div>
               
               {formData.tolls.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 text-sm">
                     No toll plazas added. Use "Add Toll" to define costs.
                  </div>
               ) : (
                  <div className="space-y-2">
                     {formData.tolls.map((toll, index) => (
                        <div key={index} className="flex gap-4 items-center bg-gray-50 p-2 rounded border border-gray-200">
                           <span className="text-xs font-bold text-gray-500 w-6 text-center">{index + 1}</span>
                           <div className="flex-1">
                              <input 
                                 type="text" 
                                 className="w-full text-sm border-gray-300 rounded px-2 py-1"
                                 placeholder="Toll Name"
                                 value={toll.name}
                                 onChange={(e) => updateToll(index, 'name', e.target.value)}
                              />
                           </div>
                           <div className="w-32 relative">
                              <span className="absolute left-2 top-1.5 text-gray-500 text-xs">₹</span>
                              <input 
                                 type="number" 
                                 className="w-full text-sm border-gray-300 rounded pl-5 py-1"
                                 placeholder="Cost"
                                 value={toll.cost}
                                 onChange={(e) => updateToll(index, 'cost', Number(e.target.value))}
                              />
                           </div>
                           <button onClick={() => removeToll(index)} className="text-red-500 hover:text-red-700 p-1">
                              <Trash2 className="h-4 w-4" />
                           </button>
                        </div>
                     ))}
                  </div>
               )}
            </div>
          </div>
        )}

        {/* STOPS TAB */}
        {activeTab === 'stops' && (
          <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
             <div className="flex justify-between items-center mb-4">
                <div>
                   <h4 className="text-sm font-bold text-gray-900">Recommended Stops</h4>
                   <p className="text-xs text-gray-500">Define verified stops for fuel, food, and rest.</p>
                </div>
                <Button size="sm" variant="outline" onClick={addStop}>
                   <Plus className="h-3 w-3 mr-1" /> Add Stop
                </Button>
             </div>

             {formData.stopsRecommended.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 text-sm">
                   No stops configured.
                </div>
             ) : (
                <div className="space-y-4">
                   {formData.stopsRecommended.map((stop, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                         <div className="flex gap-4 items-start mb-3">
                            <div className="flex-1 grid grid-cols-2 gap-4">
                               <Input 
                                  label="Stop Name / Location" 
                                  value={stop.name}
                                  onChange={(e) => updateStop(index, 'name', e.target.value)}
                               />
                               <Input 
                                  label="Distance from Start (KM)" 
                                  type="number"
                                  value={stop.km}
                                  onChange={(e) => updateStop(index, 'km', Number(e.target.value))}
                               />
                            </div>
                            <button onClick={() => removeStop(index)} className="text-red-500 hover:text-red-700 p-2 mt-6">
                               <Trash2 className="h-4 w-4" />
                            </button>
                         </div>
                         
                         <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">Available Facilities</label>
                            <div className="flex flex-wrap gap-2">
                               {['Food', 'Fuel', 'Rest', 'Washroom', 'Repair'].map(facility => (
                                  <button
                                     key={facility}
                                     onClick={() => toggleFacility(index, facility)}
                                     className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                        stop.facilities.includes(facility) 
                                           ? 'bg-primary text-white border-primary' 
                                           : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                     }`}
                                  >
                                     {facility}
                                  </button>
                               ))}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
        )}

      </div>
    </Card>
  );
};
