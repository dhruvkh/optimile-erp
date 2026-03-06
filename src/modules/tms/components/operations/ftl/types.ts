
import { LucideIcon, ClipboardList, Truck, MapPin, Package, CheckCircle, Navigation, Anchor, ArrowRight, Upload, FileCheck, Lock, CheckSquare, CornerDownRight } from 'lucide-react';

export type TripStatusCode =
  | 'INDENT_RECEIVED'
  | 'VEHICLE_ASSIGNED'
  | 'VEHICLE_REPORTED'
  | 'LOADING_STARTED'
  | 'LOADING_COMPLETED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'DELIVERY_DIVERTED'
  | 'REACHED_DESTINATION'
  | 'UNLOADING_STARTED'
  | 'UNLOADING_COMPLETED'
  | 'POD_SOFT_UPLOADED'
  | 'POD_HARD_RECEIVED'
  | 'TRIP_CLOSED';

export interface TripStatusDefinition {
  code: number;
  key: TripStatusCode;
  name: string;
  color: string;
  icon: any;
  allowedNext: TripStatusCode[];
  requiredFields: string[];
  description: string;
  slaHours?: number; // Expected hours from previous step or start
}

export const TRIP_STATUS_FLOW: Record<TripStatusCode, TripStatusDefinition> = {
  INDENT_RECEIVED: {
    code: 1, key: 'INDENT_RECEIVED', name: "Indent Received", color: "bg-gray-500", icon: ClipboardList,
    allowedNext: ["VEHICLE_ASSIGNED"], requiredFields: [], description: "Booking created and indent raised"
  },
  VEHICLE_ASSIGNED: {
    code: 2, key: 'VEHICLE_ASSIGNED', name: "Vehicle Assigned", color: "bg-blue-500", icon: Truck,
    allowedNext: ["VEHICLE_REPORTED"], requiredFields: ["vehicleId", "driverId"], description: "Vehicle and driver mapped to trip"
  },
  VEHICLE_REPORTED: {
    code: 3, key: 'VEHICLE_REPORTED', name: "Reported at Loading", color: "bg-purple-500", icon: MapPin,
    allowedNext: ["LOADING_STARTED"], requiredFields: ["gpsLocation", "photos"], description: "Vehicle reached loading point"
  },
  LOADING_STARTED: {
    code: 4, key: 'LOADING_STARTED', name: "Loading Started", color: "bg-orange-500", icon: Package,
    allowedNext: ["LOADING_COMPLETED"], requiredFields: ["photos"], description: "Goods loading in progress"
  },
  LOADING_COMPLETED: {
    code: 5, key: 'LOADING_COMPLETED', name: "Loading Completed", color: "bg-green-500", icon: CheckCircle,
    allowedNext: ["DISPATCHED"], requiredFields: ["sealNumber", "photos"], description: "Loading finished, seal applied"
  },
  DISPATCHED: {
    code: 6, key: 'DISPATCHED', name: "Vehicle Dispatched", color: "bg-cyan-500", icon: Navigation,
    allowedNext: ["IN_TRANSIT"], requiredFields: ["odometer", "fuelLevel"], description: "Vehicle left loading premises"
  },
  IN_TRANSIT: {
    code: 7, key: 'IN_TRANSIT', name: "In Transit", color: "bg-blue-400", icon: ArrowRight,
    allowedNext: ["REACHED_DESTINATION", "DELIVERY_DIVERTED"], requiredFields: ["gpsLocation"], description: "Vehicle en route to destination"
  },
  DELIVERY_DIVERTED: {
    code: 7.5 as any, key: 'DELIVERY_DIVERTED', name: "Delivery Diverted", color: "bg-amber-500", icon: CornerDownRight,
    allowedNext: ["REACHED_DESTINATION"], requiredFields: [], description: "Delivery redirected to a new address"
  },
  REACHED_DESTINATION: {
    code: 8, key: 'REACHED_DESTINATION', name: "Reached Destination", color: "bg-purple-500", icon: Anchor,
    allowedNext: ["UNLOADING_STARTED"], requiredFields: ["gpsLocation", "photos"], description: "Vehicle reached unloading point"
  },
  UNLOADING_STARTED: {
    code: 9, key: 'UNLOADING_STARTED', name: "Unloading Started", color: "bg-orange-500", icon: Package,
    allowedNext: ["UNLOADING_COMPLETED"], requiredFields: [], description: "Offloading goods"
  },
  UNLOADING_COMPLETED: {
    code: 10, key: 'UNLOADING_COMPLETED', name: "Unloading Completed", color: "bg-green-500", icon: CheckCircle,
    allowedNext: ["POD_SOFT_UPLOADED"], requiredFields: ["photos", "remarks"], description: "Offloading finished"
  },
  POD_SOFT_UPLOADED: {
    code: 11, key: 'POD_SOFT_UPLOADED', name: "Soft POD Uploaded", color: "bg-indigo-500", icon: Upload,
    allowedNext: ["POD_HARD_RECEIVED", "TRIP_CLOSED"], requiredFields: ["podImage"], description: "Digital proof of delivery uploaded"
  },
  POD_HARD_RECEIVED: {
    code: 12, key: 'POD_HARD_RECEIVED', name: "Hard POD Received", color: "bg-green-700", icon: FileCheck,
    allowedNext: ["TRIP_CLOSED"], requiredFields: ["receiverName"], description: "Physical copy received at office"
  },
  TRIP_CLOSED: {
    code: 13, key: 'TRIP_CLOSED', name: "Trip Closed", color: "bg-slate-700", icon: Lock,
    allowedNext: [], requiredFields: [], description: "Financials settled and closed"
  }
};

export interface CheckpointEvidence {
  photos?: string[];
  gpsLocation?: { lat: number; lng: number; address: string };
  documents?: string[];
  signature?: string;
}

export interface TripCheckpoint {
  id: string;
  status: TripStatusCode;
  timestamp: string; // ISO
  expectedTimestamp?: string;
  capturedBy: {
    id: string;
    name: string;
    role: string;
  };
  evidence?: CheckpointEvidence;
  data?: Record<string, any>; // Flexible data for seal numbers, odometer, etc.
  locationName: string;
  isDelay?: boolean;
  delayReason?: string;
}

export interface TripDataFull {
  tripId: string;
  currentStatus: TripStatusCode;
  timeline: TripCheckpoint[];
  sla: {
    onTimeCheckpoints: number;
    delayedCheckpoints: number;
    overallStatus: 'On Track' | 'At Risk' | 'Delayed';
  };
}

// --- Closure & Reconciliation Types ---

export interface ReconciliationMetric {
  metric: string;
  planned: number;
  actual: number;
  unit: string;
  variance: number;
  variancePercent: number;
  reason?: string;
  status: 'Match' | 'Minor Variance' | 'Major Variance';
}

export interface ClosureChecklist {
  pod: {
    status: 'Received' | 'Pending';
    softCopy: { received: boolean, date?: string };
    hardCopy: { received: boolean, required: boolean };
  };
  expenses: { total: number; recorded: number; approved: boolean };
  claims: { total: number; resolved: number; totalDeduction: number };
  issues: { total: number; resolved: number };
  deductions: { amount: number; status: 'Clear' | 'Pending' };
  accessorialCharges: {
    detention: number;
    toll: number;
    loading: number;
    unloading: number;
  };
  reconciliation: { status: 'Pending' | 'Approved' | 'Rejected' };
  financials: {
    plannedRevenue: number;
    actualRevenue: number;
    plannedCost: number;
    actualCost: number;
    netProfit: number;
    marginPercent: number;
  };
}

export interface FinancePayload {
  sourceId: string;
  customerCode: string;
  revenue: { freight: number; other: number; total: number };
  costs: { fuel: number; driver: number; tolls: number; other: number; total: number };
  profit: number;
  status: 'Ready';
}

// --- Expense Management Types ---

export type ExpenseCategory = 'FUEL' | 'TOLL' | 'PARKING' | 'FOOD' | 'LOADING' | 'UNLOADING' | 'REPAIR' | 'WEIGHBRIDGE' | 'OTHER';

export interface ExpenseCategoryDef {
  code: ExpenseCategory;
  name: string;
  icon: string; // Emoji char
  receiptRequired: boolean;
  autoCalculate: boolean;
  typical: boolean;
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, ExpenseCategoryDef> = {
  FUEL: { code: "FUEL", name: "Fuel Cost", icon: "⛽", receiptRequired: true, autoCalculate: false, typical: true },
  TOLL: { code: "TOLL", name: "Toll Charges", icon: "🛣️", receiptRequired: true, autoCalculate: false, typical: true },
  PARKING: { code: "PARKING", name: "Parking Fees", icon: "🅿️", receiptRequired: true, autoCalculate: false, typical: false },
  FOOD: { code: "FOOD", name: "Food Allowance", icon: "🍽️", receiptRequired: false, autoCalculate: true, typical: true },
  LOADING: { code: "LOADING", name: "Loading Charges", icon: "📦", receiptRequired: true, autoCalculate: false, typical: true },
  UNLOADING: { code: "UNLOADING", name: "Unloading Charges", icon: "📤", receiptRequired: true, autoCalculate: false, typical: true },
  REPAIR: { code: "REPAIR", name: "Vehicle Repair", icon: "🔧", receiptRequired: true, autoCalculate: false, typical: false },
  WEIGHBRIDGE: { code: "WEIGHBRIDGE", name: "Weighbridge Fees", icon: "⚖️", receiptRequired: true, autoCalculate: false, typical: false },
  OTHER: { code: "OTHER", name: "Other Expenses", icon: "💰", receiptRequired: true, autoCalculate: false, typical: false }
};

export interface TripExpense {
  id: string;
  tripId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  quantity?: number; // for fuel
  rate?: number; // for fuel
  date: string;
  time: string;
  location?: {
    name: string;
    address: string;
  };
  receiptUrl?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedBy: {
    name: string;
    role: string;
    time: string;
  };
  rejectionReason?: string;
}

// --- Claim Types ---

export type ClaimType = 'SHORTAGE' | 'DAMAGE' | 'LATE_DELIVERY' | 'QUALITY_ISSUE';

export interface Claim {
  id: string;
  tripId: string;
  type: ClaimType;
  description: string;
  claimedAmount: number;
  approvedAmount?: number;
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected';
  filedBy: {
    name: string;
    role: string;
    time: string;
  };
  evidence: string[]; // urls
  resolutionNotes?: string;
  settlementMethod?: 'Deduct from Invoice' | 'Refund' | 'Insurance';
}

export const CLAIM_TYPES_DEF: Record<ClaimType, { name: string; icon: string }> = {
  SHORTAGE: { name: "Short Delivery", icon: "📉" },
  DAMAGE: { name: "Cargo Damage", icon: "💔" },
  LATE_DELIVERY: { name: "Late Delivery Penalty", icon: "⏰" },
  QUALITY_ISSUE: { name: "Quality Issue", icon: "❌" }
};
