import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, FileText, IndianRupee, MessageSquare, Info } from 'lucide-react';
import { DocumentationTab } from './docs/DocumentationTab';
import { RateManagement } from './rates/RateManagement';
import { CommunicationTab } from './communication/CommunicationTab';

interface BookingDetailsModalProps {
    booking: any;
    onClose: () => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ booking, onClose }) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (!booking) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-4xl bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/80">
                    <div>
                        <div className="flex items-center space-x-3">
                            <h2 className="text-xl font-bold text-gray-900">{booking.id}</h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                {booking.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{booking.customer} • {booking.route}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="px-6 border-b border-gray-200 bg-white">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Info className="w-4 h-4 mr-2" /> Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('docs')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'docs' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <FileText className="w-4 h-4 mr-2" /> Components & Docs
                        </button>
                        <button
                            onClick={() => setActiveTab('rates')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'rates' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <IndianRupee className="w-4 h-4 mr-2" /> Rates & Billing
                        </button>
                        <button
                            onClick={() => setActiveTab('comms')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'comms' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <MessageSquare className="w-4 h-4 mr-2" /> Communications
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <Card title="Booking Overview">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Customer</p>
                                        <p className="mt-1 text-sm text-gray-900">{booking.customer}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Route</p>
                                        <p className="mt-1 text-sm text-gray-900">{booking.route}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Booking Type</p>
                                        <p className="mt-1 text-sm text-gray-900">{booking.type}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total Amount</p>
                                        <p className="mt-1 text-sm font-semibold text-gray-900">{booking.amount}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Assigned Driver</p>
                                        <p className="mt-1 text-sm text-gray-900">{booking.driver}</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'docs' && <DocumentationTab />}
                    {activeTab === 'rates' && <RateManagement />}
                    {activeTab === 'comms' && <CommunicationTab />}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-end space-x-3">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button>Save Changes</Button>
                </div>
            </div>
        </div>
    );
};
