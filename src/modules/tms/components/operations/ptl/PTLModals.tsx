import React, { useState } from 'react';
import {
    X, Truck, User, Phone, FileText, Upload, Camera, MapPin,
    CheckCircle, AlertTriangle, IndianRupee, Package, Hash, Calendar, Clock
} from 'lucide-react';
import { Button } from '../../ui/Button';

// ─── Hardcoded vehicle lists ─────────────────────────────────────────────────

const AVAILABLE_VEHICLES = [
    { id: 'V1', type: 'Tata Ace', plate: 'MH-04-AB-1234', driver: 'Ramesh K', phone: '+91-9876543210', source: 'Dedicated' as const, capacity: '750 kg' },
    { id: 'V2', type: '407', plate: 'MH-02-CD-5678', driver: 'Suresh P', phone: '+91-9876543211', source: 'Dedicated' as const, capacity: '2500 kg' },
    { id: 'V3', type: 'Tata Ace', plate: 'MH-12-EF-9012', driver: 'Ganesh R', phone: '+91-9876543212', source: 'Market' as const, capacity: '750 kg' },
    { id: 'V4', type: 'Eicher 14ft', plate: 'MH-43-GH-3456', driver: 'Ashok M', phone: '+91-9876543213', source: 'Market' as const, capacity: '4000 kg' },
    { id: 'V5', type: 'Bolero Pickup', plate: 'MH-01-IJ-7890', driver: 'Vijay T', phone: '+91-9876543214', source: 'Dedicated' as const, capacity: '1200 kg' },
];

const LINE_HAUL_VEHICLES = [
    { id: 'LH1', type: '32ft MXL', plate: 'MH-01-XY-9999', driver: 'Kamal Singh', phone: '+91-9800001111', capacity: '15 Ton' },
    { id: 'LH2', type: '20ft Container', plate: 'MH-04-ZZ-8888', driver: 'Bharat Yadav', phone: '+91-9800002222', capacity: '7 Ton' },
    { id: 'LH3', type: '32ft HQ', plate: 'GJ-05-AA-7777', driver: 'Santosh D', phone: '+91-9800003333', capacity: '18 Ton' },
    { id: 'LH4', type: '40ft Trailer', plate: 'MH-43-BB-6666', driver: 'Deepak N', phone: '+91-9800004444', capacity: '25 Ton' },
];

// ─── Shared Modal Shell ─────────────────────────────────────────────────────

const ModalShell: React.FC<{
    open: boolean; onClose: () => void; title: string; subtitle?: string;
    color?: string; width?: string; children: React.ReactNode;
}> = ({ open, onClose, title, subtitle, color = 'orange', width = 'max-w-xl', children }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative bg-white rounded-2xl shadow-2xl ${width} w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200`}>
                <div className={`sticky top-0 bg-${color}-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center z-10`}>
                    <div>
                        <h2 className="text-lg font-bold">{title}</h2>
                        {subtitle && <p className="text-sm opacity-80">{subtitle}</p>}
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

// ─── 1. Vehicle Allocation Modal (First Mile / Last Mile) ───────────────────

export const VehicleAllocationModal: React.FC<{
    open: boolean; onClose: () => void; dockets: { docketNumber: string; pickupAddress: string; weight: number }[];
    mode: 'pickup' | 'delivery'; city: string; onAllocate: (vehicleId: string, vehicleInfo: string) => void;
}> = ({ open, onClose, dockets, mode, city, onAllocate }) => {
    const [sourceFilter, setSourceFilter] = useState<'all' | 'Dedicated' | 'Market'>('all');
    const [selectedVehicle, setSelectedVehicle] = useState('');

    const filtered = AVAILABLE_VEHICLES.filter(v => sourceFilter === 'all' || v.source === sourceFilter);
    const totalWeight = dockets.reduce((s, d) => s + d.weight, 0);

    const handleAllocate = () => {
        const v = AVAILABLE_VEHICLES.find(x => x.id === selectedVehicle);
        if (v) {
            onAllocate(v.id, `${v.type} - ${v.plate}`);
            onClose();
        }
    };

    return (
        <ModalShell open={open} onClose={onClose} title={mode === 'pickup' ? 'Schedule Pickup Run' : 'Assign Delivery Vehicle'}
            subtitle={`${city} — ${dockets.length} docket(s), ${totalWeight} kg`} color={mode === 'pickup' ? 'green' : 'purple'}>

            {/* Dockets Summary */}
            <div className="mb-4 bg-gray-50 rounded-lg p-3 space-y-1">
                {dockets.map(d => (
                    <div key={d.docketNumber} className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">{d.docketNumber}</span>
                        <span className="text-gray-500">{d.pickupAddress} • {d.weight} kg</span>
                    </div>
                ))}
            </div>

            {/* Source Filter */}
            <div className="flex gap-2 mb-4">
                {(['all', 'Dedicated', 'Market'] as const).map(f => (
                    <button key={f} onClick={() => setSourceFilter(f)}
                        className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-all ${sourceFilter === f ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}>{f === 'all' ? 'All' : f}</button>
                ))}
            </div>

            {/* Vehicle List */}
            <div className="space-y-2 mb-6">
                {filtered.map(v => (
                    <div key={v.id} onClick={() => setSelectedVehicle(v.id)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedVehicle === v.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                            }`}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Truck className={`w-5 h-5 ${selectedVehicle === v.id ? 'text-blue-600' : 'text-gray-400'}`} />
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{v.type} — {v.plate}</p>
                                    <p className="text-xs text-gray-500">{v.driver} • {v.phone}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${v.source === 'Dedicated' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>{v.source}</span>
                                <p className="text-xs text-gray-400 mt-1">{v.capacity}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Button onClick={handleAllocate} disabled={!selectedVehicle} className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
                <CheckCircle className="w-4 h-4 mr-2" /> Allocate Vehicle
            </Button>
        </ModalShell>
    );
};

// ─── 2. Pickup Completion Modal (with Invoice & Docs) ───────────────────────

export const PickupCompletionModal: React.FC<{
    open: boolean; onClose: () => void; docketNumber: string; clientName: string; weight: number;
    onComplete: (data: { invoiceNumber: string; invoiceAmount: number; ewayBill: string; remarks: string }) => void;
}> = ({ open, onClose, docketNumber, clientName, weight, onComplete }) => {
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceAmount, setInvoiceAmount] = useState(0);
    const [ewayBill, setEwayBill] = useState('');
    const [remarks, setRemarks] = useState('');
    const [invoiceFile, setInvoiceFile] = useState<string | null>(null);
    const [lrCopy, setLrCopy] = useState<string | null>(null);

    const handleSubmit = () => {
        onComplete({ invoiceNumber, invoiceAmount, ewayBill, remarks });
        onClose();
    };

    return (
        <ModalShell open={open} onClose={onClose} title="Confirm Pickup & Capture Documents"
            subtitle={`${docketNumber} — ${clientName}`} color="green" width="max-w-2xl">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Invoice Details */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" /> Invoice Details
                    </h3>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Invoice Number *</label>
                        <input type="text" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" placeholder="INV-2026-XXXX"
                            value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Invoice Amount (₹)</label>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                            <input type="number" className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg" placeholder="0"
                                value={invoiceAmount || ''} onChange={e => setInvoiceAmount(parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">E-Way Bill Number</label>
                        <input type="text" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" placeholder="EWB-XXXXXXXXXX"
                            value={ewayBill} onChange={e => setEwayBill(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Verified Weight at Pickup</label>
                        <div className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 font-medium">{weight} kg</div>
                    </div>
                </div>

                {/* Right: Document Uploads */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-green-600" /> Documents
                    </h3>
                    {/* Invoice Upload */}
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Invoice Copy</label>
                        <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-colors">
                            {invoiceFile ? (
                                <span className="text-sm text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {invoiceFile}</span>
                            ) : (
                                <span className="text-sm text-gray-400 flex items-center gap-1"><Upload className="w-4 h-4" /> Upload Invoice</span>
                            )}
                            <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={e => setInvoiceFile(e.target.files?.[0]?.name || null)} />
                        </label>
                    </div>
                    {/* LR Copy */}
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">LR / Lorry Receipt Copy</label>
                        <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-colors">
                            {lrCopy ? (
                                <span className="text-sm text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {lrCopy}</span>
                            ) : (
                                <span className="text-sm text-gray-400 flex items-center gap-1"><Upload className="w-4 h-4" /> Upload LR Copy</span>
                            )}
                            <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={e => setLrCopy(e.target.files?.[0]?.name || null)} />
                        </label>
                    </div>
                    {/* Remarks */}
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Remarks</label>
                        <textarea className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" rows={2} placeholder="Any special notes..."
                            value={remarks} onChange={e => setRemarks(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button onClick={handleSubmit} disabled={!invoiceNumber} className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">
                    <CheckCircle className="w-4 h-4 mr-2" /> Confirm Pickup
                </Button>
            </div>
        </ModalShell>
    );
};

// ─── 3. Line Haul Vehicle Assignment Modal ──────────────────────────────────

export const LineHaulAssignModal: React.FC<{
    open: boolean; onClose: () => void; originHub: string; destHub: string;
    docketCount: number; totalWeight: number; vehicleType: string;
    onAssign: (vehicleId: string, vehicleInfo: string, driverName: string) => void;
}> = ({ open, onClose, originHub, destHub, docketCount, totalWeight, vehicleType, onAssign }) => {
    const [selected, setSelected] = useState('');

    const handleAssign = () => {
        const v = LINE_HAUL_VEHICLES.find(x => x.id === selected);
        if (v) { onAssign(v.id, `${v.type} - ${v.plate}`, v.driver); onClose(); }
    };

    return (
        <ModalShell open={open} onClose={onClose} title="Assign Line Haul Vehicle"
            subtitle={`${originHub} → ${destHub} • ${docketCount} dockets • ${totalWeight} kg`} color="blue">

            <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm">
                <p className="text-blue-800"><strong>Suggested:</strong> {vehicleType} (based on load volume & weight)</p>
            </div>

            <div className="space-y-2 mb-6">
                {LINE_HAUL_VEHICLES.map(v => (
                    <div key={v.id} onClick={() => setSelected(v.id)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selected === v.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                            }`}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Truck className={`w-5 h-5 ${selected === v.id ? 'text-blue-600' : 'text-gray-400'}`} />
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{v.type} — {v.plate}</p>
                                    <p className="text-xs text-gray-500">{v.driver} • {v.phone}</p>
                                </div>
                            </div>
                            <span className="text-xs text-gray-400">{v.capacity}</span>
                        </div>
                    </div>
                ))}
            </div>

            <Button onClick={handleAssign} disabled={!selected} className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
                <CheckCircle className="w-4 h-4 mr-2" /> Assign & Create Trip
            </Button>
        </ModalShell>
    );
};

// ─── 4. POD Upload & Delivery Completion Modal ──────────────────────────────

export const PODUploadModal: React.FC<{
    open: boolean; onClose: () => void; docketNumber: string; deliveryAddress: string;
    onComplete: (data: { receiverName: string; receiverPhone: string; podFile: string | null; deliveryRemarks: string }) => void;
}> = ({ open, onClose, docketNumber, deliveryAddress, onComplete }) => {
    const [receiverName, setReceiverName] = useState('');
    const [receiverPhone, setReceiverPhone] = useState('');
    const [podFile, setPodFile] = useState<string | null>(null);
    const [deliveryRemarks, setDeliveryRemarks] = useState('');
    const [deliveryStatus, setDeliveryStatus] = useState<'Delivered' | 'Failed'>('Delivered');

    const handleSubmit = () => {
        onComplete({ receiverName, receiverPhone, podFile, deliveryRemarks });
        onClose();
    };

    return (
        <ModalShell open={open} onClose={onClose} title="Complete Delivery & Upload POD"
            subtitle={`${docketNumber} — ${deliveryAddress}`} color="purple">

            {/* Delivery Status */}
            <div className="flex gap-3 mb-4">
                {(['Delivered', 'Failed'] as const).map(s => (
                    <button key={s} onClick={() => setDeliveryStatus(s)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${deliveryStatus === s
                                ? s === 'Delivered' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'
                                : 'border-gray-200 text-gray-500'
                            }`}>{s === 'Delivered' ? '✅ Delivered' : '❌ Failed Delivery'}</button>
                ))}
            </div>

            {deliveryStatus === 'Delivered' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Receiver Name *</label>
                            <input type="text" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" placeholder="Name"
                                value={receiverName} onChange={e => setReceiverName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Receiver Phone</label>
                            <input type="tel" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" placeholder="+91..."
                                value={receiverPhone} onChange={e => setReceiverPhone(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600 mb-1">POD (Proof of Delivery) *</label>
                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-colors">
                            {podFile ? (
                                <span className="text-sm text-purple-600 font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {podFile}</span>
                            ) : (
                                <>
                                    <Camera className="w-6 h-6 text-gray-400 mb-1" />
                                    <span className="text-sm text-gray-400">Upload POD image or scan</span>
                                    <span className="text-[10px] text-gray-300">PDF, JPG, PNG accepted</span>
                                </>
                            )}
                            <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={e => setPodFile(e.target.files?.[0]?.name || null)} />
                        </label>
                    </div>
                </div>
            )}

            <div className="mt-4">
                <label className="block text-xs text-gray-600 mb-1">Remarks</label>
                <textarea className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" rows={2}
                    placeholder={deliveryStatus === 'Failed' ? 'Reason for failed delivery...' : 'Any delivery notes...'}
                    value={deliveryRemarks} onChange={e => setDeliveryRemarks(e.target.value)} />
            </div>

            <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button onClick={handleSubmit}
                    disabled={deliveryStatus === 'Delivered' && (!receiverName || !podFile)}
                    className={`flex-1 text-white disabled:opacity-50 ${deliveryStatus === 'Delivered' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                        }`}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {deliveryStatus === 'Delivered' ? 'Mark Delivered' : 'Mark Failed'}
                </Button>
            </div>
        </ModalShell>
    );
};

// ─── 5. Manifest Viewer Modal ───────────────────────────────────────────────

export const ManifestModal: React.FC<{
    open: boolean; onClose: () => void; tripId: string; origin: string; destination: string;
    vehicle: string; driver: string; docketCount: number;
}> = ({ open, onClose, tripId, origin, destination, vehicle, driver, docketCount }) => (
    <ModalShell open={open} onClose={onClose} title="Trip Manifest" subtitle={`${tripId} — ${origin} → ${destination}`} color="blue">
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Vehicle</p>
                    <p className="text-sm font-semibold text-gray-800">{vehicle}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Driver</p>
                    <p className="text-sm font-semibold text-gray-800">{driver}</p>
                </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">Dockets in this trip ({docketCount})</p>
                <div className="space-y-1">
                    {Array.from({ length: docketCount }, (_, i) => (
                        <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                            <span className="font-medium text-gray-700">DKT-{String(i + 1).padStart(3, '0')}</span>
                            <span className="text-gray-400">In manifest</span>
                        </div>
                    ))}
                </div>
            </div>
            <Button variant="outline" className="w-full" onClick={onClose}>
                <FileText className="w-4 h-4 mr-2" /> Download Manifest PDF
            </Button>
        </div>
    </ModalShell>
);
