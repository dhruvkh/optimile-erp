
import React, { useState, useEffect, useMemo } from 'react';
import {
  X, MapPin, Camera, Navigation, CheckCircle,
  ChevronRight, Clock, Loader2, IndianRupee, Info
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { TripStatusCode, TRIP_STATUS_FLOW } from './types';
import { useOperationalData } from '../../../../../shared/context/OperationalDataContext';

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: TripStatusCode;
  onUpdate: (newStatus: TripStatusCode, data: any) => void;
  tripId: string;
}

interface AdvanceItem {
  key: string;
  label: string;
  amount: number;
  advanceType: 'fuel' | 'driver_batta' | 'toll' | 'vendor_advance' | 'other';
  note?: string;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  isOpen, onClose, currentStatus, onUpdate, tripId
}) => {
  const { completedTrips, addTripExpense } = useOperationalData();
  const trip = completedTrips.find(t => t.id === tripId) ?? null;

  const currentDef = TRIP_STATUS_FLOW[currentStatus];
  const nextStatusCode = currentDef.allowedNext[0];
  const nextDef = nextStatusCode ? TRIP_STATUS_FLOW[nextStatusCode] : null;

  const [step, setStep] = useState<'verify' | 'data' | 'confirm'>('verify');
  const [gpsState, setGpsState] = useState<'idle' | 'detecting' | 'locked'>('idle');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [delayReason, setDelayReason] = useState('');
  const [validationError, setValidationError] = useState('');

  // Advance state — only active at DISPATCHED step
  const [advanceItems, setAdvanceItems] = useState<AdvanceItem[]>([]);
  const [vendorAdvancePct, setVendorAdvancePct] = useState(80);
  const [skipAdvance, setSkipAdvance] = useState(false);

  const isDispatchStep = nextStatusCode === 'DISPATCHED';
  const isOwnFleet = trip?.tripType === 'own_vehicle';
  const isMarketOrContracted = trip?.tripType === 'market_hire' || trip?.tripType === 'contracted_vendor';

  // Pre-calculate advance line items from trip data
  const defaultAdvanceItems = useMemo<AdvanceItem[]>(() => {
    if (!trip || !isDispatchStep) return [];
    const distKm = trip.distanceKm || 500;

    if (isOwnFleet) {
      return [
        { key: 'fuel',        label: 'Fuel Advance',   amount: Math.round(distKm * 10), advanceType: 'fuel',        note: `${distKm} km × ₹10/km (estimate)` },
        { key: 'driver_batta',label: 'Driver Batta',   amount: 800,                     advanceType: 'driver_batta', note: 'Per-trip allowance' },
        { key: 'toll',        label: 'Toll / FASTag',  amount: Math.round(distKm * 1),  advanceType: 'toll',         note: 'Estimated toll (FASTag or cash)' },
        { key: 'other',       label: 'Other Expenses', amount: 0,                       advanceType: 'other',        note: 'Parking, weighbridge, misc.' },
      ];
    }
    if (isMarketOrContracted) {
      const baseCost = trip.totalCost || trip.revenueAmount * 0.75;
      return [
        { key: 'vendor_advance', label: 'Vendor Advance', amount: Math.round(baseCost * vendorAdvancePct / 100), advanceType: 'vendor_advance',
          note: `${vendorAdvancePct}% of ₹${baseCost.toLocaleString('en-IN')}${trip.vendorName ? ` — ${trip.vendorName}` : ''}` },
      ];
    }
    return [];
  }, [trip, isDispatchStep, isOwnFleet, isMarketOrContracted, vendorAdvancePct]);

  useEffect(() => {
    if (isOpen) {
      setStep('verify'); setGpsState('idle'); setPhotos([]); setFormData({});
      setDelayReason(''); setSkipAdvance(false); setVendorAdvancePct(80);
    }
  }, [isOpen]);

  useEffect(() => { setAdvanceItems(defaultAdvanceItems); }, [defaultAdvanceItems]);

  if (!isOpen || !nextDef) return null;

  const startGpsDetection = () => {
    setGpsState('detecting');
    setTimeout(() => { setGpsState('locked'); setLocation('Andheri East, Mumbai, MH (Accuracy: 5m)'); }, 1500);
  };

  const handlePhotoUpload = () => {
    setPhotos([...photos, `https://source.unsplash.com/random/400x300?truck&sig=${Math.random()}`]);
  };

  const handleNext = () => {
    if (step === 'verify') {
      if (nextDef.requiredFields.includes('gpsLocation') && gpsState !== 'locked') {
        setValidationError('GPS Location required.');
        return;
      }
      setValidationError('');
      setStep('data');
    } else if (step === 'data') {
      if (nextDef.requiredFields.includes('photos') && photos.length === 0) {
        setValidationError('At least one photo required.');
        return;
      }
      setValidationError('');
      setStep('confirm');
    }
  };

  const handleConfirm = () => {
    // Submit each advance as a pending TripExpense
    if (isDispatchStep && !skipAdvance) {
      const now = new Date();
      advanceItems.filter(i => i.amount > 0).forEach(item => {
        addTripExpense(tripId, {
          id: `adv_${item.key}_${tripId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          tripId,
          category: item.advanceType === 'vendor_advance' ? 'VENDOR_ADVANCE' : item.advanceType.toUpperCase(),
          description: item.label,
          amount: item.amount,
          date: now.toISOString().split('T')[0],
          time: now.toTimeString().slice(0, 5),
          status: 'Pending',
          isAdvance: true,
          advanceType: item.advanceType,
          paymentStatus: 'pending_payment',
          submittedBy: { name: 'Dispatcher', role: 'Operations', time: now.toLocaleTimeString() },
        });
      });
    }
    onUpdate(nextStatusCode, { timestamp: new Date().toISOString(), location, photos, ...formData, delayReason });
    onClose();
  };

  const updateAdvanceAmt = (key: string, val: number) =>
    setAdvanceItems(prev => prev.map(i => i.key === key ? { ...i, amount: Math.max(0, val) } : i));

  const updateVendorPct = (pct: number) => {
    setVendorAdvancePct(pct);
    const baseCost = trip?.totalCost || (trip?.revenueAmount ?? 0) * 0.75;
    setAdvanceItems(prev => prev.map(i =>
      i.advanceType === 'vendor_advance'
        ? { ...i, amount: Math.round(baseCost * pct / 100), note: `${pct}% of ₹${baseCost.toLocaleString('en-IN')}${trip?.vendorName ? ` — ${trip.vendorName}` : ''}` }
        : i
    ));
  };

  const totalAdvance = advanceItems.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={onClose} />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full">

          {/* Header */}
          <div className={`${nextDef.color} px-6 py-4 flex justify-between items-center text-white`}>
            <div>
              <p className="text-xs opacity-90 uppercase font-bold tracking-wider">Update Trip Status</p>
              <h3 className="text-lg font-bold flex items-center mt-1">
                {currentDef.name} <ChevronRight className="h-5 w-5 mx-2" /> {nextDef.name}
              </h3>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1"><X className="h-6 w-6" /></button>
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full bg-gray-100">
            <div className={`h-full ${nextDef.color}`} style={{ width: step === 'verify' ? '33%' : step === 'data' ? '66%' : '100%' }} />
          </div>

          <div className="p-6 min-h-[350px] flex flex-col max-h-[72vh] overflow-y-auto">

            {/* ── STEP 1: GPS ── */}
            {step === 'verify' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                    <MapPin className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Location Verification</h4>
                  <p className="text-sm text-gray-500 mt-1">Confirm your current location to proceed.</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {gpsState === 'idle' && (
                    <Button onClick={startGpsDetection} className="w-full" variant="secondary">
                      <Navigation className="h-4 w-4 mr-2" /> Detect My Location
                    </Button>
                  )}
                  {gpsState === 'detecting' && (
                    <div className="text-center py-2 text-primary flex items-center justify-center">
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Acquiring Satellite Lock...
                    </div>
                  )}
                  {gpsState === 'locked' && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Current Location</p>
                      <p className="font-bold text-gray-900 text-sm">{location}</p>
                      <div className="mt-2 flex justify-center text-xs text-green-600 font-medium items-center">
                        <CheckCircle className="h-3 w-3 mr-1" /> GPS Verified (Accuracy: 5m)
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-100 flex items-start">
                  <Clock className="h-4 w-4 text-yellow-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-yellow-800">Schedule Check</p>
                    <p className="text-xs text-yellow-700">You are 15 minutes behind schedule. Provide a reason in the next step.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: DATA + ADVANCE ── */}
            {step === 'data' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-8">

                {nextStatusCode === 'DISPATCHED' && (
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Odometer Reading" type="number" placeholder="Km" onChange={e => setFormData({ ...formData, odometer: e.target.value })} />
                    <Input label="Fuel Level (%)" type="number" placeholder="%" onChange={e => setFormData({ ...formData, fuelLevel: e.target.value })} />
                  </div>
                )}

                {nextStatusCode === 'LOADING_COMPLETED' && (
                  <Input label="Seal Number" placeholder="Enter Seal #" onChange={e => setFormData({ ...formData, sealNumber: e.target.value })} />
                )}

                {/* ── TRIP ADVANCE SECTION ── */}
                {isDispatchStep && advanceItems.length > 0 && (
                  <div className="border border-indigo-200 rounded-xl overflow-hidden">
                    <div className="bg-indigo-50 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-bold text-indigo-900">Trip Advance Request</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isOwnFleet ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {isOwnFleet ? 'Own Fleet' : trip?.tripType === 'contracted_vendor' ? 'Contracted' : 'Market Hire'}
                        </span>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
                        <input type="checkbox" checked={skipAdvance} onChange={e => setSkipAdvance(e.target.checked)} className="rounded" />
                        Skip
                      </label>
                    </div>

                    {!skipAdvance && (
                      <div className="p-4 space-y-3 bg-white">
                        {/* Vendor advance % picker */}
                        {isMarketOrContracted && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-gray-700 mb-1.5">
                              Advance % <span className="text-gray-400 font-normal">(agreed: 80–95%)</span>
                            </p>
                            <div className="flex gap-1.5">
                              {[70, 80, 85, 90, 95].map(pct => (
                                <button key={pct} onClick={() => updateVendorPct(pct)}
                                  className={`flex-1 py-1.5 rounded text-xs font-semibold transition-colors ${
                                    vendorAdvancePct === pct ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-indigo-50'
                                  }`}
                                >
                                  {pct}%
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {advanceItems.map(item => (
                          <div key={item.key} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800">{item.label}</p>
                              {item.note && <p className="text-[10px] text-gray-400 truncate">{item.note}</p>}
                            </div>
                            <div className="relative w-28 flex-shrink-0">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">₹</span>
                              <input type="number" min={0} value={item.amount}
                                onChange={e => updateAdvanceAmt(item.key, Number(e.target.value))}
                                className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                              />
                            </div>
                          </div>
                        ))}

                        <div className="flex items-center justify-between pt-2 border-t border-indigo-100">
                          <span className="text-sm font-bold text-gray-700">Total Advance</span>
                          <span className="text-base font-bold text-indigo-700">₹ {totalAdvance.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Info className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <p className="text-[10px] text-gray-400">Sent to Operations Manager for approval → Finance for disbursement.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Photos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Evidence Photos (Required)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {photos.map((url, idx) => (
                      <div key={idx} className="aspect-square rounded-lg bg-gray-100 overflow-hidden border border-gray-300">
                        <img src={url} alt="Proof" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    <button onClick={handlePhotoUpload}
                      className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:bg-gray-50 hover:border-primary transition-colors"
                    >
                      <Camera className="h-6 w-6 text-gray-400 mb-1" />
                      <span className="text-[10px] text-gray-500">Add Photo</span>
                    </button>
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remarks / Delay Reason</label>
                  <textarea className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary"
                    rows={2} placeholder="Any issues encountered?" value={delayReason}
                    onChange={e => setDelayReason(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* ── STEP 3: CONFIRM ── */}
            {step === 'confirm' && (
              <div className="space-y-5 text-center animate-in fade-in slide-in-from-right-8">
                <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">Ready to Update?</h4>
                  <p className="text-sm text-gray-500 mt-2">
                    Status → <span className="font-bold text-gray-800">{nextDef.name}</span>.
                    Client will be notified automatically.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded text-left text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location</span>
                    <span className="font-medium text-gray-900 truncate max-w-[160px]">{location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Photos</span>
                    <span className="font-medium text-gray-900">{photos.length} Attached</span>
                  </div>
                  {Object.entries(formData).map(([key, val]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-medium text-gray-900">{val}</span>
                    </div>
                  ))}
                </div>

                {/* Advance summary */}
                {isDispatchStep && !skipAdvance && totalAdvance > 0 && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-left">
                    <p className="text-xs font-bold text-indigo-800 mb-2 flex items-center gap-1">
                      <IndianRupee className="h-3.5 w-3.5" /> Advance sent for approval
                    </p>
                    {advanceItems.filter(i => i.amount > 0).map(item => (
                      <div key={item.key} className="flex justify-between text-xs py-0.5">
                        <span className="text-indigo-700">{item.label}</span>
                        <span className="font-semibold text-indigo-900">₹ {item.amount.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold border-t border-indigo-200 pt-2 mt-2">
                      <span>Total Advance</span>
                      <span>₹ {totalAdvance.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
                {isDispatchStep && skipAdvance && (
                  <p className="text-xs text-gray-400 text-left bg-gray-50 p-3 rounded">
                    Advance skipped. Add expenses manually from the Expenses tab.
                  </p>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-100">
            {step !== 'verify' && (
              <button onClick={() => setStep(step === 'confirm' ? 'data' : 'verify')}
                className="text-gray-500 text-sm font-medium hover:text-gray-800"
              >Back</button>
            )}
            <div className="ml-auto flex flex-col items-end gap-2">
              {validationError && <p className="text-red-500 text-sm mt-2">{validationError}</p>}
              {step === 'confirm' ? (
                <Button onClick={handleConfirm} className={`${nextDef.color} border-none hover:opacity-90`}>
                  {isDispatchStep && !skipAdvance && totalAdvance > 0 ? 'Confirm & Request Advance' : 'Confirm Update'}
                </Button>
              ) : (
                <Button onClick={handleNext} className="w-32">Next Step</Button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
