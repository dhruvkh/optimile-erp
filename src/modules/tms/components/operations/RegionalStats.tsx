import React from 'react';
import { Card } from '../ui/Card';

export const RegionalStats: React.FC = () => {
  const regions = [
    { name: 'North', trips: 145, util: '88%', onTime: '92%', status: 'good' },
    { name: 'West', trips: 112, util: '76%', onTime: '84%', status: 'warning' },
    { name: 'South', trips: 98, util: '91%', onTime: '95%', status: 'good' },
    { name: 'East', trips: 45, util: '65%', onTime: '78%', status: 'critical' },
  ];

  return (
    <Card className="mb-6 p-0 overflow-hidden border border-gray-200">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
         <h3 className="font-bold text-gray-900 text-sm">Regional Performance</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-white text-gray-500 font-medium border-b border-gray-100">
            <tr>
              <th className="px-4 py-2">Region</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2">Util %</th>
              <th className="px-4 py-2">OTD %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {regions.map((r) => (
              <tr key={r.name} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    r.status === 'good' ? 'bg-green-500' : r.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></span>
                  {r.name}
                </td>
                <td className="px-4 py-3 text-gray-600">{r.trips}</td>
                <td className="px-4 py-3 text-gray-600">{r.util}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{r.onTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
