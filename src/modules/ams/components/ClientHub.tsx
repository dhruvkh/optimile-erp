import React, { useEffect, useState } from 'react';
import { auctionEngine } from '../services/mockBackend';
import { RFI, RFQ, RFIStatus } from '../types';
import { Link } from 'react-router-dom';
import { FileText, FileSpreadsheet, Plus, ArrowRight } from 'lucide-react';

export function ClientHub() {
  const [rfis, setRFIs] = useState<RFI[]>([]);
  const [rfqs, setRFQs] = useState<RFQ[]>([]);

  const fetch = () => {
      const snap = auctionEngine.getSnapshot();
      setRFIs(snap.rfis);
      setRFQs(snap.rfqs);
  };

  useEffect(() => {
      fetch();
      const unsub = auctionEngine.subscribe(fetch);
      return unsub;
  }, []);

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Client Hub</h1>
                <p className="text-slate-500">Manage RFI and RFQ workflows.</p>
            </div>
            <div className="space-x-4">
                 <Link to="/ams/clients/rfi/create" className="bg-slate-800 text-white px-4 py-2 rounded flex inline-flex items-center space-x-2 hover:bg-slate-700">
                    <Plus size={16} /> <span>New RFI</span>
                 </Link>
                 <Link to="/ams/clients/rfq/create" className="bg-primary text-white px-4 py-2 rounded flex inline-flex items-center space-x-2 hover:bg-slate-800">
                    <Plus size={16} /> <span>New RFQ</span>
                 </Link>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* RFI Section */}
            <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-2 mb-4 border-b border-slate-100 pb-2">
                    <FileText className="text-slate-500" />
                    <h2 className="text-lg font-bold">RFI Requests</h2>
                </div>
                <div className="space-y-3">
                    {rfis.map(rfi => (
                        <div key={rfi.id} className="p-3 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                            <div>
                                <div className="font-bold text-slate-800">{rfi.title}</div>
                                <div className="text-xs text-slate-500">Status: {rfi.status} • {new Date(rfi.deadline).toLocaleDateString()}</div>
                            </div>
                            <Link to={`/ams/clients/rfi/${rfi.id}`} className="text-accent hover:underline text-sm font-medium">Manage</Link>
                        </div>
                    ))}
                    {rfis.length === 0 && <div className="text-center text-slate-400 text-sm italic py-4">No RFIs created</div>}
                </div>
            </div>

            {/* RFQ Section */}
            <div className="bg-white p-6 rounded-lg border border-slate-200">
                 <div className="flex items-center space-x-2 mb-4 border-b border-slate-100 pb-2">
                    <FileSpreadsheet className="text-slate-500" />
                    <h2 className="text-lg font-bold">RFQ & Quotes</h2>
                </div>
                <div className="space-y-3">
                    {rfqs.map(rfq => (
                        <div key={rfq.id} className="p-3 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                            <div>
                                <div className="font-bold text-slate-800">{rfq.name}</div>
                                <div className="text-xs text-slate-500">Status: {rfq.status}</div>
                            </div>
                            <Link to={`/ams/clients/rfq/${rfq.id}`} className="text-accent hover:underline text-sm font-medium">Manage</Link>
                        </div>
                    ))}
                    {rfqs.length === 0 && <div className="text-center text-slate-400 text-sm italic py-4">No RFQs created</div>}
                </div>
            </div>
        </div>
    </div>
  );
}
