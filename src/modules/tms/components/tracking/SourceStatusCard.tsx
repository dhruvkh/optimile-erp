
import React from 'react';
import { SourceHealth } from './types';
import { Wifi, Smartphone, Globe, Battery, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface SourceStatusCardProps {
  source: SourceHealth;
  isActive: boolean;
  onRenewConsent?: () => void;
}

export const SourceStatusCard: React.FC<SourceStatusCardProps> = ({ source, isActive, onRenewConsent }) => {
  const getIcon = () => {
    switch(source.id) {
      case 'GPS': return <Globe className="h-5 w-5" />;
      case 'App': return <Smartphone className="h-5 w-5" />;
      case 'SIM': return <Wifi className="h-5 w-5" />;
    }
  };

  const getStatusColor = () => {
    if (source.status === 'Active') return 'bg-green-100 text-green-800';
    if (source.status === 'Inactive') return 'bg-gray-100 text-gray-800';
    if (source.status === 'Error') return 'bg-red-100 text-red-800';
    if (source.status === 'Warning') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`border rounded-lg p-4 transition-all duration-300 ${
      isActive ? 'border-primary ring-1 ring-primary shadow-md bg-blue-50/20' : 'border-gray-200 bg-white hover:shadow-sm'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
            {getIcon()}
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">{source.name}</h4>
            <p className="text-[10px] text-gray-500">
              {isActive ? 'Primary Source' : 'Standby'}
            </p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor()}`}>
          {source.status}
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between text-gray-600">
          <span>Last Ping:</span>
          <span className="font-medium">{source.lastPing}</span>
        </div>
        
        {source.accuracy && (
          <div className="flex justify-between text-gray-600">
            <span>Accuracy:</span>
            <span className="font-medium">~{source.accuracy}m</span>
          </div>
        )}

        {(source.batteryLevel !== undefined) && (
          <div className="flex justify-between text-gray-600">
            <span className="flex items-center"><Battery className="h-3 w-3 mr-1" /> Battery:</span>
            <span className={`font-medium ${source.batteryLevel < 20 ? 'text-red-600' : 'text-green-600'}`}>
              {source.batteryLevel}%
            </span>
          </div>
        )}

        {/* SIM Specific: Consent Info */}
        {source.id === 'SIM' && source.consentGiven && (
          <div className="pt-2 border-t border-gray-100 mt-2">
            <div className="flex justify-between text-gray-600">
              <span>Consent Valid:</span>
              <span className="text-green-600 font-medium">
                {new Date(source.consentExpiry || '').toLocaleDateString()}
              </span>
            </div>
            {/* Show Renew button if < 7 days (mocked as always clickable for demo) */}
            <button 
              onClick={onRenewConsent}
              className="mt-2 w-full flex items-center justify-center py-1 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Manage Consent
            </button>
          </div>
        )}

        {source.message && (
          <div className="pt-2 text-gray-500 italic">
            "{source.message}"
          </div>
        )}
      </div>
    </div>
  );
};
