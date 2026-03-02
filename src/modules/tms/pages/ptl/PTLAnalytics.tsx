import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, BarChart2, PieChart as PieIcon, Download,
  Calendar, Filter, RefreshCw, Activity
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, FunnelChart, Funnel, LabelList
} from 'recharts';
import { ptlStore } from '../../services/ptlStore';
import type { PTLDocket, PTLCarrierVendor } from '../../services/ptlTypes';
import { getDocketRevenue, getDocketCost } from '../../services/ptlBillingEngine';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) { return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`; }

const STATUS_COLORS_MAP: Record<string, string> = {
  'Created': '#94A3B8', 'Pickup Scheduled': '#60A5FA', 'Picked Up': '#818CF8',
  'At Origin Hub': '#A78BFA', 'Manifested': '#FBBF24', 'In Transit': '#F97316',
  'At Destination Hub': '#22D3EE', 'Out for Delivery': '#F59E0B',
  'Delivered': '#22C55E', 'Delivery Attempted': '#EF4444',
  'RTO Initiated': '#F43F5E', 'RTO Completed': '#6B7280', 'Exception': '#DC2626',
};

const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#6366F1', '#EC4899', '#14B8A6'];

const FLEET_COLORS: Record<string, string> = {
  Own: '#3B82F6', Leased: '#8B5CF6', Market: '#F59E0B', Carrier: '#10B981',
};

type ChartTab = 'volume' | 'status' | 'revcost' | 'lanes' | 'clients' | 'carriers' | 'hubs' | 'exceptions';

// ─── Export to CSV ────────────────────────────────────────────────────────────

function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = [
    headers.join(','),
    ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
  ];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Weekly buckets ───────────────────────────────────────────────────────────

function getWeekLabel(dateStr: string) {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const week = Math.ceil(d.getDate() / 7);
  const month = d.toLocaleString('en', { month: 'short' });
  return `${month} W${week}`;
}

// ─── Chart Components ─────────────────────────────────────────────────────────

function VolumeChart({ dockets }: { dockets: PTLDocket[] }) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const data = useMemo(() => {
    const buckets: Record<string, number> = {};
    dockets.forEach(d => {
      let key = d.bookingDate;
      if (period === 'weekly') key = getWeekLabel(d.bookingDate);
      else if (period === 'monthly') key = d.bookingDate.slice(0, 7);
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-20)
      .map(([period, count]) => ({ period, count }));
  }, [dockets, period]);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-sm">Docket Volume Trend</h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['daily', 'weekly', 'monthly'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-2 py-1 text-xs rounded-md font-medium capitalize ${period === p ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="period" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="count" name="Dockets" stroke="#3B82F6" strokeWidth={2}
            dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatusDistributionChart({ dockets }: { dockets: PTLDocket[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    dockets.forEach(d => { counts[d.status] = (counts[d.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [dockets]);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Status Distribution</h3>
      <div className="flex items-start gap-4">
        <ResponsiveContainer width="50%" height={200}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
              dataKey="value" stroke="none">
              {data.map(entry => (
                <Cell key={entry.name} fill={STATUS_COLORS_MAP[entry.name] || '#94A3B8'} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-1.5 pt-2">
          {data.sort((a, b) => b.value - a.value).map(entry => (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: STATUS_COLORS_MAP[entry.name] || '#94A3B8' }} />
              <span className="text-gray-600 truncate flex-1">{entry.name}</span>
              <span className="font-semibold text-gray-900">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RevenueCostChart({ dockets }: { dockets: PTLDocket[] }) {
  const data = useMemo(() => {
    const months: Record<string, { revenue: number; cost: number; margin: number }> = {};
    dockets.filter(d => d.status === 'Delivered').forEach(d => {
      const month = d.bookingDate.slice(0, 7);
      months[month] = months[month] || { revenue: 0, cost: 0, margin: 0 };
      const rev = getDocketRevenue(d);
      const cost = getDocketCost(d);
      months[month].revenue += rev;
      months[month].cost += cost;
      months[month].margin += (rev - cost);
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }));
  }, [dockets]);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Revenue vs Cost vs Margin</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
          <Tooltip formatter={(v: any) => fmt(v)} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="revenue" name="Revenue" fill="#3B82F6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="cost" name="Cost" fill="#EF4444" radius={[3, 3, 0, 0]} />
          <Bar dataKey="margin" name="Margin" fill="#22C55E" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function OnTimeLanesChart({ dockets }: { dockets: PTLDocket[] }) {
  const data = useMemo(() => {
    const lanes: Record<string, { total: number; onTime: number }> = {};
    dockets.filter(d => d.status === 'Delivered' && d.actualDeliveryDate && d.promisedDeliveryDate).forEach(d => {
      const key = `${d.pickupCity}→${d.deliveryCity}`;
      lanes[key] = lanes[key] || { total: 0, onTime: 0 };
      lanes[key].total++;
      if (d.actualDeliveryDate! <= d.promisedDeliveryDate) lanes[key].onTime++;
    });
    return Object.entries(lanes)
      .map(([lane, v]) => ({ lane, otp: Math.round((v.onTime / v.total) * 100), total: v.total }))
      .sort((a, b) => b.otp - a.otp)
      .slice(0, 10);
  }, [dockets]);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">On-Time % by Lane (Top 10)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }}
            tickFormatter={v => `${v}%`} />
          <YAxis dataKey="lane" type="category" tick={{ fontSize: 10 }} width={80} />
          <Tooltip formatter={(v: any) => `${v}%`} />
          <Bar dataKey="otp" name="On-Time %" fill="#22C55E" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ClientRevenuePie({ dockets }: { dockets: PTLDocket[] }) {
  const data = useMemo(() => {
    const clients: Record<string, { clientName: string; revenue: number }> = {};
    dockets.filter(d => d.status === 'Delivered').forEach(d => {
      clients[d.clientId] = clients[d.clientId] || { clientName: d.clientName, revenue: 0 };
      clients[d.clientId].revenue += getDocketRevenue(d);
    });
    return Object.values(clients).sort((a, b) => b.revenue - a.revenue);
  }, [dockets]);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Revenue by Client</h3>
      <div className="flex items-start gap-4">
        <ResponsiveContainer width="50%" height={180}>
          <PieChart>
            <Pie data={data} dataKey="revenue" nameKey="clientName"
              cx="50%" cy="50%" outerRadius={70} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: any) => fmt(v)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2 pt-2">
          {data.map((entry, i) => (
            <div key={entry.clientName} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
              <span className="text-gray-600 truncate flex-1">{entry.clientName}</span>
              <span className="font-semibold text-gray-900">{fmt(entry.revenue)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CarrierPerformanceChart({ carriers }: { carriers: PTLCarrierVendor[] }) {
  const data = carriers.filter(c => c.onTimePercent !== undefined && c.claimRate !== undefined).map(c => ({
    name: c.name.split(' ').slice(0, 2).join(' '),
    otp: c.onTimePercent || 0,
    claimRate: c.claimRate || 0,
    totalDockets: c.totalDockets || 0,
  }));

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Carrier Performance (OTP% vs Claim Rate)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="otp" name="On-Time %" type="number" domain={[0, 100]}
            tick={{ fontSize: 10 }} label={{ value: 'OTP %', position: 'insideBottom', offset: -5, fontSize: 11 }} />
          <YAxis dataKey="claimRate" name="Claim Rate" type="number"
            tick={{ fontSize: 10 }} label={{ value: 'Claim %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.[0]) return null;
            const d = payload[0].payload;
            return (
              <div className="bg-white border rounded-lg p-2 text-xs shadow-lg">
                <div className="font-medium">{d.name}</div>
                <div>OTP: {d.otp}%</div>
                <div>Claims: {d.claimRate}%</div>
                <div>Dockets: {d.totalDockets}</div>
              </div>
            );
          }} />
          <Scatter data={data} fill="#3B82F6" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function HubThroughputChart({ dockets }: { dockets: PTLDocket[] }) {
  const HUBS = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata'];
  const data = HUBS.map(city => {
    const hubId = `HUB-${city.slice(0, 3).toUpperCase()}`;
    const inward = dockets.filter(d => d.originHubId === hubId).length;
    const outward = dockets.filter(d => d.destinationHubId === hubId).length;
    return { hub: city.slice(0, 3), inward, outward };
  });

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Hub Throughput (Inward vs Outward)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="hub" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="inward" name="Inward" fill="#3B82F6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="outward" name="Outward" fill="#22C55E" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ExceptionBreakdownChart({ dockets }: { dockets: PTLDocket[] }) {
  const exceptions = ptlStore.getExceptions();
  const data = useMemo(() => {
    const types: Record<string, number> = {};
    exceptions.forEach(e => { types[e.type] = (types[e.type] || 0) + 1; });
    return Object.entries(types).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  }, []);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Exception Types</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 90 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 10 }} />
          <YAxis dataKey="type" type="category" tick={{ fontSize: 10 }} width={90} />
          <Tooltip />
          <Bar dataKey="count" name="Count" fill="#EF4444" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Tabular Reports ──────────────────────────────────────────────────────────

function LaneReport({ dockets }: { dockets: PTLDocket[] }) {
  const data = useMemo(() => {
    const lanes: Record<string, {
      origin: string; dest: string; count: number; weight: number;
      revenue: number; onTime: number; delivered: number;
    }> = {};
    dockets.forEach(d => {
      const key = `${d.pickupCity}||${d.deliveryCity}`;
      lanes[key] = lanes[key] || { origin: d.pickupCity, dest: d.deliveryCity, count: 0, weight: 0, revenue: 0, onTime: 0, delivered: 0 };
      lanes[key].count++;
      lanes[key].weight += d.chargeableWeight;
      if (d.status === 'Delivered') {
        lanes[key].revenue += getDocketRevenue(d);
        lanes[key].delivered++;
        if (d.actualDeliveryDate && d.promisedDeliveryDate && d.actualDeliveryDate <= d.promisedDeliveryDate) {
          lanes[key].onTime++;
        }
      }
    });
    return Object.values(lanes).sort((a, b) => b.count - a.count);
  }, [dockets]);

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-gray-900 text-sm">Lane Performance</h3>
        <button onClick={() => exportCSV(data as unknown as Record<string, unknown>[], 'ptl-lane-performance')}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
          <Download size={12} /> Export
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            {['Lane', 'Dockets', 'Avg Weight', 'Revenue', 'OTP%'].map(h => (
              <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.slice(0, 20).map(row => (
            <tr key={`${row.origin}-${row.dest}`} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 font-medium text-gray-900 text-sm">
                {row.origin} → {row.dest}
              </td>
              <td className="px-4 py-2.5 text-gray-600">{row.count}</td>
              <td className="px-4 py-2.5 text-gray-600">{row.count > 0 ? (row.weight / row.count).toFixed(0) : 0}kg</td>
              <td className="px-4 py-2.5 text-gray-700 font-medium">{fmt(row.revenue)}</td>
              <td className="px-4 py-2.5">
                <span className={`text-xs font-medium ${row.delivered > 0 ? (row.onTime / row.delivered * 100 >= 85 ? 'text-green-600' : 'text-amber-600') : 'text-gray-400'}`}>
                  {row.delivered > 0 ? `${Math.round(row.onTime / row.delivered * 100)}%` : '—'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClientReport({ dockets }: { dockets: PTLDocket[] }) {
  const data = useMemo(() => {
    const clients: Record<string, {
      clientName: string; count: number; revenue: number;
      onTime: number; delivered: number; claimCount: number;
    }> = {};
    const exceptions = ptlStore.getExceptions();
    dockets.forEach(d => {
      clients[d.clientId] = clients[d.clientId] || { clientName: d.clientName, count: 0, revenue: 0, onTime: 0, delivered: 0, claimCount: 0 };
      clients[d.clientId].count++;
      if (d.status === 'Delivered') {
        clients[d.clientId].revenue += getDocketRevenue(d);
        clients[d.clientId].delivered++;
        if (d.actualDeliveryDate && d.promisedDeliveryDate && d.actualDeliveryDate <= d.promisedDeliveryDate) {
          clients[d.clientId].onTime++;
        }
      }
    });
    exceptions.forEach(e => {
      if (e.claimAmount && clients[e.clientName]) clients[e.clientName].claimCount++;
    });
    return Object.values(clients).sort((a, b) => b.revenue - a.revenue);
  }, [dockets]);

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-gray-900 text-sm">Client Performance</h3>
        <button onClick={() => exportCSV(data as unknown as Record<string, unknown>[], 'ptl-client-performance')}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
          <Download size={12} /> Export
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            {['Client', 'Dockets', 'Revenue', 'OTP%', 'Claims'].map(h => (
              <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map(row => (
            <tr key={row.clientName} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 font-medium text-gray-900">{row.clientName}</td>
              <td className="px-4 py-2.5 text-gray-600">{row.count}</td>
              <td className="px-4 py-2.5 font-medium text-blue-700">{fmt(row.revenue)}</td>
              <td className="px-4 py-2.5">
                <span className={`text-xs font-medium ${row.delivered > 0 ? (row.onTime / row.delivered * 100 >= 85 ? 'text-green-600' : 'text-amber-600') : 'text-gray-400'}`}>
                  {row.delivered > 0 ? `${Math.round(row.onTime / row.delivered * 100)}%` : '—'}
                </span>
              </td>
              <td className="px-4 py-2.5 text-gray-600">{row.claimCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CarrierReport({ carriers }: { carriers: PTLCarrierVendor[] }) {
  const data = carriers.map(c => ({
    name: c.name, type: c.vendorType,
    dockets: c.totalDockets || 0,
    otp: c.onTimePercent ? `${c.onTimePercent}%` : '—',
    claimRate: c.claimRate ? `${c.claimRate}%` : '—',
    score: c.performanceScore?.toFixed(0) || '—',
    status: c.status,
  }));

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-gray-900 text-sm">Carrier Performance</h3>
        <button onClick={() => exportCSV(data as unknown as Record<string, unknown>[], 'ptl-carrier-performance')}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
          <Download size={12} /> Export
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            {['Carrier', 'Type', 'Dockets', 'OTP%', 'Claim Rate', 'Score', 'Status'].map(h => (
              <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map(row => (
            <tr key={row.name} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 font-medium text-gray-900">{row.name}</td>
              <td className="px-4 py-2.5 text-xs text-gray-500">{row.type}</td>
              <td className="px-4 py-2.5 text-gray-600">{row.dockets}</td>
              <td className="px-4 py-2.5">
                <span className={`text-xs font-medium ${row.otp !== '—' && parseInt(row.otp) >= 85 ? 'text-green-600' : 'text-amber-600'}`}>
                  {row.otp}
                </span>
              </td>
              <td className="px-4 py-2.5 text-gray-600">{row.claimRate}</td>
              <td className="px-4 py-2.5 font-medium text-gray-900">{row.score}</td>
              <td className="px-4 py-2.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  row.status === 'Active' ? 'bg-green-100 text-green-700' :
                  row.status === 'Blacklisted' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                }`}>{row.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 shadow-sm border ${color}`}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type ReportTab = 'lane' | 'client' | 'carrier';

export default function PTLAnalytics() {
  const [dockets, setDockets] = useState<PTLDocket[]>([]);
  const [carriers, setCarriers] = useState<PTLCarrierVendor[]>([]);
  const [reportTab, setReportTab] = useState<ReportTab>('lane');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const load = () => {
      setDockets(ptlStore.getDockets());
      setCarriers(ptlStore.getCarriers());
    };
    load();
    const unsub = ptlStore.subscribe(load);
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    return dockets.filter(d => {
      const afterFrom = !dateFrom || d.bookingDate >= dateFrom;
      const beforeTo = !dateTo || d.bookingDate <= dateTo;
      return afterFrom && beforeTo;
    });
  }, [dockets, dateFrom, dateTo]);

  const deliveredCount = filtered.filter(d => d.status === 'Delivered').length;
  const totalDockets = filtered.length;
  const exceptions = ptlStore.getExceptions();
  const exceptionRate = totalDockets > 0 ? ((exceptions.length / totalDockets) * 100).toFixed(1) : '0.0';
  const onTime = filtered.filter(d =>
    d.status === 'Delivered' && d.actualDeliveryDate && d.promisedDeliveryDate &&
    d.actualDeliveryDate <= d.promisedDeliveryDate
  ).length;
  const otpPct = deliveredCount > 0 ? `${Math.round((onTime / deliveredCount) * 100)}%` : '—';

  const totalRevenue = filtered.filter(d => d.status === 'Delivered')
    .reduce((s, d) => s + getDocketRevenue(d), 0);

  const avgTransit = (() => {
    const with_dates = filtered.filter(d => d.actualDeliveryDate && d.actualPickupDate);
    if (with_dates.length === 0) return '—';
    const avg = with_dates.reduce((s, d) => {
      const days = (new Date(d.actualDeliveryDate!).getTime() - new Date(d.actualPickupDate!).getTime()) / 86400000;
      return s + days;
    }, 0) / with_dates.length;
    return `${avg.toFixed(1)} days`;
  })();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">PTL Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Performance metrics, trends and tabular reports</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="border rounded-lg px-3 py-2 text-sm bg-white" value={dateFrom}
            onChange={e => setDateFrom(e.target.value)} placeholder="From" />
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" className="border rounded-lg px-3 py-2 text-sm bg-white" value={dateTo}
            onChange={e => setDateTo(e.target.value)} placeholder="To" />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KpiChip label="Total Dockets" value={String(totalDockets)} color="bg-white" />
        <KpiChip label="Delivered" value={String(deliveredCount)} color="bg-white" />
        <KpiChip label="On-Time %" value={otpPct} color="bg-white" />
        <KpiChip label="Exception Rate" value={`${exceptionRate}%`} color="bg-white" />
        <KpiChip label="Avg Transit" value={avgTransit} color="bg-white" />
        <KpiChip label="Revenue" value={fmt(totalRevenue)} color="bg-white" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
        <VolumeChart dockets={filtered} />
        <StatusDistributionChart dockets={filtered} />
        <RevenueCostChart dockets={filtered} />
        <OnTimeLanesChart dockets={filtered} />
        <ClientRevenuePie dockets={filtered} />
        <CarrierPerformanceChart carriers={carriers} />
        <HubThroughputChart dockets={filtered} />
        <ExceptionBreakdownChart dockets={filtered} />
      </div>

      {/* Tabular Reports */}
      <div>
        <div className="flex gap-1 mb-4 bg-white border rounded-xl p-1 w-fit shadow-sm">
          {([['lane', 'Lane Performance'], ['client', 'Client Report'], ['carrier', 'Carrier Report']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setReportTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${reportTab === id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              {label}
            </button>
          ))}
        </div>
        {reportTab === 'lane' && <LaneReport dockets={filtered} />}
        {reportTab === 'client' && <ClientReport dockets={filtered} />}
        {reportTab === 'carrier' && <CarrierReport carriers={carriers} />}
      </div>
    </div>
  );
}
