import React from 'react';
import { NetworkMap } from './NetworkMap';
import { PendingShipments } from './PendingShipments';
import { LineHaul3DLoad } from './LineHaul3DLoad';
import { CrossDockPanel } from './CrossDockPanel';
import { MilePlanner } from './MilePlanner';
import { HubCapacity } from './HubCapacity';
import { Button } from '../../ui/Button';
import { ArrowLeft, RefreshCw, Settings, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LTLDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
         <div className="flex items-center">
            <button onClick={() => navigate('/operations')} className="mr-3 p-1 hover:bg-slate-100 rounded-full text-slate-500">
               <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
               <h1 className="text-xl font-bold text-slate-900">LTL Consolidation Center</h1>
               <p className="text-xs text-slate-500">Hub & Spoke Network • Load Planning • Cross-Docking</p>
            </div>
         </div>
         <div className="flex space-x-2">
            <Button size="sm" variant="outline"><RefreshCw className="h-4 w-4 mr-2" /> Refresh Data</Button>
            <Button size="sm" variant="outline"><Calendar className="h-4 w-4 mr-2" /> Schedule</Button>
            <Button size="sm" variant="outline"><Settings className="h-4 w-4" /></Button>
         </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-180px)] min-h-[800px]">
         
         {/* Left Column: Intake & First Mile */}
         <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
            <div className="flex-1 min-h-[300px]">
               <PendingShipments />
            </div>
            <div className="h-[300px]">
               <MilePlanner />
            </div>
         </div>

         {/* Center Column: Network & Line Haul */}
         <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
            <div className="flex-none">
               <NetworkMap />
            </div>
            <div className="flex-1 min-h-[400px]">
               <LineHaul3DLoad />
            </div>
         </div>

         {/* Right Column: Hub Ops */}
         <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
            <div className="flex-1">
               <CrossDockPanel />
            </div>
            <div className="h-[300px]">
               <HubCapacity />
            </div>
         </div>

      </div>
    </div>
  );
};
