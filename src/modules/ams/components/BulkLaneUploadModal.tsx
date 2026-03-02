import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, Wand2 } from 'lucide-react';
import { Modal, useToast } from './common';
import {
  BULK_UPLOAD_COLORS,
  autoFixRows,
  downloadErrorReport,
  downloadTemplateFile,
  parseRowsFromFile,
  parseRowsFromText,
  toCreateLaneInputs,
  validateRows,
  type BulkLaneValidationRow,
  type BulkLaneValidationSummary,
} from '../services/bulkLaneUpload';
import type { CreateAuctionRequest } from '../types';

interface BulkLaneUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (lanes: CreateAuctionRequest['lanes']) => void;
  existingLaneNames?: string[];
  title?: string;
}

type Step = 1 | 2 | 3 | 4;

type UploadMethod = 'template' | 'file' | 'paste';

export function BulkLaneUploadModal({
  isOpen,
  onClose,
  onImport,
  existingLaneNames = [],
  title = 'Bulk Upload Lanes',
}: BulkLaneUploadModalProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<UploadMethod>('file');
  const [fileName, setFileName] = useState('');
  const [fileSizeMB, setFileSizeMB] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pasteText, setPasteText] = useState('');
  const [summary, setSummary] = useState<BulkLaneValidationSummary | null>(null);
  const [rows, setRows] = useState<BulkLaneValidationRow[]>([]);
  const [editingRowNumber, setEditingRowNumber] = useState<number | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState<'draft' | 'schedule' | 'now'>('draft');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'replace' | 'rename'>('skip');

  const resetAll = () => {
    setStep(1);
    setMethod('file');
    setFileName('');
    setFileSizeMB(0);
    setUploadProgress(0);
    setPasteText('');
    setSummary(null);
    setRows([]);
    setEditingRowNumber(null);
    setImportProgress(0);
    setImporting(false);
    setImportMode('draft');
    setScheduledAt('');
    setDuplicateHandling('skip');
  };

  const close = () => {
    if (importing) return;
    resetAll();
    onClose();
  };

  const updateRowsState = (nextRows: BulkLaneValidationRow[]) => {
    const nextSummary = {
      totalRows: nextRows.length,
      validRows: nextRows.filter((r) => r.status === 'valid').length,
      warningRows: nextRows.filter((r) => r.status === 'warning').length,
      errorRows: nextRows.filter((r) => r.status === 'error').length,
      rows: nextRows,
    };
    setRows(nextRows);
    setSummary(nextSummary);
  };

  const processParsedRows = (parsedRows: ReturnType<typeof parseRowsFromText>) => {
    const validated = validateRows(parsedRows, existingLaneNames);
    setSummary(validated);
    setRows(validated.rows);
    setStep(2);
  };

  const handleFileChange = async (file: File) => {
    setMethod('file');
    setFileName(file.name);
    setFileSizeMB(Number((file.size / 1024 / 1024).toFixed(1)));
    setUploadProgress(0);

    try {
      for (let i = 15; i <= 75; i += 15) {
        setUploadProgress(i);
        await new Promise((r) => setTimeout(r, 60));
      }
      const parsedRows = await parseRowsFromFile(file);
      setUploadProgress(100);
      showToast({ type: 'success', title: 'File uploaded successfully', message: `${parsedRows.length} rows parsed` });
      processParsedRows(parsedRows);
    } catch (error) {
      showToast({ type: 'error', title: 'Upload failed', message: (error as Error).message });
    }
  };

  const processPasteData = () => {
    try {
      const parsed = parseRowsFromText(pasteText);
      if (parsed.length === 0) {
        showToast({ type: 'error', title: 'No data found', message: 'Paste tab or comma separated rows including headers.' });
        return;
      }
      showToast({ type: 'success', title: 'Data processed', message: `${parsed.length} rows detected` });
      processParsedRows(parsed);
    } catch (err) {
      showToast({ type: 'error', title: 'Unable to process data', message: (err as Error).message });
    }
  };

  const autoFix = () => {
    const fixed = autoFixRows(rows);
    const revalidated = validateRows(fixed.map((r) => r.data), existingLaneNames);
    setRows(revalidated.rows);
    setSummary(revalidated);
    showToast({ type: 'success', title: 'Auto-fix complete', message: 'Common formatting issues were corrected.' });
  };

  const validImportableRows = useMemo(() => rows.filter((r) => r.status !== 'error'), [rows]);

  const totalValue = useMemo(
    () => validImportableRows.reduce((sum, row) => sum + (Number.isFinite(row.data.basePrice) ? row.data.basePrice : 0), 0),
    [validImportableRows],
  );

  const handleImport = async () => {
    if (validImportableRows.length === 0) {
      showToast({ type: 'error', title: 'Nothing to import', message: 'Please resolve errors before importing.' });
      return;
    }

    setStep(4);
    setImporting(true);
    setImportProgress(0);
    for (let pct = 0; pct <= 100; pct += 10) {
      setImportProgress(pct);
      await new Promise((r) => setTimeout(r, 80));
    }

    const lanes = toCreateLaneInputs(validImportableRows, existingLaneNames.length + 1, {
      duplicateHandling,
      autoFix: true,
      applyDefaultDecrement: 100,
    });

    onImport(lanes);
    setImporting(false);
    showToast({ type: 'success', title: 'Import Successful', message: `${lanes.length} lanes imported successfully` });
  };

  const issuesByRow = (row: BulkLaneValidationRow) => row.issues.map((i) => `${i.severity.toUpperCase()}: ${i.message}${i.suggestion ? ` (${i.suggestion})` : ''}`).join(' | ');

  return (
    <Modal title={title} isOpen={isOpen} onClose={close} size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: step >= (s as Step) ? BULK_UPLOAD_COLORS.success : BULK_UPLOAD_COLORS.inactive }}
              >
                {s}
              </span>
              {s < 4 ? <span className="h-0.5 w-10 bg-slate-200" /> : null}
            </div>
          ))}
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="text-sm text-slate-600">Add multiple lanes quickly using spreadsheet.</div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border-2 p-4" style={{ borderColor: BULK_UPLOAD_COLORS.info }}>
                <div className="mb-2 flex items-center gap-2 text-slate-800"><Download size={16} /> <span className="font-semibold">Start with Template</span></div>
                <p className="text-xs text-slate-600">Download template with sample lanes and required columns.</p>
                <div className="mt-3 flex flex-col gap-2">
                  <button type="button" onClick={() => downloadTemplateFile('excel')} className="rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: BULK_UPLOAD_COLORS.success }}>
                    Download Excel Template
                  </button>
                  <button type="button" onClick={() => downloadTemplateFile('csv')} className="rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: BULK_UPLOAD_COLORS.info }}>
                    Download CSV Template
                  </button>
                </div>
              </div>

              <div className="rounded-xl border-2 p-4" style={{ borderColor: BULK_UPLOAD_COLORS.success }}>
                <div className="mb-2 flex items-center gap-2 text-slate-800"><Upload size={16} /> <span className="font-semibold">Upload Existing File</span></div>
                <p className="text-xs text-slate-600">Accepted: .xlsx, .xls, .csv (max 10 MB, 500 rows).</p>
                <label className="mt-3 block cursor-pointer rounded-lg border border-dashed border-slate-300 p-3 text-center text-xs text-slate-600 hover:bg-slate-50">
                  Drag & drop or click to browse
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,.tsv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileChange(file);
                    }}
                  />
                </label>
                {fileName ? (
                  <div className="mt-2 text-xs text-slate-600">
                    <div>{fileName} ({fileSizeMB} MB)</div>
                    <div className="mt-1 h-2 rounded bg-slate-100">
                      <div className="h-2 rounded" style={{ width: `${uploadProgress}%`, backgroundColor: BULK_UPLOAD_COLORS.info }} />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border-2 p-4" style={{ borderColor: BULK_UPLOAD_COLORS.warning }}>
                <div className="mb-2 flex items-center gap-2 text-slate-800"><FileSpreadsheet size={16} /> <span className="font-semibold">Copy & Paste</span></div>
                <p className="text-xs text-slate-600">Paste tab-separated or comma-separated table data.</p>
                <textarea
                  rows={5}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  className="mt-2 w-full rounded border border-slate-300 px-2 py-2 text-xs"
                  placeholder="Lane Name,Origin,Destination,Vehicle Type,Base Price (INR),Duration (seconds),Decrement (INR),TAT (Days)"
                />
                <button type="button" onClick={processPasteData} className="mt-2 w-full rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: BULK_UPLOAD_COLORS.warning }}>
                  Process Data
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 && summary ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="grid gap-3 md:grid-cols-5">
                <Stat label="Total Rows" value={summary.totalRows} color={BULK_UPLOAD_COLORS.info} />
                <Stat label="Valid" value={summary.validRows} color={BULK_UPLOAD_COLORS.success} />
                <Stat label="Warnings" value={summary.warningRows} color={BULK_UPLOAD_COLORS.warning} />
                <Stat label="Errors" value={summary.errorRows} color={BULK_UPLOAD_COLORS.error} />
                <Stat label="Ready" value={summary.validRows + summary.warningRows} color={BULK_UPLOAD_COLORS.ready} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setStep(3)} className="rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: BULK_UPLOAD_COLORS.success }}>
                  Import Valid Rows Only
                </button>
                <button type="button" onClick={autoFix} className="rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: BULK_UPLOAD_COLORS.warning }}>
                  <Wand2 size={14} className="inline mr-1" /> Auto-Fix Common Issues
                </button>
                <button type="button" onClick={() => downloadErrorReport(summary)} className="rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: BULK_UPLOAD_COLORS.error, color: BULK_UPLOAD_COLORS.error }}>
                  Download Error Report
                </button>
                <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Back</button>
              </div>
            </div>

            <div className="max-h-72 overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 text-left">Row</th>
                    <th className="px-2 py-2 text-left">Status</th>
                    <th className="px-2 py-2 text-left">Lane</th>
                    <th className="px-2 py-2 text-left">Route</th>
                    <th className="px-2 py-2 text-left">Price</th>
                    <th className="px-2 py-2 text-left">Duration</th>
                    <th className="px-2 py-2 text-left">TAT</th>
                    <th className="px-2 py-2 text-left">Issues</th>
                    <th className="px-2 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const bg = row.status === 'valid' ? '#f0fff4' : row.status === 'warning' ? '#fff8e1' : '#ffebee';
                    return (
                      <React.Fragment key={`${row.rowNumber}-${row.data.laneName}`}>
                        <tr style={{ backgroundColor: bg }} className="border-t border-slate-100">
                          <td className="px-2 py-2">{row.rowNumber}</td>
                          <td className="px-2 py-2">
                            {row.status === 'valid' ? '✅' : row.status === 'warning' ? '⚠️' : '❌'}
                          </td>
                          <td className="px-2 py-2">{row.data.laneName || '-'}</td>
                          <td className="px-2 py-2">{row.data.origin} {'->'} {row.data.destination}</td>
                          <td className="px-2 py-2">₹{Number.isFinite(row.data.basePrice) ? row.data.basePrice.toLocaleString() : '-'}</td>
                          <td className="px-2 py-2">{row.data.timerDurationSeconds || '-'}s</td>
                          <td className="px-2 py-2">{row.data.tatDays || '-'}d</td>
                          <td className="px-2 py-2 max-w-64 truncate" title={issuesByRow(row)}>{issuesByRow(row) || 'None'}</td>
                          <td className="px-2 py-2">
                            <button type="button" onClick={() => setEditingRowNumber((prev) => (prev === row.rowNumber ? null : row.rowNumber))} className="rounded border border-slate-300 px-2 py-1 text-xs">
                              {editingRowNumber === row.rowNumber ? 'Close' : row.status === 'error' ? 'Fix Now' : 'Edit'}
                            </button>
                          </td>
                        </tr>
                        {editingRowNumber === row.rowNumber ? (
                          <tr className="border-t border-slate-100 bg-white">
                            <td colSpan={9} className="px-3 py-3">
                              <InlineRowEditor
                                row={row}
                                onSave={(next) => {
                                  const nextRows = rows.map((r) => (r.rowNumber === row.rowNumber ? { ...r, data: next } : r));
                                  const revalidated = validateRows(nextRows.map((r) => r.data), existingLaneNames);
                                  updateRowsState(revalidated.rows);
                                  setEditingRowNumber(null);
                                }}
                                onCancel={() => setEditingRowNumber(null)}
                              />
                            </td>
                          </tr>
                        ) : null}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {step === 3 && summary ? (
          <div className="space-y-4">
            <div className="rounded-xl border p-4" style={{ borderColor: BULK_UPLOAD_COLORS.info }}>
              <div className="text-sm font-semibold text-slate-900">Import Summary</div>
              <div className="mt-2 grid gap-3 md:grid-cols-4 text-sm">
                <div>Lanes to Import: <strong>{validImportableRows.length}</strong></div>
                <div>Total Value: <strong>₹{totalValue.toLocaleString()}</strong></div>
                <div>Avg Base Price: <strong>₹{validImportableRows.length ? Math.round(totalValue / validImportableRows.length).toLocaleString() : 0}</strong></div>
                <div>Avg Duration: <strong>{validImportableRows.length ? Math.round(validImportableRows.reduce((s, r) => s + (r.data.timerDurationSeconds || 0), 0) / validImportableRows.length) : 0}s</strong></div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-2 text-sm font-semibold">Import Options</div>
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <label>
                  Duplicate Handling
                  <select value={duplicateHandling} onChange={(e) => setDuplicateHandling(e.target.value as 'skip' | 'replace' | 'rename')} className="mt-1 w-full rounded border border-slate-300 px-2 py-2">
                    <option value="skip">Skip Duplicates</option>
                    <option value="replace">Replace Existing</option>
                    <option value="rename">Auto-Rename</option>
                  </select>
                </label>
                <label>
                  Start Mode
                  <select value={importMode} onChange={(e) => setImportMode(e.target.value as 'draft' | 'schedule' | 'now')} className="mt-1 w-full rounded border border-slate-300 px-2 py-2">
                    <option value="draft">Save as Draft</option>
                    <option value="schedule">Schedule for Later</option>
                    <option value="now">Start Immediately</option>
                  </select>
                </label>
                {importMode === 'schedule' ? (
                  <label>
                    Schedule At
                    <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-2" />
                  </label>
                ) : <div />}
              </div>
            </div>

            <div className="max-h-48 overflow-auto rounded-xl border border-slate-200 p-3">
              {validImportableRows.map((row) => (
                <div key={`${row.rowNumber}-preview`} className="mb-2 flex items-center justify-between rounded border border-slate-100 bg-slate-50 px-2 py-1 text-xs">
                  <span>✅ {row.data.laneName}</span>
                  <span>₹{row.data.basePrice.toLocaleString()} • {row.data.timerDurationSeconds}s • TAT {row.data.tatDays}d</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setStep(2)} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: BULK_UPLOAD_COLORS.warning, color: BULK_UPLOAD_COLORS.warning }}>Back to Edit</button>
              <button type="button" onClick={close} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Cancel</button>
              <button type="button" onClick={handleImport} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: BULK_UPLOAD_COLORS.success }}>
                Import Lanes
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: importing ? '#e3f2fd' : '#e8f5e9' }}>
                {importing ? <Loader2 className="animate-spin" size={20} style={{ color: BULK_UPLOAD_COLORS.info }} /> : <CheckCircle2 size={20} style={{ color: BULK_UPLOAD_COLORS.success }} />}
              </div>
              <div className="font-semibold text-slate-900">{importing ? 'Importing Lanes...' : 'Import Successful!'}</div>
              <div className="mt-1 text-sm text-slate-600">
                {importing ? `Importing lane ${Math.max(1, Math.round((importProgress / 100) * Math.max(1, validImportableRows.length)))} of ${Math.max(1, validImportableRows.length)}` : `${validImportableRows.length} lanes imported successfully`}
              </div>
              <div className="mt-3 h-2 rounded bg-slate-100">
                <div className="h-2 rounded" style={{ width: `${importProgress}%`, backgroundColor: BULK_UPLOAD_COLORS.success }} />
              </div>
            </div>

            {!importing ? (
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { resetAll(); setStep(1); }} className="rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: BULK_UPLOAD_COLORS.info }}>
                  Import More Lanes
                </button>
                <button type="button" onClick={close} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  Close
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function InlineRowEditor({
  row,
  onSave,
  onCancel,
}: {
  row: BulkLaneValidationRow;
  onSave: (next: BulkLaneValidationRow['data']) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(row.data);

  const fieldError = (field: string) => row.issues.find((i) => i.field === field && i.severity === 'error');
  const fieldWarn = (field: string) => row.issues.find((i) => i.field === field && i.severity === 'warning');

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-4">
        <EditableField label="Lane Name" value={draft.laneName} onChange={(v) => setDraft((d) => ({ ...d, laneName: v }))} error={fieldError('laneName')?.message} warning={fieldWarn('laneName')?.message} />
        <EditableField label="Origin" value={draft.origin} onChange={(v) => setDraft((d) => ({ ...d, origin: v }))} error={fieldError('origin')?.message} warning={fieldWarn('origin')?.message} />
        <EditableField label="Destination" value={draft.destination} onChange={(v) => setDraft((d) => ({ ...d, destination: v }))} error={fieldError('destination')?.message} warning={fieldWarn('destination')?.message} />
        <EditableField label="Vehicle" value={draft.vehicleType} onChange={(v) => setDraft((d) => ({ ...d, vehicleType: v }))} />
        <EditableField label="Base Price" type="number" value={String(draft.basePrice || '')} onChange={(v) => setDraft((d) => ({ ...d, basePrice: Number(v) }))} error={fieldError('basePrice')?.message} warning={fieldWarn('basePrice')?.message} />
        <EditableField label="Duration (s)" type="number" value={String(draft.timerDurationSeconds || '')} onChange={(v) => setDraft((d) => ({ ...d, timerDurationSeconds: Number(v) }))} error={fieldError('timerDurationSeconds')?.message} warning={fieldWarn('timerDurationSeconds')?.message} />
        <EditableField label="Decrement" type="number" value={String(draft.minBidDecrement || '')} onChange={(v) => setDraft((d) => ({ ...d, minBidDecrement: Number(v) }))} />
        <EditableField label="TAT Days" type="number" value={String(draft.tatDays || '')} onChange={(v) => setDraft((d) => ({ ...d, tatDays: Number(v) }))} error={fieldError('tatDays')?.message} warning={fieldWarn('tatDays')?.message} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded border border-slate-300 px-3 py-2 text-xs">Cancel</button>
        <button type="button" onClick={() => onSave(draft)} className="rounded px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: BULK_UPLOAD_COLORS.success }}>
          Save Fix
        </button>
      </div>
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  error,
  warning,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  warning?: string;
  type?: string;
}) {
  return (
    <label className="block text-xs">
      <span className="text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded border px-2 py-1"
        style={{ borderColor: error ? BULK_UPLOAD_COLORS.error : warning ? BULK_UPLOAD_COLORS.warning : '#cbd5e1' }}
      />
      {error ? <div className="mt-1 text-[11px]" style={{ color: BULK_UPLOAD_COLORS.error }}>{error}</div> : null}
      {!error && warning ? <div className="mt-1 text-[11px]" style={{ color: BULK_UPLOAD_COLORS.warning }}>{warning}</div> : null}
    </label>
  );
}
