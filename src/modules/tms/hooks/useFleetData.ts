// ============================================================
// useFleetData — loads active vehicles and drivers from the
// Fleet Control module for use in PTL fleet assignment.
// ============================================================

import { useEffect, useState } from 'react';
import { VehicleAPI, DriverAPI } from '../../fleet-control/services/mockDatabase';
import type { Vehicle, Driver } from '../../fleet-control/types';
import { VehicleStatus, DriverStatus } from '../../fleet-control/types';

export interface FleetData {
  vehicles: Vehicle[];
  drivers: Driver[];
  loading: boolean;
}

export function useFleetData(): FleetData {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([VehicleAPI.getAll(), DriverAPI.getAll()]).then(([v, d]) => {
      setVehicles(v.filter(x => x.status === VehicleStatus.ACTIVE));
      setDrivers(d.filter(x => x.status === DriverStatus.ACTIVE));
      setLoading(false);
    });
  }, []);

  return { vehicles, drivers, loading };
}
