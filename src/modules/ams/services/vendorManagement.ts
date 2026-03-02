export type ApplicationStatus = 'NEW' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'MORE_INFO';
export type VendorStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'ON_HOLD' | 'BLOCKED' | 'EXPIRING_DOCUMENTS' | 'INACTIVE' | 'CONDITIONALLY_APPROVED';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export const VENDOR_COLORS = {
  success: '#00C853',
  warning: '#FFB300',
  error: '#FF1744',
  info: '#2979FF',
  premium: '#AA00FF',
  neutral: '#757575',
  orange: '#FB8C00',
};

export type DocumentType =
  | 'PAN'
  | 'GST'
  | 'INCORPORATION'
  | 'BANK'
  | 'RC'
  | 'INSURANCE'
  | 'GPS'
  | 'REFERENCES';

export interface VendorDocument {
  type: DocumentType;
  status: 'NOT_UPLOADED' | 'UPLOADED' | 'VERIFYING' | 'VERIFIED' | 'REJECTED' | 'EXPIRING_SOON';
  fileName?: string;
  uploadedAt?: number;
  expiryDate?: string;
  verifiedBy?: string;
  verifiedAt?: number;
  rejectionReason?: string;
}

export interface VendorApplication {
  applicationId: string;
  status: ApplicationStatus;
  priority: Priority;
  assignedTo?: string;
  appliedDate: number;
  companyInfo: {
    companyName: string;
    legalEntityName: string;
    companyType: string;
    yearEstablished: number;
    website?: string;
    linkedin?: string;
  };
  contact: {
    primaryContactName: string;
    designation: string;
    email: string;
    mobile: string;
    alternateContact?: string;
    registeredAddress: string;
    officeAddress?: string;
    state: string;
    pincode: string;
  };
  business: {
    fleetOwned: number;
    fleetLeased: number;
    vehicleTypes: string[];
    serviceAreas: string[];
    routesSpecialized: string;
    avgMonthlyCapacity: number;
  };
  financial: {
    annualTurnover?: number;
    creditRating?: string;
    paymentTerms?: string;
  };
  references: Array<{
    clientName: string;
    contactPerson: string;
    phone: string;
    email: string;
  }>;
  documents: VendorDocument[];
  notes: Array<{
    by: string;
    at: number;
    text: string;
  }>;
  rejectionReason?: string;
  conditions?: string[];
  reviewedBy?: string;
  reviewedAt?: number;
  generatedVendorId?: string;
}

export interface VendorAccount {
  vendorId: string;
  applicationId: string;
  status: VendorStatus;
  statusHistory: Array<{
    from: VendorStatus;
    to: VendorStatus;
    changedBy: string;
    changedAt: number;
    reason: string;
  }>;
  companyName: string;
  legalEntityName: string;
  contactName: string;
  email: string;
  mobile: string;
  serviceAreas: string[];
  vehicleTypes: string[];
  documents: VendorDocument[];
  createdAt: number;
  lastUpdatedAt: number;
  lastActiveAt: number;
}

class VendorManagementService {
  private applications = new Map<string, VendorApplication>();
  private vendors = new Map<string, VendorAccount>();
  private subscribers = new Set<() => void>();
  private appCounter = 1;
  private vendorCounter = 89;

  constructor() {
    this.seed();
  }

  subscribe(cb: () => void) {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  private notify() {
    this.subscribers.forEach((cb) => cb());
  }

  private nextAppId() {
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const id = `VAPP-${d}-${String(this.appCounter).padStart(3, '0')}`;
    this.appCounter += 1;
    return id;
  }

  private nextVendorId() {
    const id = `V-${String(this.vendorCounter).padStart(3, '0')}`;
    this.vendorCounter += 1;
    return id;
  }

  getSnapshot() {
    return {
      applications: Array.from(this.applications.values()).sort((a, b) => b.appliedDate - a.appliedDate),
      vendors: Array.from(this.vendors.values()).sort((a, b) => b.createdAt - a.createdAt),
    };
  }

  getApplication(applicationId: string) {
    return this.applications.get(applicationId);
  }

  getVendor(vendorId: string) {
    return this.vendors.get(vendorId);
  }

  submitApplication(payload: Omit<VendorApplication, 'applicationId' | 'appliedDate' | 'status' | 'priority' | 'notes'>) {
    const id = this.nextAppId();
    const app: VendorApplication = {
      ...payload,
      applicationId: id,
      appliedDate: Date.now(),
      status: 'NEW',
      priority: 'MEDIUM',
      notes: [{ by: 'SYSTEM', at: Date.now(), text: 'Application submitted.' }],
    };
    this.applications.set(id, app);
    this.notify();
    return id;
  }

  addApplicationNote(applicationId: string, by: string, text: string) {
    const app = this.applications.get(applicationId);
    if (!app) throw new Error('Application not found');
    app.notes.push({ by, at: Date.now(), text });
    this.notify();
  }

  setApplicationPriority(applicationId: string, priority: Priority, assignedTo?: string) {
    const app = this.applications.get(applicationId);
    if (!app) throw new Error('Application not found');
    app.priority = priority;
    if (assignedTo) app.assignedTo = assignedTo;
    this.notify();
  }

  reviewDocument(applicationId: string, type: DocumentType, action: 'APPROVE' | 'REJECT' | 'REQUEST_REUPLOAD', reviewer: string, reason?: string) {
    const app = this.applications.get(applicationId);
    if (!app) throw new Error('Application not found');
    const doc = app.documents.find((d) => d.type === type);
    if (!doc) throw new Error('Document not found');

    if (action === 'APPROVE') {
      doc.status = doc.expiryDate && (new Date(doc.expiryDate).getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000
        ? 'EXPIRING_SOON'
        : 'VERIFIED';
      doc.verifiedBy = reviewer;
      doc.verifiedAt = Date.now();
      doc.rejectionReason = undefined;
    }
    if (action === 'REJECT' || action === 'REQUEST_REUPLOAD') {
      doc.status = 'REJECTED';
      doc.rejectionReason = reason || 'Document quality issue';
    }

    app.status = 'UNDER_REVIEW';
    app.assignedTo = reviewer;
    app.reviewedBy = reviewer;
    app.reviewedAt = Date.now();
    app.notes.push({ by: reviewer, at: Date.now(), text: `${action} ${type}${reason ? ` - ${reason}` : ''}` });
    this.notify();
  }

  requestMoreInfo(applicationId: string, reviewer: string, message: string) {
    const app = this.applications.get(applicationId);
    if (!app) throw new Error('Application not found');
    app.status = 'MORE_INFO';
    app.reviewedBy = reviewer;
    app.reviewedAt = Date.now();
    app.notes.push({ by: reviewer, at: Date.now(), text: `Requested more info: ${message}` });
    this.notify();
  }

  rejectApplication(applicationId: string, reviewer: string, reason: string) {
    const app = this.applications.get(applicationId);
    if (!app) throw new Error('Application not found');
    app.status = 'REJECTED';
    app.rejectionReason = reason;
    app.reviewedBy = reviewer;
    app.reviewedAt = Date.now();
    app.notes.push({ by: reviewer, at: Date.now(), text: `Rejected: ${reason}` });
    this.notify();
  }

  approveApplication(applicationId: string, reviewer: string, options?: { conditional?: boolean; conditions?: string[] }) {
    const app = this.applications.get(applicationId);
    if (!app) throw new Error('Application not found');

    const vendorId = this.nextVendorId();
    const now = Date.now();
    const vendorStatus: VendorStatus = options?.conditional ? 'CONDITIONALLY_APPROVED' : 'ACTIVE';

    const vendor: VendorAccount = {
      vendorId,
      applicationId,
      status: vendorStatus,
      statusHistory: [{
        from: 'PENDING_VERIFICATION',
        to: vendorStatus,
        changedBy: reviewer,
        changedAt: now,
        reason: options?.conditional ? 'Conditional approval' : 'Approved',
      }],
      companyName: app.companyInfo.companyName,
      legalEntityName: app.companyInfo.legalEntityName,
      contactName: app.contact.primaryContactName,
      email: app.contact.email,
      mobile: app.contact.mobile,
      serviceAreas: app.business.serviceAreas,
      vehicleTypes: app.business.vehicleTypes,
      documents: app.documents,
      createdAt: now,
      lastUpdatedAt: now,
      lastActiveAt: now,
    };

    app.status = 'APPROVED';
    app.reviewedBy = reviewer;
    app.reviewedAt = now;
    app.generatedVendorId = vendorId;
    app.conditions = options?.conditions;
    app.notes.push({ by: reviewer, at: now, text: options?.conditional ? 'Conditionally approved' : 'Approved and activated' });

    this.vendors.set(vendorId, vendor);
    this.notify();
    return vendorId;
  }

  changeVendorStatus(vendorId: string, to: VendorStatus, changedBy: string, reason: string) {
    const vendor = this.vendors.get(vendorId);
    if (!vendor) throw new Error('Vendor not found');
    const from = vendor.status;
    vendor.status = to;
    vendor.lastUpdatedAt = Date.now();
    vendor.statusHistory.unshift({ from, to, changedBy, changedAt: Date.now(), reason });
    this.notify();
  }

  validateBulkRows(rows: Array<Record<string, string>>) {
    const existingEmails = new Set(this.getSnapshot().applications.map((a) => a.contact.email.toLowerCase()));
    const existingGst = new Set(this.getSnapshot().applications.map((a) => (a.documents.find((d) => d.type === 'GST')?.fileName || '').toLowerCase()));

    const errors: Array<{ row: number; message: string }> = [];
    const warnings: Array<{ row: number; message: string }> = [];
    const validRows: Array<Record<string, string>> = [];

    rows.forEach((row, idx) => {
      const rowNo = idx + 1;
      const email = (row.email || '').trim();
      const pan = (row.pan || '').trim();
      const gstin = (row.gstin || '').trim();

      if (!row.companyName || !email || !row.mobile) {
        errors.push({ row: rowNo, message: 'Missing required fields (companyName/email/mobile)' });
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        errors.push({ row: rowNo, message: 'Invalid email format' });
        return;
      }
      if (!pan) {
        errors.push({ row: rowNo, message: 'Missing PAN number' });
        return;
      }
      if (existingEmails.has(email.toLowerCase())) {
        errors.push({ row: rowNo, message: 'Duplicate email' });
        return;
      }
      if (gstin && existingGst.has(gstin.toLowerCase())) {
        errors.push({ row: rowNo, message: 'Duplicate GSTIN' });
        return;
      }
      if (!row.routesSpecialized) warnings.push({ row: rowNo, message: 'No specialized routes provided' });
      validRows.push(row);
    });

    return {
      total: rows.length,
      valid: validRows.length,
      errorCount: errors.length,
      warningCount: warnings.length,
      errors,
      warnings,
      validRows,
    };
  }

  bulkImport(rows: Array<Record<string, string>>) {
    const result = this.validateBulkRows(rows);
    result.validRows.forEach((row) => {
      const docs: VendorDocument[] = [
        { type: 'PAN', status: 'UPLOADED', fileName: `${row.companyName}-pan.pdf`, uploadedAt: Date.now() },
        { type: 'GST', status: 'UPLOADED', fileName: row.gstin || `${row.companyName}-gst.pdf`, uploadedAt: Date.now() },
        { type: 'INCORPORATION', status: 'NOT_UPLOADED' },
        { type: 'BANK', status: 'NOT_UPLOADED' },
        { type: 'RC', status: 'NOT_UPLOADED' },
        { type: 'INSURANCE', status: 'NOT_UPLOADED' },
        { type: 'GPS', status: 'NOT_UPLOADED' },
        { type: 'REFERENCES', status: 'NOT_UPLOADED' },
      ];

      this.submitApplication({
        companyInfo: {
          companyName: row.companyName,
          legalEntityName: row.legalEntityName || row.companyName,
          companyType: row.companyType || 'Private Limited',
          yearEstablished: Number(row.yearEstablished || 2018),
          website: row.website || '',
          linkedin: row.linkedin || '',
        },
        contact: {
          primaryContactName: row.contactName || 'Operations Head',
          designation: row.designation || 'Manager',
          email: row.email,
          mobile: row.mobile,
          alternateContact: row.alternate || '',
          registeredAddress: row.address || 'N/A',
          officeAddress: row.officeAddress || '',
          state: row.state || 'Maharashtra',
          pincode: row.pincode || '400001',
        },
        business: {
          fleetOwned: Number(row.fleetOwned || 2),
          fleetLeased: Number(row.fleetLeased || 1),
          vehicleTypes: (row.vehicleTypes || 'FTL').split('|').map((v) => v.trim()).filter(Boolean),
          serviceAreas: (row.serviceAreas || 'North India').split('|').map((v) => v.trim()).filter(Boolean),
          routesSpecialized: row.routesSpecialized || 'General',
          avgMonthlyCapacity: Number(row.avgMonthlyCapacity || 20),
        },
        financial: {
          annualTurnover: Number(row.turnover || 0),
          creditRating: row.creditRating || '',
          paymentTerms: row.paymentTerms || 'Net 30 days',
        },
        references: [
          {
            clientName: row.referenceClient1 || 'Reference Client A',
            contactPerson: row.referencePerson1 || 'Contact A',
            phone: row.referencePhone1 || '+919999999999',
            email: row.referenceEmail1 || 'a@client.com',
          },
          {
            clientName: row.referenceClient2 || 'Reference Client B',
            contactPerson: row.referencePerson2 || 'Contact B',
            phone: row.referencePhone2 || '+918888888888',
            email: row.referenceEmail2 || 'b@client.com',
          },
        ],
        documents: docs,
      });
    });

    return result;
  }

  private seed() {
    const seedRows: Array<Record<string, string>> = [
      {
        companyName: 'Swift Logistics',
        legalEntityName: 'Swift Logistics Private Limited',
        companyType: 'Private Limited',
        yearEstablished: '2015',
        email: 'rajesh@swiftlogistics.com',
        mobile: '+919876543210',
        address: 'Andheri East, Mumbai',
        state: 'Maharashtra',
        pincode: '400093',
        contactName: 'Rajesh Kumar',
        designation: 'Operations Head',
        serviceAreas: 'North India|West India',
        vehicleTypes: 'FTL|Container',
        routesSpecialized: 'Mumbai-Delhi|Delhi-Bangalore',
        pan: 'AAAAA1234A',
        gstin: '27AAAAA1234A1Z5',
      },
      {
        companyName: 'Elite Transport',
        legalEntityName: 'Elite Transport LLP',
        companyType: 'LLP',
        yearEstablished: '2018',
        email: 'ops@elitetransport.in',
        mobile: '+919445566778',
        address: 'Whitefield, Bengaluru',
        state: 'Karnataka',
        pincode: '560066',
        contactName: 'Anita Menon',
        designation: 'Director',
        serviceAreas: 'South India|Pan India',
        vehicleTypes: 'FTL|LTL',
        routesSpecialized: 'Bangalore-Chennai|Bangalore-Hyderabad',
        pan: 'BBBBB2345B',
        gstin: '29BBBBB2345B1Z6',
      },
    ];

    this.bulkImport(seedRows);

    const app = this.getSnapshot().applications[0];
    if (app) {
      app.status = 'UNDER_REVIEW';
      app.priority = 'HIGH';
      app.assignedTo = 'Procurement Manager';
      const pan = app.documents.find((d) => d.type === 'PAN');
      const gst = app.documents.find((d) => d.type === 'GST');
      if (pan) pan.status = 'VERIFIED';
      if (gst) gst.status = 'VERIFIED';
    }
  }
}

export const vendorManagement = new VendorManagementService();
