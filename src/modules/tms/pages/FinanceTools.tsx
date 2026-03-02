
import React from 'react';
import { ChargeCalculator } from '../components/finance/ChargeCalculator';
import { IndianRupee } from 'lucide-react';

export const FinanceTools: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center space-x-3 mb-2">
         <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <IndianRupee className="h-6 w-6" />
         </div>
         <div>
            <h1 className="text-2xl font-bold text-gray-900">Finance & Rate Tools</h1>
            <p className="text-sm text-gray-500">Calculate charges, generate quotes, and audit pricing.</p>
         </div>
      </div>

      <ChargeCalculator />
    </div>
  );
};
