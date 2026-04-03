// ============================================================
// FTL Rate Benchmarking — Computation Engine
// ============================================================
// Derives Full Truck Load market benchmarks from auction bid
// history, AMS contract store (per-trip rates), and award data.
//
// Data sources:
//   - auctionEngine: bids (bidAmount + vendorId) on FTL lanes
//   - amsContractStore: MOCK_AMS_CONTRACTS (ratePerTrip)
//   - auctionEngine.getAward(): latest L1 award price
//
// No PTL-specific data (dockets, per-kg rate cards, FSC) is
// used here. Each domain reads only its own stores.
//
// Future microservices note: this file becomes the core of an
// independent FTL benchmarking service. Replace amsContractStore
// with an HTTP call to the Contracts service, and auctionEngine
// with a call to the Auction history service.
// ============================================================

import { auctionEngine } from '../mockBackend';
import { AuctionStatus } from '../../types';
import { MOCK_AMS_CONTRACTS } from '../../../../shared/services/amsContractStore';
import { erpEventBus } from '../../../../shared/services/eventBus';
import {
  normalizeLaneKey,
  getWeekLabel,
  getWeekStart,
  percentile,
  classifyBenchmarkStatus,
  classifySavingsOpportunity,
  classifyPricingCategory,
} from '../shared/benchmarkingUtils';
import type {
  FTLLaneMetrics,
  FTLCarrierBenchmark,
  FTLBenchmarkSummary,
  FTLBenchmarkData,
  FTLVehicleCategory,
} from './ftlRateBenchmarkTypes';
import type {
  LaneRateTrendPoint,
  BenchmarkStatus,
  MarketTrend,
} from '../ptl/ptlRateBenchmarkTypes';

// ─── In-memory cache ─────────────────────────────────────────────────────────

let _ftlCache: FTLBenchmarkData | null = null;
let _ftlCacheTs = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function invalidateFTLCache() {
  _ftlCache = null;
  _ftlCacheTs = 0;
}

// FTL auction awards trigger cache invalidation
erpEventBus.on('auction.awarded', invalidateFTLCache);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map a vehicle type string to a broad capacity category.
 *  Supports Indian body-size naming: 20 Ft, 24 Ft, 32 Ft SXL, 32 Ft MXL, 40 Ft */
function classifyVehicleCategory(vehicleType: string): FTLVehicleCategory {
  const v = vehicleType.toLowerCase();
  // Indian body-size naming
  if (v.includes('20 ft') || v.includes('20ft')) return 'Light';
  if (v.includes('24 ft') || v.includes('24ft')) return 'Medium';
  if (v.includes('32 ft sxl') || v.includes('32ft sxl')) return 'Heavy';
  if (v.includes('32 ft mxl') || v.includes('32ft mxl')) return 'Heavy';
  if (v.includes('40 ft') || v.includes('40ft') || v.includes('container') || v.includes('trailer')) return 'Specialized';
  // Legacy / axle-based naming
  if (v.includes('lcv') || v.includes('light')) return 'Light';
  if (v.includes('truck') || v.includes('hcv') || v.includes('6x4') || v.includes('10-wheel')) return 'Heavy';
  return 'Medium';
}

/** Determine if a lane vehicle type suffix belongs to the FTL domain.
 *  Supports Indian body-size naming (20 Ft, 24 Ft, 32 Ft SXL, 32 Ft MXL, 40 Ft)
 *  as well as legacy axle-based names (Truck 6x4, Container 6x4, LCV, etc.) */
function isFTLSuffix(suffix: string): boolean {
  const s = suffix.toLowerCase();
  if (s === 'ptl' || s === 'ltl') return false;
  // Indian body-size naming
  const bodySizeKeywords = ['20 ft', '24 ft', '32 ft', '40 ft', '20ft', '24ft', '32ft', '40ft', 'sxl', 'mxl'];
  if (bodySizeKeywords.some(k => s.includes(k))) return true;
  // Legacy axle / type naming
  const legacyKeywords = ['ftl', 'truck', 'container', 'trailer', 'lcv', 'hcv', '6x4', '8x2', 'open', 'flat'];
  return legacyKeywords.some(k => s.includes(k));
}

// ─── Core computation ─────────────────────────────────────────────────────────

export function computeFTLBenchmarks(): FTLBenchmarkData {
  if (_ftlCache && Date.now() - _ftlCacheTs < CACHE_TTL_MS) return _ftlCache;

  // ── Step 1: Collect auction bids for FTL lanes ────────────────────────────
  const allAuctions = auctionEngine
    .getAllAuctions()
    .filter(
      a =>
        a.status === AuctionStatus.COMPLETED ||
        a.status === AuctionStatus.RUNNING ||
        a.status === AuctionStatus.PAUSED,
    );

  // laneKey → bids amounts
  const laneBids: Record<string, number[]> = {};
  // laneKey → { vendorId → best bid amount }
  const laneVendorBids: Record<string, Map<string, number>> = {};
  // laneKey → bid timestamps (parallel to laneBids)
  const laneBidTimestamps: Record<string, number[]> = {};
  // laneKey → award price
  const laneAwardPrice: Record<string, number> = {};
  // laneKey → award vendorId
  const laneAwardVendor: Record<string, string> = {};
  // laneKey → display name
  const laneNames: Record<string, string> = {};

  allAuctions.forEach(auction => {
    const lanes = auctionEngine.getLanesByAuction(auction.id);
    lanes.forEach(lane => {
      const parts = lane.laneName.split(/→|->/);
      if (parts.length < 2) return;
      const origin = parts[0].trim();
      const rest = parts[1] || '';
      const destParts = rest.split('|');
      const destination = destParts[0].trim();
      const vehicleType = destParts[1]?.trim() || '';

      // Only process FTL lanes in this service
      if (!isFTLSuffix(vehicleType) && vehicleType !== '') return;
      // If no vehicle type suffix at all, treat as FTL (default for AMS auctions)
      const effectiveVehicleType = vehicleType || 'FTL';

      const key = normalizeLaneKey(origin, destination, effectiveVehicleType);
      if (!laneBids[key]) {
        laneBids[key] = [];
        laneBidTimestamps[key] = [];
        laneVendorBids[key] = new Map();
      }
      laneNames[key] = `${origin} → ${destination}`;

      const bids = auctionEngine.getBidsByLane(lane.id);
      bids.forEach(bid => {
        laneBids[key].push(bid.bidAmount);
        laneBidTimestamps[key].push(bid.bidTimestamp);

        // Track best bid per vendor for carrier benchmarks
        const existing = laneVendorBids[key].get(bid.vendorId);
        if (existing === undefined || bid.bidAmount < existing) {
          laneVendorBids[key].set(bid.vendorId, bid.bidAmount);
        }
      });

      const award = auctionEngine.getAward(lane.id);
      if (award) {
        if (!laneAwardPrice[key] || award.price < laneAwardPrice[key]) {
          laneAwardPrice[key] = award.price;
          laneAwardVendor[key] = award.vendorId;
        }
      }
    });
  });

  // ── Step 2: FTL contract rates from amsContractStore ─────────────────────
  const laneContractRate: Record<string, number> = {};

  MOCK_AMS_CONTRACTS.forEach(contract => {
    const key = normalizeLaneKey(contract.origin, contract.destination, contract.vehicleType);
    if (!laneContractRate[key] || contract.ratePerTrip < laneContractRate[key]) {
      laneContractRate[key] = contract.ratePerTrip;
    }
  });

  // ── Step 3: Build FTLLaneMetrics ─────────────────────────────────────────
  const allLaneKeys = new Set([
    ...Object.keys(laneBids),
    ...Object.keys(laneContractRate),
  ]);

  const lanes: FTLLaneMetrics[] = [];
  const trendMap: Record<string, LaneRateTrendPoint[]> = {};

  allLaneKeys.forEach(laneKey => {
    const bids = (laneBids[laneKey] || []).slice().sort((a, b) => a - b);
    const contractRatePerTrip = laneContractRate[laneKey];
    const auctionAwardRate = laneAwardPrice[laneKey];

    const [lanePart] = laneKey.split('|');
    const [origin, destination] = lanePart.split('→');
    const vehicleType = laneKey.split('|')[1] || 'FTL';
    const vehicleCategory = classifyVehicleCategory(vehicleType);

    if (bids.length < 2 && !contractRatePerTrip) {
      lanes.push({
        laneId: laneKey,
        laneName: laneNames[laneKey] || `${origin} → ${destination}`,
        origin: origin || '',
        destination: destination || '',
        vehicleType,
        vehicleCategory,
        marketP10: 0,
        marketP25: 0,
        marketP50: 0,
        marketP75: 0,
        marketP90: 0,
        marketAvg: 0,
        contractRatePerTrip,
        auctionAwardRate,
        benchmarkStatus: 'No Data',
        savingsOpportunity: 'None',
        marketTrend: 'Stable',
        trendDeltaPct: 0,
        dataPointCount: bids.length,
        lastUpdated: Date.now(),
      });
      return;
    }

    const marketP10 = Math.round(percentile(bids, 10));
    const marketP25 = Math.round(percentile(bids, 25));
    const marketP50 = Math.round(percentile(bids, 50));
    const marketP75 = Math.round(percentile(bids, 75));
    const marketP90 = Math.round(percentile(bids, 90));
    const marketAvg = bids.length
      ? Math.round(bids.reduce((s, v) => s + v, 0) / bids.length)
      : 0;

    let contractPercentile: number | undefined;
    let contractVsMarket: number | undefined;
    let potentialSavingsINR: number | undefined;

    if (contractRatePerTrip && marketP50 > 0) {
      contractVsMarket =
        Math.round(((contractRatePerTrip - marketP50) / marketP50) * 100 * 10) / 10;
      contractPercentile = Math.round(
        (bids.filter(b => b < contractRatePerTrip).length / bids.length) * 100,
      );
      if (contractRatePerTrip > marketP50) {
        // FTL cadence: 52 trips/year (vs PTL's 100/year)
        potentialSavingsINR = Math.round((contractRatePerTrip - marketP50) * 52);
      }
    }

    const benchmarkStatus: BenchmarkStatus =
      contractVsMarket !== undefined
        ? classifyBenchmarkStatus(contractVsMarket)
        : 'No Data';

    const savingsOpportunity = classifySavingsOpportunity(
      benchmarkStatus,
      potentialSavingsINR || 0,
    );

    // Trend bucketing by week
    const timestamps = laneBidTimestamps[laneKey] || [];
    const weekBids: Record<string, { amounts: number[]; weekStart: string }> = {};
    const allBidAmounts = laneBids[laneKey] || [];

    allBidAmounts.forEach((amount, i) => {
      const ts = timestamps[i];
      if (!ts) return;
      const dateStr = new Date(ts).toISOString().slice(0, 10);
      const label = getWeekLabel(dateStr);
      const wstart = getWeekStart(dateStr);
      if (!weekBids[label]) weekBids[label] = { amounts: [], weekStart: wstart };
      weekBids[label].amounts.push(amount);
    });

    const trendPoints: LaneRateTrendPoint[] = Object.entries(weekBids)
      .sort(([, a], [, b]) => a.weekStart.localeCompare(b.weekStart))
      .slice(-12)
      .map(([weekLabel, { amounts, weekStart }]) => {
        const sorted = amounts.slice().sort((a, b) => a - b);
        return {
          weekLabel,
          weekStart,
          marketAvg: Math.round(sorted.reduce((s, v) => s + v, 0) / sorted.length),
          marketP25: Math.round(percentile(sorted, 25)),
          marketP75: Math.round(percentile(sorted, 75)),
          contractRate: contractRatePerTrip,
          dataPoints: sorted.length,
        };
      });

    let marketTrend: MarketTrend = 'Stable';
    let trendDeltaPct = 0;
    if (trendPoints.length >= 4) {
      const half = Math.floor(trendPoints.length / 2);
      const firstHalfAvg =
        trendPoints.slice(0, half).reduce((s, p) => s + p.marketAvg, 0) / half;
      const secondHalfAvg =
        trendPoints.slice(half).reduce((s, p) => s + p.marketAvg, 0) /
        (trendPoints.length - half);
      trendDeltaPct =
        Math.round(
          ((secondHalfAvg - firstHalfAvg) / Math.max(1, firstHalfAvg)) * 100 * 10,
        ) / 10;
      if (trendDeltaPct >= 3) marketTrend = 'Rising';
      else if (trendDeltaPct <= -3) marketTrend = 'Falling';
    }

    if (trendPoints.length > 0) {
      trendMap[laneKey] = trendPoints;
    }

    lanes.push({
      laneId: laneKey,
      laneName: laneNames[laneKey] || `${origin} → ${destination}`,
      origin: origin || '',
      destination: destination || '',
      vehicleType,
      vehicleCategory,
      marketP10,
      marketP25,
      marketP50,
      marketP75,
      marketP90,
      marketAvg,
      contractRatePerTrip,
      auctionAwardRate,
      contractPercentile,
      contractVsMarket,
      benchmarkStatus,
      savingsOpportunity,
      potentialSavingsINR,
      marketTrend,
      trendDeltaPct,
      dataPointCount: bids.length,
      lastUpdated: Date.now(),
    });
  });

  // ── Step 4: FTL carrier benchmarks (from vendor bid history) ─────────────
  // Aggregate across all FTL lanes: per-vendor stats
  const vendorStats: Map<
    string,
    { bids: number[]; laneBids: Map<string, number>; wins: number; laneP50s: number[] }
  > = new Map();

  allLaneKeys.forEach(laneKey => {
    const vendorBids = laneVendorBids[laneKey];
    if (!vendorBids) return;

    const laneBidsArr = (laneBids[laneKey] || []).slice().sort((a, b) => a - b);
    const laneP50 = laneBidsArr.length > 0 ? percentile(laneBidsArr, 50) : 0;

    vendorBids.forEach((bidAmount, vendorId) => {
      if (!vendorStats.has(vendorId)) {
        vendorStats.set(vendorId, { bids: [], laneBids: new Map(), wins: 0, laneP50s: [] });
      }
      const stats = vendorStats.get(vendorId)!;
      stats.bids.push(bidAmount);
      stats.laneBids.set(laneKey, bidAmount);
      if (laneP50 > 0) stats.laneP50s.push(laneP50);
      if (laneAwardVendor[laneKey] === vendorId) stats.wins++;
    });
  });

  const carrierBenchmarks: FTLCarrierBenchmark[] = Array.from(vendorStats.entries()).map(
    ([vendorId, stats]) => {
      const allBids = stats.bids;
      const avgBidAmount = allBids.length
        ? Math.round(allBids.reduce((s, v) => s + v, 0) / allBids.length)
        : 0;
      const lowestBid = allBids.length ? Math.min(...allBids) : 0;
      const highestBid = allBids.length ? Math.max(...allBids) : 0;

      // avgBidVsMarket: avg % deviation from lane P50 across all lanes
      const deviations = stats.laneP50s
        .map((p50, i) => {
          const bid = allBids[i];
          return p50 > 0 ? ((bid - p50) / p50) * 100 : 0;
        })
        .filter(d => !isNaN(d));
      const avgBidVsMarket =
        deviations.length > 0
          ? Math.round(
              (deviations.reduce((s, v) => s + v, 0) / deviations.length) * 10,
            ) / 10
          : 0;

      const lanesCompeted = stats.laneBids.size;
      const winRate =
        lanesCompeted > 0 ? Math.round((stats.wins / lanesCompeted) * 100) : 0;
      const pricingCategory = classifyPricingCategory(avgBidVsMarket);

      return {
        vendorId,
        vendorName: vendorId, // No vendor name registry in FTL; vendorId is the key
        lanesCompeted,
        auctionsWon: stats.wins,
        winRate,
        avgBidVsMarket,
        lowestBid,
        highestBid,
        avgBidAmount,
        pricingCategory,
      };
    },
  );

  // ── Step 5: Summary assembly ──────────────────────────────────────────────
  const lanesWithStatus = lanes.filter(l => l.benchmarkStatus !== 'No Data');
  const lanesBelowMarket = lanesWithStatus.filter(
    l => l.benchmarkStatus === 'Below Market',
  ).length;
  const lanesAtMarket = lanesWithStatus.filter(l => l.benchmarkStatus === 'At Market').length;
  const lanesAboveMarket = lanesWithStatus.filter(
    l => l.benchmarkStatus === 'Above Market',
  ).length;
  const lanesNoData = lanes.filter(l => l.benchmarkStatus === 'No Data').length;

  const totalPotentialSavingsINR = lanes.reduce(
    (s, l) => s + (l.potentialSavingsINR || 0),
    0,
  );

  const lanesWithContract = lanesWithStatus.filter(l => l.contractVsMarket !== undefined);
  const weightedAvgContractVsMarket =
    lanesWithContract.length > 0
      ? Math.round(
          (lanesWithContract.reduce((s, l) => s + (l.contractVsMarket || 0), 0) /
            lanesWithContract.length) *
            10,
        ) / 10
      : 0;

  const topSavingsLanes = lanes
    .filter(l => l.savingsOpportunity !== 'None' && l.potentialSavingsINR)
    .sort((a, b) => (b.potentialSavingsINR || 0) - (a.potentialSavingsINR || 0))
    .slice(0, 5);

  const riskLanes = lanes
    .filter(l => l.benchmarkStatus === 'Above Market' && l.marketTrend === 'Rising')
    .slice(0, 5);

  const trendVotes: Record<MarketTrend, number> = { Rising: 0, Falling: 0, Stable: 0 };
  lanes.forEach(l => { trendVotes[l.marketTrend]++; });
  const marketTrendOverall: MarketTrend =
    trendVotes.Rising > trendVotes.Falling && trendVotes.Rising > trendVotes.Stable
      ? 'Rising'
      : trendVotes.Falling > trendVotes.Stable
      ? 'Falling'
      : 'Stable';

  const summary: FTLBenchmarkSummary = {
    generatedAt: Date.now(),
    totalLanesAnalyzed: lanes.length,
    lanesBelowMarket,
    lanesAtMarket,
    lanesAboveMarket,
    lanesNoData,
    totalPotentialSavingsINR,
    weightedAvgContractVsMarket,
    topSavingsLanes,
    riskLanes,
    marketTrendOverall,
  };

  const result: FTLBenchmarkData = {
    summary,
    lanes,
    carriers: carrierBenchmarks,
    trends: trendMap,
  };

  _ftlCache = result;
  _ftlCacheTs = Date.now();
  return result;
}
