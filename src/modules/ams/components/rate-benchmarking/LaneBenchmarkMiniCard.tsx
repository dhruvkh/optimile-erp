import React, { useMemo } from 'react';
import { BarChart2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { computeRateBenchmarks } from '../../services/rateBenchmarkService';

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/**
 * Small embedded widget that shows the market benchmark for a given lane.
 * Designed to be dropped into RateManagement.tsx below the Market Intelligence widget.
 */
export function LaneBenchmarkMiniCard({
  origin,
  destination,
  vehicleType = 'FTL',
}: {
  origin: string;
  destination: string;
  vehicleType?: string;
}) {
  const navigate = useNavigate();

  const lane = useMemo(() => {
    if (!origin || !destination) return null;
    const data = computeRateBenchmarks();
    // Fuzzy-find the matching lane
    return (
      data.lanes.find(l =>
        l.origin.toLowerCase().startsWith(origin.toLowerCase().split(' ')[0]) &&
        l.destination.toLowerCase().startsWith(destination.toLowerCase().split(' ')[0]),
      ) || null
    );
  }, [origin, destination, vehicleType]);

  if (!lane) {
    return (
      <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-4 text-center">
        <div className="text-xs text-gray-400">No benchmark data for this lane yet</div>
      </div>
    );
  }

  const statusColor = {
    'Below Market': 'bg-green-50 border-green-200',
    'At Market': 'bg-blue-50 border-blue-200',
    'Above Market': 'bg-red-50 border-red-200',
    'No Data': 'bg-gray-50 border-gray-200',
  }[lane.benchmarkStatus];

  const badgeColor = {
    'Below Market': 'bg-green-100 text-green-700',
    'At Market': 'bg-blue-100 text-blue-700',
    'Above Market': 'bg-red-100 text-red-700',
    'No Data': 'bg-gray-100 text-gray-500',
  }[lane.benchmarkStatus];

  return (
    <div className={`rounded-xl border p-4 ${statusColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart2 size={14} className="text-gray-500" />
          <span className="text-xs font-semibold text-gray-700">Market Benchmark</span>
        </div>
        <button
          onClick={() => navigate('/ams/analytics/rate-benchmarking')}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
        >
          Full Report <ExternalLink size={10} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center mb-3">
        <div>
          <div className="text-xs text-gray-500 mb-0.5">Market P25</div>
          <div className="text-sm font-semibold text-gray-900">
            {lane.marketP25 ? fmt(lane.marketP25) : '—'}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-0.5">Median</div>
          <div className="text-sm font-bold text-blue-700">
            {lane.marketP50 ? fmt(lane.marketP50) : '—'}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-0.5">Market P75</div>
          <div className="text-sm font-semibold text-gray-900">
            {lane.marketP75 ? fmt(lane.marketP75) : '—'}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
            {lane.benchmarkStatus}
          </span>
          {lane.contractPercentile !== undefined && (
            <span className="text-xs text-gray-500">
              You are at P{lane.contractPercentile}
            </span>
          )}
        </div>
        {lane.contractVsMarket !== undefined && (
          <span
            className={`text-xs font-semibold ${
              lane.contractVsMarket > 5
                ? 'text-red-600'
                : lane.contractVsMarket < -5
                ? 'text-green-600'
                : 'text-blue-600'
            }`}
          >
            {lane.contractVsMarket > 0 ? '+' : ''}
            {lane.contractVsMarket}% vs market
          </span>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-400 text-center">
        Based on {lane.dataPointCount} market bids
      </div>
    </div>
  );
}
