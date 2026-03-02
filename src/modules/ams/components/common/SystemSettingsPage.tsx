import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCheck,
  FileUp,
  Mail,
  RotateCcw,
  Save,
  Settings,
  Shield,
  Wrench,
} from 'lucide-react';
import { Modal, useToast } from './common';
import { rbacService } from '../../services/rbac';
import { SETTINGS_COLORS, systemSettingsService, type SystemSettings } from '../../services/systemSettings';

type TabKey =
  | 'general'
  | 'auctionDefaults'
  | 'notifications'
  | 'emailTemplates'
  | 'paymentGateway'
  | 'integrations'
  | 'securityPrivacy'
  | 'localization'
  | 'advanced';

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'general', label: 'General Settings', icon: '🏠' },
  { key: 'auctionDefaults', label: 'Auction Defaults', icon: '⚡' },
  { key: 'notifications', label: 'Notification Settings', icon: '🔔' },
  { key: 'emailTemplates', label: 'Email Templates', icon: '📧' },
  { key: 'paymentGateway', label: 'Payment Gateway', icon: '💳' },
  { key: 'integrations', label: 'Integration Hub', icon: '🔌' },
  { key: 'securityPrivacy', label: 'Security & Privacy', icon: '🔒' },
  { key: 'localization', label: 'Localization', icon: '🌍' },
  { key: 'advanced', label: 'Advanced', icon: '⚙️' },
];

function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  Object.entries(obj).forEach(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v as Record<string, unknown>, path));
    } else {
      out[path] = v;
    }
  });
  return out;
}

function changedPaths(base: SystemSettings, draft: SystemSettings) {
  const b = flatten(base as unknown as Record<string, unknown>);
  const d = flatten(draft as unknown as Record<string, unknown>);
  const keys = new Set([...Object.keys(b), ...Object.keys(d)]);
  return Array.from(keys)
    .filter((k) => JSON.stringify(b[k]) !== JSON.stringify(d[k]))
    .map((path) => ({ path, oldValue: b[path], newValue: d[path], section: path.split('.')[0] || 'general' }));
}

function useSystemSettings() {
  const [tick, setTick] = useState(0);
  useEffect(() => systemSettingsService.subscribe(() => setTick((t) => t + 1)), []);
  return useMemo(() => systemSettingsService.getSnapshot(), [tick]);
}

function useRbacPermission() {
  const currentUserId = 'USR-ADM-1';
  return useMemo(() => {
    const check = rbacService.checkPermission(currentUserId, 'system.configuration');
    return check.allowed;
  }, [currentUserId]);
}

function statusPill(text: string, color: string) {
  return (
    <span className="rounded-full px-2 py-1 text-xs font-semibold text-white" style={{ backgroundColor: color }}>
      {text}
    </span>
  );
}

export function SystemSettingsPage() {
  const { settings, lastModifiedAt, lastModifiedBy } = useSystemSettings();
  const canManage = useRbacPermission();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [draft, setDraft] = useState<SystemSettings>(settings);
  const [showReview, setShowReview] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'yaml' | 'pdf'>('json');
  const [exportSensitive, setExportSensitive] = useState(false);
  const [includeCategories, setIncludeCategories] = useState<Record<string, boolean>>({
    general: true,
    auctionDefaults: true,
    notifications: true,
    emailTemplates: true,
    paymentGateway: false,
    integrations: false,
    securityPrivacy: true,
    localization: true,
    advanced: true,
  });
  const [importText, setImportText] = useState('');
  const [importName, setImportName] = useState('');
  const [importMode, setImportMode] = useState<'overwrite' | 'merge' | 'preview'>('merge');
  const [importPreview, setImportPreview] = useState<Array<{ path: string; current: unknown; incoming: unknown; status: string }>>([]);
  const [scheduleAt, setScheduleAt] = useState('');

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const diffs = useMemo(() => changedPaths(settings, draft), [settings, draft]);
  const dirty = diffs.length > 0;

  const saveAll = (scheduled = false) => {
    const validation = systemSettingsService.validate(draft);
    if (!validation.valid) {
      showToast({ type: 'error', title: 'Invalid configuration', message: validation.errors[0] || 'Please review settings.' });
      return;
    }
    if (scheduled) {
      showToast({ type: 'info', title: 'Configuration scheduled', message: `Changes scheduled for ${scheduleAt || 'selected time'}.` });
      setShowReview(false);
      return;
    }
    systemSettingsService.saveAll(draft, 'Rajesh Kumar', 'Bulk save from System Configuration');
    showToast({
      type: 'success',
      title: 'Configuration saved successfully!',
      message: 'Immediate changes applied. Advanced changes may need cache refresh.',
    });
    setShowReview(false);
  };

  const resetDefaults = () => {
    systemSettingsService.resetToDefaults('Rajesh Kumar');
    showToast({ type: 'warning', title: 'Reset to defaults complete', message: 'System settings restored to default values.' });
  };

  const onImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      setImportText(text);
      setImportName(file.name);
      const parsed = systemSettingsService.parseImportFile(text, file.name);
      if (!parsed.valid || !parsed.parsed) {
        showToast({ type: 'error', title: 'Import file invalid', message: parsed.message });
        return;
      }
      const result = systemSettingsService.importSettings(parsed.parsed, 'Rajesh Kumar', 'preview');
      if ('preview' in result && result.preview) {
        setImportPreview(result.preview);
      }
      showToast({ type: 'success', title: 'Valid configuration file', message: `${file.name} loaded successfully.` });
    };
    reader.readAsText(file);
  };

  const applyImport = () => {
    const parsed = systemSettingsService.parseImportFile(importText, importName || 'import.json');
    if (!parsed.valid || !parsed.parsed) {
      showToast({ type: 'error', title: 'Import failed', message: parsed.message });
      return;
    }
    const result = systemSettingsService.importSettings(parsed.parsed, 'Rajesh Kumar', importMode);
    if ('applied' in result && result.applied) {
      showToast({ type: 'success', title: 'Settings imported', message: `Import mode: ${importMode}.` });
      setShowImport(false);
      return;
    }
    showToast({ type: 'info', title: 'Preview generated', message: 'No changes applied yet.' });
  };

  if (!canManage) {
    return (
      <div className="rounded-xl border border-red-300 bg-white p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2 text-slate-600">You need <code>system.configuration</code> permission to manage system settings.</p>
        <Link className="mt-4 inline-block rounded-lg bg-[#2979FF] px-4 py-2 text-sm font-semibold text-white" to="/403-forbidden?required=system.configuration&userId=USR-MGR-1">
          Request Access
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <header className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">System Configuration</h1>
            <p className="text-sm text-slate-600">
              Last modified: {new Date(lastModifiedAt).toLocaleString()} by {lastModifiedBy}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {statusPill('ALL SYSTEMS OPERATIONAL', SETTINGS_COLORS.success)}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            disabled={!dirty}
            onClick={() => setShowReview(true)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: SETTINGS_COLORS.success }}
          >
            <Save size={16} /> Save All Changes
          </button>
          <button onClick={resetDefaults} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold" style={{ borderColor: SETTINGS_COLORS.error, color: SETTINGS_COLORS.error }}>
            <RotateCcw size={16} /> Reset to Defaults
          </button>
          <button onClick={() => setShowExport(true)} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: SETTINGS_COLORS.info }}>
            <Download size={16} /> Export Settings
          </button>
          <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: SETTINGS_COLORS.warning }}>
            <FileUp size={16} /> Import Settings
          </button>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${activeTab === tab.key ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="space-y-5">
          {activeTab === 'general' && <GeneralTab draft={draft} setDraft={setDraft} />}
          {activeTab === 'auctionDefaults' && <AuctionDefaultsTab draft={draft} setDraft={setDraft} />}
          {activeTab === 'notifications' && <NotificationsTab draft={draft} setDraft={setDraft} />}
          {activeTab === 'emailTemplates' && <EmailTemplatesTab draft={draft} setDraft={setDraft} />}
          {activeTab === 'paymentGateway' && <PaymentGatewayTab draft={draft} setDraft={setDraft} />}
          {activeTab === 'integrations' && <IntegrationsTab draft={draft} setDraft={setDraft} />}
          {activeTab === 'securityPrivacy' && <SecurityPrivacyTab draft={draft} setDraft={setDraft} />}
          {activeTab === 'localization' && <LocalizationTab draft={draft} setDraft={setDraft} />}
          {activeTab === 'advanced' && <AdvancedTab draft={draft} setDraft={setDraft} />}
        </main>
      </div>

      {dirty ? (
        <div className="fixed bottom-0 left-64 right-0 z-40 border-t p-4 text-white" style={{ backgroundColor: SETTINGS_COLORS.warning }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Save size={16} />
              <span className="font-semibold">You have unsaved changes</span>
              <span className="rounded-full bg-white/25 px-2 py-1 text-xs">{diffs.length} changed</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowReview(true)} className="rounded-lg border border-white/80 px-3 py-2 text-sm">Review Changes</button>
              <button onClick={() => setDraft(settings)} className="rounded-lg border border-white/80 px-3 py-2 text-sm">Discard</button>
              <button onClick={() => saveAll(false)} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ backgroundColor: SETTINGS_COLORS.success }}>
                SAVE ALL CHANGES
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Modal title="Review Configuration Changes" isOpen={showReview} onClose={() => setShowReview(false)} size="xl">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Review all pending changes before applying.</p>
          <div className="space-y-3">
            {Array.from(new Set(diffs.map((d) => d.section))).map((section) => {
              const rows = diffs.filter((d) => d.section === section);
              return (
                <div key={section} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 font-semibold text-slate-900">{section} ({rows.length})</div>
                  <div className="space-y-2 text-sm">
                    {rows.map((row) => (
                      <div key={row.path} className="rounded-md bg-slate-50 p-2">
                        <div className="font-mono text-xs text-slate-600">{row.path}</div>
                        <div className="text-slate-700">{String(row.oldValue)} {'->'} {String(row.newValue)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="font-semibold text-slate-900">Impact Analysis</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {statusPill('Affects Active Auctions: NO', SETTINGS_COLORS.success)}
              {statusPill('Requires System Restart: NO', SETTINGS_COLORS.success)}
              {statusPill('Affects User Experience: YES', SETTINGS_COLORS.warning)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <label className="font-semibold text-slate-800">Schedule for later (optional)</label>
            <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowReview(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => saveAll(true)} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: SETTINGS_COLORS.info }}>Schedule for Later</button>
            <button onClick={() => saveAll(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: SETTINGS_COLORS.success }}>Apply Immediately</button>
          </div>
        </div>
      </Modal>

      <Modal title="Export Settings" isOpen={showExport} onClose={() => setShowExport(false)} size="lg">
        <div className="space-y-4 text-sm">
          <div className="grid gap-3 md:grid-cols-3">
            {(['json', 'yaml', 'pdf'] as const).map((fmt) => (
              <label key={fmt} className={`rounded-lg border p-3 ${exportFormat === fmt ? 'border-slate-900 bg-slate-50' : 'border-slate-200'}`}>
                <input type="radio" checked={exportFormat === fmt} onChange={() => setExportFormat(fmt)} /> <span className="ml-2 uppercase">{fmt}</span>
              </label>
            ))}
          </div>

          <div>
            <div className="mb-2 font-semibold">What to Export</div>
            <div className="grid gap-2 md:grid-cols-2">
              {Object.keys(includeCategories).map((category) => (
                <label key={category} className="rounded border border-slate-200 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={includeCategories[category]}
                    onChange={(e) => setIncludeCategories((prev) => ({ ...prev, [category]: e.target.checked }))}
                  />
                  <span className="ml-2">{category}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="rounded-lg border border-slate-200 p-3">
            <input type="checkbox" checked={exportSensitive} onChange={(e) => setExportSensitive(e.target.checked)} />
            <span className="ml-2">Include sensitive data</span>
            <div className="mt-1 text-xs" style={{ color: SETTINGS_COLORS.error }}>Warning: includes masked/secret-like values.</div>
          </label>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowExport(false)} className="rounded-lg border border-slate-300 px-4 py-2">Cancel</button>
            <button
              onClick={() => {
                systemSettingsService.exportSettings({ format: exportFormat, includeCategories, includeSensitive: exportSensitive });
                showToast({ type: 'success', title: 'Export generated', message: 'Settings file downloaded successfully.' });
                setShowExport(false);
              }}
              className="rounded-lg px-4 py-2 font-semibold text-white"
              style={{ backgroundColor: SETTINGS_COLORS.info }}
            >
              Generate Export File
            </button>
          </div>
        </div>
      </Modal>

      <Modal title="Import Settings" isOpen={showImport} onClose={() => setShowImport(false)} size="xl">
        <div className="space-y-4 text-sm">
          <div className="rounded-lg p-3 text-white" style={{ backgroundColor: SETTINGS_COLORS.error }}>
            Importing can overwrite current configuration. Create backup first.
          </div>

          <label className="block rounded-lg border border-slate-200 p-3">
            <div className="font-semibold">Choose File</div>
            <input
              type="file"
              accept=".json,.yaml,.yml"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportFile(file);
              }}
              className="mt-2"
            />
            {importName ? <div className="mt-2 text-xs text-slate-600">Loaded: {importName}</div> : null}
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            {(['overwrite', 'merge', 'preview'] as const).map((mode) => (
              <label key={mode} className={`rounded-lg border p-3 ${importMode === mode ? 'border-slate-900 bg-slate-50' : 'border-slate-200'}`}>
                <input type="radio" checked={importMode === mode} onChange={() => setImportMode(mode)} />
                <span className="ml-2 capitalize">{mode}</span>
              </label>
            ))}
          </div>

          {importPreview.length > 0 ? (
            <div className="max-h-56 overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-2 py-1 text-left">Path</th>
                    <th className="px-2 py-1 text-left">Current</th>
                    <th className="px-2 py-1 text-left">New</th>
                    <th className="px-2 py-1 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.slice(0, 120).map((row) => (
                    <tr key={row.path} className="border-t border-slate-100">
                      <td className="px-2 py-1 font-mono">{row.path}</td>
                      <td className="px-2 py-1">{String(row.current)}</td>
                      <td className="px-2 py-1">{String(row.incoming)}</td>
                      <td className="px-2 py-1">
                        <span className="rounded px-2 py-0.5 text-white" style={{ backgroundColor: row.status === 'same' ? SETTINGS_COLORS.success : row.status === 'modified' ? SETTINGS_COLORS.warning : SETTINGS_COLORS.error }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowImport(false)} className="rounded-lg border border-slate-300 px-4 py-2">Cancel</button>
            <button onClick={applyImport} className="rounded-lg px-4 py-2 font-semibold text-white" style={{ backgroundColor: SETTINGS_COLORS.error }}>
              IMPORT SETTINGS
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SectionCard({ title, borderColor, children }: { title: string; borderColor: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border-2 bg-white p-4" style={{ borderColor }}>
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>
      {children}
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm ${props.className || ''}`} />;
}

function Toggle({ checked, onChange, activeLabel = 'ENABLED', inactiveLabel = 'DISABLED' }: { checked: boolean; onChange: (v: boolean) => void; activeLabel?: string; inactiveLabel?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-slate-900"
      style={{ backgroundColor: checked ? SETTINGS_COLORS.active : SETTINGS_COLORS.inactive, color: checked ? '#0f172a' : '#fff' }}
    >
      <span className="h-2 w-2 rounded-full bg-white" /> {checked ? activeLabel : inactiveLabel}
    </button>
  );
}

function GeneralTab({ draft, setDraft }: { draft: SystemSettings; setDraft: React.Dispatch<React.SetStateAction<SystemSettings>> }) {
  const g = draft.general;
  return (
    <div className="space-y-4">
      <SectionCard title="Platform Information" borderColor={SETTINGS_COLORS.info}>
        <div className="grid gap-3 md:grid-cols-2">
          <Row label="Platform Name"><TextInput value={g.platformName} onChange={(e) => setDraft((s) => ({ ...s, general: { ...s.general, platformName: e.target.value } }))} /></Row>
          <Row label="Company/Organization"><TextInput value={g.organization} onChange={(e) => setDraft((s) => ({ ...s, general: { ...s.general, organization: e.target.value } }))} /></Row>
          <Row label="Support Email">
            <TextInput type="email" value={g.supportEmail} onChange={(e) => setDraft((s) => ({ ...s, general: { ...s.general, supportEmail: e.target.value } }))} />
            <div className="mt-1">{statusPill(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(g.supportEmail) ? 'VERIFIED' : 'INVALID', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(g.supportEmail) ? SETTINGS_COLORS.success : SETTINGS_COLORS.error)}</div>
          </Row>
          <Row label="Support Phone"><TextInput value={g.supportPhone} onChange={(e) => setDraft((s) => ({ ...s, general: { ...s.general, supportPhone: e.target.value } }))} /></Row>
          <Row label="Platform URL"><TextInput value={g.platformUrl} readOnly className="bg-slate-50" /></Row>
          <Row label="Timezone">
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={g.timezone} onChange={(e) => setDraft((s) => ({ ...s, general: { ...s.general, timezone: e.target.value } }))}>
              <option>Asia/Kolkata</option>
              <option>UTC</option>
              <option>Asia/Dubai</option>
              <option>Europe/London</option>
              <option>America/New_York</option>
            </select>
          </Row>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <div className="mb-2 font-semibold">Logo Upload</div>
            <input type="file" accept=".png,.jpg,.jpeg,.svg" />
            <div className="mt-2">{statusPill('UPLOADED', SETTINGS_COLORS.success)}</div>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <div className="mb-2 font-semibold">Favicon Upload</div>
            <input type="file" accept=".ico,.png" />
            <div className="mt-2">{statusPill('ACTIVE', SETTINGS_COLORS.info)}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Business Settings" borderColor={SETTINGS_COLORS.success}>
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="Currency">
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={g.currency} onChange={(e) => setDraft((s) => ({ ...s, general: { ...s.general, currency: e.target.value as SystemSettings['general']['currency'] } }))}>
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </Row>
          <Row label="Date Format">
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={g.dateFormat} onChange={(e) => setDraft((s) => ({ ...s, general: { ...s.general, dateFormat: e.target.value as SystemSettings['general']['dateFormat'] } }))}>
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </Row>
          <Row label="Time Format">
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={g.timeFormat} onChange={(e) => setDraft((s) => ({ ...s, general: { ...s.general, timeFormat: e.target.value as SystemSettings['general']['timeFormat'] } }))}>
              <option value="12h">12-hour</option>
              <option value="24h">24-hour</option>
            </select>
          </Row>
          <Row label="Decimal Places"><TextInput type="number" min={0} max={4} value={g.decimalPlaces} onChange={(e) => setDraft((s) => ({ ...s, general: { ...s.general, decimalPlaces: Number(e.target.value || 0) } }))} /></Row>
          <Row label="Financial Year Start">
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={g.financialYearStart} onChange={(e) => setDraft((s) => ({ ...s, general: { ...s.general, financialYearStart: e.target.value as SystemSettings['general']['financialYearStart'] } }))}>
              <option>January</option><option>April</option><option>July</option><option>October</option>
            </select>
          </Row>
        </div>
      </SectionCard>

      <SectionCard title="Operational Hours" borderColor={SETTINGS_COLORS.warning}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Platform Availability</span>
          <Toggle checked={g.availability24x7} onChange={(v) => setDraft((s) => ({ ...s, general: { ...s.general, availability24x7: v } }))} activeLabel="24/7 AVAILABLE" inactiveLabel="SCHEDULED" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="Support Start"><TextInput type="time" value={g.businessHours.start} onChange={(e) => setDraft((s) => ({ ...s, general: { ...s.general, businessHours: { ...s.general.businessHours, start: e.target.value } } }))} /></Row>
          <Row label="Support End"><TextInput type="time" value={g.businessHours.end} onChange={(e) => setDraft((s) => ({ ...s, general: { ...s.general, businessHours: { ...s.general.businessHours, end: e.target.value } } }))} /></Row>
          <Row label="Maintenance Enabled"><Toggle checked={g.maintenance.enabled} onChange={(v) => setDraft((s) => ({ ...s, general: { ...s.general, maintenance: { ...s.general.maintenance, enabled: v } } }))} /></Row>
        </div>
        {g.maintenance.enabled ? (
          <div className="rounded-lg border p-3 text-sm" style={{ borderColor: SETTINGS_COLORS.warning, backgroundColor: '#fff8e1' }}>
            Maintenance scheduled for {g.maintenance.startAt || 'select time'} ({g.maintenance.durationHours}h).
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}

function AuctionDefaultsTab({ draft, setDraft }: { draft: SystemSettings; setDraft: React.Dispatch<React.SetStateAction<SystemSettings>> }) {
  const a = draft.auctionDefaults;
  return (
    <div className="space-y-4">
      <SectionCard title="Default Auction Parameters" borderColor={SETTINGS_COLORS.info}>
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="Default Auction Type">
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={a.defaultAuctionType} onChange={(e) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, defaultAuctionType: e.target.value as SystemSettings['auctionDefaults']['defaultAuctionType'] } }))}>
              <option>REVERSE</option><option>SPOT</option><option>LOT</option><option>BULK</option><option>REGION_LOT</option>
            </select>
            <div className="mt-1 text-xs" style={{ color: SETTINGS_COLORS.info }}>Most used: REVERSE (78%)</div>
          </Row>
          <Row label="Default Decrement (INR)"><TextInput type="number" min={50} max={10000} value={a.decrementINR} onChange={(e) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, decrementINR: Number(e.target.value || 0) } }))} /></Row>
          <Row label="Default Lane Duration (seconds)"><TextInput type="number" min={60} max={3600} value={a.laneDurationSec} onChange={(e) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, laneDurationSec: Number(e.target.value || 0) } }))} /></Row>
          <Row label="Extension Threshold (sec)"><TextInput type="number" min={5} max={60} value={a.extensionThresholdSec} onChange={(e) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, extensionThresholdSec: Number(e.target.value || 0) } }))} /></Row>
          <Row label="Extension Duration (sec)"><TextInput type="number" min={30} max={300} value={a.extensionDurationSec} onChange={(e) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, extensionDurationSec: Number(e.target.value || 0) } }))} /></Row>
          <Row label="Maximum Extensions"><TextInput type="number" min={0} max={50} value={a.maxExtensions} onChange={(e) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, maxExtensions: Number(e.target.value || 0) } }))} /></Row>
        </div>
      </SectionCard>

      <SectionCard title="Vendor Participation" borderColor="#00BFA5">
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="Minimum Vendors"><TextInput type="number" value={a.minVendors} onChange={(e) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, minVendors: Number(e.target.value || 0) } }))} /></Row>
          <Row label="Auto Invite Eligible Vendors"><Toggle checked={a.autoInviteEligibleVendors} onChange={(v) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, autoInviteEligibleVendors: v } }))} /></Row>
          <Row label="Anonymous Bidding"><Toggle checked={a.anonymousBidding} onChange={(v) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, anonymousBidding: v } }))} /></Row>
          <Row label="Real-time Rank Display"><Toggle checked={a.rankDisplay} onChange={(v) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, rankDisplay: v } }))} /></Row>
          <Row label="Vendor Registration">
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={a.vendorRegistration} onChange={(e) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, vendorRegistration: e.target.value as SystemSettings['auctionDefaults']['vendorRegistration'] } }))}>
              <option value="open">Open</option>
              <option value="approval_required">Approval Required</option>
              <option value="invite_only">Invite Only</option>
            </select>
          </Row>
        </div>
      </SectionCard>

      <SectionCard title="Award & Contract Settings" borderColor={SETTINGS_COLORS.critical}>
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="Winner Acceptance Timeout (hours)"><TextInput type="number" min={6} max={72} value={a.winnerTimeoutHours} onChange={(e) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, winnerTimeoutHours: Number(e.target.value || 0) } }))} /></Row>
          <Row label="Auto-award to Runner-up"><Toggle checked={a.autoAwardRunnerUp} onChange={(v) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, autoAwardRunnerUp: v } }))} /></Row>
          <Row label="Acceptance Threshold (%)"><TextInput type="number" min={0} max={20} value={a.acceptanceThresholdPct} onChange={(e) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, acceptanceThresholdPct: Number(e.target.value || 0) } }))} /></Row>
          <Row label="Contract Auto-generation"><Toggle checked={a.contractAutoGeneration} onChange={(v) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, contractAutoGeneration: v } }))} /></Row>
          <Row label="E-signature Required"><Toggle checked={a.eSignatureRequired} onChange={(v) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, eSignatureRequired: v } }))} /></Row>
        </div>
      </SectionCard>

      <SectionCard title="Performance & Optimization" borderColor={SETTINGS_COLORS.success}>
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="Bid Rate Limiting"><Toggle checked={a.bidRateLimitEnabled} onChange={(v) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, bidRateLimitEnabled: v } }))} /></Row>
          <Row label="Max Bids per Minute"><TextInput type="number" value={a.maxBidsPerMinute} onChange={(e) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, maxBidsPerMinute: Number(e.target.value || 0) } }))} /></Row>
          <Row label="Cache Duration (minutes)"><TextInput type="number" value={a.analyticsCacheMinutes} onChange={(e) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, analyticsCacheMinutes: Number(e.target.value || 0) } }))} /></Row>
          <Row label="Auto-archive Old Auctions"><Toggle checked={a.autoArchiveEnabled} onChange={(v) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, autoArchiveEnabled: v } }))} /></Row>
          <Row label="Archive After (days)"><TextInput type="number" value={a.autoArchiveDays} onChange={(e) => setDraft((s) => ({ ...s, auctionDefaults: { ...s.auctionDefaults, autoArchiveDays: Number(e.target.value || 0) } }))} /></Row>
        </div>
      </SectionCard>
    </div>
  );
}

function NotificationsTab({ draft, setDraft }: { draft: SystemSettings; setDraft: React.Dispatch<React.SetStateAction<SystemSettings>> }) {
  const n = draft.notifications;
  const toggleEvent = (group: 'email' | 'sms', key: string, value: boolean) => {
    setDraft((s) => ({
      ...s,
      notifications: {
        ...s.notifications,
        [group]: {
          ...s.notifications[group],
          events: { ...s.notifications[group].events, [key]: value },
        },
      },
    }));
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Email Notifications" borderColor={SETTINGS_COLORS.info}>
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="Email Service">
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={n.email.service} onChange={(e) => setDraft((s) => ({ ...s, notifications: { ...s.notifications, email: { ...s.notifications.email, service: e.target.value as SystemSettings['notifications']['email']['service'] } } }))}>
              <option>SMTP</option><option>SendGrid</option><option>AWS SES</option><option>Mailgun</option>
            </select>
            <div className="mt-1">{statusPill('CONNECTED', SETTINGS_COLORS.success)}</div>
          </Row>
          <Row label="From Name"><TextInput value={n.email.fromName} onChange={(e) => setDraft((s) => ({ ...s, notifications: { ...s.notifications, email: { ...s.notifications.email, fromName: e.target.value } } }))} /></Row>
          <Row label="From Email"><TextInput type="email" value={n.email.fromEmail} onChange={(e) => setDraft((s) => ({ ...s, notifications: { ...s.notifications, email: { ...s.notifications.email, fromEmail: e.target.value } } }))} /></Row>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {Object.entries(n.email.events).map(([key, value]) => (
            <label key={key} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <input type="checkbox" checked={value} onChange={(e) => toggleEvent('email', key, e.target.checked)} />
              <span className="ml-2">{key}</span>
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="SMS Notifications" borderColor="#00BFA5">
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="SMS Service">
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={n.sms.service} onChange={(e) => setDraft((s) => ({ ...s, notifications: { ...s.notifications, sms: { ...s.notifications.sms, service: e.target.value as SystemSettings['notifications']['sms']['service'] } } }))}>
              <option>Twilio</option><option>AWS SNS</option><option>MSG91</option><option>Fast2SMS</option>
            </select>
          </Row>
          <Row label="SMS Credits Remaining"><TextInput type="number" value={n.sms.creditsRemaining} onChange={(e) => setDraft((s) => ({ ...s, notifications: { ...s.notifications, sms: { ...s.notifications.sms, creditsRemaining: Number(e.target.value || 0) } } }))} /></Row>
          <Row label="Alert Threshold"><TextInput type="number" value={n.sms.lowCreditsAlert} onChange={(e) => setDraft((s) => ({ ...s, notifications: { ...s.notifications, sms: { ...s.notifications.sms, lowCreditsAlert: Number(e.target.value || 0) } } }))} /></Row>
        </div>
      </SectionCard>

      <SectionCard title="In-App Notifications" borderColor={SETTINGS_COLORS.active}>
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="Push Notifications"><Toggle checked={n.inApp.pushEnabled} onChange={(v) => setDraft((s) => ({ ...s, notifications: { ...s.notifications, inApp: { ...s.notifications.inApp, pushEnabled: v } } }))} /></Row>
          <Row label="Notification Sound"><Toggle checked={n.inApp.soundEnabled} onChange={(v) => setDraft((s) => ({ ...s, notifications: { ...s.notifications, inApp: { ...s.notifications.inApp, soundEnabled: v } } }))} /></Row>
          <Row label="Show Badge Count"><Toggle checked={n.inApp.badgeCountEnabled} onChange={(v) => setDraft((s) => ({ ...s, notifications: { ...s.notifications, inApp: { ...s.notifications.inApp, badgeCountEnabled: v } } }))} /></Row>
        </div>
      </SectionCard>
    </div>
  );
}

function EmailTemplatesTab({ draft, setDraft }: { draft: SystemSettings; setDraft: React.Dispatch<React.SetStateAction<SystemSettings>> }) {
  const templates = draft.emailTemplates.templates;
  const [selected, setSelected] = useState(templates[0]?.id || '');
  const template = templates.find((t) => t.id === selected) || templates[0];

  const updateTemplate = (patch: Partial<typeof template>) => {
    if (!template) return;
    setDraft((s) => ({
      ...s,
      emailTemplates: {
        ...s.emailTemplates,
        templates: s.emailTemplates.templates.map((tpl) =>
          tpl.id === template.id ? { ...tpl, ...patch, lastModifiedAt: Date.now() } : tpl,
        ),
      },
    }));
  };

  if (!template) {
    return <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">No templates configured.</div>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Template List</h2>
        {templates.map((tpl) => (
          <button key={tpl.id} onClick={() => setSelected(tpl.id)} className={`w-full rounded-lg border p-3 text-left ${tpl.id === template.id ? 'border-slate-900' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-900">{tpl.name}</div>
              {statusPill(tpl.active ? 'ACTIVE' : 'INACTIVE', tpl.active ? SETTINGS_COLORS.success : SETTINGS_COLORS.inactive)}
            </div>
            <div className="mt-1 text-xs text-slate-500">Open Rate: {tpl.openRate}% | Sent: {tpl.sentCount30d}</div>
          </button>
        ))}
      </div>

      <SectionCard title="Template Editor" borderColor={SETTINGS_COLORS.info}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <Row label="Subject Line" hint={`Character count: ${template.subject.length}/100`}>
              <TextInput value={template.subject} maxLength={100} onChange={(e) => updateTemplate({ subject: e.target.value })} />
            </Row>
            <Row label="Email Body">
              <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={14} value={template.body} onChange={(e) => updateTemplate({ body: e.target.value })} />
            </Row>
            <div className="rounded-lg border border-slate-200 p-3 text-xs">
              Variables: {'{VENDOR_NAME}'}, {'{AUCTION_NAME}'}, {'{AUCTION_ID}'}, {'{START_TIME}'}, {'{LANE_COUNT}'}, {'{ACTION_URL}'}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-sm font-semibold">Live Preview</div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="font-semibold">{template.subject.replace('{AUCTION_NAME}', 'Q4 Logistics Allocation')}</div>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-700">
                {template.body
                  .replace('{VENDOR_NAME}', 'Swift Logistics')
                  .replace('{AUCTION_NAME}', 'Q4 Logistics Allocation')
                  .replace('{LANE_NAME}', 'Mumbai -> Delhi')}
              </pre>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="rounded-lg border border-slate-300 px-3 py-2 text-xs">Save Draft</button>
              <button className="rounded-lg px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: SETTINGS_COLORS.success }}>Save & Activate</button>
              <button className="rounded-lg px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: SETTINGS_COLORS.info }}>Send Test</button>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function PaymentGatewayTab({ draft, setDraft }: { draft: SystemSettings; setDraft: React.Dispatch<React.SetStateAction<SystemSettings>> }) {
  const p = draft.paymentGateway;
  return (
    <div className="space-y-4">
      <SectionCard title="Gateway Selection" borderColor={SETTINGS_COLORS.success}>
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="Primary Payment Gateway">
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={p.primary} onChange={(e) => setDraft((s) => ({ ...s, paymentGateway: { ...s.paymentGateway, primary: e.target.value as SystemSettings['paymentGateway']['primary'] } }))}>
              <option>Razorpay</option><option>Paytm</option><option>CCAvenue</option><option>PayU</option><option>Stripe</option><option>PayPal</option>
            </select>
            <div className="mt-1">{statusPill(p.connectionStatus === 'connected' ? 'CONNECTED' : 'NOT CONFIGURED', p.connectionStatus === 'connected' ? SETTINGS_COLORS.success : SETTINGS_COLORS.error)}</div>
          </Row>
          <Row label="Test Mode"><Toggle checked={p.testMode} onChange={(v) => setDraft((s) => ({ ...s, paymentGateway: { ...s.paymentGateway, testMode: v } }))} activeLabel="TEST MODE" inactiveLabel="LIVE MODE" /></Row>
          <Row label="EMD Enabled"><Toggle checked={p.emdEnabled} onChange={(v) => setDraft((s) => ({ ...s, paymentGateway: { ...s.paymentGateway, emdEnabled: v } }))} /></Row>
          <Row label="EMD Amount Type">
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={p.emdType} onChange={(e) => setDraft((s) => ({ ...s, paymentGateway: { ...s.paymentGateway, emdType: e.target.value as SystemSettings['paymentGateway']['emdType'] } }))}>
              <option value="fixed">Fixed Amount</option>
              <option value="percentage">Percentage of Bid</option>
              <option value="per_lane">Per Lane</option>
            </select>
          </Row>
          <Row label="EMD Value"><TextInput type="number" value={p.emdValue} onChange={(e) => setDraft((s) => ({ ...s, paymentGateway: { ...s.paymentGateway, emdValue: Number(e.target.value || 0) } }))} /></Row>
          <Row label="Refund Timeline (days)"><TextInput type="number" value={p.refundTimelineDays} onChange={(e) => setDraft((s) => ({ ...s, paymentGateway: { ...s.paymentGateway, refundTimelineDays: Number(e.target.value || 0) } }))} /></Row>
        </div>
      </SectionCard>

      <SectionCard title="Payment Methods & Security" borderColor={SETTINGS_COLORS.info}>
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(p.paymentMethods).map(([k, v]) => (
            <label key={k} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <input type="checkbox" checked={v} onChange={(e) => setDraft((s) => ({ ...s, paymentGateway: { ...s.paymentGateway, paymentMethods: { ...s.paymentGateway.paymentMethods, [k]: e.target.checked } } }))} />
              <span className="ml-2">{k}</span>
            </label>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="3D Secure (OTP)"><Toggle checked={p.threeDSecureMandatory} onChange={(v) => setDraft((s) => ({ ...s, paymentGateway: { ...s.paymentGateway, threeDSecureMandatory: v } }))} activeLabel="MANDATORY" inactiveLabel="OPTIONAL" /></Row>
          <Row label="Auto-capture"><Toggle checked={p.autoCapture} onChange={(v) => setDraft((s) => ({ ...s, paymentGateway: { ...s.paymentGateway, autoCapture: v } }))} /></Row>
          <Row label="Payment Logs Retention (months)"><TextInput type="number" value={p.paymentLogsRetentionMonths} onChange={(e) => setDraft((s) => ({ ...s, paymentGateway: { ...s.paymentGateway, paymentLogsRetentionMonths: Number(e.target.value || 0) } }))} /></Row>
        </div>
      </SectionCard>

      <SectionCard title="Reconciliation" borderColor={SETTINGS_COLORS.warning}>
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="Auto-reconciliation"><Toggle checked={p.autoReconciliation} onChange={(v) => setDraft((s) => ({ ...s, paymentGateway: { ...s.paymentGateway, autoReconciliation: v } }))} /></Row>
          <Row label="Daily Time"><TextInput type="time" value={p.reconciliationTime} onChange={(e) => setDraft((s) => ({ ...s, paymentGateway: { ...s.paymentGateway, reconciliationTime: e.target.value } }))} /></Row>
          <Row label="Discrepancy Alerts"><Toggle checked={p.discrepancyAlert} onChange={(v) => setDraft((s) => ({ ...s, paymentGateway: { ...s.paymentGateway, discrepancyAlert: v } }))} /></Row>
        </div>
      </SectionCard>
    </div>
  );
}

function IntegrationsTab({ draft, setDraft }: { draft: SystemSettings; setDraft: React.Dispatch<React.SetStateAction<SystemSettings>> }) {
  const i = draft.integrations;
  return (
    <div className="space-y-4">
      <SectionCard title="ERP Systems" borderColor={SETTINGS_COLORS.info}>
        <div className="flex items-center gap-2 text-sm">Status: {statusPill(i.erp.connected ? 'CONNECTED' : 'NOT CONNECTED', i.erp.connected ? SETTINGS_COLORS.success : SETTINGS_COLORS.error)}</div>
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="ERP System">
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={i.erp.system} onChange={(e) => setDraft((s) => ({ ...s, integrations: { ...s.integrations, erp: { ...s.integrations.erp, system: e.target.value as SystemSettings['integrations']['erp']['system'] } } }))}>
              <option>SAP</option><option>Oracle ERP</option><option>Microsoft Dynamics</option><option>Tally</option><option>Zoho Books</option>
            </select>
          </Row>
          <Row label="API Endpoint"><TextInput value={i.erp.endpoint} onChange={(e) => setDraft((s) => ({ ...s, integrations: { ...s.integrations, erp: { ...s.integrations.erp, endpoint: e.target.value } } }))} /></Row>
          <Row label="Sync Frequency">
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={i.erp.syncFrequency} onChange={(e) => setDraft((s) => ({ ...s, integrations: { ...s.integrations, erp: { ...s.integrations.erp, syncFrequency: e.target.value as SystemSettings['integrations']['erp']['syncFrequency'] } } }))}>
              <option>Real-time</option><option>Hourly</option><option>Daily</option>
            </select>
          </Row>
        </div>
      </SectionCard>

      <SectionCard title="Connected Integrations" borderColor="#00BFA5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <div className="font-semibold">GPS Tracking</div>
            <div className="mt-1">Provider: {i.gps.provider}</div>
            <div>Vehicles: {i.gps.vehiclesTracked}</div>
            <div>Last Sync: {new Date(i.gps.lastSyncAt).toLocaleString()}</div>
            <div className="mt-2">{statusPill(i.gps.connected ? 'CONNECTED' : 'DISCONNECTED', i.gps.connected ? SETTINGS_COLORS.success : SETTINGS_COLORS.error)}</div>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <div className="font-semibold">E-signature</div>
            <div className="mt-1">Provider: {i.esign.provider}</div>
            <div>Contracts Signed: {i.esign.contractsSigned}</div>
            <div>Pending Signatures: {i.esign.pendingSignatures}</div>
            <div className="mt-2">{statusPill(i.esign.connected ? 'CONNECTED' : 'DISCONNECTED', i.esign.connected ? SETTINGS_COLORS.success : SETTINGS_COLORS.error)}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Webhooks & API Keys" borderColor={SETTINGS_COLORS.critical}>
        <div className="space-y-2 text-sm">
          {i.webhooks.map((wh) => (
            <div key={wh.id} className="rounded-lg border border-slate-200 p-3">
              <div className="font-semibold">{wh.event}</div>
              <div className="text-xs text-slate-500">{wh.url}</div>
              <div className="mt-1 flex gap-2">
                {statusPill(wh.active ? 'ACTIVE' : 'INACTIVE', wh.active ? SETTINGS_COLORS.success : SETTINGS_COLORS.inactive)}
                {statusPill(`Success ${wh.successRate}%`, wh.successRate > 95 ? SETTINGS_COLORS.success : SETTINGS_COLORS.warning)}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function SecurityPrivacyTab({ draft, setDraft }: { draft: SystemSettings; setDraft: React.Dispatch<React.SetStateAction<SystemSettings>> }) {
  const s = draft.securityPrivacy;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-3 text-sm text-white" style={{ backgroundColor: SETTINGS_COLORS.error }}>
        Critical settings: changing security configuration may affect platform access.
      </div>

      <SectionCard title="Authentication" borderColor={SETTINGS_COLORS.error}>
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="Password Minimum Length"><TextInput type="number" min={8} value={s.passwordPolicy.minLength} onChange={(e) => setDraft((d) => ({ ...d, securityPrivacy: { ...d.securityPrivacy, passwordPolicy: { ...d.securityPrivacy.passwordPolicy, minLength: Number(e.target.value || 0) } } }))} /></Row>
          <Row label="Password Expiry (days)"><TextInput type="number" value={s.passwordPolicy.expiryDays} onChange={(e) => setDraft((d) => ({ ...d, securityPrivacy: { ...d.securityPrivacy, passwordPolicy: { ...d.securityPrivacy.passwordPolicy, expiryDays: Number(e.target.value || 0) } } }))} /></Row>
          <Row label="Password History"><TextInput type="number" value={s.passwordPolicy.historyCount} onChange={(e) => setDraft((d) => ({ ...d, securityPrivacy: { ...d.securityPrivacy, passwordPolicy: { ...d.securityPrivacy.passwordPolicy, historyCount: Number(e.target.value || 0) } } }))} /></Row>
          <Row label="Enforce 2FA for Admins"><Toggle checked={s.twoFactor.enforceForAdmins} onChange={(v) => setDraft((d) => ({ ...d, securityPrivacy: { ...d.securityPrivacy, twoFactor: { ...d.securityPrivacy.twoFactor, enforceForAdmins: v } } }))} activeLabel="MANDATORY" inactiveLabel="OPTIONAL" /></Row>
          <Row label="Enforce 2FA for All"><Toggle checked={s.twoFactor.enforceForAllUsers} onChange={(v) => setDraft((d) => ({ ...d, securityPrivacy: { ...d.securityPrivacy, twoFactor: { ...d.securityPrivacy.twoFactor, enforceForAllUsers: v } } }))} /></Row>
        </div>
      </SectionCard>

      <SectionCard title="IP Security" borderColor={SETTINGS_COLORS.warning}>
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="IP Whitelisting"><Toggle checked={s.ipSecurity.ipWhitelistingEnabled} onChange={(v) => setDraft((d) => ({ ...d, securityPrivacy: { ...d.securityPrivacy, ipSecurity: { ...d.securityPrivacy.ipSecurity, ipWhitelistingEnabled: v } } }))} /></Row>
          <Row label="Lock After Attempts"><TextInput type="number" value={s.ipSecurity.lockAfterAttempts} onChange={(e) => setDraft((d) => ({ ...d, securityPrivacy: { ...d.securityPrivacy, ipSecurity: { ...d.securityPrivacy.ipSecurity, lockAfterAttempts: Number(e.target.value || 0) } } }))} /></Row>
          <Row label="Lock Duration (minutes)"><TextInput type="number" value={s.ipSecurity.lockDurationMinutes} onChange={(e) => setDraft((d) => ({ ...d, securityPrivacy: { ...d.securityPrivacy, ipSecurity: { ...d.securityPrivacy.ipSecurity, lockDurationMinutes: Number(e.target.value || 0) } } }))} /></Row>
        </div>
        <div className="space-y-2">
          {s.ipSecurity.whitelist.map((ip, idx) => (
            <div key={`${ip.cidr}-${idx}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {ip.cidr} - {ip.label} {statusPill(ip.active ? 'ACTIVE' : 'INACTIVE', ip.active ? SETTINGS_COLORS.success : SETTINGS_COLORS.inactive)}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Data Privacy, Audit, Backup" borderColor={SETTINGS_COLORS.success}>
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="Anonymize in Reports"><Toggle checked={s.dataPrivacy.anonymizeInReports} onChange={(v) => setDraft((d) => ({ ...d, securityPrivacy: { ...d.securityPrivacy, dataPrivacy: { ...d.securityPrivacy.dataPrivacy, anonymizeInReports: v } } }))} /></Row>
          <Row label="Data Retention (years)"><TextInput type="number" value={s.dataPrivacy.retentionYears} onChange={(e) => setDraft((d) => ({ ...d, securityPrivacy: { ...d.securityPrivacy, dataPrivacy: { ...d.securityPrivacy.dataPrivacy, retentionYears: Number(e.target.value || 0) } } }))} /></Row>
          <Row label="Audit Log Level">
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={s.auditLog.level} onChange={(e) => setDraft((d) => ({ ...d, securityPrivacy: { ...d.securityPrivacy, auditLog: { ...d.securityPrivacy.auditLog, level: e.target.value as SystemSettings['securityPrivacy']['auditLog']['level'] } } }))}>
              <option>Minimal</option><option>Standard</option><option>Verbose</option>
            </select>
          </Row>
          <Row label="Auto Backup"><Toggle checked={s.backup.autoBackupEnabled} onChange={(v) => setDraft((d) => ({ ...d, securityPrivacy: { ...d.securityPrivacy, backup: { ...d.securityPrivacy.backup, autoBackupEnabled: v } } }))} /></Row>
          <Row label="Backup Frequency">
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={s.backup.frequency} onChange={(e) => setDraft((d) => ({ ...d, securityPrivacy: { ...d.securityPrivacy, backup: { ...d.securityPrivacy.backup, frequency: e.target.value as SystemSettings['securityPrivacy']['backup']['frequency'] } } }))}>
              <option>Daily</option><option>Weekly</option><option>Monthly</option>
            </select>
          </Row>
          <Row label="Last Backup"><TextInput readOnly className="bg-slate-50" value={new Date(s.backup.lastBackupAt).toLocaleString()} /></Row>
        </div>
      </SectionCard>
    </div>
  );
}

function LocalizationTab({ draft, setDraft }: { draft: SystemSettings; setDraft: React.Dispatch<React.SetStateAction<SystemSettings>> }) {
  const l = draft.localization;
  return (
    <div className="space-y-4">
      <SectionCard title="Language & Region" borderColor="#00BFA5">
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="Default Language">
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={l.defaultLanguage} onChange={(e) => setDraft((d) => ({ ...d, localization: { ...d.localization, defaultLanguage: e.target.value as SystemSettings['localization']['defaultLanguage'] } }))}>
              <option>English</option><option>Hindi</option><option>Tamil</option><option>Telugu</option><option>Bengali</option><option>Marathi</option>
            </select>
          </Row>
          <Row label="Allow User Language Selection"><Toggle checked={l.allowUserLanguageSelection} onChange={(v) => setDraft((d) => ({ ...d, localization: { ...d.localization, allowUserLanguageSelection: v } }))} /></Row>
          <Row label="Region"><TextInput value={l.region} onChange={(e) => setDraft((d) => ({ ...d, localization: { ...d.localization, region: e.target.value } }))} /></Row>
        </div>
        <div className="space-y-2">
          {l.languageProgress.map((lang, idx) => (
            <div key={`${lang.language}-${idx}`} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between text-sm">
                <span>{lang.language}</span>
                <span>{lang.progressPct}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full" style={{ width: `${lang.progressPct}%`, backgroundColor: lang.progressPct >= 90 ? SETTINGS_COLORS.success : SETTINGS_COLORS.warning }} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Tax Configuration" borderColor={SETTINGS_COLORS.info}>
        <div className="grid gap-3 md:grid-cols-4">
          <Row label="GST Enabled"><Toggle checked={l.gstEnabled} onChange={(v) => setDraft((d) => ({ ...d, localization: { ...d.localization, gstEnabled: v } }))} /></Row>
          <Row label="GST Rate (%)"><TextInput type="number" value={l.gstRate} onChange={(e) => setDraft((d) => ({ ...d, localization: { ...d.localization, gstRate: Number(e.target.value || 0) } }))} /></Row>
          <Row label="TDS Applicable"><Toggle checked={l.tdsApplicable} onChange={(v) => setDraft((d) => ({ ...d, localization: { ...d.localization, tdsApplicable: v } }))} /></Row>
          <Row label="TDS Rate (%)"><TextInput type="number" value={l.tdsRate} onChange={(e) => setDraft((d) => ({ ...d, localization: { ...d.localization, tdsRate: Number(e.target.value || 0) } }))} /></Row>
        </div>
      </SectionCard>
    </div>
  );
}

function AdvancedTab({ draft, setDraft }: { draft: SystemSettings; setDraft: React.Dispatch<React.SetStateAction<SystemSettings>> }) {
  const a = draft.advanced;
  return (
    <div className="space-y-4">
      <div className="rounded-lg p-3 text-white" style={{ backgroundColor: SETTINGS_COLORS.error }}>
        <div className="flex items-center gap-2"><AlertTriangle size={16} /> These settings affect core behavior. Change with caution.</div>
      </div>

      <SectionCard title="Performance" borderColor={SETTINGS_COLORS.critical}>
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="Database Connection Pool"><TextInput type="number" value={a.dbConnectionPool} onChange={(e) => setDraft((d) => ({ ...d, advanced: { ...d.advanced, dbConnectionPool: Number(e.target.value || 0) } }))} /></Row>
          <Row label="Query Timeout (sec)"><TextInput type="number" value={a.queryTimeoutSec} onChange={(e) => setDraft((d) => ({ ...d, advanced: { ...d.advanced, queryTimeoutSec: Number(e.target.value || 0) } }))} /></Row>
          <Row label="Cache Strategy">
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={a.cacheStrategy} onChange={(e) => setDraft((d) => ({ ...d, advanced: { ...d.advanced, cacheStrategy: e.target.value as SystemSettings['advanced']['cacheStrategy'] } }))}>
              <option>In-Memory (Redis)</option><option>Database</option><option>Hybrid</option>
            </select>
          </Row>
          <Row label="CDN for Assets"><Toggle checked={a.cdnEnabled} onChange={(v) => setDraft((d) => ({ ...d, advanced: { ...d.advanced, cdnEnabled: v } }))} /></Row>
        </div>
      </SectionCard>

      <SectionCard title="Feature Flags" borderColor={SETTINGS_COLORS.warning}>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(a.featureFlags).map(([k, v]) => (
            <label key={k} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <input type="checkbox" checked={v} onChange={(e) => setDraft((d) => ({ ...d, advanced: { ...d.advanced, featureFlags: { ...d.advanced.featureFlags, [k]: e.target.checked } } }))} />
              <span className="ml-2">{k}</span>
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="System Maintenance & Health" borderColor={SETTINGS_COLORS.success}>
        <div className="grid gap-3 md:grid-cols-3">
          <Row label="Maintenance Mode"><Toggle checked={a.maintenanceMode} onChange={(v) => setDraft((d) => ({ ...d, advanced: { ...d.advanced, maintenanceMode: v } }))} activeLabel="MAINTENANCE ON" inactiveLabel="MAINTENANCE OFF" /></Row>
          <Row label="Debug Mode"><Toggle checked={a.debugMode} onChange={(v) => setDraft((d) => ({ ...d, advanced: { ...d.advanced, debugMode: v } }))} activeLabel="DEBUG ON" inactiveLabel="DEBUG OFF" /></Row>
          <Row label="Log Level">
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={a.appLogLevel} onChange={(e) => setDraft((d) => ({ ...d, advanced: { ...d.advanced, appLogLevel: e.target.value as SystemSettings['advanced']['appLogLevel'] } }))}>
              <option>ERROR</option><option>WARNING</option><option>INFO</option><option>DEBUG</option>
            </select>
          </Row>
        </div>
        <div className="rounded-lg border border-slate-200 p-3 text-sm">
          <div className="mb-2 font-semibold">System Information (Read-only)</div>
          <div className="grid gap-2 md:grid-cols-2">
            <div>Platform Version: {a.systemInfo.platformVersion} {statusPill('LATEST', SETTINGS_COLORS.success)}</div>
            <div>Database: {a.systemInfo.dbVersion}</div>
            <div>Server: {a.systemInfo.serverType}</div>
            <div>Region: {a.systemInfo.region}</div>
            <div>Uptime: {Math.floor(a.systemInfo.uptimeHours / 24)} days</div>
            <div>Active Users: {a.systemInfo.activeUsers}</div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
