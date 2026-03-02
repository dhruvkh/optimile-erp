
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { RefreshCw, Map as MapIcon, List, LayoutGrid, Filter, Search, Phone, AlertTriangle, Layers, Plus } from 'lucide-react';
import { StatsOverview } from '../components/operations/StatsOverview';
import { LiveMap } from '../components/operations/LiveMap';
import { TripsTable } from '../components/operations/TripsTable';
import { ExceptionPanel } from '../components/operations/ExceptionPanel';
import { DelayPrediction } from '../components/operations/DelayPrediction';
import { TripDetailsModal } from '../components/operations/ftl/TripDetailsModal';
import { PTLOpportunitiesPanel } from '../components/operations/PTLOpportunitiesPanel';
import { QuickFTLBookingModal } from '../components/operations/QuickFTLBookingModal';
import { useNavigate } from 'react-router-dom';
import { useOperationalData } from '../../../shared/context/OperationalDataContext';

export const Operations: React.FC = () => {
  const navigate = useNavigate();
  const { createTrip } = useOperationalData();
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'table'>('table');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);

  const handleTripSelect = (tripId: string) => {
    setSelectedTripId(tripId);
  };

  const handleQuickBookingSubmit = (booking: any) => {
    // Draft bookings pending HO approval are not activated in live operations yet.
    if (booking?.hoApprovalStatus === 'Pending') return;

    createTrip({
      bookingRef: booking.bookingId,
      clientId: booking.customerId,
      clientName: booking.customerName || 'New Client',
      origin: booking.origin,
      destination: booking.destination,
      distanceKm: 500,
      tripType: 'market_hire',
      bookingMode: 'FTL',
      revenueAmount: parseFloat(booking.quotedRate) || 0,
    });
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      
      {/* Top Bar */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-20 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">Operations Control</h1>
          <div className="hidden md:flex bg-gray-100 rounded-md p-1">
             <button 
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'split' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
             >
                Split View
             </button>
             <button 
                onClick={() => setViewMode('map')}
                className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'map' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
             >
                Map Only
             </button>
             <button 
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-xs font-medium rounded transition-all ${viewMode === 'table' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
             >
                Table Only
             </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
           <div className="hidden lg:flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Live Data (30s) • FTL & PTL Operations
           </div>
           <Button
              size="sm"
              onClick={() => setIsQuickBookingOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
           >
              <Plus className="h-4 w-4 mr-2" /> Quick FTL
           </Button>
           <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" /> Filters
           </Button>
           <Button variant="danger" size="sm" className="bg-red-600 hover:bg-red-700 text-white">
              <AlertTriangle className="h-4 w-4 mr-2" /> SOS
           </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">

         {/* Main Workspace */}
         <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-4 space-y-4">
               {/* Stats Row */}
               <StatsOverview />

               {/* Layout Container - Fixed height for map/table views */}
               <div className={`flex flex-col lg:flex-row gap-4 min-h-0 ${viewMode === 'table' ? 'min-h-[600px]' : 'h-[600px]'}`}>

                  {/* Left/Top Area (Map) */}
                  {(viewMode === 'split' || viewMode === 'map') && (
                      <div className={`flex flex-col ${viewMode === 'split' ? 'lg:w-2/3' : 'w-full'} h-full min-h-0`}>
                          <LiveMap onVehicleSelect={handleTripSelect} />
                      </div>
                  )}

                  {/* Right/Bottom Area (Table/List) */}
                  {(viewMode === 'split' || viewMode === 'table') && (
                      <div className={`flex flex-col ${viewMode === 'split' ? 'lg:w-1/3' : 'w-full'} h-full min-h-0`}>
                          <TripsTable onTripSelect={handleTripSelect} />
                      </div>
                  )}
               </div>

               {/* PTL Consolidation Opportunities - Scrollable below map/table */}
               <div className="mt-4">
                  <PTLOpportunitiesPanel onConsolidate={() => {
                     // In real app: Create trip with multi-party tracking
                     // Trip would show in TripsTable above with "Multi-Party" badge
                  }} />
               </div>
            </div>
         </div>

         {/* Right Sidebar (Exceptions & AI) */}
         <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden hidden xl:flex">
             <div className="p-4 border-b border-gray-100 flex-shrink-0">
                 <DelayPrediction />
             </div>
             <div className="flex-1 overflow-hidden">
                 <ExceptionPanel />
             </div>
         </div>

      </div>

      {/* Trip Details Modal */}
      <TripDetailsModal
        isOpen={!!selectedTripId}
        onClose={() => setSelectedTripId(null)}
        tripId={selectedTripId}
      />

      {/* Quick FTL Booking Modal */}
      <QuickFTLBookingModal
        isOpen={isQuickBookingOpen}
        onClose={() => setIsQuickBookingOpen(false)}
        onSubmit={handleQuickBookingSubmit}
      />
    </div>
  );
};
