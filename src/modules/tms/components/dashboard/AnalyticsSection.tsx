import React from 'react';
import { Card } from '../ui/Card';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const revenueData = [
  { day: '1', value: 4000 },
  { day: '5', value: 3000 },
  { day: '10', value: 2000 },
  { day: '15', value: 2780 },
  { day: '20', value: 1890 },
  { day: '25', value: 2390 },
  { day: '30', value: 3490 },
];

const utilizationData = [
  { name: 'Mon', value: 85 },
  { name: 'Tue', value: 88 },
  { name: 'Wed', value: 92 },
  { name: 'Thu', value: 90 },
  { name: 'Fri', value: 85 },
  { name: 'Sat', value: 75 },
  { name: 'Sun', value: 60 },
];

const regionData = [
  { name: 'North', value: 400 },
  { name: 'West', value: 300 },
  { name: 'South', value: 300 },
  { name: 'East', value: 200 },
];

const COLORS = ['#1F4E78', '#2E75B5', '#10B981', '#F59E0B'];

export const AnalyticsSection: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card title="Revenue Trend (30 Days)" className="lg:col-span-1">
        <div className="h-64 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1F4E78" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#1F4E78" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Area type="monotone" dataKey="value" stroke="#1F4E78" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Fleet Utilization (7 Days)" className="lg:col-span-1">
        <div className="h-64 w-full mt-2">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={utilizationData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
              <Tooltip 
                cursor={{fill: '#F9FAFB'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="value" fill="#2E75B5" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Regional Distribution" className="lg:col-span-1">
        <div className="h-64 w-full mt-2 relative">
           <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={regionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {regionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
            <span className="text-3xl font-bold text-gray-900">4</span>
            <span className="text-xs text-gray-500">Regions</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
