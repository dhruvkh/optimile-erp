import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, FileSpreadsheet, FileText, Presentation, RefreshCw, Share2 } from 'lucide-react';
import { auctionEngine } from '../../services/mockBackend';
import { Auction, AuctionStatus, AuctionType } from '../../types';

interface LaneSavingsRow {
  auctionId: string;
  auctionName: string;
  auctionType: AuctionType;
  laneId: string;
  laneName: string;
  vendorId: string;
  startingPrice: number;
  finalPrice: number;
  previousContractRate: number;
  marketBenchmarkRate: number;
  budgetRate: number;
  firstBidPrice: number;
  secondPlaceBidPrice: number;
  l1Savings: { amount: number; pct: number };
  prevSavings: { amount: number; pct: number };
  marketSavings: { amount: number; pct: number };
  budgetSavings: { amount: number; pct: number };
  firstBidSavings: { amount: number; pct: number };
  secondPlaceMargin: { amount: number; pct: number };
  attribution: { competitivePressure: number; marketTiming: number; auctionDesign: number };
  projectedSavings: number;
  realizedSavings: number;
  realizationPct: number;
  tripsCompleted: number;
  tripsPlanned: number;
  realizationStatus: 'on_track' | 'behind' | 'at_risk' | 'over_performing';
}

type ReportTemplate = 'executive' | 'detailed' | 'audit' | 'board';

function formatINR(v: number) {
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}

function formatCompactINR(v: number) {
  if (Math.abs(v) >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`;
  if (Math.abs(v) >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${Math.round(v)}`;
}

function pct(v: number) {
  return `${v.toFixed(1)}%`;
}

function safePct(base: number, value: number) {
  return base > 0 ? (value / base) * 100 : 0;
}

function deterministicFactor(seed: string, min: number, max: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const normalized = (Math.abs(hash) % 1000) / 1000;
  return min + normalized * (max - min);
}

function computeLaneRows(auctions: Auction[]): LaneSavingsRow[] {
  const rows: LaneSavingsRow[] = [];

  auctions.forEach((auction) => {
    const lanes = auctionEngine.getLanesByAuction(auction.id);
    lanes.forEach((lane) => {
      const laneBids = auctionEngine.getBidsByLane(lane.id).slice().sort((a, b) => a.bidTimestamp - b.bidTimestamp);
      if (laneBids.length === 0) return;
      const award = auctionEngine.getAward(lane.id);
      const bestByVendor = Array.from(new Set(laneBids.map((b) => b.vendorId))).map((vendorId) => ({
        vendorId,
        bestBid: laneBids.filter((b) => b.vendorId === vendorId).sort((a, b) => a.bidAmount - b.bidAmount)[0]?.bidAmount || Number.MAX_SAFE_INTEGER,
      })).sort((a, b) => a.bestBid - b.bestBid);

      const winnerVendor = award?.vendorId || bestByVendor[0]?.vendorId || laneBids[0].vendorId;
      const finalPrice = award?.price || bestByVendor[0]?.bestBid || lane.currentLowestBid || lane.basePrice;

      const winnerFirstBid = laneBids.find((b) => b.vendorId === winnerVendor)?.bidAmount || lane.basePrice;
      const secondPlaceBid = bestByVendor[1]?.bestBid || finalPrice;

      const previousContractRate = lane.basePrice * deterministicFactor(`${lane.id}-prev`, 0.9, 1.08);
      const marketRate = lane.basePrice * deterministicFactor(`${lane.id}-market`, 0.86, 1.06);
      const budgetRate = lane.basePrice * deterministicFactor(`${lane.id}-budget`, 0.84, 1.0);

      const l1Amount = lane.basePrice - finalPrice;
      const prevAmount = previousContractRate - finalPrice;
      const marketAmount = marketRate - finalPrice;
      const budgetAmount = budgetRate - finalPrice;
      const firstAmount = winnerFirstBid - finalPrice;
      const secondAmount = secondPlaceBid - finalPrice;

      const competitive = Math.max(0, l1Amount * 0.82);
      const marketTiming = Math.max(0, l1Amount * 0.13);
      const auctionDesign = Math.max(0, l1Amount * 0.05);

      const tripsPlanned = 20;
      const projected = Math.max(0, l1Amount) * tripsPlanned;
      const realizationFactor = deterministicFactor(`${lane.id}-real`, 0.52, 1.15);
      const realized = projected * realizationFactor;
      const realizationPct = projected > 0 ? (realized / projected) * 100 : 0;
      const tripsCompleted = Math.min(tripsPlanned, Math.max(0, Math.round(tripsPlanned * realizationFactor)));
      const status: LaneSavingsRow['realizationStatus'] =
        realizationPct > 100 ? 'over_performing' :
        realizationPct >= 79 ? 'on_track' :
        realizationPct >= 60 ? 'behind' :
        'at_risk';

      rows.push({
        auctionId: auction.id,
        auctionName: auction.name,
        auctionType: auction.auctionType,
        laneId: lane.id,
        laneName: lane.laneName,
        vendorId: winnerVendor,
        startingPrice: lane.basePrice,
        finalPrice,
        previousContractRate,
        marketBenchmarkRate: marketRate,
        budgetRate,
        firstBidPrice: winnerFirstBid,
        secondPlaceBidPrice: secondPlaceBid,
        l1Savings: { amount: l1Amount, pct: safePct(lane.basePrice, l1Amount) },
        prevSavings: { amount: prevAmount, pct: safePct(previousContractRate, prevAmount) },
        marketSavings: { amount: marketAmount, pct: safePct(marketRate, marketAmount) },
        budgetSavings: { amount: budgetAmount, pct: safePct(budgetRate, budgetAmount) },
        firstBidSavings: { amount: firstAmount, pct: safePct(winnerFirstBid, firstAmount) },
        secondPlaceMargin: { amount: secondAmount, pct: safePct(secondPlaceBid, secondAmount) },
        attribution: {
          competitivePressure: competitive,
          marketTiming,
          auctionDesign,
        },
        projectedSavings: projected,
        realizedSavings: realized,
        realizationPct,
        tripsCompleted,
        tripsPlanned,
        realizationStatus: status,
      });
    });
  });

  return rows;
}

function savingsClass(value: number) {
  if (value > 2) return 'text-green-700 bg-green-100';
  if (value >= -2 && value <= 2) return 'text-yellow-700 bg-yellow-100';
  return 'text-red-700 bg-red-100';
}

function heatColor(value: number) {
  if (value >= 20) return 'rgba(22,163,74,0.85)';
  if (value >= 10) return 'rgba(74,222,128,0.75)';
  if (value >= 2) return 'rgba(250,204,21,0.75)';
  if (value >= -2) return 'rgba(251,191,36,0.8)';
  return 'rgba(239,68,68,0.78)';
}

function laneCategory(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('metro') || lower.includes('city')) return 'Metro';
  if (lower.includes('regional')) return 'Regional';
  if (lower.includes('border')) return 'Border';
  const len = name.length;
  if (len > 22) return 'Long Haul';
  if (len > 16) return 'Regional';
  return 'Short Haul';
}

function vendorTier(score: number) {
  if (score >= 90) return 'Premium';
  if (score >= 70) return 'Standard';
  return 'New';
}

export function SavingsAnalysisPage() {
  const [tick, setTick] = useState(0);
  const [selectedAuction, setSelectedAuction] = useState('all');
  const [selectedLane, setSelectedLane] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | AuctionType>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate>('executive');

  useEffect(() => {
    const unsub = auctionEngine.subscribe(() => setTick((v) => v + 1));
    return unsub;
  }, []);

  const allAuctions = auctionEngine.getAllAuctions().filter((a) => a.status === AuctionStatus.COMPLETED);

  const scopedAuctions = useMemo(() => {
    return allAuctions.filter((auction) => {
      if (selectedAuction !== 'all' && auction.id !== selectedAuction) return false;
      if (selectedType !== 'all' && auction.auctionType !== selectedType) return false;
      if (dateFrom) {
        const fromTs = new Date(`${dateFrom}T00:00:00`).getTime();
        if (auction.createdAt < fromTs) return false;
      }
      if (dateTo) {
        const toTs = new Date(`${dateTo}T23:59:59`).getTime();
        if (auction.createdAt > toTs) return false;
      }
      return true;
    });
  }, [allAuctions, selectedAuction, selectedType, dateFrom, dateTo, tick]);

  const allRows = useMemo(() => computeLaneRows(scopedAuctions), [scopedAuctions]);

  const rows = useMemo(() => {
    return allRows.filter((row) => {
      if (selectedLane !== 'all' && row.laneId !== selectedLane) return false;
      if (selectedVendor !== 'all' && row.vendorId !== selectedVendor) return false;
      return true;
    });
  }, [allRows, selectedLane, selectedVendor]);

  const totals = useMemo(() => {
    const agg = rows.reduce((acc, row) => {
      acc.starting += row.startingPrice;
      acc.final += row.finalPrice;
      acc.l1 += row.l1Savings.amount;
      acc.prev += row.prevSavings.amount;
      acc.market += row.marketSavings.amount;
      acc.budget += row.budgetSavings.amount;
      acc.first += row.firstBidSavings.amount;
      acc.second += row.secondPlaceMargin.amount;
      acc.projected += row.projectedSavings;
      acc.realized += row.realizedSavings;
      acc.competitive += row.attribution.competitivePressure;
      acc.marketTiming += row.attribution.marketTiming;
      acc.auctionDesign += row.attribution.auctionDesign;
      return acc;
    }, {
      starting: 0,
      final: 0,
      l1: 0,
      prev: 0,
      market: 0,
      budget: 0,
      first: 0,
      second: 0,
      projected: 0,
      realized: 0,
      competitive: 0,
      marketTiming: 0,
      auctionDesign: 0,
    });

    return {
      ...agg,
      l1Pct: safePct(agg.starting, agg.l1),
      prevPct: safePct(agg.starting, agg.prev),
      marketPct: safePct(agg.starting, agg.market),
      budgetPct: safePct(agg.starting, agg.budget),
      firstPct: safePct(agg.starting, agg.first),
      secondPct: safePct(agg.starting, agg.second),
      realizationPct: safePct(agg.projected, agg.realized),
    };
  }, [rows]);

  const waterfallData = [
    { name: 'Starting Value', value: totals.starting, fill: '#2563eb' },
    { name: 'Competitive Bidding', value: -totals.competitive, fill: '#16a34a' },
    { name: 'Market Conditions', value: -totals.marketTiming, fill: '#22c55e' },
    { name: 'Strategic Timing', value: -totals.auctionDesign, fill: '#4ade80' },
    { name: 'Final Value', value: totals.final, fill: '#0f766e' },
  ];

  const radarData = [
    { baseline: 'L1', value: Math.max(0, totals.l1Pct), target: 15 },
    { baseline: 'Prev Contract', value: Math.max(0, totals.prevPct), target: 12 },
    { baseline: 'Market', value: Math.max(0, totals.marketPct), target: 10 },
    { baseline: 'Budget', value: Math.max(0, totals.budgetPct), target: 5 },
    { baseline: 'First Bid', value: Math.max(0, totals.firstPct), target: 8 },
    { baseline: '2nd Margin', value: Math.max(0, totals.secondPct), target: 1 },
  ];

  const trendData = useMemo(() => {
    const byMonth = new Map<string, { l1: number; prev: number; market: number; budget: number; first: number; second: number; count: number }>();
    rows.forEach((row) => {
      const auction = allAuctions.find((a) => a.id === row.auctionId);
      if (!auction) return;
      const month = new Date(auction.createdAt).toISOString().slice(0, 7);
      if (!byMonth.has(month)) {
        byMonth.set(month, { l1: 0, prev: 0, market: 0, budget: 0, first: 0, second: 0, count: 0 });
      }
      const m = byMonth.get(month)!;
      m.l1 += row.l1Savings.pct;
      m.prev += row.prevSavings.pct;
      m.market += row.marketSavings.pct;
      m.budget += row.budgetSavings.pct;
      m.first += row.firstBidSavings.pct;
      m.second += row.secondPlaceMargin.pct;
      m.count += 1;
    });

    return Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({
        month,
        l1: data.count > 0 ? data.l1 / data.count : 0,
        prev: data.count > 0 ? data.prev / data.count : 0,
        market: data.count > 0 ? data.market / data.count : 0,
        budget: data.count > 0 ? data.budget / data.count : 0,
        first: data.count > 0 ? data.first / data.count : 0,
        second: data.count > 0 ? data.second / data.count : 0,
      }));
  }, [rows, allAuctions]);

  const comparativeByType = useMemo(() => {
    const map = new Map<AuctionType, { rows: LaneSavingsRow[] }>();
    rows.forEach((row) => {
      if (!map.has(row.auctionType)) map.set(row.auctionType, { rows: [] });
      map.get(row.auctionType)!.rows.push(row);
    });
    return Array.from(map.entries()).map(([type, payload]) => {
      const savings = payload.rows.map((r) => r.l1Savings.pct);
      const sorted = [...savings].sort((a, b) => a - b);
      const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
      return {
        type,
        avg: savings.length > 0 ? savings.reduce((a, b) => a + b, 0) / savings.length : 0,
        median,
        best: Math.max(...savings, 0),
        worst: Math.min(...savings, 0),
      };
    });
  }, [rows]);

  const comparativeByLaneType = useMemo(() => {
    const map = new Map<string, LaneSavingsRow[]>();
    rows.forEach((row) => {
      const category = laneCategory(row.laneName);
      if (!map.has(category)) map.set(category, []);
      map.get(category)!.push(row);
    });
    return Array.from(map.entries()).map(([category, list]) => ({
      category,
      avg: list.reduce((sum, row) => sum + row.l1Savings.pct, 0) / Math.max(1, list.length),
      competition: list.reduce((sum, row) => {
        const laneBids = auctionEngine.getBidsByLane(row.laneId);
        return sum + laneBids.length;
      }, 0) / Math.max(1, list.length),
      volumeImpact: list.reduce((sum, row) => sum + row.startingPrice, 0) / Math.max(1, list.length),
    }));
  }, [rows]);

  const comparativeByPeriod = useMemo(() => {
    const map = new Map<string, { rows: LaneSavingsRow[]; value: number }>();
    rows.forEach((row) => {
      const auction = allAuctions.find((a) => a.id === row.auctionId);
      if (!auction) return;
      const d = new Date(auction.createdAt);
      const quarter = `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
      if (!map.has(quarter)) map.set(quarter, { rows: [], value: 0 });
      const bucket = map.get(quarter)!;
      bucket.rows.push(row);
      bucket.value += row.startingPrice;
    });
    return Array.from(map.entries()).map(([period, payload]) => ({
      period,
      auctions: new Set(payload.rows.map((r) => r.auctionId)).size,
      avgSavings: payload.rows.reduce((sum, row) => sum + row.l1Savings.pct, 0) / Math.max(1, payload.rows.length),
      totalValue: payload.value,
      trend: '↗ Improving',
    })).sort((a, b) => a.period.localeCompare(b.period));
  }, [rows, allAuctions]);

  const comparativeByTier = useMemo(() => {
    const map = new Map<string, LaneSavingsRow[]>();
    rows.forEach((row) => {
      const summary = auctionEngine.getVendorSummary(row.vendorId);
      const tier = vendorTier(summary.performanceScore);
      if (!map.has(tier)) map.set(tier, []);
      map.get(tier)!.push(row);
    });
    return Array.from(map.entries()).map(([tier, list]) => {
      const summaries = list.map((l) => auctionEngine.getVendorSummary(l.vendorId));
      const avgReliability = summaries.reduce((sum, s) => sum + s.reliability * 20, 0) / Math.max(1, summaries.length);
      return {
        tier,
        avgDiscount: list.reduce((sum, row) => sum + row.l1Savings.pct, 0) / Math.max(1, list.length),
        reliability: avgReliability,
      };
    });
  }, [rows]);

  const budgetVarianceRows = rows.map((row) => {
    const annualBudget = row.budgetRate * 20;
    const auctionResult = row.finalPrice * 20;
    const variance = auctionResult - annualBudget;
    const variancePct = safePct(annualBudget, variance);
    return {
      ...row,
      annualBudget,
      auctionResult,
      variance,
      variancePct,
      status: variance <= 0 ? 'UNDER' : 'OVER',
      reason: variance <= 0 ? 'Within budget guardrail' : 'Limited vendor availability',
    };
  });

  const budgetTotals = budgetVarianceRows.reduce((acc, row) => {
    acc.budget += row.annualBudget;
    acc.result += row.auctionResult;
    acc.variance += row.variance;
    return acc;
  }, { budget: 0, result: 0, variance: 0 });

  const leakagePotential = Math.max(0, totals.l1 * 1.16);
  const leakageAmount = Math.max(0, leakagePotential - totals.l1);

  const roi = {
    platform: 4167,
    setup: 10000,
    vendorMgmt: 5000,
    monitoring: 5000,
  };
  const investment = roi.platform + roi.setup + roi.vendorMgmt + roi.monitoring;
  const direct = totals.l1;
  const indirect = {
    efficiency: 15000,
    discovery: 8000,
    riskReduction: 5000,
    dataInsights: 3000,
  };
  const totalReturns = direct + indirect.efficiency + indirect.discovery + indirect.riskReduction + indirect.dataInsights;
  const netBenefit = totalReturns - investment;
  const roiPct = investment > 0 ? (netBenefit / investment) * 100 : 0;

  const exportPayload = {
    generatedAt: new Date().toISOString(),
    filters: { selectedAuction, selectedLane, selectedVendor, selectedType, dateFrom, dateTo },
    totals,
    rows,
  };

  const exportFile = (label: string) => {
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `savings-analysis-${label}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const laneOptions = Array.from(new Set(allRows.map((r) => ({ id: r.laneId, name: r.laneName })))).sort((a, b) => a.name.localeCompare(b.name));
  const vendorOptions = Array.from(new Set(allRows.map((r) => r.vendorId))).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Savings Analysis</h1>
          <p className="text-slate-500">Multi-baseline transparency on auction value generation and realization.</p>
          <div className="text-xs text-slate-500 mt-1">Date range context: {dateFrom || 'start'} to {dateTo || 'today'} • Total lanes: {rows.length}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-2 rounded border border-slate-300 text-sm inline-flex items-center gap-1" onClick={() => exportFile(selectedTemplate)}><Download size={14} />Export</button>
          <button className="px-3 py-2 rounded border border-slate-300 text-sm inline-flex items-center gap-1"><Share2 size={14} />Share</button>
          <button className="px-3 py-2 rounded border border-slate-300 text-sm inline-flex items-center gap-1" onClick={() => setTick((v) => v + 1)}><RefreshCw size={14} />Refresh</button>
        </div>
      </div>

      <div className="text-xs">
        <Link to="/ams/audit" className="text-blue-700 hover:underline">Open Savings Analysis Settings</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-2 text-sm">
        <select className="border border-slate-300 rounded px-2 py-2" value={selectedAuction} onChange={(e) => setSelectedAuction(e.target.value)}>
          <option value="all">All Auctions</option>
          {allAuctions.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select className="border border-slate-300 rounded px-2 py-2" value={selectedType} onChange={(e) => setSelectedType(e.target.value as 'all' | AuctionType)}>
          <option value="all">All Types</option>
          {Object.values(AuctionType).map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <select className="border border-slate-300 rounded px-2 py-2" value={selectedLane} onChange={(e) => setSelectedLane(e.target.value)}>
          <option value="all">All Lanes</option>
          {laneOptions.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select className="border border-slate-300 rounded px-2 py-2" value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)}>
          <option value="all">All Vendors</option>
          {vendorOptions.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <input type="date" className="border border-slate-300 rounded px-2 py-2" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" className="border border-slate-300 rounded px-2 py-2" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <div className="px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">Savings Comparison Table</div>
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-2 py-2 text-left">Lane</th>
              <th className="px-2 py-2 text-left">Starting</th>
              <th className="px-2 py-2 text-left">Final</th>
              <th className="px-2 py-2 text-left">L1 Savings</th>
              <th className="px-2 py-2 text-left">Prev Contract</th>
              <th className="px-2 py-2 text-left">Market</th>
              <th className="px-2 py-2 text-left">Budget</th>
              <th className="px-2 py-2 text-left">First Bid</th>
              <th className="px-2 py-2 text-left">2nd Margin</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.auctionId}-${row.laneId}`} className="border-t border-slate-100">
                <td className="px-2 py-2 font-medium">{row.laneName}</td>
                <td className="px-2 py-2">{formatINR(row.startingPrice)}</td>
                <td className="px-2 py-2">{formatINR(row.finalPrice)}</td>
                <td className="px-2 py-2"><span className={`px-1.5 py-1 rounded ${savingsClass(row.l1Savings.pct)}`}>{formatINR(row.l1Savings.amount)} ({pct(row.l1Savings.pct)})</span></td>
                <td className="px-2 py-2"><span className={`px-1.5 py-1 rounded ${savingsClass(row.prevSavings.pct)}`}>{formatINR(row.prevSavings.amount)} ({pct(row.prevSavings.pct)})</span></td>
                <td className="px-2 py-2"><span className={`px-1.5 py-1 rounded ${savingsClass(row.marketSavings.pct)}`}>{formatINR(row.marketSavings.amount)} ({pct(row.marketSavings.pct)})</span></td>
                <td className="px-2 py-2"><span className={`px-1.5 py-1 rounded ${savingsClass(row.budgetSavings.pct)}`}>{formatINR(row.budgetSavings.amount)} ({pct(row.budgetSavings.pct)})</span></td>
                <td className="px-2 py-2"><span className={`px-1.5 py-1 rounded ${savingsClass(row.firstBidSavings.pct)}`}>{formatINR(row.firstBidSavings.amount)} ({pct(row.firstBidSavings.pct)})</span></td>
                <td className="px-2 py-2"><span className={`px-1.5 py-1 rounded ${savingsClass(row.secondPlaceMargin.pct)}`}>{formatINR(row.secondPlaceMargin.amount)} ({pct(row.secondPlaceMargin.pct)})</span></td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-900">
              <td className="px-2 py-2">Total</td>
              <td className="px-2 py-2">{formatINR(totals.starting)}</td>
              <td className="px-2 py-2">{formatINR(totals.final)}</td>
              <td className="px-2 py-2">{formatINR(totals.l1)} ({pct(totals.l1Pct)})</td>
              <td className="px-2 py-2">{formatINR(totals.prev)} ({pct(totals.prevPct)})</td>
              <td className="px-2 py-2">{formatINR(totals.market)} ({pct(totals.marketPct)})</td>
              <td className="px-2 py-2">{formatINR(totals.budget)} ({pct(totals.budgetPct)})</td>
              <td className="px-2 py-2">{formatINR(totals.first)} ({pct(totals.firstPct)})</td>
              <td className="px-2 py-2">{formatINR(totals.second)} ({pct(totals.secondPct)})</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-sm font-semibold mb-2">Waterfall Savings Breakdown</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCompactINR(v)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-sm font-semibold mb-2">Radar: Multi-Baseline Comparison</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="baseline" />
                <PolarRadiusAxis />
                <Radar name="Actual" dataKey="value" stroke="#2563eb" fill="#93c5fd" fillOpacity={0.6} />
                <Radar name="Target" dataKey="target" stroke="#16a34a" fill="#86efac" fillOpacity={0.25} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 overflow-x-auto">
          <div className="text-sm font-semibold mb-2">Heat Map: Lane × Baseline</div>
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-2 py-2 text-left">Lane</th>
                <th className="px-2 py-2">L1</th>
                <th className="px-2 py-2">Prev</th>
                <th className="px-2 py-2">Market</th>
                <th className="px-2 py-2">Budget</th>
                <th className="px-2 py-2">First Bid</th>
                <th className="px-2 py-2">2nd Margin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`heat-${row.laneId}`} className="border-t border-slate-100">
                  <td className="px-2 py-2 text-left font-medium">{row.laneName}</td>
                  <td className="px-2 py-2 text-center" style={{ background: heatColor(row.l1Savings.pct) }}>{pct(row.l1Savings.pct)}</td>
                  <td className="px-2 py-2 text-center" style={{ background: heatColor(row.prevSavings.pct) }}>{pct(row.prevSavings.pct)}</td>
                  <td className="px-2 py-2 text-center" style={{ background: heatColor(row.marketSavings.pct) }}>{pct(row.marketSavings.pct)}</td>
                  <td className="px-2 py-2 text-center" style={{ background: heatColor(row.budgetSavings.pct) }}>{pct(row.budgetSavings.pct)}</td>
                  <td className="px-2 py-2 text-center" style={{ background: heatColor(row.firstBidSavings.pct) }}>{pct(row.firstBidSavings.pct)}</td>
                  <td className="px-2 py-2 text-center" style={{ background: heatColor(row.secondPlaceMargin.pct) }}>{pct(row.secondPlaceMargin.pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-sm font-semibold mb-2">Trend Analysis (Monthly Baseline %)</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Legend />
                <Line type="monotone" dataKey="l1" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="prev" stroke="#16a34a" dot={false} />
                <Line type="monotone" dataKey="market" stroke="#f59e0b" dot={false} />
                <Line type="monotone" dataKey="budget" stroke="#a855f7" dot={false} />
                <Line type="monotone" dataKey="first" stroke="#0ea5e9" dot={false} />
                <Line type="monotone" dataKey="second" stroke="#ef4444" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="font-semibold text-slate-900">Savings Realization Tracking</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <StatCard label="Projected Savings" value={`${formatCompactINR(totals.projected)} (${pct(totals.l1Pct)})`} />
          <StatCard label="Realized to Date" value={`${formatCompactINR(totals.realized)} (${pct(totals.realizationPct)} of projected)`} />
          <StatCard label="At-Risk Lanes" value={`${rows.filter((r) => r.realizationStatus === 'at_risk').length} lane(s)`} tone="red" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-2 py-2 text-left">Lane</th>
                <th className="px-2 py-2 text-left">Projected</th>
                <th className="px-2 py-2 text-left">Realized</th>
                <th className="px-2 py-2 text-left">Realization %</th>
                <th className="px-2 py-2 text-left">Trips Completed</th>
                <th className="px-2 py-2 text-left">Trips Planned</th>
                <th className="px-2 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`real-${row.laneId}`} className="border-t border-slate-100">
                  <td className="px-2 py-2">{row.laneName}</td>
                  <td className="px-2 py-2">{formatINR(row.projectedSavings)}</td>
                  <td className="px-2 py-2">{formatINR(row.realizedSavings)}</td>
                  <td className="px-2 py-2">{pct(row.realizationPct)}</td>
                  <td className="px-2 py-2">{row.tripsCompleted}</td>
                  <td className="px-2 py-2">{row.tripsPlanned}</td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      row.realizationStatus === 'on_track' ? 'bg-green-100 text-green-700' :
                      row.realizationStatus === 'behind' ? 'bg-yellow-100 text-yellow-700' :
                      row.realizationStatus === 'at_risk' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {row.realizationStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="font-semibold text-slate-900">ROI & Value Generation</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <StatCard label="Total Investment" value={formatINR(investment)} />
            <StatCard label="Total Returns" value={formatINR(totalReturns)} tone="green" />
            <StatCard label="Net Benefit" value={formatINR(netBenefit)} tone="green" />
            <StatCard label="ROI" value={`${pct(roiPct)} • BCR ${(totalReturns / Math.max(1, investment)).toFixed(1)}:1`} tone="green" />
            <StatCard label="Payback" value={`${(investment / Math.max(1, totals.l1)).toFixed(2)} months`} />
            <StatCard label="Value per Hour" value={formatINR(totalReturns / 20)} />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Investment', value: investment },
                { name: 'Direct Savings', value: direct },
                { name: 'Efficiency', value: indirect.efficiency },
                { name: 'Discovery', value: indirect.discovery },
                { name: 'Risk', value: indirect.riskReduction },
                { name: 'Data Insights', value: indirect.dataInsights },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCompactINR(v)} />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="font-semibold text-slate-900">Savings Attribution & Leakage</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <StatCard label="Competitive Pressure" value={`${formatINR(totals.competitive)} (${pct(safePct(Math.max(1, totals.l1), totals.competitive))})`} tone="green" />
            <StatCard label="Market Timing" value={`${formatINR(totals.marketTiming)} (${pct(safePct(Math.max(1, totals.l1), totals.marketTiming))})`} />
            <StatCard label="Auction Design" value={`${formatINR(totals.auctionDesign)} (${pct(safePct(Math.max(1, totals.l1), totals.auctionDesign))})`} />
            <StatCard label="Leakage" value={`${formatINR(leakageAmount)} (${pct(safePct(Math.max(1, leakagePotential), leakageAmount))})`} tone="red" />
          </div>
          <div className="space-y-1 text-xs text-slate-600">
            <div>Non-competitive lanes: {formatINR(leakageAmount * 0.42)}</div>
            <div>Vendor declines: {formatINR(leakageAmount * 0.26)}</div>
            <div>Over-budget lanes: {formatINR(leakageAmount * 0.21)}</div>
            <div>Timing inefficiencies: {formatINR(leakageAmount * 0.11)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="font-semibold text-slate-900">Comparative Savings Analysis</div>

        <ComparisonTable
          title="By Auction Type"
          columns={['Auction Type', 'Avg Savings %', 'Median', 'Best', 'Worst']}
          rows={comparativeByType.map((r) => [r.type, pct(r.avg), pct(r.median), pct(r.best), pct(r.worst)])}
        />

        <ComparisonTable
          title="By Route/Lane Type"
          columns={['Lane Type', 'Avg Savings %', 'Competition Level', 'Volume Impact']}
          rows={comparativeByLaneType.map((r) => [
            r.category,
            pct(r.avg),
            r.competition > 20 ? 'High' : r.competition > 10 ? 'Medium' : 'Low',
            formatCompactINR(r.volumeImpact),
          ])}
        />

        <ComparisonTable
          title="By Time Period"
          columns={['Period', 'Total Auctions', 'Avg Savings %', 'Total Value', 'Trend']}
          rows={comparativeByPeriod.map((r) => [r.period, `${r.auctions}`, pct(r.avgSavings), formatCompactINR(r.totalValue), r.trend])}
        />

        <ComparisonTable
          title="By Vendor Tier"
          columns={['Vendor Tier', 'Avg Discount', 'Reliability', 'Preferred For']}
          rows={comparativeByTier.map((r) => [
            r.tier,
            pct(r.avgDiscount),
            pct(r.reliability),
            r.tier === 'Premium' ? 'Critical lanes' : r.tier === 'Standard' ? 'Regular lanes' : 'Non-critical lanes',
          ])}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="font-semibold text-slate-900">Budget Variance Analysis</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-2 py-2 text-left">Lane</th>
                <th className="px-2 py-2 text-left">Annual Budget</th>
                <th className="px-2 py-2 text-left">Auction Result</th>
                <th className="px-2 py-2 text-left">Variance</th>
                <th className="px-2 py-2 text-left">Status</th>
                <th className="px-2 py-2 text-left">Root Cause</th>
              </tr>
            </thead>
            <tbody>
              {budgetVarianceRows.map((row) => (
                <tr key={`budget-${row.laneId}`} className="border-t border-slate-100">
                  <td className="px-2 py-2">{row.laneName}</td>
                  <td className="px-2 py-2">{formatINR(row.annualBudget)}</td>
                  <td className="px-2 py-2">{formatINR(row.auctionResult)}</td>
                  <td className="px-2 py-2">{formatINR(row.variance)} ({pct(row.variancePct)})</td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'UNDER' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {row.status === 'UNDER' ? 'Under Budget' : 'Over Budget'}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-500">{row.reason}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                <td className="px-2 py-2">TOTAL</td>
                <td className="px-2 py-2">{formatINR(budgetTotals.budget)}</td>
                <td className="px-2 py-2">{formatINR(budgetTotals.result)}</td>
                <td className="px-2 py-2">{formatINR(budgetTotals.variance)} ({pct(safePct(budgetTotals.budget, budgetTotals.variance))})</td>
                <td className="px-2 py-2" colSpan={2}>{budgetTotals.variance <= 0 ? '✅ Under Budget' : '⚠️ Over Budget'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="font-semibold text-slate-900">Historical Trend Analysis</div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { month: '2024 Avg', y2024: 15.2, y2025: 0, y2026: 0 },
                { month: '2025 Avg', y2024: 0, y2025: 18.5, y2026: 0 },
                { month: '2026 Avg', y2024: 0, y2025: 0, y2026: totals.l1Pct || 23.2 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Legend />
                <Line type="monotone" dataKey="y2024" stroke="#94a3b8" />
                <Line type="monotone" dataKey="y2025" stroke="#2563eb" />
                <Line type="monotone" dataKey="y2026" stroke="#16a34a" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-sm space-y-1">
            <div>Avg Savings %: 2024 (15.2%) → 2025 (18.5%) → 2026 ({(totals.l1Pct || 23.2).toFixed(1)}%)</div>
            <div>Participation Rate: 58% → 68% → {Math.min(95, 68 + rows.length / 3).toFixed(1)}%</div>
            <div>Winner Acceptance: 85% → 89% → {Math.min(99, 90 + rows.length / 5).toFixed(1)}%</div>
            <div>Platform Uptime: 97% → 98.5% → 99.8%</div>
            <div className="text-xs text-slate-500 mt-2">Success factors: improved design, larger vendor pool, stable platform, better insights.</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="font-semibold text-slate-900">Savings Report Generator</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <button onClick={() => setSelectedTemplate('executive')} className={`px-3 py-2 rounded border text-sm ${selectedTemplate === 'executive' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300'}`}><FileText size={14} className="inline mr-1" />Executive Summary</button>
          <button onClick={() => setSelectedTemplate('detailed')} className={`px-3 py-2 rounded border text-sm ${selectedTemplate === 'detailed' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300'}`}><FileText size={14} className="inline mr-1" />Detailed Analysis</button>
          <button onClick={() => setSelectedTemplate('audit')} className={`px-3 py-2 rounded border text-sm ${selectedTemplate === 'audit' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300'}`}><FileSpreadsheet size={14} className="inline mr-1" />Financial Audit</button>
          <button onClick={() => setSelectedTemplate('board')} className={`px-3 py-2 rounded border text-sm ${selectedTemplate === 'board' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300'}`}><Presentation size={14} className="inline mr-1" />Board Deck</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-600">
          <div>Scheduled: Monthly Savings Report → CFO</div>
          <div>Scheduled: Quarterly Review → Board</div>
          <div>Scheduled: Weekly Digest → Procurement</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="font-semibold text-slate-900">Data Integration & API</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded border border-slate-200 p-3">
            <div className="font-semibold">Endpoints</div>
            <div className="font-mono text-xs mt-1">GET /api/analytics/savings/:auctionId</div>
            <div className="font-mono text-xs mt-1">GET /api/analytics/savings/aggregate?dateFrom=&amp;dateTo=&amp;groupBy=</div>
            <div className="font-mono text-xs mt-1">POST /api/analytics/savings/custom</div>
          </div>
          <div className="rounded border border-slate-200 p-3">
            <div className="font-semibold">Webhooks</div>
            <div className="font-mono text-xs mt-1">savings.milestone_reached</div>
            <div className="font-mono text-xs mt-1">savings.target_missed</div>
            <div className="font-mono text-xs mt-1">savings.at_risk</div>
          </div>
        </div>
        <pre className="bg-slate-900 text-slate-100 text-xs rounded p-3 overflow-x-auto">{`{
  analysisId,
  auctionId,
  laneId,
  prices: { startingPrice, finalPrice, previousContractRate, marketBenchmarkRate, budgetRate, firstBidPrice, secondPlaceBidPrice },
  savings: { vsStartingPrice, vsPreviousContract, vsMarketBenchmark, vsBudget, vsFirstBid, vsSecondPlace },
  attribution: { competitivePressure, marketTiming, auctionDesign },
  realization: { projected, realized, percentage, tripsCompleted, tripsPlanned, status },
  calculatedAt,
  lastUpdatedAt
}`}</pre>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: 'green' | 'red' }) {
  const cls = tone === 'green' ? 'text-green-700 border-green-200 bg-green-50' : tone === 'red' ? 'text-red-700 border-red-200 bg-red-50' : 'text-slate-900 border-slate-200 bg-white';
  return (
    <div className={`rounded-lg border p-3 ${cls}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-base font-semibold mt-1">{value}</div>
    </div>
  );
}

function ComparisonTable({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {columns.map((col) => <th key={col} className="px-2 py-2 text-left">{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={`${title}-${idx}`} className="border-t border-slate-100">
                {row.map((cell, cidx) => <td key={`${idx}-${cidx}`} className="px-2 py-2">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
