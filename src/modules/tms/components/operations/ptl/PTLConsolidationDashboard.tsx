import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Truck, Package, MapPin, Building2, CheckCircle, Clock,
  AlertTriangle, Plus, RefreshCw, ArrowRight, ArrowRightLeft,
  Navigation, FileText, Phone, Scale, Route, Eye, BarChart3, ChevronDown
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import {
  VehicleAllocationModal, PickupCompletionModal,
  LineHaulAssignModal, PODUploadModal, ManifestModal
} from './PTLModals';
import { DocketDetailModal } from './DocketDetailModal';
import { PTLNetworkView } from './PTLNetworkView';
import { PTLReports } from './PTLReports';
import { INITIAL_HUBS, findHubByCity, type Hub } from '../../settings/HubMaster';
import { ptlStore, type PTLDocket, type DocketStatus } from '../../../services/ptlStore';

// ─── Types ───────────────────────────────────────────────────────────────────
// PTLDocket and DocketStatus are imported from ptlStore so that
// PTLBooking and this dashboard share one canonical definition.

interface PickupRun {
  id: string; vehicleType: string; vehiclePlate: string; driverName: string;
  docketIds: string[]; city: string; hub: string; status: 'Scheduled' | 'In Progress' | 'Completed'; totalWeight: number;
}

interface ConsolidatedLoad {
  id: string; originHub: string; destinationHub: string; docketIds: string[];
  totalWeight: number; totalVolume: number; vehicleType: string; utilizationPercent: number;
  status: 'Planning' | 'Indent Created' | 'Vehicle Assigned' | 'Dispatched';
  assignedVehicle?: string; assignedDriver?: string;
}

interface LineHaulTrip {
  id: string; origin: string; destination: string; vehiclePlate: string; driverName: string;
  docketIds: string[]; status: 'Loading' | 'In Transit' | 'Reached' | 'Completed';
  departureTime?: string; eta?: string; progress: number;
}

interface DeliveryRun {
  id: string; city: string; area: string; hub: string; vehiclePlate: string; driverName: string;
  docketIds: string[]; status: 'Scheduled' | 'Out for Delivery' | 'Completed';
}

// ─── Initial Data is now managed by ptlStore (localStorage-backed) ───────────

// ─── Component ───────────────────────────────────────────────────────────────

export const PTLConsolidationDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'first_mile' | 'hub' | 'line_haul' | 'last_mile' | 'reports'>('first_mile');

  // Hub context
  const [hubs] = useState<Hub[]>(INITIAL_HUBS);
  const activeHubs = useMemo(() => hubs.filter(h => h.status === 'Active'), [hubs]);
  const [selectedHubId, setSelectedHubId] = useState<string>('all');
  const selectedHub = activeHubs.find(h => h.id === selectedHubId);
  const selectedHubName = selectedHub?.name || '';

  // Data state — initialised from ptlStore (localStorage-backed)
  const [dockets, setDockets] = useState<PTLDocket[]>(() => ptlStore.getDockets());

  // Subscribe to store so that dockets created in PTLBooking appear immediately
  useEffect(() => {
    return ptlStore.subscribe(() => setDockets(ptlStore.getDockets()));
  }, []);
  const [pickupRuns, setPickupRuns] = useState<PickupRun[]>([
    { id: 'PR-001', vehicleType: 'Tata Ace', vehiclePlate: 'MH-04-AB-1234', driverName: 'Ramesh K', docketIds: ['3'], city: 'Mumbai', hub: 'Mumbai Hub', status: 'In Progress', totalWeight: 920 },
  ]);
  const [consolidatedLoads, setConsolidatedLoads] = useState<ConsolidatedLoad[]>([
    { id: 'CL-001', originHub: 'Mumbai Hub', destinationHub: 'Delhi Hub', docketIds: ['4', '5'], totalWeight: 1020, totalVolume: 4.2, vehicleType: '20ft Container', utilizationPercent: 45, status: 'Planning' },
  ]);
  const [lineHaulTrips, setLineHaulTrips] = useState<LineHaulTrip[]>([
    { id: 'LH-001', origin: 'Mumbai Hub', destination: 'Delhi Hub', vehiclePlate: 'MH-01-XY-9999', driverName: 'Kamal Singh', docketIds: ['6'], status: 'In Transit', departureTime: '2026-02-22 22:00', eta: '2026-02-24 10:00', progress: 65 },
    { id: 'LH-002', origin: 'Bangalore Hub', destination: 'Chennai Hub', vehiclePlate: 'KA-01-MN-4444', driverName: 'Ravi Kumar', docketIds: ['7'], status: 'Reached', departureTime: '2026-02-23 06:00', eta: '2026-02-23 14:00', progress: 100 },
  ]);
  const [deliveryRuns, setDeliveryRuns] = useState<DeliveryRun[]>([
    { id: 'DR-001', city: 'Jaipur', area: 'Mansarovar', hub: 'Jaipur Hub', vehiclePlate: 'RJ-14-CD-5678', driverName: 'Vikram S', docketIds: ['8'], status: 'Out for Delivery' },
  ]);

  // Modal state
  const [vehicleModal, setVehicleModal] = useState<{ open: boolean; mode: 'pickup' | 'delivery'; city: string; docketIds: string[] }>({ open: false, mode: 'pickup', city: '', docketIds: [] });
  const [pickupModal, setPickupModal] = useState<{ open: boolean; docketId: string }>({ open: false, docketId: '' });
  const [lineHaulModal, setLineHaulModal] = useState<{ open: boolean; loadId: string }>({ open: false, loadId: '' });
  const [podModal, setPodModal] = useState<{ open: boolean; docketId: string }>({ open: false, docketId: '' });
  const [manifestModal, setManifestModal] = useState<{ open: boolean; tripId: string }>({ open: false, tripId: '' });
  const [docketDetailModal, setDocketDetailModal] = useState<{ open: boolean; docketId: string }>({ open: false, docketId: '' });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Helpers
  const updateDocket = useCallback((id: string, fields: Partial<PTLDocket>) => {
    // Write to the persistent store — the subscription above will refresh local state
    ptlStore.updateDocket(id, fields);
  }, []);
  const getDocket = (id: string) => dockets.find(d => d.id === id);

  /**
   * Calculates demurrage charge for a docket currently sitting at a hub.
   * Contract rates: ₹100/con/day OR ₹1/kg/day (whichever is higher), after 7 free days.
   */
  const calcDemurrageCharge = (docket: PTLDocket): number => {
    if (!docket.hubInwardTime) return 0;
    const FREE_DAYS = 7;
    const daysStored = Math.ceil((Date.now() - new Date(docket.hubInwardTime).getTime()) / 86_400_000);
    const excessDays = Math.max(0, daysStored - FREE_DAYS);
    if (excessDays === 0) return 0;
    // max(₹100 per con per day, ₹1 per kg per day) × excess days
    return Math.max(100, docket.chargeableWeight) * excessDays;
  };

  const getStatusColor = (status: string) => {
    const c: Record<string, string> = {
      'Created': 'bg-gray-100 text-gray-700', 'Pickup Scheduled': 'bg-yellow-100 text-yellow-700',
      'Picked Up': 'bg-green-100 text-green-700', 'At Origin Hub': 'bg-orange-100 text-orange-700',
      'In Transit': 'bg-blue-100 text-blue-700', 'At Destination Hub': 'bg-indigo-100 text-indigo-700',
      'Out for Delivery': 'bg-purple-100 text-purple-700', 'Delivered': 'bg-emerald-100 text-emerald-700',
      'Failed Delivery': 'bg-red-100 text-red-700', 'Scheduled': 'bg-yellow-100 text-yellow-700',
      'In Progress': 'bg-blue-100 text-blue-700', 'Completed': 'bg-green-100 text-green-700',
      'Planning': 'bg-gray-100 text-gray-700', 'Indent Created': 'bg-yellow-100 text-yellow-700',
      'Vehicle Assigned': 'bg-blue-100 text-blue-700', 'Loading': 'bg-orange-100 text-orange-700',
      'Dispatched': 'bg-green-100 text-green-700', 'Reached': 'bg-green-100 text-green-700',
    };
    return c[status] || 'bg-gray-100 text-gray-700';
  };
  const getPriorityColor = (p: string) => p === 'Critical' ? 'bg-red-500 text-white' : p === 'Urgent' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600';

  // ─── Hub-scoped filtering ────────────────────────────────────────────────
  const isAllHubs = selectedHubId === 'all';

  // Origin hub scoped: first mile, hub ops
  const originDockets = useMemo(() => isAllHubs ? dockets : dockets.filter(d => d.originHub === selectedHubName), [dockets, isAllHubs, selectedHubName]);
  // Destination hub scoped: last mile
  const destDockets = useMemo(() => isAllHubs ? dockets : dockets.filter(d => d.destinationHub === selectedHubName), [dockets, isAllHubs, selectedHubName]);
  // Line haul: show trips from or to selected hub
  const scopedTrips = useMemo(() => isAllHubs ? lineHaulTrips : lineHaulTrips.filter(t => t.origin === selectedHubName || t.destination === selectedHubName), [lineHaulTrips, isAllHubs, selectedHubName]);
  const scopedPickupRuns = useMemo(() => isAllHubs ? pickupRuns : pickupRuns.filter(r => r.hub === selectedHubName), [pickupRuns, isAllHubs, selectedHubName]);
  const scopedLoads = useMemo(() => isAllHubs ? consolidatedLoads : consolidatedLoads.filter(l => l.originHub === selectedHubName), [consolidatedLoads, isAllHubs, selectedHubName]);
  const scopedDeliveryRuns = useMemo(() => isAllHubs ? deliveryRuns : deliveryRuns.filter(r => r.hub === selectedHubName), [deliveryRuns, isAllHubs, selectedHubName]);

  // Stats
  const stats = useMemo(() => {
    const all = dockets;
    return {
      pending: all.filter(d => d.status === 'Created').length,
      inPickup: all.filter(d => d.status === 'Pickup Scheduled').length,
      atHub: all.filter(d => d.status === 'At Origin Hub').length,
      inTransit: all.filter(d => d.status === 'In Transit').length,
      atDest: all.filter(d => d.status === 'At Destination Hub').length,
      outDel: all.filter(d => d.status === 'Out for Delivery').length,
      delivered: all.filter(d => d.status === 'Delivered').length,
    };
  }, [dockets]);

  // Network view data
  const docketCountByHub = useMemo(() => {
    const counts: Record<string, number> = {};
    dockets.forEach(d => {
      if (d.status !== 'Delivered') {
        counts[d.originHub.replace(' Hub', '')] = (counts[d.originHub.replace(' Hub', '')] || 0) + 1;
      }
    });
    return counts;
  }, [dockets]);

  const networkTrips = useMemo(() => scopedTrips.map(t => ({
    origin: t.origin, destination: t.destination, docketCount: t.docketIds.length, status: t.status,
  })), [scopedTrips]);

  // ─── Actions ─────────────────────────────────────────────────────────────

  const handlePickupAllocate = (vehicleId: string, vehicleInfo: string) => {
    const ids = vehicleModal.docketIds;
    const hubName = getDocket(ids[0])?.originHub || '';
    ids.forEach(id => updateDocket(id, { status: 'Pickup Scheduled', firstMileVehicle: vehicleInfo }));
    const totalW = ids.reduce((s, id) => s + (getDocket(id)?.chargeableWeight || 0), 0);
    setPickupRuns(prev => [...prev, {
      id: `PR-${Date.now()}`, vehicleType: vehicleInfo.split(' - ')[0], vehiclePlate: vehicleInfo.split(' - ')[1] || '',
      driverName: 'Assigned Driver', docketIds: ids, city: vehicleModal.city, hub: hubName, status: 'Scheduled', totalWeight: totalW,
    }]);
    showToast(`✅ Pickup scheduled for ${ids.length} docket(s) — ${hubName}`);
  };

  const handlePickupComplete = (data: { invoiceNumber: string; invoiceAmount: number; ewayBill: string }) => {
    const id = pickupModal.docketId;
    // Record hub inward time so demurrage can be calculated if docket sits at hub > 7 days
    updateDocket(id, {
      status: 'At Origin Hub',
      invoiceNumber: data.invoiceNumber,
      invoiceAmount: data.invoiceAmount,
      ewayBill: data.ewayBill,
      hubInwardTime: new Date().toISOString(),
    });
    setPickupRuns(prev => prev.map(r => r.docketIds.includes(id) ? { ...r, status: 'Completed' as const } : r));
    showToast(`✅ Pickup complete for ${getDocket(id)?.docketNumber}. Invoice ${data.invoiceNumber} captured.`);
  };

  const handleAutoConsolidate = () => {
    const atHub = originDockets.filter(d => d.status === 'At Origin Hub');
    if (atHub.length === 0) { showToast('⚠️ No dockets at hub to consolidate'); return; }
    const groups = atHub.reduce((acc, d) => {
      const key = `${d.originHub}→${d.destinationHub}`;
      (acc[key] = acc[key] || []).push(d);
      return acc;
    }, {} as Record<string, PTLDocket[]>);

    const newLoads: ConsolidatedLoad[] = Object.entries(groups).map(([key, ds]) => {
      const [origin, dest] = key.split('→');
      const tw = ds.reduce((s, d) => s + d.chargeableWeight, 0);
      return {
        id: `CL-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        originHub: origin, destinationHub: dest, docketIds: ds.map(d => d.id),
        totalWeight: tw, totalVolume: Math.round(tw / 280 * 10) / 10,
        vehicleType: tw > 5000 ? '32ft MXL' : tw > 2000 ? '20ft Container' : 'Eicher 14ft',
        utilizationPercent: Math.min(Math.round((tw / (tw > 5000 ? 15000 : tw > 2000 ? 7000 : 4000)) * 100), 95),
        status: 'Planning' as const,
      };
    });
    setConsolidatedLoads(newLoads);
    showToast(`✅ Auto-consolidated into ${newLoads.length} load(s)`);
  };

  const handleCreateIndent = (loadId: string) => {
    setConsolidatedLoads(prev => prev.map(l => l.id === loadId ? { ...l, status: 'Indent Created' as const } : l));
    showToast('✅ Indent created. Assign a vehicle to proceed.');
  };

  const handleLineHaulAssign = (vehicleId: string, vehicleInfo: string, driverName: string) => {
    const load = consolidatedLoads.find(l => l.id === lineHaulModal.loadId);
    if (!load) return;
    setConsolidatedLoads(prev => prev.map(l => l.id === load.id ? { ...l, status: 'Dispatched' as const, assignedVehicle: vehicleInfo, assignedDriver: driverName } : l));
    const tripId = `LH-${Date.now().toString(36).toUpperCase()}`;
    setLineHaulTrips(prev => [...prev, {
      id: tripId, origin: load.originHub, destination: load.destinationHub,
      vehiclePlate: vehicleInfo.split(' - ')[1] || vehicleInfo, driverName,
      docketIds: load.docketIds, status: 'Loading' as const, progress: 0,
    }]);
    load.docketIds.forEach(id => {
      const docket = getDocket(id);
      if (!docket) return;
      // Calculate demurrage at origin hub before departure
      const newDemurrage = calcDemurrageCharge(docket);
      const existingDemurrage = docket.demurrageCharge || 0;
      const totalDemurrage = existingDemurrage + newDemurrage;
      updateDocket(id, {
        status: 'In Transit',
        lineHaulTrip: tripId,
        demurrageCharge: totalDemurrage || undefined,
        totalCharges: docket.totalCharges + newDemurrage,
        hubInwardTime: undefined, // clear so dest hub can set its own inward time
      });
      if (newDemurrage > 0) showToast(`⏱ Demurrage ₹${newDemurrage.toLocaleString()} applied to ${docket.docketNumber} (origin hub overstay)`);
    });
    showToast(`✅ Line haul trip ${tripId} created. ${load.docketIds.length} dockets dispatched.`);
  };

  const handleDeliveryAllocate = (vehicleId: string, vehicleInfo: string) => {
    const ids = vehicleModal.docketIds;
    const hubName = getDocket(ids[0])?.destinationHub || '';
    ids.forEach(id => {
      const docket = getDocket(id);
      if (!docket) return;
      // Calculate demurrage at destination hub before dispatch
      const newDemurrage = calcDemurrageCharge(docket);
      const existingDemurrage = docket.demurrageCharge || 0;
      const totalDemurrage = existingDemurrage + newDemurrage;
      updateDocket(id, {
        status: 'Out for Delivery',
        lastMileVehicle: vehicleInfo,
        demurrageCharge: totalDemurrage || undefined,
        totalCharges: docket.totalCharges + newDemurrage,
        hubInwardTime: undefined,
      });
      if (newDemurrage > 0) showToast(`⏱ Demurrage ₹${newDemurrage.toLocaleString()} applied to ${docket.docketNumber} (destination hub overstay)`);
    });
    const city = getDocket(ids[0])?.deliveryCity || '';
    setDeliveryRuns(prev => [...prev, {
      id: `DR-${Date.now()}`, city, area: getDocket(ids[0])?.deliveryAddress || '',
      hub: hubName, vehiclePlate: vehicleInfo.split(' - ')[1] || vehicleInfo, driverName: 'Assigned Driver',
      docketIds: ids, status: 'Out for Delivery' as const,
    }]);
    showToast(`✅ Delivery run created — ${hubName}`);
  };

  const handleFailedDelivery = (docketId: string) => {
    const docket = getDocket(docketId);
    if (!docket) return;
    const attempts = (docket.redeliveryAttempts || 0) + 1;
    // Re-delivery charge: max(₹5/kg, ₹300 min) per attempt
    const charge = Math.max(5 * docket.chargeableWeight, 300);
    const existingRedelivery = docket.redeliveryCharge || 0;
    const totalRedelivery = existingRedelivery + charge;
    updateDocket(docketId, {
      status: 'Failed Delivery',
      redeliveryAttempts: attempts,
      redeliveryCharge: totalRedelivery,
      totalCharges: docket.totalCharges + charge,
    });
    showToast(`⚠️ ${docket.docketNumber} — Failed Delivery (attempt ${attempts}). Re-delivery charge ₹${charge.toLocaleString()} added.`);
  };

  const handleDeliveryComplete = (data: { receiverName: string; podFile: string | null }) => {
    const id = podModal.docketId;
    const docket = getDocket(id);
    updateDocket(id, { status: 'Delivered', podUploaded: true, receiverName: data.receiverName });
    setDeliveryRuns(prev => prev.map(r => {
      if (r.docketIds.includes(id)) {
        const allDone = r.docketIds.every(did => did === id || getDocket(did)?.status === 'Delivered');
        return { ...r, status: allDone ? 'Completed' as const : r.status };
      }
      return r;
    }));
    // Push to Finance bridge so invoice list auto-creates a draft invoice
    if (docket) {
      const conditionalCharges = docket.conditionalCharges || 0;
      const demurrageCharge = docket.demurrageCharge || 0;
      const redeliveryCharge = docket.redeliveryCharge || 0;
      const baseCharges = docket.totalCharges - conditionalCharges - demurrageCharge - redeliveryCharge;
      ptlStore.pushFinanceItem({
        docketId: id,
        docketNumber: docket.docketNumber,
        clientName: docket.clientName,
        pickupCity: docket.pickupCity,
        deliveryCity: docket.deliveryCity,
        totalCharges: docket.totalCharges,
        baseCharges,
        conditionalCharges: conditionalCharges || undefined,
        demurrageCharge: demurrageCharge || undefined,
        redeliveryCharge: redeliveryCharge || undefined,
        chargeableWeight: docket.chargeableWeight,
        pieces: docket.pieces,
        deliveryDate: new Date().toISOString().split('T')[0],
        receiverName: data.receiverName,
        invoiceNumber: docket.invoiceNumber,
      });
    }
    showToast(`✅ ${docket?.docketNumber} delivered. POD uploaded. Draft invoice queued in Finance.`);
  };

  // ─── Clickable Docket Number ─────────────────────────────────────────────
  const DocketLink: React.FC<{ docket: PTLDocket }> = ({ docket }) => (
    <button onClick={() => setDocketDetailModal({ open: true, docketId: docket.id })}
      className="text-orange-600 hover:text-orange-800 font-medium hover:underline transition-colors">
      {docket.docketNumber}
    </button>
  );

  // ─── Tabs ────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'first_mile' as const, label: 'First Mile', icon: Truck, color: 'green', desc: 'Pickup' },
    { id: 'hub' as const, label: 'Hub Ops', icon: Building2, color: 'orange', desc: 'Consolidation' },
    { id: 'line_haul' as const, label: 'Line Haul', icon: Route, color: 'blue', desc: 'Inter-Hub' },
    { id: 'last_mile' as const, label: 'Last Mile', icon: MapPin, color: 'purple', desc: 'Delivery' },
    { id: 'reports' as const, label: 'Reports', icon: BarChart3, color: 'green', desc: 'Analytics' },
  ];

  // ─── First Mile ──────────────────────────────────────────────────────────
  const renderFirstMile = () => {
    const pending = originDockets.filter(d => d.status === 'Created');
    return (
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-500" /> Pending Pickups ({pending.length} dockets)
              {!isAllHubs && <span className="text-xs text-gray-400 font-normal">— managed by {selectedHubName}</span>}
            </h3>
          </div>
          {Object.entries(pending.reduce((acc, d) => { (acc[d.pickupCity] = acc[d.pickupCity] || []).push(d); return acc; }, {} as Record<string, PTLDocket[]>)).map(([city, ds]) => (
            <Card key={city} className="p-0 mb-3 overflow-hidden">
              <div className="bg-green-50 px-4 py-2.5 border-b border-green-100 flex justify-between items-center">
                <span className="text-sm font-semibold text-green-800">
                  <MapPin className="w-3 h-3 inline mr-1" />{city} — {ds.length} dockets, {ds.reduce((s, d) => s + d.chargeableWeight, 0)} kg
                </span>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() =>
                  setVehicleModal({ open: true, mode: 'pickup', city, docketIds: ds.map(d => d.id) })}>
                  <Truck className="w-3 h-3 mr-1" /> Schedule Pickup
                </Button>
              </div>
              <div className="divide-y divide-gray-100">
                {ds.map(d => (
                  <div key={d.id} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getPriorityColor(d.priority)}`}>{d.priority[0]}</span>
                      <div>
                        <p className="text-sm"><DocketLink docket={d} /> <span className="text-gray-400">•</span> <span className="text-gray-500">{d.clientName}</span></p>
                        <p className="text-xs text-gray-400">{d.pickupAddress} → {d.deliveryCity} • {d.pieces} pcs • {d.chargeableWeight} kg</p>
                        <p className="text-[10px] text-blue-500">{d.originHub} → {d.destinationHub}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(d.status)}`}>{d.status}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
          {pending.length === 0 && <Card className="p-8 text-center text-gray-400 text-sm">No pending pickups{!isAllHubs ? ` for ${selectedHubName}` : ''}</Card>}
        </div>

        {/* Pickup Runs */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-500" /> Pickup Runs ({scopedPickupRuns.filter(r => r.status !== 'Completed').length} active)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scopedPickupRuns.filter(r => r.status !== 'Completed').map(run => (
              <Card key={run.id} className="p-4 border-l-4 border-l-green-500">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{run.vehicleType} — {run.vehiclePlate}</p>
                    <p className="text-xs text-gray-500">{run.driverName} • {run.city} • <span className="text-blue-500">{run.hub}</span></p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(run.status)}`}>{run.status}</span>
                </div>
                <div className="space-y-1">
                  {run.docketIds.map(did => {
                    const d = getDocket(did);
                    if (!d) return null;
                    return (
                      <div key={did} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <span className="text-xs font-medium text-gray-700"><DocketLink docket={d} /> — {d.clientName}</span>
                        {d.status === 'Pickup Scheduled' ? (
                          <Button size="sm" className="text-[10px] bg-green-600 text-white px-2 py-1 h-auto"
                            onClick={() => setPickupModal({ open: true, docketId: did })}>Confirm Pickup</Button>
                        ) : (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(d.status)}`}>{d.status}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── Hub Operations ──────────────────────────────────────────────────────
  const renderHubOperations = () => {
    const hubDockets = originDockets.filter(d => d.status === 'At Origin Hub');
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-500" /> Dockets at Hub ({hubDockets.length})
            {!isAllHubs && <span className="text-xs text-gray-400 font-normal">— {selectedHubName}</span>}
          </h3>
          {hubDockets.length > 0 ? (
            <Card className="p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Docket</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Days at Hub</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {hubDockets.map(d => {
                    const daysAtHub = d.hubInwardTime
                      ? Math.ceil((Date.now() - new Date(d.hubInwardTime).getTime()) / 86_400_000)
                      : null;
                    const runningDemurrage = calcDemurrageCharge(d);
                    return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><DocketLink docket={d} /></td>
                      <td className="px-4 py-3 text-gray-700">{d.clientName}</td>
                      <td className="px-4 py-3 text-gray-500">{d.originHub} → {d.destinationHub}</td>
                      <td className="px-4 py-3 text-gray-700">{d.chargeableWeight} kg</td>
                      <td className="px-4 py-3">
                        {daysAtHub !== null ? (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${runningDemurrage > 0 ? 'bg-red-100 text-red-700' : daysAtHub >= 5 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {daysAtHub}d{runningDemurrage > 0 ? ` • ₹${runningDemurrage.toLocaleString()} demurrage` : daysAtHub >= 5 ? ' • approaching free limit' : ''}
                          </span>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">{d.invoiceNumber ? <span className="text-xs text-green-600 font-medium">{d.invoiceNumber}</span> : <span className="text-xs text-gray-400">—</span>}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          ) : <Card className="p-8 text-center text-gray-400 text-sm">No dockets at hub</Card>}
        </div>

        {/* Consolidated Loads */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-500" /> Consolidated Loads ({scopedLoads.length})
            </h3>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleAutoConsolidate}>
              <RefreshCw className="w-3 h-3 mr-1" /> Auto-Consolidate
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scopedLoads.map(load => (
              <Card key={load.id} className="p-4 border-l-4 border-l-orange-500">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{load.originHub} → {load.destinationHub}</p>
                    <p className="text-xs text-gray-500">{load.docketIds.length} dockets • {load.totalWeight} kg • {load.totalVolume} m³</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(load.status)}`}>{load.status}</span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Vehicle: {load.vehicleType}</span>
                    <span className="font-medium text-orange-600">{load.utilizationPercent}% util.</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${load.utilizationPercent > 70 ? 'bg-green-500' : load.utilizationPercent > 40 ? 'bg-orange-400' : 'bg-red-400'}`} style={{ width: `${load.utilizationPercent}%` }} />
                  </div>
                </div>
                {load.assignedVehicle && <p className="text-xs text-blue-600 mb-2">🚛 {load.assignedVehicle} • {load.assignedDriver}</p>}
                <div className="flex gap-2">
                  {load.status === 'Planning' && (
                    <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => handleCreateIndent(load.id)}>Create Indent</Button>
                  )}
                  {load.status === 'Indent Created' && (
                    <Button size="sm" className="text-xs flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setLineHaulModal({ open: true, loadId: load.id })}>Assign Vehicle</Button>
                  )}
                  {load.status === 'Dispatched' && <span className="text-xs text-green-600 font-medium">✅ Dispatched</span>}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── Line Haul ───────────────────────────────────────────────────────────
  const renderLineHaul = () => (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
        <Route className="w-4 h-4 text-blue-500" /> Active Line Haul Trips ({scopedTrips.length})
      </h3>
      {scopedTrips.map(trip => (
        <Card key={trip.id} className="p-4 border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-base font-bold text-gray-900 flex items-center gap-2">
                {trip.origin} <ArrowRight className="w-4 h-4 text-gray-400" /> {trip.destination}
              </p>
              <p className="text-xs text-gray-500 mt-1">{trip.vehiclePlate} • {trip.driverName} • {trip.docketIds.length} dockets</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(trip.status)}`}>{trip.status}</span>
          </div>
          {trip.departureTime && (
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Dep: {trip.departureTime}</span>
                <span className="text-gray-500">ETA: {trip.eta}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all" style={{ width: `${trip.progress}%` }} />
              </div>
              <p className="text-xs text-center text-blue-600 font-medium mt-1">{trip.progress}% complete</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs flex-1"><Navigation className="w-3 h-3 mr-1" /> Track</Button>
            <Button size="sm" variant="outline" className="text-xs flex-1"><Phone className="w-3 h-3 mr-1" /> Contact</Button>
            <Button size="sm" variant="outline" className="text-xs flex-1"
              onClick={() => setManifestModal({ open: true, tripId: trip.id })}>
              <FileText className="w-3 h-3 mr-1" /> Manifest</Button>
            {trip.status === 'Reached' && (
              <Button size="sm" className="text-xs flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  setLineHaulTrips(prev => prev.map(t => t.id === trip.id ? { ...t, status: 'Completed' as const } : t));
                  const inwardTime = new Date().toISOString();
                  trip.docketIds.forEach(id => updateDocket(id, { status: 'At Destination Hub', hubInwardTime: inwardTime }));
                  showToast(`✅ Trip ${trip.id} unloaded at ${trip.destination}. Dockets ready for last-mile.`);
                }}>
                <CheckCircle className="w-3 h-3 mr-1" /> Unload</Button>
            )}
          </div>
        </Card>
      ))}
      {scopedTrips.length === 0 && <Card className="p-8 text-center text-gray-400 text-sm">No active line haul trips</Card>}
    </div>
  );

  // ─── Last Mile ───────────────────────────────────────────────────────────
  const renderLastMile = () => {
    const atDest = destDockets.filter(d => d.status === 'At Destination Hub');
    return (
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" /> Pending Cross-Dock ({atDest.length})
              {!isAllHubs && <span className="text-xs text-gray-400 font-normal">— managed by {selectedHubName}</span>}
            </h3>
            {atDest.length > 0 && (
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => setVehicleModal({ open: true, mode: 'delivery', city: atDest[0]?.deliveryCity || '', docketIds: atDest.map(d => d.id) })}>
                <Truck className="w-3 h-3 mr-1" /> Assign Delivery Vehicle
              </Button>
            )}
          </div>
          {atDest.length > 0 ? (
            <Card className="p-0 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {atDest.map(d => (
                  <div key={d.id} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="text-sm"><DocketLink docket={d} /> • {d.clientName}</p>
                      <p className="text-xs text-gray-400">{d.deliveryAddress}, {d.deliveryCity} • {d.chargeableWeight} kg</p>
                      <p className="text-[10px] text-purple-500">Managed by: {d.destinationHub}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getPriorityColor(d.priority)}`}>{d.priority}</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : <Card className="p-8 text-center text-gray-400 text-sm">No dockets pending cross-dock</Card>}
        </div>

        {/* Failed Deliveries — Re-schedule */}
        {(() => {
          const failedDockets = destDockets.filter(d => d.status === 'Failed Delivery');
          if (failedDockets.length === 0) return null;
          return (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Failed Deliveries ({failedDockets.length}) — Re-schedule
                </h3>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => setVehicleModal({ open: true, mode: 'delivery', city: failedDockets[0]?.deliveryCity || '', docketIds: failedDockets.map(d => d.id) })}>
                  <Truck className="w-3 h-3 mr-1" /> Re-assign Delivery Vehicle
                </Button>
              </div>
              <Card className="p-0 overflow-hidden border-red-200">
                <div className="divide-y divide-gray-100">
                  {failedDockets.map(d => (
                    <div key={d.id} className="px-4 py-3 flex justify-between items-center hover:bg-red-50/50">
                      <div>
                        <p className="text-sm"><DocketLink docket={d} /> • {d.clientName}</p>
                        <p className="text-xs text-gray-400">{d.deliveryAddress}, {d.deliveryCity} • {d.chargeableWeight} kg</p>
                        <p className="text-[10px] text-red-500">
                          {d.redeliveryAttempts || 0} failed attempt(s) • Re-delivery charge: ₹{(d.redeliveryCharge || 0).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-700">Failed Delivery</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          );
        })()}

        {/* Delivery Runs */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-purple-500" /> Delivery Runs ({scopedDeliveryRuns.filter(r => r.status !== 'Completed').length} active)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scopedDeliveryRuns.filter(r => r.status !== 'Completed').map(run => (
              <Card key={run.id} className="p-4 border-l-4 border-l-purple-500">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{run.city} — {run.area}</p>
                    <p className="text-xs text-gray-500">{run.vehiclePlate} • {run.driverName} • <span className="text-purple-500">{run.hub}</span></p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(run.status)}`}>{run.status}</span>
                </div>
                <div className="space-y-1">
                  {run.docketIds.map(did => {
                    const d = getDocket(did);
                    if (!d) return null;
                    return (
                      <div key={did} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-xs">
                        <div>
                          <DocketLink docket={d} />
                          <span className="text-gray-400 ml-2">{d.deliveryAddress}</span>
                        </div>
                        {d.status === 'Out for Delivery' ? (
                          <div className="flex gap-1">
                            <Button size="sm" className="text-[10px] bg-purple-600 text-white px-2 py-1 h-auto"
                              onClick={() => setPodModal({ open: true, docketId: did })}>Complete & POD</Button>
                            <Button size="sm" className="text-[10px] bg-red-500 text-white px-2 py-1 h-auto"
                              onClick={() => handleFailedDelivery(did)}>Failed</Button>
                          </div>
                        ) : d.status === 'Failed Delivery' ? (
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded font-medium ${getStatusColor(d.status)}`}>{d.status}</span>
                            {d.redeliveryAttempts && <span className="text-[10px] text-red-500">{d.redeliveryAttempts} attempt(s)</span>}
                          </div>
                        ) : (
                          <span className={`px-1.5 py-0.5 rounded font-medium ${getStatusColor(d.status)}`}>{d.status}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── Modal Data ──────────────────────────────────────────────────────────
  const vehicleModalDockets = vehicleModal.docketIds.map(id => {
    const d = getDocket(id);
    return { docketNumber: d?.docketNumber || '', pickupAddress: vehicleModal.mode === 'pickup' ? (d?.pickupAddress || '') : (d?.deliveryAddress || ''), weight: d?.chargeableWeight || 0 };
  });
  const pickupDocket = getDocket(pickupModal.docketId);
  const lineHaulLoad = consolidatedLoads.find(l => l.id === lineHaulModal.loadId);
  const podDocket = getDocket(podModal.docketId);
  const manifestTrip = lineHaulTrips.find(t => t.id === manifestModal.tripId);
  const detailDocket = getDocket(docketDetailModal.docketId);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60] bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl text-sm animate-in slide-in-from-top-2 duration-300 max-w-md">{toast}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PTL Operations</h1>
            <p className="text-sm text-gray-500">Hub-to-hub Part Truck Load lifecycle</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {/* Hub Selector */}
          <div className="relative">
            <select value={selectedHubId} onChange={e => setSelectedHubId(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 shadow-sm hover:border-gray-400 transition-colors cursor-pointer">
              <option value="all">🌐 All Hubs</option>
              {activeHubs.map(h => (
                <option key={h.id} value={h.id}>🏭 {h.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <Button variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
          <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => navigate('/tms/ptl/booking')}>
            <Plus className="w-4 h-4 mr-1" /> New Docket
          </Button>
        </div>
      </div>

      {/* Network View */}
      <PTLNetworkView hubs={hubs} docketCountByHub={docketCountByHub} activeTrips={networkTrips} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Pending', value: stats.pending, color: 'text-gray-600' },
          { label: 'In Pickup', value: stats.inPickup, color: 'text-green-600' },
          { label: 'At Hub', value: stats.atHub, color: 'text-orange-600' },
          { label: 'In Transit', value: stats.inTransit, color: 'text-blue-600' },
          { label: 'At Dest Hub', value: stats.atDest, color: 'text-indigo-600' },
          { label: 'Out for Del', value: stats.outDel, color: 'text-purple-600' },
          { label: 'Delivered', value: stats.delivered, color: 'text-emerald-600' },
        ].map(s => (
          <Card key={s.label} className="p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 text-sm font-medium transition-all border-b-2 ${isActive ? `border-${tab.color}-500 text-${tab.color}-700 bg-${tab.color}-50/50` : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}>
                <Icon className={`w-4 h-4 ${isActive ? `text-${tab.color}-500` : ''}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="text-xs text-gray-400 hidden md:inline">({tab.desc})</span>
              </button>
            );
          })}
        </div>
        <div className="p-6">
          {activeTab === 'first_mile' && renderFirstMile()}
          {activeTab === 'hub' && renderHubOperations()}
          {activeTab === 'line_haul' && renderLineHaul()}
          {activeTab === 'last_mile' && renderLastMile()}
          {activeTab === 'reports' && <PTLReports dockets={dockets.map(d => ({
            status: d.status, pickupCity: d.pickupCity, deliveryCity: d.deliveryCity,
            chargeableWeight: d.chargeableWeight, totalCharges: d.totalCharges,
            originHub: d.originHub, destinationHub: d.destinationHub,
            pickupDate: d.pickupDate, deliveryDate: d.deliveryDate,
          }))} />}
        </div>
      </div>

      {/* ─── Modals ─────────────────────────────────────────────────────────── */}
      <VehicleAllocationModal
        open={vehicleModal.open} onClose={() => setVehicleModal(prev => ({ ...prev, open: false }))}
        dockets={vehicleModalDockets} mode={vehicleModal.mode} city={vehicleModal.city}
        onAllocate={vehicleModal.mode === 'pickup' ? handlePickupAllocate : handleDeliveryAllocate}
      />

      {pickupDocket && (
        <PickupCompletionModal
          open={pickupModal.open} onClose={() => setPickupModal({ open: false, docketId: '' })}
          docketNumber={pickupDocket.docketNumber} clientName={pickupDocket.clientName} weight={pickupDocket.chargeableWeight}
          onComplete={handlePickupComplete}
        />
      )}

      {lineHaulLoad && (
        <LineHaulAssignModal
          open={lineHaulModal.open} onClose={() => setLineHaulModal({ open: false, loadId: '' })}
          originHub={lineHaulLoad.originHub} destHub={lineHaulLoad.destinationHub}
          docketCount={lineHaulLoad.docketIds.length} totalWeight={lineHaulLoad.totalWeight}
          vehicleType={lineHaulLoad.vehicleType} onAssign={handleLineHaulAssign}
        />
      )}

      {podDocket && (
        <PODUploadModal
          open={podModal.open} onClose={() => setPodModal({ open: false, docketId: '' })}
          docketNumber={podDocket.docketNumber} deliveryAddress={`${podDocket.deliveryAddress}, ${podDocket.deliveryCity}`}
          onComplete={handleDeliveryComplete}
        />
      )}

      {manifestTrip && (
        <ManifestModal
          open={manifestModal.open} onClose={() => setManifestModal({ open: false, tripId: '' })}
          tripId={manifestTrip.id} origin={manifestTrip.origin} destination={manifestTrip.destination}
          vehicle={manifestTrip.vehiclePlate} driver={manifestTrip.driverName} docketCount={manifestTrip.docketIds.length}
        />
      )}

      {detailDocket && (
        <DocketDetailModal
          open={docketDetailModal.open} onClose={() => setDocketDetailModal({ open: false, docketId: '' })}
          docket={detailDocket}
        />
      )}
    </div>
  );
};
