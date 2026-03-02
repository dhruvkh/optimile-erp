import React, { useEffect, useMemo, useState } from 'react';
import {
  BULK_VENDOR_THEME,
  VendorImportRun,
  VendorImportSettings,
  VendorImportValidationRow,
  vendorBulkImportService,
} from '../../services/vendorBulkImport';

type UploadMethod = 'template' | 'upload' | 'paste';

const DEFAULT_SETTINGS: VendorImportSettings = {
  vendorStatus: 'pending',
  sendCredentials: true,
  sendSms: false,
  requireApproval: true,
  notifyAdmin: true,
  notifyProcurement: false,
  skipDuplicates: false,
  validateAgainstDatabase: true,
};

export function VendorBulkImportPage() {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<UploadMethod>('upload');
  const [pasteData, setPasteData] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<VendorImportValidationRow[]>([]);
  const [settings, setSettings] = useState<VendorImportSettings>(DEFAULT_SETTINGS);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<VendorImportRun | null>(null);
  const [importedFilter, setImportedFilter] = useState<'all' | 'valid' | 'warning' | 'error'>('all');

  const summary = useMemo(() => {
    const total = rows.length;
    const valid = rows.filter((r) => r.status === 'valid').length;
    const warning = rows.filter((r) => r.status === 'warning').length;
    const failed = rows.filter((r) => r.status === 'error').length;
    return {
      total,
      valid,
      warning,
      failed,
      ready: valid + warning,
      validPct: total > 0 ? Math.round(((valid + warning) / total) * 100) : 0,
      warningPct: total > 0 ? Math.round((warning / total) * 100) : 0,
      errorPct: total > 0 ? Math.round((failed / total) * 100) : 0,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (importedFilter === 'all') return rows;
    return rows.filter((r) => r.status === importedFilter);
  }, [rows, importedFilter]);

  useEffect(() => {
    if (importProgress >= 100 && busy) {
      setBusy(false);
    }
  }, [busy, importProgress]);

  const updateRow = (rowNumber: number, patch: Partial<VendorImportValidationRow['data']>) => {
    setRows((prev) =>
      prev.map((r) => (r.rowNumber === rowNumber ? { ...r, data: { ...r.data, ...patch } } : r)),
    );
  };

  const revalidate = () => {
    const next = vendorBulkImportService.validateRows(rows.map((r) => r.data));
    setRows(next.rows);
  };

  const parseInput = async () => {
    setBusy(true);
    setUploadProgress(0);
    setError('');
    setImportResult(null);
    try {
      setUploadProgress(20);
      let parsedRows = [] as ReturnType<typeof vendorBulkImportService.parseFromText>;
      if (method === 'paste') {
        parsedRows = vendorBulkImportService.parseFromText(pasteData);
      } else {
        if (!file) throw new Error('Please choose a file first.');
        parsedRows = await vendorBulkImportService.parseFromFile(file);
      }
      setUploadProgress(55);
      const validation = vendorBulkImportService.validateRows(parsedRows);
      setUploadProgress(100);
      setRows(validation.rows);
      setStep(3);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const applyAutoFixes = () => {
    const fixed = vendorBulkImportService.applyAutoFixes(rows);
    setRows(fixed);
    const validation = vendorBulkImportService.validateRows(fixed.map((r) => r.data));
    setRows(validation.rows);
  };

  const startImport = async () => {
    setError('');
    setBusy(true);
    setImportProgress(0);
    setStep(7);
    const eligibleRows = rows.filter((r) => r.status !== 'error');
    const timer = window.setInterval(() => {
      setImportProgress((p) => (p >= 92 ? p : p + 8));
    }, 220);

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      const result = vendorBulkImportService.executeImport(
        file?.name || 'pasted-vendors.csv',
        eligibleRows,
        'USR-ADM-1',
        settings,
      );
      setImportResult(result);
      setImportProgress(100);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      window.clearInterval(timer);
      setBusy(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setMethod('upload');
    setPasteData('');
    setFile(null);
    setBusy(false);
    setUploadProgress(0);
    setError('');
    setRows([]);
    setEditingRow(null);
    setImportProgress(0);
    setImportResult(null);
    setImportedFilter('all');
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Import Vendors</h1>
        <p className="text-slate-500">Add multiple vendors with upload, validation, preview, and approval-ready onboarding.</p>
      </div>

      <StepBar currentStep={step} />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {step === 1 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="text-lg font-semibold text-slate-900">Step 1: Download template and choose input method</div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <MethodCard
              title="Start with Template"
              description="Download sample template with 3 vendor examples."
              active={method === 'template'}
              onClick={() => setMethod('template')}
              borderClass="border-blue-200"
            >
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-2 rounded bg-blue-600 text-white text-sm" onClick={() => vendorBulkImportService.downloadTemplate('excel')}>
                  Download Excel Template
                </button>
                <button className="px-3 py-2 rounded bg-blue-50 text-blue-700 border border-blue-200 text-sm" onClick={() => vendorBulkImportService.downloadTemplate('csv')}>
                  Download CSV Template
                </button>
              </div>
            </MethodCard>

            <MethodCard
              title="Upload Existing File"
              description="Upload .xlsx, .xls, or .csv up to 10 MB and 500 rows."
              active={method === 'upload'}
              onClick={() => setMethod('upload')}
              borderClass="border-green-200"
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block text-sm text-slate-600"
              />
              {file ? <div className="text-xs text-slate-500 mt-2">{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</div> : null}
            </MethodCard>

            <MethodCard
              title="Copy & Paste"
              description="Paste data directly from Excel/Sheets."
              active={method === 'paste'}
              onClick={() => setMethod('paste')}
              borderClass="border-amber-200"
            >
              <textarea
                className="w-full border border-slate-300 rounded p-2 text-sm min-h-[110px]"
                placeholder="Paste tab-separated or comma-separated vendor data..."
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
              />
            </MethodCard>
          </div>

          {busy ? (
            <div className={`rounded border border-blue-100 ${BULK_VENDOR_THEME.infoBg} p-3`}>
              <div className="text-sm text-slate-700">Processing... {uploadProgress}%</div>
              <div className="h-2 bg-blue-100 rounded mt-2 overflow-hidden">
                <div className="h-2 bg-blue-500 rounded" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <button className="px-3 py-2 rounded border border-slate-200 text-slate-600" onClick={resetAll}>Reset</button>
            <button className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" onClick={parseInput} disabled={busy || (method === 'upload' && !file) || (method === 'paste' && !pasteData.trim())}>
              Validate & Preview
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-slate-900">Step 3: Validation & Preview</div>
              <div className="text-sm text-slate-500">Review valid rows, warnings, and errors before import.</div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 rounded border border-slate-200 text-slate-700 text-sm" onClick={applyAutoFixes}>Apply Auto-Fixes</button>
              <button className="px-3 py-2 rounded border border-slate-200 text-slate-700 text-sm" onClick={revalidate}>Re-Validate</button>
              <button className="px-3 py-2 rounded border border-red-200 text-red-700 text-sm" onClick={() => vendorBulkImportService.downloadErrorReport(rows)}>Download Error Report</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <SummaryStat label="Total Rows" value={`${summary.total}`} panelClass="bg-blue-50 border-blue-100" valueClass="text-blue-700" />
            <SummaryStat label="Valid" value={`${summary.valid}`} panelClass="bg-green-50 border-green-100" valueClass="text-green-700" />
            <SummaryStat label="Warnings" value={`${summary.warning}`} panelClass="bg-amber-50 border-amber-100" valueClass="text-amber-700" />
            <SummaryStat label="Errors" value={`${summary.failed}`} panelClass="bg-red-50 border-red-100" valueClass="text-red-700" />
            <SummaryStat label="Ready to Import" value={`${summary.ready}`} panelClass="bg-emerald-50 border-emerald-100" valueClass="text-emerald-700" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <ProgressLegend label="Valid + Warning" pct={summary.validPct} barClass="bg-green-500" />
            <ProgressLegend label="Warnings" pct={summary.warningPct} barClass="bg-amber-500" />
            <ProgressLegend label="Errors" pct={summary.errorPct} barClass="bg-red-500" />
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterChip label="All" active={importedFilter === 'all'} onClick={() => setImportedFilter('all')} />
            <FilterChip label="Valid" active={importedFilter === 'valid'} onClick={() => setImportedFilter('valid')} />
            <FilterChip label="Warnings" active={importedFilter === 'warning'} onClick={() => setImportedFilter('warning')} />
            <FilterChip label="Errors" active={importedFilter === 'error'} onClick={() => setImportedFilter('error')} />
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-2 text-left">Row</th>
                  <th className="px-2 py-2 text-left">Status</th>
                  <th className="px-2 py-2 text-left">Company</th>
                  <th className="px-2 py-2 text-left">Contact</th>
                  <th className="px-2 py-2 text-left">Email</th>
                  <th className="px-2 py-2 text-left">Phone</th>
                  <th className="px-2 py-2 text-left">PAN</th>
                  <th className="px-2 py-2 text-left">GST</th>
                  <th className="px-2 py-2 text-left">Issues</th>
                  <th className="px-2 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const bg =
                    row.status === 'valid'
                      ? 'bg-green-50'
                      : row.status === 'warning'
                        ? 'bg-amber-50'
                        : 'bg-red-50';
                  return (
                    <React.Fragment key={row.rowNumber}>
                      <tr className={`border-t border-slate-100 ${bg}`}>
                        <td className="px-2 py-2">{row.rowNumber}</td>
                        <td className="px-2 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${row.status === 'valid' ? 'bg-green-100 text-green-700' : row.status === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {row.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-2 py-2">{row.data.companyName || '-'}</td>
                        <td className="px-2 py-2">{row.data.contactPersonName || '-'}</td>
                        <td className="px-2 py-2">{row.data.email || '-'}</td>
                        <td className="px-2 py-2">{row.data.phone || '-'}</td>
                        <td className="px-2 py-2">{row.data.pan || '-'}</td>
                        <td className="px-2 py-2">{row.data.gstin || '-'}</td>
                        <td className="px-2 py-2 max-w-[360px]">
                          {row.issues.length === 0 ? (
                            <span className="text-green-700 text-xs">None</span>
                          ) : (
                            <div className="space-y-1">
                              {row.issues.slice(0, 2).map((issue, idx) => (
                                <div key={idx} className={`text-xs ${issue.severity === 'error' ? 'text-red-700' : issue.severity === 'warning' ? 'text-amber-700' : 'text-blue-700'}`}>
                                  {issue.message}
                                </div>
                              ))}
                              {row.issues.length > 2 ? <div className="text-xs text-slate-500">+{row.issues.length - 2} more</div> : null}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button className="px-2 py-1 rounded border border-slate-200 text-xs text-slate-700" onClick={() => setEditingRow(editingRow === row.rowNumber ? null : row.rowNumber)}>
                            {editingRow === row.rowNumber ? 'Close' : row.status === 'error' ? 'Fix Now' : 'Edit'}
                          </button>
                        </td>
                      </tr>

                      {editingRow === row.rowNumber ? (
                        <tr className="border-t border-slate-100">
                          <td className="px-3 py-3" colSpan={10}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <input className="border border-slate-300 rounded px-2 py-1 text-sm" placeholder="Company Name" value={row.data.companyName} onChange={(e) => updateRow(row.rowNumber, { companyName: e.target.value })} />
                              <input className="border border-slate-300 rounded px-2 py-1 text-sm" placeholder="Contact Person" value={row.data.contactPersonName} onChange={(e) => updateRow(row.rowNumber, { contactPersonName: e.target.value })} />
                              <input className="border border-slate-300 rounded px-2 py-1 text-sm" placeholder="Email" value={row.data.email} onChange={(e) => updateRow(row.rowNumber, { email: e.target.value })} />
                              <input className="border border-slate-300 rounded px-2 py-1 text-sm" placeholder="Phone" value={row.data.phone} onChange={(e) => updateRow(row.rowNumber, { phone: e.target.value })} />
                              <input className="border border-slate-300 rounded px-2 py-1 text-sm" placeholder="PAN" value={row.data.pan} onChange={(e) => updateRow(row.rowNumber, { pan: e.target.value })} />
                              <input className="border border-slate-300 rounded px-2 py-1 text-sm" placeholder="GST" value={row.data.gstin} onChange={(e) => updateRow(row.rowNumber, { gstin: e.target.value })} />
                            </div>
                            <div className="mt-2 flex gap-2">
                              <button className="px-3 py-1 rounded bg-green-600 text-white text-xs" onClick={revalidate}>Save Fix</button>
                              <button className="px-3 py-1 rounded border border-slate-200 text-slate-600 text-xs" onClick={() => setEditingRow(null)}>Cancel</button>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button className="px-3 py-2 rounded border border-slate-200 text-slate-600" onClick={() => setStep(1)}>Back</button>
            <div className="flex gap-2">
              <button className="px-3 py-2 rounded border border-slate-200 text-slate-700" onClick={() => setRows(rows.filter((r) => r.status !== 'error'))}>
                Import Valid Rows Only
              </button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" onClick={() => setStep(4)} disabled={summary.ready === 0}>
                Next: Document & Settings
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="text-lg font-semibold text-slate-900">Step 4: Document workflow note</div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Imported vendors are created with pending verification until mandatory documents are uploaded and reviewed.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="border border-slate-200 rounded-lg p-3">
              <div className="font-semibold mb-2">Required Documents</div>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>PAN Card</li>
                <li>GST Certificate</li>
                <li>Certificate of Incorporation</li>
                <li>Cancelled Cheque / Bank details</li>
                <li>Vehicle RCs and Insurance</li>
                <li>GPS Device Certificates</li>
              </ul>
            </div>
            <div className="border border-slate-200 rounded-lg p-3">
              <label className="inline-flex items-center gap-2 text-slate-700">
                <input type="checkbox" checked={settings.requireApproval} onChange={(e) => setSettings((s) => ({ ...s, requireApproval: e.target.checked }))} />
                Require admin approval before activation
              </label>
              <label className="inline-flex items-center gap-2 text-slate-700 mt-3">
                <input type="checkbox" checked={settings.sendCredentials} onChange={(e) => setSettings((s) => ({ ...s, sendCredentials: e.target.checked }))} />
                Send welcome email with credentials
              </label>
              <label className="inline-flex items-center gap-2 text-slate-700 mt-3">
                <input type="checkbox" checked={settings.sendSms} onChange={(e) => setSettings((s) => ({ ...s, sendSms: e.target.checked }))} />
                Send SMS with portal access details
              </label>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button className="px-3 py-2 rounded border border-slate-200 text-slate-600" onClick={() => setStep(3)}>Back</button>
            <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={() => setStep(5)}>Next: Import Settings</button>
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="text-lg font-semibold text-slate-900">Step 5: Import settings</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-lg p-3 space-y-2 text-sm">
              <div className="font-semibold">Vendor Status</div>
              <label className="block"><input type="radio" name="vendorStatus" checked={settings.vendorStatus === 'active'} onChange={() => setSettings((s) => ({ ...s, vendorStatus: 'active' }))} /> Active</label>
              <label className="block"><input type="radio" name="vendorStatus" checked={settings.vendorStatus === 'pending'} onChange={() => setSettings((s) => ({ ...s, vendorStatus: 'pending' }))} /> Pending Verification</label>
              <label className="block"><input type="radio" name="vendorStatus" checked={settings.vendorStatus === 'inactive'} onChange={() => setSettings((s) => ({ ...s, vendorStatus: 'inactive' }))} /> Inactive</label>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 space-y-2 text-sm">
              <div className="font-semibold">Options</div>
              <label className="block"><input type="checkbox" checked={settings.notifyAdmin} onChange={(e) => setSettings((s) => ({ ...s, notifyAdmin: e.target.checked }))} /> Notify admin of new imports</label>
              <label className="block"><input type="checkbox" checked={settings.notifyProcurement} onChange={(e) => setSettings((s) => ({ ...s, notifyProcurement: e.target.checked }))} /> Notify procurement team</label>
              <label className="block"><input type="checkbox" checked={settings.skipDuplicates} onChange={(e) => setSettings((s) => ({ ...s, skipDuplicates: e.target.checked }))} /> Skip duplicates silently</label>
              <label className="block"><input type="checkbox" checked={settings.validateAgainstDatabase} onChange={(e) => setSettings((s) => ({ ...s, validateAgainstDatabase: e.target.checked }))} /> Validate against existing database</label>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button className="px-3 py-2 rounded border border-slate-200 text-slate-600" onClick={() => setStep(4)}>Back</button>
            <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={() => setStep(6)}>Next: Review</button>
          </div>
        </div>
      ) : null}

      {step === 6 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="text-lg font-semibold text-slate-900">Step 6: Review & Confirm</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <SummaryStat label="Vendors to Import" value={`${summary.ready}`} panelClass="bg-blue-50 border-blue-100" valueClass="text-blue-700" />
            <SummaryStat label="Total Fleet Size" value={`${rows.reduce((acc, r) => acc + (r.data.fleetOwned || 0) + (r.data.fleetLeased || 0), 0)}`} panelClass="bg-green-50 border-green-100" valueClass="text-green-700" />
            <SummaryStat label="Coverage States" value={`${new Set(rows.map((r) => r.data.state).filter(Boolean)).size}`} panelClass="bg-amber-50 border-amber-100" valueClass="text-amber-700" />
            <SummaryStat label="With References" value={`${rows.filter((r) => r.data.reference1Name || r.data.reference2Name).length}`} panelClass="bg-emerald-50 border-emerald-100" valueClass="text-emerald-700" />
            <SummaryStat label="Pending Docs" value={`${summary.ready}`} panelClass="bg-slate-100 border-slate-200" valueClass="text-slate-700" />
          </div>

          <div className="border border-slate-200 rounded-lg p-3">
            <div className="font-semibold text-slate-900 mb-2">Ready Vendor List</div>
            <div className="max-h-56 overflow-auto space-y-2">
              {rows.filter((r) => r.status !== 'error').map((row) => (
                <div key={row.rowNumber} className="flex items-center justify-between border border-slate-100 rounded px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium text-slate-800">{row.data.companyName || 'Unnamed Vendor'}</div>
                    <div className="text-xs text-slate-500">{row.data.contactPersonName} • {row.data.state}</div>
                  </div>
                  <button
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => setRows((prev) => prev.filter((r) => r.rowNumber !== row.rowNumber))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button className="px-3 py-2 rounded border border-slate-200 text-slate-600" onClick={() => setStep(5)}>Back</button>
            <button className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50" onClick={startImport} disabled={busy || summary.ready === 0}>
              Import {summary.ready} Vendors
            </button>
          </div>
        </div>
      ) : null}

      {step === 7 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="text-lg font-semibold text-slate-900">{importResult ? 'Import Completed' : 'Importing Vendors...'}</div>
          {!importResult ? (
            <div>
              <div className="text-sm text-slate-600">Creating vendor records in batch...</div>
              <div className="h-3 bg-slate-100 rounded mt-2 overflow-hidden">
                <div className="h-3 bg-green-500 rounded transition-all" style={{ width: `${importProgress}%` }} />
              </div>
              <div className="text-xs text-slate-500 mt-2">{importProgress}% complete</div>
            </div>
          ) : null}

          {importResult ? (
            <div className={`rounded-lg border p-4 ${importResult.status === 'completed' ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className={`font-semibold ${importResult.status === 'completed' ? 'text-green-700' : 'text-amber-700'}`}>
                {importResult.status === 'completed' ? 'Import Successful' : 'Import Completed with Issues'}
              </div>
              <div className="text-sm text-slate-700 mt-1">
                {importResult.importedRows} of {importResult.validRows + importResult.warningRows} vendors imported.
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Import ID: {importResult.importId} • Duration: {importResult.durationSec}s
              </div>

              {importResult.failures.length > 0 ? (
                <div className="mt-3 space-y-1 text-xs">
                  {importResult.failures.map((f) => (
                    <div key={`${f.rowNumber}-${f.companyName}`} className="text-red-700">
                      Row {f.rowNumber}: {f.companyName} - {f.reason}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <a href="#/admin/vendors?filter=recently_imported" className="px-3 py-2 rounded bg-green-600 text-white text-sm">View Imported Vendors</a>
                <a href="#/admin/vendors/import-history" className="px-3 py-2 rounded border border-slate-200 text-slate-700 text-sm">View Import History</a>
                <button className="px-3 py-2 rounded border border-slate-200 text-slate-700 text-sm" onClick={resetAll}>Import More Vendors</button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MethodCard({
  title,
  description,
  children,
  active,
  onClick,
  borderClass,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  borderClass: string;
}) {
  return (
    <div className={`rounded-xl border p-4 space-y-3 cursor-pointer ${active ? `${borderClass} bg-slate-50` : 'border-slate-200 bg-white'}`} onClick={onClick}>
      <div>
        <div className="font-semibold text-slate-900">{title}</div>
        <div className="text-sm text-slate-500">{description}</div>
      </div>
      {children}
    </div>
  );
}

function StepBar({ currentStep }: { currentStep: number }) {
  const steps = [
    'Upload Method',
    'Template/Upload',
    'Validation',
    'Documents',
    'Settings',
    'Review',
    'Import',
  ];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
        {steps.map((label, idx) => {
          const step = idx + 1;
          const active = step === currentStep;
          const done = step < currentStep;
          return (
            <div key={label} className={`rounded px-2 py-2 text-xs text-center border ${active ? 'bg-blue-50 border-blue-200 text-blue-700' : done ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <div className="font-semibold">Step {step}</div>
              <div>{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  panelClass,
  valueClass,
}: {
  label: string;
  value: string;
  panelClass: string;
  valueClass: string;
}) {
  return (
    <div className={`rounded border p-3 ${panelClass}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-xl font-bold mt-1 ${valueClass}`}>{value}</div>
    </div>
  );
}

function ProgressLegend({ label, pct, barClass }: { label: string; pct: number; barClass: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-slate-600 mb-1">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded overflow-hidden">
        <div className={`h-2 ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`px-3 py-1 rounded-full text-xs border ${active ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`} onClick={onClick}>
      {label}
    </button>
  );
}

