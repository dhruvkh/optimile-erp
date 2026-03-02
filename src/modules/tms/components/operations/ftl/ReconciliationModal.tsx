
import React, { useState, useEffect } from 'react';
import { X, Check, AlertTriangle, TrendingUp, TrendingDown, Minus, DollarSign, Calculator } from 'lucide-react';
import { Button } from '../../ui/Button';
import { ReconciliationMetric } from './types';
import { getMockReconciliation } from './closureUtils';

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onApprove: () => void;
}

export const ReconciliationModal: React.FC<ReconciliationModalProps> = ({ 
  isOpen, onClose, tripId, onApprove 
}) => {
  const [metrics, setMetrics] = useState<ReconciliationMetric[]>([]);
  const [comments, setComments] = useState('');
  const [activeTab, setActiveTab] = useState<'pnl' | 'details'>('pnl');

  // Hardcoded financial summary for the "Part 5" requirement
  // In a real app, this would be computed from the backend or props
  const summary = {
      originalQuote: 45000,
      additionalCharges: 3000,
      grossRevenue: 48000,
      deductions: {
          damage: 3000,
          late: 0,
          other: 0,
          total: 3000
      },
      netRevenue: 45000,
      costs: {
          fuel: { planned: 22800, actual: 23400, variance: 600, percent: 2.6 },
          toll: { planned: 2950, actual: 3150, variance: 200, percent: 6.8 },
          driver: { planned: 8000, actual: 8000, variance: 0, percent: 0 },
          loading: { planned: 800, actual: 800, variance: 0, percent: 0 },
          unloading: { planned: 800, actual: 800, variance: 0, percent: 0 },
          other: { planned: 0, actual: 550, variance: 550, percent: 100 }, // Parking + Repair + Weighbridge
          allocated: 10735 // Fixed allocation
      }
  };

  const totalDirectActual = Object.values(summary.costs).reduce((sum: number, item: any) => {
    return sum + (typeof item === 'object' ? item.actual : 0);
  }, 0);
  
  const totalCostActual = totalDirectActual + summary.costs.allocated;
  const netProfit = summary.netRevenue - totalCostActual;
  const marginPercent = (netProfit / summary.netRevenue) * 100;
  const targetMargin = 12.0;

  useEffect(() => {
    if (isOpen) {
      setMetrics(getMockReconciliation(tripId));
    }
  }, [isOpen, tripId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
          
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Final Trip Reconciliation</h3>
              <p className="text-sm text-gray-500">Trip ID: {tripId}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 p-1">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
              <button 
                onClick={() => setActiveTab('pnl')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'pnl' ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                  <DollarSign className="inline-block w-4 h-4 mr-2" /> P&L Summary
              </button>
              <button 
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'details' ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                  <Calculator className="inline-block w-4 h-4 mr-2" /> Detailed Metrics
              </button>
          </div>

          <div className="p-6 bg-gray-50">
            
            {activeTab === 'pnl' && (
                <div className="space-y-6">
                    {/* 1. Revenue Reconciliation */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Revenue Reconciliation</h4>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Original Quote</span>
                                <span className="font-medium">₹ {summary.originalQuote.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Additional Charges</span>
                                <span className="font-medium">₹ {summary.additionalCharges.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold border-t border-gray-100 pt-1 mt-1">
                                <span>Gross Revenue</span>
                                <span>₹ {summary.grossRevenue.toLocaleString()}</span>
                            </div>
                            
                            <div className="col-span-2 border-t border-gray-100 my-2"></div>

                            <div className="flex justify-between text-red-600">
                                <span>Less: Damage Claim</span>
                                <span>(₹ {summary.deductions.damage.toLocaleString()})</span>
                            </div>
                            <div className="flex justify-between text-red-600">
                                <span>Less: Late Penalty</span>
                                <span>(₹ {summary.deductions.late.toLocaleString()})</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2 mt-2 bg-blue-50 p-2 rounded">
                                <span className="text-blue-900">Net Revenue</span>
                                <span className="text-blue-900">₹ {summary.netRevenue.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Cost Reconciliation */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Cost Reconciliation</h4>
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-xs text-gray-500">
                                <tr>
                                    <th className="px-2 py-1 text-left">Cost Head</th>
                                    <th className="px-2 py-1 text-right">Budget</th>
                                    <th className="px-2 py-1 text-right">Actual</th>
                                    <th className="px-2 py-1 text-right">Variance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {Object.entries(summary.costs).map(([key, val]) => {
                                    if (key === 'allocated') return null;
                                    const v = val as any;
                                    return (
                                        <tr key={key}>
                                            <td className="px-2 py-2 capitalize">{key}</td>
                                            <td className="px-2 py-2 text-right text-gray-500">₹ {v.planned.toLocaleString()}</td>
                                            <td className="px-2 py-2 text-right font-medium">₹ {v.actual.toLocaleString()}</td>
                                            <td className={`px-2 py-2 text-right text-xs ${v.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {v.variance > 0 ? '+' : ''}₹{v.variance} ({v.percent}%)
                                            </td>
                                        </tr>
                                    );
                                })}
                                <tr className="bg-gray-50 font-bold">
                                    <td className="px-2 py-2">Total Direct</td>
                                    <td className="px-2 py-2 text-right">₹ {35000}</td>
                                    <td className="px-2 py-2 text-right">₹ {totalDirectActual.toLocaleString()}</td>
                                    <td className="px-2 py-2 text-right text-red-600">+₹ {(totalDirectActual - 35000).toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
                            <span>+ Allocated Overheads</span>
                            <span>₹ {summary.costs.allocated.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* 3. P&L Summary */}
                    <div className={`rounded-lg border p-4 ${netProfit < 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-wide opacity-70">Net Profit / (Loss)</h4>
                                <div className={`text-3xl font-bold mt-1 ${netProfit < 0 ? 'text-red-700' : 'text-green-700'}`}>
                                    {netProfit < 0 ? `(₹ ${Math.abs(netProfit).toLocaleString()})` : `₹ ${netProfit.toLocaleString()}`}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-medium opacity-70">Margin</div>
                                <div className={`text-xl font-bold ${marginPercent < targetMargin ? 'text-red-600' : 'text-green-600'}`}>
                                    {marginPercent.toFixed(1)}%
                                </div>
                                <div className="text-xs opacity-60">Target: {targetMargin}%</div>
                            </div>
                        </div>
                        {netProfit < 0 && (
                            <div className="mt-3 flex items-start text-xs text-red-800 bg-red-100 p-2 rounded">
                                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span>
                                    <strong>Manager Approval Required:</strong> Trip ran at a loss due to damage claim deductions and fuel cost overruns.
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'details' && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                   <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                         <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Metric</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Planned</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actual</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Variance</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status / Reason</th>
                         </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                         {metrics.map((m, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {m.metric}
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                  {m.unit === '₹' ? '₹ ' : ''}{m.planned.toLocaleString()} {m.unit !== '₹' ? m.unit : ''}
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                  {m.unit === '₹' ? '₹ ' : ''}{m.actual.toLocaleString()} {m.unit !== '₹' ? m.unit : ''}
                               </td>
                               <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                                  m.variance > 0 ? 'text-red-600' : m.variance < 0 ? 'text-green-600' : 'text-gray-400'
                               }`}>
                                  {m.variance > 0 ? '+' : ''}{m.variance.toLocaleString()} ({m.variance > 0 ? '+' : ''}{m.variancePercent.toFixed(1)}%)
                               </td>
                               <td className="px-6 py-4 text-sm">
                                  <div className="flex flex-col">
                                     <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${
                                        m.status === 'Match' ? 'bg-gray-100 text-gray-800' :
                                        m.status === 'Minor Variance' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                     }`}>
                                        {m.status}
                                     </span>
                                     {m.reason && (
                                        <span className="text-xs text-gray-500 mt-1 italic">
                                           "{m.reason}"
                                        </span>
                                     )}
                                  </div>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
            )}

            {/* Approval Section */}
            <div className="mt-6 border-t border-gray-200 pt-6">
               <div className="flex items-start space-x-3 mb-4">
                  <input type="checkbox" id="approve-check" className="mt-1 h-4 w-4 text-primary rounded focus:ring-primary" />
                  <label htmlFor="approve-check" className="text-sm text-gray-700">
                     I verify that I have reviewed the reconciliation report, claims, and approve the variances noted above.
                  </label>
               </div>
               
               <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manager Comments</label>
                  <textarea 
                     className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary"
                     rows={2}
                     placeholder="Justification for approval despite variance..."
                     value={comments}
                     onChange={e => setComments(e.target.value)}
                  ></textarea>
               </div>

               <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={onClose} className="border-red-200 text-red-700 hover:bg-red-50">
                     Reject & Request Changes
                  </Button>
                  <Button onClick={onApprove} className="bg-green-600 hover:bg-green-700">
                     Approve & Close Trip
                  </Button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
