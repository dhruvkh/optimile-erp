import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Package, MapPin, Truck, Building2, CheckCircle,
  Clock, AlertTriangle, Navigation, ChevronRight, Eye, Calendar,
  Scale, IndianRupee, Filter, X, User, Phone, Hash, ArrowRight
} from 'lucide-react';
import { ptlStore } from '../../services/ptlStore';
import type { PTLDocket, DocketStatus } from '../../services/ptlTypes';

// ─── UI Atoms ────────────────────────────────────────────────────────────────

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>{children}</div>
);

const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'blue' }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700', green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700', gray: 'bg-gray-100 text-gray-600',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] ?? colors.blue}`}>{children}</span>;
};

// ─── Timeline Steps ───────────────────────────────────────────────────────────

const TIMELINE_STEPS: { status: DocketStatus; label: string; icon: React.FC<{ className?: string }> }[] = [
  { status: 'Created', label: 'Booking Created', icon: Hash },
  { status: 'Pickup Scheduled', label: 'Pickup Scheduled', icon: Calendar },
  { status: 'Picked Up', label: 'Picked Up', icon: Package },
  { status: 'At Origin Hub', label: 'At Origin Hub', icon: Building2 },
  { status: 'Manifested', label: 'Manifested for Dispatch', icon: CheckCircle },
  { status: 'In Transit', label: 'In Transit (Line Haul)', icon: Truck },
  { status: 'At Destination Hub', label: 'At Destination Hub', icon: Building2 },
  { status: 'Out for Delivery', label: 'Out for Delivery', icon: Navigation },
  { status: 'Delivered', label: 'Delivered', icon: CheckCircle },
];

const STATUS_ORDER: DocketStatus[] = [
  'Created', 'Pickup Scheduled', 'Picked Up', 'At Origin Hub', 'Manifested',
  'In Transit', 'At Destination Hub', 'Out for Delivery', 'Delivery Attempted',
  'Delivered', 'RTO Initiated', 'RTO Completed', 'Exception',
];

const STATUS_COLORS: Record<string, string> = {
  'Created': 'gray', 'Pickup Scheduled': 'blue', 'Picked Up': 'blue',
  'At Origin Hub': 'purple', 'Manifested': 'purple', 'In Transit': 'amber',
  'At Destination Hub': 'amber', 'Out for Delivery': 'green',
  'Delivery Attempted': 'red', 'Delivered': 'green',
  'RTO Initiated': 'red', 'RTO Completed': 'gray', 'Exception': 'red',
};

const FM_COLORS: Record<string, string> = {
  'Own': 'blue', 'Leased': 'purple', 'Market': 'amber', 'Carrier': 'green',
};

// ─── Docket Detail Panel ─────────────────────────────────────────────────────

const DocketDetailPanel: React.FC<{ docket: PTLDocket; onClose: () => void }> = ({ docket, onClose }) => {
  const currentStatusIdx = STATUS_ORDER.indexOf(docket.status);

  const getStepState = (step: typeof TIMELINE_STEPS[number]) => {
    const stepIdx = STATUS_ORDER.indexOf(step.status);
    if (docket.status === 'Delivered' || docket.status === 'RTO Completed') {
      if (step.status === 'Delivered') return 'done';
    }
    if (step.status === docket.status) return 'current';
    if (stepIdx < currentStatusIdx) return 'done';
    return 'pending';
  };

  const exceptions = ptlStore.getExceptionsForDocket(docket.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-end z-40">
      <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <div>
            <div className="font-mono text-lg font-bold text-blue-700">{docket.docketNumber}</div>
            <Badge color={STATUS_COLORS[docket.status] ?? 'gray'}>{docket.status}</Badge>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status Timeline */}
          {docket.status !== 'Exception' && docket.status !== 'RTO Initiated' && docket.status !== 'RTO Completed' && (
            <Card className="p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Journey Timeline</h4>
              <div className="space-y-3">
                {TIMELINE_STEPS.map((step, i) => {
                  const state = getStepState(step);
                  const Icon = step.icon;
                  return (
                    <div key={step.status} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${state === 'done' ? 'bg-green-100 text-green-600' : state === 'current' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-300'}`}>
                          {state === 'done' ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                        </div>
                        {i < TIMELINE_STEPS.length - 1 && <div className={`w-0.5 h-6 mt-1 ${state === 'done' ? 'bg-green-300' : 'bg-gray-200'}`} />}
                      </div>
                      <div className="pt-1">
                        <div className={`text-sm font-medium ${state === 'current' ? 'text-blue-700' : state === 'done' ? 'text-gray-700' : 'text-gray-300'}`}>
                          {step.label}
                        </div>
                        {state === 'current' && <div className="text-xs text-blue-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />Current status</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Exception or RTO */}
          {(docket.status === 'Exception' || docket.status === 'RTO Initiated') && (
            <Card className="p-4 border-red-200 bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="text-sm font-semibold text-red-700">{docket.status === 'Exception' ? 'Active Exception' : 'RTO Initiated'}</h4>
              </div>
              {docket.rtoReason && <p className="text-sm text-red-600">{docket.rtoReason}</p>}
              {exceptions.map(e => (
                <div key={e.id} className="mt-2 text-sm text-red-600">
                  <span className="font-medium">{e.type}:</span> {e.description}
                </div>
              ))}
            </Card>
          )}

          {/* Route Info */}
          <Card className="p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Route</h4>
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mt-1"></div>
                <div className="w-0.5 h-8 bg-gray-200 mt-1"></div>
                <div className="w-3 h-3 rounded-full bg-red-500 mt-1"></div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-800">{docket.pickupAddress}</div>
                  <div className="text-xs text-gray-500">{docket.pickupCity}, {docket.pickupState} {docket.pickupPincode}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1 mt-1"><User className="w-3 h-3" />{docket.pickupContact} · {docket.pickupPhone}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">{docket.deliveryAddress}</div>
                  <div className="text-xs text-gray-500">{docket.deliveryCity}, {docket.deliveryState} {docket.deliveryPincode}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1 mt-1"><User className="w-3 h-3" />{docket.deliveryContact} · {docket.deliveryPhone}</div>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
              <span>Origin Hub: <strong className="text-gray-700">{docket.originHubName}</strong></span>
              <span>Dest Hub: <strong className="text-gray-700">{docket.destinationHubName}</strong></span>
            </div>
          </Card>

          {/* Cargo */}
          <Card className="p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cargo</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Pieces', value: docket.totalPieces },
                { label: 'Actual Wt', value: `${docket.actualWeight} kg` },
                { label: 'Chargeable', value: `${docket.chargeableWeight} kg` },
              ].map(i => (
                <div key={i.label} className="bg-gray-50 rounded-lg p-2">
                  <div className="text-base font-bold text-gray-800">{i.value}</div>
                  <div className="text-xs text-gray-400">{i.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <span className="font-medium">Commodity:</span> {docket.commodityType}
              {docket.commodityDescription && <span className="text-gray-400"> — {docket.commodityDescription}</span>}
            </div>
            {docket.specialHandling.length > 0 && (
              <div className="mt-2 flex gap-1 flex-wrap">
                {docket.specialHandling.map(s => <span key={s} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">{s}</span>)}
              </div>
            )}
          </Card>

          {/* Fleet & Operations */}
          <Card className="p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Fleet & Operations</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Fleet Model</span><Badge color={FM_COLORS[docket.fleetModel]}>{docket.fleetModel}</Badge></div>
              {docket.carrierVendorName && <div className="flex justify-between"><span className="text-gray-500">Carrier</span><span className="font-medium">{docket.carrierVendorName}</span></div>}
              {docket.firstMileVehiclePlate && <div className="flex justify-between"><span className="text-gray-500">First Mile</span><span className="font-mono text-xs">{docket.firstMileVehiclePlate}</span></div>}
              {docket.manifestNumber && <div className="flex justify-between"><span className="text-gray-500">Manifest</span><span className="font-mono text-xs">{docket.manifestNumber}</span></div>}
              {docket.lineHaulVehiclePlate && <div className="flex justify-between"><span className="text-gray-500">Line Haul</span><span className="font-mono text-xs">{docket.lineHaulVehiclePlate}</span></div>}
              {docket.lastMileVehiclePlate && <div className="flex justify-between"><span className="text-gray-500">Last Mile</span><span className="font-mono text-xs">{docket.lastMileVehiclePlate}</span></div>}
              {docket.redeliveryAttempts && docket.redeliveryAttempts > 0 && (
                <div className="flex justify-between"><span className="text-gray-500">Redelivery Attempts</span><span className="font-medium text-amber-600">{docket.redeliveryAttempts}</span></div>
              )}
            </div>
          </Card>

          {/* Dates */}
          <Card className="p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Key Dates</h4>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Booking Date', value: docket.bookingDate },
                { label: 'Pickup Date', value: docket.pickupDate },
                { label: 'Actual Pickup', value: docket.actualPickupDate },
                { label: 'Promised Delivery', value: docket.promisedDeliveryDate },
                { label: 'Actual Delivery', value: docket.actualDeliveryDate },
              ].map(item => item.value && (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-500">{item.label}</span>
                  <span className={`font-medium ${item.label === 'Actual Delivery' && item.value > docket.promisedDeliveryDate ? 'text-red-600' : 'text-gray-700'}`}>{item.value}</span>
                </div>
              ))}
              {docket.eWayBillNumber && (
                <div className="flex justify-between"><span className="text-gray-500">eWay Bill</span><span className="font-mono text-xs">{docket.eWayBillNumber}</span></div>
              )}
            </div>
          </Card>

          {/* Charges */}
          <Card className="p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Charges</h4>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Base Freight', value: docket.baseFreightCharge },
                { label: 'ODA Charge', value: docket.odaCharge },
                { label: 'FOV (Insurance)', value: docket.fovCharge },
                { label: 'Docket Charge', value: docket.docketCharge },
                { label: 'Fuel Surcharge', value: docket.fuelSurcharge },
                { label: 'COD Charge', value: docket.codCharge },
                { label: 'DACC', value: docket.daccChargeAmount },
                { label: 'Appointment', value: docket.appointmentCharge },
                { label: 'Demurrage', value: docket.demurrageCharge },
                { label: 'Redelivery', value: docket.redeliveryChargeAmount },
              ].filter(i => i.value && i.value > 0).map(item => (
                <div key={item.label} className="flex justify-between text-xs">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="text-gray-700">₹{item.value!.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-green-700">₹{docket.totalClientCharges.toLocaleString()}</span>
              </div>
              {docket.paymentType && <div className="text-xs text-gray-400">Payment: {docket.paymentType}</div>}
            </div>
          </Card>

          {/* POD */}
          {(docket.status === 'Delivered' || docket.podUploaded) && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="text-sm font-semibold text-green-700">Proof of Delivery</h4>
              </div>
              <div className="text-sm text-green-600">Received by: <strong>{docket.receiverName ?? '—'}</strong></div>
              <div className="text-xs text-green-500">Delivery date: {docket.actualDeliveryDate ?? '—'}</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const PTLTracking: React.FC = () => {
  const navigate = useNavigate();
  const [dockets, setDockets] = useState(ptlStore.getDockets());
  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterClient, setFilterClient] = useState('All');
  const [selectedDocket, setSelectedDocket] = useState<PTLDocket | null>(null);

  useEffect(() => ptlStore.subscribe(() => setDockets(ptlStore.getDockets())), []);

  const clients = useMemo(() => ['All', ...Array.from(new Set(dockets.map(d => d.clientName)))], [dockets]);

  const filtered = useMemo(() => dockets.filter(d => {
    const matchStatus = filterStatus === 'All' || d.status === filterStatus;
    const matchClient = filterClient === 'All' || d.clientName === filterClient;
    const q = searchQ.toLowerCase();
    const matchSearch = !searchQ ||
      d.docketNumber.toLowerCase().includes(q) ||
      (d.lrNumber ?? '').toLowerCase().includes(q) ||
      d.clientName.toLowerCase().includes(q) ||
      d.pickupCity.toLowerCase().includes(q) ||
      d.deliveryCity.toLowerCase().includes(q);
    return matchStatus && matchClient && matchSearch;
  }), [dockets, filterStatus, filterClient, searchQ]);

  const ALL_STATUSES = ['All', 'Created', 'Pickup Scheduled', 'At Origin Hub', 'In Transit', 'At Destination Hub', 'Out for Delivery', 'Delivery Attempted', 'Delivered', 'Exception', 'RTO Initiated'];

  // Status bar counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    dockets.forEach(d => { counts[d.status] = (counts[d.status] ?? 0) + 1; });
    return counts;
  }, [dockets]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/tms/ptl/dashboard')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Navigation className="w-5 h-5 text-blue-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">PTL Tracking</h1>
            <p className="text-sm text-gray-500">Track dockets across the full lifecycle</p>
          </div>
        </div>
      </div>

      {/* Status summary strip */}
      <div className="bg-white border-b border-gray-100 px-6 py-2 flex gap-4 overflow-x-auto">
        {[
          { label: 'Active', count: dockets.filter(d => !['Delivered', 'RTO Completed'].includes(d.status)).length, color: 'text-blue-600' },
          { label: 'In Transit', count: statusCounts['In Transit'] ?? 0, color: 'text-amber-600' },
          { label: 'Out for Delivery', count: statusCounts['Out for Delivery'] ?? 0, color: 'text-green-600' },
          { label: 'Delivered', count: statusCounts['Delivered'] ?? 0, color: 'text-green-700' },
          { label: 'Exceptions', count: dockets.filter(d => d.status === 'Exception' || (d.exceptionIds && d.exceptionIds.length > 0)).length, color: 'text-red-600' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2 text-sm whitespace-nowrap">
            <span className="text-gray-400">{item.label}:</span>
            <span className={`font-bold ${item.color}`}>{item.count}</span>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="px-6 py-3 bg-white border-b border-gray-100 flex items-center gap-3 flex-wrap">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search by docket #, LR, client, city..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {searchQ && <button onClick={() => setSearchQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>}
        </div>
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          {clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex gap-1 flex-wrap">
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s} {s !== 'All' && statusCounts[s] ? `(${statusCounts[s]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Dockets table */}
      <div className="px-6 py-4">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Docket #', 'Client', 'Route', 'Cargo', 'Fleet', 'Dates', 'Charges', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    No dockets found
                  </td></tr>
                ) : filtered.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedDocket(d)}>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs font-bold text-blue-700">{d.docketNumber}</div>
                      {d.lrNumber && <div className="text-xs text-gray-400 font-mono">{d.lrNumber}</div>}
                      {d.eWayBillNumber && <div className="text-xs text-gray-300 font-mono">{d.eWayBillNumber}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{d.clientName}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-gray-700">
                        <MapPin className="w-3 h-3 text-green-500 flex-shrink-0" />{d.pickupCity}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />{d.deliveryCity}
                      </div>
                      <div className="text-xs text-gray-300 mt-0.5">{d.originHubName.replace(' Hub', '')} → {d.destinationHubName.replace(' Hub', '')}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div>{d.totalPieces} pcs</div>
                      <div>{d.chargeableWeight} kg</div>
                      <div className="text-gray-400">{d.commodityType}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={FM_COLORS[d.fleetModel]}>{d.fleetModel}</Badge>
                      {d.carrierVendorName && <div className="text-xs text-gray-400 mt-1">{d.carrierVendorName}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-gray-300" />{d.pickupDate}</div>
                      <div className={`flex items-center gap-1 mt-0.5 ${d.actualDeliveryDate && d.actualDeliveryDate > d.promisedDeliveryDate ? 'text-red-500' : ''}`}>
                        <Clock className="w-3 h-3 text-gray-300" />Promised: {d.promisedDeliveryDate}
                      </div>
                      {d.actualDeliveryDate && <div className="flex items-center gap-1 mt-0.5 text-green-600"><CheckCircle className="w-3 h-3" />Delivered: {d.actualDeliveryDate}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-semibold text-gray-800">₹{d.totalClientCharges.toLocaleString()}</div>
                      <div className="text-gray-400">{d.paymentType}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={STATUS_COLORS[d.status] ?? 'gray'}>{d.status}</Badge>
                      {d.exceptionIds && d.exceptionIds.length > 0 && (
                        <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                          <AlertTriangle className="w-3 h-3" />Exception
                        </div>
                      )}
                      {d.podUploaded && <div className="text-green-500 text-xs mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" />POD</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
              Showing {filtered.length} of {dockets.length} dockets
            </div>
          )}
        </Card>
      </div>

      {/* Detail panel */}
      {selectedDocket && <DocketDetailPanel docket={selectedDocket} onClose={() => setSelectedDocket(null)} />}
    </div>
  );
};
