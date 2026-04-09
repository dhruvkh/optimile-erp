import React, { useEffect, useMemo, useState } from 'react';
import { auctionEngine } from '../../services/mockBackend';
import { Auction, AuctionStatus } from '../../types';
import { Link } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';
import { AIInsightsPanel } from '../../../../shared/components/AIInsightsPanel';

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

  const aiInsights = useMemo(() => {
    const running = auctions.filter((auction) => auction.status === AuctionStatus.RUNNING).length;
    const published = auctions.filter((auction) => auction.status === AuctionStatus.PUBLISHED).length;
    const completed = auctions.filter((auction) => auction.status === AuctionStatus.COMPLETED).length;
    const stalled = auctions.filter((auction) => [AuctionStatus.DRAFT, AuctionStatus.PAUSED].includes(auction.status)).length;

    return [
      {
        label: 'Live Auctions',
        title: 'Live sourcing momentum',
        metric: `${running} live`,
        tone: running > 0 ? 'positive' : 'watch',
        description: running > 0
          ? `${running} auctions are active in the market.`
          : 'No auctions are running right now.',
        action: 'Keep critical lanes live.',
      },
      {
        label: 'Pipeline',
        title: 'Publish-ready queue',
        metric: `${published} queued`,
        tone: published > 0 ? 'info' : 'watch',
        description: `${published} auctions are queued for the next bidding cycle.`,
        action: 'Check timing and vendor invite coverage.',
      },
      {
        label: 'Blockers',
        title: 'Execution drag',
        metric: `${stalled} stalled`,
        tone: stalled > 0 ? 'critical' : 'positive',
        description: stalled > 0
          ? `${stalled} auctions are still in draft or paused state.`
          : `${completed} auctions have completed with no active blockers.`,
        action: 'Clear stalled auctions first.',
      },
    ];
  }, [auctions]);

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

      <div className="mb-8">
        <AIInsightsPanel
          title="AI Insights: Procurement AMS"
          summary="Quick read on live auctions, pipeline, and blockers."
          insights={aiInsights}
          footer="Insights are generated from the live auction snapshot inside the procurement dashboard."
        />
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
