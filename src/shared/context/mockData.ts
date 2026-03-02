// ============================================================
// Optimile ERP – Mock Data (Tenants, Users, Roles)
// ============================================================
// This replaces the individual constants.ts files from each module.
// In production, this comes from a real API.
// ============================================================

import { Tenant, User, ERPModule } from '../types';

// ── TENANTS ─────────────────────────────────────────────────
export const MOCK_TENANTS: Tenant[] = [
  {
    id: 'T-001',
    name: 'ABC Logistics Pvt Ltd',
    slug: 'abc-logistics',
    logo: '',
    modules: ['tms', 'fleet-control', 'ams', 'finance'],
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: 'T-002',
    name: 'XYZ Transport Co',
    slug: 'xyz-transport',
    logo: '',
    modules: ['tms', 'fleet-control'],  // Only TMS + Fleet licensed
    status: 'active',
    createdAt: '2024-06-01',
  },
];

// ── USERS ───────────────────────────────────────────────────
// password field is only for mock login; never stored in production
export const MOCK_USERS: (User & { password: string })[] = [
  // ─── Tenant 1: ABC Logistics (all modules) ───
  {
    id: 'U-001',
    tenantId: 'T-001',
    email: 'ceo@abclogistics.com',
    password: 'password123',
    name: 'Rajesh Kumar',
    role: 'CEO',
    department: 'Management',
    permissions: ['all'],
    modules: ['tms', 'fleet-control', 'ams', 'finance'],
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&fit=facearea&facepad=2',
    status: 'active',
  },
  {
    id: 'U-002',
    tenantId: 'T-001',
    email: 'admin@abclogistics.com',
    password: 'password123',
    name: 'Priya Sharma',
    role: 'Super Admin',
    department: 'IT Admin',
    permissions: ['all'],
    modules: ['tms', 'fleet-control', 'ams', 'finance'],
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=facearea&facepad=2',
    status: 'active',
  },
  {
    id: 'U-003',
    tenantId: 'T-001',
    email: 'ops@abclogistics.com',
    password: 'password123',
    name: 'Amit Singh',
    role: 'Operations Head',
    department: 'Operations',
    permissions: [
      'tms.dashboard', 'tms.bookings', 'tms.operations', 'tms.tracking',
      'tms.approvals', 'tms.reports',
      'fleet.dashboard', 'fleet.vehicles', 'fleet.drivers', 'fleet.dispatch',
    ],
    modules: ['tms', 'fleet-control'],
    avatarUrl: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=256&h=256&fit=facearea&facepad=2',
    status: 'active',
  },
  {
    id: 'U-004',
    tenantId: 'T-001',
    email: 'fleet@abclogistics.com',
    password: 'password123',
    name: 'Rahul Mehta',
    role: 'Fleet Manager',
    department: 'Fleet',
    permissions: [
      'fleet.dashboard', 'fleet.vehicles', 'fleet.drivers', 'fleet.dispatch',
      'fleet.maintenance', 'fleet.fuel', 'fleet.tyres', 'fleet.compliance',
      'fleet.behavior', 'fleet.cost', 'fleet.live-map', 'fleet.inventory',
      'fleet.vendors', 'fleet.garage', 'fleet.batteries',
      'fleet.ops-intel', 'fleet.exceptions', 'fleet.coverage', 'fleet.reconciliation',
      'fleet.settings',
    ],
    modules: ['fleet-control'],
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=facearea&facepad=2',
    status: 'active',
  },
  {
    id: 'U-005',
    tenantId: 'T-001',
    email: 'finance@abclogistics.com',
    password: 'password123',
    name: 'Sunita Verma',
    role: 'Finance Manager',
    department: 'Finance',
    permissions: [
      'finance.dashboard', 'finance.customers', 'finance.vendors',
      'finance.invoices', 'finance.fleet-ledger', 'finance.reconciliation',
      'finance.reports', 'finance.settings',
    ],
    modules: ['finance'],
    avatarUrl: 'https://images.unsplash.com/photo-1550525811-e5869dd03032?w=256&h=256&fit=facearea&facepad=2',
    status: 'active',
  },
  {
    id: 'U-006',
    tenantId: 'T-001',
    email: 'procurement@abclogistics.com',
    password: 'password123',
    name: 'Vikas Gupta',
    role: 'Procurement Head',
    department: 'Procurement',
    permissions: [
      'ams.dashboard', 'ams.auctions', 'ams.contracts', 'ams.vendors',
      'ams.analytics', 'ams.execution', 'ams.sla', 'ams.spot',
      'ams.admin',
    ],
    modules: ['ams'],
    status: 'active',
  },
  {
    id: 'U-007',
    tenantId: 'T-001',
    email: 'regional@abclogistics.com',
    password: 'password123',
    name: 'Deepak Joshi',
    role: 'Regional Manager',
    department: 'Operations',
    region: 'North',
    permissions: [
      'tms.dashboard', 'tms.bookings', 'tms.regional-operations', 'tms.regional-reports',
    ],
    modules: ['tms'],
    status: 'active',
  },
  {
    id: 'U-008',
    tenantId: 'T-001',
    email: 'supervisor@abclogistics.com',
    password: 'password123',
    name: 'Manoj Yadav',
    role: 'Supervisor',
    department: 'Operations',
    permissions: ['tms.loading-bay', 'tms.vehicle-checkin'],
    modules: ['tms'],
    status: 'active',
  },

  // ─── Tenant 2: XYZ Transport (TMS + Fleet only) ───
  {
    id: 'U-101',
    tenantId: 'T-002',
    email: 'admin@xyztransport.com',
    password: 'password123',
    name: 'Arjun Patel',
    role: 'Admin',
    department: 'IT Admin',
    permissions: ['all'],
    modules: ['tms', 'fleet-control'],
    status: 'active',
  },
];
