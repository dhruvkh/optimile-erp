import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { IndianRupee, TrendingUp, ShieldCheck, MapPin, Calculator, Calendar, ArrowRight } from 'lucide-react';
// removed useToast
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RATE_HISTORY_DATA = [
    { date: 'Jan 1', rate: 42000 },
    { date: 'Jan 8', rate: 43500 },
    { date: 'Jan 15', rate: 41000 },
    { date: 'Jan 22', rate: 44000 },
    { date: 'Jan 29', rate: 46000 },
    { date: 'Feb 5', rate: 45000 },
];

export const RateManagement: React.FC = () => {
    const [calculator, setCalculator] = useState({
        base: 38000,
        loading: 1500,
        unloading: 1500,
        toll: 2800,
        fuel: 2200,
        other: 0
    });

    const total = Object.values(calculator).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Contracts & Rate List */}
                <div className="lg:col-span-1 space-y-6">
                    <Card title="Contract Rates">
                        <div className="mb-4">
                            <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 px-3 border">
                                <option>Acme Corporation</option>
                                <option>TechStart Logistics</option>
                                <option>Global Foods Inc</option>
                            </select>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-green-800 uppercase tracking-wide">Active Contract</span>
                                <ShieldCheck className="h-4 w-4 text-green-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">CNT-2024-001</p>
                            <p className="text-xs text-gray-500">Valid until Dec 31, 2024</p>
                        </div>

                        <div className="space-y-3">
                            {[
                                { route: 'Mumbai → Delhi', type: '20 Ton', rate: '₹ 45,000' },
                                { route: 'Mumbai → Pune', type: '10 Ton', rate: '₹ 12,000' },
                                { route: 'Bangalore → Chennai', type: '20 Ton', rate: '₹ 22,000' }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{item.route}</p>
                                        <p className="text-xs text-gray-500">{item.type}</p>
                                    </div>
                                    <span className="font-bold text-primary text-sm">{item.rate}</span>
                                </div>
                            ))}
                        </div>

                        <Button variant="outline" className="w-full mt-4 text-xs" onClick={() => window.alert('Loading PDF of active contract rates.')}>View Full Contract</Button>
                    </Card>

                    {/* Market Intelligence Widget */}
                    <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-lg">Market Intelligence</h3>
                                <p className="text-indigo-100 text-sm">Route: Mumbai → Delhi</p>
                            </div>
                            <TrendingUp className="h-6 w-6 text-indigo-200" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white/10 rounded p-2 backdrop-blur-sm">
                                <p className="text-xs text-indigo-100">Market Avg</p>
                                <p className="font-bold text-lg">₹ 46,200</p>
                            </div>
                            <div className="bg-white/10 rounded p-2 backdrop-blur-sm">
                                <p className="text-xs text-indigo-100">Your Avg</p>
                                <p className="font-bold text-lg text-green-300">₹ 44,500</p>
                            </div>
                        </div>

                        <div className="text-xs text-indigo-100 bg-black/20 p-2 rounded">
                            <span className="font-bold">Tip:</span> Consider increasing rates by 2% next week due to high demand forecast.
                        </div>
                    </Card>
                </div>

                {/* Right: Spot Rate History & Calculator */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Rate History Chart */}
                    <Card title="Spot Rate Trends">
                        <div className="flex flex-wrap gap-4 mb-4">
                            <div className="w-40">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Origin</label>
                                <div className="relative">
                                    <MapPin className="absolute left-2 top-2 h-3.5 w-3.5 text-gray-400" />
                                    <select className="pl-7 w-full border border-gray-300 rounded text-sm py-1">
                                        <option>Mumbai</option>
                                    </select>
                                </div>
                            </div>
                            <div className="w-40">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Destination</label>
                                <div className="relative">
                                    <MapPin className="absolute left-2 top-2 h-3.5 w-3.5 text-gray-400" />
                                    <select className="pl-7 w-full border border-gray-300 rounded text-sm py-1">
                                        <option>Delhi</option>
                                    </select>
                                </div>
                            </div>
                            <div className="w-40">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Period</label>
                                <div className="relative">
                                    <Calendar className="absolute left-2 top-2 h-3.5 w-3.5 text-gray-400" />
                                    <select className="pl-7 w-full border border-gray-300 rounded text-sm py-1">
                                        <option>Last 30 Days</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={RATE_HISTORY_DATA}>
                                    <defs>
                                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1F4E78" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#1F4E78" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Area type="monotone" dataKey="rate" stroke="#1F4E78" fillOpacity={1} fill="url(#colorRate)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Calculator */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card title="Rate Calculator" className="h-full">
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start text-xs text-blue-800 mb-2">
                                    <Calculator className="h-4 w-4 mr-2 flex-shrink-0" />
                                    AI suggests a base rate of ₹38,000 - ₹40,000 for this route/vehicle.
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Base Rate" type="number" value={calculator.base} onChange={e => setCalculator({ ...calculator, base: Number(e.target.value) })} />
                                    <Input label="Loading" type="number" value={calculator.loading} onChange={e => setCalculator({ ...calculator, loading: Number(e.target.value) })} />
                                    <Input label="Unloading" type="number" value={calculator.unloading} onChange={e => setCalculator({ ...calculator, unloading: Number(e.target.value) })} />
                                    <Input label="Toll" type="number" value={calculator.toll} onChange={e => setCalculator({ ...calculator, toll: Number(e.target.value) })} />
                                    <Input label="Fuel Surcharge" type="number" value={calculator.fuel} onChange={e => setCalculator({ ...calculator, fuel: Number(e.target.value) })} />
                                    <Input label="Other" type="number" value={calculator.other} onChange={e => setCalculator({ ...calculator, other: Number(e.target.value) })} />
                                </div>

                                <div className="pt-4 mt-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="font-bold text-gray-700">Total Calculated Rate</span>
                                        <span className="text-xl font-bold text-primary">₹ {total.toLocaleString()}</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button className="flex-1" onClick={() => window.alert(`Total rate of ₹${total.toLocaleString()} applied to booking.`)}>Apply to Booking</Button>
                                        <Button variant="outline" className="flex-1" onClick={() => window.alert('New custom template saved for future use.')}>Save Template</Button>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Recent Transactions (Visual Mock) */}
                        <Card title="Recent Transactions" className="h-full">
                            <div className="space-y-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex justify-between items-center text-sm p-2 border-b border-gray-50 last:border-0">
                                        <div>
                                            <p className="font-medium text-gray-900">TechStart Ltd</p>
                                            <p className="text-xs text-gray-500">20T • 2 days ago</p>
                                        </div>
                                        <span className="font-medium text-gray-700">₹ {44000 + (i * 500)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-2 text-center">
                                <button className="text-xs text-primary font-medium hover:underline flex items-center justify-center w-full" onClick={() => window.alert('Opening full historical ledger.')}>
                                    View All Transactions <ArrowRight className="h-3 w-3 ml-1" />
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};
