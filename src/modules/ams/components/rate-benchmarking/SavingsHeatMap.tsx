import React, { useState, useMemo } from 'react';
import { Info } from 'lucide-react';
import type { LaneMarketStats } from '../../services/rateBenchmarkTypes';

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const STATUS_CELL_COLOR: Record<string, string> = {
  'Below Market': 'bg-green-100 hover:bg-green-200 border-green-200',
  'At Market': 'bg-blue-50 hover:bg-blue-100 border-blue-200',
  'Above Market': 'bg-red-100 hover:bg-red-200 border-red-200',
  'No Data': 'bg-gray-50 hover:bg-gray-100 border-gray-200',
};

const STATUS_TEXT_COLOR: Record<string, string> = {
  'Below Market': 'text-green-800',
  'At Market': 'text-blue-800',
  'Above Market': 'text-red-800',
  'No Data': 'text-gray-400',
};

export function SavingsHeatMap({
  lanes,
  onLaneSelect,
}: {
  lanes: LaneMarketStats[];
  onLaneSelect?: (laneId: string) => void;
}) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const { origins, destinations, matrix } = useMemo(() => {
    const originSet = new Set<string>();
    const destSet = new Set<string>();
    const laneMap: Record<string, LaneMarketStats> = {};

    lanes.forEach(l => {
      if (l.origin && l.destination) {
        originSet.add(l.origin);
        destSet.add(l.destination);
        const cellKey = `${l.origin}|${l.destination}`;
        // If multiple vehicle types, keep the one with highest savings
        if (!laneMap[cellKey] || (l.potentialSavingsINR || 0) > (laneMap[cellKey].potentialSavingsINR || 0)) {
          laneMap[cellKey] = l;
        }
      }
    });

    const origins = Array.from(originSet).sort();
    const destinations = Array.from(destSet).sort();
    return { origins, destinations, matrix: laneMap };
  }, [lanes]);

  if (origins.length === 0) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-8 text-center text-gray-400 text-sm">
        No lane data available to render the heat map.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Info size={13} className="text-gray-400" />
            <span className="text-gray-500">Click any cell to view the rate trend for that lane</span>
          </div>
          <div className="flex gap-3 ml-auto">
            {[
              { label: 'Below Market', color: 'bg-green-100 border border-green-200' },
              { label: 'At Market', color: 'bg-blue-50 border border-blue-200' },
              { label: 'Above Market', color: 'bg-red-100 border border-red-200' },
              { label: 'No Data', color: 'bg-gray-50 border border-gray-200' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded ${item.color}`} />
                <span className="text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heat Map Grid */}
      <div className="bg-white rounded-xl border shadow-sm overflow-auto">
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">
            Rate Benchmark Heat Map — Origin vs Destination
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="border-collapse">
              <thead>
                <tr>
                  {/* Corner cell */}
                  <th className="text-xs text-gray-400 p-2 text-right font-normal min-w-[80px]">
                    Origin ↓ / Dest →
                  </th>
                  {destinations.map(dest => (
                    <th
                      key={dest}
                      className="text-xs font-semibold text-gray-600 p-2 text-center min-w-[90px]"
                    >
                      {dest}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {origins.map(origin => (
                  <tr key={origin}>
                    <td className="text-xs font-semibold text-gray-600 p-2 text-right whitespace-nowrap">
                      {origin}
                    </td>
                    {destinations.map(dest => {
                      if (origin === dest) {
                        return (
                          <td key={dest} className="p-1">
                            <div className="w-full h-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-300">—</span>
                            </div>
                          </td>
                        );
                      }
                      const cellKey = `${origin}|${dest}`;
                      const lane = matrix[cellKey];

                      if (!lane) {
                        return (
                          <td key={dest} className="p-1">
                            <div className="w-full h-14 bg-gray-50 rounded border border-gray-100 flex items-center justify-center">
                              <span className="text-xs text-gray-300">—</span>
                            </div>
                          </td>
                        );
                      }

                      const colorCls = STATUS_CELL_COLOR[lane.benchmarkStatus];
                      const textCls = STATUS_TEXT_COLOR[lane.benchmarkStatus];
                      const isHovered = hoveredCell === lane.laneId;

                      return (
                        <td key={dest} className="p-1">
                          <div
                            className={`w-full h-14 rounded border cursor-pointer transition-colors ${colorCls} ${
                              isHovered ? 'ring-2 ring-offset-1 ring-blue-400' : ''
                            }`}
                            onMouseEnter={() => setHoveredCell(lane.laneId)}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={() => onLaneSelect?.(lane.laneId)}
                            title={`${lane.laneName}\n${lane.benchmarkStatus}\n${
                              lane.contractVsMarket !== undefined
                                ? `${lane.contractVsMarket > 0 ? '+' : ''}${lane.contractVsMarket}% vs market`
                                : ''
                            }`}
                          >
                            <div className={`p-1.5 h-full flex flex-col justify-between ${textCls}`}>
                              <div className="text-xs font-medium leading-tight">
                                {lane.potentialSavingsINR
                                  ? fmt(lane.potentialSavingsINR)
                                  : lane.benchmarkStatus === 'At Market'
                                  ? '✓ OK'
                                  : lane.benchmarkStatus === 'Below Market'
                                  ? '↓ Good'
                                  : 'No data'}
                              </div>
                              {lane.contractVsMarket !== undefined && (
                                <div className="text-xs opacity-70">
                                  {lane.contractVsMarket > 0 ? '+' : ''}
                                  {lane.contractVsMarket}%
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary bar below grid */}
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs text-gray-500">
            <span>
              <span className="font-semibold text-red-600">{lanes.filter(l => l.benchmarkStatus === 'Above Market').length}</span> lanes above market
            </span>
            <span>
              <span className="font-semibold text-blue-600">{lanes.filter(l => l.benchmarkStatus === 'At Market').length}</span> lanes at market
            </span>
            <span>
              <span className="font-semibold text-green-600">{lanes.filter(l => l.benchmarkStatus === 'Below Market').length}</span> lanes below market
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
