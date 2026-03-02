import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { vendorManagement, VENDOR_COLORS } from '../../services/vendorManagement';

function statusColor(status: string) {
  if (status === 'NEW') return VENDOR_COLORS.warning;
  if (status === 'UNDER_REVIEW') return VENDOR_COLORS.info;
  if (status === 'APPROVED') return VENDOR_COLORS.success;
  if (status === 'REJECTED') return VENDOR_COLORS.error;
  return VENDOR_COLORS.warning;
}

function priorityColor(priority: string) {
  if (priority === 'HIGH') return VENDOR_COLORS.error;
  if (priority === 'MEDIUM') return '#FB8C00';
  return VENDOR_COLORS.success;
}

export function VendorPendingApprovalsPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsub = vendorManagement.subscribe(() => setTick((v) => v + 1));
    return unsub;
  }, []);

  const snapshot = vendorManagement.getSnapshot();
  const apps = snapshot.applications;

  const summary = useMemo(() => ({
    newCount: apps.filter((a) => a.status === 'NEW').length,
    underReview: apps.filter((a) => a.status === 'UNDER_REVIEW').length,
    approvedToday: apps.filter((a) => a.status === 'APPROVED' && new Date(a.reviewedAt || 0).toDateString() === new Date().toDateString()).length,
    rejected: apps.filter((a) => a.status === 'REJECTED').length,
  }), [apps, tick]);

  const quickApprove = (appId: string) => {
    vendorManagement.approveApplication(appId, 'ADMIN-USER');
  };

  const reject = (appId: string) => {
    const reason = prompt('Rejection reason', 'Insufficient documentation') || 'Rejected by reviewer';
    vendorManagement.rejectApplication(appId, 'ADMIN-USER', reason);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pending Vendor Approvals</h1>
        <p className="text-slate-500">Review and process onboarding applications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card title="New Applications" value={`${summary.newCount}`} color={VENDOR_COLORS.warning} />
        <Card title="Under Review" value={`${summary.underReview}`} color={VENDOR_COLORS.info} />
        <Card title="Approved Today" value={`${summary.approvedToday}`} color={VENDOR_COLORS.success} />
        <Card title="Rejected" value={`${summary.rejected}`} color={VENDOR_COLORS.error} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-2 py-2 text-left">Application ID</th>
              <th className="px-2 py-2 text-left">Company Name</th>
              <th className="px-2 py-2 text-left">Applied Date</th>
              <th className="px-2 py-2 text-left">Status</th>
              <th className="px-2 py-2 text-left">Documents</th>
              <th className="px-2 py-2 text-left">Assigned To</th>
              <th className="px-2 py-2 text-left">Priority</th>
              <th className="px-2 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => {
              const doneDocs = app.documents.filter((d) => ['UPLOADED', 'VERIFYING', 'VERIFIED', 'EXPIRING_SOON'].includes(d.status)).length;
              const complete = doneDocs >= 8;
              return (
                <tr key={app.applicationId} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-2 py-2 font-mono text-xs">{app.applicationId}</td>
                  <td className="px-2 py-2">{app.companyInfo.companyName}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{new Date(app.appliedDate).toLocaleDateString()}</td>
                  <td className="px-2 py-2"><span className="px-2 py-1 rounded text-white text-xs font-semibold" style={{ backgroundColor: statusColor(app.status) }}>{app.status.replace('_', ' ')}</span></td>
                  <td className="px-2 py-2"><span className="px-2 py-1 rounded text-white text-xs" style={{ backgroundColor: complete ? VENDOR_COLORS.success : VENDOR_COLORS.error }}>{doneDocs}/8</span></td>
                  <td className="px-2 py-2 text-xs">{app.assignedTo || '-'}</td>
                  <td className="px-2 py-2"><span className="px-2 py-1 rounded text-white text-xs" style={{ backgroundColor: priorityColor(app.priority) }}>{app.priority}</span></td>
                  <td className="px-2 py-2 text-right">
                    <div className="inline-flex gap-1">
                      <Link to={`/ams/vendors/review/${app.applicationId}`} className="px-2 py-1 rounded text-white text-xs" style={{ backgroundColor: VENDOR_COLORS.info }}>Review</Link>
                      <button onClick={() => quickApprove(app.applicationId)} className="px-2 py-1 rounded text-white text-xs" style={{ backgroundColor: VENDOR_COLORS.success }}>Quick Approve</button>
                      <button onClick={() => reject(app.applicationId)} className="px-2 py-1 rounded text-white text-xs" style={{ backgroundColor: VENDOR_COLORS.error }}>Reject</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="rounded-lg p-3 text-white" style={{ backgroundColor: color }}>
      <div className="text-xs opacity-95">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

