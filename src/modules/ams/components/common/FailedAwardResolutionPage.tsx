import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { auctionEngine } from '../../services/mockBackend';

function formatINR(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function FailedAwardResolutionPage() {
  const { auctionId, laneId } = useParams<{ auctionId: string; laneId: string }>();
  const [tick, setTick] = useState(0);
  const [reason, setReason] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');

  useEffect(() => {
    if (!auctionId || !laneId) return;
    const unsub = auctionEngine.subscribe(() => setTick((v) => v + 1));
    return unsub;
  }, [auctionId, laneId]);

  const context = useMemo(() => {
    if (!auctionId || !laneId) return null;
    try {
      return auctionEngine.getFailedAwardContext(auctionId, laneId);
    } catch {
      return null;
    }
  }, [auctionId, laneId, tick]);

  useEffect(() => {
    if (!context) return;
    if (!selectedVendor) {
      const preferred = context.outOfThreshold[0]?.vendorId || context.standby[0]?.vendorId || '';
      setSelectedVendor(preferred);
    }
  }, [context, selectedVendor]);

  if (!context || !auctionId || !laneId) {
    return <div className="text-slate-500">Failed-award context not available.</div>;
  }

  const applyAction = (
    action: 'AWARD_OUTSIDE_THRESHOLD' | 'NEGOTIATE_ORIGINAL' | 'REAUCTION' | 'CANCEL_LANE',
  ) => {
    if ((action === 'AWARD_OUTSIDE_THRESHOLD') && !selectedVendor) return;
    if (!window.confirm('Proceed with this failed-award action?')) return;
    auctionEngine.resolveFailedAward({
      auctionId,
      laneId,
      action,
      actor: 'ADMIN-USER',
      reason: reason.trim() || undefined,
      vendorId: action === 'AWARD_OUTSIDE_THRESHOLD' ? selectedVendor : undefined,
    });
    setTick((v) => v + 1);
  };

  const options = [...context.outOfThreshold, ...context.standby].sort((a, b) => a.rank - b.rank);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Failed Award Resolution</h1>
          <p className="text-slate-500">Lane: {context.laneName}</p>
          <p className="text-xs text-slate-500">Queue status: {context.queueStatus} {context.failureReason ? `• ${context.failureReason}` : ''}</p>
        </div>
        <Link to={`/ams/analytics/alternate-queue`} className="text-sm text-blue-700 hover:underline">Back to Alternate Queue</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card title="Winner Bid" value={formatINR(context.winnerBid)} tone="blue" />
        <Card title="Eligible Standby" value={`${context.standby.length}`} tone="green" />
        <Card title="Outside Threshold" value={`${context.outOfThreshold.length}`} tone="yellow" />
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 flex items-start gap-2">
        <AlertTriangle size={16} className="mt-0.5" />
        <div>
          <div className="font-semibold">Critical: No eligible accepted winner.</div>
          <div>Choose a recovery action to prevent service disruption for this lane.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="font-semibold text-slate-900">Action A: Award Outside Threshold</div>
          <div className="text-sm text-slate-600">Manual override to award a queued vendor even if threshold is exceeded.</div>
          <select
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
          >
            <option value="">Select vendor</option>
            {options.map((entry) => (
              <option key={entry.vendorId} value={entry.vendorId}>
                {entry.rank} • {entry.vendorName} ({formatINR(entry.bidAmount)})
                {!entry.withinThreshold ? ' • Above threshold' : ''}
              </option>
            ))}
          </select>
          <button
            className="px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
            disabled={!selectedVendor}
            onClick={() => applyAction('AWARD_OUTSIDE_THRESHOLD')}
          >
            Award Selected Vendor
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="font-semibold text-slate-900">Action B: Negotiate with Original Winner</div>
          <div className="text-sm text-slate-600">Reopen award with the original declined/expired winner.</div>
          <button className="px-3 py-2 rounded bg-orange-600 text-white text-sm" onClick={() => applyAction('NEGOTIATE_ORIGINAL')}>
            Open Negotiation
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="font-semibold text-slate-900">Action C: Re-auction Single Lane</div>
          <div className="text-sm text-slate-600">Starts a 30-minute quick auction for this lane.</div>
          <button className="px-3 py-2 rounded bg-emerald-600 text-white text-sm" onClick={() => applyAction('REAUCTION')}>
            Create Re-Auction
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="font-semibold text-slate-900">Action D: Cancel Lane</div>
          <div className="text-sm text-slate-600">Removes lane from allocation and closes further re-award attempts.</div>
          <button className="px-3 py-2 rounded bg-red-600 text-white text-sm" onClick={() => applyAction('CANCEL_LANE')}>
            Cancel Lane
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
        <label className="text-sm font-semibold text-slate-900">Justification / Notes</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="Add context for audit trail (required for governance in real systems)."
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">Queue Detail</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-left">Bid</th>
                <th className="px-4 py-3 text-left">Diff</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Eligibility</th>
              </tr>
            </thead>
            <tbody>
              {context.queue.map((entry) => (
                <tr key={entry.vendorId} className="border-t border-slate-100">
                  <td className="px-4 py-3">{entry.rank}</td>
                  <td className="px-4 py-3 font-medium">{entry.vendorName}</td>
                  <td className="px-4 py-3">{formatINR(entry.bidAmount)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">+{formatINR(entry.priceDifference)} ({entry.percentageDifference.toFixed(2)}%)</td>
                  <td className="px-4 py-3">{entry.status}</td>
                  <td className="px-4 py-3 text-xs">
                    {entry.eligibleForAutoAward ? (
                      <span className="inline-flex items-center gap-1 text-green-700"><CheckCircle2 size={12} />Eligible</span>
                    ) : (
                      <span className="text-red-700">Not eligible{entry.reason ? `: ${entry.reason}` : ''}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, tone }: { title: string; value: string; tone: 'green' | 'yellow' | 'blue' }) {
  const cls = {
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
  }[tone];
  return <div className={`rounded-lg border p-3 ${cls}`}><div className="text-xs">{title}</div><div className="text-xl font-bold mt-1">{value}</div></div>;
}
