import React from 'react';
import { Link } from 'react-router-dom';
import { VENDOR_COLORS, vendorManagement } from '../../services/vendorManagement';

export function VendorOnboardingDashboard() {
  const snap = vendorManagement.getSnapshot();
  const pending = snap.applications.filter((a) => ['NEW', 'UNDER_REVIEW', 'MORE_INFO'].includes(a.status));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vendor Onboarding</h1>
        <p className="text-slate-500">Central hub for registration, approvals, imports, and lifecycle management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card title="Pending Applications" value={`${pending.length}`} color={VENDOR_COLORS.warning} />
        <Card title="Active Vendors" value={`${snap.vendors.filter((v) => v.status === 'ACTIVE').length}`} color={VENDOR_COLORS.success} />
        <Card title="On Hold" value={`${snap.vendors.filter((v) => v.status === 'ON_HOLD').length}`} color={VENDOR_COLORS.info} />
        <Card title="Blocked" value={`${snap.vendors.filter((v) => v.status === 'BLOCKED').length}`} color={VENDOR_COLORS.error} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <ActionCard title="Vendor Registration Form" description="Public-facing onboarding form" to="/ams/vendors/register" button="Open Form" color={VENDOR_COLORS.info} />
        <ActionCard title="Pending Approvals" description="Review and approve applications" to="/ams/vendors/pending-approvals" button="Review Queue" color={VENDOR_COLORS.warning} />
        <ActionCard title="Bulk Vendor Onboarding" description="Import multiple vendors at once" to="/ams/vendors/bulk-import" button="Bulk Import" color={VENDOR_COLORS.premium} />
        <ActionCard title="Status Management" description="Change vendor lifecycle states" to="/ams/vendors/status-management" button="Manage Status" color={VENDOR_COLORS.neutral} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="font-semibold text-slate-900 mb-2">Recent Applications</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-2 py-2 text-left">Application ID</th>
                <th className="px-2 py-2 text-left">Company</th>
                <th className="px-2 py-2 text-left">Applied Date</th>
                <th className="px-2 py-2 text-left">Status</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {snap.applications.slice(0, 8).map((app) => (
                <tr key={app.applicationId} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-mono text-xs">{app.applicationId}</td>
                  <td className="px-2 py-2">{app.companyInfo.companyName}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{new Date(app.appliedDate).toLocaleString()}</td>
                  <td className="px-2 py-2"><StatusBadge status={app.status} /></td>
                  <td className="px-2 py-2 text-right"><Link className="text-blue-700 hover:underline" to={`/ams/vendors/review/${app.applicationId}`}>Review</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="rounded-lg p-3 text-white" style={{ backgroundColor: color }}>
      <div className="text-xs opacity-90">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function ActionCard({ title, description, to, button, color }: { title: string; description: string; to: string; button: string; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="font-semibold text-slate-900">{title}</div>
      <div className="text-sm text-slate-500 mt-1">{description}</div>
      <Link to={to} className="mt-3 inline-flex text-white px-3 py-2 rounded text-sm" style={{ backgroundColor: color }}>{button}</Link>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    NEW: VENDOR_COLORS.warning,
    UNDER_REVIEW: VENDOR_COLORS.info,
    APPROVED: VENDOR_COLORS.success,
    REJECTED: VENDOR_COLORS.error,
    MORE_INFO: VENDOR_COLORS.warning,
  };
  return <span className="px-2 py-1 rounded text-white text-xs font-semibold" style={{ backgroundColor: colors[status] || VENDOR_COLORS.neutral }}>{status.replace('_', ' ')}</span>;
}
