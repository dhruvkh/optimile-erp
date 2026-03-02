import React, { useEffect, useState } from 'react';
import { auctionEngine } from '../../services/mockBackend';
import { IndentPlacementTracker, PlacementStatus } from '../../types';
import { Siren, CheckCircle, Clock } from 'lucide-react';

export function LiveSLAMonitor() {
    const [trackers, setTrackers] = useState<IndentPlacementTracker[]>([]);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const update = () => {
            setTrackers(auctionEngine.getAllTrackers());
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
                <Siren className="w-8 h-8 text-red-600" />
                <div>
                    <h1 className="text-2xl font-bold">Live SLA Monitor</h1>
                    <p className="text-slate-500">Real-time tracking of vendor placement compliance.</p>
                </div>
            </div>

            <div className="bg-white rounded border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                         <tr>
                             <th className="px-6 py-4">Indent ID</th>
                             <th className="px-6 py-4">Lane Name</th>
                             <th className="px-6 py-4">Vendor</th>
                             <th className="px-6 py-4">Countdown</th>
                             <th className="px-6 py-4">Status</th>
                         </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                         {trackers.map(t => (
                             <TrackerRow key={t.id} tracker={t} now={now} />
                         ))}
                         {trackers.length === 0 && (
                             <tr><td colSpan={5} className="text-center py-8 text-slate-400">No active SLAs tracked.</td></tr>
                         )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function TrackerRow({ tracker, now }: { tracker: IndentPlacementTracker, now: number }) {
    const lane = auctionEngine.getContractLane(tracker.contractLaneId);
    
    // Timer logic
    let displayTime = "--:--";
    let isUrgent = false;

    if(tracker.placementStatus === PlacementStatus.PENDING) {
        const diff = Math.max(0, tracker.slaEndTime - now);
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        displayTime = `${mins}:${String(secs).padStart(2,'0')}`;
        if(diff < 300000) isUrgent = true; // < 5 mins
    } else {
        const diff = (tracker.resolvedAt || now) - tracker.slaStartTime;
        const mins = Math.floor(diff / 60000);
        displayTime = `Took ${mins}m`;
    }

    const statusStyles = {
        [PlacementStatus.PENDING]: isUrgent ? 'bg-orange-100 text-orange-700 animate-pulse' : 'bg-blue-100 text-blue-700',
        [PlacementStatus.PLACED]: 'bg-green-100 text-green-700',
        [PlacementStatus.FAILED]: 'bg-red-100 text-red-700 font-bold',
    };

    return (
        <tr className="hover:bg-slate-50">
            <td className="px-6 py-4 font-mono text-xs">{tracker.indentId.split('-')[0]}</td>
            <td className="px-6 py-4 font-medium">{lane?.laneName}</td>
            <td className="px-6 py-4">{tracker.assignedVendorId}</td>
            <td className="px-6 py-4 font-mono text-lg">
                <span className={isUrgent && tracker.placementStatus === 'PENDING' ? 'text-red-600 font-bold' : ''}>
                    {displayTime}
                </span>
            </td>
            <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded text-xs uppercase ${statusStyles[tracker.placementStatus]}`}>
                    {tracker.placementStatus}
                </span>
            </td>
        </tr>
    );
}
