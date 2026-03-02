import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Package, Truck, ArrowRight, CheckCircle,
  AlertTriangle, Clock, Plus, Search, Filter, ChevronDown, X,
  Layers, FileText, Hash, Scale, Calendar, User, Phone, MapPin,
  Eye, Download, Send, AlertCircle, BarChart3, RefreshCw, Check
} from 'lucide-react';
import { useToast } from '../../../../shared/context/ToastContext';
import { ptlStore } from '../../services/ptlStore';
import { INITIAL_HUBS } from '../../components/settings/HubMaster';
import type { PTLDocket, PTLManifest, PTLLineHaulTrip } from '../../services/ptlTypes';
import { useFleetData } from '../../hooks/useFleetData';
import { FleetAssignmentPicker } from '../../components/FleetAssignmentPicker';
import type { FleetPickerValue } from '../../components/FleetAssignmentPicker';

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

// ─── Sub-component: Create Manifest Modal ────────────────────────────────────

interface CreateManifestModalProps {
  hubId: string;
  hubName: string;
  availableDockets: PTLDocket[];
  onClose: () => void;
}

const CreateManifestModal: React.FC<CreateManifestModalProps> = ({ hubId, hubName, availableDockets, onClose }) => {
  const { addToast } = useToast();
  const [selectedDocketIds, setSelectedDocketIds] = useState<string[]>([]);
  const [destHubId, setDestHubId] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  const destHubs = INITIAL_HUBS.filter(h => h.id !== hubId);
  const filtered = destHubId ? availableDockets.filter(d => d.destinationHubId === destHubId) : availableDockets;

  const toggle = (id: string) => setSelectedDocketIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selected = filtered.filter(d => selectedDocketIds.includes(d.id));
  const totalWeight = selected.reduce((s, d) => s + d.chargeableWeight, 0);
  const totalPieces = selected.reduce((s, d) => s + d.totalPieces, 0);

  const handleCreate = () => {
    if (!destHubId || selectedDocketIds.length === 0) { addToast({ type: 'error', message: 'Select destination hub and at least one docket' }); return; }
    const destHub = INITIAL_HUBS.find(h => h.id === destHubId);
    const now = new Date().toISOString();
    const manifestNumber = `MFT-${hubName.replace(' Hub', '').toUpperCase().replace(' ', '-')}-${destHub?.city.toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const manifest: PTLManifest = {
      id: ptlStore.generateId('mfst'),
      manifestNumber, originHubId: hubId, originHubName: hubName,
      destinationHubId: destHubId, destinationHubName: destHub?.name ?? '',
      docketIds: selectedDocketIds, totalPieces, totalWeight,
      vehicleType: vehicleType || undefined, vehiclePlate: vehiclePlate || undefined,
      driverName: driverName || undefined, driverPhone: driverPhone || undefined,
      status: 'Draft', createdAt: now,
    };
    ptlStore.addManifest(manifest);
    // Update docket manifest numbers
    selectedDocketIds.forEach(id => ptlStore.updateDocket(id, { manifestNumber, status: 'Manifested' }));
    addToast({ type: 'success', message: `Manifest ${manifestNumber} created with ${selectedDocketIds.length} dockets` });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-800">Create Outbound Manifest</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Destination Hub *</label>
              <select value={destHubId} onChange={e => setDestHubId(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select hub...</option>
                {destHubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Type</label>
              <input value={vehicleType} onChange={e => setVehicleType(e.target.value)} placeholder="e.g., 32 Ft Trailer" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Plate</label>
              <input value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} placeholder="MH-04-AB-1234" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Driver Name</label>
              <input value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Driver name" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-gray-700">Select Dockets ({selectedDocketIds.length} selected)</h4>
            {totalWeight > 0 && <span className="text-xs text-gray-500">{totalPieces} pcs · {totalWeight.toFixed(0)} kg</span>}
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">No dockets available for selected hub</div>
            ) : filtered.map(d => (
              <label key={d.id} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 ${selectedDocketIds.includes(d.id) ? 'bg-blue-50' : ''}`}>
                <input type="checkbox" checked={selectedDocketIds.includes(d.id)} onChange={() => toggle(d.id)} className="rounded" />
                <div className="flex-1">
                  <div className="text-xs font-mono font-semibold text-blue-700">{d.docketNumber}</div>
                  <div className="text-xs text-gray-500">{d.pickupCity} → {d.deliveryCity} · {d.totalPieces} pcs · {d.chargeableWeight} kg</div>
                </div>
                <div className="text-xs text-gray-400">{d.clientName}</div>
              </label>
            ))}
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleCreate} disabled={!destHubId || selectedDocketIds.length === 0}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
            Create Manifest
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Sub-component: Create Line Haul Trip Modal ───────────────────────────────

interface CreateLineHaulModalProps {
  hubId: string;
  hubName: string;
  manifests: PTLManifest[];
  onClose: () => void;
}

const CreateLineHaulModal: React.FC<CreateLineHaulModalProps> = ({ hubId, hubName, manifests, onClose }) => {
  const { addToast } = useToast();
  const { vehicles, drivers, loading: fleetLoading } = useFleetData();
  const [selectedManifestIds, setSelectedManifestIds] = useState<string[]>([]);
  const [fleetPick, setFleetPick] = useState<FleetPickerValue>({ vehicleId: '', vehiclePlate: '', driverId: '', driverName: '' });
  const [vehicleType, setVehicleType] = useState('');
  const [scheduledDeparture, setScheduledDeparture] = useState('');

  const sealedManifests = manifests.filter(m => m.status === 'Sealed' && m.originHubId === hubId);
  const toggle = (id: string) => setSelectedManifestIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selected = sealedManifests.filter(m => selectedManifestIds.includes(m.id));
  const totalWeight = selected.reduce((s, m) => s + m.totalWeight, 0);

  const handleCreate = () => {
    if (!fleetPick.vehiclePlate || !fleetPick.driverName || selectedManifestIds.length === 0) {
      addToast({ type: 'error', message: 'Select vehicle, driver and at least one manifest' }); return;
    }
    const destHub = selected[0];
    const tripNumber = `LH-${hubName.replace(' Hub', '').toUpperCase().replace(' ', '')}-${Date.now().toString().slice(-4)}`;
    const trip: PTLLineHaulTrip = {
      id: ptlStore.generateId('lht'), tripNumber, manifestIds: selectedManifestIds,
      originHubId: hubId, originHubName: hubName,
      destinationHubId: destHub?.destinationHubId ?? '', destinationHubName: destHub?.destinationHubName ?? '',
      vehicleId: fleetPick.vehicleId || undefined,
      vehiclePlate: fleetPick.vehiclePlate,
      vehicleType: vehicleType || fleetPick.vehiclePlate,
      driverId: fleetPick.driverId || undefined,
      driverName: fleetPick.driverName,
      status: 'Dispatched',
      scheduledDeparture: scheduledDeparture || new Date().toISOString(),
      actualDeparture: new Date().toISOString(),
      totalDockets: selected.reduce((s, m) => s + m.docketIds.length, 0),
      totalWeight,
    };
    ptlStore.addLineHaulTrip(trip);
    selectedManifestIds.forEach(mid => {
      ptlStore.updateManifest(mid, { status: 'Dispatched', dispatchedAt: new Date().toISOString(), lineHaulTripId: trip.id });
      const manifest = manifests.find(m => m.id === mid);
      manifest?.docketIds.forEach(did => {
        ptlStore.updateDocket(did, { status: 'In Transit', lineHaulTripId: trip.id, lineHaulVehiclePlate: fleetPick.vehiclePlate });
      });
    });
    addToast({ type: 'success', message: `Line haul trip ${tripNumber} dispatched` });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-800">Create Line Haul Trip</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <FleetAssignmentPicker
            label="Vehicle & Driver (Fleet Module)"
            vehicles={vehicles}
            drivers={drivers}
            loading={fleetLoading}
            value={fleetPick}
            onChange={setFleetPick}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Load Type / Vehicle Description</label>
              <input value={vehicleType} onChange={e => setVehicleType(e.target.value)} placeholder="e.g., 32 Ft Trailer"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Scheduled Departure</label>
              <input type="datetime-local" value={scheduledDeparture} onChange={e => setScheduledDeparture(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Select Sealed Manifests</h4>
            {sealedManifests.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm">No sealed manifests available</div>
            ) : sealedManifests.map(m => (
              <label key={m.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-2 border ${selectedManifestIds.includes(m.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="checkbox" checked={selectedManifestIds.includes(m.id)} onChange={() => toggle(m.id)} className="rounded" />
                <div>
                  <div className="text-xs font-semibold text-blue-700">{m.manifestNumber}</div>
                  <div className="text-xs text-gray-500">{m.destinationHubName} · {m.docketIds.length} dockets · {m.totalWeight} kg</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleCreate} disabled={!fleetPick.vehiclePlate || !fleetPick.driverName || selectedManifestIds.length === 0}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
            Dispatch Trip
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

type TabType = 'inward' | 'staging' | 'outward' | 'linehaul';

export const PTLHubOperations: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [selectedHubId, setSelectedHubId] = useState(INITIAL_HUBS[0].id);
  const [tab, setTab] = useState<TabType>('inward');
  const [dockets, setDockets] = useState(ptlStore.getDockets());
  const [manifests, setManifests] = useState(ptlStore.getManifests());
  const [lineHaulTrips, setLineHaulTrips] = useState(ptlStore.getLineHaulTrips());
  const [showCreateManifest, setShowCreateManifest] = useState(false);
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    return ptlStore.subscribe(() => {
      setDockets(ptlStore.getDockets());
      setManifests(ptlStore.getManifests());
      setLineHaulTrips(ptlStore.getLineHaulTrips());
    });
  }, []);

  const hub = INITIAL_HUBS.find(h => h.id === selectedHubId)!;

  // Dockets at this hub
  const inwardPending = useMemo(() =>
    dockets.filter(d => (d.originHubId === selectedHubId && ['Created', 'Pickup Scheduled', 'Picked Up'].includes(d.status)) ||
      (d.destinationHubId === selectedHubId && d.status === 'In Transit')), [dockets, selectedHubId]);

  const atOriginHub = useMemo(() =>
    dockets.filter(d => d.originHubId === selectedHubId && ['At Origin Hub', 'Manifested'].includes(d.status)), [dockets, selectedHubId]);

  const atDestHub = useMemo(() =>
    dockets.filter(d => d.destinationHubId === selectedHubId && d.status === 'At Destination Hub'), [dockets, selectedHubId]);

  const stagingDockets = useMemo(() => [...atOriginHub, ...atDestHub], [atOriginHub, atDestHub]);

  const readyForManifest = useMemo(() =>
    dockets.filter(d => d.originHubId === selectedHubId && d.status === 'At Origin Hub'), [dockets, selectedHubId]);

  const hubManifests = useMemo(() =>
    manifests.filter(m => m.originHubId === selectedHubId || m.destinationHubId === selectedHubId), [manifests, selectedHubId]);

  const hubTrips = useMemo(() =>
    lineHaulTrips.filter(t => t.originHubId === selectedHubId || t.destinationHubId === selectedHubId), [lineHaulTrips, selectedHubId]);

  // Actions
  const markDocketArrived = (docket: PTLDocket) => {
    const isDestination = docket.destinationHubId === selectedHubId;
    const newStatus = isDestination ? 'At Destination Hub' : 'At Origin Hub';
    const timeField = isDestination ? 'destinationHubInwardTime' : 'originHubInwardTime';
    ptlStore.updateDocket(docket.id, { status: newStatus, [timeField]: new Date().toISOString() });
    addToast({ type: 'success', message: `${docket.docketNumber} marked as arrived at ${hub.name}` });
  };

  const sealManifest = (manifest: PTLManifest) => {
    ptlStore.updateManifest(manifest.id, { status: 'Sealed', sealedAt: new Date().toISOString() });
    addToast({ type: 'success', message: `Manifest ${manifest.manifestNumber} sealed` });
  };

  const markTripArrived = (trip: PTLLineHaulTrip) => {
    ptlStore.updateLineHaulTrip(trip.id, { status: 'Arrived', actualArrival: new Date().toISOString() });
    // Mark all destination dockets
    trip.manifestIds.forEach(mid => {
      const manifest = manifests.find(m => m.id === mid);
      manifest?.docketIds.forEach(did => {
        ptlStore.updateDocket(did, { status: 'At Destination Hub', destinationHubInwardTime: new Date().toISOString() });
      });
      ptlStore.updateManifest(mid, { status: 'Received', receivedAt: new Date().toISOString() });
    });
    addToast({ type: 'success', message: `Trip ${trip.tripNumber} arrived — dockets updated` });
  };

  const MANIFEST_COLORS: Record<string, string> = { Draft: 'gray', Sealed: 'blue', Dispatched: 'amber', Received: 'green' };
  const TRIP_COLORS: Record<string, string> = { Planned: 'gray', Loading: 'blue', Dispatched: 'amber', 'In Transit': 'amber', Arrived: 'green' };

  const filteredSearchDockets = (items: PTLDocket[]) => !searchQ ? items : items.filter(d =>
    d.docketNumber.toLowerCase().includes(searchQ.toLowerCase()) ||
    d.clientName.toLowerCase().includes(searchQ.toLowerCase()) ||
    d.pickupCity.toLowerCase().includes(searchQ.toLowerCase()) ||
    d.deliveryCity.toLowerCase().includes(searchQ.toLowerCase())
  );

  // Demurrage alerts: dockets at hub for > freeStorageDays
  const demurrageAlerts = stagingDockets.filter(d => {
    const inwardTime = d.originHubId === selectedHubId ? d.originHubInwardTime : d.destinationHubInwardTime;
    if (!inwardTime) return false;
    const rc = ptlStore.findClientRateCard(d.clientId);
    const freeDays = rc?.freeStorageDays ?? 3;
    const daysAtHub = Math.floor((Date.now() - new Date(inwardTime).getTime()) / (1000 * 60 * 60 * 24));
    return daysAtHub >= freeDays;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/tms/ptl/dashboard')} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Building2 className="w-5 h-5 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Hub Operations</h1>
              <p className="text-sm text-gray-500">Manage inward, staging, manifesting and line haul</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select value={selectedHubId} onChange={e => setSelectedHubId(e.target.value)}
              className="text-sm font-medium border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {INITIAL_HUBS.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Hub summary bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center gap-6 text-sm">
        {[
          { label: 'Inward Pending', value: inwardPending.length, color: 'text-blue-600' },
          { label: 'At Hub (Staging)', value: stagingDockets.length, color: 'text-purple-600' },
          { label: 'Ready for Manifest', value: readyForManifest.length, color: 'text-amber-600' },
          { label: 'Demurrage Alerts', value: demurrageAlerts.length, color: 'text-red-600' },
          { label: 'Hub Utilization', value: `${hub.currentUtilization ?? 0}%`, color: 'text-gray-600' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-gray-400">{item.label}:</span>
            <span className={`font-semibold ${item.color}`}>{item.value}</span>
          </div>
        ))}
        {demurrageAlerts.length > 0 && (
          <div className="ml-auto flex items-center gap-1 text-red-600 text-xs font-medium">
            <AlertTriangle className="w-3 h-3" />{demurrageAlerts.length} dockets approaching/past free storage
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 flex gap-1">
        {([
          { key: 'inward', label: 'Inward', icon: Package, count: inwardPending.length },
          { key: 'staging', label: 'Sorting & Staging', icon: Layers, count: stagingDockets.length },
          { key: 'outward', label: 'Outward / Manifests', icon: Send, count: hubManifests.length },
          { key: 'linehaul', label: 'Line Haul Trips', icon: Truck, count: hubTrips.length },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="px-6 py-4">
        {/* ── Tab: Inward ── */}
        {tab === 'inward' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search dockets..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-60" />
              </div>
              <span className="text-sm text-gray-500">{inwardPending.length} dockets pending arrival</span>
            </div>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['Docket #', 'Client', 'From / To', 'Cargo', 'Direction', 'Expected', 'Status', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSearchDockets(inwardPending).length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-10 text-gray-400">No pending arrivals</td></tr>
                    ) : filteredSearchDockets(inwardPending).map(d => {
                      const isDestination = d.destinationHubId === selectedHubId;
                      return (
                        <tr key={d.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3"><span className="font-mono text-xs font-semibold text-blue-700">{d.docketNumber}</span></td>
                          <td className="px-4 py-3 text-gray-700">{d.clientName}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">{d.pickupCity} <span className="text-gray-300">→</span> {d.deliveryCity}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">{d.totalPieces} pcs · {d.chargeableWeight} kg</td>
                          <td className="px-4 py-3"><Badge color={isDestination ? 'green' : 'blue'}>{isDestination ? 'Inbound (Final)' : 'First Mile'}</Badge></td>
                          <td className="px-4 py-3 text-xs text-gray-500">{d.pickupDate}</td>
                          <td className="px-4 py-3"><Badge color="amber">{d.status}</Badge></td>
                          <td className="px-4 py-3">
                            <button onClick={() => markDocketArrived(d)} className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                              <CheckCircle className="w-3 h-3" /> Mark Arrived
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── Tab: Staging ── */}
        {tab === 'staging' && (
          <div>
            {demurrageAlerts.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4" />
                {demurrageAlerts.length} dockets have exceeded free storage — demurrage accumulating
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-60" />
              </div>
              <span className="text-sm text-gray-500">{stagingDockets.length} dockets at this hub</span>
            </div>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['Docket #', 'Client', 'Route', 'Cargo', 'Destination Hub', 'Arrived', 'Days at Hub', 'Demurrage', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSearchDockets(stagingDockets).length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-10 text-gray-400">No dockets at this hub</td></tr>
                    ) : filteredSearchDockets(stagingDockets).map(d => {
                      const isOrigin = d.originHubId === selectedHubId;
                      const inwardTime = isOrigin ? d.originHubInwardTime : d.destinationHubInwardTime;
                      const daysAtHub = inwardTime ? Math.floor((Date.now() - new Date(inwardTime).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                      const rc = ptlStore.findClientRateCard(d.clientId);
                      const freeDays = rc?.freeStorageDays ?? 3;
                      const isDemurrage = daysAtHub >= freeDays;
                      const demurrageAmt = isDemurrage ? (daysAtHub - freeDays) * (rc?.demurragePerConPerDay ?? 200) * d.totalPieces : 0;
                      return (
                        <tr key={d.id} className={`hover:bg-gray-50 ${isDemurrage ? 'bg-red-50' : ''}`}>
                          <td className="px-4 py-3"><span className="font-mono text-xs font-semibold text-blue-700">{d.docketNumber}</span></td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{d.clientName}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">{d.pickupCity} → {d.deliveryCity}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">{d.totalPieces} pcs · {d.chargeableWeight} kg</td>
                          <td className="px-4 py-3 text-xs text-gray-600">{d.destinationHubName}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{inwardTime ? new Date(inwardTime).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium ${isDemurrage ? 'text-red-600' : 'text-gray-600'}`}>
                              {daysAtHub}d {isDemurrage && '⚠'} (free: {freeDays}d)
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">{isDemurrage ? <span className="text-red-600 font-medium">₹{demurrageAmt.toLocaleString()}</span> : <span className="text-gray-400">—</span>}</td>
                          <td className="px-4 py-3"><Badge color={d.status === 'Manifested' ? 'purple' : 'amber'}>{d.status}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── Tab: Outward / Manifests ── */}
        {tab === 'outward' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">{hubManifests.length} manifests · {readyForManifest.length} dockets ready to manifest</span>
              <div className="flex gap-2">
                <button onClick={() => setShowCreateManifest(true)} disabled={readyForManifest.length === 0}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
                  <Plus className="w-4 h-4" /> Create Manifest
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {hubManifests.length === 0 ? (
                <Card className="p-12 text-center text-gray-400">
                  <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No manifests for this hub yet</p>
                </Card>
              ) : hubManifests.map(m => {
                const docketList = dockets.filter(d => m.docketIds.includes(d.id));
                return (
                  <Card key={m.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-blue-700">{m.manifestNumber}</span>
                        <Badge color={MANIFEST_COLORS[m.status] ?? 'gray'}>{m.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.status === 'Draft' && (
                          <button onClick={() => sealManifest(m)} className="flex items-center gap-1 text-xs bg-amber-600 text-white px-2 py-1 rounded hover:bg-amber-700">
                            <Check className="w-3 h-3" /> Seal Manifest
                          </button>
                        )}
                        <span className="text-xs text-gray-400">{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-sm text-gray-600 mb-3">
                      <div><span className="text-xs text-gray-400">Origin</span><div className="font-medium">{m.originHubName}</div></div>
                      <div><span className="text-xs text-gray-400">Destination</span><div className="font-medium">{m.destinationHubName}</div></div>
                      <div><span className="text-xs text-gray-400">Cargo</span><div className="font-medium">{m.totalPieces} pcs · {m.totalWeight} kg</div></div>
                      <div><span className="text-xs text-gray-400">Vehicle</span><div className="font-medium">{m.vehiclePlate ?? '—'}</div></div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {docketList.slice(0, 6).map(d => <span key={d.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{d.docketNumber}</span>)}
                      {m.docketIds.length > 6 && <span className="text-xs text-gray-400">+{m.docketIds.length - 6} more</span>}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab: Line Haul Trips ── */}
        {tab === 'linehaul' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">{hubTrips.length} trips</span>
              <button onClick={() => setShowCreateTrip(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                <Plus className="w-4 h-4" /> Create Line Haul Trip
              </button>
            </div>

            <div className="space-y-3">
              {hubTrips.length === 0 ? (
                <Card className="p-12 text-center text-gray-400">
                  <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No line haul trips yet</p>
                </Card>
              ) : hubTrips.map(t => (
                <Card key={t.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-gray-800">{t.tripNumber}</span>
                      <Badge color={TRIP_COLORS[t.status] ?? 'gray'}>{t.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.status === 'In Transit' && t.destinationHubId === selectedHubId && (
                        <button onClick={() => markTripArrived(t)} className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                          <CheckCircle className="w-3 h-3" /> Mark Arrived
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-3 text-sm">
                    <div><span className="text-xs text-gray-400">Route</span><div className="font-medium text-gray-700">{t.originHubName} → {t.destinationHubName}</div></div>
                    <div><span className="text-xs text-gray-400">Vehicle</span><div className="font-medium">{t.vehiclePlate}</div></div>
                    <div><span className="text-xs text-gray-400">Driver</span><div className="font-medium">{t.driverName}</div></div>
                    <div><span className="text-xs text-gray-400">Cargo</span><div className="font-medium">{t.totalDockets} dockets · {t.totalWeight} kg</div></div>
                    <div>
                      <span className="text-xs text-gray-400">Departure</span>
                      <div className="font-medium text-xs">{t.actualDeparture ? new Date(t.actualDeparture).toLocaleString() : t.scheduledDeparture ? new Date(t.scheduledDeparture).toLocaleString() : '—'}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateManifest && (
        <CreateManifestModal hubId={selectedHubId} hubName={hub.name} availableDockets={readyForManifest} onClose={() => setShowCreateManifest(false)} />
      )}
      {showCreateTrip && (
        <CreateLineHaulModal hubId={selectedHubId} hubName={hub.name} manifests={manifests} onClose={() => setShowCreateTrip(false)} />
      )}
    </div>
  );
};
