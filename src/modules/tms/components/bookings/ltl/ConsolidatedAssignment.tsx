
import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Truck, Users, Star, CheckCircle, TrendingUp, AlertCircle, Info, DollarSign } from 'lucide-react';
import { useBooking } from '../../../context/BookingContext';
import { useToast } from '../../../../../shared/context/ToastContext';

// Mock Data
const OWN_VEHICLES = [
  {
    id: 'MH-01-AB-1234',
    type: '32 Ton Closed Body',
    driver: 'Ramesh Kumar',
    rating: 4.8,
    location: '12 KM away (25 min)',
    lastService: '15 days ago',
    costs: { fuel: 23000, driver: 9500, other: 3500 },
    totalCost: 36000,
    status: 'Available'
  },
  {
    id: 'MH-04-CD-5678',
    type: '32 Ton Closed Body',
    driver: 'Suresh Singh',
    rating: 4.5,
    location: '45 KM away (1.5 hr)',
    lastService: '5 days ago',
    costs: { fuel: 24500, driver: 9500, other: 3500 },
    totalCost: 37500,
    status: 'Available'
  }
];

const PARTNERS = [
  {
    id: 'P1',
    name: 'ABC Transport Services',
    rating: 4.8,
    trips: 156,
    fleetSize: 25,
    rate: 38000,
    breakdown: { base: 35000, handling: 2000, fuel: 0 },
    performance: { otd: 96, damage: 0.3 },
    availability: '2 hours',
    vehicle: 'MH-05-XY-9876 (2022)',
    contract: 'Valid till Mar 31, 2024',
    recommended: true
  },
  {
    id: 'P2',
    name: 'Global Logistics',
    rating: 4.2,
    trips: 89,
    fleetSize: 12,
    rate: 36500,
    breakdown: { base: 34000, handling: 2500, fuel: 0 },
    performance: { otd: 89, damage: 0.8 },
    availability: 'Immediate',
    vehicle: 'DL-01-ZZ-1122 (2019)',
    contract: 'Spot Rate',
    recommended: false
  },
  {
    id: 'P3',
    name: 'Swift Movers',
    rating: 4.6,
    trips: 203,
    fleetSize: 40,
    rate: 39500,
    breakdown: { base: 37000, handling: 2500, fuel: 0 },
    performance: { otd: 94, damage: 0.5 },
    availability: 'Tomorrow 8 AM',
    vehicle: 'KA-02-MM-3344 (2021)',
    contract: 'Valid till Dec 31, 2024',
    recommended: false
  }
];

export const ConsolidatedAssignment: React.FC = () => {
  const { data, updateData } = useBooking();
  const { showToast } = useToast();
  const [sourceType, setSourceType] = useState<'own' | 'partner'>('own');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Mock revenue from the 3 consolidated bookings
  const revenue = 40000; 

  const handleAssign = (id: string, type: 'own' | 'partner', cost: number) => {
    // In a real app, we'd look up the details
    const name = type === 'own' ? id : PARTNERS.find(p => p.id === id)?.name;
    
    // Update context
    if (type === 'partner') {
        const partner = PARTNERS.find(p => p.id === id);
        updateData({ 
            selectedCarrier: {
                id: partner?.id || '',
                name: partner?.name || '',
                rate: partner?.rate || 0,
                transitTime: 'Standard',
                rating: partner?.rating || 0,
                onTime: partner?.performance.otd || 0
            },
            baseRate: partner?.rate,
            vehicleType: partner?.vehicle
        });
    } else {
        const vehicle = OWN_VEHICLES.find(v => v.id === id);
        updateData({
            vehicleType: vehicle?.type,
            // Keeping internal cost for reference, potentially updating state for margin analysis
        });
    }
    
    showToast({
      type: 'success',
      title: `${type === 'own' ? 'Vehicle' : 'Partner'} Assigned`,
      message: `${name} assigned successfully to the consolidated shipment.`
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-lg font-bold text-indigo-900">Consolidated Shipment Assignment</h3>
                <p className="text-sm text-indigo-700">3 Bookings • 7,800 Kgs • 72 cu m • Mumbai → Delhi</p>
            </div>
            <div className="text-right">
                <span className="block text-xs font-bold text-indigo-500 uppercase">Target Vehicle</span>
                <span className="font-bold text-indigo-900">32 Ton Closed Body</span>
            </div>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex space-x-4 border-b border-gray-200 pb-1">
          <button 
            className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${sourceType === 'own' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setSourceType('own'); setSelectedId(null); }}
          >
              Own Fleet (Preferred)
          </button>
          <button 
            className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${sourceType === 'partner' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setSourceType('partner'); setSelectedId(null); }}
          >
              Partner Transporter
          </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
          {sourceType === 'own' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                  <div className="flex justify-between items-center px-2">
                      <span className="text-sm text-gray-500">2 Vehicles Available</span>
                      <span className="text-sm font-medium text-green-600 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" /> Own fleet yields ~10% better margin
                      </span>
                  </div>
                  {OWN_VEHICLES.map((vehicle, idx) => (
                      <Card key={vehicle.id} className={`cursor-pointer transition-all ${selectedId === vehicle.id ? 'ring-2 ring-primary border-primary' : 'hover:border-blue-300'}`} onClick={() => setSelectedId(vehicle.id)}>
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                              <div className="flex-1">
                                  <div className="flex items-center mb-2">
                                      <Truck className="h-5 w-5 text-primary mr-2" />
                                      <h4 className="font-bold text-gray-900">{vehicle.id}</h4>
                                      {idx === 0 && <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded font-bold">Recommended</span>}
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600">
                                      <div>Driver: <span className="font-medium text-gray-900">{vehicle.driver}</span> (⭐ {vehicle.rating})</div>
                                      <div>Location: {vehicle.location}</div>
                                      <div>Type: {vehicle.type}</div>
                                      <div>Last Service: {vehicle.lastService}</div>
                                  </div>
                              </div>
                              <div className="border-l border-gray-100 pl-4 min-w-[200px] flex flex-col justify-center">
                                  <div className="text-xs text-gray-500 mb-1">Estimated Cost Breakdown</div>
                                  <div className="text-sm space-y-1 mb-2">
                                      <div className="flex justify-between"><span>Fuel:</span> <span>₹ {vehicle.costs.fuel.toLocaleString()}</span></div>
                                      <div className="flex justify-between"><span>Driver:</span> <span>₹ {vehicle.costs.driver.toLocaleString()}</span></div>
                                      <div className="flex justify-between border-t border-dashed pt-1 font-bold text-gray-900">
                                          <span>Total:</span> <span>₹ {vehicle.totalCost.toLocaleString()}</span>
                                      </div>
                                  </div>
                                  <div className="bg-green-50 text-green-700 text-xs p-2 rounded flex justify-between font-bold">
                                      <span>Est. Margin:</span>
                                      <span>₹ {(revenue - vehicle.totalCost).toLocaleString()} (10%)</span>
                                  </div>
                                  {selectedId === vehicle.id && (
                                      <Button size="sm" className="mt-3 w-full" onClick={(e) => { e.stopPropagation(); handleAssign(vehicle.id, 'own', vehicle.totalCost); }}>
                                          Assign Vehicle
                                      </Button>
                                  )}
                              </div>
                          </div>
                      </Card>
                  ))}
              </div>
          )}

          {sourceType === 'partner' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                  <div className="flex justify-between items-center px-2">
                      <span className="text-sm text-gray-500">3 Partners Available</span>
                      <Button variant="outline" size="sm" className="text-xs h-7">
                          Request Quotes from All
                      </Button>
                  </div>
                  {PARTNERS.map((partner) => (
                      <Card key={partner.id} className={`cursor-pointer transition-all ${selectedId === partner.id ? 'ring-2 ring-primary border-primary' : 'hover:border-blue-300'}`} onClick={() => setSelectedId(partner.id)}>
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                              <div className="flex-1">
                                  <div className="flex items-center mb-2">
                                      <Users className="h-5 w-5 text-indigo-600 mr-2" />
                                      <h4 className="font-bold text-gray-900">{partner.name}</h4>
                                      {partner.recommended && <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded font-bold">⭐ Recommended</span>}
                                  </div>
                                  <div className="flex items-center text-sm text-gray-600 mb-2">
                                      <span className="flex items-center mr-4"><Star className="h-3 w-3 text-yellow-400 fill-current mr-1" /> {partner.rating}</span>
                                      <span className="mr-4">{partner.trips} Trips</span>
                                      <span className="text-green-600 font-medium">{partner.performance.otd}% On-Time</span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                      Vehicle: {partner.vehicle} • Available: <span className="font-medium text-gray-900">{partner.availability}</span>
                                  </div>
                                  <div className="text-xs text-blue-600 mt-1">{partner.contract}</div>
                              </div>
                              <div className="border-l border-gray-100 pl-4 min-w-[200px] flex flex-col justify-center">
                                  <div className="text-right mb-2">
                                      <span className="text-xs text-gray-500 block">All-inclusive Rate</span>
                                      <span className="text-xl font-bold text-gray-900">₹ {partner.rate.toLocaleString()}</span>
                                  </div>
                                  
                                  {/* Cost breakdown for consolidated bookings */}
                                  <div className="text-xs bg-gray-50 p-2 rounded mb-3">
                                      <div className="font-medium text-gray-700 mb-1">Cost Allocation</div>
                                      <div className="flex justify-between"><span>Acme (32%):</span> <span>₹ {(partner.rate * 0.32).toLocaleString()}</span></div>
                                      <div className="flex justify-between"><span>XYZ (40%):</span> <span>₹ {(partner.rate * 0.40).toLocaleString()}</span></div>
                                      <div className="flex justify-between"><span>ABC (28%):</span> <span>₹ {(partner.rate * 0.28).toLocaleString()}</span></div>
                                  </div>

                                  <div className="flex gap-2">
                                      {selectedId === partner.id ? (
                                          <>
                                              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={(e) => {e.stopPropagation(); showToast({ type: 'info', title: 'Negotiation Started', message: 'Rate negotiation request sent to partner.' });}}>Negotiate</Button>
                                              <Button size="sm" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); handleAssign(partner.id, 'partner', partner.rate); }}>Select</Button>
                                          </>
                                      ) : (
                                          <Button size="sm" variant="outline" className="w-full text-xs">View Profile</Button>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </Card>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};
