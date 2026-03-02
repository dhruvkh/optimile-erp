
import React from 'react';
import { Card } from '../../ui/Card';
import { Box, Layers, Maximize, Printer, AlertTriangle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useToast } from '../../../../../shared/context/ToastContext';

export const LoadPlanner: React.FC = () => {
  const { showToast } = useToast();
  return (
    <Card className="p-0 overflow-hidden border border-gray-200">
        <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
            <h3 className="font-bold flex items-center text-sm">
                <Box className="h-4 w-4 mr-2 text-blue-400" /> FTL Load Plan
            </h3>
            <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span> Heavy</span>
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Medium</span>
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span> Fragile</span>
            </div>
        </div>

        <div className="p-4 bg-slate-50">
            {/* Fake 3D / Isometric View using CSS */}
            <div className="relative h-48 w-full bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden perspective-1000 group cursor-pointer">
                
                {/* Truck Floor Outline */}
                <div className="absolute bottom-4 w-[90%] h-12 bg-gray-200 transform skew-x-12 border border-gray-300"></div>
                <div className="absolute bottom-16 w-[90%] h-32 border-l-2 border-r-2 border-t-2 border-dashed border-gray-300 transform skew-x-12"></div>

                {/* Cargo Boxes (Simplified Visuals) */}
                <div className="absolute bottom-8 left-10 w-16 h-16 bg-blue-600 shadow-lg border border-blue-700 flex items-center justify-center text-white text-[10px] font-bold z-10">P1</div>
                <div className="absolute bottom-8 left-28 w-16 h-16 bg-blue-600 shadow-lg border border-blue-700 flex items-center justify-center text-white text-[10px] font-bold z-10">P2</div>
                <div className="absolute bottom-8 left-46 w-16 h-16 bg-blue-600 shadow-lg border border-blue-700 flex items-center justify-center text-white text-[10px] font-bold z-10">P3</div>
                
                <div className="absolute bottom-24 left-10 w-16 h-16 bg-green-500 shadow-lg border border-green-600 flex items-center justify-center text-white text-[10px] font-bold z-20">M1</div>
                <div className="absolute bottom-24 left-28 w-16 h-16 bg-green-500 shadow-lg border border-green-600 flex items-center justify-center text-white text-[10px] font-bold z-20">M2</div>

                <div className="absolute bottom-8 right-12 w-12 h-12 bg-yellow-400 shadow-lg border border-yellow-500 flex items-center justify-center text-yellow-900 text-[10px] font-bold z-10">F1</div>
                <div className="absolute bottom-20 right-12 w-12 h-12 bg-yellow-400 shadow-lg border border-yellow-500 flex items-center justify-center text-yellow-900 text-[10px] font-bold z-20">F2</div>

                {/* Interactive Overlay */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" variant="secondary" className="shadow-lg" onClick={() => showToast({ type: 'info', title: 'Interactive 3D View', message: 'Interactive load planning coming in the next release.' })}>
                        <Maximize className="h-4 w-4 mr-2" /> Interactive 3D View
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Weight Util</p>
                    <div className="flex items-end justify-between">
                        <span className="text-lg font-bold text-gray-900">85%</span>
                        <span className="text-xs text-gray-400">8.5 / 10T</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Volume Util</p>
                    <div className="flex items-end justify-between">
                        <span className="text-lg font-bold text-gray-900">80%</span>
                        <span className="text-xs text-gray-400">28 / 35 m³</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                        <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Floor Space</p>
                    <div className="flex items-end justify-between">
                        <span className="text-lg font-bold text-green-600">88%</span>
                        <span className="text-xs text-gray-400">Optimal</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '88%' }}></div>
                    </div>
                </div>
            </div>

            {/* Config & Actions */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <div className="flex items-center text-xs text-gray-600">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" /> Balanced Weight Distribution
                </div>
                <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="text-xs h-8">
                        <Printer className="h-3 w-3 mr-1" /> Export Plan
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => showToast({ type: 'info', title: 'Load Planner', message: 'Interactive load planning coming in the next release.' })}>
                        Modify
                    </Button>
                </div>
            </div>
        </div>
    </Card>
  );
};

const CheckCircleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
);
