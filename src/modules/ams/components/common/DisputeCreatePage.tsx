import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Paperclip } from 'lucide-react';
import { auctionEngine } from '../../services/mockBackend';
import { DisputeCategory, DisputePriority, DisputeRelatedType } from '../../types';
import { useToast } from './common';

const ROLE = 'VENDOR' as const;
const USER_ID = 'V-089';

export function DisputeCreatePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const auctions = auctionEngine.getAllAuctions();
  const contracts = auctionEngine.getContracts();

  const [relatedType, setRelatedType] = useState<DisputeRelatedType>(DisputeRelatedType.AUCTION);
  const [auctionId, setAuctionId] = useState(auctions[0]?.id || '');
  const [contractId, setContractId] = useState(contracts[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [category, setCategory] = useState<DisputeCategory>(DisputeCategory.BIDDING_PROCESS);
  const [priority, setPriority] = useState<DisputePriority>(DisputePriority.MEDIUM);
  const [description, setDescription] = useState('');
  const [preferredResolution, setPreferredResolution] = useState('');
  const [files, setFiles] = useState<Array<{ name: string; sizeKb: number }>>([]);

  const canSubmit = useMemo(() => description.trim().length >= 100, [description]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(event.target.files || []);
    const mapped = fileList.map((f) => ({ name: f.name, sizeKb: Math.round(f.size / 1024) }));
    const withinLimit = mapped.filter((f) => f.sizeKb <= 5 * 1024).slice(0, 10);
    setFiles(withinLimit);
  };

  const submit = () => {
    if (!canSubmit) {
      showToast({ type: 'error', title: 'Description must be at least 100 characters' });
      return;
    }
    try {
      const id = auctionEngine.createDispute({
        raisedBy: USER_ID,
        raisedByRole: ROLE,
        relatedType,
        relatedId: relatedType === DisputeRelatedType.GENERAL ? undefined : relatedType === DisputeRelatedType.AUCTION ? auctionId : contractId,
        auctionId: relatedType === DisputeRelatedType.AUCTION ? auctionId : undefined,
        contractId: relatedType === DisputeRelatedType.CONTRACT ? contractId : undefined,
        invoiceNumber: relatedType === DisputeRelatedType.INVOICE ? invoiceNumber : undefined,
        category,
        priority,
        description,
        preferredResolution,
        attachments: files,
      });
      showToast({ type: 'success', title: `Dispute created: ${id}` });
      navigate('/ams/disputes');
    } catch (error) {
      showToast({ type: 'error', title: (error as Error).message });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Raise Dispute</h1>
        <p className="text-slate-500">Submit a dispute ticket for auction, contract, invoice, or general issue.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <label>
            <div className="text-slate-600 mb-1">Related to</div>
            <select className="w-full border border-slate-300 rounded px-3 py-2" value={relatedType} onChange={(e) => setRelatedType(e.target.value as DisputeRelatedType)}>
              {Object.values(DisputeRelatedType).map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>

          {relatedType === DisputeRelatedType.AUCTION && (
            <label>
              <div className="text-slate-600 mb-1">Select auction</div>
              <select className="w-full border border-slate-300 rounded px-3 py-2" value={auctionId} onChange={(e) => setAuctionId(e.target.value)}>
                {auctions.map((auction) => <option key={auction.id} value={auction.id}>{auction.name}</option>)}
              </select>
            </label>
          )}

          {relatedType === DisputeRelatedType.CONTRACT && (
            <label>
              <div className="text-slate-600 mb-1">Select contract</div>
              <select className="w-full border border-slate-300 rounded px-3 py-2" value={contractId} onChange={(e) => setContractId(e.target.value)}>
                {contracts.map((contract) => <option key={contract.id} value={contract.id}>{contract.id}</option>)}
              </select>
            </label>
          )}

          {relatedType === DisputeRelatedType.INVOICE && (
            <label>
              <div className="text-slate-600 mb-1">Invoice number</div>
              <input className="w-full border border-slate-300 rounded px-3 py-2" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="INV-20260211-001" />
            </label>
          )}

          <label>
            <div className="text-slate-600 mb-1">Dispute Category</div>
            <select className="w-full border border-slate-300 rounded px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value as DisputeCategory)}>
              {Object.values(DisputeCategory).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label>
            <div className="text-slate-600 mb-1">Priority</div>
            <select className="w-full border border-slate-300 rounded px-3 py-2" value={priority} onChange={(e) => setPriority(e.target.value as DisputePriority)}>
              <option value={DisputePriority.CRITICAL}>🔴 Critical</option>
              <option value={DisputePriority.HIGH}>🟠 High</option>
              <option value={DisputePriority.MEDIUM}>🟡 Medium</option>
              <option value={DisputePriority.LOW}>🟢 Low</option>
            </select>
          </label>
        </div>

        <label className="block text-sm">
          <div className="text-slate-600 mb-1">Detailed Description (min 100 chars)</div>
          <textarea
            className="w-full border border-slate-300 rounded px-3 py-2 min-h-[140px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened? When did it occur? What is the impact? What resolution do you seek?"
          />
          <div className={`text-xs mt-1 ${description.length >= 100 ? 'text-green-700' : 'text-slate-500'}`}>
            {description.length}/100 minimum
          </div>
        </label>

        <label className="block text-sm">
          <div className="text-slate-600 mb-1">Preferred Resolution</div>
          <input className="w-full border border-slate-300 rounded px-3 py-2" value={preferredResolution} onChange={(e) => setPreferredResolution(e.target.value)} placeholder="I request that..." />
        </label>

        <label className="block text-sm">
          <div className="text-slate-600 mb-1 inline-flex items-center gap-1"><Paperclip size={14} /> Attachments (max 10 files, 5MB each)</div>
          <input type="file" multiple className="w-full border border-slate-300 rounded px-3 py-2" onChange={onFileChange} />
          <div className="mt-2 text-xs text-slate-500 space-y-1">
            {files.map((f) => <div key={f.name}>{f.name} ({f.sizeKb}KB)</div>)}
          </div>
        </label>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-500 inline-flex items-center gap-1"><AlertTriangle size={12} /> SLA auto-assigned based on priority.</div>
          <button disabled={!canSubmit} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-slate-300" onClick={submit}>Submit Dispute</button>
        </div>
      </div>
    </div>
  );
}
