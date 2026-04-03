// ============================================================
// FTL Rate Benchmarking — Type Definitions
// ============================================================
// FTL-specific types for the Full Truck Load benchmarking
// domain. Shared enums (BenchmarkStatus, PricingCategory, etc.)
// are imported from the PTL types — they are domain-agnostic.
//
// Future microservices note: when FTL becomes a standalone
// service, copy the shared enum imports here (or extract them
// to a shared package), then remove the cross-domain import.
// ============================================================

// Shared enums live in PTL types (domain-agnostic definitions)
export type {
  BenchmarkStatus,
  SavingsOpportunity,
  MarketTrend,
  PricingCategory,
  LaneRateTrendPoint,
} from '../ptl/ptlRateBenchmarkTypes';

/** Broad vehicle category used for FTL capacity classification */
export type FTLVehicleCategory = 'Heavy' | 'Medium' | 'Light' | 'Specialized';

/** Market statistics for a specific FTL lane + vehicle type */
export interface FTLLaneMetrics {
  /** Normalized key, e.g. "Mumbai→Delhi|Truck 6x4" */
  laneId: string;
  laneName: string;
  origin: string;
  destination: string;
  /** Specific vehicle type, e.g. "Truck 6x4", "Container 6x4", "LCV" */
  vehicleType: string;
  vehicleCategory: FTLVehicleCategory;

  // Market rate distribution (from auction bids on this lane)
  marketP10: number;
  marketP25: number;
  marketP50: number;
  marketP75: number;
  marketP90: number;
  marketAvg: number;

  // Contracted and awarded rates
  /** Per-trip contract rate from amsContractStore */
  contractRatePerTrip?: number;
  /** Latest auction award price on this lane */
  auctionAwardRate?: number;

  // Benchmarking outputs
  contractPercentile?: number;
  /** % above/below market median; positive = overpaying */
  contractVsMarket?: number;
  benchmarkStatus: import('../ptl/ptlRateBenchmarkTypes').BenchmarkStatus;
  savingsOpportunity: import('../ptl/ptlRateBenchmarkTypes').SavingsOpportunity;
  /** Estimated annual savings at 52 trips/year if rate brought to market median */
  potentialSavingsINR?: number;

  // Trend
  marketTrend: import('../ptl/ptlRateBenchmarkTypes').MarketTrend;
  trendDeltaPct: number;
  dataPointCount: number;
  lastUpdated: number;
}

/** Per-vendor competitive analysis for FTL auctions */
export interface FTLCarrierBenchmark {
  vendorId: string;
  /** Display name; falls back to vendorId if vendor registry unavailable */
  vendorName: string;
  /** Number of distinct lanes this vendor has bid on */
  lanesCompeted: number;
  /** Number of auction lanes won */
  auctionsWon: number;
  /** Win rate as a percentage */
  winRate: number;
  /** Average bid % above/below lane P50 (negative = cheaper than market) */
  avgBidVsMarket: number;
  lowestBid: number;
  highestBid: number;
  avgBidAmount: number;
  pricingCategory: import('../ptl/ptlRateBenchmarkTypes').PricingCategory;
}

/** Aggregated summary KPIs for FTL benchmarking */
export interface FTLBenchmarkSummary {
  generatedAt: number;
  totalLanesAnalyzed: number;
  lanesBelowMarket: number;
  lanesAtMarket: number;
  lanesAboveMarket: number;
  lanesNoData: number;
  totalPotentialSavingsINR: number;
  weightedAvgContractVsMarket: number;
  topSavingsLanes: FTLLaneMetrics[];
  riskLanes: FTLLaneMetrics[];
  marketTrendOverall: import('../ptl/ptlRateBenchmarkTypes').MarketTrend;
}

/** Complete output from the FTL benchmarking computation engine */
export interface FTLBenchmarkData {
  summary: FTLBenchmarkSummary;
  lanes: FTLLaneMetrics[];
  carriers: FTLCarrierBenchmark[];
  /** Weekly trend series keyed by laneId — uses shared LaneRateTrendPoint */
  trends: Record<string, import('../ptl/ptlRateBenchmarkTypes').LaneRateTrendPoint[]>;
}
