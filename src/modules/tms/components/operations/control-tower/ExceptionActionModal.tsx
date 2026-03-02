import React, { useState } from 'react';
import { X, AlertTriangle, MessageSquare, FastForward, CheckCircle, Truck } from 'lucide-react';
import { Button } from '../../ui/Button';
import { exceptionManager, TripException } from '../../../../../shared/services/exceptionManager';

interface Props {
    exception: TripException;
    onClose: () => void;
}

export const ExceptionActionModal: React.FC<Props> = ({ exception, onClose }) => {
    const [resolution, setResolution] = useState('');
    const [delayHours, setDelayHours] = useState('0');
    const [costImpact, setCostImpact] = useState('0');
    const [workflowState, setWorkflowState] = useState<'view' | 'resolve' | 'escalate'>('view');

    const meta = exceptionManager.getCategoryMeta(exception.category);

    const handleResolve = () => {
        exceptionManager.resolve(exception.id, 'CurrentUser', resolution || 'Resolved', parseFloat(delayHours) || 0, parseFloat(costImpact) || 0);
        onClose();
    };

    const handleEscalate = () => {
        exceptionManager.forceEscalate(exception.id, 'CurrentUser');
        onClose();
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
                            </div>

                            {exception.timeline.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-3">Timeline</h4>
                                    <div className="space-y-3 pl-2 border-l-2 border-gray-100">
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
                                    <Button variant="outline" className="flex-1 text-blue-600">
                                        <Truck className="h-4 w-4 mr-2" /> Assign Replacement
                                    </Button>
                                )}
                                <Button onClick={() => setWorkflowState('resolve')} className="flex-1 bg-green-600 hover:bg-green-700">
                                    <CheckCircle className="h-4 w-4 mr-2" /> Resolve
                                </Button>
                            </div>
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
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Cost Impact (₹)</label>
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
