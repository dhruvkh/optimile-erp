import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Award, AlertCircle } from 'lucide-react';
import { dataMigrationService } from '../../services/dataMigration';

interface VendorScorecard {
  vendorId: string;
  vendorName: string;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C';
  score: number;
  metrics: {
    otp: number; // On-Time Performance %
    acceptanceRate: number;
    completionRate: number;
    rateAdherence: number;
    communication: number;
    claims: number;
  };
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  changePercent: number;
  auctionsWon: number;
  totalAuctions: number;
}

// Mock data generator
function generateMockScorecards(): VendorScorecard[] {
  const historical = dataMigrationService.getHistoricalPerformance();
  if (historical.length > 0) {
    const grouped = new Map<string, typeof historical>();
    historical.forEach((r) => {
      const k = r.vendorIdOrName;
      const arr = grouped.get(k) || [];
      arr.push(r);
      grouped.set(k, arr);
    });
    return Array.from(grouped.entries()).map(([vendorKey, rows], idx) => {
      const avg = (selector: (row: typeof rows[number]) => number) => rows.reduce((a, r) => a + selector(r), 0) / Math.max(1, rows.length);
      const score = avg((r) => r.performanceScore);
      const winRate = avg((r) => r.winRate);
      const otp = avg((r) => r.onTimeDeliveryPct);
      const acceptance = avg((r) => r.reliabilityRating);
      const completion = Math.min(100, avg((r) => (r.auctionsParticipated > 0 ? (r.lanesWon / r.auctionsParticipated) * 100 : 0)));
      const rateAdherence = Math.max(0, 100 - avg((r) => r.avgDiscountGiven));
      const communication = Math.max(40, score - 10);
      const claims = avg((r) => r.issuesCount * 6);
      const trendDelta = rows.length > 1 ? (rows[rows.length - 1].performanceScore - rows[0].performanceScore) : 0;
      return {
        vendorId: `H-${String(idx + 1).padStart(3, '0')}`,
        vendorName: vendorKey,
        grade: score >= 95 ? 'A+' : score >= 85 ? 'A' : score >= 75 ? 'B+' : score >= 65 ? 'B' : 'C',
        score: Math.round(score * 10) / 10,
        metrics: {
          otp,
          acceptanceRate: acceptance,
          completionRate: completion,
          rateAdherence,
          communication,
          claims,
        },
        trend: trendDelta > 2 ? 'IMPROVING' : trendDelta < -2 ? 'DECLINING' : 'STABLE',
        changePercent: trendDelta,
        auctionsWon: Math.round(avg((r) => r.lanesWon)),
        totalAuctions: Math.round(avg((r) => r.auctionsParticipated)),
      };
    });
  }

  const vendors = [
    'Swift Logistics',
    'Elite Transport',
    'Highway Express',
    'Roadway Kings',
    'Express Freight',
    'Premium Movers',
  ];

  return vendors.map((name, idx) => {
    const score = Math.random() * 40 + 60;
    return {
      vendorId: `V-${String(idx + 1).padStart(3, '0')}`,
      vendorName: name,
      grade: score >= 95 ? 'A+' : score >= 85 ? 'A' : score >= 75 ? 'B+' : score >= 65 ? 'B' : 'C',
      score: Math.round(score * 10) / 10,
      metrics: {
        otp: Math.random() * 40 + 60,
        acceptanceRate: Math.random() * 40 + 60,
        completionRate: Math.random() * 40 + 60,
        rateAdherence: Math.random() * 40 + 60,
        communication: Math.random() * 40 + 60,
        claims: Math.random() * 100,
      },
      trend: ['IMPROVING', 'DECLINING', 'STABLE'][Math.floor(Math.random() * 3)] as any,
      changePercent: (Math.random() - 0.5) * 20,
      auctionsWon: Math.floor(Math.random() * 50) + 10,
      totalAuctions: Math.floor(Math.random() * 100) + 50,
    };
  });
}

export function VendorScorecardDashboard() {
  const [scorecards, setScorecards] = useState<VendorScorecard[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorScorecard | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'trend'>('score');
  const historicalCount = dataMigrationService.getHistoricalPerformance().length;

  useEffect(() => {
    const data = generateMockScorecards();
    setScorecards(data);
    setSelectedVendor(data[0]);
  }, []);

  const sortedScorecard = [...scorecards].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score;
    if (sortBy === 'name') return a.vendorName.localeCompare(b.vendorName);
    if (sortBy === 'trend') {
      const trendOrder = { IMPROVING: 3, STABLE: 2, DECLINING: 1 };
      return (trendOrder[b.trend] || 0) - (trendOrder[a.trend] || 0);
    }
    return 0;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Vendor Performance Scorecard</h1>
        <p className="text-slate-500 mt-1">Monitor and compare vendor performance metrics</p>
        {historicalCount > 0 ? (
          <div className="mt-2 inline-flex px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
            {historicalCount} historical performance records loaded
          </div>
        ) : null}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Vendor List */}
        <div className="col-span-1 bg-white rounded-lg border border-slate-200 shadow-sm h-fit">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Vendors</h2>
            <div className="space-y-2 flex flex-col">
              {['Score', 'Name', 'Trend'].map((option) => (
                <label key={option} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sortBy"
                    value={option.toLowerCase()}
                    checked={sortBy === option.toLowerCase()}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-600">{option}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {sortedScorecard.map((vendor) => (
              <div
                key={vendor.vendorId}
                onClick={() => setSelectedVendor(vendor)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedVendor?.vendorId === vendor.vendorId
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{vendor.vendorName}</p>
                    <p className="text-xs text-slate-500 mt-1">{vendor.vendorId}</p>
                  </div>
                  <GradeCircle grade={vendor.grade} score={vendor.score} />
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  {vendor.trend === 'IMPROVING' && (
                    <TrendingUp className="text-green-600" size={16} />
                  )}
                  {vendor.trend === 'DECLINING' && (
                    <TrendingDown className="text-red-600" size={16} />
                  )}
                  {vendor.trend === 'STABLE' && <div className="w-4 h-4 bg-slate-300 rounded-full" />}
                  <span className="text-xs text-slate-500">
                    {Math.abs(vendor.changePercent).toFixed(1)}% {vendor.trend === 'IMPROVING' ? '↑' : vendor.trend === 'DECLINING' ? '↓' : '→'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed View */}
        {selectedVendor && (
          <div className="col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedVendor.vendorName}</h2>
                  <p className="text-slate-500 mt-1">{selectedVendor.vendorId}</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-slate-900">{selectedVendor.score.toFixed(1)}</div>
                  <div className="text-sm text-slate-500 mt-1">out of 100</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <StatCard label="Auctions Won" value={`${selectedVendor.auctionsWon}/${selectedVendor.totalAuctions}`} />
                <StatCard
                  label="Win Rate"
                  value={`${((selectedVendor.auctionsWon / selectedVendor.totalAuctions) * 100).toFixed(1)}%`}
                />
                <StatCard
                  label="Trend"
                  value={selectedVendor.trend}
                  color={
                    selectedVendor.trend === 'IMPROVING'
                      ? 'text-green-600'
                      : selectedVendor.trend === 'DECLINING'
                        ? 'text-red-600'
                        : 'text-slate-600'
                  }
                />
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-6">
                {Object.entries(selectedVendor.metrics).map(([key, value]: [string, number]) => (
                  <MetricCard
                    key={key}
                    label={metricLabel(key)}
                    value={value}
                    max={key === 'claims' ? 100 : 100}
                  />
                ))}
              </div>
            </div>

            {/* Radar Chart Alternative - Metric Comparison */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Performance Radar</h3>
              <div className="h-64 flex items-center justify-center">
                <RadarChart metrics={selectedVendor.metrics} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vendor Comparison (Bottom) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Vendor Comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-slate-600">Vendor</th>
                <th className="px-6 py-3 text-center font-medium text-slate-600">Grade</th>
                <th className="px-6 py-3 text-center font-medium text-slate-600">Score</th>
                <th className="px-6 py-3 text-center font-medium text-slate-600">OTP</th>
                <th className="px-6 py-3 text-center font-medium text-slate-600">Acceptance</th>
                <th className="px-6 py-3 text-center font-medium text-slate-600">Trend</th>
                <th className="px-6 py-3 text-right font-medium text-slate-600">Won/Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scorecards.slice(0, 6).map((vendor) => (
                <tr
                  key={vendor.vendorId}
                  className={`hover:bg-slate-50 transition-colors ${
                    selectedVendor?.vendorId === vendor.vendorId ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 font-medium text-slate-900">{vendor.vendorName}</td>
                  <td className="px-6 py-4 text-center">
                    <GradeCircle grade={vendor.grade} score={vendor.score} small />
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-900">
                    {vendor.score.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600">
                    {vendor.metrics.otp.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600">
                    {vendor.metrics.acceptanceRate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-xs font-bold ${
                        vendor.trend === 'IMPROVING'
                          ? 'text-green-600'
                          : vendor.trend === 'DECLINING'
                            ? 'text-red-600'
                            : 'text-slate-600'
                      }`}
                    >
                      {vendor.trend === 'IMPROVING' ? '↑' : vendor.trend === 'DECLINING' ? '↓' : '→'}{' '}
                      {Math.abs(vendor.changePercent).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600 font-medium">
                    {vendor.auctionsWon}/{vendor.totalAuctions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface GradeCircleProps {
  grade: string;
  score: number;
  small?: boolean;
}

function GradeCircle({ grade, score, small = false }: GradeCircleProps) {
  const gradeColors = {
    'A+': 'bg-green-100 text-green-700 border-green-200',
    'A': 'bg-green-50 text-green-600 border-green-100',
    'B+': 'bg-blue-100 text-blue-700 border-blue-200',
    'B': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'C': 'bg-red-100 text-red-700 border-red-200',
  };

  const size = small ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-lg';

  return (
    <div
      className={`${size} ${gradeColors[grade]} border-2 rounded-full flex items-center justify-center font-bold flex-shrink-0`}
    >
      {grade}
    </div>
  );
}

function MetricCard({ label, value, max }: { label: string; value: number; max: number; [key: string]: any }): React.ReactElement {
  const numValue = Number(value) || 0;
  const percentage = (numValue / max) * 100;
  const color = percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-blue-500' : 'bg-orange-500';

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-slate-900">{label}</span>
        <span className="text-lg font-bold text-slate-900">{numValue.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
        <div className={`${color} h-full transition-all`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'text-slate-900' }: any) {
  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <p className="text-xs text-slate-600 font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function RadarChart({ metrics }: { metrics: any }) {
  // Simplified radar - just show as connected dots
  const entries = Object.entries(metrics);
  const size = 200;
  const center = size / 2;
  const radius = 80;

  const points = entries.map((_, i) => {
    const angle = (i / entries.length) * Math.PI * 2 - Math.PI / 2;
    const value = metrics[entries[i][0]] / 100;
    const x = center + Math.cos(angle) * radius * value;
    const y = center + Math.sin(angle) * radius * value;
    return { x, y, label: entries[i][0] };
  });

  const pointsPath = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background grid */}
      {[0.25, 0.5, 0.75, 1].map((scale, i) => (
        <circle
          key={i}
          cx={center}
          cy={center}
          r={radius * scale}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      ))}

      {/* Axes */}
      {entries.map((_, i) => {
        const angle = (i / entries.length) * Math.PI * 2 - Math.PI / 2;
        const x2 = center + Math.cos(angle) * radius;
        const y2 = center + Math.sin(angle) * radius;
        return (
          <line
            key={`axis-${i}`}
            x1={center}
            y1={center}
            x2={x2}
            y2={y2}
            stroke="#cbd5e1"
            strokeWidth="1"
          />
        );
      })}

      {/* Data polygon */}
      <polygon points={pointsPath} fill="#3b82f6" fillOpacity="0.3" stroke="#3b82f6" strokeWidth="2" />

      {/* Points */}
      {points.map((p, i) => (
        <circle key={`point-${i}`} cx={p.x} cy={p.y} r="3" fill="#3b82f6" />
      ))}
    </svg>
  );
}

function metricLabel(key: string): string {
  const labels = {
    otp: 'On-Time Performance',
    acceptanceRate: 'Acceptance Rate',
    completionRate: 'Completion Rate',
    rateAdherence: 'Rate Adherence',
    communication: 'Communication',
    claims: 'Claims',
  };
  return labels[key] || key;
}
