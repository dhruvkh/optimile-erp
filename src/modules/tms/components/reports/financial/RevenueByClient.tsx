import React from 'react';
import { Card } from '../../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Crown, Download } from 'lucide-react';

const CLIENT_DATA = [
  { name: 'Acme Corp', revenue: 450000, trips: 120 },
  { name: 'TechStart', revenue: 320000, trips: 85 },
  { name: 'Global Foods', revenue: 280000, trips: 60 },
  { name: 'BuildRight', revenue: 150000, trips: 45 },
  { name: 'ElectroWorld', revenue: 120000, trips: 30 },
  { name: 'RetailPlus', revenue: 90000, trips: 25 },
];

export const RevenueByClient: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card title="Top 5 Clients by Revenue">
            <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CLIENT_DATA} layout="vertical" margin={{ left: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                     <Tooltip 
                        cursor={{fill: '#F9FAFB'}}
                        formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                     />
                     <Bar dataKey="revenue" fill="#1F4E78" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </Card>

         <Card title="Summary Statistics">
             <div className="space-y-6">
                 <div>
                     <p className="text-sm text-gray-500">Total Revenue (Period)</p>
                     <h3 className="text-3xl font-bold text-gray-900">₹ 14.1 Lakhs</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="p-3 bg-blue-50 rounded-lg">
                         <p className="text-xs text-blue-700 font-medium">Avg Revenue / Client</p>
                         <p className="text-lg font-bold text-blue-900">₹ 2.35 L</p>
                     </div>
                     <div className="p-3 bg-green-50 rounded-lg">
                         <p className="text-xs text-green-700 font-medium">Top Client Share</p>
                         <p className="text-lg font-bold text-green-900">32%</p>
                     </div>
                 </div>
                 <div className="pt-4 border-t border-gray-100">
                     <p className="text-sm font-medium text-gray-900 mb-2">Payment Status</p>
                     <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                            <span className="text-xs font-semibold inline-block text-green-600">
                                Collected (85%)
                            </span>
                            <span className="text-xs font-semibold inline-block text-yellow-600">
                                Outstanding (15%)
                            </span>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-yellow-200">
                            <div style={{ width: "85%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                        </div>
                    </div>
                 </div>
             </div>
         </Card>
      </div>

      <Card title="Client Performance Details" className="p-0 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                  <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Trips</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                  </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                  {CLIENT_DATA.map((client, idx) => (
                     <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                           {idx === 0 && <Crown className="h-3 w-3 text-yellow-500 mr-2" />}
                           {client.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                           {idx < 2 ? 'Premium' : 'Standard'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.trips}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹ {client.revenue.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                           {idx === 1 ? '₹ 45,000' : '₹ 0'}
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
