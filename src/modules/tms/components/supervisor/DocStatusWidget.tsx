import React from 'react';
import { Card } from '../ui/Card';
import { FileText, AlertCircle, Clock, FileWarning } from 'lucide-react';

export const DocStatusWidget: React.FC = () => {
  const stats = [
    { label: 'Pending Uploads', value: 5, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Expiring Docs', value: 3, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Expiring Licenses', value: 2, icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Missing Docs', value: 1, icon: FileWarning, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <Card title="Documentation Status" className="h-full">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <div key={index} className={`p-3 rounded-lg border border-gray-100 ${stat.bg} flex flex-col items-center text-center`}>
            <stat.icon className={`h-5 w-5 ${stat.color} mb-1`} />
            <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
            <span className="text-xs text-gray-600 font-medium leading-tight">{stat.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 text-center">
        <button className="text-xs text-primary font-bold uppercase hover:underline">View All Documents</button>
      </div>
    </Card>
  );
};
