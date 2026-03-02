// ============================================================
// PTL Zone Rate Cards — embeddable tab component
// Used as a tab inside PTLSettings. Handles the full
// zone-matrix rate card lifecycle: list → detail → edit.
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Copy, Archive, ChevronDown, ChevronUp,
  Calculator, X, AlertTriangle, Edit2,
  Save, ArrowLeft, Info, Truck, Wind,
  MapPin, IndianRupee, Package, ToggleLeft, ToggleRight,
  FileText, Clock, Grid,
} from 'lucide-react';
import { ptlStore } from '../../services/ptlStore';
import type {
  PTLZoneRateCard, PTLZone, PTLRateCardTnC, PTLTATEntry,
  ZoneRateCardStatus, ServiceType, FreightCalcInput, FreightBreakdown,
  PTLCarrierVendor,
} from '../../services/ptlTypes';
import {
  calculateZoneFreight, lookupZoneForCity, formatTAT, getDefaultTnC, STANDARD_ZONES,
} from '../../services/ptlFreightCalculator';

// ─── Constants ────────────────────────────────────────────────────────────────

const ZONE_CODES = ['C1','C2','E1','E2','N1','N2','N3','NE1','NE2','S1','S2','S3','W1','W2'];

const STATUS_CONFIG: Record<ZoneRateCardStatus, { label: string; color: string }> = {
  Active:     { label: 'Active',     color: 'bg-green-100 text-green-800' },
  Draft:      { label: 'Draft',      color: 'bg-gray-100 text-gray-700' },
  Expired:    { label: 'Expired',    color: 'bg-red-100 text-red-700' },
  Superseded: { label: 'Superseded', color: 'bg-yellow-100 text-yellow-800' },
};

type DetailTab = 'overview' | 'zones' | 'surface' | 'air' | 'tat' | 'tnc';
type AssignTo = 'customer' | 'carrier' | 'none';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, d = 2) { return n.toFixed(d); }
function fmtINR(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function rateColor(rate: number, min: number, max: number) {
  if (!rate) return 'bg-gray-50 text-gray-400';
  const pct = max > min ? (rate - min) / (max - min) : 0;
  if (pct < 0.25) return 'bg-green-50 text-green-800';
  if (pct < 0.55) return 'bg-yellow-50 text-yellow-800';
  if (pct < 0.80) return 'bg-orange-50 text-orange-800';
  return 'bg-red-50 text-red-800';
}
function emptyMatrix(codes: string[]): Record<string, Record<string, number>> {
  const m: Record<string, Record<string, number>> = {};
  codes.forEach(o => { m[o] = {}; codes.forEach(d => { m[o][d] = 0; }); });
  return m;
}
function emptyTATMatrix(codes: string[]): Record<string, Record<string, PTLTATEntry>> {
  const m: Record<string, Record<string, PTLTATEntry>> = {};
  codes.forEach(o => { m[o] = {}; codes.forEach(d => { m[o][d] = { min: 1 }; }); });
  return m;
}

// ─── Shared input styles ──────────────────────────────────────────────────────

const inp = 'border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 w-full';
const sel = 'border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 w-full bg-white cursor-pointer';

// ─── Matrix Grid ──────────────────────────────────────────────────────────────

function MatrixGrid({
  codes, values, onChange, editMode,
}: {
  codes: string[];
  values: Record<string, Record<string, number>>;
  onChange?: (o: string, d: string, v: number) => void;
  editMode?: boolean;
}) {
  const allVals = codes.flatMap(o => codes.map(d => values[o]?.[d] ?? 0)).filter(v => v > 0);
  const min = allVals.length ? Math.min(...allVals) : 0;
  const max = allVals.length ? Math.max(...allVals) : 1;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="text-xs min-w-max">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-gray-100 px-2 py-1.5 text-left font-semibold text-gray-500 border-r border-b border-gray-200 w-10">↙</th>
            {codes.map(d => (
              <th key={d} className="px-2 py-1.5 text-center font-semibold text-gray-600 border-b border-gray-200 min-w-[58px]">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {codes.map(o => (
            <tr key={o}>
              <td className="sticky left-0 z-10 bg-gray-100 px-2 py-1 font-semibold text-gray-700 border-r border-b border-gray-200">{o}</td>
              {codes.map(d => {
                const v = values[o]?.[d] ?? 0;
                return (
                  <td key={d} className={`border-b border-gray-100 p-0 ${editMode ? '' : rateColor(v, min, max)}`}>
                    {editMode && onChange ? (
                      <input
                        type="number" step="0.05" min="0" value={v || ''}
                        onChange={e => onChange(o, d, parseFloat(e.target.value) || 0)}
                        className={`w-full px-1 py-1 text-center text-xs outline-none border-0 focus:bg-blue-50 ${o === d ? 'bg-blue-50' : ''}`}
                        placeholder="0"
                      />
                    ) : (
                      <span className={`block text-center px-1 py-1 ${o === d ? 'font-semibold' : ''}`}>
                        {v > 0 ? fmt(v) : '—'}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── TAT Grid ────────────────────────────────────────────────────────────────

function TATGrid({
  codes, values, onChange, editMode,
}: {
  codes: string[];
  values: Record<string, Record<string, PTLTATEntry>>;
  onChange?: (o: string, d: string, e: PTLTATEntry) => void;
  editMode?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="text-xs min-w-max">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-gray-100 px-2 py-1.5 text-left font-semibold text-gray-500 border-r border-b border-gray-200 w-10">↙</th>
            {codes.map(d => (
              <th key={d} className="px-2 py-1.5 text-center font-semibold text-gray-600 border-b border-gray-200 min-w-[58px]">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {codes.map(o => (
            <tr key={o}>
              <td className="sticky left-0 z-10 bg-gray-100 px-2 py-1 font-semibold text-gray-700 border-r border-b border-gray-200">{o}</td>
              {codes.map(d => {
                const entry = values[o]?.[d] ?? { min: 0 };
                return (
                  <td key={d} className={`border-b border-gray-100 ${o === d ? 'bg-blue-50' : ''}`}>
                    {editMode && onChange ? (
                      <input
                        type="number" min="0" value={entry.min || ''}
                        onChange={e => onChange(o, d, { min: parseInt(e.target.value) || 0 })}
                        className="w-full px-1 py-1 text-center text-xs outline-none border-0 focus:bg-blue-50"
                        placeholder="0"
                      />
                    ) : (
                      <span className={`block text-center px-1 py-1 ${o === d ? 'font-semibold' : ''}`}>
                        {entry.min > 0 ? formatTAT(entry) : '—'}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── T&C Form ────────────────────────────────────────────────────────────────

function TnCForm({ tnc, editMode, onChange }: {
  tnc: PTLRateCardTnC;
  editMode: boolean;
  onChange: (f: keyof PTLRateCardTnC, v: number | boolean) => void;
}) {
  const num = (label: string, field: keyof PTLRateCardTnC, unit: string, step = 1) => (
    <div key={field} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        {editMode ? (
          <input type="number" step={step} min={0} value={tnc[field] as number}
            onChange={e => onChange(field, parseFloat(e.target.value) || 0)}
            className="w-24 text-right px-2 py-1 text-sm border border-gray-300 rounded" />
        ) : (
          <span className="text-sm font-medium text-gray-900">{tnc[field] as number}</span>
        )}
        <span className="text-xs text-gray-400 w-28 text-right">{unit}</span>
      </div>
    </div>
  );
  const bool = (label: string, field: keyof PTLRateCardTnC) => (
    <div key={field} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      {editMode ? (
        <button onClick={() => onChange(field, !(tnc[field] as boolean))}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${tnc[field] ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          {tnc[field] ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          {tnc[field] ? 'Yes' : 'No'}
        </button>
      ) : (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tnc[field] ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
          {tnc[field] ? 'Yes' : 'No'}
        </span>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1.5"><Package size={13}/> Weight & Minimums</h4>
        {num('Volumetric Factor', 'volumetricFactor', 'kg per CFT', 0.5)}
        {num('Min Chargeable — Surface', 'minChargeableSurface', '₹ per consignment')}
        {num('Min Chargeable — Air', 'minChargeableAir', '₹ per consignment')}
        {num('Docket Charge', 'docketCharge', '₹ per docket')}
        {num('Base Diesel Price', 'baseDieselPrice', '₹/litre', 0.01)}
      </div>
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1.5"><IndianRupee size={13}/> COD / FTC / Storage</h4>
        {num('FTC Charge', 'ftcCharge', '₹ Freight-to-Collect')}
        {num('COD Charge', 'codCharge', '₹ service fee')}
        {num('DACC Charge', 'daccCharge', '₹')}
        {num('Free Storage', 'freeStorageDays', 'days')}
        {num('Demurrage / Con / Day', 'demurragePerConPerDay', '₹')}
        {num('Demurrage / kg / Day', 'demurragePerKgPerDay', '₹ (whichever higher)', 0.5)}
      </div>
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1.5"><MapPin size={13}/> ODA</h4>
        {bool('PDA (Pickup ODA) Applied', 'pdaApplied')}
        {bool('DDA (Delivery ODA) Applied', 'ddaApplied')}
        {bool('State Charge Applied', 'stateChargeApplied')}
        {num('ODA Rate', 'odaRatePerKg', '₹/kg', 0.5)}
        {num('ODA Minimum', 'odaMinPerCon', '₹ per consignment')}
      </div>
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1.5"><Info size={13}/> FOV, Holiday & Redelivery</h4>
        {num('FOV %', 'fovPercent', '% of invoice value', 0.01)}
        {num('FOV Minimum', 'fovMinPerCon', '₹ per consignment')}
        {num('FOV Max Liability', 'fovMaxLiability', '₹ cap')}
        {num('Holiday — Pickup', 'holidaySurchargePickup', '₹')}
        {num('Holiday — Delivery', 'holidaySurchargeDelivery', '₹')}
        {num('Re-Delivery Minimum', 'redeliveryMin', '₹')}
        {num('Re-Delivery / kg / Attempt', 'redeliveryPerKgPerAttempt', '₹', 0.5)}
        {num('Appointment Delivery / kg', 'appointmentDeliveryPerKg', '₹', 0.5)}
        {num('Appointment Delivery Min', 'appointmentDeliveryMin', '₹')}
      </div>
    </div>
  );
}

// ─── Zones Panel ──────────────────────────────────────────────────────────────

function ZonesPanel({ zones }: { zones: PTLZone[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-1.5">
      {zones.map(z => (
        <div key={z.code} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setOpen(p => p === z.code ? null : z.code)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-white hover:bg-gray-50">
            <div className="flex items-center gap-3 text-left">
              <span className="font-mono font-bold text-blue-700 w-10">{z.code}</span>
              <div>
                {z.regionName !== '—' && <p className="text-sm font-medium text-gray-900">{z.regionName}</p>}
                {z.areaName !== '—' && <p className="text-xs text-gray-500">{z.areaName}</p>}
              </div>
            </div>
            {open === z.code ? <ChevronUp size={15} className="text-gray-400"/> : <ChevronDown size={15} className="text-gray-400"/>}
          </button>
          {open === z.code && (
            <div className="px-4 pb-3 pt-2 bg-gray-50 border-t border-gray-200 space-y-2">
              {z.hubCities.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Hub Cities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {z.hubCities.map(c => <span key={c} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs capitalize">{c}</span>)}
                  </div>
                </div>
              )}
              {z.states.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">States</p>
                  <div className="flex flex-wrap gap-1.5">
                    {z.states.map(s => <span key={s} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs capitalize">{s}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Freight Calculator Drawer ────────────────────────────────────────────────

function FreightCalcDrawer({
  rateCards, defaultCardId, onClose,
}: {
  rateCards: PTLZoneRateCard[];
  defaultCardId?: string;
  onClose: () => void;
}) {
  const activeCards = rateCards.filter(r => r.status === 'Active');
  const [cardId, setCardId] = useState(defaultCardId ?? activeCards[0]?.id ?? '');
  const [form, setForm] = useState({
    originCity: '', destCity: '', weight: '',
    dimL: '', dimW: '', dimH: '', dimUnit: 'cm' as 'cm' | 'ft',
    declaredValue: '', mode: 'surface' as 'surface' | 'air',
    paymentMode: 'prepaid' as 'prepaid' | 'cod' | 'ftc',
    dieselPrice: '',
    isODAOrigin: false, isODADest: false,
    isHolidayPickup: false, isHolidayDelivery: false,
    requiresDacc: false, requiresAppt: false,
  });
  const [result, setResult] = useState<FreightBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const card = rateCards.find(r => r.id === cardId);
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));
  const tog = (k: string) => setForm(p => ({ ...p, [k]: !(p as Record<string, unknown>)[k] }));

  function calc() {
    setError(null); setResult(null);
    if (!card) { setError('Select a rate card.'); return; }
    if (!form.originCity.trim()) { setError('Enter origin city.'); return; }
    if (!form.destCity.trim()) { setError('Enter destination city.'); return; }
    const wt = parseFloat(form.weight);
    if (!wt || wt <= 0) { setError('Enter a valid weight.'); return; }
    const hasDims = form.dimL && form.dimW && form.dimH;
    const input: FreightCalcInput = {
      rateCardId: cardId,
      originCity: form.originCity.trim(), destCity: form.destCity.trim(),
      actualWeightKg: wt,
      dimensions: hasDims ? { l: +form.dimL, w: +form.dimW, h: +form.dimH, unit: form.dimUnit } : undefined,
      declaredValue: form.declaredValue ? +form.declaredValue : undefined,
      mode: form.mode, paymentMode: form.paymentMode,
      currentDieselPrice: form.dieselPrice ? +form.dieselPrice : undefined,
      flags: {
        isODAOrigin: form.isODAOrigin || undefined, isODADestination: form.isODADest || undefined,
        isHolidayPickup: form.isHolidayPickup || undefined, isHolidayDelivery: form.isHolidayDelivery || undefined,
        requiresDacc: form.requiresDacc || undefined, requiresAppointmentDelivery: form.requiresAppt || undefined,
      },
    };
    const res = calculateZoneFreight(input, card);
    if (!res) { setError('Calculation failed — check inputs.'); return; }
    setResult(res);
  }

  const surchargeEntries = result ? Object.entries(result.surcharges).filter(([, v]) => v && v > 0) : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-end">
      <div className="bg-white h-full w-full max-w-xl overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Calculator size={17} className="text-blue-600"/>
            <h3 className="font-semibold text-gray-900">Freight Calculator</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={19}/></button>
        </div>
        <div className="p-5 space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Rate Card</label>
            <select className={sel} value={cardId} onChange={e => setCardId(e.target.value)}>
              {activeCards.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Origin City</label>
              <input className={inp} placeholder="e.g. Mumbai" value={form.originCity} onChange={f('originCity')}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Destination City</label>
              <input className={inp} placeholder="e.g. Delhi" value={form.destCity} onChange={f('destCity')}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Weight (kg)</label>
              <input className={inp} type="number" min="0" step="0.1" value={form.weight} onChange={f('weight')} placeholder="0.0"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Declared Value (₹)</label>
              <input className={inp} type="number" min="0" value={form.declaredValue} onChange={f('declaredValue')} placeholder="Optional"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Dimensions (L × W × H) for volumetric weight</label>
            <div className="flex gap-2 items-center">
              <input className={inp} type="number" placeholder="L" value={form.dimL} onChange={f('dimL')}/>
              <span className="text-gray-400 text-sm">×</span>
              <input className={inp} type="number" placeholder="W" value={form.dimW} onChange={f('dimW')}/>
              <span className="text-gray-400 text-sm">×</span>
              <input className={inp} type="number" placeholder="H" value={form.dimH} onChange={f('dimH')}/>
              <select className="border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white" value={form.dimUnit}
                onChange={e => setForm(p => ({ ...p, dimUnit: e.target.value as 'cm' | 'ft' }))}>
                <option value="cm">cm</option><option value="ft">ft</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Mode</label>
              <select className={sel} value={form.mode} onChange={e => setForm(p => ({ ...p, mode: e.target.value as 'surface' | 'air' }))}>
                <option value="surface">Surface / LTL</option>
                <option value="air">Air</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Payment Mode</label>
              <select className={sel} value={form.paymentMode} onChange={e => setForm(p => ({ ...p, paymentMode: e.target.value as 'prepaid' | 'cod' | 'ftc' }))}>
                <option value="prepaid">Prepaid</option>
                <option value="cod">COD</option>
                <option value="ftc">Freight to Collect</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Current Diesel Price (₹/litre) — for fuel surcharge
              {card && <span className="text-gray-400 font-normal ml-1">Base: ₹{card.tnc.baseDieselPrice}</span>}
            </label>
            <input className={inp} type="number" step="0.01" min="0" value={form.dieselPrice} onChange={f('dieselPrice')} placeholder="Optional"/>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Additional Flags</p>
            <div className="grid grid-cols-2 gap-2">
              {([['isODAOrigin','ODA Origin'],['isODADest','ODA Destination'],['isHolidayPickup','Holiday Pickup'],
                 ['isHolidayDelivery','Holiday Delivery'],['requiresDacc','DACC Required'],['requiresAppt','Appointment Delivery']] as [string,string][])
                .map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="checkbox" checked={(form as Record<string,unknown>)[k] as boolean} onChange={() => tog(k)} className="rounded"/>
                    {label}
                  </label>
                ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle size={14}/> {error}
            </div>
          )}

          <button onClick={calc} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm">
            Calculate Freight
          </button>

          {result && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">Breakdown</span>
                <span className="text-xs text-gray-500">{result.originZone} → {result.destZone} · TAT: {formatTAT(result.tatDays)}</span>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                    {result.originCity} → <strong>{result.originZone}</strong>{result.isODAOrigin ? ' (ODA)' : ''}
                  </span>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">
                    {result.destCity} → <strong>{result.destZone}</strong>{result.isODADestination ? ' (ODA)' : ''}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Chargeable Weight</span><span className="font-medium text-gray-900">{fmt(result.chargeableWeightKg)} kg</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Rate ({result.originZone}→{result.destZone})</span><span className="font-medium text-gray-900">₹{fmt(result.baseRatePerKg)}/kg</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Base Freight {result.minimumApplied && <span className="text-amber-600 text-xs ml-1">(min applied)</span>}</span>
                    <span className="font-medium text-gray-900">{fmtINR(result.baseFreight)}</span>
                  </div>
                </div>
                {surchargeEntries.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Surcharges</p>
                    {surchargeEntries.map(([k, v]) => (
                      <div key={k} className="flex justify-between text-gray-600">
                        <span>{k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase())}</span>
                        <span>{fmtINR(v as number)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t-2 border-gray-200 flex justify-between font-bold text-base">
                  <span>Total Freight</span>
                  <span className="text-green-700">{fmtINR(result.totalFreight)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Create / Edit Rate Card Modal ────────────────────────────────────────────

function RateCardFormModal({
  initial, clients, carriers, onSave, onClose,
}: {
  initial?: Partial<PTLZoneRateCard>;
  clients: { id: string; name: string }[];
  carriers: PTLCarrierVendor[];
  onSave: (data: Omit<PTLZoneRateCard, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  // Determine initial assignTo
  const initAssignTo: AssignTo = initial?.carrierId ? 'carrier' : initial?.customerId ? 'customer' : 'none';

  const [name, setName] = useState(initial?.name ?? '');
  const [assignTo, setAssignTo] = useState<AssignTo>(initAssignTo);
  const [selectedClientId, setSelectedClientId] = useState(initial?.customerId ?? '');
  const [selectedCarrierId, setSelectedCarrierId] = useState(initial?.carrierId ?? '');
  const [serviceType, setServiceType] = useState<ServiceType>(initial?.serviceType ?? 'Both');
  const [effectiveDate, setEffectiveDate] = useState(initial?.effectiveDate ?? '2026-04-01');
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate ?? '2027-03-31');
  const [status, setStatus] = useState<ZoneRateCardStatus>(initial?.status ?? 'Draft');

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedCarrier = carriers.find(c => c.id === selectedCarrierId);

  function handleSave() {
    if (!name.trim()) return;
    if (assignTo === 'customer' && !selectedClientId) return;
    if (assignTo === 'carrier' && !selectedCarrierId) return;
    const codes = ZONE_CODES;
    onSave({
      name: name.trim(),
      customerId: assignTo === 'customer' ? selectedClientId : undefined,
      customerName: assignTo === 'customer' ? selectedClient?.name : undefined,
      carrierId: assignTo === 'carrier' ? selectedCarrierId : undefined,
      carrierName: assignTo === 'carrier' ? selectedCarrier?.name : undefined,
      serviceType, effectiveDate, expiryDate,
      currency: 'INR', status,
      zones: initial?.zones ?? STANDARD_ZONES,
      surfaceRates: initial?.surfaceRates ?? emptyMatrix(codes),
      airRates: initial?.airRates ?? emptyMatrix(codes),
      tatMatrix: initial?.tatMatrix ?? emptyTATMatrix(codes),
      tnc: initial?.tnc ?? getDefaultTnC(),
      version: initial?.version ?? 1,
      parentVersionId: initial?.parentVersionId,
    });
  }

  const isValid = name.trim() &&
    (assignTo === 'none' || (assignTo === 'customer' && selectedClientId) || (assignTo === 'carrier' && selectedCarrierId));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900">{initial ? 'Edit Rate Card' : 'New Zone Rate Card'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Rate Card Name *</label>
            <input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Reliance Industries — Zone Rate FY2026-27"/>
          </div>

          {/* Assignment */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Assign To</label>
            <div className="flex gap-2 mb-3">
              {(['customer','carrier','none'] as AssignTo[]).map(opt => (
                <button key={opt} onClick={() => setAssignTo(opt)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    assignTo === opt ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {opt === 'customer' ? 'Customer' : opt === 'carrier' ? 'Carrier' : 'Unassigned'}
                </button>
              ))}
            </div>
            {assignTo === 'customer' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Select Customer *</label>
                <select className={sel} value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
                  <option value="">— Choose a customer —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {selectedClientId && (
                  <p className="text-xs text-green-700 mt-1">
                    This rate card will be used for freight calculations for <strong>{selectedClient?.name}</strong>.
                  </p>
                )}
              </div>
            )}
            {assignTo === 'carrier' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Select Carrier *</label>
                <select className={sel} value={selectedCarrierId} onChange={e => setSelectedCarrierId(e.target.value)}>
                  <option value="">— Choose a carrier —</option>
                  {carriers.filter(c => c.status === 'Active').map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                  ))}
                </select>
                {selectedCarrierId && (
                  <p className="text-xs text-green-700 mt-1">
                    This will define the rate this carrier charges <strong>{selectedCarrier?.name}</strong>.
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Service Type</label>
            <select className={sel} value={serviceType} onChange={e => setServiceType(e.target.value as ServiceType)}>
              <option value="Both">Surface + Air</option>
              <option value="Surface">Surface / LTL Only</option>
              <option value="Air">Air Only</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Effective Date</label>
              <input className={inp} type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Expiry Date</label>
              <input className={inp} type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
            <select className={sel} value={status} onChange={e => setStatus(e.target.value as ZoneRateCardStatus)}>
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={!isValid}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
            {initial ? 'Save Changes' : 'Create Rate Card'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail View ──────────────────────────────────────────────────────────────

function DetailView({ card, allCards, clients, carriers, onBack, onUpdate, onShowCalc }: {
  card: PTLZoneRateCard;
  allCards: PTLZoneRateCard[];
  clients: { id: string; name: string }[];
  carriers: PTLCarrierVendor[];
  onBack: () => void;
  onUpdate: (fields: Partial<PTLZoneRateCard>) => void;
  onShowCalc: () => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [editMode, setEditMode] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [surfaceRates, setSurfaceRates] = useState(() => ({ ...card.surfaceRates }));
  const [airRates, setAirRates] = useState(() => ({ ...card.airRates }));
  const [tatMatrix, setTatMatrix] = useState(() => ({ ...card.tatMatrix }));
  const [tnc, setTnc] = useState(() => ({ ...card.tnc }));

  useEffect(() => {
    setSurfaceRates({ ...card.surfaceRates });
    setAirRates({ ...card.airRates });
    setTatMatrix({ ...card.tatMatrix });
    setTnc({ ...card.tnc });
    setEditMode(false);
  }, [card.id]);

  function save() { onUpdate({ surfaceRates, airRates, tatMatrix, tnc }); setEditMode(false); }
  function discard() {
    setSurfaceRates({ ...card.surfaceRates }); setAirRates({ ...card.airRates });
    setTatMatrix({ ...card.tatMatrix }); setTnc({ ...card.tnc }); setEditMode(false);
  }

  const tabs: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Info size={13}/> },
    { id: 'zones', label: 'Zones', icon: <MapPin size={13}/> },
    { id: 'surface', label: 'Surface Rates', icon: <Truck size={13}/> },
    { id: 'air', label: 'Air Rates', icon: <Wind size={13}/> },
    { id: 'tat', label: 'Transit Time', icon: <Clock size={13}/> },
    { id: 'tnc', label: 'T&C', icon: <FileText size={13}/> },
  ];

  const cfg = STATUS_CONFIG[card.status];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={onBack} className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
            <ArrowLeft size={14}/> All Rate Cards
          </button>
          <span className="text-gray-300">/</span>
          <span className="font-medium text-gray-800 truncate max-w-xs">{card.name}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onShowCalc} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <Calculator size={13}/> Calculate
          </button>
          <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <Edit2 size={13}/> Edit Details
          </button>
          {editMode ? (
            <>
              <button onClick={discard} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                <X size={13}/> Discard
              </button>
              <button onClick={save} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
                <Save size={13}/> Save
              </button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
              <Edit2 size={13}/> Edit Rates
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            ['Name', card.name],
            ['Service Type', card.serviceType],
            ['Assigned Customer', card.customerName ?? '—'],
            ['Assigned Carrier', card.carrierName ?? '—'],
            ['Effective', card.effectiveDate],
            ['Expires', card.expiryDate],
            ['Version', `v${card.version}`],
            ['Currency', card.currency],
            ['Created', new Date(card.createdAt).toLocaleDateString('en-IN')],
            ['Updated', card.updatedAt ? new Date(card.updatedAt).toLocaleDateString('en-IN') : '—'],
          ].map(([k, v]) => (
            <div key={k} className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">{k}</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{v}</p>
            </div>
          ))}
        </div>
      )}
      {activeTab === 'zones'   && <ZonesPanel zones={card.zones}/>}
      {activeTab === 'surface' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Surface / LTL rates ₹/kg — rows = origin zone, cols = dest zone.{editMode && <span className="text-blue-600 ml-2">Edit mode — click any cell</span>}</p>
          <MatrixGrid codes={ZONE_CODES} values={surfaceRates} onChange={(o,d,v) => setSurfaceRates(p => ({...p,[o]:{...(p[o]??{}),[d]:v}}))} editMode={editMode}/>
        </div>
      )}
      {activeTab === 'air' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Air freight rates ₹/kg.{editMode && <span className="text-blue-600 ml-2">Edit mode — click any cell</span>}</p>
          <MatrixGrid codes={ZONE_CODES} values={airRates} onChange={(o,d,v) => setAirRates(p => ({...p,[o]:{...(p[o]??{}),[d]:v}}))} editMode={editMode}/>
        </div>
      )}
      {activeTab === 'tat' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Transit days — rows = origin, cols = dest. Diagonal = same zone.{editMode && <span className="text-blue-600 ml-2">Edit mode — enter min days</span>}</p>
          <TATGrid codes={ZONE_CODES} values={tatMatrix} onChange={(o,d,e) => setTatMatrix(p => ({...p,[o]:{...(p[o]??{}),[d]:e}}))} editMode={editMode}/>
        </div>
      )}
      {activeTab === 'tnc' && (
        <TnCForm tnc={tnc} editMode={editMode} onChange={(f,v) => setTnc(p => ({...p,[f]:v}))}/>
      )}

      {showEdit && (
        <RateCardFormModal
          initial={card}
          clients={clients}
          carriers={carriers}
          onSave={data => { onUpdate(data); setShowEdit(false); }}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({ cards, clients, carriers, onSelect, onNew, onCalc, onDuplicate, onArchive }: {
  cards: PTLZoneRateCard[];
  clients: { id: string; name: string }[];
  carriers: PTLCarrierVendor[];
  onSelect: (c: PTLZoneRateCard) => void;
  onNew: () => void;  // just opens the create modal in parent
  onCalc: () => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const [statusF, setStatusF] = useState<ZoneRateCardStatus | 'All'>('All');
  const [modeF, setModeF] = useState<ServiceType | 'All'>('All');

  const filtered = useMemo(() => cards.filter(c => {
    if (statusF !== 'All' && c.status !== statusF) return false;
    if (modeF !== 'All' && c.serviceType !== modeF && c.serviceType !== 'Both') return false;
    return true;
  }), [cards, statusF, modeF]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">{filtered.length} rate card{filtered.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <button onClick={onCalc} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <Calculator size={14}/> Calculator
          </button>
          <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
            <Plus size={14}/> New Zone Rate Card
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white" value={statusF} onChange={e => setStatusF(e.target.value as ZoneRateCardStatus | 'All')}>
          <option value="All">All Statuses</option>
          <option value="Active">Active</option><option value="Draft">Draft</option>
          <option value="Expired">Expired</option><option value="Superseded">Superseded</option>
        </select>
        <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white" value={modeF} onChange={e => setModeF(e.target.value as ServiceType | 'All')}>
          <option value="All">All Modes</option>
          <option value="Surface">Surface</option><option value="Air">Air</option><option value="Both">Both</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Grid size={36} className="mx-auto mb-3 opacity-40"/>
          <p className="text-sm">No zone rate cards match your filters.</p>
          <button onClick={onNew} className="mt-2 text-blue-600 text-sm hover:underline">Create one now</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(card => {
            const cfg = STATUS_CONFIG[card.status];
            const assignedTo = card.customerName ? `Customer: ${card.customerName}` : card.carrierName ? `Carrier: ${card.carrierName}` : 'Unassigned';
            return (
              <div key={card.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => onSelect(card)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        {(card.serviceType === 'Surface' || card.serviceType === 'Both') && <><Truck size={10}/> Surface</>}
                        {card.serviceType === 'Both' && ' + '}
                        {(card.serviceType === 'Air' || card.serviceType === 'Both') && <><Wind size={10}/> Air</>}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm truncate">{card.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{assignedTo}</span>
                      <span>·</span>
                      <span>{card.effectiveDate} → {card.expiryDate}</span>
                      <span>·</span>
                      <span>v{card.version} · {card.zones.length} zones</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button title="Duplicate" onClick={() => onDuplicate(card.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Copy size={13}/>
                    </button>
                    <button title="Archive" onClick={() => onArchive(card.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Archive size={13}/>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main embeddable component ────────────────────────────────────────────────

/**
 * ZoneRateCardsTab — embeds inside PTLSettings as a tab.
 * Accepts pre-loaded clients and carriers from the parent.
 */
export function ZoneRateCardsTab({
  clients,
}: {
  clients: { id: string; name: string }[];
}) {
  const [cards, setCards] = useState<PTLZoneRateCard[]>(() => ptlStore.getZoneRateCards());
  const [carriers, setCarriers] = useState<PTLCarrierVendor[]>(() => ptlStore.getCarriers());
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCalc, setShowCalc] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const unsub = ptlStore.subscribe(() => {
      setCards(ptlStore.getZoneRateCards());
      setCarriers(ptlStore.getCarriers());
    });
    return unsub;
  }, []);

  const selectedCard = useMemo(() => cards.find(c => c.id === selectedId) ?? null, [cards, selectedId]);

  function handleCreate(data: Omit<PTLZoneRateCard, 'id' | 'createdAt'>) {
    const rc: PTLZoneRateCard = {
      ...data, id: ptlStore.generateId('zrc'), createdAt: new Date().toISOString(),
    };
    ptlStore.addZoneRateCard(rc);
    setSelectedId(rc.id);
    setView('detail');
    setShowCreate(false);
  }

  function handleUpdate(fields: Partial<PTLZoneRateCard>) {
    if (!selectedId) return;
    ptlStore.updateZoneRateCard(selectedId, fields);
  }

  function handleDuplicate(id: string) {
    const clone = ptlStore.duplicateZoneRateCard(id);
    if (clone) { setSelectedId(clone.id); setView('detail'); }
  }

  return (
    <div>
      {/* Info banner */}
      {view === 'list' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-start gap-2">
          <Info size={15} className="text-blue-600 mt-0.5 flex-shrink-0"/>
          <p className="text-sm text-blue-700">
            Zone rate cards use a <strong>14×14 zone matrix</strong> — the carrier-grade rate structure used by logistics companies like DTDC and Safexpress.
            Assign each card to a customer or carrier. For simpler weight-slab rates, use the <strong>Client Rate Cards</strong> tab.
          </p>
        </div>
      )}

      {view === 'list' && (
        <ListView
          cards={cards}
          clients={clients}
          carriers={carriers}
          onSelect={c => { setSelectedId(c.id); setView('detail'); }}
          onNew={() => setShowCreate(true)}
          onCalc={() => setShowCalc(true)}
          onDuplicate={handleDuplicate}
          onArchive={id => { ptlStore.archiveZoneRateCard(id); if (selectedId === id) setView('list'); }}
        />
      )}

      {view === 'detail' && selectedCard && (
        <DetailView
          card={selectedCard}
          allCards={cards}
          clients={clients}
          carriers={carriers}
          onBack={() => setView('list')}
          onUpdate={handleUpdate}
          onShowCalc={() => setShowCalc(true)}
        />
      )}

      {showCalc && (
        <FreightCalcDrawer
          rateCards={cards}
          defaultCardId={selectedId ?? undefined}
          onClose={() => setShowCalc(false)}
        />
      )}

      {showCreate && (
        <RateCardFormModal
          clients={clients}
          carriers={carriers}
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

// Default export: standalone page (kept for direct navigation if needed)
export default function PTLRateCards() {
  const clients = useMemo(() => {
    const seen = new Set<string>();
    return ptlStore.getClientRateCards()
      .filter(rc => { if (seen.has(rc.clientId)) return false; seen.add(rc.clientId); return true; })
      .map(rc => ({ id: rc.clientId, name: rc.clientName }));
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Zone Rate Cards</h1>
      <p className="text-sm text-gray-500 mb-5">Manage from PTL Settings → Zone Rate Cards</p>
      <ZoneRateCardsTab clients={clients}/>
    </div>
  );
}
