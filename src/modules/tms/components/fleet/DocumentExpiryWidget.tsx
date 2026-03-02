import React from 'react';
import { Card } from '../ui/Card';
import { AlertTriangle, FileText, ChevronRight, Clock } from 'lucide-react';

export const DocumentExpiryWidget: React.FC = () => {
  const expiringDocs = [
    { id: 1, vehicle: 'MH-01-1234', doc: 'Insurance', days: 5, status: 'critical' },
    { id: 2, vehicle: 'DL-02-5678', doc: 'Fitness Cert', days: 6, status: 'critical' },
    { id: 3, vehicle: 'KA-03-9012', doc: 'PUC', days: 7, status: 'warning' },
    { id: 4, vehicle: 'TN-05-3344', doc: 'Nat. Permit', days: 12, status: 'warning' },
  ];

  return (
    <Card className="h-full border-l-4 border-l-orange-400">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center">
          <Clock className="h-4 w-4 mr-2 text-orange-500" />
          Document Alerts
        </h3>
        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">
          2 Urgent
        </span>
      </div>

      <div className="space-y-3">
        {expiringDocs.map((item) => (
          <div key={item.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0">
            <div>
              <div className="font-medium text-gray-900">{item.vehicle}</div>
              <div className="text-xs text-gray-500 flex items-center mt-0.5">
                <FileText className="h-3 w-3 mr-1" /> {item.doc}
              </div>
            </div>
            <div className={`text-right ${item.status === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>
              <span className="font-bold">{item.days}</span>
              <span className="text-xs ml-1">days left</span>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 text-xs font-medium text-primary hover:text-secondary flex items-center justify-center border-t border-gray-100 pt-2">
        View All Documents <ChevronRight className="h-3 w-3 ml-1" />
      </button>
    </Card>
  );
};
