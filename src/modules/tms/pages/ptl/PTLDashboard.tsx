import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, Package, AlertTriangle, TrendingUp, TrendingDown,
  CheckCircle, Clock, Truck, Building2, Activity,
  IndianRupee, RefreshCw, ChevronRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { ptlStore } from '../../services/ptlStore';
import type { PTLDocket, PTLException } from '../../services/ptlTypes';
import { getDocketRevenue, getDocketCost, calculateMargin } from '../../services/ptlBillingEngine';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_ORDER = [
  'Created', 'Pickup Scheduled', 'Picked Up', 'At Origin Hub',
  'Manifested', 'In Transit', 'At Destination Hub',
  'Out for Delivery', 'Delivered'
];

const INITIAL_HUBS = [
  { id: 'HUB-MUM', name: 'Mumbai Hub', city: 'Mumbai' },
  { id: 'HUB-DEL', name: 'Delhi Hub', city: 'Delhi' },
  { id: 'HUB-BLR', name: 'Bangalore Hub', city: 'Bangalore' },
  { id: 'HUB-CHN', name: 'Chennai Hub', city: 'Chennai' },
  { id: 'HUB-HYD', name: 'Hyderabad Hub', city: 'Hyderabad' },
  { id: 'HUB-KOL', name: 'Kolkata Hub', city: 'Kolkata' },
];

const SEVERITY_COLOR: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700 border-red-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low: 'bg-blue-100 text-blue-700 border-blue-200',
};

const FLEET_COLORS: Record<string, string> = {
  Own: '#3B82F6', Leased: '#8B5CF6', Market: '#F59E0B', Carrier: '#10B981',
};

const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#6366F1', '#EC4899'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) { return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`; }

function KpiCard({ label, value, sub, icon, trend, color }: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; trend?: { dir: 'up' | 'down'; label: string }; color: string;
}) {
  return (
    <div className={`rounded-xl p-4 shadow-sm border ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-gray-500">{label}</div>
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="flex items-center gap-2">
        {sub && <span className="text-xs text-gray-500">{sub}</span>}
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend.dir === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend.dir === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend.label}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Pipeline Funnel ─────────────────────────────────────────────────────────

function PipelineFunnel({ dockets }: { dockets: PTLDocket[] }) {
  const counts = STATUS_ORDER.map(s => ({
    status: s.split(' ').slice(-1)[0], // short label
    fullStatus: s,
    count: dockets.filter(d => d.status === s).length,
  })).filter(s => s.count > 0);

  const max = Math.max(...counts.map(c => c.count), 1);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Docket Pipeline</h3>
      <div className="space-y-2">
        {counts.map((s, i) => (
          <div key={s.fullStatus} className="flex items-center gap-3">
            <div className="w-28 text-xs text-gray-500 text-right truncate">{s.fullStatus}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
              <div
                className="h-5 rounded-full flex items-center justify-end pr-2 transition-all"
                style={{
                  width: `${Math.max((s.count / max) * 100, 8)}%`,
                  background: `hsl(${220 - i * 15}, 70%, ${55 + i * 3}%)`,
                }}
              >
                <span className="text-xs text-white font-semibold">{s.count}</span>
              </div>
            </div>
          </div>
        ))}
        {counts.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">No active dockets in pipeline</div>
        )}
      </div>
    </div>
  );
}

// ─── Hub Utilization Cards ────────────────────────────────────────────────────

function HubUtilization({ dockets }: { dockets: PTLDocket[] }) {
  const hubCounts = INITIAL_HUBS.map(hub => {
    const atHub = dockets.filter(
      d => (d.originHubId === hub.id || d.destinationHubId === hub.id) &&
        ['At Origin Hub', 'Manifested', 'At Destination Hub'].includes(d.status)
    ).length;
    const capacity = 50; // mock capacity
    return { ...hub, count: atHub, capacity, pct: Math.min((atHub / capacity) * 100, 100) };
  });

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Hub Utilization</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {hubCounts.map(hub => (
          <div key={hub.id} className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={13} className="text-blue-500" />
              <span className="text-xs font-medium text-gray-700">{hub.city}</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{hub.count}</div>
            <div className="text-xs text-gray-400 mb-2">of {hub.capacity} capacity</div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${hub.pct > 80 ? 'bg-red-500' : hub.pct > 60 ? 'bg-amber-500' : 'bg-green-500'}`}
                style={{ width: `${hub.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Exception Alerts ─────────────────────────────────────────────────────────

function ExceptionAlerts({ exceptions }: { exceptions: PTLException[] }) {
  const critical = exceptions.filter(
    e => ['Critical', 'High'].includes(e.severity) && e.status !== 'Resolved'
  ).slice(0, 5);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-sm">Exception Alerts</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${critical.length > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {critical.length} urgent
        </span>
      </div>
      {critical.length === 0 ? (
        <div className="flex items-center gap-2 text-green-600 text-sm py-3">
          <CheckCircle size={16} />
          <span>No critical exceptions — all clear!</span>
        </div>
      ) : (
        <div className="space-y-2">
          {critical.map(ex => (
            <div key={ex.id} className={`border rounded-lg p-3 ${SEVERITY_COLOR[ex.severity]}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{ex.docketNumber}</div>
                  <div className="text-xs mt-0.5">{ex.type} · {ex.clientName}</div>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 bg-white/60 rounded-full">
                  {ex.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Recent Activity ──────────────────────────────────────────────────────────

const STATUS_ICONS: Record<string, React.ReactNode> = {
  'Delivered': <CheckCircle size={14} className="text-green-600" />,
  'In Transit': <Truck size={14} className="text-blue-600" />,
  'Out for Delivery': <Truck size={14} className="text-amber-600" />,
  'Exception': <AlertTriangle size={14} className="text-red-600" />,
  default: <Package size={14} className="text-gray-500" />,
};

function RecentActivity({ dockets }: { dockets: PTLDocket[] }) {
  const recent = [...dockets]
    .sort((a, b) => (b.lastUpdatedAt || b.createdAt).localeCompare(a.lastUpdatedAt || a.createdAt))
    .slice(0, 10);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {recent.map(d => (
          <div key={d.id} className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0">
              {STATUS_ICONS[d.status] || STATUS_ICONS.default}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs text-gray-900">{d.docketNumber}</span>
                <span className="text-xs text-gray-500">·</span>
                <span className="text-xs text-gray-500 truncate">{d.status}</span>
              </div>
              <div className="text-xs text-gray-400">{d.clientName} · {d.pickupCity} → {d.deliveryCity}</div>
            </div>
            <div className="text-xs text-gray-300 flex-shrink-0">{(d.lastUpdatedAt || d.createdAt).split('T')[0]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Top Lanes Bar Chart ──────────────────────────────────────────────────────

function TopLanes({ dockets }: { dockets: PTLDocket[] }) {
  const laneData = useMemo(() => {
    const lanes: Record<string, number> = {};
    dockets.forEach(d => {
      const key = `${d.pickupCity} → ${d.deliveryCity}`;
      lanes[key] = (lanes[key] || 0) + 1;
    });
    return Object.entries(lanes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([lane, count]) => ({ lane: lane.replace(' → ', ' →\n'), count }));
  }, [dockets]);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Top Lanes by Volume</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={laneData} margin={{ top: 0, right: 0, bottom: 40, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="lane" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" name="Dockets" fill="#3B82F6" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Fleet Model Pie ──────────────────────────────────────────────────────────

function FleetModelPie({ dockets }: { dockets: PTLDocket[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    dockets.forEach(d => { counts[d.fleetModel] = (counts[d.fleetModel] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [dockets]);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Dockets by Fleet Model</h3>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width="50%" height={160}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
              dataKey="value" stroke="none">
              {data.map((entry) => (
                <Cell key={entry.name} fill={FLEET_COLORS[entry.name] || '#6B7280'} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2 flex-1">
          {data.map(entry => (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: FLEET_COLORS[entry.name] || '#6B7280' }} />
              <span className="text-xs text-gray-600 flex-1">{entry.name}</span>
              <span className="text-xs font-semibold text-gray-900">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Revenue vs Cost (Mini bar) ───────────────────────────────────────────────

function RevenueVsCost({ dockets }: { dockets: PTLDocket[] }) {
  const data = useMemo(() => {
    // Group by client
    const clients: Record<string, { clientName: string; revenue: number; cost: number }> = {};
    dockets.filter(d => d.status === 'Delivered').forEach(d => {
      clients[d.clientId] = clients[d.clientId] || { clientName: d.clientName, revenue: 0, cost: 0 };
      clients[d.clientId].revenue += getDocketRevenue(d);
      clients[d.clientId].cost += getDocketCost(d);
    });
    return Object.values(clients).slice(0, 6);
  }, [dockets]);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Revenue vs Cost by Client</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="clientName" tick={{ fontSize: 10 }}
            tickFormatter={v => v.split(' ')[0]} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
          <Tooltip formatter={(v: any) => fmt(v)} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="revenue" name="Revenue" fill="#3B82F6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="cost" name="Cost" fill="#EF4444" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function PTLDashboard() {
  const [dockets, setDockets] = useState<PTLDocket[]>([]);
  const [exceptions, setExceptions] = useState<PTLException[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const load = () => {
      setDockets(ptlStore.getDockets());
      setExceptions(ptlStore.getExceptions());
    };
    load();
    const unsub = ptlStore.subscribe(load);
    return unsub;
  }, []);

  const refresh = () => {
    setDockets(ptlStore.getDockets());
    setExceptions(ptlStore.getExceptions());
    setLastRefresh(new Date());
  };

  // KPI Computations
  const today = new Date().toISOString().split('T')[0];
  const todayDockets = dockets.filter(d => d.bookingDate === today);
  const activeDockets = dockets.filter(d => !['Delivered', 'RTO Completed'].includes(d.status));
  const deliveredDockets = dockets.filter(d => d.status === 'Delivered');
  const openExceptions = exceptions.filter(e => e.status !== 'Resolved');

  const onTimeDelivered = deliveredDockets.filter(d => {
    if (!d.actualDeliveryDate || !d.promisedDeliveryDate) return false;
    return d.actualDeliveryDate <= d.promisedDeliveryDate;
  });
  const otpPct = deliveredDockets.length > 0
    ? (onTimeDelivered.length / deliveredDockets.length) * 100 : 0;

  const totalRevenue = dockets.filter(d => d.status === 'Delivered')
    .reduce((s, d) => s + getDocketRevenue(d), 0);
  const totalCost = dockets.filter(d => d.status === 'Delivered')
    .reduce((s, d) => s + getDocketCost(d), 0);
  const { grossMargin } = calculateMargin(totalRevenue, totalCost);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">PTL Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Last refreshed: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 shadow-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KpiCard
          label="Today's Bookings"
          value={String(todayDockets.length)}
          sub="dockets created today"
          icon={<Package size={16} className="text-blue-600" />}
          color="bg-white"
        />
        <KpiCard
          label="Active Dockets"
          value={String(activeDockets.length)}
          sub="in transit or pending"
          icon={<Truck size={16} className="text-amber-600" />}
          color="bg-white"
        />
        <KpiCard
          label="Open Exceptions"
          value={String(openExceptions.length)}
          sub={`${exceptions.filter(e => e.severity === 'Critical' && e.status !== 'Resolved').length} critical`}
          icon={<AlertTriangle size={16} className="text-red-500" />}
          color="bg-white"
        />
        <KpiCard
          label="On-Time %"
          value={`${otpPct.toFixed(0)}%`}
          sub={`${onTimeDelivered.length}/${deliveredDockets.length} delivered`}
          icon={<CheckCircle size={16} className="text-green-600" />}
          color="bg-white"
        />
        <KpiCard
          label="Revenue (Delivered)"
          value={fmt(totalRevenue)}
          sub="total billed to clients"
          icon={<IndianRupee size={16} className="text-blue-600" />}
          color="bg-white"
        />
        <KpiCard
          label="Gross Margin"
          value={fmt(grossMargin)}
          sub={totalRevenue > 0 ? `${((grossMargin / totalRevenue) * 100).toFixed(1)}% margin` : '—'}
          icon={<TrendingUp size={16} className="text-green-600" />}
          color="bg-white"
        />
      </div>

      {/* ── Status Pills ── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { label: 'Created', color: 'bg-gray-100 text-gray-700' },
          { label: 'Pickup Scheduled', color: 'bg-blue-100 text-blue-700' },
          { label: 'Picked Up', color: 'bg-indigo-100 text-indigo-700' },
          { label: 'At Origin Hub', color: 'bg-purple-100 text-purple-700' },
          { label: 'Manifested', color: 'bg-yellow-100 text-yellow-700' },
          { label: 'In Transit', color: 'bg-orange-100 text-orange-700' },
          { label: 'At Destination Hub', color: 'bg-cyan-100 text-cyan-700' },
          { label: 'Out for Delivery', color: 'bg-amber-100 text-amber-700' },
          { label: 'Delivered', color: 'bg-green-100 text-green-700' },
          { label: 'Exception', color: 'bg-red-100 text-red-700' },
          { label: 'RTO Initiated', color: 'bg-rose-100 text-rose-700' },
        ].map(s => {
          const count = dockets.filter(d => d.status === s.label).length;
          if (count === 0) return null;
          return (
            <div key={s.label} className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${s.color}`}>
              <span>{s.label}</span>
              <span className="font-bold">{count}</span>
            </div>
          );
        })}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="xl:col-span-2 space-y-4">
          <PipelineFunnel dockets={dockets} />
          <TopLanes dockets={dockets} />
          <RevenueVsCost dockets={dockets} />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <ExceptionAlerts exceptions={exceptions} />
          <FleetModelPie dockets={dockets} />
          <HubUtilization dockets={dockets} />
          <RecentActivity dockets={dockets} />
        </div>
      </div>
    </div>
  );
}
