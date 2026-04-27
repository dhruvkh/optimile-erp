// ============================================================
// PTL Rate Benchmarking — Type Definitions
// ============================================================
// Authoritative type definitions for the PTL (Part Truck Load)
// rate benchmarking domain.
//
// Shared enums (BenchmarkStatus, PricingCategory, etc.) are
// also imported by the FTL domain — do not move them without
// updating ftlRateBenchmarkTypes.ts imports.
//
// Future microservices note: when PTL benchmarking becomes a
// standalone service, this file becomes its published schema.
// ============================================================

export type RateType = 'FTL' | 'PTL' | 'LTL';
export type BenchmarkStatus = 'Below Market' | 'At Market' | 'Above Market' | 'No Data';
export type SavingsOpportunity = 'High' | 'Medium' | 'Low' | 'None';
export type MarketTrend = 'Rising' | 'Falling' | 'Stable';
export type PricingCategory =
  | 'Very Competitive'
  | 'Competitive'
  | 'At Market'
  | 'Expensive'
  | 'Very Expensive';

/** Market statistics for a specific lane + vehicle type combination */
export interface LaneMarketStats {
  /** Normalized key, e.g. "Mumbai→Delhi|FTL" */
  laneId: string;
  laneName: string;
  origin: string;
  destination: string;
  vehicleType: string;
  rateType: RateType;

  // Market rate distribution (derived from auction bid history)
  marketP10: number;
  marketP25: number;
  marketP50: number; // median
  marketP75: number;
  marketP90: number;
  marketAvg: number; // volume-weighted average

  // Your rates
  contractRate?: number;        // Current contracted L1 rate
  spotRateAvg?: number;         // Average of spot auction results last 90 days
  auctionDerivedRate?: number;  // Latest auction award price on this lane
  actualAvgPaid?: number;       // Average actual amount paid (from PTL dockets)

  // Benchmarking outputs
  contractPercentile?: number;  // Where your contract sits in market (0–100)
  contractVsMarket?: number;    // % above/below market median (+ve = above = overpaying)
  benchmarkStatus: BenchmarkStatus;
  savingsOpportunity: SavingsOpportunity;
  potentialSavingsINR?: number; // Estimated savings if brought to market median

  // Trend
  marketTrend: MarketTrend;
  trendDeltaPct: number; // % change over last 12 weeks

  // Metadata
  dataPointCount: number;
  lastUpdated: number;
}

/** Week-by-week market rate series for a lane — used for trend charts */
export interface LaneRateTrendPoint {
  weekLabel: string;  // "Jan W1", "Feb W3" etc.
  weekStart: string;  // ISO date YYYY-MM-DD
  marketAvg: number;
  marketP25: number;
  marketP75: number;
  contractRate?: number;
  spotRate?: number;
  dataPoints: number;
}

/** Carrier-level rate benchmarking entry */
export interface CarrierRateBenchmark {
  carrierId: string;
  carrierName: string;
  vendorType: string;
  lanesServed: number;

  // Pricing relative to market
  avgRateVsMarket: number;  // % above/below market median (negative = cheaper)
  lowestLaneRate: number;
  highestLaneRate: number;
  avgContractRate: number;

  // Surcharges
  avgFSCPercent: number;
  fscVsMarket: number; // % above/below market FSC avg

  // Performance context
  onTimePercent?: number;
  claimRate?: number;
  performanceScore?: number;

  pricingCategory: PricingCategory;
  recommendation: string;
}

/** FSC (Fuel Surcharge) benchmarking */
export interface FSCBenchmark {
  marketAvgFSC: number;
  marketP25FSC: number;
  marketP75FSC: number;

  /** Your platform-wide average FSC % across all active client rate cards */
  yourAvgFSCPercent: number;
  fscVsMarketPct: number;
  fscStatus: BenchmarkStatus;

  baseDieselPrice: number;       // Your base diesel price
  baseDieselMarket: number;      // Market reference diesel price

  clientFSCBreakdown: Array<{
    clientId: string;
    clientName: string;
    fscPercent: number;
    vsMarket: number;
    status: BenchmarkStatus;
  }>;
}

/** Summary KPI data for the main dashboard Overview tab */
export interface BenchmarkSummary {
  generatedAt: number;
  totalLanesAnalyzed: number;
  lanesBelowMarket: number;
  lanesAtMarket: number;
  lanesAboveMarket: number;
  lanesNoData: number;

  totalPotentialSavingsINR: number;
  weightedAvgContractVsMarket: number; // Overall +/- vs market

  topSavingsLanes: LaneMarketStats[];  // Top 5 by savings opportunity
  riskLanes: LaneMarketStats[];        // Above market + Rising trend

  marketTrendOverall: MarketTrend;
  marketTrendDeltaPct: number;
}

/** Complete output from the unified orchestrator (consumed by UI components) */
export interface RateBenchmarkData {
  summary: BenchmarkSummary;
  lanes: LaneMarketStats[];
  carriers: CarrierRateBenchmark[];
  fsc: FSCBenchmark;
  trends: Record<string, LaneRateTrendPoint[]>; // laneId → weekly series
}
