// ============================================================
// FTL Benchmark — Domain API Contract
// ============================================================
// Single entry point for consuming FTL benchmark data.
// The orchestrator and any future callers must use this API —
// never import from ftlRateBenchmarkService.ts directly.
//
// Future microservices note: replace the function body with
// an HTTP fetch to the FTL benchmarking service endpoint.
// Request/response interfaces remain unchanged.
// ============================================================

import { computeFTLBenchmarks } from './ftlRateBenchmarkService';
import type {
  FTLLaneMetrics,
  FTLCarrierBenchmark,
  FTLBenchmarkSummary,
} from './ftlRateBenchmarkTypes';
import type { LaneRateTrendPoint } from '../ptl/ptlRateBenchmarkTypes';

export interface FTLBenchmarkRequest {
  /** Force bypass the 5-minute cache and recompute from source data. */
  forceRefresh?: boolean;
}

export interface FTLBenchmarkResponse {
  /** FTL-only lanes with market stats */
  lanes: FTLLaneMetrics[];
  /** FTL vendor competitive benchmarks */
  carriers: FTLCarrierBenchmark[];
  /** Aggregated FTL summary KPIs */
  summary: FTLBenchmarkSummary;
  /** Weekly trend series keyed by laneId */
  trends: Record<string, LaneRateTrendPoint[]>;
  /** Unix timestamp of when this data was computed */
  computedAt: number;
}

export function getFTLBenchmarks(_req?: FTLBenchmarkRequest): FTLBenchmarkResponse {
  const data = computeFTLBenchmarks();
  return {
    lanes: data.lanes,
    carriers: data.carriers,
    summary: data.summary,
    trends: data.trends,
    computedAt: data.summary.generatedAt,
  };
}
