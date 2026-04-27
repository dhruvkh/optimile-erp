import React, { useState, useMemo } from 'react';
import { Download, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Search } from 'lucide-react';
import type { LaneMarketStats } from '../../services/rateBenchmarkTypes';

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = [
    headers.join(','),
    ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(',')),
  ];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function BenchmarkBadge({ status }: { status: LaneMarketStats['benchmarkStatus'] }) {
  const cls = {
    'Below Market': 'bg-green-100 text-green-700',
    'At Market': 'bg-blue-100 text-blue-700',
    'Above Market': 'bg-red-100 text-red-700',
    'No Data': 'bg-gray-100 text-gray-400',
  }[status];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>
  );
}

function PercentileBadge({ pct }: { pct?: number }) {
  if (pct === undefined) return <span className="text-gray-400 text-xs">—</span>;
  const color = pct >= 75 ? 'bg-red-100 text-red-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>P{pct}</span>;
}

function MarketRangeBar({ p25, p50, p75, contractRate }: { p25: number; p50: number; p75: number; contractRate?: number }) {
  if (!p25 || !p75) return <span className="text-gray-400 text-xs">—</span>;
  const rangeWidth = p75 - p25;
  const contractPos = contractRate
    ? Math.min(100, Math.max(0, ((contractRate - p25) / Math.max(1, rangeWidth)) * 100))
    : null;

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <span className="text-xs text-gray-500 w-10 text-right">{fmt(p25)}</span>
      <div className="flex-1 h-2 bg-blue-100 rounded-full relative">
        {/* Median marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-blue-500"
          style={{ left: `${Math.min(100, ((p50 - p25) / Math.max(1, rangeWidth)) * 100)}%` }}
        />
        {/* Contract rate marker */}
        {contractPos !== null && (
          <div
            className="absolute -top-1 w-2 h-4 rounded-sm"
            style={{
              left: `${contractPos}%`,
              background: contractPos > 70 ? '#EF4444' : contractPos < 30 ? '#22C55E' : '#F59E0B',
            }}
          />
        )}
      </div>
      <span className="text-xs text-gray-500 w-10">{fmt(p75)}</span>
    </div>
  );
}

function TrendIcon({ trend }: { trend: LaneMarketStats['marketTrend'] }) {
  if (trend === 'Rising') return <TrendingUp size={14} className="text-red-500" />;
  if (trend === 'Falling') return <TrendingDown size={14} className="text-green-500" />;
  return <Minus size={14} className="text-gray-400" />;
}

type SortKey = 'laneName' | 'contractRate' | 'marketP50' | 'contractVsMarket' | 'potentialSavingsINR';

export function LaneBenchmarkTable({ lanes }: { lanes: LaneMarketStats[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortKey, setSortKey] = useState<SortKey>('contractVsMarket');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return lanes
      .filter(l => {
        const matchSearch =
          !search ||
          l.laneName.toLowerCase().includes(search.toLowerCase()) ||
          l.origin.toLowerCase().includes(search.toLowerCase()) ||
          l.destination.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'All' || l.benchmarkStatus === statusFilter;
        return matchSearch && matchStatus;
      })
      .slice()
      .sort((a, b) => {
        const av = (a[sortKey] as number | undefined) ?? -Infinity;
        const bv = (b[sortKey] as number | undefined) ?? -Infinity;
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'desc' ? bv - av : av - bv;
        }
        return 0;
      });
  }, [lanes, search, statusFilter, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function SortHeader({ col, label }: { col: SortKey; label: string }) {
    return (
      <th
        className="text-left text-xs font-semibold text-gray-500 px-4 py-3 cursor-pointer hover:text-gray-700 select-none whitespace-nowrap"
        onClick={() => handleSort(col)}
      >
        <span className="flex items-center gap-1">
          {label}
          {sortKey === col ? (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />) : null}
        </span>
      </th>
    );
  }

  const csvData = filtered.map(l => ({
    Lane: l.laneName,
    'Vehicle Type': l.vehicleType,
    'Contract Rate': l.contractRate ?? '',
    'Market P25': l.marketP25,
    'Market Median': l.marketP50,
    'Market P75': l.marketP75,
    'Contract Percentile': l.contractPercentile ?? '',
    'vs Market %': l.contractVsMarket ?? '',
    'Benchmark Status': l.benchmarkStatus,
    'Savings Opportunity': l.savingsOpportunity,
    'Potential Savings INR': l.potentialSavingsINR ?? '',
    'Market Trend': l.marketTrend,
  }));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search lane or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 w-56"
          />
        </div>
        <div className="flex gap-1 bg-white border rounded-lg p-0.5">
          {['All', 'Below Market', 'At Market', 'Above Market', 'No Data'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-gray-400">{filtered.length} lanes</div>
        <button
          onClick={() => exportCSV(csvData as unknown as Record<string, unknown>[], 'rate-benchmark-lanes')}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg"
        >
          <Download size={12} /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 w-8" />
                <SortHeader col="laneName" label="Lane" />
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Market Range (P25–P75)</th>
                <SortHeader col="contractRate" label="Contract Rate" />
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Your Percentile</th>
                <SortHeader col="contractVsMarket" label="vs Market %" />
                <SortHeader col="potentialSavingsINR" label="Savings Potential" />
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                    No lanes match the current filters.
                  </td>
                </tr>
              )}
              {filtered.map(lane => (
                <React.Fragment key={lane.laneId}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpanded(expanded === lane.laneId ? null : lane.laneId)}
                  >
                    <td className="px-4 py-3 text-gray-400">
                      {expanded === lane.laneId ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{lane.laneName}</div>
                      <div className="text-xs text-gray-400">{lane.vehicleType} · {lane.dataPointCount} bids</div>
                    </td>
                    <td className="px-4 py-3">
                      <MarketRangeBar
                        p25={lane.marketP25}
                        p50={lane.marketP50}
                        p75={lane.marketP75}
                        contractRate={lane.contractRate}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {lane.contractRate ? fmt(lane.contractRate) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <PercentileBadge pct={lane.contractPercentile} />
                    </td>
                    <td className="px-4 py-3">
                      {lane.contractVsMarket !== undefined ? (
                        <span
                          className={`font-semibold text-sm ${
                            lane.contractVsMarket > 5
                              ? 'text-red-600'
                              : lane.contractVsMarket < -5
                              ? 'text-green-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {lane.contractVsMarket > 0 ? '+' : ''}
                          {lane.contractVsMarket}%
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {lane.potentialSavingsINR ? fmt(lane.potentialSavingsINR) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <BenchmarkBadge status={lane.benchmarkStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <TrendIcon trend={lane.marketTrend} />
                        <span className="text-xs text-gray-500">
                          {lane.trendDeltaPct !== 0
                            ? `${lane.trendDeltaPct > 0 ? '+' : ''}${lane.trendDeltaPct}%`
                            : 'Stable'}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded details row */}
                  {expanded === lane.laneId && (
                    <tr className="bg-blue-50 border-t border-blue-100">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Market P10 (Floor)</div>
                            <div className="font-semibold text-gray-900">{lane.marketP10 ? fmt(lane.marketP10) : '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Market Median (P50)</div>
                            <div className="font-semibold text-gray-900">{lane.marketP50 ? fmt(lane.marketP50) : '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Market P90 (Ceiling)</div>
                            <div className="font-semibold text-gray-900">{lane.marketP90 ? fmt(lane.marketP90) : '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Market Avg</div>
                            <div className="font-semibold text-gray-900">{lane.marketAvg ? fmt(lane.marketAvg) : '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Auction Derived Rate</div>
                            <div className="font-semibold text-gray-900">
                              {lane.auctionDerivedRate ? fmt(lane.auctionDerivedRate) : '—'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Actual Avg Paid</div>
                            <div className="font-semibold text-gray-900">
                              {lane.actualAvgPaid ? fmt(lane.actualAvgPaid) : '—'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Spot Rate Avg</div>
                            <div className="font-semibold text-gray-900">
                              {lane.spotRateAvg ? fmt(lane.spotRateAvg) : '—'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Data Points</div>
                            <div className="font-semibold text-gray-900">{lane.dataPointCount} bids</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
