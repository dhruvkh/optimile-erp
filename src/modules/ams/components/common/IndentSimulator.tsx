import React, { useEffect, useState } from 'react';
import { auctionEngine } from '../../services/mockBackend';
import { TransportContract, ContractLane, ContractStatus, Indent } from '../../types';
import { PlayCircle, Database, Truck, RefreshCw } from 'lucide-react';

export function IndentSimulator() {
    const [contracts, setContracts] = useState<TransportContract[]>([]);
    const [selectedContractId, setSelectedContractId] = useState('');
    const [lanes, setLanes] = useState<ContractLane[]>([]);
    const [selectedLaneId, setSelectedLaneId] = useState('');
    
    // Simulation Data
    const [simulatedIndents, setSimulatedIndents] = useState<Indent[]>([]);
    const [vendorCounts, setVendorCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        const active = auctionEngine.getContracts().filter(c => c.status === ContractStatus.ACTIVE);
        setContracts(active);
    }, []);

    useEffect(() => {
        if(selectedContractId) {
            setLanes(auctionEngine.getContractLanes(selectedContractId));
        } else {
            setLanes([]);
        }
    }, [selectedContractId]);

    useEffect(() => {
        if(selectedLaneId) {
            refreshStats();
            const unsub = auctionEngine.subscribe(refreshStats);
            return unsub;
        }
    }, [selectedLaneId]);

    const refreshStats = () => {
        if(!selectedLaneId) return;
        const all = auctionEngine.getIndents(selectedLaneId);
        setSimulatedIndents(all.slice(0, 20)); // Show last 20
        
        // Calc distribution
        const counts: Record<string, number> = {};
        all.forEach(i => {
            counts[i.selectedVendorId] = (counts[i.selectedVendorId] || 0) + 1;
        });
        setVendorCounts(counts);
    };

    const generateIndent = () => {
        if(!selectedLaneId) return;
        try {
            auctionEngine.createIndent(selectedLaneId, 'SIMULATOR-BOT');
        } catch(e) {
            alert((e as Error).message);
        }
    };

    const allocs = selectedLaneId ? auctionEngine.getContractAllocations(selectedLaneId) : [];
    const totalIndents = Object.values(vendorCounts).reduce((a,b) => a+b, 0);

    return (
        <div className="max-w-5xl mx-auto">
             <div className="mb-6 flex items-center space-x-3">
                <Truck className="w-8 h-8 text-slate-800" />
                <div>
                    <h1 className="text-2xl font-bold">TMS Indent Simulator</h1>
                    <p className="text-slate-500">Simulate indent creation to test allocation logic.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="bg-white p-6 rounded border border-slate-200 h-fit">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center"><Database size={16} className="mr-2"/> Configuration</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Active Contract</label>
                            <select 
                                className="w-full border p-2 rounded bg-slate-50"
                                value={selectedContractId}
                                onChange={e => setSelectedContractId(e.target.value)}
                            >
                                <option value="">-- Select Contract --</option>
                                {contracts.map(c => <option key={c.id} value={c.id}>{c.id} ({c.clientId})</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Lane</label>
                            <select 
                                className="w-full border p-2 rounded bg-slate-50"
                                value={selectedLaneId}
                                onChange={e => setSelectedLaneId(e.target.value)}
                                disabled={!selectedContractId}
                            >
                                <option value="">-- Select Lane --</option>
                                {lanes.map(l => <option key={l.id} value={l.id}>{l.laneName} (₹{l.baseRate})</option>)}
                            </select>
                        </div>

                        <button 
                            onClick={generateIndent}
                            disabled={!selectedLaneId}
                            className="w-full bg-primary text-white py-3 rounded font-bold hover:bg-slate-800 disabled:bg-slate-300 transition-colors flex justify-center items-center space-x-2"
                        >
                            <PlayCircle size={20} /> <span>Create Indent</span>
                        </button>
                    </div>

                    {selectedLaneId && (
                         <div className="mt-6 pt-6 border-t border-slate-100">
                             <h4 className="font-bold text-sm mb-2 text-slate-500">Target Allocation</h4>
                             <div className="space-y-2">
                                 {allocs.map(a => (
                                     <div key={a.id} className="flex justify-between text-sm">
                                         <span>{a.vendorId}</span>
                                         <span className="font-bold">{a.allocationPercentage}%</span>
                                     </div>
                                 ))}
                             </div>
                         </div>
                    )}
                </div>

                {/* Results */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Distribution Stats */}
                    <div className="bg-white p-6 rounded border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800">Actual Distribution</h3>
                            <span className="text-xs text-slate-400 font-mono">Total: {totalIndents}</span>
                        </div>
                        {totalIndents === 0 ? (
                            <div className="text-center text-slate-400 py-4 italic">No indents generated yet.</div>
                        ) : (
                             <div className="space-y-3">
                                 {allocs.map(a => {
                                     const count = vendorCounts[a.vendorId] || 0;
                                     const actualPercent = totalIndents > 0 ? ((count / totalIndents) * 100).toFixed(1) : '0.0';
                                     return (
                                         <div key={a.vendorId}>
                                             <div className="flex justify-between text-sm mb-1">
                                                 <span className="font-medium">{a.vendorId}</span>
                                                 <span className={`font-mono text-xs ${Math.abs(Number(actualPercent) - a.allocationPercentage) > 5 ? 'text-red-500' : 'text-green-600'}`}>
                                                     {count} ({actualPercent}%) / Target: {a.allocationPercentage}%
                                                 </span>
                                             </div>
                                             <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                 <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{width: `${actualPercent}%`}}></div>
                                             </div>
                                         </div>
                                     );
                                 })}
                             </div>
                        )}
                    </div>

                    {/* Live Feed */}
                    <div className="bg-white rounded border border-slate-200 overflow-hidden">
                        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 font-bold text-sm text-slate-600 flex justify-between items-center">
                            <span>Recent Indents</span>
                            <RefreshCw size={14} className="text-slate-400" />
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-2">ID</th>
                                    <th className="px-6 py-2">Vendor</th>
                                    <th className="px-6 py-2 text-right">Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {simulatedIndents.map(i => (
                                    <tr key={i.id} className="animate-in fade-in duration-300">
                                        <td className="px-6 py-2 font-mono text-xs text-slate-400">{i.id.split('-')[0]}</td>
                                        <td className="px-6 py-2 font-medium">{i.selectedVendorId}</td>
                                        <td className="px-6 py-2 text-right font-mono text-slate-600">₹{i.appliedRate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
