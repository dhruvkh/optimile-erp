import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { auctionEngine } from '../../services/mockBackend';
import { AuctionLane, Bid, LaneStatus } from '../../types';
import { Clock, TrendingDown, Trophy } from 'lucide-react';

export function VendorConsole() {
  const { laneId } = useParams<{ laneId: string }>();
  const [lane, setLane] = useState<AuctionLane | undefined>();
  const [bids, setBids] = useState<Bid[]>([]);
  const [vendorId] = useState(`VENDOR-DEMO`); 
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [rank, setRank] = useState<number | null>(null);

  const fetch = () => {
    if (!laneId) return;
    const l = auctionEngine.getLane(laneId);
    setLane(l);
    setBids(auctionEngine.getBidsByLane(laneId) || []);
    
    // Rank
    const r = auctionEngine.getVendorRank(laneId, vendorId);
    setRank(r);

    // Set default bid amount suggestion if first load
    if (l && bidAmount === 0) {
        const best = l.currentLowestBid || l.basePrice;
        setBidAmount(best - l.minBidDecrement);
    }
  };

  useEffect(() => {
    fetch();
    const unsub = auctionEngine.subscribe(fetch);
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => {
        unsub();
        clearInterval(interval);
    };
  }, [laneId]);

  if (!lane) return <div className="p-8">Loading Lane...</div>;

  const timeLeft = lane.endTime ? Math.max(0, Math.floor((lane.endTime - now) / 1000)) : 0;
  const currentBest = lane.currentLowestBid || lane.basePrice;
  const nextMaxBid = currentBest - lane.minBidDecrement;

  const placeBid = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
        auctionEngine.placeBid(lane.id, vendorId, bidAmount);
        setBidAmount(bidAmount - lane.minBidDecrement);
    } catch(err) {
        setError((err as Error).message);
    }
  };

  const isClosed = lane.status === LaneStatus.CLOSED || lane.status === LaneStatus.AWARDED;

  // Check ruleset for rank visibility
  const auction = auctionEngine.getAuction(lane.auctionId);
  const ruleset = auction ? auctionEngine.getRuleset(auction.rulesetId) : null;
  const showRank = ruleset?.allowRankVisibility && rank !== null;

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen border-x border-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6">
            <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Vendor Console</div>
            <h1 className="text-xl font-bold">{lane.laneName}</h1>
            <div className="flex justify-between mt-4">
                 <div className="bg-slate-800 px-3 py-1 rounded text-sm text-slate-300">
                     ID: {vendorId}
                 </div>
                 {showRank && (
                     <div className={`flex items-center space-x-1 px-3 py-1 rounded font-bold ${rank === 1 ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 text-white'}`}>
                        <Trophy size={14} /> <span>L{rank}</span>
                     </div>
                 )}
            </div>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center space-x-2 text-slate-700">
                <Clock size={18} />
                <span className={`font-mono text-xl font-bold ${timeLeft < 60 && !isClosed ? 'text-red-600' : ''}`}>
                    {isClosed ? '0:00' : `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2,'0')}`}
                </span>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-bold ${lane.status === 'RUNNING' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
                {lane.status}
            </span>
        </div>

        {/* Current State */}
        <div className="p-6 space-y-6 flex-1">
            <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-600 mb-1 uppercase tracking-wide font-semibold">Current Lowest Bid</p>
                <div className="text-4xl font-bold text-slate-900">
                    ₹{currentBest.toLocaleString()}
                </div>
            </div>
            
            {!isClosed && (
                <form onSubmit={placeBid} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Place Your Bid (INR)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400">₹</span>
                            <input 
                                type="number" 
                                className="w-full pl-8 pr-4 py-3 text-lg border border-slate-300 rounded focus:ring-2 focus:ring-accent outline-none font-mono"
                                value={bidAmount}
                                onChange={e => setBidAmount(Number(e.target.value))}
                                max={nextMaxBid}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Must be ₹{nextMaxBid.toLocaleString()} or lower.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={lane.status !== 'RUNNING'}
                        className="w-full bg-accent hover:bg-blue-600 disabled:bg-slate-300 text-white py-4 rounded-lg font-bold text-lg shadow-lg shadow-accent/20 transition-all flex items-center justify-center space-x-2"
                    >
                        <span>Confirm Bid</span>
                        <TrendingDown size={20} />
                    </button>
                </form>
            )}

            {isClosed && (
                <div className="text-center text-slate-500 py-8">
                    Auction Closed. Wait for awarding.
                </div>
            )}
        </div>

        {/* Bid History */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 max-h-64 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Recent Bids</h3>
            <div className="space-y-2">
                {bids.slice(0, 10).map((bid) => (
                    <div key={bid.id} className={`flex justify-between items-center text-sm p-2 rounded ${bid.vendorId === vendorId ? 'bg-blue-100 border border-blue-200' : 'bg-white border border-slate-100'}`}>
                        <span className="text-slate-600 font-mono text-xs">{bid.vendorId === vendorId ? 'YOU' : 'COMPETITOR'}</span>
                        <span className="font-bold text-slate-800">₹{bid.bidAmount.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
