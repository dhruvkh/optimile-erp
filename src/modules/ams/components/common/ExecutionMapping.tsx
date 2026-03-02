import React, { useEffect, useState } from 'react';
import { auctionEngine } from '../../services/mockBackend';
import { TransportContract, ContractLane, ContractStatus } from '../../types';
import { Link } from 'react-router-dom';
import { Network, ArrowRight } from 'lucide-react';

export function ExecutionMapping() {
    const [contracts, setContracts] = useState<TransportContract[]>([]);

    useEffect(() => {
        // Only show active contracts for execution mapping
        const all = auctionEngine.getContracts();
        setContracts(all.filter(c => c.status === ContractStatus.ACTIVE));
    }, []);

    return (
        <div>
            <div className="mb-6 flex items-center space-x-3">
                <Network className="w-8 h-8 text-slate-800" />
                <div>
                    <h1 className="text-2xl font-bold">Execution Mapping</h1>
                    <p className="text-slate-500">Live view of Active Contracts bound to TMS execution.</p>
                </div>
            </div>

            {contracts.length === 0 ? (
                <div className="bg-slate-50 p-8 rounded text-center text-slate-400 border border-dashed border-slate-300">
                    No active contracts found. Activate a contract to see execution mapping.
                </div>
            ) : (
                <div className="space-y-8">
                    {contracts.map(c => (
                        <ContractExecutionCard key={c.id} contract={c} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ContractExecutionCard({ contract }: { contract: TransportContract }) {
    const [lanes, setLanes] = useState<ContractLane[]>([]);

    useEffect(() => {
        setLanes(auctionEngine.getContractLanes(contract.id));
    }, [contract.id]);

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                 <div>
                     <h3 className="font-bold text-slate-800">Contract: {contract.id}</h3>
                     <div className="text-xs text-slate-500">Valid: {contract.startDate} to {contract.endDate}</div>
                 </div>
                 <div className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold uppercase">
                     Sync Active
                 </div>
            </div>
            
            <table className="w-full text-sm text-left">
                <thead className="bg-white text-slate-500 border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-3">Lane Name</th>
                        <th className="px-6 py-3">Base Rate</th>
                        <th className="px-6 py-3">Active Allocations</th>
                        <th className="px-6 py-3 text-right">Total Indents</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {lanes.map(lane => (
                        <LaneRow key={lane.id} lane={lane} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function LaneRow({ lane }: { lane: ContractLane }) {
    const allocs = auctionEngine.getContractAllocations(lane.id);
    const indents = auctionEngine.getIndents(lane.id);

    return (
        <tr className="hover:bg-slate-50">
            <td className="px-6 py-4 font-medium">{lane.laneName}</td>
            <td className="px-6 py-4 font-mono">₹{lane.baseRate}</td>
            <td className="px-6 py-4">
                <div className="flex space-x-2">
                    {allocs.map(a => (
                        <div key={a.id} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-100" title={a.vendorId}>
                            <span className="font-bold">{a.allocationPercentage}%</span> {a.vendorId.slice(0,6)}..
                        </div>
                    ))}
                </div>
            </td>
            <td className="px-6 py-4 text-right">
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded font-mono font-bold">{indents.length}</span>
            </td>
        </tr>
    );
}
