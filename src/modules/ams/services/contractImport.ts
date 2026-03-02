import { auctionEngine } from './mockBackend';
import { vendorManagement } from './vendorManagement';

export interface ContractImportLaneInput {
  laneName: string;
  origin: string;
  destination: string;
  ratePerTrip: number;
  tatDays: number;
  vehicleType: string;
}

export interface ContractImportCandidate {
  sourceRows: number[];
  contractId?: string;
  vendorId?: string;
  vendorName: string;
  contractType: string;
  startDate: string; // DD/MM/YYYY
  endDate: string; // DD/MM/YYYY
  contractValue: number;
  paymentTerms: string;
  clientName?: string;
  signingDate?: string;
  contractStatus?: string;
  performanceBondAmount?: number;
  specialTerms?: string;
  contactPerson?: string;
  lanes: ContractImportLaneInput[];
}

export interface ContractImportIssue {
  field: string;
  severity: 'error' | 'warning';
  message: string;
  suggestion?: string;
}

export interface ContractImportValidationRow {
  key: string;
  status: 'valid' | 'warning' | 'error';
  data: ContractImportCandidate;
  issues: ContractImportIssue[];
}

export interface ContractImportValidation {
  totalContracts: number;
  validContracts: number;
  warningContracts: number;
  errorContracts: number;
  rows: ContractImportValidationRow[];
}

export interface ContractImportOptions {
  createVendorsIfMissing: boolean;
  autoGenerateMissingContractIds: boolean;
  linkToExistingAuctions: boolean;
  statusOverride: 'DRAFT' | 'ACTIVE';
  duplicateHandling: 'skip' | 'update';
  generateDocuments: boolean;
  sendNotifications: boolean;
}

const REQUIRED_HEADERS = [
  'Contract ID',
  'Vendor Name',
  'Vendor ID',
  'Contract Type',
  'Start Date',
  'End Date',
  'Contract Value',
  'Payment Terms',
  'Lane Name',
  'Origin',
  'Destination',
  'Rate per Trip',
  'TAT Days',
  'Vehicle Type',
];

function normalizeHeader(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
}

function splitCsvLine(line: string) {
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

function parseRows(text: string) {
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd()).filter(Boolean);
  if (lines.length < 2) return [] as Array<Record<string, string>>;
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const headerLine = delimiter === '\t' ? lines[0].split('\t') : splitCsvLine(lines[0]);
  const headers = headerLine.map((h) => normalizeHeader(h));

  return lines.slice(1).map((line) => {
    const parts = delimiter === '\t' ? line.split('\t') : splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (parts[i] || '').trim();
    });
    return row;
  });
}

function toNumber(value: string): number | undefined {
  const n = Number(String(value || '').replace(/[₹,\s]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function parseDateDDMMYYYY(value: string): { iso?: string; error?: string } {
  const v = (value || '').trim();
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (!m) return { error: 'Invalid date format (use DD/MM/YYYY)' };
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (dt.getUTCFullYear() !== yyyy || dt.getUTCMonth() !== mm - 1 || dt.getUTCDate() !== dd) {
    return { error: 'Invalid calendar date' };
  }
  return { iso: `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}` };
}

function buildKey(rec: Record<string, string>, rowIndex: number) {
  const id = (rec.contract_id || '').trim();
  if (id) return `id:${id}`;
  const vendor = (rec.vendor_id || rec.vendor_name || '').trim();
  const start = (rec.start_date || '').trim();
  const end = (rec.end_date || '').trim();
  const type = (rec.contract_type || '').trim();
  return `row:${rowIndex}|${vendor}|${start}|${end}|${type}`;
}

class ContractImportService {
  downloadTemplate(format: 'excel' | 'csv') {
    const headers = [
      'Contract ID',
      'Vendor Name',
      'Vendor ID',
      'Contract Type',
      'Start Date',
      'End Date',
      'Contract Value',
      'Payment Terms',
      'Lane Name',
      'Origin',
      'Destination',
      'Rate per Trip',
      'TAT Days',
      'Vehicle Type',
      'Client Name',
      'Signing Date',
      'Contract Status',
      'Performance Bond Amount',
      'Special Terms',
      'Contact Person',
    ];

    const sample = [
      ['CON-20260211-001', 'Swift Logistics', 'V-089', 'FTL', '11/02/2026', '11/05/2026', '864000', 'Net 30 days', 'Mumbai - Delhi (FTL)', 'Mumbai', 'Delhi', '43200', '4', 'FTL', 'Optimile Retail', '11/02/2026', 'Active', '50000', 'GPS tracking mandatory', 'Rajesh Kumar'],
      ['CON-20260211-001', 'Swift Logistics', 'V-089', 'FTL', '11/02/2026', '11/05/2026', '864000', 'Net 30 days', 'Delhi - Jaipur (FTL)', 'Delhi', 'Jaipur', '28000', '2', 'FTL', 'Optimile Retail', '11/02/2026', 'Active', '50000', 'GPS tracking mandatory', 'Rajesh Kumar'],
      ['CON-20260211-002', 'Elite Transport', 'V-090', 'LTL', '12/02/2026', '12/08/2026', '1250000', 'Net 45 days', 'Bangalore - Chennai (LTL)', 'Bangalore', 'Chennai', '21000', '2', 'LTL', 'Optimile Foods', '12/02/2026', 'Draft', '', 'Temperature control required', 'Priya Sharma'],
    ];

    const csv = [headers, ...sample]
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell);
            return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(','),
      )
      .join('\n');

    const ext = format === 'excel' ? 'xls' : 'csv';
    const mime = format === 'excel' ? 'application/vnd.ms-excel;charset=utf-8' : 'text/csv;charset=utf-8';
    const blob = new Blob([csv], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract_import_template.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async parseFile(file: File) {
    const lower = file.name.toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].some((ext) => lower.endsWith(ext))) {
      throw new Error('Invalid file format. Use .xlsx, .xls, or .csv');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File exceeds 10 MB limit');
    }
    if (lower.endsWith('.xlsx')) {
      throw new Error('XLSX parsing is unavailable in this environment. Save as CSV and upload again.');
    }
    const text = await file.text();
    return this.parseText(text);
  }

  parseText(text: string) {
    const records = parseRows(text);
    if (records.length > 200) {
      throw new Error(`File has ${records.length} rows. Maximum allowed is 200 contract rows.`);
    }
    return records;
  }

  toCandidates(records: Array<Record<string, string>>) {
    const grouped = new Map<string, ContractImportCandidate>();
    const expected = new Set(REQUIRED_HEADERS.map((h) => normalizeHeader(h)));
    const first = records[0];
    if (first) {
      const keys = Object.keys(first);
      const hasCore = ['vendor_name', 'contract_type', 'start_date', 'end_date', 'contract_value', 'payment_terms'].every((k) => keys.includes(k));
      if (!hasCore) {
        throw new Error('Missing required columns in template. Please use the provided template headers.');
      }
    }

    records.forEach((rec, idx) => {
      const rowNumber = idx + 2;
      const key = buildKey(rec, rowNumber);
      const current = grouped.get(key);
      const laneName = rec.lane_name || '';
      const lane: ContractImportLaneInput | null = laneName || rec.origin || rec.destination || rec.rate_per_trip || rec.tat_days || rec.vehicle_type
        ? {
            laneName,
            origin: rec.origin || '',
            destination: rec.destination || '',
            ratePerTrip: toNumber(rec.rate_per_trip || '') || 0,
            tatDays: toNumber(rec.tat_days || '') || 0,
            vehicleType: rec.vehicle_type || '',
          }
        : null;

      if (!current) {
        grouped.set(key, {
          sourceRows: [rowNumber],
          contractId: rec.contract_id || undefined,
          vendorName: rec.vendor_name || '',
          vendorId: rec.vendor_id || undefined,
          contractType: rec.contract_type || '',
          startDate: rec.start_date || '',
          endDate: rec.end_date || '',
          contractValue: toNumber(rec.contract_value || '') || 0,
          paymentTerms: rec.payment_terms || '',
          clientName: rec.client_name || '',
          signingDate: rec.signing_date || '',
          contractStatus: rec.contract_status || '',
          performanceBondAmount: toNumber(rec.performance_bond_amount || ''),
          specialTerms: rec.special_terms || '',
          contactPerson: rec.contact_person || '',
          lanes: lane ? [lane] : [],
        });
      } else {
        current.sourceRows.push(rowNumber);
        if (lane) current.lanes.push(lane);
      }
    });
    return Array.from(grouped.entries()).map(([key, data]) => ({ key, data }));
  }

  validateCandidates(candidates: Array<{ key: string; data: ContractImportCandidate }>, options: ContractImportOptions): ContractImportValidation {
    const vendors = vendorManagement.getSnapshot().vendors;
    const vendorById = new Map(vendors.map((v) => [v.vendorId.toLowerCase(), v]));
    const vendorByName = new Map(vendors.map((v) => [v.companyName.toLowerCase(), v]));
    const existingContracts = new Set(auctionEngine.getContracts().map((c) => c.id.toLowerCase()));

    const rows: ContractImportValidationRow[] = candidates.map(({ key, data }) => {
      const issues: ContractImportIssue[] = [];

      if (!data.contractId && !options.autoGenerateMissingContractIds) {
        issues.push({ field: 'contractId', severity: 'error', message: 'Contract ID is required', suggestion: 'Enable auto-generate missing contract IDs.' });
      }
      if (!data.vendorName && !data.vendorId) {
        issues.push({ field: 'vendorName', severity: 'error', message: 'Vendor Name or Vendor ID is required' });
      }
      if (!data.contractType) issues.push({ field: 'contractType', severity: 'error', message: 'Contract Type is required' });
      if (!data.startDate) issues.push({ field: 'startDate', severity: 'error', message: 'Start Date is required' });
      if (!data.endDate) issues.push({ field: 'endDate', severity: 'error', message: 'End Date is required' });
      if (!data.paymentTerms) issues.push({ field: 'paymentTerms', severity: 'error', message: 'Payment Terms are required' });
      if (!data.contractValue || data.contractValue <= 0) {
        issues.push({ field: 'contractValue', severity: 'error', message: 'Invalid contract value (must be number > 0)' });
      }

      const start = parseDateDDMMYYYY(data.startDate);
      const end = parseDateDDMMYYYY(data.endDate);
      if (start.error) issues.push({ field: 'startDate', severity: 'error', message: start.error, suggestion: 'Example: 11/02/2026' });
      if (end.error) issues.push({ field: 'endDate', severity: 'error', message: end.error, suggestion: 'Example: 11/05/2026' });
      if (start.iso && end.iso && end.iso < start.iso) {
        issues.push({ field: 'endDate', severity: 'error', message: 'End date cannot be before start date' });
      }
      if (end.iso && end.iso < new Date().toISOString().slice(0, 10)) {
        issues.push({ field: 'endDate', severity: 'warning', message: 'Contract already expired' });
      }

      const vendor = data.vendorId
        ? vendorById.get(data.vendorId.toLowerCase())
        : vendorByName.get(data.vendorName.toLowerCase());
      if (!vendor) {
        issues.push({
          field: 'vendorName',
          severity: options.createVendorsIfMissing ? 'warning' : 'error',
          message: 'Vendor not found in system',
          suggestion: options.createVendorsIfMissing ? 'Vendor will be auto-created during import.' : 'Enable auto-create vendors or fix vendor mapping.',
        });
      } else if (vendor.status !== 'ACTIVE') {
        issues.push({ field: 'vendorId', severity: 'warning', message: 'Vendor status is inactive' });
      }

      if (data.contractId && existingContracts.has(data.contractId.toLowerCase()) && options.duplicateHandling === 'skip') {
        issues.push({ field: 'contractId', severity: 'error', message: 'Duplicate contract ID already exists' });
      }
      if (data.contractId && existingContracts.has(data.contractId.toLowerCase()) && options.duplicateHandling === 'update') {
        issues.push({ field: 'contractId', severity: 'warning', message: 'Duplicate contract ID will update existing contract' });
      }

      if (data.lanes.length === 0) {
        issues.push({ field: 'laneName', severity: 'warning', message: 'Missing lanes: contract will be imported without lanes' });
      } else {
        data.lanes.forEach((lane, idx) => {
          const suffix = ` (lane ${idx + 1})`;
          if (!lane.laneName) issues.push({ field: 'laneName', severity: 'error', message: `Lane Name required${suffix}` });
          if (!lane.origin) issues.push({ field: 'origin', severity: 'error', message: `Origin required${suffix}` });
          if (!lane.destination) issues.push({ field: 'destination', severity: 'error', message: `Destination required${suffix}` });
          if (!lane.ratePerTrip || lane.ratePerTrip <= 0) issues.push({ field: 'ratePerTrip', severity: 'error', message: `Rate per Trip must be > 0${suffix}` });
          if (!lane.tatDays || lane.tatDays <= 0) issues.push({ field: 'tatDays', severity: 'error', message: `TAT Days must be > 0${suffix}` });
          if (!lane.vehicleType) issues.push({ field: 'vehicleType', severity: 'error', message: `Vehicle Type required${suffix}` });
        });
      }

      const hasError = issues.some((i) => i.severity === 'error');
      const hasWarning = issues.some((i) => i.severity === 'warning');
      return {
        key,
        data,
        issues,
        status: hasError ? 'error' : hasWarning ? 'warning' : 'valid',
      };
    });

    return {
      totalContracts: rows.length,
      validContracts: rows.filter((r) => r.status === 'valid').length,
      warningContracts: rows.filter((r) => r.status === 'warning').length,
      errorContracts: rows.filter((r) => r.status === 'error').length,
      rows,
    };
  }

  importContracts(validationRows: ContractImportValidationRow[], options: ContractImportOptions, userId: string) {
    const vendorSnapshot = vendorManagement.getSnapshot();
    const vendorByName = new Map(vendorSnapshot.vendors.map((v) => [v.companyName.toLowerCase(), v.vendorId]));
    const vendorById = new Map(vendorSnapshot.vendors.map((v) => [v.vendorId.toLowerCase(), v.vendorId]));

    const rows = validationRows
      .filter((r) => r.status !== 'error')
      .map((r) => ({ ...r.data }));

    if (options.createVendorsIfMissing) {
      rows.forEach((row) => {
        const existingId = row.vendorId ? vendorById.get(row.vendorId.toLowerCase()) : vendorByName.get(row.vendorName.toLowerCase());
        if (existingId) {
          row.vendorId = existingId;
          return;
        }
        const appId = vendorManagement.submitApplication({
          companyInfo: {
            companyName: row.vendorName || 'Imported Vendor',
            legalEntityName: row.vendorName || 'Imported Vendor',
            companyType: 'Private Limited',
            yearEstablished: 2018,
            website: '',
            linkedin: '',
          },
          contact: {
            primaryContactName: row.contactPerson || row.vendorName || 'Contact',
            designation: 'Primary Contact',
            email: `${(row.vendorName || 'vendor').toLowerCase().replace(/[^a-z0-9]/g, '')}@imported.local`,
            mobile: '9000000000',
            alternateContact: '',
            registeredAddress: 'Imported Address',
            officeAddress: 'Imported Address',
            state: 'Maharashtra',
            pincode: '400001',
          },
          business: {
            fleetOwned: 0,
            fleetLeased: 0,
            vehicleTypes: ['FTL'],
            serviceAreas: ['Pan India'],
            routesSpecialized: 'Imported',
            avgMonthlyCapacity: 10,
          },
          financial: {
            annualTurnover: row.contractValue || 0,
            paymentTerms: row.paymentTerms || 'Net 30 days',
          },
          references: [],
          documents: [
            { type: 'PAN', status: 'NOT_UPLOADED' },
            { type: 'GST', status: 'NOT_UPLOADED' },
            { type: 'INCORPORATION', status: 'NOT_UPLOADED' },
            { type: 'BANK', status: 'NOT_UPLOADED' },
            { type: 'RC', status: 'NOT_UPLOADED' },
            { type: 'INSURANCE', status: 'NOT_UPLOADED' },
            { type: 'GPS', status: 'NOT_UPLOADED' },
            { type: 'REFERENCES', status: 'NOT_UPLOADED' },
          ],
        });
        const newVendorId = vendorManagement.approveApplication(appId, userId);
        row.vendorId = newVendorId;
      });
    }

    return auctionEngine.bulkImportContracts(
      rows.map((row) => ({
        contractId: row.contractId,
        vendorId: row.vendorId,
        vendorName: row.vendorName,
        contractType: row.contractType,
        startDate: parseDateDDMMYYYY(row.startDate).iso || row.startDate,
        endDate: parseDateDDMMYYYY(row.endDate).iso || row.endDate,
        contractValue: row.contractValue,
        paymentTerms: row.paymentTerms,
        clientName: row.clientName,
        signingDate: row.signingDate ? (parseDateDDMMYYYY(row.signingDate).iso || undefined) : undefined,
        contractStatus: row.contractStatus,
        performanceBondAmount: row.performanceBondAmount,
        specialTerms: row.specialTerms,
        contactPerson: row.contactPerson,
        lanes: row.lanes,
      })),
      {
        duplicateHandling: options.duplicateHandling,
        autoGenerateIds: options.autoGenerateMissingContractIds,
        linkExistingAuctions: options.linkToExistingAuctions,
        defaultStatus: options.statusOverride,
        createDocuments: options.generateDocuments,
        sendNotifications: options.sendNotifications,
      },
      userId,
    );
  }
}

export const contractImportService = new ContractImportService();

