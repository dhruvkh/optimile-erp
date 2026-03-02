// ============================================================
// Optimile ERP — Master Data Store
// ============================================================
// Central service that manages the platform-level master data:
//   - Vendor Master (writable by TMS and AMS)
//   - Customer Master (writable by TMS)
//
// Other modules (Finance, Fleet) only READ from this store.
// Changes emit events via the eventBus for cross-module sync.
// ============================================================

import {
    PlatformVendor,
    TMSVendorExtension,
    AMSVendorExtension,
    VendorStatus,
    VerificationLevel,
    EMPTY_PLATFORM_VENDOR,
    EMPTY_TMS_EXTENSION,
} from '../types/vendor';
import {
    PlatformCustomer,
    EMPTY_CUSTOMER,
} from '../types/customer';
import { erpEventBus } from './eventBus';

// ── Store State ────────────────────────────────────────────

interface MasterDataState {
    vendors: Map<string, PlatformVendor>;
    tmsVendorExtensions: Map<string, TMSVendorExtension>;
    amsVendorExtensions: Map<string, AMSVendorExtension>;
    customers: Map<string, PlatformCustomer>;
}

// ── Service ────────────────────────────────────────────────

class MasterDataStore {
    private state: MasterDataState = {
        vendors: new Map(),
        tmsVendorExtensions: new Map(),
        amsVendorExtensions: new Map(),
        customers: new Map(),
    };
    private subscribers = new Set<() => void>();
    private vendorCounter = 100;
    private customerCounter = 100;

    constructor() {
        this.seed();
    }

    // ── Subscriptions ──────────────────────────────────────

    subscribe(cb: () => void): () => void {
        this.subscribers.add(cb);
        return () => this.subscribers.delete(cb);
    }

    private notify(): void {
        this.subscribers.forEach(cb => {
            try { cb(); } catch (e) { console.error('[MasterDataStore] subscriber error', e); }
        });
    }

    // ── Vendor — Read ──────────────────────────────────────

    getVendors(): PlatformVendor[] {
        return Array.from(this.state.vendors.values());
    }

    getVendor(id: string): PlatformVendor | undefined {
        return this.state.vendors.get(id);
    }

    getVendorsByStatus(status: VendorStatus): PlatformVendor[] {
        return this.getVendors().filter(v => v.status === status);
    }

    getActiveVendors(): PlatformVendor[] {
        return this.getVendorsByStatus('ACTIVE');
    }

    getVendorsByZone(zone: string): PlatformVendor[] {
        return this.getVendors().filter(v =>
            v.zonesServed.some(z => z.toLowerCase() === zone.toLowerCase())
        );
    }

    getVendorsByVehicleType(vehicleType: string): PlatformVendor[] {
        return this.getVendors().filter(v =>
            v.vehicleTypes.some(vt => vt.toLowerCase() === vehicleType.toLowerCase())
        );
    }

    getTMSExtension(vendorId: string): TMSVendorExtension | undefined {
        return this.state.tmsVendorExtensions.get(vendorId);
    }

    getAMSExtension(vendorId: string): AMSVendorExtension | undefined {
        return this.state.amsVendorExtensions.get(vendorId);
    }

    /**
     * Check if a vendor has an active AMS contract for a given route.
     * Used by TMS to determine rate precedence.
     */
    hasActiveAMSContract(vendorId: string): boolean {
        const ext = this.getAMSExtension(vendorId);
        return !!ext && ext.contractIds.length > 0;
    }

    // ── Vendor — Write ─────────────────────────────────────

    private nextVendorId(): string {
        this.vendorCounter++;
        return `VEN-${String(this.vendorCounter).padStart(5, '0')}`;
    }

    /**
     * Create a new vendor. Called by TMS (simplified) or AMS (full pipeline).
     */
    createVendor(
        data: Omit<PlatformVendor, 'id' | 'createdAt' | 'lastUpdatedAt' | 'lastActiveAt' | 'statusHistory'>,
        tmsExtension?: Partial<TMSVendorExtension>,
    ): PlatformVendor {
        const id = this.nextVendorId();
        const now = Date.now();
        const vendor: PlatformVendor = {
            ...EMPTY_PLATFORM_VENDOR,
            ...data,
            id,
            createdAt: now,
            lastUpdatedAt: now,
            lastActiveAt: now,
            statusHistory: [{
                from: 'PENDING_VERIFICATION' as VendorStatus,
                to: data.status,
                changedBy: 'SYSTEM',
                changedAt: now,
                reason: `Vendor created via ${data.createdFrom}`,
            }],
        };

        this.state.vendors.set(id, vendor);

        // Auto-create TMS extension if TMS-sourced
        if (data.createdFrom === 'TMS' || tmsExtension) {
            this.state.tmsVendorExtensions.set(id, {
                ...EMPTY_TMS_EXTENSION,
                vendorId: id,
                ...tmsExtension,
            });
        }

        this.notify();
        erpEventBus.emit('vendor.created', 'tms', { vendorId: id, vendor }, 'SYSTEM', 'default');
        return vendor;
    }

    /**
     * Update a vendor's core fields.
     */
    updateVendor(id: string, updates: Partial<PlatformVendor>): PlatformVendor | undefined {
        const existing = this.state.vendors.get(id);
        if (!existing) return undefined;

        const updated: PlatformVendor = {
            ...existing,
            ...updates,
            id, // Prevent ID change
            lastUpdatedAt: Date.now(),
        };
        this.state.vendors.set(id, updated);
        this.notify();
        erpEventBus.emit('vendor.updated', 'tms', { vendorId: id, updates }, 'SYSTEM', 'default');
        return updated;
    }

    /**
     * Change vendor status with audit trail.
     */
    changeVendorStatus(
        id: string,
        newStatus: VendorStatus,
        changedBy: string,
        reason: string,
    ): PlatformVendor | undefined {
        const existing = this.state.vendors.get(id);
        if (!existing) return undefined;

        const updated: PlatformVendor = {
            ...existing,
            status: newStatus,
            lastUpdatedAt: Date.now(),
            statusHistory: [
                ...existing.statusHistory,
                { from: existing.status, to: newStatus, changedBy, changedAt: Date.now(), reason },
            ],
        };
        this.state.vendors.set(id, updated);
        this.notify();
        erpEventBus.emit('vendor.statusChanged', 'tms', { vendorId: id, from: existing.status, to: newStatus }, changedBy, 'default');
        return updated;
    }

    /**
     * Update TMS-specific extension data for a vendor.
     */
    updateTMSExtension(vendorId: string, updates: Partial<TMSVendorExtension>): void {
        const existing = this.state.tmsVendorExtensions.get(vendorId) || { ...EMPTY_TMS_EXTENSION, vendorId };
        this.state.tmsVendorExtensions.set(vendorId, { ...existing, ...updates, vendorId });
        this.notify();
    }

    /**
     * Update AMS-specific extension data for a vendor.
     */
    updateAMSExtension(vendorId: string, updates: Partial<AMSVendorExtension>): void {
        const existing = this.state.amsVendorExtensions.get(vendorId);
        if (existing) {
            this.state.amsVendorExtensions.set(vendorId, { ...existing, ...updates, vendorId });
        } else {
            this.state.amsVendorExtensions.set(vendorId, {
                vendorId,
                vendorPortalAccess: false,
                qualifiedLaneGroups: [],
                qualifiedCommodities: [],
                slaScore: 0,
                performanceScorecard: { onTimePlacement: 0, deliverySuccess: 0, disputeRate: 0, avgResponseTime: 0 },
                contractIds: [],
                bidHistory: [],
                ...updates,
            });
        }
        this.notify();
    }

    // ── Customer — Read ────────────────────────────────────

    getCustomers(): PlatformCustomer[] {
        return Array.from(this.state.customers.values());
    }

    getCustomer(id: string): PlatformCustomer | undefined {
        return this.state.customers.get(id);
    }

    getActiveCustomers(): PlatformCustomer[] {
        return this.getCustomers().filter(c => c.status === 'Active');
    }

    /**
     * Check if a customer has exceeded their credit limit.
     * Used by TMS booking flow to block/warn.
     */
    isCustomerOverCreditLimit(id: string): boolean {
        const customer = this.state.customers.get(id);
        if (!customer) return false;
        return customer.financial.outstanding > customer.financial.creditLimit;
    }

    // ── Customer — Write ───────────────────────────────────

    private nextCustomerId(): string {
        this.customerCounter++;
        return `CUS-${String(this.customerCounter).padStart(5, '0')}`;
    }

    createCustomer(
        data: Omit<PlatformCustomer, 'id' | 'createdAt' | 'lastUpdatedAt'>,
    ): PlatformCustomer {
        const id = this.nextCustomerId();
        const now = new Date().toISOString();
        const customer: PlatformCustomer = {
            ...EMPTY_CUSTOMER,
            ...data,
            id,
            createdAt: now,
            lastUpdatedAt: now,
        };
        this.state.customers.set(id, customer);
        this.notify();
        erpEventBus.emit('customer.created', 'tms', { customerId: id, customer }, 'SYSTEM', 'default');
        return customer;
    }

    updateCustomer(id: string, updates: Partial<PlatformCustomer>): PlatformCustomer | undefined {
        const existing = this.state.customers.get(id);
        if (!existing) return undefined;

        const updated: PlatformCustomer = {
            ...existing,
            ...updates,
            id,
            lastUpdatedAt: new Date().toISOString(),
        };
        this.state.customers.set(id, updated);
        this.notify();
        erpEventBus.emit('customer.updated', 'tms', { customerId: id, updates }, 'SYSTEM', 'default');
        return updated;
    }

    /**
     * Update customer outstanding balance. Called by Finance when invoices/payments change.
     */
    updateCustomerOutstanding(id: string, newOutstanding: number): void {
        const customer = this.state.customers.get(id);
        if (!customer) return;
        const updated: PlatformCustomer = {
            ...customer,
            financial: { ...customer.financial, outstanding: newOutstanding },
            lastUpdatedAt: new Date().toISOString(),
        };
        this.state.customers.set(id, updated);

        // Emit credit limit breach alert if over limit
        if (newOutstanding > customer.financial.creditLimit) {
            erpEventBus.emit('customer.creditLimitBreached', 'finance', {
                customerId: id,
                outstanding: newOutstanding,
                creditLimit: customer.financial.creditLimit,
            }, 'SYSTEM', 'default');
        }
        this.notify();
    }

    // ── Seed Data ──────────────────────────────────────────

    private seed(): void {
        // ── Seed Vendors
        const seedVendors: Array<Omit<PlatformVendor, 'id' | 'createdAt' | 'lastUpdatedAt' | 'lastActiveAt' | 'statusHistory'>> = [
            {
                companyName: 'ABC Transport Services',
                legalEntityName: 'ABC Transport Pvt Ltd',
                type: 'Company',
                status: 'ACTIVE',
                verificationLevel: 'FULL',
                createdFrom: 'AMS',
                contactName: 'Ramesh Patel',
                phone: '+91-98765-99999',
                email: 'ramesh@abctransport.com',
                address: '123 Transport Nagar',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001',
                gstin: '27AABCA1234A1ZA',
                pan: 'AABCA1234A',
                documents: [
                    { type: 'GST_CERTIFICATE', status: 'VERIFIED', fileName: 'gst_cert.pdf', uploadedAt: Date.now() - 90 * 86400000, verifiedBy: 'admin@company.com', verifiedAt: Date.now() - 89 * 86400000 },
                    { type: 'PAN_CARD', status: 'VERIFIED', fileName: 'pan.pdf', uploadedAt: Date.now() - 90 * 86400000, verifiedBy: 'admin@company.com', verifiedAt: Date.now() - 89 * 86400000 },
                    { type: 'TRANSPORT_LICENSE', status: 'VERIFIED', fileName: 'license.pdf', uploadedAt: Date.now() - 90 * 86400000, verifiedBy: 'admin@company.com', verifiedAt: Date.now() - 88 * 86400000 },
                ],
                bankDetails: { accountNumber: '1234567890', ifsc: 'HDFC0001234', beneficiaryName: 'ABC Transport Pvt Ltd', bankName: 'HDFC Bank', branch: 'Fort' },
                zonesServed: ['West', 'North'],
                vehicleTypes: ['20FT', '32FT', 'Trailer'],
                fleetSize: 45,
            },
            {
                companyName: 'FastTrack Cargo',
                type: 'Company',
                status: 'ACTIVE',
                verificationLevel: 'FULL',
                createdFrom: 'AMS',
                contactName: 'Vijay Kumar',
                phone: '+91-98765-77777',
                email: 'vijay@fasttrack.com',
                city: 'Bangalore',
                state: 'Karnataka',
                gstin: '29AADCF5678B1ZB',
                pan: 'AADCF5678B',
                documents: [
                    { type: 'GST_CERTIFICATE', status: 'VERIFIED', fileName: 'gst.pdf', uploadedAt: Date.now() - 60 * 86400000, verifiedBy: 'admin@company.com', verifiedAt: Date.now() - 59 * 86400000 },
                ],
                bankDetails: { accountNumber: '9876543210', ifsc: 'ICIC0005678', beneficiaryName: 'FastTrack Cargo Ltd', bankName: 'ICICI Bank' },
                zonesServed: ['South', 'West'],
                vehicleTypes: ['20FT', 'LCV'],
                fleetSize: 89,
            },
            {
                companyName: 'Suresh Logistics',
                type: 'Individual',
                status: 'ACTIVE',
                verificationLevel: 'BASIC',
                createdFrom: 'TMS',
                contactName: 'Suresh Yadav',
                phone: '+91-99887-66554',
                email: 'suresh.yadav@gmail.com',
                city: 'Ahmedabad',
                state: 'Gujarat',
                documents: [],
                bankDetails: { accountNumber: '5555666677', ifsc: 'SBIN0001234', beneficiaryName: 'Suresh Yadav' },
                zonesServed: ['West'],
                vehicleTypes: ['20FT'],
                fleetSize: 3,
            },
            {
                companyName: 'Rajput Broker Services',
                type: 'Broker',
                status: 'ACTIVE',
                verificationLevel: 'BASIC',
                createdFrom: 'TMS',
                contactName: 'Anil Rajput',
                phone: '+91-88776-55443',
                email: 'anil.rajput@brokers.com',
                city: 'Jaipur',
                state: 'Rajasthan',
                documents: [],
                zonesServed: ['North', 'West'],
                vehicleTypes: ['20FT', '32FT', 'Trailer'],
                fleetSize: 0,
            },
            {
                companyName: 'Southern Express Transport',
                type: 'Company',
                status: 'PENDING_VERIFICATION',
                verificationLevel: 'FULL',
                createdFrom: 'AMS',
                contactName: 'Priya Menon',
                phone: '+91-77665-44332',
                email: 'priya@southernexpress.in',
                city: 'Chennai',
                state: 'Tamil Nadu',
                gstin: '33AADCS9012C1ZC',
                pan: 'AADCS9012C',
                documents: [
                    { type: 'GST_CERTIFICATE', status: 'UPLOADED', fileName: 'gst_cert.pdf', uploadedAt: Date.now() - 5 * 86400000 },
                    { type: 'PAN_CARD', status: 'UPLOADED', fileName: 'pan_card.pdf', uploadedAt: Date.now() - 5 * 86400000 },
                    { type: 'TRANSPORT_LICENSE', status: 'NOT_UPLOADED' },
                ],
                bankDetails: { accountNumber: '3333444455', ifsc: 'AXIS0009876', beneficiaryName: 'Southern Express Transport Pvt Ltd' },
                zonesServed: ['South'],
                vehicleTypes: ['20FT', '32FT', 'Tanker'],
                fleetSize: 120,
            },
        ];

        for (const v of seedVendors) {
            this.createVendor(v);
        }

        // Add TMS extensions for TMS-created vendors
        this.updateTMSExtension('VEN-00103', {
            rateAgreements: [
                { id: 'RA-001', origin: 'Ahmedabad', destination: 'Mumbai', vehicleType: '20FT', rateType: 'Per KM', rate: 45, validFrom: '2026-01-01', validTo: '2026-12-31', status: 'Active' },
            ],
            brokerCommission: 0,
            paymentTerms: 'On Delivery',
            paymentMode: 'Cash',
            performance: { rating: 4.2, totalTrips: 28, onTimePercent: 92 },
        });
        this.updateTMSExtension('VEN-00104', {
            rateAgreements: [
                { id: 'RA-002', origin: 'Jaipur', destination: 'Delhi', vehicleType: '20FT', rateType: 'Per Trip', rate: 18000, validFrom: '2026-01-01', validTo: '2026-06-30', status: 'Active' },
                { id: 'RA-003', origin: 'Jaipur', destination: 'Mumbai', vehicleType: '32FT', rateType: 'Per Trip', rate: 35000, validFrom: '2026-01-01', validTo: '2026-06-30', status: 'Active' },
            ],
            brokerCommission: 2.5,
            paymentTerms: 'Weekly',
            paymentMode: 'Bank Transfer',
            performance: { rating: 3.8, totalTrips: 142, onTimePercent: 85 },
        });

        // Add AMS extensions for AMS-created vendors
        this.updateAMSExtension('VEN-00101', {
            applicationId: 'APP-001',
            vendorPortalAccess: true,
            qualifiedLaneGroups: ['Mumbai-Delhi', 'Mumbai-Pune', 'Delhi-Jaipur'],
            qualifiedCommodities: ['General Cargo', 'FMCG'],
            slaScore: 92,
            performanceScorecard: { onTimePlacement: 96, deliverySuccess: 98, disputeRate: 1.5, avgResponseTime: 2.4 },
            contractIds: ['CON-001', 'CON-004'],
            bidHistory: [
                { auctionId: 'AUC-001', laneId: 'LANE-001', bidAmount: 42000, awarded: true, timestamp: Date.now() - 30 * 86400000 },
                { auctionId: 'AUC-002', laneId: 'LANE-005', bidAmount: 28000, awarded: false, timestamp: Date.now() - 15 * 86400000 },
            ],
        });
        this.updateAMSExtension('VEN-00102', {
            applicationId: 'APP-002',
            vendorPortalAccess: true,
            qualifiedLaneGroups: ['Bangalore-Chennai', 'Mumbai-Bangalore'],
            qualifiedCommodities: ['General Cargo', 'Electronics'],
            slaScore: 78,
            performanceScorecard: { onTimePlacement: 82, deliverySuccess: 88, disputeRate: 4.2, avgResponseTime: 3.8 },
            contractIds: ['CON-002'],
            bidHistory: [
                { auctionId: 'AUC-001', laneId: 'LANE-002', bidAmount: 35000, awarded: true, timestamp: Date.now() - 30 * 86400000 },
            ],
        });

        // ── Seed Customers
        const seedCustomers: Array<Omit<PlatformCustomer, 'id' | 'createdAt' | 'lastUpdatedAt'>> = [
            {
                name: 'Tata Steel Limited',
                legalName: 'Tata Steel Limited',
                tier: 'Premium',
                status: 'Active',
                contacts: {
                    primary: { name: 'Arun Mehta', email: 'arun.mehta@tatasteel.com', phone: '+91-22-6665-8282', designation: 'Head – Logistics' },
                    accounts: { name: 'Sneha Iyer', email: 'sneha.iyer@tatasteel.com', phone: '+91-22-6665-8283', designation: 'Manager – Finance' },
                    logistics: { name: 'Vikram Singh', email: 'vikram.singh@tatasteel.com', phone: '+91-22-6665-8284', designation: 'Sr. Manager – Supply Chain' },
                },
                gstin: '27AAACT2727Q1ZV',
                pan: 'AAACT2727Q',
                gstinVerified: true,
                billingAddress: 'Bombay House, 24 Homi Mody Street, Fort, Mumbai 400001',
                financial: { creditLimit: 5000000, creditDays: 45, outstanding: 1250000, tdsApplicable: true, tdsRate: 2, gstChargeType: 'FORWARD', invoiceFormat: 'PDF' },
                preferences: { vehicleTypes: ['Trailer', '32FT'], communicationChannel: 'Email', autoBooking: false, defaultPaymentMode: 'Bank Transfer' },
                contracts: [{ id: 'TATA-CON-001', name: 'Annual Freight Contract 2026', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'Active' }],
                relationshipManager: 'Sarah Smith',
            },
            {
                name: 'Hindustan Unilever',
                tier: 'Premium',
                status: 'Active',
                contacts: {
                    primary: { name: 'Deepika Sharma', email: 'deepika@hul.com', phone: '+91-22-3983-0000', designation: 'Distribution Head' },
                    accounts: { name: 'Rajat Gupta', email: 'rajat@hul.com', phone: '+91-22-3983-0001' },
                    logistics: { name: 'Manoj Tiwari', email: 'manoj@hul.com', phone: '+91-22-3983-0002' },
                },
                gstin: '27AAACH1234R1Z5',
                pan: 'AAACH1234R',
                gstinVerified: true,
                billingAddress: 'Unilever House, B.D. Sawant Marg, Chakala, Andheri East, Mumbai 400099',
                financial: { creditLimit: 10000000, creditDays: 60, outstanding: 3200000, tdsApplicable: true, tdsRate: 2, gstChargeType: 'FORWARD', invoiceFormat: 'PDF' },
                preferences: { vehicleTypes: ['20FT', '32FT', 'LCV'], communicationChannel: 'Email', autoBooking: true, defaultPaymentMode: 'Bank Transfer' },
                contracts: [],
                relationshipManager: 'Mike Johnson',
            },
            {
                name: 'Krishna Traders',
                tier: 'Standard',
                status: 'Active',
                contacts: {
                    primary: { name: 'Govind Krishna', email: 'govind@krishnatraders.in', phone: '+91-79-2658-1234' },
                    accounts: { name: 'Govind Krishna', email: 'govind@krishnatraders.in', phone: '+91-79-2658-1234' },
                    logistics: { name: 'Govind Krishna', email: 'govind@krishnatraders.in', phone: '+91-79-2658-1234' },
                },
                gstin: '24AADCK5678M1ZQ',
                pan: 'AADCK5678M',
                gstinVerified: true,
                billingAddress: '42 Ring Road, Navrangpura, Ahmedabad 380009',
                financial: { creditLimit: 500000, creditDays: 30, outstanding: 85000, tdsApplicable: false, tdsRate: 0, gstChargeType: 'REVERSE', invoiceFormat: 'Excel' },
                preferences: { vehicleTypes: ['20FT', 'LCV'], communicationChannel: 'WhatsApp', autoBooking: false, defaultPaymentMode: 'UPI' },
                contracts: [],
            },
            {
                name: 'Reliance Retail',
                legalName: 'Reliance Retail Ventures Limited',
                tier: 'Premium',
                status: 'Active',
                contacts: {
                    primary: { name: 'Ankit Patel', email: 'ankit.patel@ril.com', phone: '+91-22-3555-5000', designation: 'VP – Supply Chain' },
                    accounts: { name: 'Pooja Shah', email: 'pooja.shah@ril.com', phone: '+91-22-3555-5001' },
                    logistics: { name: 'Nitin Desai', email: 'nitin.desai@ril.com', phone: '+91-22-3555-5002' },
                },
                gstin: '27AABCR1234L1ZX',
                pan: 'AABCR1234L',
                gstinVerified: true,
                billingAddress: 'Maker Chambers IV, 222 Nariman Point, Mumbai 400021',
                financial: { creditLimit: 20000000, creditDays: 45, outstanding: 8500000, tdsApplicable: true, tdsRate: 2, gstChargeType: 'FORWARD', invoiceFormat: 'PDF' },
                preferences: { vehicleTypes: ['20FT', '32FT', 'Trailer', 'LCV'], communicationChannel: 'Email', autoBooking: true, defaultPaymentMode: 'Bank Transfer' },
                contracts: [{ id: 'RIL-CON-001', name: 'Multi-City Distribution Contract', validFrom: '2026-01-01', validTo: '2026-12-31', status: 'Active' }],
                relationshipManager: 'Sarah Smith',
            },
        ];

        for (const c of seedCustomers) {
            this.createCustomer(c);
        }
    }
}

// Singleton – shared across the entire ERP
export const masterDataStore = new MasterDataStore();
