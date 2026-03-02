import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, UploadCloud } from 'lucide-react';
import { BulkLaneUploadModal } from './BulkLaneUploadModal';
import type { CreateAuctionRequest } from '../types';

const STORAGE_KEY = 'optimile-bulk-upload-lanes-draft-v1';

export function BulkLaneUploadPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [importedLanes, setImportedLanes] = useState<CreateAuctionRequest['lanes']>([]);

  const totalValue = useMemo(
    () => importedLanes.reduce((sum, lane) => sum + (lane.basePrice || 0), 0),
    [importedLanes],
  );

  const onImport = (lanes: CreateAuctionRequest['lanes']) => {
    setImportedLanes(lanes);
    setOpen(false);
  };

  const saveDraftForLater = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lanesPayload(importedLanes)));
    navigate('/create');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">Bulk Upload Lanes</h1>
        <p className="mt-1 text-sm text-slate-600">Standalone tool for preparing lane data and importing to auction drafts.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setOpen(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">📤 Bulk Upload Lanes</button>
          <Link to="/create" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Go to Create Auction</Link>
        </div>
      </div>

      {importedLanes.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Import Summary</h2>
              <p className="text-sm text-slate-600">{importedLanes.length} lanes prepared • Total value ₹{totalValue.toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={saveDraftForLater} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white">Save as Draft & Open Create</button>
              <button onClick={() => setOpen(true)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Import More</button>
            </div>
          </div>

          <div className="mt-4 max-h-80 overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Lane Name</th>
                  <th className="px-3 py-2 text-left">Base Price</th>
                  <th className="px-3 py-2 text-left">Duration</th>
                  <th className="px-3 py-2 text-left">TAT</th>
                </tr>
              </thead>
              <tbody>
                {importedLanes.map((lane, idx) => (
                  <tr key={`${lane.laneName}-${idx}`} className="border-t border-slate-100">
                    <td className="px-3 py-2"><CheckCircle2 size={14} className="text-green-600" /></td>
                    <td className="px-3 py-2 font-medium text-slate-800">{lane.laneName}</td>
                    <td className="px-3 py-2">₹{lane.basePrice.toLocaleString()}</td>
                    <td className="px-3 py-2">{lane.timerDurationSeconds}s</td>
                    <td className="px-3 py-2">{lane.tatDays || '-'} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          <UploadCloud className="mx-auto mb-2 h-8 w-8 text-slate-400" />
          No imported lanes yet. Click <span className="font-semibold text-slate-700">Bulk Upload Lanes</span> to begin.
        </div>
      )}

      <BulkLaneUploadModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onImport={onImport}
        title="Bulk Upload Lanes"
      />
    </div>
  );
}

function lanesPayload(lanes: CreateAuctionRequest['lanes']) {
  return {
    createdAt: Date.now(),
    lanes,
  };
}

export const BULK_LANE_DRAFT_STORAGE_KEY = STORAGE_KEY;
