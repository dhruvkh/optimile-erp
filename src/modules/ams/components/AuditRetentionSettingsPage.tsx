import React, { useState } from 'react';
import { Archive, Database, HardDrive, Trash2 } from 'lucide-react';
import { AUDIT_COLORS, auditTrailService } from '../services/auditTrail';
import { useToast } from './common';

function useSnapshot() {
  const [tick, setTick] = useState(0);
  React.useEffect(() => auditTrailService.subscribe(() => setTick((t) => t + 1)), []);
  return React.useMemo(() => auditTrailService.getSnapshot(), [tick]);
}

export function AuditRetentionSettingsPage() {
  const { retention } = useSnapshot();
  const { showToast } = useToast();
  const [local, setLocal] = useState(retention);
  const [archiveDate, setArchiveDate] = useState('');

  React.useEffect(() => setLocal(retention), [retention]);

  const save = () => {
    auditTrailService.updateRetention(local);
    showToast({ type: 'success', title: 'Retention policy updated', message: 'Audit retention settings saved.' });
  };

  const runArchive = () => {
    if (!archiveDate) {
      showToast({ type: 'warning', title: 'Select date', message: 'Choose archive cutoff date first.' });
      return;
    }
    auditTrailService.archiveOlderThan(new Date(archiveDate).getTime());
    showToast({ type: 'success', title: 'Archive completed', message: `Logs older than ${archiveDate} archived.` });
  };

  const purgeArchived = () => {
    auditTrailService.purgeArchived();
    showToast({ type: 'warning', title: 'Archived logs purged', message: 'Archived logs were removed.' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Retention & Archival</h1>
        <p className="text-sm text-slate-600">Configure data retention periods, archival policy, and storage optimization.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Retention Configuration</h2>
        <div className="grid gap-3 md:grid-cols-5">
          <label className="text-sm">User Actions (months)<input type="number" value={local.userActionsMonths} onChange={(e) => setLocal((s) => ({ ...s, userActionsMonths: Number(e.target.value || 0) }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm">Security Events (months)<input type="number" value={local.securityEventsMonths} onChange={(e) => setLocal((s) => ({ ...s, securityEventsMonths: Number(e.target.value || 0) }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm">Data Changes (months)<input type="number" value={local.dataChangesMonths} onChange={(e) => setLocal((s) => ({ ...s, dataChangesMonths: Number(e.target.value || 0) }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm">System Events (months)<input type="number" value={local.systemEventsMonths} onChange={(e) => setLocal((s) => ({ ...s, systemEventsMonths: Number(e.target.value || 0) }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm">API Logs (months)<input type="number" value={local.apiLogsMonths} onChange={(e) => setLocal((s) => ({ ...s, apiLogsMonths: Number(e.target.value || 0) }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <label className="rounded border border-slate-200 p-3 text-sm">
            <input type="checkbox" checked={local.autoArchive} onChange={(e) => setLocal((s) => ({ ...s, autoArchive: e.target.checked }))} />
            <span className="ml-2">Auto-archive old logs</span>
          </label>
          <label className="text-sm">Archive after (days)<input type="number" value={local.archiveAfterDays} onChange={(e) => setLocal((s) => ({ ...s, archiveAfterDays: Number(e.target.value || 0) }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
          <label className="rounded border border-slate-200 p-3 text-sm">
            <input type="checkbox" checked={local.compressionEnabled} onChange={(e) => setLocal((s) => ({ ...s, compressionEnabled: e.target.checked }))} />
            <span className="ml-2">Compress archives</span>
          </label>
          <label className="text-sm">Storage Location
            <select value={local.storageLocation} onChange={(e) => setLocal((s) => ({ ...s, storageLocation: e.target.value as 'Database' | 'S3' | 'Azure Blob' }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-2">
              <option>Database</option>
              <option>S3</option>
              <option>Azure Blob</option>
            </select>
          </label>
        </div>

        <button onClick={save} className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: AUDIT_COLORS.success }}>Save Retention Policy</button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-700"><Database size={16} /> Active Logs</div>
          <div className="mt-2 text-3xl font-bold" style={{ color: AUDIT_COLORS.success }}>{local.activeLogsGB.toFixed(1)} GB</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-700"><Archive size={16} /> Archived Logs</div>
          <div className="mt-2 text-3xl font-bold" style={{ color: AUDIT_COLORS.info }}>{local.archivedLogsGB.toFixed(1)} GB</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-700"><HardDrive size={16} /> Storage Alert Threshold</div>
          <div className="mt-2 text-3xl font-bold" style={{ color: local.activeLogsGB + local.archivedLogsGB > local.alertAtGB ? AUDIT_COLORS.error : AUDIT_COLORS.warning }}>{local.alertAtGB.toFixed(0)} GB</div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Manual Archive Actions</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input type="date" value={archiveDate} onChange={(e) => setArchiveDate(e.target.value)} className="rounded border border-slate-300 px-3 py-2" />
          <button onClick={runArchive} className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: AUDIT_COLORS.info }}><Archive size={14} /> Archive Logs Older Than</button>
          <button onClick={purgeArchived} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: AUDIT_COLORS.error, color: AUDIT_COLORS.error }}><Trash2 size={14} /> Purge Archived Logs</button>
        </div>
        <div className="mt-3 rounded-lg p-3 text-sm" style={{ backgroundColor: '#fff8e1', color: '#7a5a00' }}>
          Compliance note: Ensure retention periods meet regulatory requirements (GDPR, SOC2, etc.).
        </div>
      </section>
    </div>
  );
}
