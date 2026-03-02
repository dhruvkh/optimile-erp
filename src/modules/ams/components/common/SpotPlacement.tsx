import React, { useEffect, useState } from 'react';
import { auctionEngine } from '../../services/mockBackend';
import { IndentPlacementTracker, PlacementStatus } from '../../types';
import { Truck, Check, Zap } from 'lucide-react';

export function SpotPlacement() {
    const [vendorId, setVendorId] = useState('SPOT-BIDDER-01');
    const [trackers, setTrackers] = useState<IndentPlacementTracker[]>([]);
    
    const refresh = () => {
        // Filter trackers where the indent was reassigned to this vendor (likely via Spot)
        // In a real app, we'd have a clearer flag, but here we can check if it's assigned to us
        const all = auctionEngine.getTrackersByVendor(vendorId);
        setTrackers(all.sort((a,b) => (a.placementStatus === 'PENDING' ? -1 : 1)));
    };

    useEffect(() => {
        refresh();
        const unsub = auctionEngine.subscribe(refresh);
        return unsub;
    }, [vendorId]);

    const confirm = (id: string) => {
        try {
            auctionEngine.confirmVehiclePlacement(id, vendorId);
        } catch(e) { alert((e as Error).message); }
    };

    return (
        <div className="max-w-4xl mx-auto">
             <div className="mb-6 flex justify-between items-end">
                <div>
                     <h1 className="text-2xl font-bold flex items-center space-x-2">
                         <Zap className="text-yellow-500" />
                         <span>Spot Award Placement</span>
                     </h1>
                     <p className="text-slate-500">Confirm vehicles for spot-won loads.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm">Operating as:</span>
                    <input className="border p-1 rounded font-mono text-sm" value={vendorId} onChange={e=>setVendorId(e.target.value)} />
                </div>
            </div>

            <div className="space-y-4">
                {trackers.map(t => (
                    <SpotTaskCard key={t.id} tracker={t} onConfirm={() => confirm(t.id)} />
                ))}
                 {trackers.length === 0 && <div className="text-center py-8 text-slate-400 bg-slate-50 rounded border border-dashed">No spot awards found for {vendorId}</div>}
            </div>
        </div>
    );
}

function SpotTaskCard({ tracker, onConfirm }: { tracker: IndentPlacementTracker, onConfirm: () => void }) {
    const lane = auctionEngine.getContractLane(tracker.contractLaneId);
    const indent = auctionEngine.getIndent(tracker.indentId);
    const isPending = tracker.placementStatus === PlacementStatus.PENDING;

    return (
        <div className={`p-4 rounded border flex justify-between items-center ${isPending ? 'bg-white border-yellow-400 shadow-md' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
             <div>
                 <div className="flex items-center space-x-2 mb-1">
                     <span className="font-bold text-lg">{lane?.laneName}</span>
                     <span className="text-xs font-mono text-slate-400">#{tracker.indentId.split('-')[0]}</span>
                     <span className="bg-yellow-100 text-yellow-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Spot Award</span>
                 </div>
                 <div className="mb-2 text-sm">
                     Winning Rate: <strong className="text-slate-900">₹{indent?.appliedRate}</strong>
                 </div>

                 {isPending && (
                     <div className="text-sm text-yellow-600 font-medium animate-pulse">
                         Action Required: Confirm Spot Vehicle
                     </div>
                 )}
                 {tracker.placementStatus === 'PLACED' && <div className="text-sm text-green-600 font-bold flex items-center"><Check size={14} className="mr-1"/> Spot Vehicle Confirmed</div>}
            </div>

             {isPending && (
                <button 
                    onClick={onConfirm}
                    className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center space-x-2"
                >
                    <Truck size={18} /> <span>Confirm Vehicle</span>
                </button>
            )}
        </div>
    );
}
