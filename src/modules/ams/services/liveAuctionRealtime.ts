import { auctionEngine } from './mockBackend';
import { AuditEventType, Auction, AuctionLane, LaneStatus } from '../types';

export type LiveEventType =
  | 'NEW_BID'
  | 'LANE_EXTENDED'
  | 'LANE_ENDED'
  | 'VENDOR_ONLINE'
  | 'AUCTION_PAUSED'
  | 'AUCTION_RESUMED';

export interface LiveEvent {
  type: LiveEventType;
  timestamp: number;
  auctionId: string;
  laneId?: string;
  vendorId?: string;
  amount?: number;
  newEndTime?: number;
  extensionDuration?: number;
  status?: 'online' | 'offline';
  payload?: Record<string, unknown>;
}

export interface LiveAuctionSnapshot {
  auctions: Auction[];
  lanes: AuctionLane[];
  bidsByLane: Record<string, number>;
  bestBidByLane: Record<string, number | undefined>;
  lastBidAtByLane: Record<string, number | undefined>;
  auditEventCount: number;
  fetchedAt: number;
}

export interface ConnectionState {
  mode: 'realtime' | 'polling';
  status: 'connected' | 'reconnecting' | 'disconnected';
  lastMessageAt: number;
}

interface BridgeOptions {
  onSnapshot: (snapshot: LiveAuctionSnapshot) => void;
  onEvent?: (event: LiveEvent) => void;
  onConnectionState?: (state: ConnectionState) => void;
  pollIntervalMs?: number;
}

function buildSnapshot(): LiveAuctionSnapshot {
  const snapshot = auctionEngine.getSnapshot();
  const bidsByLane: Record<string, number> = {};
  const bestBidByLane: Record<string, number | undefined> = {};
  const lastBidAtByLane: Record<string, number | undefined> = {};

  snapshot.lanes.forEach((lane) => {
    const bids = auctionEngine.getBidsByLane(lane.id);
    bidsByLane[lane.id] = bids.length;
    bestBidByLane[lane.id] = bids[0]?.bidAmount;
    lastBidAtByLane[lane.id] = bids.reduce((max, bid) => Math.max(max, bid.bidTimestamp), 0) || undefined;
  });

  return {
    auctions: auctionEngine.getAllAuctions(),
    lanes: snapshot.lanes,
    bidsByLane,
    bestBidByLane,
    lastBidAtByLane,
    auditEventCount: snapshot.auditLog.length,
    fetchedAt: Date.now(),
  };
}

function emitDiffEvents(previous: LiveAuctionSnapshot, next: LiveAuctionSnapshot, onEvent?: (event: LiveEvent) => void) {
  if (!onEvent) return;

  const previousLaneById = new Map(previous.lanes.map((lane) => [lane.id, lane]));

  next.lanes.forEach((lane) => {
    const before = previousLaneById.get(lane.id);
    if (!before) return;

    const prevCount = previous.bidsByLane[lane.id] || 0;
    const nextCount = next.bidsByLane[lane.id] || 0;
    if (nextCount > prevCount) {
      const latest = auctionEngine.getBidsByLane(lane.id)[0];
      if (latest) {
        onEvent({
          type: 'NEW_BID',
          timestamp: latest.bidTimestamp,
          auctionId: lane.auctionId,
          laneId: lane.id,
          vendorId: latest.vendorId,
          amount: latest.bidAmount,
        });
      }
    }

    if ((before.endTime || 0) < (lane.endTime || 0) && lane.status !== LaneStatus.CLOSED) {
      onEvent({
        type: 'LANE_EXTENDED',
        timestamp: Date.now(),
        auctionId: lane.auctionId,
        laneId: lane.id,
        newEndTime: lane.endTime,
        extensionDuration: ((lane.endTime || 0) - (before.endTime || 0)) / 1000,
      });
    }

    if (before.status !== LaneStatus.CLOSED && lane.status === LaneStatus.CLOSED) {
      onEvent({
        type: 'LANE_ENDED',
        timestamp: Date.now(),
        auctionId: lane.auctionId,
        laneId: lane.id,
      });
    }
  });

  const previousAuctionById = new Map(previous.auctions.map((auction) => [auction.id, auction]));
  next.auctions.forEach((auction) => {
    const before = previousAuctionById.get(auction.id);
    if (!before) return;

    if (before.status !== auction.status && auction.status === 'PAUSED') {
      onEvent({
        type: 'AUCTION_PAUSED',
        timestamp: Date.now(),
        auctionId: auction.id,
      });
    }

    if (before.status !== auction.status && auction.status === 'RUNNING' && before.status === 'PAUSED') {
      onEvent({
        type: 'AUCTION_RESUMED',
        timestamp: Date.now(),
        auctionId: auction.id,
      });
    }
  });

}

export function createLiveAuctionBridge(options: BridgeOptions) {
  const pollIntervalMs = options.pollIntervalMs || 2000;
  let previousSnapshot = buildSnapshot();
  let unsubscribeEngine: (() => void) | undefined;
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let state: ConnectionState = {
    mode: 'realtime',
    status: 'connected',
    lastMessageAt: Date.now(),
  };

  const setState = (next: Partial<ConnectionState>) => {
    state = { ...state, ...next };
    options.onConnectionState?.(state);
  };

  const publish = () => {
    const nextSnapshot = buildSnapshot();
    emitDiffEvents(previousSnapshot, nextSnapshot, options.onEvent);
    previousSnapshot = nextSnapshot;
    options.onSnapshot(nextSnapshot);
    setState({ lastMessageAt: Date.now(), status: 'connected' });
  };

  const startRealtime = () => {
    try {
      unsubscribeEngine = auctionEngine.subscribe(publish);
      setState({ mode: 'realtime', status: 'connected' });
      publish();
    } catch {
      startPolling();
    }
  };

  const startPolling = () => {
    if (pollTimer) clearInterval(pollTimer);
    setState({ mode: 'polling', status: 'reconnecting' });
    pollTimer = setInterval(() => {
      publish();
      setState({ status: 'connected' });
    }, pollIntervalMs);
    publish();
  };

  startRealtime();

  return {
    disconnect: () => {
      if (unsubscribeEngine) unsubscribeEngine();
      if (pollTimer) clearInterval(pollTimer);
      setState({ status: 'disconnected' });
    },
    reconnect: () => {
      if (unsubscribeEngine) unsubscribeEngine();
      if (pollTimer) clearInterval(pollTimer);
      setState({ status: 'reconnecting' });
      startRealtime();
    },
    switchToPolling: () => {
      if (unsubscribeEngine) unsubscribeEngine();
      startPolling();
    },
    refreshNow: () => publish(),
    getState: () => state,
  };
}

export function getServerTimeOffsetMs(): number {
  return auctionEngine.getServerTime() - Date.now();
}

export function nowWithServerOffset(offsetMs: number): number {
  return Date.now() + offsetMs;
}

export function getLaneIsExtended(lane: AuctionLane): boolean {
  if (!lane.startTime || !lane.endTime) return false;
  const expectedEnd = lane.startTime + lane.timerDurationSeconds * 1000;
  return lane.endTime > expectedEnd + 500;
}

export function getLastExtensionEventForLane(laneId: string): number | undefined {
  const audit = auctionEngine.getSnapshot().auditLog;
  const event = audit.find(
    (item) => item.entityId === laneId && item.eventType === AuditEventType.TIMER_EXTENDED
  );
  const value = event?.payload?.newEndTime;
  return typeof value === 'number' ? value : undefined;
}
