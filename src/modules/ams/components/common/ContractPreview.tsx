import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auctionEngine } from '../../services/mockBackend';
import { TransportContract, ContractLane, ContractVendorAllocation } from '../../types';
import { Save, CheckCircle, Plus, Trash2, ArrowLeft } from 'lucide-react';

export function ContractPreview() {
    const { id, contractId } = useParams<{id?: string; contractId?: string}>();
    const resolvedId = id || contractId;
    const navigate = useNavigate();
    const [contract, setContract] = useState<TransportContract | undefined>();
    const [lanes, setLanes] = useState<ContractLane[]>([]);
    
    const fetch = () => {
        if(resolvedId) {
            setContract(auctionEngine.getContract(resolvedId));
            setLanes(auctionEngine.getContractLanes(resolvedId));
        }
    };

    useEffect(() => {
        fetch();
        // Subscribe not strictly necessary for draft mode unless multiplayer, but good practice
        const unsub = auctionEngine.subscribe(fetch);
        return unsub;
    }, [resolvedId]);

    const activate = () => {
        if(resolvedId && confirm("Are you sure? This will lock the contract and allocations.")) {
            try {
                auctionEngine.activateContract(resolvedId, 'CLIENT-USER');
                navigate('/ams/contracts'); // Go to list
            } catch(e) {
                alert((e as Error).message);
            }
        }
    };

    if(!contract) return <div>Loading...</div>;

    return (
        <div>
            <div className="mb-6 flex justify-between items-start">
                <div>
                     <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-800 text-sm flex items-center mb-2">
                         <ArrowLeft size={14} className="mr-1" /> Back
                     </button>
                     <h1 className="text-2xl font-bold">Contract Draft Preview</h1>
                     <p className="text-slate-500">Configure allocations before activation.</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={activate} className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 shadow-lg flex items-center space-x-2">
                         <CheckCircle size={20} /> <span>Activate Contract</span>
                    </button>
                </div>
            </div>

            {/* Metadata Card */}
            <div className="bg-white p-6 rounded border border-slate-200 mb-8 shadow-sm">
                <div className="grid grid-cols-3 gap-6 text-sm">
                    <div>
                        <label className="block text-slate-500 mb-1">Source Auction</label>
                        <div className="font-mono">{contract.createdFromAuctionId}</div>
                    </div>
                    <div>
                        <label className="block text-slate-500 mb-1">Contract Period</label>
                        <div className="font-medium">{contract.startDate} — {contract.endDate}</div>
                    </div>
                     <div>
                        <label className="block text-slate-500 mb-1">Status</label>
                        <div className="font-bold text-yellow-600 uppercase">{contract.status}</div>
                    </div>
                </div>
            </div>

            <h2 className="text-lg font-bold mb-4">Lane Allocations</h2>
            <div className="space-y-6">
                {lanes.map(lane => (
                    <LaneAllocationEditor key={lane.id} lane={lane} />
                ))}
            </div>
        </div>
    );
}

function LaneAllocationEditor({ lane }: { lane: ContractLane }) {
    const [allocs, setAllocs] = useState<ContractVendorAllocation[]>([]);
    // Fetch unique vendors from auction lane bids to suggest for splitting
    const [candidates, setCandidates] = useState<string[]>([]);

    useEffect(() => {
        setAllocs(auctionEngine.getContractAllocations(lane.id));
        // Get candidates (vendors who bid on the original lane)
        const bids = auctionEngine.getBidsByLane(lane.laneId); // Note: lane.laneId maps to auctionLaneId
        const uniqueVendors = Array.from(new Set(bids.map(b => b.vendorId)));
        setCandidates(uniqueVendors);
    }, [lane.id]);

    const updatePercent = (vendorId: string, val: number) => {
        const newAllocs = allocs.map(a => a.vendorId === vendorId ? {...a, allocationPercentage: val} : a);
        setAllocs(newAllocs);
    };

    const addVendor = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const vid = e.target.value;
        if(vid && !allocs.find(a => a.vendorId === vid)) {
            // Add with 0 percent initially
            setAllocs([...allocs, {
                id: 'temp', 
                contractLaneId: lane.id, 
                vendorId: vid, 
                allocationPercentage: 0, 
                pricingBasis: 'L1_RATE' // Import enum in real code, string for simplicity here
            } as any]);
        }
        e.target.value = '';
    };

    const removeVendor = (vid: string) => {
        setAllocs(allocs.filter(a => a.vendorId !== vid));
    };

    const save = () => {
        try {
            auctionEngine.updateLaneAllocations(lane.id, allocs.map(a => ({vendorId: a.vendorId, percent: a.allocationPercentage})), 'CLIENT-USER');
            alert('Saved');
        } catch(e) {
            alert((e as Error).message);
        }
    };

    const total = allocs.reduce((sum, a) => sum + a.allocationPercentage, 0);

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg">{lane.laneName}</h3>
                    <div className="text-sm text-slate-500">L1 Base Rate: ₹{lane.baseRate}</div>
                </div>
                <div className={`px-3 py-1 rounded text-sm font-bold ${total === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    Total: {total}%
                </div>
            </div>

            <div className="space-y-2 mb-4">
                {allocs.map(a => (
                    <div key={a.vendorId} className="flex items-center space-x-4 bg-slate-50 p-2 rounded">
                        <div className="w-1/3 font-medium text-sm">{a.vendorId}</div>
                        <div className="flex-1 flex items-center space-x-2">
                             <input 
                                type="range" min="0" max="100" 
                                value={a.allocationPercentage} 
                                onChange={e => updatePercent(a.vendorId, Number(e.target.value))}
                                className="flex-1"
                             />
                             <input 
                                type="number" min="0" max="100" 
                                value={a.allocationPercentage} 
                                onChange={e => updatePercent(a.vendorId, Number(e.target.value))}
                                className="w-16 border p-1 text-center rounded text-sm font-bold"
                             />
                             <span className="text-sm text-slate-500">%</span>
                        </div>
                        <div className="w-24 text-xs text-slate-400">Matches L1</div>
                        <button onClick={() => removeVendor(a.vendorId)} className="text-slate-400 hover:text-red-500">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                 <select onChange={addVendor} className="border p-2 rounded text-sm bg-white">
                     <option value="">+ Add Vendor Split</option>
                     {candidates.filter(c => !allocs.find(a => a.vendorId === c)).map(c => (
                         <option key={c} value={c}>{c}</option>
                     ))}
                 </select>
                 <button 
                    onClick={save} 
                    disabled={total !== 100}
                    className="flex items-center space-x-1 text-primary hover:underline disabled:text-slate-300 disabled:no-underline font-medium"
                 >
                     <Save size={16} /> <span>Save Allocations</span>
                 </button>
            </div>
        </div>
    );
}
