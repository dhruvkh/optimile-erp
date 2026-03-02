import React, { useEffect, useState } from 'react';
import { auctionEngine } from '../../services/mockBackend';
import { SpotAuction, SpotAuctionStatus } from '../../types';
import { Zap, Activity } from 'lucide-react';

export function SpotMonitor() {
    const [spots, setSpots] = useState<SpotAuction[]>([]);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const update = () => {
            setSpots(auctionEngine.getSpotAuctions());
            setNow(Date.now());
        };
        update();
        const unsub = auctionEngine.subscribe(update);
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => {
            unsub();
            clearInterval(interval);
        };
    }, []);

    return (
        <div>
            <div className="mb-6 flex items-center space-x-3">
                <Zap className="w-8 h-8 text-yellow-500" />
                <div>
                    <h1 className="text-2xl font-bold">Spot Auction Monitor</h1>
                    <p className="text-slate-500">Live recovery of SLA failures via real-time bidding.</p>
                </div>
            </div>

            <div className="bg-white rounded border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                         <tr>
                             <th className="px-6 py-4">Indent Ref</th>
                             <th className="px-6 py-4">Start Time</th>
                             <th className="px-6 py-4">Status</th>
                             <th className="px-6 py-4">Current Best</th>
                             <th className="px-6 py-4 text-right">Timer</th>
                         </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                         {spots.map(s => (
                             <SpotRow key={s.id} spot={s} now={now} />
                         ))}
                         {spots.length === 0 && (
                             <tr><td colSpan={5} className="text-center py-8 text-slate-400">No active spot auctions.</td></tr>
                         )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SpotRow({ spot, now }: { spot: SpotAuction, now: number }) {
    const bids = auctionEngine.getSpotBids(spot.id);
    const bestBid = bids.length > 0 ? bids[0].bidAmount : null;
    
    const endTime = spot.startedAt + (spot.durationSeconds * 1000);
    const timeLeft = Math.max(0, endTime - now);
    const mins = Math.floor(timeLeft / 60000);
    const secs = Math.floor((timeLeft % 60000) / 1000);

    const isRunning = spot.status === SpotAuctionStatus.RUNNING;

    return (
        <tr className="hover:bg-slate-50">
            <td className="px-6 py-4">
                <div className="font-mono font-bold text-slate-700">{spot.indentId.split('-')[0]}</div>
                <div className="text-xs text-slate-400">{spot.id.split('-')[0]}</div>
            </td>
            <td className="px-6 py-4 text-slate-600">
                {new Date(spot.startedAt).toLocaleTimeString()}
            </td>
            <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${isRunning ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-slate-200 text-slate-600'}`}>
                    {spot.status}
                </span>
            </td>
            <td className="px-6 py-4 font-mono font-bold">
                {bestBid ? `₹${bestBid.toLocaleString()}` : <span className="text-slate-400">--</span>}
                {bestBid && !isRunning && spot.winningVendorId && (
                     <div className="text-xs font-normal text-green-600 mt-1">Won by {spot.winningVendorId}</div>
                )}
            </td>
            <td className="px-6 py-4 text-right font-mono text-lg">
                {isRunning ? (
                    <span className={timeLeft < 60000 ? 'text-red-600 font-bold' : ''}>
                        {mins}:{String(secs).padStart(2,'0')}
                    </span>
                ) : (
                    <span className="text-slate-400 text-xs">Closed</span>
                )}
            </td>
        </tr>
    );
}
