import React, { useEffect, useState } from 'react';
import { auctionEngine } from '../services/mockBackend';
import { AuditEvent } from '../types';
import { ShieldCheck } from 'lucide-react';

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditEvent[]>([]);

  const fetch = () => {
    const snap = auctionEngine.getSnapshot();
    setLogs(snap.auditLog);
  };

  useEffect(() => {
    fetch();
    const unsub = auctionEngine.subscribe(fetch);
    return unsub;
  }, []);

  return (
    <div>
        <div className="mb-6 flex items-center space-x-3">
             <ShieldCheck className="text-slate-400 w-8 h-8" />
             <div>
                 <h1 className="text-2xl font-bold text-slate-900">System Audit Log</h1>
                 <p className="text-slate-500">Immutable record of all engine events.</p>
             </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3">Timestamp</th>
                        <th className="px-6 py-3">Event Type</th>
                        <th className="px-6 py-3">Entity</th>
                        <th className="px-6 py-3">Triggered By</th>
                        <th className="px-6 py-3">Payload Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {logs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3 font-mono text-slate-500">
                                {new Date(log.createdAt).toISOString().split('T')[1].replace('Z','')}
                            </td>
                            <td className="px-6 py-3 font-medium text-slate-900">
                                <span className={`px-2 py-1 rounded text-xs ${log.eventType === 'BID_PLACED' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {log.eventType}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-slate-600">
                                {log.entityType} <span className="text-xs text-slate-400 block truncate w-24">{log.entityId}</span>
                            </td>
                            <td className="px-6 py-3 text-slate-600">
                                {log.triggeredBy}
                            </td>
                            <td className="px-6 py-3 text-slate-500 font-mono text-xs max-w-xs truncate">
                                {JSON.stringify(log.payload)}
                            </td>
                        </tr>
                    ))}
                    {logs.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                                No events recorded yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
}
