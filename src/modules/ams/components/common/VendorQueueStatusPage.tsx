import React, { useEffect, useState } from 'react';
import { Bell, Eye } from 'lucide-react';
import { auctionEngine } from '../../services/mockBackend';

const VENDOR_ID = 'V-089';

function formatINR(v: number) { return `₹${Math.round(v).toLocaleString('en-IN')}`; }

export function VendorQueueStatusPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsub = auctionEngine.subscribe(() => setTick((v) => v + 1));
    return unsub;
  }, []);

  const rows = auctionEngine.getVendorQueueStatus(VENDOR_ID);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Queue Positions</h1>
        <p className="text-slate-500">You are in standby for {rows.filter((r) => r.myRank > 1).length} lane(s).</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="text-sm font-semibold text-slate-900">Standby Opportunities</div>
        <div className="text-sm text-slate-600 mt-1">You may win if current winners decline.</div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Lane</th>
              <th className="px-4 py-3 text-left">Auction</th>
              <th className="px-4 py-3 text-left">My Rank</th>
              <th className="px-4 py-3 text-left">My Bid</th>
              <th className="px-4 py-3 text-left">Leading Bid</th>
              <th className="px-4 py-3 text-left">Difference</th>
              <th className="px-4 py-3 text-left">Chance</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const chanceText = row.chance === 'HIGH' ? '🟢 HIGH' : row.chance === 'MEDIUM' ? '🟡 MEDIUM' : row.chance === 'LOW' ? '🔴 LOW' : '⚫ NO CHANCE';
              return (
                <tr key={row.laneId} className="border-t border-slate-100">
                  <td className="px-4 py-3">{row.laneName}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{row.auctionId.slice(0, 8)}</td>
                  <td className="px-4 py-3">{row.myRank}</td>
                  <td className="px-4 py-3">{formatINR(row.myBid)}</td>
                  <td className="px-4 py-3">{formatINR(row.leadingBid)}</td>
                  <td className="px-4 py-3">+{formatINR(Math.max(0, row.difference))}</td>
                  <td className="px-4 py-3">{chanceText}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-300 text-xs"><Eye size={12} />View</button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">No standby opportunities currently.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-600 inline-flex items-center gap-2">
        <Bell size={14} /> Real-time alerts enabled for queue movement, winner declines, and pre-awards.
      </div>
    </div>
  );
}
