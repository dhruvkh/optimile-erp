import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, AlertTriangle, Search, Plus, X, Clock, CheckCircle,
  AlertCircle, ChevronDown, Filter, FileText, IndianRupee, User,
  ArrowRight, ChevronRight, Eye, Shield, Package
} from 'lucide-react';
import { useToast } from '../../../../shared/context/ToastContext';
import { ptlStore } from '../../services/ptlStore';
import type { PTLException, PTLDocket, ExceptionType, ExceptionSeverity, ExceptionStatus } from '../../services/ptlTypes';

// ─── UI Atoms ────────────────────────────────────────────────────────────────

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>{children}</div>
);

const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'blue' }) => {
  const colors: Record<string, string> = { blue: 'bg-blue-100 text-blue-700', green: 'bg-green-100 text-green-700', amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700', purple: 'bg-purple-100 text-purple-700', gray: 'bg-gray-100 text-gray-600' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] ?? colors.blue}`}>{children}</span>;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<ExceptionSeverity, string> = {
  Critical: 'red', High: 'red', Medium: 'amber', Low: 'gray',
};

const STATUS_COLORS: Record<ExceptionStatus, string> = {
  'Open': 'red', 'Under Investigation': 'amber', 'Resolved': 'green',
  'Escalated': 'red', 'Claim Raised': 'purple',
};

const TYPE_SEVERITY: Record<ExceptionType, ExceptionSeverity> = {
  Lost: 'Critical', Damaged: 'High', Delayed: 'Medium', 'Short-Delivery': 'High',
  Returned: 'Medium', 'Address-Change': 'Low', 'Customs-Hold': 'High', Other: 'Medium',
};

const EXCEPTION_TYPES: ExceptionType[] = ['Delayed', 'Lost', 'Damaged', 'Short-Delivery', 'Returned', 'Address-Change', 'Customs-Hold', 'Other'];

// ─── Raise Exception Modal ────────────────────────────────────────────────────

interface RaiseExceptionModalProps { onClose: () => void; }

const RaiseExceptionModal: React.FC<RaiseExceptionModalProps> = ({ onClose }) => {
  const { addToast } = useToast();
  const [docketSearch, setDocketSearch] = useState('');
  const [foundDocket, setFoundDocket] = useState<PTLDocket | null>(null);
  const [type, setType] = useState<ExceptionType>('Delayed');
  const [description, setDescription] = useState('');
  const [reportedBy, setReportedBy] = useState('');

  const handleSearch = () => {
    const all = ptlStore.getDockets();
    const found = all.find(d => d.docketNumber.toLowerCase() === docketSearch.toLowerCase() ||
      (d.lrNumber ?? '').toLowerCase() === docketSearch.toLowerCase());
    if (found) { setFoundDocket(found); } else { addToast({ type: 'error', message: 'Docket not found' }); }
  };

  const handleRaise = () => {
    if (!foundDocket || !description || !reportedBy) {
      addToast({ type: 'error', message: 'Fill all fields' }); return;
    }
    const exc: PTLException = {
      id: ptlStore.generateId('exc'),
      docketId: foundDocket.id, docketNumber: foundDocket.docketNumber, clientName: foundDocket.clientName,
      type, severity: TYPE_SEVERITY[type],
      status: 'Open', description, reportedAt: new Date().toISOString(), reportedBy,
      claimStatus: 'Not Raised',
    };
    ptlStore.addException(exc);
    ptlStore.updateDocket(foundDocket.id, {
      status: 'Exception',
      exceptionIds: [...(foundDocket.exceptionIds ?? []), exc.id],
    });
    addToast({ type: 'success', message: `Exception raised for ${foundDocket.docketNumber}` });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-800">Raise New Exception</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-4 space-y-4">
          {/* Docket search */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Find Docket *</label>
            <div className="flex gap-2">
              <input value={docketSearch} onChange={e => setDocketSearch(e.target.value)} placeholder="Enter docket number or LR"
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={handleSearch} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Search</button>
            </div>
            {foundDocket && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-mono font-semibold text-blue-700">{foundDocket.docketNumber}</span>
                  <span className="text-gray-500">{foundDocket.clientName}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{foundDocket.pickupCity} → {foundDocket.deliveryCity} · Status: {foundDocket.status}</div>
              </div>
            )}
          </div>

          {/* Exception type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Exception Type *</label>
            <div className="grid grid-cols-4 gap-2">
              {EXCEPTION_TYPES.map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`px-2 py-1.5 rounded-lg border text-xs text-center transition-colors ${type === t ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge color={SEVERITY_COLORS[TYPE_SEVERITY[type]]}>Auto-severity: {TYPE_SEVERITY[type]}</Badge>
              <span className="text-xs text-gray-400">(based on type)</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe the issue in detail..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {/* Reported by */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reported By *</label>
            <input value={reportedBy} onChange={e => setReportedBy(e.target.value)} placeholder="Your name / department"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleRaise} disabled={!foundDocket || !description || !reportedBy}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40">
            Raise Exception
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Exception Detail Panel ───────────────────────────────────────────────────

interface ExceptionDetailProps { exc: PTLException; onClose: () => void; }

const ExceptionDetailPanel: React.FC<ExceptionDetailProps> = ({ exc, onClose }) => {
  const { addToast } = useToast();
  const [notes, setNotes] = useState(exc.investigationNotes ?? '');
  const [resolution, setResolution] = useState(exc.resolution ?? '');
  const [claimAmount, setClaimAmount] = useState<string>(exc.claimAmount?.toString() ?? '');
  const [insurerRef, setInsurerRef] = useState(exc.insurerReference ?? '');
  const docket = ptlStore.getDocket(exc.docketId);

  const updateStatus = (status: ExceptionStatus) => {
    const fields: Partial<PTLException> = { status, investigationNotes: notes };
    if (status === 'Resolved') { fields.resolution = resolution; fields.resolvedAt = new Date().toISOString(); }
    if (status === 'Claim Raised') { fields.claimStatus = 'Raised'; fields.claimAmount = Number(claimAmount); fields.insurerReference = insurerRef; }
    ptlStore.updateException(exc.id, fields);
    addToast({ type: 'success', message: `Exception ${exc.id} updated to ${status}` });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-end z-40">
      <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-800">Exception #{exc.id.slice(-6)}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge color={SEVERITY_COLORS[exc.severity]}>{exc.severity}</Badge>
              <Badge color={STATUS_COLORS[exc.status]}>{exc.status}</Badge>
              <Badge color="gray">{exc.type}</Badge>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Docket info */}
          {docket && (
            <Card className="p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Linked Docket</h4>
              <div className="font-mono text-sm font-bold text-blue-700">{docket.docketNumber}</div>
              <div className="text-sm text-gray-600 mt-1">{docket.pickupCity} → {docket.deliveryCity}</div>
              <div className="text-xs text-gray-400">{docket.clientName} · {docket.totalPieces} pcs · {docket.chargeableWeight} kg</div>
            </Card>
          )}

          {/* Description */}
          <Card className="p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Issue Description</h4>
            <p className="text-sm text-gray-700">{exc.description}</p>
            <div className="text-xs text-gray-400 mt-2">Reported by {exc.reportedBy} · {new Date(exc.reportedAt).toLocaleString()}</div>
          </Card>

          {/* Investigation notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Investigation Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add investigation notes..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {/* Resolution */}
          {exc.status !== 'Resolved' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Resolution</label>
              <textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={2} placeholder="Describe how this was resolved..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          )}
          {exc.resolvedAt && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <CheckCircle className="inline w-4 h-4 mr-1" /> Resolved on {new Date(exc.resolvedAt).toLocaleDateString()}
              <div className="mt-1 text-xs">{exc.resolution}</div>
            </div>
          )}

          {/* Claim management */}
          {(exc.severity === 'Critical' || exc.severity === 'High') && (
            <Card className="p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Claim Management</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Claim Amount (₹)</label>
                  <input type="number" value={claimAmount} onChange={e => setClaimAmount(e.target.value)} placeholder="0"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Insurer Reference</label>
                  <input value={insurerRef} onChange={e => setInsurerRef(e.target.value)} placeholder="INS-XXXX-XXXX"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                {exc.claimStatus && exc.claimStatus !== 'Not Raised' && (
                  <Badge color="purple">{exc.claimStatus}</Badge>
                )}
              </div>
            </Card>
          )}

          {/* Action buttons */}
          {exc.status !== 'Resolved' && (
            <div className="space-y-2">
              {exc.status === 'Open' && (
                <button onClick={() => updateStatus('Under Investigation')} className="w-full py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                  Begin Investigation
                </button>
              )}
              {(exc.severity === 'Critical' || exc.severity === 'High') && exc.status !== 'Claim Raised' && claimAmount && (
                <button onClick={() => updateStatus('Claim Raised')} className="w-full py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  <IndianRupee className="inline w-4 h-4 mr-1" /> Raise Claim (₹{Number(claimAmount).toLocaleString()})
                </button>
              )}
              {exc.status !== 'Escalated' && (
                <button onClick={() => updateStatus('Escalated')} className="w-full py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                  Escalate
                </button>
              )}
              <button onClick={() => updateStatus('Resolved')} className="w-full py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                <CheckCircle className="inline w-4 h-4 mr-1" /> Mark Resolved
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const PTLExceptions: React.FC = () => {
  const navigate = useNavigate();
  const [exceptions, setExceptions] = useState(ptlStore.getExceptions());
  const [dockets, setDockets] = useState(ptlStore.getDockets());
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [selectedExc, setSelectedExc] = useState<PTLException | null>(null);
  const [filterType, setFilterType] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => ptlStore.subscribe(() => {
    setExceptions(ptlStore.getExceptions());
    setDockets(ptlStore.getDockets());
  }), []);

  // SLA breach alerts — dockets overdue
  const slaBreaches = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return dockets.filter(d =>
      !['Delivered', 'RTO Completed', 'Exception'].includes(d.status) &&
      d.promisedDeliveryDate < today
    );
  }, [dockets]);

  const filtered = useMemo(() => exceptions.filter(e => {
    const matchType = filterType === 'All' || e.type === filterType;
    const matchSev = filterSeverity === 'All' || e.severity === filterSeverity;
    const matchSt = filterStatus === 'All' || e.status === filterStatus;
    const q = searchQ.toLowerCase();
    const matchSearch = !searchQ || e.docketNumber.toLowerCase().includes(q) || e.clientName.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
    return matchType && matchSev && matchSt && matchSearch;
  }), [exceptions, filterType, filterSeverity, filterStatus, searchQ]);

  const kpis = useMemo(() => {
    const open = exceptions.filter(e => e.status === 'Open').length;
    const investigating = exceptions.filter(e => e.status === 'Under Investigation').length;
    const claims = exceptions.filter(e => e.claimStatus && e.claimStatus !== 'Not Raised');
    const totalClaimValue = claims.reduce((s, e) => s + (e.claimAmount ?? 0), 0);
    const resolved = exceptions.filter(e => e.status === 'Resolved');
    const avgResolutionDays = resolved.length > 0
      ? resolved.filter(e => e.resolvedAt).reduce((s, e) => {
        const days = (new Date(e.resolvedAt!).getTime() - new Date(e.reportedAt).getTime()) / (1000 * 60 * 60 * 24);
        return s + days;
      }, 0) / resolved.length : 0;
    return { open, investigating, totalClaimValue, avgResolutionDays: avgResolutionDays.toFixed(1) };
  }, [exceptions]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/tms/ptl/dashboard')} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Exception Management</h1>
              <p className="text-sm text-gray-500">Track, investigate, and resolve PTL exceptions</p>
            </div>
          </div>
          <button onClick={() => setShowRaiseModal(true)}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">
            <Plus className="w-4 h-4" /> Raise Exception
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-6 py-4 grid grid-cols-4 gap-4">
        {[
          { label: 'Open Exceptions', value: kpis.open, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
          { label: 'Under Investigation', value: kpis.investigating, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Total Claim Value', value: `₹${kpis.totalClaimValue.toLocaleString()}`, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
          { label: 'Avg Resolution (days)', value: kpis.avgResolutionDays, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
        ].map(item => (
          <Card key={item.label} className={`p-4 border ${item.bg}`}>
            <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-gray-500 mt-1">{item.label}</div>
          </Card>
        ))}
      </div>

      {/* SLA breach alerts */}
      {slaBreaches.length > 0 && (
        <div className="px-6 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-2">
              <AlertTriangle className="w-4 h-4" /> {slaBreaches.length} Dockets Past Promised Delivery Date
            </div>
            <div className="flex flex-wrap gap-2">
              {slaBreaches.slice(0, 8).map(d => (
                <div key={d.id} className="bg-white border border-red-200 rounded-lg px-3 py-1.5 text-xs">
                  <span className="font-mono font-semibold text-blue-700">{d.docketNumber}</span>
                  <span className="text-gray-400 ml-1">({d.status})</span>
                  <span className="text-red-600 ml-1">Due: {d.promisedDeliveryDate}</span>
                </div>
              ))}
              {slaBreaches.length > 8 && <span className="text-red-400 text-xs">+{slaBreaches.length - 8} more</span>}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-6 mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search exceptions..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="All">All Types</option>
          {EXCEPTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="All">All Severities</option>
          {(['Critical', 'High', 'Medium', 'Low'] as ExceptionSeverity[]).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="All">All Statuses</option>
          {(['Open', 'Under Investigation', 'Resolved', 'Escalated', 'Claim Raised'] as ExceptionStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Exception Table */}
      <div className="px-6">
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Docket #', 'Client', 'Type', 'Severity', 'Description', 'Reported', 'Status', 'Claim', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16 text-gray-400">
                  <Shield className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  No exceptions found
                </td></tr>
              ) : filtered.map(e => {
                const age = Math.floor((Date.now() - new Date(e.reportedAt).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={e.id} className={`hover:bg-gray-50 cursor-pointer ${e.status === 'Open' ? 'bg-red-50' : ''}`} onClick={() => setSelectedExc(e)}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700">{e.docketNumber}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{e.clientName}</td>
                    <td className="px-4 py-3"><Badge color={SEVERITY_COLORS[e.severity]}>{e.type}</Badge></td>
                    <td className="px-4 py-3"><Badge color={SEVERITY_COLORS[e.severity]}>{e.severity}</Badge></td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">
                      <div className="truncate">{e.description}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <div>{new Date(e.reportedAt).toLocaleDateString()}</div>
                      <div className="text-gray-400">{age}d ago</div>
                    </td>
                    <td className="px-4 py-3"><Badge color={STATUS_COLORS[e.status]}>{e.status}</Badge></td>
                    <td className="px-4 py-3 text-xs">
                      {e.claimAmount ? <div className="text-purple-700 font-medium">₹{e.claimAmount.toLocaleString()}</div> : <span className="text-gray-300">—</span>}
                      {e.claimStatus && e.claimStatus !== 'Not Raised' && <Badge color="purple">{e.claimStatus}</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1">
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      {showRaiseModal && <RaiseExceptionModal onClose={() => setShowRaiseModal(false)} />}
      {selectedExc && <ExceptionDetailPanel exc={selectedExc} onClose={() => setSelectedExc(null)} />}
    </div>
  );
};
