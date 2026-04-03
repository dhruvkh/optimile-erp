import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { FSCBenchmark } from '../../services/rateBenchmarkTypes';

function BenchmarkBadge({ status }: { status: FSCBenchmark['fscStatus'] }) {
  const cls = {
    'Below Market': 'bg-green-100 text-green-700',
    'At Market': 'bg-blue-100 text-blue-700',
    'Above Market': 'bg-red-100 text-red-700',
    'No Data': 'bg-gray-100 text-gray-400',
  }[status];
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}

function FSCRangeBar({ value, p25, p75 }: { value: number; p25: number; p75: number }) {
  const rangeWidth = Math.max(0.1, p75 - p25);
  const pct = Math.min(120, Math.max(0, ((value - p25) / rangeWidth) * 100));
  const color = pct > 100 ? '#EF4444' : pct > 60 ? '#F59E0B' : '#22C55E';
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-8">{p25}%</span>
      <div className="flex-1 h-3 bg-blue-50 rounded-full relative border border-blue-100">
        {/* Range band */}
        <div className="absolute inset-0 rounded-full bg-blue-100" />
        {/* Your value marker */}
        <div
          className="absolute top-0 w-1 h-full rounded-full"
          style={{ left: `${Math.min(95, pct)}%`, background: color }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8">{p75}%</span>
      <span className="text-sm font-semibold ml-1" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

export function FSCBenchmarkPanel({ fsc }: { fsc: FSCBenchmark }) {
  const isOverMarket = fsc.fscStatus === 'Above Market';

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="text-xs text-gray-500 mb-2">Your Platform Avg FSC</div>
          <div className="text-3xl font-bold text-gray-900">{fsc.yourAvgFSCPercent}%</div>
          <div className="mt-2">
            <BenchmarkBadge status={fsc.fscStatus} />
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {fsc.fscVsMarketPct > 0 ? '+' : ''}{fsc.fscVsMarketPct}% vs market average
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="text-xs text-gray-500 mb-2">Market FSC Range</div>
          <div className="text-2xl font-bold text-gray-900">
            {fsc.marketP25FSC}% – {fsc.marketP75FSC}%
          </div>
          <div className="mt-2 text-xs text-gray-400">P25–P75 competitive band</div>
          <div className="text-xs text-gray-500 mt-1">
            Market avg: <span className="font-medium">{fsc.marketAvgFSC}%</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="text-xs text-gray-500 mb-2">Diesel Price Reference</div>
          <div className="flex items-end gap-2">
            <div className="text-2xl font-bold text-gray-900">₹{fsc.baseDieselPrice}/L</div>
            <div className="text-sm text-gray-500 mb-0.5">your base</div>
          </div>
          <div className="mt-1 text-xs text-gray-400">
            Market ref: ₹{fsc.baseDieselMarket}/L
          </div>
          {Math.abs(fsc.baseDieselPrice - fsc.baseDieselMarket) > 5 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
              <Info size={11} />
              Consider updating your diesel base price
            </div>
          )}
        </div>
      </div>

      {/* FSC visual range */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">
          Your FSC vs Market Band
        </h3>
        <FSCRangeBar
          value={fsc.yourAvgFSCPercent}
          p25={fsc.marketP25FSC}
          p75={fsc.marketP75FSC}
        />
        <div className="mt-3 text-xs text-gray-500">
          The bar shows the P25–P75 market FSC band. Your marker should ideally be within this range.
        </div>
      </div>

      {/* Recommendation callout */}
      {isOverMarket && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex gap-3">
          <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-red-800 text-sm">FSC Renegotiation Recommended</div>
            <div className="text-xs text-red-700 mt-1">
              Your average fuel surcharge of {fsc.yourAvgFSCPercent}% is{' '}
              {fsc.fscVsMarketPct}% above the market average of {fsc.marketAvgFSC}%.
              Consider renegotiating FSC clauses with clients or aligning your FSC % to the{' '}
              {fsc.marketP25FSC}%–{fsc.marketP75FSC}% market band during contract renewals.
            </div>
          </div>
        </div>
      )}

      {!isOverMarket && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex gap-3">
          <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-green-800 text-sm">FSC is Competitively Priced</div>
            <div className="text-xs text-green-700 mt-1">
              Your average FSC of {fsc.yourAvgFSCPercent}% is within or below the market range of{' '}
              {fsc.marketP25FSC}%–{fsc.marketP75FSC}%. Maintain these rates during contract renewals.
            </div>
          </div>
        </div>
      )}

      {/* Per-client breakdown */}
      {fsc.clientFSCBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-900 text-sm">FSC by Client Rate Card</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {['Client', 'FSC %', 'vs Market Avg', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {fsc.clientFSCBreakdown.map(row => (
                <tr key={row.clientId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.clientName}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{row.fscPercent}%</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium ${
                        row.vsMarket > 5
                          ? 'text-red-600'
                          : row.vsMarket < -5
                          ? 'text-green-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {row.vsMarket > 0 ? '+' : ''}{row.vsMarket}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.status === 'Above Market'
                          ? 'bg-red-100 text-red-700'
                          : row.status === 'Below Market'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {row.status === 'Above Market'
                      ? 'Consider reducing at next renewal'
                      : row.status === 'Below Market'
                      ? 'Protect this rate'
                      : 'No action needed'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
