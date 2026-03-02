import React, { useEffect, useState } from 'react';
import { auctionEngine } from '../../services/mockBackend';
import { SpotAuction, SpotAuctionStatus } from '../../types';
import { Zap, TrendingDown, Clock } from 'lucide-react';

export function SpotVendorConsole() {
    const [vendorId, setVendorId] = useState('SPOT-BIDDER-01');
    const [spots, setSpots] = useState<SpotAuction[]>([]);
    const [now, setNow] = useState(Date.now());

    const refresh = () => {
        const all = auctionEngine.getSpotAuctions();
        // Show running first
        setSpots(all.sort((a,b) => (a.status === 'RUNNING' ? -1 : 1)));
        setNow(Date.now());
    };

    useEffect(() => {
        refresh();
        const unsub = auctionEngine.subscribe(refresh);
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => {
            unsub();
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-end mb-6">
                 <div>
                    <h1 className="text-2xl font-bold flex items-center space-x-2">
                        <Zap className="text-slate-800" />
                        <span>Vendor Spot Console</span>
                    </h1>
                    <p className="text-slate-500">Bid on urgent SLA-failed loads.</p>
                 </div>
                 <div className="flex items-center space-x-2">
                    <span className="text-sm">Operating as:</span>
                    <input className="border p-1 rounded font-mono text-sm" value={vendorId} onChange={e=>setVendorId(e.target.value)} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {spots.map(s => (
                    <SpotCard key={s.id} spot={s} vendorId={vendorId} now={now} />
                ))}
                 {spots.length === 0 && <div className="col-span-full text-center py-12 text-slate-400 bg-slate-50 rounded border border-dashed">No spot opportunities active.</div>}
            </div>
        </div>
    );
}

function SpotCard({ spot, vendorId, now }: { spot: SpotAuction, vendorId: string, now: number }) {
    const bids = auctionEngine.getSpotBids(spot.id);
    const bestBid = bids.length > 0 ? bids[0].bidAmount : 100000; // Mock starting high if no bids
    const indent = auctionEngine.getIndent(spot.indentId);
    const lane = indent ? auctionEngine.getContractLane(indent.contractLaneId) : null;
    
    const [myBid, setMyBid] = useState<number>(0);

    // Initialize bid input slightly lower than best
    useEffect(() => {
        if(myBid === 0) setMyBid(bestBid - 100);
    }, [bestBid]);

    const endTime = spot.startedAt + (spot.durationSeconds * 1000);
    const timeLeft = Math.max(0, endTime - now);
    const mins = Math.floor(timeLeft / 60000);
    const secs = Math.floor((timeLeft % 60000) / 1000);
    const isRunning = spot.status === SpotAuctionStatus.RUNNING;

    const placeBid = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            auctionEngine.placeSpotBid(spot.id, vendorId, myBid);
        } catch(e) { alert((e as Error).message); }
    };

    return (
        <div className={`border rounded-lg p-5 flex flex-col justify-between ${isRunning ? 'bg-white border-yellow-300 shadow-md' : 'bg-slate-50 border-slate-200 opacity-80'}`}>
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="font-bold text-lg">{lane?.laneName || 'Unknown Lane'}</div>
                        <div className="text-xs text-slate-500 font-mono">#{spot.indentId.split('-')[0]}</div>
                    </div>
                    {isRunning ? (
                         <div className="flex items-center space-x-1 text-red-600 font-mono font-bold bg-red-50 px-2 py-1 rounded">
                             <Clock size={14} /> <span>{mins}:{String(secs).padStart(2,'0')}</span>
                         </div>
                    ) : (
                        <span className="text-xs font-bold uppercase bg-slate-200 text-slate-600 px-2 py-1 rounded">Closed</span>
                    )}
                </div>

                <div className="bg-slate-50 p-3 rounded mb-4 text-center">
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Lowest Bid</div>
                    <div className="text-2xl font-bold text-slate-900">₹{bids.length > 0 ? bestBid.toLocaleString() : '--'}</div>
                </div>

                {isRunning && (
                    <form onSubmit={placeBid}>
                        <div className="flex space-x-2">
                             <input 
                                type="number" 
                                className="flex-1 border border-slate-300 rounded px-2 py-2 font-mono"
                                value={myBid}
                                onChange={e=>setMyBid(Number(e.target.value))}
                             />
                             <button className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded shadow-sm">
                                 <TrendingDown size={20} />
                             </button>
                        </div>
                    </form>
                )}
                
                {!isRunning && spot.winningVendorId && (
                     <div className="text-center text-sm font-bold text-green-600 mt-2">
                         Won by {spot.winningVendorId}
                     </div>
                )}
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
                 <span>Bids: {bids.length}</span>
                 <span>ID: {spot.id.split('-')[0]}</span>
            </div>
        </div>
    );
}
