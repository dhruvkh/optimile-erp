// ============================================================
// PTL Rate Benchmarking — Computation Engine
// ============================================================
// Derives PTL (Part Truck Load) market benchmarks from the
// platform's auction bid history, contract rates, actual docket
// data, carrier rate cards, and FSC from client rate cards.
//
// Only processes PTL lanes (vehicle type suffix 'PTL' or no
// FTL-specific vehicle type). FTL lanes are handled separately
// by ftlRateBenchmarkService.ts.
//
// Future microservices note: this becomes the core of the PTL
// benchmarking microservice. The only external dependency is
// the event bus — replace with a message queue subscription.
// ============================================================

import { auctionEngine } from '../mockBackend';
import { AuctionStatus } from '../../types';
import { ptlStore } from '../../../tms/services/ptlStore';
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
  LaneMarketStats,
  LaneRateTrendPoint,
  CarrierRateBenchmark,
  FSCBenchmark,
  BenchmarkStatus,
  MarketTrend,
} from './ptlRateBenchmarkTypes';

// ─── Response type (also exported via ptlBenchmarkAPI.ts) ────────────────────

export interface PTLBenchmarkInternalResult {
  lanes: LaneMarketStats[];
  carriers: CarrierRateBenchmark[];
  fsc: FSCBenchmark;
  trends: Record<string, LaneRateTrendPoint[]>;
  computedAt: number;
}

// ─── In-memory cache ─────────────────────────────────────────────────────────

let _cache: PTLBenchmarkInternalResult | null = null;
let _cacheTs = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function invalidatePTLCache() {
  _cache = null;
  _cacheTs = 0;
}

// Invalidate when vendor rates or bids change
erpEventBus.on('vendor.updated', invalidatePTLCache);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function carrierRecommendation(
  category: ReturnType<typeof classifyPricingCategory>,
  otp: number,
): string {
  if (category === 'Very Competitive' && otp >= 85) return 'Preferred — best value & reliable';
  if (category === 'Very Competitive') return 'Competitive price but monitor service quality';
  if (category === 'Competitive') return 'Good pricing — consider for volume allocation';
  if (category === 'At Market') return 'Fairly priced — evaluate on service metrics';
  if (category === 'Expensive') return 'Consider renegotiating rates';
  return 'Significantly overpriced — evaluate alternatives';
}

/** Determine if a lane vehicle type suffix belongs to the PTL domain.
 *  PTL lanes have suffix 'PTL', 'LTL', or no recognizable FTL vehicle type. */
function isPTLSuffix(suffix: string): boolean {
  const ftlVehicles = ['ftl', 'truck', 'container', 'trailer', 'lcv', 'hcv'];
  const s = suffix.toLowerCase();
  if (s === 'ptl' || s === 'ltl') return true;
  // If it matches a known FTL vehicle keyword, it's not PTL
  if (ftlVehicles.some(v => s.includes(v))) return false;
  // Default unrecognized suffixes to PTL (conservative)
  return true;
}

// ─── Core computation ─────────────────────────────────────────────────────────

export function computePTLBenchmarks(): PTLBenchmarkInternalResult {
  if (_cache && Date.now() - _cacheTs < CACHE_TTL_MS) return _cache;

  // ── Step 1: Collect auction lanes + bids (PTL lanes only) ────────────────
  const allAuctions = auctionEngine
    .getAllAuctions()
    .filter(
      a =>
        a.status === AuctionStatus.COMPLETED ||
        a.status === AuctionStatus.RUNNING ||
        a.status === AuctionStatus.PAUSED,
    );

  const laneBids: Record<string, number[]> = {};
  const laneAwardPrice: Record<string, number> = {};
  const laneBidTimestamps: Record<string, number[]> = {};
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
      const vehicleType = destParts[1]?.trim() || 'PTL';

      // Only collect PTL lanes in this service
      if (!isPTLSuffix(vehicleType)) return;

      const key = normalizeLaneKey(origin, destination, vehicleType);
      if (!laneBids[key]) {
        laneBids[key] = [];
        laneBidTimestamps[key] = [];
      }
      laneNames[key] = `${origin} → ${destination}`;

      const bids = auctionEngine.getBidsByLane(lane.id);
      bids.forEach(bid => {
        laneBids[key].push(bid.bidAmount);
        laneBidTimestamps[key].push(bid.bidTimestamp);
      });

      const award = auctionEngine.getAward(lane.id);
      if (award) {
        if (!laneAwardPrice[key] || award.price < laneAwardPrice[key]) {
          laneAwardPrice[key] = award.price;
        }
      }
    });
  });

  // ── Step 2: Contract L1 rates ─────────────────────────────────────────────
  const contracts = auctionEngine.getContracts();
  const laneContractRate: Record<string, number> = {};

  contracts.forEach(contract => {
    const contractLanes = auctionEngine.getContractLanes(contract.id);
    contractLanes.forEach(cl => {
      const parts = cl.laneName.split(/→|->/);
      if (parts.length < 2) return;
      const origin = parts[0].trim();
      const dest = parts[1].trim();
      const key = normalizeLaneKey(origin, dest, 'PTL');
      if (!laneContractRate[key] || cl.baseRate < laneContractRate[key]) {
        laneContractRate[key] = cl.baseRate;
      }
    });
  });

  // ── Step 3: Actual rates paid (PTL dockets) ───────────────────────────────
  const dockets = ptlStore.getDockets().filter(d => d.status === 'Delivered');
  const laneActualRates: Record<string, number[]> = {};

  dockets.forEach(d => {
    const key = normalizeLaneKey(d.pickupCity, d.deliveryCity, 'PTL');
    if (!laneActualRates[key]) laneActualRates[key] = [];
    if (d.totalClientCharges) {
      laneActualRates[key].push(d.totalClientCharges);
    }
  });

  // ── Step 4: Rate card & carrier data ─────────────────────────────────────
  const clientRateCards = ptlStore.getClientRateCards();
  const vendorRateCards = ptlStore.getVendorRateCards();
  const carriers = ptlStore.getCarriers();

  // ── Step 5: Build LaneMarketStats ────────────────────────────────────────
  const allLaneKeys = new Set([
    ...Object.keys(laneBids),
    ...Object.keys(laneContractRate),
    ...Object.keys(laneActualRates),
  ]);

  const lanes: LaneMarketStats[] = [];
  const trendMap: Record<string, LaneRateTrendPoint[]> = {};

  allLaneKeys.forEach(laneKey => {
    const bids = (laneBids[laneKey] || []).slice().sort((a, b) => a - b);
    const contractRate = laneContractRate[laneKey];
    const auctionDerivedRate = laneAwardPrice[laneKey];
    const actualRates = laneActualRates[laneKey] || [];
    const actualAvgPaid =
      actualRates.length > 0
        ? actualRates.reduce((s, v) => s + v, 0) / actualRates.length
        : undefined;

    const [lanePart] = laneKey.split('|');
    const [origin, destination] = lanePart.split('→');
    const suffix = laneKey.split('|')[1] || 'PTL';
    const rateType = suffix === 'LTL' ? 'LTL' : 'PTL';

    if (bids.length < 2 && !contractRate) {
      lanes.push({
        laneId: laneKey,
        laneName: laneNames[laneKey] || `${origin} → ${destination}`,
        origin: origin || '',
        destination: destination || '',
        vehicleType: suffix,
        rateType,
        marketP10: 0,
        marketP25: 0,
        marketP50: 0,
        marketP75: 0,
        marketP90: 0,
        marketAvg: 0,
        contractRate,
        auctionDerivedRate,
        actualAvgPaid,
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

    if (contractRate && marketP50 > 0) {
      contractVsMarket =
        Math.round(((contractRate - marketP50) / marketP50) * 100 * 10) / 10;
      contractPercentile = Math.round(
        (bids.filter(b => b < contractRate).length / bids.length) * 100,
      );
      if (contractRate > marketP50) {
        // Assume 100 PTL trips/year for savings estimate
        potentialSavingsINR = Math.round((contractRate - marketP50) * 100);
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

    // Trend bucketing
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
          contractRate,
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
      vehicleType: suffix,
      rateType,
      marketP10,
      marketP25,
      marketP50,
      marketP75,
      marketP90,
      marketAvg,
      contractRate,
      auctionDerivedRate,
      actualAvgPaid,
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

  // ── Step 6: FSC stats from client rate cards ───────────────────────────────
  const fscValues = clientRateCards.map(rc => rc.fuelSurchargePercent).filter(Boolean);
  const marketAvgFSC =
    fscValues.length > 0
      ? fscValues.reduce((s, v) => s + v, 0) / fscValues.length
      : 8;

  // ── Step 7: Carrier benchmarks ────────────────────────────────────────────
  const carrierBenchmarks: CarrierRateBenchmark[] = carriers.map(c => {
    const cVendorRC = vendorRateCards.filter(rc => rc.vendorId === c.id);
    const allRates = cVendorRC.map(rc => rc.baseRate);
    const avgRate = allRates.length
      ? allRates.reduce((s, v) => s + v, 0) / allRates.length
      : 0;

    const marketRefRate = 15; // ₹15/kg PTL reference
    const avgRateVsMarket =
      avgRate > 0
        ? Math.round(((avgRate - marketRefRate) / marketRefRate) * 100 * 10) / 10
        : 0;

    const pricingCategory = classifyPricingCategory(avgRateVsMarket);
    const otp = c.onTimePercent || 0;
    const recommendation = carrierRecommendation(pricingCategory, otp);

    return {
      carrierId: c.id,
      carrierName: c.name,
      vendorType: c.vendorType,
      lanesServed: cVendorRC.length || 1,
      avgRateVsMarket,
      lowestLaneRate: allRates.length ? Math.min(...allRates) : avgRate,
      highestLaneRate: allRates.length ? Math.max(...allRates) : avgRate,
      avgContractRate: avgRate,
      avgFSCPercent: marketAvgFSC, // FSC is on client cards, not vendor cards
      fscVsMarket: 0,
      onTimePercent: c.onTimePercent,
      claimRate: c.claimRate,
      performanceScore: c.performanceScore,
      pricingCategory,
      recommendation,
    };
  });

  // ── Step 8: FSC benchmark object ─────────────────────────────────────────
  const fscSorted = fscValues.slice().sort((a, b) => a - b);
  const marketP25FSC = Math.round(percentile(fscSorted, 25) * 10) / 10;
  const marketP75FSC = Math.round(percentile(fscSorted, 75) * 10) / 10;
  const yourAvgFSCPercent = fscValues.length
    ? Math.round((fscValues.reduce((s, v) => s + v, 0) / fscValues.length) * 10) / 10
    : 8;
  const fscVsMarketPct =
    Math.round(
      ((yourAvgFSCPercent - marketAvgFSC) / Math.max(1, marketAvgFSC)) * 100 * 10,
    ) / 10;

  let fscStatus: BenchmarkStatus = 'At Market';
  if (fscVsMarketPct >= 10) fscStatus = 'Above Market';
  else if (fscVsMarketPct <= -5) fscStatus = 'Below Market';

  const clientFSCBreakdown = clientRateCards.map(rc => {
    const vsMarket =
      Math.round(
        ((rc.fuelSurchargePercent - marketAvgFSC) / Math.max(1, marketAvgFSC)) * 100 * 10,
      ) / 10;
    let status: BenchmarkStatus = 'At Market';
    if (vsMarket >= 10) status = 'Above Market';
    else if (vsMarket <= -5) status = 'Below Market';
    return {
      clientId: rc.clientId,
      clientName: rc.clientName,
      fscPercent: rc.fuelSurchargePercent,
      vsMarket,
      status,
    };
  });

  const baseDieselPrices = clientRateCards.map(rc => rc.baseDieselPrice).filter(Boolean);
  const baseDieselPrice = baseDieselPrices.length
    ? baseDieselPrices.reduce((s, v) => s + v, 0) / baseDieselPrices.length
    : 92;

  const fsc: FSCBenchmark = {
    marketAvgFSC: Math.round(marketAvgFSC * 10) / 10,
    marketP25FSC,
    marketP75FSC,
    yourAvgFSCPercent,
    fscVsMarketPct,
    fscStatus,
    baseDieselPrice: Math.round(baseDieselPrice),
    baseDieselMarket: 92,
    clientFSCBreakdown,
  };

  const result: PTLBenchmarkInternalResult = {
    lanes,
    carriers: carrierBenchmarks,
    fsc,
    trends: trendMap,
    computedAt: Date.now(),
  };

  _cache = result;
  _cacheTs = Date.now();
  return result;
}
