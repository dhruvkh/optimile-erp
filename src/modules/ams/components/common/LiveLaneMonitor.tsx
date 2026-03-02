import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auctionEngine } from '../../services/mockBackend';
import { AuctionLane, Bid, LaneStatus } from '../../types';
import { Clock, StopCircle, ArrowLeft, History, AlertTriangle } from 'lucide-react';

export function LiveLaneMonitor() {
  const { laneId } = useParams<{ laneId: string }>();
  const navigate = useNavigate();
  const [lane, setLane] = useState<AuctionLane | undefined>();
  const [bids, setBids] = useState<Bid[]>([]);
  const [now, setNow] = useState(Date.now());
  const [hasExtended, setHasExtended] = useState(false);

  const fetch = () => {
    if (!laneId) return;
    const l = auctionEngine.getLane(laneId);
    setLane(l);
    setBids(auctionEngine.getBidsByLane(laneId) || []);
    
    // Check extension logic (simple heuristic: if end time > start + duration)
    if (l && l.startTime && l.endTime) {
         const expectedEnd = l.startTime + (l.timerDurationSeconds * 1000);
         if (l.endTime > expectedEnd + 1000) { // 1s buffer
             setHasExtended(true);
         }
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

  if (!lane) return <div className="p-8">Loading Monitor...</div>;

  const timeLeft = lane.endTime ? Math.max(0, Math.floor((lane.endTime - now) / 1000)) : 0;
  
  const handleClose = () => {
      if (confirm('Are you sure you want to FORCE CLOSE this lane? This cannot be undone.')) {
          auctionEngine.forceCloseLane(lane.id, 'ADMIN-OVERRIDE');
      }
  };

  return (
    <div>
        <div className="mb-6">
            <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-800 mb-2 transition-colors">
                <ArrowLeft size={16} className="mr-1" /> Back to Auction
            </button>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
                <span>Live Monitor:</span>
                <span className="text-primary font-mono">{lane.laneName}</span>
            </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Timer Card */}
            <div className={`p-6 rounded-lg border flex flex-col items-center justify-center text-center ${timeLeft < 30 && lane.status === 'RUNNING' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                <div className="text-slate-500 font-medium mb-1 flex items-center space-x-2">
                    <Clock size={16} /> <span>Time Remaining</span>
                </div>
                <div className={`text-5xl font-mono font-bold ${timeLeft < 30 && lane.status === 'RUNNING' ? 'text-red-600' : 'text-slate-800'}`}>
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2,'0')}
                </div>
                {hasExtended && (
                    <div className="mt-2 text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded flex items-center">
                        <History size={12} className="mr-1" /> Extension Triggered
                    </div>
                )}
            </div>

            {/* Status Card */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 flex flex-col justify-between">
                <div>
                     <div className="text-slate-500 font-medium mb-1">Status</div>
                     <div className="text-2xl font-bold text-slate-800">{lane.status}</div>
                </div>
                {lane.status === 'RUNNING' && (
                    <button onClick={handleClose} className="mt-4 w-full bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded flex items-center justify-center space-x-2 transition-colors">
                        <StopCircle size={18} /> <span>Force Close Lane</span>
                    </button>
                )}
            </div>

            {/* Best Bid Card */}
            <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="text-slate-500 font-medium mb-1">Current Lowest Bid</div>
                <div className="text-3xl font-bold text-green-600">
                    {lane.currentLowestBid ? `₹${lane.currentLowestBid.toLocaleString()}` : '--'}
                </div>
                <div className="text-sm text-slate-400 mt-2">
                    Base: ₹{lane.basePrice.toLocaleString()}
                </div>
            </div>
        </div>

        {/* Bid Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-700">Live Bid Feed</h3>
            </div>
            <table className="w-full text-sm text-left">
                <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-3">Time</th>
                        <th className="px-6 py-3">Vendor ID</th>
                        <th className="px-6 py-3 text-right">Amount (INR)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {bids.map((bid, idx) => (
                        <tr key={bid.id} className={idx === 0 ? "bg-green-50/50" : ""}>
                            <td className="px-6 py-3 font-mono text-slate-500">
                                {new Date(bid.bidTimestamp).toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-3 text-slate-700">
                                {bid.vendorId}
                                {idx === 0 && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">LEADER</span>}
                            </td>
                            <td className="px-6 py-3 text-right font-bold text-slate-900 font-mono">
                                ₹{bid.bidAmount.toLocaleString()}
                            </td>
                        </tr>
                    ))}
                    {bids.length === 0 && (
                        <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">
                                Waiting for bids...
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
}