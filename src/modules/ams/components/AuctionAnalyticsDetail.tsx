import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, ExternalLink, Filter, Play, Share2 } from 'lucide-react';
import { auctionEngine } from '../services/mockBackend';
import { AuctionStatus, Bid } from '../types';

type TabKey = 'overview' | 'lanes' | 'dynamics' | 'vendors' | 'timeline' | 'financials' | 'insights';

const tabs: Array<{ id: TabKey; label: string }> = [
  { id: 'overview', label: 'Performance Overview' },
  { id: 'lanes', label: 'Lane Performance' },
  { id: 'dynamics', label: 'Competitive Dynamics' },
  { id: 'vendors', label: 'Vendor Analysis' },
  { id: 'timeline', label: 'Timeline & Events' },
  { id: 'financials', label: 'Financial Analysis' },
  { id: 'insights', label: 'Recommendations' },
];

function formatINR(v: number) {
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}

function formatCompactINR(v: number) {
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(2)}Cr`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}

function pct(v: number) {
  return `${v.toFixed(1)}%`;
}

function msHuman(ms: number) {
  if (!ms || ms <= 0) return '0m';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

function getCompetitionLabel(score: number) {
  if (score > 70) return '🔥 High';
  if (score > 45) return '⚡ Medium';
  return '😴 Low';
}

function makeEventLog(auctionId: string) {
  const logs = auctionEngine.getSnapshot().auditLog.filter((e) => {
    if (e.entityType === 'AUCTION' && e.entityId === auctionId) return true;
    if (e.entityType === 'LANE') {
      const lane = auctionEngine.getLane(e.entityId);
      return lane?.auctionId === auctionId;
    }
    if (e.entityType === 'BID') {
      const bid = auctionEngine.getAllBids().find((b) => b.id === e.entityId);
      const lane = bid ? auctionEngine.getLane(bid.auctionLaneId) : undefined;
      return lane?.auctionId === auctionId;
    }
    return false;
  });
  return logs.sort((a, b) => a.createdAt - b.createdAt);
}

export function AuctionAnalyticsDetail() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [tick, setTick] = useState(0);
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [eventSearch, setEventSearch] = useState('');

  useEffect(() => {
    const unsub = auctionEngine.subscribe(() => setTick((v) => v + 1));
    return unsub;
  }, []);

  const auction = auctionId ? auctionEngine.getAuction(auctionId) : undefined;
  if (!auctionId || !auction) return <div className="text-slate-500">Auction not found.</div>;

  const lanes = auctionEngine.getLanesByAuction(auctionId);
  const bids = auctionEngine.getBidsByAuction(auctionId);
  const awards = auctionEngine.getAwardsByAuction(auctionId);
  const eventLog = makeEventLog(auctionId);

  const invitedVendors = 12;
  const participants = new Set(bids.map((b) => b.vendorId)).size;
  const startValue = lanes.reduce((sum, lane) => sum + lane.basePrice, 0);
  const finalValue = awards.reduce((sum, award) => sum + award.price, 0);
  const savings = Math.max(0, startValue - finalValue);
  const savingsPct = startValue > 0 ? (savings / startValue) * 100 : 0;

  const startedAt = lanes.reduce((acc, lane) => (lane.startTime ? Math.min(acc, lane.startTime) : acc), Number.MAX_SAFE_INTEGER);
  const endedAt = lanes.reduce((acc, lane) => (lane.endTime ? Math.max(acc, lane.endTime) : acc), 0);
  const durationMs = startedAt !== Number.MAX_SAFE_INTEGER && endedAt > startedAt ? endedAt - startedAt : 0;

  const laneRows = lanes.map((lane, idx) => {
    const laneBids = auctionEngine.getBidsByLane(lane.id);
    const award = awards.find((a) => a.auctionLaneId === lane.id);
    const laneSavings = award ? lane.basePrice - award.price : 0;
    const laneSavingsPct = lane.basePrice > 0 ? (laneSavings / lane.basePrice) * 100 : 0;
    const top = auctionEngine.getLaneTopBidders(lane.id, 3);
    const margin = top.length >= 2 ? Math.max(0, top[1].bestBid - top[0].bestBid) : 0;
    const intensity = Math.min(100, laneBids.length * 3 + new Set(laneBids.map((b) => b.vendorId)).size * 8);
    return {
      seq: idx + 1,
      lane,
      bids: laneBids,
      award,
      laneSavings,
      laneSavingsPct,
      uniqueBidders: new Set(laneBids.map((b) => b.vendorId)).size,
      winnerName: award ? auctionEngine.getVendorSummary(award.vendorId).companyName : '--',
      margin,
      competition: intensity,
      stars: Math.max(1, Math.min(5, Math.round((laneSavingsPct + intensity / 10) / 8))),
      runnerUps: top.slice(1),
    };
  });

  const vendorRows = useMemo(() => {
    const map = new Map<string, {
      vendorId: string;
      lanesBid: Set<string>;
      lanesWon: number;
      totalBids: number;
      totalBidValue: number;
      totalDiscount: number;
      activityLevel: number;
      winsValue: number;
    }>();

    bids.forEach((bid) => {
      if (!map.has(bid.vendorId)) {
        map.set(bid.vendorId, {
          vendorId: bid.vendorId,
          lanesBid: new Set(),
          lanesWon: 0,
          totalBids: 0,
          totalBidValue: 0,
          totalDiscount: 0,
          activityLevel: 0,
          winsValue: 0,
        });
      }
      const row = map.get(bid.vendorId)!;
      row.lanesBid.add(bid.auctionLaneId);
      row.totalBids += 1;
      row.totalBidValue += bid.bidAmount;
    });

    awards.forEach((award) => {
      const row = map.get(award.vendorId);
      if (!row) return;
      row.lanesWon += 1;
      row.winsValue += award.price;
      const lane = lanes.find((l) => l.id === award.auctionLaneId);
      if (lane && lane.basePrice > 0) {
        row.totalDiscount += ((lane.basePrice - award.price) / lane.basePrice) * 100;
      }
    });

    return Array.from(map.values()).map((row) => {
      const avgBidAmount = row.totalBids > 0 ? row.totalBidValue / row.totalBids : 0;
      const avgDiscount = row.lanesWon > 0 ? row.totalDiscount / row.lanesWon : 0;
      const winRate = row.lanesBid.size > 0 ? (row.lanesWon / row.lanesBid.size) * 100 : 0;
      const strategy = avgDiscount > 18 ? 'Aggressive' : avgDiscount > 10 ? 'Balanced' : 'Conservative';
      const level = row.totalBids > 20 ? '🔥 Very Active' : row.totalBids > 10 ? '⚡ Active' : '😴 Low';
      return {
        vendorId: row.vendorId,
        name: auctionEngine.getVendorSummary(row.vendorId).companyName,
        lanesBid: row.lanesBid.size,
        lanesWon: row.lanesWon,
        winRate,
        totalBids: row.totalBids,
        avgBidAmount,
        avgDiscount,
        strategy,
        activityLevel: level,
        winsValue: row.winsValue,
      };
    }).sort((a, b) => b.lanesWon - a.lanesWon || b.totalBids - a.totalBids);
  }, [auctionId, tick, bids.length, awards.length]);

  const histogram = [
    { bucket: '0-5%', count: laneRows.filter((r) => r.laneSavingsPct < 5).length },
    { bucket: '5-10%', count: laneRows.filter((r) => r.laneSavingsPct >= 5 && r.laneSavingsPct < 10).length },
    { bucket: '10-15%', count: laneRows.filter((r) => r.laneSavingsPct >= 10 && r.laneSavingsPct < 15).length },
    { bucket: '15-20%', count: laneRows.filter((r) => r.laneSavingsPct >= 15 && r.laneSavingsPct < 20).length },
    { bucket: '20%+', count: laneRows.filter((r) => r.laneSavingsPct >= 20).length },
  ];

  const timelinePoints = bids
    .slice()
    .sort((a, b) => a.bidTimestamp - b.bidTimestamp)
    .map((bid) => ({
      t: bid.bidTimestamp,
      elapsedMin: startedAt !== Number.MAX_SAFE_INTEGER ? (bid.bidTimestamp - startedAt) / 60000 : 0,
      amount: bid.bidAmount,
      vendorId: bid.vendorId,
      laneId: bid.auctionLaneId,
    }));

  const filteredEvents = eventLog.filter((e) => {
    if (eventTypeFilter !== 'ALL' && e.eventType !== eventTypeFilter) return false;
    if (eventSearch.trim()) {
      const raw = `${e.eventType} ${JSON.stringify(e.payload)} ${e.entityType} ${e.entityId} ${e.triggeredBy}`.toLowerCase();
      if (!raw.includes(eventSearch.trim().toLowerCase())) return false;
    }
    return true;
  });

  const winnerAcceptancePct = awards.length > 0 ? (awards.filter((a) => a.status === 'ACCEPTED').length / awards.length) * 100 : 0;

  const overallScore = Math.max(45, Math.min(98, Math.round(
    (savingsPct * 2.8) +
    ((participants / invitedVendors) * 100 * 0.25) +
    ((bids.length / Math.max(1, lanes.length)) * 1.4) +
    (winnerAcceptancePct * 0.2)
  )));

  const scoreGrade = overallScore >= 85 ? 'A' : overallScore >= 75 ? 'B' : overallScore >= 65 ? 'C' : 'D';

  const prevLike = {
    savingsPct: Math.max(0, savingsPct - 3.2),
    participation: Math.max(0, (participants / invitedVendors) * 100 - 4.8),
    bidsPerLane: Math.max(0, bids.length / Math.max(1, lanes.length) - 2.1),
    duration: Math.max(1, durationMs / 60000 - 35),
  };

  const compareChart = [
    { metric: 'Savings %', thisAuction: savingsPct, previous: prevLike.savingsPct, avg5: savingsPct - 1.8, best: Math.max(savingsPct + 3, 25) },
    { metric: 'Participation %', thisAuction: (participants / invitedVendors) * 100, previous: prevLike.participation, avg5: (participants / invitedVendors) * 100 - 2.3, best: 86 },
    { metric: 'Bids/Lane', thisAuction: bids.length / Math.max(1, lanes.length), previous: prevLike.bidsPerLane, avg5: bids.length / Math.max(1, lanes.length) - 1.2, best: 28 },
    { metric: 'Duration (min)', thisAuction: durationMs / 60000, previous: prevLike.duration, avg5: durationMs / 60000 + 14, best: Math.max(60, durationMs / 60000 - 35) },
  ];

  const exportData = () => {
    const blob = new Blob([
      JSON.stringify(
        {
          auctionId,
          generatedAt: new Date().toISOString(),
          metrics: {
            startValue,
            finalValue,
            savings,
            savingsPct,
            participants,
            invitedVendors,
            bids: bids.length,
            lanes: lanes.length,
            durationMs,
          },
          laneRows,
          vendorRows,
          eventCount: filteredEvents.length,
        },
        null,
        2,
      ),
    ], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auction-analytics-${auctionId.slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">Analytics &gt; Auctions &gt; {auction.name}</div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{auction.name}</h1>
          <div className="text-xs text-slate-500 mt-1">{auction.id} • {auction.auctionType} • {auction.status === AuctionStatus.COMPLETED ? '✅ Completed' : auction.status} • {msHuman(durationMs)} • {lanes.length} lanes • {pct(savingsPct)} savings</div>
        </div>
        <div className="flex gap-2 text-sm">
          <button onClick={exportData} className="px-3 py-2 rounded border border-slate-300 inline-flex items-center gap-1"><Download size={14} />Export</button>
          <button className="px-3 py-2 rounded border border-slate-300 inline-flex items-center gap-1"><Share2 size={14} />Share</button>
          <Link to={`/ams/auctions/results/${auctionId}`} className="px-3 py-2 rounded border border-slate-300 inline-flex items-center gap-1">Results <ExternalLink size={14} /></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
        <Stat label="Type" value={auction.auctionType} />
        <Stat label="Status" value={auction.status} />
        <Stat label="Duration" value={msHuman(durationMs)} />
        <Stat label="Lanes" value={`${lanes.length}`} />
        <Stat label="Invited" value={`${invitedVendors}`} />
        <Stat label="Savings" value={pct(savingsPct)} />
      </div>

      <div className="border-b border-slate-200">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-700 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <MetricCard label="Starting Value" value={formatINR(startValue)} />
            <MetricCard label="Final Value" value={formatINR(finalValue)} />
            <MetricCard label="Savings" value={`${formatINR(savings)} (${pct(savingsPct)})`} positive />
            <MetricCard label="Target Savings" value={`18% → ${savingsPct >= 18 ? `✅ Exceeded by ${pct(savingsPct - 18)}` : 'Below target'}`} />
            <MetricCard label="Invited Vendors" value={`${invitedVendors}`} />
            <MetricCard label="Active Participants" value={`${participants} (${pct((participants / invitedVendors) * 100)})`} />
            <MetricCard label="Total Bids" value={`${bids.length}`} />
            <MetricCard label="Avg Bids/Lane" value={`${(bids.length / Math.max(1, lanes.length)).toFixed(1)}`} />
            <MetricCard label="Winner Acceptance" value={`${pct(winnerAcceptancePct)} (${awards.filter((a) => a.status === 'ACCEPTED').length}/${awards.length})`} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-1 bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-sm text-slate-500">Overall Score</div>
              <div className="text-4xl font-bold mt-1 text-slate-900">{overallScore}/100</div>
              <div className="text-sm mt-1">Grade: <span className="font-semibold">{scoreGrade}</span></div>
              <div className="text-xs mt-3 space-y-1 text-slate-600">
                <div>Savings Achievement: {Math.min(100, Math.round(savingsPct * 4.2))}/100</div>
                <div>Participation Rate: {Math.min(100, Math.round((participants / invitedVendors) * 100))}/100</div>
                <div>Bid Competition: {Math.min(100, Math.round((bids.length / Math.max(1, lanes.length)) * 4))}/100</div>
                <div>Time Efficiency: {Math.max(55, 100 - Math.round(durationMs / 120000))}/100</div>
                <div>Winner Acceptance: {Math.round(winnerAcceptancePct)}/100</div>
              </div>
            </div>
            <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-sm font-semibold mb-2">Comparison (This vs Previous/Avg/Best)</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={compareChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="thisAuction" fill="#2563eb" />
                    <Line dataKey="previous" stroke="#f59e0b" strokeWidth={2} />
                    <Line dataKey="avg5" stroke="#94a3b8" strokeDasharray="5 4" />
                    <Line dataKey="best" stroke="#16a34a" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lanes' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Lane</th>
                  <th className="px-3 py-2 text-left">Starting</th>
                  <th className="px-3 py-2 text-left">Final</th>
                  <th className="px-3 py-2 text-left">Savings</th>
                  <th className="px-3 py-2 text-left">Bids</th>
                  <th className="px-3 py-2 text-left">Unique</th>
                  <th className="px-3 py-2 text-left">Winner</th>
                  <th className="px-3 py-2 text-left">Win Margin</th>
                  <th className="px-3 py-2 text-left">Competition</th>
                  <th className="px-3 py-2 text-left">Rating</th>
                </tr>
              </thead>
              <tbody>
                {laneRows.map((r) => (
                  <tr key={r.lane.id} className={`border-t border-slate-100 ${r.laneSavingsPct > 20 ? 'bg-green-50/50' : r.laneSavingsPct >= 10 ? 'bg-yellow-50/40' : 'bg-orange-50/30'}`}>
                    <td className="px-3 py-2">{r.seq}</td>
                    <td className="px-3 py-2 font-medium">{r.lane.laneName}</td>
                    <td className="px-3 py-2">{formatINR(r.lane.basePrice)}</td>
                    <td className="px-3 py-2">{r.award ? formatINR(r.award.price) : '--'}</td>
                    <td className="px-3 py-2">{formatINR(r.laneSavings)} ({pct(r.laneSavingsPct)})</td>
                    <td className="px-3 py-2">{r.bids.length}</td>
                    <td className="px-3 py-2">{r.uniqueBidders}</td>
                    <td className="px-3 py-2">{r.winnerName}</td>
                    <td className="px-3 py-2">{formatINR(r.margin)}</td>
                    <td className="px-3 py-2">{getCompetitionLabel(r.competition)}</td>
                    <td className="px-3 py-2">{'⭐'.repeat(r.stars)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-sm font-semibold mb-2">Lane Savings Distribution</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogram}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm space-y-2">
              <div className="font-semibold">Best / Worst Performing Lanes</div>
              <div className="text-xs text-slate-500">Top 3</div>
              {laneRows.slice().sort((a, b) => b.laneSavingsPct - a.laneSavingsPct).slice(0, 3).map((r) => (
                <div key={`top-${r.lane.id}`} className="text-sm">{r.lane.laneName}: <span className="font-semibold text-green-700">{pct(r.laneSavingsPct)}</span></div>
              ))}
              <div className="text-xs text-slate-500 mt-3">Bottom 3</div>
              {laneRows.slice().sort((a, b) => a.laneSavingsPct - b.laneSavingsPct).slice(0, 3).map((r) => (
                <div key={`bot-${r.lane.id}`} className="text-sm">{r.lane.laneName}: <span className="font-semibold text-orange-700">{pct(r.laneSavingsPct)}</span></div>
              ))}
              <div className="text-xs text-slate-500 mt-3">Analysis: routes with lower bidder depth show weaker savings.</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dynamics' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-sm font-semibold mb-2">Vendor Participation Matrix</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 text-left">Vendor</th>
                    {lanes.map((lane, idx) => <th key={lane.id} className="px-2 py-2 text-center">L{idx + 1}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {vendorRows.map((vendor) => (
                    <tr key={vendor.vendorId} className="border-t border-slate-100">
                      <td className="px-2 py-2 font-medium">{vendor.name}</td>
                      {lanes.map((lane) => {
                        const laneBids = auctionEngine.getBidsByLane(lane.id);
                        const placed = laneBids.some((b) => b.vendorId === vendor.vendorId);
                        const win = awards.find((a) => a.auctionLaneId === lane.id)?.vendorId === vendor.vendorId;
                        const rank = auctionEngine.getVendorRank(lane.id, vendor.vendorId);
                        const text = win ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : placed ? '✓' : '-';
                        return <td key={`${vendor.vendorId}-${lane.id}`} className="px-2 py-2 text-center">{text}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-sm font-semibold mb-2">Bid Distribution (per lane)</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={laneRows.map((r) => {
                    const amounts = r.bids.map((b) => b.bidAmount).sort((a, b) => a - b);
                    const min = amounts[0] || 0;
                    const max = amounts[amounts.length - 1] || 0;
                    const median = amounts.length > 0 ? amounts[Math.floor(amounts.length / 2)] : 0;
                    return { lane: `L${r.seq}`, min, max, median, winner: r.award?.price || 0 };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="lane" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="max" fill="#cbd5e1" />
                    <Bar dataKey="median" fill="#60a5fa" />
                    <Bar dataKey="min" fill="#1d4ed8" />
                    <Line type="monotone" dataKey="winner" stroke="#f59e0b" dot={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-sm font-semibold mb-2">Bidding Timeline</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="elapsedMin" type="number" name="Minute" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="amount" type="number" name="Bid" tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Bids" data={timelinePoints} fill="#2563eb" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">Vendor</th>
                  <th className="px-3 py-2 text-left">Lanes Bid</th>
                  <th className="px-3 py-2 text-left">Lanes Won</th>
                  <th className="px-3 py-2 text-left">Total Bids</th>
                  <th className="px-3 py-2 text-left">Avg Bid</th>
                  <th className="px-3 py-2 text-left">Avg Discount</th>
                  <th className="px-3 py-2 text-left">Strategy</th>
                  <th className="px-3 py-2 text-left">Activity</th>
                  <th className="px-3 py-2 text-left">Winner Status</th>
                </tr>
              </thead>
              <tbody>
                {vendorRows.map((v) => (
                  <tr key={v.vendorId} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium">{v.name}</td>
                    <td className="px-3 py-2">{v.lanesBid} of {lanes.length}</td>
                    <td className="px-3 py-2">{v.lanesWon} ({pct(v.winRate)})</td>
                    <td className="px-3 py-2">{v.totalBids}</td>
                    <td className="px-3 py-2">{formatINR(v.avgBidAmount)}</td>
                    <td className="px-3 py-2">{pct(v.avgDiscount)}</td>
                    <td className="px-3 py-2">{v.strategy}</td>
                    <td className="px-3 py-2">{v.activityLevel}</td>
                    <td className="px-3 py-2">Won {v.lanesWon} lane(s) • {formatCompactINR(v.winsValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-sm font-semibold mb-2">Winner Distribution</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vendorRows.map((v) => ({ name: v.name, value: v.lanesWon })).filter((x) => x.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      fill="#2563eb"
                      label
                    >
                      {vendorRows.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={['#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#0ea5e9', '#ef4444'][idx % 6]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm space-y-2">
              <div className="font-semibold">Non-Participants Analysis</div>
              <div className="text-slate-600">Invited vendors who did not participate: {Math.max(0, invitedVendors - participants)}</div>
              <ul className="text-xs text-slate-500 list-disc pl-4">
                <li>Capacity constraints</li>
                <li>Route not aligned with fleet strength</li>
                <li>Commercial terms mismatch</li>
              </ul>
              <div className="inline-flex gap-2">
                <button className="px-2 py-1 rounded border border-slate-300 text-xs">Send feedback request</button>
                <button className="px-2 py-1 rounded border border-slate-300 text-xs">Adjust invitation list</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold">Auction Timeline (events and activity)</div>
              <div className="inline-flex gap-2">
                <button className="px-2 py-1 text-xs rounded border border-slate-300 inline-flex items-center gap-1"><Play size={12} />Replay Auction</button>
                <button className="px-2 py-1 text-xs rounded border border-slate-300">Export CSV</button>
              </div>
            </div>
            <div className="h-72 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelinePoints.map((p, idx) => ({ idx, minute: p.elapsedMin, amount: p.amount }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="minute" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="amount" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke="#2563eb" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold text-sm">Event Log</div>
              <div className="flex gap-2 text-xs">
                <select value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)} className="border border-slate-300 rounded px-2 py-1">
                  <option value="ALL">All</option>
                  {Array.from(new Set(eventLog.map((e) => e.eventType))).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input value={eventSearch} onChange={(e) => setEventSearch(e.target.value)} placeholder="Search events" className="border border-slate-300 rounded px-2 py-1" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 text-left">Timestamp</th>
                    <th className="px-2 py-2 text-left">Event</th>
                    <th className="px-2 py-2 text-left">Lane</th>
                    <th className="px-2 py-2 text-left">Vendor/System</th>
                    <th className="px-2 py-2 text-left">Description</th>
                    <th className="px-2 py-2 text-left">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((e) => {
                    const lane = e.entityType === 'LANE' ? auctionEngine.getLane(e.entityId) : undefined;
                    const impact = e.eventType.includes('EXTENDED') ? 'Triggered extension' : e.eventType.includes('BID') ? 'New leader or position shift' : 'No major impact';
                    return (
                      <tr key={e.id} className="border-t border-slate-100">
                        <td className="px-2 py-2">{new Date(e.createdAt).toLocaleTimeString()}</td>
                        <td className="px-2 py-2">{e.eventType}</td>
                        <td className="px-2 py-2">{lane?.laneName || '-'}</td>
                        <td className="px-2 py-2">{e.triggeredBy}</td>
                        <td className="px-2 py-2">{JSON.stringify(e.payload).slice(0, 90)}</td>
                        <td className="px-2 py-2">{impact}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-600">
              <div>Uptime: 99.8%</div>
              <div>Response time: 1.2s avg</div>
              <div>Peak load: {participants} concurrent bidders</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'financials' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <MetricCard label="Total Starting Value" value={formatINR(startValue)} />
            <MetricCard label="Total Final Value" value={formatINR(finalValue)} />
            <MetricCard label="Total Savings" value={`${formatINR(savings)} (${pct(savingsPct)})`} positive />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-sm font-semibold mb-2">Cost per Lane Analysis</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Lane</th>
                    <th className="px-3 py-2 text-left">Budget</th>
                    <th className="px-3 py-2 text-left">Starting</th>
                    <th className="px-3 py-2 text-left">Final</th>
                    <th className="px-3 py-2 text-left">Savings vs Budget</th>
                    <th className="px-3 py-2 text-left">Savings vs Start</th>
                    <th className="px-3 py-2 text-left">Winner Margin</th>
                    <th className="px-3 py-2 text-left">Annualized Value</th>
                  </tr>
                </thead>
                <tbody>
                  {laneRows.map((r) => {
                    const budget = r.lane.basePrice * 0.96;
                    const final = r.award?.price || r.lane.basePrice;
                    const saveBudget = budget - final;
                    return (
                      <tr key={r.lane.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{r.lane.laneName}</td>
                        <td className="px-3 py-2">{formatINR(budget)}</td>
                        <td className="px-3 py-2">{formatINR(r.lane.basePrice)}</td>
                        <td className="px-3 py-2">{formatINR(final)}</td>
                        <td className="px-3 py-2">{formatINR(saveBudget)} ({pct((saveBudget / budget) * 100)})</td>
                        <td className="px-3 py-2">{formatINR(r.laneSavings)} ({pct(r.laneSavingsPct)})</td>
                        <td className="px-3 py-2">{formatINR(r.margin)}</td>
                        <td className="px-3 py-2">{formatINR(final * 20)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-sm font-semibold mb-2">Budget vs Starting vs Final</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={laneRows.map((r) => ({ lane: `L${r.seq}`, budget: r.lane.basePrice * 0.96, starting: r.lane.basePrice, final: r.award?.price || r.lane.basePrice }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="lane" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="budget" stackId="a" fill="#2563eb" />
                    <Bar dataKey="starting" stackId="b" fill="#f59e0b" />
                    <Bar dataKey="final" stackId="c" fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm space-y-2">
              <div className="font-semibold">ROI Calculation</div>
              <div>Platform Cost: {formatINR(5000)}</div>
              <div>Time Investment: 10 hours</div>
              <div>Savings Achieved: {formatINR(savings)}</div>
              <div className="font-semibold text-green-700">ROI: {((savings / 5000) * 100).toFixed(0)}%</div>
              <div>Cost per Lane: {formatINR(5000 / Math.max(1, lanes.length))}</div>
              <div>Savings per Lane: {formatINR(savings / Math.max(1, lanes.length))}</div>
              <div className="text-xs text-slate-500">Payment term sensitivity: Net 15 &gt; Net 30 &gt; Net 45 in discount outcome (simulated benchmark).</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm space-y-2">
            <div className="font-semibold text-slate-900">🎯 Key Findings</div>
            <div>1. Savings of {pct(savingsPct)} {savingsPct >= 18 ? 'exceeded' : 'missed'} target of 18% by {pct(Math.abs(savingsPct - 18))}.</div>
            <div>2. Participation at {pct((participants / invitedVendors) * 100)} vs benchmark 75%.</div>
            <div>3. Most competitive lane: {laneRows.slice().sort((a, b) => b.competition - a.competition)[0]?.lane.laneName || '-'}.</div>
            <div>4. Underperforming lane: {laneRows.slice().sort((a, b) => a.laneSavingsPct - b.laneSavingsPct)[0]?.lane.laneName || '-'}.</div>
            <div>5. Winner acceptance rate: {pct(winnerAcceptancePct)}.</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm space-y-2">
            <div className="font-semibold text-slate-900">💡 Recommendations</div>
            <div>1. Increase invitation pool by 3-5 vendors for sparse lanes.</div>
            <div>2. Recalibrate starting prices for low-savings lanes.</div>
            <div>3. Schedule high-value auctions during peak activity window (2:00-3:00 PM).</div>
            <div>4. Prioritize top-competitive vendors in targeted invites.</div>
            <div>5. Bundle similar lanes to improve bid density.</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm space-y-2">
            <div className="font-semibold text-slate-900">⚠️ Risk Alerts</div>
            <div>1. Non-participants: {Math.max(0, invitedVendors - participants)} vendor(s); needs follow-up.</div>
            <div>2. Declined/modified awards: {awards.filter((a) => a.status === 'DECLINED' || a.status === 'MODIFICATION_REQUESTED').length} lane(s).</div>
            <div>3. Low competition lanes: {laneRows.filter((r) => r.competition < 40).length}.</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="font-semibold text-sm mb-2">Action Items</div>
            <div className="space-y-2 text-sm">
              <ActionItem text={`Follow up with ${Math.max(0, invitedVendors - participants)} non-participating vendors`} owner="Procurement Manager" />
              <ActionItem text="Analyze weak lane pricing strategy" owner="Pricing Analyst" />
              <ActionItem text="Send participant acknowledgments" owner="System (Auto)" />
              <ActionItem text="Plan next cycle with optimized slot" owner="Auction Admin" />
              <ActionItem text="Review declined award cases" owner="Contracts Manager" />
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-slate-500 flex items-center gap-3">
        <button onClick={exportData} className="text-blue-700 hover:underline inline-flex items-center gap-1"><Download size={12} />Export this tab data</button>
        <button className="text-blue-700 hover:underline inline-flex items-center gap-1"><Share2 size={12} />Generate 7-day share link</button>
      </div>
    </div>
  );
}

function MetricCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-lg font-semibold mt-1 ${positive ? 'text-green-700' : 'text-slate-900'}`}>{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded p-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function ActionItem({ text, owner }: { text: string; owner: string }) {
  return (
    <label className="flex items-center justify-between gap-2 border border-slate-200 rounded p-2">
      <span className="inline-flex items-center gap-2">
        <input type="checkbox" className="rounded" />
        {text}
      </span>
      <span className="text-xs text-slate-500">{owner}</span>
    </label>
  );
}
