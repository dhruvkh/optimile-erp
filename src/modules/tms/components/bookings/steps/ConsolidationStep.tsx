
import React, { useState, useEffect } from 'react';
import { useBooking } from '../../../context/BookingContext';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Check, X, Layers, TrendingUp, ArrowRight, Truck, Clock, MapPin, Box } from 'lucide-react';

interface ConsolidationMatch {
  id: string;
  bookings: Array<{ id: string; client: string; weight: number; volume: number }>;
  routeMatch: string;
  dateDiff: number;
  savings: number;
  score: number;
  utilization: number;
  vehicleType: string;
  totalWeight: number;
  loadingSequence?: Array<{ step: number; bookingId: string; action: 'Load' | 'Unload'; location: string }>;
  pickupSchedule?: Array<{ time: string; activity: string }>;
  deliverySchedule?: Array<{ time: string; activity: string }>;
}

export const ConsolidationStep: React.FC = () => {
  const { data, updateData, updatePTLData, setStep, currentStep } = useBooking();
  const [matches, setMatches] = useState<ConsolidationMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const isPTL = data.bookingType === 'PTL';

  useEffect(() => {
    // Simulate searching for matches based on current booking route/date
    const timer = setTimeout(() => {
      if (isPTL) {
          // PTL Mock Data
          setMatches([
            {
                id: 'MATCH-PTL-001',
                bookings: [
                    { id: 'BK-2024-1015', client: 'Your Booking', weight: data.weight || 2500, volume: data.volume || 25 },
                    { id: 'BK-2024-1012', client: 'XYZ Corp', weight: 2800, volume: 28 },
                    { id: 'BK-2024-1010', client: 'ABC Ltd', weight: 2500, volume: 19 }
                ],
                routeMatch: 'Same Route',
                dateDiff: 0,
                savings: 8000,
                score: 95,
                utilization: 87,
                vehicleType: '32 Ton Closed Body',
                totalWeight: (data.weight || 2500) + 2800 + 2500,
                loadingSequence: [
                    { step: 1, bookingId: 'BK-2024-1015', action: 'Load', location: 'Your Cargo (Last Out)' },
                    { step: 2, bookingId: 'BK-2024-1012', action: 'Load', location: 'XYZ Corp (Middle)' },
                    { step: 3, bookingId: 'BK-2024-1010', action: 'Load', location: 'ABC Ltd (First Out)' }
                ],
                pickupSchedule: [
                    { time: '09:00 AM', activity: 'Your pickup' },
                    { time: '09:45 AM', activity: 'XYZ pickup (45 min wait)' },
                    { time: '10:30 AM', activity: 'ABC pickup' }
                ],
                deliverySchedule: [
                    { time: '02:00 PM', activity: 'ABC delivery' },
                    { time: '03:30 PM', activity: 'XYZ delivery' },
                    { time: '05:00 PM', activity: 'Your delivery' }
                ]
            }
          ]);
      } else {
          // LTL Mock Data (Legacy)
          setMatches([
            {
              id: 'MATCH-001',
              bookings: [
                { id: 'BK-2024-0998', client: 'XYZ Corp', weight: 850, volume: 85 },
                { id: 'BK-2024-0995', client: 'ABC Ltd', weight: 450, volume: 45 }
              ],
              routeMatch: 'Exact Route',
              dateDiff: 0,
              savings: 7400,
              score: 95,
              utilization: 75,
              vehicleType: 'LTL Van',
              totalWeight: 1300
            },
            {
              id: 'MATCH-002',
              bookings: [
                { id: 'BK-2024-0992', client: 'Global Logistics', weight: 1200, volume: 120 }
              ],
              routeMatch: 'Same Hub',
              dateDiff: 1,
              savings: 2800,
              score: 72,
              utilization: 60,
              vehicleType: 'LTL Van',
              totalWeight: 1200
            }
          ]);
      }
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isPTL, data.weight, data.volume]);

  const handleConsolidate = (match: ConsolidationMatch) => {
    updateData({ 
        isConsolidated: true, 
        consolidationMatchId: match.id,
        otherCharges: -match.savings, // Apply savings
        vehicleType: match.vehicleType // Update vehicle to the consolidated one
    });
    
    if (isPTL) {
        updatePTLData({
            consolidationStatus: {
                status: 'Matched',
                matchedWith: match.bookings.filter(b => !b.client.includes('Your')).map(b => b.id),
                truckUtilization: match.utilization,
                position: match.loadingSequence?.find(s => s.action === 'Load' && s.location.includes('Your'))?.step || null
            }
        });
    }

    setStep(currentStep + 1);
  };

  const handleSkip = () => {
    updateData({ 
        isConsolidated: false, 
        consolidationMatchId: undefined,
        otherCharges: 0 
    });
    setStep(currentStep + 1);
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-gray-500 font-medium">Analyzing Consolidation Opportunities...</p>
              <p className="text-xs text-gray-400 mt-2">Checking route matches and cargo compatibility</p>
          </div>
      );
  }

  return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <div className="flex">
                  <div className="flex-shrink-0">
                      <Layers className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                      <h3 className="text-sm font-bold text-blue-800">
                          {isPTL ? 'PTL Consolidation Opportunities Found!' : 'Consolidation Opportunities Found!'}
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                          We found <strong>{matches.length}</strong> compatible bookings. Consolidating can reduce costs by up to 60%.
                      </p>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
              {matches.map((match) => (
                  <Card key={match.id} className={`border-2 transition-all ${match.score > 90 ? 'border-green-500/30 shadow-md' : 'border-gray-200'}`}>
                      <div className="flex flex-col gap-6">
                          {/* Header */}
                          <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-3">
                                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${match.score > 90 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                                      Match Score: {match.score}/100
                                  </span>
                                  <span className="text-sm font-bold text-gray-900">{match.routeMatch}</span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{match.dateDiff === 0 ? 'Same Day' : `+${match.dateDiff} Day Diff`}</span>
                              </div>
                              <div className="text-right">
                                  <p className="text-xs text-gray-500 mb-1">Projected Savings</p>
                                  <div className="flex items-end justify-end">
                                      <p className="text-xl font-bold text-green-600">₹ {match.savings.toLocaleString()}</p>
                                      <span className="text-[10px] text-green-600 font-bold ml-1 bg-green-50 px-1 rounded">
                                          63%
                                      </span>
                                  </div>
                              </div>
                          </div>

                          {/* PTL Specific Layout */}
                          {isPTL && match.loadingSequence ? (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Combined Load Stats</p>
                                          <div className="grid grid-cols-2 gap-2 text-sm">
                                              <div><span className="text-gray-500">Vehicle:</span> <span className="font-bold">{match.vehicleType}</span></div>
                                              <div><span className="text-gray-500">Total Wgt:</span> <span className="font-bold">{match.totalWeight} Kg</span></div>
                                              <div><span className="text-gray-500">Utilization:</span> <span className="font-bold text-green-600">{match.utilization}%</span></div>
                                              <div><span className="text-gray-500">Your Share:</span> <span className="font-bold">32%</span></div>
                                          </div>
                                      </div>

                                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                                          <p className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
                                              <Box className="h-3 w-3 mr-1" /> Optimized Loading Sequence
                                          </p>
                                          <div className="space-y-2">
                                              {match.loadingSequence.map((seq, i) => (
                                                  <div key={i} className="flex items-center text-xs">
                                                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center font-bold mr-2 text-gray-600">{seq.step}</div>
                                                      <span className={`flex-1 ${seq.location.includes('Your') ? 'font-bold text-primary' : 'text-gray-600'}`}>
                                                          {seq.location}
                                                      </span>
                                                      <span className="text-[10px] text-gray-400 uppercase">{seq.action}</span>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  </div>

                                  <div className="space-y-4">
                                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                                          <p className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
                                              <Clock className="h-3 w-3 mr-1" /> Schedule Impact
                                          </p>
                                          <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                  <p className="text-[10px] font-bold text-gray-400 mb-1">Pickup Schedule</p>
                                                  {match.pickupSchedule?.map((s, i) => (
                                                      <div key={i} className={`text-xs mb-1 ${s.activity.includes('Your') ? 'text-primary font-medium' : 'text-gray-500'}`}>
                                                          <span className="inline-block w-14">{s.time}</span> {s.activity}
                                                      </div>
                                                  ))}
                                              </div>
                                              <div>
                                                  <p className="text-[10px] font-bold text-gray-400 mb-1">Delivery Schedule</p>
                                                  {match.deliverySchedule?.map((s, i) => (
                                                      <div key={i} className={`text-xs mb-1 ${s.activity.includes('Your') ? 'text-primary font-medium' : 'text-gray-500'}`}>
                                                          <span className="inline-block w-14">{s.time}</span> {s.activity}
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ) : (
                              // Standard LTL Layout
                              <div className="flex flex-col md:flex-row gap-4">
                                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex-1">
                                      <p className="text-xs font-bold text-gray-500 uppercase mb-3">Combined Load Manifest</p>
                                      <div className="space-y-2">
                                          <div className="flex justify-between text-sm items-center bg-white p-2 rounded border border-gray-200 shadow-sm border-l-4 border-l-primary">
                                              <span className="font-bold text-gray-900">Current Booking</span>
                                              <span className="text-gray-600 font-mono">{data.weight} {data.weightUnit}</span>
                                          </div>
                                          {match.bookings.map(b => (
                                              <div key={b.id} className="flex justify-between text-sm items-center bg-white p-2 rounded border border-gray-200 shadow-sm opacity-75">
                                                  <span className="text-gray-700">{b.id} <span className="text-xs text-gray-400 ml-1">({b.client})</span></span>
                                                  <span className="text-gray-500 font-mono">{b.weight} {data.weightUnit}</span>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                                  <div className="md:w-48">
                                      <div className="mb-4">
                                          <p className="text-xs text-gray-500 mb-1">Vehicle Utilization</p>
                                          <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${match.utilization}%` }}></div>
                                          </div>
                                          <span className="text-xs font-medium text-gray-700">{match.utilization}% Capacity</span>
                                      </div>
                                  </div>
                              </div>
                          )}

                          <div className="flex gap-3 pt-4 border-t border-gray-100">
                              <Button onClick={() => handleConsolidate(match)} className="flex-1 bg-green-600 hover:bg-green-700 h-10 shadow-sm">
                                  <Check className="h-4 w-4 mr-2" /> Accept Consolidation
                              </Button>
                              <Button onClick={handleSkip} variant="outline" className="flex-1 text-gray-500 h-10 border-gray-200">
                                  <X className="h-4 w-4 mr-2" /> Decline (Book Standalone)
                              </Button>
                          </div>
                      </div>
                  </Card>
              ))}
          </div>

          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-sm text-gray-500">
                  Don't see a good match? <button onClick={handleSkip} className="text-primary hover:underline font-medium">Proceed to Vehicle Assignment</button> as a single shipment.
              </p>
          </div>
      </div>
  );
};
