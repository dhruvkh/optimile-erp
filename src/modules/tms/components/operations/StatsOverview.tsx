import React from 'react';
import { Truck, Clock, AlertTriangle, CheckCircle, Navigation, TrendingUp } from 'lucide-react';

export const StatsOverview: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {/* Active Trips */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Active Trips</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">247</h3>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <Truck className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <span className="text-green-600 font-medium">189</span> in transit, 58 pending
        </div>
      </div>

      {/* On Time */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">In Transit</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">189</h3>
          </div>
          <div className="p-2 bg-green-50 rounded-lg text-green-600">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2 text-xs">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '94%' }}></div>
          </div>
          <span className="text-gray-500 mt-1 block">94% on time</span>
        </div>
      </div>

      {/* Minor Delays */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Minor Delays</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">42</h3>
          </div>
          <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          &lt; 4 hour delays
        </div>
      </div>

      {/* Critical Issues */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between border-l-4 border-l-red-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Critical Issues</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">16</h3>
          </div>
          <div className="p-2 bg-red-50 rounded-lg text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Requires immediate action
        </div>
      </div>

      {/* Fleet Utilisation */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Fleet Util.</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">73<span className="text-sm font-normal text-gray-400">%</span></h3>
          </div>
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Navigation className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2 text-xs text-green-600 flex items-center">
          <TrendingUp className="h-3 w-3 mr-1" /> 189/260 vehicles active
        </div>
      </div>

      {/* Completed */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Completed</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">16</h3>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Delivered today
        </div>
      </div>
    </div>
  );
};
