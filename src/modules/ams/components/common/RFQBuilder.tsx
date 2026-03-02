import React, { useState, useEffect } from 'react';
import { auctionEngine } from '../../services/mockBackend';
import { RFQ, RFQLane, RFQStatus, VendorQuote } from '../../types';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, ArrowRight, Lock, Upload, CheckCircle, Clock } from 'lucide-react';

export function CreateRFQ() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    
    const create = (e: React.FormEvent) => {
        e.preventDefault();
        const id = auctionEngine.createRFQ(name, undefined, 'CLIENT-USER');
        navigate(`/client/rfq/${id}`);
    };

    return (
        <div className="max-w-md mx-auto bg-white p-6 rounded border border-slate-200">
            <h1 className="text-xl font-bold mb-4">Initialize RFQ</h1>
            <form onSubmit={create}>
                <input className="w-full border p-2 rounded mb-4" placeholder="RFQ Name" value={name} onChange={e=>setName(e.target.value)} required />
                <button className="w-full bg-primary text-white py-2 rounded">Start Building</button>
            </form>
        </div>
    );
}

export function RFQBuilder() {
    const { id } = useParams<{id: string}>();
    const navigate = useNavigate();
    const [rfq, setRfq] = useState<RFQ | undefined>();
    const [lanes, setLanes] = useState<RFQLane[]>([]);
    
    // New Lane Form
    const [laneName, setLaneName] = useState('');
    const [truck, setTruck] = useState('32ft MXL');
    const [cap, setCap] = useState('14T');
    const [vol, setVol] = useState(10);
    const [tat, setTat] = useState(3); // TAT Days

    const fetch = () => {
        if(id) {
            setRfq(auctionEngine.getRFQ(id));
            setLanes(auctionEngine.getRFQLanes(id));
        }
    };

    useEffect(() => {
        fetch();
        const unsub = auctionEngine.subscribe(fetch);
        return unsub;
    }, [id]);

    const addLane = () => {
        if(id && laneName) {
            auctionEngine.addRFQLane(id, { laneName, truckType: truck, capacity: cap, estMonthlyVolume: vol, tatDays: tat });
            setLaneName('');
        }
    };

    const handleBulkUpload = () => {
        if(!id) return;
        // Simulation of parsing a CSV
        const dummyLanes = [
            { laneName: 'Chennai -> Hyderabad', truckType: '32ft SXL', capacity: '7T', estMonthlyVolume: 15, tatDays: 2 },
            { laneName: 'Delhi -> Jaipur', truckType: '20ft', capacity: '5T', estMonthlyVolume: 20, tatDays: 1 },
            { laneName: 'Kolkata -> Bhubaneswar', truckType: '32ft MXL', capacity: '14T', estMonthlyVolume: 8, tatDays: 3 }
        ];
        
        dummyLanes.forEach(l => auctionEngine.addRFQLane(id, l));
        alert(`Successfully imported ${dummyLanes.length} lanes from file.`);
    };

    const sendRFQ = () => {
        if(id) auctionEngine.sendRFQ(id, 'CLIENT-USER');
    };

    const convertToAuction = () => {
        if(id) {
            const auctionId = auctionEngine.createAuctionFromRFQ(id, { minBidDecrement: 100, timerExtensionSeconds: 120, timerExtensionThresholdSeconds: 10, allowRankVisibility: true }, 'CLIENT-USER');
            navigate(`/ams/auctions/live/${auctionId}`);
        }
    };

    if(!rfq) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{rfq.name}</h1>
                    <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs font-bold uppercase bg-slate-200 text-slate-700 px-2 py-1 rounded">{rfq.status}</span>
                        {rfq.status === RFQStatus.SENT && (
                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded flex items-center">
                                <CheckCircle size={12} className="mr-1"/> Live to Vendors
                            </span>
                        )}
                    </div>
                </div>
                <div className="space-x-2">
                    {rfq.status === 'DRAFT' && (
                        <>
                            <button onClick={handleBulkUpload} className="bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2 rounded hover:bg-slate-200 flex inline-flex items-center space-x-2">
                                <Upload size={16} /> <span>Bulk Upload Lanes (CSV)</span>
                            </button>
                            <button onClick={sendRFQ} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Send to Vendors</button>
                        </>
                    )}
                    {rfq.status === 'SENT' && (
                        <button onClick={convertToAuction} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center space-x-2">
                             <Lock size={16} /> <span>Lock & Create Auction</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Lane List */}
            <div className="bg-white rounded border border-slate-200 mb-6">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-3">Lane Name</th>
                            <th className="p-3">Truck Type</th>
                            <th className="p-3">Capacity</th>
                            <th className="p-3">TAT (Days)</th>
                            <th className="p-3 text-right">Est. Volume</th>
                            <th className="p-3 text-right">Quotes Recv.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {lanes.map(l => {
                            const quotes = auctionEngine.getVendorQuotes(l.id);
                            return (
                                <tr key={l.id}>
                                    <td className="p-3 font-medium">{l.laneName}</td>
                                    <td className="p-3">{l.truckType}</td>
                                    <td className="p-3">{l.capacity}</td>
                                    <td className="p-3 flex items-center text-slate-600">
                                        <Clock size={14} className="mr-1 text-slate-400"/> {l.tatDays || '-'}
                                    </td>
                                    <td className="p-3 text-right">{l.estMonthlyVolume}</td>
                                    <td className="p-3 text-right font-bold text-accent">{quotes.length}</td>
                                </tr>
                            );
                        })}
                        {lanes.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-400">No lanes added yet. Use form below or Bulk Upload.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Add Lane Form */}
            {rfq.status === 'DRAFT' && (
                <div className="bg-slate-50 p-4 rounded border border-slate-200 flex items-end space-x-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold mb-1">Lane Name</label>
                        <input className="w-full border p-2 rounded text-sm" value={laneName} onChange={e=>setLaneName(e.target.value)} placeholder="e.g. Pune -> Bangalore" />
                    </div>
                    <div className="w-32">
                        <label className="block text-xs font-bold mb-1">Truck</label>
                        <input className="w-full border p-2 rounded text-sm" value={truck} onChange={e=>setTruck(e.target.value)} />
                    </div>
                    <div className="w-24">
                        <label className="block text-xs font-bold mb-1">Capacity</label>
                        <input className="w-full border p-2 rounded text-sm" value={cap} onChange={e=>setCap(e.target.value)} />
                    </div>
                    <div className="w-20">
                        <label className="block text-xs font-bold mb-1">TAT (Days)</label>
                        <input type="number" className="w-full border p-2 rounded text-sm" value={tat} onChange={e=>setTat(Number(e.target.value))} />
                    </div>
                    <div className="w-24">
                        <label className="block text-xs font-bold mb-1">Volume</label>
                        <input type="number" className="w-full border p-2 rounded text-sm" value={vol} onChange={e=>setVol(Number(e.target.value))} />
                    </div>
                    <button onClick={addLane} className="bg-slate-800 text-white p-2 rounded hover:bg-slate-700">
                        <Plus size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}
