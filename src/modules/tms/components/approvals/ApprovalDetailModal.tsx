
import React, { useState } from 'react';
import { ApprovalRequest } from './types';
import { RiskBadge } from './RiskBadge';
import { Button } from '../ui/Button';
import { X, Check, TrendingUp, Truck, User, FileText, AlertTriangle, Clock, History, Shield, DollarSign } from 'lucide-react';

interface Props {
  indent: ApprovalRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, comment: string) => void;
  onReject: (id: string, reason: string) => void;
}

export const ApprovalDetailModal: React.FC<Props> = ({ indent, isOpen, onClose, onApprove, onReject }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'risk' | 'market' | 'audit'>('overview');
  const [actionState, setActionState] = useState<'none' | 'approve' | 'reject'>('none');
  const [comment, setComment] = useState('');

  if (!isOpen || !indent) return null;

  const handleAction = () => {
    if (actionState === 'approve') onApprove(indent.id, comment);
    if (actionState === 'reject') onReject(indent.id, comment);
    setActionState('none');
    setComment('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-gray-900">Indent Approval</h3>
                <RiskBadge level={indent.riskData.overallRisk} score={indent.riskData.riskScore} />
              </div>
              <p className="text-sm text-gray-500 mt-1">ID: {indent.id} • Booking: {indent.bookingId}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex h-[600px]">
            {/* Sidebar Tabs */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 pt-4">
              {[
                { id: 'overview', label: 'Indent Details', icon: FileText },
                { id: 'risk', label: 'Risk Analysis', icon: Shield },
                { id: 'market', label: 'Market Intel', icon: TrendingUp },
                { id: 'audit', label: 'Audit Trail', icon: History },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-primary border-r-2 border-primary'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className={`h-4 w-4 mr-3 ${activeTab === tab.id ? 'text-primary' : 'text-gray-400'}`} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Key Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Client</label>
                        <p className="text-base font-medium text-gray-900">{indent.client}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Route</label>
                        <div className="flex items-center mt-1">
                          <span className="font-medium">{indent.route.origin}</span>
                          <span className="mx-2 text-gray-400">→</span>
                          <span className="font-medium">{indent.route.destination}</span>
                          <span className="ml-2 text-xs text-gray-500">({indent.route.distance} km)</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Value</label>
                        <p className="text-lg font-bold text-gray-900">₹ {indent.value.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Vehicle</label>
                        <div className="flex items-center mt-1">
                          <Truck className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{indent.vehicleType}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submitted By */}
                  <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold">
                        {indent.submittedBy.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{indent.submittedBy.name}</p>
                        <p className="text-xs text-gray-500">{indent.submittedBy.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Submitted</p>
                      <p className="text-sm font-medium">{new Date(indent.submittedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'risk' && (
                <div className="space-y-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-red-800 font-bold flex items-center mb-2">
                      <AlertTriangle className="h-5 w-5 mr-2" /> Critical Issues Detected
                    </h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {indent.riskData.flaggedIssues.map((issue, i) => (
                        <li key={i} className="text-sm text-red-700">{issue}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-4">Risk Factor Breakdown</h4>
                    <div className="space-y-4">
                      {Object.entries(indent.riskData.factors).map(([key, factor]: [string, any]) => (
                        <div key={key} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              factor.score > 15 ? 'bg-red-100 text-red-800' :
                              factor.score > 5 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              Risk Score: {factor.score}/25
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{factor.details.concern}</p>
                          {factor.details.variance && (
                            <p className="text-xs text-gray-500 mt-1">Variance: {factor.details.variance}%</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-900 mb-2">AI Recommendations</h4>
                    <ul className="list-decimal pl-5 space-y-1">
                      {indent.riskData.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-gray-700">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'market' && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <TrendingUp className="h-10 w-10 text-primary mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-medium text-gray-900">Market Rate Analysis</h3>
                    <p className="text-sm text-gray-500 mb-6">Comparison based on last 30 days data for {indent.route.origin} to {indent.route.destination}</p>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase">Quoted</p>
                        <p className="text-lg font-bold text-gray-900">₹{indent.value.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 uppercase">Market Avg</p>
                        <p className="text-lg font-bold text-blue-900">₹{(indent.riskData.factors.rateVariance.details.marketRate || 55000).toLocaleString()}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${indent.value < (indent.riskData.factors.rateVariance.details.marketRate || 55000) ? 'bg-red-50 text-red-900' : 'bg-green-50 text-green-900'}`}>
                        <p className="text-xs uppercase">Variance</p>
                        <p className="text-lg font-bold">
                          {indent.riskData.factors.rateVariance.details.variance}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="relative pl-4 border-l border-gray-200 space-y-6">
                  {indent.auditTrail.map((log) => (
                    <div key={log.id} className="relative">
                      <div className={`absolute -left-[21px] top-0 p-1 rounded-full border-2 border-white shadow-sm ${
                        log.type === 'risk' ? 'bg-purple-100 text-purple-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {log.type === 'risk' ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{log.action}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()} by <span className="font-medium text-gray-700">{log.user}</span>
                        </p>
                        {log.details && (
                          <div className="mt-1 text-xs bg-gray-50 p-2 rounded border border-gray-100 text-gray-600">
                            {log.details}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            {actionState === 'none' ? (
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setActionState('reject')} className="text-red-600 border-red-200 hover:bg-red-50">
                  Reject Indent
                </Button>
                <Button onClick={() => setActionState('approve')} className="bg-green-600 hover:bg-green-700">
                  Approve Indent
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-in slide-in-from-bottom-2">
                <h4 className={`font-bold ${actionState === 'approve' ? 'text-green-700' : 'text-red-700'}`}>
                  {actionState === 'approve' ? 'Approve Indent' : 'Reject Indent'}
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {actionState === 'approve' ? 'Approval Comments / Conditions' : 'Rejection Reason (Required)'}
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary"
                    rows={3}
                    placeholder={actionState === 'approve' ? 'e.g. Approved due to urgent customer requirement...' : 'e.g. Rate is too low compared to market...'}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setActionState('none')}>Cancel</Button>
                  <Button 
                    onClick={handleAction} 
                    className={actionState === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                    disabled={actionState === 'reject' && comment.length < 5}
                  >
                    Confirm {actionState === 'approve' ? 'Approval' : 'Rejection'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
