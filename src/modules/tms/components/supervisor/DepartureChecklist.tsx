import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckSquare, Clock, ArrowRight } from 'lucide-react';

interface Departure {
  id: string;
  vehicle: string;
  destination: string;
  time: string;
  checks: {
    inspection: boolean;
    docs: boolean;
    sealed: boolean;
  };
  status: 'Ready' | 'Loading';
}

const DEPARTURES: Departure[] = [
  { 
      id: '1', vehicle: 'KA-03-9012', destination: 'Chennai', time: '12:00 PM', status: 'Ready',
      checks: { inspection: true, docs: true, sealed: false }
  },
  { 
      id: '2', vehicle: 'MH-04-1122', destination: 'Mumbai', time: '02:30 PM', status: 'Loading',
      checks: { inspection: true, docs: false, sealed: false }
  }
];

export const DepartureChecklist: React.FC = () => {
  // Using simplified local state for prototype interaction
  const [departures, setDepartures] = useState(DEPARTURES);

  const toggleCheck = (id: string, field: keyof Departure['checks']) => {
    setDepartures(departures.map(d => {
        if (d.id === id) {
            return { ...d, checks: { ...d.checks, [field]: !d.checks[field] } };
        }
        return d;
    }));
  };

  return (
    <Card title="Today's Departures" className="h-full">
      <div className="space-y-3">
        {departures.map((d) => {
            const isReady = d.checks.inspection && d.checks.docs && d.checks.sealed;
            return (
                <div key={d.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h5 className="font-bold text-gray-900 text-sm">{d.vehicle}</h5>
                            <p className="text-xs text-gray-500">To {d.destination}</p>
                        </div>
                        <div className="text-right">
                             <div className="flex items-center text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                <Clock className="h-3 w-3 mr-1" /> {d.time}
                             </div>
                        </div>
                    </div>
                    
                    <div className="space-y-1.5 mb-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={d.checks.inspection} onChange={() => toggleCheck(d.id, 'inspection')} className="rounded text-primary focus:ring-primary h-4 w-4 border-gray-300" />
                            <span className="text-xs text-gray-700">Vehicle Inspection</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={d.checks.docs} onChange={() => toggleCheck(d.id, 'docs')} className="rounded text-primary focus:ring-primary h-4 w-4 border-gray-300" />
                            <span className="text-xs text-gray-700">Documentation</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={d.checks.sealed} onChange={() => toggleCheck(d.id, 'sealed')} className="rounded text-primary focus:ring-primary h-4 w-4 border-gray-300" />
                            <span className="text-xs text-gray-700">Cargo Sealed</span>
                        </label>
                    </div>

                    <Button 
                        size="sm" 
                        disabled={!isReady} 
                        className={`w-full ${isReady ? 'bg-primary' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                        {isReady ? 'Mark Departed' : 'Pending Checks'}
                    </Button>
                </div>
            );
        })}
      </div>
    </Card>
  );
};
