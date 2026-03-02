import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Circle,
  Eye,
  Gauge,
  LayoutGrid,
  List,
  Pause,
  Play,
  RefreshCw,
  Table,
  Timer,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { auctionEngine } from '../../services/mockBackend';
import { Auction, AuctionStatus, AuctionType, LaneStatus } from '../../types';
import {
  createLiveAuctionBridge,
  getLaneIsExtended,
  getServerTimeOffsetMs,
  LiveAuctionSnapshot,
  LiveEvent,
  nowWithServerOffset,
} from '../../services/liveAuctionRealtime';
import { useToast } from './common';

type ViewMode = 'grid' | 'list' | 'table';
type DerivedAuctionStatus = 'LIVE' | 'STARTING SOON' | 'ENDING SOON' | 'EXTENDED' | 'PAUSED';

interface AuctionCardVM {
  auction: Auction;
  lanes: ReturnType<typeof auctionEngine.getLanesByAuction>;
  status: DerivedAuctionStatus;
  activeLanes: number;
  totalLanes: number;
  pendingLanes: number;
  runningLanes: number;
  pausedLanes: number;
  completedLanes: number;
  extendedLanes: number;
  endTime?: number;
  lastBidAt?: number;
  totalBids: number;
  activeBidders: number;
  startingValue: number;
  currentBest?: number;
  invitedVendors: number;
}

const INVITED_VENDOR_COUNT = 12;

function formatINR(value: number | undefined) {
  if (typeof value !== 'number') return '--';
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatRemaining(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getTimerColor(ms: number) {
  if (ms < 30_000) return 'text-red-600 animate-pulse';
  if (ms < 120_000) return 'text-red-600';
  if (ms < 300_000) return 'text-orange-600';
  return 'text-emerald-600';
}

function getAuctionTypeBadge(type: AuctionType) {
  const map: Record<AuctionType, string> = {
    [AuctionType.REVERSE]: 'bg-blue-100 text-blue-700',
    [AuctionType.SPOT]: 'bg-orange-100 text-orange-700',
    [AuctionType.LOT]: 'bg-purple-100 text-purple-700',
    [AuctionType.BULK]: 'bg-emerald-100 text-emerald-700',
    [AuctionType.REGION_LOT]: 'bg-indigo-100 text-indigo-700',
  };
  return map[type] || 'bg-slate-100 text-slate-700';
}

function getDerivedStatus(vm: Omit<AuctionCardVM, 'status'>, now: number): DerivedAuctionStatus {
  if (vm.auction.status === AuctionStatus.PAUSED) return 'PAUSED';
  if (vm.extendedLanes > 0) return 'EXTENDED';
  const remaining = vm.endTime ? vm.endTime - now : Number.MAX_SAFE_INTEGER;
  if (remaining > 0 && remaining < 120_000) return 'ENDING SOON';
  if (vm.runningLanes === 0 && vm.pendingLanes > 0) return 'STARTING SOON';
  return 'LIVE';
}

function getStatusPill(status: DerivedAuctionStatus) {
  const styles: Record<DerivedAuctionStatus, string> = {
    LIVE: 'bg-green-100 text-green-700',
    'STARTING SOON': 'bg-yellow-100 text-yellow-700',
    'ENDING SOON': 'bg-orange-100 text-orange-700 animate-pulse',
    EXTENDED: 'bg-red-100 text-red-700 animate-pulse',
    PAUSED: 'bg-blue-100 text-blue-700',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${styles[status]}`}>
      <Circle size={10} className="fill-current" />
      {status}
    </span>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-1 h-10">
      {values.map((v, idx) => (
        <div
          key={idx}
          className="w-2 bg-blue-400/70 rounded-t"
          style={{ height: `${Math.max(8, Math.round((v / max) * 100))}%` }}
        />
      ))}
    </div>
  );
}

function AuctionGridCard({ vm, now, onRefresh }: { vm: AuctionCardVM; now: number; onRefresh: () => void }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const remaining = vm.endTime ? Math.max(0, vm.endTime - now) : 0;
  const starting = vm.startingValue;
  const current = vm.currentBest ?? starting;
  const savings = Math.max(0, starting - current);
  const savingsPct = starting > 0 ? (savings / starting) * 100 : 0;
  const participationPct = Math.round((vm.activeBidders / vm.invitedVendors) * 100);

  const allBids = auctionEngine.getBidsByAuction(vm.auction.id);
  const sparkline = useMemo(() => {
    const buckets = new Array(12).fill(0);
    const base = now - 12 * 60_000;
    allBids.forEach((bid) => {
      if (bid.bidTimestamp < base) return;
      const idx = Math.min(11, Math.floor((bid.bidTimestamp - base) / 60_000));
      buckets[idx] += 1;
    });
    return buckets;
  }, [allBids, now]);

  const doPauseResume = () => {
    try {
      if (vm.auction.status === AuctionStatus.PAUSED) {
        auctionEngine.resumeAuction(vm.auction.id, 'ADMIN-USER');
        showToast({ type: 'success', title: 'Auction resumed' });
      } else {
        const reason = prompt('Reason for pause (required):', 'Technical Issue');
        if (!reason) return;
        auctionEngine.pauseAuction(vm.auction.id, 'ADMIN-USER', reason);
        showToast({ type: 'warning', title: 'Auction paused' });
      }
      onRefresh();
    } catch (error) {
      showToast({ type: 'error', title: (error as Error).message });
    }
  };

  const doExtend = () => {
    try {
      auctionEngine.extendAuctionLanes(vm.auction.id, 120, 'ADMIN-USER');
      showToast({ type: 'info', title: 'All lanes extended by 2 minutes' });
      onRefresh();
    } catch (error) {
      showToast({ type: 'error', title: (error as Error).message });
    }
  };

  const doEndNow = () => {
    if (!confirm(`End auction now: ${vm.auction.name}?`)) return;
    const reason = prompt('Reason for early termination:', 'Internal Review');
    if (!reason) return;
    try {
      auctionEngine.endAuctionNow(vm.auction.id, 'ADMIN-USER', reason);
      showToast({ type: 'warning', title: 'Auction ended early' });
      onRefresh();
    } catch (error) {
      showToast({ type: 'error', title: (error as Error).message });
    }
  };

  const lastBidAgo = vm.lastBidAt ? formatRemaining(now - vm.lastBidAt) : '--';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            className="text-left text-lg font-bold text-slate-900 hover:text-blue-700"
            onClick={() => navigate(`/ams/auctions/live/${vm.auction.id}`)}
          >
            {vm.auction.name}
          </button>
          <div className="mt-1 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${getAuctionTypeBadge(vm.auction.auctionType)}`}>
              {vm.auction.auctionType}
            </span>
            <span className="text-xs text-slate-400 font-mono">{vm.auction.id.slice(0, 8)}</span>
          </div>
        </div>
        {getStatusPill(vm.status)}
      </div>

      <div>
        <div className={`text-3xl font-mono font-bold ${getTimerColor(remaining)}`}>{formatRemaining(remaining)}</div>
        <div className="text-xs text-slate-500">remaining</div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">{vm.activeLanes} of {vm.totalLanes} lanes active</span>
          <span className="font-semibold text-slate-700">{Math.round((vm.activeLanes / Math.max(1, vm.totalLanes)) * 100)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500" style={{ width: `${(vm.activeLanes / Math.max(1, vm.totalLanes)) * 100}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
          <span>Blue (Not started): {vm.pendingLanes}</span>
          <span>Green (Active): {vm.runningLanes}</span>
          <span>Orange (Extension): {vm.extendedLanes}</span>
          <span>Gray (Completed): {vm.completedLanes}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-slate-500">Last bid</div>
          <div className="font-semibold text-slate-800">{lastBidAgo} ago</div>
        </div>
        <div>
          <div className="text-slate-500">Total bids</div>
          <div className="font-semibold text-slate-800">{vm.totalBids}</div>
        </div>
        <div>
          <div className="text-slate-500">Active bidders</div>
          <div className="font-semibold text-slate-800">{vm.activeBidders} vendors</div>
        </div>
        <div>
          <div className="text-slate-500">Activity</div>
          <Sparkline values={sparkline} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm border rounded-lg p-3 bg-slate-50">
        <div>
          <div className="text-slate-500">Starting Value</div>
          <div className="font-semibold">{formatINR(starting)}</div>
        </div>
        <div>
          <div className="text-slate-500">Current Best</div>
          <div className="font-semibold">{formatINR(current)}</div>
        </div>
        <div>
          <div className="text-slate-500">Savings</div>
          <div className="font-semibold text-green-700 inline-flex items-center gap-1">
            <ArrowUpRight size={14} /> {formatINR(savings)} ({savingsPct.toFixed(1)}%)
          </div>
        </div>
        <div>
          <div className="text-slate-500">Participation</div>
          <div className="font-semibold">{participationPct}% ({vm.activeBidders}/{vm.invitedVendors})</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => navigate(`/ams/auctions/live/${vm.auction.id}`)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">View Details</button>
        <button onClick={doPauseResume} className="px-3 py-2 rounded-lg bg-slate-200 text-slate-800 text-sm font-medium hover:bg-slate-300">
          {vm.auction.status === AuctionStatus.PAUSED ? 'Resume Auction' : 'Pause Auction'}
        </button>
        <button onClick={doExtend} className="px-3 py-2 rounded-lg bg-orange-100 text-orange-800 text-sm font-medium hover:bg-orange-200">Extend All Lanes</button>
        <button onClick={doEndNow} className="px-3 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200">End Now</button>
        <button className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm">More Actions</button>
      </div>
    </div>
  );
}

export function LiveAuctionsDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [snapshot, setSnapshot] = useState<LiveAuctionSnapshot | null>(null);
  const [now, setNow] = useState(Date.now());
  const serverOffsetRef = useRef(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'remaining' | 'bids' | 'savings'>('remaining');
  const [connection, setConnection] = useState({ mode: 'realtime' as 'realtime' | 'polling', status: 'connected' as 'connected' | 'reconnecting' | 'disconnected', lastMessageAt: Date.now() });

  useEffect(() => {
    const bridge = createLiveAuctionBridge({
      onSnapshot: setSnapshot,
      onConnectionState: setConnection,
      onEvent: (event: LiveEvent) => {
        if (event.type === 'LANE_EXTENDED') {
          showToast({ type: 'info', title: 'Lane extended', message: `${event.laneId?.slice(0, 8)} extended` });
        }
        if (event.type === 'AUCTION_PAUSED') {
          showToast({ type: 'warning', title: 'Auction paused' });
        }
      },
    });

    const secondTick = setInterval(() => setNow(nowWithServerOffset(serverOffsetRef.current)), 1000);
    const offsetTick = setInterval(() => {
      const nextOffset = getServerTimeOffsetMs();
      serverOffsetRef.current = nextOffset;
    }, 30_000);
    const initialOffset = getServerTimeOffsetMs();
    serverOffsetRef.current = initialOffset;

    return () => {
      bridge.disconnect();
      clearInterval(secondTick);
      clearInterval(offsetTick);
    };
  }, [showToast]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'r') {
        setSnapshot((prev) => (prev ? { ...prev, fetchedAt: Date.now() } : prev));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const auctionVMs = useMemo(() => {
    if (!snapshot) return [];
    const activeAuctions = snapshot.auctions.filter((auction) => {
      const lanes = auctionEngine.getLanesByAuction(auction.id);
      return lanes.some((lane) => [LaneStatus.PENDING, LaneStatus.RUNNING, LaneStatus.PAUSED].includes(lane.status));
    });

    const vms = activeAuctions.map((auction) => {
      const lanes = auctionEngine.getLanesByAuction(auction.id);
      const runningLanes = lanes.filter((lane) => lane.status === LaneStatus.RUNNING).length;
      const pausedLanes = lanes.filter((lane) => lane.status === LaneStatus.PAUSED).length;
      const pendingLanes = lanes.filter((lane) => lane.status === LaneStatus.PENDING).length;
      const completedLanes = lanes.filter((lane) => lane.status === LaneStatus.CLOSED || lane.status === LaneStatus.AWARDED).length;
      const endTime = lanes
        .filter((lane) => lane.status === LaneStatus.RUNNING || lane.status === LaneStatus.PAUSED)
        .reduce<number | undefined>((max, lane) => {
          if (!lane.endTime) return max;
          if (!max) return lane.endTime;
          return Math.max(max, lane.endTime);
        }, undefined);

      const bids = auctionEngine.getBidsByAuction(auction.id);
      const lastBidAt = bids[0]?.bidTimestamp;
      const startingValue = lanes.reduce((sum, lane) => sum + lane.basePrice, 0);
      const currentBest = lanes.reduce((sum, lane) => sum + (lane.currentLowestBid || lane.basePrice), 0);
      const extendedLanes = lanes.filter((lane) => getLaneIsExtended(lane)).length;
      const activeBidders = new Set(bids.filter((bid) => now - bid.bidTimestamp < 10 * 60_000).map((bid) => bid.vendorId)).size;

      const base: Omit<AuctionCardVM, 'status'> = {
        auction,
        lanes,
        activeLanes: runningLanes + pausedLanes,
        totalLanes: lanes.length,
        pendingLanes,
        runningLanes,
        pausedLanes,
        completedLanes,
        extendedLanes,
        endTime,
        lastBidAt,
        totalBids: bids.length,
        activeBidders,
        startingValue,
        currentBest,
        invitedVendors: INVITED_VENDOR_COUNT,
      };

      return {
        ...base,
        status: getDerivedStatus(base, now),
      } as AuctionCardVM;
    });

    return [...vms].sort((a, b) => {
      if (sortBy === 'name') return a.auction.name.localeCompare(b.auction.name);
      if (sortBy === 'bids') return b.totalBids - a.totalBids;
      if (sortBy === 'savings') {
        const aSavings = a.startingValue - (a.currentBest || a.startingValue);
        const bSavings = b.startingValue - (b.currentBest || b.startingValue);
        return bSavings - aSavings;
      }
      return (a.endTime || Number.MAX_SAFE_INTEGER) - (b.endTime || Number.MAX_SAFE_INTEGER);
    });
  }, [snapshot, now, sortBy]);

  const stats = useMemo(() => {
    if (!snapshot) {
      return {
        activeAuctions: 0,
        totalActiveLanes: 0,
        liveBidders: 0,
        totalBidsToday: 0,
        activeBids60: 0,
        activeBidTrend: 0,
      };
    }
    const bids = auctionEngine.getAllBids();
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const nowTime = now;

    const activeBids60 = bids.filter((bid) => nowTime - bid.bidTimestamp <= 60_000).length;
    const prev60 = bids.filter((bid) => {
      const diff = nowTime - bid.bidTimestamp;
      return diff > 60_000 && diff <= 120_000;
    }).length;

    return {
      activeAuctions: auctionVMs.length,
      totalActiveLanes: auctionVMs.reduce((sum, vm) => sum + vm.activeLanes, 0),
      liveBidders: new Set(bids.filter((bid) => nowTime - bid.bidTimestamp <= 120_000).map((bid) => bid.vendorId)).size,
      totalBidsToday: bids.filter((bid) => bid.bidTimestamp >= dayStart.getTime()).length,
      activeBids60,
      activeBidTrend: activeBids60 - prev60,
    };
  }, [snapshot, auctionVMs, now]);

  const manualRefresh = () => {
    setSnapshot((prev) => (prev ? { ...prev, fetchedAt: Date.now() } : prev));
  };

  if (!snapshot) {
    return <div className="text-slate-500">Loading live auctions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Active Auctions Dashboard</h1>
          <p className="text-slate-500">Complete visibility into all active auctions with live updates.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1 rounded-full border border-slate-200 text-slate-600 inline-flex items-center gap-2">
            {connection.status === 'connected' ? <Wifi size={14} className="text-emerald-600" /> : <WifiOff size={14} className="text-red-600" />}
            Updates: {connection.mode === 'realtime' ? 'Real-time' : 'Polling mode'}
          </span>
          <button
            onClick={manualRefresh}
            title="Force refresh all data"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {connection.status !== 'connected' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between text-amber-900">
          <div className="inline-flex items-center gap-2">
            <Bell size={16} />
            Connection lost. Attempting to reconnect...
          </div>
          <button className="text-sm font-semibold underline" onClick={() => window.location.reload()}>
            Reconnect
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard icon={<Activity size={18} className="text-blue-600" />} label="Active Auctions" value={stats.activeAuctions} pulse />
        <KpiCard icon={<Gauge size={18} className="text-indigo-600" />} label="Total Active Lanes" value={stats.totalActiveLanes} />
        <KpiCard icon={<Eye size={18} className="text-emerald-600" />} label="Live Bidders" value={`${stats.liveBidders} vendors`} />
        <KpiCard icon={<Timer size={18} className="text-violet-600" />} label="Total Bids Today" value={stats.totalBidsToday} />
        <KpiCard
          icon={<Activity size={18} className="text-orange-600" />}
          label="Active Bids (60s)"
          value={stats.activeBids60}
          right={
            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${stats.activeBidTrend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {stats.activeBidTrend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(stats.activeBidTrend)}
            </span>
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-xs text-slate-500">
          <RefreshCw size={14} className="animate-spin" />
          Last Updated: {Math.max(0, Math.floor((now - snapshot.fetchedAt) / 1000)) <= 2 ? 'Just now' : `${Math.floor((now - snapshot.fetchedAt) / 1000)}s ago`}
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
          <ToggleButton active={viewMode === 'grid'} onClick={() => setViewMode('grid')} icon={<LayoutGrid size={14} />} label="Grid Cards" />
          <ToggleButton active={viewMode === 'list'} onClick={() => setViewMode('list')} icon={<List size={14} />} label="Detailed List" />
          <ToggleButton active={viewMode === 'table'} onClick={() => setViewMode('table')} icon={<Table size={14} />} label="Compact Table" />
        </div>
      </div>

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {auctionVMs.map((vm) => (
            <AuctionGridCard key={vm.auction.id} vm={vm} now={now} onRefresh={manualRefresh} />
          ))}
        </div>
      )}

      {viewMode !== 'grid' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Active Auctions</h2>
            <select
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
            >
              <option value="remaining">Sort: Time Remaining</option>
              <option value="name">Sort: Name</option>
              <option value="bids">Sort: Most Bids</option>
              <option value="savings">Sort: Highest Savings</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3">Auction Name & ID</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Time Remaining</th>
                  <th className="text-left px-4 py-3">Active Lanes</th>
                  <th className="text-left px-4 py-3">Last Bid</th>
                  <th className="text-left px-4 py-3">Current Savings</th>
                  <th className="text-left px-4 py-3">Active Bidders</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {auctionVMs.map((vm) => {
                  const remaining = vm.endTime ? Math.max(0, vm.endTime - now) : 0;
                  const savings = Math.max(0, vm.startingValue - (vm.currentBest || vm.startingValue));
                  const savingsPct = vm.startingValue > 0 ? (savings / vm.startingValue) * 100 : 0;
                  return (
                    <tr key={vm.auction.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <button onClick={() => navigate(`/ams/auctions/live/${vm.auction.id}`)} className="font-semibold text-slate-900 hover:text-blue-700">{vm.auction.name}</button>
                        <div className="text-xs text-slate-400 font-mono">{vm.auction.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getAuctionTypeBadge(vm.auction.auctionType)}`}>{vm.auction.auctionType}</span></td>
                      <td className="px-4 py-3">{getStatusPill(vm.status)}</td>
                      <td className={`px-4 py-3 font-mono ${getTimerColor(remaining)}`}>{formatRemaining(remaining)}</td>
                      <td className="px-4 py-3">{vm.activeLanes}/{vm.totalLanes} ({Math.round((vm.activeLanes / Math.max(1, vm.totalLanes)) * 100)}%)</td>
                      <td className="px-4 py-3">{vm.lastBidAt ? `${formatRemaining(now - vm.lastBidAt)} ago` : '--'}</td>
                      <td className="px-4 py-3 text-green-700 font-semibold">{formatINR(savings)} ({savingsPct.toFixed(1)}%)</td>
                      <td className="px-4 py-3">{vm.activeBidders}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            className="p-2 rounded border border-slate-300 hover:bg-slate-100"
                            title={vm.auction.status === AuctionStatus.PAUSED ? 'Resume' : 'Pause'}
                            onClick={() => {
                              if (vm.auction.status === AuctionStatus.PAUSED) {
                                auctionEngine.resumeAuction(vm.auction.id, 'ADMIN-USER');
                              } else {
                                auctionEngine.pauseAuction(vm.auction.id, 'ADMIN-USER', 'Internal Review');
                              }
                              manualRefresh();
                            }}
                          >
                            {vm.auction.status === AuctionStatus.PAUSED ? <Play size={14} /> : <Pause size={14} />}
                          </button>
                          <button className="p-2 rounded border border-slate-300 hover:bg-slate-100" onClick={() => navigate(`/ams/auctions/live/${vm.auction.id}`)} title="Open details">
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, right, pulse }: { icon: React.ReactNode; label: string; value: string | number; right?: React.ReactNode; pulse?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-start justify-between">
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
      </div>
      <div className={`mt-1 ${pulse ? 'animate-pulse' : ''}`}>{icon}</div>
      {right}
    </div>
  );
}

function ToggleButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`px-3 py-2 text-sm inline-flex items-center gap-2 ${active ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>
      {icon}
      {label}
    </button>
  );
}
