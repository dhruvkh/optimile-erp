import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trip, TripStatus, Vehicle, Driver, VehicleStatus, DriverStatus } from '../types';
import { TripAPI, VehicleAPI, DriverAPI, ConfidenceAPI } from '../services/mockDatabase';
import { TyreAPI } from '../services/tyreDatabase';
import { Button, Input, Select, Badge, Modal } from '../components/UI';
import { IconPlus, IconSearch, IconEdit, IconArrowRight, IconShieldExclamation } from '../components/Icons';
import { TripDetailsPage } from './TripDetailsPage';

export const DispatchPage: React.FC = () => {
  const navigate = useNavigate();

  // Navigation State
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Data State
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicleTyreHealth, setVehicleTyreHealth] = useState<Record<string, 'Healthy' | 'Warning' | 'Critical'>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  // Guardrail State
  const [guardrailWarnings, setGuardrailWarnings] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    booking_reference: '',
    origin: '',
    destination: '',
    scheduled_start_time: '',
    vehicle_id: '',
    driver_id: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedTripId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tData, vData, dData] = await Promise.all([
        TripAPI.getAll(),
        VehicleAPI.getAll(),
        DriverAPI.getAll()
      ]);
      setTrips(tData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setVehicles(vData);
      setDrivers(dData);

      // Fetch tyre health for all vehicles
      if (vData.length > 0) {
        const vehicleIds = vData.map(v => v.vehicle_id);
        const healthMap = await TyreAPI.getBulkTyreHealth(vehicleIds);
        setVehicleTyreHealth(healthMap);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Operational Guardrails Check
  const checkGuardrails = async (vehicleId: string, driverId: string) => {
      const warnings: string[] = [];

      if (vehicleId) {
          const confidence = await ConfidenceAPI.getVehicleConfidence(vehicleId);
          if (confidence.score === 'Low') {
              warnings.push(`Warning: Selected vehicle has LOW data confidence. Missing signals: ${confidence.details.join(', ')}.`);
          }
          const vehicle = vehicles.find(v => v.vehicle_id === vehicleId);
          if (vehicle?.status === VehicleStatus.MAINTENANCE) {
              warnings.push("Critical: Vehicle is marked for Maintenance.");
          }

          // NEW: Tyre Health Check
          try {
              const tyreHealth = await TyreAPI.getTyreHealth(vehicleId);

              if (tyreHealth.overall === 'Critical') {
                  warnings.push(`🔴 CRITICAL: Vehicle has ${tyreHealth.criticalCount} tyre(s) requiring immediate attention. ${tyreHealth.warnings.join(', ')}. [View Tyre Status →]`);
              } else if (tyreHealth.overall === 'Warning') {
                  warnings.push(`🟡 Warning: Vehicle has ${tyreHealth.criticalCount} tyre issue(s). ${tyreHealth.warnings.join(', ')}. [Check Tyre Status →]`);
              }
          } catch (error) {
              console.error('Failed to check tyre health:', error);
          }
      }

      if (driverId) {
          const driver = drivers.find(d => d.driver_id === driverId);
          if (driver?.status !== DriverStatus.ACTIVE) {
              warnings.push(`Warning: Driver status is ${driver?.status}.`);
          }
      }

      setGuardrailWarnings(warnings);
  };

  useEffect(() => {
      if (isModalOpen) {
          checkGuardrails(formData.vehicle_id, formData.driver_id);
      }
  }, [formData.vehicle_id, formData.driver_id]);

  const handleOpenModal = (trip?: Trip) => {
    setGuardrailWarnings([]);
    if (trip) {
      setEditingTrip(trip);
      setFormData({
        booking_reference: trip.booking_reference,
        origin: trip.origin,
        destination: trip.destination,
        scheduled_start_time: trip.scheduled_start_time.slice(0, 16),
        vehicle_id: trip.vehicle_id || '',
        driver_id: trip.driver_id || ''
      });
    } else {
      setEditingTrip(null);
      setFormData({
        booking_reference: `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        origin: '',
        destination: '',
        scheduled_start_time: '',
        vehicle_id: '',
        driver_id: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Guardrail Confirmation
    if (guardrailWarnings.length > 0) {
        if (!window.confirm("Operational Warnings detected. Are you sure you want to proceed with this assignment?")) {
            return;
        }
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        booking_reference: formData.booking_reference,
        origin: formData.origin,
        destination: formData.destination,
        scheduled_start_time: new Date(formData.scheduled_start_time).toISOString(),
        vehicle_id: formData.vehicle_id || null,
        driver_id: formData.driver_id || null,
        status: editingTrip ? editingTrip.status : TripStatus.PLANNED
      };

      if (editingTrip) {
        await TripAPI.update(editingTrip.trip_id, payload);
      } else {
        await TripAPI.create(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert("Error saving trip");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatch = async (trip: Trip) => {
    if (!trip.vehicle_id || !trip.driver_id) {
        alert("Please assign a vehicle and driver before dispatching.");
        handleOpenModal(trip);
        return;
    }
    
    // Quick guardrail check before dispatch
    const confidence = await ConfidenceAPI.getVehicleConfidence(trip.vehicle_id);
    if (confidence.score === 'Low') {
        if (!window.confirm("Vehicle has LOW confidence score. Proceed with dispatch?")) return;
    }

    if (window.confirm(`Ready to dispatch trip ${trip.booking_reference}?`)) {
        await TripAPI.update(trip.trip_id, { status: TripStatus.DISPATCHED });
        fetchData();
    }
  };

  const filteredTrips = trips.filter(t => {
    const matchesSearch = t.booking_reference.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus ? t.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: TripStatus) => {
    switch(status) {
      case TripStatus.PLANNED: return 'blue';
      case TripStatus.DISPATCHED: return 'yellow';
      case TripStatus.IN_TRANSIT: return 'green';
      case TripStatus.COMPLETED: return 'gray';
      default: return 'gray';
    }
  };

  const getName = (id: string | null, list: any[], key: string) => {
      if (!id) return '-';
      return list.find(i => i[key === 'vehicle' ? 'vehicle_id' : 'driver_id'] === id)?.[key === 'vehicle' ? 'registration_number' : 'name'] || 'Unknown';
  };

  if (selectedTripId) {
      return <TripDetailsPage tripId={selectedTripId} onBack={() => setSelectedTripId(null)} />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Dispatch Console</h1>
        <Button onClick={() => handleOpenModal()}>
          <IconPlus className="w-5 h-5 mr-2" />
          Create Trip
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IconSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Search Reference, Origin, or Destination"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {Object.values(TripStatus).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading dispatch data...</div>
        ) : filteredTrips.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No trips found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle / Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTrips.map((trip) => (
                  <tr key={trip.trip_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{trip.booking_reference}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{trip.origin}</div>
                        <div className="text-xs text-gray-500 flex items-center">
                            <IconArrowRight className="w-3 h-3 mr-1" />
                            {trip.destination}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(trip.scheduled_start_time).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                            <span>{getName(trip.vehicle_id, vehicles, 'vehicle')}</span>
                            <span className="text-xs text-gray-400">{getName(trip.driver_id, drivers, 'driver')}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge color={getStatusColor(trip.status)}>{trip.status}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                            {trip.status === TripStatus.PLANNED && (
                                <button onClick={() => handleDispatch(trip)} className="text-yellow-600 hover:text-yellow-900 bg-yellow-50 px-2 py-1 rounded text-xs">
                                    Dispatch
                                </button>
                            )}
                            <button onClick={() => handleOpenModal(trip)} className="text-gray-400 hover:text-gray-600">
                                <IconEdit className="w-4 h-4" />
                            </button>
                             <button onClick={() => setSelectedTripId(trip.trip_id)} className="text-primary-600 hover:text-primary-900 bg-primary-50 px-2 py-1 rounded text-xs flex items-center">
                                View
                                <IconArrowRight className="w-3 h-3 ml-1" />
                            </button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTrip ? "Edit Trip / Assign" : "Create New Trip"}>
        <form onSubmit={handleSubmit}>
          {guardrailWarnings.length > 0 && (
              <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                      <div className="flex-shrink-0">
                          <IconShieldExclamation className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">Operational Guardrails Active</h3>
                          <div className="mt-2 text-sm text-yellow-700">
                              <ul className="list-disc list-inside space-y-1">
                                  {guardrailWarnings.map((w, i) => <li key={i}>{w}</li>)}
                              </ul>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          <Input 
            label="Booking Reference" 
            value={formData.booking_reference}
            onChange={e => setFormData({...formData, booking_reference: e.target.value})}
            required
            placeholder="e.g. BK-2023-999"
          />
          <Input 
            label="Origin" 
            value={formData.origin}
            onChange={e => setFormData({...formData, origin: e.target.value})}
            required
            placeholder="e.g. Bhiwandi, Mumbai"
          />
          <Input 
            label="Destination" 
            value={formData.destination}
            onChange={e => setFormData({...formData, destination: e.target.value})}
            required
            placeholder="e.g. Electronic City, Bangalore"
          />
          <Input 
            label="Scheduled Start Time" 
            type="datetime-local"
            value={formData.scheduled_start_time}
            onChange={e => setFormData({...formData, scheduled_start_time: e.target.value})}
            required
          />
          
          <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Resource Assignment (Optional)</h4>
              <Select
                label="Vehicle"
                options={[
                  { label: 'Unassigned', value: '' },
                  ...vehicles
                    .filter(v => v.status === VehicleStatus.ACTIVE)
                    .map(v => {
                      const health = vehicleTyreHealth[v.vehicle_id];
                      const healthIcon = health === 'Critical' ? '🔴' : health === 'Warning' ? '🟡' : '🟢';
                      return {
                        label: `${healthIcon} ${v.registration_number} (${v.vehicle_type})`,
                        value: v.vehicle_id
                      };
                    })
                ]}
                value={formData.vehicle_id}
                onChange={e => setFormData({...formData, vehicle_id: e.target.value})}
              />
              <Select 
                label="Driver"
                options={[
                  { label: 'Unassigned', value: '' },
                  ...drivers
                    .filter(d => d.status === DriverStatus.ACTIVE)
                    .map(d => ({ label: d.name, value: d.driver_id }))
                ]}
                value={formData.driver_id}
                onChange={e => setFormData({...formData, driver_id: e.target.value})}
              />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting} variant={guardrailWarnings.length > 0 ? "danger" : "primary"}>
                {guardrailWarnings.length > 0 ? 'Accept Risk & Save' : editingTrip ? 'Update Trip' : 'Create Trip'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};