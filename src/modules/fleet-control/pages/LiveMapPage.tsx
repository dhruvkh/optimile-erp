import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleLiveStatus, DerivedVehicleStatus } from '../types';
import { VehicleAPI, TelematicsAPI } from '../services/mockDatabase';
import { IconTruck, IconSearch, IconX, IconClock, IconMap, IconAlert } from '../components/Icons';
import { Badge } from '../components/UI';

export const LiveMapPage: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [statuses, setStatuses] = useState<Record<string, VehicleLiveStatus | null>>({});
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const vData = await VehicleAPI.getAll();
            setVehicles(vData);
            
            const statusMap: Record<string, VehicleLiveStatus | null> = {};
            await Promise.all(vData.map(async v => {
                statusMap[v.vehicle_id] = await TelematicsAPI.getVehicleStatus(v.vehicle_id);
            }));
            setStatuses(statusMap);
            setIsLoading(false);
        };
        loadData();
    }, []);

    const getStatusColor = (status: DerivedVehicleStatus) => {
        switch(status) {
            case DerivedVehicleStatus.MOVING: return 'bg-green-500';
            case DerivedVehicleStatus.IDLE: return 'bg-yellow-500';
            case DerivedVehicleStatus.LONG_IDLE: return 'bg-orange-500';
            case DerivedVehicleStatus.OFFLINE: return 'bg-gray-400';
            case DerivedVehicleStatus.MAINTENANCE: return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    const activeVehicle = selectedVehicle ? vehicles.find(v => v.vehicle_id === selectedVehicle) : null;
    const activeStatus = selectedVehicle ? statuses[selectedVehicle] : null;

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
            {/* Map Placeholder Layer */}
            <div className="absolute inset-0 z-0 bg-blue-50" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
                {/* Mock Vehicle Markers */}
                {vehicles.map((v, i) => {
                    const status = statuses[v.vehicle_id];
                    // Create fake random positions for visualization if no lat/lng
                    const top = status?.last_location ? `${(status.last_location.lat - 18) * 40}%` : `${20 + (i * 15)}%`;
                    const left = status?.last_location ? `${(status.last_location.lng - 72) * 40}%` : `${20 + (i * 20)}%`;
                    
                    return (
                        <button 
                            key={v.vehicle_id}
                            onClick={() => setSelectedVehicle(v.vehicle_id)}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110 z-10`}
                            style={{ top, left }}
                        >
                            <div className={`relative w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${getStatusColor(status?.current_status || DerivedVehicleStatus.OFFLINE)}`}>
                                <IconTruck className="w-4 h-4 text-white" />
                                {status?.document_compliance === 'Non-Compliant' && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border border-white"></div>
                                )}
                            </div>
                            <div className="mt-1 px-2 py-0.5 bg-white/90 backdrop-blur rounded text-[10px] font-bold shadow-sm whitespace-nowrap">
                                {v.registration_number}
                            </div>
                        </button>
                    );
                })}
                
                <div className="absolute bottom-6 left-6 bg-white p-3 rounded-lg shadow-lg z-10 text-xs space-y-2">
                    <div className="font-semibold text-gray-700 mb-1">Fleet Status</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span> Moving</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span> Idle</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span> Long Idle</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-gray-400 mr-2"></span> Offline</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> Maintenance</div>
                </div>
            </div>

            {/* Sidebar Details Panel */}
            <div className={`absolute top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 z-20 ${selectedVehicle ? 'translate-x-0' : 'translate-x-full'}`}>
                {activeVehicle && (
                    <div className="h-full flex flex-col">
                        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-start">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{activeVehicle.registration_number}</h2>
                                <p className="text-sm text-gray-500">{activeVehicle.vehicle_type}</p>
                            </div>
                            <button onClick={() => setSelectedVehicle(null)} className="text-gray-400 hover:text-gray-600">
                                <IconX className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-6">
                            {/* Live Status */}
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Live Status</h3>
                                <div className="flex items-center justify-between mb-2">
                                    <Badge color={activeStatus?.current_status === DerivedVehicleStatus.MOVING ? 'green' : 'gray'}>
                                        {activeStatus?.current_status || 'Offline'}
                                    </Badge>
                                    <span className="text-sm font-mono">{activeStatus?.current_speed || 0} km/h</span>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center">
                                    <IconClock className="w-3 h-3 mr-1" />
                                    Last Updated: {new Date(activeStatus?.last_updated || '').toLocaleTimeString()}
                                </div>
                            </div>

                             {/* Location */}
                             <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Location</h3>
                                <div className="flex items-start">
                                    <IconMap className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                                    <p className="text-sm text-gray-700 break-words">
                                        {activeStatus?.last_location ? `${activeStatus.last_location.lat.toFixed(4)}, ${activeStatus.last_location.lng.toFixed(4)}` : 'Location unavailable'}
                                        <br/>
                                        <span className="text-xs text-gray-400">Near Mumbai-Pune Highway (Simulated)</span>
                                    </p>
                                </div>
                            </div>

                             {/* Compliance */}
                             <div className={`p-3 rounded-lg border ${activeStatus?.document_compliance === 'Compliant' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${activeStatus?.document_compliance === 'Compliant' ? 'text-green-800' : 'text-red-800'}`}>Compliance</h3>
                                <div className="flex items-center">
                                    {activeStatus?.document_compliance !== 'Compliant' && <IconAlert className="w-4 h-4 text-red-500 mr-2" />}
                                    <span className={`text-sm font-medium ${activeStatus?.document_compliance === 'Compliant' ? 'text-green-700' : 'text-red-700'}`}>
                                        {activeStatus?.document_compliance || 'Unknown'}
                                    </span>
                                </div>
                             </div>

                             {/* Actions */}
                             <div className="pt-4 border-t border-gray-200">
                                <button className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                    View Full History
                                </button>
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
