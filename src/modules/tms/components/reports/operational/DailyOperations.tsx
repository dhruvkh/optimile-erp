import React from 'react';
import { Card } from '../../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Truck, Users, Activity, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const TRIP_DATA = [
  { time: '06:00', started: 5, completed: 2 },
  { time: '09:00', started: 12, completed: 4 },
  { time: '12:00', started: 8, completed: 8 },
  { time: '15:00', started: 10, completed: 12 },
  { time: '18:00', started: 6, completed: 15 },
  { time: '21:00', started: 4, completed: 8 },
];

const REGIONAL_DATA = [
  { name: 'North', value: 35, color: '#1F4E78' },
  { name: 'South', value: 25, color: '#2E75B5' },
  { name: 'West', value: 30, color: '#10B981' },
  { name: 'East', value: 10, color: '#F59E0B' },
];

export const DailyOperations: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
           <p className="text-xs text-gray-500 uppercase font-bold">Revenue Generated</p>
           <h3 className="text-2xl font-bold text-gray-900 mt-1">₹ 18.5 L</h3>
           <p className="text-xs text-green-600 mt-2 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +12% vs yesterday
           </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
           <p className="text-xs text-gray-500 uppercase font-bold">Trips Completed</p>
           <h3 className="text-2xl font-bold text-gray-900 mt-1">42</h3>
           <p className="text-xs text-green-600 mt-2 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" /> 94% On-Time
           </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
           <p className="text-xs text-gray-500 uppercase font-bold">Fleet Utilization</p>
           <h3 className="text-2xl font-bold text-gray-900 mt-1">77%</h3>
           <p className="text-xs text-gray-500 mt-2 flex items-center">
              247 / 320 Active
           </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
           <p className="text-xs text-gray-500 uppercase font-bold">Exceptions</p>
           <h3 className="text-2xl font-bold text-red-600 mt-1">12</h3>
           <p className="text-xs text-red-600 mt-2 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" /> 2 Critical
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Charts */}
         <Card title="Trip Activity (Today)" className="lg:col-span-2">
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={TRIP_DATA}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                     <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
                     <Tooltip cursor={{fill: '#F9FAFB'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                     <Legend />
                     <Bar dataKey="started" name="Started" fill="#1F4E78" radius={[4, 4, 0, 0]} />
                     <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </Card>

         <Card title="Regional Volume">
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={REGIONAL_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {REGIONAL_DATA.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                     <Tooltip />
                     <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card title="Operational Breakdown" className="overflow-hidden p-0">
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                  <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Trips</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On-Time %</th>
                  </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                  {[
                     { region: 'North', trips: 95, rev: '₹4.2L', util: '88%', otd: '92%' },
                     { region: 'West', trips: 102, rev: '₹5.6L', util: '76%', otd: '84%' },
                     { region: 'South', trips: 82, rev: '₹3.8L', util: '91%', otd: '95%' },
                     { region: 'East', trips: 45, rev: '₹2.1L', util: '65%', otd: '78%' },
                     { region: 'Central', trips: 38, rev: '₹2.8L', util: '72%', otd: '89%' },
                  ].map((row, i) => (
                     <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.region}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.trips}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{row.rev}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.util}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              parseInt(row.otd) > 90 ? 'bg-green-100 text-green-800' : 
                              parseInt(row.otd) > 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                           }`}>
                              {row.otd}
                           </span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </Card>
    </div>
  );
};
