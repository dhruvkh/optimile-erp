import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, MessageSquare, Send, ShieldAlert } from 'lucide-react';
import { auctionEngine } from '../../services/mockBackend';
import { DisputeStatus } from '../../types';
import { Modal, useToast } from './common';

function statusTone(status: DisputeStatus) {
  const styles: Record<DisputeStatus, string> = {
    [DisputeStatus.NEW]: 'bg-blue-100 text-blue-700',
    [DisputeStatus.UNDER_REVIEW]: 'bg-yellow-100 text-yellow-700',
    [DisputeStatus.PENDING_RESPONSE]: 'bg-orange-100 text-orange-700',
    [DisputeStatus.RESOLVED]: 'bg-green-100 text-green-700',
    [DisputeStatus.ESCALATED]: 'bg-red-100 text-red-700',
    [DisputeStatus.CLOSED]: 'bg-slate-100 text-slate-700',
  };
  return styles[status];
}

export function DisputeDetailPage() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const [tick, setTick] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [resolutionType, setResolutionType] = useState<'AWARD_CHANGE' | 'CONTRACT_ADJUSTMENT' | 'REFUND_OR_WAIVER' | 'RE_AUCTION' | 'COMPENSATION' | 'REJECTED_NO_ACTION'>('REJECTED_NO_ACTION');
  const [resolutionText, setResolutionText] = useState('');
  const [showAppeal, setShowAppeal] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealOutcome, setAppealOutcome] = useState('');
  const [appealEvidence, setAppealEvidence] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = auctionEngine.subscribe(() => setTick((v) => v + 1));
    return unsub;
  }, []);

  const dispute = useMemo(() => (disputeId ? auctionEngine.getDispute(disputeId) : undefined), [disputeId, tick]);

  if (!dispute) return <div className="text-slate-500">Dispute not found.</div>;

  const requestInfo = () => {
    auctionEngine.updateDisputeStatus(dispute.id, DisputeStatus.PENDING_RESPONSE, 'Reviewer', 'Requested more information from reporter.');
    auctionEngine.addDisputeMessage(dispute.id, 'Reviewer', 'Please provide additional evidence related to timeline and impact.', 'all');
    showToast({ type: 'info', title: 'Information request sent' });
  };

  const acceptForInvestigation = () => {
    auctionEngine.updateDisputeStatus(dispute.id, DisputeStatus.UNDER_REVIEW, 'Reviewer', 'Accepted for investigation');
    showToast({ type: 'success', title: 'Dispute moved to investigation' });
  };

  const rejectDispute = () => {
    auctionEngine.updateDisputeStatus(dispute.id, DisputeStatus.CLOSED, 'Reviewer', 'Rejected after initial review');
    auctionEngine.addDisputeMessage(dispute.id, 'Reviewer', 'Dispute rejected due to insufficient grounds.', 'all');
    showToast({ type: 'warning', title: 'Dispute closed' });
  };

  const escalateDispute = () => {
    auctionEngine.updateDisputeStatus(dispute.id, DisputeStatus.ESCALATED, 'Reviewer', 'Escalated to senior management');
    showToast({ type: 'warning', title: 'Dispute escalated' });
  };

  const proposeResolution = () => {
    if (!resolutionText.trim()) {
      showToast({ type: 'error', title: 'Resolution detail is required' });
      return;
    }
    auctionEngine.proposeDisputeResolution(dispute.id, 'Reviewer', resolutionType, resolutionText);
    showToast({ type: 'success', title: 'Resolution proposed' });
  };

  const approveResolution = () => {
    auctionEngine.approveDisputeResolution(dispute.id, 'Manager', true);
    auctionEngine.addDisputeMessage(dispute.id, 'SYSTEM', `Dispute resolved. Resolution: ${dispute.resolution?.details || resolutionText}`, 'all');
    showToast({ type: 'success', title: 'Resolution approved and closed' });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    auctionEngine.addDisputeMessage(dispute.id, 'Reviewer', newMessage, 'all');
    setNewMessage('');
  };

  const submitAppeal = () => {
    if (!appealReason.trim() || !appealOutcome.trim()) {
      showToast({ type: 'error', title: 'Appeal reason and desired outcome are required' });
      return;
    }
    auctionEngine.raiseDisputeAppeal(dispute.id, dispute.raisedBy, appealReason, appealOutcome, appealEvidence);
    setShowAppeal(false);
    showToast({ type: 'warning', title: 'Appeal raised to senior management' });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dispute {dispute.id}</h1>
          <p className="text-slate-500">{dispute.category} • Raised by {dispute.raisedBy} • {new Date(dispute.createdAt).toLocaleString()}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusTone(dispute.status)}`}>{dispute.status}</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <Info label="Priority" value={dispute.priority} />
        <Info label="Assigned To" value={dispute.assignedTo || '--'} />
        <Info label="SLA" value={`Resolve by ${new Date(dispute.dueAt).toLocaleString()}`} />
        <Info label="Related" value={`${dispute.relatedType} ${dispute.relatedId || ''}`.trim()} />
        <Info label="Last Updated" value={new Date(dispute.updatedAt).toLocaleString()} />
        <Info label="Attachments" value={`${dispute.attachments.length}`} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
        <div className="font-semibold text-slate-900">Dispute Description</div>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{dispute.description}</p>
        <div className="text-sm text-slate-600">Preferred resolution: {dispute.preferredResolution || '--'}</div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="font-semibold text-slate-900">Stage 1: Initial Review (0-24h)</div>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-2 rounded bg-green-600 text-white text-sm" onClick={acceptForInvestigation}>Accept Dispute</button>
            <button className="px-3 py-2 rounded bg-yellow-100 text-yellow-800 text-sm" onClick={requestInfo}>Request More Info</button>
            <button className="px-3 py-2 rounded bg-slate-200 text-slate-700 text-sm" onClick={rejectDispute}>Reject Dispute</button>
            <button className="px-3 py-2 rounded bg-red-100 text-red-700 text-sm" onClick={escalateDispute}>Escalate</button>
          </div>

          <div className="font-semibold text-slate-900 mt-3">Stage 2/3: Investigation & Resolution</div>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <select className="border border-slate-300 rounded px-2 py-2" value={resolutionType} onChange={(e) => setResolutionType(e.target.value as typeof resolutionType)}>
              <option value="AWARD_CHANGE">Award to different vendor</option>
              <option value="CONTRACT_ADJUSTMENT">Adjust contract terms</option>
              <option value="REFUND_OR_WAIVER">Refund / penalty waiver</option>
              <option value="RE_AUCTION">Re-run auction for disputed lane</option>
              <option value="COMPENSATION">Provide compensation</option>
              <option value="REJECTED_NO_ACTION">No action (reject)</option>
            </select>
            <textarea className="border border-slate-300 rounded px-2 py-2 min-h-[90px]" value={resolutionText} onChange={(e) => setResolutionText(e.target.value)} placeholder="Document findings and proposed resolution" />
            <div className="flex gap-2">
              <button className="px-3 py-2 rounded bg-blue-600 text-white text-sm" onClick={proposeResolution}>Propose Resolution</button>
              <button className="px-3 py-2 rounded bg-green-600 text-white text-sm" onClick={approveResolution}>Approve & Close</button>
            </div>
            <div className="text-xs text-slate-500">Financial impact {'>'} ₹1L should be manager-approved.</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="font-semibold text-slate-900 inline-flex items-center gap-1"><MessageSquare size={15} /> Communication Thread</div>
          <div className="max-h-72 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-2">
            {dispute.messages.map((m) => (
              <div key={m.id} className="rounded border border-slate-200 bg-slate-50 p-2 text-sm">
                <div className="text-xs text-slate-500">{m.senderId} • {new Date(m.createdAt).toLocaleString()} • {m.visibility}</div>
                <div className="text-slate-700">{m.message}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Send message to parties" />
            <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={sendMessage}><Send size={14} /></button>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button className="px-3 py-2 rounded bg-orange-100 text-orange-700 text-sm inline-flex items-center gap-2" onClick={() => setShowAppeal(true)}>
              <ShieldAlert size={14} /> Raise / Record Appeal
            </button>
            {dispute.appeals.length > 0 && (
              <div className="mt-2 text-xs text-slate-600">Appeals: {dispute.appeals.length} (latest: {dispute.appeals[dispute.appeals.length - 1].status})</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
        <div className="font-semibold text-slate-900">Timeline of Events</div>
        <div className="space-y-2">
          {dispute.timeline.slice().reverse().map((event) => (
            <div key={event.id} className="flex items-start gap-2 text-sm">
              <span className="mt-1 w-2 h-2 rounded-full bg-blue-500" />
              <div>
                <div className="font-medium text-slate-800">{event.action}</div>
                <div className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()} • {event.actorId}</div>
                {event.note && <div className="text-slate-600">{event.note}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        title="Appeal (7-day window)"
        isOpen={showAppeal}
        onClose={() => setShowAppeal(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button className="px-3 py-2 rounded border" onClick={() => setShowAppeal(false)}>Cancel</button>
            <button className="px-3 py-2 rounded bg-orange-600 text-white" onClick={submitAppeal}>Submit Appeal</button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <textarea className="w-full border border-slate-300 rounded px-2 py-2 min-h-[90px]" value={appealReason} onChange={(e) => setAppealReason(e.target.value)} placeholder="Why you disagree with the resolution" />
          <textarea className="w-full border border-slate-300 rounded px-2 py-2 min-h-[80px]" value={appealEvidence} onChange={(e) => setAppealEvidence(e.target.value)} placeholder="New evidence (optional)" />
          <textarea className="w-full border border-slate-300 rounded px-2 py-2 min-h-[80px]" value={appealOutcome} onChange={(e) => setAppealOutcome(e.target.value)} placeholder="What outcome you seek" />
          <div className="text-xs text-slate-500 inline-flex items-center gap-1"><AlertTriangle size={12} /> Appeals are escalated for final decision in 5 business days.</div>
        </div>
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}
