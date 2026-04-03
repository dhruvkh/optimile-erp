import React, { useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Label,
} from 'recharts';
import type { CarrierRateBenchmark } from '../../services/rateBenchmarkTypes';

const CATEGORY_COLORS = {
  'Very Competitive': '#22C55E',
  Competitive: '#84CC16',
  'At Market': '#3B82F6',
  Expensive: '#F59E0B',
  'Very Expensive': '#EF4444',
};

const CATEGORY_BADGE: Record<string, string> = {
  'Very Competitive': 'bg-green-100 text-green-700',
  Competitive: 'bg-lime-100 text-lime-700',
  'At Market': 'bg-blue-100 text-blue-700',
  Expensive: 'bg-amber-100 text-amber-700',
  'Very Expensive': 'bg-red-100 text-red-700',
};

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function CarrierBenchmarkTable({ carriers }: { carriers: CarrierRateBenchmark[] }) {
  const scatterData = useMemo(
    () =>
      carriers
        .filter(c => c.onTimePercent !== undefined)
        .map(c => ({
          name: c.carrierName.split(' ').slice(0, 2).join(' '),
          otp: c.onTimePercent || 0,
          rateVsMarket: c.avgRateVsMarket,
          carrierId: c.carrierId,
          category: c.pricingCategory,
        })),
    [carriers],
  );

  return (
    <div className="space-y-6">
      {/* Scatter Chart: OTP% vs Rate-vs-Market */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-1">
          Carrier Pricing Matrix — Cost vs Reliability
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          X-axis: On-Time % (higher = more reliable). Y-axis: Rate vs Market % (lower = cheaper).
          Bottom-right quadrant = Best Value.
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="otp"
              name="On-Time %"
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 10 }}
            >
              <Label value="On-Time %" position="insideBottom" offset={-10} fontSize={11} />
            </XAxis>
            <YAxis
              dataKey="rateVsMarket"
              name="Rate vs Market %"
              type="number"
              tick={{ fontSize: 10 }}
              tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`}
            >
              <Label value="Rate vs Market %" angle={-90} position="insideLeft" offset={10} fontSize={11} />
            </YAxis>
            {/* Quadrant dividers */}
            <ReferenceLine x={85} stroke="#D1D5DB" strokeDasharray="4 2" />
            <ReferenceLine y={0} stroke="#D1D5DB" strokeDasharray="4 2" />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border rounded-lg p-2.5 text-xs shadow-lg">
                    <div className="font-semibold text-gray-900 mb-1">{d.name}</div>
                    <div className="text-gray-600">OTP: {d.otp}%</div>
                    <div className="text-gray-600">
                      vs Market: {d.rateVsMarket > 0 ? '+' : ''}{d.rateVsMarket}%
                    </div>
                    <div
                      className={`mt-1 font-medium ${
                        CATEGORY_COLORS[d.category as keyof typeof CATEGORY_COLORS]
                          ? ''
                          : 'text-gray-700'
                      }`}
                    >
                      {d.category}
                    </div>
                  </div>
                );
              }}
            />
            <Scatter
              data={scatterData}
              fill="#3B82F6"
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const color =
                  CATEGORY_COLORS[payload.category as keyof typeof CATEGORY_COLORS] || '#3B82F6';
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={8} fill={color} fillOpacity={0.85} />
                    <text
                      x={cx}
                      y={cy + 18}
                      textAnchor="middle"
                      fontSize={9}
                      fill="#6B7280"
                    >
                      {payload.name}
                    </text>
                  </g>
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
        {/* Quadrant labels */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          <div className="text-right pr-4 text-red-400">Expensive &amp; Reliable (avoid if possible)</div>
          <div className="pl-4 text-green-600 font-medium">Best Value (cheap &amp; reliable)</div>
          <div className="text-right pr-4 text-red-600 font-medium">Expensive &amp; Unreliable (replace)</div>
          <div className="pl-4 text-amber-500">Cheap but risky (monitor closely)</div>
        </div>
      </div>

      {/* Carrier Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900 text-sm">Carrier Rate Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {[
                  'Carrier',
                  'Type',
                  'Avg Rate vs Market',
                  'Rate Range',
                  'Avg FSC %',
                  'FSC vs Market',
                  'OTP %',
                  'Score',
                  'Pricing',
                  'Recommendation',
                ].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {carriers.map(c => (
                <tr key={c.carrierId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.carrierName}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.vendorType}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${
                        c.avgRateVsMarket > 8
                          ? 'text-red-600'
                          : c.avgRateVsMarket < -5
                          ? 'text-green-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {c.avgRateVsMarket > 0 ? '+' : ''}
                      {c.avgRateVsMarket}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {c.avgContractRate > 0 ? (
                      <>
                        {fmt(c.lowestLaneRate)} – {fmt(c.highestLaneRate)}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{c.avgFSCPercent.toFixed(1)}%</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium ${
                        c.fscVsMarket > 10
                          ? 'text-red-600'
                          : c.fscVsMarket < -5
                          ? 'text-green-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {c.fscVsMarket > 0 ? '+' : ''}
                      {c.fscVsMarket}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium ${
                        (c.onTimePercent || 0) >= 85 ? 'text-green-600' : 'text-amber-600'
                      }`}
                    >
                      {c.onTimePercent !== undefined ? `${c.onTimePercent}%` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {c.performanceScore !== undefined ? c.performanceScore.toFixed(0) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        CATEGORY_BADGE[c.pricingCategory] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {c.pricingCategory}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">{c.recommendation}</td>
                </tr>
              ))}
              {carriers.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-gray-400 text-sm">
                    No carrier data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
