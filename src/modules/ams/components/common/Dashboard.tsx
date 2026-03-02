import React, { useEffect, useState } from 'react';
import { auctionEngine } from '../../services/mockBackend';
import { Auction, AuctionStatus } from '../../types';
import { Link } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';

export function Dashboard() {
  const [auctions, setAuctions] = useState<Auction[]>([]);

  const fetch = () => {
    const snap = auctionEngine.getSnapshot();
    setAuctions(snap.auctions);
  };

  useEffect(() => {
    fetch();
    const unsub = auctionEngine.subscribe(fetch);
    return unsub;
  }, []);

  const statusColors = {
    [AuctionStatus.DRAFT]: 'bg-slate-100 text-slate-600',
    [AuctionStatus.PUBLISHED]: 'bg-blue-100 text-blue-700',
    [AuctionStatus.RUNNING]: 'bg-green-100 text-green-700',
    [AuctionStatus.PAUSED]: 'bg-yellow-100 text-yellow-700',
    [AuctionStatus.COMPLETED]: 'bg-slate-100 text-slate-800',
    [AuctionStatus.CANCELLED]: 'bg-red-50 text-red-600',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Auction List</h1>
          <p className="text-slate-500">Overview of all registered auctions.</p>
        </div>
        <Link to="/create" className="bg-primary hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2">
          <Plus size={18} />
          <span>Create Auction</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Auction Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {auctions.map(auction => (
              <tr key={auction.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{auction.name}</td>
                <td className="px-6 py-4 text-slate-600">{auction.auctionType}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${statusColors[auction.status]}`}>
                    {auction.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                  {new Date(auction.createdAt).toLocaleDateString()} {new Date(auction.createdAt).toLocaleTimeString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center space-x-3">
                    <Link 
                      to={`/auction/${auction.id}`} 
                      className="inline-flex items-center space-x-1 text-slate-500 hover:text-accent font-medium transition-colors"
                    >
                      <Eye size={16} />
                      <span>View</span>
                    </Link>
                    {auction.status === AuctionStatus.COMPLETED && (
                      <Link to={`/ams/auctions/results/${auction.id}`} className="text-blue-700 hover:underline font-medium">
                        Results
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {auctions.length === 0 && (
               <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                       No auctions found. Create one to get started.
                   </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
