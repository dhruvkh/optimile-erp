import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Copy, Eye, Pencil, Plus, Shield, Users } from 'lucide-react';
import { RBAC_PERMISSION_CATALOG, ROLE_COLORS, rbacService, type PermissionModule, type RoleRecord, type RoleKey } from '../../services/rbac';

const ROLE_KEY_OPTIONS: RoleKey[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'PROCUREMENT_MANAGER',
  'AUCTION_CREATOR',
  'OBSERVER',
  'VENDOR',
  'CLIENT',
];

const ICON_OPTIONS = ['👑', '⚙️', '📊', '🎯', '👁️', '🚚', '🧳', '🛡️', '🧠', '📌'];

const MODULE_LABELS: Record<PermissionModule, string> = {
  dashboard: 'Dashboard & Analytics',
  auction: 'Auction Management',
  vendor: 'Vendor Management',
  contract: 'Contract Management',
  financial: 'Financial & Reporting',
  system: 'System Administration',
  integrations: 'Integrations',
};

const MODULE_COLORS: Record<PermissionModule, string> = {
  dashboard: '#00C853',
  auction: '#2979FF',
  vendor: '#00BFA5',
  contract: '#AA00FF',
  financial: '#FFB300',
  system: '#FF1744',
  integrations: '#757575',
};

const ROLE_COLOR_OPTIONS = [
  ROLE_COLORS.superAdmin,
  ROLE_COLORS.admin,
  ROLE_COLORS.manager,
  ROLE_COLORS.user,
  ROLE_COLORS.viewer,
  ROLE_COLORS.vendor,
  ROLE_COLORS.client,
];

function useRbacSnapshot() {
  const [tick, setTick] = useState(0);
  React.useEffect(() => rbacService.subscribe(() => setTick((t) => t + 1)), []);
  return React.useMemo(() => rbacService.getSnapshot(), [tick]);
}

function permissionPercent(role: RoleRecord) {
  const granted = role.permissions.filter((p) => p.granted).length;
  return Math.round((granted / Math.max(1, role.permissions.length)) * 100);
}

export function RolesPermissionsPage() {
  const { roles, users } = useRbacSnapshot();
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.roleId || '');
  const [showCreate, setShowCreate] = useState(false);

  const selectedRole = useMemo(
    () => roles.find((r) => r.roleId === selectedRoleId) || roles[0],
    [roles, selectedRoleId],
  );

  const [draft, setDraft] = useState({
    roleName: '',
    roleKey: 'OBSERVER' as RoleKey,
    description: '',
    color: ROLE_COLORS.manager,
    icon: '🛡️',
    roleType: 'custom' as const,
    status: 'active' as const,
    parentRoleId: 'ROLE-MANAGER',
    permissionKeys: new Set<string>(),
  });

  React.useEffect(() => {
    if (!selectedRoleId && roles[0]?.roleId) {
      setSelectedRoleId(roles[0].roleId);
    }
  }, [roles, selectedRoleId]);

  const totals = {
    roles: roles.length,
    users: users.length,
    activeSessions: users.reduce((acc, u) => acc + u.sessions.filter((s) => s.status !== 'expired').length, 0),
    modifiedAgo: '2 days ago',
  };

  const createRole = () => {
    if (draft.roleName.trim().length < 3) return;
    rbacService.createRole({
      roleName: draft.roleName.trim(),
      roleKey: draft.roleKey,
      color: draft.color,
      icon: draft.icon,
      roleType: draft.roleType,
      description: draft.description || 'Custom role',
      status: draft.status,
      permissionKeys: Array.from(draft.permissionKeys),
      parentRoleId: draft.parentRoleId || undefined,
      accessControls: {
        dataScope: 'team',
        regions: ['North', 'South', 'East', 'West'],
        timeRestriction: { enabled: false, mode: '24x7' },
        ipRestriction: { enabled: false, mode: 'any', whitelistedIPs: [] },
      },
      sessionSettings: {
        maxConcurrentSessions: 2,
        sessionTimeout: 60,
        requireReauth: false,
      },
      securitySettings: {
        require2FA: false,
        allowed2FAMethods: ['sms'],
        graceDays: 7,
      },
      createdBy: 'SYSTEM_ADMIN',
      lastModifiedBy: 'SYSTEM_ADMIN',
    });
    setShowCreate(false);
    setDraft({
      roleName: '',
      roleKey: 'OBSERVER',
      description: '',
      color: ROLE_COLORS.manager,
      icon: '🛡️',
      roleType: 'custom',
      status: 'active',
      parentRoleId: 'ROLE-MANAGER',
      permissionKeys: new Set<string>(),
    });
  };

  const applyTemplate = (template: 'full' | 'admin' | 'manager' | 'operator' | 'viewer') => {
    const keys = RBAC_PERMISSION_CATALOG.map((p) => p.key);
    const selected = new Set<string>();
    if (template === 'full') {
      keys.forEach((k) => selected.add(k));
    }
    if (template === 'admin') {
      keys.filter((k) => !k.includes('backup_restore') && !k.includes('emergency_controls')).forEach((k) => selected.add(k));
    }
    if (template === 'manager') {
      keys.filter((k) => !k.startsWith('system.') && k !== 'financial.modify_data' && k !== 'auction.delete' && k !== 'contract.delete').forEach((k) => selected.add(k));
    }
    if (template === 'operator') {
      keys.filter((k) => ['dashboard.view.executive', 'dashboard.view.analytics', 'auction.view', 'auction.create', 'auction.edit', 'auction.live_monitor', 'vendor.view', 'contract.view'].includes(k)).forEach((k) => selected.add(k));
    }
    if (template === 'viewer') {
      keys.filter((k) => k.includes('.view') || k.includes('export')).forEach((k) => selected.add(k));
    }
    setDraft((d) => ({ ...d, permissionKeys: selected }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Roles & Permissions Management</h1>
          <p className="text-sm text-slate-600">Define roles, assign permissions, and manage user access.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#2979FF] px-4 py-2 text-sm font-semibold text-white">
            <Plus size={16} /> Create New Role
          </button>
          <Link to="/ams/audit" className="inline-flex items-center gap-2 rounded-lg bg-[#00C853] px-4 py-2 text-sm font-semibold text-white">
            <Users size={16} /> Manage Users
          </Link>
          <Link to="/ams/audit" className="inline-flex items-center gap-2 rounded-lg bg-[#FFB300] px-4 py-2 text-sm font-semibold text-white">
            <Shield size={16} /> View Audit Log
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Total Roles</div>
          <div className="mt-1 text-2xl font-bold">{totals.roles}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Total Users</div>
          <div className="mt-1 text-2xl font-bold">{totals.users}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Active Sessions</div>
          <div className="mt-1 text-2xl font-bold text-[#76FF03]">{totals.activeSessions}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Last Role Modified</div>
          <div className="mt-1 text-2xl font-bold">{totals.modifiedAgo}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => {
          const count = users.filter((u) => u.roleId === role.roleId).length;
          const pct = permissionPercent(role);
          return (
            <button
              key={role.roleId}
              onClick={() => setSelectedRoleId(role.roleId)}
              className={`rounded-xl p-4 text-left text-white transition hover:opacity-95 ${selectedRoleId === role.roleId ? 'ring-4 ring-slate-200' : ''}`}
              style={{ backgroundColor: role.color }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-2xl">{role.icon}</div>
                  <div className="mt-2 text-lg font-bold leading-tight">{role.roleName}</div>
                </div>
                <span className="rounded-full bg-white/20 px-2 py-1 text-xs font-semibold">{count} users</span>
              </div>
              <div className="mt-3 text-xs opacity-95">{role.description}</div>
              <div className="mt-3 h-2 w-full rounded-full bg-white/30">
                <div className="h-2 rounded-full bg-white" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 text-xs">Permission Level: {pct}%</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-md border border-white/60 px-2 py-1 text-xs">View Permissions</span>
                <span className="rounded-md border border-white/60 px-2 py-1 text-xs">View Users</span>
                {role.roleType === 'custom' ? <span className="rounded-md border border-white/60 px-2 py-1 text-xs">Edit Role</span> : null}
              </div>
            </button>
          );
        })}
      </div>

      {selectedRole ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: selectedRole.color }}>{selectedRole.icon} {selectedRole.roleName}</h2>
              <p className="text-sm text-slate-600">Permission matrix and module-level coverage.</p>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"><Eye size={14} /> View Users</button>
              {selectedRole.roleType === 'custom' ? <button className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"><Pencil size={14} /> Edit Role</button> : null}
              <button className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"><Copy size={14} /> Duplicate</button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {(Object.keys(MODULE_LABELS) as PermissionModule[]).map((moduleKey) => {
              const rows = selectedRole.permissions.filter((p) => p.module === moduleKey);
              const granted = rows.filter((p) => p.granted).length;
              const pct = Math.round((granted / Math.max(1, rows.length)) * 100);
              return (
                <div key={moduleKey} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold" style={{ color: MODULE_COLORS[moduleKey] }}>{MODULE_LABELS[moduleKey]}</h3>
                    <span className="text-xs text-slate-500">{granted}/{rows.length}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: MODULE_COLORS[moduleKey] }} />
                  </div>
                  <div className="mt-3 space-y-2">
                    {rows.map((p) => (
                      <label key={p.key} className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={p.granted} disabled className="h-4 w-4" />
                        <span>{p.key}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#00C853]" /> Total permissions granted: {selectedRole.permissions.filter((p) => p.granted).length}/{selectedRole.permissions.length}</div>
            <div className="flex items-center gap-2 text-[#FFB300]"><AlertTriangle size={14} /> Security score: {permissionPercent(selectedRole) > 80 ? 'High' : permissionPercent(selectedRole) > 50 ? 'Medium' : 'Low'}</div>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Role Hierarchy</h2>
        <div className="mt-4 space-y-3 text-sm">
          {roles
            .sort((a, b) => a.hierarchy.level - b.hierarchy.level)
            .map((role) => (
              <div key={role.roleId} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3" style={{ marginLeft: `${(role.hierarchy.level - 1) * 24}px` }}>
                <span className="rounded-md px-2 py-1 text-white" style={{ backgroundColor: role.color }}>{role.icon} {role.roleName}</span>
                <span className="text-slate-500">Level {role.hierarchy.level}</span>
                {role.hierarchy.parentRoleId ? <span className="text-slate-400">inherits from {roles.find((r) => r.roleId === role.hierarchy.parentRoleId)?.roleName}</span> : null}
              </div>
            ))}
        </div>
      </div>

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create New Role</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-lg border px-3 py-1 text-sm">Close</button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                Role Name
                <input value={draft.roleName} onChange={(e) => setDraft((d) => ({ ...d, roleName: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Regional Manager" />
              </label>
              <label className="text-sm">
                Role Key
                <select value={draft.roleKey} onChange={(e) => setDraft((d) => ({ ...d, roleKey: e.target.value as RoleKey }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                  {ROLE_KEY_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </label>
              <label className="text-sm md:col-span-2">
                Description
                <textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" rows={2} />
              </label>
              <label className="text-sm">
                Parent Role
                <select value={draft.parentRoleId} onChange={(e) => setDraft((d) => ({ ...d, parentRoleId: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                  {roles.map((r) => <option key={r.roleId} value={r.roleId}>{r.roleName}</option>)}
                </select>
              </label>
              <div className="text-sm">
                Role Color
                <div className="mt-2 flex flex-wrap gap-2">
                  {ROLE_COLOR_OPTIONS.map((c) => (
                    <button key={c} onClick={() => setDraft((d) => ({ ...d, color: c }))} className={`h-8 w-8 rounded-full border-2 ${draft.color === c ? 'border-slate-900' : 'border-white'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="text-sm md:col-span-2">
                Role Icon
                <div className="mt-2 flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((ico) => (
                    <button key={ico} onClick={() => setDraft((d) => ({ ...d, icon: ico }))} className={`rounded-lg border px-3 py-2 text-lg ${draft.icon === ico ? 'border-slate-900' : 'border-slate-300'}`}>{ico}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 p-4">
              <div className="mb-2 text-sm font-semibold">Permission Templates</div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => applyTemplate('full')} className="rounded-md bg-[#D500F9] px-3 py-2 text-xs font-semibold text-white">Full Access</button>
                <button onClick={() => applyTemplate('admin')} className="rounded-md bg-[#FF1744] px-3 py-2 text-xs font-semibold text-white">Standard Admin</button>
                <button onClick={() => applyTemplate('manager')} className="rounded-md bg-[#2979FF] px-3 py-2 text-xs font-semibold text-white">Manager</button>
                <button onClick={() => applyTemplate('operator')} className="rounded-md bg-[#00C853] px-3 py-2 text-xs font-semibold text-white">Operator</button>
                <button onClick={() => applyTemplate('viewer')} className="rounded-md bg-[#FFB300] px-3 py-2 text-xs font-semibold text-white">Viewer</button>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 p-4">
              <div className="mb-3 text-sm font-semibold">Permission Assignment</div>
              <div className="grid gap-4 md:grid-cols-2">
                {(Object.keys(MODULE_LABELS) as PermissionModule[]).map((moduleKey) => {
                  const entries = RBAC_PERMISSION_CATALOG.filter((p) => p.module === moduleKey);
                  const granted = entries.filter((p) => draft.permissionKeys.has(p.key)).length;
                  const pct = Math.round((granted / Math.max(1, entries.length)) * 100);
                  return (
                    <div key={moduleKey} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold" style={{ color: MODULE_COLORS[moduleKey] }}>{MODULE_LABELS[moduleKey]}</div>
                        <div className="text-xs text-slate-500">{granted}/{entries.length}</div>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: MODULE_COLORS[moduleKey] }} />
                      </div>
                      <div className="mt-2 space-y-1">
                        {entries.map((entry) => (
                          <label key={entry.key} className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={draft.permissionKeys.has(entry.key)}
                              onChange={(e) => setDraft((d) => {
                                const next = new Set(d.permissionKeys);
                                if (e.target.checked) next.add(entry.key);
                                else next.delete(entry.key);
                                return { ...d, permissionKeys: next };
                              })}
                              className="h-4 w-4"
                            />
                            <span>{entry.key}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              Total Permissions: {RBAC_PERMISSION_CATALOG.length} | Granted: <span className="font-semibold text-[#00C853]">{draft.permissionKeys.size}</span> | Denied: <span className="font-semibold text-[#FF1744]">{Math.max(0, RBAC_PERMISSION_CATALOG.length - draft.permissionKeys.size)}</span>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button>
              <button onClick={createRole} className="rounded-lg bg-[#00C853] px-4 py-2 text-sm font-semibold text-white">Save & Activate</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
