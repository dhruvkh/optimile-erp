import React from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { RegionalStats } from '../components/regional/RegionalStats';
import { ClientPortfolio } from '../components/regional/ClientPortfolio';
import { DispatchBoard } from '../components/regional/DispatchBoard';
import { PerformanceScorecard } from '../components/regional/PerformanceScorecard';
import { QuickBookWidget } from '../components/regional/QuickBookWidget';
import { Button } from '../components/ui/Button';
import { Calendar as CalendarIcon, Filter, Map } from 'lucide-react';

export const RegionalDashboard: React.FC = () => {
  const { user } = useAuth();
  const region = user?.region || 'North'; // Default if not set

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regional Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview for <span className="font-semibold text-primary">{region} Region</span> • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div className="flex space-x-2">
           <Button variant="outline" size="sm">
              <CalendarIcon className="h-4 w-4 mr-2" /> Schedule
           </Button>
           <Button variant="outline" size="sm">
              <Map className="h-4 w-4 mr-2" /> Map View
           </Button>
           <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" /> Filters
           </Button>
        </div>
      </div>

      {/* Top Stats */}
      <RegionalStats region={region} />

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Column (Main Content) */}
        <div className="xl:col-span-3 space-y-6">
            {/* Dispatch Board (Timeline) */}
            <div className="h-[400px]">
               <DispatchBoard />
            </div>

            {/* Client Portfolio */}
            <div className="h-[500px]">
               <ClientPortfolio />
            </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="xl:col-span-1 space-y-6">
            {/* Quick Booking */}
            <QuickBookWidget />

            {/* Performance Scorecard */}
            <PerformanceScorecard />
        </div>

      </div>
    </div>
  );
};
