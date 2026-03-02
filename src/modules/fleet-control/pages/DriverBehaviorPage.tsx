import React, { useState, useEffect } from 'react';
import { DriverBehaviorEvent, BehaviorSeverity, BehaviorEventType } from '../types';
import { BehaviorAPI, DriverAPI, VehicleAPI } from '../services/mockDatabase';
import { IconAlert, IconUsers, IconTruck, IconZap, IconTrendDown, IconShield } from '../components/Icons';
import { Badge } from '../components/UI';

export const DriverBehaviorPage: React.FC = () => {
    const [events, setEvents] = useState<DriverBehaviorEvent[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const [e, d, v] = await Promise.all([
                BehaviorAPI.getEvents(),
                DriverAPI.getAll(),
                VehicleAPI.getAll()
            ]);
            setEvents(e);
            setDrivers(d);
            setVehicles(v);
            setIsLoading(false);
        };
        load();
    }, []);

    const getDriverName = (id: string) => drivers.find(d => d.driver_id === id)?.name || id;
    const getVehicleReg = (id: string) => vehicles.find(v => v.vehicle_id === id)?.registration_number || id;

    const getSeverityColor = (s: BehaviorSeverity) => {
        switch(s) {
            case BehaviorSeverity.HIGH: return 'bg-red-100 text-red-800 border-red-200';
            case BehaviorSeverity.MEDIUM: return 'bg-orange-100 text-orange-800 border-orange-200';
            case BehaviorSeverity.LOW: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    // Calculate Fleet Safety Score (Simplified Mock Logic)
    const calculateSafetyScore = () => {
        if (events.length === 0) return 100;
        const totalPenalty = events.reduce((sum, e) => {
            if (e.severity === BehaviorSeverity.HIGH) return sum + 10;
            if (e.severity === BehaviorSeverity.MEDIUM) return sum + 5;
            return sum + 2;
        }, 0);
        return Math.max(0, 100 - (totalPenalty / Math.max(1, events.length)) * 5); // Normalized simple formula
    };

    const safetyScore = Math.round(calculateSafetyScore());
    const highSeverityCount = events.filter(e => e.severity === BehaviorSeverity.HIGH).length;
    const topViolation = events.length > 0 
        ? Object.entries(events.reduce((acc: any, curr) => {
            acc[curr.event_type] = (acc[curr.event_type] || 0) + 1;
            return acc;
        }, {})).sort((a: any, b: any) => b[1] - a[1])[0][0]
        : 'None';

    if (isLoading) return <div className="p-12 text-center text-gray-500">Loading Behavior Telemetry...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Driver Behavior Intelligence</h1>
                    <p className="text-sm text-gray-500 mt-1">Real-time driving pattern analysis from Telematics & OBD.</p>
                </div>
            </div>

            {/* Scorecard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center">
                    <div className={`p-4 rounded-full mr-4 ${safetyScore > 80 ? 'bg-green-100 text-green-600' : safetyScore > 60 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                        <IconShield className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-500 uppercase">Fleet Safety Score</div>
                        <div className="text-3xl font-bold text-gray-900">{safetyScore}/100</div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Total Events (24h)</div>
                    <div className="text-3xl font-bold text-gray-900">{events.length}</div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Critical Violations</div>
                    <div className={`text-3xl font-bold ${highSeverityCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{highSeverityCount}</div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Top Violation Type</div>
                    <div className="text-lg font-bold text-gray-900 truncate" title={topViolation}>{topViolation}</div>
                </div>
            </div>

            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <IconZap className="w-5 h-5 mr-2 text-yellow-500" />
                Live Violation Feed
            </h2>

            <div className="grid grid-cols-1 gap-4">
                {events.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed">
                        No behavior events recorded recently.
                    </div>
                ) : (
                    events.map(event => (
                        <div key={event.event_id} className={`bg-white rounded-lg shadow-sm border p-4 flex items-start transition-all hover:shadow-md ${event.severity === BehaviorSeverity.HIGH ? 'border-l-4 border-l-red-500' : 'border-gray-200'}`}>
                            <div className={`p-3 rounded-full mr-4 flex-shrink-0 ${event.severity === BehaviorSeverity.HIGH ? 'bg-red-50' : event.severity === BehaviorSeverity.MEDIUM ? 'bg-orange-50' : 'bg-blue-50'}`}>
                                <IconZap className={`w-6 h-6 ${event.severity === BehaviorSeverity.HIGH ? 'text-red-500' : event.severity === BehaviorSeverity.MEDIUM ? 'text-orange-500' : 'text-blue-500'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-base font-bold text-gray-900">{event.event_type}</h3>
                                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase border ${getSeverityColor(event.severity)}`}>
                                        {event.severity}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{event.details}</p>
                                
                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center bg-gray-100 px-2 py-1 rounded">
                                        <IconUsers className="w-3 h-3 mr-1 text-gray-400" />
                                        <span className="font-medium text-gray-700">{getDriverName(event.driver_id)}</span>
                                    </div>
                                    <div className="flex items-center bg-gray-100 px-2 py-1 rounded">
                                        <IconTruck className="w-3 h-3 mr-1 text-gray-400" />
                                        <span className="font-medium text-gray-700">{getVehicleReg(event.vehicle_id)}</span>
                                    </div>
                                    <div className="flex items-center ml-auto">
                                        <IconTrendDown className="w-3 h-3 mr-1" />
                                        {new Date(event.event_timestamp).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};