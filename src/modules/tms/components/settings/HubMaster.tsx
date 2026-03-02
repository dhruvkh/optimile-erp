import React, { useState } from 'react';
import {
    Plus, Edit2, Trash2, Search, Building2, MapPin, Clock, Users,
    CheckCircle, XCircle, ChevronDown, X, Save, Phone, Mail
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Hub {
    id: string;
    hubCode: string;
    name: string;
    city: string;
    state: string;
    address: string;
    hubType: 'Transit' | 'Destination' | 'Both';
    zonesServed: string[];
    capacityVolume: number;    // m³
    capacityWeight: number;    // tons
    managerName: string;
    managerPhone: string;
    managerEmail: string;
    operatingHoursStart: string;
    operatingHoursEnd: string;
    status: 'Active' | 'Inactive';
    currentUtilization?: number;
}

// ─── Shared Hub Store (mock) ─────────────────────────────────────────────────
// This is exported so PTL Operations can import the same hub list.

export const INITIAL_HUBS: Hub[] = [
    {
        id: 'hub-1', hubCode: 'HUB-MUM', name: 'Mumbai Hub', city: 'Mumbai', state: 'Maharashtra',
        address: 'Bhiwandi Warehouse Complex, NH-3, Thane', hubType: 'Both',
        zonesServed: ['Mumbai', 'Navi Mumbai', 'Thane', 'Pune', 'Nashik'],
        capacityVolume: 500, capacityWeight: 200, managerName: 'Arun Mehta',
        managerPhone: '+91-9876500001', managerEmail: 'arun.mehta@optimile.com',
        operatingHoursStart: '06:00', operatingHoursEnd: '22:00', status: 'Active', currentUtilization: 72,
    },
    {
        id: 'hub-2', hubCode: 'HUB-DEL', name: 'Delhi Hub', city: 'Delhi', state: 'Delhi',
        address: 'Kundli Industrial Area, Sonipat Border', hubType: 'Both',
        zonesServed: ['Delhi', 'Noida', 'Gurgaon', 'Ghaziabad', 'Faridabad', 'Chandigarh'],
        capacityVolume: 600, capacityWeight: 250, managerName: 'Priya Sharma',
        managerPhone: '+91-9876500002', managerEmail: 'priya.sharma@optimile.com',
        operatingHoursStart: '06:00', operatingHoursEnd: '23:00', status: 'Active', currentUtilization: 55,
    },
    {
        id: 'hub-3', hubCode: 'HUB-BLR', name: 'Bangalore Hub', city: 'Bangalore', state: 'Karnataka',
        address: 'Nelamangala Industrial Zone, NH-48', hubType: 'Both',
        zonesServed: ['Bangalore', 'Mysore', 'Hubli', 'Mangalore'],
        capacityVolume: 350, capacityWeight: 150, managerName: 'Rajesh Kumar',
        managerPhone: '+91-9876500003', managerEmail: 'rajesh.k@optimile.com',
        operatingHoursStart: '07:00', operatingHoursEnd: '21:00', status: 'Active', currentUtilization: 38,
    },
    {
        id: 'hub-4', hubCode: 'HUB-CHN', name: 'Chennai Hub', city: 'Chennai', state: 'Tamil Nadu',
        address: 'Sriperumbudur Logistics Park, GST Road', hubType: 'Both',
        zonesServed: ['Chennai', 'Coimbatore', 'Madurai', 'Trichy'],
        capacityVolume: 300, capacityWeight: 120, managerName: 'Karthik Subramanian',
        managerPhone: '+91-9876500004', managerEmail: 'karthik.s@optimile.com',
        operatingHoursStart: '06:30', operatingHoursEnd: '21:30', status: 'Active', currentUtilization: 45,
    },
    {
        id: 'hub-5', hubCode: 'HUB-HYD', name: 'Hyderabad Hub', city: 'Hyderabad', state: 'Telangana',
        address: 'Shamshabad Cargo Hub, Near RGIA', hubType: 'Both',
        zonesServed: ['Hyderabad', 'Secunderabad', 'Warangal', 'Vijayawada'],
        capacityVolume: 280, capacityWeight: 110, managerName: 'Venkat Reddy',
        managerPhone: '+91-9876500005', managerEmail: 'venkat.r@optimile.com',
        operatingHoursStart: '07:00', operatingHoursEnd: '22:00', status: 'Active', currentUtilization: 30,
    },
    {
        id: 'hub-6', hubCode: 'HUB-KOL', name: 'Kolkata Hub', city: 'Kolkata', state: 'West Bengal',
        address: 'Dankuni Freight Terminal, NH-2', hubType: 'Transit',
        zonesServed: ['Kolkata', 'Howrah', 'Siliguri', 'Bhubaneswar'],
        capacityVolume: 200, capacityWeight: 80, managerName: 'Sanjay Das',
        managerPhone: '+91-9876500006', managerEmail: 'sanjay.d@optimile.com',
        operatingHoursStart: '07:00', operatingHoursEnd: '20:00', status: 'Active', currentUtilization: 22,
    },
    {
        id: 'hub-7', hubCode: 'HUB-JAI', name: 'Jaipur Hub', city: 'Jaipur', state: 'Rajasthan',
        address: 'Sitapura Industrial Area, Tonk Road', hubType: 'Destination',
        zonesServed: ['Jaipur', 'Jodhpur', 'Udaipur', 'Ajmer'],
        capacityVolume: 180, capacityWeight: 70, managerName: 'Mahesh Joshi',
        managerPhone: '+91-9876500007', managerEmail: 'mahesh.j@optimile.com',
        operatingHoursStart: '07:00', operatingHoursEnd: '20:00', status: 'Active', currentUtilization: 18,
    },
    {
        id: 'hub-8', hubCode: 'HUB-AMD', name: 'Ahmedabad Hub', city: 'Ahmedabad', state: 'Gujarat',
        address: 'Sanand GIDC, SG Highway', hubType: 'Both',
        zonesServed: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
        capacityVolume: 250, capacityWeight: 100, managerName: 'Dhruv Patel',
        managerPhone: '+91-9876500008', managerEmail: 'dhruv.p@optimile.com',
        operatingHoursStart: '06:30', operatingHoursEnd: '21:00', status: 'Inactive', currentUtilization: 0,
    },
];

// Helper to find hub by city
export const findHubByCity = (city: string, hubs: Hub[]): Hub | undefined => {
    return hubs.find(h => h.status === 'Active' && h.zonesServed.some(z => z.toLowerCase() === city.toLowerCase()));
};

// ─── Component ───────────────────────────────────────────────────────────────

export const HubMaster: React.FC = () => {
    const [hubs, setHubs] = useState<Hub[]>(INITIAL_HUBS);
    const [search, setSearch] = useState('');
    const [editingHub, setEditingHub] = useState<Hub | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const filtered = hubs.filter(h =>
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.city.toLowerCase().includes(search.toLowerCase()) ||
        h.hubCode.toLowerCase().includes(search.toLowerCase())
    );

    const emptyHub: Hub = {
        id: '', hubCode: '', name: '', city: '', state: '', address: '', hubType: 'Both',
        zonesServed: [], capacityVolume: 0, capacityWeight: 0, managerName: '',
        managerPhone: '', managerEmail: '', operatingHoursStart: '07:00',
        operatingHoursEnd: '21:00', status: 'Active',
    };

    const openCreate = () => { setEditingHub({ ...emptyHub, id: `hub-${Date.now()}` }); setShowForm(true); };
    const openEdit = (hub: Hub) => { setEditingHub({ ...hub }); setShowForm(true); };
    const closeForm = () => { setEditingHub(null); setShowForm(false); };

    const handleSave = () => {
        if (!editingHub) return;
        if (!editingHub.hubCode || !editingHub.name || !editingHub.city) {
            showToast('⚠️ Hub Code, Name, and City are required'); return;
        }
        const exists = hubs.find(h => h.id === editingHub.id);
        if (exists) {
            setHubs(prev => prev.map(h => h.id === editingHub.id ? editingHub : h));
            showToast(`✅ ${editingHub.name} updated`);
        } else {
            setHubs(prev => [...prev, editingHub]);
            showToast(`✅ ${editingHub.name} created`);
        }
        closeForm();
    };

    const handleDelete = (hub: Hub) => {
        if (confirm(`Delete ${hub.name}?`)) {
            setHubs(prev => prev.filter(h => h.id !== hub.id));
            showToast(`🗑️ ${hub.name} deleted`);
        }
    };

    const toggleStatus = (hub: Hub) => {
        setHubs(prev => prev.map(h => h.id === hub.id ? { ...h, status: h.status === 'Active' ? 'Inactive' as const : 'Active' as const } : h));
        showToast(`${hub.name} is now ${hub.status === 'Active' ? 'Inactive' : 'Active'}`);
    };

    const updateField = (field: keyof Hub, value: any) => {
        if (!editingHub) return;
        setEditingHub({ ...editingHub, [field]: value });
    };

    // ─── Form Modal ──────────────────────────────────────────────────────────
    const renderForm = () => {
        if (!showForm || !editingHub) return null;
        const isNew = !hubs.find(h => h.id === editingHub.id);

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeForm} />
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    <div className="sticky top-0 bg-primary text-white px-6 py-4 rounded-t-2xl flex justify-between items-center z-10">
                        <div>
                            <h2 className="text-lg font-bold">{isNew ? 'Create New Hub' : `Edit — ${editingHub.name}`}</h2>
                            <p className="text-sm opacity-80">All fields marked * are required</p>
                        </div>
                        <button onClick={closeForm} className="p-1 hover:bg-white/20 rounded-lg"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Basic Info */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-primary" /> Hub Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Hub Code *</label>
                                    <input className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" placeholder="HUB-XXX"
                                        value={editingHub.hubCode} onChange={e => updateField('hubCode', e.target.value.toUpperCase())} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Hub Name *</label>
                                    <input className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" placeholder="Mumbai Hub"
                                        value={editingHub.name} onChange={e => updateField('name', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Hub Type *</label>
                                    <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                                        value={editingHub.hubType} onChange={e => updateField('hubType', e.target.value)}>
                                        <option value="Both">Both (Transit + Destination)</option>
                                        <option value="Transit">Transit Hub</option>
                                        <option value="Destination">Destination Hub</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" /> Location
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">City *</label>
                                    <input className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                        value={editingHub.city} onChange={e => updateField('city', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">State</label>
                                    <input className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                        value={editingHub.state} onChange={e => updateField('state', e.target.value)} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-xs text-gray-600 mb-1">Address</label>
                                <input className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                    value={editingHub.address} onChange={e => updateField('address', e.target.value)} />
                            </div>
                            <div className="mt-4">
                                <label className="block text-xs text-gray-600 mb-1">Zones Served (comma-separated cities/areas)</label>
                                <input className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                    placeholder="Mumbai, Thane, Navi Mumbai, Pune"
                                    value={editingHub.zonesServed.join(', ')}
                                    onChange={e => updateField('zonesServed', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
                            </div>
                        </div>

                        {/* Capacity */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-primary" /> Capacity & Operations
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Volume (m³)</label>
                                    <input type="number" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                        value={editingHub.capacityVolume || ''} onChange={e => updateField('capacityVolume', parseInt(e.target.value) || 0)} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Weight (tons)</label>
                                    <input type="number" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                        value={editingHub.capacityWeight || ''} onChange={e => updateField('capacityWeight', parseInt(e.target.value) || 0)} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Opens At</label>
                                    <input type="time" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                        value={editingHub.operatingHoursStart} onChange={e => updateField('operatingHoursStart', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Closes At</label>
                                    <input type="time" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                        value={editingHub.operatingHoursEnd} onChange={e => updateField('operatingHoursEnd', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Manager */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" /> Hub Manager
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Name</label>
                                    <input className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                        value={editingHub.managerName} onChange={e => updateField('managerName', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Phone</label>
                                    <input className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                        value={editingHub.managerPhone} onChange={e => updateField('managerPhone', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Email</label>
                                    <input className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                        value={editingHub.managerEmail} onChange={e => updateField('managerEmail', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={closeForm} className="flex-1">Cancel</Button>
                            <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90 text-white">
                                <Save className="w-4 h-4 mr-2" /> {isNew ? 'Create Hub' : 'Update Hub'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ─── Main Render ─────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Toast */}
            {toast && (
                <div className="fixed top-4 right-4 z-[60] bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl text-sm animate-in slide-in-from-top-2 duration-300 max-w-md">
                    {toast}
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Hub Master</h2>
                    <p className="text-sm text-gray-500">Manage PTL hub locations, capacity, and zones served</p>
                </div>
                <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add Hub
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg" placeholder="Search hubs by name, city, or code..."
                    value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{hubs.filter(h => h.status === 'Active').length}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Active Hubs</p>
                </Card>
                <Card className="p-3 text-center">
                    <p className="text-2xl font-bold text-gray-600">{hubs.length}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Total Hubs</p>
                </Card>
                <Card className="p-3 text-center">
                    <p className="text-2xl font-bold text-orange-600">{hubs.reduce((s, h) => s + h.capacityWeight, 0)}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Total Capacity (T)</p>
                </Card>
                <Card className="p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{hubs.filter(h => h.zonesServed.length > 0).reduce((s, h) => s + h.zonesServed.length, 0)}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Zones Covered</p>
                </Card>
            </div>

            {/* Hub Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(hub => (
                    <Card key={hub.id} className={`p-0 overflow-hidden border-l-4 ${hub.status === 'Active' ? 'border-l-green-500' : 'border-l-gray-300'}`} bodyClassName="p-0">
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{hub.hubCode}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${hub.hubType === 'Both' ? 'bg-blue-100 text-blue-700' :
                                                hub.hubType === 'Transit' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'
                                            }`}>{hub.hubType}</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900 mt-1">{hub.name}</h3>
                                    <p className="text-xs text-gray-500">{hub.city}, {hub.state}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => toggleStatus(hub)} className={`p-1 rounded-md transition-colors ${hub.status === 'Active' ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
                                        }`} title={hub.status === 'Active' ? 'Deactivate' : 'Activate'}>
                                        {hub.status === 'Active' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => openEdit(hub)} className="p-1 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-md">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(hub)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Capacity Bar */}
                            {hub.currentUtilization !== undefined && hub.status === 'Active' && (
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-500">Utilization</span>
                                        <span className={`font-medium ${hub.currentUtilization > 80 ? 'text-red-600' : hub.currentUtilization > 60 ? 'text-orange-600' : 'text-green-600'}`}>
                                            {hub.currentUtilization}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div className={`h-1.5 rounded-full transition-all ${hub.currentUtilization > 80 ? 'bg-red-500' : hub.currentUtilization > 60 ? 'bg-orange-400' : 'bg-green-500'
                                            }`} style={{ width: `${hub.currentUtilization}%` }} />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-gray-500">Capacity:</span>
                                    <span className="font-medium text-gray-700 ml-1">{hub.capacityVolume} m³ / {hub.capacityWeight} T</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-gray-500">Hours:</span>
                                    <span className="font-medium text-gray-700 ml-1">{hub.operatingHoursStart}–{hub.operatingHoursEnd}</span>
                                </div>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1">
                                {hub.zonesServed.slice(0, 5).map(z => (
                                    <span key={z} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{z}</span>
                                ))}
                                {hub.zonesServed.length > 5 && (
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">+{hub.zonesServed.length - 5} more</span>
                                )}
                            </div>

                            {hub.managerName && (
                                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                    <Users className="w-3 h-3" /> {hub.managerName}
                                    {hub.managerPhone && <span className="ml-2"><Phone className="w-3 h-3 inline" /> {hub.managerPhone}</span>}
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {filtered.length === 0 && (
                <Card className="p-12 text-center">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400">No hubs found matching "{search}"</p>
                </Card>
            )}

            {/* Form Modal */}
            {renderForm()}
        </div>
    );
};
