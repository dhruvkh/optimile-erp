import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../shared/context/ToastContext';
import {
    ArrowLeft, Package, MapPin, Calculator, FileCheck, ChevronRight, ChevronLeft,
    Check, Truck, User, Phone, Building2, Scale, Ruler, IndianRupee, AlertTriangle,
    Info, Calendar, Clock, Hash, Shield
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ptlStore } from '../services/ptlStore';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PTLClientContract {
    volumetricFactor: number; // kg per CFT
    minChargeableSurface: number;
    minChargeableAir: number;
    freightToCollect: number;
    valueToCollect: number;
    freeStorageDays: number;
    demurragePerConPerDay: number;
    demurragePerKgPerDay: number;
    publicHolidayPickup: number;
    publicHolidayDelivery: number;
    daccCharge: number;
    redeliveryMin: number;
    redeliveryPerKg: number;
    stateChargeApplied: boolean;
    pdaApplied: boolean;
    ddaApplied: boolean;
    fuelSurchargePercent: number;
    baseDieselPrice: number;
    odaRatePerKg: number;
    odaMinPerCon: number;
    fovPercent: number;
    fovMinPerCon: number;
    appointmentDeliveryPerKg: number;
    appointmentDeliveryMin: number;
    docketCharge: number;
}

interface CargoPiece {
    id: string;
    length: number;
    width: number;
    height: number;
    weight: number;
    quantity: number;
}

interface PTLDocketData {
    // Step 1
    clientId: string;
    clientName: string;
    docketNumber: string;
    pickupAddress: string;
    pickupCity: string;
    pickupContact: string;
    pickupPhone: string;
    deliveryAddress: string;
    deliveryCity: string;
    deliveryContact: string;
    deliveryPhone: string;
    pickupDate: string;
    deliveryDate: string;
    priority: 'Normal' | 'Urgent' | 'Critical';

    // Step 2
    commodityType: string;
    pieces: CargoPiece[];
    declaredValue: number;
    specialHandling: string[];

    // Service options (booking-time conditional charge flags)
    paymentType: 'Prepaid' | 'To-Pay' | 'COD';
    daccApplied: boolean;
    appointmentDelivery: boolean;

    // Calculated
    totalPieces: number;
    actualWeight: number;
    volumetricWeight: number;
    chargeableWeight: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_CLIENTS = [
    { id: 'C001', name: 'Reliance Industries' },
    { id: 'C002', name: 'Amazon Logistics' },
    { id: 'C003', name: 'Flipkart Supply Chain' },
    { id: 'C004', name: 'Delhivery' },
    { id: 'C005', name: 'Mahindra Logistics' },
];

const MOCK_CONTRACT: PTLClientContract = {
    volumetricFactor: 6.0,
    minChargeableSurface: 300,
    minChargeableAir: 1350,
    freightToCollect: 150,
    valueToCollect: 150,
    freeStorageDays: 7,
    demurragePerConPerDay: 100,
    demurragePerKgPerDay: 1,
    publicHolidayPickup: 500,
    publicHolidayDelivery: 500,
    daccCharge: 200,
    redeliveryMin: 300,
    redeliveryPerKg: 5,
    stateChargeApplied: false,
    pdaApplied: true,
    ddaApplied: true,
    fuelSurchargePercent: 0,
    baseDieselPrice: 92.72,
    odaRatePerKg: 4,
    odaMinPerCon: 750,
    fovPercent: 0.10,
    fovMinPerCon: 100,
    appointmentDeliveryPerKg: 4,
    appointmentDeliveryMin: 750,
    docketCharge: 100,
};

// Base rate per kg for mock lane
const BASE_RATE_PER_KG = 8.5;

// Indian public holidays 2026 (YYYY-MM-DD) used for pickup/delivery surcharge detection
const INDIAN_PUBLIC_HOLIDAYS_2026 = [
    '2026-01-26', // Republic Day
    '2026-03-25', // Holi
    '2026-04-10', // Good Friday
    '2026-04-14', // Dr. Ambedkar Jayanti
    '2026-05-01', // Maharashtra Day / Labour Day
    '2026-08-15', // Independence Day
    '2026-10-02', // Gandhi Jayanti
    '2026-10-22', // Dussehra
    '2026-11-11', // Diwali
    '2026-11-15', // Guru Nanak Jayanti
    '2026-12-25', // Christmas
];

// ─── Component ───────────────────────────────────────────────────────────────

export const PTLBookingPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [data, setData] = useState<PTLDocketData>({
        clientId: '',
        clientName: '',
        docketNumber: `DKT-${Date.now().toString(36).toUpperCase()}`,
        pickupAddress: '',
        pickupCity: '',
        pickupContact: '',
        pickupPhone: '',
        deliveryAddress: '',
        deliveryCity: '',
        deliveryContact: '',
        deliveryPhone: '',
        pickupDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        priority: 'Normal',
        commodityType: 'General',
        pieces: [{ id: '1', length: 0, width: 0, height: 0, weight: 0, quantity: 1 }],
        declaredValue: 0,
        specialHandling: [],
        paymentType: 'Prepaid',
        daccApplied: false,
        appointmentDelivery: false,
        totalPieces: 0,
        actualWeight: 0,
        volumetricWeight: 0,
        chargeableWeight: 0,
    });

    const update = (fields: Partial<PTLDocketData>) => setData(prev => ({ ...prev, ...fields }));

    // ─── Calculations ────────────────────────────────────────────────────────

    const calculations = useMemo(() => {
        const contract = MOCK_CONTRACT;
        let totalActualWeight = 0;
        let totalVolumetricWeight = 0;
        let totalPieceCount = 0;

        data.pieces.forEach(p => {
            const qty = p.quantity || 1;
            totalPieceCount += qty;
            totalActualWeight += (p.weight || 0) * qty;
            // Volumetric: (L × W × H in cm) / (CFT factor × 1000) per piece
            const volPerPiece = ((p.length || 0) * (p.width || 0) * (p.height || 0)) / 5000;
            totalVolumetricWeight += volPerPiece * qty;
        });

        const chargeableWeight = Math.max(totalActualWeight, totalVolumetricWeight);
        const cw = Math.max(chargeableWeight, contract.minChargeableSurface / BASE_RATE_PER_KG);

        // Charges
        const baseFreight = Math.max(cw * BASE_RATE_PER_KG, contract.minChargeableSurface);
        const fuelSurcharge = baseFreight * (contract.fuelSurchargePercent / 100);
        const odaPickup = contract.pdaApplied ? Math.max(contract.odaRatePerKg * cw, contract.odaMinPerCon) : 0;
        const odaDelivery = contract.ddaApplied ? Math.max(contract.odaRatePerKg * cw, contract.odaMinPerCon) : 0;
        const fov = data.declaredValue > 0
            ? Math.max((contract.fovPercent / 100) * data.declaredValue, contract.fovMinPerCon)
            : 0;
        const docketCharge = contract.docketCharge;

        // ── Conditional / booking-time charges ───────────────────────────────
        // Freight-to-Collect: flat charge for To-Pay dockets (consignee pays freight)
        const freightToCollect = data.paymentType === 'To-Pay' ? contract.freightToCollect : 0;
        // COD service charge: flat charge when consignee pays cash on delivery
        const codCharge = data.paymentType === 'COD' ? contract.valueToCollect : 0;
        // DACC: flat charge for Delivery Against Consignee Copy
        const daccCharge = data.daccApplied ? contract.daccCharge : 0;
        // Appointment Delivery: per-kg charge (min) when consignee requests a specific slot
        const appointmentCharge = data.appointmentDelivery
            ? Math.max(contract.appointmentDeliveryPerKg * cw, contract.appointmentDeliveryMin)
            : 0;
        // Public holiday surcharge: applied if pickup or delivery date falls on a national holiday
        const publicHolidayPickupCharge = INDIAN_PUBLIC_HOLIDAYS_2026.includes(data.pickupDate)
            ? contract.publicHolidayPickup : 0;
        const publicHolidayDeliveryCharge = INDIAN_PUBLIC_HOLIDAYS_2026.includes(data.deliveryDate)
            ? contract.publicHolidayDelivery : 0;
        const conditionalCharges = freightToCollect + codCharge + daccCharge + appointmentCharge
            + publicHolidayPickupCharge + publicHolidayDeliveryCharge;

        const baseCharges = Math.round(baseFreight + fuelSurcharge + odaPickup + odaDelivery + fov + docketCharge);
        const totalCharges = baseCharges + Math.round(conditionalCharges);

        return {
            totalPieceCount,
            totalActualWeight: Math.round(totalActualWeight * 100) / 100,
            totalVolumetricWeight: Math.round(totalVolumetricWeight * 100) / 100,
            chargeableWeight: Math.round(chargeableWeight * 100) / 100,
            baseFreight: Math.round(baseFreight),
            fuelSurcharge: Math.round(fuelSurcharge),
            odaPickup: Math.round(odaPickup),
            odaDelivery: Math.round(odaDelivery),
            fov: Math.round(fov),
            docketCharge,
            // Conditional
            freightToCollect: Math.round(freightToCollect),
            codCharge: Math.round(codCharge),
            daccCharge: Math.round(daccCharge),
            appointmentCharge: Math.round(appointmentCharge),
            publicHolidayPickupCharge: Math.round(publicHolidayPickupCharge),
            publicHolidayDeliveryCharge: Math.round(publicHolidayDeliveryCharge),
            conditionalCharges: Math.round(conditionalCharges),
            baseCharges,
            totalCharges,
        };
    }, [data.pieces, data.declaredValue, data.paymentType, data.daccApplied, data.appointmentDelivery, data.pickupDate, data.deliveryDate]);

    // ─── Piece management ────────────────────────────────────────────────────

    const addPiece = () => {
        setData(prev => ({
            ...prev,
            pieces: [...prev.pieces, { id: String(Date.now()), length: 0, width: 0, height: 0, weight: 0, quantity: 1 }]
        }));
    };

    const updatePiece = (id: string, field: keyof CargoPiece, value: number) => {
        setData(prev => ({
            ...prev,
            pieces: prev.pieces.map(p => p.id === id ? { ...p, [field]: value } : p)
        }));
    };

    const removePiece = (id: string) => {
        if (data.pieces.length <= 1) return;
        setData(prev => ({ ...prev, pieces: prev.pieces.filter(p => p.id !== id) }));
    };

    // ─── Submit ──────────────────────────────────────────────────────────────

    const handleSubmit = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            // Derive hub names from city names (fallback to "<City> Hub")
            const originHub = `${data.pickupCity} Hub`;
            const destinationHub = `${data.deliveryCity} Hub`;

            // Build PTLDocket and save to persistent store
            ptlStore.addDocket({
                id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                docketNumber: data.docketNumber,
                clientName: data.clientName || data.clientId,
                pickupCity: data.pickupCity,
                pickupAddress: data.pickupAddress,
                deliveryCity: data.deliveryCity,
                deliveryAddress: data.deliveryAddress,
                originHub,
                destinationHub,
                pieces: calculations.totalPieceCount,
                chargeableWeight: calculations.chargeableWeight,
                declaredValue: data.declaredValue,
                totalCharges: calculations.totalCharges,
                priority: data.priority,
                status: 'Created',
                pickupDate: data.pickupDate,
                deliveryDate: data.deliveryDate,
                createdAt: new Date().toISOString(),
                // Service options & conditional charges
                paymentType: data.paymentType,
                daccApplied: data.daccApplied || undefined,
                appointmentDelivery: data.appointmentDelivery || undefined,
                conditionalCharges: calculations.conditionalCharges || undefined,
            });

            setIsSubmitting(false);
            showToast({
                type: 'success',
                title: 'PTL Docket Created',
                message: `Docket ${data.docketNumber} created. ₹${calculations.totalCharges.toLocaleString()} • ${calculations.chargeableWeight} kg chargeable. Appears in Pending Pickups now.`
            });
            navigate('/tms/operations/ptl-consolidation');
        }, 1000);
    };

    // ─── Steps Config ────────────────────────────────────────────────────────

    const steps = [
        { id: 1, title: 'Client & Addresses', icon: MapPin },
        { id: 2, title: 'Cargo Details', icon: Package },
        { id: 3, title: 'Charges Preview', icon: Calculator },
        { id: 4, title: 'Review & Create', icon: FileCheck },
    ];

    // ─── Step Renderers ──────────────────────────────────────────────────────

    const renderStep1 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Client Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                            className="block w-full pl-10 pr-3 py-2.5 text-sm border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 border bg-white"
                            value={data.clientId}
                            onChange={(e) => {
                                const client = MOCK_CLIENTS.find(c => c.id === e.target.value);
                                if (client) update({ clientId: client.id, clientName: client.name });
                            }}
                        >
                            <option value="">Select PTL Client...</option>
                            {MOCK_CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    {data.clientId && (
                        <p className="text-xs text-orange-600 mt-1 flex items-center">
                            <Shield className="w-3 h-3 mr-1" /> Contract terms loaded (Vol. Factor: {MOCK_CONTRACT.volumetricFactor} kg/CFT)
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Docket Number</label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2.5 text-sm border-gray-300 rounded-lg border bg-gray-50 font-mono"
                            value={data.docketNumber}
                            readOnly
                        />
                    </div>
                </div>
            </div>

            {/* Priority */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <div className="flex gap-3">
                    {(['Normal', 'Urgent', 'Critical'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => update({ priority: p })}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border-2 transition-all ${data.priority === p
                                    ? p === 'Critical' ? 'border-red-500 bg-red-50 text-red-700'
                                        : p === 'Urgent' ? 'border-orange-500 bg-orange-50 text-orange-700'
                                            : 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Service Options */}
            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-purple-800 mb-4 flex items-center">
                    <IndianRupee className="w-4 h-4 mr-2" /> Service Options &amp; Payment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Payment Type */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">Payment Type</label>
                        <div className="flex flex-col gap-2">
                            {(['Prepaid', 'To-Pay', 'COD'] as const).map(pt => (
                                <label key={pt} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${data.paymentType === pt ? 'border-purple-400 bg-purple-50 text-purple-800 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                    <input type="radio" className="accent-purple-600" checked={data.paymentType === pt} onChange={() => update({ paymentType: pt })} />
                                    {pt}
                                    {pt === 'To-Pay' && <span className="text-xs text-gray-400 ml-auto">+₹{MOCK_CONTRACT.freightToCollect}</span>}
                                    {pt === 'COD' && <span className="text-xs text-gray-400 ml-auto">+₹{MOCK_CONTRACT.valueToCollect}</span>}
                                </label>
                            ))}
                        </div>
                    </div>
                    {/* DACC */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">DACC (Delivery Against Consignee Copy)</label>
                        <label className={`flex items-center gap-3 px-3 py-3 rounded-lg border cursor-pointer transition-all ${data.daccApplied ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <input type="checkbox" className="w-4 h-4 accent-purple-600" checked={data.daccApplied} onChange={e => update({ daccApplied: e.target.checked })} />
                            <div>
                                <p className="text-sm text-gray-800">Enable DACC</p>
                                <p className="text-xs text-gray-400">Flat ₹{MOCK_CONTRACT.daccCharge} per consignment</p>
                            </div>
                        </label>
                    </div>
                    {/* Appointment Delivery */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">Appointment Delivery</label>
                        <label className={`flex items-center gap-3 px-3 py-3 rounded-lg border cursor-pointer transition-all ${data.appointmentDelivery ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <input type="checkbox" className="w-4 h-4 accent-purple-600" checked={data.appointmentDelivery} onChange={e => update({ appointmentDelivery: e.target.checked })} />
                            <div>
                                <p className="text-sm text-gray-800">Schedule Appointment</p>
                                <p className="text-xs text-gray-400">₹{MOCK_CONTRACT.appointmentDeliveryPerKg}/kg, min ₹{MOCK_CONTRACT.appointmentDeliveryMin}</p>
                            </div>
                        </label>
                    </div>
                </div>
                {/* Holiday hint — shown only when pickup/delivery date is a holiday */}
                {(INDIAN_PUBLIC_HOLIDAYS_2026.includes(data.pickupDate) || INDIAN_PUBLIC_HOLIDAYS_2026.includes(data.deliveryDate)) && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>
                            Public holiday surcharge will apply:
                            {INDIAN_PUBLIC_HOLIDAYS_2026.includes(data.pickupDate) && ` Pickup +₹${MOCK_CONTRACT.publicHolidayPickup}`}
                            {INDIAN_PUBLIC_HOLIDAYS_2026.includes(data.deliveryDate) && ` Delivery +₹${MOCK_CONTRACT.publicHolidayDelivery}`}
                        </span>
                    </div>
                )}
            </div>

            {/* Pickup */}
            <div className="bg-green-50/50 border border-green-100 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-green-800 mb-4 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" /> Pickup Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">Pickup Address</label>
                        <input type="text" placeholder="Full address..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" value={data.pickupAddress} onChange={e => update({ pickupAddress: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">City</label>
                        <input type="text" placeholder="Mumbai" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" value={data.pickupCity} onChange={e => update({ pickupCity: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Contact Person</label>
                        <input type="text" placeholder="Name" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" value={data.pickupContact} onChange={e => update({ pickupContact: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Phone</label>
                        <input type="tel" placeholder="+91..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" value={data.pickupPhone} onChange={e => update({ pickupPhone: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Pickup Date</label>
                        <input type="date" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" value={data.pickupDate} onChange={e => update({ pickupDate: e.target.value })} />
                    </div>
                </div>
            </div>

            {/* Delivery */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-blue-800 mb-4 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" /> Delivery Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">Delivery Address</label>
                        <input type="text" placeholder="Full address..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" value={data.deliveryAddress} onChange={e => update({ deliveryAddress: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">City</label>
                        <input type="text" placeholder="Delhi" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" value={data.deliveryCity} onChange={e => update({ deliveryCity: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Contact Person</label>
                        <input type="text" placeholder="Name" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" value={data.deliveryContact} onChange={e => update({ deliveryContact: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Phone</label>
                        <input type="tel" placeholder="+91..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" value={data.deliveryPhone} onChange={e => update({ deliveryPhone: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Expected Delivery Date</label>
                        <input type="date" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" min={data.pickupDate} value={data.deliveryDate} onChange={e => update({ deliveryDate: e.target.value })} />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Commodity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commodity Type</label>
                    <select className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white" value={data.commodityType} onChange={e => update({ commodityType: e.target.value })}>
                        <option>General</option>
                        <option>Electronics</option>
                        <option>Pharmaceuticals</option>
                        <option>FMCG</option>
                        <option>Auto Parts</option>
                        <option>Textiles</option>
                        <option>Chemicals</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Declared Value (₹)</label>
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="number" className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg" placeholder="0" value={data.declaredValue || ''} onChange={e => update({ declaredValue: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Required for FOV (Freight on Value) calculation</p>
                </div>
            </div>

            {/* Special Handling */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Handling</label>
                <div className="flex flex-wrap gap-2">
                    {['Fragile', 'Temperature Controlled', 'Hazardous', 'High Value', 'Stackable', 'Heavy Lift'].map(tag => (
                        <button
                            key={tag}
                            onClick={() => {
                                const has = data.specialHandling.includes(tag);
                                update({ specialHandling: has ? data.specialHandling.filter(t => t !== tag) : [...data.specialHandling, tag] });
                            }}
                            className={`px-3 py-1.5 text-xs rounded-full border transition-all ${data.specialHandling.includes(tag)
                                    ? 'bg-orange-100 border-orange-300 text-orange-700 font-medium'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pieces Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                        <Ruler className="w-4 h-4 mr-2" /> Piece Dimensions & Weight
                    </h3>
                    <button onClick={addPiece} className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 transition-colors font-medium">
                        + Add Piece
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">L (cm)</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">W (cm)</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">H (cm)</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Weight (kg)</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Vol. Wt.</th>
                                <th className="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.pieces.map((piece, idx) => {
                                const volWt = ((piece.length * piece.width * piece.height) / 5000) * piece.quantity;
                                return (
                                    <tr key={piece.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-2 text-gray-500 font-mono">{idx + 1}</td>
                                        <td className="px-4 py-2"><input type="number" className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm" value={piece.length || ''} onChange={e => updatePiece(piece.id, 'length', parseFloat(e.target.value) || 0)} /></td>
                                        <td className="px-4 py-2"><input type="number" className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm" value={piece.width || ''} onChange={e => updatePiece(piece.id, 'width', parseFloat(e.target.value) || 0)} /></td>
                                        <td className="px-4 py-2"><input type="number" className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm" value={piece.height || ''} onChange={e => updatePiece(piece.id, 'height', parseFloat(e.target.value) || 0)} /></td>
                                        <td className="px-4 py-2"><input type="number" className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm" value={piece.weight || ''} onChange={e => updatePiece(piece.id, 'weight', parseFloat(e.target.value) || 0)} /></td>
                                        <td className="px-4 py-2"><input type="number" className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm" min={1} value={piece.quantity} onChange={e => updatePiece(piece.id, 'quantity', parseInt(e.target.value) || 1)} /></td>
                                        <td className="px-4 py-2 text-gray-600 font-medium">{volWt.toFixed(1)} kg</td>
                                        <td className="px-4 py-2">
                                            {data.pieces.length > 1 && (
                                                <button onClick={() => removePiece(piece.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Weight Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Actual Weight</p>
                    <p className="text-2xl font-bold text-gray-900">{calculations.totalActualWeight}</p>
                    <p className="text-xs text-gray-400">kg</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Volumetric Weight</p>
                    <p className="text-2xl font-bold text-gray-900">{calculations.totalVolumetricWeight}</p>
                    <p className="text-xs text-gray-400">kg</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center border-2 border-orange-200">
                    <p className="text-xs text-orange-600 mb-1 font-medium">Chargeable Weight</p>
                    <p className="text-2xl font-bold text-orange-700">{calculations.chargeableWeight}</p>
                    <p className="text-xs text-orange-500">kg (higher of actual/volumetric)</p>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm font-medium text-orange-800">Auto-Calculated from Client Contract</p>
                    <p className="text-xs text-orange-600 mt-1">Charges are computed based on {data.clientName || 'client'}'s contracted rates. Editable fields can be overridden if needed.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Charge Breakdown */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">Charge Breakdown</h3>

                    {[
                        { label: 'Base Freight', value: calculations.baseFreight, desc: `${calculations.chargeableWeight} kg × ₹${BASE_RATE_PER_KG}/kg` },
                        { label: 'Fuel Surcharge', value: calculations.fuelSurcharge, desc: `${MOCK_CONTRACT.fuelSurchargePercent}% of base freight` },
                        { label: 'Pickup ODA', value: calculations.odaPickup, desc: MOCK_CONTRACT.pdaApplied ? `₹${MOCK_CONTRACT.odaRatePerKg}/kg, min ₹${MOCK_CONTRACT.odaMinPerCon}` : 'Not applicable' },
                        { label: 'Delivery ODA', value: calculations.odaDelivery, desc: MOCK_CONTRACT.ddaApplied ? `₹${MOCK_CONTRACT.odaRatePerKg}/kg, min ₹${MOCK_CONTRACT.odaMinPerCon}` : 'Not applicable' },
                        { label: 'FOV (Freight on Value)', value: calculations.fov, desc: data.declaredValue > 0 ? `${MOCK_CONTRACT.fovPercent}% of ₹${data.declaredValue.toLocaleString()}, min ₹${MOCK_CONTRACT.fovMinPerCon}` : 'No declared value' },
                        { label: 'Docket Charge', value: calculations.docketCharge, desc: 'Per docket' },
                    ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-2 px-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                            <div>
                                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                                <p className="text-xs text-gray-400">{item.desc}</p>
                            </div>
                            <span className="text-sm font-bold text-gray-900">₹{item.value.toLocaleString()}</span>
                        </div>
                    ))}

                    <div className="flex justify-between items-center py-3 px-4 bg-orange-600 text-white rounded-xl mt-4">
                        <span className="font-semibold">Total Charges</span>
                        <span className="text-xl font-bold">₹{calculations.totalCharges.toLocaleString()}</span>
                    </div>
                </div>

                {/* Right: Conditional charges — show computed value if triggered, "Conditional" if not */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">Service &amp; Conditional Charges</h3>
                    <p className="text-xs text-gray-500">Booking-time charges are computed from your selections. Operations charges apply later.</p>

                    {/* Booking-time conditional charges */}
                    {[
                        {
                            label: 'Freight to Collect',
                            desc: data.paymentType === 'To-Pay' ? 'Applied — To-Pay docket' : `₹${MOCK_CONTRACT.freightToCollect} (select To-Pay to trigger)`,
                            value: calculations.freightToCollect,
                            active: calculations.freightToCollect > 0,
                        },
                        {
                            label: 'COD Service Charge',
                            desc: data.paymentType === 'COD' ? 'Applied — COD docket' : `₹${MOCK_CONTRACT.valueToCollect} (select COD to trigger)`,
                            value: calculations.codCharge,
                            active: calculations.codCharge > 0,
                        },
                        {
                            label: 'DACC',
                            desc: data.daccApplied ? 'Applied — DACC enabled' : `₹${MOCK_CONTRACT.daccCharge} flat (enable DACC to trigger)`,
                            value: calculations.daccCharge,
                            active: calculations.daccCharge > 0,
                        },
                        {
                            label: 'Appointment Delivery',
                            desc: data.appointmentDelivery
                                ? `₹${MOCK_CONTRACT.appointmentDeliveryPerKg}/kg × ${calculations.chargeableWeight} kg, min ₹${MOCK_CONTRACT.appointmentDeliveryMin}`
                                : `₹${MOCK_CONTRACT.appointmentDeliveryPerKg}/kg, min ₹${MOCK_CONTRACT.appointmentDeliveryMin}`,
                            value: calculations.appointmentCharge,
                            active: calculations.appointmentCharge > 0,
                        },
                        {
                            label: 'Public Holiday — Pickup',
                            desc: INDIAN_PUBLIC_HOLIDAYS_2026.includes(data.pickupDate)
                                ? `Applied — ${data.pickupDate} is a public holiday`
                                : `₹${MOCK_CONTRACT.publicHolidayPickup} if pickup date is a holiday`,
                            value: calculations.publicHolidayPickupCharge,
                            active: calculations.publicHolidayPickupCharge > 0,
                        },
                        {
                            label: 'Public Holiday — Delivery',
                            desc: INDIAN_PUBLIC_HOLIDAYS_2026.includes(data.deliveryDate)
                                ? `Applied — ${data.deliveryDate} is a public holiday`
                                : `₹${MOCK_CONTRACT.publicHolidayDelivery} if delivery date is a holiday`,
                            value: calculations.publicHolidayDeliveryCharge,
                            active: calculations.publicHolidayDeliveryCharge > 0,
                        },
                    ].map((item, i) => (
                        <div key={i} className={`flex justify-between items-start py-2 px-3 rounded-lg border transition-colors ${item.active ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-100'}`}>
                            <div>
                                <p className={`text-sm font-medium ${item.active ? 'text-purple-800' : 'text-gray-700'}`}>{item.label}</p>
                                <p className="text-xs text-gray-400">{item.desc}</p>
                            </div>
                            {item.active
                                ? <span className="text-sm font-bold text-purple-700 shrink-0 ml-2">₹{item.value.toLocaleString()}</span>
                                : <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0 ml-2">Not applied</span>
                            }
                        </div>
                    ))}

                    {/* Operations-time charges — always informational */}
                    <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-500 mb-2">Triggered during operations:</p>
                        {[
                            { label: 'Demurrage', desc: `₹${MOCK_CONTRACT.demurragePerConPerDay}/con/day or ₹${MOCK_CONTRACT.demurragePerKgPerDay}/kg/day after ${MOCK_CONTRACT.freeStorageDays} free days at hub` },
                            { label: 'Re-Delivery', desc: `₹${MOCK_CONTRACT.redeliveryPerKg}/kg/attempt, min ₹${MOCK_CONTRACT.redeliveryMin} on failed delivery` },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-start py-1.5 px-3 bg-gray-50 rounded-lg border border-gray-100 mb-1">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{item.label}</p>
                                    <p className="text-xs text-gray-400">{item.desc}</p>
                                </div>
                                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0 ml-2">Ops-time</span>
                            </div>
                        ))}
                    </div>

                    {calculations.conditionalCharges > 0 && (
                        <div className="flex justify-between items-center py-2 px-3 bg-purple-600 text-white rounded-lg mt-2">
                            <span className="text-sm font-semibold">Conditional Charges Total</span>
                            <span className="font-bold">₹{calculations.conditionalCharges.toLocaleString()}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 border-l-4 border-l-orange-500">
                    <p className="text-xs text-gray-500 mb-1">Client</p>
                    <p className="font-semibold text-gray-900">{data.clientName || '—'}</p>
                    <p className="text-xs text-gray-400 mt-1 font-mono">{data.docketNumber}</p>
                </Card>
                <Card className="p-4 border-l-4 border-l-green-500">
                    <p className="text-xs text-gray-500 mb-1">Route</p>
                    <p className="font-semibold text-gray-900">{data.pickupCity || '—'} → {data.deliveryCity || '—'}</p>
                    <p className="text-xs text-gray-400 mt-1">{data.pickupDate} to {data.deliveryDate || 'TBD'}</p>
                </Card>
                <Card className="p-4 border-l-4 border-l-blue-500">
                    <p className="text-xs text-gray-500 mb-1">Cargo Summary</p>
                    <p className="font-semibold text-gray-900">{calculations.totalPieceCount} pcs • {calculations.chargeableWeight} kg (chargeable)</p>
                    <p className="text-xs text-gray-400 mt-1">Actual: {calculations.totalActualWeight} kg | Vol: {calculations.totalVolumetricWeight} kg</p>
                </Card>
            </div>

            {/* Address Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50/50 rounded-xl p-4 border border-green-100">
                    <h4 className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wider">Pickup</h4>
                    <p className="text-sm text-gray-800">{data.pickupAddress || '—'}</p>
                    <p className="text-xs text-gray-500 mt-1">{data.pickupContact} • {data.pickupPhone}</p>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                    <h4 className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wider">Delivery</h4>
                    <p className="text-sm text-gray-800">{data.deliveryAddress || '—'}</p>
                    <p className="text-xs text-gray-500 mt-1">{data.deliveryContact} • {data.deliveryPhone}</p>
                </div>
            </div>

            {/* Charges Summary */}
            <Card className="p-0 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800">Charges Summary</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {[
                        ['Base Freight', calculations.baseFreight],
                        ['Fuel Surcharge', calculations.fuelSurcharge],
                        ['Pickup ODA', calculations.odaPickup],
                        ['Delivery ODA', calculations.odaDelivery],
                        ['FOV', calculations.fov],
                        ['Docket Charge', calculations.docketCharge],
                        ...(calculations.freightToCollect > 0 ? [['Freight to Collect', calculations.freightToCollect]] : []),
                        ...(calculations.codCharge > 0 ? [['COD Service Charge', calculations.codCharge]] : []),
                        ...(calculations.daccCharge > 0 ? [['DACC', calculations.daccCharge]] : []),
                        ...(calculations.appointmentCharge > 0 ? [['Appointment Delivery', calculations.appointmentCharge]] : []),
                        ...(calculations.publicHolidayPickupCharge > 0 ? [['Public Holiday (Pickup)', calculations.publicHolidayPickupCharge]] : []),
                        ...(calculations.publicHolidayDeliveryCharge > 0 ? [['Public Holiday (Delivery)', calculations.publicHolidayDeliveryCharge]] : []),
                    ].map(([label, value]) => (
                        <div key={label as string} className="flex justify-between px-4 py-2.5">
                            <span className="text-sm text-gray-600">{label}</span>
                            <span className="text-sm font-medium text-gray-900">₹{(value as number).toLocaleString()}</span>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between px-4 py-3 bg-orange-600 text-white">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold">₹{calculations.totalCharges.toLocaleString()}</span>
                </div>
            </Card>

            {/* Priority Badge */}
            {data.priority !== 'Normal' && (
                <div className={`flex items-center gap-2 p-3 rounded-lg border ${data.priority === 'Critical' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-orange-50 border-orange-200 text-orange-700'
                    }`}>
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">{data.priority} Priority — Will be fast-tracked in operations</span>
                </div>
            )}
        </div>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            case 4: return renderStep4();
            default: return null;
        }
    };

    // ─── Main Render ─────────────────────────────────────────────────────────

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">New PTL Docket</h1>
                        <p className="text-sm text-gray-500">Create a Part Truck Load consignment</p>
                    </div>
                </div>
                <span className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                    PTL
                </span>
            </div>

            {/* Stepper */}
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 -z-10"></div>
                    {steps.map((step) => {
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;
                        const Icon = step.icon;
                        return (
                            <div key={step.id} className="flex flex-col items-center bg-white px-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? 'border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-200 scale-110'
                                        : isCompleted ? 'border-green-500 bg-green-500 text-white'
                                            : 'border-gray-300 text-gray-400 bg-white'
                                    }`}>
                                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                </div>
                                <span className={`mt-2 text-xs font-medium ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <Card className="max-w-5xl mx-auto min-h-[500px] flex flex-col justify-between">
                <div className="mb-6">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                        <h2 className="text-lg font-bold text-gray-900">{steps[currentStep - 1].title}</h2>
                        <span className="text-xs text-gray-400">Step {currentStep} of {steps.length}</span>
                    </div>
                    {renderCurrentStep()}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                    <div />
                    <div className="flex gap-3">
                        {currentStep > 1 && (
                            <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                                <ChevronLeft className="h-4 w-4 mr-1" /> Back
                            </Button>
                        )}
                        {currentStep < steps.length ? (
                            <Button onClick={() => setCurrentStep(currentStep + 1)} className="bg-orange-600 hover:bg-orange-700 px-6">
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} isLoading={isSubmitting} className="bg-green-600 hover:bg-green-700 px-8">
                                Create Docket
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};
