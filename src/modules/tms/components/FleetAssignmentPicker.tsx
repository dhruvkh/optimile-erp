// ============================================================
// FleetAssignmentPicker — Vehicle + Driver selector that pulls
// from the Fleet Control module (active assets only).
// Used in PTL booking wizard and hub operations.
// ============================================================

import React from 'react';
import { Truck, User, Loader2 } from 'lucide-react';
import type { Vehicle, Driver } from '../../fleet-control/types';

export interface FleetPickerValue {
  vehicleId: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
}

interface Props {
  label?: string;
  vehicles: Vehicle[];
  drivers: Driver[];
  loading: boolean;
  value: FleetPickerValue;
  onChange: (value: FleetPickerValue) => void;
}

export const FleetAssignmentPicker: React.FC<Props> = ({
  label = 'Vehicle & Driver',
  vehicles,
  drivers,
  loading,
  value,
  onChange,
}) => {
  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.vehicle_id === vehicleId);
    if (!vehicle) {
      onChange({ vehicleId: '', vehiclePlate: '', driverId: value.driverId, driverName: value.driverName });
      return;
    }
    // Auto-fill driver if vehicle has an assigned driver
    const autoDriver = vehicle.assigned_driver_id
      ? drivers.find(d => d.driver_id === vehicle.assigned_driver_id)
      : undefined;
    onChange({
      vehicleId: vehicle.vehicle_id,
      vehiclePlate: vehicle.registration_number,
      driverId: autoDriver?.driver_id ?? value.driverId,
      driverName: autoDriver?.name ?? value.driverName,
    });
  };

  const handleDriverChange = (driverId: string) => {
    const driver = drivers.find(d => d.driver_id === driverId);
    onChange({
      ...value,
      driverId: driver?.driver_id ?? '',
      driverName: driver?.name ?? '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading fleet data…
      </div>
    );
  }

  return (
    <div>
      {label && <h4 className="text-sm font-semibold text-gray-700 mb-3">{label}</h4>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
            <Truck className="w-3 h-3" /> Vehicle
          </label>
          <select
            value={value.vehicleId}
            onChange={e => handleVehicleChange(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select vehicle</option>
            {vehicles.map(v => (
              <option key={v.vehicle_id} value={v.vehicle_id}>
                {v.registration_number} · {v.vehicle_type} · {v.capacity_tons}T
              </option>
            ))}
          </select>
          {value.vehiclePlate && (
            <p className="text-xs text-blue-600 mt-1">{value.vehiclePlate}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
            <User className="w-3 h-3" /> Driver
          </label>
          <select
            value={value.driverId}
            onChange={e => handleDriverChange(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select driver</option>
            {drivers.map(d => (
              <option key={d.driver_id} value={d.driver_id}>
                {d.name} · {d.phone}
              </option>
            ))}
          </select>
          {value.driverName && (
            <p className="text-xs text-blue-600 mt-1">{value.driverName}</p>
          )}
        </div>
      </div>
    </div>
  );
};
