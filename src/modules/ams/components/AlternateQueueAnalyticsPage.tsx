import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { auctionEngine } from '../services/mockBackend';
import { AuctionStatus } from '../types';

function pct(value: number) {
  return `${value.toFixed(1)}%`;
}

export function AlternateQueueAnalyticsPage() {
  const [tick, setTick] = useState(0);
  const [auctionId, setAuctionId] = useState('all');

  useEffect(() => {
    const unsub = auctionEngine.subscribe(() => setTick((v) => v + 1));
    return unsub;
  }, []);

  const auctions = auctionEngine.getAllAuctions().filter((a) => a.status === AuctionStatus.COMPLETED);
  const scopedQueues = auctionId === 'all'
    ? auctionEngine.getSnapshot().alternateQueues
    : auctionEngine.getAlternateQueueByAuction(auctionId);

  const metrics = auctionEngine.getAlternateQueueMetrics(auctionId === 'all' ? undefined : auctionId);

  const derived = useMemo(() => {
    const lanesWithEligibleAlternates = scopedQueues.filter((q) => q.queue.filter((e) => e.rank > 1 && e.eligibleForAutoAward).length >= 2).length;
    const thresholdCoverage = metrics.totalLanes > 0 ? (lanesWithEligibleAlternates / metrics.totalLanes) * 100 : 0;

    const reawardedQueues = scopedQueues.filter((q) => q.declineHistory.length > 0);
    const firstAlternateAccepted = reawardedQueues.filter((q) => q.queue.some((e) => e.rank === 2 && e.status === 'ACCEPTED')).length;
    const firstAlternateAcceptanceRate = reawardedQueues.length > 0 ? (firstAlternateAccepted / reawardedQueues.length) * 100 : 0;

    const cascadeDepth = reawardedQueues.length > 0
      ? reawardedQueues.reduce((sum, q) => sum + q.declineHistory.length, 0) / reawardedQueues.length
      : 0;

    const completeFailureRate = metrics.totalLanes > 0 ? (metrics.failed / metrics.totalLanes) * 100 : 0;

    const declineByVendor = new Map<string, number>();
    scopedQueues.forEach((q) => {
      q.declineHistory.forEach((d) => {
        declineByVendor.set(d.vendorId, (declineByVendor.get(d.vendorId) || 0) + 1);
      });
    });

    const vendorDeclines = Array.from(declineByVendor.entries())
      .map(([vendorId, count]) => ({
        vendorId,
        companyName: auctionEngine.getVendorSummary(vendorId).companyName,
        declineCount: count,
      }))
      .sort((a, b) => b.declineCount - a.declineCount)
      .slice(0, 10);

    return {
      thresholdCoverage,
      firstAlternateAcceptanceRate,
      cascadeDepth,
      completeFailureRate,
      vendorDeclines,
    };
  }, [tick, scopedQueues, metrics.totalLanes, metrics.failed]);

  const bars = [
    { label: 'Auto-award Success', value: metrics.totalLanes > 0 ? (metrics.autoReawards / metrics.totalLanes) * 100 : 0, tone: 'bg-emerald-500' },
    { label: 'Threshold Coverage', value: derived.thresholdCoverage, tone: 'bg-blue-500' },
    { label: 'Failure Rate', value: derived.completeFailureRate, tone: 'bg-red-500' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alternate Queue Analytics</h1>
          <p className="text-slate-500">Queue efficiency, cascade behavior, and decline trends.</p>
        </div>
        <select value={auctionId} onChange={(e) => setAuctionId(e.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="all">All Completed Auctions</option>
          {auctions.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Metric title="Average Queue Depth" value={metrics.averageDepth.toFixed(1)} tone="slate" />
        <Metric title="Threshold Coverage" value={pct(derived.thresholdCoverage)} tone="blue" />
        <Metric title="Auto-award Success Rate" value={pct(metrics.totalLanes > 0 ? (metrics.autoReawards / metrics.totalLanes) * 100 : 0)} tone="green" />
        <Metric title="Cascade Depth" value={derived.cascadeDepth.toFixed(1)} tone="yellow" />
        <Metric title="Complete Failure Rate" value={pct(derived.completeFailureRate)} tone="red" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="font-semibold text-slate-900 inline-flex items-center gap-2"><BarChart3 size={16} />Queue Efficiency Bars</div>
        <div className="mt-4 space-y-3">
          {bars.map((bar) => (
            <div key={bar.label}>
              <div className="text-xs text-slate-600 mb-1">{bar.label} • {pct(bar.value)}</div>
              <div className="h-2 bg-slate-100 rounded">
                <div className={`h-2 rounded ${bar.tone}`} style={{ width: `${Math.min(100, Math.max(0, bar.value))}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">Vendor Decline Analysis</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-left">Vendor ID</th>
                <th className="px-4 py-3 text-left">Declines</th>
              </tr>
            </thead>
            <tbody>
              {derived.vendorDeclines.map((v) => (
                <tr key={v.vendorId} className="border-t border-slate-100">
                  <td className="px-4 py-3">{v.companyName}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{v.vendorId}</td>
                  <td className="px-4 py-3 font-semibold">{v.declineCount}</td>
                </tr>
              ))}
              {derived.vendorDeclines.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No declines recorded in selected scope.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700">
        <div className="font-semibold text-slate-900 mb-2">Preventive Insights</div>
        <div>1. Improve threshold coverage by inviting more qualified alternates on sparse lanes.</div>
        <div>2. Pre-alert top alternates earlier for high-risk lanes (low reliability original winners).</div>
        <div>3. Trigger procurement intervention when cascade depth exceeds 2 on a lane.</div>
        <div>4. Apply stricter reliability penalties for repeated declines in a rolling 30-day window.</div>
      </div>
    </div>
  );
}

function Metric({ title, value, tone }: { title: string; value: string; tone: 'green' | 'yellow' | 'red' | 'blue' | 'slate' }) {
  const cls = {
    green: 'bg-green-50 text-green-800 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    slate: 'bg-slate-50 text-slate-900 border-slate-200',
  }[tone];
  return <div className={`rounded-lg border p-3 ${cls}`}><div className="text-xs">{title}</div><div className="text-xl font-bold mt-1">{value}</div></div>;
}
