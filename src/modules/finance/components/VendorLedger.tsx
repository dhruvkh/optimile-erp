
import React, { useState, useMemo } from 'react';
import { useApp } from "../App";
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { formatINR } from '../utils';
import VendorPaymentModal from './VendorPaymentModal';
import { useOperationalData } from '../../../shared/context/OperationalDataContext';
import { useToast } from '../../../shared/context/ToastContext';

const VendorLedger: React.FC = () => {
  const { state, dispatch } = useApp();
  const { completedTrips } = useOperationalData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const searchQuery = localSearch || state.searchQuery;

  // Build accurate payable totals from live TMS trip data (vendor payables per trip)
  const vendorPayableSummary = useMemo(() => {
    const summary: Record<string, { freightAmount: number; paidAmount: number; pendingAmount: number; tripCount: number }> = {};

    completedTrips.forEach(trip => {
      if (!trip.vendorId || !trip.vendorPayable) return;
      const vp = trip.vendorPayable;
      const freight = trip.totalCost;
      const paid = (vp.advancePaid ? vp.advanceAmount : 0) + (vp.balancePaid ? vp.balanceAmount : 0);
      const pending = freight - paid;

      if (!summary[trip.vendorId]) {
        summary[trip.vendorId] = { freightAmount: 0, paidAmount: 0, pendingAmount: 0, tripCount: 0 };
      }
      summary[trip.vendorId].freightAmount += freight;
      summary[trip.vendorId].paidAmount += paid;
      summary[trip.vendorId].pendingAmount += Math.max(0, pending);
      summary[trip.vendorId].tripCount++;
    });

    return summary;
  }, [completedTrips]);

  const data = useMemo(() => {
    return state.vendors.map(v => {
      // Use live TMS payable data when available, fall back to simulation for vendors
      // that haven't had any trips assigned to them yet this session.
      const live = vendorPayableSummary[v.id];
      let freightAmount: number;
      let paidAmount: number;

      if (live && live.freightAmount > 0) {
        freightAmount = live.freightAmount;
        paidAmount = live.paidAmount;
      } else {
        // No trips this session — show Finance ledger opening balance as the outstanding amount
        freightAmount = Math.max(v.balance, 0);
        paidAmount = 0;
      }

      const balance = freightAmount - paidAmount;

      return {
        ...v,
        freightAmount,
        paidAmount,
        balance,
        tripCount: live?.tripCount ?? 0,
        lastUpdatedFormatted: v.lastActivity
          ? new Date(v.lastActivity).toLocaleString('en-GB', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: true,
            }).toUpperCase()
          : '-',
      };
    }).filter(v => {
      const q = searchQuery.toLowerCase();
      return (
        v.name.toLowerCase().includes(q) ||
        (v.code && v.code.toLowerCase().includes(q)) ||
        (v.taxId && v.taxId.toLowerCase().includes(q))
      );
    });
  }, [state.vendors, vendorPayableSummary, searchQuery]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRows(newSet);
  };

  const toggleAll = () => {
    if (selectedRows.size === data.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(data.map(v => v.id)));
  };

  const handleExport = () => {
    const exportData = data.map(v => ({
      'Vendor Name': v.name,
      'Vendor Code': v.code,
      'GSTIN': v.taxId,
      'Last Updated': v.lastUpdatedFormatted,
      'Freight Amount': v.freightAmount,
      'Paid Amount': v.paidAmount,
      'Balance Due': v.balance
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendor Ledger");
    XLSX.writeFile(workbook, "Vendor_Ledger_Global.xlsx");
  };

  return (
    <div className="space-y-6">
      {isPaymentModalOpen && (
        <VendorPaymentModal 
          vendorIds={selectedRows.size > 0 ? Array.from(selectedRows) : []} 
          onClose={() => setPaymentModalOpen(false)} 
        />
      )}

      {/* Header & Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vendor Ledger</h1>
        <p className="text-sm text-gray-500">Monitor exposure and manage payments for all transport partners.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
         
         {/* Search */}
         <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-icons text-gray-400">search</span>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-shadow"
              placeholder="Search by vendor name, code, or GSTIN..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
         </div>

         {/* Actions */}
         <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
               <span className="material-icons text-gray-500 mr-2">filter_list</span>
               Filters
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors" 
              title="Export to Excel"
            >
               <span className="material-icons text-green-600">description</span>
            </button>
            <button 
              onClick={() => {
                if (selectedRows.size === 0) {
                  showToast({ type: 'warning', title: 'No Vendors Selected', message: 'Please select at least one vendor to record payment.' });
                  return;
                }
                setPaymentModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-blue-700 text-sm font-medium transition-colors"
            >
               <span className="material-icons text-sm mr-2">add</span>
               Record payment
            </button>
         </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
         <div className="overflow-x-auto min-h-[500px]">
           <table className="w-full text-left text-sm whitespace-nowrap">
             <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
               <tr>
                 <th className="px-6 py-4 w-12 text-center">
                   <input 
                     type="checkbox" 
                     className="rounded border-gray-300 text-primary focus:ring-primary"
                     onChange={toggleAll} 
                     checked={selectedRows.size === data.length && data.length > 0} 
                   />
                 </th>
                 <th className="px-6 py-4">Vendor Name</th>
                 <th className="px-6 py-4">Vendor Code</th>
                 <th className="px-6 py-4">GSTIN</th>
                 <th className="px-6 py-4">Last updated on</th>
                 <th className="px-6 py-4 text-right">Freight Amount</th>
                 <th className="px-6 py-4 text-right">Paid</th>
                 <th className="px-6 py-4 text-right">Balance</th>
                 <th className="px-6 py-4 text-center">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {data.length === 0 ? (
                 <tr>
                   <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                     No vendors found matching your search.
                   </td>
                 </tr>
               ) : (
                 data.map(vendor => (
                   <tr key={vendor.id} className={`hover:bg-gray-50 transition-colors ${selectedRows.has(vendor.id) ? 'bg-blue-50' : ''}`}>
                     <td className="px-6 py-4 text-center">
                       <input 
                         type="checkbox" 
                         className="rounded border-gray-300 text-primary focus:ring-primary"
                         checked={selectedRows.has(vendor.id)} 
                         onChange={() => toggleSelection(vendor.id)} 
                       />
                     </td>
                     <td className="px-6 py-4 font-medium text-gray-900">
                        {vendor.name}
                     </td>
                     <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                        {vendor.code || '-'}
                     </td>
                     <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                        {vendor.taxId || '-'}
                     </td>
                     <td className="px-6 py-4 text-gray-500 text-xs">
                        {vendor.lastUpdatedFormatted}
                     </td>
                     <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {formatINR(vendor.freightAmount)}
                     </td>
                     <td className="px-6 py-4 text-right font-medium text-green-600">
                        {formatINR(vendor.paidAmount)}
                     </td>
                     <td className="px-6 py-4 text-right font-bold">
                        <span className={vendor.balance > 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatINR(vendor.balance)}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => navigate(`/finance/vendors/${vendor.id}`)}
                          className="text-primary hover:text-blue-800 font-medium text-xs border border-blue-200 hover:bg-blue-50 px-3 py-1 rounded transition-colors"
                        >
                          View
                        </button>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
         </div>
         <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
            <span>Showing {data.length} vendors</span>
            <div className="flex space-x-1">
              <button className="px-3 py-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-50" disabled>Prev</button>
              <button className="px-3 py-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-50">Next</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default VendorLedger;
