
import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Location, INITIAL_LOCATION, OperatingHours } from './types';
import {
  MapPin, Phone, Clock, Box, Shield, Save, X, Building2, Navigation, Target
} from 'lucide-react';
import { useToast } from '../../../../../shared/context/ToastContext';

interface LocationFormProps {
  initialData?: Location | null;
  onSave: (location: Location) => void;
  onCancel: () => void;
}

export const LocationForm: React.FC<LocationFormProps> = ({ initialData, onSave, onCancel }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'basic' | 'hours' | 'facilities' | 'geofence'>('basic');
  const [formData, setFormData] = useState<Location>(initialData || {
    ...INITIAL_LOCATION,
    id: `LOC-${Math.floor(Math.random() * 10000)}`,
    code: `LOC-${Math.floor(Math.random() * 10000)}`
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Required';
    if (!formData.address.city) newErrors.city = 'Required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onSave(formData);
  };

  const updateAddress = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const updateContact = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contact: { ...prev.contact, [field]: value }
    }));
  };

  const updateHours = (day: keyof Location['operatingHours'], field: keyof OperatingHours, value: string) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: { ...prev.operatingHours[day], [field]: value }
      }
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
            {initialData ? 'Edit Location' : 'Add New Location'}
          </h2>
          <p className="text-sm text-gray-500">Code: {formData.code}</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" /> Save Location
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <TabButton id="basic" label="Basic Details" icon={Building2} />
        <TabButton id="hours" label="Operating Hours" icon={Clock} />
        <TabButton id="facilities" label="Facilities" icon={Box} />
        <TabButton id="geofence" label="Geofence" icon={Target} />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        
        {/* BASIC TAB */}
        {activeTab === 'basic' && (
          <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Location Name"
                  required
                  value={formData.name}
                  onChange={(e) => { setFormData({...formData, name: e.target.value}); if (errors.name) setErrors(prev => ({ ...prev, name: '' })); }}
                  placeholder="e.g. Mumbai Central Hub"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select 
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 border"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                >
                  <option value="Hub">Hub</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Customer Site">Customer Site</option>
                  <option value="Rest Stop">Rest Stop</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-4 w-4 mr-2" /> Address
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input 
                    label="Street Address" 
                    value={formData.address.street}
                    onChange={(e) => updateAddress('street', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="City"
                    value={formData.address.city}
                    onChange={(e) => { updateAddress('city', e.target.value); if (errors.city) setErrors(prev => ({ ...prev, city: '' })); }}
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="State" 
                    value={formData.address.state}
                    onChange={(e) => updateAddress('state', e.target.value)}
                  />
                  <Input 
                    label="Pincode" 
                    value={formData.address.pincode}
                    onChange={(e) => updateAddress('pincode', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Latitude" 
                    type="number"
                    value={formData.address.coordinates.lat}
                    onChange={(e) => setFormData(prev => ({...prev, address: {...prev.address, coordinates: {...prev.address.coordinates, lat: Number(e.target.value)}} }))}
                  />
                  <Input 
                    label="Longitude" 
                    type="number"
                    value={formData.address.coordinates.lng}
                    onChange={(e) => setFormData(prev => ({...prev, address: {...prev.address, coordinates: {...prev.address.coordinates, lng: Number(e.target.value)}} }))}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                   <Button size="sm" variant="outline" type="button" onClick={() => showToast({ type: 'info', title: 'Location Fetched', message: 'Coordinates auto-filled from address.' })}>
                      <Navigation className="h-4 w-4 mr-2" /> Auto-Detect Coordinates
                   </Button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                <Phone className="h-4 w-4 mr-2" /> Primary Contact
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input 
                  label="Contact Person" 
                  value={formData.contact.person}
                  onChange={(e) => updateContact('person', e.target.value)}
                />
                <Input 
                  label="Phone" 
                  value={formData.contact.phone}
                  onChange={(e) => updateContact('phone', e.target.value)}
                />
                <Input 
                  label="Email" 
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) => updateContact('email', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* OPERATING HOURS */}
        {activeTab === 'hours' && (
          <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <h4 className="text-sm font-bold text-gray-900 mb-2">Weekly Schedule</h4>
            {['weekday', 'saturday', 'sunday'].map((day) => (
              <div key={day} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="font-medium text-gray-700 capitalize w-32">{day}</span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">Open</span>
                    <input 
                      type="time" 
                      className="border-gray-300 rounded-md text-sm shadow-sm focus:border-primary focus:ring-primary"
                      value={formData.operatingHours[day as keyof typeof formData.operatingHours].open}
                      onChange={(e) => updateHours(day as any, 'open', e.target.value)}
                    />
                  </div>
                  <span className="text-gray-400">-</span>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">Close</span>
                    <input 
                      type="time" 
                      className="border-gray-300 rounded-md text-sm shadow-sm focus:border-primary focus:ring-primary"
                      value={formData.operatingHours[day as keyof typeof formData.operatingHours].close}
                      onChange={(e) => updateHours(day as any, 'close', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FACILITIES */}
        {activeTab === 'facilities' && (
          <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Number of Loading Bays" 
                type="number"
                value={formData.facilities.loadingBays}
                onChange={(e) => setFormData(prev => ({...prev, facilities: {...prev.facilities, loadingBays: Number(e.target.value)}}))}
              />
              <Input 
                label="Parking Spaces (Trucks)" 
                type="number"
                value={formData.facilities.parkingSpaces}
                onChange={(e) => setFormData(prev => ({...prev, facilities: {...prev.facilities, parkingSpaces: Number(e.target.value)}}))}
              />
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-bold text-gray-900 mb-4">Amenities & Services</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'restrooms', label: 'Restrooms / Drivers Lounge' },
                  { key: 'fuel', label: 'Fuel Station' },
                  { key: 'mechanic', label: 'Mechanic / Workshop' },
                  { key: 'security', label: '24/7 Security' }
                ].map((item) => (
                  <label key={item.key} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 text-primary focus:ring-primary rounded"
                      checked={(formData.facilities as any)[item.key]}
                      onChange={(e) => setFormData(prev => ({...prev, facilities: {...prev.facilities, [item.key]: e.target.checked}}))}
                    />
                    <span className="ml-2 text-sm text-gray-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GEOFENCE */}
        {activeTab === 'geofence' && (
          <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-bold text-blue-900 mb-1 flex items-center">
                <Target className="h-4 w-4 mr-2" /> Geofence Configuration
              </h4>
              <p className="text-xs text-blue-700">
                Define a virtual perimeter for this location. Alerts will be triggered when vehicles enter or exit this area.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Radius: {formData.geofence.radius} meters
                </label>
                <input 
                  type="range" 
                  min="100" 
                  max="5000" 
                  step="100" 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  value={formData.geofence.radius}
                  onChange={(e) => setFormData(prev => ({...prev, geofence: {...prev.geofence, radius: Number(e.target.value)}}))}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>100m</span>
                  <span>5000m</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div>
                    <span className="block text-sm font-medium text-gray-900">Alert on Entry</span>
                    <span className="block text-xs text-gray-500">Trigger event when vehicle enters</span>
                  </div>
                  <input 
                    type="checkbox" 
                    className="h-5 w-5 text-primary focus:ring-primary rounded"
                    checked={formData.geofence.alertOnEntry}
                    onChange={(e) => setFormData(prev => ({...prev, geofence: {...prev.geofence, alertOnEntry: e.target.checked}}))}
                  />
                </label>
                <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div>
                    <span className="block text-sm font-medium text-gray-900">Alert on Exit</span>
                    <span className="block text-xs text-gray-500">Trigger event when vehicle leaves</span>
                  </div>
                  <input 
                    type="checkbox" 
                    className="h-5 w-5 text-primary focus:ring-primary rounded"
                    checked={formData.geofence.alertOnExit}
                    onChange={(e) => setFormData(prev => ({...prev, geofence: {...prev.geofence, alertOnExit: e.target.checked}}))}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

      </div>
    </Card>
  );
};
