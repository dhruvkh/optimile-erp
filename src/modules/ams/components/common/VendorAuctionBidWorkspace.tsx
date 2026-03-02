import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Bot,
  Check,
  Crown,
  Flame,
  RefreshCw,
  Search,
  Star,
  Timer,
  Trophy,
  X,
} from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { auctionEngine } from '../../services/mockBackend';
import { Auction, AuctionLane, AuctionStatus, LaneStatus } from '../../types';
import { Modal, useToast } from './common';

const VENDOR_ID = 'V-089';
const WATCH_KEY = `vendor-watch-lanes-${VENDOR_ID}`;

type LaneViewFilter = 'all' | 'active' | 'won' | 'lost' | 'notBid';
type ParticipationFilter = 'all' | 'bidding' | 'watching' | 'notParticipating';
type LaneSort = 'time' | 'price' | 'status' | 'activity';
type Strategy = 'conservative' | 'balanced' | 'aggressive';
type Trigger = 'immediate' | 'wait30' | 'lastMinute';
type BulkMode = 'beat500' | 'match' | 'custom';

interface AutoBidConfig {
  enabled: boolean;
  paused: boolean;
  maxBidAmount: number;
  strategy: Strategy;
  trigger: Trigger;
  maxAutoBids: number;
  autoBidCount: number;
  outbidSince?: number;
}

interface LaneVM {
  lane: AuctionLane;
  bids: ReturnType<typeof auctionEngine.getBidsByLane>;
  currentBest: number;
  myBest?: number;
  myRank: number | null;
  positionText: string;
  statusBadge: string;
  statusColor: string;
  remainingMs: number;
  totalBids: number;
  activeBidders: number;
}

function formatINR(value: number | undefined) {
  if (typeof value !== 'number') return '--';
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getRemainingTone(ms: number) {
  if (ms < 60_000) return 'text-red-600 animate-pulse';
  if (ms < 120_000) return 'text-orange-600';
  return 'text-emerald-600';
}

function randomAlias(vendorId: string) {
  const code = vendorId.split('-').pop() || vendorId.slice(-2);
  return `Vendor ${code}`;
}

export function VendorAuctionBidWorkspace() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [tick, setTick] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [laneFilter, setLaneFilter] = useState<LaneViewFilter>('all');
  const [participationFilter, setParticipationFilter] = useState<ParticipationFilter>('all');
  const [laneSort, setLaneSort] = useState<LaneSort>('time');
  const [customBid, setCustomBid] = useState<number>(0);
  const [watchList, setWatchList] = useState<Set<string>>(new Set());
  const [autoBid, setAutoBid] = useState<Record<string, AutoBidConfig>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<BulkMode>('beat500');
  const [bulkCustom, setBulkCustom] = useState<Record<string, number>>({});
  const [bulkProgress, setBulkProgress] = useState<string>('');
  const [watchTabOnly, setWatchTabOnly] = useState(false);
  const autoBidSpentRef = useRef(0);

  useEffect(() => {
    const raw = localStorage.getItem(WATCH_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as string[];
        setWatchList(new Set(parsed));
      } catch {
        setWatchList(new Set());
      }
    }

    const unsub = auctionEngine.subscribe(() => setTick((v) => v + 1));
    const interval = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const auction = useMemo<Auction | undefined>(() => {
    if (!auctionId) return undefined;
    return auctionEngine.getAuction(auctionId);
  }, [auctionId, tick]);

  const lanes = useMemo(() => {
    if (!auctionId) return [];
    return auctionEngine.getLanesByAuction(auctionId);
  }, [auctionId, tick]);

  const laneVMs = useMemo<LaneVM[]>(() => {
    const computed = lanes.map((lane) => {
      const bids = auctionEngine.getBidsByLane(lane.id);
      const currentBest = bids[0]?.bidAmount || lane.basePrice;
      const myBids = bids.filter((bid) => bid.vendorId === VENDOR_ID);
      const myBest = myBids[0]?.bidAmount;
      const myRank = auctionEngine.getVendorRank(lane.id, VENDOR_ID);
      const remainingMs = lane.endTime ? Math.max(0, lane.endTime - now) : 0;
      const activeBidders = new Set(bids.map((bid) => bid.vendorId)).size;
      const lastBidTs = bids.reduce((max, bid) => Math.max(max, bid.bidTimestamp), 0);
      const hot = lane.status === LaneStatus.RUNNING && now - lastBidTs <= 30_000;
      const extended = Boolean(lane.startTime && lane.endTime && lane.endTime > lane.startTime + lane.timerDurationSeconds * 1000 + 500);

      let statusBadge = 'ACTIVE';
      let statusColor = 'bg-green-100 text-green-700';
      if (lane.status === LaneStatus.CLOSED || lane.status === LaneStatus.AWARDED) {
        statusBadge = 'COMPLETED';
        statusColor = 'bg-slate-100 text-slate-700';
      } else if (extended) {
        statusBadge = 'EXTENSION';
        statusColor = 'bg-orange-100 text-orange-700';
      } else if (hot) {
        statusBadge = 'HOT';
        statusColor = 'bg-red-100 text-red-700';
      }

      let positionText = 'Not bid';
      if (myRank === 1) {
        positionText = '👑 1st';
        statusBadge = 'WINNING';
        statusColor = 'bg-yellow-100 text-yellow-700';
      } else if (myRank === 2) {
        positionText = '🥈 2nd';
        if (lane.status === LaneStatus.RUNNING) {
          statusBadge = '2nd PLACE';
          statusColor = 'bg-slate-200 text-slate-700';
        }
      } else if (myRank && myRank > 2) {
        positionText = `${myRank}th`;
        if (lane.status === LaneStatus.RUNNING) {
          statusBadge = 'OUTBID';
          statusColor = 'bg-red-100 text-red-700';
        }
      }

      return {
        lane,
        bids,
        currentBest,
        myBest,
        myRank,
        positionText,
        statusBadge,
        statusColor,
        remainingMs,
        totalBids: bids.length,
        activeBidders,
      };
    });

    return computed;
  }, [lanes, now]);

  useEffect(() => {
    if (!selectedLaneId && laneVMs.length > 0) {
      setSelectedLaneId(laneVMs[0].lane.id);
    }
  }, [laneVMs, selectedLaneId]);

  const selectedLaneVM = laneVMs.find((row) => row.lane.id === selectedLaneId) || laneVMs[0];

  useEffect(() => {
    if (!selectedLaneVM) return;
    const suggestion = selectedLaneVM.currentBest - selectedLaneVM.lane.minBidDecrement;
    setCustomBid(Math.max(0, suggestion));
  }, [selectedLaneVM?.lane.id, selectedLaneVM?.currentBest]);

  const filteredLanes = useMemo(() => {
    const matches = laneVMs.filter((row) => {
      if (watchTabOnly && !watchList.has(row.lane.id)) return false;
      if (search) {
        const laneName = row.lane.laneName.toLowerCase();
        if (!laneName.includes(search.toLowerCase())) return false;
      }
      if (laneFilter === 'active' && row.lane.status !== LaneStatus.RUNNING && row.lane.status !== LaneStatus.PAUSED) return false;
      if (laneFilter === 'won' && row.myRank !== 1) return false;
      if (laneFilter === 'lost' && (row.myRank === 1 || row.myRank === null)) return false;
      if (laneFilter === 'notBid' && row.myRank !== null) return false;

      if (participationFilter === 'bidding' && row.myRank === null) return false;
      if (participationFilter === 'watching' && !watchList.has(row.lane.id)) return false;
      if (participationFilter === 'notParticipating' && (row.myRank !== null || watchList.has(row.lane.id))) return false;

      return true;
    });

    return matches.sort((a, b) => {
      if (laneSort === 'price') return b.currentBest - a.currentBest;
      if (laneSort === 'status') return (a.myRank || 99) - (b.myRank || 99);
      if (laneSort === 'activity') return b.totalBids - a.totalBids;
      return a.remainingMs - b.remainingMs;
    });
  }, [laneVMs, search, laneFilter, participationFilter, laneSort, watchList, watchTabOnly]);

  useEffect(() => {
    // Smart watch-list alert: significant price drop.
    watchList.forEach((laneId) => {
      const vm = laneVMs.find((row) => row.lane.id === laneId);
      if (!vm) return;
      const dropPct = ((vm.lane.basePrice - vm.currentBest) / vm.lane.basePrice) * 100;
      if (dropPct >= 20 && vm.remainingMs > 0 && vm.remainingMs <= 2 * 60_000) {
        showToast({ type: 'warning', title: `Watched lane ending soon`, message: `${vm.lane.laneName} dropped ${dropPct.toFixed(1)}%` });
      }
    });
  }, [laneVMs, watchList, showToast]);

  useEffect(() => {
    // Auto-bid engine
    laneVMs.forEach((row) => {
      const cfg = autoBid[row.lane.id];
      if (!cfg || !cfg.enabled || cfg.paused) return;
      if (row.lane.status !== LaneStatus.RUNNING) return;
      if (row.myRank === 1) {
        if (cfg.outbidSince) {
          setAutoBid((prev) => ({
            ...prev,
            [row.lane.id]: { ...prev[row.lane.id], outbidSince: undefined },
          }));
        }
        return;
      }
      if (cfg.autoBidCount >= cfg.maxAutoBids) return;

      const nowTs = Date.now();
      const outbidSince = cfg.outbidSince || nowTs;
      if (!cfg.outbidSince) {
        setAutoBid((prev) => ({
          ...prev,
          [row.lane.id]: { ...prev[row.lane.id], outbidSince: nowTs },
        }));
      }

      const triggerPassed =
        cfg.trigger === 'immediate' ||
        (cfg.trigger === 'wait30' && nowTs - outbidSince >= 30_000) ||
        (cfg.trigger === 'lastMinute' && row.remainingMs <= 60_000);

      if (!triggerPassed) return;

      const dec = row.lane.minBidDecrement;
      const maxAllowed = row.currentBest - dec;
      let target = maxAllowed;
      if (cfg.strategy === 'aggressive') target = maxAllowed - Math.max(dec * 4, 500);
      if (cfg.strategy === 'balanced') target = maxAllowed - Math.max(dec, 100);
      target = Math.max(0, target);

      // Reverse auction safety: don't go below floor (maxBidAmount treated as floor limit)
      if (target < cfg.maxBidAmount) {
        showToast({ type: 'warning', title: `Auto-bid limit reached`, message: row.lane.laneName });
        setAutoBid((prev) => ({
          ...prev,
          [row.lane.id]: { ...prev[row.lane.id], enabled: false },
        }));
        return;
      }

      if (autoBidSpentRef.current + target > 10_00_000) {
        showToast({ type: 'error', title: 'Daily auto-bid cap reached (₹10L)' });
        return;
      }

      try {
        auctionEngine.placeBid(row.lane.id, VENDOR_ID, target);
        autoBidSpentRef.current += target;
        setAutoBid((prev) => ({
          ...prev,
          [row.lane.id]: {
            ...prev[row.lane.id],
            autoBidCount: prev[row.lane.id].autoBidCount + 1,
            outbidSince: undefined,
          },
        }));
        showToast({ type: 'info', title: `Auto-bid placed`, message: `${formatINR(target)} on ${row.lane.laneName}` });
      } catch {
        // ignore transient placement failures.
      }
    });
  }, [laneVMs, autoBid, showToast]);

  if (!auction) {
    return <div className="text-slate-500">Auction not found.</div>;
  }

  const submitBid = (amount: number) => {
    if (!selectedLaneVM) return;
    const lane = selectedLaneVM.lane;
    const currentBest = selectedLaneVM.currentBest;

    if (lane.status !== LaneStatus.RUNNING) {
      showToast({ type: 'error', title: 'Lane is not active' });
      return;
    }
    if (amount >= currentBest) {
      showToast({ type: 'error', title: 'Bid must be below current best price' });
      return;
    }
    const decrement = currentBest - amount;
    if (decrement < lane.minBidDecrement || decrement % lane.minBidDecrement !== 0) {
      showToast({ type: 'error', title: `Bid decrement must follow ₹${lane.minBidDecrement} steps` });
      return;
    }

    setPendingBidAmount(amount);
    setShowConfirmModal(true);
  };

  const confirmBid = () => {
    if (!selectedLaneVM || pendingBidAmount === null) return;
    try {
      auctionEngine.placeBid(selectedLaneVM.lane.id, VENDOR_ID, pendingBidAmount);
      showToast({ type: 'success', title: 'Bid placed successfully!', message: 'Position updated in real-time.' });
      setShowConfirmModal(false);
      setPendingBidAmount(null);
    } catch (error) {
      showToast({ type: 'error', title: (error as Error).message });
    }
  };

  const quickBidOptions = selectedLaneVM
    ? [
        { label: `Beat by ₹${selectedLaneVM.lane.minBidDecrement}`, amount: selectedLaneVM.currentBest - selectedLaneVM.lane.minBidDecrement },
        { label: 'Beat by ₹500', amount: selectedLaneVM.currentBest - 500 },
        { label: 'Beat by ₹1000', amount: selectedLaneVM.currentBest - 1000 },
        { label: 'Aggressive', amount: Math.floor(selectedLaneVM.currentBest * 0.9) },
      ]
    : [];

  const overallRemaining = laneVMs
    .filter((row) => row.lane.status === LaneStatus.RUNNING || row.lane.status === LaneStatus.PAUSED)
    .reduce((max, row) => Math.max(max, row.remainingMs), 0);

  const lanesLeading = laneVMs.filter((row) => row.myRank === 1).length;
  const lanesBidding = laneVMs.filter((row) => row.myRank !== null).length;
  const totalBidsPlaced = laneVMs.reduce((sum, row) => sum + row.bids.filter((bid) => bid.vendorId === VENDOR_ID).length, 0);
  const avgDiscount = laneVMs.length > 0
    ? laneVMs.reduce((sum, row) => sum + ((row.lane.basePrice - row.currentBest) / row.lane.basePrice) * 100, 0) / laneVMs.length
    : 0;
  const estimatedWin = laneVMs.reduce((sum, row) => {
    if (row.myRank === 1) return sum + row.currentBest;
    return sum;
  }, 0);

  const mostCompetitive = laneVMs.slice().sort((a, b) => b.totalBids - a.totalBids)[0];
  const bidPerMinute = laneVMs.reduce((sum, row) => {
    const recent = row.bids.filter((bid) => now - bid.bidTimestamp <= 60_000).length;
    return sum + recent;
  }, 0);

  const intensity = bidPerMinute >= 6 ? 'HIGH' : bidPerMinute >= 3 ? 'MEDIUM' : 'LOW';

  const toggleWatch = (laneId: string) => {
    const next = new Set(watchList);
    if (next.has(laneId)) next.delete(laneId);
    else next.add(laneId);
    setWatchList(next);
    localStorage.setItem(WATCH_KEY, JSON.stringify(Array.from(next)));
  };

  const leaderboard = selectedLaneVM
    ? selectedLaneVM.bids
        .slice()
        .sort((a, b) => a.bidAmount - b.bidAmount)
        .reduce<Array<{ vendorId: string; best: number }>>((acc, bid) => {
          if (!acc.find((row) => row.vendorId === bid.vendorId)) {
            acc.push({ vendorId: bid.vendorId, best: bid.bidAmount });
          }
          return acc;
        }, [])
        .slice(0, 5)
    : [];

  const historyChart = selectedLaneVM
    ? selectedLaneVM.bids
        .slice()
        .sort((a, b) => a.bidTimestamp - b.bidTimestamp)
        .map((bid) => ({
          t: new Date(bid.bidTimestamp).toLocaleTimeString(),
          amount: bid.bidAmount,
          mine: bid.vendorId === VENDOR_ID,
        }))
    : [];

  const applyBulkAndSubmit = async () => {
    const selected = Array.from(bulkSelected);
    if (selected.length === 0) return;

    let success = 0;
    for (let i = 0; i < selected.length; i += 1) {
      const laneId = selected[i];
      const vm = laneVMs.find((row) => row.lane.id === laneId);
      if (!vm) continue;

      let amount = vm.currentBest - vm.lane.minBidDecrement;
      if (bulkMode === 'beat500') amount = vm.currentBest - 500;
      if (bulkMode === 'match') amount = vm.currentBest - vm.lane.minBidDecrement;
      if (bulkMode === 'custom') amount = bulkCustom[laneId] ?? amount;

      setBulkProgress(`Submitting bid ${i + 1} of ${selected.length}...`);
      try {
        auctionEngine.placeBid(laneId, VENDOR_ID, amount);
        success += 1;
      } catch {
        // Continue batch.
      }
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    setBulkProgress('');
    showToast({ type: success === selected.length ? 'success' : 'warning', title: `${success}/${selected.length} bids placed` });
    setBulkOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <button className="text-sm text-slate-500 hover:text-slate-700" onClick={() => navigate('/vendor-portal')}>← Back to Dashboard</button>
          <h1 className="text-2xl font-bold text-slate-900">Live Auction Bidding</h1>
          <p className="text-slate-500">{auction.name} • Vendor {VENDOR_ID}</p>
        </div>
        <button className="px-3 py-2 rounded-lg border border-slate-300 text-sm inline-flex items-center gap-2" onClick={() => setTick((v) => v + 1)}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 min-h-[78vh]">
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-3 space-y-3">
          <div className="flex items-center gap-2">
            <button className={`px-2 py-1 rounded text-xs ${!watchTabOnly ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`} onClick={() => setWatchTabOnly(false)}>All Lanes</button>
            <button className={`px-2 py-1 rounded text-xs ${watchTabOnly ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`} onClick={() => setWatchTabOnly(true)}>Watch List</button>
            <span className="text-xs text-slate-500 ml-auto">{filteredLanes.length} lanes</span>
          </div>

          <div className="space-y-2">
            <label className="relative block">
              <Search size={14} className="absolute left-2 top-2.5 text-slate-400" />
              <input className="w-full border border-slate-300 rounded-lg pl-8 pr-2 py-2 text-sm" placeholder="Search route" value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <select className="border border-slate-300 rounded px-2 py-1" value={laneFilter} onChange={(e) => setLaneFilter(e.target.value as LaneViewFilter)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="notBid">Not Bid</option>
              </select>
              <select className="border border-slate-300 rounded px-2 py-1" value={participationFilter} onChange={(e) => setParticipationFilter(e.target.value as ParticipationFilter)}>
                <option value="all">All Participation</option>
                <option value="bidding">Bidding</option>
                <option value="watching">Watching</option>
                <option value="notParticipating">Not Participating</option>
              </select>
              <select className="border border-slate-300 rounded px-2 py-1 col-span-2" value={laneSort} onChange={(e) => setLaneSort(e.target.value as LaneSort)}>
                <option value="time">Sort: Time remaining</option>
                <option value="price">Sort: Price highest</option>
                <option value="status">Sort: My status</option>
                <option value="activity">Sort: Bid activity</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button className="px-2 py-1 rounded border" onClick={() => setBulkSelected(new Set(filteredLanes.map((row) => row.lane.id)))}>Select All</button>
            <button className="px-2 py-1 rounded border" onClick={() => setBulkSelected(new Set())}>Select None</button>
            <span className="text-slate-500 ml-auto">{bulkSelected.size} selected</span>
          </div>

          {bulkSelected.size > 1 && (
            <button className="w-full px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold" onClick={() => setBulkOpen(true)}>
              Bid on Selected ({bulkSelected.size})
            </button>
          )}

          <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
            {filteredLanes.map((row) => {
              const isSelected = selectedLaneVM?.lane.id === row.lane.id;
              const autoCfg = autoBid[row.lane.id];
              const outbid = row.myRank !== null && row.myRank > 1 && row.lane.status === LaneStatus.RUNNING;
              return (
                <div
                  key={row.lane.id}
                  className={`rounded-lg border p-3 transition ${isSelected ? 'border-blue-500 ring-1 ring-blue-200 bg-blue-50/40' : row.myRank === 1 ? 'border-yellow-300 bg-yellow-50/50' : 'border-slate-200 bg-white'}`}
                >
                  <div className="flex items-start gap-2">
                    <input type="checkbox" checked={bulkSelected.has(row.lane.id)} onChange={() => {
                      const next = new Set(bulkSelected);
                      if (next.has(row.lane.id)) next.delete(row.lane.id);
                      else next.add(row.lane.id);
                      setBulkSelected(next);
                    }} className="mt-1" />
                    <button className="text-left flex-1" onClick={() => setSelectedLaneId(row.lane.id)}>
                      <div className="font-semibold text-slate-900">{row.lane.laneName}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs">
                        {row.statusBadge === 'HOT' && <Flame size={12} className="text-red-600" />}
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${row.statusColor}`}>{row.statusBadge}</span>
                        <span className={`font-mono ml-auto ${getRemainingTone(row.remainingMs)}`}>{formatRemaining(row.remainingMs)}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-600">Best: {formatINR(row.currentBest)} • Yours: {formatINR(row.myBest)} • {row.positionText}</div>
                    </button>
                    <button className={`p-1 rounded ${watchList.has(row.lane.id) ? 'text-yellow-600' : 'text-slate-400'}`} onClick={() => toggleWatch(row.lane.id)}>
                      <Star size={14} fill={watchList.has(row.lane.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <div className="mt-2 flex gap-2">
                    {row.myRank === 1 ? (
                      <button className="flex-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold inline-flex justify-center items-center gap-1"><Check size={12} />Leading</button>
                    ) : outbid ? (
                      <button className="flex-1 px-2 py-1 rounded bg-red-600 text-white text-xs font-semibold" onClick={() => {
                        setSelectedLaneId(row.lane.id);
                        submitBid(row.currentBest - row.lane.minBidDecrement);
                      }}>Place Bid</button>
                    ) : (
                      <button className="flex-1 px-2 py-1 rounded bg-blue-600 text-white text-xs font-semibold" onClick={() => setSelectedLaneId(row.lane.id)}>Bid Now</button>
                    )}
                  </div>

                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <label className="inline-flex items-center gap-1 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={Boolean(autoCfg?.enabled)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const confirmEnable = confirm(`Enable auto-bid up to ${formatINR(row.currentBest - row.lane.minBidDecrement)} for ${row.lane.laneName}?`);
                            if (!confirmEnable) return;
                          }
                          setAutoBid((prev) => ({
                            ...prev,
                            [row.lane.id]: {
                              enabled: e.target.checked,
                              paused: false,
                              maxBidAmount: Math.max(0, (row.currentBest - row.lane.minBidDecrement) - 2500),
                              strategy: 'balanced',
                              trigger: 'immediate',
                              maxAutoBids: 12,
                              autoBidCount: prev[row.lane.id]?.autoBidCount || 0,
                            },
                          }));
                        }}
                      />
                      <Bot size={12} /> Enable Auto-Bid
                    </label>

                    {autoCfg?.enabled && (
                      <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                        <input
                          type="number"
                          className="border rounded px-1 py-1"
                          value={autoCfg.maxBidAmount}
                          onChange={(e) => setAutoBid((prev) => ({
                            ...prev,
                            [row.lane.id]: { ...prev[row.lane.id], maxBidAmount: Number(e.target.value) },
                          }))}
                          placeholder="Floor amount"
                        />
                        <select
                          className="border rounded px-1 py-1"
                          value={autoCfg.strategy}
                          onChange={(e) => setAutoBid((prev) => ({
                            ...prev,
                            [row.lane.id]: { ...prev[row.lane.id], strategy: e.target.value as Strategy },
                          }))}
                        >
                          <option value="conservative">🐢 Conservative</option>
                          <option value="balanced">⚡ Balanced</option>
                          <option value="aggressive">🚀 Aggressive</option>
                        </select>
                        <select
                          className="border rounded px-1 py-1"
                          value={autoCfg.trigger}
                          onChange={(e) => setAutoBid((prev) => ({
                            ...prev,
                            [row.lane.id]: { ...prev[row.lane.id], trigger: e.target.value as Trigger },
                          }))}
                        >
                          <option value="immediate">Immediate</option>
                          <option value="wait30">Wait 30s</option>
                          <option value="lastMinute">Final 60s</option>
                        </select>
                        <button
                          className="border rounded px-1 py-1"
                          onClick={() => setAutoBid((prev) => ({
                            ...prev,
                            [row.lane.id]: { ...prev[row.lane.id], paused: !prev[row.lane.id].paused },
                          }))}
                        >
                          {autoCfg.paused ? 'Resume Auto' : 'Pause Auto'}
                        </button>
                        <div className="col-span-2 text-slate-500">
                          🤖 Auto-bidding ({formatINR(autoCfg.maxBidAmount)} floor, {autoCfg.maxAutoBids - autoCfg.autoBidCount} remaining)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-4 space-y-4">
          {!selectedLaneVM ? (
            <div className="text-slate-500">Select a lane to start bidding.</div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedLaneVM.lane.laneName}</h2>
                  <div className="text-xs text-slate-500">Lane ID: #{selectedLaneVM.lane.id.slice(0, 6)}</div>
                </div>
                <div className={`text-right font-mono text-2xl font-bold ${getRemainingTone(selectedLaneVM.remainingMs)}`}>
                  {Math.floor(selectedLaneVM.remainingMs / 60000)}m {Math.floor((selectedLaneVM.remainingMs % 60000) / 1000)}s
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 grid grid-cols-2 gap-2 text-sm">
                <div>Route: <strong>{selectedLaneVM.lane.laneName}</strong></div>
                <div>Vehicle Type: <strong>FTL</strong></div>
                <div>Quantity/Capacity: <strong>1 truck</strong></div>
                <div>TAT Required: <strong>{selectedLaneVM.lane.tatDays || 4} days</strong></div>
                <div>Starting Price: <strong>{formatINR(selectedLaneVM.lane.basePrice)}</strong></div>
                <div>Current Best: <strong>{formatINR(selectedLaneVM.currentBest)}</strong></div>
                <div>Your Best Bid: <strong>{formatINR(selectedLaneVM.myBest)}</strong></div>
                <div>Bid Decrement: <strong>{formatINR(selectedLaneVM.lane.minBidDecrement)}</strong></div>
                <div>Total Bids: <strong>{selectedLaneVM.totalBids}</strong></div>
                <div>Active Bidders: <strong>{selectedLaneVM.activeBidders}</strong></div>
                <div className="col-span-2">Special Instructions: <strong>Temperature controlled required</strong></div>
              </div>

              <div className={`rounded-lg p-3 ${selectedLaneVM.myRank === 1 ? 'bg-yellow-50 border border-yellow-200' : selectedLaneVM.myRank === 2 ? 'bg-slate-100 border border-slate-200' : selectedLaneVM.myRank ? 'bg-orange-50 border border-orange-200' : 'bg-slate-50 border border-slate-200'}`}>
                {selectedLaneVM.myRank === 1 && <div className="font-bold text-yellow-700">👑 You're in 1st place!</div>}
                {selectedLaneVM.myRank === 2 && (
                  <div className="font-semibold text-slate-700">🥈 You're in 2nd place - {formatINR((selectedLaneVM.myBest || 0) - selectedLaneVM.currentBest)} behind leader</div>
                )}
                {selectedLaneVM.myRank && selectedLaneVM.myRank > 2 && (
                  <div className="font-semibold text-orange-700">{selectedLaneVM.myRank}rd place - outbid by {formatINR((selectedLaneVM.myBest || 0) - selectedLaneVM.currentBest)}</div>
                )}
                {!selectedLaneVM.myRank && <div className="font-semibold text-slate-700">Not bidding yet</div>}

                {selectedLaneVM.myRank && selectedLaneVM.myRank > 1 && (
                  <div className="mt-2 text-sm text-red-700 inline-flex items-center gap-1"><AlertTriangle size={14} /> You've been outbid!</div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900">Quick Bid Buttons</h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickBidOptions.map((option) => {
                    const savings = ((selectedLaneVM.lane.basePrice - option.amount) / selectedLaneVM.lane.basePrice) * 100;
                    return (
                      <button
                        key={option.label}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:border-blue-400"
                        onClick={() => submitBid(option.amount)}
                      >
                        <div className="text-sm font-semibold text-slate-800">{option.label}: {formatINR(option.amount)}</div>
                        <div className="text-xs text-slate-500">↓ {savings.toFixed(1)}%</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900">Custom Bid Entry</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={customBid}
                    onChange={(e) => setCustomBid(Number(e.target.value))}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 font-mono"
                    placeholder="Enter your bid amount"
                  />
                  <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold" onClick={() => submitBid(customBid)}>Submit Bid</button>
                </div>
                <div className="text-xs text-slate-600">
                  Your bid: {formatINR(customBid)} • vs Starting: {formatINR(selectedLaneVM.lane.basePrice - customBid)} saved ({(((selectedLaneVM.lane.basePrice - customBid) / selectedLaneVM.lane.basePrice) * 100).toFixed(1)}%) • vs Current: {formatINR(selectedLaneVM.currentBest - customBid)} improvement
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-slate-900">Recent Bid History (last 10)</div>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-2 py-2 text-left">Timestamp</th>
                        <th className="px-2 py-2 text-left">Bidder</th>
                        <th className="px-2 py-2 text-left">Bid Amount</th>
                        <th className="px-2 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLaneVM.bids.slice(0, 10).map((bid, idx) => (
                        <tr key={bid.id} className={`border-t border-slate-100 ${bid.vendorId === VENDOR_ID ? 'bg-blue-50' : ''}`}>
                          <td className="px-2 py-2 font-mono text-xs">{new Date(bid.bidTimestamp).toLocaleTimeString()}</td>
                          <td className="px-2 py-2">{bid.vendorId === VENDOR_ID ? 'YOU' : randomAlias(bid.vendorId)}</td>
                          <td className="px-2 py-2 font-semibold">{formatINR(bid.bidAmount)}</td>
                          <td className="px-2 py-2 text-xs">{idx === 0 ? 'Current Leader' : 'Outbid'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-slate-900">Bid Activity Chart</div>
                <div className="h-44 border border-slate-200 rounded-lg p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyChart}>
                      <XAxis dataKey="t" hide />
                      <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                      <Tooltip />
                      <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="xl:col-span-3 bg-white border border-slate-200 rounded-xl p-4 space-y-4">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900">Auction Overview</h3>
            <div className="text-sm text-slate-700">{auction.name}</div>
            <div className="text-xs text-slate-500">{auction.auctionType}</div>
            <div className="text-sm">Total Lanes: <strong>{laneVMs.length}</strong></div>
            <div className="text-sm">Lanes bidding on: <strong>{lanesBidding}</strong></div>
            <div className="text-sm">Potential win: <strong>{formatINR(estimatedWin)}</strong></div>
            <div className={`text-sm font-mono ${getRemainingTone(overallRemaining)}`}>Auction ends in {formatRemaining(overallRemaining)}</div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-900">Your Performance</h3>
            <div className="text-sm">Lanes Bid: <strong>{lanesBidding} of {laneVMs.length} ({laneVMs.length > 0 ? Math.round((lanesBidding / laneVMs.length) * 100) : 0}%)</strong></div>
            <div className="text-sm">Currently Leading: <strong>{lanesLeading} lanes ({lanesBidding > 0 ? Math.round((lanesLeading / lanesBidding) * 100) : 0}%)</strong></div>
            <div className="text-sm">Total Bids Placed: <strong>{totalBidsPlaced}</strong></div>
            <div className="text-sm">Average Discount: <strong>{avgDiscount.toFixed(1)}%</strong></div>
            <div className="text-sm">Estimated Win Value: <strong>{formatINR(estimatedWin)}</strong></div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-900">Competition Indicators</h3>
            <div className="text-sm">Active Bidders: <strong>{new Set(laneVMs.flatMap((row) => row.bids.map((bid) => bid.vendorId))).size}</strong></div>
            <div className="text-sm">Bidding Intensity: <strong>{intensity === 'HIGH' ? '🔥 HIGH' : intensity === 'MEDIUM' ? '⚡ MEDIUM' : '😴 LOW'}</strong></div>
            <div className="text-sm">Average bid frequency: <strong>{bidPerMinute > 0 ? `1 bid every ${Math.max(1, Math.floor(60 / bidPerMinute))}s` : 'No recent bids'}</strong></div>
            <div className="text-sm">Most competitive lane: <strong>{mostCompetitive?.lane.laneName || '--'} ({mostCompetitive?.totalBids || 0} bids)</strong></div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-900">Leaderboard (Selected Lane)</h3>
            {leaderboard.map((row, idx) => (
              <div key={row.vendorId} className={`text-sm rounded px-2 py-1 border ${row.vendorId === VENDOR_ID ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-200'}`}>
                {idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`} {row.vendorId === VENDOR_ID ? 'YOU' : randomAlias(row.vendorId)} - {formatINR(row.best)}
              </div>
            ))}
            {leaderboard.length === 0 && <div className="text-sm text-slate-500">No bids yet.</div>}
          </div>
        </div>
      </div>

      <Modal
        title="Confirm Your Bid"
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button className="px-3 py-2 rounded border" onClick={() => setShowConfirmModal(false)}>Cancel</button>
            <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={confirmBid}>Confirm Bid</button>
          </div>
        }
      >
        {selectedLaneVM && pendingBidAmount !== null && (
          <div className="space-y-2 text-sm">
            <div>Lane: <strong>{selectedLaneVM.lane.laneName}</strong></div>
            <div>Your Bid Amount: <strong>{formatINR(pendingBidAmount)}</strong></div>
            <div>Current Best: <strong>{formatINR(selectedLaneVM.currentBest)}</strong></div>
            <div>Your Improvement: <strong>{formatINR(selectedLaneVM.currentBest - pendingBidAmount)} better</strong></div>
            <label className="inline-flex items-center gap-2 text-slate-700 mt-2">
              <input type="checkbox" defaultChecked />
              I accept the auction terms and conditions
            </label>
          </div>
        )}
      </Modal>

      <Modal
        title="Bulk Bidding"
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        size="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-slate-500">{bulkProgress || `${bulkSelected.size} lanes selected`}</div>
            <div className="flex gap-2">
              <button className="px-3 py-2 rounded border" onClick={() => setBulkOpen(false)}>Cancel</button>
              <button className="px-3 py-2 rounded bg-indigo-600 text-white" onClick={applyBulkAndSubmit}>Submit All Bids</button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <button className={`px-2 py-1 rounded border ${bulkMode === 'beat500' ? 'bg-indigo-600 text-white' : ''}`} onClick={() => setBulkMode('beat500')}>Beat all by ₹500</button>
            <button className={`px-2 py-1 rounded border ${bulkMode === 'match' ? 'bg-indigo-600 text-white' : ''}`} onClick={() => setBulkMode('match')}>Match leaders</button>
            <button className={`px-2 py-1 rounded border ${bulkMode === 'custom' ? 'bg-indigo-600 text-white' : ''}`} onClick={() => setBulkMode('custom')}>Individual custom</button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-2 text-left">Lane</th>
                  <th className="px-2 py-2 text-left">Current Best</th>
                  <th className="px-2 py-2 text-left">Bid Amount</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(bulkSelected).map((laneId) => {
                  const vm = laneVMs.find((row) => row.lane.id === laneId);
                  if (!vm) return null;
                  const defaultAmount = vm.currentBest - vm.lane.minBidDecrement;
                  const previewAmount = bulkMode === 'beat500'
                    ? vm.currentBest - 500
                    : bulkMode === 'match'
                      ? defaultAmount
                      : bulkCustom[laneId] ?? defaultAmount;

                  return (
                    <tr key={laneId} className="border-t border-slate-100">
                      <td className="px-2 py-2">{vm.lane.laneName}</td>
                      <td className="px-2 py-2">{formatINR(vm.currentBest)}</td>
                      <td className="px-2 py-2">
                        {bulkMode === 'custom' ? (
                          <input
                            type="number"
                            className="border border-slate-300 rounded px-2 py-1 w-40"
                            value={previewAmount}
                            onChange={(e) => setBulkCustom((prev) => ({ ...prev, [laneId]: Number(e.target.value) }))}
                          />
                        ) : (
                          <span>{formatINR(previewAmount)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="text-sm text-slate-600">
            Total if you win all: <strong>{formatINR(Array.from(bulkSelected).reduce((sum, laneId) => {
              const vm = laneVMs.find((row) => row.lane.id === laneId);
              if (!vm) return sum;
              const amount = bulkMode === 'beat500'
                ? vm.currentBest - 500
                : bulkMode === 'match'
                  ? vm.currentBest - vm.lane.minBidDecrement
                  : bulkCustom[laneId] ?? (vm.currentBest - vm.lane.minBidDecrement);
              return sum + amount;
            }, 0))}</strong>
          </div>
        </div>
      </Modal>
    </div>
  );
}
