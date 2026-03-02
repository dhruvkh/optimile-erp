// ============================================================
// PTL Billing Engine — Pure calculation functions
// Computes client charges and carrier/fleet costs from
// rate cards and docket data. No React imports.
// ============================================================

import type {
  PTLDocket, PTLClientRateCard, PTLVendorRateCard,
  PTLChargeBreakdown, PTLCostBreakdown, CargoPiece,
} from './ptlTypes';

// ─── Client Charge Calculation ────────────────────────────────────────────────

export interface ClientChargeResult {
  breakdown: PTLChargeBreakdown;
  totalRevenue: number;
  rateCardId: string;
  rateCardLane: string;
  chargeableWeight: number;
}

/** Calculate freight charge from weight slabs */
function calcFreight(weight: number, rc: PTLClientRateCard): number {
  let total = 0;
  let remaining = weight;
  // Sort slabs ascending
  const slabs = [...rc.weightSlabs].sort((a, b) => a.fromKg - b.fromKg);
  for (const slab of slabs) {
    if (remaining <= 0) break;
    const slabMax = slab.toKg - slab.fromKg;
    const inSlab = Math.min(remaining, slabMax);
    total += inSlab * slab.ratePerKg;
    remaining -= inSlab;
  }
  return Math.max(total, rc.minimumCharge);
}

/** Calculate volumetric weight for a set of cargo pieces */
export function calcVolumetricWeight(pieces: CargoPiece[], volumetricFactor: number): number {
  // Volumetric weight (kg) = (L × W × H in cm³ / 1,000,000) × 1000 / volumetricFactor
  // Simplified: (L cm × W cm × H cm) / (volumetricFactor × 1000) per piece × qty
  return pieces.reduce((sum, p) => {
    const volumeCFT = (p.length * p.width * p.height) / 28316.8; // cm³ to CFT
    return sum + volumeCFT * volumetricFactor * p.quantity;
  }, 0);
}

/** Calculate all client charges given a docket (partial) and a rate card */
export function calculateClientCharges(
  data: {
    chargeableWeight: number;
    declaredValue: number;
    totalPieces: number;
    isODAPickup: boolean;
    isODADelivery: boolean;
    paymentType: 'Prepaid' | 'To-Pay' | 'COD';
    codAmount?: number;
    daccApplied: boolean;
    appointmentDelivery: boolean;
    isHolidayPickup?: boolean;
    isHolidayDelivery?: boolean;
  },
  rc: PTLClientRateCard
): ClientChargeResult {
  const { chargeableWeight, declaredValue, totalPieces } = data;

  // Base freight
  const freight = calcFreight(chargeableWeight, rc);

  // ODA charge
  const odaPickup = data.isODAPickup ? Math.max(chargeableWeight * rc.odaRatePerKg, rc.odaMinPerCon) : 0;
  const odaDelivery = data.isODADelivery ? Math.max(chargeableWeight * rc.odaRatePerKg, rc.odaMinPerCon) : 0;
  const oda = odaPickup + odaDelivery;

  // FOV (Freight on Value / cargo insurance)
  const fov = Math.max((declaredValue * rc.fovPercent) / 100, rc.fovMinPerCon);

  // Docket charge
  const docket = rc.docketCharge;

  // Fuel surcharge
  const fuel = (freight * rc.fuelSurchargePercent) / 100;

  // COD charge
  const cod = data.paymentType === 'COD' && data.codAmount
    ? (data.codAmount * rc.codChargePercent) / 100
    : 0;

  // DACC charge
  const dacc = data.daccApplied ? rc.daccCharge * totalPieces : 0;

  // Appointment delivery charge
  const appointment = data.appointmentDelivery
    ? Math.max(chargeableWeight * rc.appointmentDeliveryPerKg, rc.appointmentDeliveryMin)
    : 0;

  // Holiday charges
  const holiday =
    (data.isHolidayPickup ? rc.holidaySurcharge * totalPieces : 0) +
    (data.isHolidayDelivery ? rc.holidaySurcharge * totalPieces : 0);

  const breakdown: PTLChargeBreakdown = {
    freight,
    oda,
    fov,
    docket,
    fuel,
    ...(cod > 0 && { cod }),
    ...(dacc > 0 && { dacc }),
    ...(appointment > 0 && { appointment }),
    ...(holiday > 0 && { holiday }),
  };

  const totalRevenue = Object.values(breakdown).reduce((s, v) => s + (v ?? 0), 0);

  return {
    breakdown,
    totalRevenue: Math.round(totalRevenue),
    rateCardId: rc.id,
    rateCardLane: rc.laneName ?? `${rc.originCity ?? 'All'} → ${rc.destinationCity ?? 'All'}`,
    chargeableWeight,
  };
}

/** Calculate demurrage charge (called during operations when docket exceeds free storage) */
export function calculateDemurrage(
  inwardTime: string,
  pieces: number,
  rc: PTLClientRateCard,
): number {
  const now = new Date();
  const inward = new Date(inwardTime);
  const daysAtHub = Math.floor((now.getTime() - inward.getTime()) / (1000 * 60 * 60 * 24));
  const chargeableDays = Math.max(0, daysAtHub - rc.freeStorageDays);
  return chargeableDays * rc.demurragePerConPerDay * pieces;
}

/** Calculate redelivery charge for a delivery attempt */
export function calculateRedeliveryCharge(
  chargeableWeight: number,
  rc: PTLClientRateCard
): number {
  return Math.max(rc.redeliveryMin, chargeableWeight * rc.redeliveryPerKg);
}

// ─── Carrier / Fleet Cost Calculation ────────────────────────────────────────

export interface CarrierCostResult {
  breakdown: PTLCostBreakdown;
  totalCost: number;
}

/** Calculate carrier cost from vendor rate card */
export function calculateCarrierCost(
  chargeableWeight: number,
  rc: PTLVendorRateCard
): CarrierCostResult {
  let freight: number;
  if (rc.rateType === 'Per KG') {
    freight = Math.max(chargeableWeight * rc.baseRate, rc.minimumCharge);
  } else {
    freight = rc.baseRate; // Per Trip or Per CFT (simplified)
  }
  return {
    breakdown: { freight },
    totalCost: Math.round(freight),
  };
}

/** Estimate own fleet cost per docket (based on weight/distance heuristic) */
export function estimateOwnFleetCost(
  chargeableWeight: number,
  distanceKm: number,
  fuelPricePerLitre = 95,
  kmPerLitre = 4.5,
  driverRatePerDay = 800,
  transitDays = 2,
  tollPerKm = 2,
): CarrierCostResult {
  const fuelCost = (distanceKm / kmPerLitre) * fuelPricePerLitre;
  const driverCost = driverRatePerDay * transitDays;
  const tollCost = distanceKm * tollPerKm;
  const maintenanceCost = distanceKm * 1.5; // ₹1.5/km heuristic
  const total = fuelCost + driverCost + tollCost + maintenanceCost;
  return {
    breakdown: {
      fuel: Math.round(fuelCost),
      driver: Math.round(driverCost),
      toll: Math.round(tollCost),
      maintenance: Math.round(maintenanceCost),
    },
    totalCost: Math.round(total),
  };
}

// ─── Margin Calculation ───────────────────────────────────────────────────────

export interface MarginResult {
  revenue: number;
  cost: number;
  grossMargin: number;
  marginPercent: number;
}

export function calculateMargin(revenue: number, cost: number): MarginResult {
  const grossMargin = revenue - cost;
  const marginPercent = revenue > 0 ? (grossMargin / revenue) * 100 : 0;
  return { revenue, cost, grossMargin, marginPercent: Math.round(marginPercent * 10) / 10 };
}

// ─── Docket Charge Totals ─────────────────────────────────────────────────────

/** Sum all revenue-side charges on a delivered docket */
export function getDocketRevenue(d: PTLDocket): number {
  return (
    d.baseFreightCharge +
    d.odaCharge +
    d.fovCharge +
    d.docketCharge +
    d.fuelSurcharge +
    (d.codCharge ?? 0) +
    (d.daccChargeAmount ?? 0) +
    (d.appointmentCharge ?? 0) +
    (d.holidayPickupCharge ?? 0) +
    (d.holidayDeliveryCharge ?? 0) +
    (d.demurrageCharge ?? 0) +
    (d.redeliveryChargeAmount ?? 0) +
    (d.stateCharge ?? 0)
  );
}

/** Get cost side of a docket (carrier or own fleet) */
export function getDocketCost(d: PTLDocket): number {
  if (d.fleetModel === 'Market' || d.fleetModel === 'Carrier') {
    return d.totalCarrierCost ?? 0;
  }
  return d.totalOwnFleetCost ?? 0;
}

/** Get PTL summary stats from docket list */
export function getPTLStats(dockets: PTLDocket[]) {
  const delivered = dockets.filter(d => d.status === 'Delivered');
  const active = dockets.filter(d => !['Delivered', 'RTO Completed', 'Exception'].includes(d.status));
  const exceptions = dockets.filter(d => d.status === 'Exception' || (d.exceptionIds && d.exceptionIds.length > 0));

  const totalRevenue = delivered.reduce((s, d) => s + getDocketRevenue(d), 0);
  const totalCost = delivered.reduce((s, d) => s + getDocketCost(d), 0);

  const onTime = delivered.filter(d => {
    if (!d.actualDeliveryDate || !d.promisedDeliveryDate) return false;
    return d.actualDeliveryDate <= d.promisedDeliveryDate;
  });
  const onTimePercent = delivered.length > 0 ? (onTime.length / delivered.length) * 100 : 0;

  return {
    total: dockets.length,
    delivered: delivered.length,
    active: active.length,
    exceptions: exceptions.length,
    totalRevenue,
    totalCost,
    grossMargin: totalRevenue - totalCost,
    marginPercent: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
    onTimePercent: Math.round(onTimePercent * 10) / 10,
  };
}
