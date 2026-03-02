import React from 'react';
import { Card } from '../ui/Card';
import { AlertTriangle, MapPin, Clock, AlertOctagon, Info, ChevronRight } from 'lucide-react';

interface Alert {
  id: string;
  type: 'delay' | 'deviation' | 'breakdown' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  vehicle: string;
  message: string;
  time: string;
  route: string;
}

const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    type: 'delay',
    severity: 'high',
    vehicle: 'MH-01-1234',
    message: 'Delayed by 2 hours due to traffic congestion',
    time: '10 mins ago',
    route: 'Mumbai → Pune'
  },
  {
    id: '2',
    type: 'deviation',
    severity: 'medium',
    vehicle: 'DL-02-5678',
    message: 'Route deviation detected (>5km)',
    time: '25 mins ago',
    route: 'Delhi → Jaipur'
  },
  {
    id: '3',
    type: 'breakdown',
    severity: 'critical',
    vehicle: 'KA-03-9012',
    message: 'Engine breakdown reported at km 45',
    time: '45 mins ago',
    route: 'Bangalore → Chennai'
  },
  {
    id: '4',
    type: 'info',
    severity: 'low',
    vehicle: 'TN-05-1122',
    message: 'Loading completed at hub',
    time: '1h ago',
    route: 'Chennai Local'
  }
];

export const AlertsFeed: React.FC = () => {
  const getIcon = (type: Alert['type']) => {
    switch(type) {
        case 'breakdown': return AlertOctagon;
        case 'delay': return Clock;
        case 'deviation': return MapPin;
        default: return Info;
    }
  };

  const getSeverityStyles = (severity: Alert['severity']) => {
    switch(severity) {
        case 'critical': return 'border-l-4 border-l-red-500 bg-red-50/50';
        case 'high': return 'border-l-4 border-l-orange-500 bg-orange-50/50';
        case 'medium': return 'border-l-4 border-l-yellow-400 bg-yellow-50/50';
        default: return 'border-l-4 border-l-blue-400 bg-blue-50/50';
    }
  };

  return (
    <Card title="Operational Alerts" className="h-full" action={
        <span className="text-xs bg-red-100 text-red-800 font-medium px-2 py-0.5 rounded-full">
            {MOCK_ALERTS.filter(a => a.severity === 'critical' || a.severity === 'high').length} Critical
        </span>
    }>
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {MOCK_ALERTS.map((alert) => {
            const Icon = getIcon(alert.type);
            return (
                <div key={alert.id} className={`p-3 rounded-r-md shadow-sm border border-gray-100 ${getSeverityStyles(alert.severity)} transition-all hover:shadow-md`}>
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center space-x-2">
                             <div className={`p-1 rounded bg-white`}>
                                <Icon className={`h-4 w-4 ${
                                    alert.severity === 'critical' ? 'text-red-600' : 
                                    alert.severity === 'high' ? 'text-orange-500' : 'text-gray-600'
                                }`} />
                             </div>
                             <span className="text-xs font-bold text-gray-700">{alert.vehicle}</span>
                        </div>
                        <span className="text-[10px] text-gray-500">{alert.time}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 leading-tight mb-1">{alert.message}</p>
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-500 truncate max-w-[120px]">{alert.route}</p>
                        <button className="text-xs text-primary font-medium hover:underline flex items-center">
                            View <ChevronRight className="h-3 w-3 ml-0.5" />
                        </button>
                    </div>
                </div>
            );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 text-center">
        <button className="text-sm text-gray-500 hover:text-gray-900 font-medium">View All Alerts</button>
      </div>
    </Card>
  );
};
