
import React from 'react';
import { ShieldAlert, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { RiskLevel } from './types';

interface RiskBadgeProps {
  level: RiskLevel;
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, size = 'md' }) => {
  const config = {
    Critical: { color: 'bg-red-100 text-red-800 border-red-200', icon: ShieldAlert, ring: 'ring-red-500' },
    High: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle, ring: 'ring-orange-500' },
    Medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Info, ring: 'ring-yellow-500' },
    Low: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, ring: 'ring-green-500' },
  };

  const { color, icon: Icon, ring } = config[level];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-4 py-2 text-base' : 'px-2.5 py-1 text-sm';
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 20 : 16;

  return (
    <div className={`inline-flex items-center rounded-full border font-medium ${color} ${sizeClasses}`}>
      <Icon size={iconSize} className="mr-1.5" />
      <span>{level} Risk</span>
      <span className="mx-1.5 opacity-50">|</span>
      <span>{score}/100</span>
    </div>
  );
};
