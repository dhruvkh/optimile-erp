// ============================================================
// PTL Benchmark — Domain API Contract
// ============================================================
// This file is the single entry point for consuming PTL
// benchmark data. All callers (the orchestrator, any future
// service) must go through this API — never import internal
// service functions directly.
//
// Future microservices note: replace the function body with
// an HTTP fetch to the PTL benchmarking service endpoint.
// The request/response interfaces remain the same.
// ============================================================

import { computePTLBenchmarks } from './ptlRateBenchmarkService';
import type {
  LaneMarketStats,
  CarrierRateBenchmark,
  FSCBenchmark,
  LaneRateTrendPoint,
} from './ptlRateBenchmarkTypes';

export interface PTLBenchmarkRequest {
  /** Force bypass the 5-minute cache and recompute from source data. */
  forceRefresh?: boolean;
}

export interface PTLBenchmarkResponse {
  /** PTL-only lanes with market stats */
  lanes: LaneMarketStats[];
  /** PTL carrier pricing benchmarks */
  carriers: CarrierRateBenchmark[];
  /** FSC benchmarking data (client rate cards) */
  fsc: FSCBenchmark;
  /** Weekly trend series keyed by laneId */
  trends: Record<string, LaneRateTrendPoint[]>;
  /** Unix timestamp of when this data was computed */
  computedAt: number;
}

export function getPTLBenchmarks(_req?: PTLBenchmarkRequest): PTLBenchmarkResponse {
  return computePTLBenchmarks();
}
