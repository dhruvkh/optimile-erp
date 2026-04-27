import React, { useMemo, useState } from 'react';
import {
  BarChart2, TrendingUp, Map, Truck, Fuel, RefreshCw,
} from 'lucide-react';
import { computeRateBenchmarks } from '../../services/rateBenchmarkService';
import type { BenchmarkSummary, LaneMarketStats, MarketTrend } from '../../services/rateBenchmarkTypes';
import { OverviewTab } from '../rate-benchmarking/OverviewTab';
import { LaneBenchmarkTable } from '../rate-benchmarking/LaneBenchmarkTable';
import { LaneRateTrendChart } from '../rate-benchmarking/LaneRateTrendChart';
import { CarrierBenchmarkTable } from '../rate-benchmarking/CarrierBenchmarkTable';
import { FSCBenchmarkPanel } from '../rate-benchmarking/FSCBenchmarkPanel';
import { SavingsHeatMap } from '../rate-benchmarking/SavingsHeatMap';

type Tab = 'overview' | 'lanes' | 'trends' | 'carriers' | 'fsc' | 'heatmap';
type ModeFilter = 'All' | 'FTL' | 'PTL';

const TABS: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'lanes', label: 'Lane Analysis', icon: TrendingUp },
  { id: 'trends', label: 'Rate Trends', icon: TrendingUp },
  { id: 'carriers', label: 'Carriers', icon: Truck },
  { id: 'fsc', label: 'Fuel Surcharge', icon: Fuel },
  { id: 'heatmap', label: 'Savings Map', icon: Map },
];

const MODE_FILTERS: Array<{ id: ModeFilter; label: string }> = [
  { id: 'All', label: 'All Modes' },
  { id: 'FTL', label: 'FTL' },
  { id: 'PTL', label: 'PTL' },
];

/** Recompute a BenchmarkSummary from a filtered lane list. */
function buildSummaryFromLanes(lanes: LaneMarketStats[], baseGeneratedAt: number): BenchmarkSummary {
  const withStatus = lanes.filter(l => l.benchmarkStatus !== 'No Data');
  const lanesWithContract = withStatus.filter(l => l.contractVsMarket !== undefined);
  const weightedAvgContractVsMarket =
    lanesWithContract.length > 0
      ? Math.round(
          (lanesWithContract.reduce((s, l) => s + (l.contractVsMarket || 0), 0) /
            lanesWithContract.length) * 10,
        ) / 10
      : 0;

  const trendVotes = { Rising: 0, Falling: 0, Stable: 0 };
  lanes.forEach(l => { trendVotes[l.marketTrend]++; });
  const marketTrendOverall: MarketTrend =
    trendVotes.Rising > trendVotes.Falling && trendVotes.Rising > trendVotes.Stable
      ? 'Rising'
      : trendVotes.Falling > trendVotes.Stable
      ? 'Falling'
      : 'Stable';
  const marketTrendDeltaPct =
    lanes.length > 0
      ? Math.round((lanes.reduce((s, l) => s + l.trendDeltaPct, 0) / lanes.length) * 10) / 10
      : 0;

  return {
    generatedAt: baseGeneratedAt,
    totalLanesAnalyzed: lanes.length,
    lanesBelowMarket: withStatus.filter(l => l.benchmarkStatus === 'Below Market').length,
    lanesAtMarket: withStatus.filter(l => l.benchmarkStatus === 'At Market').length,
    lanesAboveMarket: withStatus.filter(l => l.benchmarkStatus === 'Above Market').length,
    lanesNoData: lanes.filter(l => l.benchmarkStatus === 'No Data').length,
    totalPotentialSavingsINR: lanes.reduce((s, l) => s + (l.potentialSavingsINR || 0), 0),
    weightedAvgContractVsMarket,
    topSavingsLanes: lanes
      .filter(l => l.savingsOpportunity !== 'None' && l.potentialSavingsINR)
      .sort((a, b) => (b.potentialSavingsINR || 0) - (a.potentialSavingsINR || 0))
      .slice(0, 5),
    riskLanes: lanes
      .filter(l => l.benchmarkStatus === 'Above Market' && l.marketTrend === 'Rising')
      .slice(0, 5),
    marketTrendOverall,
    marketTrendDeltaPct,
  };
}

export function RateBenchmarkingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [modeFilter, setModeFilter] = useState<ModeFilter>('All');
  const [refreshKey, setRefreshKey] = useState(0);
  const [drillLaneId, setDrillLaneId] = useState<string | undefined>(undefined);

  const data = useMemo(() => {
    void refreshKey;
    return computeRateBenchmarks();
  }, [refreshKey]);

  // Filter lanes by selected mode; carriers filtered to match
  const filteredLanes = useMemo(() => {
    if (modeFilter === 'All') return data.lanes;
    return data.lanes.filter(l => l.rateType === modeFilter);
  }, [data.lanes, modeFilter]);

  const filteredCarriers = useMemo(() => {
    if (modeFilter === 'All') return data.carriers;
    if (modeFilter === 'FTL') return data.carriers.filter(c => c.vendorType === 'FTL Vendor');
    return data.carriers.filter(c => c.vendorType !== 'FTL Vendor');
  }, [data.carriers, modeFilter]);

  const filteredSummary = useMemo(
    () => buildSummaryFromLanes(filteredLanes, data.summary.generatedAt),
    [filteredLanes, data.summary.generatedAt],
  );

  function handleHeatMapLaneSelect(laneId: string) {
    setDrillLaneId(laneId);
    setActiveTab('trends');
  }

  const generatedAt = new Date(data.summary.generatedAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rate Benchmarking</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Compare your contracted freight rates against market data from auction bid history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Updated {generatedAt}</span>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 border border-blue-200 px-3 py-2 rounded-lg bg-white"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Mode Filter */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs text-gray-500 font-medium">Mode:</span>
        <div className="flex gap-1 bg-white border rounded-lg p-0.5 shadow-sm">
          {MODE_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setModeFilter(f.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                modeFilter === f.id
                  ? f.id === 'FTL'
                    ? 'bg-indigo-600 text-white'
                    : f.id === 'PTL'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800 text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {modeFilter !== 'All' && (
          <span className="text-xs text-gray-400">
            {filteredLanes.length} of {data.lanes.length} lanes
          </span>
        )}
      </div>

      {/* Summary KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-1">Lanes Analyzed</div>
          <div className="text-xl font-bold text-gray-900">{filteredSummary.totalLanesAnalyzed}</div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-1">Above Market</div>
          <div className="text-xl font-bold text-red-600">{filteredSummary.lanesAboveMarket}</div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-1">Below Market</div>
          <div className="text-xl font-bold text-green-600">{filteredSummary.lanesBelowMarket}</div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-1">Savings Opportunity</div>
          <div className="text-xl font-bold text-amber-600">
            ₹{(filteredSummary.totalPotentialSavingsINR / 100000).toFixed(1)}L
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-1">Overall vs Market</div>
          <div
            className={`text-xl font-bold ${
              filteredSummary.weightedAvgContractVsMarket > 5
                ? 'text-red-600'
                : filteredSummary.weightedAvgContractVsMarket < -5
                ? 'text-green-600'
                : 'text-blue-600'
            }`}
          >
            {filteredSummary.weightedAvgContractVsMarket > 0 ? '+' : ''}
            {filteredSummary.weightedAvgContractVsMarket}%
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white border rounded-xl p-1 w-fit shadow-sm">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab summary={filteredSummary} />}

      {activeTab === 'lanes' && <LaneBenchmarkTable lanes={filteredLanes} />}

      {activeTab === 'trends' && (
        <LaneRateTrendChart
          lanes={filteredLanes}
          trends={data.trends}
        />
      )}

      {activeTab === 'carriers' && <CarrierBenchmarkTable carriers={filteredCarriers} />}

      {activeTab === 'fsc' && <FSCBenchmarkPanel fsc={data.fsc} />}

      {activeTab === 'heatmap' && (
        <SavingsHeatMap lanes={filteredLanes} onLaneSelect={handleHeatMapLaneSelect} />
      )}
    </div>
  );
}
