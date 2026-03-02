
export type ClientTier = 'Premium' | 'Standard' | 'Basic';
export type ClientStatus = 'Active' | 'Inactive' | 'On Hold';

export interface ContactPerson {
  name: string;
  email: string;
  phone: string;
  designation?: string;
}

export interface ClientContacts {
  primary: ContactPerson;
  accounts: ContactPerson;
  logistics: ContactPerson;
}

export interface ClientFinancial {
  creditLimit: number;
  paymentTerms: number; // Days
  outstanding: number;
  gstin: string;
  pan: string;
}

export interface Contract {
  id: string;
  name: string;
  validFrom: string;
  validTo: string;
  status: 'Active' | 'Expired' | 'Draft';
  fileUrl?: string;
}

export interface ClientPreferences {
  vehicleTypes: string[];
  communicationChannel: 'Email' | 'SMS' | 'WhatsApp';
  invoiceFormat: 'PDF' | 'Excel';
  autoBooking: boolean;
}

export interface Client {
  id: string; // CLI-001
  name: string;
  tier: ClientTier;
  status: ClientStatus;
  contacts: ClientContacts;
  financial: ClientFinancial;
  contracts: Contract[];
  preferences: ClientPreferences;
  createdAt: string;
}

export const INITIAL_CLIENT: Client = {
  id: '',
  name: '',
  tier: 'Standard',
  status: 'Active',
  contacts: {
    primary: { name: '', email: '', phone: '' },
    accounts: { name: '', email: '', phone: '' },
    logistics: { name: '', email: '', phone: '' },
  },
  financial: {
    creditLimit: 100000,
    paymentTerms: 30,
    outstanding: 0,
    gstin: '',
    pan: ''
  },
  contracts: [],
  preferences: {
    vehicleTypes: [],
    communicationChannel: 'Email',
    invoiceFormat: 'PDF',
    autoBooking: false
  },
  createdAt: new Date().toISOString()
};

// --- VENDOR TYPES ---

export type VendorType = 'Company' | 'Individual';

export interface VendorRate {
  vehicleType: string;
  rate: number;
}

export interface Vendor {
  id: string; // VEN-001
  name: string;
  type: VendorType;
  status: 'Active' | 'Inactive' | 'Blacklisted';

  owner: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };

  fleet: {
    totalVehicles: number;
    vehicleTypes: string[];
    avgAge: number;
  };

  rateAgreement: {
    basis: 'Per KM' | 'Per Trip';
    rates: VendorRate[];
    validUntil: string;
  };

  payment: {
    terms: 'Weekly' | 'Bi-weekly' | 'Monthly' | 'On Delivery';
    mode: 'Bank Transfer' | 'Cheque' | 'Cash';
    bankDetails: {
      accountNumber: string;
      ifsc: string;
      beneficiary: string;
    };
  };

  performance: {
    rating: number;
    totalTrips: number;
    onTimePercent: number;
  };
}

export const INITIAL_VENDOR: Vendor = {
  id: '',
  name: '',
  type: 'Company',
  status: 'Active',
  owner: { name: '', phone: '', email: '', address: '' },
  fleet: { totalVehicles: 0, vehicleTypes: [], avgAge: 0 },
  rateAgreement: { basis: 'Per KM', rates: [], validUntil: '' },
  payment: { terms: 'Monthly', mode: 'Bank Transfer', bankDetails: { accountNumber: '', ifsc: '', beneficiary: '' } },
  performance: { rating: 0, totalTrips: 0, onTimePercent: 0 }
};

// --- ROUTE TYPES ---

export interface LocationDetails {
  city: string;
  state: string;
  hub?: string;
}

export interface Toll {
  id: string;
  name: string;
  cost: number;
}

export interface Stop {
  id: string;
  name: string;
  km: number; // from start
  facilities: string[];
}

export interface Route {
  id: string;
  code: string; // ROU-001
  name: string;

  origin: LocationDetails;
  destination: LocationDetails;

  distance: number; // KM
  estimatedTime: number; // hours
  highways: string[];

  tolls: Toll[];
  totalTollCost: number;

  stopsRecommended: Stop[];

  historical: {
    avgRate: number;
    avgTime: number;
    lastUpdated: string;
  };

  status: 'Active' | 'Inactive';
}

export const INITIAL_ROUTE: Route = {
  id: '',
  code: '',
  name: '',
  origin: { city: '', state: '' },
  destination: { city: '', state: '' },
  distance: 0,
  estimatedTime: 0,
  highways: [],
  tolls: [],
  totalTollCost: 0,
  stopsRecommended: [],
  historical: { avgRate: 0, avgTime: 0, lastUpdated: new Date().toISOString() },
  status: 'Active'
};

// --- LOCATION MASTER TYPES ---

export type LocationType = 'Hub' | 'Warehouse' | 'Customer Site' | 'Rest Stop';

export interface OperatingHours {
  open: string;
  close: string;
}

export interface LocationFacilities {
  loadingBays: number;
  parkingSpaces: number;
  restrooms: boolean;
  fuel: boolean;
  mechanic: boolean;
  security: boolean;
}

export interface GeofenceSettings {
  radius: number; // meters
  alertOnEntry: boolean;
  alertOnExit: boolean;
}

export interface Location {
  id: string; // LOC-001
  code: string;
  name: string;
  type: LocationType;

  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    coordinates: { lat: number; lng: number };
  };

  contact: {
    person: string;
    phone: string;
    email: string;
  };

  operatingHours: {
    weekday: OperatingHours;
    saturday: OperatingHours;
    sunday: OperatingHours;
  };

  facilities: LocationFacilities;

  geofence: GeofenceSettings;

  linkedClients: string[]; // IDs

  status: 'Active' | 'Inactive';
}

export const INITIAL_LOCATION: Location = {
  id: '',
  code: '',
  name: '',
  type: 'Hub',
  address: { street: '', city: '', state: '', pincode: '', coordinates: { lat: 19.0760, lng: 72.8777 } },
  contact: { person: '', phone: '', email: '' },
  operatingHours: {
    weekday: { open: '09:00', close: '18:00' },
    saturday: { open: '09:00', close: '14:00' },
    sunday: { open: '', close: '' } // Closed
  },
  facilities: { loadingBays: 0, parkingSpaces: 0, restrooms: false, fuel: false, mechanic: false, security: false },
  geofence: { radius: 500, alertOnEntry: true, alertOnExit: true },
  linkedClients: [],
  status: 'Active'
};

// --- RATE TEMPLATE TYPES ---

export interface RateTemplate {
  id: string; // RATE-001
  code: string;
  name: string;
  description: string;

  applicableFor: {
    clients: string[]; // ["All"] or specific client IDs
    routes: string[]; // Route IDs
    vehicleTypes: string[];
  };

  rateStructure: {
    baseRate: number;
    unit: 'Per Trip' | 'Per KM' | 'Per Ton';
    minimumCharge: number;
  };

  additionalCharges: {
    loading: number;
    unloading: number;
    detention: { afterHours: number; ratePerHour: number };
    toll: 'Actual' | 'Fixed';
    tollAmount?: number;
  };

  fuelSurcharge: {
    type: 'Fixed' | 'Percentage' | 'Variable';
    baseDieselPrice: number;
    calculation: string;
  };

  specialConditions: {
    bulkDiscount: Array<{ minTrips: number; discountPercent: number }>;
  };

  validity: {
    from: string;
    to: string;
  };

  status: 'Active' | 'Inactive' | 'Draft';
}

export const INITIAL_RATE_TEMPLATE: RateTemplate = {
  id: '',
  code: '',
  name: '',
  description: '',
  applicableFor: { clients: ['All'], routes: [], vehicleTypes: [] },
  rateStructure: { baseRate: 0, unit: 'Per Trip', minimumCharge: 0 },
  additionalCharges: { loading: 0, unloading: 0, detention: { afterHours: 2, ratePerHour: 500 }, toll: 'Actual' },
  fuelSurcharge: { type: 'Variable', baseDieselPrice: 90, calculation: '1% per Rs 1 increase' },
  specialConditions: { bulkDiscount: [] },
  validity: { from: new Date().toISOString().split('T')[0], to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0] },
  status: 'Draft'
};

// --- COMMODITY MASTER TYPES ---

export type CommodityCategory = 'General' | 'FMCG' | 'Chemical' | 'Pharmaceutical' | 'Agricultural' | 'Steel' | 'Electronics' | 'Textile' | 'Automobile' | 'Construction' | 'Other';
export type HandlingInstruction = 'Standard' | 'Fragile' | 'Top Load Only' | 'Keep Upright' | 'Stack Max 2' | 'No Stack';

export interface TemperatureRequirement {
  required: boolean;
  minTemp: number; // Celsius
  maxTemp: number;
  unit: 'C' | 'F';
}

export interface Commodity {
  id: string; // COM-001
  code: string;
  name: string;
  category: CommodityCategory;
  hsn: string; // Harmonized System Nomenclature code (for GST)

  // BRD §4.1 flags
  isHazmat: boolean;
  hazmatClass?: string; // UN hazmat class (1-9)
  hazmatUnNumber?: string;
  isFragile: boolean;
  isTemperatureSensitive: boolean;
  temperatureRequirement: TemperatureRequirement;
  isHighValue: boolean;
  isDimensionalCargo: boolean;

  // Handling
  handlingInstruction: HandlingInstruction;
  specialNotes: string;
  packagingType: string; // Palletized, Loose, Drum, Bag, Box, etc.
  insuranceRequired: boolean;

  // Weight & volume (per unit)
  defaultWeight: number; // kg
  defaultVolume: number; // cubic meters
  unitOfMeasure: 'Kg' | 'Ton' | 'Liter' | 'CBM' | 'Pcs';

  // Restrictions
  permittedVehicleTypes: string[]; // Empty = all allowed
  restrictedZones: string[];
  requiresEscort: boolean;

  status: 'Active' | 'Inactive';
}

export const INITIAL_COMMODITY: Commodity = {
  id: '',
  code: '',
  name: '',
  category: 'General',
  hsn: '',
  isHazmat: false,
  isFragile: false,
  isTemperatureSensitive: false,
  temperatureRequirement: { required: false, minTemp: 2, maxTemp: 8, unit: 'C' },
  isHighValue: false,
  isDimensionalCargo: false,
  handlingInstruction: 'Standard',
  specialNotes: '',
  packagingType: 'Palletized',
  insuranceRequired: false,
  defaultWeight: 0,
  defaultVolume: 0,
  unitOfMeasure: 'Ton',
  permittedVehicleTypes: [],
  restrictedZones: [],
  requiresEscort: false,
  status: 'Active'
};

// --- VEHICLE TYPE MASTER TYPES ---

export type VehicleBodyType = 'Closed' | 'Open' | 'Container' | 'Tanker' | 'Flatbed' | 'Refrigerated' | 'Tip Body' | 'Low Bed';
export type FuelType = 'Diesel' | 'CNG' | 'Electric' | 'LPG';

export interface VehicleTypeSpec {
  id: string; // VT-001
  code: string;
  name: string; // e.g., "20FT Closed Body"
  displayName: string; // e.g., "20 Ft Truck"

  // Dimensions
  bodyType: VehicleBodyType;
  lengthFt: number;
  widthFt: number;
  heightFt: number;

  // Capacity
  grossWeightCapacity: number; // tons
  netPayloadCapacity: number; // tons (after tare weight)
  volumeCapacity: number; // cubic meters
  tareWeight: number; // tons (vehicle empty weight)

  // Requirements
  numAxles: number;
  fuelType: FuelType;
  avgMileage: number; // km/liter
  requiresNationalPermit: boolean;
  requiresOverDimensionPermit: boolean;

  // Commodity restrictions
  permittedCommodities: string[]; // Empty = all allowed
  restrictedCommodities: string[]; // Cannot carry these
  isRefrigerated: boolean;
  isHazmatCertified: boolean;
  isADR: boolean; // European agreement for int'l carriage of dangerous goods

  // Commercial
  standardRatePerKm: number; // Base rate
  standardRatePerTrip: number; // Alternate rate
  detentionRatePerHour: number;

  // e-Way Bill category
  ewayBillVehicleType: string; // As required by GST portal

  status: 'Active' | 'Inactive';
}

export const INITIAL_VEHICLE_TYPE: VehicleTypeSpec = {
  id: '',
  code: '',
  name: '',
  displayName: '',
  bodyType: 'Closed',
  lengthFt: 0,
  widthFt: 0,
  heightFt: 0,
  grossWeightCapacity: 0,
  netPayloadCapacity: 0,
  volumeCapacity: 0,
  tareWeight: 0,
  numAxles: 2,
  fuelType: 'Diesel',
  avgMileage: 4,
  requiresNationalPermit: false,
  requiresOverDimensionPermit: false,
  permittedCommodities: [],
  restrictedCommodities: [],
  isRefrigerated: false,
  isHazmatCertified: false,
  isADR: false,
  standardRatePerKm: 0,
  standardRatePerTrip: 0,
  detentionRatePerHour: 500,
  ewayBillVehicleType: '',
  status: 'Active'
};

