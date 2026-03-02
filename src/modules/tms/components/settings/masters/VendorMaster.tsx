
import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import {
    Search, Plus, Download, Upload, Star, LayoutGrid, List as ListIcon,
    ShieldCheck, ShieldAlert, Phone, Mail, MapPin, Truck, BadgeCheck
} from 'lucide-react';
import { masterDataStore } from '../../../../../shared/services/masterDataStore';
import { PlatformVendor, TMSVendorExtension, VendorStatus } from '../../../../../shared/types/vendor';
import { VendorForm } from './VendorForm';

// Map shared status to display
const STATUS_MAP: Record<VendorStatus, { label: string; className: string }> = {
    ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-700' },
    INACTIVE: { label: 'Inactive', className: 'bg-gray-100 text-gray-600' },
    BLACKLISTED: { label: 'Blacklisted', className: 'bg-red-100 text-red-700' },
    PENDING_VERIFICATION: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
    ON_HOLD: { label: 'On Hold', className: 'bg-blue-100 text-blue-700' },
};

export const VendorMaster: React.FC = () => {
    const [view, setView] = useState<'grid' | 'table'>('grid');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    // Subscribe to masterDataStore changes
    useEffect(() => {
        const unsub = masterDataStore.subscribe(() => setTick(t => t + 1));
        return unsub;
    }, []);

    const allVendors = masterDataStore.getVendors();

    const filteredVendors = allVendors.filter(v => {
        const matchesSearch =
            v.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.contactName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'All' || v.type === filterType;
        const matchesStatus =
            filterStatus === 'All' ||
            (filterStatus === 'Active' && v.status === 'ACTIVE') ||
            (filterStatus === 'Inactive' && v.status === 'INACTIVE') ||
            (filterStatus === 'Blacklisted' && v.status === 'BLACKLISTED') ||
            (filterStatus === 'Pending' && v.status === 'PENDING_VERIFICATION') ||
            (filterStatus === 'On Hold' && v.status === 'ON_HOLD');
        return matchesSearch && matchesType && matchesStatus;
    });

    const handleEdit = (vendor: PlatformVendor) => {
        setSelectedVendorId(vendor.id);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedVendorId(null);
        setIsFormOpen(true);
    };

    const handleSave = (vendor: PlatformVendor, tmsExt?: Partial<TMSVendorExtension>) => {
        if (selectedVendorId) {
            masterDataStore.updateVendor(selectedVendorId, vendor);
            if (tmsExt) masterDataStore.updateTMSExtension(selectedVendorId, tmsExt);
        } else {
            const created = masterDataStore.createVendor(
                {
                    ...vendor,
                    createdFrom: 'TMS',
                    verificationLevel: 'BASIC',
                },
                tmsExt,
            );
        }
        setIsFormOpen(false);
    };

    // Stats
    const activeCount = allVendors.filter(v => v.status === 'ACTIVE').length;
    const pendingCount = allVendors.filter(v => v.status === 'PENDING_VERIFICATION').length;
    const brokerCount = allVendors.filter(v => v.type === 'Broker').length;
    const fullVerifiedCount = allVendors.filter(v => v.verificationLevel === 'FULL').length;

    if (isFormOpen) {
        const vendorData = selectedVendorId ? masterDataStore.getVendor(selectedVendorId) : null;
        const tmsExtData = selectedVendorId ? masterDataStore.getTMSExtension(selectedVendorId) : null;
        return (
            <VendorForm
                initialData={vendorData ?? null}
                tmsExtension={tmsExtData ?? null}
                onSave={handleSave}
                onCancel={() => setIsFormOpen(false)}
            />
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Vendor Master</h2>
                    <p className="text-sm text-gray-500">Manage transporters, brokers, and vehicle owners. <span className="text-xs text-blue-600">(Platform Shared)</span></p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" /> Bulk Import
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" /> Export
                    </Button>
                    <Button size="sm" onClick={handleAddNew}>
                        <Plus className="h-4 w-4 mr-2" /> Quick Add Vendor
                    </Button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Total Vendors</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{allVendors.length}</div>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Active</div>
                    <div className="text-2xl font-bold text-green-700 mt-1">{activeCount}</div>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Pending Verification</div>
                    <div className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="text-xs text-gray-500 flex items-center"><BadgeCheck className="h-3 w-3 mr-1" /> Fully Verified</div>
                    <div className="text-2xl font-bold text-blue-700 mt-1">{fullVerifiedCount}</div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">

                {/* Main Content */}
                <div className="flex-1 space-y-4">
                    {/* Search & View Controls */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, ID, or contact..."
                                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                            <div className="bg-gray-100 p-1 rounded-md flex">
                                <button
                                    onClick={() => setView('grid')}
                                    className={`p-1.5 rounded transition-all ${view === 'grid' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setView('table')}
                                    className={`p-1.5 rounded transition-all ${view === 'table' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <ListIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* View - Grid */}
                    {view === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredVendors.map((vendor) => {
                                const tmsExt = masterDataStore.getTMSExtension(vendor.id);
                                const hasAMSContract = masterDataStore.hasActiveAMSContract(vendor.id);
                                const statusInfo = STATUS_MAP[vendor.status];

                                return (
                                    <div key={vendor.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group flex flex-col">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold text-gray-900">{vendor.companyName}</h3>
                                                <div className="flex items-center text-xs text-gray-500 mt-1 gap-2">
                                                    <span className="font-mono bg-gray-100 px-1 rounded">{vendor.id}</span>
                                                    <span className="capitalize">{vendor.type}</span>
                                                    {vendor.verificationLevel === 'FULL' ? (
                                                        <span className="flex items-center text-green-600" title="Fully Verified (AMS)">
                                                            <ShieldCheck className="h-3 w-3" />
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center text-amber-500" title="Basic Verification">
                                                            <ShieldAlert className="h-3 w-3" />
                                                        </span>
                                                    )}
                                                    {hasAMSContract && (
                                                        <span className="bg-purple-100 text-purple-700 px-1 rounded text-[10px] font-medium">AMS</span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${statusInfo.className}`}>
                                                {statusInfo.label}
                                            </span>
                                        </div>

                                        <div className="space-y-2 mb-4 flex-1">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Phone className="h-3 w-3 mr-2 text-gray-400" />
                                                <span>{vendor.contactName} · {vendor.phone}</span>
                                            </div>
                                            {vendor.city && (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <MapPin className="h-3 w-3 mr-2 text-gray-400" />
                                                    <span>{vendor.city}{vendor.state ? `, ${vendor.state}` : ''}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Fleet Size</span>
                                                <span className="font-medium">{vendor.fleetSize > 0 ? `${vendor.fleetSize} Vehicles` : 'N/A'}</span>
                                            </div>
                                            {tmsExt && (
                                                <>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Rating</span>
                                                        <span className="font-medium flex items-center">
                                                            {tmsExt.performance.rating.toFixed(1)} <Star className="h-3 w-3 text-yellow-400 ml-1 fill-current" />
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">On-Time</span>
                                                        <span className={`font-medium ${tmsExt.performance.onTimePercent > 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                                                            {tmsExt.performance.onTimePercent}%
                                                        </span>
                                                    </div>
                                                    {tmsExt.rateAgreements.filter(r => r.status === 'Active').length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-gray-50">
                                                            <p className="text-xs text-gray-400 mb-1">Rate Agreement</p>
                                                            <p className="text-sm font-medium text-primary">
                                                                ₹{tmsExt.rateAgreements[0].rate}/{tmsExt.rateAgreements[0].rateType === 'Per KM' ? 'KM' : 'Trip'}
                                                                <span className="text-xs text-gray-400 ml-1">({tmsExt.rateAgreements[0].vehicleType})</span>
                                                            </p>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            {vendor.zonesServed.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {vendor.zonesServed.map(z => (
                                                        <span key={z} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">{z}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex space-x-2 pt-3 border-t border-gray-100">
                                            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => handleEdit(vendor)}>
                                                View / Edit
                                            </Button>
                                            <Button size="sm" variant="outline" className="flex-1 text-xs">
                                                <Phone className="h-3 w-3 mr-1" /> Contact
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredVendors.length === 0 && (
                                <div className="col-span-full text-center py-12 text-gray-400">
                                    No vendors found matching your filters.
                                </div>
                            )}
                        </div>
                    )}

                    {/* View - Table */}
                    {view === 'table' && (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fleet</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredVendors.map((vendor) => {
                                            const statusInfo = STATUS_MAP[vendor.status];
                                            const tmsExt = masterDataStore.getTMSExtension(vendor.id);
                                            return (
                                                <tr key={vendor.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="text-sm font-bold text-gray-900">{vendor.companyName}</div>
                                                        <div className="text-xs text-gray-500">{vendor.id}</div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">{vendor.type}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{vendor.contactName}</div>
                                                        <div className="text-xs text-gray-500">{vendor.phone}</div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                                                        {vendor.zonesServed.join(', ') || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        {vendor.fleetSize > 0 ? vendor.fleetSize : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {vendor.verificationLevel === 'FULL' ? (
                                                            <span className="flex items-center text-green-600 text-xs"><ShieldCheck className="h-3 w-3 mr-1" /> Full</span>
                                                        ) : (
                                                            <span className="flex items-center text-amber-500 text-xs"><ShieldAlert className="h-3 w-3 mr-1" /> Basic</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.className}`}>
                                                            {statusInfo.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                        <button onClick={() => handleEdit(vendor)} className="text-primary hover:text-indigo-900">Edit</button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Filters */}
                <div className="w-full lg:w-64 space-y-4">
                    <Card title="Filters">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    className="block w-full border-gray-300 rounded-md text-sm py-1.5"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="All">All Types</option>
                                    <option value="Company">Company</option>
                                    <option value="Individual">Individual</option>
                                    <option value="Broker">Broker</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    className="block w-full border-gray-300 rounded-md text-sm py-1.5"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Pending">Pending Verification</option>
                                    <option value="On Hold">On Hold</option>
                                    <option value="Blacklisted">Blacklisted</option>
                                </select>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-center"
                                onClick={() => {
                                    setFilterType('All');
                                    setFilterStatus('All');
                                    setSearchTerm('');
                                }}
                            >
                                Reset All
                            </Button>
                        </div>
                    </Card>

                    {/* Source Legend */}
                    <Card title="Verification Key">
                        <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                                <span className="text-gray-700"><strong>Full</strong> — AMS verified (GST, PAN, docs)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                                <span className="text-gray-700"><strong>Basic</strong> — Quick-add via TMS</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-medium">AMS</span>
                                <span className="text-gray-700">Has active AMS contract</span>
                            </div>
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
};
