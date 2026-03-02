import React, { useEffect, useState } from 'react';
import { auctionEngine } from '../../services/mockBackend';
import { TransportContract, ContractStatus, ContractLane, ContractVendorAllocation } from '../../types';
import { Link, useParams } from 'react-router-dom';
import { FileText, ArrowRight, Clock, Box, GitCommit } from 'lucide-react';

export function ContractList() {
    const [contracts, setContracts] = useState<TransportContract[]>([]);

    useEffect(() => {
        setContracts(auctionEngine.getContracts());
        const unsub = auctionEngine.subscribe(() => setContracts(auctionEngine.getContracts()));
        return unsub;
    }, []);

    const statusColors = {
        [ContractStatus.DRAFT]: 'bg-yellow-100 text-yellow-800',
        [ContractStatus.ACTIVE]: 'bg-green-100 text-green-800',
        [ContractStatus.EXPIRED]: 'bg-slate-200 text-slate-600',
        [ContractStatus.TERMINATED]: 'bg-red-100 text-red-700',
        [ContractStatus.COMPLETED]: 'bg-blue-100 text-blue-700',
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-slate-800" />
                    <div>
                        <h1 className="text-2xl font-bold">Contracts</h1>
                        <p className="text-slate-500">Manage auction-derived transport agreements.</p>
                    </div>
                </div>
                <Link to="/ams/contracts/import" className="px-3 py-2 rounded border border-slate-300 text-slate-700 text-sm">
                    Import Contracts
                </Link>
            </div>

            <div className="bg-white rounded border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Contract ID</th>
                            <th className="px-6 py-4">Client</th>
                            <th className="px-6 py-4">Validity</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {contracts.map(c => (
                            <tr key={c.id}>
                                <td className="px-6 py-4 font-mono text-xs">{c.id}</td>
                                <td className="px-6 py-4 font-medium">{c.clientId}</td>
                                <td className="px-6 py-4 text-slate-500">{c.startDate} to {c.endDate}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${statusColors[c.status]}`}>
                                        {c.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link 
                                        to={c.status === ContractStatus.DRAFT ? `/ams/contracts/preview/${c.id}` : `/ams/contracts/${c.id}`}
                                        className="text-accent hover:underline font-medium"
                                    >
                                        {c.status === ContractStatus.DRAFT ? 'Edit Draft' : 'View Details'}
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {contracts.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No contracts found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function ContractDetail() {
    const { id } = useParams<{id: string}>();
    const [contract, setContract] = useState<TransportContract | undefined>();
    const [lanes, setLanes] = useState<ContractLane[]>([]);
    
    // Derived state for lineage
    const [auctionId, setAuctionId] = useState<string>('');
    const [rfqId, setRfqId] = useState<string>('');

    useEffect(() => {
        if(id) {
            const c = auctionEngine.getContract(id);
            setContract(c);
            setLanes(auctionEngine.getContractLanes(id));

            if (c) {
                setAuctionId(c.createdFromAuctionId);
                const auction = auctionEngine.getAuction(c.createdFromAuctionId);
                if (auction && auction.originRFQId) {
                    setRfqId(auction.originRFQId);
                }
            }
        }
    }, [id]);

    if(!contract) return <div>Loading...</div>;

    return (
        <div>
            {/* Header Area */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
                    <FileText className="text-primary" />
                    <span>Contract: <span className="font-mono text-lg font-normal text-slate-500">{contract.id}</span></span>
                </h1>
                <div className="mt-2 flex space-x-4 text-sm">
                     <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">{contract.status}</span>
                     <span className="text-slate-500">Validity: {contract.startDate} — {contract.endDate}</span>
                </div>
            </div>

            {/* Visual Data Lineage / Flow */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 mb-8 shadow-sm">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center">
                    <GitCommit size={16} className="mr-2"/> Contract Provenance & Data Flow
                </h2>
                <div className="flex items-center justify-between bg-slate-50 p-6 rounded-lg border border-slate-100">
                    {/* RFQ Node */}
                    <div className={`flex flex-col items-center p-4 rounded ${rfqId ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2 font-bold shadow-sm">RFQ</div>
                        <div className="text-sm font-bold text-slate-800">Request for Quote</div>
                        <div className="text-xs text-slate-500 font-mono mt-1">{rfqId ? rfqId.split('-')[0] : 'N/A'}</div>
                    </div>

                    <ArrowRight className="text-slate-300" size={24} />

                    {/* Auction Node */}
                    <div className="flex flex-col items-center p-4 rounded">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-2 font-bold shadow-sm">AUC</div>
                        <div className="text-sm font-bold text-slate-800">Reverse Auction</div>
                        <div className="text-xs text-slate-500 font-mono mt-1">{auctionId.split('-')[0]}</div>
                    </div>

                    <ArrowRight className="text-slate-300" size={24} />

                    {/* Contract Node */}
                    <div className="flex flex-col items-center p-4 rounded bg-white shadow-md border border-slate-200 ring-2 ring-green-500 ring-offset-2">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2 font-bold">CON</div>
                        <div className="text-sm font-bold text-slate-800">Active Contract</div>
                        <div className="text-xs text-slate-500 font-mono mt-1">{contract.id.split('-')[0]}</div>
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-4 italic text-center">
                    This visual confirms that the rates and allocations in this contract were derived mathematically from the Auction result, which originated from the initial RFQ requirements.
                </p>
            </div>

            <h2 className="text-lg font-bold mb-4">Contract Lanes & Terms</h2>
            <div className="space-y-4">
                {lanes.map(lane => (
                    <ContractLaneReadonly key={lane.id} lane={lane} />
                ))}
            </div>
        </div>
    );
}

function ContractLaneReadonly({lane}: {lane: ContractLane}) {
    const allocs = auctionEngine.getContractAllocations(lane.id);

    return (
        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                <div>
                     <h3 className="font-bold text-lg text-slate-800">{lane.laneName}</h3>
                     <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500">
                         {lane.tatDays && (
                             <span className="flex items-center bg-slate-100 px-2 py-0.5 rounded">
                                 <Clock size={14} className="mr-1"/> TAT: {lane.tatDays} Days
                             </span>
                         )}
                         <span>Effective: {lane.effectiveFrom}</span>
                     </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-slate-500">Contract Rate</div>
                    <div className="font-mono font-bold text-xl text-slate-900">₹{lane.baseRate.toLocaleString()}</div>
                </div>
            </div>
            
            <div className="bg-slate-50 rounded p-3 text-sm border border-slate-100">
                <table className="w-full">
                    <thead>
                        <tr className="text-slate-500 text-left">
                             <th className="pb-2 font-medium">Vendor</th>
                             <th className="pb-2 font-medium">Volume Allocation</th>
                             <th className="pb-2 font-medium">Pricing Basis</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allocs.map(a => (
                            <tr key={a.id}>
                                <td className="py-1 font-medium text-slate-700">{a.vendorId}</td>
                                <td className="py-1 font-bold text-blue-700">
                                    <div className="flex items-center">
                                        <div className="w-24 bg-slate-200 rounded-full h-1.5 mr-2">
                                            <div className="bg-blue-600 h-1.5 rounded-full" style={{width: `${a.allocationPercentage}%`}}></div>
                                        </div>
                                        {a.allocationPercentage}%
                                    </div>
                                </td>
                                <td className="py-1 text-slate-500 text-xs font-mono">{a.pricingBasis}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
