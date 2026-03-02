import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { ArrowUpRight, Eye, Plus } from 'lucide-react';
import { auctionEngine } from '../../services/mockBackend';
import { DisputeCategory, DisputeStatus } from '../../types';

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / (60 * 60 * 1000));
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function statusTone(status: DisputeStatus) {
  const styles: Record<DisputeStatus, string> = {
    [DisputeStatus.NEW]: 'bg-blue-100 text-blue-700',
    [DisputeStatus.UNDER_REVIEW]: 'bg-yellow-100 text-yellow-700',
    [DisputeStatus.PENDING_RESPONSE]: 'bg-orange-100 text-orange-700',
    [DisputeStatus.RESOLVED]: 'bg-green-100 text-green-700',
    [DisputeStatus.ESCALATED]: 'bg-red-100 text-red-700',
    [DisputeStatus.CLOSED]: 'bg-slate-100 text-slate-700',
  };
  return styles[status];
}

export function DisputesDashboard() {
  const [tick, setTick] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auctionEngine.subscribe(() => setTick((v) => v + 1));
    return unsub;
  }, []);

  const disputes = auctionEngine.getDisputes();
  const metrics = auctionEngine.getDisputeMetrics();

  const categoryData = useMemo(() => {
    return Object.values(DisputeCategory).map((category) => ({
      category,
      count: disputes.filter((d) => d.category === category).length,
    }));
  }, [disputes, tick]);

  const statusData = useMemo(() => {
    return Object.values(DisputeStatus).map((status) => ({
      status,
      count: disputes.filter((d) => d.status === status).length,
    }));
  }, [disputes, tick]);

  const trendData = useMemo(() => {
    const buckets = new Map<string, number>();
    disputes.forEach((dispute) => {
      const key = new Date(dispute.createdAt).toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });
    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, count]) => ({ date, count }));
  }, [disputes, tick]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Disputes Dashboard</h1>
          <p className="text-slate-500">Track disputes across auction, contracts, payment, and performance.</p>
        </div>
        <button onClick={() => navigate('/disputes/create')} className="px-3 py-2 rounded-lg bg-blue-600 text-white inline-flex items-center gap-2">
          <Plus size={16} /> Raise Dispute
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Metric title="Open Disputes" value={`${metrics.open}`} tone="blue" />
        <Metric title="Under Review" value={`${metrics.underReview}`} tone="yellow" />
        <Metric title="Resolved" value={`${metrics.resolved}`} tone="green" />
        <Metric title="Escalated" value={`${metrics.escalated}`} tone="red" />
        <Metric title="Avg Resolution" value={`${metrics.avgResolutionDays.toFixed(1)} days`} tone="slate" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 xl:col-span-2">
          <div className="font-semibold text-slate-900 mb-2">Dispute Trends (14 days)</div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <XAxis dataKey="date" hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-slate-500 inline-flex items-center gap-1"><ArrowUpRight size={12} /> Dispute Rate: {metrics.disputeRatePct.toFixed(1)}% of auctions</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="font-semibold text-slate-900 mb-2">Category Split</div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="count" nameKey="category" outerRadius={70}>
                  {categoryData.map((_, i) => <Cell key={i} fill={[ '#2563eb', '#16a34a', '#ea580c', '#d97706', '#9333ea', '#ef4444', '#64748b' ][i % 7]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">Disputes Table</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Dispute ID</th>
                <th className="px-4 py-3 text-left">Raised By</th>
                <th className="px-4 py-3 text-left">Date Raised</th>
                <th className="px-4 py-3 text-left">Related To</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Assigned To</th>
                <th className="px-4 py-3 text-left">Last Updated</th>
                <th className="px-4 py-3 text-left">SLA</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((d) => (
                <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono">{d.id}</td>
                  <td className="px-4 py-3">{d.raisedBy}</td>
                  <td className="px-4 py-3">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{d.relatedType}{d.relatedId ? ` #${d.relatedId.slice(0, 8)}` : ''}</td>
                  <td className="px-4 py-3">{d.category}</td>
                  <td className="px-4 py-3">{d.priority}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusTone(d.status)}`}>{d.status}</span></td>
                  <td className="px-4 py-3">{d.assignedTo || '--'}</td>
                  <td className="px-4 py-3 text-xs">{relativeTime(d.updatedAt)}</td>
                  <td className="px-4 py-3 text-xs">Resolve by {new Date(d.dueAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/ams/disputes/${d.id}`} className="inline-flex items-center gap-1 text-blue-700 hover:underline">
                      <Eye size={14} /> View Details
                    </Link>
                  </td>
                </tr>
              ))}
              {disputes.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-400">No disputes found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
        <div className="font-semibold text-slate-900">Preventive Insights</div>
        <div className="text-sm text-slate-700">Top causes:</div>
        <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
          {categoryData
            .slice()
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .map((item) => <li key={item.category}>{item.category}: {item.count}</li>)}
        </ul>
        <div className="text-sm text-slate-700 mt-2">Recommended improvements:</div>
        <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
          <li>Better auction instructions and live system alerts.</li>
          <li>Clear award criteria and transparent post-auction summaries.</li>
          <li>Improved contract clause templates for edge cases.</li>
        </ul>
      </div>
    </div>
  );
}

function Metric({ title, value, tone }: { title: string; value: string; tone: 'blue' | 'yellow' | 'green' | 'red' | 'slate' }) {
  const cls = {
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    green: 'bg-green-50 text-green-800 border-green-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    slate: 'bg-slate-50 text-slate-900 border-slate-200',
  }[tone];

  return (
    <div className={`border rounded-lg p-3 ${cls}`}>
      <div className="text-xs">{title}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}
