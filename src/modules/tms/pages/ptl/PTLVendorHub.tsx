import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Star, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, XCircle, ChevronRight, Building2, Phone, Mail,
  CreditCard, FileText, Edit3, Trash2, Link2, BarChart2,
  Shield, Package, IndianRupee, Calendar, Filter, RefreshCw,
  MapPin, Truck, X, Save, Eye, Ban
} from 'lucide-react';
import { ptlStore } from '../../services/ptlStore';
import type {
  PTLCarrierVendor, PTLVendorRateCard, PTLDocket
} from '../../services/ptlTypes';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-gray-100 text-gray-600',
  Blacklisted: 'bg-red-100 text-red-700',
};

const VENDOR_TYPES = [
  'Individual Truck Owner',
  'Fleet Owner',
  'Transport Agency',
  'Broker',
];

const VEHICLE_TYPES = ['Tata Ace', '407', '14Ft', '18Ft', '22Ft', '32Ft', 'Container 20Ft', 'Container 40Ft'];
const RATE_TYPES: PTLVendorRateCard['rateType'][] = ['Per KG', 'Per Trip', 'Per CFT'];

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function ScoreBadge({ score }: { score?: number }) {
  if (score === undefined) return <span className="text-gray-400 text-xs">N/A</span>;
  const color = scoreColor(score);
  return <span className={`font-bold text-sm ${color}`}>{score.toFixed(0)}</span>;
}

function RateCardStatusBadge({ status }: { status: PTLVendorRateCard['status'] }) {
  const colors: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    Expired: 'bg-red-100 text-red-700',
    Draft: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

// ─── Add / Edit Carrier Modal ─────────────────────────────────────────────────

interface CarrierFormData {
  name: string; vendorType: PTLCarrierVendor['vendorType'];
  contactPerson: string; phone: string; email: string;
  gstIn: string; panNumber: string; bankAccount: string; ifscCode: string;
  amsVendorId: string; status: PTLCarrierVendor['status'];
}

const BLANK_CARRIER: CarrierFormData = {
  name: '', vendorType: 'Fleet Owner', contactPerson: '', phone: '', email: '',
  gstIn: '', panNumber: '', bankAccount: '', ifscCode: '', amsVendorId: '', status: 'Active',
};

function CarrierFormModal({
  initial, onSave, onClose
}: {
  initial?: PTLCarrierVendor;
  onSave: (data: CarrierFormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CarrierFormData>(
    initial
      ? {
          name: initial.name, vendorType: initial.vendorType,
          contactPerson: initial.contactPerson, phone: initial.phone,
          email: initial.email || '', gstIn: initial.gstIn || '',
          panNumber: initial.panNumber || '', bankAccount: initial.bankAccount || '',
          ifscCode: initial.ifscCode || '', amsVendorId: initial.amsVendorId || '',
          status: initial.status,
        }
      : BLANK_CARRIER
  );

  const set = (k: keyof CarrierFormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold text-gray-900 text-lg">
            {initial ? 'Edit Carrier' : 'Add New Carrier'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-5">
          {/* Basic Info */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Basic Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Carrier / Company Name *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.name}
                  onChange={e => set('name', e.target.value)} placeholder="e.g. Shree Ganesh Transport" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Vendor Type *</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.vendorType}
                  onChange={e => set('vendorType', e.target.value as PTLCarrierVendor['vendorType'])}>
                  {VENDOR_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Status</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.status}
                  onChange={e => set('status', e.target.value as PTLCarrierVendor['status'])}>
                  <option>Active</option><option>Inactive</option><option>Blacklisted</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Contact Person *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.contactPerson}
                  onChange={e => set('contactPerson', e.target.value)} placeholder="Name" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Phone *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.phone}
                  onChange={e => set('phone', e.target.value)} placeholder="+91 9XXXXXXXXX" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Email</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.email}
                  onChange={e => set('email', e.target.value)} placeholder="carrier@example.com" type="email" />
              </div>
            </div>
          </div>

          {/* Compliance */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Compliance & Banking</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">GSTIN</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.gstIn}
                  onChange={e => set('gstIn', e.target.value)} placeholder="22AAAAA0000A1Z5" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">PAN Number</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.panNumber}
                  onChange={e => set('panNumber', e.target.value)} placeholder="AAAAA0000A" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Bank Account</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.bankAccount}
                  onChange={e => set('bankAccount', e.target.value)} placeholder="Account number" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">IFSC Code</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.ifscCode}
                  onChange={e => set('ifscCode', e.target.value)} placeholder="HDFC0001234" />
              </div>
            </div>
          </div>

          {/* AMS Link */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">AMS Integration</p>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">AMS Vendor ID (link to existing AMS vendor)</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.amsVendorId}
                onChange={e => set('amsVendorId', e.target.value)} placeholder="AMS-V-XXXX (optional)" />
              <p className="text-xs text-gray-400 mt-1">
                If set, this carrier will appear with an AMS badge and vendor payables will sync to AMS Vendor Ledger.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => form.name && form.contactPerson && form.phone && onSave(form)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save size={14} /> {initial ? 'Save Changes' : 'Add Carrier'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Rate Card Form Modal ─────────────────────────────────────────────────────

interface RateCardFormData {
  originCity: string; destinationCity: string;
  vehicleType: string; capacityTons: number;
  rateType: PTLVendorRateCard['rateType']; baseRate: number; minimumCharge: number;
  validFrom: string; validTo: string; status: PTLVendorRateCard['status'];
}

const BLANK_RC: RateCardFormData = {
  originCity: '', destinationCity: '', vehicleType: 'Tata Ace', capacityTons: 1,
  rateType: 'Per KG', baseRate: 0, minimumCharge: 0,
  validFrom: new Date().toISOString().split('T')[0],
  validTo: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
  status: 'Active',
};

function RateCardFormModal({
  vendorId, vendorName, initial, onSave, onClose
}: {
  vendorId: string; vendorName: string;
  initial?: PTLVendorRateCard;
  onSave: (data: Omit<PTLVendorRateCard, 'id'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<RateCardFormData>(
    initial
      ? {
          originCity: initial.originCity, destinationCity: initial.destinationCity,
          vehicleType: initial.vehicleType, capacityTons: initial.capacityTons,
          rateType: initial.rateType, baseRate: initial.baseRate,
          minimumCharge: initial.minimumCharge, validFrom: initial.validFrom,
          validTo: initial.validTo, status: initial.status,
        }
      : BLANK_RC
  );

  const set = (k: keyof RateCardFormData, v: string | number) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="font-semibold text-gray-900">{initial ? 'Edit Rate Card' : 'New Rate Card'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Carrier: {vendorName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Origin City *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.originCity}
                onChange={e => set('originCity', e.target.value)} placeholder="Mumbai" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Destination City *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.destinationCity}
                onChange={e => set('destinationCity', e.target.value)} placeholder="Delhi" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Vehicle Type</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.vehicleType}
                onChange={e => set('vehicleType', e.target.value)}>
                {VEHICLE_TYPES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Capacity (Tons)</label>
              <input type="number" min="0.5" step="0.5" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.capacityTons} onChange={e => set('capacityTons', +e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Rate Type</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.rateType}
                onChange={e => set('rateType', e.target.value as PTLVendorRateCard['rateType'])}>
                {RATE_TYPES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Base Rate (₹)</label>
              <input type="number" min="0" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.baseRate} onChange={e => set('baseRate', +e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Minimum Charge (₹)</label>
              <input type="number" min="0" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.minimumCharge} onChange={e => set('minimumCharge', +e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Status</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.status}
                onChange={e => set('status', e.target.value as PTLVendorRateCard['status'])}>
                <option>Active</option><option>Draft</option><option>Expired</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Valid From</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.validFrom}
                onChange={e => set('validFrom', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Valid To</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.validTo}
                onChange={e => set('validTo', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => {
              if (!form.originCity || !form.destinationCity) return;
              onSave({ vendorId, vendorName, ...form });
            }}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save size={14} /> {initial ? 'Save Changes' : 'Create Rate Card'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Blacklist Confirm Modal ──────────────────────────────────────────────────

function BlacklistModal({
  carrier, onConfirm, onClose
}: { carrier: PTLCarrierVendor; onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Ban size={18} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Blacklist Carrier</h3>
            <p className="text-sm text-gray-500 mt-1">
              <strong>{carrier.name}</strong> will be blocked from all future docket assignments.
            </p>
          </div>
        </div>
        <div className="mb-5">
          <label className="text-sm text-gray-600 mb-2 block">Reason for blacklisting *</label>
          <textarea className="w-full border rounded-lg px-3 py-2 text-sm h-24 resize-none"
            value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Describe why this carrier is being blacklisted..." />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={() => reason && onConfirm(reason)}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
            Confirm Blacklist
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Carrier Detail Panel ─────────────────────────────────────────────────────

function PerformanceStat({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-xl font-bold ${good ? 'text-green-600' : 'text-amber-600'}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function CarrierDetailPanel({
  carrier, dockets, rateCards, onEdit, onBlacklist, onAddRateCard, onEditRateCard, onClose
}: {
  carrier: PTLCarrierVendor;
  dockets: PTLDocket[];
  rateCards: PTLVendorRateCard[];
  onEdit: () => void;
  onBlacklist: () => void;
  onAddRateCard: () => void;
  onEditRateCard: (rc: PTLVendorRateCard) => void;
  onClose: () => void;
}) {
  const carrierDockets = dockets.filter(d => d.carrierVendorId === carrier.id);
  const totalRevenue = carrierDockets.reduce((s, d) => s + (d.totalCarrierCost || 0), 0);
  const activeRateCards = rateCards.filter(rc => rc.vendorId === carrier.id && rc.status === 'Active');
  const allRateCards = rateCards.filter(rc => rc.vendorId === carrier.id);
  const activeDockets = carrierDockets.filter(d =>
    !['Delivered', 'RTO Completed'].includes(d.status)
  );

  return (
    <div className="fixed inset-0 bg-black/30 z-40 flex justify-end">
      <div className="w-full max-w-lg bg-white shadow-2xl h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b bg-gray-50 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Truck size={22} className="text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 text-lg">{carrier.name}</h3>
                {carrier.amsVendorId && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium flex items-center gap-1">
                    <Link2 size={10} /> AMS
                  </span>
                )}
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_COLOR[carrier.status]}`}>
                  {carrier.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">{carrier.vendorType}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-1"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Performance KPIs */}
          <div className="p-5 border-b">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Performance</p>
            <div className="grid grid-cols-4 gap-3 bg-gray-50 rounded-xl p-4">
              <PerformanceStat
                label="Score" value={carrier.performanceScore?.toFixed(0) || 'N/A'}
                good={(carrier.performanceScore || 0) >= 70} />
              <PerformanceStat
                label="On-Time %" value={carrier.onTimePercent ? `${carrier.onTimePercent}%` : 'N/A'}
                good={(carrier.onTimePercent || 0) >= 85} />
              <PerformanceStat
                label="Claim Rate" value={carrier.claimRate ? `${carrier.claimRate}%` : 'N/A'}
                good={(carrier.claimRate || 0) <= 2} />
              <PerformanceStat
                label="Avg Days" value={carrier.avgTransitDays?.toFixed(1) || 'N/A'}
                good={(carrier.avgTransitDays || 99) <= 3} />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-blue-700">{carrier.totalDockets || 0}</div>
                <div className="text-xs text-blue-600">Total Dockets</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-orange-700">{activeDockets.length}</div>
                <div className="text-xs text-orange-600">Active Now</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-green-700">₹{(totalRevenue / 1000).toFixed(0)}K</div>
                <div className="text-xs text-green-600">Total Payable</div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="p-5 border-b">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Contact Information</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users size={14} className="text-gray-400" />
                <span className="text-gray-700">{carrier.contactPerson}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-gray-400" />
                <span className="text-gray-700">{carrier.phone}</span>
              </div>
              {carrier.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-gray-400" />
                  <span className="text-gray-700">{carrier.email}</span>
                </div>
              )}
              {carrier.gstIn && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText size={14} className="text-gray-400" />
                  <span className="text-gray-500">GSTIN:</span>
                  <span className="text-gray-700 font-mono">{carrier.gstIn}</span>
                </div>
              )}
              {carrier.panNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard size={14} className="text-gray-400" />
                  <span className="text-gray-500">PAN:</span>
                  <span className="text-gray-700 font-mono">{carrier.panNumber}</span>
                </div>
              )}
              {carrier.amsVendorId && (
                <div className="flex items-center gap-2 text-sm">
                  <Link2 size={14} className="text-purple-400" />
                  <span className="text-gray-500">AMS Vendor:</span>
                  <span className="text-purple-700 font-medium">{carrier.amsVendorId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Rate Cards */}
          <div className="p-5 border-b">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase">Rate Cards ({activeRateCards.length} Active)</p>
              <button onClick={onAddRateCard}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Plus size={12} /> Add Rate Card
              </button>
            </div>
            {allRateCards.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                No rate cards. <button onClick={onAddRateCard} className="text-blue-500 hover:underline">Add one</button>
              </div>
            ) : (
              <div className="space-y-2">
                {allRateCards.map(rc => (
                  <div key={rc.id} className="border rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">
                          {rc.originCity} → {rc.destinationCity}
                        </span>
                        <RateCardStatusBadge status={rc.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{rc.vehicleType}</span>
                        <span>•</span>
                        <span>{rc.rateType}: ₹{rc.baseRate}</span>
                        <span>•</span>
                        <span>Min: ₹{rc.minimumCharge}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Valid: {rc.validFrom} → {rc.validTo}
                      </div>
                    </div>
                    <button onClick={() => onEditRateCard(rc)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Edit3 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Dockets */}
          <div className="p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Active Dockets ({activeDockets.length})</p>
            {activeDockets.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No active dockets</p>
            ) : (
              <div className="space-y-2">
                {activeDockets.slice(0, 5).map(d => (
                  <div key={d.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-800">{d.docketNumber}</span>
                      <span className="text-xs text-gray-500">{d.status}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {d.pickupCity} → {d.deliveryCity} · {d.chargeableWeight}kg · ₹{d.agreedCarrierRate?.toLocaleString()}
                    </div>
                  </div>
                ))}
                {activeDockets.length > 5 && (
                  <p className="text-xs text-gray-400 text-center">+{activeDockets.length - 5} more dockets</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-gray-50 flex items-center gap-2">
          <button onClick={onEdit}
            className="flex-1 py-2 text-sm border rounded-lg text-gray-700 hover:bg-white flex items-center justify-center gap-2">
            <Edit3 size={14} /> Edit
          </button>
          {carrier.status !== 'Blacklisted' && (
            <button onClick={onBlacklist}
              className="flex-1 py-2 text-sm border border-red-200 rounded-lg text-red-600 hover:bg-red-50 flex items-center justify-center gap-2">
              <Ban size={14} /> Blacklist
            </button>
          )}
          {carrier.status === 'Blacklisted' && (
            <button className="flex-1 py-2 text-sm border border-green-200 rounded-lg text-green-600 hover:bg-green-50 flex items-center justify-center gap-2">
              <CheckCircle size={14} /> Reactivate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Unassigned Dockets Panel ─────────────────────────────────────────────────

function UnassignedDocketsPanel({
  dockets, carriers, onAssign
}: {
  dockets: PTLDocket[];
  carriers: PTLCarrierVendor[];
  onAssign: (docketId: string, carrierId: string) => void;
}) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const activeCarriers = carriers.filter(c => c.status === 'Active');

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="p-4 border-b flex items-center gap-2">
        <Package size={16} className="text-amber-600" />
        <span className="font-semibold text-gray-900 text-sm">Unassigned Dockets ({dockets.length})</span>
      </div>
      {dockets.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">
          <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
          All dockets are assigned to carriers
        </div>
      ) : (
        <div className="divide-y">
          {dockets.map(d => (
            <div key={d.id} className="p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">{d.docketNumber}</span>
                  <span className="text-xs text-gray-500">{d.pickupCity} → {d.deliveryCity}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {d.chargeableWeight}kg · {d.totalPieces}pc · {d.status}
                </div>
              </div>
              <select
                className="border rounded-lg px-2 py-1.5 text-xs text-gray-700"
                value={assignments[d.id] || ''}
                onChange={e => setAssignments(a => ({ ...a, [d.id]: e.target.value }))}
              >
                <option value="">Select carrier</option>
                {activeCarriers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={() => assignments[d.id] && onAssign(d.id, assignments[d.id])}
                disabled={!assignments[d.id]}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
              >
                Assign
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type MainTab = 'carriers' | 'ratecards' | 'assignments';

export default function PTLVendorHub() {
  const [carriers, setCarriers] = useState<PTLCarrierVendor[]>([]);
  const [allRateCards, setAllRateCards] = useState<PTLVendorRateCard[]>([]);
  const [dockets, setDockets] = useState<PTLDocket[]>([]);
  const [activeTab, setActiveTab] = useState<MainTab>('carriers');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modals / panels
  const [selectedCarrier, setSelectedCarrier] = useState<PTLCarrierVendor | null>(null);
  const [showCarrierForm, setShowCarrierForm] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<PTLCarrierVendor | undefined>(undefined);
  const [showRateCardForm, setShowRateCardForm] = useState(false);
  const [editingRateCard, setEditingRateCard] = useState<PTLVendorRateCard | undefined>(undefined);
  const [rateCardCarrier, setRateCardCarrier] = useState<PTLCarrierVendor | null>(null);
  const [blacklistTarget, setBlacklistTarget] = useState<PTLCarrierVendor | null>(null);

  const [rcSearch, setRcSearch] = useState('');
  const [rcStatus, setRcStatus] = useState<string>('all');

  useEffect(() => {
    const load = () => {
      setCarriers(ptlStore.getCarriers());
      setAllRateCards(ptlStore.getVendorRateCards());
      setDockets(ptlStore.getDockets());
    };
    load();
    const unsub = ptlStore.subscribe(load);
    return unsub;
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const filteredCarriers = carriers.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.contactPerson.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchType = typeFilter === 'all' || c.vendorType === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const filteredRateCards = allRateCards.filter(rc => {
    const q = rcSearch.toLowerCase();
    const matchSearch = !q ||
      rc.vendorName.toLowerCase().includes(q) ||
      rc.originCity.toLowerCase().includes(q) ||
      rc.destinationCity.toLowerCase().includes(q);
    const matchStatus = rcStatus === 'all' || rc.status === rcStatus;
    return matchSearch && matchStatus;
  });

  const unassignedDockets = dockets.filter(
    d => (d.fleetModel === 'Market' || d.fleetModel === 'Carrier') && !d.carrierVendorId &&
      !['Delivered', 'RTO Completed'].includes(d.status)
  );

  // KPIs
  const activeCount = carriers.filter(c => c.status === 'Active').length;
  const blacklistedCount = carriers.filter(c => c.status === 'Blacklisted').length;
  const avgScore = carriers.filter(c => c.performanceScore).reduce((s, c, _, a) =>
    s + (c.performanceScore! / a.length), 0);
  const activeRCCount = allRateCards.filter(rc => rc.status === 'Active').length;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSaveCarrier = (data: CarrierFormData) => {
    if (editingCarrier) {
      ptlStore.updateCarrier(editingCarrier.id, { ...data });
    } else {
      ptlStore.addCarrier({
        id: ptlStore.generateId(),
        ...data,
        performanceScore: undefined,
        totalDockets: 0,
        onTimePercent: undefined,
        claimRate: undefined,
        avgTransitDays: undefined,
      } as PTLCarrierVendor);
    }
    setShowCarrierForm(false);
    setEditingCarrier(undefined);
  };

  const handleSaveRateCard = (data: Omit<PTLVendorRateCard, 'id'>) => {
    if (editingRateCard) {
      ptlStore.updateCarrier(data.vendorId, {}); // trigger refresh
      // Direct localStorage update for rate cards
      const existing = ptlStore.getVendorRateCards();
      const updated = existing.map(rc => rc.id === editingRateCard.id ? { ...rc, ...data } : rc);
      localStorage.setItem('ptl_vendor_ratecards_v2', JSON.stringify(updated));
      // Trigger subscriber notifications by doing a no-op update
      ptlStore.updateCarrier(data.vendorId, {});
    } else {
      const newRC: PTLVendorRateCard = { id: ptlStore.generateId(), ...data };
      const existing = ptlStore.getVendorRateCards();
      localStorage.setItem('ptl_vendor_ratecards_v2', JSON.stringify([...existing, newRC]));
    }
    setCarriers(ptlStore.getCarriers());
    setAllRateCards(ptlStore.getVendorRateCards());
    setShowRateCardForm(false);
    setEditingRateCard(undefined);
    setRateCardCarrier(null);
  };

  const handleBlacklist = (reason: string) => {
    if (!blacklistTarget) return;
    ptlStore.updateCarrier(blacklistTarget.id, { status: 'Blacklisted' });
    setBlacklistTarget(null);
    setSelectedCarrier(null);
  };

  const handleAssignCarrier = (docketId: string, carrierId: string) => {
    const carrier = carriers.find(c => c.id === carrierId);
    if (!carrier) return;
    ptlStore.updateDocket(docketId, {
      carrierVendorId: carrierId,
      carrierVendorName: carrier.name,
    });
  };

  const openAddRateCardFor = (carrier: PTLCarrierVendor) => {
    setRateCardCarrier(carrier);
    setEditingRateCard(undefined);
    setShowRateCardForm(true);
  };

  const openEditRateCard = (rc: PTLVendorRateCard, carrier: PTLCarrierVendor) => {
    setRateCardCarrier(carrier);
    setEditingRateCard(rc);
    setShowRateCardForm(true);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Carrier Hub</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage PTL carrier network, rate cards, and docket assignments</p>
        </div>
        <button
          onClick={() => { setEditingCarrier(undefined); setShowCarrierForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 shadow-sm"
        >
          <Plus size={16} /> Add Carrier
        </button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Carriers', value: activeCount, icon: <Truck size={18} className="text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Avg Performance Score', value: avgScore.toFixed(0), icon: <Star size={18} className="text-amber-600" />, bg: 'bg-amber-50' },
          { label: 'Active Rate Cards', value: activeRCCount, icon: <FileText size={18} className="text-green-600" />, bg: 'bg-green-50' },
          { label: 'Blacklisted', value: blacklistedCount, icon: <Ban size={18} className="text-red-600" />, bg: 'bg-red-50' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl p-4 flex items-center gap-4`}>
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              {k.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{k.value}</div>
              <div className="text-xs text-gray-500">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-6 bg-white border rounded-xl p-1 w-fit shadow-sm">
        {([['carriers', 'Carriers', <Truck size={14} />], ['ratecards', 'Rate Cards', <FileText size={14} />], ['assignments', 'Assignments', <Package size={14} />]] as const).map(([id, label, icon]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as MainTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Carriers ── */}
      {activeTab === 'carriers' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="pl-8 pr-3 py-2 border rounded-lg text-sm w-60 bg-white"
                placeholder="Search carriers..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="border rounded-lg px-3 py-2 text-sm bg-white"
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option>Active</option><option>Inactive</option><option>Blacklisted</option>
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm bg-white"
              value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              {VENDOR_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <span className="text-xs text-gray-400 ml-auto">{filteredCarriers.length} carriers</span>
          </div>

          {/* Carrier Cards Grid */}
          {filteredCarriers.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
              <Truck size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No carriers found</p>
              <p className="text-sm mt-1">Try adjusting filters or add a new carrier</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCarriers.map(carrier => {
                const cRateCards = allRateCards.filter(rc => rc.vendorId === carrier.id && rc.status === 'Active');
                const cDockets = dockets.filter(d => d.carrierVendorId === carrier.id);
                const activeDockets = cDockets.filter(d => !['Delivered', 'RTO Completed'].includes(d.status));

                return (
                  <div
                    key={carrier.id}
                    className="bg-white rounded-xl border shadow-sm hover:shadow-md cursor-pointer transition-shadow"
                    onClick={() => setSelectedCarrier(carrier)}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Truck size={18} className="text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 text-sm truncate">{carrier.name}</span>
                              {carrier.amsVendorId && (
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
                                  <Link2 size={9} /> AMS
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{carrier.vendorType}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0 ${STATUS_COLOR[carrier.status]}`}>
                          {carrier.status}
                        </span>
                      </div>

                      {/* Performance row */}
                      <div className="grid grid-cols-4 gap-2 bg-gray-50 rounded-lg p-2 mb-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-400">Score</div>
                          <ScoreBadge score={carrier.performanceScore} />
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400">OTP%</div>
                          <div className={`text-xs font-bold ${(carrier.onTimePercent || 0) >= 85 ? 'text-green-600' : 'text-amber-600'}`}>
                            {carrier.onTimePercent ? `${carrier.onTimePercent}%` : '—'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400">Claims</div>
                          <div className={`text-xs font-bold ${(carrier.claimRate || 0) <= 2 ? 'text-green-600' : 'text-red-600'}`}>
                            {carrier.claimRate ? `${carrier.claimRate}%` : '—'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400">Dockets</div>
                          <div className="text-xs font-bold text-gray-700">{carrier.totalDockets || 0}</div>
                        </div>
                      </div>

                      {/* Contact + meta */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Users size={11} /> {carrier.contactPerson} · {carrier.phone}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText size={11} /> {cRateCards.length} active rate card{cRateCards.length !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package size={11} /> {activeDockets.length} active docket{activeDockets.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-2.5 border-t flex items-center justify-between text-xs text-blue-600 hover:text-blue-700">
                      <span>View details & rate cards</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Rate Cards ── */}
      {activeTab === 'ratecards' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="pl-8 pr-3 py-2 border rounded-lg text-sm w-60 bg-white"
                placeholder="Search carrier, city..." value={rcSearch} onChange={e => setRcSearch(e.target.value)} />
            </div>
            <select className="border rounded-lg px-3 py-2 text-sm bg-white"
              value={rcStatus} onChange={e => setRcStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option>Active</option><option>Draft</option><option>Expired</option>
            </select>
            <span className="text-xs text-gray-400 ml-auto">{filteredRateCards.length} rate cards</span>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {['Carrier', 'Lane', 'Vehicle', 'Rate Type', 'Base Rate', 'Min Charge', 'Capacity', 'Valid Until', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRateCards.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-gray-400">No rate cards found</td></tr>
                ) : filteredRateCards.map(rc => {
                  const carrier = carriers.find(c => c.id === rc.vendorId);
                  const isExpired = rc.status === 'Expired' || new Date(rc.validTo) < new Date();
                  return (
                    <tr key={rc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{rc.vendorName}</div>
                        {carrier?.amsVendorId && (
                          <span className="text-xs text-purple-600 flex items-center gap-1 mt-0.5">
                            <Link2 size={9} /> AMS linked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-gray-700">
                          <MapPin size={12} className="text-gray-400" />
                          {rc.originCity} → {rc.destinationCity}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{rc.vehicleType}</td>
                      <td className="px-4 py-3 text-gray-600">{rc.rateType}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">₹{rc.baseRate.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600">₹{rc.minimumCharge.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600">{rc.capacityTons}T</td>
                      <td className="px-4 py-3">
                        <span className={isExpired ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {rc.validTo}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <RateCardStatusBadge status={rc.status} />
                      </td>
                      <td className="px-4 py-3">
                        {carrier && (
                          <button
                            onClick={() => openEditRateCard(rc, carrier)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Expired warning */}
          {allRateCards.filter(rc => new Date(rc.validTo) < new Date() && rc.status === 'Active').length > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
              {allRateCards.filter(rc => new Date(rc.validTo) < new Date() && rc.status === 'Active').length} rate card(s)
              have expired. Update them to ensure correct carrier cost calculation.
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Assignments ── */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {/* Carrier Utilization */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Carrier Load Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {carriers.filter(c => c.status === 'Active').map(c => {
                const assigned = dockets.filter(
                  d => d.carrierVendorId === c.id && !['Delivered', 'RTO Completed'].includes(d.status)
                ).length;
                const maxLoad = 20; // visual cap
                const pct = Math.min((assigned / maxLoad) * 100, 100);
                return (
                  <div key={c.id} className="bg-white border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-sm text-gray-900">{c.name}</span>
                        {c.amsVendorId && (
                          <span className="ml-2 text-xs text-purple-600">AMS</span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{assigned} dockets</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{c.vendorType}</span>
                      <span>OTP: {c.onTimePercent || '—'}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unassigned dockets */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Dockets Needing Carrier Assignment
              {unassignedDockets.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                  {unassignedDockets.length}
                </span>
              )}
            </h3>
            <UnassignedDocketsPanel
              dockets={unassignedDockets}
              carriers={carriers}
              onAssign={handleAssignCarrier}
            />
          </div>
        </div>
      )}

      {/* ── Carrier Detail Panel ── */}
      {selectedCarrier && (
        <CarrierDetailPanel
          carrier={selectedCarrier}
          dockets={dockets}
          rateCards={allRateCards}
          onEdit={() => {
            setEditingCarrier(selectedCarrier);
            setShowCarrierForm(true);
            setSelectedCarrier(null);
          }}
          onBlacklist={() => {
            setBlacklistTarget(selectedCarrier);
            setSelectedCarrier(null);
          }}
          onAddRateCard={() => openAddRateCardFor(selectedCarrier)}
          onEditRateCard={rc => openEditRateCard(rc, selectedCarrier)}
          onClose={() => setSelectedCarrier(null)}
        />
      )}

      {/* ── Carrier Form Modal ── */}
      {showCarrierForm && (
        <CarrierFormModal
          initial={editingCarrier}
          onSave={handleSaveCarrier}
          onClose={() => { setShowCarrierForm(false); setEditingCarrier(undefined); }}
        />
      )}

      {/* ── Rate Card Form Modal ── */}
      {showRateCardForm && rateCardCarrier && (
        <RateCardFormModal
          vendorId={rateCardCarrier.id}
          vendorName={rateCardCarrier.name}
          initial={editingRateCard}
          onSave={handleSaveRateCard}
          onClose={() => { setShowRateCardForm(false); setEditingRateCard(undefined); setRateCardCarrier(null); }}
        />
      )}

      {/* ── Blacklist Modal ── */}
      {blacklistTarget && (
        <BlacklistModal
          carrier={blacklistTarget}
          onConfirm={handleBlacklist}
          onClose={() => setBlacklistTarget(null)}
        />
      )}
    </div>
  );
}
