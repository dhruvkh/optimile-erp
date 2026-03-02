import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bell, RefreshCw } from 'lucide-react';
import { auctionEngine } from '../services/mockBackend';

function formatINR(v: number) { return `₹${Math.round(v).toLocaleString('en-IN')}`; }

export function AlternateQueueDashboard() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!auctionId) return;
    auctionEngine.createOrRefreshAlternateQueue(auctionId);
    const unsub = auctionEngine.subscribe(() => setTick((v) => v + 1));
    return unsub;
  }, [auctionId]);

  if (!auctionId) return <div className="text-slate-500">Auction not found.</div>;

  const queues = auctionEngine.getAlternateQueueByAuction(auctionId);
  const metrics = auctionEngine.getAlternateQueueMetrics(auctionId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alternate Queue Monitor</h1>
          <p className="text-slate-500">Auto re-award and standby management for completed auction lanes.</p>
        </div>
        <button className="px-3 py-2 rounded border border-slate-300 text-sm inline-flex items-center gap-1" onClick={() => setTick((v) => v + 1)}><RefreshCw size={13} />Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <Metric title="Total Lanes" value={`${metrics.totalLanes}`} tone="slate" />
        <Metric title="Awards Accepted" value={`${metrics.accepted}`} tone="green" />
        <Metric title="Pending" value={`${metrics.pending}`} tone="yellow" />
        <Metric title="Declined" value={`${metrics.declined}`} tone="red" />
        <Metric title="Auto Re-awards" value={`${metrics.autoReawards}`} tone="blue" />
        <Metric title="Standby" value={`${metrics.standby}`} tone="slate" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">Lanes Status</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Lane</th>
                <th className="px-4 py-3 text-left">Current Winner</th>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Bid</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Decline History</th>
                <th className="px-4 py-3 text-left">Alternate Count</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queues.map((q) => {
                const current = q.queue.find((e) => ['AWARDED', 'ACCEPTED', 'REAWARDED'].includes(e.status));
                const eligibleAlternates = q.queue.filter((e) => e.rank > 1 && e.eligibleForAutoAward).length;
                const rankText = current ? `${current.rank}${current.rank === 1 ? 'st' : current.rank === 2 ? 'nd' : 'th'}` : '--';
                const statusText = q.queueStatus === 'FAILED' ? 'CRITICAL - NO WINNER' : current?.rank && current.rank > 1 ? 'RE-AWARDED' : 'ORIGINAL WINNER';
                return (
                  <React.Fragment key={q.laneId}>
                    <tr className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{q.laneName}</td>
                      <td className="px-4 py-3">{current?.vendorName || '--'} ({current?.vendorId || '--'})</td>
                      <td className="px-4 py-3">{rankText}</td>
                      <td className="px-4 py-3 font-semibold">{current ? formatINR(current.bidAmount) : '--'}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${q.queueStatus === 'FAILED' ? 'bg-red-100 text-red-700' : statusText === 'RE-AWARDED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{statusText}</span></td>
                      <td className="px-4 py-3 text-xs">{q.declineHistory.length > 0 ? `${q.declineHistory.length} decline(s)` : '-'}</td>
                      <td className="px-4 py-3">{eligibleAlternates} eligible alternates</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button className="px-2 py-1 rounded border border-slate-300 text-xs" onClick={() => setExpanded(expanded === q.laneId ? null : q.laneId)}>View Queue</button>
                          {q.queueStatus === 'FAILED' && <button className="px-2 py-1 rounded bg-red-600 text-white text-xs" onClick={() => navigate(`/ams/auctions/results/${auctionId}`)}>Take Action</button>}
                        </div>
                      </td>
                    </tr>
                    {expanded === q.laneId && (
                      <tr className="bg-slate-50">
                        <td colSpan={8} className="px-4 py-3">
                          <QueueTable laneId={q.laneId} auctionId={auctionId} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function QueueTable({ laneId, auctionId }: { laneId: string; auctionId: string }) {
  const [v, setV] = useState(0);
  const q = auctionEngine.getAlternateQueueForLane(laneId);
  if (!q) return null;
  return (
    <div className="space-y-2">
      <table className="w-full text-xs">
        <thead className="text-slate-500">
          <tr>
            <th className="text-left py-1">Queue Position</th>
            <th className="text-left py-1">Vendor</th>
            <th className="text-left py-1">Bid</th>
            <th className="text-left py-1">Status</th>
            <th className="text-right py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {q.queue.map((entry) => (
            <tr key={entry.vendorId} className="border-t border-slate-200">
              <td className="py-1">{entry.rank}</td>
              <td className="py-1">{entry.vendorName}</td>
              <td className="py-1">{formatINR(entry.bidAmount)}</td>
              <td className="py-1">{entry.status}</td>
              <td className="py-1 text-right">
                <div className="inline-flex gap-1">
                  {entry.status === 'STANDBY' && (
                    <button className="px-2 py-1 rounded border border-slate-300" onClick={() => {
                      auctionEngine.manualQueueAction({ laneId, action: 'AWARD_VENDOR', vendorId: entry.vendorId, reason: 'Manual override', actor: 'ADMIN-USER' });
                      setV(v + 1);
                    }}>Manual Award</button>
                  )}
                  {entry.status === 'STANDBY' && (
                    <button className="px-2 py-1 rounded border border-slate-300 inline-flex items-center gap-1" onClick={() => {
                      auctionEngine.sendQueuePreAlert(laneId, entry.vendorId, 'ADMIN-USER');
                      setV(v + 1);
                    }}><Bell size={12} />Pre-Alert</button>
                  )}
                  {entry.status === 'STANDBY' && (
                    <button className="px-2 py-1 rounded border border-slate-300" onClick={() => {
                      auctionEngine.manualQueueAction({ laneId, action: 'REMOVE_VENDOR', vendorId: entry.vendorId, reason: 'Disqualified', actor: 'ADMIN-USER' });
                      setV(v + 1);
                    }}>Remove</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-2 text-xs">
        <button className="px-2 py-1 rounded border border-slate-300" onClick={() => {
          const input = prompt('New threshold value', String(q.acceptanceThreshold.value));
          if (!input) return;
          const n = Number(input);
          if (!Number.isFinite(n) || n <= 0) return;
          auctionEngine.manualQueueAction({ laneId, action: 'ADJUST_THRESHOLD', thresholdType: q.acceptanceThreshold.type, thresholdValue: n, actor: 'ADMIN-USER' });
          setV(v + 1);
        }}>Adjust Threshold</button>
        <button className="px-2 py-1 rounded border border-slate-300" onClick={() => {
          auctionEngine.manualQueueAction({ laneId, action: 'SKIP_TO_NEXT', actor: 'ADMIN-USER' });
          setV(v + 1);
        }}>Skip to Next</button>
        <button className="px-2 py-1 rounded border border-slate-300" onClick={() => {
          window.location.href = `#/admin/auction-results/${auctionId}/failed-awards/${laneId}`;
        }}>Failed Award Actions</button>
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
