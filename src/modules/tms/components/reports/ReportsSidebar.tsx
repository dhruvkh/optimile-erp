import React from 'react';
import { 
  Activity, 
  IndianRupee, 
  ShieldCheck, 
  TrendingUp, 
  FileText, 
  ChevronRight, 
  BarChart2, 
  PieChart, 
  Clock, 
  Truck 
} from 'lucide-react';

interface ReportsSidebarProps {
  activeReport: string;
  onSelectReport: (id: string) => void;
}

export const ReportsSidebar: React.FC<ReportsSidebarProps> = ({ activeReport, onSelectReport }) => {
  const categories = [
    {
      title: 'Operational',
      icon: Activity,
      reports: [
        { id: 'daily-ops', label: 'Daily Operations', icon: FileText },
        { id: 'vehicle-util', label: 'Vehicle Utilization', icon: Truck },
        { id: 'route-perf', label: 'Route Performance', icon: TrendingUp },
      ]
    },
    {
      title: 'Financial',
      icon: IndianRupee,
      reports: [
        { id: 'revenue-client', label: 'Revenue by Client', icon: PieChart },
        { id: 'cost-analysis', label: 'Cost Analysis', icon: BarChart2 },
        { id: 'outstanding', label: 'Outstanding Payments', icon: FileText },
      ]
    },
    {
      title: 'Compliance',
      icon: ShieldCheck,
      reports: [
        { id: 'compliance-docs', label: 'Document Expiry', icon: ShieldCheck },
        { id: 'driver-hours', label: 'Driver Compliance', icon: Clock },
      ]
    },
    {
      title: 'Performance',
      icon: TrendingUp,
      reports: [
        { id: 'driver-perf', label: 'Driver Leaderboard', icon: TrendingUp },
        { id: 'otd-perf', label: 'On-Time Delivery', icon: Clock },
      ]
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          <BarChart2 className="h-5 w-5 mr-2 text-primary" /> Reports
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        {categories.map((category, idx) => (
          <div key={idx} className="mb-6 px-3">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
              <category.icon className="h-3 w-3 mr-1.5" />
              {category.title}
            </h3>
            <div className="space-y-1">
              {category.reports.map((report) => {
                const isActive = activeReport === report.id;
                const Icon = report.icon;
                return (
                  <button
                    key={report.id}
                    onClick={() => onSelectReport(report.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className={`h-4 w-4 mr-3 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                      {report.label}
                    </div>
                    {isActive && <ChevronRight className="h-3 w-3 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 mb-2">Saved Reports</div>
        <button className="w-full flex items-center px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded">
           <FileText className="h-3 w-3 mr-2 text-gray-400" /> Monthly Financials
        </button>
      </div>
    </div>
  );
};
