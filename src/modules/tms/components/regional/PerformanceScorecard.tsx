import React from 'react';
import { Card } from '../ui/Card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export const PerformanceScorecard: React.FC = () => {
  const metrics = [
    {
      name: 'Vehicle Utilization',
      regional: '76%',
      national: '73%',
      diff: 3,
      positive: true // higher is better
    },
    {
      name: 'On-Time Delivery',
      regional: '87%',
      national: '89%',
      diff: -2,
      positive: true // higher is better
    },
    {
      name: 'Revenue per Trip',
      regional: '₹32.5k',
      national: '₹30.2k',
      diff: 7.6,
      positive: true
    },
    {
      name: 'Empty Running',
      regional: '15%',
      national: '18%',
      diff: -3, // means regional is 3% lower than national
      positive: false // lower is better
    }
  ];

  return (
    <Card title="Regional Performance" className="h-full">
      <div className="overflow-hidden">
        <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                <tr>
                    <th className="px-3 py-2 text-left">Metric</th>
                    <th className="px-3 py-2 text-right">Region</th>
                    <th className="px-3 py-2 text-right">National</th>
                    <th className="px-3 py-2 text-center">Trend</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {metrics.map((m) => {
                    // Logic to determine if the difference is "Good" (Green) or "Bad" (Red)
                    // If metric is positive (higher is better), then diff > 0 is green.
                    // If metric is negative (lower is better, e.g. empty running), then diff < 0 is green.
                    const isGood = m.positive ? m.diff > 0 : m.diff < 0;
                    const color = isGood ? 'text-green-600' : 'text-red-600';
                    const Icon = m.diff > 0 ? ArrowUp : m.diff < 0 ? ArrowDown : Minus;
                    
                    return (
                        <tr key={m.name} className="hover:bg-gray-50">
                            <td className="px-3 py-3 font-medium text-gray-900">{m.name}</td>
                            <td className="px-3 py-3 text-right font-bold text-gray-700">{m.regional}</td>
                            <td className="px-3 py-3 text-right text-gray-500">{m.national}</td>
                            <td className="px-3 py-3 text-center">
                                <div className={`flex items-center justify-center text-xs font-bold ${color}`}>
                                    <Icon className="h-3 w-3 mr-0.5" />
                                    {Math.abs(m.diff)}%
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>
      <div className="p-3 bg-gray-50 text-xs text-center text-gray-500 border-t border-gray-100">
          Last updated: Today, 08:00 AM
      </div>
    </Card>
  );
};
