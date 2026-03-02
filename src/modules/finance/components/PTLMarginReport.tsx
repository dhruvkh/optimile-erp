import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, IndianRupee, Download,
  BarChart2, Filter, RefreshCw, Package, Truck,
  ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import * as XLSX from 'xlsx';
import { ptlStore } from '../../tms/services/ptlStore';
import type { PTLDocket } from '../../tms/services/ptlTypes';
import { getDocketRevenue, getDocketCost, calculateMargin } from '../../tms/services/ptlBillingEngine';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatINR = (n: number) =>
  `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon, positive
}: { label: string; value: string; sub?: string; icon: React.ReactNode; positive?: boolean }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      {sub && (
        <div className={`text-xs font-medium ${positive === undefined ? 'text-gray-400' : positive ? 'text-green-600' : 'text-red-600'}`}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Export to XLSX ───────────────────────────────────────────────────────────

function exportXLSX(data: Record<string, unknown>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PTL Margin');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── Month label ──────────────────────────────────────────────────────────────

function monthLabel(d: string) {
  const [y, m] = d.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
}

// ─── Docket Row ───────────────────────────────────────────────────────────────

function DocketRow({ d, rank }: { d: PTLDocket; rank: number }) {
  const [open, setOpen] = useState(false);
  const rev = getDocketRevenue(d);
  const cost = getDocketCost(d);
  const margin = rev - cost;
  const pct = rev > 0 ? (margin / rev) * 100 : 0;

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer border-b"
        onClick={() => setOpen(!open)}
      >
        <td className="px-4 py-3 text-xs text-gray-400">{rank}</td>
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900 text-sm">{d.docketNumber}</div>
          {d.lrNumber && <div className="text-xs text-gray-400">{d.lrNumber}</div>}
        </td>
        <td className="px-4 py-3 text-sm text-gray-700">{d.clientName}</td>
        <td className="px-4 py-3 text-xs text-gray-500">{d.pickupCity} → {d.deliveryCity}</td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            d.fleetModel === 'Own' ? 'bg-blue-100 text-blue-700' :
            d.fleetModel === 'Leased' ? 'bg-purple-100 text-purple-700' :
            d.fleetModel === 'Market' ? 'bg-orange-100 text-orange-700' :
            'bg-green-100 text-green-700'
          }`}>{d.fleetModel}</span>
        </td>
        <td className="px-4 py-3 text-sm font-medium text-blue-700">{formatINR(rev)}</td>
        <td className="px-4 py-3 text-sm font-medium text-red-600">{formatINR(cost)}</td>
        <td className={`px-4 py-3 text-sm font-bold ${margin >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          {formatINR(margin)}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-14 bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${pct >= 20 ? 'bg-green-500' : pct >= 10 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${pct >= 20 ? 'text-green-700' : pct >= 10 ? 'text-amber-700' : 'text-red-700'}`}>
              {fmtPct(pct)}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">{d.actualDeliveryDate || d.bookingDate}</td>
        <td className="px-4 py-3">
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </td>
      </tr>
      {open && (
        <tr className="bg-blue-50/30 border-b">
          <td colSpan={11} className="px-8 py-3">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-xs">
              <div><span className="text-gray-400">Base Freight</span><div className="font-medium">{formatINR(d.baseFreightCharge)}</div></div>
              <div><span className="text-gray-400">ODA</span><div className="font-medium">{formatINR(d.odaCharge)}</div></div>
              <div><span className="text-gray-400">FOV</span><div className="font-medium">{formatINR(d.fovCharge)}</div></div>
              <div><span className="text-gray-400">Fuel Surcharge</span><div className="font-medium">{formatINR(d.fuelSurcharge)}</div></div>
              {d.codCharge ? <div><span className="text-gray-400">COD</span><div className="font-medium">{formatINR(d.codCharge)}</div></div> : null}
              {d.demurrageCharge ? <div><span className="text-gray-400">Demurrage</span><div className="font-medium">{formatINR(d.demurrageCharge)}</div></div> : null}
              <div><span className="text-gray-400">Carrier Cost</span><div className="font-medium text-red-600">{cost > 0 ? formatINR(cost) : '—'}</div></div>
              <div><span className="text-gray-400">Weight</span><div className="font-medium">{d.chargeableWeight}kg</div></div>
              <div><span className="text-gray-400">Pieces</span><div className="font-medium">{d.totalPieces}</div></div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type GroupBy = 'docket' | 'client' | 'lane' | 'fleet';

export default function PTLMarginReport() {
  const [dockets, setDockets] = useState<PTLDocket[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [fleetFilter, setFleetFilter] = useState('all');
  const [groupBy, setGroupBy] = useState<GroupBy>('docket');
  const [sortField, setSortField] = useState<'margin' | 'revenue' | 'cost' | 'pct'>('margin');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const load = () => setDockets(ptlStore.getDockets());
    load();
    const unsub = ptlStore.subscribe(load);
    return unsub;
  }, []);

  // ── Filtered Dockets ──────────────────────────────────────────────────────

  const deliveredDockets = useMemo(() => {
    return dockets.filter(d => {
      if (d.status !== 'Delivered') return false;
      if (dateFrom && d.bookingDate < dateFrom) return false;
      if (dateTo && d.bookingDate > dateTo) return false;
      if (clientFilter !== 'all' && d.clientId !== clientFilter) return false;
      if (fleetFilter !== 'all' && d.fleetModel !== fleetFilter) return false;
      if (carrierFilter !== 'all' && d.carrierVendorId !== carrierFilter) return false;
      return true;
    });
  }, [dockets, dateFrom, dateTo, clientFilter, carrierFilter, fleetFilter]);

  // ── Aggregates ────────────────────────────────────────────────────────────

  const totalRevenue = deliveredDockets.reduce((s, d) => s + getDocketRevenue(d), 0);
  const totalCost = deliveredDockets.reduce((s, d) => s + getDocketCost(d), 0);
  const { grossMargin, marginPercent } = calculateMargin(totalRevenue, totalCost);

  const aboveTarget = deliveredDockets.filter(d => {
    const rev = getDocketRevenue(d);
    const cost = getDocketCost(d);
    return rev > 0 && ((rev - cost) / rev) * 100 >= 20;
  }).length;

  // ── Monthly Chart Data ────────────────────────────────────────────────────

  const monthlyData = useMemo(() => {
    const months: Record<string, { revenue: number; cost: number; margin: number }> = {};
    deliveredDockets.forEach(d => {
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
      .map(([m, v]) => ({ month: monthLabel(m), ...v }));
  }, [deliveredDockets]);

  // ── Clients for filter ────────────────────────────────────────────────────

  const clients = useMemo(() => {
    const m: Record<string, string> = {};
    dockets.forEach(d => { m[d.clientId] = d.clientName; });
    return Object.entries(m);
  }, [dockets]);

  const carriers = useMemo(() => {
    const m: Record<string, string> = {};
    dockets.filter(d => d.carrierVendorId).forEach(d => {
      m[d.carrierVendorId!] = d.carrierVendorName || d.carrierVendorId!;
    });
    return Object.entries(m);
  }, [dockets]);

  // ── Sorted dockets ────────────────────────────────────────────────────────

  const sortedDockets = useMemo(() => {
    return [...deliveredDockets].sort((a, b) => {
      const aRev = getDocketRevenue(a), aCost = getDocketCost(a);
      const bRev = getDocketRevenue(b), bCost = getDocketCost(b);
      const getVal = (d: PTLDocket, rev: number, cost: number) => {
        if (sortField === 'revenue') return rev;
        if (sortField === 'cost') return cost;
        if (sortField === 'margin') return rev - cost;
        return rev > 0 ? ((rev - cost) / rev) * 100 : 0;
      };
      const aVal = getVal(a, aRev, aCost);
      const bVal = getVal(b, bRev, bCost);
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [deliveredDockets, sortField, sortDir]);

  // ── Grouped views ─────────────────────────────────────────────────────────

  const clientGroups = useMemo(() => {
    const g: Record<string, { clientName: string; count: number; revenue: number; cost: number }> = {};
    deliveredDockets.forEach(d => {
      g[d.clientId] = g[d.clientId] || { clientName: d.clientName, count: 0, revenue: 0, cost: 0 };
      g[d.clientId].count++;
      g[d.clientId].revenue += getDocketRevenue(d);
      g[d.clientId].cost += getDocketCost(d);
    });
    return Object.values(g).sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost));
  }, [deliveredDockets]);

  const laneGroups = useMemo(() => {
    const g: Record<string, { lane: string; count: number; revenue: number; cost: number }> = {};
    deliveredDockets.forEach(d => {
      const key = `${d.pickupCity} → ${d.deliveryCity}`;
      g[key] = g[key] || { lane: key, count: 0, revenue: 0, cost: 0 };
      g[key].count++;
      g[key].revenue += getDocketRevenue(d);
      g[key].cost += getDocketCost(d);
    });
    return Object.values(g).sort((a, b) => b.count - a.count);
  }, [deliveredDockets]);

  const fleetGroups = useMemo(() => {
    const g: Record<string, { fleet: string; count: number; revenue: number; cost: number }> = {};
    deliveredDockets.forEach(d => {
      g[d.fleetModel] = g[d.fleetModel] || { fleet: d.fleetModel, count: 0, revenue: 0, cost: 0 };
      g[d.fleetModel].count++;
      g[d.fleetModel].revenue += getDocketRevenue(d);
      g[d.fleetModel].cost += getDocketCost(d);
    });
    return Object.values(g);
  }, [deliveredDockets]);

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = () => {
    const data = sortedDockets.map(d => {
      const rev = getDocketRevenue(d);
      const cost = getDocketCost(d);
      const margin = rev - cost;
      return {
        'Docket Number': d.docketNumber, 'LR Number': d.lrNumber || '',
        'Client': d.clientName, 'Origin': d.pickupCity, 'Destination': d.deliveryCity,
        'Fleet Model': d.fleetModel, 'Carrier': d.carrierVendorName || '',
        'Weight (kg)': d.chargeableWeight, 'Pieces': d.totalPieces,
        'Revenue (₹)': rev, 'Cost (₹)': cost, 'Margin (₹)': margin,
        'Margin %': rev > 0 ? `${((margin / rev) * 100).toFixed(1)}%` : '0%',
        'Delivery Date': d.actualDeliveryDate || d.bookingDate,
        'Payment Type': d.paymentType,
      };
    });
    exportXLSX(data as unknown as Record<string, unknown>[], 'ptl-margin-report');
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">PTL Margin Report</h1>
          <p className="text-sm text-gray-500 mt-0.5">Revenue, cost and gross margin analysis for delivered PTL dockets</p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm text-gray-700 hover:bg-gray-50 shadow-sm">
          <Download size={14} /> Export XLSX
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Revenue"
          value={formatINR(totalRevenue)}
          sub={`${deliveredDockets.length} delivered dockets`}
          icon={<IndianRupee size={16} className="text-blue-600" />}
        />
        <KpiCard
          label="Total Cost"
          value={formatINR(totalCost)}
          sub="Carrier + Fleet"
          icon={<TrendingDown size={16} className="text-red-500" />}
        />
        <KpiCard
          label="Gross Margin"
          value={formatINR(grossMargin)}
          sub={`${fmtPct(marginPercent)} margin`}
          icon={<TrendingUp size={16} className="text-green-600" />}
          positive={grossMargin >= 0}
        />
        <KpiCard
          label="Above 20% Target"
          value={`${aboveTarget} / ${deliveredDockets.length}`}
          sub={deliveredDockets.length > 0 ? `${Math.round((aboveTarget / deliveredDockets.length) * 100)}% dockets healthy` : '—'}
          icon={<BarChart2 size={16} className="text-purple-600" />}
          positive={aboveTarget / Math.max(deliveredDockets.length, 1) >= 0.7}
        />
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Date Range:</span>
            <input type="date" className="border rounded-lg px-3 py-1.5 text-sm"
              value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span className="text-gray-400">to</span>
            <input type="date" className="border rounded-lg px-3 py-1.5 text-sm"
              value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <select className="border rounded-lg px-3 py-1.5 text-sm"
            value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="all">All Clients</option>
            {clients.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <select className="border rounded-lg px-3 py-1.5 text-sm"
            value={fleetFilter} onChange={e => setFleetFilter(e.target.value)}>
            <option value="all">All Fleet Models</option>
            <option>Own</option><option>Leased</option><option>Market</option><option>Carrier</option>
          </select>
          {carriers.length > 0 && (
            <select className="border rounded-lg px-3 py-1.5 text-sm"
              value={carrierFilter} onChange={e => setCarrierFilter(e.target.value)}>
              <option value="all">All Carriers</option>
              {carriers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          )}
          {(dateFrom || dateTo || clientFilter !== 'all' || fleetFilter !== 'all' || carrierFilter !== 'all') && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setClientFilter('all'); setFleetFilter('all'); setCarrierFilter('all'); }}
              className="text-xs text-red-500 hover:text-red-700">
              Clear Filters
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400">{deliveredDockets.length} dockets · {formatINR(totalRevenue)} revenue</span>
        </div>
      </div>

      {/* Charts */}
      {monthlyData.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
          {/* Revenue vs Cost vs Margin Bar */}
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Monthly Revenue vs Cost vs Margin</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: any) => formatINR(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenue" name="Revenue" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="cost" name="Cost" fill="#EF4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="margin" name="Margin" fill="#22C55E" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Margin % Trend */}
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Margin % Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData.map(m => ({
                month: m.month,
                marginPct: m.revenue > 0 ? +((m.margin / m.revenue) * 100).toFixed(1) : 0
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[0, 'auto']} />
                <Tooltip formatter={(v: any) => `${v}%`} />
                {/* Target line at 20% */}
                <Line type="monotone" dataKey="marginPct" name="Margin %" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Group By Tabs + Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-white border rounded-xl p-1 shadow-sm">
            {([['docket', 'By Docket'], ['client', 'By Client'], ['lane', 'By Lane'], ['fleet', 'By Fleet']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setGroupBy(id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${groupBy === id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                {label}
              </button>
            ))}
          </div>
          {groupBy === 'docket' && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Sort by:</span>
              {(['margin', 'revenue', 'cost', 'pct'] as const).map(f => (
                <button key={f} onClick={() => {
                  if (sortField === f) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
                  else { setSortField(f); setSortDir('desc'); }
                }}
                  className={`px-2 py-1 rounded-lg text-xs font-medium capitalize ${sortField === f ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {f === 'pct' ? 'Margin %' : f.charAt(0).toUpperCase() + f.slice(1)}
                  {sortField === f && (sortDir === 'desc' ? ' ↓' : ' ↑')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Docket-level table */}
        {groupBy === 'docket' && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {deliveredDockets.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Package size={40} className="mx-auto mb-3 opacity-30" />
                <p>No delivered dockets match the selected filters</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    {['#', 'Docket', 'Client', 'Lane', 'Fleet', 'Revenue', 'Cost', 'Margin', 'Margin %', 'Date', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedDockets.map((d, i) => (
                    <DocketRow key={d.id} d={d} rank={i + 1} />
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t font-semibold text-sm">
                    <td colSpan={5} className="px-4 py-3 text-gray-700">Total ({deliveredDockets.length} dockets)</td>
                    <td className="px-4 py-3 text-blue-700">{formatINR(totalRevenue)}</td>
                    <td className="px-4 py-3 text-red-600">{formatINR(totalCost)}</td>
                    <td className={`px-4 py-3 ${grossMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatINR(grossMargin)}</td>
                    <td className="px-4 py-3 text-purple-700">{fmtPct(marginPercent)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )}

        {/* Client group table */}
        {groupBy === 'client' && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {['Client', 'Dockets', 'Revenue', 'Cost', 'Margin', 'Margin %'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {clientGroups.map(g => {
                  const margin = g.revenue - g.cost;
                  const pct = g.revenue > 0 ? (margin / g.revenue) * 100 : 0;
                  return (
                    <tr key={g.clientName} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{g.clientName}</td>
                      <td className="px-4 py-3 text-gray-600">{g.count}</td>
                      <td className="px-4 py-3 font-medium text-blue-700">{formatINR(g.revenue)}</td>
                      <td className="px-4 py-3 font-medium text-red-600">{formatINR(g.cost)}</td>
                      <td className={`px-4 py-3 font-bold ${margin >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatINR(margin)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${pct >= 20 ? 'text-green-600' : pct >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                          {fmtPct(pct)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Lane group table */}
        {groupBy === 'lane' && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {['Lane', 'Dockets', 'Revenue', 'Cost', 'Margin', 'Margin %'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {laneGroups.map(g => {
                  const margin = g.revenue - g.cost;
                  const pct = g.revenue > 0 ? (margin / g.revenue) * 100 : 0;
                  return (
                    <tr key={g.lane} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{g.lane}</td>
                      <td className="px-4 py-3 text-gray-600">{g.count}</td>
                      <td className="px-4 py-3 font-medium text-blue-700">{formatINR(g.revenue)}</td>
                      <td className="px-4 py-3 font-medium text-red-600">{formatINR(g.cost)}</td>
                      <td className={`px-4 py-3 font-bold ${margin >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatINR(margin)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${pct >= 20 ? 'text-green-600' : pct >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                          {fmtPct(pct)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Fleet group table */}
        {groupBy === 'fleet' && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {['Fleet Model', 'Dockets', 'Revenue', 'Cost', 'Margin', 'Margin %'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {fleetGroups.map(g => {
                  const margin = g.revenue - g.cost;
                  const pct = g.revenue > 0 ? (margin / g.revenue) * 100 : 0;
                  return (
                    <tr key={g.fleet} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          g.fleet === 'Own' ? 'bg-blue-100 text-blue-700' :
                          g.fleet === 'Leased' ? 'bg-purple-100 text-purple-700' :
                          g.fleet === 'Market' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                        }`}>{g.fleet}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{g.count}</td>
                      <td className="px-4 py-3 font-medium text-blue-700">{formatINR(g.revenue)}</td>
                      <td className="px-4 py-3 font-medium text-red-600">{formatINR(g.cost)}</td>
                      <td className={`px-4 py-3 font-bold ${margin >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatINR(margin)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${pct >= 20 ? 'text-green-600' : pct >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                          {fmtPct(pct)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
