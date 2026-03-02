import { vendorManagement } from './vendorManagement';

export type MigrationModule = 'auctions' | 'performance' | 'contracts';
export type MigrationJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'rolled_back';

export interface MigrationJob {
  jobId: string;
  module: MigrationModule;
  status: MigrationJobStatus;
  recordsProcessed: number;
  totalRecords: number;
  startedAt: number;
  completedAt?: number;
  canRollback: boolean;
  rollbackDeadline?: number;
  dryRun: boolean;
  report?: MigrationReport;
}

export interface MigrationReport {
  totalRecords: number;
  importedRecords: number;
  failedRecords: number;
  duplicatesHandled: number;
  warnings: number;
  errors: number;
  dataQualityScore: number;
  impactSummary: string;
  rollbackInstructions: string;
}

export interface HistoricalAuctionRecord {
  migrationJobId: string;
  migratedAt: number;
  migrated: true;
  historical: true;
  readOnly: boolean;
  auctionId: string;
  auctionName: string;
  type: string;
  date: string;
  status: 'Completed' | 'Closed';
  totalLanes: number;
  totalValue: number;
  finalValue: number;
  savingsPct: number;
  winnerDetails: string;
  participationCount: number;
}

export interface HistoricalVendorPerformanceRecord {
  migrationJobId: string;
  migratedAt: number;
  migrated: true;
  historical: true;
  readOnly: boolean;
  vendorIdOrName: string;
  period: string;
  auctionsParticipated: number;
  lanesWon: number;
  winRate: number;
  onTimeDeliveryPct: number;
  avgDiscountGiven: number;
  performanceScore: number;
  reliabilityRating: number;
  issuesCount: number;
}

export interface HistoricalContractRecord {
  migrationJobId: string;
  migratedAt: number;
  migrated: true;
  historical: true;
  readOnly: boolean;
  contractReference: string;
  vendor: string;
  period: string;
  routes: string;
  contractValue: number;
  actualSpend: number;
  savings: number;
  performanceMetrics: string;
  renewalStatus: string;
}

export interface ParsedUpload {
  headers: string[];
  rows: Array<Record<string, string>>;
}

export interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface ValidationRow {
  rowNumber: number;
  status: 'valid' | 'warning' | 'error';
  data: Record<string, any>;
  issues: ValidationIssue[];
}

export interface ValidationResult {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  rows: ValidationRow[];
}

export interface MigrationStartOptions {
  lockRecordsFromEditing: boolean;
  createVendorsIfMissing: boolean;
  dryRun: boolean;
}

const STORAGE_KEY = 'optimile-data-migration-v1';

type PersistedState = {
  jobs: MigrationJob[];
  historicalAuctions: HistoricalAuctionRecord[];
  historicalPerformance: HistoricalVendorPerformanceRecord[];
  historicalContracts: HistoricalContractRecord[];
};

const MODULE_FIELDS: Record<MigrationModule, Array<{ key: string; label: string; required: boolean }>> = {
  auctions: [
    { key: 'auctionId', label: 'Auction ID', required: true },
    { key: 'auctionName', label: 'Auction Name', required: true },
    { key: 'type', label: 'Type', required: true },
    { key: 'date', label: 'Date', required: true },
    { key: 'status', label: 'Status', required: true },
    { key: 'totalLanes', label: 'Total Lanes', required: true },
    { key: 'totalValue', label: 'Total Value', required: true },
    { key: 'finalValue', label: 'Final Value', required: true },
    { key: 'savingsPct', label: 'Savings %', required: true },
    { key: 'winnerDetails', label: 'Winner details per lane', required: false },
    { key: 'participationCount', label: 'Participation count', required: true },
  ],
  performance: [
    { key: 'vendorIdOrName', label: 'Vendor ID/Name', required: true },
    { key: 'period', label: 'Period (Month/Year)', required: true },
    { key: 'auctionsParticipated', label: 'Auctions Participated', required: true },
    { key: 'lanesWon', label: 'Lanes Won', required: true },
    { key: 'winRate', label: 'Win Rate', required: true },
    { key: 'onTimeDeliveryPct', label: 'On-Time Delivery %', required: true },
    { key: 'avgDiscountGiven', label: 'Avg Discount Given', required: true },
    { key: 'performanceScore', label: 'Performance Score', required: true },
    { key: 'reliabilityRating', label: 'Reliability Rating', required: true },
    { key: 'issuesCount', label: 'Issues/Disputes count', required: false },
  ],
  contracts: [
    { key: 'contractReference', label: 'Contract reference', required: true },
    { key: 'vendor', label: 'Vendor', required: true },
    { key: 'period', label: 'Period', required: true },
    { key: 'routes', label: 'Routes', required: true },
    { key: 'contractValue', label: 'Contract value', required: true },
    { key: 'actualSpend', label: 'Actual spend', required: true },
    { key: 'savings', label: 'Savings', required: true },
    { key: 'performanceMetrics', label: 'Performance metrics', required: false },
    { key: 'renewalStatus', label: 'Renewal status', required: false },
  ],
};

function normalizeHeader(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
}

function parseCsvLine(line: string) {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out;
}

function toNumber(value: any) {
  const n = Number(String(value ?? '').replace(/[₹,%\s,]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

function parsePastDate(value: string) {
  const v = value?.trim();
  if (!v) return { valid: false, iso: '', message: 'Date is required' };

  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (!m) return { valid: false, iso: '', message: 'Invalid date format (use DD/MM/YYYY)' };

  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (Number.isNaN(date.getTime()) || date.getUTCDate() !== day || date.getUTCMonth() + 1 !== month || date.getUTCFullYear() !== year) {
    return { valid: false, iso: '', message: 'Invalid calendar date' };
  }
  if (date.getTime() > Date.now()) return { valid: false, iso, message: 'Date must be in the past' };
  return { valid: true, iso };
}

function parsePeriodToDate(period: string) {
  const v = period.trim();
  if (!v) return { valid: false, dateKey: '', message: 'Period is required' };

  const mmYYYY = /^(\d{2})\/(\d{4})$/.exec(v);
  if (mmYYYY) {
    const mm = Number(mmYYYY[1]);
    const yyyy = Number(mmYYYY[2]);
    const dt = new Date(Date.UTC(yyyy, mm - 1, 1));
    if (dt.getTime() > Date.now()) return { valid: false, dateKey: `${yyyy}-${String(mm).padStart(2, '0')}`, message: 'Period must be in the past' };
    return { valid: true, dateKey: `${yyyy}-${String(mm).padStart(2, '0')}` };
  }

  const monthName = /^([A-Za-z]+)\s+(\d{4})$/.exec(v);
  if (monthName) {
    const names = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const idx = names.indexOf(monthName[1].slice(0, 3).toLowerCase());
    if (idx === -1) return { valid: false, dateKey: '', message: 'Invalid period format' };
    const yyyy = Number(monthName[2]);
    const dt = new Date(Date.UTC(yyyy, idx, 1));
    if (dt.getTime() > Date.now()) return { valid: false, dateKey: `${yyyy}-${String(idx + 1).padStart(2, '0')}`, message: 'Period must be in the past' };
    return { valid: true, dateKey: `${yyyy}-${String(idx + 1).padStart(2, '0')}` };
  }

  return { valid: false, dateKey: '', message: 'Invalid period format (use MM/YYYY or Mon YYYY)' };
}

function randId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

class DataMigrationService {
  private jobs = new Map<string, MigrationJob>();
  private historicalAuctions: HistoricalAuctionRecord[] = [];
  private historicalPerformance: HistoricalVendorPerformanceRecord[] = [];
  private historicalContracts: HistoricalContractRecord[] = [];
  private subscribers = new Set<() => void>();

  constructor() {
    this.load();
  }

  subscribe(cb: () => void) {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  private notify() {
    this.subscribers.forEach((cb) => cb());
  }

  private persist() {
    const data: PersistedState = {
      jobs: Array.from(this.jobs.values()),
      historicalAuctions: this.historicalAuctions,
      historicalPerformance: this.historicalPerformance,
      historicalContracts: this.historicalContracts,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as PersistedState;
      this.jobs = new Map((data.jobs || []).map((j) => [j.jobId, j]));
      this.historicalAuctions = data.historicalAuctions || [];
      this.historicalPerformance = data.historicalPerformance || [];
      this.historicalContracts = data.historicalContracts || [];
    } catch {
      // ignore corrupted storage
    }
  }

  getModuleFields(module: MigrationModule) {
    return MODULE_FIELDS[module];
  }

  getJobs() {
    return Array.from(this.jobs.values()).sort((a, b) => b.startedAt - a.startedAt);
  }

  getJob(jobId: string) {
    return this.jobs.get(jobId);
  }

  getHistoricalAuctions() {
    return [...this.historicalAuctions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getHistoricalPerformance() {
    return [...this.historicalPerformance].sort((a, b) => a.vendorIdOrName.localeCompare(b.vendorIdOrName));
  }

  getHistoricalContracts() {
    return [...this.historicalContracts].sort((a, b) => b.migratedAt - a.migratedAt);
  }

  async parseUpload(file: File): Promise<ParsedUpload> {
    const lower = file.name.toLowerCase();
    if (!['.csv', '.xls', '.xlsx'].some((ext) => lower.endsWith(ext))) {
      throw new Error('Unsupported file type. Use CSV/Excel.');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File too large. Max allowed size is 10 MB.');
    }
    if (lower.endsWith('.xlsx')) {
      throw new Error('XLSX parsing is unavailable in this environment. Save as CSV and re-upload.');
    }
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((l) => l.trimEnd()).filter(Boolean);
    if (lines.length < 2) throw new Error('No data rows found.');

    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = (delimiter === '\t' ? lines[0].split('\t') : parseCsvLine(lines[0])).map((h) => h.trim());
    const rows = lines.slice(1).map((line) => {
      const values = delimiter === '\t' ? line.split('\t') : parseCsvLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = (values[idx] || '').trim();
      });
      return row;
    });
    return { headers, rows };
  }

  autoDetectMapping(module: MigrationModule, headers: string[]) {
    const fields = MODULE_FIELDS[module];
    const normalized = headers.map((h) => ({ original: h, normalized: normalizeHeader(h) }));
    const mapping: Record<string, string> = {};

    fields.forEach((f) => {
      const target = normalizeHeader(f.label);
      const direct = normalized.find((h) => h.normalized === normalizeHeader(f.key) || h.normalized === target);
      if (direct) {
        mapping[f.key] = direct.original;
        return;
      }
      const loose = normalized.find((h) => h.normalized.includes(normalizeHeader(f.key)) || normalizeHeader(f.key).includes(h.normalized));
      if (loose) mapping[f.key] = loose.original;
    });

    return mapping;
  }

  mapRows(module: MigrationModule, rows: Array<Record<string, string>>, mapping: Record<string, string>) {
    const fields = MODULE_FIELDS[module];
    return rows.map((source, idx) => {
      const data: Record<string, any> = { _rowNumber: idx + 2 };
      fields.forEach((f) => {
        const col = mapping[f.key];
        data[f.key] = col ? (source[col] ?? '') : '';
      });
      return data;
    });
  }

  validate(module: MigrationModule, mappedRows: Array<Record<string, any>>, options: Pick<MigrationStartOptions, 'createVendorsIfMissing'>): ValidationResult {
    const fields = MODULE_FIELDS[module];
    const vendorSnap = vendorManagement.getSnapshot().vendors;
    const vendorKeys = new Set(vendorSnap.flatMap((v) => [v.vendorId.toLowerCase(), v.companyName.toLowerCase()]));
    const seen = new Set<string>();

    const existingKeys = new Set<string>();
    if (module === 'auctions') this.historicalAuctions.forEach((r) => existingKeys.add(`${r.auctionId}|${r.date}`.toLowerCase()));
    if (module === 'performance') this.historicalPerformance.forEach((r) => existingKeys.add(`${r.vendorIdOrName}|${r.period}`.toLowerCase()));
    if (module === 'contracts') this.historicalContracts.forEach((r) => existingKeys.add(`${r.contractReference}|${r.period}`.toLowerCase()));

    const rows: ValidationRow[] = mappedRows.map((row) => {
      const issues: ValidationIssue[] = [];
      fields.forEach((f) => {
        if (f.required && !String(row[f.key] || '').trim()) {
          issues.push({ field: f.key, severity: 'error', message: `${f.label} is required` });
        }
      });

      if (module === 'auctions') {
        const dateCheck = parsePastDate(String(row.date || ''));
        if (!dateCheck.valid) issues.push({ field: 'date', severity: 'error', message: dateCheck.message || 'Invalid date' });
        const status = String(row.status || '').toLowerCase();
        if (status !== 'completed' && status !== 'closed') {
          issues.push({ field: 'status', severity: 'error', message: 'Status must be Completed or Closed' });
        }
        ['totalLanes', 'totalValue', 'finalValue', 'savingsPct', 'participationCount'].forEach((k) => {
          const n = toNumber(row[k]);
          if (!Number.isFinite(n) || n < 0) issues.push({ field: k, severity: 'error', message: `${k} must be a positive number` });
        });
        const key = `${row.auctionId}|${row.date}`.toLowerCase();
        if (seen.has(key) || existingKeys.has(key)) issues.push({ field: 'auctionId', severity: 'error', message: 'Duplicate record by Auction ID + Date' });
        seen.add(key);
      }

      if (module === 'performance') {
        const per = parsePeriodToDate(String(row.period || ''));
        if (!per.valid) issues.push({ field: 'period', severity: 'error', message: per.message || 'Invalid period' });
        ['auctionsParticipated', 'lanesWon', 'winRate', 'onTimeDeliveryPct', 'avgDiscountGiven', 'performanceScore', 'reliabilityRating', 'issuesCount'].forEach((k) => {
          if (String(row[k] || '').trim() === '' && k === 'issuesCount') return;
          const n = toNumber(row[k]);
          if (!Number.isFinite(n) || n < 0) issues.push({ field: k, severity: 'error', message: `${k} must be a positive number` });
        });
        const vendorKey = String(row.vendorIdOrName || '').toLowerCase().trim();
        if (!vendorKeys.has(vendorKey)) {
          issues.push({
            field: 'vendorIdOrName',
            severity: options.createVendorsIfMissing ? 'warning' : 'error',
            message: 'Vendor not found in system',
          });
        }
        const key = `${row.vendorIdOrName}|${row.period}`.toLowerCase();
        if (seen.has(key) || existingKeys.has(key)) issues.push({ field: 'vendorIdOrName', severity: 'error', message: 'Duplicate record by Vendor + Period' });
        seen.add(key);
      }

      if (module === 'contracts') {
        ['contractValue', 'actualSpend', 'savings'].forEach((k) => {
          const n = toNumber(row[k]);
          if (!Number.isFinite(n) || n < 0) issues.push({ field: k, severity: 'error', message: `${k} must be a positive number` });
        });
        const vendorKey = String(row.vendor || '').toLowerCase().trim();
        if (!vendorKeys.has(vendorKey)) {
          issues.push({
            field: 'vendor',
            severity: options.createVendorsIfMissing ? 'warning' : 'error',
            message: 'Vendor not found in system',
          });
        }
        const per = parsePeriodToDate(String(row.period || ''));
        if (!per.valid) issues.push({ field: 'period', severity: 'error', message: per.message || 'Invalid period' });
        const key = `${row.contractReference}|${row.period}`.toLowerCase();
        if (seen.has(key) || existingKeys.has(key)) issues.push({ field: 'contractReference', severity: 'error', message: 'Duplicate record by Contract Reference + Period' });
        seen.add(key);
      }

      const hasError = issues.some((i) => i.severity === 'error');
      const hasWarn = issues.some((i) => i.severity === 'warning');
      return {
        rowNumber: Number(row._rowNumber || 0),
        status: hasError ? 'error' : hasWarn ? 'warning' : 'valid',
        data: row,
        issues,
      };
    });

    return {
      totalRows: rows.length,
      validRows: rows.filter((r) => r.status === 'valid').length,
      warningRows: rows.filter((r) => r.status === 'warning').length,
      errorRows: rows.filter((r) => r.status === 'error').length,
      rows,
    };
  }

  startMigration(module: MigrationModule, validationRows: ValidationRow[], options: MigrationStartOptions, startedBy: string) {
    const eligible = validationRows.filter((r) => r.status !== 'error');
    const jobId = randId('MIG');
    const job: MigrationJob = {
      jobId,
      module,
      status: 'pending',
      recordsProcessed: 0,
      totalRecords: eligible.length,
      startedAt: Date.now(),
      canRollback: !options.dryRun,
      dryRun: options.dryRun,
    };
    this.jobs.set(jobId, job);
    this.persist();
    this.notify();

    setTimeout(() => {
      this.processMigration(jobId, module, eligible, options, startedBy);
    }, 80);

    return { jobId, status: 'pending' as const };
  }

  private processMigration(
    jobId: string,
    module: MigrationModule,
    rows: ValidationRow[],
    options: MigrationStartOptions,
    startedBy: string,
  ) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.status = 'processing';
    this.persist();
    this.notify();

    const batchSize = 250;
    const failures: ValidationRow[] = [];
    let warnings = 0;
    let duplicates = 0;

    const appendRecord = (row: ValidationRow) => {
      if (row.status === 'warning') warnings += 1;
      const now = Date.now();
      if (module === 'auctions') {
        const rec: HistoricalAuctionRecord = {
          migrationJobId: jobId,
          migratedAt: now,
          migrated: true,
          historical: true,
          readOnly: options.lockRecordsFromEditing,
          auctionId: String(row.data.auctionId || ''),
          auctionName: String(row.data.auctionName || ''),
          type: String(row.data.type || ''),
          date: String(row.data.date || ''),
          status: String(row.data.status || 'Completed').toLowerCase() === 'closed' ? 'Closed' : 'Completed',
          totalLanes: toNumber(row.data.totalLanes) || 0,
          totalValue: toNumber(row.data.totalValue) || 0,
          finalValue: toNumber(row.data.finalValue) || 0,
          savingsPct: toNumber(row.data.savingsPct) || 0,
          winnerDetails: String(row.data.winnerDetails || ''),
          participationCount: toNumber(row.data.participationCount) || 0,
        };
        const key = `${rec.auctionId}|${rec.date}`.toLowerCase();
        const exists = this.historicalAuctions.some((a) => `${a.auctionId}|${a.date}`.toLowerCase() === key);
        if (!exists) this.historicalAuctions.push(rec);
        else duplicates += 1;
      }
      if (module === 'performance') {
        const rec: HistoricalVendorPerformanceRecord = {
          migrationJobId: jobId,
          migratedAt: now,
          migrated: true,
          historical: true,
          readOnly: options.lockRecordsFromEditing,
          vendorIdOrName: String(row.data.vendorIdOrName || ''),
          period: String(row.data.period || ''),
          auctionsParticipated: toNumber(row.data.auctionsParticipated) || 0,
          lanesWon: toNumber(row.data.lanesWon) || 0,
          winRate: toNumber(row.data.winRate) || 0,
          onTimeDeliveryPct: toNumber(row.data.onTimeDeliveryPct) || 0,
          avgDiscountGiven: toNumber(row.data.avgDiscountGiven) || 0,
          performanceScore: toNumber(row.data.performanceScore) || 0,
          reliabilityRating: toNumber(row.data.reliabilityRating) || 0,
          issuesCount: toNumber(row.data.issuesCount) || 0,
        };
        const key = `${rec.vendorIdOrName}|${rec.period}`.toLowerCase();
        const exists = this.historicalPerformance.some((a) => `${a.vendorIdOrName}|${a.period}`.toLowerCase() === key);
        if (!exists) this.historicalPerformance.push(rec);
        else duplicates += 1;
      }
      if (module === 'contracts') {
        const rec: HistoricalContractRecord = {
          migrationJobId: jobId,
          migratedAt: now,
          migrated: true,
          historical: true,
          readOnly: options.lockRecordsFromEditing,
          contractReference: String(row.data.contractReference || ''),
          vendor: String(row.data.vendor || ''),
          period: String(row.data.period || ''),
          routes: String(row.data.routes || ''),
          contractValue: toNumber(row.data.contractValue) || 0,
          actualSpend: toNumber(row.data.actualSpend) || 0,
          savings: toNumber(row.data.savings) || 0,
          performanceMetrics: String(row.data.performanceMetrics || ''),
          renewalStatus: String(row.data.renewalStatus || ''),
        };
        const key = `${rec.contractReference}|${rec.period}`.toLowerCase();
        const exists = this.historicalContracts.some((a) => `${a.contractReference}|${a.period}`.toLowerCase() === key);
        if (!exists) this.historicalContracts.push(rec);
        else duplicates += 1;
      }
    };

    let cursor = 0;
    const total = rows.length;
    const loop = () => {
      const current = this.jobs.get(jobId);
      if (!current) return;
      if (cursor >= total) {
        current.status = 'completed';
        current.recordsProcessed = total;
        current.completedAt = Date.now();
        current.rollbackDeadline = options.dryRun ? undefined : Date.now() + 24 * 60 * 60 * 1000;
        current.canRollback = !options.dryRun;
        const imported = options.dryRun ? 0 : total - duplicates;
        const failed = failures.length;
        const qualityBase = Math.max(1, total + failed);
        const dataQualityScore = Math.max(0, Math.round(((imported - warnings * 0.5) / qualityBase) * 100));
        current.report = {
          totalRecords: total,
          importedRecords: imported,
          failedRecords: failed,
          duplicatesHandled: duplicates,
          warnings,
          errors: failed,
          dataQualityScore,
          impactSummary: options.dryRun
            ? `Dry-run completed for ${module}. No historical records were written.`
            : `${imported} historical ${module} records are now available in analytics with (Historical) labels.`,
          rollbackInstructions: options.dryRun
            ? 'No rollback needed for dry-run.'
            : `Rollback is available until ${new Date(current.rollbackDeadline || 0).toLocaleString()}.`,
        };
        this.persist();
        this.notify();
        return;
      }

      const end = Math.min(cursor + batchSize, total);
      for (let i = cursor; i < end; i += 1) {
        const row = rows[i];
        try {
          if (!options.dryRun) appendRecord(row);
          current.recordsProcessed += 1;
        } catch {
          failures.push(row);
        }
      }
      cursor = end;
      this.persist();
      this.notify();
      setTimeout(loop, 50);
    };

    loop();
  }

  rollback(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Migration job not found');
    if (!job.canRollback || !job.rollbackDeadline || job.rollbackDeadline < Date.now()) {
      throw new Error('Rollback window expired or rollback not available');
    }
    this.historicalAuctions = this.historicalAuctions.filter((r) => r.migrationJobId !== jobId);
    this.historicalPerformance = this.historicalPerformance.filter((r) => r.migrationJobId !== jobId);
    this.historicalContracts = this.historicalContracts.filter((r) => r.migrationJobId !== jobId);
    job.status = 'rolled_back';
    job.canRollback = false;
    job.completedAt = Date.now();
    this.persist();
    this.notify();
    return { success: true };
  }

  downloadReport(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job || !job.report) throw new Error('Migration report not available');
    const lines = [
      'Optimile AMS - Migration Report',
      `Job ID: ${job.jobId}`,
      `Module: ${job.module}`,
      `Status: ${job.status}`,
      `Started At: ${new Date(job.startedAt).toLocaleString()}`,
      `Completed At: ${job.completedAt ? new Date(job.completedAt).toLocaleString() : '-'}`,
      '',
      `Total Records: ${job.report.totalRecords}`,
      `Imported Records: ${job.report.importedRecords}`,
      `Failed Records: ${job.report.failedRecords}`,
      `Warnings: ${job.report.warnings}`,
      `Errors: ${job.report.errors}`,
      `Duplicates Handled: ${job.report.duplicatesHandled}`,
      `Data Quality Score: ${job.report.dataQualityScore}`,
      '',
      `Impact: ${job.report.impactSummary}`,
      `Rollback: ${job.report.rollbackInstructions}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-report-${job.jobId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}

export const dataMigrationService = new DataMigrationService();

