# Optimile 2.0 UI/UX + Frontend System Blueprint

## A. Product Overview

### A1) Product Positioning
Optimile 2.0 is a multi-tenant logistics ERP + operations platform focused on India-first freight flows (FTL-first, PTL extensible) with global scalability.

### A2) Design Principles
1. **Operational clarity over visual complexity** (dispatchers and field users are time-constrained).
2. **RBAC-first rendering** at route, component, action, and API levels.
3. **Audit-first** with immutable event trails for critical operations.
4. **Progressive disclosure** for heavy workflows (booking, assignment, finance reconciliation).
5. **Offline-first field UX** for Driver and Vendor mobile workflows.
6. **Compliance-aware defaults** for RC, Insurance, PUC, Permit, e-Way Bill, POD.

### A3) Mandatory RBAC Access Formula
`Effective Access = Tenant Enabled Modules ∩ Role Modules ∩ Role Permissions`

### A4) Status and Process Backbone
**Booking lifecycle:**
`DRAFT → PENDING_RATE_APPROVAL → PENDING_ASSIGNMENT → ASSIGNED → DISPATCHED → IN_TRANSIT → DELIVERED → INVOICED → PAID`

**LR lifecycle rules:**
- LR generated **only on vehicle assignment**.
- LR is **immutable** after creation.
- LR is **unique per delivery/shipment leg**.

### A5) Experience Targets by Persona
- **CEO / Leadership:** KPI-first, cross-module visibility, low-click drilldown.
- **Ops users:** fast execution boards, bulk operations, exception-first UX.
- **Fleet manager:** compliance + utilization + assignment readiness.
- **Finance manager:** invoice integrity, payment matching, dispute closure.
- **Vendor:** own bids, own awarded loads, own vehicles/drivers.
- **Driver:** trip execution with minimal typing, offline queue, photo/evidence flows.
- **Customer:** own shipment transparency and self-serve POD/invoice/dispute.

---

## B. Role-based Navigation

> **Navigation policy:** hide inaccessible modules and unauthorized actions by default. If deep-link accessed without permission, show `PermissionDeniedState` with request-access CTA.

### B1) Super Admin (Platform)
- **Allowed modules:** Administration (global), Tenant control, Audit, Feature flags, Billing/config.
- **Restricted modules:** Tenant operational data editing unless impersonation with audit stamp.
- **Sidebar:**
  - Global Dashboard
  - Tenants
    - Tenant Registry
    - Tenant Health
    - Module Entitlements
  - Identity & Security
    - SSO/OTP
    - Global Role Templates
    - API Clients
  - Compliance & Audit
    - Cross-tenant Audit Stream
    - Security Events
  - Platform Settings
- **Dashboard widgets:** Active tenants, failed webhooks, API error rate, module adoption, suspicious access events.
- **Key actions:** Enable/disable tenant modules, lock tenant, rotate tenant keys, export audits.

### B2) Tenant Admin
- **Allowed modules:** Administration, TMS, Fleet, Finance, Auction, Customer Dashboard, Track & Trace (as tenant enabled).
- **Restricted:** Super-admin-only cross-tenant controls.
- **Sidebar:**
  - Tenant Dashboard
  - Administration
    - Users
    - Roles
    - Permission Matrix
    - Module Enablement
    - Master Data
    - LR Configuration
    - Customer Hierarchy
    - Audit Logs
  - Operations (TMS)
  - Fleet
  - Finance
  - Auction
  - Reports
- **Widgets:** user activation, pending approvals, open disputes, compliance expiring soon, on-time delivery.
- **Key actions:** Provision users, assign modules, configure master data, define LR strategy.

### B3) Ops User
- **Allowed:** TMS, Track & Trace, limited Auction/exception actions.
- **Restricted:** role administration, financial closure operations.
- **Sidebar:**
  - Ops Dashboard
  - Bookings
    - Create
    - List
    - Rate Approval Queue (if granted)
    - Assignment Board
    - Dispatch Board
  - Live Tracking
  - Exceptions & Delays
  - POD & Closure
- **Widgets:** pending assignments, delayed vehicles, unacknowledged exceptions, POD pending count.
- **Key actions:** create booking, assign vehicle, mark dispatch, raise/resolve exception.

### B4) Fleet Manager
- **Allowed:** Fleet, TMS (assignment + dispatch), Track & Trace.
- **Restricted:** finance approvals, tenant user management.
- **Sidebar:**
  - Fleet Dashboard
  - Vehicle Master
  - Driver Master
  - Maintenance Planner
  - Compliance Desk
  - GPS Tracking
  - Utilization Analytics
  - TMS Assignment Inbox
- **Widgets:** vehicles available, compliance expiring in 7/15/30 days, idle time, trip utilization.
- **Key actions:** assign vehicle/driver, block non-compliant vehicle, schedule maintenance.

### B5) Finance Manager
- **Allowed:** Finance + TMS (commercial/read limited).
- **Restricted:** trip execution actions, assignment controls.
- **Sidebar:**
  - Finance Dashboard
  - Invoice Workbench
  - Reconciliation
  - Disputes
  - Credit Notes
  - Tax & Compliance Reports
  - TMS Commercial View
- **Widgets:** unbilled delivered trips, overdue payments, dispute aging, DSO trend.
- **Key actions:** generate invoice batch, reconcile receipts, resolve disputes.

### B6) Vendor
- **Allowed:** own auctions/bookings/trips, own drivers/vehicles.
- **Restricted:** other vendor data, tenant master data, finance closure.
- **Sidebar (web portal):**
  - Vendor Dashboard
  - Available Loads / Auctions
  - Awarded Loads
  - Vehicle Assignment
  - Active Trips
  - Payments & Statements
  - Notifications
- **Widgets:** invited bids, win ratio, trips pending assignment, payment due.
- **Key actions:** bid, accept/reject, assign vehicle, add remarks.

### B7) Driver (mobile-first)
- **Allowed:** assigned trips only.
- **Restricted:** booking creation, other trips/users, finance/admin.
- **Bottom tabs:** Trips, Timeline, Alerts, Profile.
- **Widgets/Home cards:** assigned today, next milestone, sync status, GPS status.
- **Key actions:** accept trip, start trip, upload loading proof, raise exception, POD capture.

### B8) Customer
- **Allowed:** own shipments, PODs, invoices, disputes, consignee changes (policy-based).
- **Restricted:** internal assignment/fleet/vendor details except allowed visibility.
- **Sidebar:**
  - Customer Dashboard
  - Shipments
  - Live Tracking
  - POD Vault
  - Invoices
  - Disputes
  - Reports
- **Widgets:** in-transit shipments, delayed shipments, delivered today, invoice due.
- **Key actions:** track, download POD/invoice, raise dispute, request consignee change.

### B9) CEO
- **Allowed:** full tenant scope.
- **Restricted:** none (except explicit tenant policy).
- **Sidebar:**
  - Executive Dashboard
  - Operations Intelligence
  - Financial Intelligence
  - Fleet & Compliance Health
  - Customer SLA
  - Risk & Audit
- **Widgets:** revenue run-rate, OTIF, exception heatmap, fleet availability, region profitability.
- **Key actions:** drill down from KPI to shipment, trigger review workflows.

---

## C. Web UI Screens (React / Next.js)

## C1) Global Layout

### Shell
- **Left Sidebar (collapsible):** module groups + role-aware menu.
- **Topbar:** global search, module switcher, org/branch switch, notifications, profile.
- **Utility rail:** quick create (booking, auction, dispute), help, keyboard shortcuts.
- **Breadcrumbs:** always visible under topbar for deep task flows.
- **Audit Drawer (right slide-over):** entity timeline, who/what/when, API request IDs.

### Core Global Behaviors
- Route guard checks RBAC + tenant module entitlement.
- Component guard checks granular permissions (e.g., `booking.assign`).
- Empty states have contextual CTA (e.g., “No vehicles available with valid permit”).
- Sticky action bar for long forms (Save Draft, Validate, Submit).

## C2) Administration UI

1. **Tenant Management**
   - Tenant list with status (`ACTIVE`, `LOCKED`, `TRIAL`, `SUSPENDED`).
   - Tenant detail tabs: profile, SLA, entitlements, API keys, branding.

2. **Module Enablement**
   - Toggle matrix: module × environment with dependency rules.
   - Confirmation modal with impact summary (users affected, menus hidden).

3. **User Management**
   - User list + invite flow + bulk activation/deactivation.
   - Branch/region scoping and data access policy tags.

4. **Role Management**
   - Create custom role from template.
   - Module-scoped permissions and condition-based constraints.

5. **Permission Matrix**
   - Rows: resources, columns: actions (view/create/edit/approve/export/delete).
   - cell states: allow/deny/conditional.

6. **Customer Hierarchy**
   - Tree view (Enterprise → Region → Plant → Consignee).
   - lane-level contract overlays.

7. **Master Data**
   - Customer, Vendor, Vehicle, Driver, Material masters.
   - Import wizard with validation report.

8. **LR Configuration**
   - LR prefixes by branch/fiscal year/service.
   - Auto quota and failover to manual pool.

9. **Audit Logs**
   - Immutable stream with filters by actor, entity, action, date, IP/device.

## C3) TMS / Booking UI

### Screens
1. **Booking Dashboard**
   - KPI tiles: new today, pending approval, assignment backlog, in-transit, delayed.
   - Heatmaps by region/lane/service type.

2. **Create Booking (Progressive Stepper)**
   - Step order: Customer → Material → Source → Destination → Lane → Service → Commercial → Rate → Details → Submit.
   - At each step show validations, historical suggestions, lane contract hints.

3. **Booking List**
   - Kanban + table toggle by status.
   - Bulk actions per status (approve rate / assign / dispatch).

4. **Booking Detail**
   - Header: booking ID, SLA clock, status, commercial summary.
   - Tabs: Shipment Details, Rate Sheet, Assignment, Tracking, Documents, Audit, Remarks.

5. **Rate Approval Queue**
   - SLA timer, margin impact, exception reason.

6. **Assignment Screen**
   - Split pane: booking requirements vs candidate vehicles/drivers/vendors.
   - Eligibility badges: compliant docs, lane permit, availability.

7. **Dispatch View**
   - Checklist gates: e-way bill, documents, loading proof.

8. **Tracking View**
   - Map + timeline + geofence events + ETA confidence.

9. **Exception Management**
   - Exception taxonomy (vehicle breakdown, route block, consignee closed, detention).
   - RCA + escalation matrix.

10. **Delay Management**
   - predicted delay card + reason tagging + customer communication log.

11. **POD View**
   - POD image/PDF, signature metadata, OCR extracted fields.

12. **Invoice Trigger**
   - Eligibility checks before trigger (delivered + POD verified + no open dispute).

## C4) LR Management UI
- **LR Config:** prefix/fiscal reset, per-branch policies.
- **Auto LR Quota:** branch quota dashboard and low-balance alerts.
- **Manual Pool:** upload/allocate manual LR numbers.
- **Pre-generated Pool:** reserve blocks by branch/service.
- **LR Allocation Chain:** booking → assignment → LR binding timeline.
- **LR Detail:** immutable metadata and linked entities.
- **LR PDF View:** print-ready template + QR verification.

## C5) Fleet UI
- Fleet Dashboard (availability, utilization, compliance risks).
- Vehicle Master (specs, ownership type, lane eligibility).
- Driver Master (licenses, training, incident score).
- Maintenance Planner (preventive schedule + downtime impact).
- Compliance Desk (RC/Insurance/PUC/Permit expiries with alerts).
- GPS Live Tracking (fleet map with status clusters).
- Utilization Analytics (vehicle days utilized, revenue/km, empty run %).

## C6) Finance UI
- Invoice Workbench (auto-generated drafts, manual adjustments with audit).
- Reconciliation (bank import, payment mapping, short/over payment flags).
- Disputes (reason buckets, ownership, SLA aging).
- Reports (GST-ready summaries, outstanding aging, profitability by lane).

## C7) Customer Dashboard
- Shipment tracking table + live map.
- POD vault with search by invoice/shipment/date.
- Invoice center (status: draft/sent/paid/overdue).
- Dispute center with threaded communication.
- Analytics: on-time trend, lane reliability, exception frequency.

## C8) Track & Trace
- Live map with route polyline + checkpoints.
- ETA engine output with confidence band.
- Route deviation detector and breach alerts.
- Alert center (SOS, halt over threshold, geofence breach).

## C9) Auction UI
- Auction creation (lane, load details, floor/ceiling logic, windows).
- Vendor bidding console (rank anonymized if configured).
- Vendor comparison matrix (price, service score, compliance score).
- Award flow with approval chain + notification dispatch.

---

## D. Mobile UI Screens (React Native)

## D1) Navigation Architecture

### Auth Stack
- `LoginScreen` (mobile/email + tenant code).
- `OtpVerificationScreen`.

### Main App (role-specific tabs)
- **Driver Tabs:** Trips, Timeline, Alerts, Profile.
- **Vendor Tabs:** Loads, Active Trips, Notifications, Profile.
- **Customer Tabs:** Track, Documents, Disputes, Profile.

### Nested Stacks
- `TripStack`: TripList → TripDetail → ActionScreens (Accept/Start/Exception/POD).
- `LoadStack`: LoadList → LoadDetail → AssignVehicle.

### Deep Links
- `optimile://trip/{tripId}`
- `optimile://booking/{bookingId}`
- `optimile://dispute/{disputeId}`

## D2) Offline-first UX (critical)
- Local action queue with durable IDs (`uuid` + entity version).
- Sync states: `QUEUED`, `SYNCING`, `SYNCED`, `FAILED`, `CONFLICT`.
- Retry strategy: exponential backoff + manual retry CTA.
- Global offline banner and per-item sync chips.
- Conflict resolution sheet:
  - Show “Server changed after your action”.
  - Compare local vs server values.
  - Choose: keep mine / accept server / merge note.

## D3) Driver App Screens
1. Login (OTP)
2. Trip List (today/upcoming/completed)
3. Trip Detail (milestones, shipper/consignee contacts)
4. Accept Trip
5. Start Trip
6. Loading Confirmation (qty, photos)
7. e-Way Bill Entry / scan
8. Photo Upload (camera + compression)
9. Raise Exception
10. Mark Delay
11. POD Capture (photo + signature + timestamp + geotag)
12. Delivery Complete (summary + queued sync status)

**Driver-specific features**
- Background GPS heartbeat and geofence events.
- Foreground push alerts (route deviation, customer update).
- Offline event creation with eventual sync.

## D4) Vendor App Screens
- Booking/auction list
- Accept/Reject flow
- Assign vehicle + driver
- Track active trips
- Remarks and proof uploads
- Notifications center

## D5) Customer Mobile Screens
- Shipment track list
- Live map view
- POD/document viewer
- Invoice list and payment status
- Raise/track disputes
- Consignee change request flow

## D6) Device Capability Handling
- Camera permission gating + fallback to file picker.
- GPS required for active trip milestones.
- Push token registration lifecycle.
- Background services with battery-optimized intervals.

## D7) Mobile Components
- Shipment/trip cards
- Status chips (color + icon + text)
- Bottom sheets for actions
- FAB for raise exception
- Swipe actions (acknowledge/complete)
- Trip timeline component
- Offline banner
- Sync indicator badge

## D8) Performance Rules
- Lazy screen loading with split bundles.
- Paginated lists with windowing.
- Image compression before upload (quality presets).
- Skeleton loaders for list/detail/map states.

## D9) Error States
- No internet: queue actions + show offline mode.
- GPS off: blocking modal for trip-critical actions.
- Camera denied: permission education + settings deep-link.
- Sync failed: inline retry + bulk retry from Sync Center.
- Session expired: token refresh; fallback to login.

## D10) Security
- JWT + refresh token rotation.
- Secure token storage (`Keychain/Keystore` wrappers).
- API-side role/data-scope validation (never trust client).

---

## E. Forms & Fields

## E1) Booking Creation Form (Web)

| Step | Field | Type | Validation | Dependency | Error Message |
|---|---|---|---|---|---|
| Customer | customer_id | async select | required | tenant/customer scope | Select a customer |
| Material | material_type | select | required | customer contract | Select material |
| Source | source_location | location autocomplete | required | - | Source is required |
| Destination | destination_location | location autocomplete | required | source set | Destination is required |
| Lane | lane_id | select/auto-match | required | source+destination | No lane found, create temporary lane |
| Service | vehicle_type | select | required | lane rules | Select vehicle type |
| Commercial | freight_basis | select | required | service type | Select freight basis |
| Rate | base_rate | number | >0 | rate mode | Enter valid base rate |
| Details | pickup_datetime | datetime | future date | timezone | Pickup must be in future |
| Submit | terms_confirmed | checkbox | true | all previous valid | Please confirm terms |

## E2) Vehicle Assignment Form
- Fields: vehicle_id, driver_id, vendor_id, planned_dispatch_time, loading_point_contact.
- Validations:
  - vehicle compliance valid on dispatch date.
  - driver license valid + not on active conflicting trip.
  - vehicle capacity >= booking requirement.
- Dependency: LR generation trigger only after successful assignment.
- Errors:
  - “Vehicle permit expired for this lane.”
  - “Driver already assigned to overlapping trip.”

## E3) LR Configuration Form
- Fields: prefix, fiscal_year, branch_code, sequence_start, quota_mode, auto_replenish.
- Validations: unique prefix per branch+FY; sequence ranges non-overlapping.
- Errors: “LR sequence overlaps with existing pool.”

## E4) Invoice Generation Form
- Fields: shipment_ids, tax_profile, billing_party, invoice_date, due_terms.
- Validations: only delivered+POD-verified shipments; no open blockers.
- Errors: “Shipment has unresolved dispute; invoice blocked.”

## E5) Dispute Form (Finance/Customer)
- Fields: dispute_type, reference_entity, amount, reason, attachments, remarks.
- Validations: amount <= invoice outstanding; attachment max size.
- Errors: “Dispute amount exceeds outstanding balance.”

## E6) Driver Exception Form (Mobile)
- Fields: exception_type, severity, note, photos, location(auto), timestamp(auto).
- Validations: note required for critical severity; photo required for damage/breakdown.
- Errors: “Photo evidence is required for selected exception type.”

---

## F. Tables

## F1) Administration Tables

### Users Table
- **Columns:** Name, Mobile/Email, Role, Modules, Branch/Region, Status, Last Login.
- **Filters:** role, status, module, branch.
- **Row actions:** View, Edit, Reset MFA, Deactivate.
- **Bulk actions:** Activate, Deactivate, Assign role.
- **Permission visibility:** `admin.user.view/edit/deactivate`.

### Permission Matrix Table
- **Columns:** Module, Resource, View, Create, Edit, Approve, Export, Delete.
- **Filters:** module, role template.
- **Row actions:** Edit condition.
- **Bulk actions:** Apply template.

## F2) TMS Tables

### Booking List
- **Columns:** Booking ID, Customer, Lane, Vehicle Type, Pickup Date, Status, SLA Clock, Assigned Vendor, Rate.
- **Filters:** status, customer, lane, date range, service type, exception flag.
- **Row actions (RBAC):** View, Edit Draft, Send for Approval, Assign, Dispatch, Cancel.
- **Bulk actions:** rate approve, assign vendor, export.
- **Permission visibility:**
  - Assign button only for `booking.assign`.
  - Rate approve only for `booking.rate.approve`.

### Assignment Candidate Table
- **Columns:** Vehicle No, Vendor, Capacity, Compliance Score, Current Location, ETA to pickup, Driver readiness.
- **Filters:** availability, compliance, distance.
- **Row actions:** Assign, Hold, View compliance docs.

## F3) Fleet Tables

### Vehicle Master
- **Columns:** Vehicle No, Type, Ownership, Branch, Compliance Status, Next Maintenance, Utilization %.
- **Filters:** type, compliance, ownership, branch.
- **Row actions:** Edit, Mark unavailable, View docs.
- **Bulk actions:** Schedule maintenance, Export.

### Compliance Table
- **Columns:** Entity, RC Expiry, Insurance Expiry, PUC Expiry, Permit Expiry, Risk Level.
- **Filters:** expiring in (7/15/30), risk level, branch.
- **Row actions:** Upload renewal, Notify owner.

## F4) Finance Tables

### Invoice Table
- **Columns:** Invoice No, Customer, Linked Shipments, Amount, Tax, Date, Due Date, Status.
- **Filters:** status, customer, date range, overdue.
- **Row actions:** View, Download PDF, Mark Sent, Raise Credit Note.
- **Bulk actions:** Send invoices, Export GST report.

### Reconciliation Table
- **Columns:** Payment Ref, Payer, Amount Received, Date, Matched Invoices, Variance, Reco Status.
- **Filters:** unmatched, partial, date range.
- **Row actions:** Match, Split, Write-off request.

## F5) Auction Table
- **Columns:** Auction ID, Lane, Load Date, Floor Rate, Bid Count, Best Bid, Status, Awarded To.
- **Filters:** status, lane, date, customer.
- **Row actions:** View bids, Extend window, Award, Cancel.

## F6) Customer Tables

### Shipment Table
- **Columns:** Shipment ID, Booking Ref, Source, Destination, ETA, Current Status, Last Update.
- **Filters:** status, route, date, delay flag.
- **Row actions:** Track live, Download POD, Raise dispute.

---

## G. Components (Design System)

## G1) Tokens
- **Color semantics:**
  - Primary (brand), Success, Warning, Danger, Info.
  - Status colors mapped to booking lifecycle.
- **Typography:** high legibility, numeric tabular font for rates/KPIs.
- **Spacing scale:** 4/8/12/16/24/32.
- **Elevation:** 3 levels (card, modal, critical overlay).

## G2) Core Components
- Buttons: primary, secondary, ghost, danger, icon button.
- Inputs: text, number, async select, date-time, file upload, OTP.
- Table: sticky header, column pinning, server-side filters.
- Cards: KPI card, entity summary card, action card.
- Modal: confirmation, impact modal (with affected entities count).
- Drawer: audit drawer, detail side panel.
- Timeline: trip milestones, audit event timeline.
- Stepper: booking creation and onboarding flows.
- Audit Log component: actor avatar, action verb, entity link, timestamp.
- Remarks Panel: threaded comments with mention tags.
- Map component: marker clustering, route polyline, checkpoint chips.

## G3) UX Behavior Standards
- Destructive actions require typed confirmation for high-impact operations.
- Disabled buttons include tooltip with required permission or missing field.
- All async actions show optimistic indicator + audit event ID on completion.

---

## H. APIs Mapping (Frontend Integration Contract)

## H1) Auth & Session
- `POST /auth/login`
- `POST /auth/otp/verify`
- `POST /auth/refresh`
- `POST /auth/logout`

## H2) RBAC & Modules
- `GET /me/access` → enabled modules + permissions + data scope.
- `GET /roles`
- `PUT /roles/{roleId}/permissions`
- `GET /tenants/{tenantId}/modules`

## H3) TMS
- `POST /bookings`
- `GET /bookings`
- `GET /bookings/{id}`
- `POST /bookings/{id}/rate-approval`
- `POST /bookings/{id}/assign`
- `POST /bookings/{id}/dispatch`
- `POST /bookings/{id}/exception`
- `POST /bookings/{id}/delay`
- `POST /bookings/{id}/pod`

## H4) LR
- `GET /lr/config`
- `PUT /lr/config`
- `POST /lr/pool/manual`
- `POST /lr/pool/pregenerated`
- `GET /lr/{lrNo}`
- `GET /lr/{lrNo}/pdf`

## H5) Fleet
- `GET /vehicles`
- `POST /vehicles`
- `GET /drivers`
- `POST /maintenance/jobs`
- `GET /compliance/alerts`
- `GET /gps/live`

## H6) Finance
- `POST /invoices/generate`
- `GET /invoices`
- `POST /payments/reconcile`
- `GET /disputes`
- `POST /disputes`

## H7) Auction
- `POST /auctions`
- `GET /auctions`
- `POST /auctions/{id}/bids`
- `POST /auctions/{id}/award`

## H8) Customer/Tracking
- `GET /customer/shipments`
- `GET /tracking/{shipmentId}`
- `GET /pod/{shipmentId}`

## H9) API Error Contract (for UI)
```json
{
  "code": "PERMISSION_DENIED",
  "message": "You do not have permission to assign bookings.",
  "required_permission": "booking.assign",
  "request_id": "req_123"
}
```

Frontend handling:
- `PERMISSION_DENIED` → permission state UI.
- `VALIDATION_ERROR` → inline field errors.
- `CONFLICT` → open conflict resolution sheet (mobile/web).

---

## I. Folder Structure

## I1) Web (Next.js)
```txt
/apps/web
  /app
    /(auth)
    /(dashboard)
      /administration
      /tms
      /fleet
      /finance
      /auction
      /customer
      /tracking
  /components
    /ui
    /domain
      /booking
      /fleet
      /finance
      /audit
  /services
    /api
    /adapters
  /hooks
  /store
    /slices
  /utils
  /types
  /config
```

## I2) Mobile (React Native)
```txt
/apps/mobile/src
  /components
    /ui
    /domain
  /screens
    /auth
    /driver
    /vendor
    /customer
  /navigation
  /services
    /api
    /firebase
  /store
    /slices
  /hooks
  /offline
    /queue
    /sync-engine
    /conflict
  /utils
  /types
```

## I3) Shared Package (Monorepo recommendation)
```txt
/packages
  /design-system
  /types
  /api-contracts
  /utils
```

---

## J. UX Guidelines

1. **Shift-critical CTA hierarchy**
   - Primary CTA = next operational milestone (Assign, Dispatch, Start Trip).

2. **Exception-first operations**
   - Show unresolved exceptions before normal queue.

3. **SLA clock visibility**
   - SLA timer badge on booking rows/details and escalation color change.

4. **Context-preserving drilldowns**
   - Drawers/modals over navigation jumps for quick checks.

5. **Audit transparency**
   - Every write action surfaces “Recorded in audit log”.

6. **India-first data UX**
   - PIN code aware address entry, GSTIN validation, e-Way bill helpers.

7. **Accessibility**
   - WCAG-aligned contrast and keyboard navigable tables/forms.

8. **Localization-ready**
   - i18n keys from day one (English + Hindi-ready labels).

9. **Performance UX**
   - Keep initial dashboard payload lightweight; use progressive hydration.

10. **Trust UX**
   - Show source/time freshness for GPS/ETA (“Updated 2 min ago”).

---

## K. Edge Cases

1. **Permission changed during session**
   - Refresh access map on 403 and re-render nav/actions.

2. **Tenant disables a module in real time**
   - Force soft logout from module routes with explanation.

3. **Vehicle compliance expires mid-trip**
   - Alert Ops + Fleet; block new assignment but not in-flight closure.

4. **Duplicate POD uploads**
   - hash-based duplicate detection and user confirmation.

5. **Offline driver submits delivery then network returns after status changed**
   - conflict state with merge options and supervisor escalation.

6. **GPS spoof / impossible jumps**
   - anomaly flag in tracking UI and audit event.

7. **Rate approval timeout**
   - auto-escalate to next approver and log SLA breach.

8. **Invoice attempted before POD verification**
   - hard block with clear dependency message.

9. **Auction tie bids**
   - deterministic tie-break rule (timestamp/compliance score).

10. **Session expiry during long form**
   - preserve draft locally, re-authenticate, restore state.

11. **Branch transfer between tenants (enterprise migration)**
   - scoped data export/import wizard with integrity checks.

12. **Driver app denied camera permanently**
   - fallback workflow requiring manual supervisor confirmation.

---

## Implementation Notes (Execution-ready)
- Build web and mobile using shared domain types and API contracts to avoid drift.
- Implement permission utility:
  - `canAccessModule(user, module)`
  - `can(user, permission, resource?)`
  - `scopeFilter(data, userScope)`
- Keep all status enums and transitions in a shared package; UI should consume as constants.
- Instrument all workflow screens with event analytics for throughput and bottleneck detection.
