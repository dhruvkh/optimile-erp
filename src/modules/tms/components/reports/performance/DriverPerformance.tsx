import React from 'react';
import { Card } from '../../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Star, Award, TrendingUp, AlertTriangle } from 'lucide-react';

const DRIVER_DATA = [
  { name: 'Ramesh K', score: 96, trips: 45, otd: 98 },
  { name: 'Suresh S', score: 92, trips: 42, otd: 95 },
  { name: 'Vijay P', score: 88, trips: 38, otd: 90 },
  { name: 'Amit D', score: 85, trips: 40, otd: 88 },
  { name: 'Mohan L', score: 82, trips: 35, otd: 85 },
  { name: 'Rajesh S', score: 78, trips: 30, otd: 80 },
  { name: 'Karthik M', score: 75, trips: 32, otd: 78 },
];

export const DriverPerformance: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-100">
              <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-yellow-200 rounded-full text-yellow-700">
                      <Award className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-yellow-900">Top Performer</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">Ramesh Kumar</p>
              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-700">
                  <span className="flex items-center"><Star className="h-4 w-4 text-yellow-500 mr-1 fill-current" /> 4.9</span>
                  <span className="font-medium">98% On-Time</span>
              </div>
          </Card>

          <Card className="md:col-span-2" title="Performance Distribution">
              <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={DRIVER_DATA}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                          <Tooltip cursor={{fill: '#F9FAFB'}} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                          <Bar dataKey="score" fill="#1F4E78" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </Card>
      </div>

      <Card title="Driver Leaderboard" className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                      <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Trips</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Safety Score</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On-Time %</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {DRIVER_DATA.map((driver, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                      index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                      {index + 1}
                                  </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{driver.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.trips}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{driver.score}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.otd}%</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                  {driver.score < 80 ? (
                                      <span className="flex items-center text-xs text-red-600 font-medium">
                                          <AlertTriangle className="h-3 w-3 mr-1" /> Needs Training
                                      </span>
                                  ) : (
                                      <span className="flex items-center text-xs text-green-600 font-medium">
                                          <TrendingUp className="h-3 w-3 mr-1" /> Good
                                      </span>
                                  )}
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
