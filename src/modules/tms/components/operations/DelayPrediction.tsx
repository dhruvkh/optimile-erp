import React from 'react';
import { Card } from '../ui/Card';
import { BrainCircuit, AlertTriangle, ArrowRight, MessageSquare, Phone } from 'lucide-react';
import { Button } from '../ui/Button';

export const DelayPrediction: React.FC = () => {
  return (
    <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-none relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <BrainCircuit className="h-32 w-32" />
      </div>
      
      <div className="flex items-center space-x-2 mb-4 relative z-10">
        <div className="bg-indigo-500/20 p-2 rounded-lg backdrop-blur-sm border border-indigo-500/30">
          <BrainCircuit className="h-5 w-5 text-indigo-300" />
        </div>
        <h3 className="font-bold text-indigo-100">AI Predictive Insights</h3>
      </div>

      <div className="space-y-4 relative z-10">
        {/* Prediction 1 */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/10">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <span className="font-bold text-sm text-yellow-100">TR-2024-1005</span>
            </div>
            <span className="text-[10px] bg-indigo-500/50 px-2 py-0.5 rounded text-indigo-100">87% Confidence</span>
          </div>
          
          <p className="text-xs text-gray-300 mb-2">
            Predicted delay of <span className="text-white font-bold">45 mins</span> due to heavy traffic on NH-48.
          </p>
          
          <div className="flex space-x-2">
            <button className="flex-1 bg-white/10 hover:bg-white/20 text-[10px] py-1.5 rounded transition-colors flex items-center justify-center">
              <MessageSquare className="h-3 w-3 mr-1" /> Notify Client
            </button>
            <button className="flex-1 bg-white/10 hover:bg-white/20 text-[10px] py-1.5 rounded transition-colors flex items-center justify-center">
              <ArrowRight className="h-3 w-3 mr-1" /> Suggest Route
            </button>
          </div>
        </div>

        {/* Prediction 2 */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/10">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="font-bold text-sm text-red-100">TR-2024-1008</span>
            </div>
            <span className="text-[10px] bg-indigo-500/50 px-2 py-0.5 rounded text-indigo-100">92% Confidence</span>
          </div>
          
          <p className="text-xs text-gray-300 mb-2">
            Vehicle stationary for 45 mins. Predicted delay <span className="text-white font-bold">1.5 hours</span>.
          </p>
          
          <div className="flex space-x-2">
            <button className="flex-1 bg-white/10 hover:bg-white/20 text-[10px] py-1.5 rounded transition-colors flex items-center justify-center">
              <Phone className="h-3 w-3 mr-1" /> Call Driver
            </button>
            <button className="flex-1 bg-white/10 hover:bg-white/20 text-[10px] py-1.5 rounded transition-colors flex items-center justify-center">
              Send Alert
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};
