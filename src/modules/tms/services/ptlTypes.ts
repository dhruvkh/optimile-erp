// ============================================================
// PTL Module — Canonical Type Definitions
// Covers: own fleet, leased fleet, market hire, 3PL carrier
// ============================================================

// ─── Status & Enums ──────────────────────────────────────────────────────────

export type DocketStatus =
  | 'Created'
  | 'Pickup Scheduled'
  | 'Picked Up'
  | 'At Origin Hub'
  | 'Manifested'
  | 'In Transit'
  | 'At Destination Hub'
  | 'Out for Delivery'
  | 'Delivery Attempted'
  | 'Delivered'
  | 'RTO Initiated'
  | 'RTO Completed'
  | 'Exception';

export type FleetModel = 'Own' | 'Leased' | 'Market' | 'Carrier';

export type Priority = 'Normal' | 'Urgent' | 'Critical';

export type PaymentType = 'Prepaid' | 'To-Pay' | 'COD';

export type ExceptionType =
  | 'Delayed'
  | 'Lost'
  | 'Damaged'
  | 'Short-Delivery'
  | 'Returned'
  | 'Address-Change'
  | 'Customs-Hold'
  | 'Other';

export type ExceptionSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export type ExceptionStatus =
  | 'Open'
  | 'Under Investigation'
  | 'Resolved'
  | 'Escalated'
  | 'Claim Raised';

export type ManifestStatus = 'Draft' | 'Sealed' | 'Dispatched' | 'Received';

export type LineHaulStatus = 'Planned' | 'Loading' | 'Dispatched' | 'In Transit' | 'Arrived';

export type CarrierStatus = 'Active' | 'Inactive' | 'Blacklisted';

export type RateCardStatus = 'Active' | 'Expired' | 'Draft';

export type VendorType =
  | 'Individual Truck Owner'
  | 'Fleet Owner'
  | 'Transport Agency'
  | 'Broker';

export type RateType = 'Per KG' | 'Per Trip' | 'Per CFT';

// ─── Cargo ───────────────────────────────────────────────────────────────────

export interface CargoPiece {
  id: string;
  length: number;   // cm
  width: number;    // cm
  height: number;   // cm
  weight: number;   // kg per piece
  quantity: number;
}

// ─── PTLDocket ───────────────────────────────────────────────────────────────

export interface PTLDocket {
  // Identity
  id: string;
  docketNumber: string;
  lrNumber?: string;
  bookingDate: string;
  createdBy?: string;

  // Client (linked to PlatformCustomer)
  clientId: string;
  clientName: string;
  clientGSTIN?: string;

  // Route
  pickupAddress: string;
  pickupCity: string;
  pickupPincode: string;
  pickupState: string;
  pickupContact: string;
  pickupPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPincode: string;
  deliveryState: string;
  deliveryContact: string;
  deliveryPhone: string;
  isODAPickup: boolean;
  isODADelivery: boolean;
  isInterstate: boolean;

  // Hubs
  originHubId: string;
  originHubName: string;
  destinationHubId: string;
  destinationHubName: string;

  // Cargo
  commodityType: string;
  commodityDescription?: string;
  pieces: CargoPiece[];
  totalPieces: number;
  actualWeight: number;
  volumetricWeight: number;
  chargeableWeight: number;
  declaredValue: number;
  specialHandling: string[];

  // Compliance
  eWayBillNumber?: string;
  eWayBillExpiry?: string;
  transitInsuranceNumber?: string;
  hsCode?: string;

  // Service options
  priority: Priority;
  paymentType: PaymentType;
  codAmount?: number;
  daccApplied: boolean;
  appointmentDelivery: boolean;
  appointmentDatetime?: string;

  // Fleet assignment
  fleetModel: FleetModel;
  carrierVendorId?: string;
  carrierVendorName?: string;
  carrierRateCardId?: string;
  agreedCarrierRate?: number;
  carrierAdvancePaid?: number;
  carrierBalancePaid?: boolean;
  assignedVehicleId?: string;
  assignedVehiclePlate?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;

  // Dates
  pickupDate: string;
  promisedDeliveryDate: string;
  actualPickupDate?: string;
  actualDeliveryDate?: string;

  // Status
  status: DocketStatus;

  // Operations (filled as docket progresses)
  firstMileVehicleId?: string;
  firstMileVehiclePlate?: string;
  firstMileDriverName?: string;
  manifestNumber?: string;
  lineHaulTripId?: string;
  lineHaulVehiclePlate?: string;
  lastMileVehicleId?: string;
  lastMileVehiclePlate?: string;
  lastMileDriverName?: string;

  // Hub timestamps
  originHubInwardTime?: string;
  originHubOutwardTime?: string;
  destinationHubInwardTime?: string;
  destinationHubOutwardTime?: string;

  // Delivery
  podUploaded?: boolean;
  podUrl?: string;
  receiverName?: string;
  redeliveryAttempts?: number;
  redeliveryReason?: string;
  rtoReason?: string;

  // Revenue charges (what client pays)
  baseFreightCharge: number;
  odaCharge: number;
  fovCharge: number;
  docketCharge: number;
  fuelSurcharge: number;
  codCharge?: number;
  daccChargeAmount?: number;
  appointmentCharge?: number;
  holidayPickupCharge?: number;
  holidayDeliveryCharge?: number;
  demurrageCharge?: number;
  redeliveryChargeAmount?: number;
  stateCharge?: number;
  totalClientCharges: number;

  // Cost (what we pay — fleet or carrier)
  ownFleetFuelCost?: number;
  ownFleetDriverCost?: number;
  ownFleetTollCost?: number;
  ownFleetMaintenanceCost?: number;
  totalOwnFleetCost?: number;
  totalCarrierCost?: number;

  // Finance links
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceStatus?: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  vendorBillId?: string;
  vendorBillNumber?: string;
  costRecorded?: boolean;

  // Exceptions (IDs of linked PTLException records)
  exceptionIds?: string[];

  // Meta
  createdAt: string;
  lastUpdatedAt?: string;
  remarks?: string;
}

// ─── PTLException ─────────────────────────────────────────────────────────────

export interface PTLException {
  id: string;
  docketId: string;
  docketNumber: string;
  clientName: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  description: string;
  reportedAt: string;
  reportedBy: string;
  assignedTo?: string;
  investigationNotes?: string;
  resolution?: string;
  resolvedAt?: string;
  claimAmount?: number;
  claimStatus?: 'Not Raised' | 'Raised' | 'Under Review' | 'Approved' | 'Rejected';
  insurerReference?: string;
  evidenceUrls?: string[];
  escalatedAt?: string;
  escalatedTo?: string;
}

// ─── PTLManifest ──────────────────────────────────────────────────────────────

export interface PTLManifest {
  id: string;
  manifestNumber: string;
  originHubId: string;
  originHubName: string;
  destinationHubId: string;
  destinationHubName: string;
  docketIds: string[];
  totalPieces: number;
  totalWeight: number;
  vehicleType?: string;
  vehiclePlate?: string;
  driverName?: string;
  driverPhone?: string;
  status: ManifestStatus;
  createdAt: string;
  sealedAt?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  lineHaulTripId?: string;
  remarks?: string;
}

// ─── PTLLineHaulTrip ──────────────────────────────────────────────────────────

export interface PTLLineHaulTrip {
  id: string;
  tripNumber: string;
  manifestIds: string[];
  originHubId: string;
  originHubName: string;
  destinationHubId: string;
  destinationHubName: string;
  vehicleId?: string;
  vehiclePlate: string;
  vehicleType: string;
  driverId?: string;
  driverName: string;
  driverPhone?: string;
  status: LineHaulStatus;
  scheduledDeparture: string;
  actualDeparture?: string;
  actualArrival?: string;
  totalDockets: number;
  totalWeight: number;
  remarks?: string;
}

// ─── PTLCarrierVendor ─────────────────────────────────────────────────────────

export interface PTLCarrierVendor {
  id: string;
  name: string;
  vendorType: VendorType;
  contactPerson: string;
  phone: string;
  email?: string;
  gstIn?: string;
  panNumber?: string;
  bankAccount?: string;
  ifscCode?: string;
  bankBeneficiaryName?: string;
  address?: string;
  city?: string;
  state?: string;
  status: CarrierStatus;
  blacklistReason?: string;
  amsVendorId?: string; // link to existing AMS PlatformVendor
  performanceScore?: number;   // 0–100
  totalDockets?: number;
  onTimePercent?: number;
  claimRate?: number;          // %
  avgTransitDays?: number;
  createdAt: string;
}

// ─── PTLClientRateCard ────────────────────────────────────────────────────────

export interface WeightSlab {
  fromKg: number;
  toKg: number;
  ratePerKg: number;
}

export interface PTLClientRateCard {
  id: string;
  clientId: string;
  clientName: string;
  laneName?: string;
  originCity?: string;
  destinationCity?: string;
  weightSlabs: WeightSlab[];
  minimumCharge: number;
  volumetricFactor: number;    // kg per CFT (e.g., 6.0)
  odaRatePerKg: number;
  odaMinPerCon: number;
  fovPercent: number;
  fovMinPerCon: number;
  docketCharge: number;
  fuelSurchargePercent: number;
  baseDieselPrice: number;
  codChargePercent: number;
  daccCharge: number;
  demurragePerConPerDay: number;
  freeStorageDays: number;
  redeliveryMin: number;
  redeliveryPerKg: number;
  appointmentDeliveryPerKg: number;
  appointmentDeliveryMin: number;
  holidaySurcharge: number;
  stateChargeApplied: boolean;
  pdaApplied: boolean;
  ddaApplied: boolean;
  validFrom: string;
  validTo: string;
  status: RateCardStatus;
}

// ─── PTLVendorRateCard ────────────────────────────────────────────────────────

export interface PTLVendorRateCard {
  id: string;
  vendorId: string;
  vendorName: string;
  originCity: string;
  destinationCity: string;
  vehicleType: string;
  capacityTons: number;
  rateType: RateType;
  baseRate: number;
  minimumCharge: number;
  validFrom: string;
  validTo: string;
  status: RateCardStatus;
}

// ─── Finance Bridge ───────────────────────────────────────────────────────────

export interface PTLChargeBreakdown {
  freight: number;
  oda: number;
  fov: number;
  docket: number;
  fuel: number;
  cod?: number;
  dacc?: number;
  appointment?: number;
  holiday?: number;
  demurrage?: number;
  redelivery?: number;
  state?: number;
}

export interface PTLFinanceRevenue {
  docketId: string;
  docketNumber: string;
  lrNumber?: string;
  clientId: string;
  clientName: string;
  clientGSTIN?: string;
  pickupCity: string;
  deliveryCity: string;
  chargeBreakdown: PTLChargeBreakdown;
  totalRevenue: number;
  chargeableWeight: number;
  pieces: number;
  deliveryDate: string;
  isInterstate: boolean;
}

export interface PTLCostBreakdown {
  freight?: number;
  fuel?: number;
  driver?: number;
  toll?: number;
  maintenance?: number;
}

export interface PTLFinanceCost {
  docketId: string;
  docketNumber: string;
  fleetModel: FleetModel;
  vendorId?: string;
  vendorName?: string;
  vehicleId?: string;
  costBreakdown: PTLCostBreakdown;
  totalCost: number;
  advancePaid?: number;
}

// ─── PTL Config ───────────────────────────────────────────────────────────────

export interface PTLConfig {
  docketPrefix: string;
  eWayBillThreshold: number;      // INR — warn if declared value exceeds this
  defaultFreeStorageDays: number;
  enabledFleetModels: FleetModel[];
  transitSLA: Record<string, Record<string, number>>; // origin → dest → days
}

// ─── Zone-Based Rate Card System ─────────────────────────────────────────────

export type ServiceType = 'Surface' | 'Air' | 'Both';
export type ZoneRateCardStatus = 'Draft' | 'Active' | 'Expired' | 'Superseded';

/** A logical zone grouping hub cities and states/areas */
export interface PTLZone {
  code: string;        // e.g. "N1", "S2", "NE1"
  regionName: string;  // Hub cities, e.g. "Delhi, Gurgaon, Noida"
  areaName: string;    // States covered, e.g. "Haryana, Punjab, UP"
  hubCities: string[]; // Normalised city names for lookup
  states: string[];    // State names for ODA classification
}

/** All surcharge & policy fields for a rate card */
export interface PTLRateCardTnC {
  volumetricFactor: number;           // kg per CFT (default 6.00)
  minChargeableSurface: number;       // ₹ min per consignment – surface (default 300)
  minChargeableAir: number;           // ₹ min per consignment – air (default 1350)
  ftcCharge: number;                  // Freight-to-Collect charge ₹ (default 150)
  codCharge: number;                  // COD service charge ₹ (default 150)
  freeStorageDays: number;            // Free storage period in days (default 7)
  demurragePerConPerDay: number;      // ₹/consignment/day (default 100)
  demurragePerKgPerDay: number;       // ₹/kg/day – whichever higher (default 1)
  holidaySurchargePickup: number;     // ₹ on holiday pickup (default 500)
  holidaySurchargeDelivery: number;   // ₹ on holiday delivery (default 500)
  daccCharge: number;                 // DACC charge ₹ (default 200)
  redeliveryMin: number;              // Min re-delivery charge ₹ (default 300)
  redeliveryPerKgPerAttempt: number;  // ₹/kg/attempt (default 5)
  stateChargeApplied: boolean;
  pdaApplied: boolean;                // Pickup ODA applicable
  ddaApplied: boolean;                // Delivery ODA applicable
  odaRatePerKg: number;              // ₹/kg ODA charge (default 4)
  odaMinPerCon: number;              // ₹ min ODA per consignment (default 750)
  fovPercent: number;                 // FOV % of invoice value (default 0.10)
  fovMinPerCon: number;              // ₹ min FOV per consignment (default 100)
  fovMaxLiability: number;           // ₹ liability cap (default 10000)
  appointmentDeliveryPerKg: number;  // ₹/kg appointment delivery (default 4)
  appointmentDeliveryMin: number;    // ₹ min appointment delivery (default 750)
  docketCharge: number;              // ₹ per docket (default 100)
  baseDieselPrice: number;           // Base diesel ₹/litre for fuel surcharge (default 92.72)
}

/** Transit time entry for one origin→destination pair */
export interface PTLTATEntry {
  min: number;    // minimum transit days
  max?: number;   // maximum transit days (if range)
}

/** Comprehensive zone-matrix rate card (carrier-grade) */
export interface PTLZoneRateCard {
  id: string;
  name: string;           // e.g. "Customer ABC – FY2025-26"
  carrierId?: string;
  carrierName?: string;
  customerId?: string;
  customerName?: string;
  serviceType: ServiceType;
  effectiveDate: string;  // ISO date string
  expiryDate: string;     // ISO date string
  currency: 'INR';
  status: ZoneRateCardStatus;
  zones: PTLZone[];
  /** Surface freight rates: surfaceRates[originCode][destCode] = ₹/kg */
  surfaceRates: Record<string, Record<string, number>>;
  /** Air freight rates: airRates[originCode][destCode] = ₹/kg */
  airRates: Record<string, Record<string, number>>;
  /** Transit time matrix: tatMatrix[originCode][destCode] */
  tatMatrix: Record<string, Record<string, PTLTATEntry>>;
  tnc: PTLRateCardTnC;
  version: number;
  supersededBy?: string;    // ID of the card that replaced this one
  parentVersionId?: string; // ID of the card this was cloned from
  createdAt: string;
  updatedAt?: string;
}

// ─── Freight Calculation I/O ──────────────────────────────────────────────────

export interface FreightCalcInput {
  originCity: string;
  destCity: string;
  actualWeightKg: number;
  dimensions?: { l: number; w: number; h: number; unit: 'cm' | 'ft' };
  declaredValue?: number;
  mode: 'surface' | 'air';
  paymentMode: 'prepaid' | 'cod' | 'ftc';
  rateCardId: string;
  currentDieselPrice?: number;  // if omitted, no fuel surcharge added
  flags: {
    isODAOrigin?: boolean;
    isODADestination?: boolean;
    isHolidayPickup?: boolean;
    isHolidayDelivery?: boolean;
    requiresDacc?: boolean;
    requiresAppointmentDelivery?: boolean;
  };
}

export interface FreightBreakdown {
  chargeableWeightKg: number;
  baseRatePerKg: number;
  baseFreight: number;
  minimumApplied: boolean;
  surcharges: {
    odaOrigin?: number;
    odaDestination?: number;
    fov?: number;
    fuelSurcharge?: number;
    codCharge?: number;
    ftcCharge?: number;
    docketCharge: number;
    holidayPickup?: number;
    holidayDelivery?: number;
    daccCharge?: number;
    appointmentDelivery?: number;
  };
  totalFreight: number;
  currency: 'INR';
  tatDays: PTLTATEntry;
  rateCardId: string;
  originZone: string;
  destZone: string;
  originCity: string;
  destCity: string;
  isODAOrigin: boolean;
  isODADestination: boolean;
}
