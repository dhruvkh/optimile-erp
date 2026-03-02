import { CalculationInput, ChargeCalculation } from './types';

// Mock Configuration Data
const CONFIG = {
  currentDieselPrice: 101.72, // Current Market Price
  baseDieselPrice: 92.72,     // Base from contract
  holidays: ['2024-01-26', '2024-08-15', '2024-10-02', '2024-12-25'], // YYYY-MM-DD
  odaPincodes: ['560001', '110001', '400001'], // Mock ODA list
  gstRate: 5, // %
};

// 1. Volumetric Weight Calculation
function calculateVolumetric(input: CalculationInput) {
  const FACTOR = 6.0; // Kg per CuFt
  
  let totalCuFt = 0;
  input.dimensions.forEach(dim => {
    const volInches = dim.l * dim.w * dim.h * dim.q;
    totalCuFt += volInches / 1728;
  });
  
  const volWeight = totalCuFt * FACTOR;
  const chargeable = Math.max(input.actualWeight, volWeight);
  
  return {
    perCubicFeet: FACTOR,
    totalCubicFeet: totalCuFt,
    volumetricWeight: volWeight,
    actualWeight: input.actualWeight,
    chargeableWeight: chargeable,
    calculation: `Volume: ${totalCuFt.toFixed(2)} ft³ × ${FACTOR} kg/ft³ = ${volWeight.toFixed(2)} kg. Chargeable: Max(${input.actualWeight}, ${volWeight.toFixed(2)})`
  };
}

// 2. Base Freight & Minimums
function calculateBaseFreight(input: CalculationInput, weight: number) {
  // Mock Rates
  const RATES = {
    'FTL': 0, // Contract based usually
    'LTL': 85, // Rs per kg
    'PTL': 12, // Rs per kg
    'Air': 150 // Rs per kg
  };
  
  const MINIMUMS = {
    'FTL': 5000,
    'LTL': 300,
    'PTL': 500,
    'Air': 1350
  };

  const rate = input.agreedRate || RATES[input.type] || 0;
  const rawFreight = weight * rate;
  const minThreshold = MINIMUMS[input.type] || 0;
  
  // Air minimum logic often involves volume/lane factor, simplified here
  
  const applied = rawFreight < minThreshold;
  
  return {
    ratePerKg: rate,
    minimumCharge: {
      threshold: minThreshold,
      applied,
      reason: applied ? `${input.type} Minimum Charge Applied` : undefined
    },
    baseFreight: Math.max(rawFreight, minThreshold),
    calculation: `${weight.toFixed(2)} kg × ₹${rate} = ₹${rawFreight.toFixed(2)}`
  };
}

// 3. FSC Calculation
function calculateFSC(baseFreight: number, type: string) {
  if (type === 'FTL') return { 
    currentDieselPrice: CONFIG.currentDieselPrice,
    baseDieselPrice: CONFIG.baseDieselPrice,
    priceIncrease: 0,
    matrix: { incrementStep: 0, percentPerStep: 0, increments: 0, totalPercent: 0 },
    appliedToBase: baseFreight,
    totalFSC: 0 
  };

  const increase = Math.max(0, CONFIG.currentDieselPrice - CONFIG.baseDieselPrice);
  const STEP = 3; // Every Rs 3
  const PERCENT = 2; // 2% rise
  
  const increments = Math.floor(increase / STEP);
  const totalPercent = increments * PERCENT;
  const fscAmount = baseFreight * (totalPercent / 100);
  
  return {
    currentDieselPrice: CONFIG.currentDieselPrice,
    baseDieselPrice: CONFIG.baseDieselPrice,
    priceIncrease: increase,
    matrix: {
      incrementStep: STEP,
      percentPerStep: PERCENT,
      increments,
      totalPercent
    },
    appliedToBase: baseFreight,
    totalFSC: fscAmount
  };
}

// 4. ODA Charges
function calculateODA(input: CalculationInput, weight: number) {
  // Mock logic: check if pincode ends in '1' for ODA
  const isPDA = input.pickupPincode.endsWith('9');
  const isDDA = input.deliveryPincode.endsWith('9');
  
  const calc = (w: number) => Math.max(w * 4, 750); // Rs 4/kg or min 750
  
  const pdaCharge = isPDA ? calc(weight) : 0;
  const ddaCharge = isDDA ? calc(weight) : 0;
  
  return {
    pda: {
      applied: isPDA,
      charge: pdaCharge,
      calculation: isPDA ? `Max(${weight}kg × ₹4, ₹750)` : 'Not Applicable'
    },
    dda: {
      applied: isDDA,
      charge: ddaCharge,
      calculation: isDDA ? `Max(${weight}kg × ₹4, ₹750)` : 'Not Applicable'
    },
    total: pdaCharge + ddaCharge
  };
}

// 5. Storage & Demurrage
function calculateStorage(days: number, weight: number) {
  const FREE_DAYS = 7;
  const PER_CON = 100;
  const PER_KG = 1;
  
  const chargeable = Math.max(0, days - FREE_DAYS);
  if (chargeable === 0) return {
    freeStorageDays: FREE_DAYS,
    actualStorageDays: days,
    chargeableDays: 0,
    demurrage: { perConsignmentPerDay: 0, perKgPerDay: 0, totalWeight: weight, applicableCharge: 0, totalDemurrage: 0, calculation: 'Within free period' }
  };
  
  const byCon = chargeable * 1 * PER_CON; // 1 consignment assumed
  const byKg = chargeable * weight * PER_KG;
  const total = Math.max(byCon, byKg);
  
  return {
    freeStorageDays: FREE_DAYS,
    actualStorageDays: days,
    chargeableDays: chargeable,
    demurrage: {
      perConsignmentPerDay: PER_CON,
      perKgPerDay: PER_KG,
      totalWeight: weight,
      applicableCharge: total,
      totalDemurrage: total,
      calculation: `Max(${chargeable}d × ₹${PER_CON}/con, ${chargeable}d × ${weight}kg × ₹${PER_KG}/kg)`
    }
  };
}

// MAIN CALCULATOR
export function calculateCharges(input: CalculationInput): ChargeCalculation {
  const vol = calculateVolumetric(input);
  const weight = vol.chargeableWeight;
  
  const base = calculateBaseFreight(input, weight);
  const fsc = calculateFSC(base.baseFreight, input.type);
  const oda = calculateODA(input, weight);
  const storage = calculateStorage(input.storageDays, weight);
  
  // Holiday
  const pDateStr = input.pickupDate.toISOString().split('T')[0];
  const dDateStr = input.deliveryDate.toISOString().split('T')[0];
  const isPHoliday = CONFIG.holidays.includes(pDateStr);
  const isDHoliday = CONFIG.holidays.includes(dDateStr);
  const holidayTotal = (isPHoliday ? 500 : 0) + (isDHoliday ? 500 : 0);
  
  // Special Charges
  const dacc = input.daccRequired ? 200 : 0;
  const reDelivery = input.reDeliveryAttempts > 0 ? Math.max(300, weight * 5 * input.reDeliveryAttempts) : 0;
  
  // FOV
  const fovCalc = input.declaredValue * 0.001; // 0.10%
  const fovApplied = Math.max(fovCalc, 100);
  
  // Appointment
  const apptCalc = input.appointmentDelivery ? Math.max(weight * 4, 750) : 0;
  
  // Collection
  const collectFreight = input.freightToCollect ? 150 : 0;
  const collectValue = input.codAmount > 0 ? 150 : 0;
  
  // Dockets
  const docketCharge = 100; // Fixed per booking for simplicity
  
  // Summary
  const subtotal = base.baseFreight + fsc.totalFSC + oda.total + storage.demurrage.totalDemurrage + 
                   holidayTotal + dacc + reDelivery + fovApplied + apptCalc + 
                   collectFreight + collectValue + docketCharge;
                   
  const gstAmount = subtotal * (CONFIG.gstRate / 100);
  const grandTotal = subtotal + gstAmount;
  
  return {
    bookingId: 'NEW-QUOTE',
    bookingType: input.type,
    baseCharges: {
      volumetricWeight: vol,
      minimumCharge: base.minimumCharge,
      ratePerKg: base.ratePerKg,
      baseFreight: base.baseFreight,
      calculation: base.calculation
    },
    collectionCharges: {
      freightToCollect: { enabled: input.freightToCollect, charge: collectFreight },
      valueToCollect: { enabled: input.codAmount > 0, codAmount: input.codAmount, charge: collectValue },
      total: collectFreight + collectValue
    },
    storageCharges: storage,
    holidaySurcharges: {
      pickupOnHoliday: isPHoliday,
      deliveryOnHoliday: isDHoliday,
      pickupCharge: isPHoliday ? 500 : 0,
      deliveryCharge: isDHoliday ? 500 : 0,
      totalHolidayCharge: holidayTotal
    },
    specialCharges: {
      daccCharges: { enabled: input.daccRequired, charge: dacc },
      reDelivery: { 
        attempts: input.reDeliveryAttempts, 
        charge: reDelivery,
        calculation: input.reDeliveryAttempts > 0 ? `Max(₹300, ${weight}kg × ₹5 × ${input.reDeliveryAttempts})` : 'None'
      },
      total: dacc + reDelivery
    },
    odaCharges: oda,
    fuelSurcharge: fsc,
    fov: {
      declaredValue: input.declaredValue,
      rate: 0.1,
      calculated: fovCalc,
      minimum: 100,
      applied: fovApplied,
      calculation: `Max(0.10% of ₹${input.declaredValue}, ₹100)`
    },
    appointmentDelivery: {
      enabled: input.appointmentDelivery,
      charge: apptCalc,
      calculation: input.appointmentDelivery ? `Max(${weight}kg × ₹4, ₹750)` : 'None'
    },
    docketCharges: {
      count: 1,
      rate: 100,
      total: docketCharge
    },
    summary: {
      subtotal,
      gst: { rate: CONFIG.gstRate, amount: gstAmount },
      grandTotal,
      breakdown: {
        baseFreightPercent: (base.baseFreight / subtotal) * 100,
        surchargesPercent: ((subtotal - base.baseFreight) / subtotal) * 100,
        gstPercent: (gstAmount / grandTotal) * 100
      }
    }
  };
}