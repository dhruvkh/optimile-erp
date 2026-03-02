import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, UserCog, UserMinus, Users } from 'lucide-react';
import { rbacService, type UserRecord } from '../../services/rbac';

function useRbacSnapshot() {
  const [tick, setTick] = useState(0);
  React.useEffect(() => rbacService.subscribe(() => setTick((t) => t + 1)), []);
  return React.useMemo(() => rbacService.getSnapshot(), [tick]);
}

function statusBadge(status: UserRecord['status']) {
  if (status === 'active') return 'bg-[#00C853] text-white';
  if (status === 'pending') return 'bg-[#FFB300] text-white';
  return 'bg-[#757575] text-white';
}

export function UsersManagementPage() {
  const { users, roles } = useRbacSnapshot();
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    roleId: roles[0]?.roleId || '',
    department: 'Procurement',
    status: 'active' as const,
  });

  const filtered = useMemo(() => {
    let list = [...users];
    if (roleFilter !== 'all') list = list.filter((u) => u.roleId === roleFilter);
    return list;
  }, [users, roleFilter]);

  const activeCount = users.filter((u) => u.status === 'active').length;
  const inactiveCount = users.filter((u) => u.status === 'inactive').length;
  const onlineCount = users.filter((u) => u.sessions.some((s) => s.status === 'active')).length;

  const toggleAll = (checked: boolean) => {
    if (checked) setSelected(new Set(filtered.map((u) => u.userId)));
    else setSelected(new Set());
  };

  const changeRole = (userId: string, nextRoleId: string) => {
    rbacService.changeUserRole(userId, nextRoleId, 'SYSTEM_ADMIN');
  };

  const deactivateSelected = () => {
    selected.forEach((userId) => {
      const user = users.find((u) => u.userId === userId);
      if (!user) return;
      rbacService.terminateAllUserSessions(userId, 'SYSTEM_ADMIN');
      rbacService.grantCustomPermission(userId, 'auction.create', false, 'SYSTEM_ADMIN', 'Bulk deactivation action');
    });
    setSelected(new Set());
  };

  const createUser = () => {
    if (!form.name || !form.email || !form.roleId) return;
    rbacService.createUser({
      name: form.name,
      email: form.email,
      phone: form.phone,
      roleId: form.roleId,
      department: form.department,
      status: form.status,
      createdBy: 'SYSTEM_ADMIN',
    });
    setShowAdd(false);
    setForm({ name: '', email: '', phone: '', roleId: roles[0]?.roleId || '', department: 'Procurement', status: 'active' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Role Assignment</h1>
          <p className="text-sm text-slate-600">Manage user access, role assignment, and live status.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#2979FF] px-4 py-2 text-sm font-semibold text-white"><Plus size={15} /> Add User</button>
          <Link to="/ams/audit" className="inline-flex items-center gap-2 rounded-lg bg-[#00C853] px-4 py-2 text-sm font-semibold text-white"><Users size={15} /> Roles</Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase text-slate-500">All Users</div><div className="text-2xl font-bold text-[#2979FF]">{users.length}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase text-slate-500">Active</div><div className="text-2xl font-bold text-[#00C853]">{activeCount}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase text-slate-500">Inactive</div><div className="text-2xl font-bold text-[#757575]">{inactiveCount}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase text-slate-500">Online Now</div><div className="text-2xl font-bold text-[#76FF03]">{onlineCount}</div></div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <label className="text-sm">Role Filter</label>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="all">All Roles</option>
          {roles.map((r) => <option key={r.roleId} value={r.roleId}>{r.roleName}</option>)}
        </select>
        <button onClick={deactivateSelected} disabled={selected.size === 0} className="inline-flex items-center gap-2 rounded-lg bg-[#FF1744] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><UserMinus size={14} /> Deactivate Selected</button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left"><input type="checkbox" onChange={(e) => toggleAll(e.target.checked)} /></th>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Last Active</th>
              <th className="px-3 py-2 text-left">Session</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const online = u.sessions.some((s) => s.status === 'active');
              return (
                <tr key={u.userId} className="border-t border-slate-100">
                  <td className="px-3 py-2"><input type="checkbox" checked={selected.has(u.userId)} onChange={(e) => setSelected((prev) => {
                    const next = new Set(prev);
                    if (e.target.checked) next.add(u.userId); else next.delete(u.userId);
                    return next;
                  })} /></td>
                  <td className="px-3 py-2">
                    <div className="font-semibold text-slate-900">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={u.roleId}
                      onChange={(e) => changeRole(u.userId, e.target.value)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                      style={{ borderColor: u.roleColor }}
                    >
                      {roles.map((r) => <option key={r.roleId} value={r.roleId}>{r.roleName}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold uppercase ${statusBadge(u.status)}`}>{u.status}</span></td>
                  <td className="px-3 py-2 text-xs text-slate-600">{Math.max(1, Math.round((Date.now() - u.lastActiveAt) / 3600000))}h ago</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${online ? 'bg-[#76FF03] text-slate-900' : 'bg-[#757575] text-white'}`}>
                      {online ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button className="rounded-md border border-slate-300 p-1 text-slate-700" title="Edit User"><UserCog size={14} /></button>
                      <button className="rounded-md border border-[#FF1744] p-1 text-[#FF1744]" onClick={() => rbacService.terminateAllUserSessions(u.userId, 'SYSTEM_ADMIN')} title="Terminate Sessions"><UserMinus size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAdd ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add New User</h2>
              <button onClick={() => setShowAdd(false)} className="rounded-lg border px-2 py-1 text-sm">Close</button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm">Full Name<input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm">Email<input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm">Phone<input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm">Department<input value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm">Assign Role<select value={form.roleId} onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">{roles.map((r) => <option key={r.roleId} value={r.roleId}>{r.roleName}</option>)}</select></label>
              <label className="text-sm">Status<select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'active' | 'inactive' | 'pending' }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option value="active">ACTIVE</option><option value="pending">PENDING</option><option value="inactive">INACTIVE</option></select></label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button>
              <button onClick={createUser} className="rounded-lg bg-[#00C853] px-4 py-2 text-sm font-semibold text-white">Create User</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
