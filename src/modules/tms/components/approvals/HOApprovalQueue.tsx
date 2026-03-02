
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { RiskBadge } from './RiskBadge';
import { ApprovalDetailModal } from './ApprovalDetailModal';
import { ApprovalRequest } from './types';
import { generateMockApprovals } from './utils';
import { useOperationalData, TripExpense } from '../../../../shared/context/OperationalDataContext';
import { useToast } from '../../../../shared/context/ToastContext';
import { CompletedTrip } from '../../../../shared/context/OperationalDataStore';
import {
  Search,
  Clock,
  AlertOctagon,
  CheckCircle,
  ArrowRight,
  DollarSign,
  Truck,
  CheckSquare,
  XSquare,
  ChevronDown,
  ChevronUp,
  Wallet,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Trip Advance Row
// ─────────────────────────────────────────────────────────────────────────────
interface AdvanceWithTrip extends TripExpense {
  trip: CompletedTrip;
}

const ADVANCE_TYPE_LABELS: Record<string, string> = {
  fuel: 'Fuel Advance',
  driver_batta: 'Driver Batta',
  toll: 'Toll / FASTag',
  vendor_advance: 'Vendor Advance',
  other: 'Other',
};

const TripAdvanceCard: React.FC<{
  tripId: string;
  trip: CompletedTrip;
  advances: AdvanceWithTrip[];
  onApprove: (tripId: string, expenseId: string) => void;
  onReject: (tripId: string, expenseId: string, reason: string) => void;
}> = ({ tripId, trip, advances, onApprove, onReject }) => {
  const [expanded, setExpanded] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const totalAmount = advances.reduce((s, a) => s + a.amount, 0);
  const isVendorAdvance = advances[0]?.advanceType === 'vendor_advance';

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Trip Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <Truck className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900">
              {trip.id} — {trip.clientName}
            </p>
            <p className="text-xs text-gray-500">
              {trip.origin} → {trip.destination}
              {trip.distanceKm ? ` · ${trip.distanceKm} km` : ''}
              {trip.vehicleRegNumber ? ` · ${trip.vehicleRegNumber}` : trip.vendorName ? ` · ${trip.vendorName}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500">Total Advance</p>
            <p className="text-sm font-bold text-indigo-700">₹{totalAmount.toLocaleString('en-IN')}</p>
          </div>
          {isVendorAdvance && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
              Market Hire
            </span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {/* Expense Rows */}
      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {advances.map(adv => (
            <div key={adv.id} className="px-4 py-3">
              {rejectingId === adv.id ? (
                /* Reject reason input */
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-red-700">Reason for rejection:</p>
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    className="w-full text-sm border border-red-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-400"
                    placeholder="Enter reason…"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        if (rejectReason.trim()) {
                          onReject(tripId, adv.id, rejectReason.trim());
                          setRejectingId(null);
                          setRejectReason('');
                        }
                      }}
                    >
                      Confirm Reject
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setRejectingId(null); setRejectReason(''); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Wallet className="h-4 w-4 text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {ADVANCE_TYPE_LABELS[adv.advanceType ?? ''] ?? adv.category}
                      </p>
                      {adv.description && (
                        <p className="text-xs text-gray-500">{adv.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        Requested by {adv.submittedBy.name} · {adv.submittedBy.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-gray-900">₹{adv.amount.toLocaleString('en-IN')}</p>
                    <button
                      onClick={() => onApprove(tripId, adv.id)}
                      title="Approve"
                      className="p-1.5 rounded-md text-green-600 hover:bg-green-50 transition-colors"
                    >
                      <CheckSquare className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setRejectingId(adv.id)}
                      title="Reject"
                      className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <XSquare className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Approve All footer */}
          <div className="px-4 py-3 bg-gray-50 flex justify-end">
            <Button
              size="sm"
              onClick={() => advances.forEach(a => onApprove(tripId, a.id))}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Approve All (₹{totalAmount.toLocaleString('en-IN')})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export const HOApprovalQueue: React.FC = () => {
  // ── Indent Approvals — loaded from mock generator ────────────────────────
  const { getAllPendingAdvances, updateTripExpense, applyApprovedAdvance } = useOperationalData();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);

  useEffect(() => {
    setApprovals(generateMockApprovals());
  }, []);
  const [selectedIndent, setSelectedIndent] = useState<ApprovalRequest | null>(null);
  const [filter, setFilter] = useState('All');

  const { showToast } = useToast();

  const handleApprove = (id: string, _comment: string) => {
    setApprovals(prev => prev.filter(a => a.id !== id));
    showToast({ type: 'success', title: 'Indent Approved', message: `${id} approved. Notification sent to Regional Manager.` });
  };

  const handleReject = (id: string, _reason: string) => {
    setApprovals(prev => prev.filter(a => a.id !== id));
    showToast({ type: 'warning', title: 'Indent Rejected', message: `${id} rejected. Reason logged.` });
  };

  const filteredApprovals = filter === 'All'
    ? approvals
    : approvals.filter(a => a.riskData.overallRisk === filter);

  // ── Trip Advances ──────────────────────────────────────────────────────────
  const [pendingAdvances, setPendingAdvances] = useState<AdvanceWithTrip[]>([]);

  useEffect(() => {
    setPendingAdvances(getAllPendingAdvances() as AdvanceWithTrip[]);
  }, [getAllPendingAdvances]);

  const handleApproveAdvance = (tripId: string, expenseId: string) => {
    const expense = pendingAdvances.find(a => a.id === expenseId);
    updateTripExpense(tripId, expenseId, { status: 'Approved', paymentStatus: 'pending_payment' });
    // Sync to OperationalDataContext (vendor balance / trip costBreakdown) → FinanceTMSBridge auto-syncs to Finance
    if (expense) applyApprovedAdvance(tripId, expense);
    setPendingAdvances(prev => prev.filter(a => a.id !== expenseId));
    showToast({ type: 'success', title: 'Advance Approved', message: `₹${expense?.amount.toLocaleString('en-IN') || ''} advance approved. Finance notified.` });
  };

  const handleRejectAdvance = (tripId: string, expenseId: string, reason: string) => {
    updateTripExpense(tripId, expenseId, { status: 'Rejected', rejectionReason: reason });
    setPendingAdvances(prev => prev.filter(a => a.id !== expenseId));
    showToast({ type: 'warning', title: 'Advance Rejected', message: `Advance rejected. Reason recorded.` });
  };

  // Group pending advances by trip
  const advancesByTrip = pendingAdvances.reduce<Record<string, AdvanceWithTrip[]>>((acc, adv) => {
    const key = adv.tripId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(adv);
    return acc;
  }, {});

  const totalPendingAmount = pendingAdvances.reduce((s, a) => s + a.amount, 0);

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'indents' | 'advances'>('indents');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zero-Trust Approval Queue</h1>
          <p className="text-sm text-gray-500 mt-1">Pending Head Office Approvals</p>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
            <Clock className="h-4 w-4 mr-2" />
            <span className="font-bold">Avg Wait: 45m</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('indents')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'indents'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Indent Approvals
          {approvals.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-semibold">
              {approvals.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('advances')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'advances'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Trip Advances
          {pendingAdvances.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-semibold">
              {pendingAdvances.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Indent Approvals Tab ─────────────────────────────────────────────── */}
      {activeTab === 'indents' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-red-500 bg-red-50/50">
              <p className="text-xs text-red-600 font-bold uppercase">Critical Risk</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{approvals.filter(a => a.riskData.overallRisk === 'Critical').length}</h3>
            </Card>
            <Card className="border-l-4 border-l-orange-500 bg-orange-50/50">
              <p className="text-xs text-orange-600 font-bold uppercase">High Risk</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{approvals.filter(a => a.riskData.overallRisk === 'High').length}</h3>
            </Card>
            <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50">
              <p className="text-xs text-yellow-600 font-bold uppercase">Medium Risk</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{approvals.filter(a => a.riskData.overallRisk === 'Medium').length}</h3>
            </Card>
            <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
              <p className="text-xs text-blue-600 font-bold uppercase">Total Pending</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{approvals.length}</h3>
            </Card>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search Indent ID, Client..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary" />
              </div>
              <div className="flex space-x-2">
                {['All', 'Critical', 'High', 'Medium'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredApprovals.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <p className="text-lg font-medium">All Caught Up!</p>
                  <p className="text-sm">No pending approvals in this category.</p>
                </div>
              ) : (
                filteredApprovals.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <RiskBadge level={item.riskData.overallRisk} score={item.riskData.riskScore} size="sm" />
                          <span className="text-sm font-bold text-gray-900">{item.id}</span>
                          <span className="text-xs text-gray-500">• {item.bookingId}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-xs text-gray-500">Client</p>
                            <p className="font-medium text-gray-900">{item.client}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Route</p>
                            <p className="font-medium text-gray-900">{item.route.origin} → {item.route.destination}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Value</p>
                            <p className="font-medium text-gray-900">₹{item.value.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Submitted By</p>
                            <p className="font-medium text-gray-900">{item.submittedBy.name}</p>
                          </div>
                        </div>
                        {item.riskData.flaggedIssues.length > 0 && (
                          <div className="bg-red-50 border border-red-100 rounded p-2 inline-block">
                            <p className="text-xs font-bold text-red-700 flex items-center mb-1">
                              <AlertOctagon className="h-3 w-3 mr-1" /> Key Risks:
                            </p>
                            <ul className="list-disc pl-4 text-xs text-red-600 space-y-0.5">
                              {item.riskData.flaggedIssues.slice(0, 2).map((issue, i) => (
                                <li key={i}>{issue}</li>
                              ))}
                              {item.riskData.flaggedIssues.length > 2 && <li>+{item.riskData.flaggedIssues.length - 2} more...</li>}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center items-end space-y-2 min-w-[140px]">
                        <span className="text-xs text-gray-400">
                          Wait Time: {Math.round((Date.now() - new Date(item.submittedAt).getTime()) / 60000)}m
                        </span>
                        <Button onClick={() => setSelectedIndent(item)} className="w-full">
                          Review <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <ApprovalDetailModal
            indent={selectedIndent}
            isOpen={!!selectedIndent}
            onClose={() => setSelectedIndent(null)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </>
      )}

      {/* ── Trip Advances Tab ────────────────────────────────────────────────── */}
      {activeTab === 'advances' && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
              <p className="text-xs text-amber-700 font-bold uppercase">Pending Advances</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{pendingAdvances.length}</h3>
              <p className="text-xs text-amber-600 mt-1">across {Object.keys(advancesByTrip).length} trips</p>
            </Card>
            <Card className="border-l-4 border-l-indigo-500 bg-indigo-50/50">
              <p className="text-xs text-indigo-700 font-bold uppercase">Total Amount</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{totalPendingAmount.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-indigo-600 mt-1">awaiting approval</p>
            </Card>
            <Card className="border-l-4 border-l-green-500 bg-green-50/50">
              <p className="text-xs text-green-700 font-bold uppercase">Vendor Advances</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {pendingAdvances.filter(a => a.advanceType === 'vendor_advance').length}
              </h3>
              <p className="text-xs text-green-600 mt-1">market hire requests</p>
            </Card>
          </div>

          {/* Advance cards grouped by trip */}
          {Object.keys(advancesByTrip).length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
              <p className="text-lg font-medium">No Pending Advances</p>
              <p className="text-sm">Trip advance requests will appear here once dispatched.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(advancesByTrip).map(([tripId, advances]) => (
                <TripAdvanceCard
                  key={tripId}
                  tripId={tripId}
                  trip={advances[0].trip}
                  advances={advances}
                  onApprove={handleApproveAdvance}
                  onReject={handleRejectAdvance}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
