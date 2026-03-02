import React, { useMemo, useState } from 'react';
import { BellRing, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { AUDIT_COLORS, auditTrailService, type AuditAction, type AuditAlertRule, type AuditEventType } from '../services/auditTrail';
import { useToast } from './common';

function useSnapshot() {
  const [tick, setTick] = useState(0);
  React.useEffect(() => auditTrailService.subscribe(() => setTick((t) => t + 1)), []);
  return React.useMemo(() => auditTrailService.getSnapshot(), [tick]);
}

export function AuditAlertsPage() {
  const { alertRules, alertHistory } = useSnapshot();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: 'Multiple Failed Logins',
    eventType: 'security' as AuditEventType,
    action: 'denied' as AuditAction,
    threshold: 5,
    withinMinutes: 15,
    scope: 'same_ip' as 'same_ip' | 'same_user' | 'any',
    severity: 'critical' as 'critical' | 'high' | 'medium' | 'low',
    notifyEmail: true,
    notifySms: true,
    notifyInApp: true,
    notifySlack: true,
    autoBlockIp: true,
    autoLockUser: false,
    active: true,
  });

  const severityColor = (severity: string) => {
    if (severity === 'critical') return AUDIT_COLORS.error;
    if (severity === 'high') return AUDIT_COLORS.deleted;
    if (severity === 'medium') return AUDIT_COLORS.warning;
    return AUDIT_COLORS.success;
  };

  const createRule = () => {
    auditTrailService.createAlertRule(form);
    showToast({ type: 'success', title: 'Alert rule created', message: `${form.name} is now active.` });
  };

  const activeRules = useMemo(() => alertRules.filter((r) => r.active), [alertRules]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Alerts</h1>
        <p className="text-sm text-slate-600">Configure real-time alert rules for security and audit events.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900"><Plus size={18} /> Create Alert Rule</div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">Rule Name<input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm">Event Type
            <select value={form.eventType} onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value as AuditEventType }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-2">
              <option value="security">Security Event</option>
              <option value="failed_action">Failed Action</option>
              <option value="data_change">Data Change</option>
              <option value="system_event">System Event</option>
              <option value="integration">Integration</option>
              <option value="user_action">User Action</option>
            </select>
          </label>
          <label className="text-sm">Specific Action
            <select value={form.action} onChange={(e) => setForm((f) => ({ ...f, action: e.target.value as AuditAction }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-2">
              <option value="denied">DENIED</option>
              <option value="login">LOGIN</option>
              <option value="create">CREATE</option>
              <option value="update">UPDATE</option>
              <option value="delete">DELETE</option>
              <option value="read">READ</option>
            </select>
          </label>
          <label className="text-sm">Threshold<input type="number" value={form.threshold} onChange={(e) => setForm((f) => ({ ...f, threshold: Number(e.target.value || 0) }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm">Within Minutes<input type="number" value={form.withinMinutes} onChange={(e) => setForm((f) => ({ ...f, withinMinutes: Number(e.target.value || 0) }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm">Scope
            <select value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as 'same_ip' | 'same_user' | 'any' }))} className="mt-1 w-full rounded border border-slate-300 px-3 py-2">
              <option value="same_ip">Same IP</option>
              <option value="same_user">Same User</option>
              <option value="any">Any</option>
            </select>
          </label>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="rounded border border-slate-200 p-2 text-sm"><input type="checkbox" checked={form.notifyEmail} onChange={(e) => setForm((f) => ({ ...f, notifyEmail: e.target.checked }))} /> <span className="ml-2">Email</span></label>
          <label className="rounded border border-slate-200 p-2 text-sm"><input type="checkbox" checked={form.notifySms} onChange={(e) => setForm((f) => ({ ...f, notifySms: e.target.checked }))} /> <span className="ml-2">SMS</span></label>
          <label className="rounded border border-slate-200 p-2 text-sm"><input type="checkbox" checked={form.notifyInApp} onChange={(e) => setForm((f) => ({ ...f, notifyInApp: e.target.checked }))} /> <span className="ml-2">In-App</span></label>
          <label className="rounded border border-slate-200 p-2 text-sm"><input type="checkbox" checked={form.notifySlack} onChange={(e) => setForm((f) => ({ ...f, notifySlack: e.target.checked }))} /> <span className="ml-2">Slack/Teams</span></label>
          <label className="rounded border border-slate-200 p-2 text-sm"><input type="checkbox" checked={form.autoBlockIp} onChange={(e) => setForm((f) => ({ ...f, autoBlockIp: e.target.checked }))} /> <span className="ml-2">Auto-block IP</span></label>
          <label className="rounded border border-slate-200 p-2 text-sm"><input type="checkbox" checked={form.autoLockUser} onChange={(e) => setForm((f) => ({ ...f, autoLockUser: e.target.checked }))} /> <span className="ml-2">Auto-lock User</span></label>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm">Severity:</span>
          {(['critical', 'high', 'medium', 'low'] as const).map((sev) => (
            <button key={sev} onClick={() => setForm((f) => ({ ...f, severity: sev }))} className={`rounded-full px-3 py-1 text-xs font-semibold ${form.severity === sev ? 'text-white' : 'text-slate-700 border border-slate-300'}`} style={{ backgroundColor: form.severity === sev ? severityColor(sev) : '#fff' }}>
              {sev.toUpperCase()}
            </button>
          ))}
        </div>

        <button onClick={createRule} className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: AUDIT_COLORS.success }}>Save Alert Rule</button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 text-lg font-semibold text-slate-900">Active Alerts</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Rule Name</th>
                <th className="px-3 py-2 text-left">Condition</th>
                <th className="px-3 py-2 text-left">Severity</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Last Triggered</th>
                <th className="px-3 py-2 text-left">Today</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {alertRules.map((rule) => (
                <tr key={rule.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-semibold text-slate-800">{rule.name}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{rule.eventType} / {rule.action || 'any'} {'>='} {rule.threshold} in {rule.withinMinutes}m</td>
                  <td className="px-3 py-2"><span className="rounded-full px-2 py-1 text-xs font-semibold text-white" style={{ backgroundColor: severityColor(rule.severity) }}>{rule.severity.toUpperCase()}</span></td>
                  <td className="px-3 py-2">{rule.active ? <span className="rounded-full bg-[#76FF03] px-2 py-1 text-xs font-semibold text-slate-900">ACTIVE</span> : <span className="rounded-full bg-[#757575] px-2 py-1 text-xs font-semibold text-white">INACTIVE</span>}</td>
                  <td className="px-3 py-2 text-xs">{rule.lastTriggeredAt ? new Date(rule.lastTriggeredAt).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2">{rule.triggerCountToday}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => auditTrailService.updateAlertRule(rule.id, { active: !rule.active })} className="rounded border border-slate-300 px-2 py-1 text-xs">{rule.active ? 'Disable' : 'Enable'}</button>
                      <button onClick={() => auditTrailService.deleteAlertRule(rule.id)} className="rounded border border-red-300 px-2 py-1 text-xs text-red-600"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {alertRules.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-500">No alert rules configured.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900"><BellRing size={18} /> Alert History</div>
        <div className="space-y-2">
          {alertHistory.slice(0, 20).map((h) => (
            <div key={h.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-slate-800">{alertRules.find((r) => r.id === h.ruleId)?.name || h.ruleId}</div>
                <span className="rounded-full px-2 py-1 text-xs font-semibold text-white" style={{ backgroundColor: severityColor(h.severity) }}>{h.severity.toUpperCase()}</span>
              </div>
              <div className="mt-1 text-xs text-slate-600">{h.triggerReason}</div>
              <div className="mt-1 text-xs text-slate-500">{new Date(h.timestamp).toLocaleString()} | Action: {h.actionTaken}</div>
              <div className="mt-2 flex items-center gap-2">
                {h.status === 'resolved' ? <span className="rounded bg-[#00C853] px-2 py-1 text-xs font-semibold text-white">RESOLVED</span> : <span className="rounded bg-[#FFB300] px-2 py-1 text-xs font-semibold text-white">ACTIVE</span>}
                {h.status !== 'resolved' ? <button onClick={() => auditTrailService.resolveAlertHistory(h.id, 'Rajesh Kumar')} className="rounded border border-slate-300 px-2 py-1 text-xs">Mark Resolved</button> : null}
              </div>
            </div>
          ))}
          {alertHistory.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              <ShieldAlert className="mx-auto mb-2 h-5 w-5" /> No alerts triggered yet.
            </div>
          ) : null}
        </div>
      </section>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <div className="font-semibold text-slate-800">Quick Links</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <a href="#/admin/audit-log" className="rounded border border-slate-300 px-2 py-1 text-xs">Back to Audit Dashboard</a>
          <a href="#/admin/settings/audit-retention" className="rounded border border-slate-300 px-2 py-1 text-xs">Retention Settings</a>
          <a href="#/admin/settings/system" className="rounded border border-slate-300 px-2 py-1 text-xs">System Configuration</a>
        </div>
      </div>
    </div>
  );
}
