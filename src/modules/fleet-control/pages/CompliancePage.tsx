import React, { useState, useEffect } from 'react';
import { VehicleDocument, DocumentStatus, Vehicle } from '../types';
import { ComplianceAPI, VehicleAPI } from '../services/mockDatabase';
import { IconFile, IconAlert, IconCheck, IconSearch, IconArrowRight } from '../components/Icons';
import { Badge } from '../components/UI';

export const CompliancePage: React.FC = () => {
    const [documents, setDocuments] = useState<VehicleDocument[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'EXPIRED' | 'WARNING'>('ALL');

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const [d, v] = await Promise.all([ComplianceAPI.getAllDocuments(), VehicleAPI.getAll()]);
            setDocuments(d);
            setVehicles(v);
            setIsLoading(false);
        };
        load();
    }, []);

    const getVehicleReg = (id: string) => vehicles.find(v => v.vehicle_id === id)?.registration_number || id;

    const stats = {
        total: documents.length,
        expired: documents.filter(d => d.status === DocumentStatus.EXPIRED).length,
        warning: documents.filter(d => d.status === DocumentStatus.EXPIRING_SOON).length,
        valid: documents.filter(d => d.status === DocumentStatus.VALID).length
    };

    const filteredDocs = documents.filter(d => {
        if (filter === 'EXPIRED') return d.status === DocumentStatus.EXPIRED;
        if (filter === 'WARNING') return d.status === DocumentStatus.EXPIRING_SOON;
        return true;
    });

    const getDaysRemaining = (dateStr: string) => {
        const today = new Date();
        const expiry = new Date(dateStr);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Compliance & Documentation</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div 
                    onClick={() => setFilter('ALL')}
                    className={`bg-white p-4 rounded-lg shadow border cursor-pointer transition-all ${filter === 'ALL' ? 'ring-2 ring-primary-500' : 'border-gray-200'}`}
                >
                    <div className="text-sm font-medium text-gray-500">Total Documents</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                </div>
                <div 
                    onClick={() => setFilter('EXPIRED')}
                    className={`bg-red-50 p-4 rounded-lg shadow border cursor-pointer transition-all ${filter === 'EXPIRED' ? 'ring-2 ring-red-500' : 'border-red-100'}`}
                >
                    <div className="text-sm font-medium text-red-600 flex items-center"><IconAlert className="w-4 h-4 mr-1"/> Expired</div>
                    <div className="text-2xl font-bold text-red-900">{stats.expired}</div>
                </div>
                <div 
                    onClick={() => setFilter('WARNING')}
                    className={`bg-yellow-50 p-4 rounded-lg shadow border cursor-pointer transition-all ${filter === 'WARNING' ? 'ring-2 ring-yellow-500' : 'border-yellow-100'}`}
                >
                    <div className="text-sm font-medium text-yellow-600">Expiring Soon</div>
                    <div className="text-2xl font-bold text-yellow-900">{stats.warning}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg shadow border border-green-100">
                    <div className="text-sm font-medium text-green-600">Valid</div>
                    <div className="text-2xl font-bold text-green-900">{stats.valid}</div>
                </div>
            </div>

            {/* Document List */}
            <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Vehicle Compliance Status</h3>
                    <div className="text-sm text-gray-500">Showing {filteredDocs.length} documents</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredDocs.map(doc => {
                                const days = getDaysRemaining(doc.expiry_date);
                                return (
                                    <tr key={doc.document_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{getVehicleReg(doc.vehicle_id)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <IconFile className="w-4 h-4 mr-2 text-gray-400" />
                                                <div className="flex flex-col">
                                                    <span>{doc.document_type}</span>
                                                    <span className="text-xs text-gray-400">{doc.document_number}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{doc.expiry_date}</div>
                                            <div className={`text-xs ${days < 0 ? 'text-red-600' : days < 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                {days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge color={doc.status === DocumentStatus.VALID ? 'green' : doc.status === DocumentStatus.EXPIRED ? 'red' : 'yellow'}>
                                                {doc.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <button className="text-primary-600 hover:text-primary-900 flex items-center justify-end w-full">
                                                Update
                                                <IconArrowRight className="w-3 h-3 ml-1" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredDocs.length === 0 && <div className="p-8 text-center text-gray-500">No documents found matching filter.</div>}
                </div>
            </div>
        </div>
    );
};