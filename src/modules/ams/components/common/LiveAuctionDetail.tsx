import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Bell,
  Crown,
  Download,
  Eye,
  Flame,
  MessageSquare,
  Pause,
  Play,
  RefreshCw,
  Search,
  SquareTerminal,
  Timer,
} from 'lucide-react';
import { auctionEngine } from '../../services/mockBackend';
import { AuctionStatus, LaneStatus } from '../../types';
import {
  createLiveAuctionBridge,
  getLaneIsExtended,
  getServerTimeOffsetMs,
  LiveAuctionSnapshot,
  LiveEvent,
  nowWithServerOffset,
} from '../../services/liveAuctionRealtime';
import { useToast } from './common';

const INVITED_VENDORS = ['V-089', 'V-102', 'V-134', 'V-201', 'V-233', 'V-278', 'V-301', 'V-355', 'V-411', 'V-490', 'V-533', 'V-611'];

function formatRemaining(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatINR(value: number | undefined) {
  if (typeof value !== 'number') return '--';
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function laneBadge(status: string) {
  const map: Record<string, string> = {
    SCHEDULED: 'bg-slate-100 text-slate-600',
    ACTIVE: 'bg-green-100 text-green-700',
    HOT: 'bg-red-100 text-red-700',
    EXTENSION: 'bg-orange-100 text-orange-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
    PAUSED: 'bg-blue-100 text-blue-700',
  };
  return map[status] || 'bg-slate-100 text-slate-700';
}

export function LiveAuctionDetail() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [snapshot, setSnapshot] = useState<LiveAuctionSnapshot | null>(null);
  const [now, setNow] = useState(Date.now());
  const offsetRef = useRef(0);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [laneFilter, setLaneFilter] = useState<'all' | 'active' | 'extended' | 'completed'>('all');
  const [laneSort, setLaneSort] = useState<'time' | 'bids' | 'savings'>('time');
  const [selectedLanes, setSelectedLanes] = useState<Set<string>>(new Set());
  const [expandedLane, setExpandedLane] = useState<string | null>(null);
  const [feedFilterLane, setFeedFilterLane] = useState<string>('all');
  const [feedFilterType, setFeedFilterType] = useState<string>('all');
  const [feedFilterVendor, setFeedFilterVendor] = useState<string>('all');
  const [feedSearch, setFeedSearch] = useState('');
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const bridge = createLiveAuctionBridge({
      onSnapshot: setSnapshot,
      onEvent: (event) => {
        if (event.auctionId !== auctionId) return;
        setEvents((prev) => [event, ...prev].slice(0, 1200));
      },
    });

    const initialOffset = getServerTimeOffsetMs();
    offsetRef.current = initialOffset;
    const secondTick = setInterval(() => setNow(nowWithServerOffset(offsetRef.current)), 1000);
    const offsetTick = setInterval(() => {
      const nextOffset = getServerTimeOffsetMs();
      offsetRef.current = nextOffset;
    }, 30_000);

    return () => {
      bridge.disconnect();
      clearInterval(secondTick);
      clearInterval(offsetTick);
    };
  }, [auctionId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!auctionId) return;
      const key = event.key.toLowerCase();
      if (key === 'p') {
        event.preventDefault();
        const auction = auctionEngine.getAuction(auctionId);
        if (!auction) return;
        if (auction.status === AuctionStatus.PAUSED) {
          auctionEngine.resumeAuction(auctionId, 'ADMIN-USER');
          showToast({ type: 'success', title: 'Auction resumed' });
        } else {
          auctionEngine.pauseAuction(auctionId, 'ADMIN-USER', 'Keyboard shortcut');
          showToast({ type: 'warning', title: 'Auction paused' });
        }
      }
      if (key === 'e') {
        event.preventDefault();
        auctionEngine.extendAuctionLanes(auctionId, 120, 'ADMIN-USER');
        showToast({ type: 'info', title: 'All lanes extended by +2 minutes' });
      }
      if (key === 'r') {
        event.preventDefault();
        setSnapshot((prev) => (prev ? { ...prev, fetchedAt: Date.now() } : prev));
      }
      if (key === 'f') {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (key === 'l') {
        event.preventDefault();
        setLaneFilter((prev) => (prev === 'active' ? 'all' : 'active'));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [auctionId, showToast]);

  const auction = useMemo(() => (auctionId ? auctionEngine.getAuction(auctionId) : undefined), [auctionId, snapshot]);
  const lanes = useMemo(() => (auctionId ? auctionEngine.getLanesByAuction(auctionId) : []), [auctionId, snapshot]);

  useEffect(() => {
    if (!auction || !auctionId) return;
    if (auction.status !== AuctionStatus.COMPLETED) return;
    const timer = setTimeout(() => {
      navigate(`/ams/auctions/results/${auctionId}`);
    }, 1200);
    return () => clearTimeout(timer);
  }, [auction?.status, auctionId, navigate]);

  const laneRows = useMemo(() => {
    const rows = lanes.map((lane) => {
      const bids = auctionEngine.getBidsByLane(lane.id);
      const lastBid = bids.reduce((max, bid) => Math.max(max, bid.bidTimestamp), 0) || undefined;
      const best = bids[0];
      const remaining = lane.endTime ? Math.max(0, lane.endTime - now) : 0;
      const extended = getLaneIsExtended(lane);
      const savings = Math.max(0, lane.basePrice - (best?.bidAmount || lane.basePrice));

      let visualStatus = 'SCHEDULED';
      if (lane.status === LaneStatus.PAUSED) visualStatus = 'PAUSED';
      else if (lane.status === LaneStatus.CLOSED || lane.status === LaneStatus.AWARDED) visualStatus = 'COMPLETED';
      else if (lane.status === LaneStatus.RUNNING) visualStatus = 'ACTIVE';
      if (lane.status === LaneStatus.RUNNING && lastBid && now - lastBid <= 10_000) visualStatus = 'HOT';
      if (lane.status === LaneStatus.RUNNING && extended) visualStatus = 'EXTENSION';

      return {
        lane,
        bids,
        best,
        lastBid,
        remaining,
        extended,
        savings,
        status: visualStatus,
      };
    });

    const filtered = rows.filter((row) => {
      if (laneFilter === 'all') return true;
      if (laneFilter === 'active') return row.lane.status === LaneStatus.RUNNING || row.lane.status === LaneStatus.PAUSED;
      if (laneFilter === 'extended') return row.extended;
      if (laneFilter === 'completed') return row.lane.status === LaneStatus.CLOSED || row.lane.status === LaneStatus.AWARDED;
      return true;
    });

    return filtered.sort((a, b) => {
      if (laneSort === 'bids') return b.bids.length - a.bids.length;
      if (laneSort === 'savings') return b.savings - a.savings;
      return a.remaining - b.remaining;
    });
  }, [lanes, laneFilter, laneSort, now]);

  const globalRemaining = useMemo(() => {
    const end = laneRows
      .filter((row) => row.lane.status === LaneStatus.RUNNING || row.lane.status === LaneStatus.PAUSED)
      .reduce<number | undefined>((max, row) => {
        if (!row.lane.endTime) return max;
        if (!max) return row.lane.endTime;
        return Math.max(max, row.lane.endTime);
      }, undefined);
    return end ? Math.max(0, end - now) : 0;
  }, [laneRows, now]);

  const activityEvents = useMemo(() => {
    return events.filter((event) => {
      if (feedFilterLane !== 'all' && event.laneId !== feedFilterLane) return false;
      if (feedFilterType !== 'all' && event.type !== feedFilterType) return false;
      if (feedFilterVendor !== 'all' && event.vendorId !== feedFilterVendor) return false;
      if (feedSearch && !JSON.stringify(event).toLowerCase().includes(feedSearch.toLowerCase())) return false;
      return true;
    });
  }, [events, feedFilterLane, feedFilterType, feedFilterVendor, feedSearch]);

  const vendorCards = useMemo(() => {
    const rows = INVITED_VENDORS.map((vendorId) => {
      const vendorBids = lanes.flatMap((lane) => auctionEngine.getBidsByLane(lane.id).filter((bid) => bid.vendorId === vendorId));
      const lastActivity = vendorBids.reduce((max, bid) => Math.max(max, bid.bidTimestamp), 0) || 0;
      const uniqueLanes = new Set(vendorBids.map((bid) => bid.auctionLaneId)).size;

      let leading = 0;
      lanes.forEach((lane) => {
        const best = auctionEngine.getBidsByLane(lane.id)[0];
        if (best?.vendorId === vendorId) leading += 1;
      });

      let status: 'ONLINE' | 'IDLE' | 'OFFLINE' | 'WATCHING' = 'OFFLINE';
      if (lastActivity && now - lastActivity <= 60_000) status = 'ONLINE';
      else if (lastActivity && now - lastActivity <= 120_000) status = 'IDLE';
      else if (vendorBids.length > 0) status = 'WATCHING';

      return {
        vendorId,
        bids: vendorBids,
        uniqueLanes,
        leading,
        lastActivity,
        status,
      };
    });
    return rows;
  }, [lanes, now, snapshot]);

  const vendorSummary = useMemo(() => {
    const online = vendorCards.filter((vendor) => vendor.status === 'ONLINE' || vendor.status === 'IDLE').length;
    const active = vendorCards.filter((vendor) => vendor.bids.length > 0).length;
    return {
      invited: vendorCards.length,
      online,
      active,
      notParticipating: vendorCards.length - active,
    };
  }, [vendorCards]);

  useEffect(() => {
    if (autoScrollPaused || !feedRef.current) return;
    feedRef.current.scrollTop = 0;
  }, [activityEvents, autoScrollPaused]);

  if (!auction) {
    return <div className="text-slate-500">Auction not found.</div>;
  }

  const pauseResume = () => {
    if (auction.status === AuctionStatus.PAUSED) {
      if (!confirm('Resume auction? Timers will continue from where they were paused.')) return;
      auctionEngine.resumeAuction(auction.id, 'ADMIN-USER');
      showToast({ type: 'success', title: 'Auction resumed' });
    } else {
      const reason = prompt('Pause reason (Technical Issue | Vendor Request | Internal Review | Other):', 'Internal Review');
      if (!reason) return;
      auctionEngine.pauseAuction(auction.id, 'ADMIN-USER', reason);
      showToast({ type: 'warning', title: 'Auction paused', message: reason });
    }
  };

  const extendAll = (seconds: number) => {
    if (!confirm(`Add ${Math.floor(seconds / 60)} minutes to all active lanes?`)) return;
    auctionEngine.extendAuctionLanes(auction.id, seconds, 'ADMIN-USER');
    showToast({ type: 'info', title: `All lanes extended by +${seconds / 60} min` });
  };

  const endAuctionNow = () => {
    if (!confirm('Are you sure? This will end ALL lanes immediately.')) return;
    const reason = prompt('Reason for early termination:', 'Internal Review');
    if (!reason) return;
    auctionEngine.endAuctionNow(auction.id, 'ADMIN-USER', reason);
    showToast({ type: 'warning', title: 'Auction ended early' });
    navigate('/ams/auctions/live');
  };

  const toggleLaneSelect = (laneId: string) => {
    setSelectedLanes((prev) => {
      const next = new Set(prev);
      if (next.has(laneId)) next.delete(laneId);
      else next.add(laneId);
      return next;
    });
  };

  const exportFeedCsv = () => {
    const lines = ['timestamp,event,laneId,vendorId,amount'];
    activityEvents.forEach((event) => {
      lines.push([
        new Date(event.timestamp).toISOString(),
        event.type,
        event.laneId || '',
        event.vendorId || '',
        event.amount || '',
      ].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `live-feed-${auction.id.slice(0, 8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="text-sm text-slate-500">
          <Link to="/ams/auctions/live" className="hover:text-blue-700">Live Auctions</Link> &gt; {auction.name}
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{auction.name}</h1>
            <div className="mt-1 inline-flex px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{auction.status}</div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-mono font-bold ${globalRemaining < 120_000 ? 'text-red-600 animate-pulse' : globalRemaining < 300_000 ? 'text-orange-600' : 'text-emerald-600'}`}>
              {formatRemaining(globalRemaining)}
            </div>
            <div className="text-xs text-slate-500">Global countdown</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={pauseResume} className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm inline-flex items-center gap-2">
            {auction.status === AuctionStatus.PAUSED ? <Play size={14} /> : <Pause size={14} />} {auction.status === AuctionStatus.PAUSED ? 'Resume Auction' : 'Pause Auction'}
          </button>
          <button onClick={() => extendAll(120)} className="px-3 py-2 rounded-lg bg-orange-100 text-orange-800 text-sm">Extend All +2m</button>
          <button onClick={() => extendAll(300)} className="px-3 py-2 rounded-lg bg-orange-100 text-orange-800 text-sm">Extend All +5m</button>
          <button
            onClick={() => {
              const input = prompt('Custom extension in minutes', '3');
              if (!input) return;
              const mins = Number(input);
              if (!Number.isFinite(mins) || mins <= 0) return;
              extendAll(mins * 60);
            }}
            className="px-3 py-2 rounded-lg bg-orange-100 text-orange-800 text-sm"
          >
            Custom Extend
          </button>
          <button onClick={endAuctionNow} className="px-3 py-2 rounded-lg bg-red-100 text-red-700 text-sm">End Auction Early</button>
          <button onClick={() => showToast({ type: 'info', title: 'Vendors notified' })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm inline-flex items-center gap-2"><Bell size={14} />Notify All Vendors</button>
          <button onClick={() => showToast({ type: 'info', title: 'Live report prepared' })} className="px-3 py-2 rounded-lg border border-slate-300 text-sm inline-flex items-center gap-2"><Download size={14} />Download Live Report</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-slate-900">Lanes Monitoring</h2>
              <div className="flex gap-2 text-sm">
                <select value={laneFilter} onChange={(event) => setLaneFilter(event.target.value as typeof laneFilter)} className="border border-slate-300 rounded-lg px-2 py-1">
                  <option value="all">Show All</option>
                  <option value="active">Active Only</option>
                  <option value="extended">Extended</option>
                  <option value="completed">Completed</option>
                </select>
                <select value={laneSort} onChange={(event) => setLaneSort(event.target.value as typeof laneSort)} className="border border-slate-300 rounded-lg px-2 py-1">
                  <option value="time">Sort: Time Remaining</option>
                  <option value="bids">Sort: Most Bids</option>
                  <option value="savings">Sort: Highest Savings</option>
                </select>
              </div>
            </div>

            {selectedLanes.size > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm">
                <span>{selectedLanes.size} lane(s) selected</span>
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 rounded bg-orange-100 text-orange-800"
                    onClick={() => {
                      auctionEngine.extendAuctionLanes(auction.id, 120, 'ADMIN-USER', Array.from(selectedLanes));
                      showToast({ type: 'info', title: 'Selected lanes extended by +2 min' });
                    }}
                  >
                    Extend Selected
                  </button>
                  <button
                    className="px-2 py-1 rounded bg-red-100 text-red-700"
                    onClick={() => {
                      Array.from(selectedLanes).forEach((laneId) => {
                        const lane = auctionEngine.getLane(laneId);
                        if (lane && (lane.status === LaneStatus.RUNNING || lane.status === LaneStatus.PAUSED)) {
                          auctionEngine.forceCloseLane(lane.id, 'ADMIN-USER');
                        }
                      });
                      setSelectedLanes(new Set());
                    }}
                  >
                    End Selected
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3 max-h-[68vh] overflow-y-auto pr-1">
              {laneRows.map((row) => (
                <div key={row.lane.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <input type="checkbox" checked={selectedLanes.has(row.lane.id)} onChange={() => toggleLaneSelect(row.lane.id)} className="mt-1" />
                      <div>
                        <button className="font-semibold text-slate-900 hover:text-blue-700" onClick={() => setExpandedLane((prev) => (prev === row.lane.id ? null : row.lane.id))}>
                          {row.lane.laneName}
                        </button>
                        <div className="mt-1 inline-flex items-center gap-1">
                          {row.status === 'HOT' ? <Flame size={11} /> : null}
                          <span className={`${laneBadge(row.status)} rounded-full px-2 py-0.5`}>{row.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold ${row.remaining < 120_000 ? 'text-red-600' : row.remaining < 300_000 ? 'text-orange-600' : 'text-emerald-600'}`}>{formatRemaining(row.remaining)}</div>
                      {row.extended && <div className="text-xs text-orange-700">EXTENDED</div>}
                    </div>
                  </div>

                  {expandedLane === row.lane.id && (
                    <div className="mt-3 border-t border-slate-100 pt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>Starting Price: <span className="font-semibold">{formatINR(row.lane.basePrice)}</span></div>
                      <div>Current Best: <span className="font-semibold">{formatINR(row.best?.bidAmount)}</span></div>
                      <div>Total Bids: <span className="font-semibold">{row.bids.length}</span></div>
                      <div>Unique Bidders: <span className="font-semibold">{new Set(row.bids.map((bid) => bid.vendorId)).size}</span></div>
                      <div>Savings: <span className="font-semibold text-green-700">{formatINR(row.savings)} ({((row.savings / row.lane.basePrice) * 100).toFixed(1)}%)</span></div>
                      <div>Last Bid: <span className="font-semibold">{row.lastBid ? `${formatRemaining(now - row.lastBid)} ago` : '--'}</span></div>
                      <div className="col-span-2 text-xs text-blue-700">
                        <button className="underline">View Full Bid Log</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Activity Statistics</h2>
              <button onClick={() => setSnapshot((prev) => (prev ? { ...prev, fetchedAt: Date.now() } : prev))} className="text-xs px-2 py-1 rounded border border-slate-300 inline-flex items-center gap-1"><RefreshCw size={12} />Refresh</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">Bids/min: <strong>{events.filter((event) => event.type === 'NEW_BID' && now - event.timestamp < 60_000).length}</strong></div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">Avg between bids: <strong>{Math.max(1, Math.floor(60 / Math.max(1, events.filter((event) => event.type === 'NEW_BID' && now - event.timestamp < 60_000).length)))}s</strong></div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">Most active lane: <strong>{laneRows.sort((a, b) => b.bids.length - a.bids.length)[0]?.lane.laneName || '--'}</strong></div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">Most active vendor: <strong>{vendorCards.sort((a, b) => b.bids.length - a.bids.length)[0]?.vendorId || '--'}</strong></div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-slate-900 mr-auto">Live Bid Activity Stream</h2>
              <button onClick={() => setAutoScrollPaused((prev) => !prev)} className="px-2 py-1 text-xs rounded border border-slate-300">{autoScrollPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}</button>
              <button onClick={exportFeedCsv} className="px-2 py-1 text-xs rounded border border-slate-300 inline-flex items-center gap-1"><Download size={12} />CSV</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <select value={feedFilterLane} onChange={(event) => setFeedFilterLane(event.target.value)} className="border border-slate-300 rounded-lg px-2 py-1">
                <option value="all">All Lanes</option>
                {lanes.map((lane) => (
                  <option key={lane.id} value={lane.id}>{lane.laneName}</option>
                ))}
              </select>
              <select value={feedFilterType} onChange={(event) => setFeedFilterType(event.target.value)} className="border border-slate-300 rounded-lg px-2 py-1">
                <option value="all">All Events</option>
                <option value="NEW_BID">New Bid</option>
                <option value="LANE_EXTENDED">Extension Triggered</option>
                <option value="LANE_ENDED">Lane Ended</option>
              </select>
              <select value={feedFilterVendor} onChange={(event) => setFeedFilterVendor(event.target.value)} className="border border-slate-300 rounded-lg px-2 py-1">
                <option value="all">All Vendors</option>
                {vendorCards.map((vendor) => (
                  <option key={vendor.vendorId} value={vendor.vendorId}>{vendor.vendorId}</option>
                ))}
              </select>
              <label className="relative">
                <Search size={14} className="absolute left-2 top-2.5 text-slate-400" />
                <input ref={searchRef} value={feedSearch} onChange={(event) => setFeedSearch(event.target.value)} className="w-full border border-slate-300 rounded-lg pl-8 pr-2 py-1" placeholder="Search bid history" />
              </label>
            </div>

            <div ref={feedRef} className="max-h-[58vh] overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {activityEvents.map((event, idx) => {
                const lane = event.laneId ? auctionEngine.getLane(event.laneId) : undefined;
                const eventColor = event.type === 'NEW_BID' ? 'bg-yellow-50' : event.type === 'LANE_EXTENDED' ? 'bg-orange-50' : 'bg-slate-50';
                return (
                  <div key={`${event.timestamp}-${idx}`} className={`px-3 py-2 ${eventColor}`}>
                    <div className="flex items-start justify-between gap-2 text-xs">
                      <span className="font-mono text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200">{event.type}</span>
                    </div>
                    <div className="mt-1 text-sm">
                      <div><span className="font-medium text-slate-700">Lane:</span> {lane?.laneName || '--'}</div>
                      <div><span className="font-medium text-slate-700">Vendor:</span> {event.vendorId || '--'} {event.amount ? `| Bid: ${formatINR(event.amount)}` : ''}</div>
                      <div className="text-xs text-slate-500">{event.type === 'NEW_BID' ? 'Rank update in progress' : event.type === 'LANE_EXTENDED' ? 'Extension triggered by late competitive bid' : 'Lane closed'}</div>
                    </div>
                  </div>
                );
              })}
              {activityEvents.length === 0 && <div className="text-sm text-slate-500 p-4">No events in selected filters.</div>}
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h2 className="font-semibold text-slate-900 mb-3">Vendor Participation</h2>
            <div className="space-y-2 text-sm mb-3">
              <div>Total Invited: <strong>{vendorSummary.invited}</strong></div>
              <div>Currently Online: <strong>{vendorSummary.online}</strong></div>
              <div>Active Bidders: <strong>{vendorSummary.active}</strong></div>
              <div className="flex items-center justify-between">Not Participating: <strong>{vendorSummary.notParticipating}</strong> <button className="text-xs px-2 py-1 rounded border border-slate-300">Send reminder</button></div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto space-y-2 pr-1">
              {vendorCards.map((vendor) => {
                const statusStyle = vendor.status === 'ONLINE'
                  ? 'text-emerald-700 bg-emerald-100'
                  : vendor.status === 'IDLE'
                    ? 'text-yellow-700 bg-yellow-100'
                    : vendor.status === 'WATCHING'
                      ? 'text-blue-700 bg-blue-100'
                      : 'text-slate-600 bg-slate-100';
                return (
                  <div key={vendor.vendorId} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-900">{vendor.vendorId}</div>
                      <div className={`text-xs px-2 py-0.5 rounded-full ${statusStyle}`}>{vendor.status}</div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-slate-600">
                      <div>Lanes Bid: {vendor.uniqueLanes}/{lanes.length}</div>
                      <div>Total Bids: {vendor.bids.length}</div>
                      <div>Leading: <span className="inline-flex items-center gap-1">{vendor.leading}<Crown size={11} /></span></div>
                      <div>Last Activity: {vendor.lastActivity ? `${formatRemaining(now - vendor.lastActivity)} ago` : '--'}</div>
                      <div>Participation Rate: {Math.round((vendor.uniqueLanes / Math.max(1, lanes.length)) * 100)}%</div>
                      <div>Win Rate (current): {Math.round((vendor.leading / Math.max(1, lanes.length)) * 100)}%</div>
                    </div>
                    <div className="mt-2 flex gap-1">
                      <button className="px-2 py-1 rounded border border-slate-300 text-xs inline-flex items-center gap-1"><MessageSquare size={11} />Message</button>
                      <button className="px-2 py-1 rounded border border-slate-300 text-xs inline-flex items-center gap-1"><SquareTerminal size={11} />History</button>
                      <button className="px-2 py-1 rounded border border-red-200 text-red-700 text-xs inline-flex items-center gap-1"><Eye size={11} />Block</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-500">
        Shortcuts: <code>P</code> pause/resume, <code>E</code> extend, <code>R</code> refresh, <code>F</code> focus search, <code>L</code> toggle active-lane filter.
      </div>
      <div className="text-xs text-slate-500">Timezone: Your time {new Date(now).toLocaleTimeString()} | IST {new Date(now).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
      <div className="text-xs text-slate-500">Reduced motion users can disable CSS animations in OS accessibility settings.</div>
    </div>
  );
}
