// --- Enums ---

export enum AuctionType {
  REVERSE = 'REVERSE',
  SPOT = 'SPOT',
  LOT = 'LOT',
  BULK = 'BULK',
  REGION_LOT = 'REGION_LOT',
}

export enum AuctionStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum LaneStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
  AWARDED = 'AWARDED',
}

export enum AuditEntityType {
  AUCTION = 'AUCTION',
  LANE = 'LANE',
  BID = 'BID',
  RFI = 'RFI',
  RFQ = 'RFQ',
  AWARD = 'AWARD',
  CONTRACT = 'CONTRACT',
  INDENT = 'INDENT',
  SLA = 'SLA',
  PLACEMENT_TRACKER = 'PLACEMENT_TRACKER',
  SPOT_AUCTION = 'SPOT_AUCTION',
  SPOT_BID = 'SPOT_BID',
}

export enum AuditEventType {
  CREATED = 'CREATED',
  STATUS_CHANGE = 'STATUS_CHANGE',
  BID_PLACED = 'BID_PLACED',
  TIMER_EXTENDED = 'TIMER_EXTENDED',
  UPDATED = 'UPDATED',
  AWARDED = 'AWARDED',
  CONTRACT_GENERATED = 'CONTRACT_GENERATED',
  CONTRACT_ACTIVATED = 'CONTRACT_ACTIVATED',
  ALLOCATION_UPDATED = 'ALLOCATION_UPDATED',
  INDENT_CREATED = 'INDENT_CREATED',
  SLA_CONFIGURED = 'SLA_CONFIGURED',
  PLACEMENT_CONFIRMED = 'PLACEMENT_CONFIRMED',
  SLA_BREACHED = 'SLA_BREACHED',
  SPOT_TRIGGERED = 'SPOT_TRIGGERED',
  SPOT_BID_PLACED = 'SPOT_BID_PLACED',
  SPOT_CLOSED = 'SPOT_CLOSED',
  SPOT_AWARDED = 'SPOT_AWARDED',
  SPOT_PLACEMENT_CONFIRMED = 'SPOT_PLACEMENT_CONFIRMED',
}

export enum RFIStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum RFQStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  LOCKED = 'LOCKED',
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  COMPLETED = 'COMPLETED',
}

export enum ContractSignatureStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIALLY_SIGNED = 'PARTIALLY_SIGNED',
  FULLY_EXECUTED = 'FULLY_EXECUTED',
  EXPIRED = 'EXPIRED',
  VOIDED = 'VOIDED',
}

export enum ContractPricingBasis {
  L1_RATE = 'L1_RATE',
  CUSTOM_RATE = 'CUSTOM_RATE',
}

export enum PlacementStatus {
  PENDING = 'PENDING',
  PLACED = 'PLACED',
  FAILED = 'FAILED',
}

export enum SpotAuctionStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum DisputeRelatedType {
  AUCTION = 'AUCTION',
  CONTRACT = 'CONTRACT',
  INVOICE = 'INVOICE',
  GENERAL = 'GENERAL',
}

export enum DisputeCategory {
  BIDDING_PROCESS = 'BIDDING_PROCESS',
  AWARD_DECISION = 'AWARD_DECISION',
  CONTRACT_TERMS = 'CONTRACT_TERMS',
  SERVICE_QUALITY = 'SERVICE_QUALITY',
  PAYMENT = 'PAYMENT',
  FORCE_MAJEURE = 'FORCE_MAJEURE',
  OTHER = 'OTHER',
}

export enum DisputePriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum DisputeStatus {
  NEW = 'NEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PENDING_RESPONSE = 'PENDING_RESPONSE',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
  CLOSED = 'CLOSED',
}

export enum AwardAcceptanceStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  REAWARDED = 'REAWARDED',
  MODIFICATION_REQUESTED = 'MODIFICATION_REQUESTED',
}

export interface DisputeAttachment {
  id: string;
  name: string;
  sizeKb: number;
  uploadedAt: number;
  uploadedBy: string;
}

export interface DisputeTimelineEvent {
  id: string;
  createdAt: number;
  actorId: string;
  action: string;
  note?: string;
}

export interface DisputeMessage {
  id: string;
  senderId: string;
  message: string;
  createdAt: number;
  visibility: 'all' | 'internal';
}

export interface DisputeAppeal {
  id: string;
  raisedAt: number;
  raisedBy: string;
  reason: string;
  newEvidence?: string;
  requestedOutcome: string;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  resolvedAt?: number;
  decisionNote?: string;
}

export interface DisputeTicket {
  id: string;
  relatedType: DisputeRelatedType;
  relatedId?: string;
  auctionId?: string;
  contractId?: string;
  invoiceNumber?: string;
  laneId?: string;
  raisedBy: string;
  raisedByRole: 'VENDOR' | 'ADMIN' | 'CLIENT';
  category: DisputeCategory;
  priority: DisputePriority;
  description: string;
  preferredResolution?: string;
  attachments: DisputeAttachment[];
  status: DisputeStatus;
  assignedTo?: string;
  dueAt: number;
  createdAt: number;
  updatedAt: number;
  resolution?: {
    proposedBy: string;
    proposedAt: number;
    resolutionType:
      | 'AWARD_CHANGE'
      | 'CONTRACT_ADJUSTMENT'
      | 'REFUND_OR_WAIVER'
      | 'RE_AUCTION'
      | 'COMPENSATION'
      | 'REJECTED_NO_ACTION';
    details: string;
    approvedBy?: string;
    approvedAt?: number;
    final: boolean;
  };
  timeline: DisputeTimelineEvent[];
  messages: DisputeMessage[];
  appeals: DisputeAppeal[];
}

export type AlternateThresholdType = 'percentage' | 'absolute';

export interface AlternateQueueThreshold {
  type: AlternateThresholdType;
  value: number;
  calculatedMaxBid: number;
}

export type AlternateQueueEntryStatus =
  | 'AWARDED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'REAWARDED'
  | 'STANDBY'
  | 'OUT_OF_THRESHOLD'
  | 'SKIPPED'
  | 'CRITICAL_NO_WINNER';

export interface AlternateQueueEntry {
  rank: number;
  vendorId: string;
  vendorName: string;
  bidAmount: number;
  status: AlternateQueueEntryStatus;
  awardedAt?: number;
  acceptanceDeadline?: number;
  priceDifference: number;
  percentageDifference: number;
  withinThreshold: boolean;
  eligibleForAutoAward: boolean;
  reason?: string;
  notifications: Array<{
    channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';
    message: string;
    sentAt: number;
  }>;
}

export interface LaneAlternateQueue {
  laneId: string;
  auctionId: string;
  laneName: string;
  winnerBid: number;
  acceptanceThreshold: AlternateQueueThreshold;
  queue: AlternateQueueEntry[];
  queueStatus: 'ACTIVE' | 'REASSIGNED' | 'COMPLETED' | 'FAILED';
  declineHistory: Array<{
    vendorId: string;
    reason: string;
    at: number;
  }>;
  failedAt?: number;
  failureReason?: string;
}

// --- Domain Models ---

export interface AuctionRuleset {
  id: string;
  minBidDecrement: number;
  timerExtensionThresholdSeconds: number; // default 10
  timerExtensionSeconds: number; // default 120
  allowRankVisibility: boolean;
}

export interface Auction {
  id: string;
  name: string;
  auctionType: AuctionType;
  status: AuctionStatus;
  createdBy: string;
  clientId: string;
  rulesetId: string;
  createdAt: number; // Timestamp
  originRFQId?: string; // Link to Phase 1 RFQ
}

export interface AuctionLane {
  id: string;
  auctionId: string;
  laneName: string; // e.g., "Mumbai -> Delhi"
  sequenceOrder: number;
  status: LaneStatus;
  basePrice: number;
  currentLowestBid?: number; // Optimization field
  minBidDecrement: number; // Can override ruleset if needed, but usually inherits
  timerDurationSeconds: number;
  startTime?: number; // Timestamp when status became RUNNING
  endTime?: number; // Timestamp when it is scheduled to close
  // Phase 1 Extras
  truckType?: string;
  capacity?: string;
  estMonthlyVolume?: number;
  tatDays?: number; // Added
}

export interface Bid {
  id: string;
  auctionLaneId: string;
  vendorId: string;
  bidAmount: number;
  bidTimestamp: number;
  isValid: boolean;
}

export interface AuditEvent {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  eventType: AuditEventType;
  payload: Record<string, any>;
  createdAt: number;
  triggeredBy: string; // User ID or 'SYSTEM'
}

// --- Phase 1: RFI / RFQ / Award ---

export interface RFI {
  id: string;
  title: string;
  description: string;
  deadline: number;
  status: RFIStatus;
  createdBy: string;
  attachments?: string[]; // Added: List of filenames
}

export interface VendorInterest {
  rfiId: string;
  vendorId: string;
  interested: boolean;
  notes: string;
}

export interface RFQ {
  id: string;
  rfiId?: string;
  name: string;
  status: RFQStatus;
  createdBy: string;
}

export interface RFQLane {
  id: string;
  rfqId: string;
  laneName: string;
  truckType: string;
  capacity: string;
  estMonthlyVolume: number;
  tatDays?: number; // Added
}

export interface VendorQuote {
  rfqLaneId: string;
  vendorId: string;
  price: number;
  participating: boolean;
}

export interface Award {
  id: string;
  auctionLaneId: string;
  vendorId: string;
  price: number;
  rank: number; // 1, 2, 3
  reason?: string;
  awardedAt: number;
  awardedBy: string;
  status: AwardAcceptanceStatus;
  acceptanceDeadline: number;
  acceptedAt?: number;
  declinedAt?: number;
  declineReason?: string;
  modificationRequest?: {
    requestedAt: number;
    requestedBy: string;
    category: 'PRICE' | 'TAT' | 'SPECIAL_CONDITIONS' | 'PAYMENT_TERMS' | 'OTHER';
    justification: string;
    proposedChanges: string;
  };
  reawardedFromAwardId?: string;
  reawardedToAwardId?: string;
  notificationLog: Array<{
    channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';
    message: string;
    sentAt: number;
  }>;
}

// --- Phase 2A: Contracts ---

export interface TransportContract {
  id: string;
  clientId: string;
  contractType: 'AUCTION_DERIVED';
  startDate: string; // ISO Date
  endDate: string; // ISO Date
  status: ContractStatus;
  signatureStatus?: ContractSignatureStatus;
  createdFromAuctionId: string;
  vendorId?: string;
  title?: string;
  totalContractValue?: number;
  version?: number;
  lastUpdatedAt?: number;
  signedVendorAt?: number;
  signedClientAt?: number;
  createdAt: number;
}

export interface ContractLane {
  id: string;
  contractId: string;
  laneId: string; // Original AuctionLane ID (or Master Lane ID in future)
  laneName: string;
  baseRate: number; // Usually L1 rate
  effectiveFrom: string;
  effectiveTo: string;
  tatDays?: number; // Added
}

export interface ContractVendorAllocation {
  id: string;
  contractLaneId: string;
  vendorId: string;
  allocationPercentage: number;
  pricingBasis: ContractPricingBasis;
  maxMonthlyVolume?: number;
}

// --- Phase 2B: Execution (TMS Integration) ---

export interface Indent {
  id: string;
  contractLaneId: string;
  contractId: string;
  selectedVendorId: string;
  appliedRate: number;
  status: 'CREATED' | 'ASSIGNED' | 'DISPATCHED' | 'REASSIGNED'; 
  createdAt: number;
}

// --- Phase 3A: SLA & Accountability ---

export interface PlacementSLA {
  id: string;
  clientId: string;
  contractLaneId: string;
  slaType: 'VEHICLE_PLACEMENT';
  slaDurationMinutes: number;
  active: boolean;
}

export interface IndentPlacementTracker {
  id: string;
  indentId: string;
  contractLaneId: string;
  assignedVendorId: string;
  slaStartTime: number;
  slaEndTime: number;
  placementStatus: PlacementStatus;
  resolvedAt?: number;
}

// --- Phase 3B: Spot Auctions ---

export interface SpotAuction {
  id: string;
  indentId: string;
  contractLaneId: string;
  status: SpotAuctionStatus;
  startedAt: number;
  durationSeconds: number; 
  winningBidId?: string;
  winningVendorId?: string;
  winningAmount?: number;
  triggeredByEventId?: string;
}

export interface SpotBid {
  id: string;
  spotAuctionId: string;
  vendorId: string;
  bidAmount: number;
  bidTimestamp: number;
}

// --- DTOs / Helpers ---

export interface CreateAuctionRequest {
  name: string;
  auctionType: AuctionType;
  clientId: string;
  createdBy: string;
  ruleset: Omit<AuctionRuleset, 'id'>;
  lanes: Omit<AuctionLane, 'id' | 'auctionId' | 'status' | 'currentLowestBid' | 'startTime' | 'endTime'>[];
}

// --- Draft Management ---

export enum DraftStatus {
  INCOMPLETE = 'INCOMPLETE',
  READY = 'READY',
}

export interface AuctionDraft {
  draftId: string;
  auctionData: {
    name: string;
    auctionType: AuctionType;
    globalRuleset: {
      minBidDecrement: number;
      timerExtensionThresholdSeconds: number;
      timerExtensionSeconds: number;
      allowRankVisibility: boolean;
    };
    lanes: Array<{
      laneName: string;
      basePrice: number;
      duration: number;
      decrement: number;
      tatDays?: number;
    }>;
  };
  createdBy: string;
  createdAt: number;
  lastModifiedAt: number;
  status: DraftStatus;
  expiresAt: number;
}

export interface SaveDraftRequest {
  auctionData: AuctionDraft['auctionData'];
  createdBy: string;
}

// --- Auction Preview ---

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface LanePreviewData {
  laneName: string;
  basePrice: number;
  duration: number; // in seconds
  decrement: number;
  tatDays?: number;
  minPossiblePrice: number;
  estimatedSavings: number;
}

export interface AuctionPreviewData {
  auctionName: string;
  auctionType: AuctionType;
  status: 'draft' | 'published';
  globalRuleset: {
    minBidDecrement: number;
    timerExtensionThresholdSeconds: number;
    timerExtensionSeconds: number;
    allowRankVisibility: boolean;
  };
  lanes: LanePreviewData[];
  validationErrors: ValidationError[];
  totalBaseValue: number;
  averageLaneDuration: number;
  shortestLaneDuration: number;
  longestLaneDuration: number;
  estimatedCompletionTime: number; // in milliseconds
  vendorEligibilityCount?: number;
  estimatedParticipantCount: number;
}

export interface PreviewMode {
  mode: 'create' | 'edit' | 'view';
  viewAs: 'admin' | 'vendor';
  deviceType: 'desktop' | 'tablet' | 'mobile';
  draftId?: string;
}

// --- Auction Templates ---

export enum TemplateVisibility {
  PRIVATE = 'private',
  TEAM = 'team',
  ORGANIZATION = 'organization',
}

export enum TemplateCategory {
  FTL = 'FTL',
  LTL = 'LTL',
  SPOT = 'Spot',
  REGIONAL = 'Regional',
  OTHER = 'Other',
}

export interface AuctionTemplate {
  templateId: string;
  templateName: string;
  description?: string;
  category: TemplateCategory;
  isSystemTemplate: boolean;
  visibility: TemplateVisibility;
  isFavorite: boolean;
  
  // Template Configuration
  auctionConfiguration: {
    auctionType: AuctionType;
    globalRuleset: {
      minBidDecrement: number;
      timerExtensionThresholdSeconds: number;
      timerExtensionSeconds: number;
      allowRankVisibility: boolean;
    };
    lanes: Array<{
      laneName: string;
      basePrice: number;
      duration: number;
      decrement: number;
      tatDays?: number;
    }>;
  };
  
  // Metadata
  createdBy: string;
  createdAt: number;
  lastModifiedAt: number;
  lastModifiedBy?: string;
  deletedAt?: number; // Soft delete
  isDeleted?: boolean;
  
  // Usage Statistics
  usageCount: number;
  lastUsedAt?: number;
  totalAuctionsCreated?: number;
  averageSavingsPercent?: number;
  mostUsedBy?: string; // User ID of person who used it most
  mostUsedByCount?: number;
}

export interface CreateTemplateRequest {
  templateName: string;
  description?: string;
  category: TemplateCategory;
  visibility: TemplateVisibility;
  isFavorite?: boolean;
  auctionConfiguration: AuctionTemplate['auctionConfiguration'];
  createdBy: string;
}

export interface UpdateTemplateRequest {
  templateName?: string;
  description?: string;
  category?: TemplateCategory;
  visibility?: TemplateVisibility;
  isFavorite?: boolean;
  auctionConfiguration?: AuctionTemplate['auctionConfiguration'];
  lastModifiedBy: string;
}

export interface TemplateShareLink {
  linkId: string;
  templateId: string;
  createdBy: string;
  createdAt: number;
  expiresAt?: number;
  shareToken: string; // URL-safe token
  importedBy: string[];
}
