import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, Package, MapPin, Shield, Settings2,
  Truck, Calculator, FileCheck, Plus, Trash2, Building2, Phone,
  User, Scale, Ruler, IndianRupee, AlertTriangle, Info, Calendar,
  Hash, ChevronRight, Search, Star, AlertCircle, CheckCircle,
  Layers, FileText, X
} from 'lucide-react';
import { useToast } from '../../../../shared/context/ToastContext';
import { ptlStore } from '../../services/ptlStore';
import { calculateClientCharges, calcVolumetricWeight } from '../../services/ptlBillingEngine';
import { calculateZoneFreight } from '../../services/ptlFreightCalculator';
import { INITIAL_HUBS } from '../../components/settings/HubMaster';
import type { CargoPiece, PTLDocket, FleetModel } from '../../services/ptlTypes';
import { masterDataStore } from '../../../../shared/services/masterDataStore';

// ─── Shared UI Atoms ─────────────────────────────────────────────────────────

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>{children}</div>
);

const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'blue' }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700', green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700', gray: 'bg-gray-100 text-gray-600',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] ?? colors.blue}`}>{children}</span>;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const CITY_STATE_MAP: Record<string, string> = {
  'Mumbai': 'Maharashtra', 'Pune': 'Maharashtra', 'Nashik': 'Maharashtra', 'Thane': 'Maharashtra',
  'Delhi': 'Delhi', 'Noida': 'Uttar Pradesh', 'Gurgaon': 'Haryana', 'Ghaziabad': 'Uttar Pradesh',
  'Bangalore': 'Karnataka', 'Mysore': 'Karnataka',
  'Chennai': 'Tamil Nadu', 'Coimbatore': 'Tamil Nadu',
  'Hyderabad': 'Telangana', 'Secunderabad': 'Telangana',
  'Kolkata': 'West Bengal',
  'Ahmedabad': 'Gujarat', 'Surat': 'Gujarat',
  'Jaipur': 'Rajasthan', 'Jodhpur': 'Rajasthan',
  'Kochi': 'Kerala',
};

const ODA_CITIES = ['Nasik', 'Aurangabad', 'Nagpur', 'Raipur', 'Bhopal', 'Indore', 'Surat', 'Kochi', 'Jodhpur', 'Patna', 'Siliguri'];

const COMMODITY_TYPES = [
  'Auto Parts', 'Electronics', 'Apparel & Garments', 'FMCG', 'Machinery Parts',
  'Chemicals', 'Pharmaceuticals', 'Food & Beverages', 'Steel & Metals', 'Plastics',
  'Industrial Equipment', 'Construction Materials', 'Consumer Goods', 'Office Equipment',
  'Agricultural Products', 'Other',
];

const SPECIAL_HANDLING_OPTIONS = [
  { id: 'fragile', label: 'Fragile' }, { id: 'hazardous', label: 'Hazardous Material' },
  { id: 'temperature', label: 'Temperature Controlled' }, { id: 'heavy', label: 'Heavy/ODC' },
  { id: 'stackable', label: 'Non-Stackable' }, { id: 'food', label: 'Food Grade' },
  { id: 'urgent', label: 'Express Handling' },
];

const STEPS = [
  { label: 'Client & Route', icon: MapPin },
  { label: 'Cargo Details', icon: Package },
  { label: 'Compliance', icon: Shield },
  { label: 'Service Options', icon: Settings2 },
  { label: 'Fleet Assignment', icon: Truck },
  { label: 'Rate Summary', icon: Calculator },
  { label: 'Review & Confirm', icon: FileCheck },
];

// ─── Booking Form State ───────────────────────────────────────────────────────

interface BookingFormState {
  // Step 1
  clientId: string; clientName: string; clientGSTIN: string;
  pickupAddress: string; pickupCity: string; pickupPincode: string; pickupState: string;
  pickupContact: string; pickupPhone: string;
  deliveryAddress: string; deliveryCity: string; deliveryPincode: string; deliveryState: string;
  deliveryContact: string; deliveryPhone: string;
  // Step 2
  commodityType: string; commodityDescription: string;
  pieces: CargoPiece[];
  declaredValue: number; specialHandling: string[];
  // Step 3
  eWayBillNumber: string; eWayBillExpiry: string;
  transitInsuranceNumber: string; hsCode: string;
  pickupDate: string; promisedDeliveryDate: string;
  // Step 4
  priority: 'Normal' | 'Urgent' | 'Critical';
  paymentType: 'Prepaid' | 'To-Pay' | 'COD'; codAmount: number;
  daccApplied: boolean; appointmentDelivery: boolean; appointmentDatetime: string;
  // Step 5
  fleetModel: FleetModel;
  carrierVendorId: string; carrierVendorName: string; carrierRateCardId: string; agreedCarrierRate: number;
  assignedVehicleId: string; assignedVehiclePlate: string;
  assignedDriverId: string; assignedDriverName: string;
  // Remarks
  remarks: string;
}

const getDefaultDate = (offsetDays = 0): string => {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const INITIAL_PIECE: CargoPiece = { id: 'p1', length: 0, width: 0, height: 0, weight: 0, quantity: 1 };

const INITIAL_STATE: BookingFormState = {
  clientId: '', clientName: '', clientGSTIN: '',
  pickupAddress: '', pickupCity: '', pickupPincode: '', pickupState: '',
  pickupContact: '', pickupPhone: '',
  deliveryAddress: '', deliveryCity: '', deliveryPincode: '', deliveryState: '',
  deliveryContact: '', deliveryPhone: '',
  commodityType: '', commodityDescription: '',
  pieces: [{ ...INITIAL_PIECE }],
  declaredValue: 0, specialHandling: [],
  eWayBillNumber: '', eWayBillExpiry: '', transitInsuranceNumber: '', hsCode: '',
  pickupDate: getDefaultDate(0), promisedDeliveryDate: getDefaultDate(3),
  priority: 'Normal', paymentType: 'Prepaid', codAmount: 0,
  daccApplied: false, appointmentDelivery: false, appointmentDatetime: '',
  fleetModel: 'Own', carrierVendorId: '', carrierVendorName: '', carrierRateCardId: '', agreedCarrierRate: 0,
  assignedVehicleId: '', assignedVehiclePlate: '', assignedDriverId: '', assignedDriverName: '',
  remarks: '',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const PTLBookingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<BookingFormState>(INITIAL_STATE);
  const [view, setView] = useState<'wizard' | 'list'>('list');
  const [dockets, setDockets] = useState(ptlStore.getDockets());
  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Live docket list
  useEffect(() => ptlStore.subscribe(() => setDockets(ptlStore.getDockets())), []);

  const update = (fields: Partial<BookingFormState>) => setForm(f => ({ ...f, ...fields }));

  // ── Hub auto-detect ─────────────────────────────────────────────────────────
  const findHub = (city: string) =>
    INITIAL_HUBS.find(h => h.city.toLowerCase() === city.toLowerCase() || h.zonesServed.some(z => z.toLowerCase() === city.toLowerCase()));

  const originHub = useMemo(() => findHub(form.pickupCity), [form.pickupCity]);
  const destHub = useMemo(() => findHub(form.deliveryCity), [form.deliveryCity]);
  const isODAPickup = ODA_CITIES.includes(form.pickupCity);
  const isODADelivery = ODA_CITIES.includes(form.deliveryCity);
  const isInterstate = !!(form.pickupState && form.deliveryState && form.pickupState !== form.deliveryState);

  // ── Weight calculations ─────────────────────────────────────────────────────
  const weightCalc = useMemo(() => {
    const zoneRc = ptlStore.findZoneRateCardForClient(form.clientId);
    const slabRc = ptlStore.findClientRateCard(form.clientId, form.pickupCity, form.deliveryCity);
    const vf = zoneRc?.tnc.volumetricFactor ?? slabRc?.volumetricFactor ?? 6.0;
    const actualWeight = form.pieces.reduce((s, p) => s + p.weight * p.quantity, 0);
    const volumetricWeight = calcVolumetricWeight(form.pieces, vf);
    const chargeableWeight = Math.max(actualWeight, volumetricWeight);
    const totalPieces = form.pieces.reduce((s, p) => s + p.quantity, 0);
    return { actualWeight, volumetricWeight, chargeableWeight, totalPieces, volumetricFactor: vf };
  }, [form.pieces, form.clientId, form.pickupCity, form.deliveryCity]);

  // ── Rate calculation — zone rate card takes priority over slab ───────────────
  const rateResult = useMemo(() => {
    // 1. Try zone-matrix rate card first
    const zoneRc = ptlStore.findZoneRateCardForClient(form.clientId);
    if (zoneRc) {
      const payMode: 'prepaid' | 'cod' | 'ftc' = form.paymentType === 'COD' ? 'cod' : 'prepaid';
      const b = calculateZoneFreight({
        originCity: form.pickupCity,
        destCity: form.deliveryCity,
        mode: 'surface',
        actualWeightKg: weightCalc.chargeableWeight,
        declaredValue: form.declaredValue,
        paymentMode: payMode,
        rateCardId: zoneRc.id,
        flags: {
          isODAOrigin: isODAPickup,
          isODADestination: isODADelivery,
          requiresDacc: form.daccApplied,
          requiresAppointmentDelivery: form.appointmentDelivery,
        },
      }, zoneRc);
      if (b) {
        const holidayAmt = (b.surcharges.holidayPickup ?? 0) + (b.surcharges.holidayDelivery ?? 0);
        return {
          breakdown: {
            freight: b.baseFreight,
            oda: (b.surcharges.odaOrigin ?? 0) + (b.surcharges.odaDestination ?? 0),
            fov: b.surcharges.fov ?? 0,
            docket: b.surcharges.docketCharge ?? 0,
            fuel: b.surcharges.fuelSurcharge ?? 0,
            cod: b.surcharges.codCharge,
            dacc: b.surcharges.daccCharge,
            appointment: b.surcharges.appointmentDelivery,
            holiday: holidayAmt > 0 ? holidayAmt : undefined,
          },
          totalRevenue: b.totalFreight,
          rateCardLane: `Zone: ${b.originZone} → ${b.destZone}`,
          chargeableWeight: b.chargeableWeightKg,
          rateCardId: zoneRc.id,
        };
      }
    }
    // 2. Fall back to slab-based rate card
    const slabRc = ptlStore.findClientRateCard(form.clientId, form.pickupCity, form.deliveryCity);
    if (!slabRc) return null;
    return calculateClientCharges({
      chargeableWeight: weightCalc.chargeableWeight,
      declaredValue: form.declaredValue,
      totalPieces: weightCalc.totalPieces,
      isODAPickup, isODADelivery,
      paymentType: form.paymentType,
      codAmount: form.codAmount,
      daccApplied: form.daccApplied,
      appointmentDelivery: form.appointmentDelivery,
    }, slabRc);
  }, [form, weightCalc, isODAPickup, isODADelivery]);

  const carrierVendorRate = useMemo(() => {
    if ((form.fleetModel === 'Market' || form.fleetModel === 'Carrier') && form.carrierVendorId) {
      const vrc = ptlStore.findVendorRateCard(form.carrierVendorId, form.pickupCity, form.deliveryCity);
      return vrc;
    }
    return null;
  }, [form.fleetModel, form.carrierVendorId, form.pickupCity, form.deliveryCity]);

  // ── Piece helpers ───────────────────────────────────────────────────────────
  const addPiece = () => {
    const id = `p${Date.now()}`;
    update({ pieces: [...form.pieces, { id, length: 0, width: 0, height: 0, weight: 0, quantity: 1 }] });
  };
  const removePiece = (id: string) => update({ pieces: form.pieces.filter(p => p.id !== id) });
  const updatePiece = (id: string, field: keyof CargoPiece, value: number) =>
    update({ pieces: form.pieces.map(p => p.id === id ? { ...p, [field]: value } : p) });

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const hub = originHub ?? INITIAL_HUBS[0];
    const docketNumber = ptlStore.generateDocketNumber(hub.hubCode);
    const id = ptlStore.generateId('d');
    const now = new Date().toISOString();

    const docket: PTLDocket = {
      id, docketNumber, bookingDate: getDefaultDate(0), createdAt: now,
      clientId: form.clientId, clientName: form.clientName, clientGSTIN: form.clientGSTIN,
      pickupAddress: form.pickupAddress, pickupCity: form.pickupCity,
      pickupPincode: form.pickupPincode, pickupState: form.pickupState,
      pickupContact: form.pickupContact, pickupPhone: form.pickupPhone,
      deliveryAddress: form.deliveryAddress, deliveryCity: form.deliveryCity,
      deliveryPincode: form.deliveryPincode, deliveryState: form.deliveryState,
      deliveryContact: form.deliveryContact, deliveryPhone: form.deliveryPhone,
      isODAPickup, isODADelivery, isInterstate,
      originHubId: hub.id, originHubName: hub.name,
      destinationHubId: destHub?.id ?? 'hub-2', destinationHubName: destHub?.name ?? 'Delhi Hub',
      commodityType: form.commodityType, commodityDescription: form.commodityDescription,
      pieces: form.pieces, totalPieces: weightCalc.totalPieces,
      actualWeight: weightCalc.actualWeight, volumetricWeight: weightCalc.volumetricWeight,
      chargeableWeight: weightCalc.chargeableWeight,
      declaredValue: form.declaredValue, specialHandling: form.specialHandling,
      eWayBillNumber: form.eWayBillNumber || undefined, eWayBillExpiry: form.eWayBillExpiry || undefined,
      transitInsuranceNumber: form.transitInsuranceNumber || undefined, hsCode: form.hsCode || undefined,
      priority: form.priority, paymentType: form.paymentType,
      codAmount: form.paymentType === 'COD' ? form.codAmount : undefined,
      daccApplied: form.daccApplied, appointmentDelivery: form.appointmentDelivery,
      appointmentDatetime: form.appointmentDelivery ? form.appointmentDatetime : undefined,
      fleetModel: form.fleetModel,
      carrierVendorId: form.carrierVendorId || undefined,
      carrierVendorName: form.carrierVendorName || undefined,
      agreedCarrierRate: form.agreedCarrierRate || undefined,
      assignedVehicleId: form.assignedVehicleId || undefined,
      assignedVehiclePlate: form.assignedVehiclePlate || undefined,
      assignedDriverId: form.assignedDriverId || undefined,
      assignedDriverName: form.assignedDriverName || undefined,
      firstMileVehicleId: form.assignedVehicleId || undefined,
      firstMileVehiclePlate: form.assignedVehiclePlate || undefined,
      firstMileDriverName: form.assignedDriverName || undefined,
      pickupDate: form.pickupDate, promisedDeliveryDate: form.promisedDeliveryDate,
      status: 'Created',
      baseFreightCharge: rateResult?.breakdown.freight ?? 0,
      odaCharge: rateResult?.breakdown.oda ?? 0,
      fovCharge: rateResult?.breakdown.fov ?? 0,
      docketCharge: rateResult?.breakdown.docket ?? 0,
      fuelSurcharge: rateResult?.breakdown.fuel ?? 0,
      codCharge: rateResult?.breakdown.cod,
      daccChargeAmount: rateResult?.breakdown.dacc,
      appointmentCharge: rateResult?.breakdown.appointment,
      totalClientCharges: rateResult?.totalRevenue ?? 0,
      totalCarrierCost: (form.fleetModel === 'Market' || form.fleetModel === 'Carrier') ? form.agreedCarrierRate : undefined,
      remarks: form.remarks || undefined,
    };

    ptlStore.addDocket(docket);
    showToast({ type: 'success', title: 'Booking Confirmed', message: `Docket ${docketNumber} created successfully.` });
    setForm(INITIAL_STATE);
    setStep(0);
    setView('list');
  };

  // ── Filtered docket list ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return dockets.filter(d => {
      const matchStatus = filterStatus === 'All' || d.status === filterStatus;
      const matchSearch = !searchQ || d.docketNumber.toLowerCase().includes(searchQ.toLowerCase()) ||
        d.clientName.toLowerCase().includes(searchQ.toLowerCase()) ||
        d.pickupCity.toLowerCase().includes(searchQ.toLowerCase()) ||
        d.deliveryCity.toLowerCase().includes(searchQ.toLowerCase()) ||
        (d.lrNumber ?? '').toLowerCase().includes(searchQ.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [dockets, filterStatus, searchQ]);

  const STATUS_COLORS: Record<string, string> = {
    'Created': 'gray', 'Pickup Scheduled': 'blue', 'Picked Up': 'blue',
    'At Origin Hub': 'purple', 'Manifested': 'purple', 'In Transit': 'amber',
    'At Destination Hub': 'amber', 'Out for Delivery': 'green',
    'Delivery Attempted': 'red', 'Delivered': 'green',
    'RTO Initiated': 'red', 'RTO Completed': 'gray', 'Exception': 'red',
  };

  const FM_COLORS: Record<string, string> = {
    'Own': 'blue', 'Leased': 'purple', 'Market': 'amber', 'Carrier': 'green',
  };

  const ALL_STATUSES = ['All', 'Created', 'Pickup Scheduled', 'At Origin Hub', 'In Transit', 'At Destination Hub', 'Out for Delivery', 'Delivered', 'Exception'];

  // Cargo step validation — must be computed unconditionally (rules of hooks)
  const cargoValidationErrors = useMemo((): string[] => {
    const errors: string[] = [];
    if (!form.commodityType) errors.push('Select a commodity type');
    if (form.pieces.length === 0) errors.push('Add at least one cargo piece');
    if (form.pieces.some(p => p.weight <= 0)) errors.push('Enter weight (kg) for every piece row');
    if (form.pieces.some(p => p.quantity <= 0)) errors.push('Enter quantity for every piece row');
    if (form.declaredValue <= 0) errors.push('Enter declared value (₹)');
    return errors;
  }, [form.commodityType, form.pieces, form.declaredValue]);

  // ─────────────────────────────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/tms/ptl/dashboard')} className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">PTL Bookings</h1>
                <p className="text-sm text-gray-500">{dockets.length} total dockets</p>
              </div>
            </div>
            <button
              onClick={() => setView('wizard')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> New Booking
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 bg-white border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search dockets..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {ALL_STATUSES.map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="px-6 py-4">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Docket #', 'Client', 'Route', 'Cargo', 'Fleet', 'Charges', 'Pickup Date', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400">No dockets found</td></tr>
                  ) : filtered.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/tms/ptl/tracking')}>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-semibold text-blue-700">{d.docketNumber}</div>
                        {d.lrNumber && <div className="text-xs text-gray-400">{d.lrNumber}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-800">{d.clientName}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-700">{d.pickupCity}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1"><ChevronRight className="w-3 h-3" />{d.deliveryCity}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {d.totalPieces} pcs · {d.chargeableWeight} kg
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={FM_COLORS[d.fleetModel]}>{d.fleetModel}</Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        ₹{d.totalClientCharges.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{d.pickupDate}</td>
                      <td className="px-4 py-3">
                        <Badge color={STATUS_COLORS[d.status] ?? 'gray'}>{d.status}</Badge>
                        {d.exceptionIds && d.exceptionIds.length > 0 && (
                          <AlertTriangle className="inline w-3 h-3 text-red-500 ml-1" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ─────────────────────── WIZARD VIEW ────────────────────────────────────────

  const canProceed = () => {
    switch (step) {
      case 0: return !!(form.clientId && form.pickupAddress && form.pickupCity && form.deliveryAddress && form.deliveryCity && form.pickupContact && form.deliveryContact);
      case 1: return cargoValidationErrors.length === 0;
      case 2: return !!(form.pickupDate && form.promisedDeliveryDate);
      case 3: return true;
      case 4: return form.fleetModel === 'Own' || form.fleetModel === 'Leased' || !!(form.carrierVendorId);
      case 5: return true;
      case 6: return true;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('list')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">New PTL Booking</h1>
            <p className="text-sm text-gray-500">Step {step + 1} of {STEPS.length} — {STEPS[step].label}</p>
          </div>
        </div>
      </div>

      {/* Step indicators */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <React.Fragment key={i}>
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${active ? 'bg-blue-600 text-white' : done ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                  {done ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                  {s.label}
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-6 max-w-4xl mx-auto">
        {/* ── Step 0: Client & Route ── */}
        {step === 0 && (
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><User className="w-4 h-4 text-blue-500" />Client Details</h3>
              <div className="grid grid-cols-3 gap-3">
                {masterDataStore.getActiveCustomers().map(c => (
                  <button key={c.id} onClick={() => update({ clientId: c.id, clientName: c.name, clientGSTIN: c.gstin })}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${form.clientId === c.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                    <div className="font-medium text-sm text-gray-800">{c.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{c.gstin}</div>
                  </button>
                ))}
              </div>
              {form.clientId && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Client rate card: {
                    (ptlStore.findZoneRateCardForClient(form.clientId) ? 'Zone rate card found' :
                     ptlStore.findClientRateCard(form.clientId) ? 'Slab rate card found' :
                     'No rate card — charges will be calculated manually')
                  }
                </div>
              )}
            </Card>

            <div className="grid grid-cols-2 gap-4">
              {/* Pickup */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-green-500" />Pickup Details</h3>
                <div className="space-y-3">
                  <textarea value={form.pickupAddress} onChange={e => update({ pickupAddress: e.target.value })} placeholder="Full pickup address" rows={2}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={form.pickupCity} onChange={e => { update({ pickupCity: e.target.value, pickupState: CITY_STATE_MAP[e.target.value] ?? '' }); }} placeholder="City"
                      className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input value={form.pickupPincode} onChange={e => update({ pickupPincode: e.target.value })} placeholder="Pincode"
                      className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <input value={form.pickupState} onChange={e => update({ pickupState: e.target.value })} placeholder="State"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={form.pickupContact} onChange={e => update({ pickupContact: e.target.value })} placeholder="Contact person"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={form.pickupPhone} onChange={e => update({ pickupPhone: e.target.value })} placeholder="Phone"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {originHub && <div className="text-xs text-green-600 flex items-center gap-1"><Building2 className="w-3 h-3" />Hub: {originHub.name}</div>}
                  {isODAPickup && <div className="text-xs text-amber-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />ODA Pickup — surcharge applies</div>}
                </div>
              </Card>

              {/* Delivery */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-red-500" />Delivery Details</h3>
                <div className="space-y-3">
                  <textarea value={form.deliveryAddress} onChange={e => update({ deliveryAddress: e.target.value })} placeholder="Full delivery address" rows={2}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={form.deliveryCity} onChange={e => { update({ deliveryCity: e.target.value, deliveryState: CITY_STATE_MAP[e.target.value] ?? '' }); }} placeholder="City"
                      className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input value={form.deliveryPincode} onChange={e => update({ deliveryPincode: e.target.value })} placeholder="Pincode"
                      className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <input value={form.deliveryState} onChange={e => update({ deliveryState: e.target.value })} placeholder="State"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={form.deliveryContact} onChange={e => update({ deliveryContact: e.target.value })} placeholder="Contact person"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={form.deliveryPhone} onChange={e => update({ deliveryPhone: e.target.value })} placeholder="Phone"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {destHub && <div className="text-xs text-green-600 flex items-center gap-1"><Building2 className="w-3 h-3" />Hub: {destHub.name}</div>}
                  {isODADelivery && <div className="text-xs text-amber-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />ODA Delivery — surcharge applies</div>}
                </div>
              </Card>
            </div>
            {isInterstate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700 flex items-center gap-2">
                <Info className="w-4 h-4" /> Interstate shipment — IGST will apply on invoice
              </div>
            )}
          </div>
        )}

        {/* ── Step 1: Cargo ── */}
        {step === 1 && (
          <div className="space-y-4">
            <Card className="p-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Commodity Type *</label>
                  <select value={form.commodityType} onChange={e => update({ commodityType: e.target.value })}
                    className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!form.commodityType ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                    <option value="">Select commodity...</option>
                    {COMMODITY_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
                  <input value={form.commodityDescription} onChange={e => update({ commodityDescription: e.target.value })} placeholder="Brief description"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Declared Value (₹) *</label>
                  <input type="number" value={form.declaredValue || ''} onChange={e => update({ declaredValue: Number(e.target.value) })} placeholder="0"
                    className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${form.declaredValue <= 0 ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                  {form.declaredValue >= 50000 && !form.eWayBillNumber && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />eWay Bill required for ₹50,000+</p>
                  )}
                </div>
              </div>

              {/* Pieces */}
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Cargo Pieces</h4>
              <div className="space-y-2 mb-3">
                <div className="grid grid-cols-7 gap-2 text-xs font-medium text-gray-500 px-1">
                  <span>L (cm)</span><span>W (cm)</span><span>H (cm)</span>
                  <span className="text-red-500 font-semibold">Wt (kg) *</span>
                  <span>Qty *</span>
                  <span className="col-span-2">Vol. Wt (kg)</span>
                </div>
                {form.pieces.map((p) => {
                  const volWt = ((p.length * p.width * p.height) / 28316.8) * (weightCalc.volumetricFactor) * p.quantity;
                  return (
                    <div key={p.id} className="grid grid-cols-7 gap-2 items-center">
                      {(['length', 'width', 'height', 'weight'] as const).map(f => (
                        <input key={f} type="number" min="0" value={(p[f] as number) || ''}
                          onChange={e => updatePiece(p.id, f, Number(e.target.value))}
                          className={`text-sm border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 ${f === 'weight' && p.weight <= 0 ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                      ))}
                      <input type="number" min="1" value={p.quantity || ''}
                        onChange={e => updatePiece(p.id, 'quantity', Number(e.target.value))}
                        className={`text-sm border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 ${p.quantity <= 0 ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                      <div className="text-sm font-medium text-gray-700">{volWt.toFixed(1)}</div>
                      <button onClick={() => form.pieces.length > 1 && removePiece(p.id)} className="text-gray-300 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button onClick={addPiece} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                <Plus className="w-4 h-4" /> Add another piece type
              </button>

              {/* Weight summary */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg grid grid-cols-4 gap-3">
                {[
                  { label: 'Total Pieces', value: weightCalc.totalPieces },
                  { label: 'Actual Weight', value: `${weightCalc.actualWeight.toFixed(1)} kg` },
                  { label: 'Volumetric Weight', value: `${weightCalc.volumetricWeight.toFixed(1)} kg` },
                  { label: 'Chargeable Weight', value: `${weightCalc.chargeableWeight.toFixed(1)} kg`, highlight: true },
                ].map(item => (
                  <div key={item.label} className={`text-center p-2 rounded ${item.highlight ? 'bg-blue-50 border border-blue-200' : ''}`}>
                    <div className={`text-lg font-bold ${item.highlight ? 'text-blue-700' : 'text-gray-800'}`}>{item.value}</div>
                    <div className="text-xs text-gray-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Special Handling */}
            <Card className="p-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Special Handling Requirements</h4>
              <div className="flex flex-wrap gap-2">
                {SPECIAL_HANDLING_OPTIONS.map(opt => {
                  const selected = form.specialHandling.includes(opt.id);
                  return (
                    <button key={opt.id} onClick={() => update({ specialHandling: selected ? form.specialHandling.filter(s => s !== opt.id) : [...form.specialHandling, opt.id] })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selected ? 'bg-amber-100 border-amber-400 text-amber-700' : 'bg-white border-gray-200 text-gray-600 hover:border-amber-300'}`}>
                      {selected && '✓ '}{opt.label}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* ── Step 2: Compliance ── */}
        {step === 2 && (
          <Card className="p-6">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" />eWay Bill</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">eWay Bill Number</label>
                    <input value={form.eWayBillNumber} onChange={e => update({ eWayBillNumber: e.target.value })} placeholder="EWB-XXXXXXXXXXXX"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">eWay Bill Expiry</label>
                    <input type="date" value={form.eWayBillExpiry} onChange={e => update({ eWayBillExpiry: e.target.value })}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  {form.declaredValue >= 50000 && !form.eWayBillNumber && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> eWay Bill required for declared value ≥ ₹50,000
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-green-500" />Insurance & Other</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Transit Insurance Number</label>
                    <input value={form.transitInsuranceNumber} onChange={e => update({ transitInsuranceNumber: e.target.value })} placeholder="INS-XXXXXXXX"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">HS Code (optional)</label>
                    <input value={form.hsCode} onChange={e => update({ hsCode: e.target.value })} placeholder="e.g., 8471.30"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-500" />Dates</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Pickup Date *</label>
                    <input type="date" value={form.pickupDate} onChange={e => update({ pickupDate: e.target.value })}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Promised Delivery Date *</label>
                    <input type="date" value={form.promisedDeliveryDate} onChange={e => update({ promisedDeliveryDate: e.target.value })}
                      min={form.pickupDate}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {form.pickupCity && form.deliveryCity && (() => {
                      const config = ptlStore.getConfig();
                      const days = config.transitSLA[form.pickupCity]?.[form.deliveryCity];
                      return days ? <p className="text-xs text-blue-600 mt-1">Standard SLA: {days} days for this lane</p> : null;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ── Step 3: Service Options ── */}
        {step === 3 && (
          <Card className="p-6 space-y-5">
            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
              <div className="flex gap-3">
                {(['Normal', 'Urgent', 'Critical'] as const).map(p => {
                  const colors = { Normal: 'border-gray-300 bg-gray-50 text-gray-700', Urgent: 'border-amber-400 bg-amber-50 text-amber-700', Critical: 'border-red-400 bg-red-50 text-red-700' };
                  return (
                    <button key={p} onClick={() => update({ priority: p })}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${form.priority === p ? colors[p] : 'border-gray-200 bg-white text-gray-400'}`}>
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Type</label>
              <div className="flex gap-3">
                {(['Prepaid', 'To-Pay', 'COD'] as const).map(pt => (
                  <button key={pt} onClick={() => update({ paymentType: pt })}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${form.paymentType === pt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-400'}`}>
                    {pt}
                  </button>
                ))}
              </div>
              {form.paymentType === 'COD' && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">COD Amount (₹)</label>
                  <input type="number" value={form.codAmount || ''} onChange={e => update({ codAmount: Number(e.target.value) })}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              {[
                { field: 'daccApplied', label: 'DACC (Delivery Address Change Charge)', desc: 'Applies when consignee requests address change' },
                { field: 'appointmentDelivery', label: 'Appointment Delivery', desc: 'Consignee requires pre-scheduled delivery time slot' },
              ].map(t => (
                <div key={t.field} className={`flex items-start justify-between p-3 rounded-lg border ${(form as Record<string, unknown>)[t.field] ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                  <div>
                    <div className="text-sm font-medium text-gray-700">{t.label}</div>
                    <div className="text-xs text-gray-400">{t.desc}</div>
                  </div>
                  <button onClick={() => update({ [t.field]: !(form as Record<string, unknown>)[t.field] } as Partial<BookingFormState>)}
                    className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${(form as Record<string, unknown>)[t.field] ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span className={`inline-block w-3 h-3 bg-white rounded-full shadow transform transition-transform mt-1 ${(form as Record<string, unknown>)[t.field] ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
              {form.appointmentDelivery && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Appointment Date & Time</label>
                  <input type="datetime-local" value={form.appointmentDatetime} onChange={e => update({ appointmentDatetime: e.target.value })}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ── Step 4: Fleet Assignment ── */}
        {step === 4 && (
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Fleet Model</h3>
              <div className="grid grid-cols-4 gap-3">
                {([
                  { model: 'Own' as FleetModel, desc: 'Company-owned vehicle' },
                  { model: 'Leased' as FleetModel, desc: 'Long-term leased vehicle' },
                  { model: 'Market' as FleetModel, desc: 'Spot-hired vehicle / broker' },
                  { model: 'Carrier' as FleetModel, desc: '3PL vendor carrier' },
                ]).map(({ model, desc }) => (
                  <button key={model} onClick={() => update({ fleetModel: model })}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${form.fleetModel === model ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                    <div className="font-medium text-sm text-gray-800">{model}</div>
                    <div className="text-xs text-gray-400 mt-1">{desc}</div>
                  </button>
                ))}
              </div>
            </Card>

            {(form.fleetModel === 'Market' || form.fleetModel === 'Carrier') && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Carrier Selection</h3>
                <div className="space-y-2 mb-3">
                  {ptlStore.getCarriers().filter(c => c.status === 'Active').map(c => {
                    const vrc = ptlStore.findVendorRateCard(c.id, form.pickupCity, form.deliveryCity);
                    return (
                      <button key={c.id} onClick={() => update({ carrierVendorId: c.id, carrierVendorName: c.name, agreedCarrierRate: vrc?.baseRate ?? 0 })}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${form.carrierVendorId === c.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm text-gray-800">{c.name}</span>
                            <span className="ml-2 text-xs text-gray-400">{c.vendorType}</span>
                            {c.amsVendorId && <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">AMS Linked</span>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{c.performanceScore}</span>
                            <span>{c.onTimePercent}% OTP</span>
                            {vrc ? <span className="text-green-600 font-medium">₹{vrc.baseRate}/kg</span> : <span className="text-gray-400">No rate card</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {form.carrierVendorId && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Agreed Carrier Rate (₹)</label>
                    <input type="number" value={form.agreedCarrierRate || ''} onChange={e => update({ agreedCarrierRate: Number(e.target.value) })}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40" />
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* ── Step 5: Rate Summary ── */}
        {step === 5 && (
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><IndianRupee className="w-4 h-4 text-green-500" />Client Charges (Revenue)</h3>
              {rateResult ? (
                <div className="space-y-2">
                  {[
                    { label: 'Base Freight', value: rateResult.breakdown.freight },
                    { label: 'ODA Charge', value: rateResult.breakdown.oda },
                    { label: 'FOV (Insurance)', value: rateResult.breakdown.fov },
                    { label: 'Docket Charge', value: rateResult.breakdown.docket },
                    { label: 'Fuel Surcharge', value: rateResult.breakdown.fuel },
                    { label: 'COD Charge', value: rateResult.breakdown.cod },
                    { label: 'DACC', value: rateResult.breakdown.dacc },
                    { label: 'Appointment', value: rateResult.breakdown.appointment },
                    { label: 'Holiday Surcharge', value: rateResult.breakdown.holiday },
                  ].filter(i => i.value && i.value > 0).map(item => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-medium text-gray-800">₹{item.value!.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                    <span>Total Client Charges</span>
                    <span className="text-green-700 text-lg">₹{rateResult.totalRevenue.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-400">Rate card: {rateResult.rateCardLane}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                  No rate card found for {form.clientName || 'selected client'} on this lane.
                  <br />Charges will need to be set manually.
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Truck className="w-4 h-4 text-blue-500" />Cost Side</h3>
              {(form.fleetModel === 'Market' || form.fleetModel === 'Carrier') ? (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Carrier: {form.carrierVendorName || '—'}</span>
                  </div>
                  {carrierVendorRate && (
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Rate Card</span>
                      <span>₹{carrierVendorRate.baseRate}/{carrierVendorRate.rateType === 'Per KG' ? 'kg' : 'trip'}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                    <span>Agreed Carrier Rate</span>
                    <span className="text-blue-700 text-lg">₹{(form.agreedCarrierRate || 0).toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  <div className="text-gray-700 font-medium mb-2">{form.fleetModel} Fleet</div>
                  <p className="text-xs text-gray-400">Vehicle: {form.assignedVehiclePlate || 'Not assigned'}</p>
                  <p className="text-xs text-gray-400 mt-1">Driver: {form.assignedDriverName || 'Not assigned'}</p>
                  <p className="text-xs text-gray-400 mt-3">Own fleet costs (fuel, driver, toll, maintenance) will be recorded in the Fleet Ledger post-delivery.</p>
                </div>
              )}
              {rateResult && (form.fleetModel === 'Market' || form.fleetModel === 'Carrier') && form.agreedCarrierRate > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-xs text-gray-500">Estimated Margin</div>
                  <div className={`text-xl font-bold ${rateResult.totalRevenue - form.agreedCarrierRate >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    ₹{(rateResult.totalRevenue - form.agreedCarrierRate).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {rateResult.totalRevenue > 0 ? Math.round(((rateResult.totalRevenue - form.agreedCarrierRate) / rateResult.totalRevenue) * 100) : 0}% margin
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── Step 6: Review & Confirm ── */}
        {step === 6 && (
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Booking Summary</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                {[
                  { label: 'Client', value: form.clientName },
                  { label: 'Fleet Model', value: form.fleetModel },
                  { label: 'Pickup', value: `${form.pickupAddress}, ${form.pickupCity}` },
                  { label: 'Carrier', value: form.carrierVendorName || form.assignedVehiclePlate || '—' },
                  { label: 'Delivery', value: `${form.deliveryAddress}, ${form.deliveryCity}` },
                  { label: 'Origin Hub', value: originHub?.name ?? '—' },
                  { label: 'Commodity', value: form.commodityType },
                  { label: 'Destination Hub', value: destHub?.name ?? '—' },
                  { label: 'Chargeable Wt', value: `${weightCalc.chargeableWeight.toFixed(1)} kg` },
                  { label: 'Pickup Date', value: form.pickupDate },
                  { label: 'Declared Value', value: `₹${form.declaredValue.toLocaleString()}` },
                  { label: 'Promised Delivery', value: form.promisedDeliveryDate },
                  { label: 'Priority', value: form.priority },
                  { label: 'Payment Type', value: form.paymentType },
                  { label: 'Total Charges', value: `₹${(rateResult?.totalRevenue ?? 0).toLocaleString()}` },
                  { label: 'eWay Bill', value: form.eWayBillNumber || 'Not provided' },
                ].map(item => (
                  <div key={item.label} className="flex">
                    <span className="text-gray-500 w-36 flex-shrink-0">{item.label}</span>
                    <span className="font-medium text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
              {form.specialHandling.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {form.specialHandling.map(h => <Badge key={h} color="amber">{h}</Badge>)}
                </div>
              )}
            </Card>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Remarks (optional)</label>
              <textarea value={form.remarks} onChange={e => update({ remarks: e.target.value })} rows={3} placeholder="Any additional notes..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
        )}

        {/* Nav buttons */}
        {step === 1 && cargoValidationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-1">Complete the following to continue:</p>
              <ul className="space-y-0.5">
                {cargoValidationErrors.map(e => (
                  <li key={e} className="text-xs text-amber-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mt-4">
          <button onClick={() => step > 0 ? setStep(step - 1) : setView('list')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm">
            <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Cancel' : 'Back'}
          </button>

          {step < STEPS.length - 1 ? (
            <button onClick={() => canProceed() && setStep(step + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
              <Check className="w-4 h-4" /> Confirm Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
