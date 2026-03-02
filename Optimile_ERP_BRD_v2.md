# Optimile ERP — Business Requirements Document

| Field | Value |
|---|---|
| **Version** | v2.0 — Comprehensive Edition |
| **Date** | February 2026 |
| **Classification** | Confidential — Internal Use Only |
| **Product** | Optimile ERP (Transport + Fleet + AMS + Finance) |
| **Audience** | Product, Engineering, Board of Directors, Investors |
| **Prepared By** | Optimile Product Team |
| **Status** | APPROVED FOR DEVELOPMENT |

> **Document Purpose:** This document defines the complete functional, operational, and technical requirements for the Optimile ERP platform. It covers end-to-end process flows, cross-module data linkages, entity schemas, role definitions, compliance requirements, and implementation phasing. It is intended to serve as the authoritative knowledge base for all product and engineering decisions.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Strategic Objectives & Success Metrics](#2-strategic-objectives--success-metrics)
3. [Stakeholders & User Personas](#3-stakeholders--user-personas)
4. [Transport Management System (TMS)](#4-transport-management-system-tms)
5. [Fleet Control Module](#5-fleet-control-module)
6. [Asset & Procurement Management System (AMS)](#6-asset--procurement-management-system-ams)
7. [Finance Module](#7-finance-module)
8. [Cross-Module Integration Architecture](#8-cross-module-integration-architecture)
9. [Notification & Alerting Engine](#9-notification--alerting-engine)
10. [Reporting & Analytics Framework](#10-reporting--analytics-framework)
11. [Role-Based Access Control (RBAC) & Security](#11-role-based-access-control-rbac--security)
12. [Non-Functional Requirements (NFR)](#12-non-functional-requirements-nfr)
13. [Technology Stack](#13-technology-stack)
14. [External Integrations](#14-external-integrations)
15. [Gap Analysis](#15-gap-analysis-original-brd-vs-this-document)
16. [Implementation Phasing](#16-implementation-phasing)
17. [Open Questions & Decisions Required](#17-open-questions--decisions-required)

---

## 1. Executive Summary

Optimile ERP is a purpose-built, multi-tenant Enterprise Resource Planning platform for the logistics and transportation industry. It replaces the fragmented landscape of standalone TMS, fleet software, procurement tools, and spreadsheet-based finance with a single, deeply integrated operational shell.

The platform is structured around four mutually reinforcing pillars:

- **Transport Management System (TMS)** — orchestrating the full lifecycle of a freight movement from customer inquiry to trip completion and proof of delivery.
- **Fleet Control** — managing every physical asset (vehicle, driver, tyre, fuel) and ensuring safety, compliance, and cost efficiency.
- **Asset & Procurement Management (AMS)** — a competitive auction and sourcing engine to acquire transport capacity at optimal rates.
- **Finance Module** — automating invoicing, payables, reconciliation, and unit economics, turning operational data directly into financial records.

Critically, these four pillars are not isolated features — they share a common `OperationalDataStore`, meaning that a trip created in TMS automatically creates payable obligations in Finance, a vehicle assigned in Fleet Control is visible in TMS dispatch, and a contract awarded in AMS defines the rates that Finance uses to generate invoices. This tight coupling is the primary competitive differentiator of the platform.

> ⚠️ **GAP IDENTIFIED:** The original BRD correctly identifies the four pillars but underspecifies the integration contracts between them. This document explicitly defines every cross-module data flow, trigger event, and shared entity to eliminate ambiguity during implementation.

---

## 2. Strategic Objectives & Success Metrics

### 2.1 Primary Objectives

| Objective | How Optimile Addresses It | Success KPI |
|---|---|---|
| Break operational silos | Unified `OperationalDataStore` shared across TMS, Fleet, AMS, Finance | Zero manual data re-entry across modules |
| Minimize freight cost | Competitive reverse auctions in AMS with auto-award logic (L1 Rate) | 5–15% reduction in per-km freight cost |
| Maximize fleet utilization | Real-time trip assignment, maintenance scheduling, idle detection | >85% vehicle utilization rate |
| Ensure regulatory compliance | Document expiry engine, driver score card, e-Way Bill & FASTag integration | 0 compliance violations flagged externally |
| Automate financial close | Trip-triggered invoice generation, automated reconciliation | Finance close time reduced by 60% |
| Enable real-time decisions | Live control tower with exception alerts, telematics feed | Exception resolution time <30 minutes |
| Scalable multi-tenant ops | RBAC, multi-region, multi-client architecture | Support 100+ concurrent enterprise clients |

### 2.2 Guiding Design Principles

- **Data Flows Down, Never Sideways:** Every module consumes data produced upstream (AMS → TMS → Fleet → Finance). No module should require manual re-entry of data created in another.
- **Single Source of Truth:** Vehicle master, driver master, vendor master, customer master are each owned by one module and read by all others.
- **Event-Driven Architecture:** Completion of a trip triggers Finance. Completion of a maintenance job triggers vehicle availability in TMS. Award of a bid triggers a contract in AMS.
- **Mobile-First for Field Actors:** Drivers, supervisors, and garage technicians operate from mobile; HO users operate from desktop.
- **Auditability by Default:** Every state change on a Trip, Contract, Invoice, or Vehicle must be logged with actor, timestamp, and before/after values.

---

## 3. Stakeholders & User Personas

> ⚠️ **GAP IN ORIGINAL BRD:** User personas were listed as role names only. This section defines each persona with their goals, pain points, primary screens, and mobile vs. desktop requirements.

| Persona | Primary Goal | Key Pain Points (Without ERP) | Primary Modules Used | Device |
|---|---|---|---|---|
| CEO / Executive | Profitability visibility & savings analysis | No real-time view of fleet P&L or freight cost savings | Dashboards, Finance Summary, AMS Savings | Desktop + Mobile (read) |
| Admin | System configuration & user management | Manual role assignment, no audit of config changes | All modules (config layer) | Desktop |
| Operations Head | Dispatch efficiency & exception resolution | Blind spots in live trips, manual escalation | TMS Control Tower, Fleet Assignment | Desktop + Mobile |
| Regional Supervisor | Local dispatch & driver management | No live visibility into nearby vehicles | TMS Dispatch, Driver Mobile Reports | Mobile-first |
| Finance Manager | Invoice generation & reconciliation | Manual invoice creation from trip sheets | Finance — all sub-modules | Desktop |
| Accountant | Ledger maintenance & payment processing | Bank statement matching is fully manual | Finance Ledger, Reconciliation | Desktop |
| Procurement Manager | Source capacity at lowest cost | Rate negotiation via email/phone | AMS full flow | Desktop |
| Vendor (Transporter) | Bid for contracts, raise disputes, submit invoices | No transparency in award decisions | AMS Vendor Portal | Desktop + Mobile |
| Garage Manager | Work order management & parts procurement | Paper-based job cards, no parts inventory link | Fleet Control — Maintenance | Desktop + Tablet |
| Driver | View trip assignment, report events | Phone calls for every update | TMS Driver App, Fleet Fuel/Report | Mobile only |
| Customer (Shipper) | Track shipment, receive invoice | No self-service tracking, email-only updates | Customer Portal (TMS), Finance | Mobile + Web |

---

## 4. Transport Management System (TMS)

The TMS is the operational heartbeat of Optimile ERP. It manages the complete lifecycle of a freight movement — from the moment a customer places a booking to the moment the shipment is delivered, proof of delivery (POD) is captured, and the trip is financially reconciled.

### 4.1 Master Data (Pre-requisites)

> ⚠️ **GAP:** The original BRD does not define Customer Master or Lane/Route Master — both are foundational for TMS.

- **Customer Master:** Customer name, GST number, billing address, credit limit, credit days, payment terms, primary contact. Linked to Finance (Receivables Ledger).
- **Lane Master:** Origin, destination, standard distance (km), standard transit time (hours), toll cost, standard freight rate by vehicle type. Used by AMS auction engine and TMS rate validation.
- **Commodity Master:** Type of goods (hazmat flag, fragile flag, temperature-sensitive flag), standard weight/volume.
- **Location Master:** All origin/destination locations with GPS coordinates, geofence radius, contact person, unloading bay count.
- **Vehicle Type Master:** Truck, trailer, tanker, LCV etc. with tonnage capacity, volume capacity, permitted commodity types.

### 4.2 Booking & Order Management

#### 4.2.1 Full Trip Load (FTL) Booking Flow

| Step | Actor | Action | System Output / Data Created | Cross-Module Trigger |
|---|---|---|---|---|
| 1 | Customer / Ops Team | Create Booking: origin, destination, commodity, weight, vehicle type, pickup date, freight amount | Booking record created — status: `PENDING_ASSIGNMENT` | AMS: Rate validation against L1 contract |
| 2 | System | Auto-validate freight rate against AMS contracted L1 rate for the lane. Flag if rate deviates >X% | Rate status: `APPROVED` / `PENDING_HO_APPROVAL` | AMS: Contract lookup by lane + vendor |
| 3 | Ops Manager / HO | Approve rate if flagged. Multi-tier approval queue based on deviation % | Booking status: `RATE_APPROVED` | Finance: Estimated revenue logged |
| 4 | Ops Team | Assign Vehicle + Driver to booking from available fleet pool | Trip record created. Vehicle status → `ASSIGNED` | Fleet Control: Vehicle availability check |
| 5 | System | Generate Trip ID, notify driver via mobile app with trip details and navigation link | Trip status: `DISPATCHED` | Fleet: Driver assignment logged |
| 6 | Driver (Mobile) | Acknowledge trip, mark vehicle loaded, capture loading photos & e-Way Bill number | Trip status: `IN_TRANSIT`. POD attempt = 0 | Compliance: e-Way Bill validated |
| 7 | System (Telematics) | Continuous GPS tracking; detect route deviations, overspeed, geofence entry/exit | Live trip track on Control Tower map | Fleet: Driver behavior events logged |
| 8 | Driver (Mobile) | Arrive at destination, capture delivery photos, collect recipient signature or OTP confirmation | POD captured. Trip status: `DELIVERED` | Finance: Invoice generation trigger |
| 9 | System | Auto-generate customer invoice based on agreed freight amount + extras (detention, toll) | Invoice status: `DRAFT` | Finance: Invoice Module |
| 10 | Finance Manager | Review and approve invoice, dispatch to customer | Invoice status: `SENT`. AR entry created | Finance: Receivables Ledger |

#### 4.2.2 Part Truck Load (PTL) / LCL Consolidation Flow

> ⚠️ **GAP:** Original BRD mentions PTL consolidation but does not define the consolidation logic. This is critical for multi-shipper operations.

- **Consolidation Hub:** Define consolidation points (hubs) where multiple PTL bookings for the same destination corridor are merged into a single FTL dispatch.
- **Booking Pooling:** System auto-groups PTL bookings by: same destination corridor + same pickup date window + compatible commodity types + combined weight ≤ vehicle capacity.
- **Consignment Note (CN) Generation:** Each PTL booking gets its own CN number. The consolidating trip carries multiple CNs.
- **Prorated Freight:** On delivery, freight is prorated to each CN based on weight/volume contribution. Finance generates separate invoices per customer.
- **POD per Consignment:** Driver must capture POD (photo + signature/OTP) for each CN dropped off — not just one global POD for the trip.

#### 4.2.3 Booking Status State Machine

| Status | Description | Next Possible States | Trigger |
|---|---|---|---|
| `DRAFT` | Booking initiated, not submitted | `PENDING_ASSIGNMENT`, `CANCELLED` | User saves booking |
| `PENDING_RATE_APPROVAL` | Rate deviation flagged, awaiting HO | `RATE_APPROVED`, `CANCELLED` | Rate deviation >threshold |
| `PENDING_ASSIGNMENT` | Rate approved, awaiting vehicle/driver | `ASSIGNED`, `CANCELLED` | Rate approved |
| `ASSIGNED` | Vehicle & driver allocated | `DISPATCHED`, `PENDING_ASSIGNMENT` | Vehicle + driver assigned |
| `DISPATCHED` | Vehicle en route to pickup | `IN_TRANSIT`, `EXCEPTION` | Driver acknowledges |
| `IN_TRANSIT` | Loaded, moving to destination | `DELIVERED`, `EXCEPTION`, `DELAYED` | Driver marks loaded |
| `EXCEPTION` | Breakdown, accident, route deviation | `IN_TRANSIT`, `CANCELLED` | System / driver reports |
| `DELAYED` | ETA exceeded by >2 hours | `IN_TRANSIT`, `DELIVERED` | System auto-detects |
| `DELIVERED` | POD captured at destination | `INVOICED` | Driver submits POD |
| `INVOICED` | Finance invoice generated | `PAID`, `DISPUTED` | Finance action |
| `CANCELLED` | Trip cancelled pre-dispatch | Terminal state | Ops / customer cancels |

### 4.3 Control Tower & Live Tracking

#### 4.3.1 Control Tower Dashboard

- **Live map view** of all active trips with color-coded status markers (In Transit = blue, Delayed = orange, Exception = red, Delivered = green).
- **Trip list panel** with filters: status, region, vehicle type, driver, customer, date range.
- **Alert panel:** Real-time exceptions — overdue departures, SLA breaches, breakdown reports, geofence violations.
- **One-click escalation:** Assign exception to Ops Manager with auto-notification.
- **ETA recalculation engine:** Based on current GPS position + historical speed on the lane, recalculate ETA on every GPS ping (configurable interval, default 5 min).

#### 4.3.2 Exception Management

> ⚠️ **GAP:** Original BRD lists exceptions in passing. Exceptions must have a structured lifecycle with defined resolution flows.

- **Exception Types:** Breakdown, Accident, Route Deviation >5km, Overspeeding Persistent (>30 min), Unauthorized Stoppage >60 min, Geofence Violation, Driver Unreachable, Document Expiry During Trip.
- **Exception Lifecycle:** `RAISED` → `ASSIGNED_TO_SUPERVISOR` → `IN_RESOLUTION` → `RESOLVED` / `ESCALATED_TO_OPS_HEAD`
- **SLA on Resolution:** Each exception type has a defined resolution SLA (e.g., breakdown must be resolved within 4 hours before auto-escalation).
- **Replacement Vehicle Flow:** On breakdown, ops can initiate replacement vehicle request — system shows nearest available vehicle, creates a new trip leg, and links it to the original trip for seamless POD and finance continuity.

### 4.4 Driver Mobile Application

> ⚠️ **GAP:** The original BRD mentions a mobile interface but does not specify the driver app workflows. This is a critical operational touchpoint.

#### 4.4.1 Driver App Feature Set

- **Trip Dashboard:** Current active trip with navigation, customer contact, special instructions, POD checklist.
- **Loading Confirmation:** Photo capture of loaded goods, e-Way Bill number entry, weight confirmation.
- **Live Navigation:** Integrated map with recommended route (from Route Master), toll booth markers.
- **Fuel Fill Reporting:** Driver submits fuel fill — quantity, amount, pump name, location, odometer reading, receipt photo. Triggers Fleet fuel reconciliation.
- **Expense Reporting:** Driver submits toll, parking, detention costs with receipt photos. Pending Finance approval.
- **Breakdown / Incident Reporting:** Structured form — breakdown type, location auto-captured, description, photos. Triggers exception flow in Control Tower.
- **POD Capture:** Destination photo, recipient name, signature canvas or OTP entry, timestamp auto-captured.
- **Offline Mode:** App must queue all actions locally and sync when connectivity is restored — critical for remote routes.

### 4.5 Head Office (HO) Approval Queues

- **Rate Deviation Approvals:** Tiered by deviation percentage — e.g., <5% auto-approved, 5–15% requires Ops Manager, >15% requires CEO.
- **Cancellation Approvals:** Post-dispatch cancellations require HO sign-off with reason code.
- **Detention Waiver:** Customer requests detention waiver — Ops Head approval required, linked to Finance adjustment.
- **Advance Payment to Driver:** Finance approval for driver advances >₹5,000.
- **Approval SLA:** All pending approvals show aging. Auto-escalate if unapproved beyond defined SLA.

### 4.6 e-Way Bill & FASTag Integration

> ⚠️ **GAP:** This is a mandatory compliance requirement for all Indian logistics operations. Not mentioned in original BRD.

- **e-Way Bill Integration:** API integration with NIC e-Way Bill portal. Auto-generate e-Way Bill from booking data (consignor, consignee, goods, vehicle, distance). Extend e-Way Bill on route change or delay. Alert driver and ops if e-Way Bill is expiring within 6 hours.
- **FASTag Reconciliation:** Import FASTag transaction feed from NETC portal. Auto-match toll charges to trips by vehicle + timestamp. Flag toll charges with no matching trip.

---

## 5. Fleet Control Module

Fleet Control manages every physical asset in the logistics network — vehicles, drivers, tyres, fuel, and maintenance. Its outputs (vehicle availability, driver readiness, cost-per-km data) are consumed by TMS (for dispatch) and Finance (for cost accounting).

### 5.1 Vehicle Master & Lifecycle

| Entity / Field | Description | Type | Linked To |
|---|---|---|---|
| Vehicle ID | System-generated unique identifier | PK | TMS, Finance, AMS |
| Registration Number | RC number as registered with RTO | String | Compliance, e-Way Bill |
| Vehicle Type | Truck / Trailer / Tanker / LCV — links to capacity specs | FK → VehicleType | TMS Dispatch |
| Ownership Type | Owned / Leased / Vendor-provided (attached vehicle) | Enum | AMS Vendor, Finance |
| Vendor / Owner ID | If vendor-provided, FK to vendor master in AMS | FK → Vendor | AMS, Finance Payables |
| Make / Model / Year | Manufacturer details for maintenance compatibility | String | Fleet Maintenance |
| Engine Number | For insurance and compliance purposes | String | Compliance Docs |
| Chassis Number | Unique frame identifier | String | Compliance Docs |
| Fuel Type | Diesel / CNG / Electric — drives fuel tracking logic | Enum | Fleet Fuel Module |
| Tyre Configuration | Number of tyres, positions (6+2, 10+2 etc.) | JSON | Tyre Intelligence |
| GPS Device ID | Linked telematics device (IMEI) | FK → Device | Telematics Feed |
| Operational Status | `AVAILABLE` / `ASSIGNED` / `IN_MAINTENANCE` / `INACTIVE` | Enum | TMS Dispatch |
| Base Location | Home depot / hub | FK → Location | TMS Routing |
| EMI Details | If financed: lender, EMI amount, start/end dates | JSON | Finance Expenses |

### 5.2 Document Compliance Engine

> ⚠️ **GAP:** Original BRD mentions document tracking but does not define the full document set, renewal flows, or integration with TMS dispatch blocking.

#### 5.2.1 Vehicle Documents

| Document | Issuing Authority | Renewal Cycle | Alert Lead Time | Dispatch Block |
|---|---|---|---|---|
| Registration Certificate (RC) | RTO | Every 15 years (new: lifetime) | 60 days prior | Yes |
| Vehicle Insurance | IRDAI-licensed insurer | Annual | 45 days prior | Yes |
| Pollution Under Control (PUC) | Authorized testing center | 6 months (BS6: annual) | 30 days prior | Yes |
| Fitness Certificate (FC) | RTO | Annual (new: 2 years) | 45 days prior | Yes |
| National Permit | State Transport Authority | Annual | 30 days prior | Yes |
| FASTag | NETC / Bank | No expiry (recharge-based) | Low balance alert | Optional |
| Route Permit | RTO | Annual / Trip-specific | 15 days prior | For restricted routes |

#### 5.2.2 Driver Documents

- **Driving License (DL):** Class of license (LMV, HMV, HGV). Expiry date. Alert 60 days prior. Dispatch block on expiry.
- **Medical Certificate:** Required for hazmat transport. Validity 1 year. Alert 30 days prior.
- **Badge / Authorization:** Company-issued driver ID badge. Annual renewal.
- **PSV Badge:** For passenger/school bus drivers — if applicable.

> 🔴 **Dispatch Block Logic:** If a vehicle is assigned to a trip and any of its mandatory documents are expired, OR the driver assigned has an expired DL, the system must block dispatch and notify Ops Manager with the specific document causing the block.

### 5.3 Maintenance & Garage Module

#### 5.3.1 Preventive Maintenance (PM) Schedule

- PM schedules defined per vehicle type (e.g., oil change every 10,000 km or 90 days, whichever earlier).
- System auto-triggers PM Work Order when vehicle crosses the km threshold or calendar date, based on odometer data from telematics.
- PM schedule templates configurable by Admin per vehicle type/make.

#### 5.3.2 Work Order (WO) Lifecycle

| Step | Actor | Action | System Output / Data Created | Cross-Module Trigger |
|---|---|---|---|---|
| 1 | System / Supervisor | Create Work Order: vehicle, job type, garage, description | WO created — status: `OPEN`. Vehicle status → `IN_MAINTENANCE` | TMS: Vehicle removed from available pool |
| 2 | Garage Manager | Assign mechanic(s), estimate parts required, set estimated completion date | WO status: `IN_PROGRESS` | Fleet Parts Inventory |
| 3 | System | Check parts inventory. If unavailable, raise Purchase Requisition | Purchase Requisition in AMS Procurement | AMS: Parts Procurement |
| 4 | Mechanic | Complete repair, log actual parts used, labor hours, additional findings | WO status: `PENDING_INSPECTION` | Finance: Maintenance cost accrual |
| 5 | Garage Manager | Quality inspection, approve completion, capture post-repair photos | WO status: `COMPLETED`. Vehicle status → `AVAILABLE` | TMS: Vehicle back in available pool |
| 6 | Finance | WO cost (parts + labor + external vendor) auto-posted to vehicle expense ledger | Expense entry in Finance. Cost/km updated | Finance: Fleet Ledger |

### 5.4 Tyre Intelligence Module

> 📋 **NOTE:** This is a key differentiator. Full tyre lifecycle tracking prevents premature failures and optimizes replacement costs.

- **Tyre Master:** Each tyre assigned a unique Tyre ID (linked to serial number). Brand, model, ply rating, speed rating, recommended pressure.
- **Tyre Inventory:** New tyres in stock, mounted tyres by vehicle/position, retreaded tyres, scrap tyres. Each with purchase date and cost.
- **Fitment & Removal Log:** Every time a tyre is mounted to or removed from a vehicle position, a log entry is created with odometer at fitment, odometer at removal, and reason for removal.
- **Tread Depth Tracking:** Manual entry at each service (garage WO). Minimum threshold configured per tyre type. Alert when approaching minimum.
- **Pressure Monitoring:** Integration with TPMS sensors (where available) for live pressure signals. Alert on under/over inflation.
- **Wear Analysis:** Per-tyre cost/km calculation. Identify outlier tyres with abnormal wear (potential alignment issues).
- **Retread Management:** Track when tyres are sent for retreading — vendor, cost, return date. Retreaded tyres re-enter inventory with updated mileage and cost basis.
- **KPI Dashboard:** Fleet-wide average tyre life (km), cost per tyre, top wear causes, predicted replacement queue for next 30 days.

### 5.5 Fuel & Energy Management

#### 5.5.1 Fuel Fill Tracking

- **Sources:** Driver app submission (manual), fuel card API feed (automated), GPS-based fuel sensor (telematics).
- Each fuel fill captures: Vehicle ID, driver, date/time, odometer, quantity (litres), cost per litre, total amount, pump name/location, receipt reference.
- System cross-validates: Odometer from fill vs. telematics odometer — flag >2% discrepancy.
- Tank capacity validation: If fill quantity > (tank capacity − estimated current level), flag as potential fraud.

#### 5.5.2 Fuel Economy Calculation

- **Per-trip fuel economy:** Distance (GPS) / fuel consumed (fills in that trip) = km/l.
- **Baseline comparison:** Actual km/l vs. manufacturer baseline for vehicle make/model. Flag if <80% of baseline.
- **Fuel Theft Detection:** Sudden fuel level drop (telematics) with no registered fill event = theft alert.
- **AdBlue Tracking:** Separate tracking for AdBlue (DEF) consumption on BS6 vehicles.

### 5.6 Driver Behavior & Scoring

| Event | Definition | Source | Score Impact | Alert To |
|---|---|---|---|---|
| Overspeeding | >80 km/h on highway, >60 in city | Telematics GPS | -10 per event | Ops Supervisor |
| Harsh Braking | Deceleration >0.3g | Telematics accelerometer | -8 per event | Ops Supervisor |
| Harsh Acceleration | Acceleration >0.3g | Telematics accelerometer | -5 per event | Fleet Manager |
| Night Driving | Driving between 11PM–5AM | GPS + timestamp | -3 per hour | Regional Manager |
| Route Deviation | Deviated >5km from assigned route | GPS geofence | -15 per event | Ops Manager |
| Unauthorized Stoppage | Non-approved stop >60 min | GPS idle detection | -5 per event | Supervisor |
| On-Time Delivery | POD within scheduled ETA | System calculated | +10 per trip | — |
| Zero Exceptions | Trip with no exceptions logged | System calculated | +5 per trip | — |

- **Monthly Score Card:** Score resets monthly. Score range 0–100. Band: 90–100 = Excellent, 75–89 = Good, 50–74 = Needs Improvement, <50 = Coaching Required.
- **Score-linked consequences:** Drivers below 50 for 2 consecutive months trigger HR process workflow (configurable).

---

## 6. Asset & Procurement Management System (AMS)

The AMS is the competitive sourcing engine of Optimile ERP. It manages the full vendor lifecycle — from onboarding and qualification through to rate discovery (via auctions), contract execution, SLA monitoring, dispute resolution, and vendor payable management.

### 6.1 Vendor Onboarding & Qualification

> ⚠️ **GAP:** Original BRD does not define vendor onboarding flow. Without this, auction participants cannot be identified or vetted.

| Step | Actor | Action | System Output | Cross-Module Trigger |
|---|---|---|---|---|
| 1 | Procurement Team | Initiate vendor registration invite — email/link sent to transporter | Vendor onboarding token generated | — |
| 2 | Vendor | Complete vendor profile: Company name, GST, PAN, bank details, fleet inventory, zones served | Vendor profile — status: `PENDING_VERIFICATION` | Fleet: Vendor vehicle pool |
| 3 | Procurement Manager | Verify documents: GST certificate, PAN, transport license, insurance, bank statement | Vendor status: `VERIFIED` / `REJECTED` | Finance: Vendor bank for payments |
| 4 | System | Assign vendor to applicable lane groups and commodity categories based on profile | Vendor invited to relevant RFIs and auctions | AMS Auction Engine |
| 5 | System | Periodic re-verification trigger (annual). Alert if vendor document expires | Vendor status: `RE_VERIFICATION_REQUIRED` | Compliance |

### 6.2 Sourcing Lifecycle: RFI → RFQ → Auction → Contract

#### 6.2.1 Request for Information (RFI)

- **Purpose:** Gather market intelligence on capacity availability and indicative rates before committing to an auction.
- **RFI contains:** Lane details (origin-destination), volume forecast, vehicle type required, indicative award criteria.
- **Vendors respond:** Yes/No for capacity, indicative rate range.
- **Output:** Qualified vendor shortlist for the RFQ/Auction.

#### 6.2.2 Request for Quotation (RFQ)

- For fixed, non-competitive sourcing (single-source or low-competition lanes).
- Sent to pre-approved vendor shortlist. Vendors submit quoted rates.
- Procurement manager compares quotes, selects vendor, generates contract directly.

#### 6.2.3 Auction Engine — Detailed Flows

**Auction Types**

| Auction Type | Mechanics | Best Use Case |
|---|---|---|
| Reverse Auction | Vendors compete to offer lowest rate. Each bid must be lower than current L1 by a minimum decrement. Timer extends on late bids (configurable: default 5 min extension per bid in last 10 min). | High-volume, competitive lanes with multiple vendors |
| Spot Auction | Single-round sealed bid for an urgent/one-time shipment. No visibility into competitor bids. Award to L1. | Ad-hoc urgent capacity requirements |
| Lot Auction | Multiple related lanes bundled into a lot. Vendors bid on the entire lot or specific lanes within it. System calculates best combination. | Route network optimization across a corridor |
| Bulk Auction | High-volume, multi-month commitment auctioned. Vendors bid on volume bands. Award split across L1, L2, L3 (configurable allocation matrix). | Annual rate contracting for major lanes |

**Auction Configuration Parameters**

- **Start Time & End Time:** Scheduled auction window. System sends reminders at T-24h, T-2h, T-15min.
- **Reserve Price (Ceiling Rate):** Maximum rate procurement is willing to pay. Hidden from vendors. Bids exceeding ceiling are auto-rejected.
- **Minimum Decrement:** Minimum % by which each new bid must beat the current L1 (e.g., 0.5%).
- **Dynamic Timer Extension:** If a valid bid is placed in the last N minutes, extend auction by M minutes (configurable).
- **Bid Count Limit:** Optional maximum number of bids per vendor.
- **Auto-Award Matrix:** Define allocation % for L1/L2/L3 (e.g., L1 gets 60%, L2 gets 30%, L3 gets 10% of volume).
- **Tie-Breaking Rules:** If two vendors bid the same rate, break by: earlier bid time, then higher vendor performance score.

**Auction State Machine**

| Status | Description | System Action |
|---|---|---|
| `DRAFT` | Being configured by procurement | Editable, not visible to vendors |
| `PUBLISHED` | Visible to invited vendors, pre-start | Email/portal notification sent to vendors |
| `LIVE` | Bidding window is open | Real-time bid feed, timer countdown visible to all |
| `EXTENDED` | Timer was extended due to last-minute bid | Notify all vendors of extension |
| `CLOSED` | Bidding window ended | Bid ranking computed. Awaiting award. |
| `AWARDED` | L1/L2/L3 vendors selected | Contract generation triggered. Unsuccessful vendors notified. |
| `CANCELLED` | Procurement cancelled auction | All vendors notified with cancellation reason |
| `NO_BIDS` | Auction closed with zero valid bids | Escalate to procurement head. Re-auction or RFQ suggested. |

### 6.3 Contract Management

- **Contract Auto-Generation:** On auction award, system auto-generates a transport contract pre-populated with: lane details, awarded vendor, L1 rate (base rate), volume allocation, contract duration, payment terms, penalty clauses, SLA definitions.
- **Contract Review & Signature:** DocuSign / Aadhaar eSign integration for digital signature by both parties. Contract PDF generated (jsPDF) and stored.
- **Rate Card Attachment:** Contract includes a lane-wise rate card (rate per km or per trip by vehicle type). This rate card is the source of truth for Finance invoice generation.
- **Contract Amendments:** Version-controlled amendments with re-approval workflow. Old contract versions archived.
- **Contract Expiry Management:** Alert 60 days before expiry. Trigger re-auction or renewal workflow automatically.

### 6.4 Execution Monitoring & SLA Tracking

- **Indent:** Each shipment requirement is raised as an indent against the contract. The vendor must place a vehicle against each indent within the agreed SLA window.
- **Vehicle Placement SLA:** e.g., 4 hours from indent for local, 24 hours for outstation. System auto-calculates breach on SLA expiry.
- **SLA Breach Penalty:** Configurable penalty per SLA breach type. Finance auto-applies penalty to vendor payable on confirmed breach.
- **Vendor Performance Scorecard:** On-time placement %, delivery success %, dispute rate, average response time — fed back into vendor ranking for future auctions.

### 6.5 Dispute Resolution Module

> ⚠️ **GAP:** Original BRD mentions dispute resolution but does not define the complete workflow. This is critical for vendor trust and payment accuracy.

| Step | Actor | Action | System Output | Cross-Module Trigger |
|---|---|---|---|---|
| 1 | Vendor | Raise dispute ticket: type (billing, SLA penalty waiver, rate dispute), reference trip/invoice, description, supporting docs | Dispute ticket: `OPEN` | Finance: Payment held if billing dispute |
| 2 | System | Auto-assign to relevant team: billing → Finance, SLA → Ops, rate → Procurement | Dispute: `ASSIGNED` | Based on dispute type |
| 3 | Internal Team | Review evidence, communicate with vendor via dispute thread, reach resolution | Dispute: `UNDER_REVIEW` | — |
| 4 | Internal Team / Vendor | Agree on resolution — full acceptance, partial acceptance, rejection | Dispute: `RESOLVED` / `REJECTED` | Finance: Adjust payment accordingly |
| 5 | Vendor | Can escalate to HO if rejected | Dispute: `ESCALATED` | Notification to Procurement Head |
| 6 | System | Dispute resolution SLA tracking — auto-escalate if unresolved beyond N days | Auto-escalation alert | — |

---

## 7. Finance Module

The Finance Module is the financial backbone of Optimile ERP. It transforms operational activities (trips, maintenance, contracts) into structured financial transactions. Every revenue event and every cost event originates from an operational trigger — no financial entry should be created in isolation.

> 📋 **DESIGN PRINCIPLE:** Finance is downstream of Operations. The Finance module never manually creates trips, contracts, or WOs — it only consumes confirmed operational data and converts it into financial transactions. This ensures auditability and eliminates billing errors.

### 7.1 Customer Invoicing (Accounts Receivable)

#### 7.1.1 Invoice Trigger Matrix

| Operational Event | Invoice Type | Rate Source | Approval Required |
|---|---|---|---|
| Trip status → `DELIVERED` + POD captured | Freight Invoice | Booking agreed rate / AMS contract rate | Finance Manager (for >₹1L) |
| Detention hours exceeded at loading/unloading | Detention Invoice | Detention rate from customer contract | Ops Head approval first |
| Multiple PTL CNs consolidated in one trip delivered | Individual CN Invoices (per shipper) | Prorated freight rate | Finance Manager |
| Monthly contract billing (fixed-rate customers) | Monthly Summary Invoice | Contract rate card | Finance Manager |
| Accessorial charges: toll reimbursement, security charges | Debit Note | Actuals from trip expense log | Finance Accountant |

#### 7.1.2 Invoice Structure & GST Compliance

> ⚠️ **GAP:** GST compliance is mandatory for Indian logistics. This was entirely absent from the original BRD.

- **Invoice Header:** Supplier GST, Customer GST, Invoice number (sequential, per GST law), Invoice date, Place of Supply.
- **Line Items:** Description of service, SAC code (998519 for road freight), taxable amount, GST rate, CGST + SGST (intra-state) or IGST (inter-state), total.
- **GTA Options:** System must support both Forward Charge (supplier pays GST, 12% with ITC) and Reverse Charge Mechanism (recipient pays GST, 5% no ITC) — configurable per customer.
- **E-Invoice:** Mandatory for turnover >₹5 Cr. Integration with IRP (Invoice Registration Portal) to generate IRN and QR code. System must embed IRN in invoice PDF.
- **E-Invoice Cancellation:** If invoice cancelled within 24 hours, auto-cancel on IRP. After 24 hours, issue credit note instead.

#### 7.1.3 Invoice Lifecycle

| Step | Actor | Action | System Output | Cross-Module Trigger |
|---|---|---|---|---|
| 1 | System | Auto-generate draft invoice on trip delivery + POD confirmation | Invoice status: `DRAFT`. Pre-populated from trip data. | TMS: Trip record |
| 2 | Finance Accountant | Review draft: verify amounts, add/remove accessorials, apply credit/debit notes | Invoice status: `REVIEWED` | — |
| 3 | System | GST computation: determine CGST/SGST vs. IGST based on states. Compute e-Invoice eligibility. | GST amounts computed | GST Module / IRP API |
| 4 | Finance Manager | Approve invoice (if >threshold) or auto-approve below threshold | Invoice status: `APPROVED` | — |
| 5 | System | Generate IRN via IRP API. Embed QR code. Generate PDF. | Invoice status: `REGISTERED`. PDF generated. | IRP API Integration |
| 6 | System | Dispatch invoice to customer via email (PDF attachment + portal link). | Invoice status: `SENT`. AR entry created in customer ledger. | Finance: AR Ledger |
| 7 | Customer | Pay invoice via bank transfer / NEFT / RTGS / UPI | Payment received in bank | Finance: Bank Reconciliation |
| 8 | System | Bank reconciliation matches payment to invoice. Mark invoice paid. | Invoice status: `PAID`. AR ledger updated. | Finance: Bank Feed |

### 7.2 Vendor Payables (Accounts Payable)

#### 7.2.1 Payable Generation Sources

- **Trip-based Freight Payable:** For vendor/attached vehicles — payment = AMS contracted rate × trip distance. Created on trip `DELIVERED` status.
- **Driver Advances & Settlements:** Advances given to driver pre-trip. Settlement on trip completion against actual submitted receipts.
- **Maintenance Work Order Payables:** External garage/vendor WO completion triggers AP entry.
- **Tyre Purchase Payable:** Tyre procurement from vendor creates AP entry.
- **SLA Penalty Deductions:** AMS-confirmed SLA breach auto-creates a debit note against vendor payable.

#### 7.2.2 Payment Processing

- **Payment Batch:** Finance creates payment batch grouping multiple payables to the same vendor. Subject to credit period from contract.
- **TDS Deduction:** Auto-compute TDS at applicable rates (Section 194C for freight: 1% for individuals, 2% for companies) and create TDS liability entry.
- **Payment Modes:** NEFT, RTGS, IMPS via banking API integration. System posts payment reference back to payable record.
- **Payment Advice:** Auto-generated payment advice sent to vendor with breakup of invoices paid and deductions.

### 7.3 Ledger Management

#### 7.3.1 Customer (AR) Ledger

- **Entries:** Invoice raised (+DR), Payment received (-CR), Credit Note (-DR), Advance receipt (-CR).
- **Aging Report:** Outstanding invoices bucketed by 0–30, 31–60, 61–90, 90+ days overdue.
- **Credit Limit Monitoring:** Alert when a customer's outstanding AR exceeds their credit limit. Option to block new bookings (configurable).

#### 7.3.2 Vendor (AP) Ledger

- **Entries:** Freight payable (+CR), Maintenance payable (+CR), Payment made (-DR), SLA penalty deduction (-CR), TDS deduction (-CR).
- **Vendor Statement:** Reconcile vendor-submitted invoices against system-computed payables.

#### 7.3.3 Fleet / Vehicle Ledger

- **Per-vehicle cost tracking:** Fuel, maintenance, tyre, toll, driver expense, EMI, depreciation.
- **Revenue attribution:** Each trip's freight revenue attributed to the vehicle that operated it.
- **Vehicle P&L:** Revenue − Total Costs = Vehicle Profitability. Expressed as ₹/km and ₹/month.

### 7.4 Expense Management

| Expense Type | Source / Entry Method | Approval Flow | Linked To |
|---|---|---|---|
| Fuel | Driver app / Fuel card API | Auto-approved with receipt | Fleet fuel module; Vehicle ledger |
| Toll | FASTag API / Driver app | Auto-approved if FASTag matched | Trip; Vehicle ledger |
| Driver Daily Allowance | Finance entry / HR module | Pre-approved per policy | Trip; Driver payroll |
| Loading/Unloading Labor | Driver app / Operations entry | Ops Supervisor approval | Trip cost |
| Maintenance / Repairs | Auto from completed WO | Approved via WO flow | Vehicle ledger; Fleet module |
| Tyre Purchase | Tyre inventory receipt | Procurement Manager | Tyre inventory; Vehicle ledger |
| Vehicle EMI | Scheduled recurring entry | Auto-created monthly | Finance liability; Vehicle ledger |
| Insurance Premium | Manual entry / import | Finance Manager | Vehicle compliance; Vehicle ledger |
| Office / Overhead | Manual Finance entry | Finance Manager | GL; P&L |

### 7.5 Bank Feed & Reconciliation

> ⚠️ **GAP:** Original BRD mentions bank reconciliation but does not define the matching logic, handling of unmatched entries, or multi-bank support.

- **Bank Feed Import:** Auto-import via Banking API (HDFC, ICICI, Axis, SBI via account aggregator / direct API). Manual CSV import fallback.
- **Auto-Matching Rules (in priority order):**
  1. Exact match on amount + UTR reference number → `MATCHED`
  2. Exact match on amount + ±2 day date range → `PROBABLE_MATCH` (human confirm)
  3. Amount match within ±0.5% (for TDS deducted) → `PROBABLE_MATCH`
  4. No match → `UNMATCHED`
- **Reconciliation Exceptions:** Unmatched bank credits (advance payments, wrong credits). Unmatched bank debits (bank charges, unauthorized debits).
- **Multi-Bank:** Support multiple bank accounts. Assign bank account to each branch/region. P&L consolidated.

### 7.6 Financial Reporting & Analytics

- **Profit & Loss (P&L):** Monthly/quarterly/annual. Revenue (freight + accessorials) minus all operational expenses.
- **Balance Sheet:** Assets (vehicles at WDV, receivables, cash) vs. Liabilities (payables, loans, GST payable).
- **Cash Flow Statement:** Operating, investing, financing cash flows.
- **Trip-Level Profitability:** Revenue per trip − (freight payable + driver expense + fuel + toll + prorated maintenance) = Trip Margin.
- **Lane-Level Profitability:** Aggregate trip margins by origin-destination lane. Identify profitable vs. loss-making lanes.
- **Customer Profitability:** Revenue and margin per customer. Feed into CRM for retention decisions.
- **GST Returns Data:** GSTR-1 (outward supplies), GSTR-3B (summary), TDS certificates (Form 16A). Export-ready for CA / tax filing.

---

## 8. Cross-Module Integration Architecture

> 📋 **NOTE:** This section is the most critical missing piece from the original BRD. Every data flow between modules must be explicitly defined to avoid development silos and integration bugs.

### 8.1 Integration Matrix Overview

*Read as: "What does the row module send TO the column module?"*

| Module → | TMS | Fleet Control | AMS | Finance |
|---|---|---|---|---|
| **TMS** | (self) | Trip assigned vehicle → vehicle status `IN_TRIP`. Driver assigned → driver status `ENGAGED`. | Booking created → rate validated against AMS contract. Trip delivered → payable triggered. | Trip `DELIVERED` → invoice generation trigger. Expense events → cost entries. |
| **Fleet** | Vehicle available/unavailable → updates dispatch pool. Driver score → trip assignment preference. | (self) | Maintenance requires parts → Purchase Requisition to AMS. | WO completed → maintenance cost to vehicle ledger. Fuel fill → fuel expense entry. |
| **AMS** | Contract awarded → rate card available for booking rate validation. Vendor vehicle confirmed → dispatch option. | Vendor vehicle pool → available for Fleet master. | (self) | Contract rate card → freight payable basis. SLA breach → penalty deduction in AP. |
| **Finance** | Credit limit breach → booking block alert. | EMI payment recorded → vehicle finance status. | Vendor payment released → AP status updated. | (self) |

### 8.2 Key Integration Events & Data Contracts

#### 8.2.1 TMS Trip → Finance Invoice

- **Trigger:** `Trip.status` transitions to `DELIVERED` AND `Trip.pod_captured = TRUE`
- **Data Passed:** `trip_id`, `customer_id`, `origin`, `destination`, `distance_km`, `vehicle_id`, `vehicle_type`, `freight_amount`, `agreed_rate`, `additional_charges[]`, `trip_date`, `delivery_date`, `pod_reference`
- **Finance Action:** Create Invoice with status `DRAFT`. Link `invoice.trip_id = trip.trip_id`.
- **Idempotency:** System must ensure only one invoice is created per `trip_id`. Duplicate trigger must be ignored.

#### 8.2.2 AMS Contract → TMS Rate Validation

- **Trigger:** New booking created for a lane that has an active AMS contract.
- **Data Passed:** `origin`, `destination`, `vehicle_type`, `booking_date`, `freight_amount_quoted`
- **AMS Action:** Look up active contract for lane + vehicle_type. Return `contracted_rate`, `deviation_threshold`, `contract_id`.
- **TMS Action:** If `|freight_amount_quoted − contracted_rate| / contracted_rate > deviation_threshold` → trigger HO approval queue.

#### 8.2.3 Fleet Maintenance WO → AMS Parts Procurement

- **Trigger:** WO status = `IN_PROGRESS` AND a required part is not available in Fleet parts inventory.
- **Data Passed:** `part_name`, `part_number`, `quantity_required`, `vehicle_id`, `wo_id`, `urgency_level`
- **AMS Action:** Create Purchase Requisition. If approved vendor exists for part, auto-generate RFQ.
- **Feedback Loop:** Parts received → Fleet parts inventory updated → WO can proceed.

#### 8.2.4 AMS Auction Award → Finance Rate Card

- **Trigger:** Auction status transitions to `AWARDED`.
- **Data Passed:** `auction_id`, `vendor_id`, `lane_id`, `awarded_rate`, `vehicle_type`, `volume_allocation_%`, `contract_start_date`, `contract_end_date`
- **Finance Action:** Create/update rate card entry for lane + vehicle_type. This becomes the basis for all freight payable calculations.

#### 8.2.5 Fleet Vehicle Status → TMS Dispatch Availability

- **Real-time sync:** `Fleet.vehicle.operational_status` is the single source of truth. TMS dispatch screen reads this field.
- **Status transitions:** `IN_MAINTENANCE` removes vehicle from dispatch pool. `AVAILABLE` adds it back. `ASSIGNED` (by TMS) → Fleet sees vehicle as on-trip.

### 8.3 Shared Master Data Ownership

| Master Entity | Owning Module | Read-Access Modules | Key Governance Rule |
|---|---|---|---|
| Customer Master | TMS | Finance, AMS | Finance cannot create a customer — must import from TMS. Duplicate GST check enforced. |
| Vendor Master | AMS | Finance, Fleet | Finance cannot create a vendor — must be onboarded via AMS. Bank details verified in AMS. |
| Vehicle Master | Fleet Control | TMS, Finance, AMS | Vehicle cannot be assigned in TMS if Fleet marks it unavailable. |
| Driver Master | Fleet Control | TMS | Driver cannot be assigned in TMS if DL expired in Fleet. Score card informs TMS assignment. |
| Location Master | TMS / Admin | Fleet, Finance, AMS | GPS coordinates maintained here for geofencing in Fleet and distance calculation in AMS. |
| Rate Card (Lane Rates) | AMS (contract output) | TMS, Finance | Rates flow FROM AMS contracts. TMS and Finance cannot set rates independently. |

---

## 9. Notification & Alerting Engine

> ⚠️ **GAP:** This entire system was missing from the original BRD. A logistics ERP without a structured notification engine is incomplete.

### 9.1 Notification Channels

- **In-App Notification Bell:** Real-time notifications within the ERP UI (desktop and mobile).
- **Email:** For formal communications — invoice dispatch, contract award, document expiry, payment advice.
- **SMS / WhatsApp:** For field actors — drivers, supervisors, vendors. Critical alerts that must reach people without internet.
- **Push Notification:** Driver mobile app push notifications for trip assignment, POD reminders.

### 9.2 Notification Trigger Catalogue

| Event | Module | Recipient | Channel | Priority |
|---|---|---|---|---|
| Trip assigned to driver | TMS | Driver | Push + SMS | HIGH |
| Trip delayed (ETA exceeded) | TMS | Ops Supervisor, Customer | In-App + Email | HIGH |
| Breakdown reported | TMS | Ops Head, Regional Mgr | In-App + SMS + Email | CRITICAL |
| Vehicle document expiring in 30 days | Fleet | Fleet Manager, Admin | In-App + Email | MEDIUM |
| Vehicle document EXPIRED | Fleet | Fleet Manager, Ops Head | In-App + SMS + Email | CRITICAL |
| PM service due | Fleet | Garage Manager | In-App + Email | MEDIUM |
| Low tyre tread depth alert | Fleet | Garage Manager | In-App | MEDIUM |
| Fuel theft suspected | Fleet | Fleet Manager, Finance | In-App + Email | HIGH |
| Auction goes LIVE | AMS | Invited vendors | Email + Portal notification | HIGH |
| Auction result (won/lost) | AMS | Vendor | Email + Portal | HIGH |
| SLA breach detected | AMS | Procurement Manager | In-App + Email | HIGH |
| Invoice generated (to customer) | Finance | Customer | Email (PDF attached) | HIGH |
| Payment received | Finance | Finance Manager | In-App | MEDIUM |
| Overdue invoice (>30 days) | Finance | Finance Manager, Ops Head | In-App + Email | HIGH |
| HO approval pending | TMS / Finance | Approving Manager | In-App + Email | HIGH |
| Rate deviation flagged | TMS / AMS | Ops Manager | In-App | MEDIUM |

---

## 10. Reporting & Analytics Framework

> ⚠️ **GAP:** The original BRD mentions dashboards but does not specify the analytics framework, KPIs, or report catalogue.

### 10.1 Executive Dashboard (CEO View)

- **Freight Savings:** Total auction savings (ceiling rate vs. awarded L1 rate) across all lanes, current month and YTD.
- **Fleet Utilization Rate:** % of active vehicles on trip at any given time. Trend chart (30 days).
- **On-Time Delivery Rate:** % trips delivered within scheduled ETA. By region, by customer.
- **Revenue vs. Target:** Current month revenue vs. budget. Pipeline (upcoming bookings).
- **Top 10 Customers** by Revenue and by Margin.
- **Top 5 Loss-Making Lanes:** Lanes where cost/km > revenue/km.

### 10.2 Operations Dashboard

- **Live Trip Counter:** Total active trips, in-exception trips, delayed trips.
- **Dispatch Efficiency:** Average time from booking creation to dispatch (by region).
- **Vehicle Availability Heat Map:** Geographic distribution of available vehicles vs. demand centers.

### 10.3 Fleet Intelligence Dashboard

- **Fleet Health Score:** Composite score based on document compliance %, pending PM jobs, average driver behavior score.
- **Cost per KM by Vehicle:** Bar chart ranked from highest to lowest cost/km. Click to drill into individual vehicle expense breakdown.
- **Maintenance Cost Trend:** Month-over-month maintenance spend.
- **Fuel Economy Comparison:** Actual km/l vs. baseline by vehicle make/model.

### 10.4 Finance Dashboard

- **AR Aging:** Outstanding receivables by aging bucket. Click to see customer detail.
- **AP Aging:** Outstanding payables. Cash requirement forecast for next 30/60/90 days.
- **DSO (Days Sales Outstanding):** Trend over 12 months.
- **Trip Profitability Distribution:** Histogram of trip margins. % of trips above/below threshold margin.

### 10.5 Standard Report Exports

- All reports exportable to: Excel (.xlsx), PDF, CSV.
- **Scheduled email reports:** Define frequency (daily, weekly, monthly), recipients, and report type.
- **Report types:** Invoice Register, Payable Aging, Vehicle Expense Summary, Driver Score Card Report, Tyre Replacement Forecast, Auction Savings Report, Trip-wise Profitability, GST Summary (GSTR-1 ready).

---

## 11. Role-Based Access Control (RBAC) & Security

Access control in Optimile ERP is modelled around the real organisational hierarchy of a logistics enterprise. Permissions cascade downward — a senior role always has at least the access of the roles below it within the same department. Cross-department access is explicitly granted on a need-to-know basis only.

---

### 11.1 Organisational Hierarchy

```
CEO
 ├── COO  (Chief Operating Officer)
 │    ├── VP Operations
 │    │    ├── Regional Manager  (one per region: North / South / East / West)
 │    │    │    └── Operations Manager
 │    │    │         └── Dispatch Supervisor
 │    │    │              └── Ground Supervisor
 │    │
 │    ├── Fleet Manager
 │    │    ├── Garage Manager
 │    │    │    └── Fleet Technician / Mechanic
 │    │
 │    └── Head of Procurement
 │         └── Procurement Manager
 │              └── Procurement Executive
 │
 └── CFO  (Chief Financial Officer)
      └── Finance Manager
           ├── Senior Accountant
           └── Accountant / Finance Executive

External Roles (strictly isolated portals):
 ├── System Admin  (IT — full config, no operational data)
 ├── Vendor        (AMS portal only — own bids, contracts, disputes)
 ├── Driver        (Mobile app only — own trips, fuel, expenses)
 └── Customer      (Tracking portal only — own shipments, own invoices)
```

---

### 11.2 Role Definitions

| Role | Department | Reports To | Scope |
|---|---|---|---|
| CEO | Executive | Board | Full organisation — strategic view |
| COO | Executive | CEO | All operations, fleet, procurement |
| CFO | Executive | CEO | All finance, financial risk, reporting |
| VP Operations | Operations | COO | National operational strategy & KPIs |
| Regional Manager | Operations | VP Operations | All ops activity within assigned region |
| Operations Manager | Operations | Regional Manager | Day-to-day trip management, dispatch oversight |
| Dispatch Supervisor | Operations | Operations Manager | Live dispatch, driver allocation, exception triage |
| Ground Supervisor | Operations | Dispatch Supervisor | Field execution, on-ground issue reporting |
| Fleet Manager | Fleet | COO | All vehicles, drivers, maintenance, compliance |
| Garage Manager | Fleet | Fleet Manager | Maintenance work orders, parts, garage operations |
| Fleet Technician | Fleet | Garage Manager | Execute maintenance jobs, update WO progress |
| Head of Procurement | Procurement | COO | Sourcing strategy, vendor relationships, contract authority |
| Procurement Manager | Procurement | Head of Procurement | Run auctions, manage RFQ/RFI, vendor qualification |
| Procurement Executive | Procurement | Procurement Manager | Operational sourcing tasks — RFI, RFQ, vendor comms |
| Finance Manager | Finance | CFO | Full finance operations — invoicing, payables, reconciliation |
| Senior Accountant | Finance | Finance Manager | Approve invoices/payments within threshold, manage ledgers |
| Accountant | Finance | Senior Accountant | Draft invoices, enter expenses, data entry |
| System Admin | IT | CTO / CEO | Platform configuration, user provisioning, audit access |
| Vendor | External | — | Own bids, contracts, invoices, disputes only |
| Driver | External | — | Own trip, own fuel fill, own expenses only |
| Customer | External | — | Own shipment tracking, own invoices only |

---

### 11.3 Permission Tables by Module

Permission levels used throughout: **C** = Create, **R** = Read, **U** = Update, **D** = Delete, **A** = Approve, **—** = No Access.

> **Inheritance rule:** A higher role in the same department always has equal or greater access than the role below it. Explicit overrides are noted.

---

#### 11.3.1 TMS — Bookings & Order Management

| Feature | CEO | COO | VP Ops | Reg. Mgr | Ops Mgr | Dispatch Sup. | Ground Sup. | CFO | Fin. Mgr | Fleet Mgr | Hd. Proc. | Driver | Customer |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| View all bookings (national) | R | R | R | — | — | — | — | R | — | — | — | — | — |
| View bookings (own region) | — | — | R | R | R | R | R | — | — | — | — | — | — |
| Create booking | — | — | — | — | CRU | CRU | — | — | — | — | — | — | — |
| Edit booking (pre-dispatch) | — | — | — | — | CRU | CRU | — | — | — | — | — | — | — |
| Cancel booking | — | A | A | A | A | — | — | — | — | — | — | — | — |
| Rate deviation — Tier 1 (<5%) | — | — | — | — | A (auto) | A (auto) | — | — | — | — | — | — | — |
| Rate deviation — Tier 2 (5–15%) | — | — | — | A | A | — | — | — | — | — | — | — | — |
| Rate deviation — Tier 3 (>15%) | A | A | — | — | — | — | — | — | — | — | — | — | — |
| Approve detention waiver | A | A | A | — | — | — | — | — | — | — | — | — | — |
| View customer master | R | R | R | R | R | R | — | R | R | — | R | — | — |
| Create / edit customer master | — | — | — | — | CRU | — | — | — | — | — | — | — | — |

---

#### 11.3.2 TMS — Dispatch, Control Tower & Trip Execution

| Feature | CEO | COO | VP Ops | Reg. Mgr | Ops Mgr | Dispatch Sup. | Ground Sup. | CFO | Fin. Mgr | Fleet Mgr | Driver |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Control Tower — national view | R | R | R | — | — | — | — | — | — | R | — |
| Control Tower — regional view | — | — | R | R | R | R | — | — | — | — | — |
| Assign vehicle to trip | — | — | — | — | CRU | CRU | — | — | — | — | — |
| Assign driver to trip | — | — | — | — | CRU | CRU | — | — | — | — | — |
| Override dispatch assignment | — | A | A | A | — | — | — | — | — | — | — |
| View live GPS / trip map | R | R | R | R | R | R | R | — | — | R | — |
| Raise exception | — | — | — | — | CRU | CRU | CRU | — | — | — | CRU |
| Resolve exception (own region) | — | — | — | A | A | A | — | — | — | — | — |
| Escalate exception to VP | — | — | — | — | — | A | — | — | — | — | — |
| Resolve exception (national) | — | A | A | — | — | — | — | — | — | — | — |
| Initiate replacement vehicle | — | — | — | A | A | — | — | — | — | — | — |
| View own assigned trip | — | — | — | — | — | — | — | — | — | — | R |
| Update trip status (driver) | — | — | — | — | — | — | — | — | — | — | CRU |
| Capture & submit POD | — | — | — | — | — | — | — | — | — | — | CRU |
| Submit fuel fill | — | — | — | — | — | — | — | — | — | — | C |
| Submit driver expense | — | — | — | — | — | — | — | — | — | — | C |

---

#### 11.3.3 Fleet Control — Vehicle & Driver Master

| Feature | CEO | COO | VP Ops | Reg. Mgr | Ops Mgr | Dispatch Sup. | CFO | Fin. Mgr | Fleet Mgr | Garage Mgr | Technician | Hd. Proc. |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| View vehicle master | R | R | R | R | R | R | R | R | CRUD | R | R | R |
| Create / edit vehicle master | — | — | — | — | — | — | — | — | CRUD | — | — | — |
| Decommission / archive vehicle | — | A | — | — | — | — | — | — | A | — | — | — |
| View driver master | R | R | R | R | R | R | — | — | CRUD | — | — | — |
| Create / edit driver master | — | — | — | — | — | — | — | — | CRUD | — | — | — |
| View vehicle compliance docs | R | R | R | R | R | — | — | — | CRUD | R | — | — |
| Upload / renew compliance docs | — | — | — | — | — | — | — | — | CRUD | — | — | — |
| View driver behavior scores | R | R | R | R | R | — | — | — | CRUD | — | — | — |
| View telematics / live GPS | R | R | R | R | R | R | — | — | R | — | — | — |
| View vehicle availability status | R | R | R | R | R | R | — | — | R | — | — | — |

---

#### 11.3.4 Fleet Control — Maintenance & Garage

| Feature | CEO | COO | Ops Mgr | CFO | Fin. Mgr | Fleet Mgr | Garage Mgr | Technician | Hd. Proc. | Proc. Mgr |
|---|---|---|---|---|---|---|---|---|---|---|
| View all maintenance WOs | R | R | R | R | R | CRUD | CRUD | R | — | — |
| Create maintenance WO | — | — | — | — | — | CRUD | CRUD | — | — | — |
| Assign technician to WO | — | — | — | — | — | CRUD | CRUD | — | — | — |
| Update WO progress / log parts | — | — | — | — | — | — | — | CRUD | — | — |
| Approve WO completion | — | — | — | — | — | A | A | — | — | — |
| View parts inventory | — | — | — | — | R | R | CRUD | R | R | R |
| Adjust parts inventory | — | — | — | — | — | A | CRUD | — | — | — |
| Raise purchase requisition (parts) | — | — | — | — | — | — | CRUD | — | — | — |
| Approve purchase requisition | — | A | — | — | — | A | — | — | A | — |
| View PM schedules | R | R | R | — | — | CRUD | CRUD | R | — | — |
| Create / edit PM schedules | — | — | — | — | — | CRUD | — | — | — | — |

---

#### 11.3.5 Fleet Control — Fuel & Tyre Management

| Feature | CEO | COO | CFO | Fin. Mgr | Fleet Mgr | Garage Mgr | Technician | Ops Mgr | Driver |
|---|---|---|---|---|---|---|---|---|---|
| View fuel fill records | R | R | R | R | CRUD | R | — | R | — |
| Approve / reject fuel fill (submitted by driver) | — | — | — | — | A | — | — | A | — |
| View fuel economy reports | R | R | R | R | R | R | — | R | — |
| Flag fuel theft / anomaly | — | — | — | — | CRUD | — | — | CRUD | — |
| View tyre inventory | R | R | — | — | CRUD | CRUD | R | — | — |
| Create / edit tyre records | — | — | — | — | CRUD | CRUD | — | — | — |
| Log tyre fitment / removal | — | — | — | — | — | CRUD | CRUD | — | — |
| View tyre wear analytics | R | R | — | R | CRUD | R | — | — | — |
| View KPI dashboard (fleet) | R | R | R | R | R | — | — | R | — |

---

#### 11.3.6 AMS — Vendor Management & Sourcing

| Feature | CEO | COO | CFO | Fin. Mgr | Hd. Proc. | Proc. Mgr | Proc. Exec. | Fleet Mgr | Vendor |
|---|---|---|---|---|---|---|---|---|---|
| Invite vendor for onboarding | — | — | — | — | CRUD | CRUD | — | — | — |
| Verify & approve vendor | — | — | — | — | A | A | — | — | — |
| View vendor profiles | R | R | R | R | CRUD | CRUD | R | R | own only |
| Edit vendor profile | — | — | — | — | CRUD | CRUD | — | — | — |
| Deactivate / blacklist vendor | — | A | — | — | A | — | — | — | — |
| Create RFI | — | — | — | — | CRUD | CRUD | CRUD | — | — |
| Respond to RFI | — | — | — | — | — | — | — | — | CRUD |
| Create RFQ | — | — | — | — | CRUD | CRUD | CRUD | — | — |
| Respond to RFQ | — | — | — | — | — | — | — | — | CRUD |
| View vendor performance scorecard | R | R | — | — | CRUD | R | — | R | own only |

---

#### 11.3.7 AMS — Auction Engine

| Feature | CEO | COO | CFO | Hd. Proc. | Proc. Mgr | Proc. Exec. | Ops Mgr | Vendor |
|---|---|---|---|---|---|---|---|---|
| Create / configure auction | — | — | — | CRUD | CRUD | — | — | — |
| Publish auction | — | — | — | A | A | — | — | — |
| View live auction (internal) | R | R | R | R | R | R | R | — |
| View live auction (vendor side) | — | — | — | — | — | — | — | R |
| Place bid | — | — | — | — | — | — | — | CRUD |
| Cancel auction (pre-live) | — | A | — | A | — | — | — | — |
| Cancel auction (live) | A | A | — | A | — | — | — | — |
| Award auction result | — | — | — | A | A | — | — | — |
| Override award | A | A | — | — | — | — | — | — |
| View bid history (all vendors) | — | — | — | R | R | — | — | — |
| View own bid history | — | — | — | — | — | — | — | R |
| View auction audit trail | R | R | — | R | R | — | — | — |

---

#### 11.3.8 AMS — Contracts, SLA & Disputes

| Feature | CEO | COO | CFO | Fin. Mgr | Hd. Proc. | Proc. Mgr | Proc. Exec. | Ops Mgr | Vendor |
|---|---|---|---|---|---|---|---|---|---|
| View all contracts | R | R | R | R | CRUD | CRUD | R | R | own only |
| Create / edit contract | — | — | — | — | CRUD | CRUD | — | — | — |
| Approve & sign contract | A | — | — | — | A | — | — | — | sign own |
| Amend contract | — | A | — | — | A | — | — | — | — |
| View rate card (lane rates) | R | R | R | R | R | R | R | R | own only |
| View SLA performance | R | R | — | — | R | R | R | R | own only |
| Confirm SLA breach | — | — | — | — | — | A | — | A | — |
| Raise dispute | — | — | — | — | — | — | — | — | CRUD |
| View disputes | R | R | — | R | R | R | — | R | own only |
| Assign dispute to team | — | — | — | — | A | A | — | — | — |
| Resolve / reject dispute | — | — | — | A | A | A | — | — | — |
| Escalate dispute to HO | — | — | — | — | — | — | — | — | CRUD |
| Final dispute override | A | A | — | — | A | — | — | — | — |

---

#### 11.3.9 Finance — Invoicing (AR)

| Feature | CEO | COO | CFO | Fin. Mgr | Sr. Accountant | Accountant | Ops Mgr | Customer |
|---|---|---|---|---|---|---|---|---|
| View all invoices | R | R | R | CRUD | CRUD | R | R | own only |
| View invoice (own customer) | — | — | — | — | — | — | — | R |
| Create draft invoice | — | — | — | CRUD | CRUD | CRUD | — | — |
| Edit draft invoice | — | — | — | CRUD | CRUD | CRUD | — | — |
| Approve invoice (up to ₹1L) | — | — | — | — | A | — | — | — |
| Approve invoice (₹1L–₹10L) | — | — | A | A | — | — | — | — |
| Approve invoice (>₹10L) | A | — | A | — | — | — | — | — |
| Cancel invoice (within 24h, pre-IRP) | — | — | A | A | — | — | — | — |
| Issue credit note | — | — | A | A | A | — | — | — |
| Dispatch invoice to customer | — | — | — | CRUD | CRUD | — | — | — |
| Mark invoice paid (manual) | — | — | — | CRUD | CRUD | — | — | — |
| View customer ledger (AR) | R | — | R | CRUD | CRUD | R | — | — |
| Adjust customer credit limit | — | — | A | A | — | — | — | — |

---

#### 11.3.10 Finance — Vendor Payables (AP)

| Feature | CEO | COO | CFO | Fin. Mgr | Sr. Accountant | Accountant | Hd. Proc. | Proc. Mgr | Vendor |
|---|---|---|---|---|---|---|---|---|---|
| View all payables | R | R | R | CRUD | CRUD | R | R | R | own only |
| Approve system-generated payable | — | — | — | A | A | — | — | — | — |
| Adjust payable amount | — | — | A | A | — | — | — | — | — |
| Approve SLA penalty deduction | — | — | — | A | A | — | A | A | — |
| Create payment batch | — | — | — | CRUD | CRUD | — | — | — | — |
| Approve payment (up to ₹5L) | — | — | — | A | A | — | — | — | — |
| Approve payment (₹5L–₹50L) | — | — | A | — | — | — | — | — | — |
| Approve payment (>₹50L) | A | — | A | — | — | — | — | — | — |
| View vendor ledger (AP) | R | — | R | CRUD | CRUD | R | R | R | own only |
| View TDS certificates | — | — | R | R | R | R | — | — | own only |
| Process advance to driver | — | — | — | A | — | — | — | — | — |

---

#### 11.3.11 Finance — Expenses, Bank Reconciliation & Reporting

| Feature | CEO | COO | CFO | Fin. Mgr | Sr. Accountant | Accountant | Fleet Mgr | Ops Mgr |
|---|---|---|---|---|---|---|---|---|
| View all expenses | R | R | R | CRUD | CRUD | R | R | R |
| Approve driver expense claims | — | — | — | — | A | — | — | A |
| Approve maintenance expense | — | — | — | A | A | — | A | — |
| Adjust expense entries | — | — | A | A | — | — | — | — |
| Import bank feed | — | — | — | CRUD | CRUD | — | — | — |
| View reconciliation dashboard | R | — | R | CRUD | CRUD | — | — | — |
| Match / unmatch bank transactions | — | — | — | CRUD | CRUD | — | — | — |
| Mark exception — unmatched entry | — | — | — | CRUD | CRUD | — | — | — |
| View P&L report | R | R | R | CRUD | R | — | — | — |
| View fleet ledger (cost/km) | R | R | R | R | R | — | R | — |
| Export GSTR-1 / GSTR-3B | — | — | R | CRUD | CRUD | — | — | — |
| Schedule report delivery | — | — | — | CRUD | CRUD | — | — | — |

---

#### 11.3.12 Platform Administration

| Feature | CEO | COO | CFO | Fin. Mgr | Fleet Mgr | Hd. Proc. | System Admin |
|---|---|---|---|---|---|---|---|
| Create / deactivate user | — | — | — | — | — | — | CRUD |
| Assign roles to users | — | — | — | — | — | — | CRUD |
| View all users & roles | R | R | R | — | — | — | CRUD |
| Configure approval thresholds | A | — | A | — | — | — | CRUD |
| Configure PM schedule templates | — | — | — | — | A | — | CRUD |
| Configure auction rulesets | — | — | — | — | — | A | CRUD |
| Configure GST / tax rules | — | — | A | A | — | — | CRUD |
| View audit logs (full) | — | — | — | — | — | — | R |
| View audit logs (own dept) | R | R | R | R | R | R | R |
| Configure notification rules | — | — | — | — | — | — | CRUD |
| System integrations config | — | — | — | — | — | — | CRUD |

---

### 11.4 Approval Authority Matrix

Certain actions require tiered approvals based on financial value or operational impact. The matrix below defines who holds authority at each tier.

| Action | Tier 1 (low value / low risk) | Tier 2 (mid value / mid risk) | Tier 3 (high value / high risk) |
|---|---|---|---|
| Rate deviation approval | <5%: Ops Mgr / Dispatch Sup. (auto) | 5–15%: Regional Manager | >15%: COO / CEO |
| Invoice approval | <₹1L: Sr. Accountant | ₹1L–₹10L: CFO / Fin. Mgr | >₹10L: CEO + CFO |
| Vendor payment release | <₹5L: Fin. Mgr / Sr. Accountant | ₹5L–₹50L: CFO | >₹50L: CEO + CFO |
| Contract award approval | Standard lane: Head of Procurement | Strategic lane (>₹1Cr annual): COO + Hd. Proc. | Multi-year national: CEO + COO |
| Maintenance WO approval | Routine PM: Garage Manager | >₹50,000 repair: Fleet Manager | >₹2,00,000 repair: COO |
| Purchase requisition (parts) | <₹10,000: Garage Manager | ₹10,000–₹1,00,000: Fleet Manager + Proc. Mgr | >₹1,00,000: COO + Hd. Proc. |
| Auction cancellation (live) | — | Published (pre-live): Hd. Procurement | Live auction: COO / CEO |
| Dispute final resolution | Billing dispute <₹10,000: Fin. Mgr | SLA dispute: Hd. Procurement + Ops Mgr | Escalated / legal risk: COO + CFO |
| Driver advance | <₹5,000: Dispatch Supervisor | ₹5,000–₹25,000: Ops Manager | >₹25,000: Finance Manager |
| Vehicle decommission | Recommend: Fleet Manager | Approve: COO | — |
| New vendor blacklist | Recommend: Proc. Mgr | Approve: Hd. Proc. | Escalated: COO |
| Credit limit adjustment (customer) | <₹5L: Finance Manager | ₹5L–₹50L: CFO | >₹50L: CEO + CFO |

---

### 11.5 Data Visibility Scoping Rules

Beyond create/read/update/delete permissions, data visibility is further restricted by organisational scope:

| Role | Data Scope Rule |
|---|---|
| CEO | All regions, all departments, all time ranges — no restrictions |
| COO | All operational data (TMS, Fleet, AMS). Finance data: read-only, no PII |
| CFO | All finance data. Operational data: read-only for cost context |
| VP Operations | All regions (national operational view). No finance entry access. |
| Regional Manager | Data scoped to **own region only** — trips, drivers, vehicles assigned to that region |
| Operations Manager | Data scoped to **own region only**, further filterable by their team |
| Dispatch Supervisor | Data scoped to **active trips and available assets in their depot / zone** |
| Ground Supervisor | Only their **own assigned trips** and field-level reporting forms |
| Fleet Manager | All vehicles and drivers in the fleet master nationally |
| Garage Manager | Only WOs, vehicles, and parts within their **assigned garage / workshop** |
| Finance Manager | All financial records nationally. No operational module creation rights. |
| Senior Accountant | All financial records. Cannot modify approved entries. |
| Accountant | Only **draft entries** they have created. Cannot view others' drafts. |
| Vendor | Strictly their **own bids, contracts, invoices, disputes** — zero cross-vendor visibility |
| Driver | Only their **own active and historical trips**, own expense submissions |
| Customer | Only their **own shipments and invoices** |

---

### 11.6 Security Requirements

- **Authentication:** JWT-based sessions with refresh token rotation. Session timeout after 30 min inactivity (configurable per role — field roles: 8 hours). MFA mandatory for: CEO, COO, CFO, Finance Manager, Senior Accountant, System Admin.
- **Authorization:** All API endpoints validate RBAC server-side on every request. UI-level hiding is supplementary only — never the sole access gate. Role checks use the user's assigned role + scope (region/depot) combination.
- **Scope Enforcement:** Regional data scoping enforced at the database query layer via row-level security (RLS in PostgreSQL), not just at the API or UI layer.
- **Audit Log:** Every Create, Update, Delete, and Approve action logged with: `user_id`, `role`, `timestamp`, `action_type`, `entity_type`, `entity_id`, `old_value` (JSON snapshot), `new_value` (JSON snapshot), `ip_address`, `device_type`.
- **Vendor Portal Isolation:** Vendor portal on a separate subdomain (`vendors.optimile.com`). API gateway enforces vendor-ID-based row filtering on every request. Zero internal ERP data accessible.
- **Customer Portal Isolation:** Customer portal on `track.optimile.com`. Customers can only retrieve records where `customer_id` matches their authenticated session.
- **Data Encryption:** All data encrypted at rest (AES-256). All data in transit encrypted (TLS 1.3 minimum). Database backups encrypted.
- **PII Handling:** Driver Aadhaar, PAN, bank account numbers stored with field-level encryption. Decryption keys accessible only to System Admin and Finance Manager roles. Masked in all UI views by default (show last 4 digits only).
- **Separation of Duties:** No single user can both create and approve a financial transaction (invoice, payment). System enforces this — if a user creates a draft invoice, the "Approve" button is disabled for that same user.
- **Password Policy:** Minimum 12 characters, must include uppercase, lowercase, number, special character. Enforced rotation every 90 days for Finance and Admin roles. Bcrypt hashing (cost factor 12).

---

## 12. Non-Functional Requirements (NFR)

| Category | Requirement | Acceptance Criterion |
|---|---|---|
| Performance | Control Tower map renders with 1000+ active vehicles | Initial load <3 sec; GPS update <500ms |
| Performance | Auction bid placement to confirmation | <200ms end-to-end latency during live auction |
| Performance | Invoice generation (PDF) | <5 seconds for single invoice PDF |
| Availability | Platform uptime | 99.9% monthly uptime (excluding scheduled maintenance) |
| Scalability | Telematics data ingestion | Handle 10,000 GPS pings/minute without data loss |
| Scalability | Concurrent users | Support 500 concurrent active sessions |
| Reliability | Telematics data durability | GPS data retained for 2 years; queryable |
| Reliability | Financial data durability | Zero data loss; point-in-time recovery to any 5-min window |
| Usability | Mobile responsiveness | All driver-facing screens usable on 5" screens with 3G connectivity |
| Usability | Offline driver app | App must function fully offline and sync on reconnection without data loss |
| Compliance | DPDP Act 2023 (India) | User consent, data localisation, breach notification within 72 hours |
| Compliance | GST compliance | GSTR-1/3B data export in government-mandated JSON format |
| Maintainability | API versioning | All internal APIs versioned. Breaking changes require 3-month deprecation notice. |
| Observability | System monitoring | Full APM: request tracing, error alerting, dashboard for all critical queues |

---

## 13. Technology Stack (Already in place)

| Layer | Technology | Rationale / Notes |
|---|---|---|
| Frontend Framework | React 19 + TypeScript (Vite build tool) | Type safety critical for complex form flows (Finance, AMS bidding). Vite for fast HMR in development. |
| Routing | React Router DOM v7 | Nested protected routes for module-level RBAC. Lazy loading per module for performance. |
| Styling | Tailwind CSS + Headless UI / shadcn/ui | Utility-first for rapid development. Headless components for accessibility compliance. |
| Icons | Lucide React | Consistent, tree-shakeable icon set. |
| Mapping | Leaflet + React-Leaflet | Open-source, performant for 1000+ marker rendering. Tile layer from Mapbox / OSM. |
| Data Visualization | Recharts | Composable React charts for Finance and Fleet dashboards. |
| Forms & Validation | React Hook Form + Zod | Zod preferred over Yup for TypeScript inference. Critical for Finance and AMS forms. |
| Document Generation | jsPDF + HTML2Canvas | Invoice and contract PDF generation. Consider react-pdf for complex layouts. |
| Excel Operations | xlsx (SheetJS) | Bulk import/export for Vehicle Master, Invoice registers. |
| State Management | Zustand + React Query | React Query for server-state caching and invalidation. Zustand for UI state. |
| Real-time | WebSockets (Socket.io) / Server-Sent Events | Required for: live auction bid feed, Control Tower GPS updates, notification bell. |
| Backend API | Node.js + NestJS (TypeScript) | NestJS for enterprise structure. REST + WebSocket support. |
| Database | PostgreSQL + TimescaleDB (telemetry) | PostgreSQL for transactional data. TimescaleDB extension for time-series GPS data. |
| Cache | Redis | Session cache, auction bid buffer, rate card cache. |
| Queue | BullMQ (Redis-backed) | Async job processing: invoice generation, notification dispatch, bank reconciliation. |
| File Storage | AWS S3 / Cloudflare R2 | POD photos, vehicle documents, contract PDFs. |
| Auth | JWT + Refresh Token rotation | Short-lived access tokens (15 min) + long-lived refresh tokens. |
| Mobile App | React Native | Drivers and supervisors. Offline-first with SQLite local store + sync. |

---

## 14. External Integrations (Not Now)

| System | Category | Integration Method | Data Exchanged |
|---|---|---|---|
| LocoNav / Fleetilla / Intellicar | GPS Telematics | REST API (pull) + WebSocket push | Vehicle location, speed, ignition, fuel sensor, DTC fault codes |
| NIC e-Way Bill Portal | Compliance | REST API (Govt sandbox + prod) | Generate, extend, cancel e-Way Bills. Verify vehicle number. |
| IRP (Invoice Registration Portal) | GST / e-Invoice | REST API (Govt) | Generate IRN, QR code. Cancel IRN (within 24h). |
| NETC FASTag Portal | Compliance / Finance | REST API (NPCI NETC) | Import FASTag transaction log for toll reconciliation. |
| HDFC / ICICI / SBI Banking API | Finance | Banking API / Account Aggregator | Bank statement feed. Payment initiation (NEFT/RTGS/IMPS). |
| DocuSign / Aadhaar eSign | Legal / AMS | REST API | Digital signature on vendor contracts. |
| WhatsApp Business API | Notifications | REST API (Meta) | Trip alerts to drivers, delivery status to customers. |
| Google Maps / Mapbox API | Routing | REST + JS SDK | Route optimization, distance matrix, ETA calculation. |
| GSTN (GST Network) | Compliance | REST API (Govt) | GSTIN validation for customer/vendor onboarding. |
| Fuel Card Providers (HPCL, IOCL) | Finance / Fleet | SFTP / REST API | Automated fuel fill records for vehicles using fuel cards. |

---

## 15. Open Questions & Decisions Required

| # | Question | Options | Decision Owner |
|---|---|---|---|
| 1 | Will Optimile support multi-company (group of companies) under one tenant, with consolidated P&L? | Yes with inter-company / No (future phase) | Product Owner + CTO |
| 2 | What is the model for attached vendor vehicles — are they in Optimile Fleet master or only in AMS vendor profile? | Fleet master (full visibility) / AMS only (limited) | Product + Operations Lead |
| 3 | Should the customer portal allow customers to place bookings directly, or only view status and invoices? | View only / Booking + View | Product Owner |
| 4 | Which e-signature provider for contracts — DocuSign (international) or Aadhaar eSign (India, lower cost)? | DocuSign / Aadhaar eSign / Both | Product + Legal |
| 5 | What is the data retention policy for GPS telematics data? (Storage cost consideration) | 1 year / 2 years / Customer-configurable | CTO + Finance |
| 6 | Multi-currency support required for international customers (Tanzania, Nigeria pipeline)? | Phase 1 / Phase 2 / Separate config | CEO + Product |
| 7 | Will Optimile offer a white-label version for enterprise clients to deploy under their own brand? | Yes / No / Future consideration | CEO |

---

*— End of Optimile ERP Business Requirements Document —*

*Version 2.0 | February 2026 | Confidential*
