import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, RotateCcw } from 'lucide-react';
import { useToast } from './common';
import { SETTINGS_COLORS, systemSettingsService } from '../../services/systemSettings';

function useSnapshot() {
  const [tick, setTick] = useState(0);
  React.useEffect(() => systemSettingsService.subscribe(() => setTick((t) => t + 1)), []);
  return React.useMemo(() => systemSettingsService.getSnapshot(), [tick]);
}

export function SystemSettingsAuditPage() {
  const { audit } = useSnapshot();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('all');
  const [type, setType] = useState<'all' | 'MODIFIED' | 'ADDED' | 'REMOVED'>('all');
  const [changedBy, setChangedBy] = useState('all');
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');

  const sections = useMemo(() => Array.from(new Set(audit.map((a) => a.section))), [audit]);
  const users = useMemo(() => Array.from(new Set(audit.map((a) => a.changedBy))), [audit]);

  const filtered = useMemo(
    () =>
      audit.filter((row) => {
        if (section !== 'all' && row.section !== section) return false;
        if (type !== 'all' && row.changeType !== type) return false;
        if (changedBy !== 'all' && row.changedBy !== changedBy) return false;
        if (search && !`${row.setting} ${row.section} ${row.changedBy}`.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [audit, search, section, type, changedBy],
  );

  const compareRows = useMemo(() => {
    const a = audit.find((x) => x.id === compareA);
    const b = audit.find((x) => x.id === compareB);
    if (!a || !b) return null;
    return [a, b];
  }, [audit, compareA, compareB]);

  const revert = (id: string) => {
    const ok = systemSettingsService.revertByAuditId(id, 'Rajesh Kumar');
    if (ok) {
      showToast({ type: 'success', title: 'Setting reverted', message: 'Configuration value restored successfully.' });
    } else {
      showToast({ type: 'error', title: 'Revert failed', message: 'Audit record not found.' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings Audit Log</h1>
        <p className="text-sm text-slate-600">Track configuration changes and restore previous values.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by setting, section, user" className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
          <select value={section} onChange={(e) => setSection(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="all">All Sections</option>
            {sections.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={changedBy} onChange={(e) => setChangedBy(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="all">All Users</option>
            {users.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value as 'all' | 'MODIFIED' | 'ADDED' | 'REMOVED')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="all">All Change Types</option>
            <option value="MODIFIED">Modified</option>
            <option value="ADDED">Added</option>
            <option value="REMOVED">Removed</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left">Timestamp</th>
              <th className="px-3 py-2 text-left">Changed By</th>
              <th className="px-3 py-2 text-left">Section</th>
              <th className="px-3 py-2 text-left">Setting</th>
              <th className="px-3 py-2 text-left">Old</th>
              <th className="px-3 py-2 text-left">New</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-xs text-slate-600">{new Date(row.timestamp).toLocaleString()}</td>
                <td className="px-3 py-2">{row.changedBy}</td>
                <td className="px-3 py-2"><span className="rounded bg-slate-100 px-2 py-1 text-xs">{row.section}</span></td>
                <td className="px-3 py-2 font-mono text-xs">{row.setting}</td>
                <td className="px-3 py-2">{String(row.oldValue)}</td>
                <td className="px-3 py-2">{String(row.newValue)}</td>
                <td className="px-3 py-2">
                  <span
                    className="rounded px-2 py-1 text-xs font-semibold text-white"
                    style={{
                      backgroundColor:
                        row.changeType === 'ADDED'
                          ? SETTINGS_COLORS.success
                          : row.changeType === 'MODIFIED'
                            ? SETTINGS_COLORS.warning
                            : SETTINGS_COLORS.error,
                    }}
                  >
                    {row.changeType}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => revert(row.id)} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs" style={{ borderColor: SETTINGS_COLORS.error, color: SETTINGS_COLORS.error }}>
                    <RotateCcw size={12} /> Revert
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Compare Versions</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <select value={compareA} onChange={(e) => setCompareA(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select Version A</option>
            {audit.map((item) => <option key={`a-${item.id}`} value={item.id}>{new Date(item.timestamp).toLocaleString()} - {item.setting}</option>)}
          </select>
          <select value={compareB} onChange={(e) => setCompareB(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select Version B</option>
            {audit.map((item) => <option key={`b-${item.id}`} value={item.id}>{new Date(item.timestamp).toLocaleString()} - {item.setting}</option>)}
          </select>
          <button className="inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: SETTINGS_COLORS.info }}>
            <ArrowRightLeft size={14} /> Compare
          </button>
        </div>
        {compareRows ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {compareRows.map((row) => (
              <div key={row.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="font-semibold text-slate-900">{new Date(row.timestamp).toLocaleString()}</div>
                <div className="text-slate-500">{row.setting}</div>
                <div className="mt-1">{String(row.oldValue)} {'->'} {String(row.newValue)}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
