import React, { useEffect, useState } from 'react';

interface VendorAnalyticsSettingsState {
  analysisSettings: {
    updateFrequency: 'Daily' | 'Real-time' | 'Weekly';
    historicalWindow: '3m' | '6m' | '12m';
    minimumDataPoints: number;
    confidenceThreshold: number;
  };
  alertSettings: {
    performanceDegradation: boolean;
    participationDrop: boolean;
    unusualPricing: boolean;
    acceptanceRisk: boolean;
    patternChange: boolean;
    competitiveThreat: boolean;
    collusionRisk: boolean;
    recipients: string;
  };
  patternDetection: {
    sensitivity: 'Low' | 'Medium' | 'High';
    anomalyStdDev: number;
    minOccurrences: number;
    minConfidence: number;
  };
  modelSettings: {
    participationModel: boolean;
    winProbabilityModel: boolean;
    pricePredictionModel: boolean;
    behaviorClassifierModel: boolean;
    retrainSchedule: 'Monthly' | 'Bi-weekly' | 'Quarterly';
    minAccuracy: number;
  };
  privacy: {
    anonymizeSharedReports: boolean;
    managerOnlyComparison: boolean;
    retentionYears: number;
    auditLogEnabled: boolean;
  };
}

const STORAGE = 'vendor-analytics-settings-v1';

const defaults: VendorAnalyticsSettingsState = {
  analysisSettings: {
    updateFrequency: 'Daily',
    historicalWindow: '12m',
    minimumDataPoints: 10,
    confidenceThreshold: 70,
  },
  alertSettings: {
    performanceDegradation: true,
    participationDrop: true,
    unusualPricing: true,
    acceptanceRisk: true,
    patternChange: true,
    competitiveThreat: true,
    collusionRisk: true,
    recipients: 'procurement@optimile.com',
  },
  patternDetection: {
    sensitivity: 'Medium',
    anomalyStdDev: 2,
    minOccurrences: 3,
    minConfidence: 80,
  },
  modelSettings: {
    participationModel: true,
    winProbabilityModel: true,
    pricePredictionModel: true,
    behaviorClassifierModel: true,
    retrainSchedule: 'Monthly',
    minAccuracy: 80,
  },
  privacy: {
    anonymizeSharedReports: true,
    managerOnlyComparison: true,
    retentionYears: 7,
    auditLogEnabled: true,
  },
};

export function VendorAnalyticsSettings() {
  const [state, setState] = useState<VendorAnalyticsSettingsState>(defaults);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return;
    try {
      setState(JSON.parse(raw) as VendorAnalyticsSettingsState);
    } catch {
      setState(defaults);
    }
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE, JSON.stringify(state));
    setSavedAt(Date.now());
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vendor Analytics Settings</h1>
        <p className="text-slate-500">Configure behavior analysis, alerting, model controls, and privacy rules.</p>
      </div>

      <Section title="Analysis Settings">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
          <SelectField label="Update Frequency" value={state.analysisSettings.updateFrequency} options={['Daily', 'Real-time', 'Weekly']} onChange={(v) => setState((s) => ({ ...s, analysisSettings: { ...s.analysisSettings, updateFrequency: v as VendorAnalyticsSettingsState['analysisSettings']['updateFrequency'] } }))} />
          <SelectField label="Historical Window" value={state.analysisSettings.historicalWindow} options={['3m', '6m', '12m']} onChange={(v) => setState((s) => ({ ...s, analysisSettings: { ...s.analysisSettings, historicalWindow: v as VendorAnalyticsSettingsState['analysisSettings']['historicalWindow'] } }))} />
          <NumberField label="Minimum Data Points" value={state.analysisSettings.minimumDataPoints} onChange={(n) => setState((s) => ({ ...s, analysisSettings: { ...s.analysisSettings, minimumDataPoints: n } }))} />
          <NumberField label="Confidence Threshold %" value={state.analysisSettings.confidenceThreshold} onChange={(n) => setState((s) => ({ ...s, analysisSettings: { ...s.analysisSettings, confidenceThreshold: n } }))} />
        </div>
      </Section>

      <Section title="Alert Configuration">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <Toggle label="Performance degradation alert" checked={state.alertSettings.performanceDegradation} onChange={(v) => setState((s) => ({ ...s, alertSettings: { ...s.alertSettings, performanceDegradation: v } }))} />
          <Toggle label="Participation drop alert" checked={state.alertSettings.participationDrop} onChange={(v) => setState((s) => ({ ...s, alertSettings: { ...s.alertSettings, participationDrop: v } }))} />
          <Toggle label="Unusual pricing alert" checked={state.alertSettings.unusualPricing} onChange={(v) => setState((s) => ({ ...s, alertSettings: { ...s.alertSettings, unusualPricing: v } }))} />
          <Toggle label="Acceptance risk alert" checked={state.alertSettings.acceptanceRisk} onChange={(v) => setState((s) => ({ ...s, alertSettings: { ...s.alertSettings, acceptanceRisk: v } }))} />
          <Toggle label="New pattern detected alert" checked={state.alertSettings.patternChange} onChange={(v) => setState((s) => ({ ...s, alertSettings: { ...s.alertSettings, patternChange: v } }))} />
          <Toggle label="Competitive threat alert" checked={state.alertSettings.competitiveThreat} onChange={(v) => setState((s) => ({ ...s, alertSettings: { ...s.alertSettings, competitiveThreat: v } }))} />
          <Toggle label="Collusion risk alert" checked={state.alertSettings.collusionRisk} onChange={(v) => setState((s) => ({ ...s, alertSettings: { ...s.alertSettings, collusionRisk: v } }))} />
          <label className="border border-slate-200 rounded p-2">
            <div className="text-xs text-slate-500">Recipients</div>
            <input className="mt-1 w-full border border-slate-300 rounded px-2 py-1" value={state.alertSettings.recipients} onChange={(e) => setState((s) => ({ ...s, alertSettings: { ...s.alertSettings, recipients: e.target.value } }))} />
          </label>
        </div>
      </Section>

      <Section title="Pattern Detection">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
          <SelectField label="Sensitivity" value={state.patternDetection.sensitivity} options={['Low', 'Medium', 'High']} onChange={(v) => setState((s) => ({ ...s, patternDetection: { ...s.patternDetection, sensitivity: v as VendorAnalyticsSettingsState['patternDetection']['sensitivity'] } }))} />
          <NumberField label="Anomaly Threshold (std dev)" value={state.patternDetection.anomalyStdDev} onChange={(n) => setState((s) => ({ ...s, patternDetection: { ...s.patternDetection, anomalyStdDev: n } }))} />
          <NumberField label="Min Pattern Occurrences" value={state.patternDetection.minOccurrences} onChange={(n) => setState((s) => ({ ...s, patternDetection: { ...s.patternDetection, minOccurrences: n } }))} />
          <NumberField label="Pattern Confidence %" value={state.patternDetection.minConfidence} onChange={(n) => setState((s) => ({ ...s, patternDetection: { ...s.patternDetection, minConfidence: n } }))} />
        </div>
      </Section>

      <Section title="Prediction Models">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <Toggle label="Participation predictor" checked={state.modelSettings.participationModel} onChange={(v) => setState((s) => ({ ...s, modelSettings: { ...s.modelSettings, participationModel: v } }))} />
          <Toggle label="Win probability model" checked={state.modelSettings.winProbabilityModel} onChange={(v) => setState((s) => ({ ...s, modelSettings: { ...s.modelSettings, winProbabilityModel: v } }))} />
          <Toggle label="Price range model" checked={state.modelSettings.pricePredictionModel} onChange={(v) => setState((s) => ({ ...s, modelSettings: { ...s.modelSettings, pricePredictionModel: v } }))} />
          <Toggle label="Behavior classifier" checked={state.modelSettings.behaviorClassifierModel} onChange={(v) => setState((s) => ({ ...s, modelSettings: { ...s.modelSettings, behaviorClassifierModel: v } }))} />
          <SelectField label="Retraining Schedule" value={state.modelSettings.retrainSchedule} options={['Monthly', 'Bi-weekly', 'Quarterly']} onChange={(v) => setState((s) => ({ ...s, modelSettings: { ...s.modelSettings, retrainSchedule: v as VendorAnalyticsSettingsState['modelSettings']['retrainSchedule'] } }))} />
          <NumberField label="Minimum Accuracy %" value={state.modelSettings.minAccuracy} onChange={(n) => setState((s) => ({ ...s, modelSettings: { ...s.modelSettings, minAccuracy: n } }))} />
        </div>
      </Section>

      <Section title="Privacy & Compliance">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <Toggle label="Anonymize vendor data in shared reports" checked={state.privacy.anonymizeSharedReports} onChange={(v) => setState((s) => ({ ...s, privacy: { ...s.privacy, anonymizeSharedReports: v } }))} />
          <Toggle label="Vendor comparison manager-level access" checked={state.privacy.managerOnlyComparison} onChange={(v) => setState((s) => ({ ...s, privacy: { ...s.privacy, managerOnlyComparison: v } }))} />
          <Toggle label="Audit logging enabled" checked={state.privacy.auditLogEnabled} onChange={(v) => setState((s) => ({ ...s, privacy: { ...s.privacy, auditLogEnabled: v } }))} />
          <NumberField label="Retention (years)" value={state.privacy.retentionYears} onChange={(n) => setState((s) => ({ ...s, privacy: { ...s.privacy, retentionYears: n } }))} />
        </div>
      </Section>

      <div className="flex items-center gap-2">
        <button className="px-4 py-2 rounded bg-slate-900 text-white text-sm" onClick={save}>Save Settings</button>
        <button className="px-4 py-2 rounded border border-slate-300 text-sm" onClick={() => setState(defaults)}>Reset Defaults</button>
        {savedAt && <span className="text-xs text-slate-500">Saved at {new Date(savedAt).toLocaleTimeString()}</span>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
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

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="border border-slate-200 rounded p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <select className="mt-1 w-full border border-slate-300 rounded px-2 py-1" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

