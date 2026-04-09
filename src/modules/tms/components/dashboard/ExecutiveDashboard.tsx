import React from 'react';
import { IndianRupee, Truck, Activity, TrendingDown, Clock, Plus, FileText, List } from 'lucide-react';
import { KPICard } from './KPICard';
import { OperationsMap } from './OperationsMap';
import { AlertsFeed } from './AlertsFeed';
import { AnalyticsSection } from './AnalyticsSection';
import { Button } from '../ui/Button';
import { AIInsightsPanel } from '../../../../shared/components/AIInsightsPanel';

export const ExecutiveDashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section with Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time overview of pan-India operations</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" /> Reports
          </Button>
          <Button variant="outline" size="sm">
            <List className="h-4 w-4 mr-2" /> All Trips
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" /> New Booking
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Revenue"
          value="₹45.2L"
          change="+12.5%"
          trend="up"
          period="vs last month"
          icon={IndianRupee}
        />
        <KPICard
          title="Active Shipments"
          value="247"
          change="+18"
          trend="up"
          period="today"
          icon={Truck}
        />
        <KPICard
          title="Fleet Utilization"
          value="73%"
          change="+5%"
          trend="up"
          period="vs last week"
          icon={Activity}
        />
        <KPICard
          title="Cost per KM"
          value="₹28.50"
          change="-2.3%"
          trend="down"
          period="vs last month"
          icon={TrendingDown}
          inverseTrend
        />
        <KPICard
          title="On-Time Delivery"
          value="89%"
          change="+3%"
          trend="up"
          period="this month"
          icon={Clock}
        />
      </div>

      <AIInsightsPanel
        summary="Quick read on demand, service, and cost movement."
        insights={[
          {
            label: 'Demand',
            title: 'Demand is outpacing last week',
            metric: '+18 trips',
            tone: 'positive',
            description: 'Shipment flow is rising faster than the rest of the dashboard.',
            action: 'Add capacity on the busiest lanes.',
          },
          {
            label: 'Service',
            title: 'Service reliability is close to target',
            metric: '89% OTD',
            tone: 'watch',
            description: 'Delivery performance is improving but still below a strong comfort zone.',
            action: 'Check delayed hubs and exceptions.',
          },
          {
            label: 'Cost',
            title: 'Cost gains are worth protecting',
            metric: '₹28.50/km',
            tone: 'info',
            description: 'Cost per KM improved, so the current route mix is working.',
            action: 'Prefer high-utilization fleet before spot buys.',
          },
        ]}
        footer="AI insights are generated from the executive KPI snapshot and should be used as a prioritization aid."
      />

      {/* Main Content Grid: Map + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 min-h-[500px]">
          <OperationsMap />
        </div>
        <div className="lg:col-span-1">
          <AlertsFeed />
        </div>
      </div>

      {/* Bottom Analytics Section */}
      <AnalyticsSection />
    </div>
  );
};
