import React from 'react';
import { useBooking } from '../../../context/BookingContext';
import { Input } from '../../ui/Input';
import { Truck, AlertTriangle, User, Calendar, Info } from 'lucide-react';
import { useOperationalData } from '../../../../../shared/context/OperationalDataContext';

export const BasicDetailsStep: React.FC = () => {
  const { data, updateData } = useBooking();
  const { clients } = useOperationalData();

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const client = clients.find(c => c.id === e.target.value);
    if (client) {
      updateData({ clientId: client.id, clientName: client.name, clientTier: 'Standard' as any });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

      {/* Booking Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Booking Type</label>
        <div className="grid grid-cols-2 gap-4">
          {['FTL', 'Spot'].map((type) => (
            <div
              key={type}
              onClick={() => updateData({ bookingType: type as any })}
              className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center transition-all ${data.bookingType === type
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-gray-200 hover:bg-gray-50'
                }`}
            >
              <Truck className={`h-6 w-6 mb-2 ${data.bookingType === type ? 'text-primary' : 'text-gray-400'}`} />
              <span className={`font-medium ${data.bookingType === type ? 'text-primary' : 'text-gray-600'}`}>{type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="h-4 w-4" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary border"
                value={data.clientId}
                onChange={handleClientChange}
              >
                <option value="">Select Client...</option>
                {clients.filter(c => c.status === 'Active').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {data.clientTier === 'Premium' && data.clientId && (
              <p className="text-xs text-yellow-600 mt-1 flex items-center">
                <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span> Premium Tier Client
              </p>
            )}
          </div>

          <Input
            label="Customer Reference No."
            placeholder="PO-2024-XXX"
            value={data.customerReference}
            onChange={(e) => updateData({ customerReference: e.target.value })}
            icon={<Info className="h-4 w-4 text-gray-400" />}
          />
          <p className="text-xs text-gray-500 mt-1">
            Your client's internal PO or order reference — used to cross-reference this booking with their system.
          </p>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Priority Level</label>
          <div className="space-y-3">
            {['Normal', 'High', 'Urgent'].map((p) => (
              <label key={p} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${data.priority === p
                  ? p === 'Urgent' ? 'border-red-500 bg-red-50' : p === 'High' ? 'border-orange-500 bg-orange-50' : 'border-primary bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
                }`}>
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="priority"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    checked={data.priority === p}
                    onChange={() => updateData({ priority: p as any })}
                  />
                  <span className="ml-3 font-medium text-gray-900">{p}</span>
                </div>
                {p === 'Urgent' && <AlertTriangle className="h-4 w-4 text-red-500" />}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Dates & Times */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
          <Calendar className="h-4 w-4 mr-2" /> Schedule
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pickup */}
          <div className="space-y-3">
            <Input
              label="Pickup Date"
              type="date"
              value={data.pickupDate}
              onChange={(e) => updateData({ pickupDate: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Window Start"
                type="time"
                value={data.pickupTimeStart}
                onChange={(e) => updateData({ pickupTimeStart: e.target.value })}
              />
              <Input
                label="Window End"
                type="time"
                value={data.pickupTimeEnd}
                onChange={(e) => updateData({ pickupTimeEnd: e.target.value })}
              />
            </div>
          </div>

          {/* Delivery */}
          <div className="space-y-3">
            <Input
              label="Delivery Date"
              type="date"
              value={data.deliveryDate}
              min={data.pickupDate}
              onChange={(e) => updateData({ deliveryDate: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Window Start"
                type="time"
                value={data.deliveryTimeStart}
                onChange={(e) => updateData({ deliveryTimeStart: e.target.value })}
              />
              <Input
                label="Window End"
                type="time"
                value={data.deliveryTimeEnd}
                onChange={(e) => updateData({ deliveryTimeEnd: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
