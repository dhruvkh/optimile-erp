import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import {
  Search, Filter, Truck, MapPin, Phone, Star,
  CheckCircle, Calendar, Navigation, Info, ChevronRight,
} from 'lucide-react';
import { useOperationalData } from '../../../../../shared/context/OperationalDataContext';
import { SharedVehicle } from '../../../../../shared/context/OperationalDataStore';

export const VehicleAssignment: React.FC = () => {
  const navigate = useNavigate();
  const { completedTrips, vehicles, assignVehicle } = useOperationalData();

  // Trips waiting for a vehicle (status === 'booked')
  const pendingBookings = completedTrips.filter(t => t.status === 'booked');

  // Vehicles that are currently available
  const availableVehicles = vehicles.filter(v => v.status === 'available');

  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignDone, setAssignDone] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-select the first pending booking whenever the list changes
  useEffect(() => {
    if (pendingBookings.length > 0 && !selectedBookingId) {
      setSelectedBookingId(pendingBookings[0].id);
    }
  }, [pendingBookings.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedTrip = completedTrips.find(t => t.id === selectedBookingId);
  const vehicleToAssign = vehicles.find(v => v.id === selectedVehicleId);
  const topSuggestion = availableVehicles[0] ?? null;

  const handleOpenAssignModal = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setShowAssignModal(true);
    setAssignDone(false);
  };

  const handleConfirmAssignment = () => {
    if (selectedBookingId && selectedVehicleId) {
      assignVehicle(selectedBookingId, selectedVehicleId);
      setShowAssignModal(false);
      setAssignDone(true);
    }
  };

  const filteredVehicles = availableVehicles.filter(v =>
    v.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.driverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Empty state ────────────────────────────────────────────
  if (pendingBookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <Truck className="h-16 w-16 mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-600 mb-1">No Bookings Pending Assignment</h3>
        <p className="text-sm mb-6">Create a new FTL booking first, then assign a vehicle here.</p>
        <Button onClick={() => navigate('/tms/bookings')}>
          Go to Bookings
        </Button>
      </div>
    );
  }

  // ── Success banner ─────────────────────────────────────────
  const SuccessBanner = assignDone ? (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 mb-4">
      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-bold text-green-800">Vehicle Assigned Successfully</p>
        <p className="text-sm text-green-700 mt-0.5">
          {vehicleToAssign?.regNumber ?? 'Vehicle'} has been assigned to{' '}
          {selectedTrip?.clientName} ({selectedTrip?.origin} → {selectedTrip?.destination}).
          The trip is now active in Operations.
        </p>
        <button
          className="text-sm font-medium text-green-700 underline mt-1"
          onClick={() => navigate('/tms/operations')}
        >
          View in Operations →
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {SuccessBanner}

      {/* Top Bar: Booking Selector */}
      <Card className="p-4 bg-white border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="w-full md:w-1/2">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Assigning Vehicle For:
            </label>
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              value={selectedBookingId}
              onChange={e => { setSelectedBookingId(e.target.value); setAssignDone(false); }}
            >
              {pendingBookings.map(t => (
                <option key={t.id} value={t.id}>
                  {t.id} • {t.clientName} • {t.origin} → {t.destination}
                </option>
              ))}
            </select>
          </div>
          {selectedTrip && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                {selectedTrip.bookedDate}
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                {selectedTrip.distanceKm} km
              </div>
              {selectedTrip.revenueAmount > 0 && (
                <div className="font-bold text-gray-900">
                  ₹ {selectedTrip.revenueAmount.toLocaleString('en-IN')}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Vehicle List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="bg-white" onClick={() => window.alert('Type filter options loading...')}>
                <Filter className="h-3 w-3 mr-1" /> Type
              </Button>
              <Button variant="outline" size="sm" className="bg-white" onClick={() => window.alert('Location map selector opening...')}>
                <MapPin className="h-3 w-3 mr-1" /> Location
              </Button>
            </div>
            <div className="w-full md:w-64">
              <Input
                placeholder="Search vehicle or driver..."
                icon={<Search className="h-3 w-3" />}
                className="h-8 text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm((e.target as HTMLInputElement).value)}
              />
            </div>
          </div>

          {filteredVehicles.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-400">
              <Truck className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium">No available vehicles found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVehicles.map((vehicle, idx) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  matchScore={idx === 0 ? 95 : idx === 1 ? 78 : 55}
                  onAssign={() => handleOpenAssignModal(vehicle.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: AI Suggestion */}
        <div className="lg:col-span-1 space-y-6">
          {topSuggestion ? (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Truck className="h-24 w-24 text-primary" />
              </div>
              <div className="flex items-center mb-4">
                <div className="p-1.5 bg-indigo-100 rounded-lg mr-2">
                  <Star className="h-5 w-5 text-indigo-600 fill-current" />
                </div>
                <h3 className="font-bold text-indigo-900">Top Recommendation</h3>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-indigo-100 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold text-gray-900">{topSuggestion.regNumber}</span>
                  <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    95% Match
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-3">{topSuggestion.model} • {topSuggestion.type}</p>
                <div className="space-y-1.5">
                  {[
                    'Currently available',
                    topSuggestion.driverName ? `Driver: ${topSuggestion.driverName}` : 'Driver assigned',
                    `Odometer: ${topSuggestion.odometerKm.toLocaleString('en-IN')} km`,
                    `Ownership: ${topSuggestion.ownershipType}`,
                  ].map((reason, i) => (
                    <div key={i} className="flex items-start text-xs text-gray-600">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {reason}
                    </div>
                  ))}
                </div>
              </div>
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={() => handleOpenAssignModal(topSuggestion.id)}
              >
                Accept Recommendation
              </Button>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center text-gray-400">
              <Truck className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium">No available vehicles</p>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Confirmation Modal */}
      {showAssignModal && vehicleToAssign && selectedTrip && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowAssignModal(false)}
            />
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Confirm Vehicle Assignment
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm">
                  <div className="grid grid-cols-2 gap-y-2">
                    <div className="text-gray-500">Trip:</div>
                    <div className="font-medium col-span-1">
                      <select
                        className="block w-full border-gray-300 rounded focus:ring-primary focus:border-primary text-sm py-1"
                        value={selectedBookingId}
                        onChange={e => setSelectedBookingId(e.target.value)}
                      >
                        {pendingBookings.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.id} • {t.clientName} • {t.origin} → {t.destination}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-gray-500">Client:</div>
                    <div className="font-medium">{selectedTrip.clientName}</div>
                    <div className="text-gray-500">Route:</div>
                    <div className="font-medium">{selectedTrip.origin} → {selectedTrip.destination}</div>
                    <div className="text-gray-500">Vehicle:</div>
                    <div className="font-medium text-primary">{vehicleToAssign.regNumber}</div>
                    <div className="text-gray-500">Model:</div>
                    <div className="font-medium">{vehicleToAssign.model}</div>
                    <div className="text-gray-500">Driver:</div>
                    <div className="font-medium">{vehicleToAssign.driverName || 'TBD'}</div>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary" defaultChecked />
                    <span className="text-sm text-gray-700">Send notification to driver</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary" defaultChecked />
                    <span className="text-sm text-gray-700">Send confirmation to client</span>
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Driver Notes</label>
                  <textarea
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm p-2 border"
                    rows={2}
                    placeholder="Enter any specific instructions for the driver..."
                  />
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button onClick={handleConfirmAssignment} className="w-full sm:w-auto sm:ml-3">
                  Confirm Assignment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAssignModal(false)}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Vehicle Card sub-component ─────────────────────────────────────────────

interface VehicleCardProps {
  vehicle: SharedVehicle;
  matchScore: number;
  onAssign: () => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, matchScore, onAssign }) => {
  const isAvailable = vehicle.status === 'available';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative overflow-hidden">
      {matchScore >= 80 && (
        <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
          {matchScore}% MATCH
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className={`p-3 rounded-lg ${isAvailable ? 'bg-blue-50 text-primary' : 'bg-gray-100 text-gray-400'}`}>
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center">
              <h4 className="text-lg font-bold text-gray-900 mr-2">{vehicle.regNumber}</h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isAvailable ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                {vehicle.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">{vehicle.model} • {vehicle.type}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                {vehicle.ownershipType}
              </span>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                GPS
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between items-end min-w-[140px]">
          <div className="text-right text-sm text-gray-500">
            {vehicle.odometerKm.toLocaleString('en-IN')} km odometer
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => window.alert(`Opening detailed profile and history for vehicle ${vehicle.regNumber}`)}>Details</Button>
            <Button size="sm" disabled={!isAvailable} onClick={onAssign}>
              Assign
            </Button>
          </div>
        </div>
      </div>
      {/* Driver Info Footer */}
      {vehicle.driverName && (
        <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center">
            <span className="font-medium text-gray-900 mr-2">{vehicle.driverName}</span>
            <span className="flex items-center bg-yellow-50 text-yellow-700 px-1 rounded border border-yellow-100">
              4.5 <Star className="h-2 w-2 ml-0.5 fill-current" />
            </span>
          </div>
          {vehicle.driverPhone && (
            <div className="flex items-center text-gray-400">
              <Phone className="h-3 w-3 mr-1" /> {vehicle.driverPhone}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
