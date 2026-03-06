import React, { useMemo, useState } from 'react';
import { AlertCircle, Clock3, Download, Search, Truck, Users, X } from 'lucide-react';

type DriverType = 'Permanent' | 'Contract';
type ViolationSeverity = 'High' | 'Medium' | 'Low';

interface DriverViolation {
  id: string;
  title: string;
  details: string;
  severity: ViolationSeverity;
  date: string;
  vehicle: string;
}

interface DriverItem {
  id: string;
  name: string;
  phone: string;
  license: string;
  type: DriverType;
  totalViolations: number;
  violations: DriverViolation[];
}

const DRIVERS: DriverItem[] = [
  {
    id: 'd1',
    name: 'Ramesh Kumar',
    phone: '+91 98765 43210',
    license: 'MH14 20180000123',
    type: 'Permanent',
    totalViolations: 2,
    violations: [
      {
        id: 'v1',
        title: 'Harsh Braking',
        details: 'Deceleration > 3.5m/s² detected at highway exit ramp.',
        severity: 'High',
        date: '25/02/2026',
        vehicle: 'MH-46-BM-2849',
      },
      {
        id: 'v2',
        title: 'Excessive Idling',
        details: 'Engine idle > 15 mins at unmapped location.',
        severity: 'Low',
        date: '25/02/2026',
        vehicle: 'MH-46-BM-2849',
      },
    ],
  },
  {
    id: 'd2',
    name: 'Suresh Singh',
    phone: '+91 98123 45678',
    license: 'DL04 20190000456',
    type: 'Contract',
    totalViolations: 3,
    violations: [
      {
        id: 'v3',
        title: 'Overspeeding',
        details: 'Speed > 95 km/h sustained for 60 seconds.',
        severity: 'High',
        date: '24/02/2026',
        vehicle: 'DL-11-XY-1176',
      },
    ],
  },
  { id: 'd3', name: 'Mahesh Patil', phone: '+91 98230 77881', license: 'MH12 20170000987', type: 'Permanent', totalViolations: 0, violations: [] },
  { id: 'd4', name: 'Anil Yadav', phone: '+91 99301 22334', license: 'UP16 20160000444', type: 'Contract', totalViolations: 0, violations: [] },
  { id: 'd5', name: 'Ravindra Jadhav', phone: '+91 97654 88990', license: 'MH20 20150000678', type: 'Permanent', totalViolations: 0, violations: [] },
  { id: 'd6', name: 'Sunil Chauhan', phone: '+91 98987 55443', license: 'GJ05 20180000321', type: 'Contract', totalViolations: 0, violations: [] },
  { id: 'd7', name: 'Balwant Singh', phone: '+91 94678 11223', license: 'PB10 20140000888', type: 'Permanent', totalViolations: 0, violations: [] },
  { id: 'd8', name: 'Kiran Rao', phone: '+91 98450 66778', license: 'KA01 20190000111', type: 'Contract', totalViolations: 0, violations: [] },
  { id: 'd9', name: 'Prakash Meena', phone: '+91 99822 33445', license: 'RJ19 20160000555', type: 'Permanent', totalViolations: 0, violations: [] },
];

const severityClass = (severity: ViolationSeverity) => {
  if (severity === 'High') return 'border-red-200 bg-red-50 text-red-600';
  if (severity === 'Medium') return 'border-orange-200 bg-orange-50 text-orange-600';
  return 'border-blue-200 bg-blue-50 text-blue-600';
};

export const DriverBehaviorPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<DriverItem | null>(null);

  const visibleDrivers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return DRIVERS;
    return DRIVERS.filter((driver) => driver.name.toLowerCase().includes(q) || driver.phone.includes(q) || driver.license.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Driver Behavior Intelligence</h1>
        <p className="mt-2 text-sm text-slate-500">Real-time driving pattern analysis from Telematics & OBD.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Users className="h-6 w-6 text-slate-500" />
            Driver List
          </h2>

          <div className="relative w-full md:w-[340px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drivers..."
              className="h-11 w-full rounded-xl border border-gray-300 pl-11 pr-4 text-sm text-slate-700 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-hidden">
          <table className="w-full table-fixed">
            <thead className="border-b border-gray-200 bg-slate-50/60 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="w-[34%] px-6 py-4 font-medium">Driver Name / Phone</th>
                <th className="w-[24%] px-6 py-4 font-medium">License</th>
                <th className="w-[16%] px-6 py-4 font-medium">Type</th>
                <th className="w-[14%] px-6 py-4 text-center font-medium">Total Violations</th>
                <th className="w-[12%] px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleDrivers.map((driver) => (
                <tr key={driver.id} className="border-b border-gray-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                        {driver.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{driver.name}</p>
                        <p className="text-xs text-slate-500">{driver.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{driver.license}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">{driver.type}</span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-medium text-slate-900">{driver.totalViolations}</td>
                  <td className="px-6 py-4 text-right">
                    <button type="button" onClick={() => setSelectedDriver(driver)} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {visibleDrivers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    No drivers found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDriver ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedDriver(null)}>
          <div className="w-full max-w-[900px] rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-xl font-bold text-slate-900">Driver Report: {selectedDriver.name}</h3>
              <button type="button" onClick={() => setSelectedDriver(null)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-7 w-7" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-semibold text-slate-600">
                    {selectedDriver.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-slate-900">{selectedDriver.name}</p>
                    <p className="text-sm text-slate-500">Phone: {selectedDriver.phone}</p>
                    <p className="text-sm text-slate-500">License: {selectedDriver.license}</p>
                  </div>
                </div>
                <div className="min-w-[210px] rounded-xl border border-gray-300 bg-white px-4 py-3 text-center">
                  <p className="text-sm font-semibold uppercase text-slate-500">Total Violations</p>
                  <p className="text-3xl font-bold text-blue-600">{selectedDriver.totalViolations}</p>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-bold text-slate-900">ALL VIOLATIONS</h4>
                <div className="space-y-3">
                  {selectedDriver.violations.length > 0 ? (
                    selectedDriver.violations.map((violation) => (
                      <div key={violation.id} className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="mb-1 flex items-start justify-between">
                          <div className="inline-flex items-center gap-2">
                            {violation.title.toLowerCase().includes('idling') ? (
                              <Clock3 className="h-5 w-5 text-slate-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-slate-500" />
                            )}
                            <p className="text-base font-semibold text-slate-900">{violation.title}</p>
                          </div>
                          <p className="text-sm text-slate-400">{violation.date}</p>
                        </div>
                        <p className="text-sm text-slate-600">{violation.details}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`inline-flex rounded-full border px-4 py-1 text-sm font-semibold ${severityClass(violation.severity)}`}>
                            {violation.severity}
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm text-slate-400">
                            <Truck className="h-4 w-4" />
                            {violation.vehicle}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-gray-200 p-6 text-sm text-slate-500">No violations recorded for this driver.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-4">
              <button type="button" onClick={() => setSelectedDriver(null)} className="rounded-xl border border-gray-300 px-5 py-3 text-sm text-slate-700 hover:bg-gray-50">
                Close
              </button>
              <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                <Download className="h-5 w-5" />
                Download Full Report
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
