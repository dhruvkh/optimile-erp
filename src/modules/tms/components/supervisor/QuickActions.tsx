import React from 'react';
import { ClipboardList, Camera, Phone, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';

export const QuickActions: React.FC = () => {
  const actions = [
    { label: 'New Check-in', icon: ClipboardList, color: 'bg-primary text-white', hover: 'hover:bg-primary/90' },
    { label: 'Quick Upload', icon: Camera, color: 'bg-secondary text-white', hover: 'hover:bg-secondary/90' },
    { label: 'Call Dispatch', icon: Phone, color: 'bg-green-600 text-white', hover: 'hover:bg-green-700' },
    { label: 'Report Issue', icon: AlertTriangle, color: 'bg-danger text-white', hover: 'hover:bg-red-700' },
    { label: 'Refresh', icon: RefreshCw, color: 'bg-gray-600 text-white', hover: 'hover:bg-gray-700' },
  ];

  return (
    <Card className="mb-6 p-4">
      <div className="flex flex-wrap gap-4 justify-between sm:justify-start">
        {actions.map((action, index) => (
          <button
            key={index}
            className={`flex-1 sm:flex-none min-w-[120px] flex flex-col items-center justify-center p-4 rounded-xl shadow-sm transition-all transform active:scale-95 ${action.color} ${action.hover}`}
          >
            <action.icon className="h-6 w-6 mb-2" />
            <span className="text-xs font-bold uppercase tracking-wide">{action.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
};
