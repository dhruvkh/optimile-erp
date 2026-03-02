import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bell, Clock, Phone, RefreshCw } from 'lucide-react';
import { auctionEngine } from '../services/mockBackend';
import { AwardAcceptanceStatus } from '../types';
import { useToast } from './common';

function formatINR(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function timeLeft(deadline: number) {
  const ms = Math.max(0, deadline - Date.now());
  const h = Math.floor(ms / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  return `${h}h ${m}m`;
}

export function AuctionAcceptanceDashboard() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const [tick, setTick] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    if (!auctionId) return;
    const unsub = auctionEngine.subscribe(() => setTick((v) => v + 1));
    const timer = setInterval(() => setTick((v) => v + 1), 30_000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, [auctionId]);

  const summary = useMemo(() => {
    if (!auctionId) return null;
    try {
      return auctionEngine.getAuctionResultsSummary(auctionId);
    } catch {
      return null;
    }
  }, [auctionId, tick]);

  if (!summary) return <div className="text-slate-500">Loading acceptance dashboard...</div>;

  const stats = auctionEngine.getAcceptanceStats(summary.auction.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Acceptance Dashboard</h1>
          <p className="text-slate-500">{summary.auction.name} • {summary.auction.id.slice(0, 10)}</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link to={`/ams/analytics/alternate-queue`} className="text-blue-700 hover:underline">Alternate Queue</Link>
          <Link to={`/ams/auctions/results/${summary.auction.id}`} className="text-blue-700 hover:underline">Back to Results</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Stat title="Total Awards" value={`${stats.total}`} tone="slate" />
        <Stat title="Accepted" value={`${stats.accepted} (${stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}%)`} tone="green" />
        <Stat title="Pending" value={`${stats.pending} (${stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%)`} tone="yellow" />
        <Stat title="Declined" value={`${stats.declined}`} tone="red" />
        <Stat title="Expired" value={`${stats.expired}`} tone="red" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="font-semibold text-slate-800">Acceptance Status</div>
          <button className="px-3 py-1.5 rounded border border-slate-300 text-sm inline-flex items-center gap-1" onClick={() => setTick((v) => v + 1)}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Lane Name</th>
                <th className="px-4 py-3 text-left">Winner</th>
                <th className="px-4 py-3 text-left">Award Value</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Deadline</th>
                <th className="px-4 py-3 text-left">Time Remaining</th>
                <th className="px-4 py-3 text-left">Last Action</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {summary.awards.map((award) => {
                const lane = summary.lanes.find((l) => l.id === award.auctionLaneId);
                const lastNotification = award.notificationLog[award.notificationLog.length - 1];
                return (
                  <tr key={award.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">{lane?.laneName || award.auctionLaneId}</td>
                    <td className="px-4 py-3">{award.vendorId}</td>
                    <td className="px-4 py-3 font-semibold">{formatINR(award.price)}</td>
                    <td className="px-4 py-3"><StatusBadge status={award.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-600">{new Date(award.acceptanceDeadline).toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-xs">{timeLeft(award.acceptanceDeadline)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{lastNotification ? `${lastNotification.channel} ${Math.max(0, Math.round((Date.now() - lastNotification.sentAt) / (60 * 60 * 1000)))}h ago` : 'No reminders yet'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          className="p-1 rounded border border-slate-300"
                          title="Send reminder"
                          onClick={() => {
                            auctionEngine.sendAwardReminder(award.id, 'EMAIL', 'ADMIN-USER');
                            showToast({ type: 'info', title: 'Reminder sent' });
                          }}
                        >
                          <Bell size={13} />
                        </button>
                        <button className="p-1 rounded border border-slate-300" title="Call vendor"><Phone size={13} /></button>
                        <button
                          className="p-1 rounded border border-slate-300"
                          title="Extend +12h"
                          onClick={() => {
                            auctionEngine.extendAwardDeadline(award.id, 12, 'ADMIN-USER');
                            showToast({ type: 'success', title: 'Deadline extended by 12h' });
                          }}
                        >
                          <Clock size={13} />
                        </button>
                        <button
                          className="px-2 py-1 rounded bg-blue-600 text-white text-xs"
                          onClick={() => {
                            auctionEngine.updateAwardAcceptance(award.id, 'DECLINE', { declineReason: 'Manual re-award by admin' }, 'ADMIN-USER');
                            showToast({ type: 'warning', title: 'Award declined and re-award triggered' });
                          }}
                        >
                          Re-award
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value, tone }: { title: string; value: string; tone: 'slate' | 'green' | 'yellow' | 'red' }) {
  const cls = {
    slate: 'bg-slate-50 text-slate-900 border-slate-200',
    green: 'bg-green-50 text-green-800 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    red: 'bg-red-50 text-red-800 border-red-200',
  }[tone];

  return (
    <div className={`rounded-lg border p-3 ${cls}`}>
      <div className="text-xs">{title}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: AwardAcceptanceStatus }) {
  const styles: Record<AwardAcceptanceStatus, string> = {
    [AwardAcceptanceStatus.ACCEPTED]: 'bg-green-100 text-green-700',
    [AwardAcceptanceStatus.PENDING]: 'bg-yellow-100 text-yellow-700',
    [AwardAcceptanceStatus.DECLINED]: 'bg-red-100 text-red-700',
    [AwardAcceptanceStatus.EXPIRED]: 'bg-red-100 text-red-700',
    [AwardAcceptanceStatus.REAWARDED]: 'bg-blue-100 text-blue-700',
    [AwardAcceptanceStatus.MODIFICATION_REQUESTED]: 'bg-orange-100 text-orange-700',
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>{status}</span>;
}
