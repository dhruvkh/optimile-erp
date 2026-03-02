import { auctionEngine } from './mockBackend';
import { Auction, AuctionStatus, AuctionType, Bid } from '../types';

export type BehaviorSegment = 'Aggressive' | 'Strategic' | 'Conservative' | 'Opportunistic';
export type TimingClass = 'Early Bird' | 'Strategic Middle' | 'Sniper' | 'Extension Hunter';
export type AggressivenessClass = 'Very Aggressive' | 'Aggressive' | 'Balanced' | 'Conservative';
export type DropoutRisk = 'Low' | 'Medium' | 'High';

export interface VendorBehaviorProfile {
  vendorId: string;
  vendorName: string;
  participationRate: number;
  invitedAuctions: number;
  participatedAuctions: number;
  lanesBid: number;
  lanesWon: number;
  winRate: number;
  acceptanceRate: number;
  reliability: number;
  earlyPct: number;
  middlePct: number;
  latePct: number;
  extensionPct: number;
  timingClass: TimingClass;
  avgDiscount: number;
  avgDecrement: number;
  leadingBidShare: number;
  priceFloorPct: number;
  aggressiveness: AggressivenessClass;
  avgResponseSec: number;
  responseRate: number;
  maxIterations: number;
  persistence: 'Low' | 'Medium' | 'High' | 'Very High';
  routeType: 'Long-haul' | 'Short-haul' | 'Mixed';
  geography: 'North' | 'South' | 'East' | 'West' | 'Pan-India';
  vehicle: 'FTL' | 'LTL' | 'Mixed';
  valueMin: number;
  valueMax: number;
  competitionTolerance: 'Low' | 'Medium' | 'High';
  behaviorSegment: BehaviorSegment;
  trend: 'Improving' | 'Stable' | 'Declining';
  trendDelta: number;
  predictedParticipation: number;
  predictedWinRate: number;
  predictedBidMin: number;
  predictedBidMax: number;
  dropoutRisk: DropoutRisk;
}

export interface VendorBehaviorAnalytics {
  generatedAt: number;
  vendors: VendorBehaviorProfile[];
  totals: {
    activeVendors: number;
    frequent: number;
    occasional: number;
    rare: number;
    inactive90Days: number;
    segments: Record<BehaviorSegment, number>;
  };
  clusters: Array<{ vendorA: string; vendorB: string; intensity: number }>;
  gaps: Array<{ routeType: string; currentCoverage: number; gap: 'Low' | 'Medium' | 'High' | 'Critical'; action: string }>;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function toRegion(laneName: string): 'North' | 'South' | 'East' | 'West' | 'Pan-India' {
  const value = laneName.toLowerCase();
  if (/(delhi|jaipur|lucknow|noida|punjab|chandigarh)/.test(value)) return 'North';
  if (/(chennai|bangalore|hyderabad|coimbatore|vizag|kochi)/.test(value)) return 'South';
  if (/(kolkata|guwahati|bhubaneswar|patna|ranchi)/.test(value)) return 'East';
  if (/(mumbai|pune|surat|ahmedabad|vapi|nagpur|indore)/.test(value)) return 'West';
  return 'Pan-India';
}

function laneTypeByName(laneName: string): 'Long-haul' | 'Short-haul' {
  const l = laneName.toLowerCase();
  if (/(mumbai.*delhi|delhi.*bangalore|chennai.*kolkata|guwahati|long)/.test(l) || laneName.length > 20) return 'Long-haul';
  return 'Short-haul';
}

function vehicleByName(laneName: string): 'FTL' | 'LTL' {
  const l = laneName.toLowerCase();
  if (l.includes('ltl') || l.includes('last mile') || l.includes('metro')) return 'LTL';
  return 'FTL';
}

export function computeVendorBehaviorAnalytics(): VendorBehaviorAnalytics {
  const auctions = auctionEngine.getAllAuctions().filter((a) => [AuctionStatus.COMPLETED, AuctionStatus.RUNNING, AuctionStatus.PAUSED].includes(a.status));
  const completed = auctions.filter((a) => a.status === AuctionStatus.COMPLETED);
  const allBids = auctions.flatMap((a) => auctionEngine.getBidsByAuction(a.id));

  const vendorIds = Array.from(new Set(allBids.map((b) => b.vendorId)));
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

  const vendors: VendorBehaviorProfile[] = vendorIds.map((vendorId) => {
    const vendorBids = allBids.filter((b) => b.vendorId === vendorId);
    const vendorBidsByLane = new Map<string, Bid[]>();
    vendorBids.forEach((b) => {
      if (!vendorBidsByLane.has(b.auctionLaneId)) vendorBidsByLane.set(b.auctionLaneId, []);
      vendorBidsByLane.get(b.auctionLaneId)!.push(b);
    });

    const auctionParticipationSet = new Set<string>();
    vendorBids.forEach((b) => {
      const lane = auctionEngine.getLane(b.auctionLaneId);
      if (lane) auctionParticipationSet.add(lane.auctionId);
    });

    const invitedAuctions = Math.max(1, auctions.length);
    const participatedAuctions = auctionParticipationSet.size;
    const participationRate = (participatedAuctions / invitedAuctions) * 100;

    const awardLanes = Array.from(vendorBidsByLane.keys()).map((laneId) => ({
      laneId,
      award: auctionEngine.getAward(laneId),
    }));

    const lanesWon = awardLanes.filter((l) => l.award?.vendorId === vendorId).length;
    const lanesBid = vendorBidsByLane.size;
    const winRate = lanesBid > 0 ? (lanesWon / lanesBid) * 100 : 0;

    const vendorAwards = completed
      .flatMap((a) => auctionEngine.getLanesByAuction(a.id).map((l) => auctionEngine.getAward(l.id)).filter(Boolean))
      .filter((a): a is NonNullable<typeof a> => Boolean(a) && a.vendorId === vendorId);

    const accepted = vendorAwards.filter((a) => a.status === 'ACCEPTED').length;
    const acceptanceRate = vendorAwards.length > 0 ? (accepted / vendorAwards.length) * 100 : 100;

    const summary = auctionEngine.getVendorSummary(vendorId);
    const reliability = clamp((summary.reliability || 4) * 20, 0, 100);

    let early = 0;
    let middle = 0;
    let late = 0;
    let extension = 0;

    let discountSum = 0;
    let discountCount = 0;
    let leadingCount = 0;
    let decrementSum = 0;
    let decrementCount = 0;
    let minDiscount = 0;

    let responseEvents = 0;
    let responseSuccess = 0;
    let responseSecTotal = 0;
    let maxIterations = 0;

    const routeVotes = { long: 0, short: 0 };
    const geoVotes: Record<string, number> = { North: 0, South: 0, East: 0, West: 0, 'Pan-India': 0 };
    const vehicleVotes = { FTL: 0, LTL: 0 };
    const valueRange: number[] = [];
    const competitorsPerLane: number[] = [];

    vendorBidsByLane.forEach((list, laneId) => {
      const lane = auctionEngine.getLane(laneId);
      if (!lane) return;
      const allLaneBids = auctionEngine.getBidsByLane(laneId).slice().sort((a, b) => a.bidTimestamp - b.bidTimestamp);
      const mySorted = list.slice().sort((a, b) => a.bidTimestamp - b.bidTimestamp);

      const laneStart = lane.startTime || (allLaneBids[0]?.bidTimestamp ?? Date.now());
      const laneEnd = lane.endTime || (allLaneBids[allLaneBids.length - 1]?.bidTimestamp ?? laneStart + 1);
      const laneDur = Math.max(1, laneEnd - laneStart);

      let myIterations = 0;
      mySorted.forEach((bid, idx) => {
        const p = (bid.bidTimestamp - laneStart) / laneDur;
        if (p <= 0.25) early += 1;
        else if (p <= 0.75) middle += 1;
        else late += 1;
        if (p >= 0.9) extension += 1;

        const discount = ((lane.basePrice - bid.bidAmount) / Math.max(1, lane.basePrice)) * 100;
        discountSum += discount;
        discountCount += 1;
        minDiscount = Math.max(minDiscount, discount);
        valueRange.push(bid.bidAmount);

        const lowestBefore = allLaneBids.filter((b) => b.bidTimestamp <= bid.bidTimestamp).reduce((m, b) => Math.min(m, b.bidAmount), Number.MAX_SAFE_INTEGER);
        if (bid.bidAmount <= lowestBefore) leadingCount += 1;

        if (idx > 0) {
          const dec = mySorted[idx - 1].bidAmount - bid.bidAmount;
          if (dec > 0) {
            decrementSum += dec;
            decrementCount += 1;
          }
        }
        myIterations += 1;
      });
      maxIterations = Math.max(maxIterations, myIterations);

      for (let i = 0; i < allLaneBids.length - 1; i += 1) {
        const current = allLaneBids[i];
        if (current.vendorId !== vendorId) continue;
        const next = allLaneBids[i + 1];
        if (next.vendorId === vendorId) continue;

        responseEvents += 1;
        const response = allLaneBids.slice(i + 1).find((b) => b.vendorId === vendorId);
        if (response) {
          responseSuccess += 1;
          responseSecTotal += (response.bidTimestamp - next.bidTimestamp) / 1000;
        }
      }

      routeVotes[laneTypeByName(lane.laneName) === 'Long-haul' ? 'long' : 'short'] += 1;
      geoVotes[toRegion(lane.laneName)] += 1;
      vehicleVotes[vehicleByName(lane.laneName)] += 1;
      competitorsPerLane.push(new Set(allLaneBids.map((b) => b.vendorId)).size);
    });

    const totalTiming = Math.max(1, early + middle + late);
    const earlyPct = (early / totalTiming) * 100;
    const middlePct = (middle / totalTiming) * 100;
    const latePct = (late / totalTiming) * 100;
    const extensionPct = (extension / totalTiming) * 100;

    const timingClass: TimingClass =
      extensionPct >= 30 ? 'Extension Hunter' :
      earlyPct >= 45 ? 'Early Bird' :
      latePct >= 55 ? 'Sniper' :
      'Strategic Middle';

    const avgDiscount = discountCount > 0 ? discountSum / discountCount : 0;
    const avgDecrement = decrementCount > 0 ? decrementSum / decrementCount : 0;
    const leadingBidShare = discountCount > 0 ? (leadingCount / discountCount) * 100 : 0;
    const aggressiveness: AggressivenessClass =
      avgDiscount >= 21 || avgDecrement >= 1000 ? 'Very Aggressive' :
      avgDiscount >= 17 || avgDecrement >= 600 ? 'Aggressive' :
      avgDiscount >= 13 ? 'Balanced' :
      'Conservative';

    const avgResponseSec = responseSuccess > 0 ? responseSecTotal / responseSuccess : 999;
    const responseRate = responseEvents > 0 ? (responseSuccess / responseEvents) * 100 : 0;
    const persistence: VendorBehaviorProfile['persistence'] =
      maxIterations >= 12 ? 'Very High' :
      maxIterations >= 8 ? 'High' :
      maxIterations >= 4 ? 'Medium' :
      'Low';

    const routeType: VendorBehaviorProfile['routeType'] =
      routeVotes.long > routeVotes.short * 1.3 ? 'Long-haul' :
      routeVotes.short > routeVotes.long * 1.3 ? 'Short-haul' :
      'Mixed';

    const topGeo = Object.entries(geoVotes).sort((a, b) => b[1] - a[1])[0]?.[0] as VendorBehaviorProfile['geography'] | undefined;
    const geography = topGeo || 'Pan-India';

    const vehicle: VendorBehaviorProfile['vehicle'] =
      vehicleVotes.FTL > vehicleVotes.LTL * 1.3 ? 'FTL' :
      vehicleVotes.LTL > vehicleVotes.FTL * 1.3 ? 'LTL' :
      'Mixed';

    const valueMin = valueRange.length > 0 ? Math.min(...valueRange) : 0;
    const valueMax = valueRange.length > 0 ? Math.max(...valueRange) : 0;
    const avgCompetitors = competitorsPerLane.length > 0 ? competitorsPerLane.reduce((a, b) => a + b, 0) / competitorsPerLane.length : 0;
    const competitionTolerance: VendorBehaviorProfile['competitionTolerance'] = avgCompetitors >= 5 ? 'High' : avgCompetitors >= 3 ? 'Medium' : 'Low';

    const behaviorSegment: BehaviorSegment =
      (earlyPct >= 45 && responseRate >= 70 && avgDiscount >= 15) ? 'Aggressive' :
      (middlePct >= 45 && avgDiscount >= 12 && avgDiscount <= 20) ? 'Strategic' :
      (latePct >= 55 || extensionPct >= 25) ? 'Opportunistic' :
      'Conservative';

    const recentWindowDays = 90;
    const recentCut = Date.now() - recentWindowDays * 24 * 60 * 60 * 1000;
    const recentBids = vendorBids.filter((b) => b.bidTimestamp >= recentCut);
    const prevBids = vendorBids.filter((b) => b.bidTimestamp < recentCut);
    const recentRate = recentBids.length / Math.max(1, recentWindowDays);
    const prevRate = prevBids.length / Math.max(1, 180);
    const trendDelta = prevRate > 0 ? ((recentRate - prevRate) / prevRate) * 100 : 0;
    const trend: VendorBehaviorProfile['trend'] = trendDelta > 8 ? 'Improving' : trendDelta < -8 ? 'Declining' : 'Stable';

    const predictedParticipation = clamp(
      0.45 * participationRate +
      0.25 * reliability +
      0.2 * (trend === 'Improving' ? 80 : trend === 'Stable' ? 55 : 35) +
      0.1 * (competitionTolerance === 'High' ? 70 : competitionTolerance === 'Medium' ? 55 : 40)
    );

    const predictedWinRate = clamp(
      0.4 * winRate +
      0.25 * (avgDiscount * 2) +
      0.2 * responseRate +
      0.15 * (timingClass === 'Sniper' || timingClass === 'Early Bird' ? 70 : 50),
      0,
      95,
    );

    const predictedBidMin = Math.max(1000, Math.round(valueMin * (1 - avgDiscount / 220)));
    const predictedBidMax = Math.max(predictedBidMin + 200, Math.round(valueMax * (1 - avgDiscount / 300)));

    const dropoutRisk: DropoutRisk =
      acceptanceRate < 80 || reliability < 75 ? 'High' :
      acceptanceRate < 92 || trend === 'Declining' ? 'Medium' :
      'Low';

    return {
      vendorId,
      vendorName: summary.companyName,
      participationRate,
      invitedAuctions,
      participatedAuctions,
      lanesBid,
      lanesWon,
      winRate,
      acceptanceRate,
      reliability,
      earlyPct,
      middlePct,
      latePct,
      extensionPct,
      timingClass,
      avgDiscount,
      avgDecrement,
      leadingBidShare,
      priceFloorPct: minDiscount,
      aggressiveness,
      avgResponseSec,
      responseRate,
      maxIterations,
      persistence,
      routeType,
      geography,
      vehicle,
      valueMin,
      valueMax,
      competitionTolerance,
      behaviorSegment,
      trend,
      trendDelta,
      predictedParticipation,
      predictedWinRate,
      predictedBidMin,
      predictedBidMax,
      dropoutRisk,
    };
  }).sort((a, b) => b.participationRate - a.participationRate);

  const activeVendors = vendors.length;
  const frequent = vendors.filter((v) => v.participationRate >= 80).length;
  const occasional = vendors.filter((v) => v.participationRate >= 40 && v.participationRate < 80).length;
  const rare = vendors.filter((v) => v.participationRate > 0 && v.participationRate < 40).length;
  const inactive90Days = vendors.filter((v) => {
    const lastBid = allBids.filter((b) => b.vendorId === v.vendorId).sort((a, b) => b.bidTimestamp - a.bidTimestamp)[0];
    return !lastBid || lastBid.bidTimestamp < ninetyDaysAgo;
  }).length;

  const segments: Record<BehaviorSegment, number> = {
    Aggressive: vendors.filter((v) => v.behaviorSegment === 'Aggressive').length,
    Strategic: vendors.filter((v) => v.behaviorSegment === 'Strategic').length,
    Conservative: vendors.filter((v) => v.behaviorSegment === 'Conservative').length,
    Opportunistic: vendors.filter((v) => v.behaviorSegment === 'Opportunistic').length,
  };

  // competition clusters based on pair overlap in lanes
  const laneVendors = new Map<string, Set<string>>();
  allBids.forEach((b) => {
    if (!laneVendors.has(b.auctionLaneId)) laneVendors.set(b.auctionLaneId, new Set());
    laneVendors.get(b.auctionLaneId)!.add(b.vendorId);
  });

  const pairMap = new Map<string, number>();
  laneVendors.forEach((vendorsSet) => {
    const arr = Array.from(vendorsSet);
    for (let i = 0; i < arr.length; i += 1) {
      for (let j = i + 1; j < arr.length; j += 1) {
        const a = arr[i];
        const b = arr[j];
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;
        pairMap.set(key, (pairMap.get(key) || 0) + 1);
      }
    }
  });

  const clusters = Array.from(pairMap.entries())
    .map(([pair, count]) => {
      const [vendorA, vendorB] = pair.split('|');
      const intensity = clamp((count / Math.max(1, completed.length)) * 100);
      return { vendorA, vendorB, intensity };
    })
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 12);

  const categoryCoverage = new Map<string, Set<string>>();
  allBids.forEach((bid) => {
    const lane = auctionEngine.getLane(bid.auctionLaneId);
    if (!lane) return;
    const category = laneTypeByName(lane.laneName);
    if (!categoryCoverage.has(category)) categoryCoverage.set(category, new Set());
    categoryCoverage.get(category)!.add(bid.vendorId);
  });

  const gaps = [
    { routeType: 'East-Northeast', currentCoverage: Math.max(1, Math.floor(activeVendors * 0.05)), gap: 'High' as const, action: 'Recruit 2-3 vendors' },
    { routeType: 'LTL Metro Areas', currentCoverage: Math.max(2, Math.floor(activeVendors * 0.15)), gap: 'Low' as const, action: 'Coverage sufficient' },
    { routeType: 'Border Routes', currentCoverage: Math.max(1, Math.floor(activeVendors * 0.03)), gap: 'Critical' as const, action: 'Urgent recruitment' },
    { routeType: 'Refrigerated Transport', currentCoverage: Math.max(1, Math.floor(activeVendors * 0.07)), gap: 'Medium' as const, action: 'Add 1-2 vendors' },
  ];

  return {
    generatedAt: Date.now(),
    vendors,
    totals: {
      activeVendors,
      frequent,
      occasional,
      rare,
      inactive90Days,
      segments,
    },
    clusters,
    gaps,
  };
}

