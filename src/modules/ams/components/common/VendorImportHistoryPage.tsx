import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { vendorBulkImportService } from '../../services/vendorBulkImport';

export function VendorImportHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'partial' | 'failed'>('all');
  const history = vendorBulkImportService.getHistory();

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return history;
    return history.filter((h) => h.status === statusFilter);
  }, [history, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendor Import History</h1>
          <p className="text-slate-500">Track all bulk vendor import batches and outcomes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/ams/vendors/onboarding" className="px-3 py-2 rounded border border-slate-200 text-slate-700 text-sm">Back to Vendors</Link>
          <Link to="/ams/vendors/bulk-import" className="px-3 py-2 rounded bg-blue-600 text-white text-sm">Import Vendors</Link>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip label="All" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
          <FilterChip label="Completed" active={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')} />
          <FilterChip label="Partial" active={statusFilter === 'partial'} onClick={() => setStatusFilter('partial')} />
          <FilterChip label="Failed" active={statusFilter === 'failed'} onClick={() => setStatusFilter('failed')} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-2 py-2 text-left">Import ID</th>
              <th className="px-2 py-2 text-left">File</th>
              <th className="px-2 py-2 text-left">Uploaded</th>
              <th className="px-2 py-2 text-left">By</th>
              <th className="px-2 py-2 text-left">Rows</th>
              <th className="px-2 py-2 text-left">Imported</th>
              <th className="px-2 py-2 text-left">Failed</th>
              <th className="px-2 py-2 text-left">Duration</th>
              <th className="px-2 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((run) => (
              <tr key={run.importId} className="border-t border-slate-100">
                <td className="px-2 py-2 text-xs font-mono">{run.importId}</td>
                <td className="px-2 py-2">{run.fileName}</td>
                <td className="px-2 py-2 text-xs text-slate-500">{new Date(run.uploadedAt).toLocaleString()}</td>
                <td className="px-2 py-2 text-xs">{run.uploadedBy}</td>
                <td className="px-2 py-2">{run.totalRows}</td>
                <td className="px-2 py-2 text-green-700">{run.importedRows}</td>
                <td className="px-2 py-2 text-red-700">{run.failedRows}</td>
                <td className="px-2 py-2 text-xs text-slate-500">{run.durationSec}s</td>
                <td className="px-2 py-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${statusClass(run.status)}`}>
                    {run.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-slate-500">No import batches found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function statusClass(status: string) {
  if (status === 'completed') return 'bg-green-100 text-green-700';
  if (status === 'partial') return 'bg-amber-100 text-amber-700';
  if (status === 'failed') return 'bg-red-100 text-red-700';
  return 'bg-blue-100 text-blue-700';
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`px-3 py-1 rounded-full text-xs border ${active ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`} onClick={onClick}>
      {label}
    </button>
  );
}

