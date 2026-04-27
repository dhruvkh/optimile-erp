// ============================================================
// Rate Benchmarking — Shared Utility Functions
// ============================================================
// Domain-agnostic helpers used by both PTL and FTL benchmarking
// services. Extracted here so neither domain duplicates logic.
//
// Future microservices note: ship this as a shared library
// (e.g. @optimile/benchmarking-utils) when PTL and FTL become
// separate services. Until then, both import from this file.
// ============================================================

import type {
  BenchmarkStatus,
  SavingsOpportunity,
  PricingCategory,
} from '../ptl/ptlRateBenchmarkTypes';

// ─── Lane Key ────────────────────────────────────────────────────────────────

/** Produces a stable lookup key from origin, destination and vehicle type.
 *  Uses only the first word of each city to handle "Mumbai Central" vs "Mumbai". */
export function normalizeLaneKey(
  origin: string,
  destination: string,
  vehicleType: string,
): string {
  const o = origin.trim().split(' ')[0];
  const d = destination.trim().split(' ')[0];
  const v = vehicleType || 'FTL';
  return `${o}→${d}|${v}`;
}

// ─── Date / Week Helpers ─────────────────────────────────────────────────────

/** Returns a human-readable week label like "Jan W1", "Feb W3". */
export function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const week = Math.ceil(d.getDate() / 7);
  const month = d.toLocaleString('en', { month: 'short' });
  return `${month} W${week}`;
}

/** Returns the ISO date (YYYY-MM-DD) of the Monday for the week containing dateStr. */
export function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0 = Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

// ─── Statistical Helpers ─────────────────────────────────────────────────────

/** Compute a percentile value from a sorted ascending array.
 *  Uses linear interpolation between adjacent values. */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
}

// ─── Classification Helpers ───────────────────────────────────────────────────

/** Classify a lane as Below/At/Above Market based on % deviation from median.
 *  Thresholds: ≤-5% = Below, ≥+10% = Above, otherwise At Market. */
export function classifyBenchmarkStatus(contractVsMarket: number): BenchmarkStatus {
  if (contractVsMarket <= -5) return 'Below Market';
  if (contractVsMarket >= 10) return 'Above Market';
  return 'At Market';
}

/** Classify savings opportunity magnitude.
 *  Only lanes Above Market have any savings opportunity. */
export function classifySavingsOpportunity(
  status: BenchmarkStatus,
  potentialINR: number,
): SavingsOpportunity {
  if (status !== 'Above Market') return 'None';
  if (potentialINR >= 50000) return 'High';
  if (potentialINR >= 15000) return 'Medium';
  return 'Low';
}

/** Classify a vendor/carrier's pricing position relative to market.
 *  Negative = cheaper than market. */
export function classifyPricingCategory(vsMarketPct: number): PricingCategory {
  if (vsMarketPct <= -15) return 'Very Competitive';
  if (vsMarketPct <= -5) return 'Competitive';
  if (vsMarketPct <= 8) return 'At Market';
  if (vsMarketPct <= 20) return 'Expensive';
  return 'Very Expensive';
}
