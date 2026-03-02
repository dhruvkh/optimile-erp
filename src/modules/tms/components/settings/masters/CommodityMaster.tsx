
import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import {
    Search, Plus, Download, Package, AlertTriangle, Thermometer,
    Shield, FlaskConical, Snowflake, Diamond, Boxes, Edit2, Trash2, X, Save
} from 'lucide-react';
import {
    Commodity, INITIAL_COMMODITY, CommodityCategory, HandlingInstruction
} from './types';

// Seed data
const SEED_COMMODITIES: Commodity[] = [
    {
        id: 'COM-001', code: 'FMCG-GEN', name: 'FMCG Consumer Goods', category: 'FMCG', hsn: '3304',
        isHazmat: false, isFragile: false, isTemperatureSensitive: false,
        temperatureRequirement: { required: false, minTemp: 0, maxTemp: 50, unit: 'C' },
        isHighValue: false, isDimensionalCargo: false,
        handlingInstruction: 'Standard', specialNotes: '', packagingType: 'Palletized',
        insuranceRequired: false, defaultWeight: 1000, defaultVolume: 2.5, unitOfMeasure: 'Kg',
        permittedVehicleTypes: [], restrictedZones: [], requiresEscort: false, status: 'Active'
    },
    {
        id: 'COM-002', code: 'CHEM-HAZ', name: 'Industrial Chemicals (Hazardous)', category: 'Chemical', hsn: '2901',
        isHazmat: true, hazmatClass: '3', hazmatUnNumber: 'UN1993', isFragile: false, isTemperatureSensitive: false,
        temperatureRequirement: { required: false, minTemp: 0, maxTemp: 40, unit: 'C' },
        isHighValue: false, isDimensionalCargo: false,
        handlingInstruction: 'Keep Upright', specialNotes: 'ADR-certified vehicle only. Spill kit mandatory.',
        packagingType: 'Drum', insuranceRequired: true,
        defaultWeight: 5000, defaultVolume: 5.0, unitOfMeasure: 'Kg',
        permittedVehicleTypes: ['Tanker', '20FT'], restrictedZones: ['Central'],
        requiresEscort: true, status: 'Active'
    },
    {
        id: 'COM-003', code: 'PHARMA-TC', name: 'Pharmaceutical — Cold Chain', category: 'Pharmaceutical', hsn: '3004',
        isHazmat: false, isFragile: true, isTemperatureSensitive: true,
        temperatureRequirement: { required: true, minTemp: 2, maxTemp: 8, unit: 'C' },
        isHighValue: true, isDimensionalCargo: false,
        handlingInstruction: 'Fragile', specialNotes: 'Maintain 2-8°C. Temp logger mandatory. No direct sunlight.',
        packagingType: 'Box', insuranceRequired: true,
        defaultWeight: 200, defaultVolume: 0.5, unitOfMeasure: 'Kg',
        permittedVehicleTypes: ['Refer'], restrictedZones: [],
        requiresEscort: false, status: 'Active'
    },
    {
        id: 'COM-004', code: 'STEEL-HOT', name: 'Hot Rolled Steel Coils', category: 'Steel', hsn: '7208',
        isHazmat: false, isFragile: false, isTemperatureSensitive: false,
        temperatureRequirement: { required: false, minTemp: 0, maxTemp: 60, unit: 'C' },
        isHighValue: false, isDimensionalCargo: true,
        handlingInstruction: 'No Stack', specialNotes: 'Coil saddles mandatory. Max 2 coils per vehicle.',
        packagingType: 'Loose', insuranceRequired: true,
        defaultWeight: 20000, defaultVolume: 8, unitOfMeasure: 'Ton',
        permittedVehicleTypes: ['Trailer', '32FT'], restrictedZones: [],
        requiresEscort: false, status: 'Active'
    },
    {
        id: 'COM-005', code: 'ELEC-HV', name: 'Consumer Electronics', category: 'Electronics', hsn: '8471',
        isHazmat: false, isFragile: true, isTemperatureSensitive: false,
        temperatureRequirement: { required: false, minTemp: 0, maxTemp: 45, unit: 'C' },
        isHighValue: true, isDimensionalCargo: true,
        handlingInstruction: 'Top Load Only', specialNotes: 'GPS seal mandatory. Insurance required.',
        packagingType: 'Box', insuranceRequired: true,
        defaultWeight: 500, defaultVolume: 3, unitOfMeasure: 'Kg',
        permittedVehicleTypes: ['20FT', '32FT'], restrictedZones: [],
        requiresEscort: false, status: 'Active'
    },
    {
        id: 'COM-006', code: 'AGR-GRAIN', name: 'Food Grains — Wheat/Rice', category: 'Agricultural', hsn: '1001',
        isHazmat: false, isFragile: false, isTemperatureSensitive: false,
        temperatureRequirement: { required: false, minTemp: 0, maxTemp: 40, unit: 'C' },
        isHighValue: false, isDimensionalCargo: false,
        handlingInstruction: 'Standard', specialNotes: 'Tarpaulin cover required. Protect from moisture.',
        packagingType: 'Bag', insuranceRequired: false,
        defaultWeight: 25000, defaultVolume: 30, unitOfMeasure: 'Ton',
        permittedVehicleTypes: ['Trailer', '32FT', '20FT'], restrictedZones: [],
        requiresEscort: false, status: 'Active'
    },
];

const CATEGORIES: CommodityCategory[] = ['General', 'FMCG', 'Chemical', 'Pharmaceutical', 'Agricultural', 'Steel', 'Electronics', 'Textile', 'Automobile', 'Construction', 'Other'];
const HANDLING: HandlingInstruction[] = ['Standard', 'Fragile', 'Top Load Only', 'Keep Upright', 'Stack Max 2', 'No Stack'];

const FLAG_BADGE = (active: boolean, icon: React.ReactNode, label: string, color: string) =>
    active ? (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${color}`}>
            {icon} {label}
        </span>
    ) : null;

export const CommodityMaster: React.FC = () => {
    const [commodities, setCommodities] = useState<Commodity[]>(SEED_COMMODITIES);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterHazmat, setFilterHazmat] = useState('All');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState<Commodity>(INITIAL_COMMODITY);
    const [formError, setFormError] = useState('');

    const filtered = commodities.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = filterCategory === 'All' || c.category === filterCategory;
        const matchHaz = filterHazmat === 'All' || (filterHazmat === 'Hazmat' && c.isHazmat) || (filterHazmat === 'Cold Chain' && c.isTemperatureSensitive) || (filterHazmat === 'Fragile' && c.isFragile) || (filterHazmat === 'High Value' && c.isHighValue);
        return matchSearch && matchCat && matchHaz;
    });

    const handleAdd = () => { setFormData({ ...INITIAL_COMMODITY, id: `COM-${String(commodities.length + 1).padStart(3, '0')}`, code: '' }); setEditingId(null); setIsFormOpen(true); };
    const handleEdit = (c: Commodity) => { setFormData({ ...c }); setEditingId(c.id); setIsFormOpen(true); };
    const handleSave = () => {
        if (!formData.name || !formData.code) { setFormError('Name and Code are required.'); return; }
        setFormError('');
        if (editingId) {
            setCommodities(prev => prev.map(c => c.id === editingId ? formData : c));
        } else {
            setCommodities(prev => [...prev, formData]);
        }
        setIsFormOpen(false);
    };
    const handleDelete = (id: string) => setCommodities(prev => prev.filter(c => c.id !== id));

    // Stats
    const hazmatCount = commodities.filter(c => c.isHazmat).length;
    const coldChainCount = commodities.filter(c => c.isTemperatureSensitive).length;
    const highValueCount = commodities.filter(c => c.isHighValue).length;

    if (isFormOpen) {
        return (
            <Card className="p-0 overflow-hidden" bodyClassName="p-0">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Commodity' : 'Add New Commodity'}</h2>
                        <p className="text-sm text-gray-500">ID: {formData.id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        {formError && <p className="text-red-500 text-sm mt-1">{formError}</p>}
                        <div className="flex space-x-3">
                            <Button variant="outline" onClick={() => setIsFormOpen(false)}><X className="h-4 w-4 mr-1" /> Cancel</Button>
                            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700"><Save className="h-4 w-4 mr-2" /> Save</Button>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Basic */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Code *" value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="FMCG-GEN" />
                        <Input label="Name *" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select className="block w-full border-gray-300 rounded-md text-sm py-2 px-3 border" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value as CommodityCategory }))}>
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <Input label="HSN Code" value={formData.hsn} onChange={e => setFormData(p => ({ ...p, hsn: e.target.value }))} placeholder="3304" />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Packaging</label>
                            <select className="block w-full border-gray-300 rounded-md text-sm py-2 px-3 border" value={formData.packagingType} onChange={e => setFormData(p => ({ ...p, packagingType: e.target.value }))}>
                                {['Palletized', 'Loose', 'Drum', 'Bag', 'Box', 'Crate', 'Bundle', 'Container'].map(v => <option key={v}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Handling</label>
                            <select className="block w-full border-gray-300 rounded-md text-sm py-2 px-3 border" value={formData.handlingInstruction} onChange={e => setFormData(p => ({ ...p, handlingInstruction: e.target.value as HandlingInstruction }))}>
                                {HANDLING.map(h => <option key={h}>{h}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Flags */}
                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">Commodity Flags</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { key: 'isHazmat', label: 'Hazardous Material', icon: <FlaskConical className="h-4 w-4" />, color: 'text-red-600' },
                                { key: 'isFragile', label: 'Fragile', icon: <Diamond className="h-4 w-4" />, color: 'text-amber-600' },
                                { key: 'isTemperatureSensitive', label: 'Temperature Sensitive', icon: <Snowflake className="h-4 w-4" />, color: 'text-blue-600' },
                                { key: 'isHighValue', label: 'High Value', icon: <Shield className="h-4 w-4" />, color: 'text-purple-600' },
                                { key: 'isDimensionalCargo', label: 'Dimensional / OD Cargo', icon: <Boxes className="h-4 w-4" />, color: 'text-gray-600' },
                                { key: 'insuranceRequired', label: 'Insurance Required', icon: <Shield className="h-4 w-4" />, color: 'text-green-600' },
                                { key: 'requiresEscort', label: 'Escort Required', icon: <AlertTriangle className="h-4 w-4" />, color: 'text-orange-600' },
                            ].map(f => (
                                <label key={f.key} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${(formData as any)[f.key] ? 'bg-gray-100 border-gray-300' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <input type="checkbox" className="rounded" checked={(formData as any)[f.key]} onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.checked }))} />
                                    <span className={`${f.color}`}>{f.icon}</span>
                                    <span className="text-sm text-gray-700">{f.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Temperature */}
                    {formData.isTemperatureSensitive && (
                        <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center"><Thermometer className="h-4 w-4 mr-2 text-blue-600" /> Temperature Requirements</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <Input label="Min Temp (°C)" type="number" value={formData.temperatureRequirement.minTemp} onChange={e => setFormData(p => ({ ...p, temperatureRequirement: { ...p.temperatureRequirement, required: true, minTemp: Number(e.target.value) } }))} />
                                <Input label="Max Temp (°C)" type="number" value={formData.temperatureRequirement.maxTemp} onChange={e => setFormData(p => ({ ...p, temperatureRequirement: { ...p.temperatureRequirement, required: true, maxTemp: Number(e.target.value) } }))} />
                            </div>
                        </div>
                    )}

                    {/* Hazmat */}
                    {formData.isHazmat && (
                        <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center"><FlaskConical className="h-4 w-4 mr-2 text-red-600" /> Hazmat Classification</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Hazmat Class (1-9)" value={formData.hazmatClass || ''} onChange={e => setFormData(p => ({ ...p, hazmatClass: e.target.value }))} placeholder="3" />
                                <Input label="UN Number" value={formData.hazmatUnNumber || ''} onChange={e => setFormData(p => ({ ...p, hazmatUnNumber: e.target.value }))} placeholder="UN1993" />
                            </div>
                        </div>
                    )}

                    {/* Weight & Volume */}
                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">Weight & Volume</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <Input label="Default Weight" type="number" value={formData.defaultWeight} onChange={e => setFormData(p => ({ ...p, defaultWeight: Number(e.target.value) }))} />
                            <Input label="Default Volume (CBM)" type="number" value={formData.defaultVolume} onChange={e => setFormData(p => ({ ...p, defaultVolume: Number(e.target.value) }))} />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                <select className="block w-full border-gray-300 rounded-md text-sm py-2 px-3 border" value={formData.unitOfMeasure} onChange={e => setFormData(p => ({ ...p, unitOfMeasure: e.target.value as any }))}>
                                    <option>Kg</option><option>Ton</option><option>Liter</option><option>CBM</option><option>Pcs</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Special Notes */}
                    <div className="border-t border-gray-100 pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Special Notes / Handling Instructions</label>
                        <textarea className="w-full border border-gray-300 rounded-md p-2 text-sm" rows={3} value={formData.specialNotes} onChange={e => setFormData(p => ({ ...p, specialNotes: e.target.value }))} />
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Commodity Master</h2>
                    <p className="text-sm text-gray-500">Manage commodity types, handling requirements, and compliance flags.</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export</Button>
                    <Button size="sm" onClick={handleAdd}><Plus className="h-4 w-4 mr-2" /> Add Commodity</Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="text-2xl font-bold text-gray-900">{commodities.length}</div>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <div className="text-xs text-gray-500 flex items-center"><FlaskConical className="h-3 w-3 mr-1" /> Hazmat</div>
                    <div className="text-2xl font-bold text-red-700">{hazmatCount}</div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="text-xs text-gray-500 flex items-center"><Snowflake className="h-3 w-3 mr-1" /> Cold Chain</div>
                    <div className="text-2xl font-bold text-blue-700">{coldChainCount}</div>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                    <div className="text-xs text-gray-500 flex items-center"><Shield className="h-3 w-3 mr-1" /> High Value</div>
                    <div className="text-2xl font-bold text-purple-700">{highValueCount}</div>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Active</div>
                    <div className="text-2xl font-bold text-green-700">{commodities.filter(c => c.status === 'Active').length}</div>
                </div>
            </div>

            {/* Search + Filters */}
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" placeholder="Search by name or code..." className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-md" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <select className="border-gray-300 rounded-md text-sm py-1.5 px-3 border" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <select className="border-gray-300 rounded-md text-sm py-1.5 px-3 border" value={filterHazmat} onChange={e => setFilterHazmat(e.target.value)}>
                    <option value="All">All Types</option>
                    <option>Hazmat</option><option>Cold Chain</option><option>Fragile</option><option>High Value</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code / Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HSN</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flags</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Handling</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Packaging</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filtered.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50 group">
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-bold text-gray-900">{c.name}</div>
                                        <div className="text-xs text-gray-500 font-mono">{c.code}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{c.category}</td>
                                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{c.hsn || '-'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {FLAG_BADGE(c.isHazmat, <FlaskConical className="h-3 w-3" />, 'HAZMAT', 'bg-red-100 text-red-700')}
                                            {FLAG_BADGE(c.isFragile, <Diamond className="h-3 w-3" />, 'FRAGILE', 'bg-amber-100 text-amber-700')}
                                            {FLAG_BADGE(c.isTemperatureSensitive, <Snowflake className="h-3 w-3" />, `${c.temperatureRequirement.minTemp}-${c.temperatureRequirement.maxTemp}°C`, 'bg-blue-100 text-blue-700')}
                                            {FLAG_BADGE(c.isHighValue, <Shield className="h-3 w-3" />, 'HIGH VALUE', 'bg-purple-100 text-purple-700')}
                                            {FLAG_BADGE(c.requiresEscort, <AlertTriangle className="h-3 w-3" />, 'ESCORT', 'bg-orange-100 text-orange-700')}
                                            {!c.isHazmat && !c.isFragile && !c.isTemperatureSensitive && !c.isHighValue && <span className="text-xs text-gray-400">Standard</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600">{c.handlingInstruction}</td>
                                    <td className="px-4 py-3 text-xs text-gray-600">{c.packagingType}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${c.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(c)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="h-3.5 w-3.5" /></button>
                                            <button onClick={() => handleDelete(c.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No commodities found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
