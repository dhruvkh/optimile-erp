import type { CreateAuctionRequest } from '../types';

export const BULK_UPLOAD_COLORS = {
  success: '#00C853',
  warning: '#FFB300',
  error: '#FF1744',
  info: '#2979FF',
  ready: '#76FF03',
  inactive: '#757575',
} as const;

export interface BulkLaneParsedRow {
  rowNumber: number;
  laneName: string;
  origin: string;
  destination: string;
  vehicleType: string;
  basePrice: number;
  timerDurationSeconds: number;
  minBidDecrement?: number;
  tatDays: number;
  quantity?: number;
  specialInstructions?: string;
  estMonthlyVolume?: number;
  routeDistanceKm?: number;
}

export interface BulkLaneIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface BulkLaneValidationRow {
  rowNumber: number;
  status: 'valid' | 'warning' | 'error';
  data: BulkLaneParsedRow;
  issues: BulkLaneIssue[];
}

export interface BulkLaneValidationSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  rows: BulkLaneValidationRow[];
}

export interface BulkLaneImportOptions {
  duplicateHandling: 'skip' | 'replace' | 'rename';
  autoFix: boolean;
  applyDefaultDecrement: number;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_ROWS = 500;

const MAJOR_CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Chennai',
  'Hyderabad',
  'Pune',
  'Ahmedabad',
  'Kolkata',
  'Jaipur',
  'Lucknow',
  'Surat',
  'Nagpur',
];

const VEHICLE_TYPES = ['FTL', 'LTL', 'Container', 'Refrigerated', 'Tanker', 'Others'];

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function toNumber(value: string): number {
  const cleaned = String(value || '')
    .replace(/[₹,\s]/g, '')
    .trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function nearestCity(value: string) {
  const v = value.toLowerCase();
  const match = MAJOR_CITIES.find((c) => c.toLowerCase().startsWith(v.slice(0, 3)));
  return match;
}

function splitRow(line: string, delimiter: ',' | '\t') {
  if (delimiter === '\t') return line.split('\t');
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

function parseDelimited(text: string): { headers: string[]; records: Record<string, string>[]; delimiter: ',' | '\t' } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], records: [], delimiter: ',' };

  const delimiter: ',' | '\t' = lines[0].includes('\t') ? '\t' : ',';
  const headers = splitRow(lines[0], delimiter).map((h) => normalizeHeader(h));
  const records = lines.slice(1).map((line) => {
    const values = splitRow(line, delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').trim();
    });
    return row;
  });

  return { headers, records, delimiter };
}

function computeLaneName(origin: string, destination: string, vehicleType: string, laneName: string) {
  if (laneName && laneName.trim().length >= 3) return laneName.trim();
  const suffix = vehicleType ? ` (${vehicleType})` : '';
  return `${origin} -> ${destination}${suffix}`;
}

export function parseRowsFromText(text: string): BulkLaneParsedRow[] {
  const parsed = parseDelimited(text);
  return parsed.records.map((rec, idx) => {
    const origin = rec.origin || rec.from || '';
    const destination = rec.destination || rec.to || '';
    const vehicleType = rec.vehicle_type || rec.vehicletype || rec.type || 'FTL';
    const laneName = computeLaneName(origin, destination, vehicleType, rec.lane_name || rec.lanename || '');
    const basePrice = toNumber(rec.base_price_inr || rec.base_price || rec.baseprice || rec.price || '');
    const timerDurationSeconds = toNumber(rec.duration_seconds || rec.duration || rec.timer_duration_seconds || '');
    const minBidDecrement = toNumber(rec.decrement_inr || rec.decrement || '');
    const tatDays = toNumber(rec.tat_days || rec.tat || '');
    const quantity = toNumber(rec.quantity || '');
    const estMonthlyVolume = toNumber(rec.estimated_trips_month || rec.estimated_trips || '');
    const routeDistanceKm = toNumber(rec.route_distance_km || rec.distance_km || rec.distance || '');
    return {
      rowNumber: idx + 2,
      laneName,
      origin,
      destination,
      vehicleType: vehicleType || 'FTL',
      basePrice,
      timerDurationSeconds,
      minBidDecrement: Number.isFinite(minBidDecrement) ? minBidDecrement : undefined,
      tatDays,
      quantity: Number.isFinite(quantity) ? quantity : undefined,
      specialInstructions: rec.special_instructions || rec.instructions || '',
      estMonthlyVolume: Number.isFinite(estMonthlyVolume) ? estMonthlyVolume : undefined,
      routeDistanceKm: Number.isFinite(routeDistanceKm) ? routeDistanceKm : undefined,
    };
  });
}

export async function parseRowsFromFile(file: File): Promise<BulkLaneParsedRow[]> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds limit of 10 MB`);
  }
  const name = file.name.toLowerCase();
  if (!name.endsWith('.csv') && !name.endsWith('.xls') && !name.endsWith('.xlsx') && !name.endsWith('.tsv')) {
    throw new Error('Unsupported file format. Use .xlsx, .xls, .csv, or .tsv');
  }

  if (name.endsWith('.xlsx')) {
    throw new Error('XLSX parsing is unavailable in this environment. Please save as CSV and re-upload.');
  }

  const text = await file.text();
  const rows = parseRowsFromText(text);
  if (rows.length === 0) {
    throw new Error('File is empty or contains no valid data');
  }
  if (rows.length > MAX_ROWS) {
    throw new Error(`File contains ${rows.length} rows. Maximum is ${MAX_ROWS}.`);
  }
  return rows;
}

function findDuplicateIndexes(rows: BulkLaneParsedRow[]) {
  const map = new Map<string, number[]>();
  rows.forEach((row, idx) => {
    const key = row.laneName.trim().toLowerCase();
    if (!key) return;
    const arr = map.get(key) || [];
    arr.push(idx);
    map.set(key, arr);
  });
  return map;
}

export function validateRows(
  rows: BulkLaneParsedRow[],
  existingLaneNames: string[] = [],
): BulkLaneValidationSummary {
  const existing = new Set(existingLaneNames.map((n) => n.trim().toLowerCase()));
  const duplicates = findDuplicateIndexes(rows);

  const results: BulkLaneValidationRow[] = rows.map((row, idx) => {
    const issues: BulkLaneIssue[] = [];
    const laneName = row.laneName?.trim();
    const origin = row.origin?.trim();
    const destination = row.destination?.trim();
    const vtype = row.vehicleType?.trim();

    if (!laneName) issues.push({ field: 'laneName', severity: 'error', message: 'Lane name is required' });
    if (!origin) issues.push({ field: 'origin', severity: 'error', message: 'Origin is required' });
    if (!destination) issues.push({ field: 'destination', severity: 'error', message: 'Destination is required' });
    if (!Number.isFinite(row.basePrice) || row.basePrice <= 0) {
      issues.push({ field: 'basePrice', severity: 'error', message: 'Base price must be a positive number' });
    }
    if (!Number.isFinite(row.timerDurationSeconds) || row.timerDurationSeconds <= 0) {
      issues.push({ field: 'timerDurationSeconds', severity: 'error', message: 'Duration is required and must be positive' });
    }
    if (!Number.isFinite(row.tatDays) || row.tatDays <= 0) {
      issues.push({ field: 'tatDays', severity: 'error', message: 'TAT is required and must be positive' });
    }

    if (Number.isFinite(row.basePrice) && (row.basePrice < 100 || row.basePrice > 1000000)) {
      issues.push({ field: 'basePrice', severity: 'error', message: 'Base price must be between 100 and 10,00,000' });
    }
    if (Number.isFinite(row.timerDurationSeconds) && (row.timerDurationSeconds < 60 || row.timerDurationSeconds > 3600)) {
      issues.push({ field: 'timerDurationSeconds', severity: 'error', message: 'Duration must be between 60 and 3600 seconds' });
    }
    if (Number.isFinite(row.tatDays) && (row.tatDays < 1 || row.tatDays > 30)) {
      issues.push({ field: 'tatDays', severity: 'error', message: 'TAT must be between 1 and 30 days' });
    }

    if (row.timerDurationSeconds >= 60 && row.timerDurationSeconds < 180) {
      issues.push({
        field: 'timerDurationSeconds',
        severity: 'warning',
        message: 'Duration is low (under 3 min). Recommended: 5+ minutes',
      });
    }
    if (row.basePrice > 500000) {
      issues.push({ field: 'basePrice', severity: 'warning', message: 'Base price is very high, please review' });
    }
    if (origin && destination && origin.toLowerCase() === destination.toLowerCase()) {
      issues.push({ field: 'destination', severity: 'warning', message: 'Origin and destination are same' });
    }
    if (laneName && duplicates.get(laneName.toLowerCase())?.length && (duplicates.get(laneName.toLowerCase())?.length || 0) > 1) {
      issues.push({ field: 'laneName', severity: 'warning', message: 'Duplicate lane name detected in upload file' });
    }
    if (laneName && existing.has(laneName.toLowerCase())) {
      issues.push({ field: 'laneName', severity: 'warning', message: 'Duplicate lane exists in auction' });
    }

    if (origin && !MAJOR_CITIES.includes(titleCase(origin))) {
      const suggestion = nearestCity(origin);
      issues.push({
        field: 'origin',
        severity: 'info',
        message: 'Origin is not in standard city list',
        suggestion: suggestion ? `Did you mean "${suggestion}"?` : undefined,
      });
    }
    if (destination && !MAJOR_CITIES.includes(titleCase(destination))) {
      const suggestion = nearestCity(destination);
      issues.push({
        field: 'destination',
        severity: 'info',
        message: 'Destination is not in standard city list',
        suggestion: suggestion ? `Did you mean "${suggestion}"?` : undefined,
      });
    }
    if (vtype && !VEHICLE_TYPES.map((v) => v.toLowerCase()).includes(vtype.toLowerCase())) {
      issues.push({
        field: 'vehicleType',
        severity: 'warning',
        message: 'Vehicle type is uncommon',
        suggestion: `Use one of: ${VEHICLE_TYPES.join(', ')}`,
      });
    }

    const hasError = issues.some((issue) => issue.severity === 'error');
    const hasWarning = issues.some((issue) => issue.severity === 'warning');
    const status: BulkLaneValidationRow['status'] = hasError ? 'error' : hasWarning ? 'warning' : 'valid';

    return {
      rowNumber: row.rowNumber || idx + 2,
      status,
      data: row,
      issues,
    };
  });

  const summary: BulkLaneValidationSummary = {
    totalRows: results.length,
    validRows: results.filter((r) => r.status === 'valid').length,
    warningRows: results.filter((r) => r.status === 'warning').length,
    errorRows: results.filter((r) => r.status === 'error').length,
    rows: results,
  };
  return summary;
}

export function autoFixRows(rows: BulkLaneValidationRow[]): BulkLaneValidationRow[] {
  return rows.map((row) => {
    const data = { ...row.data };
    data.origin = titleCase(data.origin || '');
    data.destination = titleCase(data.destination || '');
    data.vehicleType = data.vehicleType?.trim() || 'FTL';
    data.laneName = computeLaneName(data.origin, data.destination, data.vehicleType, data.laneName);
    if (!Number.isFinite(data.minBidDecrement as number) || (data.minBidDecrement || 0) <= 0) {
      data.minBidDecrement = 100;
    }
    if (!Number.isFinite(data.quantity as number) || (data.quantity || 0) <= 0) data.quantity = 1;
    return { ...row, data };
  });
}

export function toCreateLaneInputs(
  validationRows: BulkLaneValidationRow[],
  startSequenceOrder: number,
  options: BulkLaneImportOptions,
): CreateAuctionRequest['lanes'] {
  const output: CreateAuctionRequest['lanes'] = [];
  const seen = new Set<string>();
  validationRows.forEach((row) => {
    if (row.status === 'error') return;

    const normalizedName = row.data.laneName.trim().toLowerCase();
    let laneName = row.data.laneName.trim();
    if (seen.has(normalizedName)) {
      if (options.duplicateHandling === 'skip') return;
      if (options.duplicateHandling === 'rename') {
        laneName = `${laneName} (${output.length + 1})`;
      }
    }
    seen.add(normalizedName);

    output.push({
      laneName,
      sequenceOrder: startSequenceOrder + output.length,
      basePrice: row.data.basePrice,
      minBidDecrement:
        Number.isFinite(row.data.minBidDecrement as number) && (row.data.minBidDecrement || 0) > 0
          ? (row.data.minBidDecrement as number)
          : options.applyDefaultDecrement,
      timerDurationSeconds: row.data.timerDurationSeconds,
      tatDays: row.data.tatDays,
      truckType: row.data.vehicleType,
      capacity: String(row.data.quantity || 1),
      estMonthlyVolume: row.data.estMonthlyVolume,
    });
  });
  return output;
}

export function downloadTemplateFile(format: 'excel' | 'csv') {
  const headers = [
    'Lane Name*',
    'Origin*',
    'Destination*',
    'Vehicle Type*',
    'Base Price (INR)*',
    'Duration (seconds)*',
    'Decrement (INR)',
    'TAT (Days)*',
    'Quantity',
    'Special Instructions',
    'Estimated Trips/Month',
    'Route Distance (KM)',
  ];
  const rows = [
    ['Mumbai -> Delhi (FTL)', 'Mumbai', 'Delhi', 'FTL', '50000', '300', '100', '4', '1', 'Temperature controlled required', '20', '1450'],
    ['Pune -> Bangalore (FTL)', 'Pune', 'Bengaluru', 'FTL', '45000', '300', '100', '5', '1', '', '18', '840'],
    ['Delhi -> Jaipur (LTL)', 'Delhi', 'Jaipur', 'LTL', '18000', '240', '100', '2', '1', 'Daily dispatch preferred', '30', '280'],
    ['Chennai -> Hyderabad (Container)', 'Chennai', 'Hyderabad', 'Container', '52000', '420', '200', '3', '1', '', '16', '630'],
    ['Ahmedabad -> Mumbai (FTL)', 'Ahmedabad', 'Mumbai', 'FTL', '33000', '300', '100', '2', '1', '', '25', '525'],
  ];

  const delimiter = format === 'csv' ? ',' : '\t';
  const content = [headers, ...rows]
    .map((cols) =>
      cols
        .map((c) =>
          String(c).includes(delimiter) || String(c).includes('"')
            ? `"${String(c).replace(/"/g, '""')}"`
            : String(c),
        )
        .join(delimiter),
    )
    .join('\n');

  const mime =
    format === 'csv'
      ? 'text/csv;charset=utf-8'
      : 'application/vnd.ms-excel;charset=utf-8';
  const ext = format === 'csv' ? 'csv' : 'xls';
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `optimile-lanes-template.${ext}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadErrorReport(summary: BulkLaneValidationSummary) {
  const headers = ['Row', 'Status', 'Lane Name', 'Origin', 'Destination', 'Base Price', 'Duration', 'TAT', 'Issues'];
  const rows = summary.rows.map((row) => [
    row.rowNumber,
    row.status.toUpperCase(),
    row.data.laneName,
    row.data.origin,
    row.data.destination,
    row.data.basePrice,
    row.data.timerDurationSeconds,
    row.data.tatDays,
    row.issues.map((i) => `${i.severity.toUpperCase()}: ${i.message}${i.suggestion ? ` (${i.suggestion})` : ''}`).join(' | '),
  ]);
  const csv = [headers, ...rows]
    .map((cols) =>
      cols
        .map((c) =>
          String(c).includes(',') || String(c).includes('"') || String(c).includes('\n')
            ? `"${String(c).replace(/"/g, '""')}"`
            : String(c),
        )
        .join(','),
    )
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'bulk-lane-upload-error-report.csv';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

