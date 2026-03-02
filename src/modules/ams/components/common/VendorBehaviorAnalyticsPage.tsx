import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, Download, Filter, ShieldAlert } from 'lucide-react';
import { computeVendorBehaviorAnalytics, VendorBehaviorProfile } from '../../services/vendorBehaviorAnalytics';

function pct(v: number) {
  return `${v.toFixed(1)}%`;
}

function formatINR(v: number) {
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}

function fmtSec(sec: number) {
  if (!Number.isFinite(sec) || sec <= 0) return '-';
  if (sec >= 60) return `${Math.round(sec / 60)} min`;
  return `${Math.round(sec)} sec`;
}

export function VendorBehaviorAnalyticsPage() {
  const data = useMemo(() => computeVendorBehaviorAnalytics(), []);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>(data.vendors.slice(0, 3).map((v) => v.vendorId));
  const [search, setSearch] = useState('');

  const filtered = data.vendors.filter((v) => {
    if (!search.trim()) return true;
    const needle = search.trim().toLowerCase();
    return `${v.vendorName} ${v.vendorId} ${v.behaviorSegment} ${v.timingClass}`.toLowerCase().includes(needle);
  });

  const timingProfileRows = filtered.slice(0, 12);

  const segmentPie = [
    { name: 'Aggressive', value: data.totals.segments.Aggressive },
    { name: 'Strategic', value: data.totals.segments.Strategic },
    { name: 'Conservative', value: data.totals.segments.Conservative },
    { name: 'Opportunistic', value: data.totals.segments.Opportunistic },
  ];

  const compareVendors = data.vendors.filter((v) => selectedVendorIds.includes(v.vendorId)).slice(0, 5);

  const recommendationRows = filtered.slice(0, 6).map((v) => ({
    vendor: v,
    recommendations: [
      v.behaviorSegment === 'Aggressive' ? 'Invite to high-competition auctions for benchmark pressure' : 'Target invitations based on lane preference fit',
      v.timingClass === 'Sniper' ? 'Consider tighter extension controls for this vendor cohort' : 'Use current extension model',
      v.dropoutRisk === 'High' ? 'Pre-verify capacity before awarding' : 'Standard award workflow is sufficient',
    ],
  }));

  const alertRows = filtered.flatMap((v) => {
    const rows: Array<{ severity: 'warn' | 'critical' | 'info'; vendor: VendorBehaviorProfile; text: string; action: string }> = [];
    if (v.trend === 'Declining' && v.winRate > 0) {
      rows.push({ severity: 'warn', vendor: v, text: `Win rate trend declining (${v.trendDelta.toFixed(1)}%)`, action: 'Review recent competition and capacity.' });
    }
    if (v.participationRate < 50) {
      rows.push({ severity: 'warn', vendor: v, text: `Participation dropped to ${pct(v.participationRate)}`, action: 'Trigger re-engagement outreach.' });
    }
    if (v.dropoutRisk === 'High') {
      rows.push({ severity: 'critical', vendor: v, text: `High acceptance risk (${pct(v.acceptanceRate)} acceptance)`, action: 'Prepare alternate queue and verify documents.' });
    }
    if (v.behaviorSegment === 'Opportunistic' && v.extensionPct > 30) {
      rows.push({ severity: 'info', vendor: v, text: 'Bids cluster in extension windows', action: 'Tune extension thresholds per lane urgency.' });
    }
    return rows;
  }).slice(0, 10);

  const clusterRows = data.clusters.slice(0, 8).map((c) => ({
    ...c,
    vendorAName: data.vendors.find((v) => v.vendorId === c.vendorA)?.vendorName || c.vendorA,
    vendorBName: data.vendors.find((v) => v.vendorId === c.vendorB)?.vendorName || c.vendorB,
  }));

  const gapRows = data.gaps;

  const participationPredictionRows = filtered.slice(0, 10).map((v) => ({
    vendorName: v.vendorName,
    probability: v.predictedParticipation,
    confidence: v.predictedParticipation > 80 ? 'High' : v.predictedParticipation > 60 ? 'Medium' : 'Low',
    factors: `${v.routeType} preference • ${v.competitionTolerance} competition tolerance`,
  }));

  const winPredictionRows = filtered.slice(0, 10).sort((a, b) => b.predictedWinRate - a.predictedWinRate).map((v) => ({
    vendorName: v.vendorName,
    winProbability: v.predictedWinRate,
    expectedBid: `${formatINR(v.predictedBidMin)} - ${formatINR(v.predictedBidMax)}`,
    confidence: v.predictedWinRate > 55 ? 'High' : v.predictedWinRate > 35 ? 'Medium' : 'Low',
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendor Behavior Analytics</h1>
          <p className="text-slate-500">Pattern detection, strategy segmentation, predictive signals, and actionable recommendations.</p>
          <div className="text-xs text-slate-500 mt-1">Generated: {new Date(data.generatedAt).toLocaleString()}</div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded border border-slate-300 text-sm inline-flex items-center gap-1"><Download size={14} />Export Report</button>
          <Link to="/ams/analytics/vendors" className="px-3 py-2 rounded border border-slate-300 text-sm">Open Insights Dashboard</Link>
          <Link to="/ams/analytics/vendors" className="px-3 py-2 rounded border border-slate-300 text-sm">Settings</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Metric title="Total Active Vendors" value={`${data.totals.activeVendors}`} tone="slate" />
        <Metric title="Frequent Bidders" value={`${data.totals.frequent}`} sub="80%+ auctions" tone="green" />
        <Metric title="Occasional Bidders" value={`${data.totals.occasional}`} sub="40-79% auctions" tone="yellow" />
        <Metric title="Rare Bidders" value={`${data.totals.rare}`} sub="< 40% auctions" tone="orange" />
        <Metric title="Inactive Vendors" value={`${data.totals.inactive90Days}`} sub="No bids in 90 days" tone="red" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 xl:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-900">Behavioral Segments</h2>
            <div className="text-xs text-slate-500">Aggressive / Strategic / Conservative / Opportunistic</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={segmentPie} dataKey="value" nameKey="name" outerRadius={90} label>
                  {segmentPie.map((entry) => (
                    <Cell key={entry.name} fill={{ Aggressive: '#ef4444', Strategic: '#2563eb', Conservative: '#f59e0b', Opportunistic: '#10b981' }[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm space-y-2">
          <h2 className="font-semibold text-slate-900">Segment Strategy</h2>
          <div><strong>Aggressive:</strong> Invite broadly, use for price discovery.</div>
          <div><strong>Strategic:</strong> Target relevant lanes, provide richer specs.</div>
          <div><strong>Conservative:</strong> Engage for stable/critical lanes.</div>
          <div><strong>Opportunistic:</strong> Manage extension policy carefully.</div>
          <div className="text-xs text-slate-500 mt-2">Segmentation matrix and personas are derived from timing, discount, response, and participation vectors.</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Bid Timing Preference</h2>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendor" className="border border-slate-300 rounded px-2 py-1 text-xs" />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timingProfileRows.map((v) => ({ vendor: v.vendorName, early: v.earlyPct, middle: v.middlePct, late: v.latePct, extension: v.extensionPct }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="vendor" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(val: number) => `${val.toFixed(1)}%`} />
              <Legend />
              <Line type="monotone" dataKey="early" stroke="#16a34a" />
              <Line type="monotone" dataKey="middle" stroke="#2563eb" />
              <Line type="monotone" dataKey="late" stroke="#f59e0b" />
              <Line type="monotone" dataKey="extension" stroke="#ef4444" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-2 py-2 text-left">Vendor</th>
                <th className="px-2 py-2">Early %</th>
                <th className="px-2 py-2">Middle %</th>
                <th className="px-2 py-2">Late %</th>
                <th className="px-2 py-2">Extension %</th>
                <th className="px-2 py-2">Classification</th>
              </tr>
            </thead>
            <tbody>
              {timingProfileRows.map((v) => (
                <tr key={`timing-${v.vendorId}`} className="border-t border-slate-100">
                  <td className="px-2 py-2 text-left font-medium">{v.vendorName}</td>
                  <td className="px-2 py-2 text-center">{pct(v.earlyPct)}</td>
                  <td className="px-2 py-2 text-center">{pct(v.middlePct)}</td>
                  <td className="px-2 py-2 text-center">{pct(v.latePct)}</td>
                  <td className="px-2 py-2 text-center">{pct(v.extensionPct)}</td>
                  <td className="px-2 py-2 text-center">{v.timingClass}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Price Aggressiveness</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filtered.slice(0, 12).map((v) => ({ vendor: v.vendorName, discount: v.avgDiscount, decrement: v.avgDecrement / 50, leading: v.leadingBidShare }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="vendor" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="discount" fill="#16a34a" name="Avg Discount %" />
                <Bar dataKey="leading" fill="#2563eb" name="Leading Bid Share %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-2 text-left">Vendor</th>
                  <th className="px-2 py-2">Avg Discount</th>
                  <th className="px-2 py-2">Decrement</th>
                  <th className="px-2 py-2">Leading Bids</th>
                  <th className="px-2 py-2">Price Floor</th>
                  <th className="px-2 py-2">Style</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 12).map((v) => (
                  <tr key={`price-${v.vendorId}`} className="border-t border-slate-100">
                    <td className="px-2 py-2 text-left font-medium">{v.vendorName}</td>
                    <td className="px-2 py-2 text-center">{pct(v.avgDiscount)}</td>
                    <td className="px-2 py-2 text-center">{formatINR(v.avgDecrement)}</td>
                    <td className="px-2 py-2 text-center">{pct(v.leadingBidShare)}</td>
                    <td className="px-2 py-2 text-center">{pct(v.priceFloorPct)}</td>
                    <td className="px-2 py-2 text-center">{v.aggressiveness}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Competitive Response Behavior</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-2 text-left">Vendor</th>
                  <th className="px-2 py-2">Avg Response</th>
                  <th className="px-2 py-2">Response Rate</th>
                  <th className="px-2 py-2">Avg Counter</th>
                  <th className="px-2 py-2">Max Iterations</th>
                  <th className="px-2 py-2">Persistence</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 12).map((v) => (
                  <tr key={`resp-${v.vendorId}`} className="border-t border-slate-100">
                    <td className="px-2 py-2 text-left font-medium">{v.vendorName}</td>
                    <td className="px-2 py-2 text-center">{fmtSec(v.avgResponseSec)}</td>
                    <td className="px-2 py-2 text-center">{pct(v.responseRate)}</td>
                    <td className="px-2 py-2 text-center">{formatINR(v.avgDecrement)}</td>
                    <td className="px-2 py-2 text-center">{v.maxIterations}</td>
                    <td className="px-2 py-2 text-center">{v.persistence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-xs font-semibold text-slate-700 pt-2">Lane Selection Preferences</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-2 text-left">Vendor</th>
                  <th className="px-2 py-2">Route</th>
                  <th className="px-2 py-2">Geography</th>
                  <th className="px-2 py-2">Vehicle</th>
                  <th className="px-2 py-2">Value Range</th>
                  <th className="px-2 py-2">Competition</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 10).map((v) => (
                  <tr key={`lane-pref-${v.vendorId}`} className="border-t border-slate-100">
                    <td className="px-2 py-2 text-left font-medium">{v.vendorName}</td>
                    <td className="px-2 py-2 text-center">{v.routeType}</td>
                    <td className="px-2 py-2 text-center">{v.geography}</td>
                    <td className="px-2 py-2 text-center">{v.vehicle}</td>
                    <td className="px-2 py-2 text-center">{formatINR(v.valueMin)} - {formatINR(v.valueMax)}</td>
                    <td className="px-2 py-2 text-center">{v.competitionTolerance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Win Rate & Participation Consistency</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filtered.slice(0, 12).map((v) => ({ vendor: v.vendorName, winRate: v.winRate, participation: v.participationRate, acceptance: v.acceptanceRate }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="vendor" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(val: number) => `${val.toFixed(1)}%`} />
              <Legend />
              <Line dataKey="winRate" stroke="#2563eb" />
              <Line dataKey="participation" stroke="#16a34a" />
              <Line dataKey="acceptance" stroke="#f59e0b" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Predictive Analytics: Participation</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-2 text-left">Vendor</th>
                  <th className="px-2 py-2">Predicted</th>
                  <th className="px-2 py-2">Confidence</th>
                  <th className="px-2 py-2 text-left">Factors</th>
                </tr>
              </thead>
              <tbody>
                {participationPredictionRows.map((r) => (
                  <tr key={`pred-part-${r.vendorName}`} className="border-t border-slate-100">
                    <td className="px-2 py-2 text-left font-medium">{r.vendorName}</td>
                    <td className="px-2 py-2 text-center">{pct(r.probability)}</td>
                    <td className="px-2 py-2 text-center">{r.confidence}</td>
                    <td className="px-2 py-2 text-left">{r.factors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-xs font-semibold text-slate-700">Win Probability / Price Prediction</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-2 text-left">Vendor</th>
                  <th className="px-2 py-2">Win Prob.</th>
                  <th className="px-2 py-2">Expected Bid</th>
                  <th className="px-2 py-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {winPredictionRows.map((r) => (
                  <tr key={`pred-win-${r.vendorName}`} className="border-t border-slate-100">
                    <td className="px-2 py-2 text-left font-medium">{r.vendorName}</td>
                    <td className="px-2 py-2 text-center">{pct(r.winProbability)}</td>
                    <td className="px-2 py-2 text-center">{r.expectedBid}</td>
                    <td className="px-2 py-2 text-center">{r.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Dropout Risk & Alerts</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-2 text-left">Vendor</th>
                  <th className="px-2 py-2">Risk</th>
                  <th className="px-2 py-2">Acceptance</th>
                  <th className="px-2 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 12).map((v) => (
                  <tr key={`risk-${v.vendorId}`} className="border-t border-slate-100">
                    <td className="px-2 py-2 text-left font-medium">{v.vendorName}</td>
                    <td className="px-2 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${v.dropoutRisk === 'Low' ? 'bg-green-100 text-green-700' : v.dropoutRisk === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{v.dropoutRisk}</span>
                    </td>
                    <td className="px-2 py-2 text-center">{pct(v.acceptanceRate)}</td>
                    <td className="px-2 py-2 text-left">{v.dropoutRisk === 'High' ? 'Verify capacity + prep alternates' : 'Standard workflow'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            {alertRows.length === 0 && <div className="text-xs text-slate-500">No active behavior alerts.</div>}
            {alertRows.map((a, idx) => (
              <div key={`alert-${idx}`} className={`rounded border p-2 text-xs ${a.severity === 'critical' ? 'border-red-200 bg-red-50 text-red-700' : a.severity === 'warn' ? 'border-yellow-200 bg-yellow-50 text-yellow-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                <div className="font-semibold inline-flex items-center gap-1">{a.severity === 'critical' ? <ShieldAlert size={12} /> : <AlertTriangle size={12} />}{a.vendor.vendorName}</div>
                <div>{a.text}</div>
                <div className="text-[11px]">Action: {a.action}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Vendor Personas & Segmentation Matrix</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2 text-xs">
          <PersonaCard title="Aggressive Competitor" criteria="Early + frequent + low prices" strategy="Invite broadly for benchmark pressure" />
          <PersonaCard title="Strategic Optimizer" criteria="Selective and calculated" strategy="Target with lane-fit invites" />
          <PersonaCard title="Last-Minute Sniper" criteria="Late concentrated bidding" strategy="Control extension mechanics" />
          <PersonaCard title="Cherry Picker" criteria="Niche, selective participation" strategy="Curate relevant bundles" />
          <PersonaCard title="Opportunist" criteria="Sporadic capacity-driven" strategy="Use as backup capacity" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Side-by-Side Vendor Benchmark</h2>
          <div className="flex gap-2 text-xs">
            <select className="border border-slate-300 rounded px-2 py-1" onChange={(e) => {
              const next = e.target.value;
              if (!next) return;
              setSelectedVendorIds((prev) => Array.from(new Set([...prev, next])).slice(0, 5));
            }}>
              <option value="">Add vendor</option>
              {data.vendors.map((v) => <option key={v.vendorId} value={v.vendorId}>{v.vendorName}</option>)}
            </select>
            <button className="px-2 py-1 border border-slate-300 rounded" onClick={() => setSelectedVendorIds(data.vendors.slice(0, 3).map((v) => v.vendorId))}>Reset</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-2 py-2 text-left">Metric</th>
                {compareVendors.map((v) => <th key={`head-${v.vendorId}`} className="px-2 py-2 text-center">{v.vendorName}</th>)}
                <th className="px-2 py-2 text-center">Best</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'Win Rate', values: compareVendors.map((v) => v.winRate), fmt: (n: number) => pct(n) },
                { key: 'Avg Discount', values: compareVendors.map((v) => v.avgDiscount), fmt: (n: number) => pct(n) },
                { key: 'Participation', values: compareVendors.map((v) => v.participationRate), fmt: (n: number) => pct(n) },
                { key: 'Acceptance', values: compareVendors.map((v) => v.acceptanceRate), fmt: (n: number) => pct(n) },
                { key: 'Response Time (sec, lower is better)', values: compareVendors.map((v) => v.avgResponseSec), fmt: (n: number) => fmtSec(n) },
                { key: 'Reliability', values: compareVendors.map((v) => v.reliability), fmt: (n: number) => pct(n) },
                { key: 'Performance Proxy', values: compareVendors.map((v) => (v.winRate * 0.4) + (v.participationRate * 0.25) + (v.acceptanceRate * 0.2) + (v.avgDiscount * 0.15)), fmt: (n: number) => `${n.toFixed(1)}/100` },
              ].map((row) => {
                const bestIndex = row.key.includes('lower')
                  ? row.values.indexOf(Math.min(...row.values))
                  : row.values.indexOf(Math.max(...row.values));
                return (
                  <tr key={row.key} className="border-t border-slate-100">
                    <td className="px-2 py-2 font-medium">{row.key}</td>
                    {row.values.map((v, idx) => <td key={`${row.key}-${idx}`} className="px-2 py-2 text-center">{row.fmt(v)}</td>)}
                    <td className="px-2 py-2 text-center font-semibold">{compareVendors[bestIndex]?.vendorName || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={[
              { metric: 'Win', ...Object.fromEntries(compareVendors.map((v) => [v.vendorName, v.winRate])) },
              { metric: 'Participation', ...Object.fromEntries(compareVendors.map((v) => [v.vendorName, v.participationRate])) },
              { metric: 'Acceptance', ...Object.fromEntries(compareVendors.map((v) => [v.vendorName, v.acceptanceRate])) },
              { metric: 'Discount', ...Object.fromEntries(compareVendors.map((v) => [v.vendorName, v.avgDiscount * 4])) },
              { metric: 'Reliability', ...Object.fromEntries(compareVendors.map((v) => [v.vendorName, v.reliability])) },
            ]}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis />
              {compareVendors.map((v, idx) => (
                <Radar key={v.vendorId} dataKey={v.vendorName} stroke={['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#7c3aed'][idx % 5]} fillOpacity={0.08} fill={['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#7c3aed'][idx % 5]} />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Competitive Clustering</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-2 text-left">Vendor A</th>
                  <th className="px-2 py-2 text-left">Vendor B</th>
                  <th className="px-2 py-2 text-center">Intensity</th>
                </tr>
              </thead>
              <tbody>
                {clusterRows.map((c) => (
                  <tr key={`${c.vendorA}-${c.vendorB}`} className="border-t border-slate-100">
                    <td className="px-2 py-2">{c.vendorAName}</td>
                    <td className="px-2 py-2">{c.vendorBName}</td>
                    <td className="px-2 py-2 text-center">{pct(c.intensity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Vendor Coverage Gaps</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-2 text-left">Route Type</th>
                  <th className="px-2 py-2 text-center">Coverage</th>
                  <th className="px-2 py-2 text-center">Gap</th>
                  <th className="px-2 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {gapRows.map((g) => (
                  <tr key={g.routeType} className="border-t border-slate-100">
                    <td className="px-2 py-2">{g.routeType}</td>
                    <td className="px-2 py-2 text-center">{g.currentCoverage}</td>
                    <td className="px-2 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${g.gap === 'Low' ? 'bg-green-100 text-green-700' : g.gap === 'Medium' ? 'bg-yellow-100 text-yellow-700' : g.gap === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{g.gap}</span>
                    </td>
                    <td className="px-2 py-2">{g.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Actionable Recommendations Engine</h2>
        <div className="space-y-2 text-sm">
          <div>1. Always co-invite top rivalry pairs to maximize competition intensity and savings.</div>
          <div>2. Align auction windows with vendors showing strong time-of-day participation propensity.</div>
          <div>3. Pre-verify capacity for high dropout-risk vendors before award finalization.</div>
          <div>4. Cap extension loops where extension hunters dominate late-stage pricing behavior.</div>
          <div>5. Expand coverage for high-gap routes to reduce non-competitive lane outcomes.</div>
        </div>
        <div className="space-y-2">
          {recommendationRows.map((row) => (
            <div key={`rec-${row.vendor.vendorId}`} className="rounded-lg border border-slate-200 p-3">
              <div className="font-medium text-slate-900">{row.vendor.vendorName}</div>
              {row.recommendations.map((r, idx) => <div key={`r-${idx}`} className="text-xs text-slate-600">• {r}</div>)}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 text-sm">
        <h2 className="font-semibold text-slate-900">Data Model, API, ML, and Compliance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded border border-slate-200 p-3">
            <div className="font-semibold">API Endpoints</div>
            <div className="font-mono text-xs mt-1">GET /api/analytics/vendors/:vendorId/behavior</div>
            <div className="font-mono text-xs mt-1">GET /api/analytics/vendors/comparison</div>
            <div className="font-mono text-xs mt-1">POST /api/analytics/vendors/recommendations</div>
          </div>
          <div className="rounded border border-slate-200 p-3">
            <div className="font-semibold">Webhook Events</div>
            <div className="font-mono text-xs mt-1">vendor.pattern.changed</div>
            <div className="font-mono text-xs mt-1">vendor.performance.degraded</div>
            <div className="font-mono text-xs mt-1">vendor.risk.detected</div>
          </div>
        </div>

        <div className="text-xs text-slate-600">Model set (target): Participation Predictor (RF), Win Probability (GBM), Price Predictor (LSTM), Behavior Classifier (K-Means). Retrain monthly with rolling 12-month window.</div>
        <div className="text-xs text-slate-600">Privacy: vendor anonymization in shared reports, role-based access, full audit logging, retention and consent controls.</div>
      </div>
    </div>
  );
}

function Metric({ title, value, sub, tone }: { title: string; value: string; sub?: string; tone: 'slate' | 'green' | 'yellow' | 'orange' | 'red' }) {
  const cls = {
    slate: 'bg-slate-50 border-slate-200 text-slate-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    red: 'bg-red-50 border-red-200 text-red-900',
  }[tone];
  return (
    <div className={`border rounded-lg p-3 ${cls}`}>
      <div className="text-xs">{title}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs mt-1 opacity-90">{sub}</div>}
    </div>
  );
}

function PersonaCard({ title, criteria, strategy }: { title: string; criteria: string; strategy: string }) {
  return (
    <div className="rounded border border-slate-200 p-2">
      <div className="font-semibold text-slate-900">{title}</div>
      <div className="text-[11px] text-slate-500 mt-1">{criteria}</div>
      <div className="text-[11px] text-slate-700 mt-1">{strategy}</div>
    </div>
  );
}

