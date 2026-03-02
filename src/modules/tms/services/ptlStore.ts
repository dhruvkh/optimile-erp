// ============================================================
// PTL Store — localStorage-backed singleton
// Single source of truth for all PTL data: dockets, manifests,
// line haul trips, carriers, rate cards, and finance queues.
// ============================================================

import type {
  PTLDocket, PTLException, PTLManifest, PTLLineHaulTrip,
  PTLCarrierVendor, PTLClientRateCard, PTLVendorRateCard,
  PTLFinanceRevenue, PTLFinanceCost, PTLConfig, DocketStatus,
  PTLZoneRateCard, PTLZone, PTLRateCardTnC, PTLTATEntry,
  ServiceType, ZoneRateCardStatus, FreightCalcInput, FreightBreakdown,
} from './ptlTypes';

export type { DocketStatus };
export type {
  PTLDocket, PTLException, PTLManifest, PTLLineHaulTrip,
  PTLCarrierVendor, PTLClientRateCard, PTLVendorRateCard,
  PTLFinanceRevenue, PTLFinanceCost, PTLConfig,
  FleetModel, Priority, PaymentType, ExceptionType, ExceptionSeverity,
  ExceptionStatus, ManifestStatus, LineHaulStatus, CarrierStatus,
  RateCardStatus, VendorType, RateType, CargoPiece, WeightSlab,
  PTLChargeBreakdown, PTLCostBreakdown,
  PTLZoneRateCard, PTLZone, PTLRateCardTnC, PTLTATEntry,
  ServiceType, ZoneRateCardStatus, FreightCalcInput, FreightBreakdown,
} from './ptlTypes';

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEY_DOCKETS    = 'ptl_dockets_v2';
const KEY_EXCEPTIONS = 'ptl_exceptions_v2';
const KEY_MANIFESTS  = 'ptl_manifests_v2';
const KEY_LINEHAUL   = 'ptl_linehaul_v2';
const KEY_CARRIERS   = 'ptl_carriers_v2';
const KEY_CLIENT_RC  = 'ptl_client_ratecards_v2';
const KEY_VENDOR_RC  = 'ptl_vendor_ratecards_v2';
const KEY_FIN_REV    = 'ptl_finance_revenue_v2';
const KEY_FIN_COST   = 'ptl_finance_cost_v2';
const KEY_CONFIG      = 'ptl_config_v2';
const KEY_SEEDED      = 'ptl_seeded_v2';
const KEY_ZONE_RC     = 'ptl_zone_ratecards_v2';

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_CARRIERS: PTLCarrierVendor[] = [
  { id: 'cv-1', name: 'Shree Ram Transport', vendorType: 'Fleet Owner', contactPerson: 'Ramesh Gupta', phone: '+91-9812345678', email: 'ramesh@shreeram.com', gstIn: '27ABCDE1234F1Z5', panNumber: 'ABCDE1234F', status: 'Active', performanceScore: 88, totalDockets: 342, onTimePercent: 91.2, claimRate: 0.8, avgTransitDays: 2.1, amsVendorId: 'v-001', city: 'Mumbai', state: 'Maharashtra', createdAt: '2025-06-01T00:00:00.000Z' },
  { id: 'cv-2', name: 'Delhi Express Carriers', vendorType: 'Fleet Owner', contactPerson: 'Suresh Verma', phone: '+91-9823456789', email: 'suresh@delhiexpress.com', gstIn: '07FGHIJ5678K2Z6', panNumber: 'FGHIJ5678K', status: 'Active', performanceScore: 76, totalDockets: 198, onTimePercent: 84.3, claimRate: 1.5, avgTransitDays: 2.8, city: 'Delhi', state: 'Delhi', createdAt: '2025-07-15T00:00:00.000Z' },
  { id: 'cv-3', name: 'Balaji Logistics', vendorType: 'Transport Agency', contactPerson: 'Vijay Sharma', phone: '+91-9834567890', gstIn: '29KLMNO9012L3Z7', panNumber: 'KLMNO9012L', status: 'Active', performanceScore: 92, totalDockets: 521, onTimePercent: 94.7, claimRate: 0.4, avgTransitDays: 1.9, city: 'Bangalore', state: 'Karnataka', createdAt: '2025-05-20T00:00:00.000Z' },
  { id: 'cv-4', name: 'Quick Move Brokers', vendorType: 'Broker', contactPerson: 'Anand Patel', phone: '+91-9845678901', email: 'anand@quickmove.in', status: 'Active', performanceScore: 71, totalDockets: 87, onTimePercent: 79.1, claimRate: 2.1, avgTransitDays: 3.2, city: 'Ahmedabad', state: 'Gujarat', createdAt: '2025-09-10T00:00:00.000Z' },
  { id: 'cv-5', name: 'South India Freight', vendorType: 'Transport Agency', contactPerson: 'Krishnamurthy R', phone: '+91-9856789012', gstIn: '33PQRST3456M4Z8', panNumber: 'PQRST3456M', status: 'Active', performanceScore: 85, totalDockets: 276, onTimePercent: 88.6, claimRate: 0.7, avgTransitDays: 2.3, city: 'Chennai', state: 'Tamil Nadu', createdAt: '2025-08-05T00:00:00.000Z' },
  { id: 'cv-6', name: 'Rajesh Truck Owner', vendorType: 'Individual Truck Owner', contactPerson: 'Rajesh Kumar', phone: '+91-9867890123', status: 'Active', performanceScore: 68, totalDockets: 45, onTimePercent: 75.5, claimRate: 3.2, avgTransitDays: 2.9, city: 'Hyderabad', state: 'Telangana', createdAt: '2025-10-01T00:00:00.000Z' },
];

const SEED_CLIENT_RATECARDS: PTLClientRateCard[] = [
  {
    id: 'crc-1', clientId: 'C001', clientName: 'Reliance Industries', laneName: 'Mumbai → Delhi',
    originCity: 'Mumbai', destinationCity: 'Delhi',
    weightSlabs: [{ fromKg: 0, toKg: 100, ratePerKg: 18 }, { fromKg: 100, toKg: 500, ratePerKg: 16 }, { fromKg: 500, toKg: 2000, ratePerKg: 14 }, { fromKg: 2000, toKg: 99999, ratePerKg: 12 }],
    minimumCharge: 1500, volumetricFactor: 6.0, odaRatePerKg: 3, odaMinPerCon: 250, fovPercent: 0.3, fovMinPerCon: 100,
    docketCharge: 150, fuelSurchargePercent: 8, baseDieselPrice: 92, codChargePercent: 1.5, daccCharge: 350,
    demurragePerConPerDay: 200, freeStorageDays: 3, redeliveryMin: 300, redeliveryPerKg: 2,
    appointmentDeliveryPerKg: 1.5, appointmentDeliveryMin: 200, holidaySurcharge: 25,
    stateChargeApplied: true, pdaApplied: true, ddaApplied: true, validFrom: '2026-01-01', validTo: '2026-12-31', status: 'Active',
  },
  {
    id: 'crc-2', clientId: 'C002', clientName: 'Amazon Logistics', laneName: 'All India',
    weightSlabs: [{ fromKg: 0, toKg: 200, ratePerKg: 20 }, { fromKg: 200, toKg: 1000, ratePerKg: 17 }, { fromKg: 1000, toKg: 5000, ratePerKg: 14 }, { fromKg: 5000, toKg: 99999, ratePerKg: 11 }],
    minimumCharge: 2000, volumetricFactor: 6.0, odaRatePerKg: 4, odaMinPerCon: 300, fovPercent: 0.25, fovMinPerCon: 80,
    docketCharge: 200, fuelSurchargePercent: 10, baseDieselPrice: 92, codChargePercent: 1.2, daccCharge: 400,
    demurragePerConPerDay: 250, freeStorageDays: 2, redeliveryMin: 350, redeliveryPerKg: 2.5,
    appointmentDeliveryPerKg: 2, appointmentDeliveryMin: 250, holidaySurcharge: 30,
    stateChargeApplied: false, pdaApplied: false, ddaApplied: false, validFrom: '2026-01-01', validTo: '2026-12-31', status: 'Active',
  },
  {
    id: 'crc-3', clientId: 'C003', clientName: 'Flipkart Supply Chain', laneName: 'All India',
    weightSlabs: [{ fromKg: 0, toKg: 100, ratePerKg: 19 }, { fromKg: 100, toKg: 500, ratePerKg: 16 }, { fromKg: 500, toKg: 2000, ratePerKg: 13 }, { fromKg: 2000, toKg: 99999, ratePerKg: 11 }],
    minimumCharge: 1800, volumetricFactor: 5.0, odaRatePerKg: 3.5, odaMinPerCon: 280, fovPercent: 0.35, fovMinPerCon: 90,
    docketCharge: 175, fuelSurchargePercent: 9, baseDieselPrice: 92, codChargePercent: 1.0, daccCharge: 380,
    demurragePerConPerDay: 220, freeStorageDays: 3, redeliveryMin: 320, redeliveryPerKg: 2.2,
    appointmentDeliveryPerKg: 1.8, appointmentDeliveryMin: 220, holidaySurcharge: 28,
    stateChargeApplied: true, pdaApplied: true, ddaApplied: false, validFrom: '2026-01-01', validTo: '2026-12-31', status: 'Active',
  },
  {
    id: 'crc-4', clientId: 'C004', clientName: 'Delhivery', laneName: 'All India',
    weightSlabs: [{ fromKg: 0, toKg: 50, ratePerKg: 22 }, { fromKg: 50, toKg: 200, ratePerKg: 19 }, { fromKg: 200, toKg: 1000, ratePerKg: 16 }, { fromKg: 1000, toKg: 99999, ratePerKg: 13 }],
    minimumCharge: 1200, volumetricFactor: 6.0, odaRatePerKg: 5, odaMinPerCon: 350, fovPercent: 0.4, fovMinPerCon: 120,
    docketCharge: 120, fuelSurchargePercent: 7, baseDieselPrice: 92, codChargePercent: 1.8, daccCharge: 300,
    demurragePerConPerDay: 180, freeStorageDays: 4, redeliveryMin: 280, redeliveryPerKg: 1.8,
    appointmentDeliveryPerKg: 1.2, appointmentDeliveryMin: 180, holidaySurcharge: 20,
    stateChargeApplied: false, pdaApplied: false, ddaApplied: false, validFrom: '2026-01-01', validTo: '2026-12-31', status: 'Active',
  },
  {
    id: 'crc-5', clientId: 'C005', clientName: 'Mahindra Logistics', laneName: 'Pune → Bangalore',
    originCity: 'Pune', destinationCity: 'Bangalore',
    weightSlabs: [{ fromKg: 0, toKg: 300, ratePerKg: 15 }, { fromKg: 300, toKg: 1500, ratePerKg: 13 }, { fromKg: 1500, toKg: 99999, ratePerKg: 11 }],
    minimumCharge: 2200, volumetricFactor: 6.0, odaRatePerKg: 3, odaMinPerCon: 250, fovPercent: 0.3, fovMinPerCon: 100,
    docketCharge: 180, fuelSurchargePercent: 8, baseDieselPrice: 92, codChargePercent: 1.5, daccCharge: 350,
    demurragePerConPerDay: 210, freeStorageDays: 3, redeliveryMin: 300, redeliveryPerKg: 2,
    appointmentDeliveryPerKg: 1.5, appointmentDeliveryMin: 200, holidaySurcharge: 25,
    stateChargeApplied: true, pdaApplied: false, ddaApplied: false, validFrom: '2026-01-01', validTo: '2026-12-31', status: 'Active',
  },
];

const SEED_VENDOR_RATECARDS: PTLVendorRateCard[] = [
  { id: 'vrc-1', vendorId: 'cv-1', vendorName: 'Shree Ram Transport', originCity: 'Mumbai', destinationCity: 'Delhi', vehicleType: '32 Ft Trailer', capacityTons: 15, rateType: 'Per KG', baseRate: 8, minimumCharge: 12000, validFrom: '2026-01-01', validTo: '2026-12-31', status: 'Active' },
  { id: 'vrc-2', vendorId: 'cv-1', vendorName: 'Shree Ram Transport', originCity: 'Mumbai', destinationCity: 'Bangalore', vehicleType: '32 Ft Trailer', capacityTons: 15, rateType: 'Per KG', baseRate: 9, minimumCharge: 14000, validFrom: '2026-01-01', validTo: '2026-12-31', status: 'Active' },
  { id: 'vrc-3', vendorId: 'cv-3', vendorName: 'Balaji Logistics', originCity: 'Bangalore', destinationCity: 'Chennai', vehicleType: '22 Ft Container', capacityTons: 10, rateType: 'Per KG', baseRate: 6, minimumCharge: 8000, validFrom: '2026-01-01', validTo: '2026-12-31', status: 'Active' },
  { id: 'vrc-4', vendorId: 'cv-5', vendorName: 'South India Freight', originCity: 'Chennai', destinationCity: 'Hyderabad', vehicleType: '17 Ft Mini Truck', capacityTons: 5, rateType: 'Per Trip', baseRate: 18000, minimumCharge: 18000, validFrom: '2026-01-01', validTo: '2026-12-31', status: 'Active' },
];

const SEED_MANIFESTS: PTLManifest[] = [
  { id: 'mfst-1', manifestNumber: 'MFT-MUM-DEL-001', originHubId: 'hub-1', originHubName: 'Mumbai Hub', destinationHubId: 'hub-2', destinationHubName: 'Delhi Hub', docketIds: ['d-006', 'd-007'], totalPieces: 80, totalWeight: 2900, vehicleType: '32 Ft Trailer', vehiclePlate: 'MH-04-ZZ-9900', driverName: 'Mohan Lal', driverPhone: '+91-9810001001', status: 'Dispatched', createdAt: '2026-02-22T18:00:00.000Z', sealedAt: '2026-02-22T19:00:00.000Z', dispatchedAt: '2026-02-22T20:00:00.000Z', lineHaulTripId: 'lht-1' },
  { id: 'mfst-2', manifestNumber: 'MFT-BLR-CHN-001', originHubId: 'hub-3', originHubName: 'Bangalore Hub', destinationHubId: 'hub-4', destinationHubName: 'Chennai Hub', docketIds: ['d-010'], totalPieces: 55, totalWeight: 2200, vehicleType: '22 Ft Container', status: 'Sealed', createdAt: '2026-02-23T16:00:00.000Z', sealedAt: '2026-02-23T17:00:00.000Z' },
  { id: 'mfst-3', manifestNumber: 'MFT-DEL-MUM-001', originHubId: 'hub-2', originHubName: 'Delhi Hub', destinationHubId: 'hub-1', destinationHubName: 'Mumbai Hub', docketIds: ['d-013'], totalPieces: 20, totalWeight: 500, status: 'Draft', createdAt: '2026-02-27T09:00:00.000Z' },
];

const SEED_LINEHAUL: PTLLineHaulTrip[] = [
  { id: 'lht-1', tripNumber: 'LH-MUM-DEL-001', manifestIds: ['mfst-1'], originHubId: 'hub-1', originHubName: 'Mumbai Hub', destinationHubId: 'hub-2', destinationHubName: 'Delhi Hub', vehiclePlate: 'MH-04-ZZ-9900', vehicleType: '32 Ft Trailer', driverName: 'Mohan Lal', driverPhone: '+91-9810001001', status: 'In Transit', scheduledDeparture: '2026-02-22T20:00:00.000Z', actualDeparture: '2026-02-22T20:15:00.000Z', totalDockets: 2, totalWeight: 2900 },
];

const SEED_EXCEPTIONS: PTLException[] = [
  { id: 'exc-1', docketId: 'd-012', docketNumber: 'HYD-DKT-001', clientName: 'Mahindra Logistics', type: 'Delayed', severity: 'Medium', status: 'Open', description: 'Shipment is 2 days past promised delivery date. Last seen at Hyderabad hub.', reportedAt: '2026-02-25T10:00:00.000Z', reportedBy: 'Operations Team' },
  { id: 'exc-2', docketId: 'd-015', docketNumber: 'BLR-DKT-003', clientName: 'Amazon Logistics', type: 'Damaged', severity: 'High', status: 'Under Investigation', description: 'Outer packaging damaged during transit. 3 pieces affected. Customer reported at delivery.', reportedAt: '2026-02-24T14:30:00.000Z', reportedBy: 'Delivery Driver', investigationNotes: 'Packaging photos collected. Claim to be raised.', claimAmount: 15000, claimStatus: 'Not Raised' },
  { id: 'exc-3', docketId: 'd-014', docketNumber: 'MUM-DKT-009', clientName: 'Reliance Industries', type: 'Lost', severity: 'Critical', status: 'Escalated', description: 'Entire docket cannot be located. Missing since in-transit scan at Nagpur transit point.', reportedAt: '2026-02-20T09:00:00.000Z', reportedBy: 'Hub Manager', investigationNotes: 'Police complaint filed. Insurance claim initiated.', claimAmount: 180000, claimStatus: 'Raised', insurerReference: 'INS-2026-0234' },
  { id: 'exc-4', docketId: 'd-003', docketNumber: 'MUM-DKT-003', clientName: 'Flipkart Supply Chain', type: 'Address-Change', severity: 'Low', status: 'Resolved', description: 'Consignee requested address change from Noida Sector 18 to Noida Sector 62.', reportedAt: '2026-02-24T11:00:00.000Z', reportedBy: 'Customer Service', resolution: 'Address updated. DACC charge applied. Delivery rescheduled.', resolvedAt: '2026-02-24T12:00:00.000Z' },
];

const SEED_DOCKETS: PTLDocket[] = [
  // 1. Own Fleet — Created
  {
    id: 'd-001', docketNumber: 'MUM-0227-001', bookingDate: '2026-02-27', createdAt: '2026-02-27T08:00:00.000Z',
    clientId: 'C001', clientName: 'Reliance Industries', clientGSTIN: '27AAGCR4849R1ZS',
    pickupAddress: 'Andheri East, BKC Road', pickupCity: 'Mumbai', pickupPincode: '400069', pickupState: 'Maharashtra',
    pickupContact: 'Ramesh Shah', pickupPhone: '+91-9876543210',
    deliveryAddress: 'Okhla Phase 2, Delhi', deliveryCity: 'Delhi', deliveryPincode: '110020', deliveryState: 'Delhi',
    deliveryContact: 'Suresh Kumar', deliveryPhone: '+91-9876543211',
    isODAPickup: false, isODADelivery: false, isInterstate: true,
    originHubId: 'hub-1', originHubName: 'Mumbai Hub', destinationHubId: 'hub-2', destinationHubName: 'Delhi Hub',
    commodityType: 'Auto Parts', pieces: [{ id: 'p1', length: 60, width: 40, height: 30, weight: 25, quantity: 12 }],
    totalPieces: 12, actualWeight: 300, volumetricWeight: 288, chargeableWeight: 300, declaredValue: 180000, specialHandling: [],
    priority: 'Normal', paymentType: 'Prepaid', daccApplied: false, appointmentDelivery: false,
    fleetModel: 'Own', assignedVehicleId: 'v-001', assignedVehiclePlate: 'MH-04-AB-1234',
    pickupDate: '2026-02-27', promisedDeliveryDate: '2026-03-01', status: 'Created',
    baseFreightCharge: 4800, odaCharge: 0, fovCharge: 540, docketCharge: 150, fuelSurcharge: 384, totalClientCharges: 5874,
    ownFleetFuelCost: 1800, ownFleetDriverCost: 600, ownFleetTollCost: 400, ownFleetMaintenanceCost: 200, totalOwnFleetCost: 3000,
  },
  // 2. Own Fleet — Pickup Scheduled
  {
    id: 'd-002', docketNumber: 'MUM-0227-002', bookingDate: '2026-02-27', createdAt: '2026-02-27T08:30:00.000Z',
    clientId: 'C002', clientName: 'Amazon Logistics', clientGSTIN: '27AABCA7896B1ZS',
    pickupAddress: 'Powai, Hiranandani', pickupCity: 'Mumbai', pickupPincode: '400076', pickupState: 'Maharashtra',
    pickupContact: 'Priya Nair', pickupPhone: '+91-9887654321',
    deliveryAddress: 'Gurgaon Sector 44', deliveryCity: 'Gurgaon', deliveryPincode: '122003', deliveryState: 'Haryana',
    deliveryContact: 'Amit Sharma', deliveryPhone: '+91-9887654322',
    isODAPickup: false, isODADelivery: false, isInterstate: true,
    originHubId: 'hub-1', originHubName: 'Mumbai Hub', destinationHubId: 'hub-2', destinationHubName: 'Delhi Hub',
    commodityType: 'Electronics', pieces: [{ id: 'p1', length: 40, width: 30, height: 20, weight: 5, quantity: 85 }],
    totalPieces: 85, actualWeight: 425, volumetricWeight: 680, chargeableWeight: 680, declaredValue: 520000, specialHandling: ['Fragile'],
    priority: 'Critical', paymentType: 'Prepaid', daccApplied: false, appointmentDelivery: false,
    fleetModel: 'Own', assignedVehiclePlate: 'MH-04-CD-5678',
    pickupDate: '2026-02-27', promisedDeliveryDate: '2026-03-01',
    firstMileVehiclePlate: 'MH-04-CD-5678', firstMileDriverName: 'Ravi Patil',
    status: 'Pickup Scheduled',
    baseFreightCharge: 11560, odaCharge: 0, fovCharge: 1300, docketCharge: 200, fuelSurcharge: 1156, totalClientCharges: 14216,
    ownFleetFuelCost: 4000, ownFleetDriverCost: 1000, ownFleetTollCost: 600, ownFleetMaintenanceCost: 400, totalOwnFleetCost: 6000,
  },
  // 3. Own Fleet — At Origin Hub (with exception)
  {
    id: 'd-003', docketNumber: 'MUM-DKT-003', bookingDate: '2026-02-24', createdAt: '2026-02-24T07:30:00.000Z',
    clientId: 'C003', clientName: 'Flipkart Supply Chain', clientGSTIN: '27AABCF3214D1ZS',
    pickupAddress: 'Bhiwandi Warehouse', pickupCity: 'Mumbai', pickupPincode: '421302', pickupState: 'Maharashtra',
    pickupContact: 'Ganesh Patil', pickupPhone: '+91-9800001111',
    deliveryAddress: 'Noida Sector 18', deliveryCity: 'Noida', deliveryPincode: '201301', deliveryState: 'Uttar Pradesh',
    deliveryContact: 'Deepak Singh', deliveryPhone: '+91-9800001112',
    isODAPickup: false, isODADelivery: false, isInterstate: true,
    originHubId: 'hub-1', originHubName: 'Mumbai Hub', destinationHubId: 'hub-2', destinationHubName: 'Delhi Hub',
    commodityType: 'Apparel', pieces: [{ id: 'p1', length: 50, width: 40, height: 30, weight: 15, quantity: 35 }],
    totalPieces: 35, actualWeight: 525, volumetricWeight: 420, chargeableWeight: 525, declaredValue: 280000, specialHandling: [],
    priority: 'Urgent', paymentType: 'Prepaid', daccApplied: true, appointmentDelivery: false,
    fleetModel: 'Leased', assignedVehiclePlate: 'MH-04-EF-9012',
    pickupDate: '2026-02-24', promisedDeliveryDate: '2026-02-27',
    firstMileVehiclePlate: 'MH-04-EF-9012', firstMileDriverName: 'Kiran More',
    actualPickupDate: '2026-02-24',
    originHubInwardTime: '2026-02-24T14:00:00.000Z',
    status: 'At Origin Hub',
    daccChargeAmount: 380, baseFreightCharge: 8400, odaCharge: 0, fovCharge: 980, docketCharge: 175, fuelSurcharge: 756, totalClientCharges: 10691,
    ownFleetFuelCost: 3200, ownFleetDriverCost: 800, ownFleetTollCost: 500, totalOwnFleetCost: 4500,
    exceptionIds: ['exc-4'],
  },
  // 4. Leased Fleet — Manifested
  {
    id: 'd-004', docketNumber: 'PUN-0223-001', bookingDate: '2026-02-23', createdAt: '2026-02-23T09:00:00.000Z',
    clientId: 'C005', clientName: 'Mahindra Logistics', clientGSTIN: '27AABCM4512E1ZS',
    pickupAddress: 'Hinjewadi Phase 3', pickupCity: 'Pune', pickupPincode: '411057', pickupState: 'Maharashtra',
    pickupContact: 'Sunil Joshi', pickupPhone: '+91-9800002222',
    deliveryAddress: 'Whitefield IT Park', deliveryCity: 'Bangalore', deliveryPincode: '560066', deliveryState: 'Karnataka',
    deliveryContact: 'Anitha Rao', deliveryPhone: '+91-9800002223',
    isODAPickup: false, isODADelivery: false, isInterstate: true,
    originHubId: 'hub-1', originHubName: 'Mumbai Hub', destinationHubId: 'hub-3', destinationHubName: 'Bangalore Hub',
    commodityType: 'Machinery Parts', pieces: [{ id: 'p1', length: 80, width: 60, height: 50, weight: 30, quantity: 22 }],
    totalPieces: 22, actualWeight: 660, volumetricWeight: 528, chargeableWeight: 660, declaredValue: 150000, specialHandling: ['Heavy'],
    priority: 'Normal', paymentType: 'Prepaid', daccApplied: false, appointmentDelivery: false,
    fleetModel: 'Leased', assignedVehiclePlate: 'MH-12-GH-3456', assignedDriverName: 'Sanjay Jadhav',
    pickupDate: '2026-02-23', promisedDeliveryDate: '2026-02-26',
    eWayBillNumber: 'EWB-700012345',
    firstMileVehiclePlate: 'MH-12-GH-3456', firstMileDriverName: 'Sanjay Jadhav',
    actualPickupDate: '2026-02-23',
    originHubInwardTime: '2026-02-23T16:00:00.000Z',
    originHubOutwardTime: '2026-02-23T22:00:00.000Z',
    manifestNumber: 'MFT-MUM-BLR-001',
    status: 'Manifested',
    baseFreightCharge: 9240, odaCharge: 0, fovCharge: 450, docketCharge: 180, fuelSurcharge: 739, totalClientCharges: 10609,
    ownFleetFuelCost: 3500, ownFleetDriverCost: 1000, ownFleetTollCost: 700, totalOwnFleetCost: 5200,
  },
  // 5. Market Fleet — In Transit
  {
    id: 'd-005', docketNumber: 'MUM-0222-005', bookingDate: '2026-02-22', createdAt: '2026-02-22T08:00:00.000Z',
    clientId: 'C001', clientName: 'Reliance Industries',
    pickupAddress: 'Goregaon East, SEEPZ', pickupCity: 'Mumbai', pickupPincode: '400063', pickupState: 'Maharashtra',
    pickupContact: 'Vikram Mehta', pickupPhone: '+91-9800003333',
    deliveryAddress: 'Narela Industrial', deliveryCity: 'Delhi', deliveryPincode: '110040', deliveryState: 'Delhi',
    deliveryContact: 'Ajay Tyagi', deliveryPhone: '+91-9800003334',
    isODAPickup: false, isODADelivery: false, isInterstate: true,
    originHubId: 'hub-1', originHubName: 'Mumbai Hub', destinationHubId: 'hub-2', destinationHubName: 'Delhi Hub',
    commodityType: 'Chemicals', pieces: [{ id: 'p1', length: 70, width: 50, height: 40, weight: 28, quantity: 40 }],
    totalPieces: 40, actualWeight: 1120, volumetricWeight: 933, chargeableWeight: 1120, declaredValue: 350000, specialHandling: ['Hazardous'],
    priority: 'Normal', paymentType: 'Prepaid', daccApplied: false, appointmentDelivery: false,
    fleetModel: 'Market', carrierVendorId: 'cv-4', carrierVendorName: 'Quick Move Brokers', agreedCarrierRate: 15000,
    pickupDate: '2026-02-22', promisedDeliveryDate: '2026-02-25',
    eWayBillNumber: 'EWB-700012346',
    firstMileVehiclePlate: 'MH-01-XY-7890', firstMileDriverName: 'Bala Krishnan',
    actualPickupDate: '2026-02-22',
    originHubInwardTime: '2026-02-22T16:00:00.000Z',
    originHubOutwardTime: '2026-02-22T21:00:00.000Z',
    manifestNumber: 'MFT-MUM-DEL-001', lineHaulTripId: 'lht-1', lineHaulVehiclePlate: 'MH-04-ZZ-9900',
    status: 'In Transit',
    baseFreightCharge: 15680, odaCharge: 0, fovCharge: 1050, docketCharge: 150, fuelSurcharge: 1254, totalClientCharges: 18134,
    totalCarrierCost: 15000,
  },
  // 6. Carrier — In Transit
  {
    id: 'd-006', docketNumber: 'MUM-0222-006', bookingDate: '2026-02-22', createdAt: '2026-02-22T08:30:00.000Z',
    clientId: 'C001', clientName: 'Reliance Industries',
    pickupAddress: 'Goregaon East, Industrial Estate', pickupCity: 'Mumbai', pickupPincode: '400063', pickupState: 'Maharashtra',
    pickupContact: 'Arjun Nair', pickupPhone: '+91-9800004444',
    deliveryAddress: 'Okhla Phase 1', deliveryCity: 'Delhi', deliveryPincode: '110020', deliveryState: 'Delhi',
    deliveryContact: 'Mohan Das', deliveryPhone: '+91-9800004445',
    isODAPickup: false, isODADelivery: false, isInterstate: true,
    originHubId: 'hub-1', originHubName: 'Mumbai Hub', destinationHubId: 'hub-2', destinationHubName: 'Delhi Hub',
    commodityType: 'Steel Bars', pieces: [{ id: 'p1', length: 200, width: 10, height: 10, weight: 50, quantity: 40 }],
    totalPieces: 40, actualWeight: 2000, volumetricWeight: 1333, chargeableWeight: 2000, declaredValue: 400000, specialHandling: ['Heavy'],
    priority: 'Normal', paymentType: 'Prepaid', daccApplied: false, appointmentDelivery: false,
    fleetModel: 'Carrier', carrierVendorId: 'cv-1', carrierVendorName: 'Shree Ram Transport', carrierRateCardId: 'vrc-1', agreedCarrierRate: 16000,
    pickupDate: '2026-02-22', promisedDeliveryDate: '2026-02-25',
    eWayBillNumber: 'EWB-700012347',
    actualPickupDate: '2026-02-22',
    originHubInwardTime: '2026-02-22T17:00:00.000Z',
    originHubOutwardTime: '2026-02-22T21:00:00.000Z',
    manifestNumber: 'MFT-MUM-DEL-001', lineHaulTripId: 'lht-1', lineHaulVehiclePlate: 'MH-04-ZZ-9900',
    status: 'In Transit',
    baseFreightCharge: 24000, odaCharge: 0, fovCharge: 1200, docketCharge: 150, fuelSurcharge: 1920, totalClientCharges: 27270,
    totalCarrierCost: 16000, carrierAdvancePaid: 8000,
  },
  // 7. Leased — At Destination Hub
  {
    id: 'd-007', docketNumber: 'MUM-0222-007', bookingDate: '2026-02-22', createdAt: '2026-02-22T09:00:00.000Z',
    clientId: 'C004', clientName: 'Delhivery',
    pickupAddress: 'Navi Mumbai, Vashi', pickupCity: 'Mumbai', pickupPincode: '400703', pickupState: 'Maharashtra',
    pickupContact: 'Sai Kumar', pickupPhone: '+91-9800005555',
    deliveryAddress: 'Dwarka Sector 21', deliveryCity: 'Delhi', deliveryPincode: '110077', deliveryState: 'Delhi',
    deliveryContact: 'Rajkumar Singh', deliveryPhone: '+91-9800005556',
    isODAPickup: false, isODADelivery: false, isInterstate: true,
    originHubId: 'hub-1', originHubName: 'Mumbai Hub', destinationHubId: 'hub-2', destinationHubName: 'Delhi Hub',
    commodityType: 'Consumer Goods', pieces: [{ id: 'p1', length: 30, width: 20, height: 20, weight: 10, quantity: 18 }],
    totalPieces: 18, actualWeight: 180, volumetricWeight: 72, chargeableWeight: 180, declaredValue: 95000, specialHandling: [],
    priority: 'Normal', paymentType: 'Prepaid', daccApplied: false, appointmentDelivery: false,
    fleetModel: 'Leased', assignedVehiclePlate: 'DL-01-AA-1111',
    pickupDate: '2026-02-22', promisedDeliveryDate: '2026-02-25',
    eWayBillNumber: 'EWB-700012348',
    actualPickupDate: '2026-02-22',
    originHubInwardTime: '2026-02-22T18:00:00.000Z',
    originHubOutwardTime: '2026-02-23T06:00:00.000Z',
    destinationHubInwardTime: '2026-02-24T10:00:00.000Z',
    manifestNumber: 'MFT-MUM-DEL-001',
    status: 'At Destination Hub',
    baseFreightCharge: 3600, odaCharge: 0, fovCharge: 380, docketCharge: 120, fuelSurcharge: 252, totalClientCharges: 4352,
    ownFleetFuelCost: 2000, ownFleetDriverCost: 600, ownFleetTollCost: 400, totalOwnFleetCost: 3000,
  },
  // 8. Market — Out for Delivery
  {
    id: 'd-008', docketNumber: 'DEL-0222-001', bookingDate: '2026-02-22', createdAt: '2026-02-22T09:30:00.000Z',
    clientId: 'C003', clientName: 'Flipkart Supply Chain',
    pickupAddress: 'Rohini Sector 5', pickupCity: 'Delhi', pickupPincode: '110085', pickupState: 'Delhi',
    pickupContact: 'Rahul Tyagi', pickupPhone: '+91-9800006666',
    deliveryAddress: 'Mansarovar Industrial Area', deliveryCity: 'Jaipur', deliveryPincode: '302020', deliveryState: 'Rajasthan',
    deliveryContact: 'Bharat Singh', deliveryPhone: '+91-9800006667',
    isODAPickup: false, isODADelivery: false, isInterstate: true,
    originHubId: 'hub-2', originHubName: 'Delhi Hub', destinationHubId: 'hub-2', destinationHubName: 'Delhi Hub',
    commodityType: 'FMCG', pieces: [{ id: 'p1', length: 25, width: 20, height: 15, weight: 8, quantity: 15 }],
    totalPieces: 15, actualWeight: 120, volumetricWeight: 37, chargeableWeight: 120, declaredValue: 75000, specialHandling: [],
    priority: 'Normal', paymentType: 'To-Pay', daccApplied: false, appointmentDelivery: false,
    fleetModel: 'Market', carrierVendorId: 'cv-2', carrierVendorName: 'Delhi Express Carriers', agreedCarrierRate: 5500,
    pickupDate: '2026-02-22', promisedDeliveryDate: '2026-02-24',
    actualPickupDate: '2026-02-22',
    originHubInwardTime: '2026-02-22T14:00:00.000Z',
    originHubOutwardTime: '2026-02-23T08:00:00.000Z',
    destinationHubInwardTime: '2026-02-23T20:00:00.000Z',
    destinationHubOutwardTime: '2026-02-24T07:00:00.000Z',
    lastMileVehiclePlate: 'RJ-14-CD-5678', lastMileDriverName: 'Prakash Rajput',
    status: 'Out for Delivery',
    baseFreightCharge: 2280, odaCharge: 0, fovCharge: 300, docketCharge: 175, fuelSurcharge: 182, totalClientCharges: 2937,
    totalCarrierCost: 5500,
  },
  // 9. Carrier — Delivery Attempted
  {
    id: 'd-009', docketNumber: 'BLR-0222-001', bookingDate: '2026-02-22', createdAt: '2026-02-22T10:00:00.000Z',
    clientId: 'C002', clientName: 'Amazon Logistics',
    pickupAddress: 'Electronic City Phase 1', pickupCity: 'Bangalore', pickupPincode: '560100', pickupState: 'Karnataka',
    pickupContact: 'Suresh Nair', pickupPhone: '+91-9800007777',
    deliveryAddress: 'Sriperumbudur Phase 2', deliveryCity: 'Chennai', deliveryPincode: '602105', deliveryState: 'Tamil Nadu',
    deliveryContact: 'Vijayalakshmi S', deliveryPhone: '+91-9800007778',
    isODAPickup: false, isODADelivery: true, isInterstate: true,
    originHubId: 'hub-3', originHubName: 'Bangalore Hub', destinationHubId: 'hub-4', destinationHubName: 'Chennai Hub',
    commodityType: 'Electronics', pieces: [{ id: 'p1', length: 50, width: 40, height: 30, weight: 20, quantity: 55 }],
    totalPieces: 55, actualWeight: 1100, volumetricWeight: 2200, chargeableWeight: 2200, declaredValue: 620000, specialHandling: ['Fragile'],
    priority: 'Urgent', paymentType: 'Prepaid', daccApplied: false, appointmentDelivery: true, appointmentDatetime: '2026-02-24T10:00:00.000Z',
    fleetModel: 'Carrier', carrierVendorId: 'cv-3', carrierVendorName: 'Balaji Logistics', agreedCarrierRate: 13200,
    pickupDate: '2026-02-22', promisedDeliveryDate: '2026-02-24',
    actualPickupDate: '2026-02-22',
    originHubInwardTime: '2026-02-22T15:00:00.000Z',
    originHubOutwardTime: '2026-02-23T07:00:00.000Z',
    destinationHubInwardTime: '2026-02-23T19:00:00.000Z',
    destinationHubOutwardTime: '2026-02-24T07:00:00.000Z',
    redeliveryAttempts: 1, redeliveryReason: 'Consignee not available — plant holiday',
    odaCharge: 4400, appointmentCharge: 3300, baseFreightCharge: 30800, fovCharge: 1550, docketCharge: 200, fuelSurcharge: 3080, totalClientCharges: 43330,
    totalCarrierCost: 13200, carrierAdvancePaid: 6600,
    status: 'Delivery Attempted',
  },
  // 10. Own Fleet — Delivered ✓
  {
    id: 'd-010', docketNumber: 'MUM-0220-009', bookingDate: '2026-02-20', createdAt: '2026-02-20T08:00:00.000Z',
    clientId: 'C005', clientName: 'Mahindra Logistics',
    pickupAddress: 'Thane West, Ghodbunder Rd', pickupCity: 'Mumbai', pickupPincode: '400615', pickupState: 'Maharashtra',
    pickupContact: 'Dinesh Kulkarni', pickupPhone: '+91-9800008888',
    deliveryAddress: 'Shamshabad Near RGIA', deliveryCity: 'Hyderabad', deliveryPincode: '501218', deliveryState: 'Telangana',
    deliveryContact: 'Raj Kumar', deliveryPhone: '+91-9800008889',
    isODAPickup: false, isODADelivery: false, isInterstate: true,
    originHubId: 'hub-1', originHubName: 'Mumbai Hub', destinationHubId: 'hub-5', destinationHubName: 'Hyderabad Hub',
    commodityType: 'Industrial Equipment', pieces: [{ id: 'p1', length: 100, width: 80, height: 60, weight: 27, quantity: 28 }],
    totalPieces: 28, actualWeight: 756, volumetricWeight: 672, chargeableWeight: 756, declaredValue: 190000, specialHandling: [],
    priority: 'Normal', paymentType: 'Prepaid', daccApplied: false, appointmentDelivery: false,
    fleetModel: 'Own', assignedVehiclePlate: 'MH-14-ZZ-1234',
    pickupDate: '2026-02-20', promisedDeliveryDate: '2026-02-23',
    actualPickupDate: '2026-02-20', actualDeliveryDate: '2026-02-23',
    podUploaded: true, receiverName: 'Raj Kumar',
    invoiceNumber: 'PTL-INV-001', invoiceStatus: 'Paid',
    status: 'Delivered',
    baseFreightCharge: 9828, odaCharge: 0, fovCharge: 570, docketCharge: 180, fuelSurcharge: 786, totalClientCharges: 11364,
    ownFleetFuelCost: 3800, ownFleetDriverCost: 900, ownFleetTollCost: 700, totalOwnFleetCost: 5400,
    costRecorded: true,
  },
  // 11. Carrier — Delivered
  {
    id: 'd-011', docketNumber: 'DEL-0222-002', bookingDate: '2026-02-22', createdAt: '2026-02-22T10:00:00.000Z',
    clientId: 'C002', clientName: 'Amazon Logistics',
    pickupAddress: 'Okhla Industrial Estate', pickupCity: 'Delhi', pickupPincode: '110020', pickupState: 'Delhi',
    pickupContact: 'Pankaj Sharma', pickupPhone: '+91-9800009999',
    deliveryAddress: 'Andheri West, Lokhandwala', deliveryCity: 'Mumbai', deliveryPincode: '400053', deliveryState: 'Maharashtra',
    deliveryContact: 'Neha Joshi', deliveryPhone: '+91-9800009998',
    isODAPickup: false, isODADelivery: false, isInterstate: true,
    originHubId: 'hub-2', originHubName: 'Delhi Hub', destinationHubId: 'hub-1', destinationHubName: 'Mumbai Hub',
    commodityType: 'Consumer Electronics', pieces: [{ id: 'p1', length: 35, width: 25, height: 20, weight: 12, quantity: 20 }],
    totalPieces: 20, actualWeight: 240, volumetricWeight: 292, chargeableWeight: 292, declaredValue: 120000, specialHandling: ['Fragile'],
    priority: 'Normal', paymentType: 'Prepaid', daccApplied: false, appointmentDelivery: false,
    fleetModel: 'Carrier', carrierVendorId: 'cv-1', carrierVendorName: 'Shree Ram Transport', agreedCarrierRate: 6000,
    pickupDate: '2026-02-22', promisedDeliveryDate: '2026-02-25',
    actualPickupDate: '2026-02-22', actualDeliveryDate: '2026-02-25',
    podUploaded: true, receiverName: 'Neha Joshi',
    invoiceNumber: 'PTL-INV-002', invoiceStatus: 'Sent',
    status: 'Delivered',
    baseFreightCharge: 5840, odaCharge: 0, fovCharge: 360, docketCharge: 200, fuelSurcharge: 584, totalClientCharges: 6984,
    totalCarrierCost: 6000, carrierAdvancePaid: 3000, carrierBalancePaid: true, costRecorded: true,
  },
  // 12. Exception — Delayed
  {
    id: 'd-012', docketNumber: 'HYD-DKT-001', bookingDate: '2026-02-20', createdAt: '2026-02-20T11:00:00.000Z',
    clientId: 'C005', clientName: 'Mahindra Logistics',
    pickupAddress: 'HITEC City, Hyderabad', pickupCity: 'Hyderabad', pickupPincode: '500081', pickupState: 'Telangana',
    pickupContact: 'Venkat Rao', pickupPhone: '+91-9800010000',
    deliveryAddress: 'Kochi Port Area', deliveryCity: 'Kochi', deliveryPincode: '682009', deliveryState: 'Kerala',
    deliveryContact: 'Thomas John', deliveryPhone: '+91-9800010001',
    isODAPickup: false, isODADelivery: true, isInterstate: true,
    originHubId: 'hub-5', originHubName: 'Hyderabad Hub', destinationHubId: 'hub-4', destinationHubName: 'Chennai Hub',
    commodityType: 'Automotive Parts', pieces: [{ id: 'p1', length: 60, width: 40, height: 30, weight: 22, quantity: 24 }],
    totalPieces: 24, actualWeight: 528, volumetricWeight: 432, chargeableWeight: 528, declaredValue: 210000, specialHandling: [],
    priority: 'Urgent', paymentType: 'Prepaid', daccApplied: false, appointmentDelivery: false,
    fleetModel: 'Market', carrierVendorId: 'cv-5', carrierVendorName: 'South India Freight', agreedCarrierRate: 14000,
    pickupDate: '2026-02-20', promisedDeliveryDate: '2026-02-23',
    actualPickupDate: '2026-02-20',
    originHubInwardTime: '2026-02-20T18:00:00.000Z',
    originHubOutwardTime: '2026-02-21T08:00:00.000Z',
    destinationHubInwardTime: '2026-02-22T12:00:00.000Z',
    odaCharge: 1584, baseFreightCharge: 7392, fovCharge: 630, docketCharge: 180, fuelSurcharge: 591, totalClientCharges: 10377,
    totalCarrierCost: 14000,
    status: 'Exception', exceptionIds: ['exc-1'],
  },
  // 13. RTO Initiated
  {
    id: 'd-013', docketNumber: 'MUM-DKT-009', bookingDate: '2026-02-15', createdAt: '2026-02-15T09:00:00.000Z',
    clientId: 'C001', clientName: 'Reliance Industries',
    pickupAddress: 'Worli Sea Face', pickupCity: 'Mumbai', pickupPincode: '400018', pickupState: 'Maharashtra',
    pickupContact: 'Ashok Shah', pickupPhone: '+91-9800011111',
    deliveryAddress: 'Noida Sector 62 Tech Park', deliveryCity: 'Noida', deliveryPincode: '201309', deliveryState: 'Uttar Pradesh',
    deliveryContact: 'Sanjay Gupta', deliveryPhone: '+91-9800011112',
    isODAPickup: false, isODADelivery: false, isInterstate: true,
    originHubId: 'hub-1', originHubName: 'Mumbai Hub', destinationHubId: 'hub-2', destinationHubName: 'Delhi Hub',
    commodityType: 'Office Equipment', pieces: [{ id: 'p1', length: 80, width: 60, height: 40, weight: 30, quantity: 5 }],
    totalPieces: 5, actualWeight: 150, volumetricWeight: 128, chargeableWeight: 150, declaredValue: 80000, specialHandling: [],
    priority: 'Normal', paymentType: 'To-Pay', daccApplied: false, appointmentDelivery: false,
    fleetModel: 'Own', assignedVehiclePlate: 'DL-01-BB-2222',
    pickupDate: '2026-02-15', promisedDeliveryDate: '2026-02-18',
    actualPickupDate: '2026-02-15',
    redeliveryAttempts: 3, redeliveryReason: 'Consignee address closed permanently',
    rtoReason: 'Three delivery attempts failed — address closed',
    status: 'RTO Initiated',
    baseFreightCharge: 2700, odaCharge: 0, fovCharge: 240, docketCharge: 150, fuelSurcharge: 216, redeliveryChargeAmount: 900, totalClientCharges: 4206,
    ownFleetFuelCost: 1600, ownFleetDriverCost: 500, ownFleetTollCost: 300, totalOwnFleetCost: 2400,
    exceptionIds: ['exc-3'],
  },
  // 14. Carrier — Exception (Lost)
  {
    id: 'd-014', docketNumber: 'BLR-DKT-003', bookingDate: '2026-02-18', createdAt: '2026-02-18T10:00:00.000Z',
    clientId: 'C002', clientName: 'Amazon Logistics',
    pickupAddress: 'HSR Layout, Bangalore', pickupCity: 'Bangalore', pickupPincode: '560102', pickupState: 'Karnataka',
    pickupContact: 'Priya Menon', pickupPhone: '+91-9800012222',
    deliveryAddress: 'Gachibowli, Hyderabad', deliveryCity: 'Hyderabad', deliveryPincode: '500032', deliveryState: 'Telangana',
    deliveryContact: 'Arjun Reddy', deliveryPhone: '+91-9800012223',
    isODAPickup: false, isODADelivery: false, isInterstate: true,
    originHubId: 'hub-3', originHubName: 'Bangalore Hub', destinationHubId: 'hub-5', destinationHubName: 'Hyderabad Hub',
    commodityType: 'Electronics', pieces: [{ id: 'p1', length: 45, width: 35, height: 25, weight: 15, quantity: 12 }],
    totalPieces: 12, actualWeight: 180, volumetricWeight: 243, chargeableWeight: 243, declaredValue: 95000, specialHandling: ['Fragile'],
    priority: 'Normal', paymentType: 'Prepaid', daccApplied: false, appointmentDelivery: false,
    fleetModel: 'Carrier', carrierVendorId: 'cv-6', carrierVendorName: 'Rajesh Truck Owner', agreedCarrierRate: 7000,
    pickupDate: '2026-02-18', promisedDeliveryDate: '2026-02-20',
    actualPickupDate: '2026-02-18',
    originHubInwardTime: '2026-02-18T18:00:00.000Z',
    baseFreightCharge: 4617, odaCharge: 0, fovCharge: 285, docketCharge: 200, fuelSurcharge: 461, totalClientCharges: 5563,
    totalCarrierCost: 7000,
    status: 'Exception', exceptionIds: ['exc-2'],
  },
  // 15. Own Fleet — Delivered with all costs
  {
    id: 'd-015', docketNumber: 'BLR-0221-001', bookingDate: '2026-02-21', createdAt: '2026-02-21T09:00:00.000Z',
    clientId: 'C003', clientName: 'Flipkart Supply Chain',
    pickupAddress: 'Koramangala 4th Block', pickupCity: 'Bangalore', pickupPincode: '560034', pickupState: 'Karnataka',
    pickupContact: 'Rohan D\'Souza', pickupPhone: '+91-9800013333',
    deliveryAddress: 'Begumpet, Hyderabad', deliveryCity: 'Hyderabad', deliveryPincode: '500016', deliveryState: 'Telangana',
    deliveryContact: 'Sameer Khan', deliveryPhone: '+91-9800013334',
    isODAPickup: false, isODADelivery: false, isInterstate: true,
    originHubId: 'hub-3', originHubName: 'Bangalore Hub', destinationHubId: 'hub-5', destinationHubName: 'Hyderabad Hub',
    commodityType: 'Garments', pieces: [{ id: 'p1', length: 40, width: 30, height: 25, weight: 4, quantity: 8 }],
    totalPieces: 8, actualWeight: 32, volumetricWeight: 40, chargeableWeight: 40, declaredValue: 32000, specialHandling: [],
    priority: 'Normal', paymentType: 'Prepaid', daccApplied: false, appointmentDelivery: false,
    fleetModel: 'Own', assignedVehiclePlate: 'KA-03-AB-5678',
    pickupDate: '2026-02-21', promisedDeliveryDate: '2026-02-23',
    actualPickupDate: '2026-02-21', actualDeliveryDate: '2026-02-23',
    podUploaded: true, receiverName: 'Sameer Khan',
    invoiceNumber: 'PTL-INV-003', invoiceStatus: 'Draft',
    status: 'Delivered',
    baseFreightCharge: 880, odaCharge: 0, fovCharge: 96, docketCharge: 175, fuelSurcharge: 70, totalClientCharges: 1221,
    ownFleetFuelCost: 600, ownFleetDriverCost: 300, ownFleetTollCost: 150, totalOwnFleetCost: 1050,
    costRecorded: false,
  },
];

// ─── Zone Rate Card Seed Data ─────────────────────────────────────────────────

const DEFAULT_TNC: PTLRateCardTnC = {
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

const SEED_ZONES: PTLZone[] = [
  { code: 'C1', regionName: 'Bhopal, Indore, Raipur', areaName: '—', hubCities: ['bhopal', 'indore', 'raipur'], states: [] },
  { code: 'C2', regionName: '—', areaName: 'Chattisgarh, Madhya Pradesh', hubCities: [], states: ['chattisgarh', 'madhya pradesh', 'mp', 'cg'] },
  { code: 'E1', regionName: 'Bhubaneshwar, Jamshedpur, Kolkata, Patna', areaName: '—', hubCities: ['bhubaneshwar', 'bhubaneswar', 'jamshedpur', 'kolkata', 'calcutta', 'patna'], states: [] },
  { code: 'E2', regionName: '—', areaName: 'Bihar, Jharkhand, Odisha, West Bengal', hubCities: [], states: ['bihar', 'jharkhand', 'odisha', 'orissa', 'west bengal'] },
  { code: 'N1', regionName: 'Chandigarh, Delhi, Faridabad, Ghaziabad, Gurgaon, Lucknow, Ludhiana, Mohali, Noida, Sahibabad', areaName: '—', hubCities: ['chandigarh', 'delhi', 'new delhi', 'faridabad', 'ghaziabad', 'gurgaon', 'gurugram', 'lucknow', 'ludhiana', 'mohali', 'noida', 'sahibabad'], states: [] },
  { code: 'N2', regionName: '—', areaName: 'Haryana, Punjab, Rajasthan, Uttar Pradesh, Uttarakhand', hubCities: [], states: ['haryana', 'punjab', 'rajasthan', 'uttar pradesh', 'up', 'uttarakhand', 'uttaranchal'] },
  { code: 'N3', regionName: '—', areaName: 'Himachal Pradesh, Jammu And Kashmir', hubCities: [], states: ['himachal pradesh', 'hp', 'jammu and kashmir', 'jammu & kashmir', 'jk', 'ladakh'] },
  { code: 'NE1', regionName: 'Guwahati', areaName: '—', hubCities: ['guwahati', 'gauhati'], states: [] },
  { code: 'NE2', regionName: '—', areaName: 'Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura', hubCities: [], states: ['arunachal pradesh', 'assam', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'sikkim', 'tripura'] },
  { code: 'S1', regionName: 'Bangalore, Chennai, Hyderabad, Secunderabad, Sriperumbudur', areaName: '—', hubCities: ['bangalore', 'bengaluru', 'chennai', 'madras', 'hyderabad', 'secunderabad', 'sriperumbudur'], states: [] },
  { code: 'S2', regionName: '—', areaName: 'Andhra Pradesh, Karnataka, Puducherry, Tamil Nadu, Telangana', hubCities: [], states: ['andhra pradesh', 'ap', 'karnataka', 'puducherry', 'pondicherry', 'tamil nadu', 'tn', 'telangana', 'ts'] },
  { code: 'S3', regionName: '—', areaName: 'Kerala', hubCities: [], states: ['kerala'] },
  { code: 'W1', regionName: 'Ahmedabad, Baroda, Bhiwandi, Mumbai, Pune, Thane', areaName: '—', hubCities: ['ahmedabad', 'baroda', 'vadodara', 'bhiwandi', 'mumbai', 'bombay', 'pune', 'thane'], states: [] },
  { code: 'W2', regionName: '—', areaName: 'Dadra And Nagar Haveli, Daman And Diu, Goa, Gujarat, Maharashtra', hubCities: [], states: ['dadra and nagar haveli', 'daman and diu', 'goa', 'gujarat', 'maharashtra'] },
];

// Full 14×14 surface rate matrix (₹/kg) — zone order: C1 C2 E1 E2 N1 N2 N3 NE1 NE2 S1 S2 S3 W1 W2
const _zones14 = ['C1','C2','E1','E2','N1','N2','N3','NE1','NE2','S1','S2','S3','W1','W2'];
const _surfRows: number[][] = [
  // C1  C2    E1     E2    N1    N2    N3   NE1   NE2    S1    S2    S3    W1    W2
  [9.35, 9.90,11.55,14.85, 9.90,11.00,12.10,20.35,25.30,10.45,11.00,12.10,10.45,10.45],
  [9.35, 9.35,14.85,14.85,11.00,11.00,13.75,25.30,28.05,11.00,11.55,12.65,10.45,10.45],
  [11.55,14.85, 9.35, 9.90,11.55,12.65,14.85,18.15,22.00,12.10,12.65,13.75,12.10,12.10],
  [14.85,14.85, 9.35, 9.35,14.85,14.85,16.50,22.00,25.30,14.85,14.85,16.50,14.85,14.85],
  [9.90,11.00,11.55,14.85, 9.35, 9.90,11.00,18.15,22.00,10.45,11.00,12.10,10.45,10.45],
  [11.00,11.00,12.65,14.85, 9.35, 9.35,11.00,20.35,25.30,11.00,11.55,12.65,11.00,11.00],
  [12.10,13.75,14.85,16.50,11.00,11.00,11.00,22.00,27.50,14.85,16.50,18.15,14.85,14.85],
  [20.35,25.30,18.15,22.00,18.15,20.35,22.00,11.00,14.85,22.00,25.30,27.50,22.00,22.00],
  [25.30,28.05,22.00,25.30,22.00,25.30,27.50,14.85,14.85,27.50,28.05,30.25,25.30,25.30],
  [10.45,11.00,12.10,14.85,10.45,11.00,14.85,22.00,27.50, 9.35, 9.90,11.00,10.45,10.45],
  [11.00,11.55,12.65,14.85,11.00,11.55,16.50,25.30,28.05, 9.35, 9.35,11.00,11.00,11.00],
  [12.10,12.65,13.75,16.50,12.10,12.65,18.15,27.50,30.25,11.00,11.00,11.00,12.10,12.10],
  [10.45,10.45,12.10,14.85,10.45,11.00,14.85,22.00,25.30,10.45,11.00,12.10, 9.35, 9.90],
  [10.45,10.45,12.10,14.85,10.45,11.00,14.85,22.00,25.30,10.45,11.00,12.10, 9.35, 9.35],
];
const _airRows: number[][] = [
  [55.00,49.50,82.50,89.10,68.20,74.80,85.80,143.00,176.00,71.50,77.00,88.00,60.50,66.00],
  [49.50,49.50,89.10,89.10,74.80,74.80,96.25,176.00,196.35,77.00,82.50,93.50,66.00,66.00],
  [82.50,89.10,55.00,60.50,82.50,93.50,107.25,126.50,154.00,88.00,93.50,104.50,82.50,82.50],
  [89.10,89.10,60.50,55.00,89.10,96.25,115.50,154.00,176.00,96.25,96.25,115.50,89.10,89.10],
  [68.20,74.80,82.50,89.10,55.00,60.50,71.50,126.50,154.00,71.50,77.00,88.00,66.00,66.00],
  [74.80,74.80,93.50,96.25,60.50,55.00,74.80,143.00,176.00,77.00,82.50,93.50,74.80,74.80],
  [85.80,96.25,107.25,115.50,71.50,74.80,66.00,154.00,192.50,107.25,115.50,132.00,107.25,107.25],
  [143.00,176.00,126.50,154.00,126.50,143.00,154.00,66.00,107.25,154.00,176.00,192.50,154.00,154.00],
  [176.00,196.35,154.00,176.00,154.00,176.00,192.50,107.25,99.00,192.50,196.35,214.50,176.00,176.00],
  [71.50,77.00,88.00,96.25,71.50,77.00,107.25,154.00,192.50,55.00,60.50,71.50,66.00,66.00],
  [77.00,82.50,93.50,96.25,77.00,82.50,115.50,176.00,196.35,60.50,55.00,71.50,77.00,77.00],
  [88.00,93.50,104.50,115.50,88.00,93.50,132.00,192.50,214.50,71.50,71.50,66.00,88.00,88.00],
  [60.50,66.00,82.50,89.10,66.00,74.80,107.25,154.00,176.00,66.00,77.00,88.00,55.00,60.50],
  [66.00,66.00,82.50,89.10,66.00,74.80,107.25,154.00,176.00,66.00,77.00,88.00,60.50,55.00],
];
const _tatRows: number[][] = [
  [1,2,3,4,3,3,5,7,10,3,4,5,2,3],
  [2,1,4,4,3,3,5,8,10,4,4,5,3,3],
  [3,4,1,2,4,4,6,5,8,4,5,6,4,4],
  [4,4,2,1,4,5,6,6,8,5,5,6,4,5],
  [3,3,4,4,1,2,3,7,9,4,4,6,3,3],
  [3,3,4,5,2,1,4,7,10,5,5,6,4,4],
  [5,5,6,6,3,4,1,9,12,6,6,8,5,5],
  [7,8,5,6,7,7,9,1,3,8,8,10,8,8],
  [10,10,8,8,9,10,12,3,1,10,10,12,10,10],
  [3,4,4,5,4,5,6,8,10,1,2,3,3,3],
  [4,4,5,5,4,5,6,8,10,2,1,3,3,4],
  [5,5,6,6,6,6,8,10,12,3,3,1,4,4],
  [2,3,4,4,3,4,5,8,10,3,3,4,1,2],
  [3,3,4,5,3,4,5,8,10,3,4,4,2,1],
];

function buildMatrix<T>(rows: T[][]): Record<string, Record<string, T>> {
  const m: Record<string, Record<string, T>> = {};
  _zones14.forEach((o, i) => {
    m[o] = {};
    _zones14.forEach((d, j) => { m[o][d] = rows[i][j]; });
  });
  return m;
}

const SEED_ZONE_RATECARDS: PTLZoneRateCard[] = [
  // ── Carrier-owned rate cards (used for vendor cost calculation)
  {
    id: 'zrc-1',
    name: 'Shree Ram Transport – Network Rate Card FY2025-26',
    carrierId: 'cv-1',
    carrierName: 'Shree Ram Transport',
    serviceType: 'Both',
    effectiveDate: '2025-04-01',
    expiryDate: '2026-03-31',
    currency: 'INR',
    status: 'Active',
    zones: SEED_ZONES,
    surfaceRates: buildMatrix(_surfRows),
    airRates: buildMatrix(_airRows),
    tatMatrix: buildMatrix(_tatRows.map(r => r.map(v => ({ min: v })))),
    tnc: { ...DEFAULT_TNC },
    version: 1,
    createdAt: '2025-04-01T00:00:00.000Z',
  },
  {
    id: 'zrc-draft-1',
    name: 'Balaji Logistics – Carrier Negotiation Draft FY2026-27',
    carrierId: 'cv-3',
    carrierName: 'Balaji Logistics',
    serviceType: 'Surface',
    effectiveDate: '2026-04-01',
    expiryDate: '2027-03-31',
    currency: 'INR',
    status: 'Draft',
    zones: SEED_ZONES,
    surfaceRates: buildMatrix(_surfRows.map(r => r.map(v => v * 0.95))),
    airRates: {},
    tatMatrix: buildMatrix(_tatRows.map(r => r.map(v => ({ min: v })))),
    tnc: { ...DEFAULT_TNC },
    version: 1,
    createdAt: '2026-02-01T00:00:00.000Z',
  },
  // ── Customer-specific rate cards (used for client billing)
  // Customer IDs match masterDataStore seed order: CUS-00101 counter starts at 100, increments before use
  {
    id: 'zrc-cust-1',
    name: 'Tata Steel – PTL Rate Card FY2025-26',
    customerId: 'CUS-00101',   // Tata Steel Limited (1st seeded customer)
    customerName: 'Tata Steel Limited',
    serviceType: 'Both',
    effectiveDate: '2025-04-01',
    expiryDate: '2026-03-31',
    currency: 'INR',
    status: 'Active',
    zones: SEED_ZONES,
    surfaceRates: buildMatrix(_surfRows.map(r => r.map(v => v * 0.97))), // 3% volume discount
    airRates: buildMatrix(_airRows),
    tatMatrix: buildMatrix(_tatRows.map(r => r.map(v => ({ min: v })))),
    tnc: { ...DEFAULT_TNC, fuelSurchargeRate: 12, fovRate: 0.04, minChargeableSurface: 20 },
    version: 1,
    createdAt: '2025-04-01T00:00:00.000Z',
  },
  {
    id: 'zrc-cust-2',
    name: 'Hindustan Unilever – PTL Rate Card FY2025-26',
    customerId: 'CUS-00102',   // Hindustan Unilever (2nd seeded customer)
    customerName: 'Hindustan Unilever',
    serviceType: 'Both',
    effectiveDate: '2025-04-01',
    expiryDate: '2026-03-31',
    currency: 'INR',
    status: 'Active',
    zones: SEED_ZONES,
    surfaceRates: buildMatrix(_surfRows.map(r => r.map(v => v * 0.95))), // 5% volume discount – high volume shipper
    airRates: buildMatrix(_airRows.map(r => r.map(v => v * 0.97))),
    tatMatrix: buildMatrix(_tatRows.map(r => r.map(v => ({ min: v })))),
    tnc: { ...DEFAULT_TNC, fuelSurchargeRate: 11, fovRate: 0.035, docketCharge: 75, minChargeableSurface: 10 },
    version: 1,
    createdAt: '2025-04-01T00:00:00.000Z',
  },
  {
    id: 'zrc-cust-3',
    name: 'Reliance Retail – PTL Surface Rate Card FY2025-26',
    customerId: 'CUS-00104',   // Reliance Retail (4th seeded customer)
    customerName: 'Reliance Retail',
    serviceType: 'Surface',
    effectiveDate: '2025-04-01',
    expiryDate: '2026-03-31',
    currency: 'INR',
    status: 'Active',
    zones: SEED_ZONES,
    surfaceRates: buildMatrix(_surfRows.map(r => r.map(v => v * 0.93))), // 7% discount – largest volume
    airRates: {},
    tatMatrix: buildMatrix(_tatRows.map(r => r.map(v => ({ min: v })))),
    tnc: { ...DEFAULT_TNC, fuelSurchargeRate: 11, fovRate: 0.03, docketCharge: 60, minChargeableSurface: 10 },
    version: 1,
    createdAt: '2025-04-01T00:00:00.000Z',
  },
];

const DEFAULT_CONFIG: PTLConfig = {
  docketPrefix: '',
  eWayBillThreshold: 50000,
  defaultFreeStorageDays: 3,
  enabledFleetModels: ['Own', 'Leased', 'Market', 'Carrier'],
  transitSLA: {
    'Mumbai': { 'Delhi': 3, 'Bangalore': 2, 'Chennai': 3, 'Hyderabad': 2, 'Kolkata': 4 },
    'Delhi': { 'Mumbai': 3, 'Bangalore': 4, 'Chennai': 4, 'Hyderabad': 3, 'Kolkata': 2 },
    'Bangalore': { 'Mumbai': 2, 'Delhi': 4, 'Chennai': 1, 'Hyderabad': 1, 'Kolkata': 4 },
    'Chennai': { 'Mumbai': 3, 'Delhi': 4, 'Bangalore': 1, 'Hyderabad': 2, 'Kolkata': 4 },
    'Hyderabad': { 'Mumbai': 2, 'Delhi': 3, 'Bangalore': 1, 'Chennai': 2, 'Kolkata': 3 },
  },
};

// ─── PTL Store Class ──────────────────────────────────────────────────────────

class PTLStoreClass {
  private dockets: PTLDocket[] = [];
  private exceptions: PTLException[] = [];
  private manifests: PTLManifest[] = [];
  private lineHaulTrips: PTLLineHaulTrip[] = [];
  private carriers: PTLCarrierVendor[] = [];
  private clientRateCards: PTLClientRateCard[] = [];
  private vendorRateCards: PTLVendorRateCard[] = [];
  private zoneRateCards: PTLZoneRateCard[] = [];
  private config: PTLConfig = DEFAULT_CONFIG;
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadAll();
  }

  // ── Persistence ─────────────────────────────────────────────────────────────

  private loadAll(): void {
    const seeded = localStorage.getItem(KEY_SEEDED);
    if (!seeded) {
      this.dockets = [...SEED_DOCKETS];
      this.exceptions = [...SEED_EXCEPTIONS];
      this.manifests = [...SEED_MANIFESTS];
      this.lineHaulTrips = [...SEED_LINEHAUL];
      this.carriers = [...SEED_CARRIERS];
      this.clientRateCards = [...SEED_CLIENT_RATECARDS];
      this.vendorRateCards = [...SEED_VENDOR_RATECARDS];
      this.zoneRateCards = [...SEED_ZONE_RATECARDS];
      this.config = { ...DEFAULT_CONFIG };
      this.persistAll();
      localStorage.setItem(KEY_SEEDED, '1');
    } else {
      this.dockets = this.load<PTLDocket[]>(KEY_DOCKETS, SEED_DOCKETS);
      this.exceptions = this.load<PTLException[]>(KEY_EXCEPTIONS, SEED_EXCEPTIONS);
      this.manifests = this.load<PTLManifest[]>(KEY_MANIFESTS, SEED_MANIFESTS);
      this.lineHaulTrips = this.load<PTLLineHaulTrip[]>(KEY_LINEHAUL, SEED_LINEHAUL);
      this.carriers = this.load<PTLCarrierVendor[]>(KEY_CARRIERS, SEED_CARRIERS);
      this.clientRateCards = this.load<PTLClientRateCard[]>(KEY_CLIENT_RC, SEED_CLIENT_RATECARDS);
      this.vendorRateCards = this.load<PTLVendorRateCard[]>(KEY_VENDOR_RC, SEED_VENDOR_RATECARDS);
      this.zoneRateCards = this.load<PTLZoneRateCard[]>(KEY_ZONE_RC, SEED_ZONE_RATECARDS);
      this.config = this.load<PTLConfig>(KEY_CONFIG, DEFAULT_CONFIG);
    }
  }

  private load<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch { return fallback; }
  }

  private save(key: string, value: unknown): void {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
  }

  private persistAll(): void {
    this.save(KEY_DOCKETS, this.dockets);
    this.save(KEY_EXCEPTIONS, this.exceptions);
    this.save(KEY_MANIFESTS, this.manifests);
    this.save(KEY_LINEHAUL, this.lineHaulTrips);
    this.save(KEY_CARRIERS, this.carriers);
    this.save(KEY_CLIENT_RC, this.clientRateCards);
    this.save(KEY_VENDOR_RC, this.vendorRateCards);
    this.save(KEY_ZONE_RC, this.zoneRateCards);
    this.save(KEY_CONFIG, this.config);
  }

  private notify(): void { this.listeners.forEach(fn => fn()); }

  // ── Subscription ────────────────────────────────────────────────────────────

  subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(f => f !== fn); };
  }

  // ── Dockets ─────────────────────────────────────────────────────────────────

  getDockets(): PTLDocket[] { return [...this.dockets]; }
  getDocket(id: string): PTLDocket | undefined { return this.dockets.find(d => d.id === id); }

  addDocket(docket: PTLDocket): void {
    this.dockets = [docket, ...this.dockets];
    this.save(KEY_DOCKETS, this.dockets);
    this.notify();
  }

  updateDocket(id: string, fields: Partial<PTLDocket>): void {
    this.dockets = this.dockets.map(d => d.id === id ? { ...d, ...fields, lastUpdatedAt: new Date().toISOString() } : d);
    this.save(KEY_DOCKETS, this.dockets);
    this.notify();
  }

  // ── Exceptions ──────────────────────────────────────────────────────────────

  getExceptions(): PTLException[] { return [...this.exceptions]; }
  getException(id: string): PTLException | undefined { return this.exceptions.find(e => e.id === id); }
  getExceptionsForDocket(docketId: string): PTLException[] { return this.exceptions.filter(e => e.docketId === docketId); }

  addException(exc: PTLException): void {
    this.exceptions = [exc, ...this.exceptions];
    this.save(KEY_EXCEPTIONS, this.exceptions);
    this.notify();
  }

  updateException(id: string, fields: Partial<PTLException>): void {
    this.exceptions = this.exceptions.map(e => e.id === id ? { ...e, ...fields } : e);
    this.save(KEY_EXCEPTIONS, this.exceptions);
    this.notify();
  }

  // ── Manifests ───────────────────────────────────────────────────────────────

  getManifests(): PTLManifest[] { return [...this.manifests]; }
  getManifest(id: string): PTLManifest | undefined { return this.manifests.find(m => m.id === id); }

  addManifest(manifest: PTLManifest): void {
    this.manifests = [manifest, ...this.manifests];
    this.save(KEY_MANIFESTS, this.manifests);
    this.notify();
  }

  updateManifest(id: string, fields: Partial<PTLManifest>): void {
    this.manifests = this.manifests.map(m => m.id === id ? { ...m, ...fields } : m);
    this.save(KEY_MANIFESTS, this.manifests);
    this.notify();
  }

  // ── Line Haul Trips ─────────────────────────────────────────────────────────

  getLineHaulTrips(): PTLLineHaulTrip[] { return [...this.lineHaulTrips]; }
  getLineHaulTrip(id: string): PTLLineHaulTrip | undefined { return this.lineHaulTrips.find(t => t.id === id); }

  addLineHaulTrip(trip: PTLLineHaulTrip): void {
    this.lineHaulTrips = [trip, ...this.lineHaulTrips];
    this.save(KEY_LINEHAUL, this.lineHaulTrips);
    this.notify();
  }

  updateLineHaulTrip(id: string, fields: Partial<PTLLineHaulTrip>): void {
    this.lineHaulTrips = this.lineHaulTrips.map(t => t.id === id ? { ...t, ...fields } : t);
    this.save(KEY_LINEHAUL, this.lineHaulTrips);
    this.notify();
  }

  // ── Carriers ────────────────────────────────────────────────────────────────

  getCarriers(): PTLCarrierVendor[] { return [...this.carriers]; }
  getCarrier(id: string): PTLCarrierVendor | undefined { return this.carriers.find(c => c.id === id); }

  addCarrier(carrier: PTLCarrierVendor): void {
    this.carriers = [carrier, ...this.carriers];
    this.save(KEY_CARRIERS, this.carriers);
    this.notify();
  }

  updateCarrier(id: string, fields: Partial<PTLCarrierVendor>): void {
    this.carriers = this.carriers.map(c => c.id === id ? { ...c, ...fields } : c);
    this.save(KEY_CARRIERS, this.carriers);
    this.notify();
  }

  // ── Client Rate Cards ───────────────────────────────────────────────────────

  getClientRateCards(): PTLClientRateCard[] { return [...this.clientRateCards]; }
  getClientRateCard(id: string): PTLClientRateCard | undefined { return this.clientRateCards.find(r => r.id === id); }

  findClientRateCard(clientId: string, originCity?: string, destCity?: string): PTLClientRateCard | undefined {
    const today = new Date().toISOString().split('T')[0];
    const active = this.clientRateCards.filter(r =>
      r.clientId === clientId && r.status === 'Active' &&
      r.validFrom <= today && r.validTo >= today
    );
    // Best match: specific lane first, then generic
    return (
      active.find(r => r.originCity === originCity && r.destinationCity === destCity) ??
      active.find(r => !r.originCity && !r.destinationCity)
    );
  }

  addClientRateCard(rc: PTLClientRateCard): void {
    this.clientRateCards = [rc, ...this.clientRateCards];
    this.save(KEY_CLIENT_RC, this.clientRateCards);
    this.notify();
  }

  updateClientRateCard(id: string, fields: Partial<PTLClientRateCard>): void {
    this.clientRateCards = this.clientRateCards.map(r => r.id === id ? { ...r, ...fields } : r);
    this.save(KEY_CLIENT_RC, this.clientRateCards);
    this.notify();
  }

  // ── Vendor Rate Cards ───────────────────────────────────────────────────────

  getVendorRateCards(): PTLVendorRateCard[] { return [...this.vendorRateCards]; }
  getVendorRateCardsForCarrier(vendorId: string): PTLVendorRateCard[] { return this.vendorRateCards.filter(r => r.vendorId === vendorId); }

  findVendorRateCard(vendorId: string, originCity: string, destCity: string): PTLVendorRateCard | undefined {
    const today = new Date().toISOString().split('T')[0];
    return this.vendorRateCards.find(r =>
      r.vendorId === vendorId && r.originCity === originCity &&
      r.destinationCity === destCity && r.status === 'Active' &&
      r.validFrom <= today && r.validTo >= today
    );
  }

  addVendorRateCard(rc: PTLVendorRateCard): void {
    this.vendorRateCards = [rc, ...this.vendorRateCards];
    this.save(KEY_VENDOR_RC, this.vendorRateCards);
    this.notify();
  }

  updateVendorRateCard(id: string, fields: Partial<PTLVendorRateCard>): void {
    this.vendorRateCards = this.vendorRateCards.map(r => r.id === id ? { ...r, ...fields } : r);
    this.save(KEY_VENDOR_RC, this.vendorRateCards);
    this.notify();
  }

  // ── Config ──────────────────────────────────────────────────────────────────

  getConfig(): PTLConfig { return { ...this.config }; }
  updateConfig(fields: Partial<PTLConfig>): void {
    this.config = { ...this.config, ...fields };
    this.save(KEY_CONFIG, this.config);
    this.notify();
  }

  // ── Finance Bridge ───────────────────────────────────────────────────────────

  pushFinanceRevenue(item: PTLFinanceRevenue): void {
    try {
      const raw = localStorage.getItem(KEY_FIN_REV);
      const items: PTLFinanceRevenue[] = raw ? JSON.parse(raw) : [];
      if (!items.find(i => i.docketId === item.docketId)) {
        items.push(item);
        localStorage.setItem(KEY_FIN_REV, JSON.stringify(items));
      }
    } catch { /* silent */ }
  }

  popFinanceRevenue(): PTLFinanceRevenue[] {
    try {
      const raw = localStorage.getItem(KEY_FIN_REV);
      if (raw) {
        const items: PTLFinanceRevenue[] = JSON.parse(raw);
        localStorage.removeItem(KEY_FIN_REV);
        return items;
      }
    } catch { /* silent */ }
    return [];
  }

  pushFinanceCost(item: PTLFinanceCost): void {
    try {
      const raw = localStorage.getItem(KEY_FIN_COST);
      const items: PTLFinanceCost[] = raw ? JSON.parse(raw) : [];
      if (!items.find(i => i.docketId === item.docketId)) {
        items.push(item);
        localStorage.setItem(KEY_FIN_COST, JSON.stringify(items));
      }
    } catch { /* silent */ }
  }

  popFinanceCost(): PTLFinanceCost[] {
    try {
      const raw = localStorage.getItem(KEY_FIN_COST);
      if (raw) {
        const items: PTLFinanceCost[] = JSON.parse(raw);
        localStorage.removeItem(KEY_FIN_COST);
        return items;
      }
    } catch { /* silent */ }
    return [];
  }

  // ── Zone Rate Cards ──────────────────────────────────────────────────────────

  getZoneRateCards(): PTLZoneRateCard[] { return [...this.zoneRateCards]; }
  getZoneRateCard(id: string): PTLZoneRateCard | undefined { return this.zoneRateCards.find(r => r.id === id); }
  getActiveZoneRateCards(): PTLZoneRateCard[] { return this.zoneRateCards.filter(r => r.status === 'Active'); }

  /** Find the active zone rate card for a customer (zone cards take priority in booking). */
  findZoneRateCardForClient(customerId: string): PTLZoneRateCard | undefined {
    const today = new Date().toISOString().split('T')[0];
    return this.zoneRateCards.find(rc =>
      rc.customerId === customerId &&
      rc.status === 'Active' &&
      rc.effectiveDate <= today &&
      rc.expiryDate >= today
    );
  }

  addZoneRateCard(rc: PTLZoneRateCard): void {
    this.zoneRateCards = [rc, ...this.zoneRateCards];
    this.save(KEY_ZONE_RC, this.zoneRateCards);
    this.notify();
  }

  updateZoneRateCard(id: string, fields: Partial<PTLZoneRateCard>): void {
    this.zoneRateCards = this.zoneRateCards.map(r =>
      r.id === id ? { ...r, ...fields, updatedAt: new Date().toISOString() } : r
    );
    this.save(KEY_ZONE_RC, this.zoneRateCards);
    this.notify();
  }

  /** Archive a rate card (soft delete) */
  archiveZoneRateCard(id: string): void {
    this.updateZoneRateCard(id, { status: 'Expired' });
  }

  /** Duplicate a rate card as a new Draft with bumped version */
  duplicateZoneRateCard(id: string): PTLZoneRateCard | undefined {
    const src = this.getZoneRateCard(id);
    if (!src) return undefined;
    const clone: PTLZoneRateCard = {
      ...src,
      id: this.generateId('zrc'),
      name: `${src.name} (Copy)`,
      status: 'Draft',
      version: src.version + 1,
      parentVersionId: src.id,
      supersededBy: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: undefined,
    };
    this.addZoneRateCard(clone);
    return clone;
  }

  /**
   * Lookup which zone a city belongs to, given a set of zones.
   * Returns null zoneCode if the city is ODA (not in any zone).
   */
  lookupZoneForCity(city: string, zones: PTLZone[]): { zoneCode: string | null; isODA: boolean } {
    const norm = city.trim().toLowerCase();
    for (const z of zones) {
      if (z.hubCities.some(c => c === norm || norm.includes(c) || c.includes(norm))) {
        return { zoneCode: z.code, isODA: false };
      }
    }
    return { zoneCode: null, isODA: true };
  }

  // ── Utility ─────────────────────────────────────────────────────────────────

  /** Generate next docket number: {HUB_CODE}-{MMDD}-{SEQ} */
  generateDocketNumber(hubCode: string): string {
    const today = new Date();
    const mmdd = String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0');
    const todayStr = today.toISOString().split('T')[0];
    const todayCount = this.dockets.filter(d => d.bookingDate === todayStr).length + 1;
    return `${hubCode}-${mmdd}-${String(todayCount).padStart(3, '0')}`;
  }

  /** Generate a unique ID */
  generateId(prefix = 'd'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  }
}

export const ptlStore = new PTLStoreClass();
