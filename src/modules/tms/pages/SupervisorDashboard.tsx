import React, { useState } from 'react';
import { QuickActions } from '../components/supervisor/QuickActions';
import { ArrivalQueue } from '../components/supervisor/ArrivalQueue';
import { BayManagement } from '../components/supervisor/BayManagement';
import { DocStatusWidget } from '../components/supervisor/DocStatusWidget';
import { DepartureChecklist } from '../components/supervisor/DepartureChecklist';
import { CheckInWizard } from '../components/supervisor/CheckInWizard';
import { Button } from '../components/ui/Button';
import { Menu } from 'lucide-react';

export const SupervisorDashboard: React.FC = () => {
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);

  const handleStartCheckIn = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setIsCheckInOpen(true);
  };

  const handleCloseCheckIn = () => {
    setIsCheckInOpen(false);
    setSelectedVehicleId(undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50 space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Supervisor Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supervisor Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">Warehouse A • Shift 1 (08:00 - 16:00)</p>
        </div>
        <div className="flex space-x-2">
            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                Online
            </span>
        </div>
      </div>

      {/* Quick Actions Row */}
      <QuickActions />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Primary Operations) */}
        <div className="lg:col-span-2 space-y-6">
            {/* 1. Arrival Queue (High Priority) */}
            <div className="min-h-[300px]">
                <ArrivalQueue onCheckIn={handleStartCheckIn} />
            </div>

            {/* 2. Loading Bays */}
            <div className="min-h-[300px]">
                <BayManagement />
            </div>
        </div>

        {/* Right Column (Secondary / Status) */}
        <div className="lg:col-span-1 space-y-6">
             {/* 3. Doc Status */}
             <DocStatusWidget />

             {/* 4. Departures */}
             <DepartureChecklist />
        </div>
      </div>

      {/* Check-in Modal */}
      <CheckInWizard 
        isOpen={isCheckInOpen} 
        onClose={handleCloseCheckIn} 
        vehicleId={selectedVehicleId} 
      />
    </div>
  );
};
