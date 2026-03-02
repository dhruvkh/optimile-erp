import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '../ui/Card';

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  period: string;
  icon: LucideIcon;
  inverseTrend?: boolean; // If true, 'down' is good (e.g. costs)
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  trend,
  period,
  icon: Icon,
  inverseTrend = false,
}) => {
  // Determine color based on trend and inverse flag
  let trendColor = 'text-gray-500';
  let trendIcon = Minus;

  if (trend === 'up') {
    trendColor = inverseTrend ? 'text-red-500' : 'text-green-500';
    trendIcon = TrendingUp;
  } else if (trend === 'down') {
    trendColor = inverseTrend ? 'text-green-500' : 'text-red-500';
    trendIcon = TrendingDown;
  }

  const TrendIcon = trendIcon;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg bg-primary/5 text-primary`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        <span className={`flex items-center font-medium ${trendColor}`}>
          <TrendIcon className="h-4 w-4 mr-1" />
          {change}
        </span>
        <span className="text-gray-400 ml-2">{period}</span>
      </div>
    </Card>
  );
};
