import React, { useState } from 'react';
import { X, AlertTriangle, FastForward, CheckCircle, Truck, Building2, ShoppingBag } from 'lucide-react';
import { Button } from '../../ui/Button';
import { exceptionManager, TripException } from '../../../../../shared/services/exceptionManager';
import { useOperationalData } from '../../../../../shared/context/OperationalDataContext';

interface Props {
    exception: TripException;
    onClose: () => void;
}

type WorkflowState = 'view' | 'resolve' | 'escalate' | 'replace_vehicle';
type ReplacementTab = 'own_fleet' | 'vendor' | 'market_hire';

export const ExceptionActionModal: React.FC<Props> = ({ exception, onClose }) => {
    const { vehicles } = useOperationalData();
    const [resolution, setResolution] = useState('');
    const [delayHours, setDelayHours] = useState('0');
    const [costImpact, setCostImpact] = useState('0');
    const [workflowState, setWorkflowState] = useState<WorkflowState>('view');

    // Replacement vehicle state
    const [replacementTab, setReplacementTab] = useState<ReplacementTab>('own_fleet');
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    // Vendor replacement fields
    const [vendorDriverName, setVendorDriverName] = useState('');
    const [vendorDriverPhone, setVendorDriverPhone] = useState('');
    const [vendorVehicleReg, setVendorVehicleReg] = useState('');
    const [vendorETA, setVendorETA] = useState('');
    // Market hire fields
    const [hireVendorName, setHireVendorName] = useState('');
    const [hireVehicleReg, setHireVehicleReg] = useState('');
    const [hireVehicleType, setHireVehicleType] = useState('');
    const [hireRate, setHireRate] = useState('');

    const meta = exceptionManager.getCategoryMeta(exception.category);
    const availableVehicles = vehicles.filter(v => v.status === 'available');

    const handleResolve = () => {
        exceptionManager.resolve(exception.id, 'CurrentUser', resolution || 'Resolved', parseFloat(delayHours) || 0, parseFloat(costImpact) || 0);
        onClose();
    };

    const handleEscalate = () => {
        exceptionManager.forceEscalate(exception.id, 'CurrentUser');
        onClose();
    };

    const handleOwnFleetConfirm = () => {
        const vehicle = vehicles.find(v => v.id === selectedVehicleId);
        if (!vehicle) return;
        exceptionManager.assignReplacementVehicle(exception.id, vehicle.regNumber, 'CurrentUser');
        setWorkflowState('view');
    };

    const handleVendorConfirm = () => {
        if (!vendorVehicleReg) return;
        exceptionManager.assignReplacementVehicle(
            exception.id,
            vendorVehicleReg,
            'CurrentUser'
        );
        setWorkflowState('view');
    };

    const handleMarketHireConfirm = () => {
        if (!hireVehicleReg || !hireRate) return;
        const cost = parseFloat(hireRate) || 0;
        exceptionManager.assignReplacementVehicle(exception.id, hireVehicleReg, 'CurrentUser');
        if (cost > 0) {
            exceptionManager.addCostImpact(
                exception.id,
                cost,
                'CurrentUser',
                `Market hire: ${hireVendorName || 'External vendor'} — ${hireVehicleReg} (${hireVehicleType || 'Unknown type'}) @ ₹${cost.toLocaleString()}`
            );
        }
        setWorkflowState('view');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className={`px-6 py-4 flex justify-between items-center ${exception.severity === 'critical' ? 'bg-red-50 border-b border-red-100' : 'bg-gray-50 border-b border-gray-100'}`}>
                    <div className="flex items-center">
                        <span className="text-xl mr-3">{meta.icon}</span>
                        <div>
                            <h3 className="font-bold text-gray-900">{exception.title}</h3>
                            <p className="text-xs text-gray-500">#{exception.id} • Booking: {exception.bookingRef}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {workflowState === 'view' && (
                        <div className="space-y-6">
                            <div className="bg-amber-50 rounded p-4 border border-amber-100">
                                <p className="text-sm text-gray-800">{exception.description}</p>
                                <div className="flex gap-4 mt-3 pt-3 border-t border-amber-200/50">
                                    <div>
                                        <span className="block text-[10px] text-gray-500 uppercase">SLA Due</span>
                                        <span className="text-sm font-semibold">{new Date(exception.slaDueAt).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-gray-500 uppercase">Status</span>
                                        <span className="text-sm font-semibold capitalize">{exception.status.replace('_', ' ')}</span>
                                    </div>
                                    {exception.escalationLevel > 1 && (
                                        <div>
                                            <span className="block text-[10px] text-gray-500 uppercase">Escalation</span>
                                            <span className="text-sm font-bold text-red-600">L{exception.escalationLevel}</span>
                                        </div>
                                    )}
                                </div>
                                {exception.replacementVehicleId && (
                                    <div className="mt-3 pt-3 border-t border-amber-200/50 flex items-center text-sm text-green-700">
                                        <Truck className="h-4 w-4 mr-1.5" />
                                        Replacement assigned: <span className="font-semibold ml-1">{exception.replacementVehicleId}</span>
                                    </div>
                                )}
                            </div>

                            {exception.timeline.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-3">Timeline</h4>
                                    <div className="space-y-3 pl-2 border-l-2 border-gray-100 max-h-40 overflow-y-auto">
                                        {exception.timeline.map((entry, idx) => (
                                            <div key={idx} className="relative pl-4">
                                                <div className="absolute w-2 h-2 bg-blue-500 rounded-full -left-1.5 top-1.5 ring-2 ring-white"></div>
                                                <p className="text-xs font-semibold text-gray-800">{entry.action} <span className="text-gray-500 font-normal">by {entry.by}</span></p>
                                                <p className="text-[10px] text-gray-600 mt-0.5">{entry.notes}</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">{new Date(entry.timestamp).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <Button onClick={() => setWorkflowState('escalate')} variant="outline" className="flex-1 text-orange-600 hover:bg-orange-50 hover:border-orange-200">
                                    <FastForward className="h-4 w-4 mr-2" /> Escalate
                                </Button>
                                {exception.requiresReplacementVehicle && !exception.replacementVehicleId && (
                                    <Button variant="outline" className="flex-1 text-blue-600 hover:bg-blue-50 hover:border-blue-200" onClick={() => setWorkflowState('replace_vehicle')}>
                                        <Truck className="h-4 w-4 mr-2" /> Assign Replacement
                                    </Button>
                                )}
                                <Button onClick={() => setWorkflowState('resolve')} className="flex-1 bg-green-600 hover:bg-green-700">
                                    <CheckCircle className="h-4 w-4 mr-2" /> Resolve
                                </Button>
                            </div>
                        </div>
                    )}

                    {workflowState === 'replace_vehicle' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <h4 className="font-bold text-gray-900 flex items-center">
                                <Truck className="h-5 w-5 text-blue-600 mr-2" /> Vehicle Replacement
                            </h4>

                            {/* Tabs */}
                            <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm">
                                {([
                                    { id: 'own_fleet', label: 'Own Fleet', icon: <Truck className="h-3.5 w-3.5 mr-1.5" /> },
                                    { id: 'vendor', label: 'Vendor Sends', icon: <Building2 className="h-3.5 w-3.5 mr-1.5" /> },
                                    { id: 'market_hire', label: 'Market Hire', icon: <ShoppingBag className="h-3.5 w-3.5 mr-1.5" /> },
                                ] as { id: ReplacementTab; label: string; icon: React.ReactNode }[]).map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setReplacementTab(tab.id)}
                                        className={`flex-1 flex items-center justify-center py-2 px-3 font-medium transition-colors ${replacementTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {tab.icon}{tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Own Fleet Tab */}
                            {replacementTab === 'own_fleet' && (
                                <div className="space-y-3">
                                    <p className="text-xs text-gray-500">Select an available vehicle from your owned/leased fleet.</p>
                                    {availableVehicles.length === 0 ? (
                                        <div className="text-center py-6 text-sm text-gray-500 bg-gray-50 rounded-lg">No vehicles currently available in fleet.</div>
                                    ) : (
                                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                            {availableVehicles.map(v => (
                                                <label key={v.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${selectedVehicleId === v.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                    <div className="flex items-center">
                                                        <input type="radio" name="ownFleetVehicle" checked={selectedVehicleId === v.id} onChange={() => setSelectedVehicleId(v.id)} className="h-4 w-4 text-blue-600 border-gray-300 mr-3" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{v.regNumber}</p>
                                                            <p className="text-xs text-gray-500">{v.model} • {v.type} • {v.capacity}T</p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.ownershipType === 'owned' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {v.ownershipType}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-3 pt-2 border-t border-gray-100">
                                        <Button onClick={() => setWorkflowState('view')} variant="outline" className="flex-1">Back</Button>
                                        <Button onClick={handleOwnFleetConfirm} disabled={!selectedVehicleId} className="flex-1 bg-blue-600 hover:bg-blue-700">Confirm Assignment</Button>
                                    </div>
                                </div>
                            )}

                            {/* Vendor Sends Replacement Tab */}
                            {replacementTab === 'vendor' && (
                                <div className="space-y-3">
                                    <p className="text-xs text-gray-500">Record details of the replacement vehicle being sent by the vendor. No additional cost applies.</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle Registration</label>
                                            <input value={vendorVehicleReg} onChange={e => setVendorVehicleReg(e.target.value)} placeholder="MH-12-AB-1234" className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">ETA</label>
                                            <input type="datetime-local" value={vendorETA} onChange={e => setVendorETA(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Driver Name</label>
                                            <input value={vendorDriverName} onChange={e => setVendorDriverName(e.target.value)} placeholder="Driver name" className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Driver Phone</label>
                                            <input value={vendorDriverPhone} onChange={e => setVendorDriverPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-2 border-t border-gray-100">
                                        <Button onClick={() => setWorkflowState('view')} variant="outline" className="flex-1">Back</Button>
                                        <Button onClick={handleVendorConfirm} disabled={!vendorVehicleReg} className="flex-1 bg-blue-600 hover:bg-blue-700">Confirm</Button>
                                    </div>
                                </div>
                            )}

                            {/* Market Hire Tab */}
                            {replacementTab === 'market_hire' && (
                                <div className="space-y-3">
                                    <p className="text-xs text-gray-500">Hiring from the open market — agreed rate will be added to the trip's cost impact.</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Transporter / Vendor Name</label>
                                            <input value={hireVendorName} onChange={e => setHireVendorName(e.target.value)} placeholder="Vendor or transporter name" className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle Registration</label>
                                            <input value={hireVehicleReg} onChange={e => setHireVehicleReg(e.target.value)} placeholder="MH-12-AB-1234" className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle Type</label>
                                            <input value={hireVehicleType} onChange={e => setHireVehicleType(e.target.value)} placeholder="e.g. 32ft, 20ft" className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Agreed Hire Rate (₹)</label>
                                            <input type="number" value={hireRate} onChange={e => setHireRate(e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                                        </div>
                                    </div>
                                    {hireRate && parseFloat(hireRate) > 0 && (
                                        <div className="bg-orange-50 border border-orange-200 rounded p-3 text-xs text-orange-800">
                                            <strong>Cost warning:</strong> ₹{parseFloat(hireRate).toLocaleString()} will be added to this trip's cost impact.
                                        </div>
                                    )}
                                    <div className="flex gap-3 pt-2 border-t border-gray-100">
                                        <Button onClick={() => setWorkflowState('view')} variant="outline" className="flex-1">Back</Button>
                                        <Button onClick={handleMarketHireConfirm} disabled={!hireVehicleReg || !hireRate} className="flex-1 bg-blue-600 hover:bg-blue-700">Confirm Hire</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {workflowState === 'resolve' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <h4 className="font-bold text-gray-900">Resolve Exception</h4>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Resolution Details</label>
                                <textarea
                                    value={resolution} onChange={e => setResolution(e.target.value)}
                                    className="w-full border border-gray-300 rounded p-2 text-sm h-24"
                                    placeholder="How was this resolved?"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Delay Impact (Hours)</label>
                                    <input type="number" value={delayHours} onChange={e => setDelayHours(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Additional Cost Impact (₹)</label>
                                    <input type="number" value={costImpact} onChange={e => setCostImpact(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <Button onClick={() => setWorkflowState('view')} variant="outline" className="flex-1">Back</Button>
                                <Button onClick={handleResolve} className="flex-1 bg-green-600 hover:bg-green-700 focus:ring-green-500">Confirm Resolution</Button>
                            </div>
                        </div>
                    )}

                    {workflowState === 'escalate' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <h4 className="font-bold text-gray-900 flex items-center"><AlertTriangle className="h-5 w-5 text-orange-500 mr-2" /> Manual Escalation</h4>
                            <div className="bg-orange-50 text-orange-800 text-sm p-3 rounded border border-orange-100">
                                This exception is currently at <strong>L{exception.escalationLevel}</strong>. Manual escalation will bypass the SLA timer and alert Management immediately.
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                                <Button onClick={() => setWorkflowState('view')} variant="outline" className="flex-1">Cancel</Button>
                                <Button onClick={handleEscalate} className="flex-1 bg-orange-600 hover:bg-orange-700 focus:ring-orange-500">Confirm Escalation</Button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
