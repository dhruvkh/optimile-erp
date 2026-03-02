import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ContractImportOptions,
  ContractImportValidationRow,
  contractImportService,
} from '../../services/contractImport';

const DEFAULT_OPTIONS: ContractImportOptions = {
  createVendorsIfMissing: false,
  autoGenerateMissingContractIds: true,
  linkToExistingAuctions: false,
  statusOverride: 'DRAFT',
  duplicateHandling: 'skip',
  generateDocuments: false,
  sendNotifications: false,
};

export function ContractImportPage() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<ContractImportValidationRow[]>([]);
  const [options, setOptions] = useState<ContractImportOptions>(DEFAULT_OPTIONS);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const summary = useMemo(() => {
    const total = rows.length;
    const valid = rows.filter((r) => r.status === 'valid').length;
    const warning = rows.filter((r) => r.status === 'warning').length;
    const invalid = rows.filter((r) => r.status === 'error').length;
    return { total, valid, warning, invalid, ready: valid + warning };
  }, [rows]);

  const updateField = (key: string, field: keyof ContractImportValidationRow['data'], value: any) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, data: { ...r.data, [field]: value } } : r)));
  };

  const revalidate = () => {
    const validation = contractImportService.validateCandidates(
      rows.map((r) => ({ key: r.key, data: r.data })),
      options,
    );
    setRows(validation.rows);
  };

  const onValidateFile = async () => {
    if (!file) return;
    setError('');
    setBusy(true);
    setProgress(8);
    try {
      const parsed = await contractImportService.parseFile(file);
      setProgress(30);
      const candidates = contractImportService.toCandidates(parsed);
      setProgress(65);
      const validation = contractImportService.validateCandidates(candidates, options);
      setRows(validation.rows);
      setProgress(100);
      setStep(3);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onImport = async () => {
    setBusy(true);
    setProgress(0);
    setStep(6);
    const timer = window.setInterval(() => {
      setProgress((p) => (p >= 92 ? p : p + 7));
    }, 180);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      const res = contractImportService.importContracts(rows, options, 'USR-ADM-1');
      setResult(res);
      setProgress(100);
      setStep(7);
    } catch (e) {
      setError((e as Error).message);
      setStep(5);
    } finally {
      window.clearInterval(timer);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Import Contracts</h1>
          <p className="text-slate-500">Migrate existing contracts into Optimile AMS using CSV/Excel template.</p>
        </div>
        <Link to="/contracts" className="px-3 py-2 rounded border border-slate-200 text-slate-700 text-sm">Back to Contracts</Link>
      </div>

      <StepBar step={step} />

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      {step === 1 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="text-lg font-semibold text-slate-900">Step 1: Download Template</div>
          <div className="text-sm text-slate-500">Use the standard template with required contract and lane columns.</div>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-2 rounded bg-blue-600 text-white text-sm" onClick={() => contractImportService.downloadTemplate('excel')}>Download Excel</button>
            <button className="px-3 py-2 rounded border border-slate-200 text-slate-700 text-sm" onClick={() => contractImportService.downloadTemplate('csv')}>Download CSV</button>
          </div>
          <div className="text-xs text-slate-500">Max file size: 10MB • Max contract rows: 200</div>
          <div className="pt-2">
            <button className="px-4 py-2 rounded bg-slate-900 text-white text-sm" onClick={() => setStep(2)}>Next: Upload File</button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="text-lg font-semibold text-slate-900">Step 2: Upload File</div>
          <label className="block rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            <div>Drag and drop your file here, or choose file</div>
            <input type="file" accept=".xlsx,.xls,.csv" className="mt-3 text-sm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {file ? (
            <div className="rounded border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
              Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </div>
          ) : null}
          {busy ? (
            <div className="rounded border border-blue-100 bg-blue-50 p-3">
              <div className="text-sm text-blue-700">Processing... {progress}%</div>
              <div className="h-2 mt-2 bg-blue-100 rounded overflow-hidden"><div className="h-2 bg-blue-500" style={{ width: `${progress}%` }} /></div>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <button className="px-3 py-2 rounded border border-slate-200 text-slate-600 text-sm" onClick={() => setStep(1)}>Back</button>
            <button className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50" disabled={!file || busy} onClick={onValidateFile}>Validate File</button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-slate-900">Step 3: Validation & Preview</div>
              <div className="text-sm text-slate-500">Fix errors inline before importing contracts.</div>
            </div>
            <button className="px-3 py-2 rounded border border-slate-200 text-slate-700 text-sm" onClick={revalidate}>Re-Validate</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Stat title="Total" value={`${summary.total}`} panelClass="bg-blue-50 border-blue-100" valueClass="text-blue-700" />
            <Stat title="Valid" value={`${summary.valid}`} panelClass="bg-green-50 border-green-100" valueClass="text-green-700" />
            <Stat title="Warnings" value={`${summary.warning}`} panelClass="bg-amber-50 border-amber-100" valueClass="text-amber-700" />
            <Stat title="Errors" value={`${summary.invalid}`} panelClass="bg-red-50 border-red-100" valueClass="text-red-700" />
            <Stat title="Ready" value={`${summary.ready}`} panelClass="bg-emerald-50 border-emerald-100" valueClass="text-emerald-700" />
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-2 text-left">Status</th>
                  <th className="px-2 py-2 text-left">Contract ID</th>
                  <th className="px-2 py-2 text-left">Vendor</th>
                  <th className="px-2 py-2 text-left">Start</th>
                  <th className="px-2 py-2 text-left">End</th>
                  <th className="px-2 py-2 text-left">Value</th>
                  <th className="px-2 py-2 text-left">Lanes</th>
                  <th className="px-2 py-2 text-left">Issues</th>
                  <th className="px-2 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <React.Fragment key={row.key}>
                    <tr className={`border-t border-slate-100 ${row.status === 'error' ? 'bg-red-50' : row.status === 'warning' ? 'bg-amber-50' : 'bg-green-50'}`}>
                      <td className="px-2 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${row.status === 'error' ? 'bg-red-100 text-red-700' : row.status === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {row.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-2 py-2">{row.data.contractId || 'AUTO'}</td>
                      <td className="px-2 py-2">{row.data.vendorName || row.data.vendorId || '-'}</td>
                      <td className="px-2 py-2">{row.data.startDate}</td>
                      <td className="px-2 py-2">{row.data.endDate}</td>
                      <td className="px-2 py-2">₹{row.data.contractValue.toLocaleString()}</td>
                      <td className="px-2 py-2">{row.data.lanes.length}</td>
                      <td className="px-2 py-2">
                        <div className="space-y-1">
                          {row.issues.slice(0, 2).map((issue, idx) => (
                            <div key={idx} className={`text-xs ${issue.severity === 'error' ? 'text-red-700' : 'text-amber-700'}`}>{issue.message}</div>
                          ))}
                          {row.issues.length > 2 ? <div className="text-xs text-slate-500">+{row.issues.length - 2} more</div> : null}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button className="px-2 py-1 rounded border border-slate-200 text-xs text-slate-700" onClick={() => setEditingKey(editingKey === row.key ? null : row.key)}>
                          {editingKey === row.key ? 'Close' : 'Edit'}
                        </button>
                      </td>
                    </tr>
                    {editingKey === row.key ? (
                      <tr className="border-t border-slate-100">
                        <td colSpan={9} className="px-3 py-3">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input className="border border-slate-300 rounded px-2 py-1 text-sm" value={row.data.contractId || ''} placeholder="Contract ID" onChange={(e) => updateField(row.key, 'contractId', e.target.value)} />
                            <input className="border border-slate-300 rounded px-2 py-1 text-sm" value={row.data.vendorName} placeholder="Vendor Name" onChange={(e) => updateField(row.key, 'vendorName', e.target.value)} />
                            <input className="border border-slate-300 rounded px-2 py-1 text-sm" value={row.data.startDate} placeholder="DD/MM/YYYY" onChange={(e) => updateField(row.key, 'startDate', e.target.value)} />
                            <input className="border border-slate-300 rounded px-2 py-1 text-sm" value={row.data.endDate} placeholder="DD/MM/YYYY" onChange={(e) => updateField(row.key, 'endDate', e.target.value)} />
                            <input className="border border-slate-300 rounded px-2 py-1 text-sm" value={row.data.contractValue} placeholder="Contract Value" onChange={(e) => updateField(row.key, 'contractValue', Number(e.target.value) || 0)} />
                            <input className="border border-slate-300 rounded px-2 py-1 text-sm" value={row.data.paymentTerms} placeholder="Payment Terms" onChange={(e) => updateField(row.key, 'paymentTerms', e.target.value)} />
                          </div>
                          <div className="mt-2">
                            <button className="px-3 py-1 rounded bg-green-600 text-white text-xs" onClick={revalidate}>Save Fix</button>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button className="px-3 py-2 rounded border border-slate-200 text-slate-600 text-sm" onClick={() => setStep(2)}>Back</button>
            <button className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50" disabled={summary.ready === 0} onClick={() => setStep(5)}>
              Next: Import Options
            </button>
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="text-lg font-semibold text-slate-900">Step 5: Import Options</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="border border-slate-200 rounded p-3 space-y-2">
              <label className="block"><input type="checkbox" checked={options.createVendorsIfMissing} onChange={(e) => setOptions((s) => ({ ...s, createVendorsIfMissing: e.target.checked }))} /> Create vendors if not found</label>
              <label className="block"><input type="checkbox" checked={options.autoGenerateMissingContractIds} onChange={(e) => setOptions((s) => ({ ...s, autoGenerateMissingContractIds: e.target.checked }))} /> Auto-generate missing contract IDs</label>
              <label className="block"><input type="checkbox" checked={options.linkToExistingAuctions} onChange={(e) => setOptions((s) => ({ ...s, linkToExistingAuctions: e.target.checked }))} /> Link to existing auctions</label>
              <label className="block"><input type="checkbox" checked={options.generateDocuments} onChange={(e) => setOptions((s) => ({ ...s, generateDocuments: e.target.checked }))} /> Generate contract documents</label>
              <label className="block"><input type="checkbox" checked={options.sendNotifications} onChange={(e) => setOptions((s) => ({ ...s, sendNotifications: e.target.checked }))} /> Send notifications</label>
            </div>
            <div className="border border-slate-200 rounded p-3 space-y-3">
              <label className="block">
                <span className="text-slate-600 text-xs">Status</span>
                <select className="mt-1 w-full border border-slate-300 rounded px-2 py-1" value={options.statusOverride} onChange={(e) => setOptions((s) => ({ ...s, statusOverride: e.target.value as 'DRAFT' | 'ACTIVE' }))}>
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                </select>
              </label>
              <label className="block">
                <span className="text-slate-600 text-xs">Duplicate Contract IDs</span>
                <select className="mt-1 w-full border border-slate-300 rounded px-2 py-1" value={options.duplicateHandling} onChange={(e) => setOptions((s) => ({ ...s, duplicateHandling: e.target.value as 'skip' | 'update' }))}>
                  <option value="skip">Skip existing</option>
                  <option value="update">Update existing</option>
                </select>
              </label>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button className="px-3 py-2 rounded border border-slate-200 text-slate-600 text-sm" onClick={() => setStep(3)}>Back</button>
            <button className="px-4 py-2 rounded bg-green-600 text-white text-sm disabled:opacity-50" disabled={summary.ready === 0 || busy} onClick={onImport}>
              Import Contracts
            </button>
          </div>
        </div>
      ) : null}

      {step === 6 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="text-lg font-semibold text-slate-900">Step 6: Import in Progress</div>
          <div className="text-sm text-slate-600">Processing contract import batch...</div>
          <div className="h-3 bg-slate-100 rounded overflow-hidden"><div className="h-3 bg-blue-500" style={{ width: `${progress}%` }} /></div>
          <div className="text-xs text-slate-500">{progress}% complete</div>
        </div>
      ) : null}

      {step === 7 && result ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className={`rounded-lg border p-4 ${result.failedContracts === 0 ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
            <div className={`font-semibold ${result.failedContracts === 0 ? 'text-green-700' : 'text-amber-700'}`}>
              {result.failedContracts === 0 ? 'Import Successful' : 'Import Completed with Issues'}
            </div>
            <div className="text-sm text-slate-700 mt-1">
              Imported {result.importedContracts} of {result.totalContracts} contracts.
            </div>
            <div className="text-xs text-slate-500 mt-1">Import ID: {result.importId} • Status: {result.status}</div>
          </div>
          {result.results?.length ? (
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 text-left">Contract</th>
                    <th className="px-2 py-2 text-left">Status</th>
                    <th className="px-2 py-2 text-left">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((item: any, idx: number) => (
                    <tr key={`${item.contractId || 'none'}-${idx}`} className="border-t border-slate-100">
                      <td className="px-2 py-2">{item.contractId || '-'}</td>
                      <td className="px-2 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${item.status === 'failed' ? 'bg-red-100 text-red-700' : item.status === 'skipped' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {String(item.status).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-2 py-2">{item.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Link to="/contracts" className="px-3 py-2 rounded bg-blue-600 text-white text-sm">View Contracts</Link>
            <button className="px-3 py-2 rounded border border-slate-200 text-slate-700 text-sm" onClick={() => {
              setStep(1);
              setFile(null);
              setRows([]);
              setResult(null);
              setError('');
              setProgress(0);
              setEditingKey(null);
              setOptions(DEFAULT_OPTIONS);
            }}>
              Import More
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StepBar({ step }: { step: number }) {
  const steps = ['Template', 'Upload', 'Validate', 'Fix', 'Options', 'Progress', 'Results'];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
        {steps.map((label, idx) => {
          const s = idx + 1;
          const active = s === step;
          const done = s < step;
          return (
            <div key={label} className={`rounded px-2 py-1 text-xs text-center border ${active ? 'bg-blue-50 border-blue-200 text-blue-700' : done ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <div className="font-semibold">Step {s}</div>
              <div>{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ title, value, panelClass, valueClass }: { title: string; value: string; panelClass: string; valueClass: string }) {
  return (
    <div className={`rounded border p-3 ${panelClass}`}>
      <div className="text-xs text-slate-500">{title}</div>
      <div className={`text-xl font-bold mt-1 ${valueClass}`}>{value}</div>
    </div>
  );
}

