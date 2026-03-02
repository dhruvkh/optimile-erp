import React, { useMemo, useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { rbacService, type AuditEvent } from '../../services/rbac';

function useRbacSnapshot() {
  const [tick, setTick] = useState(0);
  React.useEffect(() => rbacService.subscribe(() => setTick((t) => t + 1)), []);
  return React.useMemo(() => rbacService.getSnapshot(), [tick]);
}

const actionColor: Record<AuditEvent['action'], string> = {
  PERMISSION_GRANTED: 'bg-[#00C853] text-white',
  PERMISSION_REVOKED: 'bg-[#FF1744] text-white',
  ROLE_CHANGED: 'bg-[#2979FF] text-white',
  ACCESS_DENIED: 'bg-[#FF6D00] text-white',
  LOGIN: 'bg-[#76FF03] text-slate-900',
  LOGOUT: 'bg-[#757575] text-white',
  ROLE_CREATED: 'bg-[#00BFA5] text-white',
  ROLE_UPDATED: 'bg-[#AA00FF] text-white',
  REQUEST_CREATED: 'bg-[#FFB300] text-white',
  REQUEST_APPROVED: 'bg-[#00C853] text-white',
  REQUEST_REJECTED: 'bg-[#FF1744] text-white',
};

export function PermissionAuditLogPage() {
  const { auditLog } = useRbacSnapshot();
  const [actionFilter, setActionFilter] = useState<'all' | AuditEvent['action']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'SUCCESS' | 'FAILED'>('all');
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    return auditLog.filter((row) => {
      if (actionFilter !== 'all' && row.action !== actionFilter) return false;
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (query && !`${row.user} ${row.resource} ${row.details}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [auditLog, actionFilter, statusFilter, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Permission Audit Log</h1>
        <p className="text-sm text-slate-600">Track permission grants, revokes, access denials, and role changes.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by user/resource/details" className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value as 'all' | AuditEvent['action'])} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="all">All Actions</option>
            {Object.keys(actionColor).map((action) => <option key={action} value={action}>{action}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'SUCCESS' | 'FAILED')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="all">All Status</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <button className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"><Filter size={14} /> Apply</button>
          <button className="inline-flex items-center gap-1 rounded-lg bg-[#00C853] px-3 py-2 text-sm font-semibold text-white"><Download size={14} /> Export CSV</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left">Timestamp</th>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2 text-left">Action</th>
              <th className="px-3 py-2 text-left">Resource</th>
              <th className="px-3 py-2 text-left">IP</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-xs text-slate-600">{new Date(row.timestamp).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <div className="font-semibold text-slate-900">{row.user}</div>
                  <div className="text-xs text-slate-500">{row.role}</div>
                </td>
                <td className="px-3 py-2"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${actionColor[row.action]}`}>{row.action}</span></td>
                <td className="px-3 py-2 text-slate-700">{row.resource}</td>
                <td className="px-3 py-2 text-xs text-slate-600">{row.ipAddress}</td>
                <td className="px-3 py-2"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${row.status === 'SUCCESS' ? 'bg-[#00C853] text-white' : 'bg-[#FF1744] text-white'}`}>{row.status}</span></td>
                <td className="px-3 py-2 text-slate-600">{row.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
