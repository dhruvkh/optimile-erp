import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings, Building2, FileText, Truck, Save, Plus, Edit3,
  Trash2, CheckCircle,
  ToggleLeft, ToggleRight, Info, Grid3x3, ArrowRight
} from 'lucide-react';
import { ptlStore } from '../../services/ptlStore';
import type { PTLVendorRateCard, PTLZoneRateCard } from '../../services/ptlTypes';
import { ZoneRateCardsTab } from './PTLRateCards';
import { masterDataStore } from '../../../../shared/services/masterDataStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PTLConfigLocal {
  docketPrefix: string;
  seqReset: 'daily' | 'monthly';
  eWayBillThreshold: number;
  freeStorageDays: number;
  fleetModels: { Own: boolean; Leased: boolean; Market: boolean; Carrier: boolean };
  notifyDelivery: boolean;
  notifyException: boolean;
  transitSLA: { origin: string; dest: string; days: number }[];
}

const CONFIG_KEY = 'ptl_settings_config_v1';

function loadConfig(): PTLConfigLocal {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    docketPrefix: 'PTL',
    seqReset: 'daily',
    eWayBillThreshold: 50000,
    freeStorageDays: 3,
    fleetModels: { Own: true, Leased: true, Market: true, Carrier: true },
    notifyDelivery: true,
    notifyException: true,
    transitSLA: [
      { origin: 'Mumbai', dest: 'Delhi', days: 3 },
      { origin: 'Mumbai', dest: 'Bangalore', days: 2 },
      { origin: 'Delhi', dest: 'Mumbai', days: 3 },
      { origin: 'Bangalore', dest: 'Chennai', days: 1 },
    ],
  };
}

function saveConfig(cfg: PTLConfigLocal) { localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); }

// ─── Hub Master (inline) ──────────────────────────────────────────────────────

interface Hub { id: string; name: string; city: string; state: string; address: string; managerId?: string; capacity?: number; status: 'Active' | 'Inactive'; }
const HUB_STORE_KEY = 'ptl_hub_master_v1';
const SEED_HUBS: Hub[] = [
  { id: 'HUB-MUM', name: 'Mumbai Hub', city: 'Mumbai', state: 'Maharashtra', address: 'MIDC, Andheri East', capacity: 500, status: 'Active' },
  { id: 'HUB-DEL', name: 'Delhi Hub', city: 'Delhi', state: 'Delhi', address: 'Naraina Industrial Area', capacity: 400, status: 'Active' },
  { id: 'HUB-BLR', name: 'Bangalore Hub', city: 'Bangalore', state: 'Karnataka', address: 'Peenya Industrial Area', capacity: 300, status: 'Active' },
  { id: 'HUB-CHN', name: 'Chennai Hub', city: 'Chennai', state: 'Tamil Nadu', address: 'Ambattur Industrial Estate', capacity: 250, status: 'Active' },
  { id: 'HUB-HYD', name: 'Hyderabad Hub', city: 'Hyderabad', state: 'Telangana', address: 'Patancheru Industrial Area', capacity: 200, status: 'Active' },
  { id: 'HUB-KOL', name: 'Kolkata Hub', city: 'Kolkata', state: 'West Bengal', address: 'Dankuni Industrial Complex', capacity: 150, status: 'Active' },
];

function loadHubs(): Hub[] {
  try {
    const stored = localStorage.getItem(HUB_STORE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return SEED_HUBS;
}
function saveHubs(hubs: Hub[]) { localStorage.setItem(HUB_STORE_KEY, JSON.stringify(hubs)); }

function HubMasterTab() {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [editing, setEditing] = useState<Hub | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Hub, 'id'>>({ name: '', city: '', state: '', address: '', capacity: 100, status: 'Active' });

  useEffect(() => { setHubs(loadHubs()); }, []);

  const set = (k: keyof typeof form, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    let updated: Hub[];
    if (editing) {
      updated = hubs.map(h => h.id === editing.id ? { ...h, ...form } : h);
    } else {
      const newHub: Hub = { id: `HUB-${form.city.slice(0, 3).toUpperCase()}-${Date.now()}`, ...form };
      updated = [...hubs, newHub];
    }
    saveHubs(updated);
    setHubs(updated);
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', city: '', state: '', address: '', capacity: 100, status: 'Active' });
  };

  const openEdit = (hub: Hub) => {
    setEditing(hub);
    setForm({ name: hub.name, city: hub.city, state: hub.state, address: hub.address, capacity: hub.capacity || 100, status: hub.status });
    setShowForm(true);
  };

  const toggleStatus = (id: string) => {
    const updated = hubs.map(h => h.id === id ? { ...h, status: h.status === 'Active' ? 'Inactive' as const : 'Active' as const } : h);
    saveHubs(updated);
    setHubs(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{hubs.filter(h => h.status === 'Active').length} active hubs</p>
        <button onClick={() => { setEditing(null); setShowForm(!showForm); }}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus size={14} /> Add Hub
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border rounded-xl p-4 mb-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">{editing ? 'Edit Hub' : 'New Hub'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">Hub Name *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Mumbai Hub" /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">City *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">State</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.state} onChange={e => set('state', e.target.value)} placeholder="Maharashtra" /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">Capacity (dockets/day)</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.capacity} onChange={e => set('capacity', +e.target.value)} /></div>
            <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">Address</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={!form.name || !form.city}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 flex items-center gap-1">
              <Save size={13} /> {editing ? 'Save' : 'Add Hub'}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }}
              className="px-3 py-1.5 border text-sm rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {hubs.map(hub => (
          <div key={hub.id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 size={18} className="text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">{hub.name}</div>
                <div className="text-xs text-gray-400">{hub.city}, {hub.state} · {hub.address}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-gray-400">Capacity</div>
                <div className="text-sm font-medium text-gray-700">{hub.capacity || '—'} dockets/day</div>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${hub.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {hub.status}
              </span>
              <button onClick={() => openEdit(hub)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                <Edit3 size={14} />
              </button>
              <button onClick={() => toggleStatus(hub.id)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded">
                {hub.status === 'Active' ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Client Rate Cards Tab ────────────────────────────────────────────────────
// Shows all platform customers and their linked zone-based rate card.
// Rate card creation / editing happens in the "Zone Rate Cards" tab.

function ClientRateCardsTab({ onGoToZoneRates }: { onGoToZoneRates: () => void }) {
  const customers = masterDataStore.getActiveCustomers();
  const [zoneCards, setZoneCards] = useState<PTLZoneRateCard[]>([]);

  useEffect(() => {
    setZoneCards(ptlStore.getZoneRateCards().filter(rc => !!rc.customerId));
  }, []);

  const getCard = (customerId: string): PTLZoneRateCard | undefined =>
    zoneCards.find(rc => rc.customerId === customerId && rc.status === 'Active') ??
    zoneCards.find(rc => rc.customerId === customerId);

  const assigned = customers.filter(c => getCard(c.id));
  const unassigned = customers.filter(c => !getCard(c.id));

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span><span className="font-semibold text-green-600">{assigned.length}</span> clients with zone rate card</span>
          {unassigned.length > 0 && (
            <span><span className="font-semibold text-amber-600">{unassigned.length}</span> without rate card</span>
          )}
        </div>
        <button
          onClick={onGoToZoneRates}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus size={14} /> New Rate Card
        </button>
      </div>

      {/* Client table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              {['Client', 'Tier', 'GSTIN', 'Zone Rate Card', 'Service Type', 'Valid Until', 'Status', ''].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map(c => {
              const card = getCard(c.id);
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{c.name}</div>
                    {c.contacts?.primary?.name && (
                      <div className="text-xs text-gray-400 mt-0.5">{c.contacts.primary.designation || c.contacts.primary.name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.tier === 'Premium' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                    }`}>{c.tier}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">{c.gstin}</td>
                  <td className="px-4 py-3">
                    {card ? (
                      <div className="text-xs font-medium text-gray-800">{card.name}</div>
                    ) : (
                      <span className="text-xs text-amber-600 font-medium italic">No rate card assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{card?.serviceType ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{card?.expiryDate ?? '—'}</td>
                  <td className="px-4 py-3">
                    {card ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        card.status === 'Active' ? 'bg-green-100 text-green-700' :
                        card.status === 'Expired' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{card.status}</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={onGoToZoneRates}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {card ? 'Edit' : 'Assign'} <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info callout */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
        <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Zone-matrix rate cards</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Each client is billed using a 14-zone rate matrix covering Surface and Air modes.
            Click <strong>New Rate Card</strong> or <strong>Assign →</strong> to open the Zone Rate Cards manager and link a card to a client.
            Zone rate cards take priority over legacy slab-based rates in the booking wizard.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Vendor Rate Cards Tab ────────────────────────────────────────────────────

function VendorRateCardsTab() {
  const [rateCards, setRateCards] = useState<PTLVendorRateCard[]>([]);

  useEffect(() => {
    setRateCards(ptlStore.getVendorRateCards());
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {rateCards.filter(rc => rc.status === 'Active').length} active carrier rate cards ·
          Manage from <span className="text-blue-600">Carrier Hub → Carrier Detail → Rate Cards</span>
        </p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-start gap-3">
        <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700">
          Carrier rate cards are managed per-carrier from the <strong>Carrier Hub</strong> page.
          Use this tab for a consolidated read-only view of all carrier rate cards across the network.
        </p>
      </div>
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              {['Carrier', 'Lane', 'Vehicle', 'Rate Type', 'Base Rate', 'Min Charge', 'Validity', 'Status'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rateCards.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">No carrier rate cards configured</td></tr>
            ) : rateCards.map(rc => (
              <tr key={rc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{rc.vendorName}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{rc.originCity} → {rc.destinationCity}</td>
                <td className="px-4 py-3 text-gray-600">{rc.vehicleType}</td>
                <td className="px-4 py-3 text-gray-600">{rc.rateType}</td>
                <td className="px-4 py-3 font-medium text-gray-900">₹{rc.baseRate}</td>
                <td className="px-4 py-3 text-gray-600">₹{rc.minimumCharge}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{rc.validFrom} → {rc.validTo}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    rc.status === 'Active' ? 'bg-green-100 text-green-700' :
                    rc.status === 'Expired' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}>{rc.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── General Config Tab ───────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function GeneralConfigTab() {
  const [config, setConfig] = useState<PTLConfigLocal>(loadConfig());
  const [saved, setSaved] = useState(false);
  const [newSLA, setNewSLA] = useState({ origin: '', dest: '', days: 3 });

  const set = <K extends keyof PTLConfigLocal>(k: K, v: PTLConfigLocal[K]) => {
    setConfig(c => ({ ...c, [k]: v }));
    setSaved(false);
  };

  const handleSave = () => {
    saveConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addSLA = () => {
    if (!newSLA.origin || !newSLA.dest) return;
    set('transitSLA', [...config.transitSLA, { ...newSLA }]);
    setNewSLA({ origin: '', dest: '', days: 3 });
  };

  const removeSLA = (i: number) => {
    set('transitSLA', config.transitSLA.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-6">
      {/* Docket Numbering */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h4 className="font-semibold text-gray-900 text-sm mb-4">Docket Numbering</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Docket Number Prefix</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={config.docketPrefix}
              onChange={e => set('docketPrefix', e.target.value)} placeholder="PTL" />
            <p className="text-xs text-gray-400 mt-1">
              Format: {config.docketPrefix}-{'{'}{`HUB-CODE`}{'}'}-YYMMDD-SEQ
            </p>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Sequence Reset</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm"
              value={config.seqReset} onChange={e => set('seqReset', e.target.value as 'daily' | 'monthly')}>
              <option value="daily">Daily (resets every day)</option>
              <option value="monthly">Monthly (resets every month)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h4 className="font-semibold text-gray-900 text-sm mb-4">Compliance & Storage</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">eWay Bill Threshold (₹)</label>
            <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={config.eWayBillThreshold}
              onChange={e => set('eWayBillThreshold', +e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Warn if declared value exceeds this without eWay Bill</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Default Free Storage Days</label>
            <input type="number" min="0" max="30" className="w-full border rounded-lg px-3 py-2 text-sm"
              value={config.freeStorageDays} onChange={e => set('freeStorageDays', +e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Demurrage starts after this many days at hub</p>
          </div>
        </div>
      </div>

      {/* Fleet Models */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h4 className="font-semibold text-gray-900 text-sm mb-4">Fleet Model Visibility (Booking Wizard)</h4>
        <div className="grid grid-cols-2 gap-4">
          {(Object.keys(config.fleetModels) as (keyof typeof config.fleetModels)[]).map(model => (
            <div key={model} className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <div className="text-sm font-medium text-gray-900">{model} Fleet</div>
                <div className="text-xs text-gray-400">
                  {model === 'Own' ? 'Company-owned vehicles' :
                   model === 'Leased' ? 'Long-term leased vehicles' :
                   model === 'Market' ? 'Spot hire / market vehicles' :
                   'External carrier / 3PL vendors'}
                </div>
              </div>
              <Toggle
                checked={config.fleetModels[model]}
                onChange={v => set('fleetModels', { ...config.fleetModels, [model]: v })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Transit SLA Matrix */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h4 className="font-semibold text-gray-900 text-sm mb-4">Transit SLA Matrix (Days)</h4>
        <div className="space-y-2 mb-3">
          {config.transitSLA.map((sla, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-24 text-gray-700 font-medium">{sla.origin}</span>
              <span className="text-gray-400">→</span>
              <span className="w-24 text-gray-700 font-medium">{sla.dest}</span>
              <span className="w-12 text-center text-blue-700 font-bold">{sla.days}d</span>
              <button onClick={() => removeSLA(i)} className="text-red-400 hover:text-red-600">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <input className="flex-1 border rounded-lg px-3 py-2 text-sm" value={newSLA.origin}
            onChange={e => setNewSLA(s => ({ ...s, origin: e.target.value }))} placeholder="Origin city" />
          <span className="text-gray-400">→</span>
          <input className="flex-1 border rounded-lg px-3 py-2 text-sm" value={newSLA.dest}
            onChange={e => setNewSLA(s => ({ ...s, dest: e.target.value }))} placeholder="Dest city" />
          <input type="number" min="1" max="30" className="w-16 border rounded-lg px-3 py-2 text-sm text-center"
            value={newSLA.days} onChange={e => setNewSLA(s => ({ ...s, days: +e.target.value }))} />
          <button onClick={addSLA} disabled={!newSLA.origin || !newSLA.dest}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40">
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h4 className="font-semibold text-gray-900 text-sm mb-4">Notifications</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Delivery Alerts</div>
              <div className="text-xs text-gray-400">Notify on POD confirmation and delivery</div>
            </div>
            <Toggle checked={config.notifyDelivery} onChange={v => set('notifyDelivery', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Exception Alerts</div>
              <div className="text-xs text-gray-400">Notify on new exceptions and escalations</div>
            </div>
            <Toggle checked={config.notifyException} onChange={v => set('notifyException', v)} />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 shadow-sm">
          <Save size={14} /> Save Configuration
        </button>
        {saved && (
          <div className="flex items-center gap-1.5 text-green-600 text-sm">
            <CheckCircle size={16} /> Configuration saved!
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type SettingsTab = 'hubs' | 'client-rates' | 'vendor-rates' | 'zone-rates' | 'general';

export default function PTLSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('hubs');

  const clients = useMemo(
    () => masterDataStore.getActiveCustomers().map(c => ({ id: c.id, name: c.name })),
    []
  );

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'hubs',         label: 'Hub Master',        icon: <Building2 size={14} /> },
    { id: 'client-rates', label: 'Client Rate Cards',  icon: <FileText size={14} /> },
    { id: 'vendor-rates', label: 'Carrier Rate Cards', icon: <Truck size={14} /> },
    { id: 'zone-rates',   label: 'Zone Rate Cards',    icon: <Grid3x3 size={14} /> },
    { id: 'general',      label: 'General Config',     icon: <Settings size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">PTL Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure hubs, rate cards, and PTL module behaviour</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors ${
                  activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'hubs'         && <HubMasterTab />}
          {activeTab === 'client-rates' && <ClientRateCardsTab onGoToZoneRates={() => setActiveTab('zone-rates')} />}
          {activeTab === 'vendor-rates' && <VendorRateCardsTab />}
          {activeTab === 'zone-rates'   && <ZoneRateCardsTab clients={clients} />}
          {activeTab === 'general'      && <GeneralConfigTab />}
        </div>
      </div>
    </div>
  );
}
