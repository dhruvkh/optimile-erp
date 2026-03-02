import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Truck, Package, CheckCircle, AlertTriangle, Clock,
  MapPin, User, Phone, Calendar, Hash, IndianRupee, Search,
  Plus, X, RefreshCw, Camera, Upload, ChevronDown, Filter,
  AlertCircle, Building2, RotateCcw, ArrowRight
} from 'lucide-react';
import { useToast } from '../../../../shared/context/ToastContext';
import { ptlStore } from '../../services/ptlStore';
import { getDocketRevenue, getDocketCost } from '../../services/ptlBillingEngine';
import { INITIAL_HUBS } from '../../components/settings/HubMaster';
import type { PTLDocket } from '../../services/ptlTypes';
import { useFleetData } from '../../hooks/useFleetData';
import { FleetAssignmentPicker } from '../../components/FleetAssignmentPicker';
import type { FleetPickerValue } from '../../components/FleetAssignmentPicker';

// ─── UI Atoms ────────────────────────────────────────────────────────────────

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>{children}</div>
);

const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'blue' }) => {
  const colors: Record<string, string> = { blue: 'bg-blue-100 text-blue-700', green: 'bg-green-100 text-green-700', amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700', purple: 'bg-purple-100 text-purple-700', gray: 'bg-gray-100 text-gray-600' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] ?? colors.blue}`}>{children}</span>;
};

// ─── POD Modal ────────────────────────────────────────────────────────────────

interface PODModalProps { docket: PTLDocket; onClose: () => void; }

const PODModal: React.FC<PODModalProps> = ({ docket, onClose }) => {
  const { addToast } = useToast();
  const [receiverName, setReceiverName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [podNotes, setPodNotes] = useState('');

  const handleConfirmDelivery = () => {
    if (!receiverName) { addToast({ type: 'error', message: 'Receiver name is required' }); return; }
    const now = new Date().toISOString();
    ptlStore.updateDocket(docket.id, {
      status: 'Delivered', receiverName, podUploaded: true,
      actualDeliveryDate: deliveryDate, lastUpdatedAt: now,
    });
    // Push to finance bridge
    ptlStore.pushFinanceRevenue({
      docketId: docket.id, docketNumber: docket.docketNumber, lrNumber: docket.lrNumber,
      clientId: docket.clientId, clientName: docket.clientName, clientGSTIN: docket.clientGSTIN,
      pickupCity: docket.pickupCity, deliveryCity: docket.deliveryCity,
      chargeBreakdown: {
        freight: docket.baseFreightCharge, oda: docket.odaCharge, fov: docket.fovCharge,
        docket: docket.docketCharge, fuel: docket.fuelSurcharge,
        cod: docket.codCharge, dacc: docket.daccChargeAmount,
        appointment: docket.appointmentCharge, demurrage: docket.demurrageCharge,
        redelivery: docket.redeliveryChargeAmount,
      },
      totalRevenue: docket.totalClientCharges, chargeableWeight: docket.chargeableWeight,
      pieces: docket.totalPieces, deliveryDate, isInterstate: docket.isInterstate,
    });
    ptlStore.pushFinanceCost({
      docketId: docket.id, docketNumber: docket.docketNumber,
      fleetModel: docket.fleetModel,
      vendorId: docket.carrierVendorId, vendorName: docket.carrierVendorName,
      vehicleId: docket.assignedVehicleId,
      costBreakdown: {
        freight: docket.totalCarrierCost,
        fuel: docket.ownFleetFuelCost, driver: docket.ownFleetDriverCost,
        toll: docket.ownFleetTollCost, maintenance: docket.ownFleetMaintenanceCost,
      },
      totalCost: getDocketCost(docket),
      advancePaid: docket.carrierAdvancePaid,
    });
    addToast({ type: 'success', message: `Delivery confirmed for ${docket.docketNumber}` });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-800">Confirm Delivery — POD</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-blue-50 rounded-lg p-3 text-sm">
            <div className="font-mono font-semibold text-blue-700">{docket.docketNumber}</div>
            <div className="text-gray-600 text-xs mt-1">{docket.pickupCity} → {docket.deliveryCity} · {docket.clientName}</div>
          </div>

          {docket.paymentType === 'COD' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2">
              <IndianRupee className="w-4 h-4" />
              COD Collection: <strong>₹{(docket.codAmount ?? 0).toLocaleString()}</strong> — Ensure cash collected before POD
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Receiver Name *</label>
            <input value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="Full name of receiver"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Date</label>
            <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
            {deliveryDate > docket.promisedDeliveryDate && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Delivery is past promised date — exception may be raised</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
            <textarea value={podNotes} onChange={e => setPodNotes(e.target.value)} rows={2} placeholder="Any delivery remarks..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>
          <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2 text-sm text-gray-500">
            <Camera className="w-4 h-4" /> POD photo upload (simulated — click to mark POD as uploaded)
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleConfirmDelivery} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Confirm Delivery
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Redelivery Modal ─────────────────────────────────────────────────────────

interface RedeliveryModalProps { docket: PTLDocket; onClose: () => void; }

const FAILURE_REASONS = ['Consignee Not Available', 'Wrong Address', 'Refused Delivery', 'Office/Plant Closed', 'Address Not Found', 'Other'];

const RedeliveryModal: React.FC<RedeliveryModalProps> = ({ docket, onClose }) => {
  const { addToast } = useToast();
  const [reason, setReason] = useState('');
  const [nextAttemptDate, setNextAttemptDate] = useState('');
  const [nextAttemptTime, setNextAttemptTime] = useState('');

  const attempts = (docket.redeliveryAttempts ?? 0) + 1;
  const isRTOThreshold = attempts >= 3;

  const handleSchedule = () => {
    if (!reason) { addToast({ type: 'error', message: 'Select a failure reason' }); return; }
    if (isRTOThreshold) {
      ptlStore.updateDocket(docket.id, {
        status: 'RTO Initiated',
        redeliveryAttempts: attempts,
        redeliveryReason: reason,
        rtoReason: `${attempts} delivery attempts failed — initiating Return To Origin`,
      });
      addToast({ type: 'warning', message: `3 attempts failed — RTO initiated for ${docket.docketNumber}` });
    } else {
      ptlStore.updateDocket(docket.id, {
        status: 'Delivery Attempted',
        redeliveryAttempts: attempts,
        redeliveryReason: reason,
        redeliveryChargeAmount: (docket.redeliveryChargeAmount ?? 0) + 300,
      });
      addToast({ type: 'success', message: `Redelivery scheduled (attempt ${attempts})` });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-800">Failed Delivery — Attempt {attempts}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-4 space-y-4">
          {isRTOThreshold && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              This is the 3rd delivery attempt. Confirming failure will initiate RTO (Return To Origin).
            </div>
          )}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <span className="font-mono font-semibold text-blue-700">{docket.docketNumber}</span>
            <span className="text-gray-400 ml-2">Previous attempts: {docket.redeliveryAttempts ?? 0}</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Failure Reason *</label>
            <div className="space-y-1">
              {FAILURE_REASONS.map(r => (
                <label key={r} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm ${reason === r ? 'bg-blue-50 border border-blue-200' : 'border border-gray-100 hover:bg-gray-50'}`}>
                  <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
                  {r}
                </label>
              ))}
            </div>
          </div>
          {!isRTOThreshold && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Next Attempt Date</label>
                <input type="date" value={nextAttemptDate} onChange={e => setNextAttemptDate(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Time Slot</label>
                <select value={nextAttemptTime} onChange={e => setNextAttemptTime(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Any time</option>
                  <option>Morning (9–12)</option>
                  <option>Afternoon (12–4)</option>
                  <option>Evening (4–7)</option>
                </select>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSchedule}
            className={`px-4 py-2 text-sm text-white rounded-lg flex items-center gap-2 ${isRTOThreshold ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
            {isRTOThreshold ? <><RotateCcw className="w-4 h-4" /> Initiate RTO</> : <><RefreshCw className="w-4 h-4" /> Schedule Redelivery</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Assign Last Mile Modal ───────────────────────────────────────────────────

interface AssignLastMileModalProps { docket: PTLDocket; onClose: () => void; }

const AssignLastMileModal: React.FC<AssignLastMileModalProps> = ({ docket, onClose }) => {
  const { addToast } = useToast();
  const { vehicles, drivers, loading: fleetLoading } = useFleetData();
  const [fleetPick, setFleetPick] = useState<FleetPickerValue>({ vehicleId: '', vehiclePlate: '', driverId: '', driverName: '' });

  const handleAssign = () => {
    if (!fleetPick.vehiclePlate || !fleetPick.driverName) {
      addToast({ type: 'error', message: 'Select vehicle and driver from fleet' }); return;
    }
    ptlStore.updateDocket(docket.id, {
      status: 'Out for Delivery',
      lastMileVehicleId: fleetPick.vehicleId || undefined,
      lastMileVehiclePlate: fleetPick.vehiclePlate,
      lastMileDriverName: fleetPick.driverName,
      destinationHubOutwardTime: new Date().toISOString(),
    });
    addToast({ type: 'success', message: `${docket.docketNumber} dispatched for last mile delivery` });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-800">Assign Last Mile Vehicle</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-gray-50 rounded-lg p-2 text-sm font-mono text-blue-700">{docket.docketNumber}</div>
          <FleetAssignmentPicker
            label="Last Mile — Vehicle & Driver"
            vehicles={vehicles}
            drivers={drivers}
            loading={fleetLoading}
            value={fleetPick}
            onChange={setFleetPick}
          />
        </div>
        <div className="p-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleAssign} disabled={!fleetPick.vehiclePlate || !fleetPick.driverName}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
            Dispatch
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

type DeliveryTab = 'queue' | 'active' | 'attempted' | 'cod' | 'appointment';

export const PTLDelivery: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [dockets, setDockets] = useState(ptlStore.getDockets());
  const [tab, setTab] = useState<DeliveryTab>('queue');
  const [selectedHubId, setSelectedHubId] = useState(INITIAL_HUBS[0].id);
  const [searchQ, setSearchQ] = useState('');
  const [podDocket, setPodDocket] = useState<PTLDocket | null>(null);
  const [redeliveryDocket, setRedeliveryDocket] = useState<PTLDocket | null>(null);
  const [assignDocket, setAssignDocket] = useState<PTLDocket | null>(null);

  useEffect(() => ptlStore.subscribe(() => setDockets(ptlStore.getDockets())), []);

  const filterBySearch = (items: PTLDocket[]) => !searchQ ? items : items.filter(d =>
    d.docketNumber.toLowerCase().includes(searchQ.toLowerCase()) ||
    d.clientName.toLowerCase().includes(searchQ.toLowerCase()) ||
    d.deliveryCity.toLowerCase().includes(searchQ.toLowerCase())
  );

  // Queues
  const deliveryQueue = useMemo(() =>
    dockets.filter(d => d.destinationHubId === selectedHubId && d.status === 'At Destination Hub'), [dockets, selectedHubId]);

  const activeDeliveries = useMemo(() =>
    dockets.filter(d => d.destinationHubId === selectedHubId && d.status === 'Out for Delivery'), [dockets, selectedHubId]);

  const failedAttempts = useMemo(() =>
    dockets.filter(d => d.destinationHubId === selectedHubId && ['Delivery Attempted', 'RTO Initiated'].includes(d.status)), [dockets, selectedHubId]);

  const codDockets = useMemo(() =>
    dockets.filter(d => d.destinationHubId === selectedHubId && d.paymentType === 'COD' && ['At Destination Hub', 'Out for Delivery', 'Delivered'].includes(d.status)), [dockets, selectedHubId]);

  const appointmentDockets = useMemo(() =>
    dockets.filter(d => d.destinationHubId === selectedHubId && d.appointmentDelivery && ['At Destination Hub', 'Out for Delivery'].includes(d.status)), [dockets, selectedHubId]);

  const TABS = [
    { key: 'queue' as const, label: 'Delivery Queue', count: deliveryQueue.length },
    { key: 'active' as const, label: 'Active Deliveries', count: activeDeliveries.length },
    { key: 'attempted' as const, label: 'Failed / RTO', count: failedAttempts.length },
    { key: 'cod' as const, label: 'COD Collection', count: codDockets.length },
    { key: 'appointment' as const, label: 'Appointment', count: appointmentDockets.length },
  ];

  const renderDocketRow = (d: PTLDocket, mode: 'queue' | 'active' | 'attempted' | 'cod' | 'appt') => (
    <tr key={d.id} className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="font-mono text-xs font-bold text-blue-700">{d.docketNumber}</div>
        <div className="text-xs text-gray-400">{d.clientName}</div>
      </td>
      <td className="px-4 py-3 text-xs text-gray-600">
        <div className="font-medium">{d.deliveryAddress}</div>
        <div className="text-gray-400">{d.deliveryCity}, {d.deliveryState}</div>
        <div className="flex items-center gap-1 mt-1"><User className="w-3 h-3 text-gray-300" />{d.deliveryContact} · {d.deliveryPhone}</div>
      </td>
      <td className="px-4 py-3 text-xs text-gray-600">
        {d.totalPieces} pcs · {d.chargeableWeight} kg
        {d.specialHandling.length > 0 && <div className="text-amber-600 text-xs">{d.specialHandling.join(', ')}</div>}
      </td>
      {mode === 'cod' && (
        <td className="px-4 py-3">
          <div className="font-semibold text-amber-700">₹{(d.codAmount ?? 0).toLocaleString()}</div>
          <div className="text-xs text-gray-400">COD</div>
        </td>
      )}
      {mode === 'appt' && (
        <td className="px-4 py-3 text-xs text-gray-600">
          {d.appointmentDatetime ? new Date(d.appointmentDatetime).toLocaleString() : '—'}
        </td>
      )}
      <td className="px-4 py-3">
        {mode === 'queue' && (
          <button onClick={() => setAssignDocket(d)} className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 mr-2">
            <Truck className="w-3 h-3" /> Assign & Dispatch
          </button>
        )}
        {mode === 'active' && (
          <div className="flex gap-1">
            <button onClick={() => setPodDocket(d)} className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
              <CheckCircle className="w-3 h-3" /> POD
            </button>
            <button onClick={() => setRedeliveryDocket(d)} className="flex items-center gap-1 text-xs bg-amber-500 text-white px-2 py-1 rounded hover:bg-amber-600">
              <AlertTriangle className="w-3 h-3" /> Failed
            </button>
          </div>
        )}
        {mode === 'attempted' && (
          <div>
            <Badge color={d.status === 'RTO Initiated' ? 'red' : 'amber'}>{d.status}</Badge>
            <div className="text-xs text-gray-400 mt-1">Attempts: {d.redeliveryAttempts}</div>
            {d.status === 'Delivery Attempted' && (
              <button onClick={() => setAssignDocket(d)} className="mt-1 flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                <RefreshCw className="w-3 h-3" /> Re-dispatch
              </button>
            )}
          </div>
        )}
        {mode === 'cod' && (
          <Badge color={d.status === 'Delivered' ? 'green' : 'amber'}>{d.status === 'Delivered' ? 'COD Collected' : d.status}</Badge>
        )}
        {mode === 'appt' && (
          <button onClick={() => setAssignDocket(d)} className="flex items-center gap-1 text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700">
            <Calendar className="w-3 h-3" /> Dispatch
          </button>
        )}
      </td>
    </tr>
  );

  const getHeaders = (mode: 'queue' | 'active' | 'attempted' | 'cod' | 'appt') => {
    const base = ['Docket #', 'Delivery Address', 'Cargo'];
    if (mode === 'cod') return [...base, 'COD Amount', 'Action'];
    if (mode === 'appt') return [...base, 'Appointment Slot', 'Action'];
    return [...base, 'Action'];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/tms/ptl/dashboard')} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
            <Truck className="w-5 h-5 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Delivery Management</h1>
              <p className="text-sm text-gray-500">Last mile, POD, redelivery & COD</p>
            </div>
          </div>
          <select value={selectedHubId} onChange={e => setSelectedHubId(e.target.value)}
            className="text-sm font-medium border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            {INITIAL_HUBS.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="bg-white border-b border-gray-100 px-6 py-2 flex gap-6 text-sm">
        {[
          { label: 'In Queue', value: deliveryQueue.length, color: 'text-blue-600' },
          { label: 'Out for Delivery', value: activeDeliveries.length, color: 'text-amber-600' },
          { label: 'Failed Attempts', value: failedAttempts.length, color: 'text-red-600' },
          { label: 'COD Pending', value: codDockets.filter(d => d.status !== 'Delivered').length, color: 'text-amber-700' },
          { label: 'Appointment', value: appointmentDockets.length, color: 'text-purple-600' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-gray-400">{item.label}:</span>
            <span className={`font-semibold ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 flex gap-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
            {t.count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="px-6 py-4">
        {/* Search */}
        <div className="relative w-64 mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Tables per tab */}
        {tab === 'queue' && (
          <Card>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">{getHeaders('queue').map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filterBySearch(deliveryQueue).length === 0 ? <tr><td colSpan={4} className="text-center py-10 text-gray-400">No dockets in delivery queue</td></tr>
                  : filterBySearch(deliveryQueue).map(d => renderDocketRow(d, 'queue'))}
              </tbody>
            </table>
          </Card>
        )}

        {tab === 'active' && (
          <Card>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">{getHeaders('active').map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filterBySearch(activeDeliveries).length === 0 ? <tr><td colSpan={4} className="text-center py-10 text-gray-400">No active deliveries</td></tr>
                  : filterBySearch(activeDeliveries).map(d => renderDocketRow(d, 'active'))}
              </tbody>
            </table>
          </Card>
        )}

        {tab === 'attempted' && (
          <Card>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">{getHeaders('attempted').map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filterBySearch(failedAttempts).length === 0 ? <tr><td colSpan={4} className="text-center py-10 text-gray-400">No failed deliveries</td></tr>
                  : filterBySearch(failedAttempts).map(d => renderDocketRow(d, 'attempted'))}
              </tbody>
            </table>
          </Card>
        )}

        {tab === 'cod' && (
          <Card>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">{getHeaders('cod').map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filterBySearch(codDockets).length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">No COD dockets</td></tr>
                  : filterBySearch(codDockets).map(d => renderDocketRow(d, 'cod'))}
              </tbody>
            </table>
            {codDockets.length > 0 && (
              <div className="px-4 py-2 border-t bg-amber-50 text-sm text-amber-700">
                Total COD pending: ₹{codDockets.filter(d => d.status !== 'Delivered').reduce((s, d) => s + (d.codAmount ?? 0), 0).toLocaleString()}
              </div>
            )}
          </Card>
        )}

        {tab === 'appointment' && (
          <Card>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">{getHeaders('appt').map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filterBySearch(appointmentDockets).length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">No appointment deliveries</td></tr>
                  : filterBySearch(appointmentDockets).map(d => renderDocketRow(d, 'appt'))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {podDocket && <PODModal docket={podDocket} onClose={() => setPodDocket(null)} />}
      {redeliveryDocket && <RedeliveryModal docket={redeliveryDocket} onClose={() => setRedeliveryDocket(null)} />}
      {assignDocket && <AssignLastMileModal docket={assignDocket} onClose={() => setAssignDocket(null)} />}
    </div>
  );
};
