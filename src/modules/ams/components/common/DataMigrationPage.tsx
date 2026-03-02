import React, { useEffect, useMemo, useState } from 'react';
import { rbacService } from '../../services/rbac';
import {
  MigrationModule,
  MigrationStartOptions,
  ValidationRow,
  dataMigrationService,
} from '../../services/dataMigration';

const MODULE_LABELS: Record<MigrationModule, string> = {
  auctions: 'Historical Auctions',
  performance: 'Vendor Performance History',
  contracts: 'Past Contract Data',
};

export function DataMigrationPage() {
  const currentUserId = localStorage.getItem('optimile.currentUserId') || 'USR-ADM-1';
  const currentUser = rbacService.getUser(currentUserId);
  const isSuperAdmin = currentUser?.roleName === 'SUPER ADMIN';

  const [tick, setTick] = useState(0);
  const [step, setStep] = useState(1);
  const [module, setModule] = useState<MigrationModule>('auctions');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Array<Record<string, string>>>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validationRows, setValidationRows] = useState<ValidationRow[]>([]);
  const [options, setOptions] = useState<MigrationStartOptions>({
    lockRecordsFromEditing: true,
    createVendorsIfMissing: false,
    dryRun: false,
  });
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showRollbackJobId, setShowRollbackJobId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = dataMigrationService.subscribe(() => setTick((v) => v + 1));
    return unsub;
  }, []);

  const jobs = dataMigrationService.getJobs();
  const activeJob = activeJobId ? dataMigrationService.getJob(activeJobId) : undefined;

  const summary = useMemo(() => {
    const total = validationRows.length;
    const valid = validationRows.filter((r) => r.status === 'valid').length;
    const warning = validationRows.filter((r) => r.status === 'warning').length;
    const invalid = validationRows.filter((r) => r.status === 'error').length;
    return { total, valid, warning, invalid, ready: valid + warning };
  }, [validationRows]);

  const fields = dataMigrationService.getModuleFields(module);

  useEffect(() => {
    setMapping({});
    setValidationRows([]);
    setRawRows([]);
    setHeaders([]);
    setFile(null);
    setStep(1);
    setActiveJobId(null);
    setError('');
  }, [module]);

  const onUpload = async () => {
    if (!file) return;
    setError('');
    try {
      const parsed = await dataMigrationService.parseUpload(file);
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);
      setMapping(dataMigrationService.autoDetectMapping(module, parsed.headers));
      setStep(3);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const runValidation = () => {
    setError('');
    try {
      const mapped = dataMigrationService.mapRows(module, rawRows, mapping);
      const validation = dataMigrationService.validate(module, mapped, { createVendorsIfMissing: options.createVendorsIfMissing });
      setValidationRows(validation.rows);
      setStep(4);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const startMigration = () => {
    setError('');
    try {
      const start = dataMigrationService.startMigration(module, validationRows, options, currentUserId);
      setActiveJobId(start.jobId);
      setStep(5);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const rollback = (jobId: string) => {
    try {
      dataMigrationService.rollback(jobId);
      setShowRollbackJobId(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Data Migration</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="text-red-700 font-semibold">Super Admin access required</div>
          <div className="text-sm text-red-600 mt-1">
            Current user: {currentUser?.name || 'Unknown'} ({currentUser?.roleName || 'No role'})
          </div>
          <div className="text-xs text-red-600 mt-2">
            Set `localStorage.optimile.currentUserId = "USR-SUPER-1"` in this demo environment to access this one-time setup tool.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historical Data Migration</h1>
          <p className="text-slate-500">One-time setup tool for auctions, vendor performance, and contract history import.</p>
        </div>
        <div className="px-3 py-1 rounded-full text-xs bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200">Super Admin</div>
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <StepBar step={step} />

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        {step === 1 ? (
          <>
            <div className="text-lg font-semibold text-slate-900">1. Select Migration Module</div>
            <select className="border border-slate-300 rounded px-3 py-2 text-sm w-full md:w-96" value={module} onChange={(e) => setModule(e.target.value as MigrationModule)}>
              <option value="auctions">Historical Auctions</option>
              <option value="performance">Vendor Performance History</option>
              <option value="contracts">Past Contract Data</option>
            </select>
            <div className="text-sm text-slate-500">
              Selected: <span className="font-medium text-slate-700">{MODULE_LABELS[module]}</span>
            </div>
            <button className="px-4 py-2 rounded bg-blue-600 text-white text-sm" onClick={() => setStep(2)}>Next</button>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div className="text-lg font-semibold text-slate-900">2. Upload File</div>
            <div className="flex flex-wrap gap-2">
              <button
                className="px-3 py-2 rounded border border-slate-200 text-slate-700 text-sm"
                onClick={() => {
                  const headersForTemplate = fields.map((f) => f.label).join(',');
                  const blob = new Blob([`${headersForTemplate}\n`], { type: 'text/csv;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${module}-migration-template.csv`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
              >
                Download Template
              </button>
            </div>
            <label className="block rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Drag and drop CSV/Excel file (max 10MB) or choose file
              <input type="file" accept=".csv,.xls,.xlsx" className="mt-3" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            {file ? <div className="text-xs text-slate-500">{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</div> : null}
            <div className="flex items-center justify-between">
              <button className="px-3 py-2 rounded border border-slate-200 text-slate-600 text-sm" onClick={() => setStep(1)}>Back</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50" disabled={!file} onClick={onUpload}>Read File</button>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div className="text-lg font-semibold text-slate-900">3. Column Mapping</div>
            <div className="text-sm text-slate-500">Auto-detected mapping is prefilled. Adjust manually if needed.</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fields.map((f) => (
                <div key={f.key} className="border border-slate-200 rounded p-3">
                  <div className="text-xs text-slate-500">{f.label} {f.required ? <span className="text-red-600">*</span> : null}</div>
                  <select
                    className="mt-1 border border-slate-300 rounded px-2 py-1 text-sm w-full"
                    value={mapping[f.key] || ''}
                    onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
                  >
                    <option value="">-- Unmapped --</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <button className="px-3 py-2 rounded border border-slate-200 text-slate-600 text-sm" onClick={() => setStep(2)}>Back</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white text-sm" onClick={runValidation}>Validate Data</button>
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <div className="text-lg font-semibold text-slate-900">4. Validate & Preview</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat title="Total" value={`${summary.total}`} tone="blue" />
              <Stat title="Valid" value={`${summary.valid}`} tone="green" />
              <Stat title="Warnings" value={`${summary.warning}`} tone="amber" />
              <Stat title="Errors" value={`${summary.invalid}`} tone="red" />
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 text-left">Row</th>
                    <th className="px-2 py-2 text-left">Status</th>
                    <th className="px-2 py-2 text-left">Preview</th>
                    <th className="px-2 py-2 text-left">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {validationRows.slice(0, 50).map((r) => (
                    <tr key={r.rowNumber} className="border-t border-slate-100">
                      <td className="px-2 py-2">{r.rowNumber}</td>
                      <td className="px-2 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${r.status === 'valid' ? 'bg-green-100 text-green-700' : r.status === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-xs text-slate-600 max-w-[360px]">
                        {fields.slice(0, 3).map((f) => `${f.label}: ${String(r.data[f.key] || '-')}`).join(' • ')}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        {r.issues.length === 0 ? (
                          <span className="text-green-700">No issues</span>
                        ) : (
                          <div className="space-y-1">
                            {r.issues.slice(0, 2).map((issue, idx) => (
                              <div key={idx} className={issue.severity === 'error' ? 'text-red-700' : 'text-amber-700'}>{issue.message}</div>
                            ))}
                            {r.issues.length > 2 ? <div className="text-slate-500">+{r.issues.length - 2} more</div> : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-slate-500">Preview shows first 50 rows. Supports batch processing for 5000+ records.</div>
            <div className="flex items-center justify-between">
              <button className="px-3 py-2 rounded border border-slate-200 text-slate-600 text-sm" onClick={() => setStep(3)}>Back</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50" disabled={summary.ready === 0} onClick={() => setStep(5)}>
                Next: Confirm & Import
              </button>
            </div>
          </>
        ) : null}

        {step === 5 ? (
          <>
            <div className="text-lg font-semibold text-slate-900">5. Confirm & Import</div>
            <div className="space-y-2 text-sm">
              <label className="block"><input type="checkbox" checked={options.lockRecordsFromEditing} onChange={(e) => setOptions((o) => ({ ...o, lockRecordsFromEditing: e.target.checked }))} /> Lock records from editing</label>
              <label className="block"><input type="checkbox" checked={options.createVendorsIfMissing} onChange={(e) => setOptions((o) => ({ ...o, createVendorsIfMissing: e.target.checked }))} /> Create vendor records if not found</label>
              <label className="block"><input type="checkbox" checked={options.dryRun} onChange={(e) => setOptions((o) => ({ ...o, dryRun: e.target.checked }))} /> Dry-run mode (validate without writing)</label>
            </div>
            <div className="rounded border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
              Import Mode: {options.dryRun ? 'Dry-run only' : 'Import as Historical (read-only)'}
            </div>
            <div className="flex items-center justify-between">
              <button className="px-3 py-2 rounded border border-slate-200 text-slate-600 text-sm" onClick={() => setStep(4)}>Back</button>
              <button className="px-4 py-2 rounded bg-green-600 text-white text-sm" onClick={startMigration}>
                {options.dryRun ? 'Run Dry-Run' : 'Import as Historical'}
              </button>
            </div>
          </>
        ) : null}

        {step >= 5 && activeJob ? (
          <div className="rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="text-sm font-semibold text-slate-900">Migration Progress</div>
            <div className="text-xs text-slate-600">Job: {activeJob.jobId} • Module: {MODULE_LABELS[activeJob.module]}</div>
            <div className="h-2 bg-slate-100 rounded overflow-hidden">
              <div className="h-2 bg-blue-500" style={{ width: `${activeJob.totalRecords > 0 ? Math.round((activeJob.recordsProcessed / activeJob.totalRecords) * 100) : 0}%` }} />
            </div>
            <div className="text-xs text-slate-500">
              {activeJob.recordsProcessed}/{activeJob.totalRecords} processed • Status: {activeJob.status.toUpperCase()}
            </div>
            {activeJob.status === 'completed' && activeJob.report ? (
              <div className="pt-2 space-y-2">
                <div className="rounded border border-green-200 bg-green-50 p-3 text-xs text-green-700">
                  Completed. Data quality score: {activeJob.report.dataQualityScore}. {activeJob.report.impactSummary}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1 rounded border border-slate-200 text-slate-700 text-xs" onClick={() => dataMigrationService.downloadReport(activeJob.jobId)}>
                    Download Migration Report (PDF)
                  </button>
                  {activeJob.canRollback ? (
                    <button className="px-3 py-1 rounded border border-red-200 text-red-700 text-xs" onClick={() => setShowRollbackJobId(activeJob.jobId)}>
                      Rollback Migration
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="font-semibold text-slate-900">Migration History</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-2 py-2 text-left">Job ID</th>
                <th className="px-2 py-2 text-left">Module</th>
                <th className="px-2 py-2 text-left">Status</th>
                <th className="px-2 py-2 text-left">Processed</th>
                <th className="px-2 py-2 text-left">Started</th>
                <th className="px-2 py-2 text-left">Rollback</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.jobId} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-mono text-xs">{job.jobId}</td>
                  <td className="px-2 py-2">{MODULE_LABELS[job.module]}</td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${job.status === 'completed' ? 'bg-green-100 text-green-700' : job.status === 'processing' ? 'bg-blue-100 text-blue-700' : job.status === 'failed' ? 'bg-red-100 text-red-700' : job.status === 'rolled_back' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                      {job.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-2 py-2">{job.recordsProcessed}/{job.totalRecords}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{new Date(job.startedAt).toLocaleString()}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{job.rollbackDeadline ? new Date(job.rollbackDeadline).toLocaleString() : '-'}</td>
                  <td className="px-2 py-2 text-right">
                    <div className="inline-flex gap-1">
                      {job.report ? (
                        <button className="px-2 py-1 rounded border border-slate-200 text-xs text-slate-700" onClick={() => dataMigrationService.downloadReport(job.jobId)}>
                          Report
                        </button>
                      ) : null}
                      {job.canRollback ? (
                        <button className="px-2 py-1 rounded border border-red-200 text-xs text-red-700" onClick={() => setShowRollbackJobId(job.jobId)}>
                          Rollback
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500">No migration jobs yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {showRollbackJobId ? (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="text-lg font-semibold text-slate-900">Rollback Migration</div>
            <div className="text-sm text-slate-600">
              This will delete all imported historical records for job <span className="font-mono">{showRollbackJobId}</span> and restore pre-migration state.
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded border border-slate-200 text-slate-700 text-sm" onClick={() => setShowRollbackJobId(null)}>Cancel</button>
              <button className="px-3 py-2 rounded bg-red-600 text-white text-sm" onClick={() => rollback(showRollbackJobId)}>Confirm Rollback</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StepBar({ step }: { step: number }) {
  const labels = ['Module', 'Upload', 'Map Columns', 'Validate', 'Confirm', 'Complete'];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {labels.map((label, idx) => {
          const s = idx + 1;
          const active = s === step;
          const done = s < step;
          return (
            <div key={label} className={`rounded border px-2 py-1 text-xs text-center ${active ? 'bg-blue-50 border-blue-200 text-blue-700' : done ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <div className="font-semibold">Step {s}</div>
              <div>{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ title, value, tone }: { title: string; value: string; tone: 'blue' | 'green' | 'amber' | 'red' }) {
  const style =
    tone === 'green'
      ? 'bg-green-50 border-green-100 text-green-700'
      : tone === 'amber'
        ? 'bg-amber-50 border-amber-100 text-amber-700'
        : tone === 'red'
          ? 'bg-red-50 border-red-100 text-red-700'
          : 'bg-blue-50 border-blue-100 text-blue-700';
  return (
    <div className={`rounded border p-3 ${style}`}>
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}

