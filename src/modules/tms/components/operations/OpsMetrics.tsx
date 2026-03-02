import React from 'react';
import { TrendingUp, TrendingDown, Minus, Truck, Percent, ClipboardList, AlertOctagon } from 'lucide-react';
import { Card } from '../ui/Card';

export const OpsMetrics: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
       {/* Metric 1 */}
       <Card className="p-4 border-l-4 border-l-primary">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vehicles Deployed</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">247 <span className="text-sm font-normal text-gray-400">/ 320</span></h3>
             </div>
             <div className="p-2 bg-blue-50 rounded-lg">
                <Truck className="h-5 w-5 text-primary" />
             </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
             <div className="w-full bg-gray-100 rounded-full h-1.5 mr-2">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: '77%' }}></div>
             </div>
             <span className="font-medium text-gray-700">77%</span>
          </div>
          <p className="text-xs text-green-600 mt-2 flex items-center">
             <TrendingUp className="h-3 w-3 mr-1" /> +12 from yesterday
          </p>
       </Card>

       {/* Metric 2 */}
       <Card className="p-4 border-l-4 border-l-success">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Load Factor</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">82%</h3>
             </div>
             <div className="p-2 bg-green-50 rounded-lg">
                <Percent className="h-5 w-5 text-success" />
             </div>
          </div>
          <div className="mt-2 flex items-center text-xs justify-between text-gray-500">
             <span>Target: 85%</span>
             <span className="text-success font-medium flex items-center"><TrendingUp className="h-3 w-3 mr-1" /> +3%</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
             vs last 7 days average
          </p>
       </Card>

       {/* Metric 3 */}
       <Card className="p-4 border-l-4 border-l-warning">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending Actions</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">8</h3>
             </div>
             <div className="p-2 bg-yellow-50 rounded-lg">
                <ClipboardList className="h-5 w-5 text-warning" />
             </div>
          </div>
           <p className="text-xs text-gray-500 mt-1">
             <span className="font-bold text-gray-900">3</span> high priority approvals
          </p>
          <p className="text-xs text-gray-400 mt-2 flex items-center">
             <Minus className="h-3 w-3 mr-1" /> Same as yesterday
          </p>
       </Card>

       {/* Metric 4 */}
       <Card className="p-4 border-l-4 border-l-danger">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Exceptions</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">12</h3>
             </div>
             <div className="p-2 bg-red-50 rounded-lg">
                <AlertOctagon className="h-5 w-5 text-danger" />
             </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
             <span className="font-bold text-red-600">2</span> critical breakdowns
          </p>
          <p className="text-xs text-green-600 mt-2 flex items-center">
             <TrendingDown className="h-3 w-3 mr-1" /> -3 from yesterday
          </p>
       </Card>
    </div>
  );
};
