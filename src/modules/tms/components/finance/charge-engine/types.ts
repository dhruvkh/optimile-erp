
export type BookingType = 'FTL' | 'LTL' | 'PTL' | 'Air';

export interface ChargeCalculation {
  bookingId: string;
  bookingType: BookingType;
  
  // Base Charges
  baseCharges: {
    volumetricWeight?: {
      perCubicFeet: number; // 6.00 Kgs
      totalCubicFeet: number;
      volumetricWeight: number;
      actualWeight: number;
      chargeableWeight: number;
      calculation: string;
    };
    minimumCharge: {
      threshold: number;
      applied: boolean;
      reason?: string;
    };
    ratePerKg?: number;
    baseFreight: number;
    calculation: string;
  };
  
  // Collection Charges
  collectionCharges: {
    freightToCollect: {
      enabled: boolean;
      charge: number; // Rs 150
    };
    valueToCollect: {
      enabled: boolean;
      codAmount: number;
      charge: number; // Rs 150
    };
    total: number;
  };
  
  // Storage & Demurrage
  storageCharges: {
    freeStorageDays: number; // 7 days
    actualStorageDays: number;
    chargeableDays: number;
    demurrage: {
      perConsignmentPerDay: number;
      perKgPerDay: number;
      totalWeight: number;
      applicableCharge: number;
      totalDemurrage: number;
      calculation: string;
    };
  };
  
  // Holiday Surcharges
  holidaySurcharges: {
    pickupOnHoliday: boolean;
    deliveryOnHoliday: boolean;
    pickupCharge: number;
    deliveryCharge: number;
    totalHolidayCharge: number;
  };
  
  // Special Charges
  specialCharges: {
    daccCharges: {
      enabled: boolean;
      charge: number;
    };
    reDelivery: {
      attempts: number;
      charge: number;
      calculation: string;
    };
    total: number;
  };
  
  // ODA Charges
  odaCharges: {
    pda: {
      applied: boolean;
      charge: number;
      calculation: string;
    };
    dda: {
      applied: boolean;
      charge: number;
      calculation: string;
    };
    total: number;
  };
  
  // Fuel Surcharge
  fuelSurcharge: {
    currentDieselPrice: number;
    baseDieselPrice: number;
    priceIncrease: number;
    matrix: {
      incrementStep: number; // Rs 3
      percentPerStep: number; // 2%
      increments: number;
      totalPercent: number;
    };
    appliedToBase: number;
    totalFSC: number;
  };
  
  // FOV
  fov: {
    declaredValue: number;
    rate: number; // 0.10%
    calculated: number;
    minimum: number;
    applied: number;
    calculation: string;
  };
  
  // Appointment Delivery
  appointmentDelivery: {
    enabled: boolean;
    charge: number;
    calculation: string;
  };
  
  // Docket Charges
  docketCharges: {
    count: number;
    rate: number;
    total: number;
  };
  
  // Summary
  summary: {
    subtotal: number;
    gst: {
      rate: number;
      amount: number;
    };
    grandTotal: number;
    breakdown: {
      baseFreightPercent: number;
      surchargesPercent: number;
      gstPercent: number;
    };
  };
}

export interface CalculationInput {
  type: BookingType;
  actualWeight: number; // kg
  dimensions: Array<{ l: number; w: number; h: number; q: number }>; // inches
  pickupPincode: string;
  deliveryPincode: string;
  pickupDate: Date;
  deliveryDate: Date;
  declaredValue: number;
  
  // VAS Flags
  freightToCollect: boolean;
  codAmount: number;
  daccRequired: boolean;
  appointmentDelivery: boolean;
  reDeliveryAttempts: number;
  storageDays: number;
  
  // Rate Overrides
  agreedRate?: number;
}
