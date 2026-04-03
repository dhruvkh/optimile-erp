// ============================================================
// Unified Benchmark Orchestrator
// ============================================================
// Composes PTL and FTL benchmark data into the single
// RateBenchmarkData shape consumed by the UI components.
//
// Why this layer exists:
//   PTL and FTL are separate domains with separate data sources,
//   caches, and event listeners. This orchestrator is the only
//   place that knows about both. UI components call
//   computeRateBenchmarks() — they have no knowledge of the
//   domain split.
//
// Future microservices note: when PTL and FTL become separate
// services, replace getPTLBenchmarks() and getFTLBenchmarks()
// with HTTP fetches to their respective service endpoints.
// No component changes are needed — this file absorbs all
// network/protocol concerns.
// ============================================================

import { getPTLBenchmarks } from '../ptl/ptlBenchmarkAPI';
import { getFTLBenchmarks } from '../ftl/ftlBenchmarkAPI';
import type { FTLLaneMetrics } from '../ftl/ftlRateBenchmarkTypes';
import type {
  RateBenchmarkData,
  BenchmarkSummary,
  LaneMarketStats,
  CarrierRateBenchmark,
  LaneRateTrendPoint,
  MarketTrend,
} from '../ptl/ptlRateBenchmarkTypes';

// ─── FTL → unified LaneMarketStats adapter ───────────────────────────────────

/** Maps an FTLLaneMetrics record to the shared LaneMarketStats shape.
 *  The UI components consume LaneMarketStats — this adapter lets FTL
 *  lanes appear in all tabs without any component changes. */
function ftlLaneToMarketStats(ftl: FTLLaneMetrics): LaneMarketStats {
  return {
    laneId: ftl.laneId,
    laneName: ftl.laneName,
    origin: ftl.origin,
    destination: ftl.destination,
    vehicleType: ftl.vehicleType,
    rateType: 'FTL',
    marketP10: ftl.marketP10,
    marketP25: ftl.marketP25,
    marketP50: ftl.marketP50,
    marketP75: ftl.marketP75,
    marketP90: ftl.marketP90,
    marketAvg: ftl.marketAvg,
    // FTL uses per-trip rates; map contractRatePerTrip → contractRate for UI
    contractRate: ftl.contractRatePerTrip,
    auctionDerivedRate: ftl.auctionAwardRate,
    contractPercentile: ftl.contractPercentile,
    contractVsMarket: ftl.contractVsMarket,
    benchmarkStatus: ftl.benchmarkStatus,
    savingsOpportunity: ftl.savingsOpportunity,
    potentialSavingsINR: ftl.potentialSavingsINR,
    marketTrend: ftl.marketTrend,
    trendDeltaPct: ftl.trendDeltaPct,
    dataPointCount: ftl.dataPointCount,
    lastUpdated: ftl.lastUpdated,
  };
}

// ─── FTL carrier → unified CarrierRateBenchmark adapter ─────────────────────

/** Maps FTLCarrierBenchmark to the shared CarrierRateBenchmark shape. */
function ftlCarrierToUnified(
  ftlCarrier: import('../ftl/ftlRateBenchmarkTypes').FTLCarrierBenchmark,
  marketAvgFSC: number,
): CarrierRateBenchmark {
  return {
    carrierId: ftlCarrier.vendorId,
    carrierName: ftlCarrier.vendorName,
    vendorType: 'FTL Vendor',
    lanesServed: ftlCarrier.lanesCompeted,
    avgRateVsMarket: ftlCarrier.avgBidVsMarket,
    lowestLaneRate: ftlCarrier.lowestBid,
    highestLaneRate: ftlCarrier.highestBid,
    avgContractRate: ftlCarrier.avgBidAmount,
    avgFSCPercent: marketAvgFSC,
    fscVsMarket: 0,
    pricingCategory: ftlCarrier.pricingCategory,
    recommendation: ftlCarrierRecommendation(ftlCarrier.pricingCategory, ftlCarrier.winRate),
  };
}

function ftlCarrierRecommendation(
  category: CarrierRateBenchmark['pricingCategory'],
  winRate: number,
): string {
  if (category === 'Very Competitive' && winRate >= 30) return 'Preferred FTL vendor — competitive & wins auctions';
  if (category === 'Very Competitive') return 'Very competitive bids but low win rate — may face capacity issues';
  if (category === 'Competitive') return 'Good FTL pricing — consider for contract allocation';
  if (category === 'At Market') return 'Market-rate FTL vendor — evaluate on reliability';
  if (category === 'Expensive') return 'FTL rates above market — negotiate before renewal';
  return 'Significantly above market — evaluate alternatives for FTL lanes';
}

// ─── Summary recomputation ────────────────────────────────────────────────────

/** Recomputes BenchmarkSummary from merged lane list (PTL + FTL). */
function buildMergedSummary(mergedLanes: LaneMarketStats[]): BenchmarkSummary {
  const withStatus = mergedLanes.filter(l => l.benchmarkStatus !== 'No Data');
  const lanesBelowMarket = withStatus.filter(l => l.benchmarkStatus === 'Below Market').length;
  const lanesAtMarket = withStatus.filter(l => l.benchmarkStatus === 'At Market').length;
  const lanesAboveMarket = withStatus.filter(l => l.benchmarkStatus === 'Above Market').length;
  const lanesNoData = mergedLanes.filter(l => l.benchmarkStatus === 'No Data').length;

  const totalPotentialSavingsINR = mergedLanes.reduce(
    (s, l) => s + (l.potentialSavingsINR || 0),
    0,
  );

  const lanesWithContract = withStatus.filter(l => l.contractVsMarket !== undefined);
  const weightedAvgContractVsMarket =
    lanesWithContract.length > 0
      ? Math.round(
          (lanesWithContract.reduce((s, l) => s + (l.contractVsMarket || 0), 0) /
            lanesWithContract.length) *
            10,
        ) / 10
      : 0;

  const topSavingsLanes = mergedLanes
    .filter(l => l.savingsOpportunity !== 'None' && l.potentialSavingsINR)
    .sort((a, b) => (b.potentialSavingsINR || 0) - (a.potentialSavingsINR || 0))
    .slice(0, 5);

  const riskLanes = mergedLanes
    .filter(l => l.benchmarkStatus === 'Above Market' && l.marketTrend === 'Rising')
    .slice(0, 5);

  const trendVotes: Record<MarketTrend, number> = { Rising: 0, Falling: 0, Stable: 0 };
  mergedLanes.forEach(l => { trendVotes[l.marketTrend]++; });
  const marketTrendOverall: MarketTrend =
    trendVotes.Rising > trendVotes.Falling && trendVotes.Rising > trendVotes.Stable
      ? 'Rising'
      : trendVotes.Falling > trendVotes.Stable
      ? 'Falling'
      : 'Stable';
  const avgTrendDelta =
    mergedLanes.length > 0
      ? Math.round(
          (mergedLanes.reduce((s, l) => s + l.trendDeltaPct, 0) / mergedLanes.length) * 10,
        ) / 10
      : 0;

  return {
    generatedAt: Date.now(),
    totalLanesAnalyzed: mergedLanes.length,
    lanesBelowMarket,
    lanesAtMarket,
    lanesAboveMarket,
    lanesNoData,
    totalPotentialSavingsINR,
    weightedAvgContractVsMarket,
    topSavingsLanes,
    riskLanes,
    marketTrendOverall,
    marketTrendDeltaPct: avgTrendDelta,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Compute unified rate benchmarks from both PTL and FTL domains.
 *
 * This is the function consumed by the Rate Benchmarking UI components
 * (via the backward-compatibility shim in rateBenchmarkService.ts).
 * It delegates to each domain API, then merges results.
 */
export function computeRateBenchmarks(): RateBenchmarkData {
  const ptl = getPTLBenchmarks();
  const ftl = getFTLBenchmarks();

  // Convert FTL lanes to unified shape
  const ftlLanes: LaneMarketStats[] = ftl.lanes.map(ftlLaneToMarketStats);

  // Merge lanes: PTL first, then FTL (no deduplication needed — different laneId suffixes)
  const mergedLanes: LaneMarketStats[] = [...ptl.lanes, ...ftlLanes];

  // Merge trends
  const mergedTrends: Record<string, LaneRateTrendPoint[]> = {
    ...ptl.trends,
    ...ftl.trends,
  };

  // Merge carriers: PTL carriers first, then FTL vendors
  // Use platform avg FSC from PTL (FTL has no per-kg FSC structure)
  const marketAvgFSC = ptl.fsc.marketAvgFSC;
  const ftlCarriers: CarrierRateBenchmark[] = ftl.carriers.map(c =>
    ftlCarrierToUnified(c, marketAvgFSC),
  );
  const mergedCarriers: CarrierRateBenchmark[] = [...ptl.carriers, ...ftlCarriers];

  // Recompute summary from full merged lane list
  const summary = buildMergedSummary(mergedLanes);

  return {
    summary,
    lanes: mergedLanes,
    carriers: mergedCarriers,
    fsc: ptl.fsc, // FSC is a PTL concept; FTL doesn't have per-kg fuel surcharges
    trends: mergedTrends,
  };
}
