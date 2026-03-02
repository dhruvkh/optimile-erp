import React, { useState, useEffect } from 'react';
import { auctionEngine } from '../services/mockBackend';
import { useParams, useNavigate } from 'react-router-dom';
import { AuctionLane, LaneStatus } from '../types';
import { Gavel, Check, FileCheck } from 'lucide-react';

export function AwardScreen() {
    const { id } = useParams<{id: string}>(); // Auction ID
    const navigate = useNavigate();
    const [lanes, setLanes] = useState<AuctionLane[]>([]);
    // Simple heuristic to check if at least one lane is awarded to enable contract generation
    const [hasAwards, setHasAwards] = useState(false);

    const fetch = () => {
        if(id) {
            const l = auctionEngine.getLanesByAuction(id);
            setLanes(l);
            setHasAwards(l.some(lane => !!auctionEngine.getAward(lane.id)));
        }
    };

    useEffect(() => {
        fetch();
        const unsub = auctionEngine.subscribe(fetch);
        return unsub;
    }, [id]);

    const createContract = () => {
        if(id) {
            try {
                const contractId = auctionEngine.createContractDraftFromAuction(id, 'CLIENT-USER');
                navigate(`/ams/contracts/preview/${contractId}`);
            } catch(e) {
                alert((e as Error).message);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center space-x-2">
                    <Gavel className="text-slate-800" />
                    <span>Award Auction</span>
                </h1>
                {hasAwards && (
                    <button 
                        onClick={createContract}
                        className="bg-primary text-white px-4 py-2 rounded flex items-center space-x-2 hover:bg-slate-800 shadow-md"
                    >
                        <FileCheck size={18} />
                        <span>Generate Contract Draft</span>
                    </button>
                )}
            </div>
            
            <div className="space-y-6">
                {lanes.map(lane => (
                    <AwardLaneCard key={lane.id} lane={lane} />
                ))}
            </div>
        </div>
    );
}

function AwardLaneCard({ lane }: { lane: AuctionLane }) {
    const bids = auctionEngine.getBidsByLane(lane.id);
    const award = auctionEngine.getAward(lane.id);
    
    // Group unique best bids
    const uniqueBids = new Map<string, number>();
    bids.forEach(b => {
        const cur = uniqueBids.get(b.vendorId);
        if(!cur || b.bidAmount < cur) uniqueBids.set(b.vendorId, b.bidAmount);
    });
    const sortedVendors = Array.from(uniqueBids.entries()).sort((a,b) => a[1] - b[1]);

    const handleAward = (vendorId: string, price: number, rank: number) => {
        const reason = prompt("Enter reasoning (mandatory for L2/L3):", "Best Value");
        if(reason) {
            auctionEngine.awardLane(lane.id, vendorId, price, rank, reason, 'CLIENT-USER');
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{lane.laneName}</h3>
                <span className={`px-2 py-1 rounded text-xs font-bold ${award ? 'bg-green-100 text-green-700' : 'bg-slate-100'}`}>
                    {award ? 'AWARDED' : 'PENDING'}
                </span>
            </div>

            {award ? (
                <div className="bg-green-50 p-4 rounded border border-green-100 text-green-800">
                    <strong>Winner:</strong> {award.vendorId} @ ₹{award.price} (L{award.rank})
                    <div className="text-xs mt-1 text-green-600">Reason: {award.reason}</div>
                </div>
            ) : (
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="p-2">Rank</th>
                            <th className="p-2">Vendor</th>
                            <th className="p-2 text-right">Best Price</th>
                            <th className="p-2 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedVendors.map(([vid, price], idx) => (
                            <tr key={vid} className="border-b border-slate-50">
                                <td className="p-2 font-bold text-slate-400">L{idx+1}</td>
                                <td className="p-2">{vid}</td>
                                <td className="p-2 text-right font-mono">₹{price}</td>
                                <td className="p-2 text-right">
                                    <button onClick={() => handleAward(vid, price, idx+1)} className="text-accent hover:underline font-medium">Award</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
