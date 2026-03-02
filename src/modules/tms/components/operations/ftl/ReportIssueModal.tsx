import React, { useState } from 'react';
import { X, AlertTriangle, AlertCircle, MessageSquare } from 'lucide-react';
import { Button } from '../../ui/Button';

interface ReportIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripId: string | null;
    onSubmit: (issueData: any) => void;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ isOpen, onClose, tripId, onSubmit }) => {
    const [issueType, setIssueType] = useState('VEHICLE_BREAKDOWN');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('HIGH');

    if (!isOpen || !tripId) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            tripId,
            issueType,
            description,
            priority,
            reportedAt: new Date().toISOString(),
        });
        setIssueType('VEHICLE_BREAKDOWN');
        setDescription('');
        setPriority('HIGH');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full">
                    <div className="bg-red-500 px-4 py-3 border-b flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            Report Issue for {tripId}
                        </h3>
                        <button onClick={onClose} className="text-white hover:text-red-100">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
                            <div className="relative">
                                <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <select
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                                    value={issueType}
                                    onChange={(e) => setIssueType(e.target.value)}
                                    required
                                >
                                    <option value="VEHICLE_BREAKDOWN">Vehicle Breakdown</option>
                                    <option value="DRIVER_UNREACHABLE">Driver Unreachable</option>
                                    <option value="ROUTE_DEVIATION">Route Deviation</option>
                                    <option value="ACCIDENT">Accident</option>
                                    <option value="DOCUMENT_ISSUE">Document Issue</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <option value="CRITICAL">Critical (Immediate Action Required)</option>
                                <option value="HIGH">High (Impacts Delivery)</option>
                                <option value="MEDIUM">Medium (Needs Attention)</option>
                                <option value="LOW">Low (Informaive)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <textarea
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                                    rows={4}
                                    placeholder="Describe the issue in detail..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                            <Button
                                type="submit"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                            >
                                Submit Issue
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
