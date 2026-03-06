import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Plus, Filter, Truck } from 'lucide-react';
import { NewBookingWizard } from '../components/bookings/NewBookingWizard';
import { PipelineBoard } from '../components/bookings/pipeline/PipelineBoard';
import { VehicleAssignment } from '../components/bookings/assignment/VehicleAssignment';
import { BookingProvider } from '../context/BookingContext';
import { BookingDetailsModal } from '../components/bookings/BookingDetailsModal';
import { useOperationalData } from '../../../shared/context/OperationalDataContext';

const STATUS_LABEL: Record<string, string> = {
    booked: 'Booked',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    pod_received: 'POD Received',
    invoiced: 'Invoiced',
    cancelled: 'Cancelled',
};

const STATUS_COLOR: Record<string, string> = {
    booked: 'bg-blue-100 text-blue-800',
    in_transit: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    pod_received: 'bg-teal-100 text-teal-800',
    invoiced: 'bg-indigo-100 text-indigo-800',
    cancelled: 'bg-red-100 text-red-800',
};

export const Bookings: React.FC = () => {
    const { completedTrips } = useOperationalData();
    const [activeTab, setActiveTab] = useState('pipeline');
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    const TABS = [
        { id: 'list', label: 'List View' },
        { id: 'pipeline', label: 'Pipeline' },
        { id: 'new', label: 'New Booking' },
        { id: 'assignment', label: 'Vehicle Assignment' },
    ];

    const filteredListData = completedTrips.map(trip => ({
        id: trip.id,
        type: trip.bookingMode === 'PARTIAL' || trip.bookingMode === 'LTL' ? 'LTL' : 'FTL',
        customer: trip.clientName,
        route: `${trip.origin} → ${trip.destination}`,
        status: trip.status,
        driver: trip.driverName || '-',
        amount: `₹ ${trip.revenueAmount.toLocaleString()}`,
    }));

    const handleRowClick = (booking: any) => {
        setSelectedBooking(booking);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'new':
                return (
                    <BookingProvider>
                        <NewBookingWizard />
                    </BookingProvider>
                );
            case 'pipeline':
                return <PipelineBoard mode={'FTL'} />;
            case 'assignment':
                return <VehicleAssignment />;
            case 'list':
            default:
                return (
                    // Existing List View
                    <Card className="p-0 animate-in fade-in duration-300">
                        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
                            <div className="w-full sm:w-96">
                                <Input
                                    placeholder="Search by ID, customer..."
                                    icon={<Search className="h-4 w-4 text-gray-400" />}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex items-center" onClick={() => window.alert('Filters feature is pending backend API hookup.')}>
                                    <Filter className="h-4 w-4 mr-2" /> Filter
                                </Button>
                                <Button onClick={() => setActiveTab('new')}>
                                    <Plus className="h-4 w-4 mr-2" /> Create New
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredListData.length > 0 ? filteredListData.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => handleRowClick(item)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">{item.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.type === 'FTL' ? 'bg-indigo-100 text-indigo-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.customer}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex flex-col">
                                                    <span>{item.route.split('→')[0]}</span>
                                                    <span className="text-xs text-gray-400">to {item.route.split('→')[1]}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLOR[item.status] ?? 'bg-gray-100 text-gray-800'}`}>
                                                    {STATUS_LABEL[item.status] ?? item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <div className="h-6 w-6 rounded-full bg-gray-200 mr-2 flex items-center justify-center text-xs font-bold text-gray-500">
                                                        {item.driver.charAt(0)}
                                                    </div>
                                                    <span>{item.driver}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{item.amount}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    className="text-secondary hover:text-primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRowClick(item);
                                                    }}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                                                No bookings found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            {/* Pagination Placeholders */}
                            <div className="text-sm text-gray-500">Showing {filteredListData.length} results</div>
                        </div>
                    </Card>
                );
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
                    <p className="text-sm text-gray-500">FTL & Spot Bookings</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto custom-scrollbar pb-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                        whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                        ${activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                    `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                {renderContent()}
            </div>

            {/* Details Modal overlay */}
            {selectedBooking && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                />
            )}
        </div>
    );
};