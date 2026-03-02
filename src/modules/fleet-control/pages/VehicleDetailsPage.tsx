
import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleDocument, TelemetryEvent, DocumentStatus, DerivedVehicleStatus, VehicleComponent, ComponentType, ComponentStatus, DocumentType, VehicleMaintenanceItem, ComponentHistoryRecord, TyreHealthSignal, TyreEventSignal, TyreSignalType, EnergyMetrics, EnergyAnomaly, EmissionStandard, Battery, BatteryStatus } from '../types';
import { VehicleAPI, ComplianceAPI, TelematicsAPI, ComponentAPI, MaintenanceAPI, TyreAPI, EnergyAPI } from '../services/mockDatabase';
import { BatteryAPI } from '../services/mockDatabase2';
import { IconTruck, IconFile, IconMap, IconAlert, IconCheck, IconArrowRight, IconCpu, IconPlus, IconUpload, IconEye, IconDownload, IconWrench, IconHistory, IconTyre, IconFuel, IconDroplet, IconZap, IconBattery } from '../components/Icons';
import { Badge, Button, Modal, Input, Select } from '../components/UI';

interface Props {
    vehicleId: string;
    onBack: () => void;
}

export const VehicleDetailsPage: React.FC<Props> = ({ vehicleId, onBack }) => {
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [documents, setDocuments] = useState<VehicleDocument[]>([]);
    const [telemetry, setTelemetry] = useState<TelemetryEvent[]>([]);
    const [components, setComponents] = useState<VehicleComponent[]>([]);
    const [maintenanceSchedule, setMaintenanceSchedule] = useState<VehicleMaintenanceItem[]>([]);
    const [componentHistory, setComponentHistory] = useState<ComponentHistoryRecord[]>([]);
    const [tyreHealth, setTyreHealth] = useState<TyreHealthSignal[]>([]);
    const [tyreEvents, setTyreEvents] = useState<TyreEventSignal[]>([]);
    const [energyMetrics, setEnergyMetrics] = useState<EnergyMetrics | null>(null);
    const [energyAnomalies, setEnergyAnomalies] = useState<EnergyAnomaly[]>([]);
    const [batteries, setBatteries] = useState<Battery[]>([]);
    const [availableBatteries, setAvailableBatteries] = useState<Battery[]>([]);
    
    const [activeTab, setActiveTab] = useState<'overview' | 'components' | 'batteries' | 'maintenance' | 'energy' | 'compliance' | 'telemetry'>('overview');
    const [isLoading, setIsLoading] = useState(true);

    // Component Modal
    const [isCompModalOpen, setIsCompModalOpen] = useState(false);
    const [isSubmittingComp, setIsSubmittingComp] = useState(false);
    const [newComponent, setNewComponent] = useState({
        component_type: ComponentType.ENGINE,
        serial_number: '',
        make: '',
        model: '',
        installation_date: new Date().toISOString().split('T')[0],
        status: ComponentStatus.ACTIVE
    });

    // Document Modal
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);
    const [newDocument, setNewDocument] = useState({
        document_type: DocumentType.RC,
        document_number: '',
        issue_date: '',
        expiry_date: '',
        uploaded_by: 'Current User'
    });

    // Battery Install Modal
    const [isBattModalOpen, setIsBattModalOpen] = useState(false);
    const [newBattInstall, setNewBattInstall] = useState({ battery_id: '', odometer: '' });

    useEffect(() => {
        loadData();
    }, [vehicleId]);

    const loadData = async () => {
        setIsLoading(true);
        const [v, d, t, c, s, h, th, te, em, ea, batts, allBatts] = await Promise.all([
            VehicleAPI.getById(vehicleId),
            ComplianceAPI.getDocuments(vehicleId),
            TelematicsAPI.getHistory(vehicleId),
            ComponentAPI.getByVehicleId(vehicleId),
            MaintenanceAPI.getVehicleSchedule(vehicleId),
            MaintenanceAPI.getComponentHistory(vehicleId),
            TyreAPI.getHealthSignals(vehicleId),
            TyreAPI.getEventSignals(vehicleId),
            EnergyAPI.getMetrics(vehicleId),
            EnergyAPI.getAnomalies(vehicleId),
            BatteryAPI.getByVehicle(vehicleId),
            BatteryAPI.getAll()
        ]);
        setVehicle(v || null);
        setDocuments(d.sort((a,b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()));
        setTelemetry(t.sort((a,b) => new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime()));
        setComponents(c);
        setMaintenanceSchedule(s);
        setComponentHistory(h.sort((a,b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime()));
        setTyreHealth(th);
        setTyreEvents(te.sort((a,b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()));
        setEnergyMetrics(em);
        setEnergyAnomalies(ea);
        setBatteries(batts);
        setAvailableBatteries(allBatts.filter(b => b.status === BatteryStatus.IN_STOCK));
        setIsLoading(false);
    };

    const handleAddComponent = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingComp(true);
        try {
            await ComponentAPI.add({
                vehicle_id: vehicleId,
                ...newComponent,
                component_type: newComponent.component_type as ComponentType,
                status: newComponent.status as ComponentStatus
            });
            setIsCompModalOpen(false);
            setNewComponent({
                component_type: ComponentType.ENGINE,
                serial_number: '',
                make: '',
                model: '',
                installation_date: new Date().toISOString().split('T')[0],
                status: ComponentStatus.ACTIVE
            });
            const c = await ComponentAPI.getByVehicleId(vehicleId);
            setComponents(c);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmittingComp(false);
        }
    };

    const handleUploadDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingDoc(true);
        try {
            await ComplianceAPI.uploadDocument({
                vehicle_id: vehicleId,
                ...newDocument,
                document_type: newDocument.document_type as DocumentType,
                document_url: 'https://example.com/mock-doc.pdf',
                uploaded_by: 'Current User'
            });
            setIsDocModalOpen(false);
            setNewDocument({
                document_type: DocumentType.RC,
                document_number: '',
                issue_date: '',
                expiry_date: '',
                uploaded_by: 'Current User'
            });
            const d = await ComplianceAPI.getDocuments(vehicleId);
            setDocuments(d.sort((a,b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()));
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmittingDoc(false);
        }
    };

    const handleBatteryInstall = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await BatteryAPI.install({
                battery_id: newBattInstall.battery_id,
                vehicle_id: vehicleId,
                installed_at: new Date().toISOString(),
                odometer: parseInt(newBattInstall.odometer)
            });
            setIsBattModalOpen(false);
            setNewBattInstall({ battery_id: '', odometer: '' });
            
            // Refresh data
            const [batts, allBatts] = await Promise.all([
                BatteryAPI.getByVehicle(vehicleId),
                BatteryAPI.getAll()
            ]);
            setBatteries(batts);
            setAvailableBatteries(allBatts.filter(b => b.status === BatteryStatus.IN_STOCK));
        } catch (error: any) {
            alert(error.message);
        }
    };

    const getDaysRemaining = (dateStr: string) => {
        const today = new Date();
        const expiry = new Date(dateStr);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    };

    const getScheduleStatusColor = (status: string) => {
        switch(status) {
            case 'Overdue': return 'red';
            case 'Due': return 'yellow';
            default: return 'green';
        }
    };

    if (!vehicle) return <div>Loading...</div>;

    return (
        <div>
            {/* Header */}
            <div className="flex items-center space-x-4 mb-6">
                 <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
                    <IconArrowRight className="w-6 h-6 transform rotate-180" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{vehicle.registration_number}</h1>
                    <div className="text-sm text-gray-500 flex items-center mt-1 space-x-3">
                        <span className="font-medium">{vehicle.make} {vehicle.model}</span>
                        <span>•</span>
                        <span>{vehicle.vehicle_type}</span>
                        <Badge color={vehicle.status === 'Active' ? 'green' : vehicle.status === 'Draft' ? 'gray' : 'red'}>{vehicle.status}</Badge>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {['Overview', 'Components', 'Batteries', 'Maintenance', 'Energy', 'Compliance', 'Telemetry'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase() as any)}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.toLowerCase()
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Technical Specifications</h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase">Chassis No (VIN)</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.chassis_number || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase">Engine No</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.engine_number || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase">Make & Model</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.make} {vehicle.model}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase">Mfg Year</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.manufacturing_year || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase">Axle Config</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.axle_configuration}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase">Body Type</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.body_type || '-'}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Operational Details</h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase">Status</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.status}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase">Fuel Type</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.fuel_type || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase">Ownership</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.ownership_type}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase">Payload Capacity</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.capacity_tons} Tons</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase">Emission Standard</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    <Badge color={vehicle.emission_standard === EmissionStandard.BS6 ? 'green' : 'gray'}>
                                        {vehicle.emission_standard || 'BS4'}
                                    </Badge>
                                </dd>
                            </div>
                             <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase">Onboarded At</dt>
                                <dd className="mt-1 text-sm text-gray-900">{new Date(vehicle.created_at).toLocaleDateString()}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            )}

            {activeTab === 'components' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Major Components Registry</h3>
                        <Button size="sm" onClick={() => setIsCompModalOpen(true)}>
                            <IconPlus className="w-4 h-4 mr-2" />
                            Add Component
                        </Button>
                    </div>
                    
                    <div className="bg-white shadow overflow-hidden rounded-md border border-gray-200">
                        {components.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No components registered.</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Make / Model</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installed</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {components.map(comp => (
                                        <tr key={comp.component_id}>
                                            <td className="px-6 py-4 flex items-center text-sm font-medium text-gray-900">
                                                <IconCpu className="w-4 h-4 mr-2 text-gray-400" />
                                                {comp.component_type}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{comp.make} {comp.model}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 font-mono">{comp.serial_number}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{new Date(comp.installation_date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4"><Badge color="green">{comp.status}</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'maintenance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Schedule */}
                    <div className="bg-white shadow rounded-lg border border-gray-200 p-5">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <IconWrench className="w-5 h-5 mr-2 text-gray-500" />
                            Upcoming Schedule
                        </h3>
                        {maintenanceSchedule.length === 0 ? (
                            <p className="text-sm text-gray-500">No preventive schedule assigned.</p>
                        ) : (
                            <div className="space-y-4">
                                {maintenanceSchedule.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100">
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">{item.name}</div>
                                            <div className="text-xs text-gray-500">Every {item.frequency_km}km</div>
                                        </div>
                                        <div className="text-right">
                                            <Badge color={getScheduleStatusColor(item.status)}>{item.status}</Badge>
                                            <div className="text-xs text-gray-500 mt-1">Due: {item.next_due_km}km</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* History */}
                    <div className="bg-white shadow rounded-lg border border-gray-200 p-5">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <IconHistory className="w-5 h-5 mr-2 text-gray-500" />
                            Service History
                        </h3>
                        {componentHistory.length === 0 ? (
                            <p className="text-sm text-gray-500">No service history records found.</p>
                        ) : (
                            <div className="space-y-4 max-h-80 overflow-y-auto">
                                {componentHistory.map((rec) => (
                                    <div key={rec.record_id} className="relative pl-4 border-l-2 border-gray-200 pb-2">
                                        <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-gray-400"></div>
                                        <div className="text-sm font-medium text-gray-900">{rec.description}</div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(rec.service_date).toLocaleDateString()} • {rec.odometer} km
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'energy' && energyMetrics && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Average Efficiency</h4>
                            <div className="text-3xl font-bold text-gray-900 flex items-baseline">
                                {energyMetrics.avg_km_per_liter}
                                <span className="text-sm text-gray-500 ml-1 font-normal">km/l</span>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                                AdBlue Consumption Ratio
                                {energyAnomalies.length > 0 && <IconAlert className="w-4 h-4 ml-2 text-red-500" />}
                            </h4>
                            <div className="text-3xl font-bold text-gray-900 flex items-baseline">
                                {energyMetrics.adblue_to_fuel_ratio_pct}%
                                <span className="text-sm text-gray-500 ml-1 font-normal">(vs Fuel)</span>
                            </div>
                        </div>
                    </div>

                    {energyAnomalies.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="text-sm font-bold text-red-800 mb-3 flex items-center">
                                <IconZap className="w-4 h-4 mr-2" />
                                Detected Anomalies
                            </h4>
                            <ul className="space-y-2">
                                {energyAnomalies.map(a => (
                                    <li key={a.anomaly_id} className="text-sm text-red-700 bg-white p-2 rounded border border-red-100">
                                        <span className="font-bold">{a.anomaly_type}:</span> {a.description}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'compliance' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Regulatory Documents</h3>
                        <Button size="sm" onClick={() => setIsDocModalOpen(true)}>
                            <IconUpload className="w-4 h-4 mr-2" />
                            Upload Doc
                        </Button>
                    </div>
                    
                    <div className="bg-white shadow overflow-hidden rounded-md border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {documents.map(doc => {
                                    const daysLeft = getDaysRemaining(doc.expiry_date);
                                    return (
                                        <tr key={doc.document_id}>
                                            <td className="px-6 py-4 flex items-center text-sm font-medium text-gray-900">
                                                <IconFile className="w-4 h-4 mr-2 text-gray-400" />
                                                {doc.document_type}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 font-mono">{doc.document_number}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="text-gray-900">{doc.expiry_date}</div>
                                                <div className={`text-xs ${daysLeft < 30 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {daysLeft < 0 ? 'Expired' : `${daysLeft} days left`}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge color={doc.status === DocumentStatus.VALID ? 'green' : 'red'}>{doc.status}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-gray-400 hover:text-gray-600">
                                                    <IconEye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'telemetry' && (
                <div className="bg-white shadow rounded-lg border border-gray-200 p-5">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <IconMap className="w-5 h-5 mr-2 text-gray-500" />
                        Recent Position History
                    </h3>
                    <div className="space-y-4">
                        {telemetry.length === 0 ? (
                            <p className="text-sm text-gray-500">No telemetry data available.</p>
                        ) : (
                            telemetry.map(t => (
                                <div key={t.event_id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 last:border-0">
                                    <div className="flex items-center">
                                        <div className={`w-2 h-2 rounded-full mr-3 ${t.ignition_status ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        <div>
                                            <div className="text-gray-900">{new Date(t.event_timestamp).toLocaleString()}</div>
                                            <div className="text-xs text-gray-500">{t.latitude.toFixed(4)}, {t.longitude.toFixed(4)}</div>
                                        </div>
                                    </div>
                                    <div className="font-mono">{t.speed} km/h</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'batteries' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Installed Batteries</h3>
                            <p className="text-sm text-gray-500">Manage starter and auxiliary batteries.</p>
                        </div>
                        <Button size="sm" onClick={() => setIsBattModalOpen(true)}>
                            <IconPlus className="w-4 h-4 mr-2" />
                            Install Battery
                        </Button>
                    </div>
                    
                    <div className="bg-white shadow overflow-hidden rounded-md border border-gray-200">
                        {batteries.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No active batteries installed.</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specs</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warranty Exp</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {batteries.map(bat => (
                                        <tr key={bat.battery_id}>
                                            <td className="px-6 py-4 flex items-center">
                                                <IconBattery className="w-4 h-4 text-gray-400 mr-3" />
                                                <span className="text-sm font-medium text-gray-900">{bat.serial_number}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{bat.battery_type}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {bat.brand} {bat.model}
                                                <div className="text-xs text-gray-500">{bat.capacity_ah}Ah / {bat.voltage}V</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{bat.warranty_expiry_date}</td>
                                            <td className="px-6 py-4">
                                                <Badge color="green">Active</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Component Modal */}
            <Modal isOpen={isCompModalOpen} onClose={() => setIsCompModalOpen(false)} title="Add Component">
                <form onSubmit={handleAddComponent}>
                    <Select 
                        label="Component Type"
                        options={Object.values(ComponentType).map(t => ({ label: t, value: t }))}
                        value={newComponent.component_type}
                        onChange={e => setNewComponent({...newComponent, component_type: e.target.value as ComponentType})}
                        required
                    />
                    <Input 
                        label="Make"
                        value={newComponent.make}
                        onChange={e => setNewComponent({...newComponent, make: e.target.value})}
                        required
                    />
                    <Input 
                        label="Model"
                        value={newComponent.model}
                        onChange={e => setNewComponent({...newComponent, model: e.target.value})}
                        required
                    />
                    <Input 
                        label="Serial Number"
                        value={newComponent.serial_number}
                        onChange={e => setNewComponent({...newComponent, serial_number: e.target.value})}
                        required
                    />
                    <Input 
                        label="Installation Date"
                        type="date"
                        value={newComponent.installation_date}
                        onChange={e => setNewComponent({...newComponent, installation_date: e.target.value})}
                        required
                    />
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button type="button" variant="secondary" onClick={() => setIsCompModalOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={isSubmittingComp}>Add Component</Button>
                    </div>
                </form>
            </Modal>

            {/* Document Modal */}
            <Modal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} title="Upload Vehicle Document">
                <form onSubmit={handleUploadDocument}>
                    <Select 
                        label="Document Type"
                        options={Object.values(DocumentType).map(t => ({ label: t, value: t }))}
                        value={newDocument.document_type}
                        onChange={e => setNewDocument({...newDocument, document_type: e.target.value as DocumentType})}
                        required
                    />
                    <Input 
                        label="Document Number"
                        value={newDocument.document_number}
                        onChange={e => setNewDocument({...newDocument, document_number: e.target.value})}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Issue Date"
                            type="date"
                            value={newDocument.issue_date}
                            onChange={e => setNewDocument({...newDocument, issue_date: e.target.value})}
                            required
                        />
                        <Input 
                            label="Expiry Date"
                            type="date"
                            value={newDocument.expiry_date}
                            onChange={e => setNewDocument({...newDocument, expiry_date: e.target.value})}
                            required
                        />
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button type="button" variant="secondary" onClick={() => setIsDocModalOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={isSubmittingDoc}>Upload</Button>
                    </div>
                </form>
            </Modal>

            {/* Battery Install Modal */}
            <Modal isOpen={isBattModalOpen} onClose={() => setIsBattModalOpen(false)} title="Install Battery from Stock">
                <form onSubmit={handleBatteryInstall}>
                    <Select 
                        label="Select Battery"
                        options={availableBatteries.map(b => ({ label: `${b.serial_number} (${b.brand} ${b.model})`, value: b.battery_id }))}
                        value={newBattInstall.battery_id}
                        onChange={e => setNewBattInstall({...newBattInstall, battery_id: e.target.value})}
                        required
                    />
                    {availableBatteries.length === 0 && <p className="text-xs text-red-500 -mt-3 mb-3">No batteries available in stock.</p>}
                    <Input 
                        label="Current Odometer"
                        type="number"
                        value={newBattInstall.odometer}
                        onChange={e => setNewBattInstall({...newBattInstall, odometer: e.target.value})}
                        required
                    />
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button type="button" variant="secondary" onClick={() => setIsBattModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={availableBatteries.length === 0}>Confirm Install</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
