import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { LaneMarketStats, LaneRateTrendPoint } from '../../services/rateBenchmarkTypes';

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

type WindowSize = '8w' | '12w' | '6m';

export function LaneRateTrendChart({
  lanes,
  trends,
}: {
  lanes: LaneMarketStats[];
  trends: Record<string, LaneRateTrendPoint[]>;
}) {
  const [selectedLaneId, setSelectedLaneId] = useState<string>('');
  const [window, setWindow] = useState<WindowSize>('12w');

  const lanesWithTrends = useMemo(
    () => lanes.filter(l => trends[l.laneId] && trends[l.laneId].length > 0),
    [lanes, trends],
  );

  const activeLaneId = selectedLaneId || lanesWithTrends[0]?.laneId || '';
  const activeLane = lanes.find(l => l.laneId === activeLaneId);

  const trendData = useMemo(() => {
    const raw = trends[activeLaneId] || [];
    const limit = window === '8w' ? 8 : window === '12w' ? 12 : 26;
    return raw.slice(-limit);
  }, [activeLaneId, trends, window]);

  const yMin = useMemo(() => {
    if (trendData.length === 0) return 0;
    const vals = trendData.flatMap(p => [p.marketP25, p.marketP75, p.contractRate || Infinity]).filter(isFinite);
    return Math.floor(Math.min(...vals) * 0.85);
  }, [trendData]);

  const yMax = useMemo(() => {
    if (trendData.length === 0) return 100000;
    const vals = trendData.flatMap(p => [p.marketP25, p.marketP75, p.contractRate || 0]);
    return Math.ceil(Math.max(...vals) * 1.1);
  }, [trendData]);

  if (lanesWithTrends.length === 0) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-8 text-center text-gray-400 text-sm">
        No trend data available yet. Complete more auctions to generate historical rate trends.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="text-xs text-gray-500 mr-2">Lane</label>
          <select
            value={activeLaneId}
            onChange={e => setSelectedLaneId(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            {lanesWithTrends.map(l => (
              <option key={l.laneId} value={l.laneId}>
                {l.laneName} ({l.vehicleType})
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-1 bg-white border rounded-lg p-0.5">
          {(['8w', '12w', '6m'] as WindowSize[]).map(w => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                window === w ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {w === '8w' ? '8 Weeks' : w === '12w' ? '12 Weeks' : '6 Months'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {activeLane?.laneName} — Market Rate Trend
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Shaded band = P25–P75 market range · Blue line = median · Dashed = your contract rate
            </p>
          </div>
          {activeLane && (
            <div className="flex gap-3 text-xs">
              <div className="text-right">
                <div className="text-gray-400">Contract</div>
                <div className="font-semibold text-gray-900">
                  {activeLane.contractRate ? fmt(activeLane.contractRate) : '—'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-400">Market P50</div>
                <div className="font-semibold text-gray-900">
                  {activeLane.marketP50 ? fmt(activeLane.marketP50) : '—'}
                </div>
              </div>
              {activeLane.contractVsMarket !== undefined && (
                <div className="text-right">
                  <div className="text-gray-400">vs Market</div>
                  <div
                    className={`font-semibold ${
                      activeLane.contractVsMarket > 5
                        ? 'text-red-600'
                        : activeLane.contractVsMarket < -5
                        ? 'text-green-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {activeLane.contractVsMarket > 0 ? '+' : ''}
                    {activeLane.contractVsMarket}%
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {trendData.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Not enough historical data for this lane.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="marketBandGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="weekLabel" tick={{ fontSize: 10 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`}
                domain={[yMin, yMax]}
              />
              <Tooltip
                formatter={(v: any, name: string) => [fmt(v as number), name]}
                labelStyle={{ fontWeight: 600, fontSize: 12 }}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />

              {/* Market P25–P75 band */}
              <Area
                type="monotone"
                dataKey="marketP75"
                name="Market P75"
                stroke="none"
                fill="url(#marketBandGradient)"
                legendType="none"
              />
              <Area
                type="monotone"
                dataKey="marketP25"
                name="Market P25–P75 band"
                stroke="none"
                fill="white"
                strokeWidth={0}
              />

              {/* Market median line */}
              <Line
                type="monotone"
                dataKey="marketAvg"
                name="Market Avg"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />

              {/* Contract rate — dashed */}
              <Line
                type="monotone"
                dataKey="contractRate"
                name="Your Contract Rate"
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
              />

              {/* Spot rate — dotted, if present */}
              <Line
                type="monotone"
                dataKey="spotRate"
                name="Spot Rate"
                stroke="#F59E0B"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend explanation */}
      <div className="flex flex-wrap gap-4 px-1 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-3 rounded bg-blue-100 border border-blue-200" />
          <span>Market P25–P75 range (competitive band)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-0.5 bg-blue-500" />
          <span>Market average bid price</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 border-t-2 border-dashed border-red-500" />
          <span>Your contract rate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 border-t-2 border-dotted border-amber-500" />
          <span>Spot rate</span>
        </div>
      </div>
    </div>
  );
}
