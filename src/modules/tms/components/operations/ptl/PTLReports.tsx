import React, { useMemo } from 'react';
import { Card } from '../../ui/Card';
import {
    BarChart3, TrendingUp, Clock, AlertTriangle, CheckCircle,
    Package, Building2, Truck, IndianRupee, ArrowRight
} from 'lucide-react';

interface PTLReportsProps {
    dockets: {
        status: string;
        pickupCity: string;
        deliveryCity: string;
        chargeableWeight: number;
        totalCharges: number;
        originHub: string;
        destinationHub: string;
        pickupDate: string;
        deliveryDate: string;
    }[];
}

export const PTLReports: React.FC<PTLReportsProps> = ({ dockets }) => {
    const stats = useMemo(() => {
        const statusCounts: Record<string, number> = {};
        const hubInbound: Record<string, number> = {};
        const hubOutbound: Record<string, number> = {};
        const laneCounts: Record<string, { count: number; weight: number; revenue: number }> = {};
        let totalRevenue = 0;
        let totalWeight = 0;
        let delivered = 0;
        let onTime = 0;

        dockets.forEach(d => {
            statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
            hubOutbound[d.originHub] = (hubOutbound[d.originHub] || 0) + 1;
            hubInbound[d.destinationHub] = (hubInbound[d.destinationHub] || 0) + 1;
            totalRevenue += d.totalCharges;
            totalWeight += d.chargeableWeight;

            const lane = `${d.originHub} → ${d.destinationHub}`;
            if (!laneCounts[lane]) laneCounts[lane] = { count: 0, weight: 0, revenue: 0 };
            laneCounts[lane].count++;
            laneCounts[lane].weight += d.chargeableWeight;
            laneCounts[lane].revenue += d.totalCharges;

            if (d.status === 'Delivered') {
                delivered++;
                if (new Date(d.deliveryDate) >= new Date(d.pickupDate)) onTime++;
            }
        });

        return { statusCounts, hubInbound, hubOutbound, laneCounts, totalRevenue, totalWeight, delivered, onTime };
    }, [dockets]);

    const statusColors: Record<string, string> = {
        'Created': '#9ca3af', 'Pickup Scheduled': '#eab308', 'At Origin Hub': '#f97316',
        'In Transit': '#3b82f6', 'At Destination Hub': '#6366f1',
        'Out for Delivery': '#a855f7', 'Delivered': '#10b981', 'Failed Delivery': '#ef4444',
    };

    const maxStatus = Math.max(...Object.values(stats.statusCounts), 1);
    const maxLane = Math.max(...Object.values(stats.laneCounts).map(v => v.count), 1);
    const slaPercent = stats.delivered > 0 ? Math.round((stats.onTime / stats.delivered) * 100) : 100;

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center border-l-4 border-l-green-500">
                    <p className="text-2xl font-bold text-green-600">₹{(stats.totalRevenue / 1000).toFixed(0)}K</p>
                    <p className="text-[10px] text-gray-500 uppercase">Total Revenue</p>
                </Card>
                <Card className="p-4 text-center border-l-4 border-l-blue-500">
                    <p className="text-2xl font-bold text-blue-600">{dockets.length}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Total Dockets</p>
                </Card>
                <Card className="p-4 text-center border-l-4 border-l-orange-500">
                    <p className="text-2xl font-bold text-orange-600">{(stats.totalWeight / 1000).toFixed(1)}T</p>
                    <p className="text-[10px] text-gray-500 uppercase">Total Weight</p>
                </Card>
                <Card className={`p-4 text-center border-l-4 ${slaPercent >= 90 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                    <p className={`text-2xl font-bold ${slaPercent >= 90 ? 'text-emerald-600' : 'text-red-600'}`}>{slaPercent}%</p>
                    <p className="text-[10px] text-gray-500 uppercase">SLA Compliance</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dockets by Status */}
                <Card className="p-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-500" /> Dockets by Status
                    </h4>
                    <div className="space-y-2">
                        {Object.entries(stats.statusCounts).map(([status, count]) => (
                            <div key={status} className="flex items-center gap-3">
                                <span className="text-xs text-gray-600 w-32 truncate">{status}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                                    <div className="h-5 rounded-full transition-all flex items-center justify-end pr-2"
                                        style={{ width: `${Math.max((count / maxStatus) * 100, 15)}%`, backgroundColor: statusColors[status] || '#9ca3af' }}>
                                        <span className="text-[10px] text-white font-bold">{count}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Hub Throughput */}
                <Card className="p-4">
                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-orange-500" /> Hub Throughput
                    </h4>
                    <div className="space-y-3">
                        {Object.keys({ ...stats.hubOutbound, ...stats.hubInbound }).filter(Boolean).map(hub => (
                            <div key={hub} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                <span className="text-xs font-medium text-gray-700">{hub}</span>
                                <div className="flex gap-4">
                                    <span className="text-xs text-orange-600">↑ {stats.hubOutbound[hub] || 0} out</span>
                                    <span className="text-xs text-blue-600">↓ {stats.hubInbound[hub] || 0} in</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Lane Performance */}
                <Card className="p-4 md:col-span-2">
                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" /> Lane Performance
                    </h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-gray-500 uppercase border-b">
                                    <th className="text-left py-2 px-3">Lane</th>
                                    <th className="text-right py-2 px-3">Dockets</th>
                                    <th className="text-right py-2 px-3">Weight</th>
                                    <th className="text-right py-2 px-3">Revenue</th>
                                    <th className="text-right py-2 px-3">Avg/Docket</th>
                                    <th className="py-2 px-3 w-32">Volume</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(stats.laneCounts).sort((a, b) => b[1].count - a[1].count).map(([lane, data]) => (
                                    <tr key={lane} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-2 px-3 font-medium text-gray-700">{lane}</td>
                                        <td className="py-2 px-3 text-right">{data.count}</td>
                                        <td className="py-2 px-3 text-right text-gray-500">{data.weight} kg</td>
                                        <td className="py-2 px-3 text-right text-green-600 font-medium">₹{data.revenue.toLocaleString()}</td>
                                        <td className="py-2 px-3 text-right text-gray-500">₹{Math.round(data.revenue / data.count).toLocaleString()}</td>
                                        <td className="py-2 px-3">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${(data.count / maxLane) * 100}%` }} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};
