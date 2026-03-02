// ============================================================
// Optimile ERP — Operational Data Store
// ============================================================
// SINGLE SOURCE OF TRUTH for all modules: TMS, Finance, Fleet.
// All screens read from OperationalDataContext which is seeded
// from this file. To integrate with a real database, replace
// the exported SHARED_* arrays with API fetch calls.
// ============================================================

// ── Type Definitions ───────────────────────────────────────

export type PayableStatus =
  | 'pending_advance'
  | 'advance_paid'
  | 'pending_balance'
  | 'fully_paid'
  | 'disputed'
  | 'settled';

export interface VendorPayable {
  vendorId: string;
  advancePercentage: number;
  advanceAmount: number;
  advancePaid: boolean;
  advanceDate?: string;
  balanceAmount: number;
  balancePaid: boolean;
  balanceDate?: string;
  status: PayableStatus;
  podClean?: boolean;
  podRemarks?: string;
  invoiceReceived?: boolean;
  invoiceNumber?: string;
  invoiceDate?: string;
}

export interface CompletedTrip {
  id: string;
  bookingRef: string;
  clientId: string;
  clientName: string;
  origin: string;
  destination: string;
  distanceKm: number;
  status: 'booked' | 'in_transit' | 'delivered' | 'pod_received' | 'invoiced';
  bookedDate: string;
  dispatchDate: string;
  deliveredDate?: string;
  podReceivedDate?: string;
  vehicleId?: string;
  vehicleRegNumber?: string;
  driverName?: string;
  driverPhone?: string;
  tripType: 'own_vehicle' | 'contracted_vendor' | 'market_hire';
  bookingMode: 'FTL' | 'LTL' | 'PARTIAL';
  revenueAmount: number;
  totalCost: number;
  vendorId?: string;
  vendorName?: string;
  vendorPayable?: VendorPayable;
  podVerified: boolean;
  podUrl?: string;
  invoiced: boolean;
  invoiceId?: string;
  costBreakdown?: CostBreakdown;
}

export interface CostBreakdown {
  fuel: number;
  driver: number;
  toll: number;
  maintenance: number;
  overhead: number;
}

export interface SharedClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  contactPerson: string;
  status: 'Active' | 'Inactive';
  creditLimit: number;
  paymentTerms: number;
  tdsRate: number;
  relationshipManager: string;
}

export interface SharedVendor {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  category: string;
  rating: number;
  paymentTerms: number;
  bankAccount: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  hasContract: boolean;
  contractTerms?: string;
  status: 'Active' | 'Inactive';
  balance: number;
}

export interface SharedVehicle {
  id: string;
  regNumber: string;
  model: string;
  type: string;
  capacity: number; // in tons
  ownershipType: 'owned' | 'leased' | 'hired';
  driverName: string;
  driverPhone: string;
  status: 'available' | 'in_transit' | 'maintenance' | 'retired';
  odometerKm: number;
}

export interface CostBreakdownConfig {
  fuelCostPct: number;
  driverCostPct: number;
  tollPct: number;
  maintenancePct: number;
  overheadPct: number;
}

// ── Mock Data ──────────────────────────────────────────────

export const SHARED_CLIENTS: SharedClient[] = [
  {
    id: 'CLI-001',
    name: 'Amazon India',
    email: 'logistics@amazon.in',
    phone: '+91-9876543210',
    address: 'Bangalore, Karnataka',
    gstin: '18AABCT0001H1Z0',
    contactPerson: 'Rajesh Kumar',
    status: 'Active',
    creditLimit: 5000000,
    paymentTerms: 30,
    tdsRate: 1,
    relationshipManager: 'Priya Sharma',
  },
  {
    id: 'CLI-002',
    name: 'Flipkart Logistics',
    email: 'vendor@flipkart.com',
    phone: '+91-9876543211',
    address: 'Hyderabad, Telangana',
    gstin: '36AABCO0001H1Z0',
    contactPerson: 'Amit Singh',
    status: 'Active',
    creditLimit: 3000000,
    paymentTerms: 15,
    tdsRate: 1,
    relationshipManager: 'Sunita Verma',
  },
  {
    id: 'CLI-003',
    name: 'DHL India',
    email: 'partners@dhl.com',
    phone: '+91-9876543212',
    address: 'Delhi, NCR',
    gstin: '07AABCD0001H1Z0',
    contactPerson: 'Vikram Patel',
    status: 'Active',
    creditLimit: 2500000,
    paymentTerms: 7,
    tdsRate: 2,
    relationshipManager: 'Deepak Joshi',
  },
  {
    id: 'CLI-004',
    name: 'Blue Dart Express',
    email: 'logistics@bluedart.com',
    phone: '+91-9876543213',
    address: 'Mumbai, Maharashtra',
    gstin: '27AABCB0001H1Z0',
    contactPerson: 'Anita Kapoor',
    status: 'Active',
    creditLimit: 4000000,
    paymentTerms: 30,
    tdsRate: 2,
    relationshipManager: 'Rajesh Kumar',
  },
  {
    id: 'CLI-005',
    name: 'Larsen & Toubro Ltd',
    email: 'scm@larsentoubro.com',
    phone: '+91-9876543214',
    address: 'Mumbai, Maharashtra',
    gstin: '27AAACL0216K1ZB',
    contactPerson: 'Ramesh Iyer',
    status: 'Active',
    creditLimit: 8000000,
    paymentTerms: 45,
    tdsRate: 2,
    relationshipManager: 'Sunita Verma',
  },
  {
    id: 'CLI-006',
    name: 'Asian Paints Ltd',
    email: 'logistics@asianpaints.com',
    phone: '+91-9876543215',
    address: 'Mumbai, Maharashtra',
    gstin: '27AAACA3953F1Z9',
    contactPerson: 'Deepa Joshi',
    status: 'Active',
    creditLimit: 2500000,
    paymentTerms: 30,
    tdsRate: 2,
    relationshipManager: 'Rajesh Kumar',
  },
  {
    id: 'CLI-007',
    name: 'ITC Ltd',
    email: 'logistics@itc.in',
    phone: '+91-9876543216',
    address: 'Kolkata, West Bengal',
    gstin: '19AAACI1681G1ZK',
    contactPerson: 'Sudip Ghosh',
    status: 'Active',
    creditLimit: 3500000,
    paymentTerms: 30,
    tdsRate: 2,
    relationshipManager: 'Sunita Verma',
  },
];

export const SHARED_VENDORS: SharedVendor[] = [
  {
    id: 'VND-001',
    name: 'Prime Transport Services',
    code: 'PTS-001',
    email: 'info@primetransport.com',
    phone: '+91-8901234567',
    address: 'Chennai, Tamil Nadu',
    gstin: '33AABCT0001H1Z0',
    category: 'Trucking',
    rating: 4.5,
    paymentTerms: 15,
    bankAccount: {
      accountNumber: '1234567890',
      ifscCode: 'HDFC0001234',
      bankName: 'HDFC Bank',
    },
    hasContract: true,
    contractTerms: 'Fixed rate + fuel adjustment',
    status: 'Active',
    balance: 150000,
  },
  {
    id: 'VND-002',
    name: 'Reliable Logistics Ltd',
    code: 'RLL-002',
    email: 'logistics@reliable.in',
    phone: '+91-8901234568',
    address: 'Mumbai, Maharashtra',
    gstin: '27AABCT0001H1Z0',
    category: 'Trucking',
    rating: 4.0,
    paymentTerms: 30,
    bankAccount: {
      accountNumber: '9876543210',
      ifscCode: 'ICIC0000001',
      bankName: 'ICICI Bank',
    },
    hasContract: false,
    status: 'Active',
    balance: 75000,
  },
  {
    id: 'VND-003',
    name: 'Swift Carriers',
    code: 'SWC-003',
    email: 'contact@swiftcarriers.com',
    phone: '+91-8901234569',
    address: 'Pune, Maharashtra',
    gstin: '27AABCT0002H1Z0',
    category: 'Trucking',
    rating: 4.2,
    paymentTerms: 15,
    bankAccount: {
      accountNumber: '5555555555',
      ifscCode: 'AXIS0000001',
      bankName: 'Axis Bank',
    },
    hasContract: true,
    contractTerms: 'Per km rate',
    status: 'Active',
    balance: 200000,
  },
  {
    id: 'VND-006',
    name: 'Indian Oil Corporation',
    code: 'IOC-006',
    email: 'commercial@indianoil.in',
    phone: '+91-8901234572',
    address: 'New Delhi',
    gstin: '07AABCI6789M1ZV',
    category: 'Fuel Supplier',
    rating: 5.0,
    paymentTerms: 0,
    bankAccount: {
      accountNumber: '1111111111',
      ifscCode: 'SBIN0000001',
      bankName: 'State Bank of India',
    },
    hasContract: true,
    contractTerms: 'Bulk fuel supply',
    status: 'Active',
    balance: 0,
  },
  {
    id: 'VND-009',
    name: 'NHAI FastTag Services',
    code: 'NFS-009',
    email: 'fasttag@nhai.gov.in',
    phone: '+91-8901234575',
    address: 'New Delhi',
    gstin: '07AABCN9012J1ZY',
    category: 'Toll',
    rating: 5.0,
    paymentTerms: 0,
    bankAccount: {
      accountNumber: '2222222222',
      ifscCode: 'HDFC0000001',
      bankName: 'HDFC Bank',
    },
    hasContract: true,
    contractTerms: 'FASTag auto-debit',
    status: 'Active',
    balance: 0,
  },
];

export const SHARED_VEHICLES: SharedVehicle[] = [
  // ── TMS Fleet Vehicles ──────────────────────────────────
  {
    id: 'VEH-001',
    regNumber: 'MH-02-XY-1234',
    model: 'Ashok Leyland 2518',
    type: 'Truck 6x4',
    capacity: 15,
    ownershipType: 'owned',
    driverName: 'Suresh Kumar',
    driverPhone: '+91-9998881111',
    status: 'available',
    odometerKm: 142500,
  },
  {
    id: 'VEH-002',
    regNumber: 'KA-05-AB-5678',
    model: 'Tata LPT 1612',
    type: 'Truck 4x2',
    capacity: 12,
    ownershipType: 'owned',
    driverName: 'Ramesh Singh',
    driverPhone: '+91-9998881112',
    status: 'in_transit',
    odometerKm: 198200,
  },
  {
    id: 'VEH-003',
    regNumber: 'TN-12-CD-9012',
    model: 'Mahindra Bolero Pik-up',
    type: 'LCV',
    capacity: 1.5,
    ownershipType: 'leased',
    driverName: 'Arjun Desai',
    driverPhone: '+91-9998881113',
    status: 'available',
    odometerKm: 87300,
  },
  {
    id: 'VEH-004',
    regNumber: 'UP-03-EF-3456',
    model: 'Swaraj Mazda FX',
    type: 'LCV',
    capacity: 5,
    ownershipType: 'hired',
    driverName: 'Vikram Chouhan',
    driverPhone: '+91-9998881114',
    status: 'available',
    odometerKm: 62100,
  },
  // ── Fleet Module Vehicles ────────────────────────────────
  {
    id: 'FLEET-001',
    regNumber: 'GJ-01-AA-2024',
    model: 'Tata Prima 4028.S',
    type: 'Truck 6x4',
    capacity: 25,
    ownershipType: 'owned',
    driverName: 'Dinesh Patel',
    driverPhone: '+91-9876540001',
    status: 'available',
    odometerKm: 58000,
  },
  {
    id: 'FLEET-002',
    regNumber: 'MH-14-BG-7890',
    model: 'Eicher Pro 6025',
    type: 'Truck 4x2',
    capacity: 10,
    ownershipType: 'owned',
    driverName: 'Santosh Jadhav',
    driverPhone: '+91-9876540002',
    status: 'available',
    odometerKm: 112300,
  },
  {
    id: 'FLEET-003',
    regNumber: 'RJ-14-CB-3344',
    model: 'Ashok Leyland BOSS',
    type: 'LCV',
    capacity: 3.5,
    ownershipType: 'leased',
    driverName: 'Mohan Sharma',
    driverPhone: '+91-9876540003',
    status: 'available',
    odometerKm: 34500,
  },
];

export const COMPLETED_TRIPS: CompletedTrip[] = [
  // ── Original 5 trips ─────────────────────────────────────
  {
    id: 'TRP-001',
    bookingRef: 'AMZ-BK-001',
    clientId: 'CLI-001',
    clientName: 'Amazon India',
    origin: 'Mumbai, Maharashtra',
    destination: 'Delhi, NCR',
    distanceKm: 1385,
    status: 'delivered',
    bookedDate: '2026-01-15',
    dispatchDate: '2026-01-16',
    deliveredDate: '2026-01-19',
    vehicleId: 'VEH-001',
    vehicleRegNumber: 'MH-02-XY-1234',
    driverName: 'Suresh Kumar',
    driverPhone: '+91-9998881111',
    tripType: 'own_vehicle',
    bookingMode: 'FTL',
    revenueAmount: 45000,
    totalCost: 33750,
    costBreakdown: { fuel: 18563, driver: 6075, toll: 2700, maintenance: 4050, overhead: 2363 },
    podVerified: false,
    invoiced: false,
  },
  {
    id: 'TRP-002',
    bookingRef: 'FLK-BK-002',
    clientId: 'CLI-002',
    clientName: 'Flipkart Logistics',
    origin: 'Bangalore, Karnataka',
    destination: 'Hyderabad, Telangana',
    distanceKm: 572,
    status: 'in_transit',
    bookedDate: '2026-02-20',
    dispatchDate: '2026-02-20',
    vehicleId: 'VEH-002',
    vehicleRegNumber: 'KA-05-AB-5678',
    driverName: 'Ramesh Singh',
    driverPhone: '+91-9998881112',
    tripType: 'own_vehicle',
    bookingMode: 'FTL',
    revenueAmount: 32000,
    totalCost: 24000,
    costBreakdown: { fuel: 13200, driver: 4320, toll: 1920, maintenance: 2880, overhead: 1680 },
    vendorId: 'VND-001',
    vendorName: 'Prime Transport Services',
    vendorPayable: {
      vendorId: 'VND-001',
      advancePercentage: 50,
      advanceAmount: 12000,
      advancePaid: true,
      advanceDate: '2026-02-20',
      balanceAmount: 12000,
      balancePaid: false,
      status: 'advance_paid',
    },
    podVerified: false,
    invoiced: false,
  },
  {
    id: 'TRP-003',
    bookingRef: 'DHL-BK-003',
    clientId: 'CLI-003',
    clientName: 'DHL India',
    origin: 'Delhi, NCR',
    destination: 'Jaipur, Rajasthan',
    distanceKm: 262,
    status: 'pod_received',
    bookedDate: '2026-02-10',
    dispatchDate: '2026-02-11',
    deliveredDate: '2026-02-12',
    podReceivedDate: '2026-02-14',
    vehicleId: 'VEH-003',
    vehicleRegNumber: 'TN-12-CD-9012',
    driverName: 'Arjun Desai',
    driverPhone: '+91-9998881113',
    tripType: 'contracted_vendor',
    bookingMode: 'FTL',
    revenueAmount: 15000,
    totalCost: 11250,
    costBreakdown: { fuel: 6188, driver: 2025, toll: 900, maintenance: 1350, overhead: 788 },
    podVerified: true,
    invoiced: false,
  },
  {
    id: 'TRP-004',
    bookingRef: 'AMZ-BK-004',
    clientId: 'CLI-001',
    clientName: 'Amazon India',
    origin: 'Pune, Maharashtra',
    destination: 'Nagpur, Maharashtra',
    distanceKm: 750,
    status: 'invoiced',
    bookedDate: '2026-01-20',
    dispatchDate: '2026-01-21',
    deliveredDate: '2026-01-23',
    podReceivedDate: '2026-01-25',
    vehicleId: 'VEH-004',
    vehicleRegNumber: 'UP-03-EF-3456',
    driverName: 'Vikram Chouhan',
    driverPhone: '+91-9998881114',
    tripType: 'market_hire',
    bookingMode: 'FTL',
    revenueAmount: 28000,
    totalCost: 21000,
    costBreakdown: { fuel: 11550, driver: 3780, toll: 1680, maintenance: 2520, overhead: 1470 },
    vendorId: 'VND-002',
    vendorName: 'Reliable Logistics Ltd',
    vendorPayable: {
      vendorId: 'VND-002',
      advancePercentage: 40,
      advanceAmount: 8400,
      advancePaid: true,
      advanceDate: '2026-01-21',
      balanceAmount: 12600,
      balancePaid: true,
      balanceDate: '2026-01-26',
      status: 'fully_paid',
    },
    invoiceId: 'INV-2026-001',
    podVerified: true,
    invoiced: true,
  },
  {
    id: 'TRP-005',
    bookingRef: 'FLK-BK-005',
    clientId: 'CLI-002',
    clientName: 'Flipkart Logistics',
    origin: 'Chennai, Tamil Nadu',
    destination: 'Bangalore, Karnataka',
    distanceKm: 350,
    status: 'booked',
    bookedDate: '2026-02-22',
    dispatchDate: '',
    vehicleId: '',
    vehicleRegNumber: 'Unassigned',
    driverName: 'Unassigned',
    driverPhone: '',
    tripType: 'own_vehicle',
    bookingMode: 'FTL',
    revenueAmount: 22000,
    totalCost: 0,
    podVerified: false,
    invoiced: false,
  },

];

export const DEFAULT_COST_BREAKDOWN: CostBreakdownConfig = {
  fuelCostPct: 55,
  driverCostPct: 18,
  tollPct: 8,
  maintenancePct: 12,
  overheadPct: 7,
};
