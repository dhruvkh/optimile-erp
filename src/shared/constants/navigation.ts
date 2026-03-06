// ============================================================
// Optimile ERP – Navigation Configuration
// ============================================================
// All sidebar navigation items, grouped by module.
// The sidebar renders only sections the user has access to.
// ============================================================

import {
  LayoutDashboard, Package, Settings, Truck, Users, FileText,
  Activity, ShieldCheck, MapPin, Calculator,
  BarChart3, Briefcase, Gavel, Timer, Zap, Network,
  TrendingUp, History,
  AlertTriangle, Box,
  Wrench, Fuel, CircleDollarSign, Globe, ClipboardCheck,
  Database, Bell, Map as MapIcon, FileCheck,
  Wallet, Receipt, ArrowLeftRight, PieChart, Battery,
  PackagePlus, Building2, Navigation, IndianRupee,
} from 'lucide-react';
import { NavSection } from '../types';

export const APP_NAME = 'Optimile ERP';

export const NAV_SECTIONS: NavSection[] = [
  // ═══════════════════════════════════════════════════════════
  // TMS MODULE (Full Truck Load / core transport operations)
  // ═══════════════════════════════════════════════════════════
  {
    title: 'Transport Management',
    module: 'tms',
    items: [
      { label: 'Dashboard', path: '/tms/dashboard', icon: LayoutDashboard, module: 'tms' },
      { label: 'Control Tower', path: '/tms/control-tower', icon: Activity, module: 'tms', requiredPermissions: ['tms.operations', 'tms.regional-operations'] },
      { label: 'Bookings', path: '/tms/bookings', icon: Package, module: 'tms', requiredPermissions: ['tms.bookings'] },
      { label: 'HO Approvals', path: '/tms/approvals', icon: ShieldCheck, module: 'tms', requiredPermissions: ['tms.approvals'] },
      { label: 'Operations', path: '/tms/operations', icon: MapPin, module: 'tms', requiredPermissions: ['tms.operations', 'tms.regional-operations', 'tms.loading-bay', 'tms.vehicle-checkin'] },
      { label: 'Live Tracking', path: '/tms/tracking', icon: MapPin, module: 'tms', requiredPermissions: ['tms.operations', 'tms.regional-operations'] },
      { label: 'Rate Calculator', path: '/tms/finance/calculator', icon: Calculator, module: 'tms', requiredPermissions: ['tms.operations', 'tms.regional-operations'] },
      { label: 'Fleet (TMS)', path: '/tms/fleet', icon: Truck, module: 'tms', requiredPermissions: ['tms.vehicles', 'tms.vehicle-checkin'] },
      { label: 'Drivers (TMS)', path: '/tms/drivers', icon: Users, module: 'tms', requiredPermissions: ['tms.drivers'] },
      { label: 'Reports', path: '/tms/reports', icon: FileText, module: 'tms', requiredPermissions: ['tms.reports', 'tms.regional-reports'] },
      { label: 'TMS Settings', path: '/tms/settings', icon: Settings, module: 'tms', requiredPermissions: ['tms.system-config'] },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // PTL MODULE (Part Truck Load — docket-based carrier network)
  // ═══════════════════════════════════════════════════════════
  {
    title: 'Part Truck Load (PTL)',
    module: 'tms',
    items: [
      { label: 'PTL Dashboard', path: '/tms/ptl/dashboard', icon: BarChart3, module: 'tms', requiredPermissions: ['tms.bookings', 'tms.operations'] },
      { label: 'PTL Bookings', path: '/tms/ptl/booking', icon: PackagePlus, module: 'tms', requiredPermissions: ['tms.bookings', 'tms.operations'] },
      { label: 'Hub Operations', path: '/tms/ptl/hub-ops', icon: Building2, module: 'tms', requiredPermissions: ['tms.operations', 'tms.regional-operations'] },
      { label: 'PTL Tracking', path: '/tms/ptl/tracking', icon: Navigation, module: 'tms', requiredPermissions: ['tms.operations', 'tms.regional-operations'] },
      { label: 'Delivery Mgmt', path: '/tms/ptl/delivery', icon: Truck, module: 'tms', requiredPermissions: ['tms.operations', 'tms.regional-operations'] },
      { label: 'Exceptions', path: '/tms/ptl/exceptions', icon: AlertTriangle, module: 'tms', requiredPermissions: ['tms.operations', 'tms.regional-operations'] },
      { label: 'Carrier Hub', path: '/tms/ptl/vendors', icon: Users, module: 'tms', requiredPermissions: ['tms.operations', 'tms.regional-operations'] },
      { label: 'Analytics', path: '/tms/ptl/analytics', icon: TrendingUp, module: 'tms', requiredPermissions: ['tms.reports', 'tms.regional-reports'] },
      { label: 'PTL Settings', path: '/tms/ptl/settings', icon: Settings, module: 'tms', requiredPermissions: ['tms.system-config'] },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // FLEET CONTROL MODULE (includes Tyre Intelligence)
  // ═══════════════════════════════════════════════════════════
  {
    title: 'Fleet Control',
    module: 'fleet-control',
    items: [
      { label: 'Fleet Dashboard', path: '/fleet/dashboard', icon: LayoutDashboard, module: 'fleet-control' },
      { label: 'Ops Intelligence', path: '/fleet/ops-intel', icon: BarChart3, module: 'fleet-control', requiredPermissions: ['fleet.ops-intel'] },
      { label: 'Exception Center', path: '/fleet/exceptions', icon: Bell, module: 'fleet-control', requiredPermissions: ['fleet.exceptions'] },
      { label: 'Alert management', path: '/fleet/alerts', icon: AlertTriangle, module: 'fleet-control', requiredPermissions: ['fleet.exceptions'] },
      { label: 'Driver behavior', path: '/fleet/behavior', icon: Zap, module: 'fleet-control', requiredPermissions: ['fleet.behavior'] },
      { label: 'Data Coverage', path: '/fleet/coverage', icon: Database, module: 'fleet-control', requiredPermissions: ['fleet.coverage'] },
      { label: 'Reconciliation', path: '/fleet/reconciliation', icon: ClipboardCheck, module: 'fleet-control', requiredPermissions: ['fleet.reconciliation'] },
      { label: 'Live Map', path: '/fleet/live-map', icon: Globe, module: 'fleet-control', requiredPermissions: ['fleet.live-map'] },
      { label: 'Dispatch Console', path: '/fleet/dispatch', icon: MapIcon, module: 'fleet-control', requiredPermissions: ['fleet.dispatch'] },
      { label: 'Vehicle Management', path: '/fleet/vehicles', icon: Truck, module: 'fleet-control', requiredPermissions: ['fleet.vehicles'] },
      { label: 'Driver Management', path: '/fleet/drivers', icon: Users, module: 'fleet-control', requiredPermissions: ['fleet.drivers'] },
      { label: 'Compliance', path: '/fleet/compliance', icon: FileCheck, module: 'fleet-control', requiredPermissions: ['fleet.compliance'] },
      { label: 'Maintenance', path: '/fleet/maintenance', icon: Wrench, module: 'fleet-control', requiredPermissions: ['fleet.maintenance'] },
      { label: 'Garage Mgmt', path: '/fleet/garage', icon: Wrench, module: 'fleet-control', requiredPermissions: ['fleet.garage'] },
      { label: 'Battery Mgmt', path: '/fleet/batteries', icon: Battery, module: 'fleet-control', requiredPermissions: ['fleet.batteries'] },
      // ── Tyre Intelligence (merged into Fleet Control) ──
      { label: 'Tyre Management', path: '/fleet/tyres', icon: CircleDollarSign, module: 'fleet-control', requiredPermissions: ['fleet.tyres'] },
      { label: 'Tyre Inventory', path: '/fleet/tyres/inventory', icon: Box, module: 'fleet-control', requiredPermissions: ['fleet.tyres'] },
      { label: 'Tyre Visual Tracker', path: '/fleet/tyres/tracker', icon: Truck, module: 'fleet-control', requiredPermissions: ['fleet.tyres'] },
      { label: 'Tyre Job Cards', path: '/fleet/tyres/jobs', icon: ClipboardCheck, module: 'fleet-control', requiredPermissions: ['fleet.tyres'] },
      { label: 'Tyre Inspections', path: '/fleet/tyres/inspections', icon: FileCheck, module: 'fleet-control', requiredPermissions: ['fleet.tyres'] },
      { label: 'Vehicle Master', path: '/fleet/tyres/vehicle-master', icon: Truck, module: 'fleet-control', requiredPermissions: ['fleet.tyres'] },
      // ── End Tyre Intelligence ──
      { label: 'Vendor & Ledger', path: '/fleet/vendors', icon: Briefcase, module: 'fleet-control', requiredPermissions: ['fleet.vendors'] },
      { label: 'Inventory', path: '/fleet/inventory', icon: Box, module: 'fleet-control', requiredPermissions: ['fleet.inventory'] },
      { label: 'Fuel & Energy', path: '/fleet/fuel', icon: Fuel, module: 'fleet-control', requiredPermissions: ['fleet.fuel'] },
      { label: 'Cost Health', path: '/fleet/cost', icon: CircleDollarSign, module: 'fleet-control', requiredPermissions: ['fleet.cost'] },
      { label: 'Settings', path: '/fleet/settings', icon: Settings, module: 'fleet-control', requiredPermissions: ['fleet.settings'] },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // AMS MODULE (Auction Management / Procurement)
  // ═══════════════════════════════════════════════════════════
  {
    title: 'Procurement (AMS)',
    module: 'ams',
    items: [
      { label: 'AMS Dashboard', path: '/ams/dashboard', icon: LayoutDashboard, module: 'ams' },
      { label: 'Executive View', path: '/ams/executive', icon: BarChart3, module: 'ams', requiredPermissions: ['ams.dashboard'] },
      { label: 'Client Hub', path: '/ams/clients', icon: Briefcase, module: 'ams', requiredPermissions: ['ams.contracts'] },
      { label: 'Contracts', path: '/ams/contracts', icon: FileText, module: 'ams', requiredPermissions: ['ams.contracts'] },
      { label: 'Create Auction', path: '/ams/auctions/create', icon: Gavel, module: 'ams', requiredPermissions: ['ams.auctions'] },
      { label: 'Live Auctions', path: '/ams/auctions/live', icon: Activity, module: 'ams', requiredPermissions: ['ams.auctions'] },
      { label: 'Vendor Portal', path: '/ams/vendor-portal', icon: Users, module: 'ams', requiredPermissions: ['ams.vendors'] },
      { label: 'Spot Operations', path: '/ams/spot', icon: Zap, module: 'ams', requiredPermissions: ['ams.spot'] },
      { label: 'Execution Map', path: '/ams/execution', icon: Network, module: 'ams', requiredPermissions: ['ams.execution'] },
      { label: 'SLA Monitor', path: '/ams/sla', icon: Timer, module: 'ams', requiredPermissions: ['ams.sla'] },
      { label: 'Savings Analysis', path: '/ams/analytics/savings', icon: TrendingUp, module: 'ams', requiredPermissions: ['ams.analytics'] },
      { label: 'Vendor Insights', path: '/ams/analytics/vendors', icon: Activity, module: 'ams', requiredPermissions: ['ams.analytics'] },
      { label: 'Vendor Onboarding', path: '/ams/vendors/onboarding', icon: Users, module: 'ams', requiredPermissions: ['ams.admin'] },
      { label: 'Disputes', path: '/ams/disputes', icon: AlertTriangle, module: 'ams', requiredPermissions: ['ams.admin'] },
      { label: 'Audit Trail', path: '/ams/audit', icon: History, module: 'ams', requiredPermissions: ['ams.admin'] },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // FINANCE MODULE
  // ═══════════════════════════════════════════════════════════
  {
    title: 'Finance',
    module: 'finance',
    items: [
      { label: 'Finance Dashboard', path: '/finance/dashboard', icon: Wallet, module: 'finance' },
      { label: 'Customer Ledger', path: '/finance/customers', icon: Users, module: 'finance', requiredPermissions: ['finance.customers'] },
      { label: 'Vendor Ledger', path: '/finance/vendors', icon: Briefcase, module: 'finance', requiredPermissions: ['finance.vendors'] },
      { label: 'Invoices', path: '/finance/invoices', icon: Receipt, module: 'finance', requiredPermissions: ['finance.invoices'] },
      { label: 'Create Invoice', path: '/finance/invoices/create', icon: FileText, module: 'finance', requiredPermissions: ['finance.invoices'] },
      { label: 'Fleet Ledger', path: '/finance/fleet-ledger', icon: Truck, module: 'finance', requiredPermissions: ['finance.fleet-ledger'] },
      { label: 'Reconciliation', path: '/finance/reconciliation', icon: ArrowLeftRight, module: 'finance', requiredPermissions: ['finance.reconciliation'] },
      { label: 'Reports', path: '/finance/reports', icon: PieChart, module: 'finance', requiredPermissions: ['finance.reports'] },
      { label: 'PTL Billing', path: '/finance/ptl-billing', icon: IndianRupee, module: 'finance', requiredPermissions: ['finance.invoices'] },
      { label: 'PTL Margin Report', path: '/finance/ptl-margin', icon: TrendingUp, module: 'finance', requiredPermissions: ['finance.reports'] },
      { label: 'Finance Settings', path: '/finance/settings', icon: Settings, module: 'finance', requiredPermissions: ['finance.settings'] },
    ],
  },
];
