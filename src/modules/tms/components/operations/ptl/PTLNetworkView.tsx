import React from 'react';
import { Building2, ArrowRight, Truck, Package, AlertTriangle } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Hub } from '../../settings/HubMaster';

interface PTLNetworkViewProps {
    hubs: Hub[];
    docketCountByHub: Record<string, number>;
    activeTrips: { origin: string; destination: string; docketCount: number; status: string }[];
}

export const PTLNetworkView: React.FC<PTLNetworkViewProps> = ({ hubs, docketCountByHub, activeTrips }) => {
    const activeHubs = hubs.filter(h => h.status === 'Active');

    return (
        <Card className="p-0 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
            <div className="p-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <Building2 className="w-4 h-4 text-orange-400" /> Hub Network Overview
                </h3>

                {/* Hub Status Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    {activeHubs.map(hub => {
                        const count = docketCountByHub[hub.city] || 0;
                        const util = hub.currentUtilization || 0;
                        return (
                            <div key={hub.id} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 hover:border-orange-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-xs font-bold text-white">{hub.city}</p>
                                        <p className="text-[10px] text-slate-400">{hub.hubCode}</p>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${util > 80 ? 'bg-red-500 animate-pulse' : util > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                        }`} />
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-lg font-bold text-orange-400">{count}</p>
                                        <p className="text-[9px] text-slate-500 uppercase">Dockets</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xs font-bold ${util > 80 ? 'text-red-400' : util > 50 ? 'text-yellow-400' : 'text-green-400'}`}>{util}%</p>
                                        <p className="text-[9px] text-slate-500">Capacity</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Active Lane-Haul Trips */}
                {activeTrips.length > 0 && (
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Active Line-Haul Lanes</p>
                        <div className="space-y-1.5">
                            {activeTrips.map((trip, i) => (
                                <div key={i} className="flex items-center justify-between bg-slate-800/40 border border-slate-700/50 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <Truck className="w-3 h-3 text-blue-400" />
                                        <span className="text-xs text-white font-medium">{trip.origin}</span>
                                        <ArrowRight className="w-3 h-3 text-slate-500" />
                                        <span className="text-xs text-white font-medium">{trip.destination}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-400">{trip.docketCount} dockets</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${trip.status === 'In Transit' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
                                            }`}>{trip.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTrips.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-2">No active line-haul trips</p>
                )}
            </div>
        </Card>
    );
};
