import React, { useMemo, useState } from 'react';
import { AlertTriangle, ShieldAlert, Wifi } from 'lucide-react';
import { ROLE_COLORS, rbacService } from '../services/rbac';

function useRbacSnapshot() {
  const [tick, setTick] = useState(0);
  React.useEffect(() => rbacService.subscribe(() => setTick((t) => t + 1)), []);
  return React.useMemo(() => rbacService.getSnapshot(), [tick]);
}

export function ActiveSessionsPage() {
  const { users } = useRbacSnapshot();
  const [search, setSearch] = useState('');

  const sessions = useMemo(
    () => users.flatMap((u) => u.sessions.map((s) => ({ ...s, userName: u.name }))).filter((s) => s.status !== 'expired'),
    [users],
  );

  const filtered = sessions.filter((s) =>
    `${s.userName} ${s.roleName} ${s.ipAddress} ${s.location}`.toLowerCase().includes(search.toLowerCase()),
  );

  const active = sessions.filter((s) => s.status === 'active').length;
  const idle = sessions.filter((s) => s.status === 'idle').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Active Sessions</h1>
        <p className="text-sm text-slate-600">Real-time session monitoring with security actions.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase text-slate-500">Total Active</div><div className="text-2xl font-bold" style={{ color: ROLE_COLORS.activeSession }}>{active}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase text-slate-500">Idle {'(>10 min)'}</div><div className="text-2xl font-bold text-[#FFB300]">{idle}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase text-slate-500">Total Today</div><div className="text-2xl font-bold text-[#2979FF]">{users.reduce((acc, u) => acc + u.sessions.length, 0)}</div></div>
      </div>

      <div className="rounded-xl border border-[#FF1744] bg-[#FFF5F7] p-4 text-sm text-slate-700">
        <div className="flex items-center gap-2 font-semibold text-[#FF1744]"><ShieldAlert size={16} /> Suspicious Activity Alerts</div>
        <div className="mt-2 flex flex-col gap-2">
          <div className="rounded-lg bg-[#FFE3EA] px-3 py-2">Multiple failed login attempts from IP 45.67.89.12</div>
          <div className="rounded-lg bg-[#FFF1E8] px-3 py-2">Admin login from new location: Singapore</div>
          <div className="rounded-lg bg-[#FFF8E1] px-3 py-2">2 concurrent sessions for same user detected</div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sessions by user, role, IP, location"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((s) => (
          <div key={s.sessionId} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900">{s.userName}</div>
                <div className="mt-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-white" style={{ backgroundColor: s.roleColor }}>
                  {s.roleName}
                </div>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${s.status === 'active' ? 'bg-[#76FF03] text-slate-900' : 'bg-[#FFB300] text-white'}`}>{s.status.toUpperCase()}</span>
            </div>

            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <div>Device: {s.deviceInfo}</div>
              <div>IP: {s.ipAddress}</div>
              <div>Location: {s.location}</div>
              <div>Login: {new Date(s.loginAt).toLocaleString()}</div>
              <div>Last Activity: {new Date(s.lastActivityAt).toLocaleString()}</div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => rbacService.terminateSession(s.sessionId, 'SYSTEM_ADMIN')} className="rounded-lg bg-[#FF1744] px-3 py-2 text-xs font-semibold text-white">Terminate Session</button>
              <button className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs"><Wifi size={13} /> View Activity</button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          <div className="mb-1 flex items-center justify-center gap-2"><AlertTriangle size={14} /> No sessions match the current filter.</div>
        </div>
      ) : null}
    </div>
  );
}
