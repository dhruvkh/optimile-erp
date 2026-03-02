import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, FileText, Upload } from 'lucide-react';
import { auctionEngine } from '../../services/mockBackend';
import { AwardAcceptanceStatus } from '../../types';
import { Modal, useToast } from './common';

function formatINR(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatRemaining(ms: number) {
  const safe = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  return `${h}h ${m}m remaining`;
}

export function VendorAwardAcceptance() {
  const { awardId } = useParams<{ awardId: string }>();
  const [tick, setTick] = useState(0);
  const [checks, setChecks] = useState([false, false, false, false, false]);
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState('Vehicle unavailable');
  const [declineComment, setDeclineComment] = useState('');
  const [showModification, setShowModification] = useState(false);
  const [modCategory, setModCategory] = useState<'PRICE' | 'TAT' | 'SPECIAL_CONDITIONS' | 'PAYMENT_TERMS' | 'OTHER'>('PRICE');
  const [modJustification, setModJustification] = useState('');
  const [modProposed, setModProposed] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auctionEngine.subscribe(() => setTick((v) => v + 1));
    const timer = setInterval(() => setTick((v) => v + 1), 1000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  const award = useMemo(() => (awardId ? auctionEngine.getAwardById(awardId) : undefined), [awardId, tick]);

  if (!award) {
    return <div className="text-slate-500">Award not found or expired link.</div>;
  }

  const lane = auctionEngine.getLane(award.auctionLaneId);
  const auction = lane ? auctionEngine.getAuction(lane.auctionId) : undefined;
  const deadlineRemaining = award.acceptanceDeadline - Date.now();

  const accept = () => {
    if (!checks.every(Boolean)) {
      showToast({ type: 'warning', title: 'Please confirm all checklists before acceptance.' });
      return;
    }
    try {
      auctionEngine.updateAwardAcceptance(award.id, 'ACCEPT', {}, award.vendorId);
      showToast({ type: 'success', title: 'Award accepted successfully' });
      navigate('/vendor-portal');
    } catch (error) {
      showToast({ type: 'error', title: (error as Error).message });
    }
  };

  const submitDecline = () => {
    try {
      auctionEngine.updateAwardAcceptance(award.id, 'DECLINE', { declineReason: `${declineReason}${declineComment ? `: ${declineComment}` : ''}` }, award.vendorId);
      showToast({ type: 'warning', title: 'Award declined' });
      setShowDecline(false);
      navigate('/vendor-portal');
    } catch (error) {
      showToast({ type: 'error', title: (error as Error).message });
    }
  };

  const submitModification = () => {
    try {
      auctionEngine.updateAwardAcceptance(
        award.id,
        'REQUEST_MODIFICATION',
        {
          modificationCategory: modCategory,
          justification: modJustification,
          proposedChanges: modProposed,
        },
        award.vendorId,
      );
      showToast({ type: 'info', title: 'Modification request submitted' });
      setShowModification(false);
    } catch (error) {
      showToast({ type: 'error', title: (error as Error).message });
    }
  };

  const statusTone = award.status === AwardAcceptanceStatus.ACCEPTED
    ? 'bg-green-100 text-green-700'
    : award.status === AwardAcceptanceStatus.PENDING
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-slate-100 text-slate-700';

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Award Acceptance</h1>
        <div className="text-sm text-slate-500 mt-1">Secure Award Link • {award.id.slice(0, 10)}</div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">Auction</div>
            <div className="font-semibold text-slate-900">{auction?.name || 'Auction'}</div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusTone}`}>{award.status}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <InfoLine label="Lane" value={lane?.laneName || award.auctionLaneId} />
          <InfoLine label="Winning Bid" value={formatINR(award.price)} />
          <InfoLine label="Award Period" value="Feb 15 - May 15, 2026" />
          <InfoLine label="Estimated Trips" value="20 trips" />
          <InfoLine label="Total Potential Value" value={formatINR(award.price * 20)} />
          <InfoLine label="TAT" value={`${lane?.tatDays || 4} days`} />
          <InfoLine label="Payment Terms" value="Net 30 days" />
          <InfoLine label="Special Conditions" value="Temperature control, GPS mandatory" />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-sm font-semibold text-slate-800">Document Requirements</div>
          <ul className="mt-2 space-y-1 text-sm">
            <li>✅ PAN Card (already on file)</li>
            <li>✅ GST Certificate (already on file)</li>
            <li>⚠️ Vehicle Insurance (expires soon - upload new)</li>
            <li>❌ GPS Device Certificate (required - upload)</li>
          </ul>
          <button className="mt-2 px-3 py-2 rounded border border-slate-300 text-sm inline-flex items-center gap-2"><Upload size={14} />Upload Missing Documents</button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-700">Accept by: {new Date(award.acceptanceDeadline).toLocaleString()}</div>
            <div className={`text-lg font-mono ${deadlineRemaining < 2 * 60 * 60 * 1000 ? 'text-red-600' : deadlineRemaining < 6 * 60 * 60 * 1000 ? 'text-yellow-700' : 'text-green-700'}`}>
              {formatRemaining(deadlineRemaining)}
            </div>
          </div>
          <button className="px-3 py-2 rounded border border-slate-300 text-sm inline-flex items-center gap-2"><FileText size={14} />Preview Contract</button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold text-slate-900">Acceptance Checklist</h2>
        {[
          'I confirm I can fulfill the TAT requirements.',
          'I have the required vehicle type available.',
          'I accept the payment terms (Net 30 days).',
          'I agree to all special conditions.',
          'I authorize electronic signature on contract.',
        ].map((label, idx) => (
          <label key={label} className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={checks[idx]} onChange={(e) => {
              const next = [...checks];
              next[idx] = e.target.checked;
              setChecks(next);
            }} />
            {label}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={accept} className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold inline-flex items-center gap-2"><CheckCircle2 size={16} />Accept Award</button>
        <button onClick={() => setShowDecline(true)} className="px-4 py-2 rounded-lg bg-red-100 text-red-700 font-semibold inline-flex items-center gap-2"><AlertTriangle size={16} />Decline Award</button>
        <button onClick={() => setShowModification(true)} className="px-4 py-2 rounded-lg bg-orange-100 text-orange-700 font-semibold">Request Modification</button>
      </div>

      <Modal
        title="Decline Award"
        isOpen={showDecline}
        onClose={() => setShowDecline(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button className="px-3 py-2 rounded border" onClick={() => setShowDecline(false)}>Cancel</button>
            <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={submitDecline}>Submit Decline</button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <select className="w-full border border-slate-300 rounded px-2 py-2" value={declineReason} onChange={(e) => setDeclineReason(e.target.value)}>
            <option>Vehicle unavailable</option>
            <option>Cannot meet TAT</option>
            <option>Commercial terms not acceptable</option>
            <option>Operational constraints</option>
            <option>Other</option>
          </select>
          <textarea className="w-full border border-slate-300 rounded px-2 py-2" rows={3} placeholder="Additional comments" value={declineComment} onChange={(e) => setDeclineComment(e.target.value)} />
          <label className="inline-flex items-center gap-2"><input type="checkbox" /> I understand this may affect future eligibility.</label>
        </div>
      </Modal>

      <Modal
        title="Request Modification"
        isOpen={showModification}
        onClose={() => setShowModification(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button className="px-3 py-2 rounded border" onClick={() => setShowModification(false)}>Cancel</button>
            <button className="px-3 py-2 rounded bg-orange-600 text-white" onClick={submitModification}>Submit Request</button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <select className="w-full border border-slate-300 rounded px-2 py-2" value={modCategory} onChange={(e) => setModCategory(e.target.value as typeof modCategory)}>
            <option value="PRICE">Price adjustment</option>
            <option value="TAT">TAT adjustment</option>
            <option value="SPECIAL_CONDITIONS">Special conditions</option>
            <option value="PAYMENT_TERMS">Payment terms</option>
            <option value="OTHER">Other</option>
          </select>
          <textarea className="w-full border border-slate-300 rounded px-2 py-2" rows={3} placeholder="Justification (required)" value={modJustification} onChange={(e) => setModJustification(e.target.value)} />
          <textarea className="w-full border border-slate-300 rounded px-2 py-2" rows={3} placeholder="Proposed changes (required)" value={modProposed} onChange={(e) => setModProposed(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  );
}
