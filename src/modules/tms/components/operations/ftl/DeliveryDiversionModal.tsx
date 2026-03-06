import React, { useState } from 'react';
import { X, CornerDownRight, MapPin, DollarSign, Users, CheckCircle, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '../../ui/Button';
import { TripCheckpoint } from './types';
import { useOperationalData } from '../../../../../shared/context/OperationalDataContext';
import { TripExpense } from './types';
import { exceptionManager } from '../../../../../shared/services/exceptionManager';
import { CompletedTrip } from '../../../../../shared/context/OperationalDataStore';

interface DeliveryDiversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: CompletedTrip;
  onDivert: (checkpoint: TripCheckpoint) => void;
}

type CostParty = 'consignee' | 'consignor' | 'split';

const STEPS = ['Diversion Request', 'Distance & Charges', 'Cost Allocation', 'Summary'];

export const DeliveryDiversionModal: React.FC<DeliveryDiversionModalProps> = ({ isOpen, onClose, trip, onDivert }) => {
  const { addTripExpense } = useOperationalData();
  const [step, setStep] = useState(1);

  // Step 1
  const [newAddress, setNewAddress] = useState('');
  const [reason, setReason] = useState('');
  const [requestedBy, setRequestedBy] = useState<'consignee' | 'consignor'>('consignee');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Step 2
  const [additionalKm, setAdditionalKm] = useState<number | ''>('');
  const [ratePerKm, setRatePerKm] = useState(15);
  const [extraDayRequired, setExtraDayRequired] = useState(false);
  const [otherCharges, setOtherCharges] = useState(0);

  // Step 3
  const [costParty, setCostParty] = useState<CostParty>('consignee');
  const [splitPercent, setSplitPercent] = useState(50);
  const [billingNote, setBillingNote] = useState('');
  const [notifyManager, setNotifyManager] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const km = typeof additionalKm === 'number' ? additionalKm : 0;
  const additionalFreight = Math.round(km * ratePerKm);
  const estimatedToll = Math.round(km * 1.5);
  const driverAllowance = extraDayRequired ? 800 : 0;
  const totalDiversionCharges = additionalFreight + estimatedToll + driverAllowance + otherCharges;

  const step1Valid = newAddress.trim().length > 0 && reason.trim().length > 0;
  const step2Valid = km > 0;

  const canNext = step === 1 ? step1Valid : step === 2 ? step2Valid : true;

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleConfirm = () => {
    setIsSubmitting(true);

    const now = new Date().toISOString();
    const nowDate = now.split('T')[0];
    const nowTime = now.split('T')[1].substring(0, 5);

    const chargeLines: { desc: string; amount: number }[] = [
      { desc: 'Additional Freight', amount: additionalFreight },
      { desc: 'Additional Toll', amount: estimatedToll },
      ...(driverAllowance > 0 ? [{ desc: 'Driver Allowance (Extra Day)', amount: driverAllowance }] : []),
      ...(otherCharges > 0 ? [{ desc: 'Other Charges', amount: otherCharges }] : []),
    ];

    chargeLines.forEach((line, idx) => {
      const expense: TripExpense = {
        id: `exp-div-${Date.now()}-${idx}`,
        tripId: trip.id,
        category: 'OTHER',
        description: `Delivery Diversion — ${line.desc}: ${newAddress}`,
        amount: line.amount,
        date: nowDate,
        time: nowTime,
        status: 'Pending',
        submittedBy: { name: 'Current User', role: 'Operator', time: now },
      };
      addTripExpense(trip.id, expense);
    });

    const chargedToLabel =
      costParty === 'consignee' ? 'Consignee'
      : costParty === 'consignor' ? 'Consignor'
      : `Split (${splitPercent}% Consignee / ${100 - splitPercent}% Consignor)`;

    if (notifyManager) {
      exceptionManager.raise({
        tripId: trip.id,
        bookingRef: trip.bookingRef || trip.id,
        category: 'route_deviation',
        severity: 'medium',
        title: 'Delivery Diverted',
        description: `Delivery rerouted to: ${newAddress}. Extra: ${km} km, ₹${totalDiversionCharges.toLocaleString('en-IN')} charged to ${chargedToLabel}. Reason: ${reason}`,
        raisedBy: 'CurrentUser',
        requiresReplacementVehicle: false,
      });
    }

    const checkpoint: TripCheckpoint = {
      id: `cp-divert-${Date.now()}`,
      status: 'DELIVERY_DIVERTED',
      timestamp: now,
      locationName: newAddress,
      capturedBy: { id: 'curr', name: 'Current User', role: 'Operator' },
      data: {
        newAddress,
        reason,
        requestedBy,
        contactName,
        contactPhone,
        additionalKm: km,
        totalCharge: totalDiversionCharges,
        chargedTo: chargedToLabel,
        billingNote,
      },
    };

    onDivert(checkpoint);
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CornerDownRight className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Divert Delivery</h3>
                <p className="text-amber-100 text-xs">{trip.id} · {trip.origin} → {trip.destination}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-amber-100 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex border-b border-gray-100 bg-gray-50">
            {STEPS.map((label, idx) => {
              const num = idx + 1;
              const isDone = step > num;
              const isActive = step === num;
              return (
                <div key={num} className="flex-1 flex flex-col items-center py-2.5 gap-0.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {isDone ? <CheckCircle className="h-4 w-4" /> : num}
                  </div>
                  <span className={`text-[10px] font-medium leading-tight text-center ${isActive ? 'text-amber-600' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 min-h-[340px]">
            {/* ── Step 1: Diversion Request ── */}
            {step === 1 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Original Destination</label>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-500 italic">{trip.destination}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">New Delivery Address <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
                    <input
                      type="text"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                      placeholder="Enter new full delivery address..."
                      value={newAddress}
                      onChange={e => setNewAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Reason for Diversion <span className="text-red-500">*</span></label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-1 focus:ring-amber-400 focus:border-amber-400 resize-none"
                    rows={2}
                    placeholder="e.g. Consignee requested delivery at alternate warehouse..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Requested By</label>
                  <div className="flex gap-3">
                    {(['consignee', 'consignor'] as const).map(party => (
                      <label key={party} className={`flex-1 flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${requestedBy === party ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="requestedBy" value={party} checked={requestedBy === party} onChange={() => setRequestedBy(party)} className="accent-amber-500" />
                        <span className="text-sm font-medium capitalize">{party}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Contact Name</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                      placeholder="Name"
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                      placeholder="+91 XXXXX XXXXX"
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── Step 2: Distance & Charges ── */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Additional Distance (km) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      min={1}
                      className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                      placeholder="e.g. 80"
                      value={additionalKm}
                      onChange={e => setAdditionalKm(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Rate per km (₹)</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                      value={ratePerKm}
                      onChange={e => setRatePerKm(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2.5">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Auto-computed Charges</p>

                  {[
                    { label: 'Additional Freight', value: additionalFreight, note: `${km} km × ₹${ratePerKm}` },
                    { label: 'Estimated Toll', value: estimatedToll, note: `${km} km × ₹1.50` },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{row.label} <span className="text-xs text-gray-400">({row.note})</span></span>
                      <span className="font-semibold text-gray-900">₹{row.value.toLocaleString('en-IN')}</span>
                    </div>
                  ))}

                  <div className="flex items-center justify-between text-sm pt-1 border-t border-amber-200">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                      <input type="checkbox" checked={extraDayRequired} onChange={e => setExtraDayRequired(e.target.checked)} className="accent-amber-500 rounded" />
                      Driver Allowance (Extra day)
                    </label>
                    <span className="font-semibold text-gray-900">₹{driverAllowance.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="text-gray-600">Other Charges (₹)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-28 border border-amber-300 rounded-lg text-sm px-2 py-1 text-right focus:ring-1 focus:ring-amber-400 focus:border-amber-400 bg-white"
                      value={otherCharges || ''}
                      onChange={e => setOtherCharges(Number(e.target.value) || 0)}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-amber-300 text-amber-800">
                    <span>Total Diversion Charges</span>
                    <span className="text-base">₹{totalDiversionCharges.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>E-way bill may need amendment if the new destination is in a different state. Verify with your compliance team.</span>
                </div>
              </>
            )}

            {/* ── Step 3: Cost Allocation ── */}
            {step === 3 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Who bears the extra charges?</label>
                  <div className="space-y-2">
                    {([
                      { value: 'consignee', label: 'Consignee pays', sub: 'Most common — they requested the diversion' },
                      { value: 'consignor', label: 'Consignor pays', sub: 'Consignor agreed to accommodate the change' },
                      { value: 'split', label: 'Split between both', sub: 'Custom percentage' },
                    ] as { value: CostParty; label: string; sub: string }[]).map(opt => (
                      <label key={opt.value} className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors ${costParty === opt.value ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="costParty" value={opt.value} checked={costParty === opt.value} onChange={() => setCostParty(opt.value)} className="accent-amber-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                          <p className="text-xs text-gray-500">{opt.sub}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {costParty === 'split' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                      Split: <span className="text-amber-600">{splitPercent}% Consignee</span> / <span className="text-gray-600">{100 - splitPercent}% Consignor</span>
                    </label>
                    <input type="range" min={10} max={90} step={10} value={splitPercent} onChange={e => setSplitPercent(Number(e.target.value))} className="w-full accent-amber-500" />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Consignee ₹{Math.round(totalDiversionCharges * splitPercent / 100).toLocaleString('en-IN')}</span>
                      <span>Consignor ₹{Math.round(totalDiversionCharges * (100 - splitPercent) / 100).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Billing Note</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-1 focus:ring-amber-400 focus:border-amber-400 resize-none"
                    rows={2}
                    placeholder="e.g. Add to delivery invoice, Raise separate debit note..."
                    value={billingNote}
                    onChange={e => setBillingNote(e.target.value)}
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input type="checkbox" checked={notifyManager} onChange={e => setNotifyManager(e.target.checked)} className="accent-amber-500 rounded" />
                  Notify manager (raise a low-priority exception alert)
                </label>
              </>
            )}

            {/* ── Step 4: Summary ── */}
            {step === 4 && (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Diversion Summary</p>

                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-gray-500">Original Destination</span>
                    <span className="font-medium text-gray-800">{trip.destination}</span>

                    <span className="text-gray-500">New Address</span>
                    <span className="font-medium text-amber-700">{newAddress}</span>

                    <span className="text-gray-500">Reason</span>
                    <span className="font-medium text-gray-800">{reason}</span>

                    <span className="text-gray-500">Requested By</span>
                    <span className="font-medium capitalize text-gray-800">{requestedBy}</span>

                    {contactName && <><span className="text-gray-500">Contact</span><span className="font-medium text-gray-800">{contactName} {contactPhone && `· ${contactPhone}`}</span></>}

                    <span className="text-gray-500">Additional km</span>
                    <span className="font-medium text-gray-800">{km} km</span>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Charges</p>
                  {additionalFreight > 0 && <div className="flex justify-between"><span className="text-gray-500">Freight</span><span className="font-medium">₹{additionalFreight.toLocaleString('en-IN')}</span></div>}
                  {estimatedToll > 0 && <div className="flex justify-between"><span className="text-gray-500">Toll</span><span className="font-medium">₹{estimatedToll.toLocaleString('en-IN')}</span></div>}
                  {driverAllowance > 0 && <div className="flex justify-between"><span className="text-gray-500">Driver Allowance</span><span className="font-medium">₹{driverAllowance.toLocaleString('en-IN')}</span></div>}
                  {otherCharges > 0 && <div className="flex justify-between"><span className="text-gray-500">Other</span><span className="font-medium">₹{otherCharges.toLocaleString('en-IN')}</span></div>}
                  <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-amber-700">
                    <span>Total</span>
                    <span>₹{totalDiversionCharges.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Charged To</span>
                    <span className="font-semibold text-gray-800 capitalize">
                      {costParty === 'split' ? `Split ${splitPercent}/${100 - splitPercent}` : costParty}
                    </span>
                  </div>
                  {billingNote && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Billing Note</span>
                      <span className="font-medium text-gray-700 text-right max-w-[200px]">{billingNote}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Manager Notification</span>
                    <span className={`font-medium ${notifyManager ? 'text-amber-600' : 'text-gray-400'}`}>{notifyManager ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
            <div>
              {step > 1 && (
                <Button variant="outline" size="sm" onClick={handleBack}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              )}
            </div>
            <div>
              {step < 4 ? (
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white border-none"
                  disabled={!canNext}
                  onClick={handleNext}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white border-none px-6"
                  isLoading={isSubmitting}
                  onClick={handleConfirm}
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" /> Confirm Diversion
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
