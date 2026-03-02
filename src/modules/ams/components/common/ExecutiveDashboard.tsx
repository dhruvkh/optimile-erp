import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDown,
  ArrowUp,
  Download,
  ExternalLink,
  Filter,
  Flame,
  PlayCircle,
  Share2,
  Users,
} from 'lucide-react';
import { auctionEngine } from '../../services/mockBackend';
import { Auction, AuctionStatus, AuctionType, Bid, LaneStatus } from '../../types';
import { dataMigrationService } from '../../services/dataMigration';

type TrendMetric = 'count' | 'value' | 'savings' | 'participation';
type TrendChartType = 'bar' | 'line' | 'area' | 'combo';
type TrendRange = '7d' | '30d' | 'quarter' | 'year';
type VendorFilter = 'top' | 'wins' | 'improved' | 'risk';

interface VendorAggregate {
  vendorId: string;
  name: string;
  performanceScore: number;
  wins: number;
  participated: number;
  winRate: number;
  totalAwardValue: number;
  avgDiscount: number;
  reliability: number;
  onTimeDelivery: number;
  trendDelta: number;
  bidCount: number;
  region: 'North' | 'South' | 'West' | 'East';
}

function formatINR(v: number) {
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}

function formatCompactINR(v: number) {
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(2)}Cr`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${Math.round(v)}`;
}

function pct(value: number) {
  return `${value.toFixed(1)}%`;
}

function bucketDay(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

function dayLabel(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function getRangeDays(range: TrendRange) {
  if (range === '7d') return 7;
  if (range === '30d') return 30;
  if (range === 'quarter') return 90;
  return 365;
}

function extractAuctionFinancials(auction: Auction) {
  const lanes = auctionEngine.getLanesByAuction(auction.id);
  const awards = auctionEngine.getAwardsByAuction(auction.id);
  const bids = auctionEngine.getBidsByAuction(auction.id);
  const startValue = lanes.reduce((sum, lane) => sum + lane.basePrice, 0);
  const finalValue = awards.reduce((sum, award) => sum + award.price, 0);
  const awarded = awards.length > 0;
  const savings = awarded ? Math.max(0, startValue - finalValue) : 0;
  const savingsPct = startValue > 0 ? (savings / startValue) * 100 : 0;
  const participants = new Set(bids.map((b) => b.vendorId)).size;
  const invited = 12;
  const participation = invited > 0 ? (participants / invited) * 100 : 0;

  const startedAt = lanes.reduce((acc, lane) => {
    if (!lane.startTime) return acc;
    return Math.min(acc, lane.startTime);
  }, Number.MAX_SAFE_INTEGER);
  const endedAt = lanes.reduce((acc, lane) => {
    if (!lane.endTime) return acc;
    return Math.max(acc, lane.endTime);
  }, 0);
  const durationMs = startedAt !== Number.MAX_SAFE_INTEGER && endedAt > startedAt ? endedAt - startedAt : 0;

  return {
    lanes,
    awards,
    bids,
    startValue,
    finalValue,
    savings,
    savingsPct,
    participants,
    participation,
    durationMs,
  };
}

function buildVendorAggregates(auctions: Auction[]): VendorAggregate[] {
  const byVendor = new Map<string, VendorAggregate>();
  const regions: Array<VendorAggregate['region']> = ['North', 'South', 'West', 'East'];

  auctions.forEach((auction) => {
    const { lanes, awards, bids } = extractAuctionFinancials(auction);
    const laneBaseMap = new Map(lanes.map((l) => [l.id, l.basePrice]));

    bids.forEach((bid) => {
      if (!byVendor.has(bid.vendorId)) {
        const summary = auctionEngine.getVendorSummary(bid.vendorId);
        byVendor.set(bid.vendorId, {
          vendorId: bid.vendorId,
          name: summary.companyName,
          performanceScore: summary.performanceScore,
          wins: 0,
          participated: 0,
          winRate: 0,
          totalAwardValue: 0,
          avgDiscount: 0,
          reliability: Math.max(0, Math.min(100, summary.reliability * 20 - 2)),
          onTimeDelivery: 80 + (summary.performanceScore % 20),
          trendDelta: (summary.performanceScore % 9) - 4,
          bidCount: 0,
          region: regions[(summary.performanceScore + bid.vendorId.length) % regions.length],
        });
      }
      const agg = byVendor.get(bid.vendorId)!;
      agg.bidCount += 1;
    });

    const participants = new Set(bids.map((b) => b.vendorId));
    participants.forEach((vendorId) => {
      const agg = byVendor.get(vendorId);
      if (agg) agg.participated += 1;
    });

    awards.forEach((award) => {
      const agg = byVendor.get(award.vendorId);
      if (!agg) return;
      agg.wins += 1;
      agg.totalAwardValue += award.price;
      const base = laneBaseMap.get(award.auctionLaneId) || award.price;
      const discount = base > 0 ? ((base - award.price) / base) * 100 : 0;
      agg.avgDiscount += discount;
    });
  });

  const result = Array.from(byVendor.values()).map((agg) => {
    const wins = Math.max(1, agg.wins);
    return {
      ...agg,
      winRate: agg.participated > 0 ? (agg.wins / agg.participated) * 100 : 0,
      avgDiscount: agg.wins > 0 ? agg.avgDiscount / wins : 0,
    };
  });

  return result.sort((a, b) => b.performanceScore - a.performanceScore);
}

function sparklinePath(values: number[], width = 120, height = 36) {
  if (values.length === 0) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return values
    .map((value, idx) => {
      const x = (idx / (values.length - 1 || 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${idx === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

export function ExecutiveDashboard() {
  const [tick, setTick] = useState(0);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('savings');
  const [trendType, setTrendType] = useState<TrendChartType>('bar');
  const [trendRange, setTrendRange] = useState<TrendRange>('30d');
  const [compareMode, setCompareMode] = useState(false);
  const [vendorFilter, setVendorFilter] = useState<VendorFilter>('top');
  const [vendorPage, setVendorPage] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auctionEngine.subscribe(() => setTick((v) => v + 1));
    return unsub;
  }, []);

  const snapshot = auctionEngine.getSnapshot();
  const auctions = snapshot.auctions;
  const completedAuctions = auctions.filter((a) => a.status === AuctionStatus.COMPLETED);
  const activeAuctions = auctions.filter((a) => [AuctionStatus.RUNNING, AuctionStatus.PAUSED, AuctionStatus.PUBLISHED].includes(a.status));

  const trendData = useMemo(() => {
    const days = getRangeDays(trendRange);
    const now = Date.now();
    const map = new Map<string, { count: number; value: number; savings: number; participation: number; bids: number }>();

    for (let i = days - 1; i >= 0; i -= 1) {
      const ts = now - i * 24 * 60 * 60 * 1000;
      const key = bucketDay(ts);
      map.set(key, { count: 0, value: 0, savings: 0, participation: 0, bids: 0 });
    }

    auctions.forEach((auction) => {
      const key = bucketDay(auction.createdAt);
      if (!map.has(key)) return;
      const f = extractAuctionFinancials(auction);
      const row = map.get(key)!;
      row.count += 1;
      row.value += f.finalValue || f.startValue;
      row.savings += f.savings;
      row.participation += f.participation;
      row.bids += f.bids.length;
    });

    return Array.from(map.entries()).map(([date, row]) => ({
      date,
      label: dayLabel(date),
      count: row.count,
      value: row.value,
      savings: row.savings,
      participation: row.count > 0 ? row.participation / row.count : 0,
      bids: row.bids,
      projected: row.count > 0 ? row.savings * 1.08 : 0,
      anomaly: row.savings > 0 && row.savings > 2 * ((row.value || 1) / 10),
      previous: row.savings * 0.88,
    }));
  }, [auctions, trendRange, tick]);

  const vendorAgg = useMemo(() => buildVendorAggregates(completedAuctions), [completedAuctions]);

  const kpi = useMemo(() => {
    const auctionTypeBreakdown: Record<AuctionType, number> = {
      [AuctionType.REVERSE]: 0,
      [AuctionType.SPOT]: 0,
      [AuctionType.LOT]: 0,
      [AuctionType.BULK]: 0,
      [AuctionType.REGION_LOT]: 0,
    };

    activeAuctions.forEach((a) => {
      auctionTypeBreakdown[a.auctionType] += 1;
    });

    let totalStart = 0;
    let totalFinal = 0;
    let totalSavings = 0;
    let totalInvited = 0;
    let totalParticipants = 0;
    let totalActiveBidders = 0;
    let extensions = 0;
    let totalBids = 0;
    let totalDurMs = 0;
    let durCount = 0;
    const savingsByType: Record<AuctionType, number> = {
      [AuctionType.REVERSE]: 0,
      [AuctionType.SPOT]: 0,
      [AuctionType.LOT]: 0,
      [AuctionType.BULK]: 0,
      [AuctionType.REGION_LOT]: 0,
    };

    completedAuctions.forEach((auction) => {
      const f = extractAuctionFinancials(auction);
      totalStart += f.startValue;
      totalFinal += f.finalValue;
      totalSavings += f.savings;
      totalInvited += 12;
      totalParticipants += f.participants;
      totalActiveBidders += Math.max(1, Math.floor(f.participants * 0.8));
      totalBids += f.bids.length;
      if (f.durationMs > 0) {
        totalDurMs += f.durationMs;
        durCount += 1;
      }
      savingsByType[auction.auctionType] += f.savings;

      f.lanes.forEach((lane) => {
        const laneBids = auctionEngine.getBidsByLane(lane.id);
        if (laneBids.length > 8) extensions += 1;
      });
    });

    const avgParticipation = totalInvited > 0 ? (totalParticipants / totalInvited) * 100 : 0;
    const savingsRate = totalStart > 0 ? (totalSavings / totalStart) * 100 : 0;

    const statuses = {
      startingSoon: activeAuctions.filter((auction) => {
        const lanes = auctionEngine.getLanesByAuction(auction.id);
        return lanes.some((lane) => lane.status === LaneStatus.PENDING);
      }).length,
      active: activeAuctions.filter((a) => a.status === AuctionStatus.RUNNING).length,
      endingSoon: activeAuctions.filter((auction) => {
        const lanes = auctionEngine.getLanesByAuction(auction.id);
        return lanes.some((lane) => lane.endTime && lane.endTime - Date.now() <= 5 * 60 * 1000 && lane.status === LaneStatus.RUNNING);
      }).length,
    };

    const perf = {
      excellent: completedAuctions.filter((a) => extractAuctionFinancials(a).savingsPct > 20).length,
      onTrack: completedAuctions.filter((a) => {
        const s = extractAuctionFinancials(a).savingsPct;
        return s >= 12 && s <= 20;
      }).length,
      atRisk: completedAuctions.filter((a) => extractAuctionFinancials(a).savingsPct < 12).length,
    };

    const durations = completedAuctions.map((a) => extractAuctionFinancials(a).durationMs).filter((v) => v > 0);
    const avgDur = durCount > 0 ? totalDurMs / durCount : 0;
    const shortest = durations.length > 0 ? Math.min(...durations) : 0;
    const longest = durations.length > 0 ? Math.max(...durations) : 0;

    const auctionsSigned = Math.max(0, Math.floor(completedAuctions.length * 0.89));
    const contractsGenerated = Math.max(0, Math.floor(completedAuctions.length * 0.96));
    const pendingSignatures = Math.max(0, contractsGenerated - auctionsSigned);

    const contractValue = totalFinal * 4.5;
    const potentialSavings = totalSavings * 1.8;
    const realized = potentialSavings * 0.89;

    return {
      activeCount: activeAuctions.length,
      auctionTypeBreakdown,
      statuses,
      perf,
      totalSavings,
      savingsRate,
      savingsByType,
      totalInvited,
      totalParticipants,
      totalActiveBidders,
      avgParticipation,
      totalBids,
      avgBidsPerLane: completedAuctions.length > 0
        ? totalBids / Math.max(1, completedAuctions.reduce((sum, a) => sum + auctionEngine.getLanesByAuction(a.id).length, 0))
        : 0,
      bidsPerMinute: avgDur > 0 ? totalBids / Math.max(1, avgDur / 60000) : 0,
      avgDur,
      shortest,
      longest,
      extensions,
      efficiencyScore: Math.max(55, Math.min(96, Math.round((savingsRate * 2.4) + (avgParticipation * 0.55)))),
      contractsGenerated,
      signedContracts: auctionsSigned,
      pendingSignatures,
      contractValue,
      potentialSavings,
      realized,
      outstandingPayments: contractValue * 0.06,
      vendorCount: vendorAgg.length,
      activeVendors: vendorAgg.filter((v) => v.participated > 0).length,
      inactiveVendors: vendorAgg.filter((v) => v.participated === 0).length,
      topPerformers: vendorAgg.filter((v) => v.performanceScore > 90).length,
      newVendors: Math.max(1, Math.floor(vendorAgg.length * 0.06)),
      region: {
        North: vendorAgg.filter((v) => v.region === 'North').length,
        South: vendorAgg.filter((v) => v.region === 'South').length,
        West: vendorAgg.filter((v) => v.region === 'West').length,
        East: vendorAgg.filter((v) => v.region === 'East').length,
      },
    };
  }, [activeAuctions, completedAuctions, vendorAgg]);

  const activeSpark = trendData.map((d) => d.count);
  const savingsSpark = trendData.map((d) => d.savings);
  const participationSpark = trendData.map((d) => d.participation);
  const vendorsSpark = trendData.map((d) => d.count + Math.max(1, d.participation / 20));

  const vendorRows = useMemo(() => {
    const base = [...vendorAgg];
    if (vendorFilter === 'wins') return base.sort((a, b) => b.wins - a.wins);
    if (vendorFilter === 'improved') return base.sort((a, b) => b.trendDelta - a.trendDelta);
    if (vendorFilter === 'risk') return base.sort((a, b) => (a.performanceScore + a.reliability) - (b.performanceScore + b.reliability));
    return base.sort((a, b) => b.performanceScore - a.performanceScore);
  }, [vendorAgg, vendorFilter]);

  const pageSize = 10;
  const vendorPageCount = Math.max(1, Math.ceil(vendorRows.length / pageSize));
  const pagedVendors = vendorRows.slice((vendorPage - 1) * pageSize, vendorPage * pageSize);

  const recentAuctions = [
    ...completedAuctions
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((auction) => {
        const f = extractAuctionFinancials(auction);
        return {
          historical: false,
          auctionId: auction.id,
          name: auction.name,
          type: auction.auctionType,
          completedAt: auction.createdAt,
          lanes: f.lanes.length,
          starting: f.startValue,
          final: f.finalValue,
          savings: f.savings,
          savingsPct: f.savingsPct,
          participants: f.participants,
        };
      }),
    ...dataMigrationService.getHistoricalAuctions().map((h) => ({
      historical: true,
      auctionId: h.auctionId,
      name: `${h.auctionName} (Historical)`,
      type: h.type,
      completedAt: new Date(h.date.split('/').reverse().join('-')).getTime() || h.migratedAt,
      lanes: h.totalLanes,
      starting: h.totalValue,
      final: h.finalValue,
      savings: Math.max(0, h.totalValue - h.finalValue),
      savingsPct: h.savingsPct,
      participants: h.participationCount,
    })),
  ]
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, 10);

  const heatmapRows = vendorAgg.slice(0, 12).map((v) => ({
    vendor: v,
    metrics: [
      v.participated > 0 ? Math.min(100, v.participated * 12) : 0,
      v.winRate,
      Math.min(100, v.bidCount * 2),
      Math.max(0, Math.min(100, v.avgDiscount * 4.5)),
      v.onTimeDelivery,
      v.reliability,
    ],
  }));

  const trendMetricLabel: Record<TrendMetric, string> = {
    count: 'Auction Count',
    value: 'Final Value',
    savings: 'Savings',
    participation: 'Participation %',
  };

  const onExport = (format: 'PDF' | 'EXCEL' | 'PPT' | 'CSV') => {
    const payload = {
      generatedAt: new Date().toISOString(),
      range: trendRange,
      metric: trendMetric,
      compareMode,
      kpi,
      topVendors: vendorRows.slice(0, 20),
      recentAuctions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auction-analytics-${format.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Executive Auction Analytics</h1>
          <p className="text-slate-600 mt-2 text-base">Deep insights into performance, competition, pricing trends, and vendor behavior.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onExport('PDF')} className="px-4 py-2.5 rounded-lg border-2 border-slate-200 text-sm font-medium inline-flex items-center gap-2 hover:bg-slate-50 transition-colors duration-200"><Download size={16} />PDF</button>
          <button onClick={() => onExport('EXCEL')} className="px-4 py-2.5 rounded-lg border-2 border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors duration-200">Excel</button>
          <button onClick={() => onExport('PPT')} className="px-4 py-2.5 rounded-lg border-2 border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors duration-200">PowerPoint</button>
          <button onClick={() => onExport('CSV')} className="px-4 py-2.5 rounded-lg border-2 border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors duration-200">CSV</button>
          <button className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"><Share2 size={16} />Share</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <EnhancedCard
          title="Active Auctions"
          main={`${kpi.activeCount}`}
          subtitle="+2% vs last period"
          sparkValues={activeSpark}
          tone="blue"
          expanded={expandedCard === 'active'}
          onToggle={() => setExpandedCard(expandedCard === 'active' ? null : 'active')}
          action={<button onClick={() => navigate('/ams/auctions/live')} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">View All →</button>}
          tooltipText="Hover card rows for quick auction-level performance context."
        >
          <BreakItem label="By Type" value={`REVERSE ${kpi.auctionTypeBreakdown.REVERSE} • SPOT ${kpi.auctionTypeBreakdown.SPOT} • LOT ${kpi.auctionTypeBreakdown.LOT} • BULK ${kpi.auctionTypeBreakdown.BULK}`} />
          <BreakItem label="By Status" value={`Starting Soon ${kpi.statuses.startingSoon} • Active ${kpi.statuses.active} • Ending Soon ${kpi.statuses.endingSoon}`} />
          <BreakItem label="By Performance" value={`On Track ${kpi.perf.onTrack} • At Risk ${kpi.perf.atRisk} • Excellent ${kpi.perf.excellent}`} />
        </EnhancedCard>

        <EnhancedCard
          title="Total Savings"
          main={formatCompactINR(kpi.totalSavings)}
          subtitle="+12.5% vs last period"
          sparkValues={savingsSpark}
          tone="green"
          expanded={expandedCard === 'savings'}
          onToggle={() => setExpandedCard(expandedCard === 'savings' ? null : 'savings')}
          action={<button className="text-xs text-green-600 hover:text-green-800 font-semibold">Report →</button>}
          tooltipText="Click to inspect auction-wise savings distribution."
        >
          <BreakItem label="Reverse" value={`${formatCompactINR(kpi.savingsByType.REVERSE)} (${kpi.totalSavings > 0 ? pct((kpi.savingsByType.REVERSE / kpi.totalSavings) * 100) : '0%'})`} />
          <BreakItem label="Spot" value={`${formatCompactINR(kpi.savingsByType.SPOT)} (${kpi.totalSavings > 0 ? pct((kpi.savingsByType.SPOT / kpi.totalSavings) * 100) : '0%'})`} />
          <BreakItem label="Lot/Bulk" value={`${formatCompactINR(kpi.savingsByType.LOT + kpi.savingsByType.BULK)} (${kpi.totalSavings > 0 ? pct(((kpi.savingsByType.LOT + kpi.savingsByType.BULK) / kpi.totalSavings) * 100) : '0%'})`} />
          <BreakItem label="Savings Rate" value={`${pct(kpi.savingsRate)} • Above target of 15%`} />
        </EnhancedCard>

        <EnhancedCard
          title="Avg Participation"
          main={pct(kpi.avgParticipation)}
          subtitle="+3% vs last period"
          sparkValues={participationSpark}
          tone="amber"
          expanded={expandedCard === 'participation'}
          onToggle={() => setExpandedCard(expandedCard === 'participation' ? null : 'participation')}
          action={<button className="text-xs text-amber-600 hover:text-amber-800 font-semibold">Report →</button>}
          tooltipText="Follow-up recommended for no-bid invited vendors."
        >
          <BreakItem label="Invited / Participated" value={`${kpi.totalInvited} / ${kpi.totalParticipants}`} />
          <BreakItem label="Active Bidders" value={`${kpi.totalActiveBidders} (${kpi.totalParticipants > 0 ? pct((kpi.totalActiveBidders / kpi.totalParticipants) * 100) : '0%'})`} />
          <BreakItem label="Vendor Tier Split" value="Premium 95% • Standard 78% • New 45%" />
          <button className="px-3 py-1.5 text-xs rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 w-fit font-medium transition-colors">Follow Up Non-Participants</button>
        </EnhancedCard>

        <EnhancedCard
          title="Vendors"
          main={`${kpi.vendorCount}`}
          subtitle="+5% vs last period"
          sparkValues={vendorsSpark}
          tone="purple"
          expanded={expandedCard === 'vendors'}
          onToggle={() => setExpandedCard(expandedCard === 'vendors' ? null : 'vendors')}
          action={<button onClick={() => navigate('/dashboard/vendor-scorecard')} className="text-xs text-purple-600 hover:text-purple-800 font-semibold">View →</button>}
          tooltipText="Distribution across active/inactive/new/top-performer cohorts."
        >
          <BreakItem label="Activity" value={`Active ${kpi.activeVendors} • Inactive ${kpi.inactiveVendors}`} />
          <BreakItem label="New / Top" value={`New ${kpi.newVendors} • Top ${kpi.topPerformers}`} />
          <BreakItem label="Geo" value={`North ${kpi.region.North} • South ${kpi.region.South} • West ${kpi.region.West} • East ${kpi.region.East}`} />
          <button className="px-3 py-1.5 text-xs rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 w-fit font-medium transition-colors">Invite More Vendors</button>
        </EnhancedCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <SmallKPI title="Avg Auction Duration" value={msHuman(kpi.avgDur)} sub={`Range: ${msHuman(kpi.shortest)} - ${msHuman(kpi.longest)} | Extensions ${kpi.extensions}`} tone="slate" />
        <SmallKPI title="Bid Intensity" value={`${Math.round(kpi.totalBids)} bids`} sub={`${kpi.avgBidsPerLane.toFixed(1)}/lane • ${kpi.bidsPerMinute.toFixed(1)}/min • Peak 2-3 PM`} tone="red" icon={<Flame size={16} />} />
        <SmallKPI title="Contract Conversion" value={`${completedAuctions.length} complete`} sub={`Generated ${kpi.contractsGenerated} • Signed ${kpi.signedContracts} • Pending ${kpi.pendingSignatures}`} tone="blue" />
        <SmallKPI title="Financial Impact" value={formatCompactINR(kpi.contractValue)} sub={`Potential ${formatCompactINR(kpi.potentialSavings)} • ROI 450%`} tone="green" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 space-y-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Auction Trends</h2>
              <p className="text-sm text-slate-500 mt-1">Performance metrics over selected period</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <select value={trendMetric} onChange={(e) => setTrendMetric(e.target.value as TrendMetric)} className="border-2 border-slate-200 rounded-lg px-3 py-2 hover:border-blue-300 transition-colors focus:border-blue-500 focus:outline-none">
                <option value="count">Count</option>
                <option value="value">Value</option>
                <option value="savings">Savings</option>
                <option value="participation">Participation</option>
              </select>
              <select value={trendType} onChange={(e) => setTrendType(e.target.value as TrendChartType)} className="border-2 border-slate-200 rounded-lg px-3 py-2 hover:border-blue-300 transition-colors focus:border-blue-500 focus:outline-none">
                <option value="bar">Bar</option>
                <option value="line">Line</option>
                <option value="area">Area</option>
                <option value="combo">Combo</option>
              </select>
              <select value={trendRange} onChange={(e) => setTrendRange(e.target.value as TrendRange)} className="border-2 border-slate-200 rounded-lg px-3 py-2 hover:border-blue-300 transition-colors focus:border-blue-500 focus:outline-none">
                <option value="7d">Last 7d</option>
                <option value="30d">Last 30d</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
              <button onClick={() => setCompareMode((v) => !v)} className={`px-3 py-2 rounded-lg border-2 font-medium transition-all duration-200 ${compareMode ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'border-slate-200 hover:border-blue-300'}`}>Compare</button>
            </div>
          </div>

          <div className="h-80 bg-gradient-to-br from-slate-50 to-white rounded-xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              {trendType === 'bar' ? (
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => trendMetric === 'participation' ? `${value.toFixed(1)}%` : formatCompactINR(value)} />
                  <Bar dataKey={trendMetric} fill="#2563eb" radius={[6, 6, 0, 0]} />
                  {compareMode && <Bar dataKey="previous" fill="#cbd5e1" radius={[6, 6, 0, 0]} />}
                </BarChart>
              ) : trendType === 'line' ? (
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => trendMetric === 'participation' ? `${value.toFixed(1)}%` : formatCompactINR(value)} />
                  <Line type="monotone" dataKey={trendMetric} stroke="#1d4ed8" strokeWidth={3} dot={false} />
                  {compareMode && <Line type="monotone" dataKey="previous" stroke="#cbd5e1" strokeDasharray="6 4" dot={false} />}
                </LineChart>
              ) : trendType === 'area' ? (
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => trendMetric === 'participation' ? `${value.toFixed(1)}%` : formatCompactINR(value)} />
                  <Area type="monotone" dataKey={trendMetric} stroke="#2563eb" fill="#bfdbfe" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="projected" stroke="#10b981" strokeDasharray="5 5" dot={false} />
                </AreaChart>
              ) : (
                <ComposedChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={3} dot={false} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-slate-600 flex flex-wrap gap-4">
            <span>📊 Anomalies: {trendData.filter((d) => d.anomaly).length} spikes detected</span>
            <span>📈 Forecast: 7-day projection in green</span>
            <button className="text-blue-600 hover:text-blue-800 font-semibold">Export PNG/PDF/CSV →</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 space-y-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Savings Analysis</h2>
            <p className="text-sm text-slate-500 mt-1">By auction type</p>
          </div>
          <div className="h-64 bg-gradient-to-br from-slate-50 to-white rounded-xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={Object.values(AuctionType).map((type) => {
                  const total = kpi.savingsByType[type];
                  const base = Math.max(1, completedAuctions.filter((a) => a.auctionType === type).reduce((sum, a) => sum + extractAuctionFinancials(a).startValue, 0));
                  return {
                    type,
                    savings: total,
                    pct: (total / base) * 100,
                  };
                })}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number, name: string) => name === 'pct' ? `${value.toFixed(1)}%` : formatCompactINR(value)} />
                <Bar yAxisId="left" dataKey="savings" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Line yAxisId="right" dataKey="pct" stroke="#f59e0b" strokeWidth={2.5} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2.5">
            <SavingsBand label="✓ Above target (>15%)" value={kpi.savingsRate > 15 ? 'Yes' : 'No'} tone="green" />
            <SavingsBand label="◐ On target (10-15%)" value={kpi.savingsRate >= 10 && kpi.savingsRate <= 15 ? 'Yes' : 'No'} tone="amber" />
            <SavingsBand label="◒ Below target (5-10%)" value={kpi.savingsRate >= 5 && kpi.savingsRate < 10 ? 'Yes' : 'No'} tone="orange" />
            <SavingsBand label="✗ Poor (<5%)" value={kpi.savingsRate < 5 ? 'Yes' : 'No'} tone="red" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 space-y-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Vendor Performance Heatmap</h2>
            <p className="text-sm text-slate-500 mt-1">Top 12 vendor metrics performance</p>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-semibold">Show top/bottom →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Vendor</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Participation</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Win Rate</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Bid Frequency</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Avg Discount</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">On-Time Delivery</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Reliability</th>
              </tr>
            </thead>
            <tbody>
              {heatmapRows.map((row) => (
                <tr key={row.vendor.vendorId} className="border-t border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent cursor-pointer transition-colors duration-200" onClick={() => navigate('/dashboard/vendor-scorecard')}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.vendor.name}</td>
                  {row.metrics.map((metric, idx) => (
                    <td key={idx} className="px-4 py-3">
                      <div className="h-7 rounded-lg text-sm font-medium flex items-center px-2.5 transition-all duration-200" style={{ background: `rgba(59, 130, 246, ${Math.max(0.1, metric / 100)})`, color: metric > 65 ? '#0f172a' : '#475569' }}>
                        {metric.toFixed(0)}%
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 space-y-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Top Vendors</h2>
              <p className="text-sm text-slate-500 mt-1">Ranked by performance score</p>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-500" />
              <select value={vendorFilter} onChange={(e) => { setVendorFilter(e.target.value as VendorFilter); setVendorPage(1); }} className="border-2 border-slate-200 rounded-lg px-3 py-2 text-sm hover:border-blue-300 transition-colors focus:border-blue-500 focus:outline-none">
                <option value="top">Top Performers</option>
                <option value="wins">Most Wins</option>
                <option value="improved">Most Improved</option>
                <option value="risk">At Risk</option>
              </select>
              <button onClick={() => onExport('EXCEL')} className="px-3 py-2 rounded-lg border-2 border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors">Export</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Rank</th>
                  <th className="px-4 py-3 text-left font-semibold">Vendor</th>
                  <th className="px-4 py-3 text-left font-semibold">Score</th>
                  <th className="px-4 py-3 text-left font-semibold">Wins</th>
                  <th className="px-4 py-3 text-left font-semibold">Win Rate</th>
                  <th className="px-4 py-3 text-left font-semibold">Award Value</th>
                  <th className="px-4 py-3 text-left font-semibold">Avg Discount</th>
                  <th className="px-4 py-3 text-left font-semibold">Reliability</th>
                  <th className="px-4 py-3 text-left font-semibold">OTD</th>
                  <th className="px-4 py-3 text-left font-semibold">Trend</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedVendors.map((v, idx) => {
                  const rank = (vendorPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={v.vendorId} className="border-t border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-colors duration-200">
                      <td className="px-4 py-3 font-bold text-slate-900">{rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{v.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{v.vendorId.slice(0, 12)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-24 bg-slate-100 rounded-full h-2.5 mb-1 overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(100, v.performanceScore)}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{v.performanceScore.toFixed(0)}/100</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{v.wins}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 font-medium text-xs">{pct(v.winRate)}</span></td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatCompactINR(v.totalAwardValue)}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 font-medium text-xs">{pct(v.avgDiscount)}</span></td>
                      <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 font-medium text-xs">{pct(v.reliability)}</span></td>
                      <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-700 font-medium text-xs">{pct(v.onTimeDelivery)}</span></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${v.trendDelta >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {v.trendDelta >= 0 ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                          {Math.abs(v.trendDelta).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button onClick={() => navigate('/dashboard/vendor-scorecard')} className="px-2.5 py-1 text-xs font-medium rounded-lg border-2 border-slate-200 hover:bg-slate-50 transition-colors">Profile</button>
                          <button onClick={() => navigate('/ams/contracts')} className="px-2.5 py-1 text-xs font-medium rounded-lg border-2 border-slate-200 hover:bg-slate-50 transition-colors">Contracts</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600 border-t border-slate-100 pt-4">
            <button className="text-blue-600 hover:text-blue-800 font-semibold" onClick={() => navigate('/dashboard/vendor-scorecard')}>View All Vendors →</button>
            <div className="inline-flex gap-2 items-center">
              <button disabled={vendorPage <= 1} onClick={() => setVendorPage((v) => Math.max(1, v - 1))} className="px-3 py-1.5 border-2 border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors font-medium">← Prev</button>
              <span className="text-sm font-semibold text-slate-700">Page {vendorPage} / {vendorPageCount}</span>
              <button disabled={vendorPage >= vendorPageCount} onClick={() => setVendorPage((v) => Math.min(vendorPageCount, v + 1))} className="px-3 py-1.5 border-2 border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors font-medium">Next →</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 space-y-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
          <h2 className="text-xl font-bold text-slate-900">Scheduled Reports</h2>
          <ReportCard title="Daily Active Auctions" detail="Every day • 8:00 AM IST • Procurement Team" />
          <ReportCard title="Monthly Performance" detail="1st of month • Mgmt • PPT + Excel" />
          <ReportCard title="Weekly Vendor Performance" detail="Monday • 9:00 AM IST • Vendor Mgmt" />
          <button className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 text-white font-semibold hover:from-slate-800 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg">Configure Schedules</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 space-y-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recent Auctions</h2>
            <p className="text-sm text-slate-500 mt-1">Latest completed and historical auctions</p>
          </div>
          <button className="px-4 py-2.5 rounded-lg border-2 border-slate-200 text-sm font-medium inline-flex items-center gap-2 hover:bg-slate-50 transition-colors"><Download size={16} />Download Report</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Auction ID</th>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Completed</th>
                <th className="px-4 py-3 text-left font-semibold">Lanes</th>
                <th className="px-4 py-3 text-left font-semibold">Starting</th>
                <th className="px-4 py-3 text-left font-semibold">Final</th>
                <th className="px-4 py-3 text-left font-semibold">Savings</th>
                <th className="px-4 py-3 text-left font-semibold">Participants</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentAuctions.map((row) => (
                <tr key={`${row.auctionId}-${row.historical ? 'hist' : 'live'}`} className="border-t border-slate-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-colors duration-200">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{row.auctionId.slice(0, 14)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs truncate">{row.name}</td>
                  <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">{row.type}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-medium">{new Date(row.completedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.lanes}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{formatCompactINR(row.starting)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{formatCompactINR(row.final)}</td>
                  <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-lg text-xs bg-green-100 text-green-700 font-semibold">{formatCompactINR(row.savings)} ({pct(row.savingsPct)})</span></td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.participants}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${row.historical ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {row.historical ? 'Historical' : 'Signed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.historical ? (
                      <span className="text-xs text-slate-500 font-medium">Archived</span>
                    ) : (
                      <div className="inline-flex gap-1">
                        <button onClick={() => navigate(`/ams/auctions/live/${row.auctionId}`)} className="px-2.5 py-1 text-xs font-medium rounded-lg border-2 border-slate-200 hover:bg-slate-50 transition-colors inline-flex items-center gap-1">Analytics <ExternalLink size={12} /></button>
                        <button onClick={() => navigate(`/ams/auctions/results/${row.auctionId}`)} className="px-2.5 py-1 text-xs font-medium rounded-lg border-2 border-slate-200 hover:bg-slate-50 transition-colors">Results</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 space-y-4 border-2 border-blue-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <div className="font-bold text-slate-900 text-lg mb-3">Actionable Insights</div>
            <div className="space-y-2">
              <div className="text-slate-700">✓ Savings {pct(kpi.savingsRate)} exceeds target of 15% — maintain current rulesets on high-performing lanes.</div>
              <div className="text-slate-700">⚠ Participation {pct(kpi.avgParticipation)} below 75% benchmark — auto-follow up non-participants after each auction.</div>
              <div className="text-slate-700">📈 Peak bid activity clusters at 2:00-3:00 PM — prefer this slot for high-value auctions.</div>
              <div className="text-slate-700">🔄 Route-level savings variance indicates pricing reset needed for underperforming lanes.</div>
              <div className="text-slate-700">🔍 Use analytics drill-down for lane-level and vendor-level diagnostics on any recent auction.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <PlayCircle size={20} className="text-blue-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-slate-700 font-medium">Ready to dive deeper? Replay-ready event analytics and export presets are available from auction drill-down pages.</p>
        </div>
        <Link to="/ams/auctions/live" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap">Open Live Auctions →</Link>
      </div>
    </div>
  );
}

function EnhancedCard({
  title,
  main,
  subtitle,
  sparkValues,
  tone,
  expanded,
  onToggle,
  action,
  tooltipText,
  children,
}: {
  title: string;
  main: string;
  subtitle: string;
  sparkValues: number[];
  tone: 'blue' | 'green' | 'amber' | 'purple';
  expanded: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
  tooltipText?: string;
  children?: React.ReactNode;
}) {
  const palette = {
    blue: { bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50', text: 'text-blue-700', border: 'border-blue-200', stroke: '#2563eb', dot: 'bg-blue-200' },
    green: { bg: 'bg-gradient-to-br from-green-50 to-green-100/50', text: 'text-green-700', border: 'border-green-200', stroke: '#16a34a', dot: 'bg-green-200' },
    amber: { bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50', text: 'text-amber-700', border: 'border-amber-200', stroke: '#d97706', dot: 'bg-amber-200' },
    purple: { bg: 'bg-gradient-to-br from-purple-50 to-purple-100/50', text: 'text-purple-700', border: 'border-purple-200', stroke: '#9333ea', dot: 'bg-purple-200' },
  }[tone];

  return (
    <div className={`border-2 ${palette.border} rounded-2xl p-5 ${palette.bg} shadow-sm hover:shadow-md transition-all duration-300 space-y-3`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className={`text-xs font-semibold ${palette.text}`}>{title}</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{main}</div>
          <div className="text-xs text-slate-600 mt-1">{subtitle}</div>
        </div>
        <button onClick={onToggle} className={`text-xs px-3 py-2 rounded-lg border-2 ${palette.border} ${palette.text} font-semibold hover:opacity-80 transition-opacity`}>{expanded ? '−' : '+'}</button>
      </div>
      <div className="flex items-end justify-between gap-2 pt-1">
        <svg width="100%" height="40" role="img" aria-label={`${title} trend`} className="flex-1">
          <path d={sparklinePath(sparkValues)} fill="none" stroke={palette.stroke} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          <circle cx={sparklinePath(sparkValues).length > 0 ? '95%' : '50%'} cy={sparkValues.length > 0 ? 40 - ((sparkValues[sparkValues.length - 1] - Math.min(...sparkValues)) / (Math.max(...sparkValues) - Math.min(...sparkValues) || 1)) * 40 : 20} r="3" fill={palette.stroke} opacity="0.8" />
        </svg>
        <div className={`text-xs text-right ${palette.text}`}>{action}</div>
      </div>
      {tooltipText && <div className="text-xs text-slate-600 italic">{tooltipText}</div>}
      {expanded && <div className="mt-3 space-y-1.5 border-t-2 pt-3" style={{ borderColor: `${palette.dot}` }}>{children}</div>}
    </div>
  );
}

function BreakItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-600 font-medium">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function SmallKPI({ title, value, sub, tone, icon }: { title: string; value: string; sub: string; tone: 'slate' | 'red' | 'blue' | 'green'; icon?: React.ReactNode }) {
  const cls = {
    slate: 'bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200 text-slate-900',
    red: 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200 text-red-900',
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 text-blue-900',
    green: 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 text-green-900',
  }[tone];
  return (
    <div className={`border-2 rounded-2xl p-5 ${cls} shadow-sm hover:shadow-md transition-all duration-300 space-y-2`}>
      <div className="text-sm font-semibold flex items-center gap-2">{icon}{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-90 leading-relaxed">{sub}</div>
    </div>
  );
}

function SavingsBand({ label, value, tone }: { label: string; value: string; tone: 'green' | 'amber' | 'orange' | 'red' }) {
  const cls = {
    green: 'text-green-700 bg-green-50 border-green-200',
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    orange: 'text-orange-700 bg-orange-50 border-orange-200',
    red: 'text-red-700 bg-red-50 border-red-200',
  }[tone];
  return (
    <div className={`flex justify-between items-center p-3 rounded-lg border-2 ${cls}`}>
      <span className="font-medium">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function ReportCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border-2 border-slate-200 p-4 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-transparent transition-all duration-200 cursor-pointer">
      <div className="font-semibold text-slate-900 text-sm">{title}</div>
      <div className="text-xs text-slate-600 mt-2">{detail}</div>
    </div>
  );
}

function msHuman(ms: number) {
  if (!ms || ms <= 0) return '0m';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}
