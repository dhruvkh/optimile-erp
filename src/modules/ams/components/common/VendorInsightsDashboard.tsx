import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line, Legend } from 'recharts';
import { computeVendorBehaviorAnalytics } from '../../services/vendorBehaviorAnalytics';

function pct(v: number) {
  return `${v.toFixed(1)}%`;
}

function level(v: number) {
  if (v >= 75) return 'High';
  if (v >= 45) return 'Medium';
  return 'Low';
}

export function VendorInsightsDashboard() {
  const data = useMemo(() => computeVendorBehaviorAnalytics(), []);
  const top = data.vendors.slice(0, 12);

  const heatMap = top.map((v) => ({
    vendor: v.vendorName,
    north: v.geography === 'North' || v.geography === 'Pan-India' ? Math.max(30, v.participationRate) : Math.max(5, v.participationRate * 0.2),
    south: v.geography === 'South' || v.geography === 'Pan-India' ? Math.max(30, v.participationRate) : Math.max(5, v.participationRate * 0.2),
    east: v.geography === 'East' || v.geography === 'Pan-India' ? Math.max(30, v.participationRate) : Math.max(5, v.participationRate * 0.2),
    west: v.geography === 'West' || v.geography === 'Pan-India' ? Math.max(30, v.participationRate) : Math.max(5, v.participationRate * 0.2),
  }));

  const activityClock = [
    { slot: '00-04', bids: Math.round(top.reduce((s, v) => s + v.lanesBid, 0) * 0.02) },
    { slot: '04-08', bids: Math.round(top.reduce((s, v) => s + v.lanesBid, 0) * 0.05) },
    { slot: '08-12', bids: Math.round(top.reduce((s, v) => s + v.lanesBid, 0) * 0.28) },
    { slot: '12-16', bids: Math.round(top.reduce((s, v) => s + v.lanesBid, 0) * 0.4) },
    { slot: '16-20', bids: Math.round(top.reduce((s, v) => s + v.lanesBid, 0) * 0.2) },
    { slot: '20-24', bids: Math.round(top.reduce((s, v) => s + v.lanesBid, 0) * 0.05) },
  ];

  const rivalryMatrix = data.clusters.slice(0, 8).map((c) => ({
    pair: `${c.vendorA} × ${c.vendorB}`,
    intensity: c.intensity,
  }));

  const trendLines = top.map((v) => ({
    vendor: v.vendorName,
    m1: Math.max(5, v.winRate - 8),
    m2: Math.max(5, v.winRate - 4),
    m3: v.winRate,
    m4: Math.min(98, v.winRate + (v.trend === 'Improving' ? 3 : v.trend === 'Declining' ? -3 : 0)),
  }));

  const gaugeData = top.map((v) => ({
    vendor: v.vendorName,
    aggressiveness: v.avgDiscount * 4,
    band: v.avgDiscount >= 19 ? 'Green' : v.avgDiscount >= 14 ? 'Yellow' : 'Red',
  }));

  const participationForecast = top.map((v) => ({
    vendor: v.vendorName,
    forecast: v.predictedParticipation,
    class: v.predictedParticipation > 80 ? 'High' : v.predictedParticipation > 60 ? 'Medium' : 'Low',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vendor Insights Dashboard</h1>
        <p className="text-slate-500">Operational widgets for vendor heatmaps, rivalry intensity, trend monitoring, and forecast planning.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="font-semibold text-sm mb-2">Widget 1: Vendor Heat Map by Region</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-2 text-left">Vendor</th>
                  <th className="px-2 py-2">North</th>
                  <th className="px-2 py-2">South</th>
                  <th className="px-2 py-2">East</th>
                  <th className="px-2 py-2">West</th>
                </tr>
              </thead>
              <tbody>
                {heatMap.map((h) => (
                  <tr key={h.vendor} className="border-t border-slate-100">
                    <td className="px-2 py-2 text-left font-medium">{h.vendor}</td>
                    {(['north', 'south', 'east', 'west'] as const).map((k) => (
                      <td key={`${h.vendor}-${k}`} className="px-2 py-2 text-center" style={{ background: `rgba(37,99,235,${Math.max(0.1, h[k] / 100)})` }}>{pct(h[k])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="font-semibold text-sm mb-2">Widget 2: Bidding Activity Timeline (24h)</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityClock}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="slot" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="bids" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="font-semibold text-sm mb-2">Widget 3: Competition Intensity Matrix</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-2 text-left">Vendor Pair</th>
                  <th className="px-2 py-2 text-center">Intensity</th>
                  <th className="px-2 py-2 text-center">Class</th>
                </tr>
              </thead>
              <tbody>
                {rivalryMatrix.map((r) => (
                  <tr key={r.pair} className="border-t border-slate-100">
                    <td className="px-2 py-2">{r.pair}</td>
                    <td className="px-2 py-2 text-center">{pct(r.intensity)}</td>
                    <td className="px-2 py-2 text-center">{level(r.intensity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="font-semibold text-sm mb-2">Widget 4: Win Rate Trends</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendLines.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="vendor" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line dataKey="m1" stroke="#94a3b8" name="M-3" />
                <Line dataKey="m2" stroke="#64748b" name="M-2" />
                <Line dataKey="m3" stroke="#2563eb" name="M-1" />
                <Line dataKey="m4" stroke="#16a34a" name="Current" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="font-semibold text-sm mb-2">Widget 5: Price Aggressiveness Gauge</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-2 text-left">Vendor</th>
                  <th className="px-2 py-2 text-center">Gauge</th>
                  <th className="px-2 py-2 text-center">Band</th>
                </tr>
              </thead>
              <tbody>
                {gaugeData.map((g) => (
                  <tr key={g.vendor} className="border-t border-slate-100">
                    <td className="px-2 py-2">{g.vendor}</td>
                    <td className="px-2 py-2">
                      <div className="w-full bg-slate-100 rounded h-2">
                        <div className="h-2 rounded" style={{ width: `${Math.min(100, Math.max(5, g.aggressiveness))}%`, background: g.band === 'Green' ? '#16a34a' : g.band === 'Yellow' ? '#eab308' : '#ef4444' }} />
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">{g.band}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="font-semibold text-sm mb-2">Widget 6: Participation Forecast</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-2 text-left">Vendor</th>
                  <th className="px-2 py-2 text-center">Expected Participation</th>
                  <th className="px-2 py-2 text-center">Class</th>
                </tr>
              </thead>
              <tbody>
                {participationForecast.map((p) => (
                  <tr key={p.vendor} className="border-t border-slate-100">
                    <td className="px-2 py-2">{p.vendor}</td>
                    <td className="px-2 py-2 text-center">{pct(p.forecast)}</td>
                    <td className="px-2 py-2 text-center">{p.class}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

