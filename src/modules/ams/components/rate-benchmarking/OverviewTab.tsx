import React from 'react';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  DollarSign, BarChart2, ArrowUpRight,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { BenchmarkSummary, LaneMarketStats } from '../../services/rateBenchmarkTypes';

const PIE_COLORS = {
  'Below Market': '#22C55E',
  'At Market': '#3B82F6',
  'Above Market': '#EF4444',
  'No Data': '#D1D5DB',
};

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function TrendBadge({ trend, delta }: { trend: 'Rising' | 'Falling' | 'Stable'; delta: number }) {
  if (trend === 'Rising') {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
        <TrendingUp size={12} /> +{delta}%
      </span>
    );
  }
  if (trend === 'Falling') {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
        <TrendingDown size={12} /> {delta}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-gray-500 text-xs font-medium">
      <Minus size={12} /> Stable
    </span>
  );
}

function BenchmarkBadge({ status }: { status: LaneMarketStats['benchmarkStatus'] }) {
  const cls = {
    'Below Market': 'bg-green-100 text-green-700',
    'At Market': 'bg-blue-100 text-blue-700',
    'Above Market': 'bg-red-100 text-red-700',
    'No Data': 'bg-gray-100 text-gray-500',
  }[status];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>
  );
}

function SavingsBadge({ opp }: { opp: LaneMarketStats['savingsOpportunity'] }) {
  const cls = {
    High: 'bg-red-50 text-red-700 border border-red-200',
    Medium: 'bg-amber-50 text-amber-700 border border-amber-200',
    Low: 'bg-yellow-50 text-yellow-600 border border-yellow-200',
    None: 'bg-gray-50 text-gray-400 border border-gray-200',
  }[opp];
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{opp}</span>
  );
}

export function OverviewTab({ summary }: { summary: BenchmarkSummary }) {
  const pieData = [
    { name: 'Below Market', value: summary.lanesBelowMarket },
    { name: 'At Market', value: summary.lanesAtMarket },
    { name: 'Above Market', value: summary.lanesAboveMarket },
    { name: 'No Data', value: summary.lanesNoData },
  ].filter(d => d.value > 0);

  const overallSign = summary.weightedAvgContractVsMarket >= 0 ? '+' : '';
  const overallColor =
    summary.weightedAvgContractVsMarket > 5
      ? 'text-red-600'
      : summary.weightedAvgContractVsMarket < -5
      ? 'text-green-600'
      : 'text-blue-600';

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={16} className="text-blue-500" />
            <span className="text-xs text-gray-500 font-medium">Lanes Analyzed</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{summary.totalLanesAnalyzed}</div>
          <div className="mt-1 text-xs text-gray-400">{summary.lanesNoData} with no data</div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight size={16} className="text-red-500" />
            <span className="text-xs text-gray-500 font-medium">Your Rate vs Market</span>
          </div>
          <div className={`text-2xl font-bold ${overallColor}`}>
            {overallSign}{summary.weightedAvgContractVsMarket}%
          </div>
          <div className="mt-1 text-xs text-gray-400">weighted avg across lanes</div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-amber-500" />
            <span className="text-xs text-gray-500 font-medium">Savings Opportunity</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {fmt(summary.totalPotentialSavingsINR)}
          </div>
          <div className="mt-1 text-xs text-gray-400">
            across {summary.lanesAboveMarket} overpaying lanes
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-purple-500" />
            <span className="text-xs text-gray-500 font-medium">Market Trend</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendBadge trend={summary.marketTrendOverall} delta={summary.marketTrendDeltaPct} />
          </div>
          <div className="mt-1 text-xs text-gray-400">
            {summary.marketTrendOverall === 'Rising'
              ? 'Rates trending up — negotiate now'
              : summary.marketTrendOverall === 'Falling'
              ? 'Market softening — good time to renegotiate'
              : 'Market rates are stable'}
          </div>
        </div>
      </div>

      {/* Market Position Donut + Lane Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Market Position by Lane Count</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map(entry => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || '#D1D5DB'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, name: string) => [`${v} lanes`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {pieData.map(entry => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || '#D1D5DB' }}
                  />
                  <span className="text-gray-600 flex-1">{entry.name}</span>
                  <span className="font-semibold text-gray-900">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status summary table */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Lane Status Summary</h3>
          <div className="space-y-3">
            {[
              {
                label: 'Below Market',
                count: summary.lanesBelowMarket,
                color: 'bg-green-500',
                note: 'Good rates — protect these in renewals',
              },
              {
                label: 'At Market',
                count: summary.lanesAtMarket,
                color: 'bg-blue-500',
                note: 'Competitively priced',
              },
              {
                label: 'Above Market',
                count: summary.lanesAboveMarket,
                color: 'bg-red-500',
                note: 'Overpaying — savings opportunity',
              },
            ].map(row => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                    <span className="text-gray-700">{row.label}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{row.count}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-0.5">
                  <div
                    className={`h-full ${row.color} rounded-full`}
                    style={{
                      width: `${summary.totalLanesAnalyzed > 0
                        ? Math.round((row.count / summary.totalLanesAnalyzed) * 100)
                        : 0}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-gray-400">{row.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Savings Opportunities */}
      {summary.topSavingsLanes.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b">
            <DollarSign size={16} className="text-amber-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Top Savings Opportunities</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {['Lane', 'Contract Rate', 'Market Median', 'Gap', 'Savings Potential', 'Opportunity'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {summary.topSavingsLanes.map(lane => (
                <tr key={lane.laneId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{lane.laneName}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {lane.contractRate ? fmt(lane.contractRate) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {lane.marketP50 ? fmt(lane.marketP50) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {lane.contractVsMarket !== undefined ? (
                      <span className="text-red-600 font-medium">+{lane.contractVsMarket}%</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {lane.potentialSavingsINR ? fmt(lane.potentialSavingsINR) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <SavingsBadge opp={lane.savingsOpportunity} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Risk Lanes */}
      {summary.riskLanes.length > 0 && (
        <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-red-100 bg-red-50">
            <AlertTriangle size={16} className="text-red-500" />
            <h3 className="font-semibold text-red-800 text-sm">
              Risk Lanes — Above Market &amp; Rising
            </h3>
            <span className="ml-auto text-xs text-red-500">
              Rates increasing while already above market
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {['Lane', 'Contract Rate', 'vs Market', 'Market Trend', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {summary.riskLanes.map(lane => (
                <tr key={lane.laneId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{lane.laneName}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {lane.contractRate ? fmt(lane.contractRate) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {lane.contractVsMarket !== undefined ? (
                      <span className="text-red-600 font-semibold">+{lane.contractVsMarket}%</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <TrendBadge trend={lane.marketTrend} delta={lane.trendDeltaPct} />
                  </td>
                  <td className="px-4 py-3">
                    <BenchmarkBadge status={lane.benchmarkStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {summary.topSavingsLanes.length === 0 && summary.riskLanes.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
          <div className="text-sm">No auction or contract data available yet.</div>
          <div className="text-xs mt-1">Complete auctions and add contracts to see benchmarking insights.</div>
        </div>
      )}
    </div>
  );
}
