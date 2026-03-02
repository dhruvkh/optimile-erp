import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Bookmark,
  CalendarDays,
  Clock,
  Flame,
  FolderOpen,
  Gavel,
  HandCoins,
  ListChecks,
  TrendingDown,
  Trophy,
  Wallet,
} from 'lucide-react';
import { auctionEngine } from '../../services/mockBackend';
import { AuctionStatus, LaneStatus } from '../../types';
import { useToast } from './common';

const VENDOR_ID = 'V-089';
const WATCH_KEY = `vendor-watch-auctions-${VENDOR_ID}`;

function formatRemaining(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatINR(amount: number) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function buildICS(title: string, start: Date, end: Date, description: string) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const toUTC = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Optimile AMS//Auction Reminder//EN',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}`,
    `DTSTAMP:${toUTC(new Date())}`,
    `DTSTART:${toUTC(start)}`,
    `DTEND:${toUTC(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\n');
}

export function VendorPortal() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [now, setNow] = useState(Date.now());
  const [watchList, setWatchList] = useState<Set<string>>(new Set());
  const [tick, setTick] = useState(0);

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

  const updateWatch = (next: Set<string>) => {
    setWatchList(next);
    localStorage.setItem(WATCH_KEY, JSON.stringify(Array.from(next)));
  };

  const auctions = auctionEngine.getAllAuctions();

  const liveAuctions = useMemo(() => {
    return auctions
      .map((auction) => {
        const lanes = auctionEngine.getLanesByAuction(auction.id);
        const activeLanes = lanes.filter((lane) => lane.status === LaneStatus.RUNNING || lane.status === LaneStatus.PAUSED);
        if (activeLanes.length === 0) return null;

        const auctionBids = auctionEngine.getBidsByAuction(auction.id);
        const myBids = auctionBids.filter((bid) => bid.vendorId === VENDOR_ID);
        const myLaneIds = new Set(myBids.map((bid) => bid.auctionLaneId));
        const leadingLanes = activeLanes.filter((lane) => auctionEngine.getVendorRank(lane.id, VENDOR_ID) === 1).length;
        const endAt = activeLanes.reduce<number | undefined>((max, lane) => {
          if (!lane.endTime) return max;
          if (!max) return lane.endTime;
          return Math.max(max, lane.endTime);
        }, undefined);
        const startingValue = lanes.reduce((acc, lane) => acc + lane.basePrice, 0);
        const currentBest = lanes.reduce((acc, lane) => acc + (lane.currentLowestBid || lane.basePrice), 0);

        return {
          auction,
          lanes,
          activeLanes,
          myLaneIds,
          leadingLanes,
          endAt,
          startingValue,
          currentBest,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => (a.endAt || Number.MAX_SAFE_INTEGER) - (b.endAt || Number.MAX_SAFE_INTEGER));
  }, [auctions, tick]);

  const upcomingAuctions = useMemo(() => {
    const candidates = auctions.filter((auction) => auction.status === AuctionStatus.PUBLISHED);
    return candidates
      .map((auction, idx) => {
        const lanes = auctionEngine.getLanesByAuction(auction.id);
        const startAt = auction.createdAt + (idx + 1) * 60 * 60 * 1000;
        const estMin = lanes.reduce((sum, lane) => sum + lane.basePrice, 0);
        const estMax = Math.round(estMin * 1.18);
        return { auction, lanes, startAt, estMin, estMax };
      })
      .filter((row) => row.startAt > now && row.startAt < now + 7 * 24 * 60 * 60 * 1000)
      .sort((a, b) => a.startAt - b.startAt);
  }, [auctions, now]);

  const performance = useMemo(() => {
    const allBids = auctionEngine.getAllBids();
    const myBids = allBids.filter((bid) => bid.vendorId === VENDOR_ID);
    const myBidLaneIds = new Set(myBids.map((bid) => bid.auctionLaneId));

    const activeLaneIds = new Set(
      liveAuctions.flatMap((row) => row.activeLanes.map((lane) => lane.id))
    );

    const activeBids = Array.from(myBidLaneIds).filter((laneId) => activeLaneIds.has(laneId)).length;
    const leading = Array.from(myBidLaneIds).filter((laneId) => auctionEngine.getVendorRank(laneId, VENDOR_ID) === 1).length;

    const wonThisMonth = auctionEngine
      .getSnapshot()
      .auditLog.filter((event) => event.entityType === 'AWARD' && event.payload?.vendorId === VENDOR_ID)
      .length;

    const discounts = myBids.map((bid) => {
      const lane = auctionEngine.getLane(bid.auctionLaneId);
      if (!lane || !lane.basePrice) return 0;
      return ((lane.basePrice - bid.bidAmount) / lane.basePrice) * 100;
    });

    const avgDiscount = discounts.length > 0 ? discounts.reduce((a, b) => a + b, 0) / discounts.length : 0;
    const winRate = myBidLaneIds.size > 0 ? (leading / myBidLaneIds.size) * 100 : 0;
    const activeLeadingValue = liveAuctions.reduce((total, auctionRow) => {
      auctionRow.activeLanes.forEach((lane) => {
        if (auctionEngine.getVendorRank(lane.id, VENDOR_ID) === 1) {
          total += lane.currentLowestBid || lane.basePrice;
        }
      });
      return total;
    }, 0);

    return {
      activeBids,
      leading,
      wonThisMonth,
      winRate,
      avgDiscount,
      pendingAcceptances: 2,
      wonValue: activeLeadingValue,
    };
  }, [liveAuctions, tick]);

  const quickStats = {
    liveNow: liveAuctions.length,
    upcoming24h: upcomingAuctions.filter((row) => row.startAt < now + 24 * 60 * 60 * 1000).length,
    activeLanes: performance.activeBids,
    winning: performance.leading,
    watch: watchList.size,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Vendor Dashboard</h1>
          <p className="text-slate-500">Competitive live bidding workspace for {VENDOR_ID}.</p>
        </div>
        <div className="text-xs text-slate-500">Updated {new Date(now).toLocaleTimeString()}</div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <TopActionCard
          className="bg-red-600 text-white animate-pulse"
          title="LIVE NOW"
          value={`${quickStats.liveNow} auctions`}
          icon={<Flame size={16} />}
          onClick={() => window.scrollTo({ top: 300, behavior: 'smooth' })}
        />
        <TopActionCard title="Upcoming Auctions" value={`${quickStats.upcoming24h} in 24h`} icon={<Clock size={16} />} />
        <TopActionCard title="My Active Bids" value={`${quickStats.activeLanes} lanes`} icon={<Gavel size={16} />} />
        <TopActionCard title="Winning" value={`${quickStats.winning} lanes leading`} icon={<Trophy size={16} />} />
        <TopActionCard title="Watch List" value={`${quickStats.watch} saved`} icon={<Bookmark size={16} />} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Live Auctions</h2>
          <span className="text-sm text-slate-500">Priority display</span>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {liveAuctions.map((row) => {
            const remaining = row.endAt ? Math.max(0, row.endAt - now) : 0;
            const endingSoon = remaining < 5 * 60 * 1000;
            const potential = row.activeLanes.reduce((sum, lane) => {
              if (auctionEngine.getVendorRank(lane.id, VENDOR_ID) === 1) {
                return sum + (lane.currentLowestBid || lane.basePrice);
              }
              return sum;
            }, 0);
            const watched = watchList.has(row.auction.id);

            return (
              <div key={row.auction.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{row.auction.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{row.auction.id.slice(0, 8)}</p>
                    <span className="inline-flex mt-1 rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-semibold">{row.auction.auctionType}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${endingSoon ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700 animate-pulse'}`}>
                    {endingSoon ? 'ENDING SOON' : 'LIVE NOW'}
                  </div>
                </div>

                <div className={`text-3xl font-mono font-bold ${remaining < 60_000 ? 'text-red-600 animate-pulse' : remaining < 300_000 ? 'text-orange-600' : 'text-emerald-600'}`}>
                  {formatRemaining(remaining)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
                  <div>Lanes available: <strong>{row.lanes.length}</strong></div>
                  <div>Bidding on: <strong>{row.myLaneIds.size}</strong></div>
                  <div>Leading in: <strong>{row.leadingLanes}</strong></div>
                  <div>Potential win: <strong>{formatINR(potential)}</strong></div>
                  <div>Starting value: <strong>{formatINR(row.startingValue)}</strong></div>
                  <div>Current best total: <strong>{formatINR(row.currentBest)}</strong></div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/ams/vendor/auction/${row.auction.id}/bid`)}
                    className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                  >
                    Join Auction
                  </button>
                  <button
                    onClick={() => navigate(`/ams/auctions/live/${row.auction.id}`)}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      const next = new Set(watchList);
                      if (watched) next.delete(row.auction.id);
                      else next.add(row.auction.id);
                      updateWatch(next);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm ${watched ? 'bg-yellow-100 text-yellow-800' : 'border border-slate-300 text-slate-700'}`}
                  >
                    {watched ? 'Watching' : 'Add to Watch'}
                  </button>
                </div>
              </div>
            );
          })}

          {liveAuctions.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-500 text-center">
              No live auctions assigned currently.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Upcoming Auctions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {upcomingAuctions.slice(0, 6).map((row) => (
            <div key={row.auction.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-slate-900">{row.auction.name}</h3>
              <div className="text-xs text-slate-500">{row.auction.auctionType} • {new Date(row.startAt).toLocaleString()}</div>
              <div className="text-sm text-slate-700">Starts in: <strong>{formatRemaining(row.startAt - now)}</strong></div>
              <div className="text-sm text-slate-700">Lanes: <strong>{row.lanes.length}</strong></div>
              <div className="text-sm text-slate-700">Estimated range: <strong>{formatINR(row.estMin)} - {formatINR(row.estMax)}</strong></div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  className="px-2 py-1 text-xs rounded border border-slate-300"
                  onClick={() => showToast({ type: 'info', title: 'Reminder set', message: `${row.auction.name}` })}
                >
                  Set Reminder
                </button>
                <button
                  className="px-2 py-1 text-xs rounded border border-slate-300"
                  onClick={() => {
                    const content = buildICS(
                      `Auction: ${row.auction.name}`,
                      new Date(row.startAt),
                      new Date(row.startAt + 60 * 60 * 1000),
                      `Prepare bids for ${row.lanes.length} lanes.`
                    );
                    const blob = new Blob([content], { type: 'text/calendar' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${row.auction.name.replace(/\s+/g, '-').toLowerCase()}.ics`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                >
                  Add to Calendar
                </button>
                <button
                  className="px-2 py-1 text-xs rounded border border-slate-300"
                  onClick={() => navigate(`/ams/vendor/auction/${row.auction.id}/bid`)}
                >
                  Preview Lanes
                </button>
              </div>
            </div>
          ))}
          {upcomingAuctions.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500 text-center">
              No upcoming auctions in the next 7 days.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">My Performance Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <StatCard title="Active Bids" value={`${performance.activeBids} lanes`} icon={<Gavel size={16} />} />
          <StatCard title="Currently Leading" value={`${performance.leading} lanes (${performance.activeBids > 0 ? Math.round((performance.leading / performance.activeBids) * 100) : 0}%)`} icon={<Trophy size={16} />} />
          <StatCard title="Auctions Won (Month)" value={`${performance.wonThisMonth} (${formatINR(performance.wonValue)})`} icon={<HandCoins size={16} />} />
          <StatCard title="Win Rate" value={`${performance.winRate.toFixed(1)}%`} icon={<TrendingDown size={16} />} />
          <StatCard title="Average Discount" value={`${performance.avgDiscount.toFixed(1)}%`} icon={<Flame size={16} />} />
          <StatCard title="Pending Acceptances" value={`${performance.pendingAcceptances}`} icon={<Bell size={16} />} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <QuickAccessCard title="My Bid History" icon={<ListChecks size={16} />} onClick={() => showToast({ type: 'info', title: 'Opening Bid History' })} />
          <QuickAccessCard title="Won Contracts" icon={<FolderOpen size={16} />} onClick={() => navigate('/ams/contracts')} />
          <QuickAccessCard title="Pending Actions" icon={<Clock size={16} />} onClick={() => showToast({ type: 'warning', title: '2 actions pending' })} />
          <QuickAccessCard title="Queue Status" icon={<Bookmark size={16} />} onClick={() => navigate('/ams/vendor/queue-status')} />
          <QuickAccessCard title="Payment / EMD" icon={<Wallet size={16} />} onClick={() => showToast({ type: 'info', title: 'Payment dashboard opening' })} />
          <QuickAccessCard title="Profile & Documents" icon={<CalendarDays size={16} />} onClick={() => showToast({ type: 'info', title: 'Profile section opening' })} />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">Watch List</h2>
        {Array.from(watchList).length === 0 && <div className="text-sm text-slate-500">No watched auctions yet.</div>}
        <div className="space-y-2">
          {Array.from(watchList).map((auctionId) => {
            const auction = auctionEngine.getAuction(auctionId);
            if (!auction) return null;
            const lanes = auctionEngine.getLanesByAuction(auction.id);
            const lowest = lanes.reduce((min, lane) => Math.min(min, lane.currentLowestBid || lane.basePrice), Number.MAX_SAFE_INTEGER);
            return (
              <div key={auction.id} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{auction.name}</div>
                  <div className="text-xs text-slate-500">Lowest watched lane: {formatINR(lowest)}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 text-xs border rounded" onClick={() => navigate(`/ams/vendor/auction/${auction.id}/bid`)}>Join Bidding</button>
                  <button
                    className="px-2 py-1 text-xs border rounded"
                    onClick={() => {
                      const next = new Set(watchList);
                      next.delete(auction.id);
                      updateWatch(next);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function TopActionCard({
  title,
  value,
  icon,
  className,
  onClick,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-3 border border-transparent text-left ${className || 'bg-white border-slate-200 text-slate-900'}`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide opacity-80">{title}</div>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-lg font-bold">{value}</div>
        <div>{icon}</div>
      </div>
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <div className="text-xs text-slate-500 flex items-center gap-1">{icon} {title}</div>
      <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function QuickAccessCard({ title, icon, onClick }: { title: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="bg-white border border-slate-200 rounded-lg p-3 text-left hover:bg-slate-50">
      <div className="text-slate-600">{icon}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{title}</div>
    </button>
  );
}
