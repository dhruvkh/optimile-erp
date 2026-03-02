import React, { useEffect, useState } from 'react';

interface SettingsState {
  baselines: {
    l1: boolean;
    previousContract: boolean;
    market: boolean;
    budget: boolean;
    firstBid: boolean;
    secondPlace: boolean;
  };
  targets: {
    defaultSavingsPct: number;
    warningThresholdPct: number;
    leakageThresholdPct: number;
  };
  dataSources: {
    previousContract: 'csv' | 'database';
    marketBenchmark: 'api' | 'manual';
    budget: 'erp' | 'manual';
  };
  permissions: {
    viewDetailedFinanceOnly: boolean;
    exportRequiresApproval: boolean;
    baselineEditAdminOnly: boolean;
  };
}

const STORAGE_KEY = 'savings-analysis-settings-v1';

const defaultState: SettingsState = {
  baselines: {
    l1: true,
    previousContract: true,
    market: true,
    budget: true,
    firstBid: true,
    secondPlace: true,
  },
  targets: {
    defaultSavingsPct: 15,
    warningThresholdPct: 8,
    leakageThresholdPct: 14,
  },
  dataSources: {
    previousContract: 'database',
    marketBenchmark: 'manual',
    budget: 'erp',
  },
  permissions: {
    viewDetailedFinanceOnly: true,
    exportRequiresApproval: true,
    baselineEditAdminOnly: true,
  },
};

export function SavingsAnalysisSettings() {
  const [state, setState] = useState<SettingsState>(defaultState);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as SettingsState;
      setState(parsed);
    } catch {
      setState(defaultState);
    }
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setSavedAt(Date.now());
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Savings Analysis Settings</h1>
        <p className="text-slate-500">Configure baseline methods, thresholds, data sources, and access controls.</p>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold text-slate-900">Default Baselines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <Toggle label="L1 Rate baseline" checked={state.baselines.l1} onChange={(v) => setState((s) => ({ ...s, baselines: { ...s.baselines, l1: v } }))} />
          <Toggle label="Previous contract baseline" checked={state.baselines.previousContract} onChange={(v) => setState((s) => ({ ...s, baselines: { ...s.baselines, previousContract: v } }))} />
          <Toggle label="Market benchmark baseline" checked={state.baselines.market} onChange={(v) => setState((s) => ({ ...s, baselines: { ...s.baselines, market: v } }))} />
          <Toggle label="Budget baseline" checked={state.baselines.budget} onChange={(v) => setState((s) => ({ ...s, baselines: { ...s.baselines, budget: v } }))} />
          <Toggle label="Vendor first bid baseline" checked={state.baselines.firstBid} onChange={(v) => setState((s) => ({ ...s, baselines: { ...s.baselines, firstBid: v } }))} />
          <Toggle label="Second place margin baseline" checked={state.baselines.secondPlace} onChange={(v) => setState((s) => ({ ...s, baselines: { ...s.baselines, secondPlace: v } }))} />
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold text-slate-900">Thresholds</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <NumberField label="Target Savings %" value={state.targets.defaultSavingsPct} onChange={(n) => setState((s) => ({ ...s, targets: { ...s.targets, defaultSavingsPct: n } }))} />
          <NumberField label="Warning Threshold %" value={state.targets.warningThresholdPct} onChange={(n) => setState((s) => ({ ...s, targets: { ...s.targets, warningThresholdPct: n } }))} />
          <NumberField label="Leakage Threshold %" value={state.targets.leakageThresholdPct} onChange={(n) => setState((s) => ({ ...s, targets: { ...s.targets, leakageThresholdPct: n } }))} />
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold text-slate-900">Data Sources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <SelectField
            label="Previous Contract Rates"
            value={state.dataSources.previousContract}
            onChange={(v) => setState((s) => ({ ...s, dataSources: { ...s.dataSources, previousContract: v as 'csv' | 'database' } }))}
            options={[['database', 'Connect database'], ['csv', 'Upload CSV']]}
          />
          <SelectField
            label="Market Benchmarks"
            value={state.dataSources.marketBenchmark}
            onChange={(v) => setState((s) => ({ ...s, dataSources: { ...s.dataSources, marketBenchmark: v as 'api' | 'manual' } }))}
            options={[['api', 'API integration'], ['manual', 'Manual entry']]}
          />
          <SelectField
            label="Budget Data"
            value={state.dataSources.budget}
            onChange={(v) => setState((s) => ({ ...s, dataSources: { ...s.dataSources, budget: v as 'erp' | 'manual' } }))}
            options={[['erp', 'ERP import'], ['manual', 'Manual entry']]}
          />
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <h2 className="font-semibold text-slate-900">Security & Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <Toggle label="Detailed calculations visible to finance team only" checked={state.permissions.viewDetailedFinanceOnly} onChange={(v) => setState((s) => ({ ...s, permissions: { ...s.permissions, viewDetailedFinanceOnly: v } }))} />
          <Toggle label="Report export requires manager approval" checked={state.permissions.exportRequiresApproval} onChange={(v) => setState((s) => ({ ...s, permissions: { ...s.permissions, exportRequiresApproval: v } }))} />
          <Toggle label="Baseline configuration editable by admin only" checked={state.permissions.baselineEditAdminOnly} onChange={(v) => setState((s) => ({ ...s, permissions: { ...s.permissions, baselineEditAdminOnly: v } }))} />
        </div>
      </section>

      <div className="flex items-center gap-2">
        <button className="px-4 py-2 rounded bg-slate-900 text-white text-sm" onClick={save}>Save Settings</button>
        <button className="px-4 py-2 rounded border border-slate-300 text-sm" onClick={() => setState(defaultState)}>Reset Defaults</button>
        {savedAt && <span className="text-xs text-slate-500">Saved at {new Date(savedAt).toLocaleTimeString()}</span>}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="border border-slate-200 rounded p-2 inline-flex items-center justify-between gap-2">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="border border-slate-200 rounded p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <input type="number" className="mt-1 w-full border border-slate-300 rounded px-2 py-1" value={value} onChange={(e) => onChange(Number(e.target.value || 0))} />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="border border-slate-200 rounded p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <select className="mt-1 w-full border border-slate-300 rounded px-2 py-1" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([val, text]) => <option key={val} value={val}>{text}</option>)}
      </select>
    </label>
  );
}

