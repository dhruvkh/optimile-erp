import React, { useEffect, useState } from 'react';
import { auctionEngine } from '../../services/mockBackend';
import { IndentPlacementTracker, PlacementStatus } from '../../types';
import { Truck, Check, AlertCircle } from 'lucide-react';

export function VendorPlacement() {
    const [vendorId, setVendorId] = useState('VENDOR-DEMO'); // Simplified
    const [trackers, setTrackers] = useState<IndentPlacementTracker[]>([]);
    
    const refresh = () => {
        const all = auctionEngine.getTrackersByVendor(vendorId);
        // Sort pending first
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
                         <Truck className="text-slate-800" />
                         <span>Vendor Placement Portal</span>
                     </h1>
                     <p className="text-slate-500">Confirm vehicles for assigned indents.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm">Operating as:</span>
                    <input className="border p-1 rounded font-mono text-sm" value={vendorId} onChange={e=>setVendorId(e.target.value)} />
                </div>
            </div>

            <div className="space-y-4">
                {trackers.map(t => (
                    <VendorTaskCard key={t.id} tracker={t} onConfirm={() => confirm(t.id)} />
                ))}
                {trackers.length === 0 && <div className="text-center py-8 text-slate-400 bg-slate-50 rounded border border-dashed">No active assignments found for {vendorId}</div>}
            </div>
        </div>
    );
}

function VendorTaskCard({ tracker, onConfirm }: { tracker: IndentPlacementTracker, onConfirm: () => void }) {
    const lane = auctionEngine.getContractLane(tracker.contractLaneId);
    const isPending = tracker.placementStatus === PlacementStatus.PENDING;
    const isFailed = tracker.placementStatus === PlacementStatus.FAILED;

    return (
        <div className={`p-4 rounded border flex justify-between items-center ${isPending ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
            <div>
                 <div className="flex items-center space-x-2 mb-1">
                     <span className="font-bold text-lg">{lane?.laneName}</span>
                     <span className="text-xs font-mono text-slate-400">#{tracker.indentId.split('-')[0]}</span>
                 </div>
                 {isPending && (
                     <div className="text-sm text-blue-600 font-medium">
                         Action Required: Confirm Vehicle Placement
                     </div>
                 )}
                 {isFailed && <div className="text-sm text-red-600 font-bold flex items-center"><AlertCircle size={14} className="mr-1"/> SLA Breached - Contact Admin</div>}
                 {tracker.placementStatus === 'PLACED' && <div className="text-sm text-green-600 font-bold flex items-center"><Check size={14} className="mr-1"/> Vehicle Confirmed</div>}
            </div>

            {isPending && (
                <button 
                    onClick={onConfirm}
                    className="bg-accent text-white px-6 py-2 rounded font-bold hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all flex items-center space-x-2"
                >
                    <Truck size={18} /> <span>Confirm Vehicle</span>
                </button>
            )}
        </div>
    );
}
