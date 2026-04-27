import {
  Auction,
  AuctionLane,
  AuctionRuleset,
  AuctionStatus,
  AuctionType,
  AuditEntityType,
  AuditEvent,
  AuditEventType,
  Bid,
  CreateAuctionRequest,
  LaneStatus,
  RFI,
  RFIStatus,
  VendorInterest,
  RFQ,
  RFQStatus,
  RFQLane,
  VendorQuote,
  Award,
  TransportContract,
  ContractStatus,
  ContractSignatureStatus,
  ContractLane,
  ContractVendorAllocation,
  ContractPricingBasis,
  Indent,
  PlacementSLA,
  IndentPlacementTracker,
  PlacementStatus,
  SpotAuction,
  SpotBid,
  SpotAuctionStatus,
  AuctionDraft,
  DraftStatus,
  SaveDraftRequest,
  AuctionTemplate,
  TemplateCategory,
  TemplateVisibility,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  AwardAcceptanceStatus,
  DisputeTicket,
  DisputeStatus,
  DisputePriority,
  DisputeCategory,
  DisputeRelatedType,
  LaneAlternateQueue,
  AlternateQueueEntry,
  AlternateQueueThreshold,
} from '../types';

import { erpEventBus } from '../../../shared/services/eventBus';

/**
 * Singleton class acting as the Backend Service/Database.
 * In a real app, this would be a NodeJS/Go backend with Postgres/Redis.
 */
class AuctionEngine {
  // Phase 0 Stores
  private auctions: Map<string, Auction> = new Map();
  private lanes: Map<string, AuctionLane> = new Map();
  private rulesets: Map<string, AuctionRuleset> = new Map();
  private bids: Map<string, Bid[]> = new Map(); // laneId -> Bids
  private auditLog: AuditEvent[] = [];

  // Draft Stores
  private drafts: Map<string, AuctionDraft> = new Map();

  // Template Stores
  private templates: Map<string, AuctionTemplate> = new Map();

  // Phase 1 Stores
  private rfis: Map<string, RFI> = new Map();
  private vendorInterests: VendorInterest[] = [];
  private rfqs: Map<string, RFQ> = new Map();
  private rfqLanes: Map<string, RFQLane> = new Map();
  private vendorQuotes: VendorQuote[] = [];
  private awards: Map<string, Award> = new Map(); // laneId -> Award

  // Phase 2A Stores
  private contracts: Map<string, TransportContract> = new Map();
  private contractLanes: Map<string, ContractLane> = new Map();
  private contractAllocations: ContractVendorAllocation[] = [];

  // Phase 2B Stores (TMS Simulation)
  private indents: Indent[] = [];

  // Phase 3A Stores (SLA)
  private placementSLAs: Map<string, PlacementSLA> = new Map(); // contractLaneId -> SLA
  private indentTrackers: Map<string, IndentPlacementTracker> = new Map();

  // Phase 3B Stores (Spot)
  private spotAuctions: Map<string, SpotAuction> = new Map();
  private spotBids: Map<string, SpotBid[]> = new Map();

  // Disputes
  private disputes: Map<string, DisputeTicket> = new Map();
  private alternateQueues: Map<string, LaneAlternateQueue> = new Map(); // laneId -> queue
  private blockedVendors: Set<string> = new Set();
  private vendorReliability: Map<string, number> = new Map();

  // Subscribers for reactivity
  private subscribers: Set<() => void> = new Set();
  private pausedLaneRemainingMs: Map<string, number> = new Map();
  private demoVendorPool: string[] = [
    'V-089',
    'V-102',
    'V-134',
    'V-201',
    'V-233',
    'V-278',
    'V-301',
    'V-355',
    'V-411',
    'V-490',
    'V-533',
    'V-611',
  ];

  constructor() {
    this.seedData();
    setInterval(() => this.tick(), 1000);
  }

  // --- Public API ---

  public subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  public getSnapshot() {
    return {
      auctions: Array.from(this.auctions.values()),
      lanes: Array.from(this.lanes.values()),
      auditLog: [...this.auditLog].sort((a, b) => b.createdAt - a.createdAt),
      drafts: Array.from(this.drafts.values()),
      // Phase 1 Snapshots
      rfis: Array.from(this.rfis.values()),
      rfqs: Array.from(this.rfqs.values()),
      // Phase 2A
      contracts: Array.from(this.contracts.values()),
      // Phase 2B
      indents: [...this.indents],
      // Phase 3A
      trackers: Array.from(this.indentTrackers.values()),
      // Phase 3B
      spotAuctions: Array.from(this.spotAuctions.values()),
      disputes: Array.from(this.disputes.values()).sort((a, b) => b.updatedAt - a.updatedAt),
      alternateQueues: Array.from(this.alternateQueues.values()),
    };
  }

  public getAuction(id: string) { return this.auctions.get(id); }
  public getAllAuctions() { return Array.from(this.auctions.values()).sort((a, b) => b.createdAt - a.createdAt); }
  public getRuleset(id: string) { return this.rulesets.get(id); }
  public getLanesByAuction(auctionId: string) {
    return Array.from(this.lanes.values())
      .filter((l) => l.auctionId === auctionId)
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  }
  public getBidsByLane(laneId: string) {
    return (this.bids.get(laneId) || []).sort((a, b) => a.bidAmount - b.bidAmount);
  }
  public getBidsByAuction(auctionId: string) {
    const lanes = this.getLanesByAuction(auctionId);
    const laneIds = new Set(lanes.map(l => l.id));
    const all: Bid[] = [];
    for (const [laneId, bids] of this.bids.entries()) {
      if (!laneIds.has(laneId)) continue;
      all.push(...bids);
    }
    return all.sort((a, b) => b.bidTimestamp - a.bidTimestamp);
  }
  public getAllBids() {
    const all: Bid[] = [];
    for (const bids of this.bids.values()) all.push(...bids);
    return all.sort((a, b) => b.bidTimestamp - a.bidTimestamp);
  }
  public getLane(laneId: string) { return this.lanes.get(laneId); }
  public getServerTime() { return Date.now(); }

  // Draft Getters
  public getDraft(draftId: string) { return this.drafts.get(draftId); }
  public getAllDrafts() {
    return Array.from(this.drafts.values()).sort((a, b) => b.lastModifiedAt - a.lastModifiedAt);
  }
  public getDraftsByUser(userId: string) {
    return Array.from(this.drafts.values())
      .filter(d => d.createdBy === userId)
      .sort((a, b) => b.lastModifiedAt - a.lastModifiedAt);
  }

  // Phase 1 Getters
  public getRFI(id: string) { return this.rfis.get(id); }
  public getVendorInterests(rfiId: string) { return this.vendorInterests.filter(vi => vi.rfiId === rfiId); }
  public getRFQ(id: string) { return this.rfqs.get(id); }
  public getRFQLanes(rfqId: string) { return Array.from(this.rfqLanes.values()).filter(l => l.rfqId === rfqId); }
  public getVendorQuotes(rfqLaneId: string) { return this.vendorQuotes.filter(vq => vq.rfqLaneId === rfqLaneId); }
  public getAward(laneId: string) { return this.awards.get(laneId); }
  public getAwardById(awardId: string) {
    return Array.from(this.awards.values()).find(a => a.id === awardId);
  }
  public getAwardsByAuction(auctionId: string) {
    return this.getLanesByAuction(auctionId)
      .map(lane => this.awards.get(lane.id))
      .filter((award): award is Award => Boolean(award));
  }

  // Phase 2A Getters
  public getContract(id: string) { return this.contracts.get(id); }
  public getContractLanes(contractId: string) { return Array.from(this.contractLanes.values()).filter(cl => cl.contractId === contractId); }
  public getContractAllocations(contractLaneId: string) { return this.contractAllocations.filter(ca => ca.contractLaneId === contractLaneId); }
  public getContracts() { return Array.from(this.contracts.values()); }
  public getContractLane(id: string) { return this.contractLanes.get(id); }

  // Phase 2B Getters
  public getIndents(contractLaneId?: string) {
    if (contractLaneId) return this.indents.filter(i => i.contractLaneId === contractLaneId);
    return this.indents;
  }
  public getIndent(id: string) { return this.indents.find(i => i.id === id); }

  // Phase 3A Getters
  public getPlacementSLA(contractLaneId: string) { return this.placementSLAs.get(contractLaneId); }
  public getTrackersByVendor(vendorId: string) { return Array.from(this.indentTrackers.values()).filter(t => t.assignedVendorId === vendorId); }
  public getAllTrackers() { return Array.from(this.indentTrackers.values()).sort((a, b) => b.slaStartTime - a.slaStartTime); }

  // Phase 3B Getters
  public getSpotAuctions() { return Array.from(this.spotAuctions.values()).sort((a, b) => b.startedAt - a.startedAt); }
  public getSpotBids(spotAuctionId: string) { return (this.spotBids.get(spotAuctionId) || []).sort((a, b) => a.bidAmount - b.bidAmount); }
  public getSpotAuction(id: string) { return this.spotAuctions.get(id); }
  public getDisputes() { return Array.from(this.disputes.values()).sort((a, b) => b.updatedAt - a.updatedAt); }
  public getDispute(id: string) { return this.disputes.get(id); }
  public getAlternateQueueForLane(laneId: string) { return this.alternateQueues.get(laneId); }
  public getAlternateQueueByAuction(auctionId: string) {
    return Array.from(this.alternateQueues.values()).filter(q => q.auctionId === auctionId);
  }


  // --- Phase 3B: Spot Auctions ---

  public triggerSpotAuction(indentId: string) {
    const indent = this.indents.find(i => i.id === indentId);
    if (!indent) { console.error("Spot Trigger Failed: Indent not found"); return; }

    const spotId = crypto.randomUUID();
    const spot: SpotAuction = {
      id: spotId,
      indentId: indent.id,
      contractLaneId: indent.contractLaneId,
      status: SpotAuctionStatus.RUNNING,
      startedAt: Date.now(),
      durationSeconds: 300, // 5 minutes default
    };

    this.spotAuctions.set(spotId, spot);
    this.spotBids.set(spotId, []);

    this.logEvent({
      entityType: AuditEntityType.SPOT_AUCTION,
      entityId: spotId,
      eventType: AuditEventType.SPOT_TRIGGERED,
      triggeredBy: 'SYSTEM',
      payload: { indentId, reason: 'SLA_BREACH' }
    });
    this.notify();
  }

  public placeSpotBid(spotAuctionId: string, vendorId: string, amount: number) {
    const spot = this.spotAuctions.get(spotAuctionId);
    if (!spot) throw new Error("Spot Auction not found");
    if (spot.status !== SpotAuctionStatus.RUNNING) throw new Error("Auction is not running");

    const now = Date.now();
    const endTime = spot.startedAt + (spot.durationSeconds * 1000);
    if (now > endTime) throw new Error("Spot Auction expired");

    const bidId = crypto.randomUUID();
    const bid: SpotBid = {
      id: bidId,
      spotAuctionId,
      vendorId,
      bidAmount: amount,
      bidTimestamp: now
    };

    const bids = this.spotBids.get(spotAuctionId) || [];
    bids.push(bid);
    bids.sort((a, b) => a.bidAmount - b.bidAmount);
    this.spotBids.set(spotAuctionId, bids);

    this.logEvent({
      entityType: AuditEntityType.SPOT_BID,
      entityId: bidId,
      eventType: AuditEventType.SPOT_BID_PLACED,
      triggeredBy: vendorId,
      payload: { amount, spotAuctionId }
    });
    this.notify();
  }

  // --- Disputes ---

  private generateDisputeId() {
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const n = (this.disputes.size + 1).toString().padStart(3, '0');
    return `DIS-${d}-${n}`;
  }

  private getDisputeSlaMs(priority: DisputePriority) {
    if (priority === DisputePriority.CRITICAL) return 24 * 60 * 60 * 1000;
    if (priority === DisputePriority.HIGH) return 48 * 60 * 60 * 1000;
    if (priority === DisputePriority.MEDIUM) return 72 * 60 * 60 * 1000;
    return 96 * 60 * 60 * 1000;
  }

  public createDispute(input: {
    raisedBy: string;
    raisedByRole: 'VENDOR' | 'ADMIN' | 'CLIENT';
    relatedType: DisputeRelatedType;
    relatedId?: string;
    auctionId?: string;
    contractId?: string;
    invoiceNumber?: string;
    laneId?: string;
    category: DisputeCategory;
    priority: DisputePriority;
    description: string;
    preferredResolution?: string;
    attachments?: Array<{ name: string; sizeKb: number }>;
  }) {
    if (input.description.trim().length < 100) {
      throw new Error('Description must be at least 100 characters');
    }
    const now = Date.now();
    const id = this.generateDisputeId();
    const ticket: DisputeTicket = {
      id,
      relatedType: input.relatedType,
      relatedId: input.relatedId,
      auctionId: input.auctionId,
      contractId: input.contractId,
      invoiceNumber: input.invoiceNumber,
      laneId: input.laneId,
      raisedBy: input.raisedBy,
      raisedByRole: input.raisedByRole,
      category: input.category,
      priority: input.priority,
      description: input.description,
      preferredResolution: input.preferredResolution,
      attachments: (input.attachments || []).map(a => ({
        id: crypto.randomUUID(),
        name: a.name,
        sizeKb: a.sizeKb,
        uploadedAt: now,
        uploadedBy: input.raisedBy,
      })),
      status: DisputeStatus.NEW,
      assignedTo: input.category === DisputeCategory.PAYMENT ? 'Finance Team' : 'Procurement Team',
      dueAt: now + this.getDisputeSlaMs(input.priority),
      createdAt: now,
      updatedAt: now,
      timeline: [{
        id: crypto.randomUUID(),
        createdAt: now,
        actorId: input.raisedBy,
        action: 'DISPUTE_CREATED',
        note: `Priority ${input.priority}, category ${input.category}`,
      }],
      messages: [{
        id: crypto.randomUUID(),
        senderId: 'SYSTEM',
        message: `Dispute received. Expected resolution within SLA.`,
        createdAt: now,
        visibility: 'all',
      }],
      appeals: [],
    };
    this.disputes.set(id, ticket);
    this.logEvent({
      entityType: AuditEntityType.AUCTION,
      entityId: input.auctionId || id,
      eventType: AuditEventType.UPDATED,
      triggeredBy: input.raisedBy,
      payload: { action: 'DISPUTE_CREATED', disputeId: id, priority: input.priority },
    });
    this.notify();
    return id;
  }

  public assignDispute(disputeId: string, assignee: string, actor: string) {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) throw new Error('Dispute not found');
    dispute.assignedTo = assignee;
    dispute.updatedAt = Date.now();
    dispute.timeline.push({
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      actorId: actor,
      action: 'ASSIGNED',
      note: `Assigned to ${assignee}`,
    });
    this.notify();
  }

  public updateDisputeStatus(disputeId: string, status: DisputeStatus, actor: string, note?: string) {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) throw new Error('Dispute not found');
    dispute.status = status;
    dispute.updatedAt = Date.now();
    dispute.timeline.push({
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      actorId: actor,
      action: `STATUS_${status}`,
      note,
    });
    this.notify();
  }

  public addDisputeMessage(disputeId: string, senderId: string, message: string, visibility: 'all' | 'internal' = 'all') {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) throw new Error('Dispute not found');
    dispute.messages.push({
      id: crypto.randomUUID(),
      senderId,
      message,
      createdAt: Date.now(),
      visibility,
    });
    dispute.updatedAt = Date.now();
    this.notify();
  }

  public proposeDisputeResolution(
    disputeId: string,
    actor: string,
    resolutionType: NonNullable<DisputeTicket['resolution']>['resolutionType'],
    details: string
  ) {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) throw new Error('Dispute not found');
    dispute.resolution = {
      proposedBy: actor,
      proposedAt: Date.now(),
      resolutionType,
      details,
      final: false,
    };
    dispute.status = DisputeStatus.UNDER_REVIEW;
    dispute.updatedAt = Date.now();
    dispute.timeline.push({
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      actorId: actor,
      action: 'RESOLUTION_PROPOSED',
      note: details,
    });
    this.notify();
  }

  public approveDisputeResolution(disputeId: string, approver: string, finalize: boolean = true) {
    const dispute = this.disputes.get(disputeId);
    if (!dispute || !dispute.resolution) throw new Error('Resolution proposal not found');
    dispute.resolution.approvedBy = approver;
    dispute.resolution.approvedAt = Date.now();
    dispute.resolution.final = finalize;
    dispute.status = finalize ? DisputeStatus.RESOLVED : DisputeStatus.PENDING_RESPONSE;
    dispute.updatedAt = Date.now();
    dispute.timeline.push({
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      actorId: approver,
      action: finalize ? 'RESOLUTION_APPROVED' : 'RESOLUTION_PENDING',
    });
    this.notify();
  }

  public raiseDisputeAppeal(disputeId: string, raisedBy: string, reason: string, requestedOutcome: string, newEvidence?: string) {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) throw new Error('Dispute not found');
    dispute.appeals.push({
      id: crypto.randomUUID(),
      raisedAt: Date.now(),
      raisedBy,
      reason,
      newEvidence,
      requestedOutcome,
      status: 'PENDING',
    });
    dispute.status = DisputeStatus.ESCALATED;
    dispute.updatedAt = Date.now();
    dispute.timeline.push({
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      actorId: raisedBy,
      action: 'APPEAL_RAISED',
      note: reason,
    });
    this.notify();
  }

  public getDisputeMetrics() {
    const list = this.getDisputes();
    const open = list.filter(d => [DisputeStatus.NEW, DisputeStatus.PENDING_RESPONSE].includes(d.status)).length;
    const underReview = list.filter(d => d.status === DisputeStatus.UNDER_REVIEW).length;
    const resolved = list.filter(d => d.status === DisputeStatus.RESOLVED || d.status === DisputeStatus.CLOSED).length;
    const escalated = list.filter(d => d.status === DisputeStatus.ESCALATED).length;
    const resolvedWithDuration = list.filter(d => d.status === DisputeStatus.RESOLVED && d.resolution?.approvedAt)
      .map(d => (d.resolution!.approvedAt! - d.createdAt) / (24 * 60 * 60 * 1000));
    const avgResolutionDays = resolvedWithDuration.length > 0
      ? resolvedWithDuration.reduce((a, b) => a + b, 0) / resolvedWithDuration.length
      : 0;
    const slaCompliant = list.filter(d => (d.resolution?.approvedAt || Number.MAX_SAFE_INTEGER) <= d.dueAt).length;
    return {
      total: list.length,
      open,
      underReview,
      resolved,
      escalated,
      avgResolutionDays,
      disputeRatePct: this.auctions.size > 0 ? (list.length / this.auctions.size) * 100 : 0,
      slaCompliancePct: list.length > 0 ? (slaCompliant / list.length) * 100 : 100,
    };
  }

  // --- Phase 3A: SLA & Accountability ---

  public createPlacementSLA(contractLaneId: string, durationMinutes: number, user: string) {
    const sla: PlacementSLA = {
      id: crypto.randomUUID(),
      clientId: 'CLIENT-001',
      contractLaneId,
      slaType: 'VEHICLE_PLACEMENT',
      slaDurationMinutes: durationMinutes,
      active: true
    };
    this.placementSLAs.set(contractLaneId, sla);
    this.logEvent({
      entityType: AuditEntityType.SLA,
      entityId: sla.id,
      eventType: AuditEventType.SLA_CONFIGURED,
      triggeredBy: user,
      payload: { contractLaneId, durationMinutes }
    });
    this.notify();
  }

  public confirmVehiclePlacement(trackerId: string, user: string) {
    const tracker = this.indentTrackers.get(trackerId);
    if (!tracker) throw new Error("Tracker not found");
    if (tracker.placementStatus !== PlacementStatus.PENDING) throw new Error("Placement not pending");

    tracker.placementStatus = PlacementStatus.PLACED;
    tracker.resolvedAt = Date.now();

    let eventType = AuditEventType.PLACEMENT_CONFIRMED;
    // If confirmed by a spot winner, we can log specifically or just generic
    if (user.includes("SPOT")) eventType = AuditEventType.SPOT_PLACEMENT_CONFIRMED;

    this.logEvent({
      entityType: AuditEntityType.PLACEMENT_TRACKER,
      entityId: trackerId,
      eventType,
      triggeredBy: user,
      payload: { indentId: tracker.indentId, timeTaken: (tracker.resolvedAt - tracker.slaStartTime) / 1000 }
    });
    this.notify();
  }

  // --- Phase 2B: Execution Simulation (Updated for SLA) ---

  public createIndent(contractLaneId: string, user: string) {
    const contractLane = this.contractLanes.get(contractLaneId);
    if (!contractLane) throw new Error("Contract Lane not found");

    const contract = this.contracts.get(contractLane.contractId);
    if (!contract) throw new Error("Contract not found");

    if (contract.status !== ContractStatus.ACTIVE) throw new Error(`Contract is not ACTIVE`);

    const now = Date.now();
    const nowStr = new Date(now).toISOString().split('T')[0];
    if (contract.endDate < nowStr) throw new Error("Contract has expired");

    const allocations = this.getContractAllocations(contractLaneId);
    if (allocations.length === 0) throw new Error("No vendor allocations found for this lane");

    // Weighted Round Robin Logic
    const history = this.indents.filter(i => i.contractLaneId === contractLaneId);
    const totalEvents = history.length;

    let selectedVendor = allocations[0].vendorId;
    let maxDeficit = -Infinity;

    allocations.forEach(alloc => {
      const targetCount = (totalEvents + 1) * (alloc.allocationPercentage / 100);
      const currentCount = history.filter(h => h.selectedVendorId === alloc.vendorId).length;
      const deficit = targetCount - currentCount;

      if (deficit > maxDeficit) {
        maxDeficit = deficit;
        selectedVendor = alloc.vendorId;
      }
    });

    const rate = contractLane.baseRate;

    const indent: Indent = {
      id: crypto.randomUUID(),
      contractId: contract.id,
      contractLaneId: contractLane.id,
      selectedVendorId: selectedVendor,
      appliedRate: rate,
      status: 'ASSIGNED', // Directly assigned for SLA testing
      createdAt: now
    };

    this.indents.unshift(indent);

    this.logEvent({
      entityType: AuditEntityType.INDENT,
      entityId: indent.id,
      eventType: AuditEventType.INDENT_CREATED,
      triggeredBy: user,
      payload: { contractLaneId, vendor: selectedVendor }
    });

    // --- SLA HOOK ---
    const sla = this.placementSLAs.get(contractLaneId);
    if (sla && sla.active) {
      const trackerId = crypto.randomUUID();
      const slaDurationMs = sla.slaDurationMinutes * 60 * 1000;
      const tracker: IndentPlacementTracker = {
        id: trackerId,
        indentId: indent.id,
        contractLaneId,
        assignedVendorId: selectedVendor,
        slaStartTime: now,
        slaEndTime: now + slaDurationMs,
        placementStatus: PlacementStatus.PENDING
      };
      this.indentTrackers.set(trackerId, tracker);

      // Log implicit tracker creation? Optional, kept minimal here.
    }

    this.notify();
    return indent.id;
  }


  // --- Phase 2A Actions ---

  public createContractDraftFromAuction(auctionId: string, user: string) {
    const auction = this.auctions.get(auctionId);
    if (!auction) throw new Error("Auction not found");

    // Ideally check if fully awarded, but for now allow partial
    const lanes = this.getLanesByAuction(auctionId);
    const awards = lanes.map(l => this.awards.get(l.id)).filter(a => !!a);

    if (awards.length === 0) throw new Error("No awards found for this auction. Cannot create contract.");

    const contractId = crypto.randomUUID();
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // +1 Year default

    const contract: TransportContract = {
      id: contractId,
      clientId: auction.clientId,
      contractType: 'AUCTION_DERIVED',
      status: ContractStatus.DRAFT,
      createdFromAuctionId: auctionId,
      startDate,
      endDate,
      createdAt: Date.now()
    };
    this.contracts.set(contractId, contract);

    // Create lanes and allocations
    lanes.forEach(lane => {
      const award = this.awards.get(lane.id);
      if (!award) return; // Skip unawarded lanes

      const clId = crypto.randomUUID();
      const cl: ContractLane = {
        id: clId,
        contractId,
        laneId: lane.id,
        laneName: lane.laneName,
        baseRate: award.price,
        effectiveFrom: startDate,
        effectiveTo: endDate,
        tatDays: lane.tatDays // Propagate TAT
      };
      this.contractLanes.set(clId, cl);

      // Default Allocation: 100% to Winner
      this.contractAllocations.push({
        id: crypto.randomUUID(),
        contractLaneId: clId,
        vendorId: award.vendorId,
        allocationPercentage: 100,
        pricingBasis: ContractPricingBasis.L1_RATE
      });
    });

    this.logEvent({
      entityType: AuditEntityType.CONTRACT,
      entityId: contractId,
      eventType: AuditEventType.CONTRACT_GENERATED,
      triggeredBy: user,
      payload: { auctionId, lanesCount: awards.length }
    });
    this.notify();
    return contractId;
  }

  public generateContractDraftFromAward(awardId: string, user: string) {
    const award = this.getAwardById(awardId);
    if (!award) throw new Error('Award not found');
    if (award.status !== AwardAcceptanceStatus.ACCEPTED) throw new Error('Award must be accepted before contract generation');

    const lane = this.lanes.get(award.auctionLaneId);
    if (!lane) throw new Error('Lane not found');
    const auction = this.auctions.get(lane.auctionId);
    if (!auction) throw new Error('Auction not found');

    const existing = Array.from(this.contracts.values()).find(
      c => c.createdFromAuctionId === auction.id && c.vendorId === award.vendorId && c.status === ContractStatus.DRAFT
    );

    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const contractId = existing?.id || `CON-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    if (!existing) {
      const contract: TransportContract = {
        id: contractId,
        clientId: auction.clientId,
        contractType: 'AUCTION_DERIVED',
        status: ContractStatus.DRAFT,
        signatureStatus: ContractSignatureStatus.DRAFT,
        createdFromAuctionId: auction.id,
        vendorId: award.vendorId,
        title: `${auction.name} - ${award.vendorId}`,
        totalContractValue: 0,
        version: 1,
        createdAt: Date.now(),
        startDate,
        endDate,
        lastUpdatedAt: Date.now(),
      };
      this.contracts.set(contractId, contract);
    }

    const existsLane = this.getContractLanes(contractId).some(cl => cl.laneId === lane.id);
    if (!existsLane) {
      const clId = crypto.randomUUID();
      this.contractLanes.set(clId, {
        id: clId,
        contractId,
        laneId: lane.id,
        laneName: lane.laneName,
        baseRate: award.price,
        effectiveFrom: startDate,
        effectiveTo: endDate,
        tatDays: lane.tatDays,
      });
      this.contractAllocations.push({
        id: crypto.randomUUID(),
        contractLaneId: clId,
        vendorId: award.vendorId,
        allocationPercentage: 100,
        pricingBasis: ContractPricingBasis.L1_RATE,
      });
    }

    const contract = this.contracts.get(contractId);
    if (contract) {
      const contractLanes = this.getContractLanes(contractId);
      contract.totalContractValue = contractLanes.reduce((sum, cl) => sum + cl.baseRate * 20, 0);
      contract.lastUpdatedAt = Date.now();
    }

    this.logEvent({
      entityType: AuditEntityType.CONTRACT,
      entityId: contractId,
      eventType: AuditEventType.CONTRACT_GENERATED,
      triggeredBy: user,
      payload: { awardId, laneId: lane.id, vendorId: award.vendorId }
    });

    const clanes = this.getContractLanes(contractId);
    erpEventBus.emit('auction.awarded', 'ams', {
      contractId,
      vendorId: award.vendorId,
      clientId: auction.clientId,
      lanes: clanes.map(cl => ({ laneName: cl.laneName, baseRate: cl.baseRate })),
      startDate,
      endDate
    }, user, 't-001');

    this.notify();
    return contractId;
  }

  public updateLaneAllocations(contractLaneId: string, allocations: { vendorId: string, percent: number }[], user: string) {
    // Validate 100%
    const total = allocations.reduce((acc, curr) => acc + curr.percent, 0);
    if (total !== 100) throw new Error(`Total allocation must be 100%. Current: ${total}%`);

    // Clear existing
    this.contractAllocations = this.contractAllocations.filter(ca => ca.contractLaneId !== contractLaneId);

    // Add new
    allocations.forEach(a => {
      this.contractAllocations.push({
        id: crypto.randomUUID(),
        contractLaneId: contractLaneId,
        vendorId: a.vendorId,
        allocationPercentage: a.percent,
        pricingBasis: ContractPricingBasis.L1_RATE // For simplicity in Phase 2A, force L1 matching
      });
    });

    this.logEvent({
      entityType: AuditEntityType.CONTRACT,
      entityId: contractLaneId, // Tracking at lane level for specificity
      eventType: AuditEventType.ALLOCATION_UPDATED,
      triggeredBy: user,
      payload: { allocations }
    });
    this.notify();
  }

  public activateContract(contractId: string, user: string) {
    const contract = this.contracts.get(contractId);
    if (!contract) throw new Error("Contract not found");
    if (contract.status !== ContractStatus.DRAFT) throw new Error("Contract is not in DRAFT state");

    contract.status = ContractStatus.ACTIVE;

    this.logEvent({
      entityType: AuditEntityType.CONTRACT,
      entityId: contractId,
      eventType: AuditEventType.CONTRACT_ACTIVATED,
      triggeredBy: user,
      payload: { status: 'ACTIVE' }
    });
    this.notify();
  }

  public bulkImportContracts(
    rows: Array<{
      contractId?: string;
      vendorId?: string;
      vendorName: string;
      contractType: string;
      startDate: string;
      endDate: string;
      contractValue: number;
      paymentTerms: string;
      clientName?: string;
      signingDate?: string;
      contractStatus?: string;
      performanceBondAmount?: number;
      specialTerms?: string;
      contactPerson?: string;
      lanes: Array<{
        laneName: string;
        origin: string;
        destination: string;
        ratePerTrip: number;
        tatDays: number;
        vehicleType: string;
      }>;
    }>,
    options: {
      duplicateHandling: 'skip' | 'update';
      autoGenerateIds: boolean;
      linkExistingAuctions: boolean;
      defaultStatus: 'DRAFT' | 'ACTIVE';
      createDocuments?: boolean;
      sendNotifications?: boolean;
    },
    user: string,
  ) {
    const importId = `CON-IMP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const results: Array<{ contractId?: string; status: 'imported' | 'failed' | 'updated' | 'skipped'; message: string }> = [];

    const toStatus = (raw?: string): ContractStatus => {
      const v = (raw || '').toUpperCase();
      if (v === 'ACTIVE') return ContractStatus.ACTIVE;
      if (v === 'EXPIRED') return ContractStatus.EXPIRED;
      if (v === 'TERMINATED') return ContractStatus.TERMINATED;
      if (v === 'COMPLETED') return ContractStatus.COMPLETED;
      return options.defaultStatus === 'ACTIVE' ? ContractStatus.ACTIVE : ContractStatus.DRAFT;
    };

    const generateId = () => `CON-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    rows.forEach((row) => {
      try {
        let id = row.contractId || '';
        if (!id) {
          if (!options.autoGenerateIds) {
            results.push({ status: 'failed', message: 'Missing contract ID and auto-generate disabled.' });
            return;
          }
          id = generateId();
          while (this.contracts.has(id)) id = generateId();
        }

        const exists = this.contracts.has(id);
        if (exists && options.duplicateHandling === 'skip') {
          results.push({ contractId: id, status: 'skipped', message: 'Skipped duplicate contract ID.' });
          return;
        }

        let createdFromAuctionId = 'IMPORTED';
        if (options.linkExistingAuctions && row.lanes.length > 0) {
          const firstLane = row.lanes[0];
          const expected = `${firstLane.origin} ${firstLane.destination}`.toLowerCase();
          const matchedLane = Array.from(this.lanes.values()).find((l) => {
            const name = l.laneName.toLowerCase();
            return name.includes(expected) || name.includes(firstLane.laneName.toLowerCase());
          });
          if (matchedLane) createdFromAuctionId = matchedLane.auctionId;
        }

        const now = Date.now();
        const contract: TransportContract = {
          id,
          clientId: row.clientName || 'Imported Client',
          contractType: 'AUCTION_DERIVED',
          status: toStatus(row.contractStatus),
          signatureStatus: ContractSignatureStatus.DRAFT,
          createdFromAuctionId,
          vendorId: row.vendorId,
          title: `${row.vendorName} - ${row.contractType}`,
          totalContractValue: row.contractValue,
          version: 1,
          createdAt: exists ? (this.contracts.get(id)?.createdAt || now) : now,
          startDate: row.startDate,
          endDate: row.endDate,
          lastUpdatedAt: now,
        };

        if (exists && options.duplicateHandling === 'update') {
          const existingLaneIds = this.getContractLanes(id).map((l) => l.id);
          existingLaneIds.forEach((laneId) => this.contractLanes.delete(laneId));
          const laneIdSet = new Set(existingLaneIds);
          this.contractAllocations = this.contractAllocations.filter((a) => !laneIdSet.has(a.contractLaneId));
        }

        this.contracts.set(id, contract);

        row.lanes.forEach((lane) => {
          const contractLaneId = crypto.randomUUID();
          this.contractLanes.set(contractLaneId, {
            id: contractLaneId,
            contractId: id,
            laneId: `IMPORTED-LANE-${contractLaneId.slice(0, 8)}`,
            laneName: lane.laneName || `${lane.origin} - ${lane.destination}`,
            baseRate: lane.ratePerTrip,
            effectiveFrom: row.startDate,
            effectiveTo: row.endDate,
            tatDays: lane.tatDays,
          });
          if (row.vendorId) {
            this.contractAllocations.push({
              id: crypto.randomUUID(),
              contractLaneId,
              vendorId: row.vendorId,
              allocationPercentage: 100,
              pricingBasis: ContractPricingBasis.CUSTOM_RATE,
            });
          }
        });

        this.logEvent({
          entityType: AuditEntityType.CONTRACT,
          entityId: id,
          eventType: exists ? AuditEventType.UPDATED : AuditEventType.CREATED,
          triggeredBy: user,
          payload: {
            importId,
            imported: true,
            laneCount: row.lanes.length,
            paymentTerms: row.paymentTerms,
            contractValue: row.contractValue,
            createDocuments: Boolean(options.createDocuments),
            sendNotifications: Boolean(options.sendNotifications),
          },
        });

        results.push({ contractId: id, status: exists ? 'updated' : 'imported', message: exists ? 'Updated existing contract.' : 'Imported successfully.' });
      } catch (error) {
        results.push({
          contractId: row.contractId,
          status: 'failed',
          message: (error as Error).message,
        });
      }
    });

    const importedContracts = results.filter((r) => r.status === 'imported' || r.status === 'updated').length;
    const failedContracts = results.filter((r) => r.status === 'failed').length;
    const summary = {
      importId,
      totalContracts: rows.length,
      importedContracts,
      failedContracts,
      status: failedContracts === 0 ? 'completed' : importedContracts > 0 ? 'partial' : 'failed',
      results,
    };

    this.logEvent({
      entityType: AuditEntityType.CONTRACT,
      entityId: importId,
      eventType: AuditEventType.UPDATED,
      triggeredBy: user,
      payload: summary,
    });

    this.notify();
    return summary;
  }

  // --- Phase 1 Actions ---

  // 1. RFI
  public createRFI(title: string, description: string, deadline: number, user: string, attachments: string[] = []) {
    const id = crypto.randomUUID();
    const rfi: RFI = { id, title, description, deadline, status: RFIStatus.OPEN, createdBy: user, attachments };
    this.rfis.set(id, rfi);
    this.logEvent({ entityType: AuditEntityType.RFI, entityId: id, eventType: AuditEventType.CREATED, triggeredBy: user, payload: { title, attachments } });
    this.notify();
    return id;
  }

  public recordVendorInterest(rfiId: string, vendorId: string, interested: boolean, notes: string) {
    this.vendorInterests.push({ rfiId, vendorId, interested, notes });
    this.notify();
  }

  // 2. RFQ
  public createRFQ(name: string, rfiId: string | undefined, user: string) {
    const id = crypto.randomUUID();
    const rfq: RFQ = { id, rfiId, name, status: RFQStatus.DRAFT, createdBy: user };
    this.rfqs.set(id, rfq);
    this.logEvent({ entityType: AuditEntityType.RFQ, entityId: id, eventType: AuditEventType.CREATED, triggeredBy: user, payload: { name, rfiId } });
    this.notify();
    return id;
  }

  public addRFQLane(rfqId: string, laneData: Omit<RFQLane, 'id' | 'rfqId'>) {
    const id = crypto.randomUUID();
    this.rfqLanes.set(id, { id, rfqId, ...laneData });
    this.notify();
  }

  public sendRFQ(rfqId: string, user: string) {
    const rfq = this.rfqs.get(rfqId);
    if (rfq) {
      rfq.status = RFQStatus.SENT;
      this.logEvent({ entityType: AuditEntityType.RFQ, entityId: rfqId, eventType: AuditEventType.STATUS_CHANGE, triggeredBy: user, payload: { status: 'SENT' } });
      this.notify();
    }
  }

  public submitQuote(rfqLaneId: string, vendorId: string, price: number, participating: boolean) {
    // Upsert
    const existing = this.vendorQuotes.findIndex(q => q.rfqLaneId === rfqLaneId && q.vendorId === vendorId);
    if (existing >= 0) {
      this.vendorQuotes[existing] = { rfqLaneId, vendorId, price, participating };
    } else {
      this.vendorQuotes.push({ rfqLaneId, vendorId, price, participating });
    }
    this.notify();
  }

  public createAuctionFromRFQ(rfqId: string, ruleset: Omit<AuctionRuleset, 'id'>, user: string) {
    const rfq = this.rfqs.get(rfqId);
    if (!rfq) throw new Error("RFQ not found");

    const rfqLanes = this.getRFQLanes(rfqId);
    const lanes: CreateAuctionRequest['lanes'] = rfqLanes.map((rl, idx) => {
      // Determine base price: Lowest quote or a default high number if no quotes
      const quotes = this.getVendorQuotes(rl.id).filter(q => q.participating && q.price > 0);
      const minQuote = quotes.length > 0 ? Math.min(...quotes.map(q => q.price)) : 100000;

      return {
        laneName: rl.laneName,
        sequenceOrder: idx + 1,
        basePrice: minQuote, // Start auction at lowest RFQ quote
        minBidDecrement: ruleset.minBidDecrement,
        timerDurationSeconds: 300, // Default 5 mins
        // Phase 1 Extra Data
        truckType: rl.truckType,
        capacity: rl.capacity,
        estMonthlyVolume: rl.estMonthlyVolume,
        tatDays: rl.tatDays // Propagate TAT
      };
    });

    const req: CreateAuctionRequest = {
      name: `Auction: ${rfq.name}`,
      auctionType: AuctionType.REVERSE,
      clientId: 'ENTERPRISE-01',
      createdBy: user,
      ruleset,
      lanes
    };

    const auctionId = this.createAuction(req);

    // Link back
    const auction = this.auctions.get(auctionId);
    if (auction) auction.originRFQId = rfqId;

    // Lock RFQ
    rfq.status = RFQStatus.LOCKED;

    this.logEvent({ entityType: AuditEntityType.RFQ, entityId: rfqId, eventType: AuditEventType.STATUS_CHANGE, triggeredBy: user, payload: { status: 'LOCKED', auctionId } });

    return auctionId;
  }

  public awardLane(laneId: string, vendorId: string, price: number, rank: number, reason: string, user: string) {
    const lane = this.lanes.get(laneId);
    if (!lane) throw new Error("Lane not found");

    // Allow awarding if Closed OR if manual override
    lane.status = LaneStatus.AWARDED;
    this.awards.set(laneId, {
      id: crypto.randomUUID(),
      auctionLaneId: laneId,
      vendorId,
      price,
      rank,
      reason,
      awardedAt: Date.now(),
      awardedBy: user,
      status: AwardAcceptanceStatus.PENDING,
      acceptanceDeadline: Date.now() + 24 * 60 * 60 * 1000,
      notificationLog: []
    });

    this.logEvent({
      entityType: AuditEntityType.AWARD,
      entityId: laneId,
      eventType: AuditEventType.AWARDED,
      triggeredBy: user,
      payload: { vendorId, price, rank, reason }
    });
    this.notify();
  }

  public finalizeAuctionResults(auctionId: string, user: string = 'SYSTEM') {
    const lanes = this.getLanesByAuction(auctionId);
    lanes.forEach((lane) => {
      if (this.awards.has(lane.id)) return;
      const bids = this.getBidsByLane(lane.id);
      if (bids.length === 0) return;
      const best = bids[0];
      const rankMap = Array.from(new Set(bids.map(b => b.vendorId)));
      const rank = rankMap.findIndex(v => v === best.vendorId) + 1;
      this.awardLane(lane.id, best.vendorId, best.bidAmount, rank > 0 ? rank : 1, 'Auto-awarded on auction closure', user);
    });

    const auction = this.auctions.get(auctionId);
    if (auction && auction.status !== AuctionStatus.COMPLETED) {
      auction.status = AuctionStatus.COMPLETED;
      this.logEvent({
        entityType: AuditEntityType.AUCTION,
        entityId: auctionId,
        eventType: AuditEventType.STATUS_CHANGE,
        triggeredBy: user,
        payload: { newStatus: 'COMPLETED', reason: 'Finalized Results' }
      });
    }
    this.createOrRefreshAlternateQueue(auctionId);
    this.notify();
  }

  public sendAwardReminder(awardId: string, channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP', actor: string) {
    const award = this.getAwardById(awardId);
    if (!award) throw new Error('Award not found');
    award.notificationLog.push({
      channel,
      message: `Reminder sent via ${channel}`,
      sentAt: Date.now(),
    });
    this.logEvent({
      entityType: AuditEntityType.AWARD,
      entityId: award.auctionLaneId,
      eventType: AuditEventType.UPDATED,
      triggeredBy: actor,
      payload: { action: 'REMINDER_SENT', channel }
    });
    this.notify();
  }

  public extendAwardDeadline(awardId: string, hours: number, actor: string) {
    const award = this.getAwardById(awardId);
    if (!award) throw new Error('Award not found');
    if (hours <= 0) throw new Error('Hours must be > 0');
    award.acceptanceDeadline += hours * 60 * 60 * 1000;
    this.logEvent({
      entityType: AuditEntityType.AWARD,
      entityId: award.auctionLaneId,
      eventType: AuditEventType.UPDATED,
      triggeredBy: actor,
      payload: { action: 'DEADLINE_EXTENDED', hours, newDeadline: award.acceptanceDeadline }
    });
    this.notify();
  }

  public updateAwardAcceptance(
    awardId: string,
    action: 'ACCEPT' | 'DECLINE' | 'REQUEST_MODIFICATION',
    payload: {
      declineReason?: string;
      modificationCategory?: 'PRICE' | 'TAT' | 'SPECIAL_CONDITIONS' | 'PAYMENT_TERMS' | 'OTHER';
      justification?: string;
      proposedChanges?: string;
    },
    actor: string,
  ) {
    const award = this.getAwardById(awardId);
    if (!award) throw new Error('Award not found');
    if (award.status === AwardAcceptanceStatus.ACCEPTED) throw new Error('Award already accepted');

    if (action === 'ACCEPT') {
      award.status = AwardAcceptanceStatus.ACCEPTED;
      award.acceptedAt = Date.now();
      this.generateContractDraftFromAward(award.id, actor);
    }

    if (action === 'DECLINE') {
      award.status = AwardAcceptanceStatus.DECLINED;
      award.declinedAt = Date.now();
      award.declineReason = payload.declineReason || 'No reason provided';
      const reliability = this.vendorReliability.get(award.vendorId) ?? 95;
      this.vendorReliability.set(award.vendorId, Math.max(50, reliability - 3));
      this.advanceAwardFromQueue(award.auctionLaneId, actor, 'DECLINED');
    }

    if (action === 'REQUEST_MODIFICATION') {
      if (!payload.modificationCategory || !payload.justification || !payload.proposedChanges) {
        throw new Error('Modification request requires complete details');
      }
      award.status = AwardAcceptanceStatus.MODIFICATION_REQUESTED;
      award.modificationRequest = {
        requestedAt: Date.now(),
        requestedBy: actor,
        category: payload.modificationCategory,
        justification: payload.justification,
        proposedChanges: payload.proposedChanges,
      };
    }

    this.logEvent({
      entityType: AuditEntityType.AWARD,
      entityId: award.auctionLaneId,
      eventType: AuditEventType.UPDATED,
      triggeredBy: actor,
      payload: { action, status: award.status }
    });
    const auctionId = this.lanes.get(award.auctionLaneId)?.auctionId;
    if (auctionId) this.createOrRefreshAlternateQueue(auctionId);
    this.notify();
  }

  private handleAwardDecline(award: Award, actor: string) {
    this.advanceAwardFromQueue(award.auctionLaneId, actor, 'DECLINED');
  }

  public getAcceptanceStats(auctionId: string) {
    const awards = this.getAwardsByAuction(auctionId);
    const counts = {
      total: awards.length,
      accepted: awards.filter(a => a.status === AwardAcceptanceStatus.ACCEPTED).length,
      pending: awards.filter(a => a.status === AwardAcceptanceStatus.PENDING).length,
      declined: awards.filter(a => a.status === AwardAcceptanceStatus.DECLINED).length,
      expired: awards.filter(a => a.status === AwardAcceptanceStatus.EXPIRED).length,
    };
    return counts;
  }

  public getVendorSummary(vendorId: string) {
    const awards = Array.from(this.awards.values()).filter(a => a.vendorId === vendorId);
    return {
      vendorId,
      companyName: vendorId === 'V-089' ? 'Swift Logistics' : `Vendor ${vendorId}`,
      contactName: vendorId === 'V-089' ? 'Rajesh Kumar' : 'Ops Manager',
      phone: '+91-9876543210',
      email: `${vendorId.toLowerCase()}@example.com`,
      performanceScore: 80 + (vendorId.charCodeAt(vendorId.length - 1) % 20),
      recentWinRate: Math.min(95, awards.length * 8),
      reliability: 4 + (awards.length > 2 ? 1 : 0),
    };
  }

  public getLaneTopBidders(laneId: string, topN: number = 5) {
    const bids = this.getBidsByLane(laneId);
    return Array.from(new Set(bids.map(b => b.vendorId)))
      .map(vendorId => ({
        vendorId,
        bestBid: bids.find(b => b.vendorId === vendorId)?.bidAmount || Number.MAX_SAFE_INTEGER,
      }))
      .sort((a, b) => a.bestBid - b.bestBid)
      .slice(0, topN);
  }

  public getAuctionResultsSummary(auctionId: string) {
    const auction = this.getAuction(auctionId);
    if (!auction) throw new Error('Auction not found');
    const lanes = this.getLanesByAuction(auctionId);
    const awards = this.getAwardsByAuction(auctionId);
    const allBids = this.getBidsByAuction(auctionId);
    const startedAt = lanes.reduce((min, lane) => {
      if (!lane.startTime) return min;
      return Math.min(min, lane.startTime);
    }, Number.MAX_SAFE_INTEGER);
    const endedAt = lanes.reduce((max, lane) => Math.max(max, lane.endTime || 0), 0);

    const totalStarting = lanes.reduce((sum, lane) => sum + lane.basePrice, 0);
    const totalAwarded = awards.reduce((sum, award) => sum + award.price, 0);
    const totalSavings = Math.max(0, totalStarting - totalAwarded);
    const activeParticipants = new Set(allBids.map(b => b.vendorId)).size;

    const winnersByVendor = new Map<string, number>();
    awards.forEach(a => winnersByVendor.set(a.vendorId, (winnersByVendor.get(a.vendorId) || 0) + 1));
    const multiLaneWinners = Array.from(winnersByVendor.values()).filter(v => v >= 2).length;

    return {
      auction,
      lanes,
      awards,
      totalStarting,
      totalAwarded,
      totalSavings,
      savingsPct: totalStarting > 0 ? (totalSavings / totalStarting) * 100 : 0,
      invitedVendors: this.demoVendorPool.length,
      activeParticipants,
      totalBids: allBids.length,
      avgBidsPerLane: lanes.length > 0 ? allBids.length / lanes.length : 0,
      uniqueWinners: winnersByVendor.size,
      lanesAwarded: awards.length,
      pendingAcceptance: awards.filter(a => a.status === AwardAcceptanceStatus.PENDING).length,
      multiLaneWinners,
      largestAward: awards.slice().sort((a, b) => b.price - a.price)[0],
      smallestAward: awards.slice().sort((a, b) => a.price - b.price)[0],
      startedAt: startedAt === Number.MAX_SAFE_INTEGER ? auction.createdAt : startedAt,
      endedAt,
      durationMs: endedAt > 0 ? endedAt - (startedAt === Number.MAX_SAFE_INTEGER ? auction.createdAt : startedAt) : 0,
    };
  }

  private getThresholdForLane(lane: AuctionLane, winnerBid: number): AlternateQueueThreshold {
    const auction = this.auctions.get(lane.auctionId);
    if (auction?.auctionType === AuctionType.SPOT) {
      return {
        type: 'absolute',
        value: 5000,
        calculatedMaxBid: winnerBid + 5000,
      };
    }
    const percentage = 5;
    return {
      type: 'percentage',
      value: percentage,
      calculatedMaxBid: winnerBid * (1 + percentage / 100),
    };
  }

  private isVendorEligibleForQueue(vendorId: string) {
    const summary = this.getVendorSummary(vendorId);
    if (this.blockedVendors.has(vendorId)) return { ok: false, reason: 'Vendor blocked/suspended' };
    if ((summary.performanceScore || 0) < 70) return { ok: false, reason: 'Performance score below threshold' };
    const hasOpenDispute = this.getDisputes().some(d => d.raisedBy === vendorId && [DisputeStatus.NEW, DisputeStatus.UNDER_REVIEW, DisputeStatus.ESCALATED].includes(d.status));
    if (hasOpenDispute) return { ok: false, reason: 'Open disputes active' };
    return { ok: true as const };
  }

  public createOrRefreshAlternateQueue(auctionId: string) {
    const lanes = this.getLanesByAuction(auctionId);
    lanes.forEach((lane) => {
      const bids = this.getBidsByLane(lane.id);
      if (bids.length === 0) return;
      const bestByVendor = Array.from(new Set(bids.map(b => b.vendorId))).map((vendorId) => ({
        vendorId,
        bidAmount: bids.find(b => b.vendorId === vendorId)?.bidAmount || Number.MAX_SAFE_INTEGER,
      })).sort((a, b) => a.bidAmount - b.bidAmount);
      if (bestByVendor.length === 0) return;

      const winnerBid = bestByVendor[0].bidAmount;
      const threshold = this.getThresholdForLane(lane, winnerBid);
      const currentAward = this.awards.get(lane.id);

      const queue: AlternateQueueEntry[] = bestByVendor.map((row, idx) => {
        const rank = idx + 1;
        const diff = Math.max(0, row.bidAmount - winnerBid);
        const pctDiff = winnerBid > 0 ? (diff / winnerBid) * 100 : 0;
        const withinThreshold = row.bidAmount <= threshold.calculatedMaxBid;
        const eligibleCheck = this.isVendorEligibleForQueue(row.vendorId);
        const status: AlternateQueueEntry['status'] =
          currentAward?.vendorId === row.vendorId
            ? currentAward.status === AwardAcceptanceStatus.ACCEPTED
              ? 'ACCEPTED'
              : currentAward.status === AwardAcceptanceStatus.DECLINED
                ? 'DECLINED'
                : currentAward.status === AwardAcceptanceStatus.EXPIRED
                  ? 'EXPIRED'
                  : currentAward.status === AwardAcceptanceStatus.REAWARDED
                    ? 'REAWARDED'
                    : 'AWARDED'
            : withinThreshold
              ? 'STANDBY'
              : 'OUT_OF_THRESHOLD';

        return {
          rank,
          vendorId: row.vendorId,
          vendorName: this.getVendorSummary(row.vendorId).companyName,
          bidAmount: row.bidAmount,
          priceDifference: diff,
          percentageDifference: pctDiff,
          status,
          withinThreshold,
          eligibleForAutoAward: withinThreshold && eligibleCheck.ok,
          reason: eligibleCheck.ok ? undefined : eligibleCheck.reason,
          awardedAt: currentAward?.vendorId === row.vendorId ? currentAward.awardedAt : undefined,
          acceptanceDeadline: currentAward?.vendorId === row.vendorId ? currentAward.acceptanceDeadline : undefined,
          notifications: [],
        };
      });

      const existing = this.alternateQueues.get(lane.id);
      this.alternateQueues.set(lane.id, {
        laneId: lane.id,
        auctionId: lane.auctionId,
        laneName: lane.laneName,
        winnerBid,
        acceptanceThreshold: threshold,
        queue,
        queueStatus: existing?.queueStatus || 'ACTIVE',
        declineHistory: existing?.declineHistory || [],
        failedAt: existing?.failedAt,
        failureReason: existing?.failureReason,
      });
    });
    this.notify();
  }

  public getVendorQueueStatus(vendorId: string) {
    return Array.from(this.alternateQueues.values())
      .map(q => {
        const mine = q.queue.find(e => e.vendorId === vendorId);
        if (!mine) return null;
        const currentWinner = q.queue.find(e => ['AWARDED', 'ACCEPTED', 'REAWARDED'].includes(e.status)) || q.queue[0];
        let chance: 'HIGH' | 'MEDIUM' | 'LOW' | 'NO_CHANCE' = 'LOW';
        if (!mine.eligibleForAutoAward || mine.status === 'OUT_OF_THRESHOLD') chance = 'NO_CHANCE';
        else if (mine.rank === 2 && mine.percentageDifference <= 2 && currentWinner.status !== 'ACCEPTED') chance = 'HIGH';
        else if (mine.rank <= 3 && mine.percentageDifference <= 5) chance = 'MEDIUM';
        return {
          laneId: q.laneId,
          laneName: q.laneName,
          auctionId: q.auctionId,
          myRank: mine.rank,
          myBid: mine.bidAmount,
          leadingBid: currentWinner.bidAmount,
          difference: mine.bidAmount - currentWinner.bidAmount,
          chance,
          status: currentWinner.status,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }

  public getAlternateQueueMetrics(auctionId?: string) {
    const queues = auctionId ? this.getAlternateQueueByAuction(auctionId) : Array.from(this.alternateQueues.values());
    const totalLanes = queues.length;
    const accepted = queues.filter(q => q.queue.some(e => e.status === 'ACCEPTED')).length;
    const pending = queues.filter(q => q.queue.some(e => e.status === 'AWARDED')).length;
    const declined = queues.reduce((sum, q) => sum + q.declineHistory.length, 0);
    const autoReawards = queues.filter(q => q.queue.some(e => e.status === 'AWARDED' && e.rank > 1)).length;
    const standby = queues.reduce((sum, q) => sum + q.queue.filter(e => e.status === 'STANDBY').length, 0);
    const failed = queues.filter(q => q.queueStatus === 'FAILED').length;
    const depthAvg = totalLanes > 0 ? queues.reduce((sum, q) => sum + q.queue.length, 0) / totalLanes : 0;
    return {
      totalLanes,
      accepted,
      pending,
      declined,
      autoReawards,
      standby,
      failed,
      averageDepth: depthAvg,
    };
  }

  public sendQueuePreAlert(laneId: string, vendorId: string, actor: string) {
    const queue = this.alternateQueues.get(laneId);
    if (!queue) throw new Error('Queue not found');
    const entry = queue.queue.find(e => e.vendorId === vendorId);
    if (!entry) throw new Error('Vendor not found in queue');
    if (!['STANDBY', 'SKIPPED', 'OUT_OF_THRESHOLD'].includes(entry.status)) {
      throw new Error('Pre-alert allowed only for standby vendors');
    }
    this.pushQueueNotification(
      laneId,
      vendorId,
      `PRE_ALERT_MANUAL: You may be awarded ${queue.laneName} soon. Please keep capacity ready.`,
      'EMAIL',
    );
    this.logEvent({
      entityType: AuditEntityType.AWARD,
      entityId: laneId,
      eventType: AuditEventType.UPDATED,
      triggeredBy: actor,
      payload: { action: 'QUEUE_PRE_ALERT', vendorId }
    });
    this.notify();
  }

  private pushQueueNotification(laneId: string, vendorId: string, message: string, channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP' = 'IN_APP') {
    const queue = this.alternateQueues.get(laneId);
    if (!queue) return;
    const entry = queue.queue.find(e => e.vendorId === vendorId);
    if (!entry) return;
    entry.notifications.push({ channel, message, sentAt: Date.now() });
  }

  private markQueueFailure(laneId: string, reason: string) {
    const queue = this.alternateQueues.get(laneId);
    if (!queue) return;
    queue.queueStatus = 'FAILED';
    queue.failedAt = Date.now();
    queue.failureReason = reason;
    this.logEvent({
      entityType: AuditEntityType.AWARD,
      entityId: laneId,
      eventType: AuditEventType.UPDATED,
      triggeredBy: 'SYSTEM',
      payload: { action: 'QUEUE_FAILED', reason }
    });
  }

  private advanceAwardFromQueue(laneId: string, actor: string, cause: 'DECLINED' | 'EXPIRED') {
    const queue = this.alternateQueues.get(laneId);
    if (!queue) return;
    const previousAward = this.awards.get(laneId);
    if (!previousAward) return;

    const previousEntry = queue.queue.find(e => e.vendorId === previousAward.vendorId);
    if (previousEntry) {
      previousEntry.status = cause;
      queue.declineHistory.push({
        vendorId: previousEntry.vendorId,
        reason: cause === 'DECLINED' ? previousAward.declineReason || 'Declined' : 'Expired',
        at: Date.now(),
      });
    }

    const next = queue.queue.find(e =>
      e.rank > (previousEntry?.rank || 1) &&
      e.eligibleForAutoAward &&
      e.withinThreshold &&
      ['STANDBY', 'SKIPPED'].includes(e.status)
    );

    if (!next) {
      this.markQueueFailure(laneId, 'All eligible alternates exhausted');
      return;
    }

    const nextEligibility = this.isVendorEligibleForQueue(next.vendorId);
    if (!nextEligibility.ok) {
      next.status = 'SKIPPED';
      next.reason = nextEligibility.reason;
      this.advanceAwardFromQueue(laneId, actor, cause);
      return;
    }

    const newAward: Award = {
      id: crypto.randomUUID(),
      auctionLaneId: laneId,
      vendorId: next.vendorId,
      price: next.bidAmount,
      rank: next.rank,
      reason: `Auto re-award after ${cause.toLowerCase()}`,
      awardedAt: Date.now(),
      awardedBy: actor,
      status: AwardAcceptanceStatus.PENDING,
      acceptanceDeadline: Date.now() + 24 * 60 * 60 * 1000,
      reawardedFromAwardId: previousAward.id,
      notificationLog: [],
    };

    previousAward.status = AwardAcceptanceStatus.REAWARDED;
    previousAward.reawardedToAwardId = newAward.id;
    this.awards.set(laneId, newAward);

    next.status = 'AWARDED';
    next.awardedAt = newAward.awardedAt;
    next.acceptanceDeadline = newAward.acceptanceDeadline;
    queue.queueStatus = 'REASSIGNED';

    this.pushQueueNotification(laneId, previousAward.vendorId, `Award declined processed for ${queue.laneName}`, 'EMAIL');
    this.pushQueueNotification(laneId, next.vendorId, `You have been auto-awarded ${queue.laneName}`, 'EMAIL');
    const standby = queue.queue.find(e => e.rank === next.rank + 1 && e.status === 'STANDBY');
    if (standby) this.pushQueueNotification(laneId, standby.vendorId, `Standby alert: You are next in queue for ${queue.laneName}`, 'IN_APP');

    this.logEvent({
      entityType: AuditEntityType.AWARD,
      entityId: laneId,
      eventType: AuditEventType.UPDATED,
      triggeredBy: actor,
      payload: { action: 'AUTO_REAWARD', from: previousAward.vendorId, to: next.vendorId, increase: next.bidAmount - previousAward.price }
    });
  }

  public manualQueueAction(params: { laneId: string; action: 'SKIP_TO_NEXT' | 'REMOVE_VENDOR' | 'AWARD_VENDOR' | 'ADJUST_THRESHOLD' | 'MARK_FAILED'; vendorId?: string; thresholdValue?: number; thresholdType?: 'percentage' | 'absolute'; reason?: string; actor: string; }) {
    const queue = this.alternateQueues.get(params.laneId);
    if (!queue) throw new Error('Queue not found');
    if (params.action === 'REMOVE_VENDOR' && params.vendorId) {
      const entry = queue.queue.find(e => e.vendorId === params.vendorId);
      if (entry && entry.status === 'STANDBY') {
        entry.status = 'SKIPPED';
        entry.reason = params.reason || 'Removed by admin';
      }
    }
    if (params.action === 'ADJUST_THRESHOLD' && typeof params.thresholdValue === 'number' && params.thresholdType) {
      queue.acceptanceThreshold.type = params.thresholdType;
      queue.acceptanceThreshold.value = params.thresholdValue;
      queue.acceptanceThreshold.calculatedMaxBid = params.thresholdType === 'absolute'
        ? queue.winnerBid + params.thresholdValue
        : queue.winnerBid * (1 + params.thresholdValue / 100);
      queue.queue.forEach((entry, idx) => {
        if (idx === 0) return;
        entry.withinThreshold = entry.bidAmount <= queue.acceptanceThreshold.calculatedMaxBid;
        entry.eligibleForAutoAward = entry.withinThreshold && this.isVendorEligibleForQueue(entry.vendorId).ok;
        if (!entry.withinThreshold) {
          entry.status = 'OUT_OF_THRESHOLD';
        } else if (['OUT_OF_THRESHOLD', 'SKIPPED'].includes(entry.status)) {
          entry.status = 'STANDBY';
        }
      });
    }
    if (params.action === 'AWARD_VENDOR' && params.vendorId) {
      const target = queue.queue.find(e => e.vendorId === params.vendorId);
      if (!target) throw new Error('Vendor not in queue');
      const now = Date.now();
      const previousAward = this.awards.get(params.laneId);
      const newAwardId = crypto.randomUUID();
      if (previousAward && previousAward.vendorId !== target.vendorId) {
        previousAward.status = AwardAcceptanceStatus.REAWARDED;
        previousAward.reawardedToAwardId = newAwardId;
      }

      this.awards.set(params.laneId, {
        id: newAwardId,
        auctionLaneId: params.laneId,
        vendorId: target.vendorId,
        price: target.bidAmount,
        rank: target.rank,
        reason: params.reason || 'Manual queue override',
        awardedAt: now,
        awardedBy: params.actor,
        status: AwardAcceptanceStatus.PENDING,
        acceptanceDeadline: now + 24 * 60 * 60 * 1000,
        notificationLog: [],
      });
      queue.queue.forEach(e => {
        if (e.vendorId === target.vendorId) {
          e.status = 'AWARDED';
          e.awardedAt = now;
          e.acceptanceDeadline = now + 24 * 60 * 60 * 1000;
        } else if (e.vendorId === previousAward?.vendorId) {
          e.status = 'REAWARDED';
        }
      });
      queue.queueStatus = target.rank > 1 ? 'REASSIGNED' : 'ACTIVE';
      queue.failedAt = undefined;
      queue.failureReason = undefined;
    }
    if (params.action === 'SKIP_TO_NEXT') {
      const award = this.awards.get(params.laneId);
      if (award) this.advanceAwardFromQueue(params.laneId, params.actor, 'DECLINED');
    }
    if (params.action === 'MARK_FAILED') {
      this.markQueueFailure(params.laneId, params.reason || 'Manual mark failed');
    }

    this.logEvent({
      entityType: AuditEntityType.AWARD,
      entityId: params.laneId,
      eventType: AuditEventType.UPDATED,
      triggeredBy: params.actor,
      payload: { action: `QUEUE_${params.action}`, vendorId: params.vendorId, reason: params.reason }
    });
    this.notify();
  }

  public getFailedAwardContext(auctionId: string, laneId: string) {
    const queue = this.alternateQueues.get(laneId);
    const lane = this.lanes.get(laneId);
    if (!lane || lane.auctionId !== auctionId) throw new Error('Lane not found for auction');
    if (!queue) throw new Error('Alternate queue not available for lane');

    const outOfThreshold = queue.queue.filter(e => !e.withinThreshold || e.status === 'OUT_OF_THRESHOLD');
    const standby = queue.queue.filter(e => e.eligibleForAutoAward && ['STANDBY', 'SKIPPED'].includes(e.status));
    const lastDecline = queue.declineHistory[queue.declineHistory.length - 1];

    return {
      laneId: lane.id,
      laneName: lane.laneName,
      winnerBid: queue.winnerBid,
      queueStatus: queue.queueStatus,
      failureReason: queue.failureReason,
      lastDecline,
      queue: queue.queue,
      outOfThreshold,
      standby,
    };
  }

  public resolveFailedAward(params: {
    auctionId: string;
    laneId: string;
    action: 'AWARD_OUTSIDE_THRESHOLD' | 'NEGOTIATE_ORIGINAL' | 'REAUCTION' | 'CANCEL_LANE';
    actor: string;
    vendorId?: string;
    reason?: string;
  }) {
    const lane = this.lanes.get(params.laneId);
    if (!lane || lane.auctionId !== params.auctionId) throw new Error('Lane not found');
    const queue = this.alternateQueues.get(params.laneId);
    if (!queue) throw new Error('Queue not found');

    if (params.action === 'AWARD_OUTSIDE_THRESHOLD') {
      if (!params.vendorId) throw new Error('Vendor is required');
      this.manualQueueAction({
        laneId: params.laneId,
        action: 'AWARD_VENDOR',
        vendorId: params.vendorId,
        reason: params.reason || 'Award outside threshold approved',
        actor: params.actor,
      });
      queue.queueStatus = 'REASSIGNED';
      queue.failedAt = undefined;
      queue.failureReason = undefined;
    }

    if (params.action === 'NEGOTIATE_ORIGINAL') {
      const original = queue.queue
        .filter(e => ['DECLINED', 'EXPIRED'].includes(e.status))
        .sort((a, b) => a.rank - b.rank)[0];
      if (!original) throw new Error('No original declined winner found');
      this.manualQueueAction({
        laneId: params.laneId,
        action: 'AWARD_VENDOR',
        vendorId: original.vendorId,
        reason: params.reason || 'Reopened via negotiation',
        actor: params.actor,
      });
      queue.queueStatus = 'ACTIVE';
      queue.failedAt = undefined;
      queue.failureReason = undefined;
    }

    if (params.action === 'REAUCTION') {
      lane.status = LaneStatus.RUNNING;
      lane.startTime = Date.now();
      lane.endTime = Date.now() + (30 * 60 * 1000);
      lane.currentLowestBid = undefined;
      this.bids.set(lane.id, []);
      this.awards.delete(lane.id);
      this.alternateQueues.delete(lane.id);
      this.logEvent({
        entityType: AuditEntityType.LANE,
        entityId: lane.id,
        eventType: AuditEventType.STATUS_CHANGE,
        triggeredBy: params.actor,
        payload: { action: 'REAUCTION_CREATED', durationMinutes: 30, reason: params.reason || 'Failed queue resolution' }
      });
    }

    if (params.action === 'CANCEL_LANE') {
      lane.status = LaneStatus.CLOSED;
      const award = this.awards.get(lane.id);
      if (award && award.status === AwardAcceptanceStatus.PENDING) {
        award.status = AwardAcceptanceStatus.DECLINED;
        award.declinedAt = Date.now();
        award.declineReason = params.reason || 'Lane cancelled by admin';
      }
      queue.queueStatus = 'COMPLETED';
      queue.failureReason = params.reason || 'Lane cancelled';
    }

    this.logEvent({
      entityType: AuditEntityType.AWARD,
      entityId: params.laneId,
      eventType: AuditEventType.UPDATED,
      triggeredBy: params.actor,
      payload: { action: `FAILED_AWARD_${params.action}`, vendorId: params.vendorId, reason: params.reason }
    });
    this.notify();
  }

  // --- Helpers ---
  public getVendorRank(laneId: string, vendorId: string): number | null {
    const bids = this.getBidsByLane(laneId);
    // Group by vendor, take best bid
    const bestBids = new Map<string, number>();
    bids.forEach(b => {
      const existing = bestBids.get(b.vendorId);
      if (!existing || b.bidAmount < existing) {
        bestBids.set(b.vendorId, b.bidAmount);
      }
    });

    const sorted = Array.from(bestBids.entries()).sort((a, b) => a[1] - b[1]);
    const rankIdx = sorted.findIndex(s => s[0] === vendorId);

    return rankIdx >= 0 ? rankIdx + 1 : null;
  }

  // --- Phase 0 Core Actions ---

  public createAuction(req: CreateAuctionRequest) {
    const auctionId = crypto.randomUUID();
    const rulesetId = crypto.randomUUID();

    const ruleset: AuctionRuleset = { id: rulesetId, ...req.ruleset };
    this.rulesets.set(rulesetId, ruleset);

    const auction: Auction = {
      id: auctionId,
      name: req.name,
      auctionType: req.auctionType,
      status: AuctionStatus.DRAFT,
      createdBy: req.createdBy,
      clientId: req.clientId,
      rulesetId: rulesetId,
      createdAt: Date.now(),
    };
    this.auctions.set(auctionId, auction);

    this.logEvent({
      entityType: AuditEntityType.AUCTION,
      entityId: auctionId,
      eventType: AuditEventType.CREATED,
      triggeredBy: req.createdBy,
      payload: { name: req.name, type: req.auctionType },
    });

    req.lanes.forEach((laneDraft) => {
      const laneId = crypto.randomUUID();
      // @ts-ignore - handling phase 1 props spread safely
      const lane: AuctionLane = {
        id: laneId,
        auctionId: auctionId,
        status: LaneStatus.PENDING,
        ...laneDraft
      };
      this.lanes.set(laneId, lane);
      this.bids.set(laneId, []);

      this.logEvent({
        entityType: AuditEntityType.LANE,
        entityId: laneId,
        eventType: AuditEventType.CREATED,
        triggeredBy: req.createdBy,
        payload: { laneName: lane.laneName, basePrice: lane.basePrice },
      });
    });

    this.notify();
    return auctionId;
  }

  public addLanesToAuction(
    auctionId: string,
    lanes: CreateAuctionRequest['lanes'],
    userId: string,
  ) {
    const auction = this.auctions.get(auctionId);
    if (!auction) throw new Error('Auction not found');
    if (auction.status === AuctionStatus.COMPLETED || auction.status === AuctionStatus.CANCELLED) {
      throw new Error('Cannot add lanes to completed or cancelled auction');
    }

    const current = this.getLanesByAuction(auctionId);
    const startOrder = current.length + 1;

    lanes.forEach((laneDraft, idx) => {
      const laneId = crypto.randomUUID();
      const lane: AuctionLane = {
        id: laneId,
        auctionId,
        status: LaneStatus.PENDING,
        ...laneDraft,
        sequenceOrder: laneDraft.sequenceOrder || startOrder + idx,
      };
      this.lanes.set(laneId, lane);
      this.bids.set(laneId, []);
      this.logEvent({
        entityType: AuditEntityType.LANE,
        entityId: laneId,
        eventType: AuditEventType.CREATED,
        triggeredBy: userId,
        payload: {
          laneName: lane.laneName,
          basePrice: lane.basePrice,
          via: 'BULK_UPLOAD',
          auctionId,
        },
      });
    });

    this.logEvent({
      entityType: AuditEntityType.AUCTION,
      entityId: auctionId,
      eventType: AuditEventType.UPDATED,
      triggeredBy: userId,
      payload: {
        action: 'ADD_LANES_BULK',
        lanesAdded: lanes.length,
      },
    });

    this.notify();
  }

  public publishAuction(auctionId: string, userId: string) {
    const auction = this.auctions.get(auctionId);
    if (!auction) throw new Error('Auction not found');
    if (auction.status !== AuctionStatus.DRAFT) throw new Error('Auction must be DRAFT to publish');

    auction.status = AuctionStatus.PUBLISHED;

    this.logEvent({
      entityType: AuditEntityType.AUCTION,
      entityId: auctionId,
      eventType: AuditEventType.STATUS_CHANGE,
      triggeredBy: userId,
      payload: { oldStatus: 'DRAFT', newStatus: 'PUBLISHED' },
    });

    this.notify();
  }

  public startLane(laneId: string, userId: string) {
    const lane = this.lanes.get(laneId);
    if (!lane) throw new Error('Lane not found');
    const auction = this.auctions.get(lane.auctionId);
    if (!auction) throw new Error('Parent auction not found');

    if (auction.status !== AuctionStatus.RUNNING) {
      if (auction.status === AuctionStatus.DRAFT) throw new Error("Cannot start lane when auction is DRAFT. Publish it first.");
      auction.status = AuctionStatus.RUNNING;
      this.logEvent({ entityType: AuditEntityType.AUCTION, entityId: auction.id, eventType: AuditEventType.STATUS_CHANGE, triggeredBy: userId, payload: { newStatus: 'RUNNING' } });
    }

    if (lane.status !== LaneStatus.PENDING) throw new Error('Lane is not PENDING');

    const now = Date.now();
    lane.status = LaneStatus.RUNNING;
    lane.startTime = now;
    lane.endTime = now + (lane.timerDurationSeconds * 1000);

    this.logEvent({ entityType: AuditEntityType.LANE, entityId: laneId, eventType: AuditEventType.STATUS_CHANGE, triggeredBy: userId, payload: { status: 'RUNNING', startTime: lane.startTime, endTime: lane.endTime } });
    this.notify();
  }

  public forceCloseLane(laneId: string, userId: string) {
    const lane = this.lanes.get(laneId);
    if (!lane) throw new Error('Lane not found');
    if (lane.status !== LaneStatus.RUNNING) throw new Error('Lane is not RUNNING');
    lane.status = LaneStatus.CLOSED;
    lane.endTime = Date.now();
    this.pausedLaneRemainingMs.delete(laneId);
    this.logEvent({ entityType: AuditEntityType.LANE, entityId: laneId, eventType: AuditEventType.STATUS_CHANGE, triggeredBy: userId, payload: { status: 'CLOSED', reason: 'Manual Override' } });
    this.notify();
  }

  public pauseAuction(auctionId: string, userId: string, reason: string) {
    const auction = this.auctions.get(auctionId);
    if (!auction) throw new Error('Auction not found');
    if (auction.status !== AuctionStatus.RUNNING) throw new Error('Auction is not RUNNING');

    auction.status = AuctionStatus.PAUSED;
    const activeLanes = this.getLanesByAuction(auctionId).filter(l => l.status === LaneStatus.RUNNING);
    const now = Date.now();
    activeLanes.forEach(lane => {
      const remainingMs = lane.endTime ? Math.max(0, lane.endTime - now) : lane.timerDurationSeconds * 1000;
      this.pausedLaneRemainingMs.set(lane.id, remainingMs);
      lane.status = LaneStatus.PAUSED;
      lane.endTime = undefined;
    });

    this.logEvent({
      entityType: AuditEntityType.AUCTION,
      entityId: auctionId,
      eventType: AuditEventType.STATUS_CHANGE,
      triggeredBy: userId,
      payload: { oldStatus: 'RUNNING', newStatus: 'PAUSED', reason }
    });
    this.notify();
  }

  public resumeAuction(auctionId: string, userId: string) {
    const auction = this.auctions.get(auctionId);
    if (!auction) throw new Error('Auction not found');
    if (auction.status !== AuctionStatus.PAUSED) throw new Error('Auction is not PAUSED');

    auction.status = AuctionStatus.RUNNING;
    const pausedLanes = this.getLanesByAuction(auctionId).filter(l => l.status === LaneStatus.PAUSED);
    const now = Date.now();
    pausedLanes.forEach(lane => {
      lane.status = LaneStatus.RUNNING;
      const remainingMs = this.pausedLaneRemainingMs.get(lane.id) ?? (lane.timerDurationSeconds * 1000);
      lane.endTime = now + remainingMs;
      this.pausedLaneRemainingMs.delete(lane.id);
    });

    this.logEvent({
      entityType: AuditEntityType.AUCTION,
      entityId: auctionId,
      eventType: AuditEventType.STATUS_CHANGE,
      triggeredBy: userId,
      payload: { oldStatus: 'PAUSED', newStatus: 'RUNNING' }
    });
    this.notify();
  }

  public extendAuctionLanes(auctionId: string, durationSeconds: number, userId: string, laneIds?: string[]) {
    const auction = this.auctions.get(auctionId);
    if (!auction) throw new Error('Auction not found');
    if (durationSeconds <= 0) throw new Error('Duration must be > 0');

    const laneIdSet = laneIds && laneIds.length > 0 ? new Set(laneIds) : null;
    const now = Date.now();
    const lanes = this.getLanesByAuction(auctionId).filter(lane => {
      if (laneIdSet && !laneIdSet.has(lane.id)) return false;
      return lane.status === LaneStatus.RUNNING || lane.status === LaneStatus.PAUSED;
    });

    lanes.forEach(lane => {
      if (lane.status === LaneStatus.PAUSED) {
        const remaining = this.pausedLaneRemainingMs.get(lane.id) ?? (lane.timerDurationSeconds * 1000);
        this.pausedLaneRemainingMs.set(lane.id, remaining + durationSeconds * 1000);
      } else {
        const base = lane.endTime && lane.endTime > now ? lane.endTime : now;
        lane.endTime = base + (durationSeconds * 1000);
      }
      this.logEvent({
        entityType: AuditEntityType.LANE,
        entityId: lane.id,
        eventType: AuditEventType.TIMER_EXTENDED,
        triggeredBy: userId,
        payload: { extensionSeconds: durationSeconds, newEndTime: lane.endTime }
      });
    });
    this.notify();
  }

  public endAuctionNow(auctionId: string, userId: string, reason: string) {
    const auction = this.auctions.get(auctionId);
    if (!auction) throw new Error('Auction not found');
    const oldStatus = auction.status;

    const lanes = this.getLanesByAuction(auctionId).filter(l =>
      l.status === LaneStatus.RUNNING || l.status === LaneStatus.PAUSED || l.status === LaneStatus.PENDING
    );

    lanes.forEach(lane => {
      lane.status = LaneStatus.CLOSED;
      lane.endTime = Date.now();
      this.pausedLaneRemainingMs.delete(lane.id);
      this.logEvent({
        entityType: AuditEntityType.LANE,
        entityId: lane.id,
        eventType: AuditEventType.STATUS_CHANGE,
        triggeredBy: userId,
        payload: { status: 'CLOSED', reason: 'Auction ended early' }
      });
    });

    auction.status = AuctionStatus.COMPLETED;
    this.logEvent({
      entityType: AuditEntityType.AUCTION,
      entityId: auctionId,
      eventType: AuditEventType.STATUS_CHANGE,
      triggeredBy: userId,
      payload: { oldStatus, newStatus: 'COMPLETED', reason }
    });
    this.notify();
  }

  public placeBid(laneId: string, vendorId: string, amount: number) {
    const lane = this.lanes.get(laneId);
    if (!lane) throw new Error('Lane not found');
    if (lane.status !== LaneStatus.RUNNING) throw new Error('Lane is not RUNNING');

    const now = Date.now();
    if (lane.endTime && now > lane.endTime) throw new Error('Lane timer expired');

    const currentBids = this.bids.get(laneId) || [];
    const currentLowest = currentBids.length > 0 ? currentBids[0].bidAmount : lane.basePrice;
    const maxAllowedBid = currentLowest - lane.minBidDecrement;

    if (amount > maxAllowedBid) throw new Error(`Bid invalid. Must be <= ${maxAllowedBid}`);

    const bid: Bid = { id: crypto.randomUUID(), auctionLaneId: laneId, vendorId, bidAmount: amount, bidTimestamp: now, isValid: true };

    currentBids.push(bid);
    currentBids.sort((a, b) => a.bidAmount - b.bidAmount);
    this.bids.set(laneId, currentBids);

    lane.currentLowestBid = amount;

    this.logEvent({ entityType: AuditEntityType.BID, entityId: bid.id, eventType: AuditEventType.BID_PLACED, triggeredBy: vendorId, payload: { amount, laneId } });

    const auction = this.auctions.get(lane.auctionId);
    const ruleset = this.rulesets.get(auction!.rulesetId);

    if (lane.endTime && ruleset) {
      const timeRemainingMs = lane.endTime - now;
      const thresholdMs = ruleset.timerExtensionThresholdSeconds * 1000;
      if (timeRemainingMs <= thresholdMs) {
        const extensionMs = ruleset.timerExtensionSeconds * 1000;
        const oldEndTime = lane.endTime;
        lane.endTime = now + extensionMs;
        this.logEvent({ entityType: AuditEntityType.LANE, entityId: laneId, eventType: AuditEventType.TIMER_EXTENDED, triggeredBy: 'SYSTEM', payload: { oldEndTime, newEndTime: lane.endTime, reason: 'Sniper Protection' } });
      }
    }
    this.notify();
  }

  // --- Draft Management ---

  private generateDraftId(): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `DRAFT-${date}-${random}`;
  }

  public saveDraft(req: SaveDraftRequest): string {
    const draftId = this.generateDraftId();
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    const draft: AuctionDraft = {
      draftId,
      auctionData: req.auctionData,
      createdBy: req.createdBy,
      createdAt: now,
      lastModifiedAt: now,
      status: DraftStatus.INCOMPLETE,
      expiresAt: now + thirtyDaysMs,
    };

    this.drafts.set(draftId, draft);
    this.notify();
    return draftId;
  }

  public updateDraft(draftId: string, auctionData: AuctionDraft['auctionData']): void {
    const draft = this.drafts.get(draftId);
    if (!draft) throw new Error('Draft not found');

    draft.auctionData = auctionData;
    draft.lastModifiedAt = Date.now();

    // Update status based on completeness
    const isReady = auctionData.name.trim().length > 0 && auctionData.lanes.length > 0;
    draft.status = isReady ? DraftStatus.READY : DraftStatus.INCOMPLETE;

    this.drafts.set(draftId, draft);
    this.notify();
  }

  public deleteDraft(draftId: string): void {
    if (!this.drafts.has(draftId)) throw new Error('Draft not found');
    this.drafts.delete(draftId);
    this.notify();
  }

  public duplicateDraft(draftId: string): string {
    const original = this.drafts.get(draftId);
    if (!original) throw new Error('Draft not found');

    const newDraftId = this.generateDraftId();
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    const newDraft: AuctionDraft = {
      draftId: newDraftId,
      auctionData: JSON.parse(JSON.stringify(original.auctionData)), // Deep copy
      createdBy: original.createdBy,
      createdAt: now,
      lastModifiedAt: now,
      status: original.status,
      expiresAt: now + thirtyDaysMs,
    };

    this.drafts.set(newDraftId, newDraft);
    this.notify();
    return newDraftId;
  }

  public publishDraft(draftId: string, userId: string): string {
    const draft = this.drafts.get(draftId);
    if (!draft) throw new Error('Draft not found');

    // Create auction from draft
    const createAuctionReq: CreateAuctionRequest = {
      name: draft.auctionData.name,
      auctionType: draft.auctionData.auctionType,
      clientId: 'CLIENT-001', // Default
      createdBy: userId,
      ruleset: draft.auctionData.globalRuleset,
      lanes: draft.auctionData.lanes.map(l => ({
        laneName: l.laneName,
        sequenceOrder: draft.auctionData.lanes.indexOf(l) + 1,
        basePrice: l.basePrice,
        minBidDecrement: l.decrement,
        timerDurationSeconds: l.duration,
        tatDays: l.tatDays,
      })),
    };

    // Create the auction using existing createAuction method
    const auctionId = this.createAuction(createAuctionReq);

    // Delete the draft
    this.drafts.delete(draftId);
    this.notify();

    return auctionId;
  }

  // --- Template Management ---

  public createTemplate(req: CreateTemplateRequest): string {
    const templateId = this.generateTemplateId();
    const now = Date.now();

    const template: AuctionTemplate = {
      templateId,
      templateName: req.templateName,
      description: req.description,
      category: req.category,
      isSystemTemplate: false,
      visibility: req.visibility,
      isFavorite: req.isFavorite || false,
      auctionConfiguration: req.auctionConfiguration,
      createdBy: req.createdBy,
      createdAt: now,
      lastModifiedAt: now,
      usageCount: 0,
      totalAuctionsCreated: 0,
    };

    this.templates.set(templateId, template);
    this.notify();
    return templateId;
  }

  public getTemplate(templateId: string): AuctionTemplate | undefined {
    return this.templates.get(templateId);
  }

  public getAllTemplates(): AuctionTemplate[] {
    return Array.from(this.templates.values()).filter(t => !t.isDeleted);
  }

  public getTemplatesByUser(userId: string): AuctionTemplate[] {
    return Array.from(this.templates.values()).filter(
      t => !t.isDeleted && t.createdBy === userId
    );
  }

  public updateTemplate(templateId: string, req: UpdateTemplateRequest): void {
    const template = this.templates.get(templateId);
    if (!template) throw new Error('Template not found');
    if (template.isSystemTemplate) throw new Error('Cannot modify system templates');

    if (req.templateName) template.templateName = req.templateName;
    if (req.description !== undefined) template.description = req.description;
    if (req.category) template.category = req.category;
    if (req.visibility) template.visibility = req.visibility;
    if (req.isFavorite !== undefined) template.isFavorite = req.isFavorite;
    if (req.auctionConfiguration) template.auctionConfiguration = req.auctionConfiguration;

    template.lastModifiedAt = Date.now();
    template.lastModifiedBy = req.lastModifiedBy;

    this.templates.set(templateId, template);
    this.notify();
  }

  public deleteTemplate(templateId: string): void {
    const template = this.templates.get(templateId);
    if (!template) throw new Error('Template not found');
    if (template.isSystemTemplate) throw new Error('Cannot delete system templates');

    // Soft delete
    template.isDeleted = true;
    template.deletedAt = Date.now();

    this.templates.set(templateId, template);
    this.notify();
  }

  public duplicateTemplate(templateId: string, userId: string): string {
    const original = this.templates.get(templateId);
    if (!original) throw new Error('Template not found');

    const newTemplateId = this.generateTemplateId();
    const now = Date.now();

    const newTemplate: AuctionTemplate = {
      templateId: newTemplateId,
      templateName: `${original.templateName} - Copy`,
      description: original.description,
      category: original.category,
      isSystemTemplate: false,
      visibility: original.visibility,
      isFavorite: false,
      auctionConfiguration: JSON.parse(JSON.stringify(original.auctionConfiguration)), // Deep copy
      createdBy: userId,
      createdAt: now,
      lastModifiedAt: now,
      lastModifiedBy: userId,
      usageCount: 0,
      totalAuctionsCreated: 0,
    };

    this.templates.set(newTemplateId, newTemplate);
    this.notify();
    return newTemplateId;
  }

  public toggleFavorite(templateId: string): void {
    const template = this.templates.get(templateId);
    if (!template) throw new Error('Template not found');

    template.isFavorite = !template.isFavorite;
    template.lastModifiedAt = Date.now();

    this.templates.set(templateId, template);
    this.notify();
  }

  public recordTemplateUsage(templateId: string, userId: string): void {
    const template = this.templates.get(templateId);
    if (!template) throw new Error('Template not found');

    template.usageCount = (template.usageCount || 0) + 1;
    template.lastUsedAt = Date.now();
    template.totalAuctionsCreated = (template.totalAuctionsCreated || 0) + 1;

    // Track most used by
    if (!template.mostUsedBy || template.mostUsedBy === userId) {
      template.mostUsedBy = userId;
      template.mostUsedByCount = (template.mostUsedByCount || 0) + 1;
    }

    this.templates.set(templateId, template);
    this.notify();
  }

  private generateTemplateId(): string {
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `TMPL-${timestamp}-${random}`;
  }

  private cleanupExpiredDrafts(): void {
    const now = Date.now();
    const expiredDrafts: string[] = [];

    for (const [draftId, draft] of this.drafts.entries()) {
      if (now > draft.expiresAt) {
        expiredDrafts.push(draftId);
      }
    }

    expiredDrafts.forEach(draftId => this.drafts.delete(draftId));

    if (expiredDrafts.length > 0) {
      console.log(`Cleaned up ${expiredDrafts.length} expired drafts`);
      this.notify();
    }
  }

  // ── FTL Rate Benchmarking Demo Data ──────────────────────────────────────
  // Injects 12 realistic FTL auction lanes with market-representative bid
  // distributions spread across 12 weekly data points (past 84 days).
  // Rates reflect Indian trucking market 2024-25 for common body sizes.
  // Each lane is calibrated to produce a specific benchmark status so the
  // Savings Map shows a clear, compelling demo mix for client presentations.
  //
  // Status mix: 5 Above Market (red), 4 At Market (blue), 3 Below Market (green)
  // ─────────────────────────────────────────────────────────────────────────
  private seedFTLBenchmarkData(): void {
    if (Array.from(this.auctions.values()).some(a => a.name === 'FTL Market Benchmarking 2025')) return;

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    // ── Auction record ───────────────────────────────────────────────────
    const auctionId = 'AUC-FTL-BENCH-001';
    this.auctions.set(auctionId, {
      id: auctionId,
      name: 'FTL Market Benchmarking 2025',
      auctionType: AuctionType.REVERSE,
      status: AuctionStatus.COMPLETED,
      createdBy: 'SYSTEM',
      clientId: 'CLIENT-001',
      rulesetId: 'RS-DEFAULT',
      createdAt: now - 90 * DAY,
    } as Auction);

    // ── Lane definitions ─────────────────────────────────────────────────
    // Format: "Origin -> Destination | Body Size"
    // Bids spread weekly over 12 weeks (oldest → newest, highest → lowest)
    // Contract rates are stored in amsContractStore.ts and compared to P50.
    const laneSpecs: Array<{
      id: string;
      laneName: string;
      bids: number[];   // ordered from highest to lowest (market high → low)
      winnerVendorIdx: number;
    }> = [
      {
        // Mumbai → Delhi | 32 Ft MXL — ABOVE MARKET: contract ₹67,000 vs P50 ₹57,000 (+17.5%)
        id: 'FTL-LANE-01',
        laneName: 'Mumbai -> Delhi | 32 Ft MXL',
        bids: [75000, 70000, 66000, 63000, 60000, 58000, 56000, 54000, 52000, 50000, 48000, 46000],
        winnerVendorIdx: 11,
      },
      {
        // Delhi → Mumbai | 32 Ft MXL — AT MARKET: contract ₹50,000 vs P50 ₹54,000 (-7.4%)
        id: 'FTL-LANE-02',
        laneName: 'Delhi -> Mumbai | 32 Ft MXL',
        bids: [70000, 66000, 62000, 58000, 56000, 54000, 52000, 50000, 48000, 46000, 44000],
        winnerVendorIdx: 10,
      },
      {
        // Mumbai → Bangalore | 32 Ft SXL — BELOW MARKET: contract ₹32,000 vs P50 ₹38,000 (-15.8%)
        id: 'FTL-LANE-03',
        laneName: 'Mumbai -> Bangalore | 32 Ft SXL',
        bids: [52000, 48000, 44000, 42000, 40000, 38000, 36000, 34000, 32000, 30000, 28000],
        winnerVendorIdx: 10,
      },
      {
        // Delhi → Kolkata | 32 Ft MXL — AT MARKET: contract ₹58,000 vs P50 ₹56,000 (+3.6%)
        id: 'FTL-LANE-04',
        laneName: 'Delhi -> Kolkata | 32 Ft MXL',
        bids: [74000, 70000, 66000, 62000, 58000, 56000, 54000, 52000, 50000, 48000, 46000],
        winnerVendorIdx: 10,
      },
      {
        // Chennai → Hyderabad | 40 Ft — BELOW MARKET: contract ₹24,000 vs P50 ₹27,000 (-11.1%)
        id: 'FTL-LANE-05',
        laneName: 'Chennai -> Hyderabad | 40 Ft',
        bids: [42000, 38000, 35000, 32000, 30000, 28000, 27000, 26000, 25000, 24000, 22000],
        winnerVendorIdx: 10,
      },
      {
        // Mumbai → Hyderabad | 32 Ft SXL — ABOVE MARKET: contract ₹40,000 vs P50 ₹29,500 (+35.6%)
        id: 'FTL-LANE-06',
        laneName: 'Mumbai -> Hyderabad | 32 Ft SXL',
        bids: [42000, 39000, 36000, 34000, 32000, 30000, 29000, 28000, 27000, 26000, 24000],
        winnerVendorIdx: 10,
      },
      {
        // Ahmedabad → Mumbai | 24 Ft — BELOW MARKET: contract ₹14,000 vs P50 ₹16,000 (-12.5%)
        id: 'FTL-LANE-07',
        laneName: 'Ahmedabad -> Mumbai | 24 Ft',
        bids: [22000, 21000, 20000, 19000, 18000, 17000, 16000, 15000, 14000, 13000, 12000],
        winnerVendorIdx: 10,
      },
      {
        // Delhi → Jaipur | 20 Ft — AT MARKET: contract ₹7,800 vs P50 ₹7,500 (+4%)
        id: 'FTL-LANE-08',
        laneName: 'Delhi -> Jaipur | 20 Ft',
        bids: [10000, 9500, 9000, 8500, 8000, 7800, 7500, 7000, 6500, 6000, 5500],
        winnerVendorIdx: 10,
      },
      {
        // Kolkata → Guwahati | 32 Ft MXL — ABOVE MARKET: contract ₹50,000 vs P50 ₹38,000 (+31.6%)
        id: 'FTL-LANE-09',
        laneName: 'Kolkata -> Guwahati | 32 Ft MXL',
        bids: [48000, 46000, 44000, 42000, 40000, 38000, 36000, 34000, 32000, 30000, 28000],
        winnerVendorIdx: 10,
      },
      {
        // Chennai → Bangalore | 40 Ft — ABOVE MARKET: contract ₹28,000 vs P50 ₹20,500 (+36.6%)
        id: 'FTL-LANE-10',
        laneName: 'Chennai -> Bangalore | 40 Ft',
        bids: [28000, 25000, 24000, 23000, 22000, 21000, 20000, 19000, 18000, 17000, 16000],
        winnerVendorIdx: 10,
      },
      {
        // Mumbai → Pune | 20 Ft — AT MARKET: contract ₹6,500 vs P50 ₹7,000 (-7.1%)
        id: 'FTL-LANE-11',
        laneName: 'Mumbai -> Pune | 20 Ft',
        bids: [10000, 9500, 9000, 8500, 8000, 7500, 7000, 6500, 6000, 5500, 5000],
        winnerVendorIdx: 10,
      },
      {
        // Delhi → Lucknow | 24 Ft — ABOVE MARKET: contract ₹18,500 vs P50 ₹15,750 (+17.5%)
        id: 'FTL-LANE-12',
        laneName: 'Delhi -> Lucknow | 24 Ft',
        bids: [20000, 19000, 18000, 17500, 17000, 16500, 16000, 15500, 15000, 14000, 13000, 12000],
        winnerVendorIdx: 11,
      },
    ];

    const vendors = this.demoVendorPool;

    laneSpecs.forEach((spec, laneIdx) => {
      // ── Lane record ────────────────────────────────────────────────────
      const lowestBid = spec.bids[spec.bids.length - 1];
      const highestBid = spec.bids[0];
      this.lanes.set(spec.id, {
        id: spec.id,
        auctionId,
        laneName: spec.laneName,
        sequenceOrder: laneIdx + 1,
        status: LaneStatus.AWARDED,
        basePrice: highestBid,
        currentLowestBid: lowestBid,
        minBidDecrement: 500,
        timerDurationSeconds: 300,
        tatDays: 2 + (laneIdx % 3),
      } as AuctionLane);

      // ── Bids — spread weekly over 12 weeks ────────────────────────────
      // Oldest bid = highest price (market was higher weeks ago)
      // Newest bid = lowest price (market has come down recently → Falling trend)
      const bidRecords: Bid[] = spec.bids.map((amount, i) => ({
        id: `B-${spec.id}-${String(i + 1).padStart(2, '0')}`,
        auctionLaneId: spec.id,
        vendorId: vendors[(laneIdx + i) % vendors.length],
        bidAmount: amount,
        bidTimestamp: now - (spec.bids.length - 1 - i) * 7 * DAY,
        isValid: true,
      }));
      this.bids.set(spec.id, bidRecords);

      // ── Award — lowest bid wins ────────────────────────────────────────
      const winnerVendor = vendors[(laneIdx + spec.winnerVendorIdx) % vendors.length];
      this.awards.set(spec.id, {
        id: `AWD-${spec.id}`,
        auctionLaneId: spec.id,
        vendorId: winnerVendor,
        price: lowestBid,
        rank: 1,
        reason: 'L1 award — lowest competitive bid',
        awardedAt: now - 7 * DAY,
        awardedBy: 'SYSTEM',
        status: AwardAcceptanceStatus.ACCEPTED,
        acceptanceDeadline: now + 7 * DAY,
        acceptedAt: now - 6 * DAY,
        notificationLog: [],
      } as Award);
    });
  }

  private seedLiveAuctionDemo(): void {
    if (this.auctions.size > 0) return;

    const configs = [
      { name: 'Q4 National FTL Live', type: AuctionType.REVERSE, lanes: 12, running: 10 },
      { name: 'Express Spot Corridors', type: AuctionType.SPOT, lanes: 8, running: 7 },
      { name: 'Metro Last Mile Blast', type: AuctionType.LOT, lanes: 9, running: 6 },
      { name: 'Bulk West Zone Procurement', type: AuctionType.BULK, lanes: 11, running: 8 },
      { name: 'Regional Lot - South Live', type: AuctionType.REGION_LOT, lanes: 7, running: 5 },
    ];

    const laneNames = [
      'Mumbai -> Delhi FTL',
      'Delhi -> Bangalore FTL',
      'Pune -> Hyderabad',
      'Chennai -> Kolkata',
      'Ahmedabad -> Jaipur',
      'Mumbai Zone 1',
      'Delhi Zone 3',
      'Bangalore Hub -> City',
      'Nagpur -> Indore',
      'Surat -> Vapi',
      'Noida -> Lucknow',
      'Kolkata -> Guwahati',
      'Chennai -> Coimbatore',
      'Jaipur -> Jodhpur',
      'Vizag -> Vijayawada',
    ];

    configs.forEach((cfg, idx) => {
      const req: CreateAuctionRequest = {
        name: cfg.name,
        auctionType: cfg.type,
        clientId: 'CLIENT-001',
        createdBy: 'SYSTEM',
        ruleset: {
          minBidDecrement: 200 + (idx * 100),
          timerExtensionThresholdSeconds: 15,
          timerExtensionSeconds: 90,
          allowRankVisibility: true,
        },
        lanes: Array.from({ length: cfg.lanes }).map((_, laneIdx) => ({
          laneName: laneNames[(idx * 3 + laneIdx) % laneNames.length],
          sequenceOrder: laneIdx + 1,
          basePrice: 25000 + (laneIdx * 5000) + (idx * 2000),
          minBidDecrement: 200 + (idx * 100),
          timerDurationSeconds: 180 + ((laneIdx % 5) * 60),
          tatDays: 1 + (laneIdx % 5),
        })),
      };

      const auctionId = this.createAuction(req);
      this.publishAuction(auctionId, 'SYSTEM');
      const createdLanes = this.getLanesByAuction(auctionId);
      createdLanes.slice(0, cfg.running).forEach((lane) => this.startLane(lane.id, 'SYSTEM'));

      createdLanes.slice(0, cfg.running).forEach((lane, laneIdx) => {
        const roundCount = 2 + (laneIdx % 4);
        let amount = lane.basePrice;
        for (let i = 0; i < roundCount; i += 1) {
          amount -= lane.minBidDecrement + (i * 50);
          const vendorId = this.demoVendorPool[(laneIdx + i + idx) % this.demoVendorPool.length];
          try {
            this.placeBid(lane.id, vendorId, amount);
          } catch {
            // Ignore simulated bid rejects.
          }
        }
      });
    });

    const auctions = this.getAllAuctions();
    if (auctions[0]) {
      try {
        this.pauseAuction(auctions[0].id, 'SYSTEM', 'Initial control room pause simulation');
      } catch {
        // Ignore if pause not possible.
      }
    }
  }

  private seedDisputesDemo(): void {
    if (this.disputes.size > 0) return;
    const auction = this.getAllAuctions()[0];
    const contract = this.getContracts()[0];

    const makeDescription = (text: string) =>
      `${text} The issue occurred during live operations and had measurable commercial impact. We request formal investigation, timeline review, and corrective action with documented closure.`;

    this.createDispute({
      raisedBy: 'V-089',
      raisedByRole: 'VENDOR',
      relatedType: DisputeRelatedType.AUCTION,
      auctionId: auction?.id,
      laneId: auction ? this.getLanesByAuction(auction.id)[0]?.id : undefined,
      category: DisputeCategory.BIDDING_PROCESS,
      priority: DisputePriority.HIGH,
      description: makeDescription('Suspected bid manipulation due to unusual rapid bids in final 20 seconds.'),
      preferredResolution: 'Independent audit of bid log and fair decision.',
      attachments: [{ name: 'screenshot-final-bids.png', sizeKb: 420 }],
    });

    const disputeId2 = this.createDispute({
      raisedBy: 'CLIENT-USER',
      raisedByRole: 'CLIENT',
      relatedType: DisputeRelatedType.CONTRACT,
      contractId: contract?.id,
      category: DisputeCategory.CONTRACT_TERMS,
      priority: DisputePriority.MEDIUM,
      description: makeDescription('Contract clause interpretation differs on penalty start time and billing cycle.'),
      preferredResolution: 'Clarify clause and publish amendment.',
      attachments: [{ name: 'contract-clause-highlight.pdf', sizeKb: 910 }],
    });
    this.updateDisputeStatus(disputeId2, DisputeStatus.UNDER_REVIEW, 'Procurement Manager');
    this.addDisputeMessage(disputeId2, 'Procurement Manager', 'Initial review completed; awaiting legal note.', 'internal');

    const disputeId3 = this.createDispute({
      raisedBy: 'V-201',
      raisedByRole: 'VENDOR',
      relatedType: DisputeRelatedType.INVOICE,
      invoiceNumber: 'INV-20260211-007',
      category: DisputeCategory.PAYMENT,
      priority: DisputePriority.CRITICAL,
      description: makeDescription('Invoice payment delayed beyond terms, impacting fleet deployment and service continuity.'),
      preferredResolution: 'Immediate settlement and penalty waiver.',
      attachments: [{ name: 'invoice-proof.pdf', sizeKb: 330 }],
    });
    this.updateDisputeStatus(disputeId3, DisputeStatus.PENDING_RESPONSE, 'Finance Team', 'Need updated bank confirmation');
  }

  private tick() {
    this.cleanupExpiredDrafts();
    const now = Date.now();
    let changed = false;

    // Demo activity simulation for live monitoring surfaces.
    for (const lane of this.lanes.values()) {
      if (lane.status !== LaneStatus.RUNNING) continue;
      if (!lane.endTime || lane.endTime <= now + 1500) continue;
      if (Math.random() > 0.12) continue;

      const bids = this.bids.get(lane.id) || [];
      const currentLowest = bids.length > 0 ? bids[0].bidAmount : lane.basePrice;
      const amount = Math.max(1000, currentLowest - lane.minBidDecrement);
      const vendorId = this.demoVendorPool[Math.floor(Math.random() * this.demoVendorPool.length)];
      try {
        this.placeBid(lane.id, vendorId, amount);
        changed = true;
      } catch {
        // Ignore simulation errors.
      }
    }

    // Phase 0: Auction Timer
    for (const lane of this.lanes.values()) {
      if (lane.status === LaneStatus.RUNNING && lane.endTime && now >= lane.endTime) {
        lane.status = LaneStatus.CLOSED;
        this.pausedLaneRemainingMs.delete(lane.id);
        this.logEvent({ entityType: AuditEntityType.LANE, entityId: lane.id, eventType: AuditEventType.STATUS_CHANGE, triggeredBy: 'SYSTEM', payload: { status: 'CLOSED', reason: 'Timer Expired' } });
        changed = true;
      }
    }

    for (const [laneId, award] of this.awards.entries()) {
      if (award.status !== AwardAcceptanceStatus.PENDING) continue;
      const remainingMs = award.acceptanceDeadline - now;
      const queue = this.alternateQueues.get(laneId);

      const sendReminderIfMissing = (marker: string, channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP') => {
        const exists = award.notificationLog.some(n => n.message.includes(marker));
        if (exists) return;
        award.notificationLog.push({
          channel,
          sentAt: now,
          message: marker,
        });
        changed = true;
      };

      if (remainingMs <= 12 * 60 * 60 * 1000 && remainingMs > 11.5 * 60 * 60 * 1000) {
        sendReminderIfMissing('REMINDER_12H', 'EMAIL');
      }
      if (remainingMs <= 2 * 60 * 60 * 1000 && remainingMs > 1.5 * 60 * 60 * 1000) {
        sendReminderIfMissing('REMINDER_2H', 'SMS');
        if (queue) {
          const current = queue.queue.find(e => e.vendorId === award.vendorId);
          const nextStandby = queue.queue.find(e => e.rank === (current?.rank || 1) + 1 && e.status === 'STANDBY' && e.eligibleForAutoAward);
          if (nextStandby && !nextStandby.notifications.some(n => n.message.includes('PRE_ALERT_2H'))) {
            nextStandby.notifications.push({
              channel: 'EMAIL',
              sentAt: now,
              message: `PRE_ALERT_2H: Standby alert for ${queue.laneName}`,
            });
            changed = true;
          }
        }
      }
      if (remainingMs <= 30 * 60 * 1000 && remainingMs > 25 * 60 * 1000) {
        sendReminderIfMissing('REMINDER_30M', 'WHATSAPP');
      }

      if (remainingMs <= 0) {
        award.status = AwardAcceptanceStatus.EXPIRED;
        award.declinedAt = now;
        award.declineReason = 'Auto-declined due to deadline timeout';
        this.advanceAwardFromQueue(laneId, 'SYSTEM', 'EXPIRED');
        this.logEvent({
          entityType: AuditEntityType.AWARD,
          entityId: laneId,
          eventType: AuditEventType.UPDATED,
          triggeredBy: 'SYSTEM',
          payload: { action: 'AUTO_EXPIRED_AND_REAWARDED' }
        });
        changed = true;
      }
    }

    for (const dispute of this.disputes.values()) {
      if ([DisputeStatus.RESOLVED, DisputeStatus.CLOSED].includes(dispute.status)) continue;
      const overdueMs = now - dispute.dueAt;
      if (overdueMs > 0 && dispute.status !== DisputeStatus.ESCALATED) {
        dispute.status = DisputeStatus.ESCALATED;
        dispute.updatedAt = now;
        dispute.timeline.push({
          id: crypto.randomUUID(),
          createdAt: now,
          actorId: 'SYSTEM',
          action: 'AUTO_ESCALATED',
          note: 'SLA breached',
        });
        changed = true;
      }
    }

    for (const auction of this.auctions.values()) {
      if (![AuctionStatus.RUNNING, AuctionStatus.PAUSED, AuctionStatus.PUBLISHED].includes(auction.status)) continue;
      const lanes = this.getLanesByAuction(auction.id);
      const hasOpen = lanes.some(l => [LaneStatus.PENDING, LaneStatus.RUNNING, LaneStatus.PAUSED].includes(l.status));
      if (!hasOpen && lanes.length > 0) {
        auction.status = AuctionStatus.COMPLETED;
        this.logEvent({
          entityType: AuditEntityType.AUCTION,
          entityId: auction.id,
          eventType: AuditEventType.STATUS_CHANGE,
          triggeredBy: 'SYSTEM',
          payload: { newStatus: 'COMPLETED', reason: 'All lanes closed' }
        });
        changed = true;
      }
    }

    // Phase 3A: SLA Timer
    for (const tracker of this.indentTrackers.values()) {
      if (tracker.placementStatus === PlacementStatus.PENDING && now > tracker.slaEndTime) {
        tracker.placementStatus = PlacementStatus.FAILED;
        tracker.resolvedAt = now;
        this.logEvent({
          entityType: AuditEntityType.PLACEMENT_TRACKER,
          entityId: tracker.id,
          eventType: AuditEventType.SLA_BREACHED,
          triggeredBy: 'SYSTEM',
          payload: { indentId: tracker.indentId, breachTime: new Date(now).toISOString() }
        });
        // Phase 3B Trigger
        this.triggerSpotAuction(tracker.indentId);
        changed = true;
      }
    }

    // Phase 3B: Spot Auction Timer
    for (const spot of this.spotAuctions.values()) {
      if (spot.status === SpotAuctionStatus.RUNNING) {
        const endTime = spot.startedAt + (spot.durationSeconds * 1000);
        if (now > endTime) {
          spot.status = SpotAuctionStatus.COMPLETED;

          // Determine Winner
          const bids = this.spotBids.get(spot.id) || [];
          // Already sorted ascending in placeSpotBid
          const winner = bids.length > 0 ? bids[0] : null;

          if (winner) {
            spot.winningBidId = winner.id;
            spot.winningVendorId = winner.vendorId;
            spot.winningAmount = winner.bidAmount;

            // Update Indent
            const indent = this.indents.find(i => i.id === spot.indentId);
            if (indent) {
              indent.status = 'REASSIGNED';
              indent.selectedVendorId = winner.vendorId;
              indent.appliedRate = winner.bidAmount;

              // Create new tracker for the Spot Winner to Confirm
              const trackerId = crypto.randomUUID();
              // 1 hour for spot placement confirmation default
              const slaDurationMs = 60 * 60 * 1000;

              const tracker: IndentPlacementTracker = {
                id: trackerId,
                indentId: indent.id,
                contractLaneId: indent.contractLaneId,
                assignedVendorId: winner.vendorId,
                slaStartTime: now,
                slaEndTime: now + slaDurationMs,
                placementStatus: PlacementStatus.PENDING
              };
              this.indentTrackers.set(trackerId, tracker);
            }

            this.logEvent({
              entityType: AuditEntityType.SPOT_AUCTION,
              entityId: spot.id,
              eventType: AuditEventType.SPOT_AWARDED,
              triggeredBy: 'SYSTEM',
              payload: { winner: winner.vendorId, amount: winner.bidAmount }
            });
          } else {
            this.logEvent({
              entityType: AuditEntityType.SPOT_AUCTION,
              entityId: spot.id,
              eventType: AuditEventType.SPOT_CLOSED,
              triggeredBy: 'SYSTEM',
              payload: { reason: 'NO_BIDS' }
            });
          }
          changed = true;
        }
      }
    }

    if (changed) this.notify();
  }

  private logEvent(event: Omit<AuditEvent, 'id' | 'createdAt'>) {
    const fullEvent: AuditEvent = { id: crypto.randomUUID(), createdAt: Date.now(), ...event };
    this.auditLog.unshift(fullEvent);
  }

  private notify() { this.subscribers.forEach(cb => cb()); }

  private seedData() {
    this.initializeSystemTemplates();
    this.seedFTLBenchmarkData();
    this.seedLiveAuctionDemo();
    this.seedDisputesDemo();
  }

  private initializeSystemTemplates(): void {
    const now = Date.now();
    const systemTemplates: AuctionTemplate[] = [
      {
        templateId: 'TMPL-SYS-001',
        templateName: 'Regional FTL - North India',
        description: 'Full Truckload auctions optimized for North India routes with standard FTL settings',
        category: TemplateCategory.FTL,
        isSystemTemplate: true,
        visibility: TemplateVisibility.ORGANIZATION,
        isFavorite: false,
        auctionConfiguration: {
          auctionType: AuctionType.REVERSE,
          globalRuleset: {
            minBidDecrement: 500,
            timerExtensionThresholdSeconds: 15,
            timerExtensionSeconds: 180,
            allowRankVisibility: true,
          },
          lanes: [
            { laneName: 'Delhi-Mumbai', basePrice: 85000, duration: 600, decrement: 1000, tatDays: 4 },
            { laneName: 'Delhi-Jaipur', basePrice: 15000, duration: 300, decrement: 300, tatDays: 1 },
            { laneName: 'Delhi-Chandigarh', basePrice: 8000, duration: 180, decrement: 200, tatDays: 1 },
            { laneName: 'Delhi-Lucknow', basePrice: 25000, duration: 300, decrement: 500, tatDays: 2 },
            { laneName: 'Delhi-Kolkata', basePrice: 95000, duration: 900, decrement: 1200, tatDays: 5 },
          ],
        },
        createdBy: 'SYSTEM',
        createdAt: now,
        lastModifiedAt: now,
        usageCount: 0,
      },
      {
        templateId: 'TMPL-SYS-002',
        templateName: 'Last Mile Delivery - Metro Cities',
        description: 'LOT auctions for last-mile delivery with shorter durations and aggressive decrements',
        category: TemplateCategory.LTL,
        isSystemTemplate: true,
        visibility: TemplateVisibility.ORGANIZATION,
        isFavorite: false,
        auctionConfiguration: {
          auctionType: AuctionType.LOT,
          globalRuleset: {
            minBidDecrement: 50,
            timerExtensionThresholdSeconds: 8,
            timerExtensionSeconds: 60,
            allowRankVisibility: false,
          },
          lanes: [
            { laneName: 'Mumbai Zone 1', basePrice: 5000, duration: 120, decrement: 100, tatDays: 0 },
            { laneName: 'Mumbai Zone 2', basePrice: 4500, duration: 120, decrement: 100, tatDays: 0 },
            { laneName: 'Delhi Zone 1', basePrice: 4000, duration: 120, decrement: 80, tatDays: 0 },
            { laneName: 'Bangalore Zone 1', basePrice: 3500, duration: 120, decrement: 70, tatDays: 0 },
            { laneName: 'Hyderabad Zone 1', basePrice: 3000, duration: 120, decrement: 60, tatDays: 0 },
          ],
        },
        createdBy: 'SYSTEM',
        createdAt: now,
        lastModifiedAt: now,
        usageCount: 0,
      },
      {
        templateId: 'TMPL-SYS-003',
        templateName: 'Spot Auction - Urgent Loads',
        description: 'Quick SPOT auctions for urgent shipments with very short duration and high decrements',
        category: TemplateCategory.SPOT,
        isSystemTemplate: true,
        visibility: TemplateVisibility.ORGANIZATION,
        isFavorite: false,
        auctionConfiguration: {
          auctionType: AuctionType.SPOT,
          globalRuleset: {
            minBidDecrement: 1000,
            timerExtensionThresholdSeconds: 5,
            timerExtensionSeconds: 30,
            allowRankVisibility: false,
          },
          lanes: [
            { laneName: 'Urgent - Immediate', basePrice: 50000, duration: 180, decrement: 2000, tatDays: 0 },
            { laneName: 'Urgent - 2 Hours', basePrice: 40000, duration: 240, decrement: 1500, tatDays: 0 },
            { laneName: 'Urgent - 4 Hours', basePrice: 35000, duration: 300, decrement: 1000, tatDays: 0 },
          ],
        },
        createdBy: 'SYSTEM',
        createdAt: now,
        lastModifiedAt: now,
        usageCount: 0,
      },
      {
        templateId: 'TMPL-SYS-004',
        templateName: 'Quarterly Contract - Pan India',
        description: 'BULK auctions for quarterly contracts with major Pan India lanes',
        category: TemplateCategory.FTL,
        isSystemTemplate: true,
        visibility: TemplateVisibility.ORGANIZATION,
        isFavorite: false,
        auctionConfiguration: {
          auctionType: AuctionType.BULK,
          globalRuleset: {
            minBidDecrement: 2000,
            timerExtensionThresholdSeconds: 20,
            timerExtensionSeconds: 300,
            allowRankVisibility: true,
          },
          lanes: [
            { laneName: 'Delhi-Mumbai', basePrice: 80000, duration: 1200, decrement: 1500, tatDays: 4 },
            { laneName: 'Delhi-Bangalore', basePrice: 120000, duration: 1200, decrement: 2000, tatDays: 5 },
            { laneName: 'Delhi-Chennai', basePrice: 150000, duration: 1200, decrement: 2500, tatDays: 6 },
            { laneName: 'Delhi-Kolkata', basePrice: 90000, duration: 1200, decrement: 1500, tatDays: 5 },
            { laneName: 'Chennai-Mumbai', basePrice: 95000, duration: 1200, decrement: 1500, tatDays: 4 },
          ],
        },
        createdBy: 'SYSTEM',
        createdAt: now,
        lastModifiedAt: now,
        usageCount: 0,
      },
      {
        templateId: 'TMPL-SYS-005',
        templateName: 'Regional LTL - West Zone',
        description: 'Regional LTL routes in West India with multiple pickup/drop points',
        category: TemplateCategory.REGIONAL,
        isSystemTemplate: true,
        visibility: TemplateVisibility.ORGANIZATION,
        isFavorite: false,
        auctionConfiguration: {
          auctionType: AuctionType.REGION_LOT,
          globalRuleset: {
            minBidDecrement: 300,
            timerExtensionThresholdSeconds: 12,
            timerExtensionSeconds: 120,
            allowRankVisibility: true,
          },
          lanes: [
            { laneName: 'Ahmedabad-Indore', basePrice: 18000, duration: 300, decrement: 300, tatDays: 2 },
            { laneName: 'Mumbai-Pune', basePrice: 12000, duration: 240, decrement: 250, tatDays: 1 },
            { laneName: 'Surat-Vapi', basePrice: 8000, duration: 180, decrement: 150, tatDays: 1 },
            { laneName: 'Rajkot-Ahmedabad', basePrice: 15000, duration: 240, decrement: 300, tatDays: 1 },
          ],
        },
        createdBy: 'SYSTEM',
        createdAt: now,
        lastModifiedAt: now,
        usageCount: 0,
      },
      {
        templateId: 'TMPL-SYS-006',
        templateName: 'High-Value Specialty - Express',
        description: 'Reverse auction for high-value specialty goods with express delivery requirement',
        category: TemplateCategory.FTL,
        isSystemTemplate: true,
        visibility: TemplateVisibility.ORGANIZATION,
        isFavorite: false,
        auctionConfiguration: {
          auctionType: AuctionType.REVERSE,
          globalRuleset: {
            minBidDecrement: 3000,
            timerExtensionThresholdSeconds: 15,
            timerExtensionSeconds: 180,
            allowRankVisibility: true,
          },
          lanes: [
            { laneName: 'Mumbai-Delhi (Express)', basePrice: 200000, duration: 800, decrement: 5000, tatDays: 2 },
            { laneName: 'Delhi-Bangalore (Express)', basePrice: 250000, duration: 800, decrement: 5000, tatDays: 2 },
            { laneName: 'Chennai-Kolkata (Express)', basePrice: 280000, duration: 900, decrement: 6000, tatDays: 3 },
          ],
        },
        createdBy: 'SYSTEM',
        createdAt: now,
        lastModifiedAt: now,
        usageCount: 0,
      },
      {
        templateId: 'TMPL-SYS-007',
        templateName: 'Partial Load - Regional Network',
        description: 'LOT auction for partial loads connecting regional hubs',
        category: TemplateCategory.LTL,
        isSystemTemplate: true,
        visibility: TemplateVisibility.ORGANIZATION,
        isFavorite: false,
        auctionConfiguration: {
          auctionType: AuctionType.LOT,
          globalRuleset: {
            minBidDecrement: 100,
            timerExtensionThresholdSeconds: 8,
            timerExtensionSeconds: 90,
            allowRankVisibility: false,
          },
          lanes: [
            { laneName: 'Hub-A to Hub-B', basePrice: 8000, duration: 180, decrement: 150, tatDays: 1 },
            { laneName: 'Hub-B to Hub-C', basePrice: 7500, duration: 180, decrement: 150, tatDays: 1 },
            { laneName: 'Hub-C to Hub-A', basePrice: 9000, duration: 180, decrement: 180, tatDays: 1 },
            { laneName: 'Hub-A to Satellite', basePrice: 5000, duration: 120, decrement: 100, tatDays: 0 },
          ],
        },
        createdBy: 'SYSTEM',
        createdAt: now,
        lastModifiedAt: now,
        usageCount: 0,
      },
      {
        templateId: 'TMPL-SYS-008',
        templateName: 'Cold Chain Distribution',
        description: 'Specialized REVERSE auction for temperature-controlled logistics',
        category: TemplateCategory.FTL,
        isSystemTemplate: true,
        visibility: TemplateVisibility.ORGANIZATION,
        isFavorite: false,
        auctionConfiguration: {
          auctionType: AuctionType.REVERSE,
          globalRuleset: {
            minBidDecrement: 1000,
            timerExtensionThresholdSeconds: 10,
            timerExtensionSeconds: 150,
            allowRankVisibility: true,
          },
          lanes: [
            { laneName: 'Delhi-Mumbai (Cold)', basePrice: 120000, duration: 900, decrement: 2000, tatDays: 2 },
            { laneName: 'Mumbai-Bangalore (Cold)', basePrice: 95000, duration: 900, decrement: 1500, tatDays: 2 },
          ],
        },
        createdBy: 'SYSTEM',
        createdAt: now,
        lastModifiedAt: now,
        usageCount: 0,
      },
    ];

    systemTemplates.forEach(template => {
      this.templates.set(template.templateId, template);
    });
  }
}

export const auctionEngine = new AuctionEngine();
