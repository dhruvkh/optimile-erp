
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the comprehensive Booking Interface based on requirements
export interface HandlingUnit {
  id: string;
  type: 'Pallet' | 'Crate' | 'Box' | 'Drum' | 'Other';
  quantity: number;
  length: number;
  width: number;
  height: number;
  weight: number;
  stackable: boolean;
  hazmat: boolean;
}

export interface CarrierOption {
  id: string;
  name: string;
  transitTime: string;
  rate: number;
  rating: number;
  onTime: number;
  isRecommended?: boolean;
  isCheapest?: boolean;
  isFastest?: boolean;
}

export interface StopPoint {
  id: string;
  type: 'Pickup' | 'Delivery';
  location: string;
  sequence: number;
  contact?: string;
  weight?: number;
}

export interface FTLDetails {
  loadType: 'Full Container' | 'Bulk' | 'Break Bulk' | 'Project Cargo';
  containerType: '20ft' | '40ft' | '40ft HC' | 'Open Top';
  temperatureControlled: boolean;
  temperatureRange: { min: number; max: number };
  oversizedCargo: boolean;
  oversizedDimensions: {
    exceedsLength: boolean;
    exceedsWidth: boolean;
    exceedsHeight: boolean;
    requiresEscort: boolean;
  };
  loadingType: 'Front Load' | 'Side Load' | 'Top Load' | 'Crane Required';
  unloadingType: 'Front Load' | 'Side Load' | 'Top Load' | 'Crane Required';
  loadingTime: number;
  unloadingTime: number;
  dedicatedVehicle: boolean;
  exclusiveUse: boolean;
  stops: StopPoint[];
  optimizedRoute?: boolean;
}

export interface PTLDetails {
  requestedCapacity: {
    percentOfTruck: number;
    handlingUnits: number;
  };
  sharingPreferences: {
    allowCoLoading: boolean;
    noCompetitors: boolean;
    competitors: string[];
    noHazmat: boolean;
    temperatureControlOnly: boolean;
    category: string;
  };
  flexibleTiming: {
    pickupWindow: { earliest: string; latest: string };
    deliveryWindow: { earliest: string; latest: string };
  };
  consolidationStatus: {
    status: 'Awaiting Consolidation' | 'Matched' | 'Locked' | 'Dispatched';
    matchedWith: string[];
    truckUtilization: number;
    position: number | null;
  };
}

export interface BookingData {
  // Step 1: Basic
  bookingType: 'FTL' | 'PTL' | 'Spot';
  clientId: string;
  clientName: string;
  clientTier: 'Premium' | 'Standard' | 'Basic';
  customerReference: string;
  pickupDate: string;
  pickupTimeStart: string;
  pickupTimeEnd: string;
  deliveryDate: string;
  deliveryTimeStart: string;
  deliveryTimeEnd: string;
  priority: 'Normal' | 'High' | 'Urgent';

  // Step 2: Route & Cargo
  originType: 'Warehouse' | 'Customer Site' | 'Other';
  originAddress: string;
  originContact: string;
  originPhone: string;
  destinationType: 'Warehouse' | 'Customer Site' | 'Other';
  destinationAddress: string;
  destinationContact: string;
  destinationPhone: string;

  // General Cargo (FTL)
  cargoType: string;
  description: string;
  weight: number;
  weightUnit: 'KG' | 'Ton' | 'lbs';
  volume: number;
  volumeUnit: 'CFT' | 'CBM';
  packages: number;
  commodityValue: number;
  specialReqs: string[];

  // FTL Specific
  ftl: FTLDetails;

  // PTL Specific
  ptl: PTLDetails;

  // LTL Specific
  handlingUnits: HandlingUnit[];
  ltlMetrics: {
    density: number;
    cubicFeet: number;
    freightClass: string;
    nmfcCode?: string;
  };

  // Consolidation (LTL/PTL only)
  isConsolidated?: boolean;
  consolidationMatchId?: string;

  // Distance — entered in Route & Cargo step, carried into trip creation
  distanceKm: number;

  // Step 3: Rate & Vehicle
  rateType: 'Contract' | 'Spot';
  baseRate: number;
  loadingCharges: number;
  unloadingCharges: number;
  tollCharges: number;
  otherCharges: number;
  vehicleType: string;
  vehicleBody: 'Open' | 'Closed' | 'Refrigerated' | 'Flatbed';
  vehicleQuantity: number;
  vehicleEquipment: string[];

  // LTL Rate Specific
  accessorials: string[];
  selectedCarrier?: CarrierOption;
  weightBreakApplied: boolean;
  fscPercentage: number;

  // Step 3: Fulfillment / Vehicle sourcing
  tripType: 'own_vehicle' | 'contracted_vendor' | 'market_hire';
  selectedVehicleId?: string;    // set when an own-fleet vehicle is chosen
  marketHireVendorId?: string;   // set when a vendor is pre-selected for market/contracted hire
  marketHireVendorName?: string;
}

const INITIAL_DATA: BookingData = {
  bookingType: 'FTL',
  clientId: '',
  clientName: '',
  clientTier: 'Standard',
  customerReference: '',
  pickupDate: new Date().toISOString().split('T')[0],
  pickupTimeStart: '09:00',
  pickupTimeEnd: '18:00',
  deliveryDate: '',
  deliveryTimeStart: '09:00',
  deliveryTimeEnd: '18:00',
  priority: 'Normal',

  originType: 'Customer Site',
  originAddress: '',
  originContact: '',
  originPhone: '',
  destinationType: 'Customer Site',
  destinationAddress: '',
  destinationContact: '',
  destinationPhone: '',

  cargoType: 'General',
  description: '',
  weight: 0,
  weightUnit: 'Ton',
  volume: 0,
  volumeUnit: 'CFT',
  packages: 1,
  commodityValue: 0,
  specialReqs: [],

  ftl: {
    loadType: 'Full Container',
    containerType: '20ft',
    temperatureControlled: false,
    temperatureRange: { min: 0, max: 25 },
    oversizedCargo: false,
    oversizedDimensions: { exceedsLength: false, exceedsWidth: false, exceedsHeight: false, requiresEscort: false },
    loadingType: 'Side Load',
    unloadingType: 'Side Load',
    loadingTime: 2,
    unloadingTime: 2,
    dedicatedVehicle: true,
    exclusiveUse: true,
    stops: [],
    optimizedRoute: false,
  },

  ptl: {
    requestedCapacity: { percentOfTruck: 0, handlingUnits: 0 },
    sharingPreferences: {
      allowCoLoading: true,
      noCompetitors: false,
      competitors: [],
      noHazmat: true,
      temperatureControlOnly: false,
      category: 'General'
    },
    flexibleTiming: {
      pickupWindow: { earliest: '', latest: '' },
      deliveryWindow: { earliest: '', latest: '' }
    },
    consolidationStatus: {
      status: 'Awaiting Consolidation',
      matchedWith: [],
      truckUtilization: 0,
      position: null
    }
  },

  handlingUnits: [],
  ltlMetrics: {
    density: 0,
    cubicFeet: 0,
    freightClass: '',
  },

  isConsolidated: false,

  distanceKm: 0,

  rateType: 'Spot',
  baseRate: 0,
  loadingCharges: 0,
  unloadingCharges: 0,
  tollCharges: 0,
  otherCharges: 0,
  vehicleType: '20 Ft Truck',
  vehicleBody: 'Closed',
  vehicleQuantity: 1,
  vehicleEquipment: [],

  accessorials: [],
  weightBreakApplied: false,
  fscPercentage: 28.5,

  tripType: 'own_vehicle',
  selectedVehicleId: undefined,
  marketHireVendorId: undefined,
  marketHireVendorName: undefined,
};

interface BookingContextType {
  data: BookingData;
  updateData: (fields: Partial<BookingData>) => void;
  updateFTLData: (fields: Partial<FTLDetails>) => void;
  updatePTLData: (fields: Partial<PTLDetails>) => void;
  currentStep: number;
  setStep: (step: number) => void;
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<BookingData>(INITIAL_DATA);
  const [currentStep, setCurrentStep] = useState(1);

  const updateData = (fields: Partial<BookingData>) => {
    setData(prev => ({ ...prev, ...fields }));
  };

  const updateFTLData = (fields: Partial<FTLDetails>) => {
    setData(prev => ({ ...prev, ftl: { ...prev.ftl, ...fields } }));
  };

  const updatePTLData = (fields: Partial<PTLDetails>) => {
    setData(prev => ({ ...prev, ptl: { ...prev.ptl, ...fields } }));
  };

  const setStep = (step: number) => {
    setCurrentStep(step);
  };

  const resetBooking = () => {
    setData(INITIAL_DATA);
    setCurrentStep(1);
  };

  return (
    <BookingContext.Provider value={{ data, updateData, updateFTLData, updatePTLData, currentStep, setStep, resetBooking }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
