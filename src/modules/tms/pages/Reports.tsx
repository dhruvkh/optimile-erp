
import React, { useState } from 'react';
import { ReportsSidebar } from '../components/reports/ReportsSidebar';
import { ReportFilters } from '../components/reports/ReportFilters';
import { DailyOperations } from '../components/reports/operational/DailyOperations';
import { RevenueByClient } from '../components/reports/financial/RevenueByClient';
import { ComplianceOverview } from '../components/reports/compliance/ComplianceOverview';
import { DriverPerformance } from '../components/reports/performance/DriverPerformance';
import { Button } from '../components/ui/Button';
import { Calendar } from 'lucide-react';

export const Reports: React.FC = () => {
  const [activeReport, setActiveReport] = useState('daily-ops');

  const renderReportContent = () => {
    switch (activeReport) {
      case 'daily-ops':
        return <DailyOperations />;
      case 'revenue-client':
        return <RevenueByClient />;
      case 'compliance-docs':
        return <ComplianceOverview />;
      case 'driver-perf':
        return <DriverPerformance />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 text-gray-400">
            <Calendar className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Report Under Development</p>
            <p className="text-sm">This report template is coming soon.</p>
          </div>
        );
    }
  };

  const getReportTitle = () => {
    switch(activeReport) {
        case 'daily-ops': return 'Daily Operations Summary';
        case 'revenue-client': return 'Revenue by Client';
        case 'compliance-docs': return 'Compliance & Expiry Dashboard';
        case 'driver-perf': return 'Driver Performance Leaderboard';
        default: return 'Report Viewer';
    }
  };

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <ReportsSidebar activeReport={activeReport} onSelectReport={setActiveReport} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Report Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
           <div>
              <h1 className="text-xl font-bold text-gray-900">{getReportTitle()}</h1>
              <p className="text-sm text-gray-500 mt-1">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
           </div>
           <div className="flex space-x-3">
              <Button variant="outline" size="sm">Schedule</Button>
              <Button size="sm">Create Custom</Button>
           </div>
        </div>

        {/* Filters */}
        <ReportFilters 
            showRegion={activeReport === 'daily-ops' || activeReport === 'revenue-client'}
            showClient={activeReport === 'revenue-client'}
            showVehicle={activeReport === 'daily-ops'}
        />

        {/* Scrollable Report Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
           {renderReportContent()}
        </div>
      </div>
    </div>
  );
};
