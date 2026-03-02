import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { VENDOR_COLORS, vendorManagement, VendorDocument } from '../../services/vendorManagement';

function statusColor(status: VendorDocument['status']) {
  if (status === 'VERIFIED') return VENDOR_COLORS.success;
  if (status === 'UPLOADED') return VENDOR_COLORS.success;
  if (status === 'VERIFYING') return VENDOR_COLORS.info;
  if (status === 'REJECTED') return VENDOR_COLORS.error;
  if (status === 'EXPIRING_SOON') return '#FB8C00';
  return VENDOR_COLORS.error;
}

export function VendorApplicationReviewPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [note, setNote] = useState('');
  const [conditional, setConditional] = useState(false);
  const [conditionText, setConditionText] = useState('Complete GPS installation within 30 days');

  useEffect(() => {
    const unsub = vendorManagement.subscribe(() => setTick((v) => v + 1));
    return unsub;
  }, []);

  const app = applicationId ? vendorManagement.getApplication(applicationId) : undefined;
  if (!app) return <div className="text-slate-500">Application not found.</div>;

  const verified = app.documents.filter((d) => d.status === 'VERIFIED').length;
  const pending = app.documents.filter((d) => ['NOT_UPLOADED', 'VERIFYING'].includes(d.status)).length;
  const rejected = app.documents.filter((d) => d.status === 'REJECTED').length;

  const approve = () => {
    const vendorId = vendorManagement.approveApplication(app.applicationId, 'ADMIN-USER', conditional ? { conditional: true, conditions: [conditionText] } : undefined);
    alert(`Approved. Generated Vendor ID: ${vendorId}`);
    navigate('/ams/vendors/pending-approvals');
  };

  const requestInfo = () => {
    const message = prompt('Specify additional information required', 'Please upload clear insurance certificate with validity details') || 'More info requested';
    vendorManagement.requestMoreInfo(app.applicationId, 'ADMIN-USER', message);
  };

  const reject = () => {
    const reason = prompt('Rejection reason', 'Incomplete statutory compliance documents') || 'Rejected';
    vendorManagement.rejectApplication(app.applicationId, 'ADMIN-USER', reason);
    navigate('/ams/vendors/pending-approvals');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vendor Application Review</h1>
        <p className="text-slate-500">Application {app.applicationId} • {app.companyInfo.companyName}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-slate-900">Application Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <Info label="Company" value={app.companyInfo.companyName} />
            <Info label="Legal Name" value={app.companyInfo.legalEntityName} />
            <Info label="Type" value={app.companyInfo.companyType} />
            <Info label="Established" value={`${app.companyInfo.yearEstablished}`} />
            <Info label="Contact" value={app.contact.primaryContactName} />
            <Info label="Email" value={app.contact.email} />
            <Info label="Mobile" value={app.contact.mobile} />
            <Info label="State" value={app.contact.state} />
          </div>

          <div>
            <h3 className="font-medium text-slate-800">Document Verification</h3>
            <div className="space-y-2 mt-2">
              {app.documents.map((doc) => (
                <div key={doc.type} className="border border-slate-200 rounded p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{doc.type}</div>
                    <span className="px-2 py-1 rounded text-white text-xs" style={{ backgroundColor: statusColor(doc.status) }}>{doc.status.replace(/_/g, ' ')}</span>
                  </div>
                  {doc.fileName && <div className="text-xs text-slate-500 mt-1">File: {doc.fileName}</div>}
                  {doc.rejectionReason && <div className="text-xs mt-1" style={{ color: VENDOR_COLORS.error }}>Reason: {doc.rejectionReason}</div>}
                  <div className="mt-2 inline-flex gap-1">
                    <button className="px-2 py-1 rounded text-white text-xs" style={{ backgroundColor: VENDOR_COLORS.success }} onClick={() => vendorManagement.reviewDocument(app.applicationId, doc.type, 'APPROVE', 'ADMIN-USER')}>Approve</button>
                    <button className="px-2 py-1 rounded text-white text-xs" style={{ backgroundColor: VENDOR_COLORS.error }} onClick={() => vendorManagement.reviewDocument(app.applicationId, doc.type, 'REJECT', 'ADMIN-USER', 'Document mismatch')}>Reject</button>
                    <button className="px-2 py-1 rounded text-white text-xs" style={{ backgroundColor: VENDOR_COLORS.warning }} onClick={() => vendorManagement.reviewDocument(app.applicationId, doc.type, 'REQUEST_REUPLOAD', 'ADMIN-USER', 'Please reupload clearer copy')}>Request Reupload</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-slate-200 rounded p-3 text-sm">
            <div className="font-semibold">Overall Document Status</div>
            <div className="mt-1">Verified: <span style={{ color: VENDOR_COLORS.success }}>{verified}/8</span></div>
            <div>Pending: <span style={{ color: VENDOR_COLORS.warning }}>{pending}/8</span></div>
            <div>Rejected: <span style={{ color: VENDOR_COLORS.error }}>{rejected}/8</span></div>
            <div className="mt-2" style={{ color: '#FB8C00' }}>Action required: Insurance expiring in 15 days</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-slate-900">Review Actions</h2>

          <div>
            <div className="text-sm text-slate-600">Reviewer Notes</div>
            <textarea className="w-full border border-slate-300 rounded px-2 py-2 text-sm min-h-[100px]" value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="mt-2 px-3 py-1 rounded text-white text-xs" style={{ backgroundColor: VENDOR_COLORS.info }} onClick={() => {
              if (!note.trim()) return;
              vendorManagement.addApplicationNote(app.applicationId, 'ADMIN-USER', note.trim());
              setNote('');
            }}>Add Note</button>
          </div>

          <div className="border border-slate-200 rounded p-3 text-sm space-y-1">
            <div className="font-semibold">Background Verification</div>
            <CheckRow label="Company exists" ok />
            <CheckRow label="No negative records" ok />
            <CheckRow label="References contacted" status="IN PROGRESS" color={VENDOR_COLORS.info} />
            <CheckRow label="Credit check" status="PENDING" color={VENDOR_COLORS.warning} />
          </div>

          <div className="border border-slate-200 rounded p-3 text-sm space-y-2">
            <div className="font-semibold">Approval Decision Panel</div>
            <label className="inline-flex items-center gap-1 text-xs"><input type="checkbox" checked={conditional} onChange={(e) => setConditional(e.target.checked)} />Approve with conditions</label>
            {conditional && <input className="w-full border border-slate-300 rounded px-2 py-1" value={conditionText} onChange={(e) => setConditionText(e.target.value)} />}
            <button className="w-full px-3 py-2 rounded text-white font-semibold" style={{ backgroundColor: VENDOR_COLORS.success }} onClick={approve}>APPROVE VENDOR</button>
            <button className="w-full px-3 py-2 rounded text-white font-semibold" style={{ backgroundColor: VENDOR_COLORS.warning }} onClick={requestInfo}>REQUEST MORE INFO</button>
            <button className="w-full px-3 py-2 rounded text-white font-semibold" style={{ backgroundColor: VENDOR_COLORS.error }} onClick={reject}>REJECT APPLICATION</button>
          </div>

          <div className="border border-slate-200 rounded p-3 text-xs text-slate-600">
            <div className="font-semibold text-slate-800 mb-1">Post-Approval Actions</div>
            <div>• Generate Vendor ID</div>
            <div>• Create login credentials</div>
            <div>• Send welcome email + kit</div>
            <div>• Activate vendor portal access</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="font-semibold text-slate-900 mb-2">Audit Notes</h3>
        <div className="space-y-1 text-sm">
          {app.notes.slice().reverse().map((n, idx) => (
            <div key={idx} className="border-b border-slate-100 pb-1">
              <span className="font-medium">{n.by}</span> • <span className="text-xs text-slate-500">{new Date(n.at).toLocaleString()}</span>
              <div>{n.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs text-slate-500">{label}</div><div className="font-medium">{value || '-'}</div></div>;
}

function CheckRow({ label, ok, status, color }: { label: string; ok?: boolean; status?: string; color?: string }) {
  if (ok) return <div>✅ {label}</div>;
  return <div><span style={{ color }}>{status}</span> - {label}</div>;
}

