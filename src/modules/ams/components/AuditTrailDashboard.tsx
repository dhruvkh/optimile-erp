import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  ChevronDown,
  Copy,
  Download,
  FileText,
  Filter,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Modal, useToast } from './common';
import { AUDIT_COLORS, auditTrailService, type AuditAction, type AuditEventType, type AuditStatus, type UnifiedAuditLog } from '../services/auditTrail';

function useAuditSnapshot() {
  const [tick, setTick] = useState(0);
  useEffect(() => auditTrailService.subscribe(() => setTick((t) => t + 1)), []);
  return useMemo(() => auditTrailService.getSnapshot(), [tick]);
}

type MainTab = 'overview' | 'security' | 'changes' | 'users' | 'system' | 'integrations';
type TimeRange = 'last_hour' | 'today' | 'last_7_days' | 'last_30_days' | 'custom';

const EVENT_TYPE_OPTIONS: Array<{ value: AuditEventType; label: string; color: string }> = [
  { value: 'user_action', label: 'User Actions', color: AUDIT_COLORS.info },
  { value: 'system_event', label: 'System Events', color: AUDIT_COLORS.system },
  { value: 'security', label: 'Security Events', color: AUDIT_COLORS.critical },
  { value: 'data_change', label: 'Data Changes', color: AUDIT_COLORS.success },
  { value: 'failed_action', label: 'Failed Actions', color: AUDIT_COLORS.error },
  { value: 'integration', label: 'Integrations', color: AUDIT_COLORS.warning },
];

const ACTION_OPTIONS: AuditAction[] = ['create', 'read', 'update', 'delete', 'login', 'logout', 'denied', 'approve', 'reject', 'execute'];
const STATUS_OPTIONS: AuditStatus[] = ['success', 'failed', 'warning'];

function badge(text: string, color: string, textColor = '#fff') {
  return (
    <span className="rounded-full px-2 py-1 text-xs font-semibold" style={{ backgroundColor: color, color: textColor }}>
      {text}
    </span>
  );
}

function getSeverityColor(severity: UnifiedAuditLog['security']['severity']) {
  if (severity === 'critical') return AUDIT_COLORS.error;
  if (severity === 'high') return AUDIT_COLORS.deleted;
  if (severity === 'medium') return AUDIT_COLORS.warning;
  return AUDIT_COLORS.success;
}

function getRiskLabel(score: number) {
  if (score >= 86) return { label: 'CRITICAL', color: AUDIT_COLORS.error };
  if (score >= 61) return { label: 'HIGH', color: AUDIT_COLORS.deleted };
  if (score >= 31) return { label: 'MEDIUM', color: AUDIT_COLORS.warning };
  return { label: 'LOW', color: AUDIT_COLORS.success };
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const sec = Math.max(1, Math.floor(diff / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function inTimeRange(log: UnifiedAuditLog, range: TimeRange, customFrom: string, customTo: string) {
  const now = Date.now();
  if (range === 'last_hour') return log.timestamp >= now - 60 * 60 * 1000;
  if (range === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return log.timestamp >= start.getTime();
  }
  if (range === 'last_7_days') return log.timestamp >= now - 7 * 24 * 60 * 60 * 1000;
  if (range === 'last_30_days') return log.timestamp >= now - 30 * 24 * 60 * 60 * 1000;
  const from = customFrom ? new Date(customFrom).getTime() : 0;
  const to = customTo ? new Date(customTo).getTime() : now;
  return log.timestamp >= from && log.timestamp <= to;
}

export function AuditTrailDashboard() {
  const { logs, stats, lastUpdateAt } = useAuditSnapshot();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<MainTab>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<AuditEventType>>(new Set(EVENT_TYPE_OPTIONS.map((e) => e.value)));
  const [selectedStatuses, setSelectedStatuses] = useState<Set<AuditStatus>>(new Set(STATUS_OPTIONS));
  const [selectedAction, setSelectedAction] = useState<'all' | AuditAction>('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedResource, setSelectedResource] = useState('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const [showExport, setShowExport] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'excel'>('csv');
  const [exportMaxRecords, setExportMaxRecords] = useState(10000);
  const [exportApplyCurrent, setExportApplyCurrent] = useState(true);

  const [advField, setAdvField] = useState<'user' | 'action' | 'resource' | 'status'>('user');
  const [advOperator, setAdvOperator] = useState<'equals' | 'contains'>('contains');
  const [advValue, setAdvValue] = useState('');

  const [selectedUserActivity, setSelectedUserActivity] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName === 'INPUT' || (event.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (event.key.toLowerCase() === 'r') {
        auditTrailService.refresh();
      }
      if (event.key.toLowerCase() === 'f') {
        const el = document.getElementById('audit-search-input') as HTMLInputElement | null;
        el?.focus();
      }
      if (event.key.toLowerCase() === 'e') {
        setShowExport(true);
      }
      if (event.key.toLowerCase() === 's') {
        setActiveTab('security');
      }
      if (event.key === 'Escape') {
        setQuery('');
        setSelectedAction('all');
        setSelectedResource('all');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const users = useMemo(() => Array.from(new Set(logs.map((l) => l.actor.userName))).sort(), [logs]);
  const resources = useMemo(() => Array.from(new Set(logs.map((l) => l.resource.resourceType))).sort(), [logs]);

  const filtered = useMemo(() => {
    let list = logs.filter((l) => inTimeRange(l, timeRange, customFrom, customTo));
    list = list.filter((l) => selectedEventTypes.has(l.eventType));
    list = list.filter((l) => selectedStatuses.has(l.status));
    if (selectedAction !== 'all') list = list.filter((l) => l.action === selectedAction);
    if (selectedUser !== 'all') list = list.filter((l) => l.actor.userName === selectedUser);
    if (selectedResource !== 'all') list = list.filter((l) => l.resource.resourceType === selectedResource);
    if (debouncedQuery) {
      list = list.filter((l) =>
        `${l.actor.userName} ${l.actionLabel} ${l.resource.resourceName} ${l.resource.resourceType} ${l.details.description}`
          .toLowerCase()
          .includes(debouncedQuery),
      );
    }

    if (showAdvancedSearch && advValue.trim()) {
      const value = advValue.trim().toLowerCase();
      if (advField === 'user') {
        list = list.filter((l) => (advOperator === 'equals' ? l.actor.userName.toLowerCase() === value : l.actor.userName.toLowerCase().includes(value)));
      }
      if (advField === 'action') {
        list = list.filter((l) => (advOperator === 'equals' ? l.action === (value as AuditAction) : l.actionLabel.toLowerCase().includes(value)));
      }
      if (advField === 'resource') {
        list = list.filter((l) => (advOperator === 'equals' ? l.resource.resourceType.toLowerCase() === value : l.resource.resourceName.toLowerCase().includes(value)));
      }
      if (advField === 'status') {
        list = list.filter((l) => (advOperator === 'equals' ? l.status === (value as AuditStatus) : l.status.toLowerCase().includes(value)));
      }
    }

    if (activeTab === 'security') list = list.filter((l) => l.eventType === 'security' || l.status === 'failed' || l.action === 'denied');
    if (activeTab === 'changes') list = list.filter((l) => l.eventType === 'data_change');
    if (activeTab === 'system') list = list.filter((l) => l.eventType === 'system_event');
    if (activeTab === 'integrations') list = list.filter((l) => l.eventType === 'integration');
    if (activeTab === 'users') {
      list = list.filter((l) => l.actor.actorType === 'user');
      if (selectedUserActivity !== 'all') list = list.filter((l) => l.actor.userName === selectedUserActivity);
    }

    return list;
  }, [
    logs,
    timeRange,
    customFrom,
    customTo,
    selectedEventTypes,
    selectedStatuses,
    selectedAction,
    selectedUser,
    selectedResource,
    debouncedQuery,
    showAdvancedSearch,
    advField,
    advOperator,
    advValue,
    activeTab,
    selectedUserActivity,
  ]);

  const securityLogs = useMemo(() => filtered.filter((l) => l.eventType === 'security' || l.status === 'failed' || l.action === 'denied'), [filtered]);
  const dataChangeLogs = useMemo(() => filtered.filter((l) => l.eventType === 'data_change'), [filtered]);
  const systemLogs = useMemo(() => filtered.filter((l) => l.eventType === 'system_event'), [filtered]);
  const integrationLogs = useMemo(() => filtered.filter((l) => l.eventType === 'integration'), [filtered]);

  const selectedUserLogs = useMemo(() => {
    if (selectedUserActivity === 'all') return filtered.filter((l) => l.actor.actorType === 'user');
    return filtered.filter((l) => l.actor.userName === selectedUserActivity);
  }, [filtered, selectedUserActivity]);

  const userActivityStats = useMemo(() => {
    const list = selectedUserLogs;
    const login = list.find((l) => l.action === 'login');
    const last = list[0];
    const counts = {
      total: list.length,
      creates: list.filter((l) => l.action === 'create').length,
      updates: list.filter((l) => l.action === 'update').length,
      deletes: list.filter((l) => l.action === 'delete').length,
      failed: list.filter((l) => l.status === 'failed').length,
    };
    return {
      ...counts,
      loginTime: login?.timestamp,
      lastAction: last?.timestamp,
      sessionDurationHours: counts.total ? Math.max(0.2, (Date.now() - (login?.timestamp || Date.now())) / (1000 * 60 * 60)) : 0,
    };
  }, [selectedUserLogs]);

  const toggleEventType = (eventType: AuditEventType) => {
    setSelectedEventTypes((prev) => {
      const next = new Set(prev);
      if (next.has(eventType)) next.delete(eventType);
      else next.add(eventType);
      return next;
    });
  };

  const toggleStatus = (status: AuditStatus) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkExport = () => {
    const rows = filtered.filter((l) => selectedRows.has(l.logId));
    if (rows.length === 0) {
      showToast({ type: 'warning', title: 'No rows selected', message: 'Select log rows to export.' });
      return;
    }
    auditTrailService.exportLogs(rows, exportFormat);
    showToast({ type: 'success', title: 'Export completed', message: `${rows.length} records exported.` });
  };

  const bulkReviewed = () => {
    if (selectedRows.size === 0) {
      showToast({ type: 'warning', title: 'No rows selected', message: 'Select records to mark as reviewed.' });
      return;
    }
    auditTrailService.markReviewed(Array.from(selectedRows));
    showToast({ type: 'success', title: 'Marked as reviewed', message: `${selectedRows.size} log entries updated.` });
    setSelectedRows(new Set());
  };

  const runExport = () => {
    const rows = exportApplyCurrent ? filtered.slice(0, exportMaxRecords) : logs.slice(0, exportMaxRecords);
    auditTrailService.exportLogs(rows, exportFormat);
    setShowExport(false);
    showToast({ type: 'success', title: 'Export completed', message: `${rows.length} records exported (${exportFormat.toUpperCase()}).` });
  };

  const revertChange = (log: UnifiedAuditLog) => {
    const result = auditTrailService.revertLog(log.logId, 'Rajesh Kumar', 'Manual revert from audit dashboard');
    if (result.ok) showToast({ type: 'success', title: 'Change reverted', message: 'A new audit event was recorded.' });
    else showToast({ type: 'error', title: 'Revert failed', message: result.message });
  };

  const tabButton = (tab: MainTab, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`rounded-lg px-3 py-2 text-sm font-semibold ${activeTab === tab ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-5 pb-8">
      <header className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">System Audit Trail</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-slate-900" style={{ backgroundColor: '#76FF03' }}>
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-600" /> LIVE
              </span>
              <span>Last update: {relativeTime(lastUpdateAt)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowExport(true)} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: AUDIT_COLORS.info }}>
              <Download size={16} /> Export Audit Log
            </button>
            <button onClick={() => setShowAdvancedSearch(true)} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: AUDIT_COLORS.warning }}>
              <Filter size={16} /> Advanced Search
            </button>
            <button onClick={() => setShowReport(true)} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: AUDIT_COLORS.success }}>
              <FileText size={16} /> Generate Report
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl p-4 text-white" style={{ backgroundColor: AUDIT_COLORS.info }}>
          <div className="flex items-center justify-between"><div className="text-sm font-semibold">Today's Activity</div><span>📊</span></div>
          <div className="mt-2 text-3xl font-bold">{stats.todayTotal.toLocaleString()}</div>
          <div className="mt-2 inline-flex items-center gap-1 rounded bg-white/25 px-2 py-1 text-xs"><ArrowUpRight size={12} /> +15% vs yesterday</div>
          <div className="mt-2 space-y-1 text-xs">
            <div>User Actions: {stats.userActions}</div>
            <div>System Events: {stats.systemEvents}</div>
            <div>Failed Actions: {stats.failedActions}</div>
          </div>
        </div>

        <div className="rounded-xl p-4 text-white" style={{ backgroundColor: AUDIT_COLORS.critical }}>
          <div className="flex items-center justify-between"><div className="text-sm font-semibold">Security Events</div><ShieldAlert size={16} /></div>
          <div className="mt-2 text-3xl font-bold">{stats.criticalSecurityEvents}</div>
          <div className="mt-2 animate-pulse rounded bg-red-500/40 px-2 py-1 text-xs font-semibold">REQUIRES ATTENTION</div>
          <div className="mt-2 space-y-1 text-xs">
            <div>Failed logins: {securityLogs.filter((l) => l.action === 'denied').length}</div>
            <div>Permission denials: {securityLogs.filter((l) => l.action === 'denied').length}</div>
            <div>Suspicious activity: {securityLogs.filter((l) => l.security.isSuspicious).length}</div>
          </div>
        </div>

        <div className="rounded-xl p-4 text-white" style={{ backgroundColor: AUDIT_COLORS.success }}>
          <div className="flex items-center justify-between"><div className="text-sm font-semibold">Data Changes</div><span>✏️</span></div>
          <div className="mt-2 text-3xl font-bold">{stats.dataChanges}</div>
          <div className="mt-2 flex flex-wrap gap-1 text-xs">
            {badge(`Auctions ${dataChangeLogs.filter((l) => l.resource.resourceType.includes('AUCTION')).length}`, AUDIT_COLORS.info)}
            {badge(`Vendors ${dataChangeLogs.filter((l) => l.resource.resourceType.includes('VENDOR')).length}`, AUDIT_COLORS.system)}
            {badge(`Contracts ${dataChangeLogs.filter((l) => l.resource.resourceType.includes('CONTRACT')).length}`, AUDIT_COLORS.critical)}
            {badge(`Settings ${dataChangeLogs.filter((l) => l.resource.resourceType.includes('SETTING')).length}`, AUDIT_COLORS.warning)}
          </div>
        </div>

        <div className="rounded-xl p-4 text-slate-900" style={{ backgroundColor: '#76FF03' }}>
          <div className="flex items-center justify-between"><div className="text-sm font-semibold">Active Users</div><Users size={16} /></div>
          <div className="mt-2 text-3xl font-bold">{stats.activeUsers}</div>
          <div className="mt-2 space-y-1 text-xs">
            <div>Peak today: {stats.peakActiveUsers} users</div>
            <div>Avg session: 2.3 hours</div>
          </div>
          <Link to="/ams/audit/active-sessions" className="mt-2 inline-block rounded bg-slate-900/80 px-2 py-1 text-xs text-white">View Sessions</Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tabButton('overview', 'Audit Log')}
        {tabButton('security', 'Security View')}
        {tabButton('changes', 'Data Changes')}
        {tabButton('users', 'User Activity')}
        {tabButton('system', 'System Events')}
        {tabButton('integrations', 'Integrations')}
        <Link to="/ams/audit/alerts" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Audit Alerts</Link>
        <Link to="/ams/audit/retention" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Retention Policy</Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 xl:grid-cols-6 md:grid-cols-3">
          <label className="text-xs">
            Time Range
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as TimeRange)} className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm">
              <option value="last_hour">Last Hour</option>
              <option value="today">Today</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          {timeRange === 'custom' ? (
            <>
              <label className="text-xs">From<input type="datetime-local" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm" /></label>
              <label className="text-xs">To<input type="datetime-local" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm" /></label>
            </>
          ) : null}

          <label className="text-xs">
            User
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm">
              <option value="all">All Users</option>
              {users.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>

          <label className="text-xs">
            Action
            <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value as 'all' | AuditAction)} className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm">
              <option value="all">All Actions</option>
              {ACTION_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>

          <label className="text-xs">
            Resource Type
            <select value={selectedResource} onChange={(e) => setSelectedResource(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm">
              <option value="all">All</option>
              {resources.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 text-xs text-slate-500">Event Types</div>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPE_OPTIONS.map((evt) => (
                <button key={evt.value} onClick={() => toggleEventType(evt.value)} className={`rounded-full border px-2 py-1 text-xs font-semibold ${selectedEventTypes.has(evt.value) ? 'text-white' : 'text-slate-600 bg-white'}`} style={{ borderColor: evt.color, backgroundColor: selectedEventTypes.has(evt.value) ? evt.color : '#fff' }}>
                  {evt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs text-slate-500">Status</div>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((st) => (
                <button key={st} onClick={() => toggleStatus(st)} className={`rounded-full border px-2 py-1 text-xs font-semibold ${selectedStatuses.has(st) ? 'text-white' : 'text-slate-600 bg-white'}`} style={{ borderColor: st === 'success' ? AUDIT_COLORS.success : st === 'warning' ? AUDIT_COLORS.warning : AUDIT_COLORS.error, backgroundColor: selectedStatuses.has(st) ? st === 'success' ? AUDIT_COLORS.success : st === 'warning' ? AUDIT_COLORS.warning : AUDIT_COLORS.error : '#fff' }}>
                  {st.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              id="audit-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search logs by user, action, resource..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <button onClick={() => auditTrailService.refresh()} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"><RefreshCcw size={14} /> Refresh</button>
        </div>
      </section>

      {activeTab === 'security' ? (
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl p-4 text-white" style={{ backgroundColor: AUDIT_COLORS.error }}>
            <div className="font-semibold">Failed Login Attempts</div>
            <div className="mt-2 text-3xl font-bold">{securityLogs.filter((l) => l.action === 'denied').length}</div>
            <div className="mt-2 text-xs">Above threshold</div>
            <button className="mt-3 rounded bg-black/20 px-3 py-1 text-xs">Block IP</button>
          </div>
          <div className="rounded-xl p-4 text-white" style={{ backgroundColor: AUDIT_COLORS.warning }}>
            <div className="font-semibold">Permission Denials</div>
            <div className="mt-2 text-3xl font-bold">{securityLogs.filter((l) => l.action === 'denied').length}</div>
            <div className="mt-2 text-xs">Most denied: auction.delete</div>
            <button className="mt-3 rounded bg-black/20 px-3 py-1 text-xs">Review Access</button>
          </div>
          <div className="rounded-xl p-4 text-white" style={{ backgroundColor: AUDIT_COLORS.critical }}>
            <div className="font-semibold">Suspicious Activity</div>
            <div className="mt-2 text-3xl font-bold">{securityLogs.filter((l) => l.security.isSuspicious).length}</div>
            <div className="mt-2 text-xs">Pattern alerts active</div>
            <button className="mt-3 rounded bg-black/20 px-3 py-1 text-xs">Investigate</button>
          </div>
        </section>
      ) : null}

      {activeTab === 'users' ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <label className="text-sm font-semibold">Selected User</label>
            <select value={selectedUserActivity} onChange={(e) => setSelectedUserActivity(e.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="all">All Users</option>
              {users.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Total Actions Today</div><div className="text-2xl font-bold text-slate-900">{userActivityStats.total}</div></div>
            <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Login Time</div><div className="text-sm font-semibold text-slate-900">{userActivityStats.loginTime ? new Date(userActivityStats.loginTime).toLocaleTimeString() : '-'}</div></div>
            <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Session Duration</div><div className="text-2xl font-bold text-slate-900">{userActivityStats.sessionDurationHours.toFixed(1)}h</div></div>
            <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Last Action</div><div className="text-sm font-semibold text-slate-900">{userActivityStats.lastAction ? relativeTime(userActivityStats.lastAction) : '-'}</div></div>
          </div>
        </section>
      ) : null}

      {activeTab === 'integrations' ? (
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Total API Calls</div><div className="text-2xl font-bold">{integrationLogs.length}</div></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Success Rate</div><div className="text-2xl font-bold text-[#00C853]">{integrationLogs.length ? ((integrationLogs.filter((l) => l.status === 'success').length / integrationLogs.length) * 100).toFixed(1) : '0'}%</div></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Failed Calls</div><div className="text-2xl font-bold text-[#FF1744]">{integrationLogs.filter((l) => l.status === 'failed').length}</div></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">Avg Response</div><div className="text-2xl font-bold text-[#00C853]">245ms</div></div>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-3">
          <div className="text-sm font-semibold text-slate-700">{activeTab === 'changes' ? 'Change Detail Table' : activeTab === 'security' ? 'Security Event Table' : activeTab === 'integrations' ? 'API/Webhook Log' : 'Audit Log Table'}</div>
          <div className="flex items-center gap-2">
            <button onClick={bulkExport} className="rounded border border-slate-300 px-2 py-1 text-xs">Export Selected</button>
            <button onClick={bulkReviewed} className="rounded border border-slate-300 px-2 py-1 text-xs">Mark Reviewed</button>
            <button onClick={() => setShowAdvancedSearch(true)} className="rounded border border-slate-300 px-2 py-1 text-xs">Create Alert Rule</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left"><input type="checkbox" onChange={(e) => setSelectedRows(e.target.checked ? new Set(filtered.map((l) => l.logId)) : new Set())} /></th>
                <th className="px-3 py-2 text-left">Timestamp</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">User/Actor</th>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">Resource</th>
                <th className="px-3 py-2 text-left">Details</th>
                <th className="px-3 py-2 text-left">IP</th>
                {activeTab === 'security' ? <th className="px-3 py-2 text-left">Severity</th> : null}
                {activeTab === 'security' ? <th className="px-3 py-2 text-left">Risk</th> : null}
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map((log) => {
                const risk = getRiskLabel(log.security.riskScore);
                return (
                  <React.Fragment key={log.logId}>
                    <tr className={`border-t border-slate-100 hover:bg-blue-50 ${selectedRows.has(log.logId) ? 'bg-blue-50/80' : ''}`}>
                      <td className="px-3 py-2"><input type="checkbox" checked={selectedRows.has(log.logId)} onChange={() => toggleRow(log.logId)} /></td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        <div>{new Date(log.timestamp).toLocaleString()}</div>
                        <div className="text-[11px] text-slate-400">{relativeTime(log.timestamp)}</div>
                      </td>
                      <td className="px-3 py-2">{badge(log.eventTypeLabel, log.eventTypeColor)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                            {log.actor.actorType === 'system' ? <Bot size={12} /> : <User size={12} />}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-800">{log.actor.userName}</div>
                            <div className="text-[11px]" style={{ color: log.actor.userRoleColor }}>{log.actor.userRole}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">{badge(log.actionLabel, log.actionColor)}</td>
                      <td className="px-3 py-2">
                        <div className="text-xs font-semibold text-slate-800">{log.resource.resourceType}</div>
                        <div className="text-[11px] text-slate-500">{log.resource.resourceName}</div>
                        <div className="text-[11px] text-slate-400">#{log.resource.resourceId.slice(0, 12)}</div>
                      </td>
                      <td className="px-3 py-2 max-w-[280px] text-xs text-slate-700">
                        <div className="truncate">{log.details.description}</div>
                        {log.details.changedFields?.[0] ? (
                          <div className="text-[11px] text-slate-500 truncate">
                            {String(log.details.changedFields[0].oldValue)} {'->'} {String(log.details.changedFields[0].newValue)}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        <div>{log.metadata.ipAddress}</div>
                        <div className="text-[11px]">{log.metadata.location.city}, {log.metadata.location.country}</div>
                      </td>
                      {activeTab === 'security' ? <td className="px-3 py-2">{badge(log.security.severity.toUpperCase(), getSeverityColor(log.security.severity))}</td> : null}
                      {activeTab === 'security' ? <td className="px-3 py-2">{badge(risk.label, risk.color)}</td> : null}
                      <td className="px-3 py-2">{badge(log.status.toUpperCase(), log.statusColor)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setExpandedLog((prev) => prev === log.logId ? null : log.logId)} className="rounded border border-slate-300 px-2 py-1 text-xs" title="View Details">View</button>
                          {log.eventType === 'data_change' ? <button onClick={() => revertChange(log)} className="rounded border px-2 py-1 text-xs" style={{ borderColor: AUDIT_COLORS.error, color: AUDIT_COLORS.error }}>Revert</button> : null}
                        </div>
                      </td>
                    </tr>
                    {expandedLog === log.logId ? (
                      <tr className="border-t border-slate-100 bg-slate-50">
                        <td colSpan={activeTab === 'security' ? 13 : 11} className="px-4 py-3">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-2 text-xs">
                              <div className="font-semibold text-slate-800">Event Details</div>
                              <div className="rounded border border-slate-200 bg-white p-2">{log.details.description}</div>
                              <div className="rounded border border-slate-200 bg-white p-2">
                                <div className="font-semibold">Request Payload</div>
                                <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap">{JSON.stringify(log.details.requestPayload || {}, null, 2)}</pre>
                              </div>
                              <div className="rounded border border-slate-200 bg-white p-2">
                                <div className="font-semibold">Response Data</div>
                                <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap">{JSON.stringify(log.details.responseData || {}, null, 2)}</pre>
                              </div>
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="font-semibold text-slate-800">Session & Device</div>
                              <div className="rounded border border-slate-200 bg-white p-2">
                                <div>Session: {log.actor.sessionId || '-'}</div>
                                <div>Device: {log.metadata.device.browser} on {log.metadata.device.os}</div>
                                <div>Duration: {log.metadata.durationMs}ms</div>
                                <div>IP: {log.metadata.ipAddress}</div>
                                <div>User Agent: {log.metadata.userAgent}</div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button onClick={() => navigator.clipboard.writeText(log.logId)} className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1"><Copy size={12} /> Copy Event ID</button>
                                <button onClick={() => auditTrailService.exportLogs([log], 'json')} className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1"><Download size={12} /> Download JSON</button>
                                <Link to="/ams/audit/alerts" className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1"><AlertTriangle size={12} /> Create Alert</Link>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'security' ? 13 : 11} className="px-4 py-10 text-center text-sm text-slate-500">No logs found for the selected filters.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {activeTab === 'security' ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Threat Patterns</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {[
              { name: 'Brute Force Attempts', confidence: 85, evidence: securityLogs.filter((l) => l.action === 'denied').length },
              { name: 'Privilege Escalation', confidence: 72, evidence: securityLogs.filter((l) => l.security.riskScore > 70).length },
              { name: 'Session Hijacking Signals', confidence: 64, evidence: securityLogs.filter((l) => l.metadata.location.city === 'Delhi').length },
              { name: 'Data Exfiltration Risk', confidence: 58, evidence: securityLogs.filter((l) => l.action === 'read').length },
            ].map((pattern) => (
              <div key={pattern.name} className="rounded-lg border border-slate-200 p-3">
                <div className="font-semibold" style={{ color: AUDIT_COLORS.error }}>{pattern.name}</div>
                <div className="mt-1 text-xs text-slate-600">Confidence: {pattern.confidence}% | Evidence: {pattern.evidence} events</div>
                <button className="mt-2 rounded px-2 py-1 text-xs font-semibold text-white" style={{ backgroundColor: AUDIT_COLORS.error }}>View Pattern</button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <Modal title="Export Audit Trail" isOpen={showExport} onClose={() => setShowExport(false)} size="lg">
        <div className="space-y-4 text-sm">
          <div className="grid gap-3 md:grid-cols-3">
            {(['csv', 'json', 'excel'] as const).map((fmt) => (
              <label key={fmt} className={`rounded border px-3 py-2 ${exportFormat === fmt ? 'border-slate-900 bg-slate-50' : 'border-slate-200'}`}>
                <input type="radio" checked={fmt === exportFormat} onChange={() => setExportFormat(fmt)} />
                <span className="ml-2 uppercase">{fmt}</span>
              </label>
            ))}
          </div>

          <label className="rounded border border-slate-200 p-2">
            <input type="checkbox" checked={exportApplyCurrent} onChange={(e) => setExportApplyCurrent(e.target.checked)} />
            <span className="ml-2">Use current filters</span>
          </label>

          <label className="text-sm">
            Maximum records
            <input type="number" value={exportMaxRecords} onChange={(e) => setExportMaxRecords(Number(e.target.value || 0))} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
          </label>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowExport(false)} className="rounded border border-slate-300 px-4 py-2">Cancel</button>
            <button onClick={runExport} className="rounded px-4 py-2 font-semibold text-white" style={{ backgroundColor: AUDIT_COLORS.success }}>GENERATE EXPORT</button>
          </div>
        </div>
      </Modal>

      <Modal title="Advanced Search" isOpen={showAdvancedSearch} onClose={() => setShowAdvancedSearch(false)} size="lg">
        <div className="space-y-4 text-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <label>
              Field
              <select value={advField} onChange={(e) => setAdvField(e.target.value as 'user' | 'action' | 'resource' | 'status')} className="mt-1 w-full rounded border border-slate-300 px-3 py-2">
                <option value="user">User Name</option>
                <option value="action">Action</option>
                <option value="resource">Resource</option>
                <option value="status">Status</option>
              </select>
            </label>
            <label>
              Operator
              <select value={advOperator} onChange={(e) => setAdvOperator(e.target.value as 'equals' | 'contains')} className="mt-1 w-full rounded border border-slate-300 px-3 py-2">
                <option value="contains">Contains</option>
                <option value="equals">Equals</option>
              </select>
            </label>
            <label>
              Value
              <input value={advValue} onChange={(e) => setAdvValue(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
            </label>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs">
            Query: ({advField} {advOperator} '{advValue || '*'}') AND timeRange='{timeRange}'
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => { setAdvValue(''); setShowAdvancedSearch(false); }} className="rounded border border-slate-300 px-4 py-2">Clear</button>
            <button onClick={() => setShowAdvancedSearch(false)} className="rounded px-4 py-2 font-semibold text-white" style={{ backgroundColor: AUDIT_COLORS.success }}>SEARCH</button>
          </div>
        </div>
      </Modal>

      <Modal title="Generate Compliance Report" isOpen={showReport} onClose={() => setShowReport(false)} size="lg">
        <ReportGenerator logs={filtered} onClose={() => setShowReport(false)} />
      </Modal>
    </div>
  );
}

function ReportGenerator({ logs, onClose }: { logs: UnifiedAuditLog[]; onClose: () => void }) {
  const { showToast } = useToast();
  const [type, setType] = useState<'access' | 'security' | 'data' | 'user' | 'ops'>('access');
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [recipient, setRecipient] = useState('rajesh@optimile.com');

  const generate = () => {
    const title = type === 'access' ? 'Access Control Report' : type === 'security' ? 'Security Audit Report' : type === 'data' ? 'Data Change Report' : type === 'user' ? 'User Activity Report' : 'System Operations Report';
    const payload = {
      title,
      generatedAt: new Date().toISOString(),
      generatedBy: 'Rajesh Kumar',
      period: 'Custom',
      summary: {
        totalEvents: logs.length,
        success: logs.filter((l) => l.status === 'success').length,
        failed: logs.filter((l) => l.status === 'failed').length,
      },
      records: logs.slice(0, 100),
    };

    if (format === 'excel') {
      auditTrailService.exportLogs(logs, 'excel');
    } else {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    showToast({ type: 'success', title: 'Report generated', message: `Generated ${title} (${format.toUpperCase()}). Sent to ${recipient}.` });
    onClose();
  };

  return (
    <div className="space-y-4 text-sm">
      <label>
        Report Type
        <select value={type} onChange={(e) => setType(e.target.value as 'access' | 'security' | 'data' | 'user' | 'ops')} className="mt-1 w-full rounded border border-slate-300 px-3 py-2">
          <option value="access">Access Control Report</option>
          <option value="security">Security Audit Report</option>
          <option value="data">Data Change Report</option>
          <option value="user">User Activity Report</option>
          <option value="ops">System Operations Report</option>
        </select>
      </label>
      <label>
        Format
        <select value={format} onChange={(e) => setFormat(e.target.value as 'pdf' | 'excel')} className="mt-1 w-full rounded border border-slate-300 px-3 py-2">
          <option value="pdf">PDF</option>
          <option value="excel">Excel</option>
        </select>
      </label>
      <label>
        Recipient
        <input value={recipient} onChange={(e) => setRecipient(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
      </label>

      <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs">
        <div className="font-semibold">Preview</div>
        <div>Total Records: {logs.length}</div>
        <div>Compliance Status: {badge('COMPLIANT', AUDIT_COLORS.success)}</div>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded border border-slate-300 px-4 py-2">Cancel</button>
        <button onClick={generate} className="rounded px-4 py-2 font-semibold text-white" style={{ backgroundColor: AUDIT_COLORS.success }}>Generate Report</button>
      </div>
    </div>
  );
}
