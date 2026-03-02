
import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import {
    Search, Plus, Download, Truck, Package, AlertTriangle, Snowflake,
    FlaskConical, Ruler, Fuel, Edit2, Trash2, X, Save, Shield, Gauge
} from 'lucide-react';
import { VehicleTypeSpec, INITIAL_VEHICLE_TYPE, VehicleBodyType, FuelType } from './types';

// Seed data — common Indian logistics vehicle types
const SEED_VEHICLE_TYPES: VehicleTypeSpec[] = [
    {
        id: 'VT-001', code: 'LCV', name: 'Light Commercial Vehicle', displayName: 'LCV / Tata Ace',
        bodyType: 'Closed', lengthFt: 8, widthFt: 5, heightFt: 5,
        grossWeightCapacity: 2.5, netPayloadCapacity: 1.5, volumeCapacity: 5, tareWeight: 1.0,
        numAxles: 2, fuelType: 'Diesel', avgMileage: 12, requiresNationalPermit: false, requiresOverDimensionPermit: false,
        permittedCommodities: [], restrictedCommodities: [], isRefrigerated: false, isHazmatCertified: false, isADR: false,
        standardRatePerKm: 18, standardRatePerTrip: 3000, detentionRatePerHour: 200,
        ewayBillVehicleType: 'Regular', status: 'Active'
    },
    {
        id: 'VT-002', code: '17FT', name: '17ft Closed Body', displayName: '17 Ft Truck',
        bodyType: 'Closed', lengthFt: 17, widthFt: 6, heightFt: 6,
        grossWeightCapacity: 7, netPayloadCapacity: 4.5, volumeCapacity: 15, tareWeight: 2.5,
        numAxles: 2, fuelType: 'Diesel', avgMileage: 8, requiresNationalPermit: true, requiresOverDimensionPermit: false,
        permittedCommodities: [], restrictedCommodities: [], isRefrigerated: false, isHazmatCertified: false, isADR: false,
        standardRatePerKm: 28, standardRatePerTrip: 8000, detentionRatePerHour: 350,
        ewayBillVehicleType: 'Regular', status: 'Active'
    },
    {
        id: 'VT-003', code: '20FT', name: '20ft Closed Body', displayName: '20 Ft Truck',
        bodyType: 'Closed', lengthFt: 20, widthFt: 7, heightFt: 7,
        grossWeightCapacity: 10, netPayloadCapacity: 7, volumeCapacity: 25, tareWeight: 3,
        numAxles: 2, fuelType: 'Diesel', avgMileage: 6, requiresNationalPermit: true, requiresOverDimensionPermit: false,
        permittedCommodities: [], restrictedCommodities: [], isRefrigerated: false, isHazmatCertified: false, isADR: false,
        standardRatePerKm: 35, standardRatePerTrip: 15000, detentionRatePerHour: 500,
        ewayBillVehicleType: 'Regular', status: 'Active'
    },
    {
        id: 'VT-004', code: '32FT-SXL', name: '32ft Single Axle Closed', displayName: '32 Ft SXL',
        bodyType: 'Closed', lengthFt: 32, widthFt: 7, heightFt: 7,
        grossWeightCapacity: 15, netPayloadCapacity: 9, volumeCapacity: 50, tareWeight: 6,
        numAxles: 2, fuelType: 'Diesel', avgMileage: 5, requiresNationalPermit: true, requiresOverDimensionPermit: false,
        permittedCommodities: [], restrictedCommodities: [], isRefrigerated: false, isHazmatCertified: false, isADR: false,
        standardRatePerKm: 42, standardRatePerTrip: 22000, detentionRatePerHour: 600,
        ewayBillVehicleType: 'Regular', status: 'Active'
    },
    {
        id: 'VT-005', code: '32FT-MXL', name: '32ft Multi-Axle Closed', displayName: '32 Ft MXL',
        bodyType: 'Closed', lengthFt: 32, widthFt: 7.5, heightFt: 7.5,
        grossWeightCapacity: 22, netPayloadCapacity: 15, volumeCapacity: 55, tareWeight: 7,
        numAxles: 3, fuelType: 'Diesel', avgMileage: 4.5, requiresNationalPermit: true, requiresOverDimensionPermit: false,
        permittedCommodities: [], restrictedCommodities: [], isRefrigerated: false, isHazmatCertified: false, isADR: false,
        standardRatePerKm: 50, standardRatePerTrip: 28000, detentionRatePerHour: 700,
        ewayBillVehicleType: 'Regular', status: 'Active'
    },
    {
        id: 'VT-006', code: 'TRAILER', name: 'Trailer / Taurus', displayName: 'Trailer',
        bodyType: 'Flatbed', lengthFt: 40, widthFt: 8, heightFt: 4,
        grossWeightCapacity: 35, netPayloadCapacity: 25, volumeCapacity: 40, tareWeight: 10,
        numAxles: 5, fuelType: 'Diesel', avgMileage: 3.5, requiresNationalPermit: true, requiresOverDimensionPermit: true,
        permittedCommodities: [], restrictedCommodities: [], isRefrigerated: false, isHazmatCertified: false, isADR: false,
        standardRatePerKm: 62, standardRatePerTrip: 45000, detentionRatePerHour: 1000,
        ewayBillVehicleType: 'Over Dimensional Cargo', status: 'Active'
    },
    {
        id: 'VT-007', code: 'CONT20', name: '20ft Container', displayName: 'Container 20ft',
        bodyType: 'Container', lengthFt: 20, widthFt: 8, heightFt: 8.5,
        grossWeightCapacity: 24, netPayloadCapacity: 18, volumeCapacity: 33, tareWeight: 6,
        numAxles: 3, fuelType: 'Diesel', avgMileage: 4, requiresNationalPermit: true, requiresOverDimensionPermit: false,
        permittedCommodities: [], restrictedCommodities: [], isRefrigerated: false, isHazmatCertified: false, isADR: false,
        standardRatePerKm: 55, standardRatePerTrip: 35000, detentionRatePerHour: 800,
        ewayBillVehicleType: 'Regular', status: 'Active'
    },
    {
        id: 'VT-008', code: 'REFER', name: 'Refrigerated 20ft', displayName: 'Refer Truck',
        bodyType: 'Refrigerated', lengthFt: 20, widthFt: 7, heightFt: 7,
        grossWeightCapacity: 9, netPayloadCapacity: 5.5, volumeCapacity: 22, tareWeight: 3.5,
        numAxles: 2, fuelType: 'Diesel', avgMileage: 5, requiresNationalPermit: true, requiresOverDimensionPermit: false,
        permittedCommodities: [], restrictedCommodities: ['Chemical'],
        isRefrigerated: true, isHazmatCertified: false, isADR: false,
        standardRatePerKm: 55, standardRatePerTrip: 25000, detentionRatePerHour: 800,
        ewayBillVehicleType: 'Regular', status: 'Active'
    },
    {
        id: 'VT-009', code: 'TANKER', name: 'Tanker (20KL)', displayName: 'Tanker',
        bodyType: 'Tanker', lengthFt: 24, widthFt: 8, heightFt: 8,
        grossWeightCapacity: 25, netPayloadCapacity: 20, volumeCapacity: 20, tareWeight: 5,
        numAxles: 3, fuelType: 'Diesel', avgMileage: 4, requiresNationalPermit: true, requiresOverDimensionPermit: false,
        permittedCommodities: ['Chemical', 'Petroleum', 'Edible Oil'],
        restrictedCommodities: [],
        isRefrigerated: false, isHazmatCertified: true, isADR: true,
        standardRatePerKm: 60, standardRatePerTrip: 40000, detentionRatePerHour: 900,
        ewayBillVehicleType: 'Regular', status: 'Active'
    },
];

const BODY_TYPES: VehicleBodyType[] = ['Closed', 'Open', 'Container', 'Tanker', 'Flatbed', 'Refrigerated', 'Tip Body', 'Low Bed'];
const FUEL_TYPES: FuelType[] = ['Diesel', 'CNG', 'Electric', 'LPG'];

export const VehicleTypeMaster: React.FC = () => {
    const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeSpec[]>(SEED_VEHICLE_TYPES);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBody, setFilterBody] = useState('All');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState<VehicleTypeSpec>(INITIAL_VEHICLE_TYPE);
    const [formError, setFormError] = useState('');

    const filtered = vehicleTypes.filter(v => {
        const matchSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.code.toLowerCase().includes(searchTerm.toLowerCase()) || v.displayName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchBody = filterBody === 'All' || v.bodyType === filterBody;
        return matchSearch && matchBody;
    });

    const handleAdd = () => { setFormData({ ...INITIAL_VEHICLE_TYPE, id: `VT-${String(vehicleTypes.length + 1).padStart(3, '0')}` }); setEditingId(null); setIsFormOpen(true); };
    const handleEdit = (v: VehicleTypeSpec) => { setFormData({ ...v }); setEditingId(v.id); setIsFormOpen(true); };
    const handleSave = () => {
        if (!formData.name || !formData.code) { setFormError('Name and Code are required.'); return; }
        setFormError('');
        if (editingId) {
            setVehicleTypes(prev => prev.map(v => v.id === editingId ? formData : v));
        } else {
            setVehicleTypes(prev => [...prev, formData]);
        }
        setIsFormOpen(false);
    };
    const handleDelete = (id: string) => setVehicleTypes(prev => prev.filter(v => v.id !== id));

    if (isFormOpen) {
        return (
            <Card className="p-0 overflow-hidden" bodyClassName="p-0">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Vehicle Type' : 'Add Vehicle Type'}</h2>
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
                    {/* Identity */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Code *" value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="20FT" />
                        <Input label="Internal Name *" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="20ft Closed Body" />
                        <Input label="Display Name" value={formData.displayName} onChange={e => setFormData(p => ({ ...p, displayName: e.target.value }))} placeholder="20 Ft Truck" />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Body Type</label>
                            <select className="block w-full border-gray-300 rounded-md text-sm py-2 px-3 border" value={formData.bodyType} onChange={e => setFormData(p => ({ ...p, bodyType: e.target.value as VehicleBodyType }))}>
                                {BODY_TYPES.map(b => <option key={b}>{b}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                            <select className="block w-full border-gray-300 rounded-md text-sm py-2 px-3 border" value={formData.fuelType} onChange={e => setFormData(p => ({ ...p, fuelType: e.target.value as FuelType }))}>
                                {FUEL_TYPES.map(f => <option key={f}>{f}</option>)}
                            </select>
                        </div>
                        <Input label="Axles" type="number" value={formData.numAxles} onChange={e => setFormData(p => ({ ...p, numAxles: Number(e.target.value) }))} />
                    </div>

                    {/* Dimensions */}
                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center"><Ruler className="h-4 w-4 mr-2" /> Dimensions (ft)</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <Input label="Length" type="number" value={formData.lengthFt} onChange={e => setFormData(p => ({ ...p, lengthFt: Number(e.target.value) }))} />
                            <Input label="Width" type="number" value={formData.widthFt} onChange={e => setFormData(p => ({ ...p, widthFt: Number(e.target.value) }))} />
                            <Input label="Height" type="number" value={formData.heightFt} onChange={e => setFormData(p => ({ ...p, heightFt: Number(e.target.value) }))} />
                        </div>
                    </div>

                    {/* Capacity */}
                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center"><Package className="h-4 w-4 mr-2" /> Capacity</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Input label="Gross Weight (T)" type="number" value={formData.grossWeightCapacity} onChange={e => setFormData(p => ({ ...p, grossWeightCapacity: Number(e.target.value) }))} />
                            <Input label="Net Payload (T)" type="number" value={formData.netPayloadCapacity} onChange={e => setFormData(p => ({ ...p, netPayloadCapacity: Number(e.target.value) }))} />
                            <Input label="Volume (CBM)" type="number" value={formData.volumeCapacity} onChange={e => setFormData(p => ({ ...p, volumeCapacity: Number(e.target.value) }))} />
                            <Input label="Tare Weight (T)" type="number" value={formData.tareWeight} onChange={e => setFormData(p => ({ ...p, tareWeight: Number(e.target.value) }))} />
                        </div>
                    </div>

                    {/* Commercial */}
                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">Standard Rates</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Input label="Rate/KM (₹)" type="number" value={formData.standardRatePerKm} onChange={e => setFormData(p => ({ ...p, standardRatePerKm: Number(e.target.value) }))} />
                            <Input label="Rate/Trip (₹)" type="number" value={formData.standardRatePerTrip} onChange={e => setFormData(p => ({ ...p, standardRatePerTrip: Number(e.target.value) }))} />
                            <Input label="Detention/hr (₹)" type="number" value={formData.detentionRatePerHour} onChange={e => setFormData(p => ({ ...p, detentionRatePerHour: Number(e.target.value) }))} />
                            <Input label="Avg Mileage (km/L)" type="number" value={formData.avgMileage} onChange={e => setFormData(p => ({ ...p, avgMileage: Number(e.target.value) }))} />
                        </div>
                    </div>

                    {/* Capabilities */}
                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">Capabilities & Permits</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { key: 'isRefrigerated', label: 'Refrigerated', icon: <Snowflake className="h-4 w-4 text-blue-600" /> },
                                { key: 'isHazmatCertified', label: 'Hazmat Certified', icon: <FlaskConical className="h-4 w-4 text-red-600" /> },
                                { key: 'isADR', label: 'ADR Certified', icon: <Shield className="h-4 w-4 text-orange-600" /> },
                                { key: 'requiresNationalPermit', label: 'National Permit Req.', icon: <Truck className="h-4 w-4 text-gray-600" /> },
                                { key: 'requiresOverDimensionPermit', label: 'Over-Dimension Permit', icon: <AlertTriangle className="h-4 w-4 text-amber-600" /> },
                            ].map(f => (
                                <label key={f.key} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${(formData as any)[f.key] ? 'bg-gray-100 border-gray-300' : 'border-gray-200'}`}>
                                    <input type="checkbox" className="rounded" checked={(formData as any)[f.key]} onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.checked }))} />
                                    {f.icon}
                                    <span className="text-sm text-gray-700">{f.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* e-Way Bill */}
                    <div className="border-t border-gray-100 pt-4">
                        <Input label="e-Way Bill Vehicle Category" value={formData.ewayBillVehicleType} onChange={e => setFormData(p => ({ ...p, ewayBillVehicleType: e.target.value }))} placeholder="Regular / Over Dimensional Cargo" />
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Vehicle Type Master</h2>
                    <p className="text-sm text-gray-500">Define vehicle specifications, capacities, and standard rates.</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export</Button>
                    <Button size="sm" onClick={handleAdd}><Plus className="h-4 w-4 mr-2" /> Add Vehicle Type</Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Total Types</div>
                    <div className="text-2xl font-bold text-gray-900">{vehicleTypes.length}</div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="text-xs text-gray-500 flex items-center"><Snowflake className="h-3 w-3 mr-1" /> Refrigerated</div>
                    <div className="text-2xl font-bold text-blue-700">{vehicleTypes.filter(v => v.isRefrigerated).length}</div>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <div className="text-xs text-gray-500 flex items-center"><FlaskConical className="h-3 w-3 mr-1" /> Hazmat Cert.</div>
                    <div className="text-2xl font-bold text-red-700">{vehicleTypes.filter(v => v.isHazmatCertified).length}</div>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Avg Payload (T)</div>
                    <div className="text-2xl font-bold text-green-700">{(vehicleTypes.reduce((s, v) => s + v.netPayloadCapacity, 0) / vehicleTypes.length).toFixed(1)}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" placeholder="Search types..." className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-md" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <select className="border-gray-300 rounded-md text-sm py-1.5 px-3 border" value={filterBody} onChange={e => setFilterBody(e.target.value)}>
                    <option value="All">All Body Types</option>
                    {BODY_TYPES.map(b => <option key={b}>{b}</option>)}
                </select>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(v => (
                    <div key={v.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden group hover:shadow-md transition-shadow">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-gray-400" />
                                        <span className="font-bold text-gray-900">{v.displayName}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono mt-0.5">{v.code} · {v.bodyType}</div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(v)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="h-3.5 w-3.5" /></button>
                                    <button onClick={() => handleDelete(v.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                            </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="p-3 grid grid-cols-3 gap-2 text-center">
                            <div className="bg-gray-50 rounded p-2">
                                <div className="text-[10px] text-gray-500 uppercase">Payload</div>
                                <div className="text-sm font-bold text-gray-900">{v.netPayloadCapacity}T</div>
                            </div>
                            <div className="bg-gray-50 rounded p-2">
                                <div className="text-[10px] text-gray-500 uppercase">Volume</div>
                                <div className="text-sm font-bold text-gray-900">{v.volumeCapacity} CBM</div>
                            </div>
                            <div className="bg-gray-50 rounded p-2">
                                <div className="text-[10px] text-gray-500 uppercase">Size</div>
                                <div className="text-sm font-bold text-gray-900">{v.lengthFt}×{v.widthFt}×{v.heightFt}</div>
                            </div>
                        </div>

                        {/* Rates */}
                        <div className="px-3 pb-2 flex items-center gap-3 text-xs text-gray-600">
                            <span>₹{v.standardRatePerKm}/km</span>
                            <span className="text-gray-300">|</span>
                            <span>₹{v.standardRatePerTrip.toLocaleString()}/trip</span>
                            <span className="text-gray-300">|</span>
                            <span>₹{v.detentionRatePerHour}/hr det.</span>
                        </div>

                        {/* Badges */}
                        <div className="px-3 pb-3 flex flex-wrap gap-1">
                            {v.isRefrigerated && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded font-bold">❄️ REFER</span>}
                            {v.isHazmatCertified && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded font-bold">☣ HAZMAT</span>}
                            {v.isADR && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] rounded font-bold">ADR</span>}
                            {v.requiresOverDimensionPermit && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded font-bold">OD</span>}
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">{v.numAxles} axle · {v.fuelType}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
