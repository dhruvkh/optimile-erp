import React, { useState, useMemo } from 'react';
import { Package, Truck, Users, TrendingUp, CheckCircle, AlertTriangle, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../../../../shared/context/ToastContext';

/**
 * PTL Opportunities Panel
 *
 * User-Friendly PTL Flow:
 * 1. Shows PTL bookings awaiting consolidation (from booking system)
 * 2. Auto-groups by route/hub
 * 3. Suggests optimal vehicle
 * 4. One-click consolidation → Creates trip with multi-party tracking
 *
 * PTL Complete Flow:
 * First Mile (Multi-party pickup) → Hub Consolidation → Inter-Hub FTL → Last Mile (Multi-destination delivery)
 */

interface PTLShipment {
  bookingId: string;
  clientName: string;
  route: string;
  pickupLocation: string;  // Specific pickup address for first mile
  deliveryLocation: string;  // Specific delivery address for last mile
  weight: number;
  volume: number;
  pickupDate: string;
  priority: 'Normal' | 'Urgent' | 'Critical';
}

const MOCK_PTL_BOOKINGS: PTLShipment[] = [
  { bookingId: 'BK-2024-101', clientName: 'Reliance Retail', route: 'Mumbai → Delhi', pickupLocation: 'Reliance DC, Turbhe, Navi Mumbai', deliveryLocation: 'Reliance Store, Connaught Place, Delhi', weight: 1200, volume: 4.5, pickupDate: '2026-02-17', priority: 'Urgent' },
  { bookingId: 'BK-2024-102', clientName: 'Tata Consumer', route: 'Mumbai → Delhi', pickupLocation: 'Tata Warehouse, Bhiwandi, Mumbai', deliveryLocation: 'Tata DC, Okhla, New Delhi', weight: 2500, volume: 8, pickupDate: '2026-02-17', priority: 'Normal' },
  { bookingId: 'BK-2024-103', clientName: 'Flipkart', route: 'Mumbai → Delhi', pickupLocation: 'Flipkart FC, Bhiwandi, Mumbai', deliveryLocation: 'Flipkart DC, Manesar, Gurgaon', weight: 1800, volume: 6.5, pickupDate: '2026-02-17', priority: 'Critical' },
  { bookingId: 'BK-2024-104', clientName: 'Amazon', route: 'Bangalore → Chennai', pickupLocation: 'Amazon FC, Whitefield, Bangalore', deliveryLocation: 'Amazon DC, Sriperumbudur, Chennai', weight: 3200, volume: 11, pickupDate: '2026-02-17', priority: 'Urgent' },
];

interface PTLOpportunity {
  route: string;
  originHub: string;
  destinationHub: string;
  shipments: PTLShipment[];
  totalWeight: number;
  totalVolume: number;
  suggestedVehicle: string;
  utilizationPercent: number;
  estimatedCost: number;
  savingsVsFTL: number;
  // PTL Flow Details
  firstMilePickups: string[];  // List of pickup locations (first mile)
  lastMileDeliveries: string[];  // List of delivery locations (last mile)
  pickupCount: number;
  deliveryCount: number;
}


export const PTLOpportunitiesPanel: React.FC<{ onConsolidate?: (opportunity: PTLOpportunity) => void }> = ({
  onConsolidate
}) => {
  const { showToast } = useToast();
  const [ptlBookings, setPTLBookings] = useState<PTLShipment[]>(MOCK_PTL_BOOKINGS);
  const [expanded, setExpanded] = useState(true);

  // Auto-group bookings by route
  const opportunities: PTLOpportunity[] = useMemo(() => {
    const grouped: Record<string, PTLShipment[]> = {};

    ptlBookings.forEach(booking => {
      if (!grouped[booking.route]) {
        grouped[booking.route] = [];
      }
      grouped[booking.route].push(booking);
    });

    return Object.entries(grouped).map(([route, shipments]) => {
      const totalWeight = shipments.reduce((sum, s) => sum + s.weight, 0);
      const totalVolume = shipments.reduce((sum, s) => sum + s.volume, 0);

      // Extract first-mile pickups and last-mile deliveries
      const firstMilePickups = shipments.map(s => s.pickupLocation);
      const lastMileDeliveries = shipments.map(s => s.deliveryLocation);

      // Extract hubs from route
      const [originHub, destinationHub] = route.split(' → ');

      // Smart vehicle suggestion
      let suggestedVehicle = '10W Pickup';
      let capacity = 1500;

      if (totalWeight > 10000 || totalVolume > 25) {
        suggestedVehicle = '32W Multi-Axle';
        capacity = 16000;
      } else if (totalWeight > 5000 || totalVolume > 15) {
        suggestedVehicle = '19W/22W';
        capacity = 7000;
      } else if (totalWeight > 2500 || totalVolume > 10) {
        suggestedVehicle = '14W/17W';
        capacity = 3500;
      }

      const utilization = Math.min((totalWeight / capacity) * 100, 100);
      const estimatedCost = Math.round(totalWeight * 0.8 + totalVolume * 120);
      const savingsVsFTL = Math.round(estimatedCost * 0.35); // ~35% savings vs individual FTL

      return {
        route,
        originHub,
        destinationHub,
        shipments,
        totalWeight,
        totalVolume,
        suggestedVehicle,
        utilizationPercent: utilization,
        estimatedCost,
        savingsVsFTL,
        firstMilePickups,
        lastMileDeliveries,
        pickupCount: firstMilePickups.length,
        deliveryCount: lastMileDeliveries.length
      };
    });
  }, [ptlBookings]);

  const handleConsolidate = (opportunity: PTLOpportunity) => {
    // Remove consolidated shipments from the pending list
    const consolidatedIds = new Set(opportunity.shipments.map(s => s.bookingId));
    setPTLBookings(prev => prev.filter(b => !consolidatedIds.has(b.bookingId)));

    // Notify parent (creates trip in Operations)
    if (onConsolidate) {
      onConsolidate(opportunity);
    }

    showToast({
      type: 'success',
      title: 'PTL Consolidated',
      message: `${opportunity.shipments.length} shipments grouped on ${opportunity.route} via ${opportunity.suggestedVehicle} (${opportunity.utilizationPercent.toFixed(1)}% utilization). Savings: ₹${opportunity.savingsVsFTL.toLocaleString('en-IN')}.`
    });
  };

  if (opportunities.length === 0) {
    return null; // Hide panel if no PTL opportunities
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-6 shadow-lg animate-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 p-3 rounded-xl">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-purple-900 uppercase tracking-tight">
              PTL Consolidation Opportunities
            </h3>
            <p className="text-xs text-purple-600 font-medium">
              Smart load grouping • Save costs • Multi-party tracking
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-purple-600 hover:text-purple-800 text-sm font-bold"
        >
          {expanded ? 'Collapse ▲' : `Expand (${opportunities.length} opportunities) ▼`}
        </button>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {opportunities.map((opp, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border-2 border-purple-200 p-5 hover:shadow-xl transition-all"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-black text-lg text-slate-900">{opp.route}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    <Users className="h-3 w-3 inline mr-1" />
                    {opp.shipments.length} parties • {opp.shipments.length} shipments
                  </p>
                </div>
                <div className="bg-green-100 px-3 py-1 rounded-full">
                  <p className="text-xs font-black text-green-700">
                    {opp.utilizationPercent.toFixed(0)}% Utilization
                  </p>
                </div>
              </div>

              {/* PTL Flow Visualization */}
              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-lg p-4 mb-4 border-2 border-indigo-200">
                <p className="text-[10px] font-black text-indigo-900 uppercase mb-3">Complete PTL Flow</p>
                <div className="flex items-center justify-between text-[10px]">
                  {/* First Mile */}
                  <div className="flex flex-col items-center flex-1">
                    <div className="bg-blue-600 p-2 rounded-lg mb-1">
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                    <p className="font-black text-blue-900">First Mile</p>
                    <p className="text-blue-700 font-medium">{opp.pickupCount} Pickups</p>
                  </div>

                  <ArrowRight className="h-4 w-4 text-indigo-400 flex-shrink-0 mx-1" />

                  {/* Hub Consolidation */}
                  <div className="flex flex-col items-center flex-1">
                    <div className="bg-purple-600 p-2 rounded-lg mb-1">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                    <p className="font-black text-purple-900">Consolidate</p>
                    <p className="text-purple-700 font-medium">{opp.originHub}</p>
                  </div>

                  <ArrowRight className="h-4 w-4 text-indigo-400 flex-shrink-0 mx-1" />

                  {/* Inter-Hub FTL */}
                  <div className="flex flex-col items-center flex-1">
                    <div className="bg-orange-600 p-2 rounded-lg mb-1">
                      <Truck className="h-4 w-4 text-white" />
                    </div>
                    <p className="font-black text-orange-900">Inter-Hub</p>
                    <p className="text-orange-700 font-medium">FTL</p>
                  </div>

                  <ArrowRight className="h-4 w-4 text-indigo-400 flex-shrink-0 mx-1" />

                  {/* Last Mile */}
                  <div className="flex flex-col items-center flex-1">
                    <div className="bg-green-600 p-2 rounded-lg mb-1">
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                    <p className="font-black text-green-900">Last Mile</p>
                    <p className="text-green-700 font-medium">{opp.deliveryCount} Drops</p>
                  </div>
                </div>
              </div>

              {/* First Mile & Last Mile Details */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* First Mile Pickups */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-[10px] font-black text-blue-900 uppercase mb-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> First Mile Pickups
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {opp.firstMilePickups.map((pickup, idx) => (
                      <div key={idx} className="text-[10px] text-blue-800 font-medium leading-tight">
                        {idx + 1}. {pickup}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Last Mile Deliveries */}
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-[10px] font-black text-green-900 uppercase mb-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Last Mile Deliveries
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {opp.lastMileDeliveries.map((delivery, idx) => (
                      <div key={idx} className="text-[10px] text-green-800 font-medium leading-tight">
                        {idx + 1}. {delivery}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clients List */}
              <div className="bg-slate-50 rounded-lg p-3 mb-4">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Clients:</p>
                <div className="space-y-1">
                  {opp.shipments.map((shipment, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{shipment.clientName}</span>
                      <span className="text-slate-500">{shipment.weight}kg</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vehicle Suggestion */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-blue-900 uppercase">Suggested Vehicle</p>
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-xl font-black text-blue-900 mb-2">{opp.suggestedVehicle}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-blue-600 font-medium">Load</p>
                    <p className="text-blue-900 font-bold">
                      {opp.totalWeight}kg / {opp.totalVolume}m³
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-600 font-medium">Est. Cost</p>
                    <p className="text-blue-900 font-bold">
                      ₹{opp.estimatedCost.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Savings Highlight */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-green-700 uppercase">Savings vs Individual FTL</p>
                    <p className="text-2xl font-black text-green-700 mt-1">
                      ₹{opp.savingsVsFTL.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleConsolidate(opp)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-black uppercase text-sm tracking-wider shadow-lg shadow-purple-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-5 w-5" />
                Consolidate & Create Trip
              </button>

              {/* Warning for Critical Shipments */}
              {opp.shipments.some(s => s.priority === 'Critical') && (
                <div className="mt-3 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <p className="text-xs font-bold text-orange-700">
                    Contains critical priority shipments
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {expanded && (
        <div className="mt-6 pt-4 border-t-2 border-purple-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-black text-purple-900">
                {ptlBookings.length}
              </p>
              <p className="text-xs font-bold text-purple-600 uppercase">Pending PTL Bookings</p>
            </div>
            <div>
              <p className="text-2xl font-black text-green-600">
                {opportunities.length}
              </p>
              <p className="text-xs font-bold text-purple-600 uppercase">Consolidation Routes</p>
            </div>
            <div>
              <p className="text-2xl font-black text-blue-600">
                ₹{opportunities.reduce((sum, o) => sum + o.savingsVsFTL, 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs font-bold text-purple-600 uppercase">Potential Savings</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
