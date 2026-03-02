import React from 'react';
import { Card } from '../ui/Card';
import { Truck, CheckCircle, TrendingUp, Star, MapPin } from 'lucide-react';

interface RegionalStatsProps {
  region: string;
}

export const RegionalStats: React.FC<RegionalStatsProps> = ({ region }) => {
  const stats = [
    {
      title: 'Active Trips',
      value: '45',
      subtitle: `in ${region} region`,
      icon: Truck,
      color: 'bg-blue-50 text-blue-700'
    },
    {
      title: 'Available Vehicles',
      value: '12',
      subtitle: 'ready to deploy',
      icon: CheckCircle,
      color: 'bg-green-50 text-green-700'
    },
    {
      title: "Today's Revenue",
      value: '₹8.2L',
      subtitle: '+15% vs avg',
      icon: TrendingUp,
      color: 'bg-indigo-50 text-indigo-700'
    },
    {
      title: 'Client Satisfaction',
      value: '4.7/5',
      subtitle: 'based on 28 ratings',
      icon: Star,
      color: 'bg-yellow-50 text-yellow-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
              </div>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-400">
               {stat.subtitle}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
