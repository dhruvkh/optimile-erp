
import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Map, Zap, CheckCircle, ArrowRight, Clock, Fuel } from 'lucide-react';
import { useBooking } from '../../../context/BookingContext';
import { useToast } from '../../../../../shared/context/ToastContext';

export const RouteOptimizer: React.FC = () => {
  const { data, updateFTLData } = useBooking();
  const { showToast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
        setIsOptimizing(false);
        setShowResults(true);
        updateFTLData({ optimizedRoute: true });
    }, 1500);
  };

  if (!showResults) {
      return (
          <div className="mt-4">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-lg p-6 text-center">
                  <div className="flex justify-center mb-4">
                      <div className="p-3 bg-white rounded-full shadow-sm">
                          <Map className="h-8 w-8 text-indigo-500" />
                      </div>
                  </div>
                  <h3 className="text-lg font-bold text-indigo-900">Route Optimization Available</h3>
                  <p className="text-sm text-indigo-700 mt-2 mb-4 max-w-md mx-auto">
                      AI analysis suggests a more efficient route sequence for your {data.ftl.stops.length + 2} stops. Optimize now to save fuel and time.
                  </p>
                  <Button onClick={handleOptimize} isLoading={isOptimizing} className="bg-indigo-600 hover:bg-indigo-700">
                      <Zap className="h-4 w-4 mr-2" /> Optimize Route
                  </Button>
              </div>
          </div>
      );
  }

  return (
    <Card className="mt-4 border-green-200 bg-green-50/30 overflow-hidden">
        <div className="p-4 border-b border-green-100 bg-white/50 flex justify-between items-center">
            <h3 className="font-bold text-green-900 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" /> Optimization Complete
            </h3>
            <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                SAVINGS: ₹ 8,700
            </span>
        </div>

        <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-3 rounded border border-gray-200 opacity-70">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Original Route</p>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Distance:</span> <span className="font-medium">1,850 km</span></div>
                        <div className="flex justify-between"><span>Time:</span> <span className="font-medium">38 hrs</span></div>
                        <div className="flex justify-between"><span>Fuel:</span> <span className="font-medium">480 L</span></div>
                        <div className="flex justify-between border-t pt-1 mt-1 font-bold text-gray-700">
                            <span>Cost:</span> <span>₹ 68,500</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-3 rounded border-2 border-green-500 shadow-md transform scale-105">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs text-green-700 uppercase font-bold">Optimized</p>
                        <Zap className="h-3 w-3 text-green-500 fill-current" />
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Distance:</span> <span className="font-bold text-gray-900">1,620 km</span></div>
                        <div className="flex justify-between"><span>Time:</span> <span className="font-bold text-gray-900">32 hrs</span></div>
                        <div className="flex justify-between"><span>Fuel:</span> <span className="font-bold text-gray-900">420 L</span></div>
                        <div className="flex justify-between border-t pt-1 mt-1 font-bold text-green-700">
                            <span>Cost:</span> <span>₹ 59,800</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visual Route */}
            <div className="relative pl-4 border-l-2 border-gray-300 space-y-4">
                <div className="relative">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
                    <p className="text-xs font-bold text-gray-900">Start: Mumbai Hub</p>
                </div>
                <div className="relative">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                    <p className="text-xs font-bold text-gray-900">Pickup 1: Pune (Acme Corp)</p>
                    <p className="text-[10px] text-gray-500 pl-2 border-l border-gray-200 ml-1">Load 2.5T • 2 hrs</p>
                </div>
                <div className="relative">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                    <p className="text-xs font-bold text-gray-900">Pickup 2: Nashik (Global)</p>
                    <p className="text-[10px] text-gray-500 pl-2 border-l border-gray-200 ml-1">Load 3.2T • 1.5 hrs</p>
                </div>
                <div className="relative">
                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
                    <p className="text-xs font-bold text-gray-900">End: Delhi DC</p>
                </div>
            </div>
            
            <div className="mt-4 flex gap-3">
                <Button size="sm" className="w-full" onClick={() => showToast({ type: 'success', title: 'Route Optimized', message: 'Optimized route applied. Stops updated.' })}>Apply Optimized Route</Button>
                <Button size="sm" variant="outline" className="w-full" onClick={() => showToast({ type: 'info', title: 'Map View', message: 'Integrated map view coming soon.' })}>View Map</Button>
            </div>
        </div>
    </Card>
  );
};
