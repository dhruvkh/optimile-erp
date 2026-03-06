
import React, { useState, useEffect } from 'react';
import {
  X, MapPin, Calendar, Truck, User, FileText, Activity, DollarSign,
  Clock, Phone, MessageSquare, AlertTriangle, CheckCircle,
  Navigation, Layers, Lock, ShieldAlert, Download, RefreshCw,
  Star, Search, Zap, Package, ArrowRight, ChevronRight, CornerDownRight,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { TripTimeline } from './TripTimeline';
import { StatusUpdateModal } from './StatusUpdateModal';
import { TripClosureModal } from './TripClosureModal';
import { TripExpenses } from './TripExpenses';
import { TripClaims } from './TripClaims';
import { TripDataFull, TripStatusCode, TripCheckpoint } from './types';
import { useOperationalData } from '../../../../../shared/context/OperationalDataContext';
import { CompletedTrip, SharedVehicle } from '../../../../../shared/context/OperationalDataStore';
import { useNavigate } from 'react-router-dom';
import { ReportIssueModal } from './ReportIssueModal';
import { DeliveryDiversionModal } from './DeliveryDiversionModal';
import { exceptionManager, ExceptionCategory, ExceptionSeverity } from '../../../../../shared/services/exceptionManager';

interface TripDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string | null;
}

// Map CompletedTrip.status → TripStatusCode
function mapStatus(status: CompletedTrip['status']): TripStatusCode {
  switch (status) {
    case 'booked': return 'INDENT_RECEIVED';
    case 'in_transit': return 'IN_TRANSIT';
    case 'delivered': return 'REACHED_DESTINATION';
    case 'pod_received': return 'POD_SOFT_UPLOADED';
    case 'invoiced': return 'TRIP_CLOSED';
    default: return 'INDENT_RECEIVED';
  }
}

// Build the baseline timeline from a CompletedTrip
function buildBaseTimeline(trip: CompletedTrip): TripCheckpoint[] {
  const pts: TripCheckpoint[] = [
    {
      id: 'cp-base-1',
      status: 'INDENT_RECEIVED',
      timestamp: trip.bookedDate,
      locationName: 'System HQ',
      capturedBy: { id: 'sys', name: 'System', role: 'System' },
    },
  ];

  if (trip.status !== 'booked') {
    pts.push({
      id: 'cp-base-2',
      status: 'VEHICLE_ASSIGNED',
      timestamp: trip.dispatchDate || trip.bookedDate,
      locationName: trip.origin,
      capturedBy: { id: 'ops', name: 'Ops', role: 'Manager' },
      data: { vehicle: trip.vehicleRegNumber || 'TBD', driver: trip.driverName || 'TBD' },
    });
    pts.push({
      id: 'cp-base-3',
      status: 'DISPATCHED',
      timestamp: trip.dispatchDate || trip.bookedDate,
      locationName: trip.origin,
      capturedBy: { id: 'ops', name: 'Ops', role: 'Supervisor' },
    });
  }

  if (['delivered', 'pod_received', 'invoiced'].includes(trip.status)) {
    pts.push({
      id: 'cp-base-4',
      status: 'REACHED_DESTINATION',
      timestamp: trip.deliveredDate || trip.bookedDate,
      locationName: trip.destination,
      capturedBy: { id: 'sys', name: 'System', role: 'System' },
    });
  }

  if (['pod_received', 'invoiced'].includes(trip.status)) {
    pts.push({
      id: 'cp-base-5',
      status: 'POD_SOFT_UPLOADED',
      timestamp: trip.podReceivedDate || trip.deliveredDate || trip.bookedDate,
      locationName: trip.destination,
      capturedBy: { id: 'sys', name: 'System', role: 'System' },
    });
  }

  if (trip.status === 'invoiced') {
    pts.push({
      id: 'cp-base-6',
      status: 'TRIP_CLOSED',
      timestamp: trip.podReceivedDate || trip.bookedDate,
      locationName: 'System HQ',
      capturedBy: { id: 'sys', name: 'Finance', role: 'Finance' },
    });
  }

  return pts;
}

// ── Inline Vehicle Assignment Panel ────────────────────────────────────────
interface VehicleAssignPanelProps {
  trip: CompletedTrip;
  onAssigned: () => void;
  onCancel: () => void;
}

const VehicleAssignPanel: React.FC<VehicleAssignPanelProps> = ({ trip, onAssigned, onCancel }) => {
  const { vehicles, vendors, assignVehicle, assignMarketHireVehicle } = useOperationalData();
  const [mode, setMode] = useState<'own' | 'market'>(
    trip.tripType === 'market_hire' || trip.tripType === 'contracted_vendor' ? 'market' : 'own'
  );
  // Own fleet state
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [driverNote, setDriverNote] = useState('');
  const [notifyDriver, setNotifyDriver] = useState(true);
  const [notifyClient, setNotifyClient] = useState(true);
  // Market hire state
  const [mktVendorId, setMktVendorId] = useState('');
  const [mktRegNumber, setMktRegNumber] = useState('');
  const [mktDriverName, setMktDriverName] = useState('');
  const [mktDriverPhone, setMktDriverPhone] = useState('');
  const [mktFreight, setMktFreight] = useState<number>(trip.revenueAmount ? Math.round(trip.revenueAmount * 0.75) : 0);
  const [mktError, setMktError] = useState('');

  const available = vehicles.filter(v => v.status === 'available');
  const filtered = available.filter(v =>
    v.regNumber.toLowerCase().includes(search.toLowerCase()) ||
    (v.driverName || '').toLowerCase().includes(search.toLowerCase()) ||
    v.type.toLowerCase().includes(search.toLowerCase())
  );
  const selected = vehicles.find(v => v.id === selectedId);
  const activeVendors = vendors.filter(v => v.status === 'Active');

  const handleConfirm = () => {
    if (!selectedId) return;
    assignVehicle(trip.id, selectedId);
    onAssigned();
  };

  const handleMarketHireConfirm = () => {
    if (!mktVendorId) { setMktError('Please select a vendor.'); return; }
    if (!mktRegNumber.trim()) { setMktError('Please enter the vehicle registration number.'); return; }
    if (!mktFreight || mktFreight <= 0) { setMktError('Please enter the agreed freight amount.'); return; }
    setMktError('');
    assignMarketHireVehicle(trip.id, mktVendorId, mktRegNumber.trim(), mktDriverName.trim(), mktDriverPhone.trim(), mktFreight);
    onAssigned();
  };

  if (confirming && selected) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-bold text-blue-600 uppercase mb-3">Assignment Summary</p>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-gray-500">Trip ID</span>
            <span className="font-semibold text-gray-900">{trip.id}</span>
            <span className="text-gray-500">Client</span>
            <span className="font-semibold text-gray-900">{trip.clientName}</span>
            <span className="text-gray-500">Route</span>
            <span className="font-semibold text-gray-900">{trip.origin} → {trip.destination}</span>
            <span className="text-gray-500">Vehicle</span>
            <span className="font-semibold text-primary">{selected.regNumber}</span>
            <span className="text-gray-500">Model</span>
            <span className="font-semibold text-gray-900">{selected.model}</span>
            <span className="text-gray-500">Driver</span>
            <span className="font-semibold text-gray-900">{selected.driverName || 'TBD'}</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={notifyDriver} onChange={e => setNotifyDriver(e.target.checked)} className="rounded accent-primary" />
            Notify driver via SMS
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={notifyClient} onChange={e => setNotifyClient(e.target.checked)} className="rounded accent-primary" />
            Send confirmation to client
          </label>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Driver Instructions (optional)</label>
          <textarea
            className="w-full border border-gray-200 rounded-lg text-sm p-2.5 focus:ring-1 focus:ring-primary focus:border-primary resize-none"
            rows={2}
            placeholder="e.g. Report to gate B at 9 AM..."
            value={driverNote}
            onChange={e => setDriverNote(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)}>Back</Button>
          <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleConfirm}>
            <CheckCircle className="h-4 w-4 mr-1.5" /> Confirm Assignment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mode Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
        <button
          onClick={() => setMode('own')}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${mode === 'own' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Own Fleet
        </button>
        <button
          onClick={() => setMode('market')}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${mode === 'market' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Market Hire
        </button>
      </div>

      {mode === 'own' ? (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by vehicle no. or driver..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Vehicle List */}
          {available.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Truck className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium">No vehicles available right now</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">No matches for "{search}"</div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {filtered.map((v, idx) => {
                const isSelected = selectedId === v.id;
                const matchScore = idx === 0 ? 95 : idx === 1 ? 78 : Math.max(40, 70 - idx * 8);
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedId(isSelected ? null : v.id)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      isSelected ? 'border-primary bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                          <Truck className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{v.regNumber}</p>
                          <p className="text-xs text-gray-500">{v.model} • {v.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {matchScore >= 80 && (
                          <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                            {matchScore}% match
                          </span>
                        )}
                        {v.driverName && <p className="text-xs text-gray-500 mt-0.5">{v.driverName}</p>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
            <Button className="flex-1" disabled={!selectedId} onClick={() => setConfirming(true)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </>
      ) : (
        /* ── Market Hire Form ── */
        <div className="space-y-3">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700 font-medium">
            Enter the details of the market hire transporter. The agreed freight amount will be tracked in the Vendor Ledger.
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Transport Vendor *</label>
            <select
              value={mktVendorId}
              onChange={e => setMktVendorId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">— Select vendor —</option>
              {activeVendors.map(v => (
                <option key={v.id} value={v.id}>{v.name} {v.hasContract ? '(Contract)' : '(Spot)'}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle Reg. No. *</label>
              <input
                type="text"
                placeholder="e.g. MH-04-AB-1234"
                value={mktRegNumber}
                onChange={e => setMktRegNumber(e.target.value.toUpperCase())}
                className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Agreed Freight (₹) *</label>
              <input
                type="number"
                placeholder="0"
                value={mktFreight || ''}
                onChange={e => setMktFreight(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Driver Name</label>
              <input
                type="text"
                placeholder="Driver name"
                value={mktDriverName}
                onChange={e => setMktDriverName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Driver Phone</label>
              <input
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={mktDriverPhone}
                onChange={e => setMktDriverPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {mktFreight > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 grid grid-cols-2 gap-2">
              <div>
                <span className="font-semibold text-gray-700">Advance (30%):</span>
                <span className="ml-1">₹{Math.round(mktFreight * 0.3).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Balance (70%):</span>
                <span className="ml-1">₹{Math.round(mktFreight * 0.7).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {mktError && <p className="text-red-500 text-xs">{mktError}</p>}

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
            <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleMarketHireConfirm}>
              <Truck className="h-4 w-4 mr-1.5" /> Assign Market Hire
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Status colour helpers ───────────────────────────────────────────────────
function statusStyle(s: TripStatusCode) {
  if (s === 'TRIP_CLOSED') return { bg: 'bg-gray-700', text: 'text-white', dot: 'bg-gray-400' };
  if (['POD_SOFT_UPLOADED', 'POD_HARD_RECEIVED'].includes(s)) return { bg: 'bg-teal-600', text: 'text-white', dot: 'bg-teal-300' };
  if (['REACHED_DESTINATION', 'UNLOADING_STARTED', 'UNLOADING_COMPLETED'].includes(s)) return { bg: 'bg-green-600', text: 'text-white', dot: 'bg-green-300' };
  if (s === 'IN_TRANSIT') return { bg: 'bg-blue-600', text: 'text-white', dot: 'bg-blue-300' };
  if (s === 'DELIVERY_DIVERTED') return { bg: 'bg-amber-500', text: 'text-white', dot: 'bg-amber-200' };
  if (['VEHICLE_ASSIGNED', 'DISPATCHED'].includes(s)) return { bg: 'bg-indigo-600', text: 'text-white', dot: 'bg-indigo-300' };
  return { bg: 'bg-amber-500', text: 'text-white', dot: 'bg-amber-300' }; // INDENT_RECEIVED
}

// ── Main Component ──────────────────────────────────────────────────────────
export const TripDetailsModal: React.FC<TripDetailsModalProps> = ({ isOpen, onClose, tripId }) => {
  const navigate = useNavigate();
  const { completedTrips, markDelivered, markPodReceived, updateTripStatus } = useOperationalData();

  const [activeTab, setActiveTab] = useState('timeline');
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isClosureModalOpen, setClosureModalOpen] = useState(false);
  const [isReportIssueOpen, setReportIssueOpen] = useState(false);
  const [isDiversionOpen, setDiversionOpen] = useState(false);
  const [isAssignVehicleOpen, setAssignVehicleOpen] = useState(false);

  const [localStatus, setLocalStatus] = useState<TripStatusCode | null>(null);
  const [localCheckpoints, setLocalCheckpoints] = useState<TripCheckpoint[]>([]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('timeline');
      setLocalStatus(null);
      setLocalCheckpoints([]);
      setUpdateModalOpen(false);
      setClosureModalOpen(false);
      setReportIssueOpen(false);
      setDiversionOpen(false);
      setAssignVehicleOpen(false);
    }
  }, [isOpen, tripId]);

  if (!isOpen || !tripId) return null;

  const baseTrip = completedTrips.find(t => t.id === tripId) ?? null;

  if (!baseTrip) {
    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto" role="dialog" aria-modal="true">
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
          <div className="relative bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Trip Not Found</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Trip ID: {tripId}</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  const baseTimeline = buildBaseTimeline(baseTrip);
  const fullTimeline: TripCheckpoint[] = [...baseTimeline, ...localCheckpoints];

  const contextStatus = mapStatus(baseTrip.status);
  const currentStatus: TripStatusCode = localStatus ?? contextStatus;
  const sStyle = statusStyle(currentStatus);

  const isBooked = baseTrip.status === 'booked';
  const isUnassigned = !baseTrip.vehicleId || baseTrip.vehicleRegNumber === 'Unassigned';

  const tripData: TripDataFull = {
    tripId: baseTrip.id,
    currentStatus,
    sla: { onTimeCheckpoints: fullTimeline.length, delayedCheckpoints: 0, overallStatus: 'On Track' },
    timeline: fullTimeline,
  };

  const handleStatusUpdate = (newStatus: TripStatusCode, data: any) => {
    if (newStatus === 'DISPATCHED') {
      updateTripStatus(tripId, 'in_transit');
    } else if (['REACHED_DESTINATION', 'UNLOADING_STARTED', 'UNLOADING_COMPLETED'].includes(newStatus)) {
      markDelivered(tripId);
    } else if (['POD_SOFT_UPLOADED', 'POD_HARD_RECEIVED'].includes(newStatus)) {
      markPodReceived(tripId, true);
    }
    const newCheckpoint: TripCheckpoint = {
      id: `cp-local-${Date.now()}`,
      status: newStatus,
      timestamp: new Date().toISOString(),
      locationName: data.location || 'Current Location',
      capturedBy: { id: 'curr', name: 'Current User', role: 'Operator' },
      data: { ...data },
      evidence: data.photos?.length ? { photos: data.photos } : undefined,
    };
    setLocalStatus(newStatus);
    setLocalCheckpoints(prev => [...prev, newCheckpoint]);
    setUpdateModalOpen(false);
  };

  const handleClosureSuccess = () => {
    handleStatusUpdate('TRIP_CLOSED', { location: 'System', notes: 'Closed via Finance Sync' });
  };

  const handleVehicleAssigned = () => {
    // Trip status in context is now 'in_transit'; reflect locally
    setLocalStatus('VEHICLE_ASSIGNED');
    setAssignVehicleOpen(false);
  };

  // ── Tab definitions ─────────────────────────────────────────────────────
  const tabs = [
    { id: 'timeline', label: 'Timeline', icon: Layers },
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'route', label: 'Route Map', icon: Navigation },
    { id: 'docs', label: 'Documents', icon: FileText },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'claims', label: 'Claims', icon: ShieldAlert },
  ];

  // ── Overview Tab ─────────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-sm">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Status</p>
          <p className="text-base font-bold mt-1 leading-tight">{currentStatus.replace(/_/g, ' ')}</p>
          <div className={`w-2 h-2 rounded-full ${sStyle.dot} mt-2`} />
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-sm">
          <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wide">Distance</p>
          <p className="text-2xl font-bold mt-1">{baseTrip.distanceKm}<span className="text-sm font-normal ml-1">km</span></p>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-4 text-white shadow-sm">
          <p className="text-violet-200 text-xs font-semibold uppercase tracking-wide">Revenue</p>
          <p className="text-lg font-bold mt-1">₹{(baseTrip.revenueAmount / 1000).toFixed(0)}K</p>
        </div>
      </div>

      {/* Route Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg"><MapPin className="h-4 w-4 text-blue-500" /></div>
          Route
        </h4>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 ring-2 ring-green-200" />
                <div className="w-0.5 h-8 bg-gradient-to-b from-green-400 to-gray-300 my-1" />
                <div className="w-3 h-3 rounded-full bg-gray-400 ring-2 ring-gray-200" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-gray-400 font-medium">ORIGIN</p>
                  <p className="font-bold text-gray-900">{baseTrip.origin}</p>
                  <p className="text-xs text-gray-400">{baseTrip.bookedDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">DESTINATION</p>
                  <p className="font-bold text-gray-900">{baseTrip.destination}</p>
                  {baseTrip.deliveredDate && (
                    <p className="text-xs text-gray-400">Delivered: {baseTrip.deliveredDate}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="text-right border-l border-gray-100 pl-4">
            <p className="text-xs text-gray-400">Mode</p>
            <p className="font-bold text-gray-700 text-sm mt-0.5">{baseTrip.bookingMode}</p>
            <p className="text-xs text-gray-400 mt-2">Type</p>
            <p className="font-medium text-gray-600 text-xs mt-0.5">{baseTrip.tripType.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </div>

      {/* Driver & Vehicle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Driver Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-800">Driver</h4>
            {baseTrip.driverPhone && (
              <a
                href={`tel:${baseTrip.driverPhone}`}
                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
              {baseTrip.driverName && baseTrip.driverName !== 'Unassigned'
                ? baseTrip.driverName.charAt(0)
                : <User className="h-5 w-5" />}
            </div>
            <div>
              <p className={`font-semibold ${!baseTrip.driverName || baseTrip.driverName === 'Unassigned' ? 'text-amber-600 italic' : 'text-gray-900'}`}>
                {baseTrip.driverName || 'Unassigned'}
              </p>
              {baseTrip.driverPhone && <p className="text-xs text-gray-400">{baseTrip.driverPhone}</p>}
            </div>
          </div>
        </div>

        {/* Vehicle Card */}
        <div className={`rounded-2xl border p-4 shadow-sm ${isBooked && isUnassigned ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-800">Vehicle</h4>
            {(isBooked && isUnassigned) && (
              <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                Needs Assignment
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${isBooked && isUnassigned ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-primary'}`}>
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className={`font-semibold ${isBooked && isUnassigned ? 'text-amber-600 italic' : 'text-gray-900'}`}>
                {baseTrip.vehicleRegNumber || 'Unassigned'}
              </p>
              <p className="text-xs text-gray-400">{baseTrip.bookingMode} · {baseTrip.tripType.replace(/_/g, ' ')}</p>
            </div>
          </div>
          {(isBooked && isUnassigned) && (
            <button
              onClick={() => { setAssignVehicleOpen(true); setActiveTab('overview'); }}
              className="mt-3 w-full text-xs font-semibold text-primary border border-primary/30 bg-white hover:bg-blue-50 rounded-lg py-1.5 transition-colors"
            >
              + Assign Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Financials */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <div className="p-1.5 bg-green-50 rounded-lg"><DollarSign className="h-4 w-4 text-green-500" /></div>
          Financials
        </h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-400 font-medium">Revenue</p>
            <p className="font-bold text-gray-900 mt-1">₹{baseTrip.revenueAmount.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Est. Cost</p>
            <p className="font-bold text-gray-900 mt-1">₹{baseTrip.totalCost.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Margin</p>
            <p className={`font-bold mt-1 ${baseTrip.revenueAmount > baseTrip.totalCost ? 'text-green-600' : 'text-red-500'}`}>
              {baseTrip.revenueAmount > 0
                ? `${(((baseTrip.revenueAmount - baseTrip.totalCost) / baseTrip.revenueAmount) * 100).toFixed(0)}%`
                : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Vehicle Assignment Panel (overlay inside modal) ───────────────────
  const renderAssignVehicleOverlay = () => (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm rounded-lg">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Panel Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 flex items-center justify-between">
          <div>
            <h4 className="text-white font-bold text-base">Assign Vehicle</h4>
            <p className="text-blue-200 text-xs mt-0.5">Trip {tripId} · {baseTrip.origin} → {baseTrip.destination}</p>
          </div>
          <button onClick={() => setAssignVehicleOpen(false)} className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          <VehicleAssignPanel
            trip={baseTrip}
            onAssigned={handleVehicleAssigned}
            onCancel={() => setAssignVehicleOpen(false)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-center justify-center min-h-screen p-4 text-center">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

          <div className="relative inline-flex flex-col text-left align-middle bg-gray-50 rounded-2xl overflow-hidden shadow-2xl transform transition-all max-w-5xl w-full h-[88vh]">

            {/* Vehicle Assignment Overlay */}
            {isAssignVehicleOpen && renderAssignVehicleOverlay()}

            {/* ── Header ── */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-4">
                {/* Trip Icon */}
                <div className="hidden sm:flex h-10 w-10 rounded-xl bg-white/10 items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base leading-6 font-bold text-white">
                      Trip #{tripId}
                    </h3>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${sStyle.bg} ${sStyle.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sStyle.dot} animate-pulse`} />
                      {currentStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                    <span>{baseTrip.clientName}</span>
                    <span className="text-slate-600">·</span>
                    <span>{baseTrip.origin}</span>
                    <ArrowRight className="h-3 w-3 text-slate-500" />
                    <span>{baseTrip.destination}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Assign Vehicle — only for unassigned booked trips */}
                {isBooked && isUnassigned && (
                  <Button
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-400 text-white border-none shadow-sm font-semibold"
                    onClick={() => setAssignVehicleOpen(true)}
                  >
                    <Truck className="h-3.5 w-3.5 mr-1.5" /> Assign Vehicle
                  </Button>
                )}

                {/* Status Actions */}
                {['POD_SOFT_UPLOADED', 'POD_HARD_RECEIVED'].includes(currentStatus) ? (
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white border-none shadow-sm" onClick={() => setClosureModalOpen(true)}>
                    <Lock className="h-3.5 w-3.5 mr-1.5" /> Close Trip
                  </Button>
                ) : (
                  currentStatus !== 'TRIP_CLOSED' && !isBooked && (
                    <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white border-none shadow-sm" onClick={() => setUpdateModalOpen(true)}>
                      <Zap className="h-3.5 w-3.5 mr-1.5" /> Update Status
                    </Button>
                  )
                )}

                <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="bg-white border-b border-gray-200 flex-shrink-0 px-6">
              <nav className="flex gap-1 overflow-x-auto" aria-label="Tabs">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-1.5 whitespace-nowrap py-3.5 px-3 border-b-2 text-sm font-medium transition-all
                        ${isActive
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                      `}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-5">

              {/* Pending Assignment Banner */}
              {isBooked && isUnassigned && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                      <Truck className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-800">Vehicle not yet assigned</p>
                      <p className="text-xs text-amber-600">Assign a vehicle to dispatch this trip.</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-400 text-white border-none shrink-0"
                    onClick={() => setAssignVehicleOpen(true)}
                  >
                    Assign Now
                  </Button>
                </div>
              )}

              {activeTab === 'timeline' ? (
                <div className="max-w-3xl mx-auto">
                  <TripTimeline data={tripData} />
                </div>
              ) : activeTab === 'overview' ? (
                renderOverview()
              ) : activeTab === 'expenses' ? (
                <TripExpenses tripId={tripId} />
              ) : activeTab === 'claims' ? (
                <TripClaims tripId={tripId} />
              ) : activeTab === 'docs' ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="flex justify-between items-center mb-5">
                      <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 rounded-lg"><FileText className="h-4 w-4 text-primary" /></div>
                        E-Way Bill
                      </h4>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                      {[
                        { label: 'EWB Number', value: `${100000000000 + Math.floor(Math.random() * 90000000000)}` },
                        { label: 'Valid Until', value: new Date(Date.now() + 86400000 * 2).toLocaleDateString() },
                        { label: 'Generated By', value: baseTrip.clientName },
                        { label: 'Doc Value', value: `₹ ${(baseTrip.revenueAmount * 0.85).toLocaleString('en-IN')}` },
                      ].map(item => (
                        <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{item.label}</p>
                          <p className="font-semibold text-gray-900 mt-1 text-sm">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <Button variant="outline" size="sm" className="flex items-center text-primary border-primary hover:bg-blue-50">
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Download PDF
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center text-gray-600">
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Extend EWB
                      </Button>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'route' ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-80 flex flex-col items-center justify-center text-gray-400 gap-3">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <Navigation className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="font-semibold text-gray-600">Live Route Map</p>
                  <p className="text-sm text-gray-400">Interactive map coming soon</p>
                  <Button variant="outline" size="sm" onClick={() => { onClose(); navigate('/tms/tracking'); }}>
                    <Navigation className="h-3.5 w-3.5 mr-1.5" /> Open in Tracking
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
                  <p className="font-medium text-gray-500">Content for {activeTab}</p>
                  <p className="text-xs mt-1">Placeholder</p>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="bg-white px-5 py-3 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
              <div className="text-xs text-gray-400">
                Booked: <span className="text-gray-600">{baseTrip.bookedDate}</span>
                {baseTrip.deliveredDate && (
                  <> · Delivered: <span className="text-gray-600">{baseTrip.deliveredDate}</span></>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-red-500 border-red-100 hover:bg-red-50 hover:border-red-300" onClick={() => setReportIssueOpen(true)}>
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Report Issue
                </Button>
                {(currentStatus === 'IN_TRANSIT' || currentStatus === 'REACHED_DESTINATION') && (
                  <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-400" onClick={() => setDiversionOpen(true)}>
                    <CornerDownRight className="h-3.5 w-3.5 mr-1.5" /> Divert Delivery
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => { onClose(); navigate('/tms/tracking'); }}>
                  <Navigation className="h-3.5 w-3.5 mr-1.5" /> Track
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <StatusUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        currentStatus={currentStatus}
        tripId={tripId}
        onUpdate={handleStatusUpdate}
      />

      <TripClosureModal
        isOpen={isClosureModalOpen}
        onClose={() => setClosureModalOpen(false)}
        tripId={tripId}
        onSuccess={handleClosureSuccess}
      />

      <DeliveryDiversionModal
        isOpen={isDiversionOpen}
        onClose={() => setDiversionOpen(false)}
        trip={baseTrip}
        onDivert={(checkpoint) => {
          setLocalCheckpoints(prev => [...prev, checkpoint]);
          setLocalStatus('DELIVERY_DIVERTED');
          setDiversionOpen(false);
        }}
      />

      <ReportIssueModal
        isOpen={isReportIssueOpen}
        onClose={() => setReportIssueOpen(false)}
        tripId={tripId}
        onSubmit={(issueData) => {
          const categoryMap: Record<string, ExceptionCategory> = {
            VEHICLE_BREAKDOWN: 'vehicle_breakdown',
            ACCIDENT: 'accident',
            ROUTE_DEVIATION: 'route_deviation',
            DRIVER_UNREACHABLE: 'driver_issue',
            DOCUMENT_ISSUE: 'documentation_issue',
            OTHER: 'other',
          };
          const severityMap: Record<string, ExceptionSeverity> = {
            CRITICAL: 'critical',
            HIGH: 'high',
            MEDIUM: 'medium',
            LOW: 'low',
          };
          const category = categoryMap[issueData.issueType] ?? 'other';
          const requiresReplacement = ['vehicle_breakdown', 'accident'].includes(category);
          exceptionManager.raise({
            tripId: issueData.tripId,
            bookingRef: baseTrip.bookingRef || issueData.tripId,
            category,
            severity: severityMap[issueData.priority] ?? 'high',
            title: issueData.issueType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            description: issueData.description,
            raisedBy: 'CurrentUser',
            requiresReplacementVehicle: requiresReplacement,
          });
        }}
      />
    </>
  );
};
