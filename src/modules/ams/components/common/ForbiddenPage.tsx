import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ban } from 'lucide-react';
import { rbacService } from '../../services/rbac';

function useRbacSnapshot() {
  const [tick, setTick] = useState(0);
  React.useEffect(() => rbacService.subscribe(() => setTick((t) => t + 1)), []);
  return React.useMemo(() => rbacService.getSnapshot(), [tick]);
}

export function ForbiddenPage() {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const required = params.get('required') || 'auction.delete';
  const userId = params.get('userId') || 'USR-OBS-1';
  const { users } = useRbacSnapshot();
  const user = users.find((u) => u.userId === userId);
  const [justification, setJustification] = useState('Need this permission to complete assigned operations task.');

  const requestAccess = () => {
    if (!user) return;
    rbacService.createPermissionRequest({
      requestedBy: user.userId,
      permissionRequested: required,
      permissionType: 'single',
      justification,
      urgency: 'medium',
      duration: 'temporary',
      temporaryDays: 7,
    });
    alert('Access request submitted successfully.');
  };

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-[#FF1744] bg-white p-8 text-center shadow-sm">
      <Ban className="mx-auto h-14 w-14 text-[#FF1744]" />
      <h1 className="mt-4 text-3xl font-bold text-[#FF1744]">Access Denied</h1>
      <p className="mt-2 text-sm text-slate-600">You do not have permission to access this resource.</p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm">
        <div>Required Permission: <span className="rounded-md bg-[#FF1744] px-2 py-1 text-xs font-semibold text-white">{required}</span></div>
        <div className="mt-2">Your Role: <span className="rounded-md bg-[#FFB300] px-2 py-1 text-xs font-semibold text-white">{user?.roleName || 'OBSERVER'}</span></div>
      </div>

      <div className="mt-4 text-left">
        <label className="text-sm font-medium text-slate-700">Business Justification</label>
        <textarea value={justification} onChange={(e) => setJustification(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button onClick={requestAccess} className="rounded-lg bg-[#2979FF] px-4 py-2 text-sm font-semibold text-white">Request Access</button>
        <Link to="/" className="rounded-lg bg-[#00C853] px-4 py-2 text-sm font-semibold text-white">Go to Dashboard</Link>
        <a href="mailto:support@optimile.com" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Contact Support</a>
      </div>
    </div>
  );
}
