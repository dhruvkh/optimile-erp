import React from 'react';
import {
    X, Package, MapPin, Clock, Truck, FileText, CheckCircle, ArrowRight,
    Building2, IndianRupee, Camera, AlertTriangle, User, Phone, Scale
} from 'lucide-react';
import { Button } from '../../ui/Button';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TimelineEvent {
    status: string;
    timestamp: string;
    hub?: string;
    vehicle?: string;
    detail?: string;
    icon: React.ReactNode;
    color: string;
}

interface DocketInfo {
    docketNumber: string;
    clientName: string;
    pickupCity: string;
    pickupAddress: string;
    deliveryCity: string;
    deliveryAddress: string;
    originHub: string;
    destinationHub: string;
    pieces: number;
    chargeableWeight: number;
    declaredValue: number;
    totalCharges: number;
    priority: string;
    status: string;
    pickupDate: string;
    deliveryDate: string;
    firstMileVehicle?: string;
    lineHaulTrip?: string;
    lastMileVehicle?: string;
    invoiceNumber?: string;
    invoiceAmount?: number;
    ewayBill?: string;
    podUploaded?: boolean;
    receiverName?: string;
    // Conditional charge fields
    paymentType?: string;
    daccApplied?: boolean;
    appointmentDelivery?: boolean;
    conditionalCharges?: number;
    demurrageCharge?: number;
    redeliveryCharge?: number;
    redeliveryAttempts?: number;
}

// ─── Timeline Builder ────────────────────────────────────────────────────────

const buildTimeline = (d: DocketInfo): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    const iconClass = 'w-4 h-4';

    // Always show created
    events.push({
        status: 'Docket Created', timestamp: d.pickupDate + ' 09:00',
        hub: d.originHub, detail: `${d.pieces} pcs, ${d.chargeableWeight} kg`,
        icon: <Package className={iconClass} />, color: 'gray',
    });

    const statuses: { key: string; ev: TimelineEvent }[] = [
        { key: 'Pickup Scheduled', ev: { status: 'Pickup Scheduled', timestamp: d.pickupDate + ' 10:30', hub: d.originHub, vehicle: d.firstMileVehicle, detail: 'First-mile vehicle allocated', icon: <Truck className={iconClass} />, color: 'yellow' } },
        { key: 'Picked Up', ev: { status: 'Material Picked Up', timestamp: d.pickupDate + ' 14:00', hub: d.originHub, vehicle: d.firstMileVehicle, detail: d.invoiceNumber ? `Invoice: ${d.invoiceNumber}` : undefined, icon: <CheckCircle className={iconClass} />, color: 'green' } },
        { key: 'At Origin Hub', ev: { status: 'Arrived at Origin Hub', timestamp: d.pickupDate + ' 16:30', hub: d.originHub, detail: d.invoiceNumber ? `Invoice ${d.invoiceNumber} captured` : 'Material received at hub', icon: <Building2 className={iconClass} />, color: 'orange' } },
        { key: 'In Transit', ev: { status: 'Line Haul Dispatched', timestamp: d.pickupDate + ' 22:00', hub: `${d.originHub} → ${d.destinationHub}`, vehicle: d.lineHaulTrip, detail: 'FTL vehicle dispatched for inter-hub transit', icon: <ArrowRight className={iconClass} />, color: 'blue' } },
        { key: 'At Destination Hub', ev: { status: 'Arrived at Destination Hub', timestamp: d.deliveryDate + ' 06:00', hub: d.destinationHub, detail: 'Unloaded and ready for cross-dock', icon: <Building2 className={iconClass} />, color: 'indigo' } },
        { key: 'Out for Delivery', ev: { status: 'Out for Delivery', timestamp: d.deliveryDate + ' 09:00', hub: d.destinationHub, vehicle: d.lastMileVehicle, detail: 'Last-mile vehicle dispatched', icon: <Truck className={iconClass} />, color: 'purple' } },
        { key: 'Delivered', ev: { status: 'Delivered', timestamp: d.deliveryDate + ' 13:00', detail: d.receiverName ? `Received by: ${d.receiverName}` : 'Delivery completed', icon: <CheckCircle className={iconClass} />, color: 'emerald' } },
        { key: 'Failed Delivery', ev: { status: 'Delivery Failed', timestamp: d.deliveryDate + ' 13:00', hub: d.destinationHub, detail: 'Delivery attempt failed', icon: <AlertTriangle className={iconClass} />, color: 'red' } },
    ];

    const statusOrder = ['Created', 'Pickup Scheduled', 'Picked Up', 'At Origin Hub', 'In Transit', 'At Destination Hub', 'Out for Delivery', 'Delivered', 'Failed Delivery'];
    const currentIdx = statusOrder.indexOf(d.status);

    for (const s of statuses) {
        const idx = statusOrder.indexOf(s.key);
        if (idx <= currentIdx) events.push(s.ev);
    }

    return events;
};

// ─── Component ───────────────────────────────────────────────────────────────

export const DocketDetailModal: React.FC<{
    open: boolean;
    onClose: () => void;
    docket: DocketInfo | null;
}> = ({ open, onClose, docket }) => {
    if (!open || !docket) return null;
    const d = docket;
    const timeline = buildTimeline(d);

    const getStatusColor = (s: string) => {
        const c: Record<string, string> = {
            'Created': 'bg-gray-100 text-gray-700', 'Pickup Scheduled': 'bg-yellow-100 text-yellow-700',
            'Picked Up': 'bg-green-100 text-green-700', 'At Origin Hub': 'bg-orange-100 text-orange-700',
            'In Transit': 'bg-blue-100 text-blue-700', 'At Destination Hub': 'bg-indigo-100 text-indigo-700',
            'Out for Delivery': 'bg-purple-100 text-purple-700', 'Delivered': 'bg-emerald-100 text-emerald-700',
            'Failed Delivery': 'bg-red-100 text-red-700',
        };
        return c[s] || 'bg-gray-100 text-gray-700';
    };

    const colorMap: Record<string, string> = {
        gray: 'bg-gray-500', yellow: 'bg-yellow-500', green: 'bg-green-500',
        orange: 'bg-orange-500', blue: 'bg-blue-500', indigo: 'bg-indigo-500',
        purple: 'bg-purple-500', emerald: 'bg-emerald-500', red: 'bg-red-500',
    };

    // SLA check
    const isOnTime = d.status === 'Delivered' || new Date(d.deliveryDate) >= new Date();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-4 rounded-t-2xl z-10">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Package className="w-5 h-5" /> {d.docketNumber}
                            </h2>
                            <p className="text-sm opacity-80">{d.clientName} • {d.pickupCity} → {d.deliveryCity}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${getStatusColor(d.status)}`}>{d.status}</span>
                            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Summary Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-[10px] text-gray-500 uppercase">Origin Hub</p>
                            <p className="text-sm font-bold text-orange-600">{d.originHub}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-[10px] text-gray-500 uppercase">Dest Hub</p>
                            <p className="text-sm font-bold text-blue-600">{d.destinationHub}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-[10px] text-gray-500 uppercase">Chargeable Wt</p>
                            <p className="text-sm font-bold text-gray-700">{d.chargeableWeight} kg</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-[10px] text-gray-500 uppercase">SLA</p>
                            <p className={`text-sm font-bold ${isOnTime ? 'text-green-600' : 'text-red-600'}`}>
                                {isOnTime ? '✅ On Time' : '⚠️ Delayed'}
                            </p>
                        </div>
                    </div>

                    {/* Route & Charges */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase">Route Details</h4>
                            <div className="space-y-2 text-sm">
                                <div><span className="text-gray-500">Pickup:</span> <span className="font-medium">{d.pickupAddress}, {d.pickupCity}</span></div>
                                <div><span className="text-gray-500">Delivery:</span> <span className="font-medium">{d.deliveryAddress}, {d.deliveryCity}</span></div>
                                <div><span className="text-gray-500">Pieces:</span> <span className="font-medium">{d.pieces}</span></div>
                                <div><span className="text-gray-500">Declared Value:</span> <span className="font-medium">₹{d.declaredValue.toLocaleString()}</span></div>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase">Charges & Documents</h4>
                            <div className="space-y-2 text-sm">
                                <div><span className="text-gray-500">Total Charges:</span> <span className="font-bold text-green-600">₹{d.totalCharges.toLocaleString()}</span></div>
                                {d.paymentType && d.paymentType !== 'Prepaid' && (
                                    <div><span className="text-gray-500">Payment Type:</span> <span className={`font-medium ${d.paymentType === 'COD' ? 'text-purple-600' : 'text-blue-600'}`}>{d.paymentType}</span></div>
                                )}
                                {(d.daccApplied || d.appointmentDelivery) && (
                                    <div className="flex gap-2">
                                        {d.daccApplied && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">DACC</span>}
                                        {d.appointmentDelivery && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Appointment</span>}
                                    </div>
                                )}
                                {!!d.conditionalCharges && <div><span className="text-gray-500">Conditional Charges:</span> <span className="font-medium text-purple-600">₹{d.conditionalCharges.toLocaleString()}</span></div>}
                                {!!d.demurrageCharge && <div><span className="text-gray-500">Demurrage:</span> <span className="font-medium text-red-600">₹{d.demurrageCharge.toLocaleString()}</span></div>}
                                {!!d.redeliveryCharge && (
                                    <div><span className="text-gray-500">Re-delivery ({d.redeliveryAttempts} attempt{(d.redeliveryAttempts || 0) > 1 ? 's' : ''}):</span> <span className="font-medium text-red-600">₹{d.redeliveryCharge.toLocaleString()}</span></div>
                                )}
                                {d.invoiceNumber && <div><span className="text-gray-500">Invoice:</span> <span className="font-medium text-blue-600">{d.invoiceNumber}</span></div>}
                                {d.invoiceAmount && <div><span className="text-gray-500">Invoice Amt:</span> <span className="font-medium">₹{d.invoiceAmount.toLocaleString()}</span></div>}
                                {d.ewayBill && <div><span className="text-gray-500">E-Way Bill:</span> <span className="font-medium">{d.ewayBill}</span></div>}
                                {d.podUploaded && <div className="text-green-600 font-medium flex items-center gap-1"><Camera className="w-3 h-3" /> POD Uploaded</div>}
                            </div>
                        </div>
                    </div>

                    {/* Vehicles */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className={`p-3 rounded-lg border ${d.firstMileVehicle ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                            <p className="text-[10px] text-gray-500 uppercase mb-1">First Mile</p>
                            <p className="text-xs font-bold text-gray-700">{d.firstMileVehicle || '—'}</p>
                        </div>
                        <div className={`p-3 rounded-lg border ${d.lineHaulTrip ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                            <p className="text-[10px] text-gray-500 uppercase mb-1">Line Haul</p>
                            <p className="text-xs font-bold text-gray-700">{d.lineHaulTrip || '—'}</p>
                        </div>
                        <div className={`p-3 rounded-lg border ${d.lastMileVehicle ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'}`}>
                            <p className="text-[10px] text-gray-500 uppercase mb-1">Last Mile</p>
                            <p className="text-xs font-bold text-gray-700">{d.lastMileVehicle || '—'}</p>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" /> Lifecycle Timeline
                        </h4>
                        <div className="relative ml-4">
                            {/* Vertical line */}
                            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />

                            <div className="space-y-4">
                                {timeline.map((ev, i) => (
                                    <div key={i} className="flex items-start gap-4 relative">
                                        <div className={`relative z-10 w-4 h-4 rounded-full flex items-center justify-center text-white ${colorMap[ev.color] || 'bg-gray-500'} ring-2 ring-white shadow-sm`}>
                                            {ev.icon}
                                        </div>
                                        <div className="flex-1 pb-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{ev.status}</p>
                                                    {ev.hub && <p className="text-xs text-gray-500">{ev.hub}</p>}
                                                    {ev.vehicle && <p className="text-xs text-blue-500">{ev.vehicle}</p>}
                                                    {ev.detail && <p className="text-xs text-gray-400 mt-0.5">{ev.detail}</p>}
                                                </div>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{ev.timestamp}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
