// ============================================================
// Optimile ERP – Main Application Router
// ============================================================
// This is the single entry point that connects all 5 modules
// under one unified shell with RBAC and multi-tenancy.
//
// ARCHITECTURE:
//   /login         → Shared Login
//   /tms/*         → TMS Module routes
//   /fleet/*       → Fleet Control Module routes (includes Tyre Intelligence)
//   /ams/*         → AMS / Procurement Module routes
//   /finance/*     → Financial Management routes
//   /settings/*    → System-wide settings (Super Admin)
// ============================================================

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './shared/context/AuthContext';
import { ToastProvider } from './shared/context/ToastContext';
import { OperationalDataProvider } from './shared/context/OperationalDataContext';
import { Layout } from './shared/components/Layout';
import { Login } from './shared/components/Login';
import { AccessDenied } from './shared/components/AccessDenied';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { ERPDashboard } from './pages/ERPDashboard';

// ── TMS Module Components ───────────────────────────
import { Dashboard as TMSDashboard } from './modules/tms/pages/Dashboard';
import { Bookings as TMSBookings } from './modules/tms/pages/Bookings';
import { Tracking as TMSTracking } from './modules/tms/pages/Tracking';
import { Operations as TMSOperations } from './modules/tms/pages/Operations';
import { Drivers as TMSDrivers } from './modules/tms/pages/Drivers';
import { Fleet as TMSFleet } from './modules/tms/pages/Fleet';
import { Reports as TMSReports } from './modules/tms/pages/Reports';
import { Settings as TMSSettings } from './modules/tms/pages/Settings';
import { FinanceTools as TMSFinanceTools } from './modules/tms/pages/FinanceTools';
import { HOApprovalQueue } from './modules/tms/components/approvals/HOApprovalQueue';
import { ControlTower } from './modules/tms/components/operations/control-tower/ControlTower';
// ── PTL Module (new pages) ───────────────────────────
import PTLDashboard from './modules/tms/pages/ptl/PTLDashboard';
import { PTLBookingWizard } from './modules/tms/pages/ptl/PTLBookingWizard';
import { PTLHubOperations } from './modules/tms/pages/ptl/PTLHubOperations';
import { PTLTracking } from './modules/tms/pages/ptl/PTLTracking';
import { PTLDelivery } from './modules/tms/pages/ptl/PTLDelivery';
import { PTLExceptions } from './modules/tms/pages/ptl/PTLExceptions';
import PTLVendorHub from './modules/tms/pages/ptl/PTLVendorHub';
import PTLBilling from './modules/tms/pages/ptl/PTLBilling';
import PTLAnalytics from './modules/tms/pages/ptl/PTLAnalytics';
import PTLSettings from './modules/tms/pages/ptl/PTLSettings';

// ── Fleet Control Module Components ───────────────────────────
import { DashboardPage as FleetDashboard } from './modules/fleet-control/pages/DashboardPage';
import { DriversPage as FleetDrivers } from './modules/fleet-control/pages/DriversPage';
import { FleetPage as FleetVehicles } from './modules/fleet-control/pages/FleetPage';
import { TyrePage as FleetTyres } from './modules/fleet-control/pages/TyrePage';
import { TyreTrackerPage } from './modules/fleet-control/pages/TyreTrackerPage';
import { TyreJobsPage } from './modules/fleet-control/pages/TyreJobsPage';
import { TyreInspectionsPage } from './modules/fleet-control/pages/TyreInspectionsPage';
import { TyreIndentsPage } from './modules/fleet-control/pages/TyreIndentsPage';
import { TyreDetailPage } from './modules/fleet-control/pages/TyreDetailPage';
import { TyreInventoryPage } from './modules/fleet-control/pages/TyreInventoryPage';
import { MaintenancePage as FleetMaintenance } from './modules/fleet-control/pages/MaintenancePage';
import { CompliancePage as FleetCompliance } from './modules/fleet-control/pages/CompliancePage';
import { OpsIntelligencePage as FleetOpsIntel } from './modules/fleet-control/pages/OpsIntelligencePage';
import { ExceptionCenterPage as FleetExceptions } from './modules/fleet-control/pages/ExceptionCenterPage';
import { DataCoveragePage as FleetCoverage } from './modules/fleet-control/pages/DataCoveragePage';
import { ReconciliationPage as FleetReconciliation } from './modules/fleet-control/pages/ReconciliationPage';
import { LiveMapPage as FleetLiveMap } from './modules/fleet-control/pages/LiveMapPage';
import { DispatchPage as FleetDispatch } from './modules/fleet-control/pages/DispatchPage';
import { InventoryPage as FleetInventory } from './modules/fleet-control/pages/InventoryPage';
import { BatteryPage as FleetBattery } from './modules/fleet-control/pages/BatteryPage';
import { BatteryDetailsPage as FleetBatteryDetails } from './modules/fleet-control/pages/BatteryDetailsPage';
import { CostHealthPage as FleetCostHealth } from './modules/fleet-control/pages/CostHealthPage';
import { DriverBehaviorPage as FleetDriverBehavior } from './modules/fleet-control/pages/DriverBehaviorPage';
import { FuelPage as FleetFuel } from './modules/fleet-control/pages/FuelPage';
import { GaragePage as FleetGarage } from './modules/fleet-control/pages/GaragePage';
import { FleetSettingsPage as FleetSettings } from './modules/fleet-control/pages/FleetSettingsPage';
import { VendorManagementPage as FleetVendors } from './modules/fleet-control/pages/VendorManagementPage';
import { VehicleMasterPage } from './modules/fleet-control/pages/VehicleMasterPage';

// ── Finance Module Components ───────────────────────────
import { FinanceLayout } from './modules/finance/FinanceLayout';
import FinanceDashboard from './modules/finance/components/Dashboard';
import CustomerLedger from './modules/finance/components/CustomerLedger';
import VendorLedger from './modules/finance/components/VendorLedger';
import InvoiceList from './modules/finance/components/InvoiceList';
import CreateInvoice from './modules/finance/components/CreateInvoice';
import FleetLedger from './modules/finance/components/FleetLedger';
import Reconciliation from './modules/finance/components/Reconciliation';
import FinanceReports from './modules/finance/components/Reports';
import FinanceSettings from './modules/finance/components/Settings';
import VendorDetails from './modules/finance/components/VendorDetails';
import ApprovalMatrix from './modules/finance/components/ApprovalMatrix';
import PTLMarginReport from './modules/finance/components/PTLMarginReport';

// ── AMS Module Components ───────────────────────────
import { ClientHub } from './modules/ams/components/ClientHub';
import { AuctionDrafts } from './modules/ams/components/AuctionDrafts';
import { AuctionResultsPage } from './modules/ams/components/AuctionResultsPage';
import { AuditTrailDashboard } from './modules/ams/components/AuditTrailDashboard';
import { AuditAlertsPage } from './modules/ams/components/AuditAlertsPage';
import { AuditRetentionSettingsPage } from './modules/ams/components/AuditRetentionSettingsPage';
import { ActiveSessionsPage } from './modules/ams/components/ActiveSessionsPage';
import { Dashboard as AMSDashboard } from './modules/ams/components/common/Dashboard';
import { ExecutiveDashboard } from './modules/ams/components/common/ExecutiveDashboard';
import { ContractList, ContractDetail } from './modules/ams/components/common/ContractManager';
import { ContractImportPage } from './modules/ams/components/common/ContractImportPage';
import { ContractPreview } from './modules/ams/components/common/ContractPreview';
import { CreateAuction } from './modules/ams/components/common/CreateAuction';
import { LiveAuctionsDashboard } from './modules/ams/components/common/LiveAuctionsDashboard';
import { LiveAuctionDetail } from './modules/ams/components/common/LiveAuctionDetail';
import { VendorPortal } from './modules/ams/components/common/VendorPortal';
import { SpotMonitor } from './modules/ams/components/common/SpotMonitor';
import { ExecutionMapping } from './modules/ams/components/common/ExecutionMapping';
import { LiveSLAMonitor } from './modules/ams/components/common/LiveSLAMonitor';
import { SavingsAnalysisPage } from './modules/ams/components/common/SavingsAnalysisPage';
import { VendorInsightsDashboard } from './modules/ams/components/common/VendorInsightsDashboard';
import { VendorOnboardingDashboard } from './modules/ams/components/common/VendorOnboardingDashboard';
import { VendorRegistrationPage } from './modules/ams/components/common/VendorRegistrationPage';
import { VendorPendingApprovalsPage } from './modules/ams/components/common/VendorPendingApprovalsPage';
import { VendorBulkImportPage } from './modules/ams/components/common/VendorBulkImportPage';
import { VendorStatusManagementPage } from './modules/ams/components/common/VendorStatusManagementPage';
import { VendorApplicationReviewPage } from './modules/ams/components/common/VendorApplicationReviewPage';
import { VendorAuctionBidWorkspace } from './modules/ams/components/common/VendorAuctionBidWorkspace';
import { VendorQueueStatusPage } from './modules/ams/components/common/VendorQueueStatusPage';
import { CreateRFI as RFICreate, RFIView } from './modules/ams/components/common/RFIManager';
import { RFQBuilder } from './modules/ams/components/common/RFQBuilder';
import { TemplateDetails } from './modules/ams/components/common/TemplateDetails';
import { AuctionTemplates } from './modules/ams/components/AuctionTemplates';
import { AlternateQueueAnalyticsPage } from './modules/ams/components/AlternateQueueAnalyticsPage';
import { AlternateQueueDashboard } from './modules/ams/components/AlternateQueueDashboard';
import { AuctionAcceptanceDashboard } from './modules/ams/components/AuctionAcceptanceDashboard';
import { DisputesDashboard } from './modules/ams/components/common/DisputesDashboard';
import { DisputeDetailPage } from './modules/ams/components/common/DisputeDetailPage';
import { DisputeCreatePage } from './modules/ams/components/common/DisputeCreatePage';


const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
      <OperationalDataProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* Protected shell */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              {/* Default: ERP Dashboard */}
              <Route index element={<ERPDashboard />} />

              {/* ════════════════════════════════════════════ */}
              {/* TMS MODULE ROUTES                           */}
              {/* ════════════════════════════════════════════ */}
              <Route element={<ProtectedRoute requiredModule="tms" />}>
                <Route path="tms/dashboard" element={<TMSDashboard />} />
                <Route path="tms/control-tower" element={<ControlTower />} />
                <Route path="tms/bookings" element={<TMSBookings />} />
                <Route path="tms/approvals" element={<HOApprovalQueue />} />
                <Route path="tms/operations" element={<TMSOperations />} />
                {/* ── PTL Module (10 pages) ── */}
                <Route path="tms/ptl/dashboard" element={<PTLDashboard />} />
                <Route path="tms/ptl/booking" element={<PTLBookingWizard />} />
                <Route path="tms/ptl/hub-ops" element={<PTLHubOperations />} />
                <Route path="tms/ptl/tracking" element={<PTLTracking />} />
                <Route path="tms/ptl/delivery" element={<PTLDelivery />} />
                <Route path="tms/ptl/exceptions" element={<PTLExceptions />} />
                <Route path="tms/ptl/vendors" element={<PTLVendorHub />} />
                <Route path="tms/ptl/analytics" element={<PTLAnalytics />} />
                <Route path="tms/ptl/settings" element={<PTLSettings />} />
                <Route path="tms/tracking" element={<TMSTracking />} />
                <Route path="tms/finance/calculator" element={<TMSFinanceTools />} />
                <Route path="tms/fleet" element={<TMSFleet />} />
                <Route path="tms/drivers" element={<TMSDrivers />} />
                <Route path="tms/reports" element={<TMSReports />} />
                <Route path="tms/settings/*" element={<TMSSettings />} />
              </Route>

              {/* ════════════════════════════════════════════ */}
              {/* FLEET CONTROL MODULE (+ Tyre Intelligence)  */}
              {/* ════════════════════════════════════════════ */}
              <Route element={<ProtectedRoute requiredModule="fleet-control" />}>
                <Route path="fleet/dashboard" element={<FleetDashboard onNavigate={() => { }} />} />
                <Route path="fleet/ops-intel" element={<FleetOpsIntel />} />
                <Route path="fleet/exceptions" element={<FleetExceptions />} />
                <Route path="fleet/coverage" element={<FleetCoverage />} />
                <Route path="fleet/reconciliation" element={<FleetReconciliation />} />
                <Route path="fleet/live-map" element={<FleetLiveMap />} />
                <Route path="fleet/dispatch" element={<FleetDispatch />} />
                <Route path="fleet/vehicles" element={<FleetVehicles />} />
                <Route path="fleet/drivers" element={<FleetDrivers />} />
                <Route path="fleet/compliance" element={<FleetCompliance />} />
                <Route path="fleet/maintenance" element={<FleetMaintenance />} />
                <Route path="fleet/garage" element={<FleetGarage />} />
                <Route path="fleet/batteries" element={<FleetBattery />} />
                {/* Tyre Intelligence (merged into Fleet Control) */}
                <Route path="fleet/tyres" element={<FleetTyres />} />
                <Route path="fleet/tyres/inventory" element={<TyreInventoryPage />} />
                <Route path="fleet/tyres/tracker" element={<TyreTrackerPage />} />
                <Route path="fleet/tyres/jobs" element={<TyreJobsPage />} />
                <Route path="fleet/tyres/inspections" element={<TyreInspectionsPage />} />
                <Route path="fleet/tyres/indents" element={<TyreIndentsPage />} />
                <Route path="fleet/tyres/vehicle-master" element={<VehicleMasterPage />} />
                <Route path="fleet/tyres/:tyreId" element={<TyreDetailPage />} />
                <Route path="fleet/vendors" element={<FleetVendors />} />
                <Route path="fleet/inventory" element={<FleetInventory />} />
                <Route path="fleet/fuel" element={<FleetFuel />} />
                <Route path="fleet/behavior" element={<FleetDriverBehavior />} />
                <Route path="fleet/cost" element={<FleetCostHealth />} />
                <Route path="fleet/settings" element={<FleetSettings />} />
              </Route>

              {/* ════════════════════════════════════════════ */}
              {/* AMS / PROCUREMENT MODULE                    */}
              {/* ════════════════════════════════════════════ */}
              <Route element={<ProtectedRoute requiredModule="ams" />}>
                <Route path="ams/dashboard" element={<AMSDashboard />} />
                <Route path="ams/executive" element={<ExecutiveDashboard />} />

                {/* Client Hub + RFI/RFQ sub-pages */}
                <Route path="ams/clients" element={<ClientHub />} />
                <Route path="ams/clients/rfi/create" element={<RFICreate />} />
                <Route path="ams/clients/rfi/:id" element={<RFIView />} />
                <Route path="ams/clients/rfq/create" element={<RFQBuilder />} />
                <Route path="ams/clients/rfq/:id" element={<RFQBuilder />} />

                {/* Contracts + sub-pages */}
                <Route path="ams/contracts" element={<ContractList />} />
                <Route path="ams/contracts/import" element={<ContractImportPage />} />
                <Route path="ams/contracts/preview/:id" element={<ContractPreview />} />
                <Route path="ams/contracts/:id" element={<ContractDetail />} />

                {/* Auctions: Drafts list → Wizard → Live dashboard → Detail */}
                <Route path="ams/auctions/create" element={<AuctionDrafts />} />
                <Route path="ams/auctions/wizard" element={<CreateAuction />} />
                <Route path="ams/auctions/live" element={<LiveAuctionsDashboard />} />
                <Route path="ams/auctions/live/:id" element={<LiveAuctionDetail />} />
                <Route path="ams/auctions/results/:id" element={<AuctionResultsPage />} />

                {/* Vendor Portal + bid workspace + queue */}
                <Route path="ams/vendor-portal" element={<VendorPortal />} />
                <Route path="ams/vendor/auction/:id/bid" element={<VendorAuctionBidWorkspace />} />
                <Route path="ams/vendor/queue-status" element={<VendorQueueStatusPage />} />

                {/* Spot / Execution / SLA / Analytics */}
                <Route path="ams/spot" element={<SpotMonitor />} />
                <Route path="ams/execution" element={<ExecutionMapping />} />
                <Route path="ams/sla" element={<LiveSLAMonitor />} />
                <Route path="ams/analytics/savings" element={<SavingsAnalysisPage />} />
                <Route path="ams/analytics/vendors" element={<VendorInsightsDashboard />} />

                {/* Vendor Onboarding sub-pages */}
                <Route path="ams/vendors/onboarding" element={<VendorOnboardingDashboard />} />
                <Route path="ams/vendors/register" element={<VendorRegistrationPage />} />
                <Route path="ams/vendors/pending-approvals" element={<VendorPendingApprovalsPage />} />
                <Route path="ams/vendors/bulk-import" element={<VendorBulkImportPage />} />
                <Route path="ams/vendors/status-management" element={<VendorStatusManagementPage />} />
                <Route path="ams/vendors/review/:id" element={<VendorApplicationReviewPage />} />

                {/* Auction Templates */}
                <Route path="ams/auctions/templates" element={<AuctionTemplates />} />
                <Route path="ams/auction-templates/:id" element={<TemplateDetails />} />

                {/* Alternate Queue */}
                <Route path="ams/analytics/alternate-queue" element={<AlternateQueueAnalyticsPage />} />
                <Route path="ams/analytics/alternate-queue/dashboard" element={<AlternateQueueDashboard />} />
                <Route path="ams/auctions/acceptance/:id" element={<AuctionAcceptanceDashboard />} />

                {/* Disputes */}
                <Route path="ams/disputes" element={<DisputesDashboard />} />
                <Route path="ams/disputes/create" element={<DisputeCreatePage />} />
                <Route path="ams/disputes/:id" element={<DisputeDetailPage />} />

                {/* Audit + sub-pages */}
                <Route path="ams/audit" element={<AuditTrailDashboard />} />
                <Route path="ams/audit/alerts" element={<AuditAlertsPage />} />
                <Route path="ams/audit/retention" element={<AuditRetentionSettingsPage />} />
                <Route path="ams/audit/active-sessions" element={<ActiveSessionsPage />} />
              </Route>

              {/* ════════════════════════════════════════════ */}
              {/* FINANCE MODULE                              */}
              {/* ════════════════════════════════════════════ */}
              <Route element={<ProtectedRoute requiredModule="finance" />}>
                <Route path="finance" element={<FinanceLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<FinanceDashboard />} />
                  <Route path="customers" element={<CustomerLedger />} />
                  <Route path="vendors" element={<VendorLedger />} />
                  <Route path="vendors/:id" element={<VendorDetails />} />
                  <Route path="invoices" element={<InvoiceList />} />
                  <Route path="invoices/create" element={<CreateInvoice />} />
                  <Route path="fleet-ledger" element={<FleetLedger />} />
                  <Route path="reconciliation" element={<Reconciliation />} />
                  <Route path="approval-matrix" element={<ApprovalMatrix />} />
                  <Route path="reports" element={<FinanceReports />} />
                  <Route path="ptl-billing" element={<PTLBilling />} />
                  <Route path="ptl-margin" element={<PTLMarginReport />} />
                  <Route path="settings" element={<FinanceSettings />} />
                </Route>
              </Route>
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </OperationalDataProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
