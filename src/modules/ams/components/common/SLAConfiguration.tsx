import React, { useState, useEffect } from 'react';
import { auctionEngine } from '../../services/mockBackend';
import { TransportContract, ContractLane, ContractStatus } from '../../types';
import { Timer, Save } from 'lucide-react';

export function SLAConfiguration() {
    const [activeContracts, setActiveContracts] = useState<TransportContract[]>([]);
    const [selectedContractId, setSelectedContractId] = useState('');
    const [lanes, setLanes] = useState<ContractLane[]>([]);
    
    // Form
    const [selectedLaneId, setSelectedLaneId] = useState('');
    const [duration, setDuration] = useState(60);

    useEffect(() => {
        const contracts = auctionEngine.getContracts().filter(c => c.status === ContractStatus.ACTIVE);
        setActiveContracts(contracts);
    }, []);

    useEffect(() => {
        if(selectedContractId) {
            setLanes(auctionEngine.getContractLanes(selectedContractId));
        } else {
            setLanes([]);
        }
    }, [selectedContractId]);

    const handleSave = () => {
        if(!selectedLaneId) return;
        try {
            auctionEngine.createPlacementSLA(selectedLaneId, duration, 'ADMIN-USER');
            alert('SLA Configured successfully');
            setDuration(60);
        } catch(e) {
            alert((e as Error).message);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center space-x-3">
                <Timer className="w-8 h-8 text-slate-800" />
                <div>
                    <h1 className="text-2xl font-bold">SLA Configuration</h1>
                    <p className="text-slate-500">Define accountability windows for active contract lanes.</p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="font-bold text-lg mb-6 border-b pb-2">Vehicle Placement Rule</h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Active Contract</label>
                        <select 
                            className="w-full border p-2 rounded bg-slate-50"
                            value={selectedContractId}
                            onChange={e => setSelectedContractId(e.target.value)}
                        >
                            <option value="">-- Choose Contract --</option>
                            {activeContracts.map(c => <option key={c.id} value={c.id}>{c.id} ({c.clientId})</option>)}
                        </select>
                        {activeContracts.length === 0 && <p className="text-xs text-red-500 mt-1">No active contracts found.</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Select Contract Lane</label>
                        <select 
                             className="w-full border p-2 rounded bg-slate-50"
                             value={selectedLaneId}
                             onChange={e => setSelectedLaneId(e.target.value)}
                             disabled={!selectedContractId}
                        >
                            <option value="">-- Choose Lane --</option>
                            {lanes.map(l => {
                                const existingSLA = auctionEngine.getPlacementSLA(l.id);
                                return (
                                    <option key={l.id} value={l.id}>
                                        {l.laneName} {existingSLA ? '(Active)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Max Placement Time (Minutes)</label>
                        <input 
                            type="number" 
                            className="w-full border p-2 rounded" 
                            value={duration} 
                            onChange={e => setDuration(Number(e.target.value))}
                            min={1}
                        />
                        <p className="text-xs text-slate-500 mt-1">Vendor must confirm vehicle within this window after indent assignment.</p>
                    </div>

                    <button 
                        onClick={handleSave}
                        disabled={!selectedLaneId}
                        className="bg-primary text-white px-6 py-2 rounded font-bold hover:bg-slate-800 disabled:bg-slate-300 flex items-center space-x-2"
                    >
                        <Save size={18} /> <span>Save & Activate Rule</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
