import React, { useState, useEffect, useMemo } from 'react';
import {
  IndianRupee, FileText, TrendingUp, TrendingDown, CheckCircle,
  Clock, AlertTriangle, Plus, Search, Filter, Download,
  Send, CreditCard, BarChart2, ChevronDown, X, Save,
  Package, Truck, Users, ArrowRight, Percent
} from 'lucide-react';
import { ptlStore } from '../../services/ptlStore';
import type { PTLDocket, PTLCarrierVendor } from '../../services/ptlTypes';
import { getDocketRevenue, getDocketCost, calculateMargin } from '../../services/ptlBillingEngine';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) { return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`; }
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }

const INV_STATUS_COLOR: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Sent: 'bg-blue-100 text-blue-700',
  Paid: 'bg-green-100 text-green-700',
  Overdue: 'bg-red-100 text-red-700',
};

const PAYMENT_MODE = ['Bank Transfer (NEFT/RTGS)', 'Bank Transfer (IMPS)', 'Cheque', 'UPI', 'Cash'];

// ─── Invoice Status Badge ─────────────────────────────────────────────────────

function InvBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${INV_STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <div className={`rounded-xl p-4 flex items-center gap-4 ${color}`}>
      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Create Invoice Modal ─────────────────────────────────────────────────────

function CreateInvoiceModal({
  dockets, onConfirm, onClose
}: { dockets: PTLDocket[]; onConfirm: (ids: string[]) => void; onClose: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setSelected(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const toggleAll = () => setSelected(s => s.size === dockets.length ? new Set() : new Set(dockets.map(d => d.id)));

  const totalSelected = dockets.filter(d => selected.has(d.id)).reduce((s, d) => s + getDocketRevenue(d), 0);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="font-semibold text-gray-900">Create Customer Invoices</h3>
            <p className="text-xs text-gray-400 mt-0.5">Select delivered dockets to invoice</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="p-3 w-10">
                  <input type="checkbox" checked={selected.size === dockets.length && dockets.length > 0}
                    onChange={toggleAll} className="rounded" />
                </th>
                {['Docket', 'Client', 'Route', 'Weight', 'Revenue', 'Date'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-3 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {dockets.map(d => (
                <tr key={d.id} className={`hover:bg-gray-50 cursor-pointer ${selected.has(d.id) ? 'bg-blue-50' : ''}`}
                  onClick={() => toggle(d.id)}>
                  <td className="p-3">
                    <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggle(d.id)} className="rounded" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-gray-900">{d.docketNumber}</div>
                    {d.lrNumber && <div className="text-xs text-gray-400">{d.lrNumber}</div>}
                  </td>
                  <td className="px-3 py-3 text-gray-700">{d.clientName}</td>
                  <td className="px-3 py-3 text-xs text-gray-500">
                    {d.pickupCity} → {d.deliveryCity}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{d.chargeableWeight}kg</td>
                  <td className="px-3 py-3 font-medium text-gray-900">{fmt(getDocketRevenue(d))}</td>
                  <td className="px-3 py-3 text-xs text-gray-400">{d.actualDeliveryDate || d.bookingDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-5 border-t flex items-center justify-between">
          <div className="text-sm">
            <span className="text-gray-500">{selected.size} docket(s) selected · </span>
            <span className="font-semibold text-gray-900">{fmt(totalSelected)}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={() => selected.size > 0 && onConfirm(Array.from(selected))}
              disabled={selected.size === 0}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 flex items-center gap-2"
            >
              <Send size={14} /> Create {selected.size > 0 ? `${selected.size} Invoice${selected.size > 1 ? 's' : ''}` : 'Invoices'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────

function RecordPaymentModal({
  carrier, amount, docketIds, onConfirm, onClose
}: {
  carrier: PTLCarrierVendor; amount: number; docketIds: string[];
  onConfirm: (mode: string, ref: string, isAdvance: boolean) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState(PAYMENT_MODE[0]);
  const [ref, setRef] = useState('');
  const [isAdvance, setIsAdvance] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold text-gray-900">Record Carrier Payment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-sm text-gray-500 mb-1">Carrier</div>
            <div className="font-semibold text-gray-900">{carrier.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{docketIds.length} docket(s)</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="text-xs text-blue-600 mb-1">Amount to Pay</div>
            <div className="text-2xl font-bold text-blue-700">{fmt(amount)}</div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Payment Mode</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={mode}
              onChange={e => setMode(e.target.value)}>
              {PAYMENT_MODE.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Transaction Reference / Cheque No.</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={ref}
              onChange={e => setRef(e.target.value)} placeholder="UTR / Cheque number" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="adv" checked={isAdvance} onChange={e => setIsAdvance(e.target.checked)} className="rounded" />
            <label htmlFor="adv" className="text-sm text-gray-600">Record as Advance (balance pending)</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(mode, ref, isAdvance)}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <Save size={14} /> Record Payment
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Charge Breakdown Tooltip ─────────────────────────────────────────────────

function ChargeRow({ label, value }: { label: string; value: number }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-xs py-0.5">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-700">{fmt(value)}</span>
    </div>
  );
}

function ChargeBreakdown({ d }: { d: PTLDocket }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
        {fmt(getDocketRevenue(d))} <ChevronDown size={10} className={open ? 'rotate-180' : ''} />
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-20 bg-white border rounded-xl shadow-lg p-3 w-56">
          <ChargeRow label="Base Freight" value={d.baseFreightCharge} />
          <ChargeRow label="ODA Charge" value={d.odaCharge} />
          <ChargeRow label="FOV Charge" value={d.fovCharge} />
          <ChargeRow label="Docket Charge" value={d.docketCharge} />
          <ChargeRow label="Fuel Surcharge" value={d.fuelSurcharge} />
          <ChargeRow label="COD Charge" value={d.codCharge || 0} />
          <ChargeRow label="DACC Charge" value={d.daccChargeAmount || 0} />
          <ChargeRow label="Appointment" value={d.appointmentCharge || 0} />
          <ChargeRow label="Demurrage" value={d.demurrageCharge || 0} />
          <ChargeRow label="Redelivery" value={d.redeliveryChargeAmount || 0} />
          <div className="border-t mt-1 pt-1 flex justify-between text-xs font-semibold">
            <span>Total</span><span>{fmt(getDocketRevenue(d))}</span>
          </div>
          <button onClick={() => setOpen(false)} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500">
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type BillingTab = 'revenue' | 'cost' | 'margin';

interface InvoiceRecord {
  docketIds: string[];
  clientName: string;
  totalRevenue: number;
  invoiceNumber: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  createdAt: string;
  id: string;
}

const INV_STORE_KEY = 'ptl_invoices_local_v1';
const PAYMENT_STORE_KEY = 'ptl_payments_local_v1';

interface PaymentRecord {
  id: string; carrierId: string; carrierName: string;
  docketIds: string[]; amount: number;
  mode: string; reference: string; isAdvance: boolean;
  paidAt: string;
}

function loadInvoices(): InvoiceRecord[] {
  try { return JSON.parse(localStorage.getItem(INV_STORE_KEY) || '[]'); } catch { return []; }
}
function saveInvoices(inv: InvoiceRecord[]) { localStorage.setItem(INV_STORE_KEY, JSON.stringify(inv)); }

function loadPayments(): PaymentRecord[] {
  try { return JSON.parse(localStorage.getItem(PAYMENT_STORE_KEY) || '[]'); } catch { return []; }
}
function savePayments(p: PaymentRecord[]) { localStorage.setItem(PAYMENT_STORE_KEY, JSON.stringify(p)); }

let invSeq = 100;

export default function PTLBilling() {
  const [activeTab, setActiveTab] = useState<BillingTab>('revenue');
  const [dockets, setDockets] = useState<PTLDocket[]>([]);
  const [carriers, setCarriers] = useState<PTLCarrierVendor[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Revenue tab filters
  const [revSearch, setRevSearch] = useState('');
  const [revStatus, setRevStatus] = useState('all');
  const [revClient, setRevClient] = useState('all');

  // Cost tab filters
  const [costCarrier, setCostCarrier] = useState('all');
  const [costFleet, setCostFleet] = useState('all');

  // Modals
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<{ carrier: PTLCarrierVendor; dockets: PTLDocket[] } | null>(null);

  useEffect(() => {
    const load = () => {
      setDockets(ptlStore.getDockets());
      setCarriers(ptlStore.getCarriers());
    };
    load();
    const unsub = ptlStore.subscribe(load);
    setInvoices(loadInvoices());
    setPayments(loadPayments());
    return unsub;
  }, []);

  // ── Derived Data ─────────────────────────────────────────────────────────────

  const deliveredDockets = dockets.filter(d => d.status === 'Delivered');

  // Invoiced docket IDs set
  const invoicedDocketIds = useMemo(() =>
    new Set(invoices.flatMap(i => i.docketIds)), [invoices]);

  // Dockets pending invoice
  const pendingInvoice = deliveredDockets.filter(d => !invoicedDocketIds.has(d.id));

  // All invoiced dockets for the revenue table
  const invoicedDockets = deliveredDockets.filter(d => invoicedDocketIds.has(d.id));

  // Revenue table (pending + invoiced)
  const revenueDockets = [...pendingInvoice, ...invoicedDockets];
  const filteredRevenueDockets = revenueDockets.filter(d => {
    const q = revSearch.toLowerCase();
    const matchSearch = !q || d.docketNumber.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q);
    const matchClient = revClient === 'all' || d.clientId === revClient;
    return matchSearch && matchClient;
  });

  // Cost: group by carrier (for Market/Carrier), rest is own fleet
  const carrierDockets = useMemo(() => {
    const groups: Record<string, PTLDocket[]> = {};
    deliveredDockets.forEach(d => {
      if (d.fleetModel === 'Market' || d.fleetModel === 'Carrier') {
        const key = d.carrierVendorId || '__unassigned';
        groups[key] = [...(groups[key] || []), d];
      }
    });
    return groups;
  }, [deliveredDockets]);

  const ownFleetDockets = deliveredDockets.filter(
    d => d.fleetModel === 'Own' || d.fleetModel === 'Leased'
  );

  const paidDocketIds = useMemo(() =>
    new Set(payments.flatMap(p => p.docketIds)), [payments]);

  // KPIs
  const totalRevenue = deliveredDockets.reduce((s, d) => s + getDocketRevenue(d), 0);
  const totalCost = deliveredDockets.reduce((s, d) => s + getDocketCost(d), 0);
  const { grossMargin, marginPercent } = calculateMargin(totalRevenue, totalCost);
  const pendingInvoiceCount = pendingInvoice.length;
  const pendingPaymentCount = deliveredDockets.filter(
    d => (d.fleetModel === 'Market' || d.fleetModel === 'Carrier') && !paidDocketIds.has(d.id)
  ).length;

  const clients = useMemo(() => {
    const map: Record<string, string> = {};
    dockets.forEach(d => { map[d.clientId] = d.clientName; });
    return Object.entries(map);
  }, [dockets]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleCreateInvoices = (docketIds: string[]) => {
    invSeq++;
    const selectedDockets = dockets.filter(d => docketIds.includes(d.id));
    const byClient: Record<string, PTLDocket[]> = {};
    selectedDockets.forEach(d => {
      byClient[d.clientId] = [...(byClient[d.clientId] || []), d];
    });

    const newInvoices: InvoiceRecord[] = Object.entries(byClient).map(([, docs]) => ({
      id: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      docketIds: docs.map(d => d.id),
      clientName: docs[0].clientName,
      totalRevenue: docs.reduce((s, d) => s + getDocketRevenue(d), 0),
      invoiceNumber: `PTL-INV-2025-${String(invSeq++).padStart(4, '0')}`,
      status: 'Draft',
      createdAt: new Date().toISOString().split('T')[0],
    }));

    // Push to finance bridge
    docs_loop: for (const id of docketIds) {
      const d = dockets.find(x => x.id === id);
      if (d) {
        ptlStore.pushFinanceRevenue({
          docketId: d.id, docketNumber: d.docketNumber,
          clientId: d.clientId, clientName: d.clientName,
          pickupCity: d.pickupCity, deliveryCity: d.deliveryCity,
          chargeBreakdown: {
            freight: d.baseFreightCharge, oda: d.odaCharge, fov: d.fovCharge,
            docket: d.docketCharge, fuel: d.fuelSurcharge,
            cod: d.codCharge, dacc: d.daccChargeAmount, appointment: d.appointmentCharge,
            demurrage: d.demurrageCharge, redelivery: d.redeliveryChargeAmount,
          },
          totalRevenue: getDocketRevenue(d),
          chargeableWeight: d.chargeableWeight, pieces: d.totalPieces,
          deliveryDate: d.actualDeliveryDate || d.bookingDate,
          isInterstate: d.isInterstate, clientGSTIN: d.clientGSTIN,
        } as any);
      }
      continue docs_loop;
    }

    const updated = [...invoices, ...newInvoices];
    saveInvoices(updated);
    setInvoices(updated);
    setShowCreateInvoice(false);
  };

  const handleInvoiceStatus = (id: string, status: InvoiceRecord['status']) => {
    const updated = invoices.map(inv => inv.id === id ? { ...inv, status } : inv);
    saveInvoices(updated);
    setInvoices(updated);
  };

  const handleRecordPayment = (mode: string, ref: string, isAdvance: boolean) => {
    if (!paymentTarget) return;
    const { carrier, dockets: pd } = paymentTarget;
    const amount = pd.reduce((s, d) => s + getDocketCost(d), 0);
    const newPayment: PaymentRecord = {
      id: `PAY-${Date.now()}`, carrierId: carrier.id, carrierName: carrier.name,
      docketIds: pd.map(d => d.id), amount, mode, reference: ref, isAdvance,
      paidAt: new Date().toISOString().split('T')[0],
    };

    // Push to finance bridge
    pd.forEach(d => {
      ptlStore.pushFinanceCost({
        docketId: d.id, docketNumber: d.docketNumber,
        fleetModel: d.fleetModel, vendorId: carrier.id, vendorName: carrier.name,
        costBreakdown: { freight: d.agreedCarrierRate },
        totalCost: getDocketCost(d), advancePaid: isAdvance ? amount : undefined,
      });
    });

    const updated = [...payments, newPayment];
    savePayments(updated);
    setPayments(updated);
    setPaymentTarget(null);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">PTL Billing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Revenue, carrier payables, and margin management</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingInvoice.length > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg text-xs">
              <AlertTriangle size={13} />
              {pendingInvoice.length} docket{pendingInvoice.length > 1 ? 's' : ''} pending invoice
            </div>
          )}
          <button
            onClick={() => setShowCreateInvoice(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 shadow-sm"
          >
            <Plus size={16} /> Create Invoices
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Revenue (Delivered)" value={fmt(totalRevenue)}
          sub={`${deliveredDockets.length} dockets`}
          icon={<IndianRupee size={18} className="text-blue-600" />} color="bg-blue-50" />
        <KpiCard label="Total Cost" value={fmt(totalCost)}
          sub={`Carrier + Fleet`}
          icon={<TrendingDown size={18} className="text-red-500" />} color="bg-red-50" />
        <KpiCard label="Gross Margin" value={fmt(grossMargin)}
          sub={fmtPct(marginPercent)}
          icon={<TrendingUp size={18} className="text-green-600" />} color="bg-green-50" />
        <KpiCard label="Pending Actions"
          value={`${pendingInvoiceCount + pendingPaymentCount}`}
          sub={`${pendingInvoiceCount} inv · ${pendingPaymentCount} pay`}
          icon={<AlertTriangle size={18} className="text-amber-600" />} color="bg-amber-50" />
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-6 bg-white border rounded-xl p-1 w-fit shadow-sm">
        {([
          ['revenue', 'Customer Billing', <IndianRupee size={14} />],
          ['cost', 'Carrier Payables', <Truck size={14} />],
          ['margin', 'Margin View', <BarChart2 size={14} />],
        ] as const).map(([id, label, icon]) => (
          <button key={id} onClick={() => setActiveTab(id as BillingTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* Tab: Customer Billing (Revenue) */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'revenue' && (
        <div className="space-y-4">
          {/* Invoices Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['Draft', 'Sent', 'Paid', 'Overdue'] as const).map(s => {
              const count = invoices.filter(i => i.status === s).length;
              const total = invoices.filter(i => i.status === s).reduce((x, i) => x + i.totalRevenue, 0);
              return (
                <div key={s} className="bg-white border rounded-xl p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <InvBadge status={s} />
                    <span className="text-lg font-bold text-gray-900">{count}</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-700">{fmt(total)}</div>
                  <div className="text-xs text-gray-400">Total value</div>
                </div>
              );
            })}
          </div>

          {/* Pending invoice alert */}
          {pendingInvoice.length > 0 && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <AlertTriangle size={16} className="text-amber-600" />
                <strong>{pendingInvoice.length}</strong> delivered docket{pendingInvoice.length > 1 ? 's have' : ' has'} not been invoiced yet.
                Total value: <strong>{fmt(pendingInvoice.reduce((s, d) => s + getDocketRevenue(d), 0))}</strong>
              </div>
              <button onClick={() => setShowCreateInvoice(true)}
                className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700">
                Invoice Now
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="pl-8 pr-3 py-2 border rounded-lg text-sm w-56 bg-white"
                placeholder="Search docket, client..." value={revSearch} onChange={e => setRevSearch(e.target.value)} />
            </div>
            <select className="border rounded-lg px-3 py-2 text-sm bg-white"
              value={revClient} onChange={e => setRevClient(e.target.value)}>
              <option value="all">All Clients</option>
              {clients.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
            <span className="text-xs text-gray-400 ml-auto">{filteredRevenueDockets.length} dockets</span>
          </div>

          {/* Revenue Table */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {['Docket', 'Client', 'Route', 'Weight', 'Payment Type', 'Revenue', 'Invoice Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRevenueDockets.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">No delivered dockets</td></tr>
                ) : filteredRevenueDockets.map(d => {
                  const inv = invoices.find(i => i.docketIds.includes(d.id));
                  return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{d.docketNumber}</div>
                        {d.lrNumber && <div className="text-xs text-gray-400">{d.lrNumber}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{d.clientName}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {d.pickupCity} → {d.deliveryCity}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{d.chargeableWeight}kg</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          d.paymentType === 'COD' ? 'bg-orange-100 text-orange-700' :
                          d.paymentType === 'Prepaid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>{d.paymentType}</span>
                      </td>
                      <td className="px-4 py-3">
                        <ChargeBreakdown d={d} />
                      </td>
                      <td className="px-4 py-3">
                        {inv ? (
                          <div>
                            <InvBadge status={inv.status} />
                            <div className="text-xs text-gray-400 mt-0.5">{inv.invoiceNumber}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 font-medium">Not Invoiced</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {inv ? (
                          <div className="flex items-center gap-1">
                            {inv.status === 'Draft' && (
                              <button onClick={() => handleInvoiceStatus(inv.id, 'Sent')}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                                Mark Sent
                              </button>
                            )}
                            {inv.status === 'Sent' && (
                              <button onClick={() => handleInvoiceStatus(inv.id, 'Paid')}
                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                                Mark Paid
                              </button>
                            )}
                          </div>
                        ) : (
                          <button onClick={() => setShowCreateInvoice(true)}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                            Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* Tab: Carrier Payables (Cost) */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'cost' && (
        <div className="space-y-6">
          {/* Carrier Groups */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Carrier Payables (Market / 3PL)</h3>
            {Object.keys(carrierDockets).length === 0 ? (
              <div className="bg-white border rounded-xl p-8 text-center text-gray-400 text-sm">
                No carrier dockets delivered yet
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(carrierDockets).map(([carrierId, cdocs]) => {
                  const carrier = carriers.find(c => c.id === carrierId);
                  const unpaid = cdocs.filter(d => !paidDocketIds.has(d.id));
                  const paid = cdocs.filter(d => paidDocketIds.has(d.id));
                  const totalCostGroup = cdocs.reduce((s, d) => s + getDocketCost(d), 0);
                  const paidAmount = paid.reduce((s, d) => s + getDocketCost(d), 0);
                  const balance = unpaid.reduce((s, d) => s + getDocketCost(d), 0);
                  if (!carrier) return null;
                  return (
                    <div key={carrierId} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                      {/* Carrier header */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Truck size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{carrier.name}</div>
                            <div className="text-xs text-gray-400">{carrier.vendorType} · {cdocs.length} dockets</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <div className="text-xs text-gray-400">Total Payable</div>
                            <div className="font-bold text-gray-900">{fmt(totalCostGroup)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Paid</div>
                            <div className="font-bold text-green-600">{fmt(paidAmount)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Balance</div>
                            <div className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-gray-400'}`}>{fmt(balance)}</div>
                          </div>
                          {unpaid.length > 0 && (
                            <button
                              onClick={() => setPaymentTarget({ carrier, dockets: unpaid })}
                              className="px-3 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 flex items-center gap-1"
                            >
                              <IndianRupee size={12} /> Pay Balance
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Docket rows */}
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50/50">
                            {['Docket', 'Route', 'Weight', 'Agreed Rate', 'Payment'].map(h => (
                              <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-2">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {cdocs.map(d => (
                            <tr key={d.id} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2.5">
                                <div className="font-medium text-xs text-gray-900">{d.docketNumber}</div>
                                <div className="text-xs text-gray-400">{d.actualDeliveryDate || d.bookingDate}</div>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-gray-500">
                                {d.pickupCity} → {d.deliveryCity}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-gray-600">{d.chargeableWeight}kg</td>
                              <td className="px-4 py-2.5 text-xs font-medium text-gray-900">
                                {fmt(d.agreedCarrierRate || getDocketCost(d))}
                              </td>
                              <td className="px-4 py-2.5">
                                {paidDocketIds.has(d.id) ? (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Paid</span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Pending</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Own/Leased Fleet Costs */}
          {ownFleetDockets.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Own / Leased Fleet Cost Allocation</h3>
              <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      {['Docket', 'Fleet Model', 'Route', 'Vehicle', 'Fuel', 'Driver', 'Toll', 'Total Cost', 'Status'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ownFleetDockets.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 text-sm">{d.docketNumber}</div>
                          <div className="text-xs text-gray-400">{d.actualDeliveryDate || d.bookingDate}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.fleetModel === 'Own' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {d.fleetModel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{d.pickupCity} → {d.deliveryCity}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{d.assignedVehiclePlate || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{d.ownFleetFuelCost ? fmt(d.ownFleetFuelCost) : '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{d.ownFleetDriverCost ? fmt(d.ownFleetDriverCost) : '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{d.ownFleetTollCost ? fmt(d.ownFleetTollCost) : '—'}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-900">
                          {fmt(getDocketCost(d))}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Allocated</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* Tab: Margin View */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'margin' && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-xs text-blue-600 mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-blue-700">{fmt(totalRevenue)}</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="text-xs text-red-600 mb-1">Total Cost</div>
              <div className="text-2xl font-bold text-red-700">{fmt(totalCost)}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-xs text-green-600 mb-1">Gross Margin</div>
              <div className="text-2xl font-bold text-green-700">{fmt(grossMargin)}</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <div className="text-xs text-purple-600 mb-1">Margin %</div>
              <div className={`text-2xl font-bold ${marginPercent >= 20 ? 'text-green-700' : marginPercent >= 10 ? 'text-amber-700' : 'text-red-700'}`}>
                {fmtPct(marginPercent)}
              </div>
            </div>
          </div>

          {/* Per-docket margin table */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">Docket-Level Margin</h3>
              <div className="text-xs text-gray-400">{deliveredDockets.length} delivered dockets</div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {['Docket', 'Client', 'Lane', 'Fleet', 'Revenue', 'Cost', 'Margin', 'Margin %'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {deliveredDockets.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">No delivered dockets yet</td></tr>
                ) : deliveredDockets.map(d => {
                  const rev = getDocketRevenue(d);
                  const cost = getDocketCost(d);
                  const margin = rev - cost;
                  const pct = rev > 0 ? (margin / rev) * 100 : 0;
                  return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{d.docketNumber}</div>
                        <div className="text-xs text-gray-400">{d.bookingDate}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-sm">{d.clientName}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{d.pickupCity} → {d.deliveryCity}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          d.fleetModel === 'Own' ? 'bg-blue-100 text-blue-700' :
                          d.fleetModel === 'Leased' ? 'bg-purple-100 text-purple-700' :
                          d.fleetModel === 'Market' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>{d.fleetModel}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-blue-700">{fmt(rev)}</td>
                      <td className="px-4 py-3 font-medium text-red-600">{fmt(cost)}</td>
                      <td className={`px-4 py-3 font-semibold ${margin >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {fmt(margin)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${pct >= 20 ? 'bg-green-500' : pct >= 10 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${pct >= 20 ? 'text-green-700' : pct >= 10 ? 'text-amber-700' : 'text-red-700'}`}>
                            {fmtPct(pct)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {deliveredDockets.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 border-t font-semibold">
                    <td colSpan={4} className="px-4 py-3 text-gray-700 text-sm">Total</td>
                    <td className="px-4 py-3 text-blue-700">{fmt(totalRevenue)}</td>
                    <td className="px-4 py-3 text-red-600">{fmt(totalCost)}</td>
                    <td className={`px-4 py-3 ${grossMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(grossMargin)}</td>
                    <td className="px-4 py-3 text-gray-700">{fmtPct(marginPercent)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Client breakdown */}
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Margin by Client</h3>
            <div className="space-y-3">
              {clients.map(([clientId, clientName]) => {
                const cDocs = deliveredDockets.filter(d => d.clientId === clientId);
                if (cDocs.length === 0) return null;
                const cRev = cDocs.reduce((s, d) => s + getDocketRevenue(d), 0);
                const cCost = cDocs.reduce((s, d) => s + getDocketCost(d), 0);
                const cMargin = cRev - cCost;
                const cPct = cRev > 0 ? (cMargin / cRev) * 100 : 0;
                return (
                  <div key={clientId} className="flex items-center gap-4">
                    <div className="w-32 truncate text-sm text-gray-700">{clientName}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 relative">
                      <div className="h-3 bg-blue-400 rounded-l-full" style={{ width: `${(cRev / totalRevenue) * 100}%` }} />
                      <div className="absolute inset-0 bg-red-400 rounded-l-full" style={{ width: `${(cCost / totalRevenue) * 100}%` }} />
                    </div>
                    <div className="w-24 text-right text-xs">
                      <div className="font-semibold text-gray-900">{fmt(cMargin)}</div>
                      <div className={`${cPct >= 20 ? 'text-green-600' : cPct >= 10 ? 'text-amber-600' : 'text-red-600'}`}>{fmtPct(cPct)}</div>
                    </div>
                    <div className="w-20 text-xs text-gray-400 text-right">{cDocs.length} dockets</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showCreateInvoice && (
        <CreateInvoiceModal
          dockets={pendingInvoice}
          onConfirm={handleCreateInvoices}
          onClose={() => setShowCreateInvoice(false)}
        />
      )}

      {paymentTarget && (
        <RecordPaymentModal
          carrier={paymentTarget.carrier}
          amount={paymentTarget.dockets.reduce((s, d) => s + getDocketCost(d), 0)}
          docketIds={paymentTarget.dockets.map(d => d.id)}
          onConfirm={handleRecordPayment}
          onClose={() => setPaymentTarget(null)}
        />
      )}
    </div>
  );
}
