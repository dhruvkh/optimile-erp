
import React, { useState, useMemo } from 'react';
import { Truck, Star, CheckCircle, Building2, AlertCircle, Users } from 'lucide-react';
import { Card } from '../../ui/Card';
import { useOperationalData } from '../../../../../shared/context/OperationalDataContext';
import { useBooking } from '../../../context/BookingContext';
import { SharedVehicle } from '../../../../../shared/context/OperationalDataStore';

type FulfillmentType = 'own_vehicle' | 'contracted_vendor' | 'market_hire';

// Compute a 0-100 match score for an own-fleet vehicle
const computeScore = (vehicle: SharedVehicle, requiredTons: number): number => {
  // Capacity match (0-65 pts): ideally vehicle.capacity >= required
  const capacityScore = requiredTons > 0
    ? Math.min(65, (vehicle.capacity / requiredTons) * 65)
    : 50;
  // Ownership bonus (0-20 pts): owned > leased
  const ownerScore = vehicle.ownershipType === 'owned' ? 20 : vehicle.ownershipType === 'leased' ? 13 : 6;
  // Fleet health (0-15 pts): lower odometer = less wear
  const odometerScore = Math.max(0, 15 - Math.floor(vehicle.odometerKm / 15000));
  return Math.min(100, Math.round(capacityScore + ownerScore + odometerScore));
};

const TABS: { key: FulfillmentType; label: string }[] = [
  { key: 'own_vehicle',        label: 'Own Fleet'         },
  { key: 'contracted_vendor',  label: 'Contracted Vendor' },
  { key: 'market_hire',        label: 'Market Hire'       },
];

export const VehicleMatcher: React.FC = () => {
  const { vehicles, vendors } = useOperationalData();
  const { data, updateData } = useBooking();

  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('own_vehicle');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  // Required payload in tons
  const requiredTons = data.weight
    ? data.weightUnit === 'Ton' ? data.weight : data.weight / 1000
    : 0;

  // Available owned/leased fleet vehicles, scored and sorted best-first
  const scoredFleet = useMemo(() => (
    vehicles
      .filter(v => v.status === 'available' && v.ownershipType !== 'hired')
      .map(v => ({ ...v, score: computeScore(v, requiredTons) }))
      .sort((a, b) => b.score - a.score)
  ), [vehicles, requiredTons]);

  // Contracted trucking vendors (from AMS contracts)
  const contractedVendors = useMemo(() => (
    vendors.filter(v => v.hasContract && v.category === 'Trucking' && v.status === 'Active')
  ), [vendors]);

  // All active trucking vendors for spot market
  const marketVendors = useMemo(() => (
    vendors.filter(v => v.category === 'Trucking' && v.status === 'Active')
  ), [vendors]);

  const handleTabSwitch = (type: FulfillmentType) => {
    setFulfillmentType(type);
    setSelectedVehicleId(null);
    setSelectedVendorId(null);
    updateData({ tripType: type, selectedVehicleId: undefined, marketHireVendorId: undefined, marketHireVendorName: undefined });
  };

  const handleSelectVehicle = (vehicle: SharedVehicle & { score: number }) => {
    setSelectedVehicleId(vehicle.id);
    updateData({ tripType: 'own_vehicle', selectedVehicleId: vehicle.id });
  };

  const handleSelectVendor = (vendorId: string, vendorName: string, type: 'contracted_vendor' | 'market_hire') => {
    setSelectedVendorId(vendorId);
    updateData({ tripType: type, marketHireVendorId: vendorId, marketHireVendorName: vendorName, selectedVehicleId: undefined });
  };

  return (
    <Card title="Vehicle Sourcing">
      {/* Fulfillment type selector */}
      <div className="flex gap-1 mb-5 p-1 bg-gray-100 rounded-lg">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabSwitch(tab.key)}
            className={`flex-1 py-2 px-2 rounded-md text-xs font-semibold transition-all ${
              fulfillmentType === tab.key
                ? 'bg-white shadow text-primary border border-primary/20'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OWN FLEET ───────────────────────────── */}
      {fulfillmentType === 'own_vehicle' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            {scoredFleet.length > 0
              ? `${scoredFleet.length} fleet vehicle${scoredFleet.length !== 1 ? 's' : ''} available · sorted by match score`
              : 'No own / leased vehicles currently available'
            }
          </p>

          {scoredFleet.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">All fleet vehicles are in transit</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Switch to Contracted Vendor or Market Hire to fulfil this booking.
                </p>
              </div>
            </div>
          ) : (
            scoredFleet.map((vehicle, index) => (
              <div
                key={vehicle.id}
                onClick={() => handleSelectVehicle(vehicle)}
                className={`border rounded-lg p-4 cursor-pointer transition-all relative overflow-hidden ${
                  selectedVehicleId === vehicle.id
                    ? 'border-primary ring-1 ring-primary bg-blue-50/20 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                {index === 0 && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                    BEST MATCH
                  </div>
                )}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-gray-100 rounded-lg mt-0.5">
                      <Truck className="h-5 w-5 text-gray-700" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900">{vehicle.regNumber}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          vehicle.ownershipType === 'owned'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-violet-100 text-violet-700'
                        }`}>
                          {vehicle.ownershipType.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{vehicle.model} · {vehicle.type}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                          {vehicle.capacity}T capacity
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                          {vehicle.driverName}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                          {Math.round(vehicle.odometerKm / 1000)}k km
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-2xl font-bold tabular-nums ${
                      vehicle.score >= 80 ? 'text-green-600'
                      : vehicle.score >= 60 ? 'text-amber-600'
                      : 'text-red-500'
                    }`}>
                      {vehicle.score}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">score</div>
                    {selectedVehicleId === vehicle.id && (
                      <div className="mt-2 flex items-center gap-1 text-green-600 text-xs font-semibold">
                        <CheckCircle className="h-4 w-4" /> Selected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── CONTRACTED VENDOR ───────────────────── */}
      {fulfillmentType === 'contracted_vendor' && (
        <div className="space-y-3">
          {contractedVendors.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                No contracted trucking vendors found. Set up contracts in the AMS module.
              </p>
            </div>
          ) : (
            contractedVendors.map(vendor => (
              <div
                key={vendor.id}
                onClick={() => handleSelectVendor(vendor.id, vendor.name, 'contracted_vendor')}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedVendorId === vendor.id
                    ? 'border-primary ring-1 ring-primary bg-blue-50/20 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <Building2 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{vendor.name}</p>
                      <p className="text-xs text-gray-500">{vendor.code} · {vendor.contractTerms}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-500 justify-end">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-semibold text-gray-800 text-sm">{vendor.rating}</span>
                    </div>
                    <p className="text-xs text-gray-500">{vendor.paymentTerms}d terms</p>
                    {selectedVendorId === vendor.id && (
                      <div className="mt-1 flex items-center gap-1 text-green-600 text-xs font-semibold">
                        <CheckCircle className="h-3 w-3" /> Selected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs text-blue-700">
              Vehicle details will be provided by the vendor after order placement.
              The trip will show <strong>Pending Assignment</strong> until the vendor confirms the vehicle.
            </p>
          </div>
        </div>
      )}

      {/* ── MARKET HIRE ─────────────────────────── */}
      {fulfillmentType === 'market_hire' && (
        <div className="space-y-3">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Vehicle sourced from open market</p>
              <p className="text-xs text-amber-700 mt-1">
                No vehicle is assigned at booking. Operations will source a vehicle from the market
                after this booking is confirmed. Trip status will be{' '}
                <strong>Pending Assignment</strong> until a vendor provides vehicle details.
              </p>
            </div>
          </div>

          <p className="text-sm font-medium text-gray-700">
            Pre-select a vendor{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </p>

          {marketVendors.map(vendor => (
            <div
              key={vendor.id}
              onClick={() => handleSelectVendor(vendor.id, vendor.name, 'market_hire')}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedVendorId === vendor.id
                  ? 'border-amber-500 ring-1 ring-amber-400 bg-amber-50/30 shadow-md'
                  : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Users className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{vendor.name}</p>
                    <p className="text-xs text-gray-500">{vendor.code} · {vendor.address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-500 justify-end">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-semibold text-gray-800 text-sm">{vendor.rating}</span>
                  </div>
                  {!vendor.hasContract && (
                    <p className="text-[10px] text-gray-400">Spot</p>
                  )}
                  {selectedVendorId === vendor.id && (
                    <div className="mt-1 flex items-center gap-1 text-amber-600 text-xs font-semibold">
                      <CheckCircle className="h-3 w-3" /> Selected
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-500">
              Skip vendor selection — operations will source any available market vehicle after booking is placed.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
