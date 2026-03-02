
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, FileText, DollarSign, AlertOctagon, Send, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '../../ui/Button';
import { ClosureChecklist } from './types';
import { getMockClosureChecklist, mockSyncToFinance } from './closureUtils';
import { ReconciliationModal } from './ReconciliationModal';
import { useOperationalData } from '../../../../../shared/context/OperationalDataContext';

interface TripClosureModalProps {
   isOpen: boolean;
   onClose: () => void;
   tripId: string;
   onSuccess: () => void;
}

export const TripClosureModal: React.FC<TripClosureModalProps> = ({ isOpen, onClose, tripId, onSuccess }) => {
   const { markInvoiced } = useOperationalData();
   const [checklist, setChecklist] = useState<ClosureChecklist | null>(null);
   const [showReconciliation, setShowReconciliation] = useState(false);
   const [isSyncing, setIsSyncing] = useState(false);

   useEffect(() => {
      if (isOpen) {
         // Extended checklist with claims
         const base = getMockClosureChecklist(tripId);
         setChecklist({
            ...base,
            claims: { total: 1, resolved: 1, totalDeduction: 3000 }
         });
      }
   }, [isOpen, tripId]);

   if (!isOpen || !checklist) return null;

   const handleReconciliationApprove = () => {
      setChecklist(prev => prev ? ({ ...prev, reconciliation: { status: 'Approved' } }) : null);
      setShowReconciliation(false);
   };

   const handleCloseTrip = async () => {
      setIsSyncing(true);
      const payload: any = {
         tripId,
         financials: checklist.financials,
         accessorialCharges: checklist.accessorialCharges
      };

      // Sync to Finance and get back the generated invoice ID
      const result = await mockSyncToFinance(payload);

      // Mark the trip as invoiced in the shared OperationalDataContext.
      // This triggers FinanceTMSBridge (SYNC_FROM_TMS) which automatically:
      //   • Creates the invoice entry in Finance Customer Ledger
      //   • Updates bookings list in Finance
      //   • Derives and adds trip expenses to Finance Fleet Ledger
      markInvoiced(tripId, result.invoiceId);

      setIsSyncing(false);
      onSuccess();
      onClose();
   };

   const updateAccessorial = (field: keyof ClosureChecklist['accessorialCharges'], value: string) => {
      const numValue = Number(value) || 0;
      setChecklist(prev => {
         if (!prev) return prev;
         const newCharges = { ...prev.accessorialCharges, [field]: numValue };

         // Recalculate Actual Cost & Net Profit
         const addedCost = newCharges.detention + newCharges.toll + newCharges.loading + newCharges.unloading;
         const newActualCost = prev.financials.plannedCost + addedCost; // simplistically adding to planned
         const newNetProfit = prev.financials.actualRevenue - newActualCost;
         const newMargin = newActualCost > 0 ? ((newNetProfit / prev.financials.actualRevenue) * 100).toFixed(1) : 100;

         return {
            ...prev,
            accessorialCharges: newCharges,
            financials: {
               ...prev.financials,
               actualCost: newActualCost,
               netProfit: newNetProfit,
               marginPercent: Number(newMargin)
            }
         };
      });
   };

   const canSubmit =
      checklist.pod.softCopy.received &&
      checklist.expenses.approved &&
      checklist.issues.total === checklist.issues.resolved &&
      checklist.claims.total === checklist.claims.resolved &&
      checklist.reconciliation.status === 'Approved';

   return (
      <>
         <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
               <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
               <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

               <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl w-full">

                  {/* Header */}
                  <div className="bg-slate-800 px-6 py-4 flex justify-between items-center text-white">
                     <div>
                        <h3 className="text-lg font-bold">Close Trip {tripId}</h3>
                        <p className="text-xs text-slate-300">Finalize details and sync to finance</p>
                     </div>
                     <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="h-6 w-6" />
                     </button>
                  </div>

                  <div className="p-6 space-y-6">

                     {/* Checklist */}
                     <div className="space-y-4">

                        {/* 1. POD */}
                        <div className="flex items-start justify-between p-3 border rounded-lg bg-gray-50">
                           <div className="flex items-start">
                              <div className={`mt-0.5 mr-3 ${checklist.pod.softCopy.received ? 'text-green-500' : 'text-red-500'}`}>
                                 {checklist.pod.softCopy.received ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                              </div>
                              <div>
                                 <h4 className="text-sm font-bold text-gray-900">Proof of Delivery (POD)</h4>
                                 <div className="text-xs text-gray-600 mt-1 space-y-1">
                                    <div className="flex items-center">
                                       <span className="w-16">Soft Copy:</span>
                                       {checklist.pod.softCopy.received ? (
                                          <span className="text-green-700 font-medium">✓ Uploaded ({checklist.pod.softCopy.date})</span>
                                       ) : (
                                          <span className="text-red-600 font-bold">Pending Upload</span>
                                       )}
                                    </div>
                                    <div className="flex items-center">
                                       <span className="w-16">Hard Copy:</span>
                                       <span className="text-gray-500">{checklist.pod.hardCopy.received ? 'Received' : 'Pending (Optional)'}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* 2. Expenses */}
                        <div className="flex items-start justify-between p-3 border rounded-lg bg-gray-50">
                           <div className="flex items-start">
                              <div className={`mt-0.5 mr-3 ${checklist.expenses.approved ? 'text-green-500' : 'text-yellow-500'}`}>
                                 {checklist.expenses.approved ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                              </div>
                              <div>
                                 <h4 className="text-sm font-bold text-gray-900">Trip Expenses</h4>
                                 <p className="text-xs text-gray-600 mt-1">
                                    {checklist.expenses.recorded}/{checklist.expenses.total} recorded.
                                    {checklist.expenses.approved ? ' All Approved.' : ' Pending Approval.'}
                                 </p>
                              </div>
                           </div>
                        </div>

                        {/* 3. Claims & Deductions */}
                        <div className="flex items-start justify-between p-3 border rounded-lg bg-gray-50">
                           <div className="flex items-start">
                              <div className={`mt-0.5 mr-3 ${checklist.claims.total === checklist.claims.resolved ? 'text-green-500' : 'text-red-500'}`}>
                                 {checklist.claims.total === checklist.claims.resolved ? <CheckCircle className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                              </div>
                              <div>
                                 <h4 className="text-sm font-bold text-gray-900">Claims & Deductions</h4>
                                 <p className="text-xs text-gray-600 mt-1">
                                    {checklist.claims.total} Claims.
                                    {checklist.claims.resolved === checklist.claims.total ? ' All Resolved.' : ' Pending Resolution.'}
                                    <br />
                                    Total Deduction: ₹ {checklist.claims.totalDeduction}
                                 </p>
                              </div>
                           </div>
                        </div>

                        {/* 4. Reconciliation */}
                        <div className={`flex items-center justify-between p-3 border rounded-lg ${checklist.reconciliation.status === 'Approved' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                           <div className="flex items-center">
                              <div className={`mr-3 ${checklist.reconciliation.status === 'Approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                                 {checklist.reconciliation.status === 'Approved' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                              </div>
                              <div>
                                 <h4 className="text-sm font-bold text-gray-900">Trip Reconciliation</h4>
                                 <p className="text-xs text-gray-600">
                                    Status: <span className="font-bold">{checklist.reconciliation.status}</span>
                                 </p>
                              </div>
                           </div>
                           {checklist.reconciliation.status !== 'Approved' && (
                              <Button size="sm" variant="outline" onClick={() => setShowReconciliation(true)}>
                                 Review
                              </Button>
                           )}
                           {checklist.reconciliation.status === 'Approved' && (
                              <Button size="sm" variant="outline" className="text-green-700 border-green-200" onClick={() => setShowReconciliation(true)}>
                                 View
                              </Button>
                           )}
                        </div>

                        {/* 4. Accessorial Charges Form */}
                        <div className="flex flex-col p-3 border rounded-lg bg-gray-50">
                           <h4 className="text-sm font-bold text-gray-900 mb-2">Accessorial Charges (Add to Cost)</h4>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                 <label className="text-xs text-slate-500 font-medium">Toll Cost (₹)</label>
                                 <input type="number" className="w-full mt-1 p-1.5 border border-slate-300 rounded text-sm"
                                    value={checklist.accessorialCharges.toll}
                                    onChange={e => updateAccessorial('toll', e.target.value)} />
                              </div>
                              <div>
                                 <label className="text-xs text-slate-500 font-medium">Detention (₹)</label>
                                 <input type="number" className="w-full mt-1 p-1.5 border border-slate-300 rounded text-sm"
                                    value={checklist.accessorialCharges.detention}
                                    onChange={e => updateAccessorial('detention', e.target.value)} />
                              </div>
                              <div>
                                 <label className="text-xs text-slate-500 font-medium">Loading (₹)</label>
                                 <input type="number" className="w-full mt-1 p-1.5 border border-slate-300 rounded text-sm"
                                    value={checklist.accessorialCharges.loading}
                                    onChange={e => updateAccessorial('loading', e.target.value)} />
                              </div>
                              <div>
                                 <label className="text-xs text-slate-500 font-medium">Unloading (₹)</label>
                                 <input type="number" className="w-full mt-1 p-1.5 border border-slate-300 rounded text-sm"
                                    value={checklist.accessorialCharges.unloading}
                                    onChange={e => updateAccessorial('unloading', e.target.value)} />
                              </div>
                           </div>
                        </div>

                     </div>

                     {/* Financial Summary */}
                     <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Final Financial Summary</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                           <div className="flex justify-between">
                              <span className="text-slate-600">Revenue:</span>
                              <span className="font-bold text-slate-900">₹ {checklist.financials.actualRevenue.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-slate-600">Cost:</span>
                              <span className="font-bold text-slate-900">₹ {checklist.financials.actualCost.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between border-t border-slate-200 pt-2 col-span-2">
                              <span className="font-bold text-slate-800">Net Profit:</span>
                              <span className="font-bold text-green-600">
                                 ₹ {checklist.financials.netProfit.toLocaleString()} ({checklist.financials.marginPercent}%)
                              </span>
                           </div>
                        </div>
                     </div>

                  </div>

                  {/* Footer */}
                  <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
                     <span className="text-xs text-gray-500">
                        {!canSubmit ? '* Complete all checks to close' : 'Ready for Finance Sync'}
                     </span>
                     <div className="flex space-x-3">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button
                           onClick={handleCloseTrip}
                           disabled={!canSubmit || isSyncing}
                           className={canSubmit ? 'bg-green-600 hover:bg-green-700' : 'opacity-50 cursor-not-allowed'}
                        >
                           {isSyncing ? (
                              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Syncing...</>
                           ) : (
                              <><Send className="h-4 w-4 mr-2" /> Close & Sync Finance</>
                           )}
                        </Button>
                     </div>
                  </div>

               </div>
            </div>
         </div>

         <ReconciliationModal
            isOpen={showReconciliation}
            onClose={() => setShowReconciliation(false)}
            tripId={tripId}
            onApprove={handleReconciliationApprove}
         />
      </>
   );
};
