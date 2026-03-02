import React, { useMemo, useState } from 'react';
import { Clock3, ShieldCheck, ShieldX } from 'lucide-react';
import { rbacService, type PermissionRequestRecord } from '../../services/rbac';

function useRbacSnapshot() {
  const [tick, setTick] = useState(0);
  React.useEffect(() => rbacService.subscribe(() => setTick((t) => t + 1)), []);
  return React.useMemo(() => rbacService.getSnapshot(), [tick]);
}

const urgencyStyles: Record<PermissionRequestRecord['urgency'], string> = {
  urgent: 'bg-[#FF1744] text-white border-[#FF1744]',
  high: 'bg-[#FF6D00] text-white border-[#FF6D00]',
  medium: 'bg-[#FFB300] text-white border-[#FFB300]',
  low: 'bg-[#00C853] text-white border-[#00C853]',
};

export function PermissionRequestsPage() {
  const { permissionRequests, users } = useRbacSnapshot();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [actorId, setActorId] = useState('USR-ADM-1');

  const pending = useMemo(() => permissionRequests.filter((r) => r.status === 'pending'), [permissionRequests]);

  const decide = (requestId: string, decision: 'approve' | 'reject') => {
    rbacService.reviewPermissionRequest(requestId, actorId, decision, notes[requestId] || `${decision}d by admin`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Permission Requests</h1>
          <p className="text-sm text-slate-600">Review and approve access escalation requests.</p>
        </div>
        <label className="text-sm">
          Acting As
          <select value={actorId} onChange={(e) => setActorId(e.target.value)} className="ml-2 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {users.filter((u) => ['SUPER ADMIN', 'ADMIN'].includes(u.roleName)).map((u) => (
              <option key={u.userId} value={u.userId}>{u.name} ({u.roleName})</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase text-slate-500">Pending</div><div className="text-2xl font-bold text-[#FFB300]">{pending.length}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase text-slate-500">Approved</div><div className="text-2xl font-bold text-[#00C853]">{permissionRequests.filter((r) => r.status === 'approved').length}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase text-slate-500">Rejected</div><div className="text-2xl font-bold text-[#FF1744]">{permissionRequests.filter((r) => r.status === 'rejected').length}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase text-slate-500">SLA</div><div className="text-2xl font-bold text-[#2979FF]">48h</div></div>
      </div>

      <div className="space-y-4">
        {permissionRequests.map((req) => (
          <div key={req.requestId} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold">{req.requestId}</span>
                  <span className={`rounded-md border px-2 py-1 text-xs font-semibold uppercase ${urgencyStyles[req.urgency]}`}>{req.urgency}</span>
                  <span className={`rounded-md px-2 py-1 text-xs font-semibold ${req.status === 'approved' ? 'bg-[#00C853] text-white' : req.status === 'rejected' ? 'bg-[#FF1744] text-white' : 'bg-[#FFB300] text-white'}`}>{req.status.toUpperCase()}</span>
                </div>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">{req.requestedByName} requests <span className="text-[#2979FF]">{req.permissionRequested}</span></h2>
                <p className="mt-1 text-sm text-slate-600">Current role: {req.currentRole} | Duration: {req.duration}{req.temporaryDays ? ` (${req.temporaryDays} days)` : ''}</p>
                <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{req.justification}</p>
              </div>
              <div className="text-xs text-slate-500">
                <div className="flex items-center gap-1"><Clock3 size={13} /> Requested: {new Date(req.requestedAt).toLocaleString()}</div>
                <div>Expires: {new Date(req.expiresAt).toLocaleString()}</div>
                {req.reviewedBy ? <div>Reviewed by: {req.reviewedBy}</div> : null}
              </div>
            </div>

            {req.status === 'pending' ? (
              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
                <input
                  value={notes[req.requestId] || ''}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [req.requestId]: e.target.value }))}
                  placeholder="Add review notes"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={() => decide(req.requestId, 'approve')} className="inline-flex items-center gap-1 rounded-lg bg-[#00C853] px-3 py-2 text-sm font-semibold text-white"><ShieldCheck size={14} /> Approve</button>
                  <button onClick={() => decide(req.requestId, 'reject')} className="inline-flex items-center gap-1 rounded-lg bg-[#FF1744] px-3 py-2 text-sm font-semibold text-white"><ShieldX size={14} /> Reject</button>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Review Notes: {req.reviewNotes || 'No notes'}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
