import React from 'react';
import { useApp } from '../App';

const formatINR = (amount: number) =>
  amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const ApprovalMatrix: React.FC = () => {
  const { state } = useApp();
  const currentUserRole = state.currentUser.role;

  const pendingApprovals = [
    { id: 'APP-01', type: 'Vendor Payment', amount: 850000, requestor: 'Amit Patel', date: '2024-03-20', requiredRole: 'Finance Manager' },
    { id: 'APP-02', type: 'Customer Credit Limit Override', amount: 3500000, requestor: 'Priya Sharma', date: '2024-03-21', requiredRole: 'Admin' },
    { id: 'APP-03', type: 'Expense Claim', amount: 45000, requestor: 'Rajesh Kumar', date: '2024-03-22', requiredRole: 'Accountant' },
    { id: 'APP-04', type: 'Vendor Contract Rate', amount: 1500000, requestor: 'Sunita Verma', date: '2024-03-22', requiredRole: 'Finance Manager' },
  ];

  const roleHierarchy: string[] = ['Accountant', 'Operations Manager', 'Finance Manager', 'Admin'];
  const userRank = roleHierarchy.indexOf(currentUserRole);

  const tiers = [
    { label: '< ₹5L', range: 'Up to ₹5,00,000', role: 'Accountant', color: 'bg-green-100 text-green-800' },
    { label: '₹5L – ₹25L', range: '₹5,00,001 – ₹25,00,000', role: 'Finance Manager', color: 'bg-blue-100 text-blue-800' },
    { label: '> ₹25L', range: 'Above ₹25,00,000', role: 'Admin', color: 'bg-purple-100 text-purple-800' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="material-icons text-blue-500 mr-2">verified_user</span>
              Tiered Approval Matrix
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Role-based approval authority for financial transactions
            </p>
          </div>
          <span className="text-sm font-bold text-gray-900 bg-blue-50 px-3 py-1.5 border border-blue-200 rounded">
            Your Role: <span className="text-primary">{currentUserRole}</span>
          </span>
        </div>
      </div>

      {/* Approval Tiers */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Approval Authority Tiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map(tier => (
            <div key={tier.role} className={`p-4 rounded-lg border-2 ${currentUserRole === tier.role ? 'border-primary' : 'border-gray-200'}`}>
              <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold mb-2 ${tier.color}`}>{tier.label}</div>
              <p className="text-sm text-gray-600">{tier.range}</p>
              <p className="text-sm font-medium text-gray-900 mt-1">Approver: {tier.role}</p>
              {currentUserRole === tier.role && (
                <p className="text-xs text-primary font-medium mt-2 flex items-center">
                  <span className="material-icons text-[14px] mr-1">check_circle</span> Your level
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Pending Approvals
          <span className="ml-2 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingApprovals.length}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {pendingApprovals.map(app => {
            const requiredRank = roleHierarchy.indexOf(app.requiredRole);
            const canApprove = userRank >= requiredRank && userRank !== -1;
            return (
              <div key={app.id} className={`p-4 rounded-lg border ${canApprove ? 'border-primary bg-blue-50/30 shadow-sm' : 'border-gray-200 bg-gray-50 opacity-75'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white px-2 py-0.5 rounded border">{app.type}</span>
                  <span className="text-xs text-gray-400">{app.date}</span>
                </div>
                <p className="text-lg font-bold text-gray-900 my-2">{formatINR(app.amount)}</p>
                <p className="text-xs text-gray-600 mb-4">Req. by: <span className="font-medium">{app.requestor}</span></p>
                <div className="border-t pt-3">
                  {canApprove ? (
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-green-600 text-white text-xs font-bold py-1.5 rounded hover:bg-green-700 transition">Approve</button>
                      <button className="flex-1 bg-white border border-red-200 text-red-600 text-xs font-bold py-1.5 rounded hover:bg-red-50 transition">Reject</button>
                    </div>
                  ) : (
                    <div className="text-xs font-medium flex items-center text-orange-600 bg-orange-50 p-1.5 rounded">
                      <span className="material-icons text-[14px] mr-1">lock</span> Requires {app.requiredRole}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ApprovalMatrix;
