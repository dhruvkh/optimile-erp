import React, { useEffect, useState } from 'react';
import { VENDOR_COLORS, vendorManagement, VendorStatus } from '../../services/vendorManagement';

const statuses: VendorStatus[] = ['ACTIVE', 'PENDING_VERIFICATION', 'ON_HOLD', 'BLOCKED', 'EXPIRING_DOCUMENTS', 'INACTIVE', 'CONDITIONALLY_APPROVED'];

function colorFor(status: VendorStatus) {
  if (status === 'ACTIVE') return VENDOR_COLORS.success;
  if (status === 'PENDING_VERIFICATION') return VENDOR_COLORS.warning;
  if (status === 'ON_HOLD') return VENDOR_COLORS.info;
  if (status === 'BLOCKED') return VENDOR_COLORS.error;
  if (status === 'EXPIRING_DOCUMENTS') return '#FB8C00';
  if (status === 'INACTIVE') return VENDOR_COLORS.neutral;
  if (status === 'CONDITIONALLY_APPROVED') return VENDOR_COLORS.success;
  return VENDOR_COLORS.neutral;
}

export function VendorStatusManagementPage() {
  const [tick, setTick] = useState(0);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [nextStatus, setNextStatus] = useState<VendorStatus>('ACTIVE');
  const [reason, setReason] = useState('Status update by admin');

  useEffect(() => {
    const unsub = vendorManagement.subscribe(() => setTick((v) => v + 1));
    return unsub;
  }, []);

  const snap = vendorManagement.getSnapshot();
  const selected = selectedVendorId ? vendorManagement.getVendor(selectedVendorId) : undefined;

  const applyStatus = () => {
    if (!selectedVendorId || !reason.trim()) return;
    vendorManagement.changeVendorStatus(selectedVendorId, nextStatus, 'ADMIN-USER', reason.trim());
    setReason('Status update by admin');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vendor Status Management</h1>
        <p className="text-slate-500">Lifecycle state updates with reason tracking and audit history.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
          <select className="border border-slate-300 rounded px-2 py-2" value={selectedVendorId} onChange={(e) => {
            setSelectedVendorId(e.target.value);
            const vendor = vendorManagement.getVendor(e.target.value);
            if (vendor) setNextStatus(vendor.status);
          }}>
            <option value="">Select Vendor</option>
            {snap.vendors.map((v) => <option key={v.vendorId} value={v.vendorId}>{v.vendorId} - {v.companyName}</option>)}
          </select>

          <select className="border border-slate-300 rounded px-2 py-2" value={nextStatus} onChange={(e) => setNextStatus(e.target.value as VendorStatus)}>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <input className="border border-slate-300 rounded px-2 py-2" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for change" />
          <button className="px-3 py-2 rounded text-white" style={{ backgroundColor: VENDOR_COLORS.info }} onClick={applyStatus}>Apply Status Change</button>
        </div>

        {selected && (
          <div className="rounded p-3 text-white" style={{ backgroundColor: colorFor(selected.status) }}>
            Current Status: {selected.status.replace(/_/g, ' ')}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-2 py-2 text-left">Vendor ID</th>
              <th className="px-2 py-2 text-left">Company</th>
              <th className="px-2 py-2 text-left">Status</th>
              <th className="px-2 py-2 text-left">Email</th>
              <th className="px-2 py-2 text-left">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {snap.vendors.map((v) => (
              <tr key={v.vendorId} className="border-t border-slate-100">
                <td className="px-2 py-2 font-mono text-xs">{v.vendorId}</td>
                <td className="px-2 py-2">{v.companyName}</td>
                <td className="px-2 py-2"><span className="px-2 py-1 rounded text-white text-xs" style={{ backgroundColor: colorFor(v.status) }}>{v.status.replace(/_/g, ' ')}</span></td>
                <td className="px-2 py-2 text-xs">{v.email}</td>
                <td className="px-2 py-2 text-xs text-slate-500">{new Date(v.lastActiveAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="font-semibold text-slate-900 mb-2">Status History</div>
          <div className="space-y-2 text-sm">
            {selected.statusHistory.map((h, idx) => (
              <div key={idx} className="border border-slate-200 rounded p-2">
                <div><strong>{h.from}</strong> → <strong>{h.to}</strong></div>
                <div className="text-xs text-slate-500">{h.changedBy} • {new Date(h.changedAt).toLocaleString()}</div>
                <div className="text-xs">Reason: {h.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

