import { vendorManagement } from './vendorManagement';

export const BULK_VENDOR_THEME = {
  successBg: 'bg-green-50',
  warningBg: 'bg-amber-50',
  errorBg: 'bg-red-50',
  infoBg: 'bg-blue-50',
  readyBg: 'bg-emerald-50',
  inactiveBg: 'bg-slate-100',
  successText: 'text-green-700',
  warningText: 'text-amber-700',
  errorText: 'text-red-700',
  infoText: 'text-blue-700',
};

export interface VendorImportRow {
  rowNumber: number;
  companyName: string;
  legalEntityName: string;
  contactPersonName: string;
  email: string;
  phone: string;
  companyType: string;
  pan: string;
  gstin: string;
  registeredAddress: string;
  state: string;
  pincode: string;
  alternatePhone?: string;
  website?: string;
  fleetOwned?: number;
  fleetLeased?: number;
  serviceAreas?: string[];
  annualTurnover?: number;
  paymentTermsPreference?: string;
  reference1Name?: string;
  reference1Email?: string;
  reference1Phone?: string;
  reference2Name?: string;
  reference2Email?: string;
  reference2Phone?: string;
}

export interface VendorImportIssue {
  field: keyof VendorImportRow | 'row';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface VendorImportValidationRow {
  rowNumber: number;
  status: 'valid' | 'warning' | 'error';
  data: VendorImportRow;
  issues: VendorImportIssue[];
}

export interface VendorImportValidationResult {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  readyToImport: number;
  rows: VendorImportValidationRow[];
}

export interface VendorImportSettings {
  vendorStatus: 'active' | 'pending' | 'inactive';
  sendCredentials: boolean;
  sendSms: boolean;
  requireApproval: boolean;
  notifyAdmin: boolean;
  notifyProcurement: boolean;
  skipDuplicates: boolean;
  validateAgainstDatabase: boolean;
}

export interface VendorImportRun {
  importId: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: number;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'partial';
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  importedRows: number;
  failedRows: number;
  durationSec: number;
  importedVendorIds: string[];
  failures: Array<{ rowNumber: number; companyName: string; reason: string }>;
}

const STORAGE_HISTORY = 'optimile-vendor-import-history-v1';

const REQUIRED_FIELDS: Array<keyof VendorImportRow> = [
  'companyName',
  'legalEntityName',
  'contactPersonName',
  'email',
  'phone',
  'companyType',
  'pan',
  'gstin',
  'registeredAddress',
  'state',
  'pincode',
];

const COMPANY_TYPES = ['Private Limited', 'Public Limited', 'Partnership', 'Proprietorship', 'LLP'];

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/;
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_REGEX = /^[6-9][0-9]{9}$/;
const PIN_REGEX = /^[0-9]{6}$/;

const TEMPLATE_HEADERS = [
  'Company Name*',
  'Legal Entity Name*',
  'Contact Person Name*',
  'Email*',
  'Phone*',
  'Company Type*',
  'PAN Number*',
  'GST Number*',
  'Registered Address*',
  'State*',
  'PIN Code*',
  'Alternate Phone',
  'Website',
  'Fleet Size (Owned)',
  'Fleet Size (Leased)',
  'Service Areas',
  'Annual Turnover',
  'Payment Terms Preference',
  'Reference 1 Name',
  'Reference 1 Email',
  'Reference 1 Phone',
  'Reference 2 Name',
  'Reference 2 Email',
  'Reference 2 Phone',
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

function parseText(text: string): Array<Record<string, string>> {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length < 2) return [];
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const headers = (delimiter === '\t' ? lines[0].split('\t') : splitCsvLine(lines[0])).map((h) => normalizeHeader(h));

  return lines.slice(1).map((line) => {
    const values = delimiter === '\t' ? line.split('\t') : splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || '').trim();
    });
    return row;
  });
}

function toNumber(v: string) {
  const num = Number(String(v || '').replace(/[₹,\s]/g, ''));
  return Number.isFinite(num) ? num : undefined;
}

function mapRecord(rec: Record<string, string>, rowNumber: number): VendorImportRow {
  const serviceAreasRaw = rec.service_areas || rec.serviceareas || '';
  const serviceAreas = serviceAreasRaw
    ? serviceAreasRaw
        .split(/[|,]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  return {
    rowNumber,
    companyName: rec.company_name || rec.companyname || '',
    legalEntityName: rec.legal_entity_name || rec.legalentityname || '',
    contactPersonName: rec.contact_person_name || rec.contactpersonname || rec.contact_name || '',
    email: rec.email || '',
    phone: String(rec.phone || rec.mobile || '').replace(/[^0-9]/g, ''),
    companyType: rec.company_type || rec.companytype || '',
    pan: (rec.pan_number || rec.pan || '').toUpperCase(),
    gstin: (rec.gst_number || rec.gstin || '').toUpperCase(),
    registeredAddress: rec.registered_address || rec.address || '',
    state: rec.state || '',
    pincode: String(rec.pin_code || rec.pincode || '').replace(/[^0-9]/g, ''),
    alternatePhone: String(rec.alternate_phone || rec.alternate_contact || '').replace(/[^0-9]/g, ''),
    website: rec.website || rec.company_website || '',
    fleetOwned: toNumber(rec.fleet_size_owned || rec.fleet_owned || ''),
    fleetLeased: toNumber(rec.fleet_size_leased || rec.fleet_leased || ''),
    serviceAreas,
    annualTurnover: toNumber(rec.annual_turnover || rec.turnover || ''),
    paymentTermsPreference: rec.payment_terms_preference || rec.payment_terms || '',
    reference1Name: rec.reference_1_name || rec.reference1_name || '',
    reference1Email: rec.reference_1_email || rec.reference1_email || '',
    reference1Phone: String(rec.reference_1_phone || rec.reference1_phone || '').replace(/[^0-9]/g, ''),
    reference2Name: rec.reference_2_name || rec.reference2_name || '',
    reference2Email: rec.reference_2_email || rec.reference2_email || '',
    reference2Phone: String(rec.reference_2_phone || rec.reference2_phone || '').replace(/[^0-9]/g, ''),
  };
}

function validateRow(
  row: VendorImportRow,
  idx: number,
  context: {
    existingEmails: Set<string>;
    existingPans: Set<string>;
    existingGstins: Set<string>;
    uploadEmailSeen: Map<string, number>;
    uploadPanSeen: Map<string, number>;
    uploadGstinSeen: Map<string, number>;
  },
): VendorImportValidationRow {
  const issues: VendorImportIssue[] = [];

  REQUIRED_FIELDS.forEach((field) => {
    if (!String(row[field] || '').trim()) {
      issues.push({ field, severity: 'error', message: `${String(field)} is required` });
    }
  });

  if (row.email && !EMAIL_REGEX.test(row.email)) {
    issues.push({ field: 'email', severity: 'error', message: 'Invalid email format', suggestion: 'Use name@domain.com format' });
  }
  if (row.phone && !PHONE_REGEX.test(row.phone)) {
    issues.push({ field: 'phone', severity: 'error', message: 'Phone must be 10 digits and start with 6-9', suggestion: 'Example: 9876543210' });
  }
  if (row.pan && !PAN_REGEX.test(row.pan)) {
    issues.push({ field: 'pan', severity: 'error', message: 'Invalid PAN format', suggestion: 'Expected format: AAAAA9999A' });
  }
  if (row.gstin && !GST_REGEX.test(row.gstin)) {
    issues.push({ field: 'gstin', severity: 'error', message: 'Invalid GST format', suggestion: 'GST must be 15 alphanumeric characters' });
  }
  if (row.pincode && !PIN_REGEX.test(row.pincode)) {
    issues.push({ field: 'pincode', severity: 'error', message: 'PIN code must be 6 digits' });
  }

  if (row.companyType && !COMPANY_TYPES.includes(row.companyType)) {
    issues.push({ field: 'companyType', severity: 'warning', message: `Unknown company type: ${row.companyType}`, suggestion: `Try one of: ${COMPANY_TYPES.join(', ')}` });
  }

  if (!row.gstin) {
    issues.push({ field: 'gstin', severity: 'warning', message: 'GST number missing - can be added later' });
  }

  if (row.email) {
    const emailKey = row.email.toLowerCase();
    if (context.existingEmails.has(emailKey)) {
      issues.push({ field: 'email', severity: 'error', message: 'Vendor with same email already exists in system' });
    }
    if (context.uploadEmailSeen.has(emailKey)) {
      issues.push({ field: 'email', severity: 'warning', message: `Duplicate email in upload (row ${context.uploadEmailSeen.get(emailKey)})` });
    } else {
      context.uploadEmailSeen.set(emailKey, idx + 2);
    }
  }

  if (row.pan) {
    if (context.existingPans.has(row.pan)) {
      issues.push({ field: 'pan', severity: 'error', message: 'Vendor with same PAN already exists in system' });
    }
    if (context.uploadPanSeen.has(row.pan)) {
      issues.push({ field: 'pan', severity: 'warning', message: `Duplicate PAN in upload (row ${context.uploadPanSeen.get(row.pan)})` });
    } else {
      context.uploadPanSeen.set(row.pan, idx + 2);
    }
  }

  if (row.gstin) {
    if (context.existingGstins.has(row.gstin)) {
      issues.push({ field: 'gstin', severity: 'error', message: 'Vendor with same GST already exists in system' });
    }
    if (context.uploadGstinSeen.has(row.gstin)) {
      issues.push({ field: 'gstin', severity: 'warning', message: `Duplicate GST in upload (row ${context.uploadGstinSeen.get(row.gstin)})` });
    } else {
      context.uploadGstinSeen.set(row.gstin, idx + 2);
    }
  }

  if (row.website && !/^https?:\/\//.test(row.website)) {
    issues.push({ field: 'website', severity: 'info', message: 'Website should include http:// or https://' });
  }

  if ((row.fleetOwned || 0) + (row.fleetLeased || 0) > 2000) {
    issues.push({ field: 'fleetOwned', severity: 'warning', message: 'Very large fleet size detected, please review' });
  }

  const hasError = issues.some((i) => i.severity === 'error');
  const hasWarn = issues.some((i) => i.severity === 'warning');
  const status: VendorImportValidationRow['status'] = hasError ? 'error' : hasWarn ? 'warning' : 'valid';

  return {
    rowNumber: row.rowNumber,
    status,
    data: row,
    issues,
  };
}

class VendorBulkImportService {
  private history: VendorImportRun[] = [];

  constructor() {
    this.history = this.loadHistory();
  }

  private loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_HISTORY);
      if (!raw) return [];
      return JSON.parse(raw) as VendorImportRun[];
    } catch {
      return [];
    }
  }

  private saveHistory() {
    localStorage.setItem(STORAGE_HISTORY, JSON.stringify(this.history));
  }

  getHistory() {
    return [...this.history].sort((a, b) => b.uploadedAt - a.uploadedAt);
  }

  parseFromText(text: string): VendorImportRow[] {
    const records = parseText(text);
    return records.map((rec, idx) => mapRecord(rec, idx + 2));
  }

  async parseFromFile(file: File): Promise<VendorImportRow[]> {
    const lower = file.name.toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].some((ext) => lower.endsWith(ext))) {
      throw new Error('Unsupported format. Use .xlsx, .xls, or .csv');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds 10 MB`);
    }
    if (lower.endsWith('.xlsx')) {
      throw new Error('XLSX parsing is not available here. Please save as CSV and re-upload.');
    }

    const text = await file.text();
    const rows = this.parseFromText(text);
    if (rows.length === 0) throw new Error('No data found in file');
    if (rows.length > 500) throw new Error(`File contains ${rows.length} rows. Maximum is 500.`);
    return rows;
  }

  validateRows(rows: VendorImportRow[]): VendorImportValidationResult {
    const snapshot = vendorManagement.getSnapshot();
    const existingEmails = new Set<string>([
      ...snapshot.applications.map((a) => a.contact.email.toLowerCase()),
      ...snapshot.vendors.map((v) => v.email.toLowerCase()),
    ]);
    const existingPans = new Set<string>(
      snapshot.applications
        .map((a) => {
          const panDoc = a.documents.find((d) => d.type === 'PAN');
          return (panDoc?.fileName || '').toUpperCase();
        })
        .filter(Boolean),
    );
    const existingGstins = new Set<string>(
      snapshot.applications
        .map((a) => {
          const gstDoc = a.documents.find((d) => d.type === 'GST');
          return (gstDoc?.fileName || '').toUpperCase();
        })
        .filter(Boolean),
    );

    const context = {
      existingEmails,
      existingPans,
      existingGstins,
      uploadEmailSeen: new Map<string, number>(),
      uploadPanSeen: new Map<string, number>(),
      uploadGstinSeen: new Map<string, number>(),
    };

    const validated = rows.map((row, idx) => validateRow(row, idx, context));
    return {
      totalRows: validated.length,
      validRows: validated.filter((v) => v.status === 'valid').length,
      warningRows: validated.filter((v) => v.status === 'warning').length,
      errorRows: validated.filter((v) => v.status === 'error').length,
      readyToImport: validated.filter((v) => v.status !== 'error').length,
      rows: validated,
    };
  }

  applyAutoFixes(rows: VendorImportValidationRow[]): VendorImportValidationRow[] {
    return rows.map((row) => {
      const next = { ...row.data };
      next.companyName = next.companyName.trim();
      next.legalEntityName = next.legalEntityName.trim() || next.companyName;
      next.contactPersonName = toTitleCase(next.contactPersonName);
      next.companyType = normalizeCompanyType(next.companyType);
      next.email = next.email.trim().toLowerCase();
      next.phone = normalizePhone(next.phone);
      next.alternatePhone = normalizePhone(next.alternatePhone || '');
      next.pan = next.pan.toUpperCase();
      next.gstin = next.gstin.toUpperCase();
      next.state = toTitleCase(next.state);
      return { ...row, data: next };
    });
  }

  executeImport(
    fileName: string,
    rows: VendorImportValidationRow[],
    userId: string,
    settings: VendorImportSettings,
  ) {
    const start = Date.now();
    const validRows = rows.filter((r) => r.status !== 'error');
    const failures: VendorImportRun['failures'] = [];
    const importedVendorIds: string[] = [];

    validRows.forEach((row) => {
      try {
        const d = row.data;
        const docs = [
          { type: 'PAN', status: 'NOT_UPLOADED', fileName: d.pan },
          { type: 'GST', status: d.gstin ? 'NOT_UPLOADED' : 'NOT_UPLOADED', fileName: d.gstin || '' },
          { type: 'INCORPORATION', status: 'NOT_UPLOADED' },
          { type: 'BANK', status: 'NOT_UPLOADED' },
          { type: 'RC', status: 'NOT_UPLOADED' },
          { type: 'INSURANCE', status: 'NOT_UPLOADED' },
          { type: 'GPS', status: 'NOT_UPLOADED' },
          { type: 'REFERENCES', status: 'NOT_UPLOADED' },
        ] as any;

        const appId = vendorManagement.submitApplication({
          companyInfo: {
            companyName: d.companyName,
            legalEntityName: d.legalEntityName || d.companyName,
            companyType: d.companyType || 'Private Limited',
            yearEstablished: 2018,
            website: d.website,
            linkedin: '',
          },
          contact: {
            primaryContactName: d.contactPersonName,
            designation: 'Point of Contact',
            email: d.email,
            mobile: d.phone,
            alternateContact: d.alternatePhone || '',
            registeredAddress: d.registeredAddress,
            officeAddress: d.registeredAddress,
            state: d.state,
            pincode: d.pincode,
          },
          business: {
            fleetOwned: d.fleetOwned || 0,
            fleetLeased: d.fleetLeased || 0,
            vehicleTypes: ['FTL'],
            serviceAreas: d.serviceAreas && d.serviceAreas.length > 0 ? d.serviceAreas : ['North India'],
            routesSpecialized: '',
            avgMonthlyCapacity: 20,
          },
          financial: {
            annualTurnover: d.annualTurnover || 0,
            paymentTerms: d.paymentTermsPreference || 'Net 30 days',
          },
          references: [
            {
              clientName: d.reference1Name || '',
              contactPerson: d.reference1Name || '',
              phone: d.reference1Phone || '',
              email: d.reference1Email || '',
            },
            {
              clientName: d.reference2Name || '',
              contactPerson: d.reference2Name || '',
              phone: d.reference2Phone || '',
              email: d.reference2Email || '',
            },
          ],
          documents: docs,
        });

        if (settings.vendorStatus === 'active' && !settings.requireApproval) {
          try {
            const vendorId = vendorManagement.approveApplication(appId, userId);
            importedVendorIds.push(vendorId);
          } catch {
            // keep as pending if approval fails
          }
        }

        if (settings.vendorStatus === 'inactive' && !settings.requireApproval) {
          try {
            const vendorId = vendorManagement.approveApplication(appId, userId);
            vendorManagement.changeVendorStatus(vendorId, 'INACTIVE', userId, 'Imported as inactive');
            importedVendorIds.push(vendorId);
          } catch {
            // keep pending
          }
        }
      } catch (error) {
        failures.push({
          rowNumber: row.rowNumber,
          companyName: row.data.companyName,
          reason: (error as Error).message,
        });
      }
    });

    const importRun: VendorImportRun = {
      importId: `IMP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(this.history.length + 1).padStart(3, '0')}`,
      fileName,
      uploadedBy: userId,
      uploadedAt: Date.now(),
      status: failures.length === 0 ? 'completed' : failures.length < validRows.length ? 'partial' : 'failed',
      totalRows: rows.length,
      validRows: rows.filter((r) => r.status === 'valid').length,
      warningRows: rows.filter((r) => r.status === 'warning').length,
      errorRows: rows.filter((r) => r.status === 'error').length,
      importedRows: validRows.length - failures.length,
      failedRows: failures.length,
      durationSec: Number(((Date.now() - start) / 1000).toFixed(1)),
      importedVendorIds,
      failures,
    };

    this.history.unshift(importRun);
    this.saveHistory();
    return importRun;
  }

  downloadTemplate(format: 'excel' | 'csv') {
    const sampleRows = [
      ['Swift Logistics Pvt Ltd', 'Swift Logistics Pvt Ltd', 'Rajesh Kumar', 'rajesh@swiftlog.com', '9876543210', 'Private Limited', 'AAAPL1234C', '27AAAPL1234C1Z5', 'Andheri East, Mumbai', 'Maharashtra', '400093', '', 'https://swiftlog.com', '45', '10', 'North India,West India', '25000000', 'Net 30 days', 'ABC Corp', 'contact@abccorp.com', '9876501234', 'XYZ Retail', 'ops@xyzretail.com', '9876501235'],
      ['Elite Transport LLP', 'Elite Transport LLP', 'Priya Sharma', 'priya@elite.in', '9823456789', 'LLP', 'BBBMT5678D', '29BBBMT5678D1Z4', 'Whitefield, Bengaluru', 'Karnataka', '560066', '', 'https://elite.in', '30', '12', 'South India,Pan India', '18000000', 'Net 45 days', 'Nova FMCG', 'support@nova.com', '9876502234', 'Metro Retail', 'ops@metroretail.com', '9876502235'],
      ['Highway Express', 'Highway Express', 'Amit Verma', 'amit@highway.com', '9812345678', 'Partnership', 'CCCHX9012E', '07CCCHX9012E1Z8', 'Dwarka, New Delhi', 'Delhi', '110075', '', 'https://highway.com', '22', '8', 'North India', '12000000', 'Net 30 days', 'FastMart', 'proc@fastmart.com', '9876512234', 'City Retail', 'contact@cityretail.com', '9876512235'],
    ];

    const csv = [TEMPLATE_HEADERS, ...sampleRows]
      .map((row) =>
        row
          .map((cell) =>
            String(cell).includes(',') || String(cell).includes('"')
              ? `"${String(cell).replace(/"/g, '""')}"`
              : String(cell),
          )
          .join(','),
      )
      .join('\n');

    const ext = format === 'csv' ? 'csv' : 'xls';
    const mime = format === 'csv' ? 'text/csv;charset=utf-8' : 'application/vnd.ms-excel;charset=utf-8';
    const blob = new Blob([csv], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vendor_import_template.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  downloadErrorReport(rows: VendorImportValidationRow[]) {
    const headers = ['Row', 'Status', 'Company', 'Contact', 'Email', 'Phone', 'PAN', 'GST', 'Issues'];
    const data = rows
      .filter((r) => r.status !== 'valid')
      .map((r) => [
        r.rowNumber,
        r.status,
        r.data.companyName,
        r.data.contactPersonName,
        r.data.email,
        r.data.phone,
        r.data.pan,
        r.data.gstin,
        r.issues.map((i) => `${i.severity.toUpperCase()}: ${i.message}`).join(' | '),
      ]);

    const csv = [headers, ...data]
      .map((row) =>
        row
          .map((cell) =>
            String(cell).includes(',') || String(cell).includes('"')
              ? `"${String(cell).replace(/"/g, '""')}"`
              : String(cell),
          )
          .join(','),
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vendor_import_error_report.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}

function toTitleCase(value: string) {
  return (value || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w.charAt(0).toUpperCase()}${w.slice(1)}`)
    .join(' ');
}

function normalizePhone(value: string) {
  return String(value || '').replace(/[^0-9]/g, '').slice(0, 10);
}

function normalizeCompanyType(value: string) {
  const v = (value || '').trim().toLowerCase();
  if (!v) return 'Private Limited';
  const direct = COMPANY_TYPES.find((type) => type.toLowerCase() === v);
  if (direct) return direct;
  if (v.includes('private')) return 'Private Limited';
  if (v.includes('public')) return 'Public Limited';
  if (v.includes('partner')) return 'Partnership';
  if (v.includes('propriet')) return 'Proprietorship';
  if (v.includes('llp')) return 'LLP';
  return value;
}

export const vendorBulkImportService = new VendorBulkImportService();
