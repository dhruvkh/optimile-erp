import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowUpRight, Crown, Download, FileText, MessageSquare, Phone, Trophy } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { auctionEngine } from '../services/mockBackend';
import { Award, AwardAcceptanceStatus } from '../types';
import { useToast } from './common';

const SAVING_BANDS = [
  { key: 'gt20', label: '> 20%', min: 20, max: 999 },
  { key: '15to20', label: '15-20%', min: 15, max: 20 },
  { key: '10to15', label: '10-15%', min: 10, max: 15 },
  { key: 'lt10', label: '< 10%', min: -999, max: 10 },
] as const;

type SavingFilter = 'all' | (typeof SAVING_BANDS[number]['key']);

type SortBy = 'savings' | 'award' | 'bids' | 'pending';

function formatINR(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${h}h ${m}m`;
}

function savingColor(pct: number) {
  if (pct > 15) return 'text-green-700 bg-green-100';
  if (pct > 10) return 'text-yellow-700 bg-yellow-100';
  if (pct > 5) return 'text-orange-700 bg-orange-100';
  return 'text-red-700 bg-red-100';
}

export function AuctionResultsPage() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [expandedLane, setExpandedLane] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | AwardAcceptanceStatus>('all');
  const [winnerFilter, setWinnerFilter] = useState('all');
  const [savingFilter, setSavingFilter] = useState<SavingFilter>('all');
  const [awardRange, setAwardRange] = useState<[number, number]>([0, 10_00_000]);
  const [sortBy, setSortBy] = useState<SortBy>('pending');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!auctionId) return;
    try {
      auctionEngine.finalizeAuctionResults(auctionId, 'SYSTEM');
    } catch {
      // ignore
    }

    const unsub = auctionEngine.subscribe(() => setTick((v) => v + 1));
    return unsub;
  }, [auctionId]);

  const summary = useMemo(() => {
    if (!auctionId) return null;
    try {
      return auctionEngine.getAuctionResultsSummary(auctionId);
    } catch {
      return null;
    }
  }, [auctionId, tick]);

  if (!summary) return <div className="text-slate-500">Loading results...</div>;

  const winnerOptions = Array.from(new Set(summary.awards.map((a) => a.vendorId)));
  const minAward = Math.min(...summary.awards.map((a) => a.price), 0);
  const maxAward = Math.max(...summary.awards.map((a) => a.price), 0);

  const rows = summary.lanes
    .map((lane, idx) => {
      const award = summary.awards.find((a) => a.auctionLaneId === lane.id);
      const bids = auctionEngine.getBidsByLane(lane.id);
      const savings = award ? lane.basePrice - award.price : 0;
      const savingsPct = lane.basePrice > 0 ? (savings / lane.basePrice) * 100 : 0;
      const top = auctionEngine.getLaneTopBidders(lane.id, 5);
      return {
        seq: idx + 1,
        lane,
        award,
        bids,
        savings,
        savingsPct,
        top,
      };
    })
    .filter((row) => {
      if (!row.award) return false;
      if (statusFilter !== 'all' && row.award.status !== statusFilter) return false;
      if (winnerFilter !== 'all' && row.award.vendorId !== winnerFilter) return false;
      if (row.award.price < awardRange[0] || row.award.price > awardRange[1]) return false;
      if (savingFilter !== 'all') {
        const band = SAVING_BANDS.find((b) => b.key === savingFilter);
        if (band && !(row.savingsPct >= band.min && row.savingsPct < band.max)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'savings') return b.savingsPct - a.savingsPct;
      if (sortBy === 'award') return b.award!.price - a.award!.price;
      if (sortBy === 'bids') return b.bids.length - a.bids.length;
      const pendingPriority = (award?: Award) => {
        if (!award) return 9;
        if (award.status === AwardAcceptanceStatus.PENDING) return 0;
        if (award.status === AwardAcceptanceStatus.MODIFICATION_REQUESTED) return 1;
        if (award.status === AwardAcceptanceStatus.DECLINED) return 2;
        return 3;
      };
      return pendingPriority(a.award) - pendingPriority(b.award);
    });

  const toggleSelected = (laneId: string) => {
    const next = new Set(selected);
    if (next.has(laneId)) next.delete(laneId);
    else next.add(laneId);
    setSelected(next);
  };

  const bulkGenerateContracts = () => {
    let generated = 0;
    selected.forEach((laneId) => {
      const award = summary.awards.find((a) => a.auctionLaneId === laneId);
      if (!award) return;
      if (award.status !== AwardAcceptanceStatus.ACCEPTED) return;
      try {
        auctionEngine.generateContractDraftFromAward(award.id, 'ADMIN-USER');
        generated += 1;
      } catch {
        // skip failures
      }
    });
    showToast({ type: generated > 0 ? 'success' : 'warning', title: `${generated} contracts generated` });
  };

  const bulkReminders = () => {
    let sent = 0;
    selected.forEach((laneId) => {
      const award = summary.awards.find((a) => a.auctionLaneId === laneId);
      if (!award) return;
      if (award.status !== AwardAcceptanceStatus.PENDING) return;
      auctionEngine.sendAwardReminder(award.id, 'EMAIL', 'ADMIN-USER');
      sent += 1;
    });
    showToast({ type: 'info', title: `${sent} reminders sent` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{summary.auction.name}</h1>
          <div className="text-sm text-slate-500 mt-1">#{summary.auction.id.slice(0, 14)} • <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{summary.auction.auctionType}</span> <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">COMPLETED</span></div>
          <div className="text-xs text-slate-500 mt-2">
            Started: {new Date(summary.startedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} • Ended: {new Date(summary.endedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} • Duration: {formatDuration(summary.durationMs)}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-lg border border-slate-300 text-sm" onClick={() => navigate(`/ams/auctions/acceptance/${summary.auction.id}`)}>Acceptance Dashboard</button>
          <button className="px-3 py-2 rounded-lg border border-slate-300 text-sm" onClick={() => navigate(`/ams/analytics/alternate-queue`)}>Alternate Queue</button>
          <button className="px-3 py-2 rounded-lg border border-slate-300 text-sm" onClick={() => navigate('/ams/analytics/alternate-queue')}>Queue Analytics</button>
          <button className="px-3 py-2 rounded-lg border border-slate-300 text-sm inline-flex items-center gap-2"><Download size={14} />Export</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <MetricCard title="Total Savings" value={formatINR(summary.totalSavings)} sub={`${summary.savingsPct.toFixed(1)}% vs ${formatINR(summary.totalStarting)}`} highlight="Above target of 18%" />
        <MetricCard title="Participation" value={`${summary.activeParticipants}/${summary.invitedVendors}`} sub={`${summary.totalBids} bids • Avg ${summary.avgBidsPerLane.toFixed(1)}/lane`} />
        <MetricCard title="Winners" value={`${summary.uniqueWinners} vendors`} sub={`${summary.lanesAwarded}/${summary.lanes.length} awarded • Pending ${summary.pendingAcceptance}`} />
        <MetricCard title="Award Value" value={formatINR(summary.totalAwarded)} sub={`Avg ${formatINR(summary.lanesAwarded > 0 ? summary.totalAwarded / summary.lanesAwarded : 0)}`} />
        <MetricCard title="Timeline" value={`${summary.lanes.length - summary.pendingAcceptance} on-time`} sub={`Extensions: ${summary.totalBids > 0 ? Math.floor(summary.totalBids / 20) : 0}`} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select className="border border-slate-300 rounded px-2 py-1" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="all">All Status</option>
            {Object.values(AwardAcceptanceStatus).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="border border-slate-300 rounded px-2 py-1" value={winnerFilter} onChange={(e) => setWinnerFilter(e.target.value)}>
            <option value="all">All Winners</option>
            {winnerOptions.map((vendor) => <option key={vendor} value={vendor}>{vendor}</option>)}
          </select>
          <select className="border border-slate-300 rounded px-2 py-1" value={savingFilter} onChange={(e) => setSavingFilter(e.target.value as SavingFilter)}>
            <option value="all">All Savings Bands</option>
            {SAVING_BANDS.map((band) => <option key={band.key} value={band.key}>{band.label}</option>)}
          </select>
          <select className="border border-slate-300 rounded px-2 py-1" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
            <option value="pending">Pending acceptance first</option>
            <option value="savings">Highest savings first</option>
            <option value="award">Largest award value</option>
            <option value="bids">Most bids received</option>
          </select>
          <div className="text-xs text-slate-500 ml-auto">Award range: {formatINR(awardRange[0])} - {formatINR(awardRange[1])}</div>
        </div>

        <div className="grid grid-cols-2 gap-2 items-center text-xs">
          <input type="range" min={minAward} max={maxAward} value={awardRange[0]} onChange={(e) => setAwardRange([Number(e.target.value), awardRange[1]])} />
          <input type="range" min={minAward} max={maxAward} value={awardRange[1]} onChange={(e) => setAwardRange([awardRange[0], Number(e.target.value)])} />
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 text-sm rounded-lg bg-slate-50 border border-slate-200 p-2">
            <span>{selected.size} selected</span>
            <button className="px-2 py-1 rounded bg-blue-600 text-white" onClick={bulkGenerateContracts}>Generate Contracts for Selected</button>
            <button className="px-2 py-1 rounded bg-yellow-100 text-yellow-800" onClick={bulkReminders}>Send Acceptance Reminders</button>
            <button className="px-2 py-1 rounded border border-slate-300">Export Selected</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-2 py-2"></th>
                <th className="px-2 py-2 text-left">Lane</th>
                <th className="px-2 py-2 text-left">Starting</th>
                <th className="px-2 py-2 text-left">Winner</th>
                <th className="px-2 py-2 text-left">Final</th>
                <th className="px-2 py-2 text-left">Savings</th>
                <th className="px-2 py-2 text-left">Bids</th>
                <th className="px-2 py-2 text-left">Runners-up</th>
                <th className="px-2 py-2 text-left">Status</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const award = row.award!;
                const runner = row.top.filter((t) => t.vendorId !== award.vendorId).slice(0, 2);
                return (
                  <React.Fragment key={row.lane.id}>
                    <tr className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-2"><input type="checkbox" checked={selected.has(row.lane.id)} onChange={() => toggleSelected(row.lane.id)} /></td>
                      <td className="px-2 py-2">
                        <button className="font-semibold text-slate-900 hover:text-blue-700" onClick={() => setExpandedLane(expandedLane === row.lane.id ? null : row.lane.id)}>{row.seq}. {row.lane.laneName}</button>
                      </td>
                      <td className="px-2 py-2">{formatINR(row.lane.basePrice)}</td>
                      <td className="px-2 py-2"><span className="inline-flex items-center gap-1"><Trophy size={14} className="text-yellow-600" />{award.vendorId}</span></td>
                      <td className="px-2 py-2 font-semibold">{formatINR(award.price)}</td>
                      <td className="px-2 py-2"><span className={`px-2 py-1 rounded text-xs font-semibold ${savingColor(row.savingsPct)}`}>{formatINR(row.savings)} ({row.savingsPct.toFixed(1)}%)</span></td>
                      <td className="px-2 py-2">{row.bids.length}</td>
                      <td className="px-2 py-2 text-xs text-slate-600">{runner.map((r, idx) => `${idx + 2}nd: ${r.vendorId}`).join(', ') || '--'}</td>
                      <td className="px-2 py-2"><StatusPill status={award.status} /></td>
                      <td className="px-2 py-2 text-right">
                        <div className="inline-flex gap-1">
                          <button className="p-1 rounded border border-slate-300" title="View Bid History" onClick={() => setExpandedLane(row.lane.id)}><FileText size={13} /></button>
                          <button className="px-2 py-1 rounded bg-blue-600 text-white text-xs" onClick={() => {
                            if (award.status !== AwardAcceptanceStatus.ACCEPTED) {
                              showToast({ type: 'warning', title: 'Acceptance pending' });
                              return;
                            }
                            const contractId = auctionEngine.generateContractDraftFromAward(award.id, 'ADMIN-USER');
                            navigate(`/ams/contracts/${contractId}`);
                          }}>Generate Contract</button>
                          <button className="p-1 rounded border border-slate-300" title="Contact winner"><MessageSquare size={13} /></button>
                          <button className="p-1 rounded border border-slate-300" title="Call winner"><Phone size={13} /></button>
                        </div>
                      </td>
                    </tr>

                    {expandedLane === row.lane.id && (
                      <tr className="bg-slate-50">
                        <td colSpan={10} className="px-3 py-3">
                          <ExpandedLaneRow award={award} laneName={row.lane.laneName} bids={row.bids} />
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

function MetricCard({ title, value, sub, highlight }: { title: string; value: string; sub: string; highlight?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
      <div className="text-sm text-slate-600 mt-1">{sub}</div>
      {highlight && <div className="text-xs text-green-700 inline-flex items-center gap-1 mt-1"><ArrowUpRight size={12} />{highlight}</div>}
    </div>
  );
}

function StatusPill({ status }: { status: AwardAcceptanceStatus }) {
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

function ExpandedLaneRow({ award, laneName, bids }: { award: Award; laneName: string; bids: ReturnType<typeof auctionEngine.getBidsByLane> }) {
  const vendor = auctionEngine.getVendorSummary(award.vendorId);
  const timeline = bids
    .slice()
    .sort((a, b) => a.bidTimestamp - b.bidTimestamp)
    .map((bid) => ({
      t: new Date(bid.bidTimestamp).toLocaleTimeString(),
      amount: bid.bidAmount,
      vendor: bid.vendorId,
      winner: bid.vendorId === award.vendorId,
    }));

  const top = auctionEngine.getLaneTopBidders(award.auctionLaneId, 5);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm">
          <div className="font-semibold text-slate-900">Winner Profile</div>
          <div className="mt-2">Company: <strong>{vendor.companyName}</strong></div>
          <div>Vendor ID: <strong>{vendor.vendorId}</strong></div>
          <div>Contact: {vendor.contactName} ({vendor.phone})</div>
          <div>Email: {vendor.email}</div>
          <div>Performance Score: <strong>{vendor.performanceScore}/100</strong></div>
          <div>Recent Win Rate: <strong>{vendor.recentWinRate}%</strong></div>
          <div>Reliability: {'⭐'.repeat(Math.max(1, Math.min(5, vendor.reliability)))}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3 xl:col-span-2">
          <div className="font-semibold text-slate-900 mb-2">Bid Timeline: {laneName}</div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <XAxis dataKey="t" hide />
                <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3 overflow-x-auto">
          <div className="font-semibold text-slate-900 mb-2">Bid History</div>
          <table className="w-full text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="text-left">Rank</th>
                <th className="text-left">Timestamp</th>
                <th className="text-left">Vendor</th>
                <th className="text-left">Bid</th>
                <th className="text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((row, idx) => (
                <tr key={`${row.vendor}-${idx}`} className={`border-t border-slate-100 ${row.vendor === award.vendorId ? 'bg-yellow-50' : ''}`}>
                  <td>#{idx + 1}</td>
                  <td>{row.t}</td>
                  <td>{row.vendor === award.vendorId ? `${row.vendor} (Winner)` : row.vendor}</td>
                  <td>{formatINR(row.amount)}</td>
                  <td>{idx === timeline.length - 1 && row.vendor === award.vendorId ? 'Winner' : 'Outbid'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="font-semibold text-slate-900 mb-2">Runner-up Queue</div>
          <div className="space-y-2 text-sm">
            {top.filter(t => t.vendorId !== award.vendorId).map((t, idx) => (
              <div key={t.vendorId} className="rounded border border-slate-200 p-2 flex justify-between">
                <span>{idx + 2} Place: {t.vendorId}</span>
                <span>{formatINR(t.bestBid)} (+{formatINR(t.bestBid - award.price)})</span>
              </div>
            ))}
          </div>
          <button className="mt-3 px-3 py-2 rounded bg-blue-600 text-white text-sm inline-flex items-center gap-2" onClick={() => {
            auctionEngine.updateAwardAcceptance(award.id, 'DECLINE', { declineReason: 'Manual override to runner-up' }, 'ADMIN-USER');
          }}>
            <Crown size={14} /> Award to Runner-up
          </button>
        </div>
      </div>
    </div>
  );
}
