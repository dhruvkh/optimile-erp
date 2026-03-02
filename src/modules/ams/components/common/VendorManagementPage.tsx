import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { vendorManagement } from '../../services/vendorManagement';
import { masterDataStore } from '../../../../shared/services/masterDataStore';
import { ShieldCheck, ShieldAlert, ExternalLink } from 'lucide-react';

export function VendorManagementPage() {
  const [tick, setTick] = useState(0);
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  const query = searchParams.get('q') || '';

  useEffect(() => {
    const unsub1 = vendorManagement.subscribe(() => setTick((v) => v + 1));
    const unsub2 = masterDataStore.subscribe(() => setTick((v) => v + 1));
    return () => { unsub1(); unsub2(); };
  }, []);

  const snapshot = vendorManagement.getSnapshot();
  const platformVendors = masterDataStore.getVendors();

  // Combine AMS vendor accounts with platform vendor data
  const vendors = useMemo(() => {
    let base = snapshot.vendors;
    if (filter === 'recently_imported') {
      const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
      base = base.filter((v) => v.createdAt >= since);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      base = base.filter((v) => [v.vendorId, v.companyName, v.email, v.contactName].join(' ').toLowerCase().includes(q));
    }
    return base;
  }, [snapshot.vendors, filter, query, tick]);

  // Platform stats
  const totalPlatform = platformVendors.length;
  const amsSourced = platformVendors.filter(v => v.createdFrom === 'AMS').length;
  const tmsSourced = platformVendors.filter(v => v.createdFrom === 'TMS').length;
  const fullyVerified = platformVendors.filter(v => v.verificationLevel === 'FULL').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendor Management</h1>
          <p className="text-slate-500">Manage vendor accounts, statuses, and onboarding pipeline. <span className="text-xs text-blue-600">(AMS — Full Onboarding)</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/ams/vendors/register" className="px-3 py-2 rounded bg-blue-600 text-white text-sm">
            + Onboard Vendor
          </Link>
          <Link to="/ams/vendors/bulk-import" className="px-3 py-2 rounded border border-slate-300 text-slate-700 text-sm">
            Import Vendors
          </Link>
        </div>
      </div>

      {/* Platform-wide stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat title="Platform Total" value={`${totalPlatform}`} panelClass="bg-blue-50 border-blue-100" valueClass="text-blue-700" />
        <Stat title="AMS Onboarded" value={`${amsSourced}`} panelClass="bg-purple-50 border-purple-100" valueClass="text-purple-700" />
        <Stat title="TMS Quick-Add" value={`${tmsSourced}`} panelClass="bg-slate-50 border-slate-200" valueClass="text-slate-700" />
        <Stat title="Fully Verified" value={`${fullyVerified}`} panelClass="bg-green-50 border-green-100" valueClass="text-green-700" />
        <Stat title="Pending (AMS)" value={`${snapshot.vendors.filter((v) => v.status === 'PENDING_VERIFICATION').length}`} panelClass="bg-amber-50 border-amber-100" valueClass="text-amber-700" />
      </div>

      {/* AMS source indicator */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm">
        <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
        <span className="text-slate-700">
          AMS provides <strong>full verification</strong> (GST, PAN, transport license, insurance, bank verification). TMS provides quick-add with basic details.
          All vendors share the <strong>Platform Vendor Master</strong>.
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Chip to="/ams/vendors/onboarding" active={filter === 'all'} label="AMS Accounts" />
            <Chip to="/ams/vendors/onboarding" active={filter === 'recently_imported'} label="Recently Imported" />
            <Chip to="/ams/vendors/onboarding" active={false} label="Import History" />
          </div>
          <div className="text-xs text-slate-500">Showing {vendors.length} AMS vendor accounts</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-2 py-2 text-left">Vendor ID</th>
              <th className="px-2 py-2 text-left">Company</th>
              <th className="px-2 py-2 text-left">Contact</th>
              <th className="px-2 py-2 text-left">Email</th>
              <th className="px-2 py-2 text-left">Verified</th>
              <th className="px-2 py-2 text-left">Status</th>
              <th className="px-2 py-2 text-left">Created</th>
              <th className="px-2 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => {
              // Try to find matching platform vendor
              const platformMatch = platformVendors.find(
                pv => pv.companyName === vendor.companyName || pv.email === vendor.email
              );
              return (
                <tr key={vendor.vendorId} className="border-t border-slate-100">
                  <td className="px-2 py-2 text-xs font-mono">{vendor.vendorId}</td>
                  <td className="px-2 py-2">
                    <div>{vendor.companyName}</div>
                    {platformMatch && (
                      <span className="text-[10px] text-purple-600 font-mono">{platformMatch.id}</span>
                    )}
                  </td>
                  <td className="px-2 py-2">{vendor.contactName}</td>
                  <td className="px-2 py-2 text-xs">{vendor.email}</td>
                  <td className="px-2 py-2">
                    {platformMatch?.verificationLevel === 'FULL' ? (
                      <span className="flex items-center text-green-600 text-xs"><ShieldCheck className="h-3 w-3 mr-1" /> Full</span>
                    ) : (
                      <span className="flex items-center text-amber-500 text-xs"><ShieldAlert className="h-3 w-3 mr-1" /> Basic</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusClass(vendor.status)}`}>
                      {vendor.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-500">{new Date(vendor.createdAt).toLocaleDateString()}</td>
                  <td className="px-2 py-2 text-right">
                    <Link to="/ams/vendors/status-management" className="text-blue-700 hover:underline text-xs">
                      Manage
                    </Link>
                  </td>
                </tr>
              );
            })}
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-500">No vendors found for selected filter.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
  panelClass,
  valueClass,
}: {
  title: string;
  value: string;
  panelClass: string;
  valueClass: string;
}) {
  return (
    <div className={`rounded border p-3 ${panelClass}`}>
      <div className="text-xs text-slate-500">{title}</div>
      <div className={`text-2xl font-bold mt-1 ${valueClass}`}>{value}</div>
    </div>
  );
}

function statusClass(status: string) {
  if (status === 'ACTIVE') return 'bg-green-100 text-green-700';
  if (status === 'PENDING_VERIFICATION') return 'bg-amber-100 text-amber-700';
  if (status === 'ON_HOLD') return 'bg-blue-100 text-blue-700';
  if (status === 'BLOCKED') return 'bg-red-100 text-red-700';
  if (status === 'INACTIVE') return 'bg-slate-100 text-slate-600';
  return 'bg-slate-100 text-slate-700';
}

function Chip({ to, active, label }: { to: string; active: boolean; label: string }) {
  return (
    <Link to={to} className={`px-3 py-1 rounded-full text-xs border ${active ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}>
      {label}
    </Link>
  );
}
