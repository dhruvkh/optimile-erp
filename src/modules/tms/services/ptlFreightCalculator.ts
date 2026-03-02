// ============================================================
// PTL Freight Calculator — Zone-Based Calculation Engine
// Implements carrier-grade PTL freight calculation using
// origin/destination zone matrices and configurable T&C.
// Pure functions — no React imports, no side effects.
// ============================================================

import type {
  PTLZoneRateCard, PTLZone, PTLTATEntry,
  FreightCalcInput, FreightBreakdown,
} from './ptlTypes';

// ─── Zone Lookup ──────────────────────────────────────────────────────────────

/**
 * Find which zone a city belongs to.
 * Checks hub cities first (exact & partial match), then falls back to ODA.
 */
export function lookupZoneForCity(
  city: string,
  zones: PTLZone[]
): { zoneCode: string | null; isODA: boolean } {
  const norm = city.trim().toLowerCase();
  if (!norm) return { zoneCode: null, isODA: true };
  for (const z of zones) {
    if (z.hubCities.some(c => c === norm || norm.includes(c) || c.includes(norm))) {
      return { zoneCode: z.code, isODA: false };
    }
  }
  return { zoneCode: null, isODA: true };
}

// ─── Weight / Volumetric ──────────────────────────────────────────────────────

/**
 * Convert dimensions to volumetric weight in kg.
 * Formula: (L × W × H in CFT) × volumetricFactor
 */
export function calcVolumetricWeightKg(
  dims: { l: number; w: number; h: number; unit: 'cm' | 'ft' },
  volumetricFactor: number
): number {
  let volumeCFT: number;
  if (dims.unit === 'cm') {
    // cm³ → CFT: divide by 28316.8
    volumeCFT = (dims.l * dims.w * dims.h) / 28316.8;
  } else {
    volumeCFT = dims.l * dims.w * dims.h;
  }
  return volumeCFT * volumetricFactor;
}

// ─── Fuel Surcharge ───────────────────────────────────────────────────────────

/**
 * Dynamic fuel surcharge: for every ₹3 increase above base diesel price,
 * freight increases by 2%. No surcharge if current ≤ base.
 */
export function calcFuelSurchargeAmount(
  baseFreight: number,
  currentDieselPrice: number,
  baseDieselPrice: number
): number {
  if (currentDieselPrice <= baseDieselPrice) return 0;
  const increments = Math.floor((currentDieselPrice - baseDieselPrice) / 3);
  const pct = increments * 2; // each ₹3 increment = +2%
  return (baseFreight * pct) / 100;
}

// ─── Core Freight Calculation ─────────────────────────────────────────────────

/**
 * Calculate complete freight breakdown for a consignment.
 * Returns null if the rate card or zone lookup fails.
 */
export function calculateZoneFreight(
  input: FreightCalcInput,
  rateCard: PTLZoneRateCard
): FreightBreakdown | null {
  const { tnc, zones, surfaceRates, airRates, tatMatrix } = rateCard;
  const isSurface = input.mode === 'surface';

  // ── 1. Zone lookup ──
  const originLookup = lookupZoneForCity(input.originCity, zones);
  const destLookup   = lookupZoneForCity(input.destCity, zones);

  const isODAOrigin      = input.flags.isODAOrigin      ?? originLookup.isODA;
  const isODADestination = input.flags.isODADestination ?? destLookup.isODA;

  // If ODA, we cannot determine a zone rate — treat as unroutable unless flags override
  const originZone = originLookup.zoneCode ?? 'ODA';
  const destZone   = destLookup.zoneCode   ?? 'ODA';

  // ── 2. Rate lookup ──
  const matrix = isSurface ? surfaceRates : airRates;
  const ratePerKg: number = matrix[originZone]?.[destZone] ?? 0;

  // ── 3. Chargeable weight ──
  let volWeight = 0;
  if (input.dimensions) {
    volWeight = calcVolumetricWeightKg(input.dimensions, tnc.volumetricFactor);
  }
  const chargeableWeightKg = Math.max(input.actualWeightKg, volWeight);

  // ── 4. Base freight ──
  const rawFreight = chargeableWeightKg * ratePerKg;
  const minCharge  = isSurface ? tnc.minChargeableSurface : tnc.minChargeableAir;
  const minimumApplied = rawFreight < minCharge;
  const baseFreight = Math.max(rawFreight, minCharge);

  // ── 5. Surcharges ──
  const surcharges: FreightBreakdown['surcharges'] = {
    docketCharge: tnc.docketCharge,
  };

  // ODA origin
  if (isODAOrigin && tnc.pdaApplied) {
    surcharges.odaOrigin = Math.max(chargeableWeightKg * tnc.odaRatePerKg, tnc.odaMinPerCon);
  }

  // ODA destination
  if (isODADestination && tnc.ddaApplied) {
    surcharges.odaDestination = Math.max(chargeableWeightKg * tnc.odaRatePerKg, tnc.odaMinPerCon);
  }

  // FOV (Freight on Value / risk surcharge)
  if (input.declaredValue && input.declaredValue > 0) {
    const fovRaw = (input.declaredValue * tnc.fovPercent) / 100;
    surcharges.fov = Math.min(Math.max(fovRaw, tnc.fovMinPerCon), tnc.fovMaxLiability);
  }

  // Fuel surcharge (dynamic)
  if (input.currentDieselPrice !== undefined && input.currentDieselPrice > tnc.baseDieselPrice) {
    const fuelAmt = calcFuelSurchargeAmount(baseFreight, input.currentDieselPrice, tnc.baseDieselPrice);
    if (fuelAmt > 0) surcharges.fuelSurcharge = fuelAmt;
  }

  // COD charge
  if (input.paymentMode === 'cod') {
    surcharges.codCharge = tnc.codCharge;
  }

  // FTC (Freight to Collect) charge
  if (input.paymentMode === 'ftc') {
    surcharges.ftcCharge = tnc.ftcCharge;
  }

  // Holiday pickup
  if (input.flags.isHolidayPickup) {
    surcharges.holidayPickup = tnc.holidaySurchargePickup;
  }

  // Holiday delivery
  if (input.flags.isHolidayDelivery) {
    surcharges.holidayDelivery = tnc.holidaySurchargeDelivery;
  }

  // DACC
  if (input.flags.requiresDacc) {
    surcharges.daccCharge = tnc.daccCharge;
  }

  // Appointment delivery
  if (input.flags.requiresAppointmentDelivery) {
    surcharges.appointmentDelivery = Math.max(
      chargeableWeightKg * tnc.appointmentDeliveryPerKg,
      tnc.appointmentDeliveryMin
    );
  }

  // ── 6. Total ──
  const surchargeTotal = Object.values(surcharges).reduce((s, v) => s + (v ?? 0), 0);
  const totalFreight = Math.round((baseFreight + surchargeTotal) * 100) / 100;

  // ── 7. TAT ──
  const tatEntry: PTLTATEntry = tatMatrix[originZone]?.[destZone] ?? { min: 0 };

  return {
    chargeableWeightKg: Math.round(chargeableWeightKg * 100) / 100,
    baseRatePerKg: ratePerKg,
    baseFreight: Math.round(baseFreight * 100) / 100,
    minimumApplied,
    surcharges,
    totalFreight,
    currency: 'INR',
    tatDays: tatEntry,
    rateCardId: rateCard.id,
    originZone,
    destZone,
    originCity: input.originCity,
    destCity: input.destCity,
    isODAOrigin,
    isODADestination,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a TAT entry as a human-readable string */
export function formatTAT(tat: PTLTATEntry): string {
  if (!tat || tat.min === 0) return '—';
  if (tat.max && tat.max !== tat.min) return `${tat.min}–${tat.max} days`;
  return tat.min === 1 ? '1 day' : `${tat.min} days`;
}

/** Get the default T&C template (for new rate cards) */
export function getDefaultTnC() {
  return {
    volumetricFactor: 6.0,
    minChargeableSurface: 300,
    minChargeableAir: 1350,
    ftcCharge: 150,
    codCharge: 150,
    freeStorageDays: 7,
    demurragePerConPerDay: 100,
    demurragePerKgPerDay: 1,
    holidaySurchargePickup: 500,
    holidaySurchargeDelivery: 500,
    daccCharge: 200,
    redeliveryMin: 300,
    redeliveryPerKgPerAttempt: 5,
    stateChargeApplied: false,
    pdaApplied: true,
    ddaApplied: true,
    odaRatePerKg: 4,
    odaMinPerCon: 750,
    fovPercent: 0.10,
    fovMinPerCon: 100,
    fovMaxLiability: 10000,
    appointmentDeliveryPerKg: 4,
    appointmentDeliveryMin: 750,
    docketCharge: 100,
    baseDieselPrice: 92.72,
  };
}

/** Standard 14-zone master template for new rate cards */
export const STANDARD_ZONES: import('./ptlTypes').PTLZone[] = [
  { code: 'C1', regionName: 'Bhopal, Indore, Raipur', areaName: '—', hubCities: ['bhopal', 'indore', 'raipur'], states: [] },
  { code: 'C2', regionName: '—', areaName: 'Chattisgarh, Madhya Pradesh', hubCities: [], states: ['chattisgarh', 'madhya pradesh'] },
  { code: 'E1', regionName: 'Bhubaneshwar, Jamshedpur, Kolkata, Patna', areaName: '—', hubCities: ['bhubaneshwar', 'bhubaneswar', 'jamshedpur', 'kolkata', 'calcutta', 'patna'], states: [] },
  { code: 'E2', regionName: '—', areaName: 'Bihar, Jharkhand, Odisha, West Bengal', hubCities: [], states: ['bihar', 'jharkhand', 'odisha', 'west bengal'] },
  { code: 'N1', regionName: 'Chandigarh, Delhi, Faridabad, Ghaziabad, Gurgaon, Lucknow, Ludhiana, Mohali, Noida, Sahibabad', areaName: '—', hubCities: ['chandigarh', 'delhi', 'new delhi', 'faridabad', 'ghaziabad', 'gurgaon', 'gurugram', 'lucknow', 'ludhiana', 'mohali', 'noida', 'sahibabad'], states: [] },
  { code: 'N2', regionName: '—', areaName: 'Haryana, Punjab, Rajasthan, Uttar Pradesh, Uttarakhand', hubCities: [], states: ['haryana', 'punjab', 'rajasthan', 'uttar pradesh', 'uttarakhand'] },
  { code: 'N3', regionName: '—', areaName: 'Himachal Pradesh, Jammu And Kashmir', hubCities: [], states: ['himachal pradesh', 'jammu and kashmir', 'ladakh'] },
  { code: 'NE1', regionName: 'Guwahati', areaName: '—', hubCities: ['guwahati', 'gauhati'], states: [] },
  { code: 'NE2', regionName: '—', areaName: 'Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura', hubCities: [], states: ['arunachal pradesh', 'assam', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'sikkim', 'tripura'] },
  { code: 'S1', regionName: 'Bangalore, Chennai, Hyderabad, Secunderabad, Sriperumbudur', areaName: '—', hubCities: ['bangalore', 'bengaluru', 'chennai', 'madras', 'hyderabad', 'secunderabad', 'sriperumbudur'], states: [] },
  { code: 'S2', regionName: '—', areaName: 'Andhra Pradesh, Karnataka, Puducherry, Tamil Nadu, Telangana', hubCities: [], states: ['andhra pradesh', 'karnataka', 'puducherry', 'tamil nadu', 'telangana'] },
  { code: 'S3', regionName: '—', areaName: 'Kerala', hubCities: [], states: ['kerala'] },
  { code: 'W1', regionName: 'Ahmedabad, Baroda, Bhiwandi, Mumbai, Pune, Thane', areaName: '—', hubCities: ['ahmedabad', 'baroda', 'vadodara', 'bhiwandi', 'mumbai', 'bombay', 'pune', 'thane'], states: [] },
  { code: 'W2', regionName: '—', areaName: 'Dadra And Nagar Haveli, Daman And Diu, Goa, Gujarat, Maharashtra', hubCities: [], states: ['dadra and nagar haveli', 'daman and diu', 'goa', 'gujarat', 'maharashtra'] },
];
