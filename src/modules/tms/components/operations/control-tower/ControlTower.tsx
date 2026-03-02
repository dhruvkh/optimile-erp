
import React, { useState, useEffect } from 'react';
import {
  ClipboardList, Truck, Package, Navigation, Anchor,
  CheckCircle, FileText, AlertTriangle, RefreshCw,
  Maximize2, Download, ChevronRight
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ControlTowerMap } from './ControlTowerMap';
import { DrillDownModal } from './DrillDownModal';
import { exceptionManager, TripException } from '../../../../../shared/services/exceptionManager';
import { ExceptionActionModal } from './ExceptionActionModal';

const TOWER_DATA = {
  indents: 45,
  assigned: 127,
  transit: 189,
  loading: 22,
  unloading: 8,
  completed: 16,
  podPending: 31,
  invoiced: 12,
};

const metrics = { otd: 94.2, utilization: 73, pod: 97 };

const stageBreakdown = [
  { status: 'Indent Received',  count: TOWER_DATA.indents,    time: '-',     sla: '-'   },
  { status: 'Vehicle Assigned', count: TOWER_DATA.assigned,   time: '2.3h',  sla: '95%' },
  { status: 'At Loading',       count: TOWER_DATA.loading,    time: '0.8h',  sla: '92%' },
  { status: 'In Transit',       count: TOWER_DATA.transit,    time: '18.5h', sla: '94%' },
  { status: 'At Unloading',     count: TOWER_DATA.unloading,  time: '0.5h',  sla: '96%' },
  { status: 'POD Pending',      count: TOWER_DATA.podPending, time: '-',     sla: '-'   },
  { status: 'Invoiced',         count: TOWER_DATA.invoiced,   time: '-',     sla: '-'   },
];

export const ControlTower: React.FC = () => {
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeExceptions, setActiveExceptions] = useState<TripException[]>([]);
  const [exceptionStats, setExceptionStats] = useState({ count: 0, bySeverity: {} as any });
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, title: string, type: string }>({
    isOpen: false, title: '', type: ''
  });
  const [actionModal, setActionModal] = useState<{ isOpen: boolean, exception?: TripException }>({
    isOpen: false
  });

  // Load Live Exceptions
  useEffect(() => {
    const loadExceptions = () => {
      const active = exceptionManager.getActive();
      const stats = exceptionManager.getStats();
      setActiveExceptions(active);
      setExceptionStats({ count: stats.active, bySeverity: stats.bySeverity });
      setLastRefreshed(new Date());
    };

    loadExceptions();
    const unsub = exceptionManager.subscribe(loadExceptions);
    return () => unsub();
  }, []);

  // Simulated Auto-Refresh
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        setLastRefreshed(new Date());
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleDrillDown = (title: string, type: string) => {
    setModalConfig({ isOpen: true, title, type });
  };

  const snapshotCards = [
    { key: 'indents',    label: 'Indents',      count: TOWER_DATA.indents,    icon: ClipboardList, color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { key: 'assigned',   label: 'Assigned',     count: TOWER_DATA.assigned,   icon: Truck,         color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { key: 'loading',    label: 'At Loading',   count: TOWER_DATA.loading,    icon: Package,       color: 'text-amber-600',  bg: 'bg-amber-50'  },
    { key: 'transit',    label: 'In Transit',   count: TOWER_DATA.transit,    icon: Navigation,    color: 'text-sky-600',    bg: 'bg-sky-50'    },
    { key: 'unloading',  label: 'At Unloading', count: TOWER_DATA.unloading,  icon: Anchor,        color: 'text-purple-600', bg: 'bg-purple-50' },
    { key: 'completed',  label: 'Completed',    count: TOWER_DATA.completed,  icon: CheckCircle,   color: 'text-green-600',  bg: 'bg-green-100' },
    { key: 'podPending', label: 'POD Pending',  count: TOWER_DATA.podPending, icon: FileText,      color: 'text-gray-600',   bg: 'bg-gray-100'  },
    { key: 'exceptions', label: 'Exceptions',   count: activeExceptions.length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50'  },
  ];

  const SnapshotCard = ({ data }: { data: typeof snapshotCards[0] }) => {
    const Icon = data.icon;
    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        onClick={() => handleDrillDown(data.label, data.key)}
      >
        <div className={`absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform`}>
          <Icon className={`h-12 w-12 ${data.color}`} />
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{data.label}</p>
        <div className="flex items-end justify-between">
          <h3 className={`text-2xl font-bold ${data.color}`}>{data.count}</h3>
          <span className="text-[10px] text-gray-400 font-medium group-hover:text-primary flex items-center">
            View <ChevronRight className="h-3 w-3 ml-0.5" />
          </span>
        </div>
      </div>
    );
  };

  const ProgressBar = ({ label, value, colorClass = 'bg-blue-600' }: any) => (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-600">{label}</span>
        <span className="font-bold text-gray-900">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${colorClass} h-2 rounded-full`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 space-y-4 animate-in fade-in duration-500 pb-8">

      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white px-6 py-3 border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <div className="h-3 w-3 rounded-full bg-red-500 mr-3 animate-pulse"></div>
            OPERATIONS CONTROL TOWER
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 ml-6">
            Live as of: <span className="font-mono font-medium">{lastRefreshed.toLocaleTimeString()}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-2 md:mt-0">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs flex items-center px-3 py-1.5 rounded-full border ${autoRefresh ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
          >
            <RefreshCw className={`h-3 w-3 mr-1.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button variant="outline" size="sm">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="px-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">

        {/* 2. Snapshot Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {snapshotCards.map(card => (
            <SnapshotCard key={card.key} data={card} />
          ))}
        </div>

        {/* 3. Main Content: Map + Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[500px]">

          {/* Center Map (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <ControlTowerMap />
          </div>

          {/* Right Panel (1/3 width): Stage Tracking & Exceptions */}
          <div className="lg:col-span-1 flex flex-col gap-4">

            {/* Exceptions Panel */}
            <Card title="Active Exceptions" className="border-l-4 border-l-red-500 shadow-sm"
              action={<span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">{exceptionStats.count}</span>}
            >
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {activeExceptions.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded italic">No active exceptions!</div>
                ) : (
                  activeExceptions.map((ex) => {
                    const meta = exceptionManager.getCategoryMeta(ex.category);
                    return (
                      <div key={ex.id} className="flex justify-between items-center p-2 bg-red-50/50 rounded border border-red-100 hover:border-red-300 transition-colors group">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <span className="text-base mr-2">{meta.icon}</span>
                            <span className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">{ex.title}</span>
                          </div>
                          <div className="flex items-center text-[10px] text-gray-500 mt-1 space-x-2">
                            <span>{ex.bookingRef}</span>
                            <span>•</span>
                            <span className={`${ex.slaBreached ? 'text-red-600 font-bold' : ''}`}>
                              {ex.slaBreached ? 'SLA BREACHED' : `${Math.round((ex.slaDueAt - Date.now()) / (1000 * 60 * 60))}h SLA`}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded
                                     ${ex.severity === 'critical' ? 'bg-red-200 text-red-800' :
                              ex.severity === 'high' ? 'bg-orange-200 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`
                          }>
                            {ex.severity}
                          </span>
                          <button onClick={() => setActionModal({ isOpen: true, exception: ex })} className="text-[10px] text-blue-600 hover:underline font-medium">
                            Act
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Stage Breakdown Table */}
            <Card title="Stage-wise Breakdown" className="flex-1 overflow-hidden flex flex-col p-0">
              <div className="flex-1 overflow-y-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase sticky top-0">
                    <tr>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium text-right">Cnt</th>
                      <th className="px-4 py-2 font-medium text-right">Avg T</th>
                      <th className="px-4 py-2 font-medium text-right">SLA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stageBreakdown.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleDrillDown(row.status, 'Stage')}>
                        <td className="px-4 py-2 font-medium text-gray-800 text-xs">{row.status}</td>
                        <td className="px-4 py-2 text-right font-bold text-gray-900 text-xs">{row.count}</td>
                        <td className="px-4 py-2 text-right text-gray-500 text-xs">{row.time}</td>
                        <td className={`px-4 py-2 text-right text-xs font-medium ${row.sla !== '-' && parseInt(row.sla) > 90 ? 'text-green-600' : 'text-gray-400'}`}>
                          {row.sla}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Performance Metrics */}
            <Card title="KPI Summary">
              <ProgressBar label="On-Time Delivery" value={metrics.otd} colorClass="bg-green-600" />
              <ProgressBar label="Fleet Utilization" value={metrics.utilization} colorClass="bg-blue-600" />
              <ProgressBar label="POD Collection" value={metrics.pod} colorClass="bg-purple-600" />
            </Card>

          </div>
        </div>
      </div>

      <DrillDownModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        type={modalConfig.type}
      />

      {actionModal.isOpen && actionModal.exception && (
        <ExceptionActionModal
          exception={actionModal.exception}
          onClose={() => setActionModal({ isOpen: false })}
        />
      )}
    </div>
  );
};
