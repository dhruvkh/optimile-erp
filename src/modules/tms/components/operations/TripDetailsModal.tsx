
import React, { useState } from 'react';
import { X, MapPin, Calendar, Truck, User, FileText, Activity, DollarSign, Clock, Phone, MessageSquare, AlertTriangle, CheckCircle, Navigation, Layers, Lock } from 'lucide-react';
import { Button } from '../ui/Button';
import { TripTimeline } from './ftl/TripTimeline';
import { StatusUpdateModal } from './ftl/StatusUpdateModal';
import { TripClosureModal } from './ftl/TripClosureModal';
import { TripDataFull, TripStatusCode } from './ftl/types';

interface TripDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string | null;
}

// Mock Data for FTL Trip
const MOCK_FTL_DATA: TripDataFull = {
  tripId: 'TR-2024-1001',
  currentStatus: 'DISPATCHED',
  sla: { onTimeCheckpoints: 3, delayedCheckpoints: 1, overallStatus: 'At Risk' },
  timeline: [
    {
      id: 'cp1', status: 'INDENT_RECEIVED', timestamp: '2024-02-10T08:00:00Z', locationName: 'HQ System',
      capturedBy: { id: 'u1', name: 'System', role: 'Admin' }
    },
    {
      id: 'cp2', status: 'VEHICLE_ASSIGNED', timestamp: '2024-02-10T09:30:00Z', locationName: 'Ops Desk',
      capturedBy: { id: 'u2', name: 'Rajesh K', role: 'Manager' },
      data: { vehicle: 'MH-01-AB-1234', driver: 'Suresh' }
    },
    {
      id: 'cp3', status: 'VEHICLE_REPORTED', timestamp: '2024-02-10T14:15:00Z', locationName: 'Andheri Hub',
      capturedBy: { id: 'd1', name: 'Suresh', role: 'Driver' },
      evidence: { photos: ['https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=150&q=80'] },
      isDelay: true, delayReason: 'Traffic Congestion'
    },
    {
      id: 'cp4', status: 'DISPATCHED', timestamp: '2024-02-10T16:00:00Z', locationName: 'Andheri Hub',
      capturedBy: { id: 's1', name: 'Amit', role: 'Supervisor' },
      data: { odometer: '45200', fuel: '90%' },
      evidence: { photos: ['https://images.unsplash.com/photo-1586191582119-2925c6ec6c27?auto=format&fit=crop&w=150&q=80'] }
    }
  ]
};

export const TripDetailsModal: React.FC<TripDetailsModalProps> = ({ isOpen, onClose, tripId }) => {
  const [activeTab, setActiveTab] = useState('timeline');
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isClosureModalOpen, setClosureModalOpen] = useState(false);
  const [tripData, setTripData] = useState<TripDataFull>(MOCK_FTL_DATA);

  if (!isOpen || !tripId) return null;

  const handleStatusUpdate = (newStatus: TripStatusCode, data: any) => {
    // Add new checkpoint to timeline mock
    const newCheckpoint = {
      id: `cp${Date.now()}`,
      status: newStatus,
      timestamp: new Date().toISOString(),
      locationName: data.location || 'Current Location',
      capturedBy: { id: 'curr', name: 'Current User', role: 'Operator' }, // Mock user
      data: { ...data },
      evidence: { photos: data.photos }
    };

    setTripData(prev => ({
      ...prev,
      currentStatus: newStatus,
      timeline: [...prev.timeline, newCheckpoint]
    }));
  };

  const handleClosureSuccess = () => {
    handleStatusUpdate('TRIP_CLOSED', { location: 'System', notes: 'Closed via Finance Sync' });
  };

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
          <p className="text-xs text-blue-600 uppercase font-bold">Current Status</p>
          <p className="text-lg font-bold text-blue-900 mt-1 flex items-center">
            {tripData.currentStatus.replace(/_/g, ' ')}
            <span className="w-2 h-2 bg-blue-500 rounded-full ml-2 animate-pulse"></span>
          </p>
        </div>
        <div className="bg-green-50 border border-green-100 p-3 rounded-lg">
          <p className="text-xs text-green-600 uppercase font-bold">ETA</p>
          <p className="text-lg font-bold text-green-900 mt-1">Feb 11, 18:00</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
          <p className="text-xs text-gray-500 uppercase font-bold">Distance Remaining</p>
          <p className="text-lg font-bold text-gray-900 mt-1">1,000 km</p>
        </div>
      </div>

      {/* Route Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-primary" /> Route Information
        </h4>
        <div className="relative pl-6 border-l-2 border-gray-200 space-y-6">
          <div className="relative">
            <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
            <p className="text-xs text-gray-500">Origin</p>
            <p className="font-bold text-gray-900">Warehouse A, Mumbai</p>
            <p className="text-xs text-gray-600">Feb 10, 11:00 AM</p>
          </div>
          <div className="relative">
            <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-primary border-2 border-white"></div>
            <p className="text-xs text-gray-500">Current Location</p>
            <p className="font-bold text-gray-900">Near Surat, Gujarat</p>
            <p className="text-xs text-gray-600">Updated 2 mins ago</p>
          </div>
          <div className="relative">
            <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-gray-300 border-2 border-white"></div>
            <p className="text-xs text-gray-500">Destination</p>
            <p className="font-bold text-gray-900">DC-5, Delhi</p>
            <p className="text-xs text-gray-600">Exp: Feb 11, 18:00</p>
          </div>
        </div>
      </div>

      {/* Driver & Vehicle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-sm font-bold text-gray-900">Driver Details</h4>
            <div className="flex space-x-1">
              <button className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><Phone className="h-3 w-3" /></button>
              <button className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100"><MessageSquare className="h-3 w-3" /></button>
            </div>
          </div>
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              <User className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900">Ramesh Kumar</p>
              <p className="text-xs text-gray-500">ID: DRV-0089 • Rating: 4.8</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-bold text-gray-900 mb-3">Vehicle Details</h4>
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-primary">
              <Truck className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900">MH-01-1234</p>
              <p className="text-xs text-gray-500">20 Ton Closed Body • 65 km/h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-center justify-center min-h-screen p-4 text-center">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

          <div className="relative inline-flex flex-col text-left align-middle bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-5xl w-full h-[80vh]">

            {/* Header */}
            <div className="bg-primary px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-lg leading-6 font-bold text-white flex items-center">
                  Trip #{tripId}
                  <span className="ml-3 bg-blue-500 text-white text-xs px-2 py-0.5 rounded border border-blue-400 uppercase">
                    {tripData.currentStatus.replace(/_/g, ' ')}
                  </span>
                </h3>
                <p className="text-blue-200 text-xs mt-1">Acme Corp • Electronics • 18 Tons</p>
              </div>
              <div className="flex items-center space-x-3">
                {/* Show Closure Button if ready, else regular update */}
                {['POD_SOFT_UPLOADED', 'POD_HARD_RECEIVED'].includes(tripData.currentStatus) ? (
                  <Button size="sm" className="bg-slate-700 hover:bg-slate-800 text-white border-none shadow-sm" onClick={() => setClosureModalOpen(true)}>
                    <Lock className="h-4 w-4 mr-2" /> Close Trip
                  </Button>
                ) : (
                  tripData.currentStatus !== 'TRIP_CLOSED' && (
                    <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white border-none shadow-sm" onClick={() => setUpdateModalOpen(true)}>
                      Update Status
                    </Button>
                  )
                )}

                <button onClick={onClose} className="text-blue-200 hover:text-white p-1 rounded hover:bg-white/10">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 bg-white flex-shrink-0">
              <nav className="-mb-px flex px-6 space-x-6 overflow-x-auto" aria-label="Tabs">
                {[
                  { id: 'timeline', label: 'Timeline & SLA', icon: Layers },
                  { id: 'overview', label: 'Overview', icon: Activity },
                  { id: 'route', label: 'Route Map', icon: Navigation },
                  { id: 'docs', label: 'Documents', icon: FileText },
                  { id: 'expenses', label: 'Expenses', icon: DollarSign },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${isActive ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                      <Icon className={`h-4 w-4 mr-2 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
              {activeTab === 'timeline' ? (
                <div className="max-w-3xl mx-auto">
                  <TripTimeline data={tripData} />
                </div>
              ) : activeTab === 'overview' ? (
                renderOverview()
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="font-medium">Content for {activeTab} tab</p>
                  <p className="text-xs mt-2">Visualization placeholder</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
              <div className="text-xs text-gray-500">
                Last updated: Just now
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  <AlertTriangle className="h-4 w-4 mr-2" /> Report Issue
                </Button>
                <Button variant="outline">
                  <Navigation className="h-4 w-4 mr-2" /> Track on Map
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <StatusUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        currentStatus={tripData.currentStatus}
        tripId={tripId}
        onUpdate={handleStatusUpdate}
      />

      <TripClosureModal
        isOpen={isClosureModalOpen}
        onClose={() => setClosureModalOpen(false)}
        tripId={tripId}
        onSuccess={handleClosureSuccess}
      />
    </>
  );
};
