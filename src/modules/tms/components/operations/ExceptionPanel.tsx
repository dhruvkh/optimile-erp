import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { ChevronRight, Clock, Wrench, Map, AlertCircle, Truck } from 'lucide-react';
import { exceptionManager, TripException, ExceptionSeverity } from '../../../../shared/services/exceptionManager';
import { ExceptionActionModal } from './control-tower/ExceptionActionModal';

export const ExceptionPanel: React.FC = () => {
  const [exceptions, setExceptions] = useState<TripException[]>([]);
  const [filter, setFilter] = useState<'All' | 'Critical'>('All');
  const [selectedEx, setSelectedEx] = useState<TripException | null>(null);

  useEffect(() => {
    const refresh = () => setExceptions(exceptionManager.getActive());
    refresh();
    return exceptionManager.subscribe(refresh);
  }, []);

  const filtered = filter === 'All'
    ? exceptions
    : exceptions.filter(e => e.severity === 'critical' || e.severity === 'high');

  const getCategoryIcon = (category: string) => {
    if (category === 'vehicle_breakdown' || category === 'accident') return <Wrench className="h-4 w-4 text-red-500" />;
    if (category === 'route_deviation') return <Map className="h-4 w-4 text-blue-500" />;
    if (category === 'delay') return <Clock className="h-4 w-4 text-orange-500" />;
    return <AlertCircle className="h-4 w-4 text-gray-500" />;
  };

  const getBorderColor = (severity: ExceptionSeverity) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500 bg-red-50/20';
      case 'high': return 'border-l-orange-500 bg-orange-50/20';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50/20';
      default: return 'border-l-blue-500 bg-blue-50/20';
    }
  };

  const getTimeAgo = (ts: number) => {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <>
      <Card className="h-full flex flex-col p-0 border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-sm">Active Exceptions</h3>
          <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">
            {exceptions.length} Active
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-2 text-xs font-medium text-center ${filter === 'All' ? 'text-primary border-b-2 border-primary bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setFilter('All')}
          >
            All
          </button>
          <button
            className={`flex-1 py-2 text-xs font-medium text-center ${filter === 'Critical' ? 'text-red-600 border-b-2 border-red-500 bg-red-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setFilter('Critical')}
          >
            Critical Only
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-0 max-h-[500px] lg:max-h-[calc(100vh-400px)] custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-xs">
              <AlertCircle className="h-8 w-8 mb-2 text-gray-300" />
              No active exceptions
            </div>
          ) : filtered.map((ex) => (
            <div
              key={ex.id}
              className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group border-l-4 ${getBorderColor(ex.severity)}`}
              onClick={() => setSelectedEx(ex)}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(ex.category)}
                  <span className="text-xs font-bold text-gray-800 capitalize">{ex.category.replace(/_/g, ' ')}</span>
                  {ex.requiresReplacementVehicle && !ex.replacementVehicleId && (
                    <span className="flex items-center text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">
                      <Truck className="h-3 w-3 mr-0.5" /> Replace
                    </span>
                  )}
                  {ex.replacementVehicleId && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                      Replaced
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400">{getTimeAgo(ex.raisedAt)}</span>
              </div>

              <p className="text-sm font-medium text-gray-900 mb-1">{ex.title}</p>
              <p className="text-xs text-gray-500 mb-2 line-clamp-1">{ex.description}</p>

              <div className="flex justify-between items-center mt-1">
                <div className="text-xs text-gray-500">
                  <span className="font-mono bg-white border border-gray-200 px-1.5 py-0.5 rounded mr-2">{ex.tripId}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${ex.status === 'raised' || ex.status === 'acknowledged' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {ex.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-[10px] bg-white border border-gray-200 hover:bg-gray-100 px-2 py-1 rounded text-gray-600">
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
          <button className="text-xs font-medium text-primary hover:text-secondary flex items-center justify-center w-full">
            View All Exceptions <ChevronRight className="h-3 w-3 ml-1" />
          </button>
        </div>
      </Card>

      {selectedEx && (
        <ExceptionActionModal
          exception={selectedEx}
          onClose={() => setSelectedEx(null)}
        />
      )}
    </>
  );
};
