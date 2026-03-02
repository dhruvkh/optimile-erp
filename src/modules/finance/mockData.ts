// ============================================================
// Finance Module — Data Derivation from Operational Store
// ============================================================
// Instead of generating random data, this file derives Finance-specific
// data structures from the shared OperationalDataStore.
// This ensures consistency across TMS, Fleet, and Finance modules.
// ============================================================

import { Customer, Invoice, Vehicle, Expense, Transaction, LineItem, Shipment, Vendor, BankAccount, BankTransaction, SystemUser, Booking } from './types';
import {
  SHARED_CLIENTS,
  SHARED_VENDORS,
  SHARED_VEHICLES,
  CompletedTrip,
  COMPLETED_TRIPS,
} from '../../shared/context/OperationalDataStore';

// ── Derive Customers from Shared Clients ────────────────────

export function deriveCustomers(): Customer[] {
  return SHARED_CLIENTS.map(c => ({
    id: c.id,
    name: c.name,
    email: c.email,
    taxId: c.gstin,
    creditLimit: c.creditLimit,
    status: c.status === 'Active' ? 'active' : 'inactive',
    joinedDate: '2023-01-15',
    address: c.address,
    contactPerson: c.contactPerson,
    phone: c.phone,
    paymentTerms: c.paymentTerms,
    tdsRate: c.tdsRate,
    relationshipManager: c.relationshipManager,
  }) as Customer);
}

// ── Derive Bookings from Completed Trips ────────────────────

export function deriveBookings(trips: CompletedTrip[]): Booking[] {
  return trips.map(t => ({
    // Fall back to trip.id if bookingRef is missing (e.g., newly created trips)
    id: t.bookingRef || t.id,
    customerId: t.clientId,
    customerName: t.clientName,
    origin: t.origin,
    destination: t.destination,
    distance: t.distanceKm,
    vehicleId: t.vehicleId || '',
    vehicleRegNumber: t.vehicleRegNumber,
    driverName: t.driverName || 'TBD',
    driverPhone: t.driverPhone || '',
    bookedDate: t.bookedDate,
    completedDate: t.deliveredDate || t.dispatchDate,
    amount: t.revenueAmount,
    expense: t.totalCost,
    status: t.invoiced ? 'invoiced' : 'pending',
    podUrl: t.podUrl,
    podVerified: t.podVerified,
    vendorId: t.vendorId,
    vendorName: t.vendorName,
  }) as Booking);
}

// ── Derive a single invoice for one closed trip ─────────────
// Called by SYNC_FROM_TMS when a newly invoiced trip arrives.

export function deriveInvoiceForSingleTrip(trip: CompletedTrip, customers: Customer[]): Invoice | null {
  const customer = customers.find(c => c.id === trip.clientId);
  if (!customer || !trip.revenueAmount) return null;

  const rawId = trip.id.replace(/\D/g, '').slice(-4).padStart(4, '0');
  const lrNumber = `LR-${(trip.bookedDate || '').replace(/-/g, '').substring(2, 8)}-${rawId}`;

  const lineItem: LineItem = {
    id: `li_closed_${trip.id}`,
    description: `Freight: ${trip.origin} → ${trip.destination} (${trip.distanceKm} km) [${trip.bookingRef || trip.id}]`,
    quantity: 1,
    unitPrice: trip.revenueAmount,
    taxRate: 18,
    total: trip.revenueAmount,
    bkgId: trip.id,
    shippingDate: trip.dispatchDate || trip.bookedDate,
    deliveryDate: trip.deliveredDate || '',
    truckNo: trip.vehicleRegNumber || 'TBD',
    lrNumber,
    placeOfOrigin: trip.origin,
    placeOfDestination: trip.destination,
    detentionCharges: 0,
    loadingCharges: 0,
    otherCharges: 0,
    advanceReceived: 0,
  };

  const totalAmount = trip.revenueAmount;
  const taxAmount = Math.round(totalAmount * 0.18);
  const invoiceDate = trip.deliveredDate || trip.bookedDate;
  const dueDate = new Date(
    new Date(invoiceDate).getTime() + (customer.paymentTerms || 30) * 86400000
  ).toISOString().split('T')[0];

  const invoiceId = trip.invoiceId || `trip_inv_${trip.id}`;
  const invoiceNumber = trip.invoiceId?.startsWith('INV-')
    ? trip.invoiceId
    : `INV-${new Date().getFullYear()}-${rawId}`;

  return {
    id: invoiceId,
    customerId: trip.clientId,
    customerName: trip.clientName,
    invoiceNumber,
    status: 'sent' as const,
    date: invoiceDate,
    dueDate,
    amount: totalAmount + taxAmount,
    paidAmount: 0,
    taxAmount,
    lineItems: [lineItem],
  };
}

// ── Derive Invoices from Invoiced Trips ─────────────────────

function deriveInvoices(trips: CompletedTrip[], customers: Customer[]): Invoice[] {
  const invoices: Invoice[] = [];

  // Group invoiced trips by client
  const invoicedTrips = trips.filter(t => t.invoiced && t.invoiceId);
  const tripsByClient: Record<string, CompletedTrip[]> = {};

  invoicedTrips.forEach(t => {
    if (!tripsByClient[t.clientId]) tripsByClient[t.clientId] = [];
    tripsByClient[t.clientId].push(t);
  });

  let invCounter = 0;
  Object.entries(tripsByClient).forEach(([clientId, clientTrips]) => {
    const customer = customers.find(c => c.id === clientId);
    if (!customer) return;

    // Create one invoice per group of trips (batch invoicing)
    const lineItems: LineItem[] = clientTrips.map((t, idx) => ({
      id: `li_${invCounter}_${idx}`,
      description: `Freight: ${t.origin} → ${t.destination} (${t.distanceKm} km) [${t.bookingRef}]`,
      quantity: 1,
      unitPrice: t.revenueAmount,
      taxRate: 18, // GST 18%
      total: t.revenueAmount,
    }));

    const totalAmount = lineItems.reduce((sum, li) => sum + li.total, 0);
    const taxAmount = totalAmount * 0.18;
    const invoiceDate = clientTrips[0].bookedDate;
    const dueDate = new Date(new Date(invoiceDate).getTime() + (customer.paymentTerms || 30) * 86400000).toISOString().split('T')[0];

    // Determine status based on age
    const daysOld = Math.floor((Date.now() - new Date(invoiceDate).getTime()) / 86400000);
    let status: 'draft' | 'sent' | 'paid' | 'overdue' | 'partial' = 'sent';
    if (daysOld > (customer.paymentTerms || 30) + 5) status = 'paid';
    else if (daysOld > (customer.paymentTerms || 30)) status = 'overdue';

    invoices.push({
      id: clientTrips[0].invoiceId || `inv_${invCounter}`,
      customerId: clientId,
      customerName: customer.name,
      invoiceNumber: `INV-${2024000 + invCounter}`,
      status,
      date: invoiceDate,
      dueDate,
      amount: totalAmount + taxAmount,
      paidAmount: status === 'paid' ? totalAmount + taxAmount : 0,
      taxAmount,
      lineItems,
    });
    invCounter++;
  });

  // Add some additional historical invoices for richer data
  const historicalInvoices: { clientId: string; monthsAgo: number; tripCount: number }[] = [
    { clientId: 'CLI-005', monthsAgo: 3, tripCount: 4 },
    { clientId: 'CLI-006', monthsAgo: 2, tripCount: 3 },
    { clientId: 'CLI-001', monthsAgo: 2, tripCount: 2 },
    { clientId: 'CLI-003', monthsAgo: 1, tripCount: 5 },
    { clientId: 'CLI-007', monthsAgo: 1, tripCount: 2 },
  ];

  historicalInvoices.forEach((h, idx) => {
    const customer = customers.find(c => c.id === h.clientId);
    if (!customer) return;

    const baseDate = new Date();
    baseDate.setMonth(baseDate.getMonth() - h.monthsAgo);
    const invoiceDate = baseDate.toISOString().split('T')[0];
    const dueDate = new Date(baseDate.getTime() + (customer.paymentTerms || 30) * 86400000).toISOString().split('T')[0];

    const routes = ['Mumbai → Pune', 'Delhi → Jaipur', 'Chennai → Bangalore', 'Kolkata → Ranchi', 'Mumbai → Ahmedabad'];
    const lineItems: LineItem[] = Array.from({ length: h.tripCount }).map((_, liIdx) => {
      const amount = 15000 + (liIdx + idx) * 3500;
      return {
        id: `li_hist_${idx}_${liIdx}`,
        description: `Freight: ${routes[(liIdx + idx) % routes.length]} [BK-2024${8000 + idx * 10 + liIdx}]`,
        quantity: 1,
        unitPrice: amount,
        taxRate: 18,
        total: amount,
      };
    });

    const totalAmount = lineItems.reduce((sum, li) => sum + li.total, 0);
    const taxAmount = totalAmount * 0.18;

    invoices.push({
      id: `inv_hist_${idx}`,
      customerId: h.clientId,
      customerName: customer.name,
      invoiceNumber: `INV-${2023900 + idx}`,
      status: 'paid',
      date: invoiceDate,
      dueDate,
      amount: totalAmount + taxAmount,
      paidAmount: totalAmount + taxAmount,
      taxAmount,
      lineItems,
    });
  });

  return invoices;
}

// ── Derive Vehicles ─────────────────────────────────────────

function deriveVehicles(): Vehicle[] {
  return SHARED_VEHICLES.map(v => ({
    id: v.id,
    regNumber: v.regNumber,
    model: v.model,
    status: v.status === 'maintenance' ? 'maintenance' : v.status === 'retired' ? 'retired' : 'active',
    mileage: v.odometerKm,
  }) as Vehicle);
}

// ── Derive Vendors ──────────────────────────────────────────

function deriveVendors(): Vendor[] {
  return SHARED_VENDORS.map(v => ({
    id: v.id,
    name: v.name,
    code: v.code,
    taxId: v.gstin,
    lastActivity: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString(),
    category: v.category,
    rating: v.rating,
    balance: v.balance,
    paymentTerms: v.paymentTerms,
  }) as Vendor);
}

// ── Derive Expenses from Trip Costs ─────────────────────────

export function deriveExpenses(trips: CompletedTrip[], vehicles: Vehicle[]): Expense[] {
  const expenses: Expense[] = [];

  trips.forEach(trip => {
    // Own vehicle — break down into categories
    if (trip.tripType === 'own_vehicle' && trip.costBreakdown) {
      const cb = trip.costBreakdown;

      expenses.push({
        id: `exp_fuel_${trip.id}`,
        vehicleId: trip.vehicleId || '',
        category: 'Fuel',
        amount: Math.round(cb.fuel),
        date: trip.dispatchDate,
        vendor: 'Indian Oil Corp',
        vendorId: 'VND-006',
        bookingId: trip.bookingRef,
        entryType: 'Auto',
        status: 'approved',
      });

      expenses.push({
        id: `exp_driver_${trip.id}`,
        vehicleId: trip.vehicleId || '',
        category: 'Driver',
        amount: Math.round(cb.driver),
        date: trip.dispatchDate,
        vendor: 'Driver Expense',
        bookingId: trip.bookingRef,
        costPerKm: 1.8,
        entryType: 'Auto',
        status: 'approved',
      });

      expenses.push({
        id: `exp_toll_${trip.id}`,
        vehicleId: trip.vehicleId || '',
        category: 'Toll',
        amount: Math.round(cb.toll),
        date: trip.dispatchDate,
        vendor: 'FastTag Tolls',
        vendorId: 'VND-009',
        bookingId: trip.bookingRef,
        entryType: 'Auto',
        status: 'approved',
      });

      if (cb.maintenance > 100) {
        expenses.push({
          id: `exp_maint_${trip.id}`,
          vehicleId: trip.vehicleId || '',
          category: 'Maintenance',
          amount: Math.round(cb.maintenance),
          date: trip.dispatchDate,
          vendor: 'Fleet Internal',
          bookingId: trip.bookingRef,
          entryType: 'Auto',
          status: 'approved',
        });
      }
    }

    // Market hire / Contracted vendor — single freight expense
    if ((trip.tripType === 'market_hire' || trip.tripType === 'contracted_vendor') && trip.vendorId) {
      expenses.push({
        id: `exp_freight_${trip.id}`,
        vehicleId: trip.vehicleId || '',
        category: 'Freight',
        amount: Math.round(trip.totalCost),
        date: trip.deliveredDate || trip.dispatchDate,
        vendor: trip.vendorName || 'Unknown',
        vendorId: trip.vendorId,
        bookingId: trip.bookingRef,
        entryType: 'Auto',
        status: 'approved',
      });
    }
  });

  return expenses;
}

// ── Derive Transactions ─────────────────────────────────────

function deriveTransactions(invoices: Invoice[], trips: CompletedTrip[]): Transaction[] {
  const transactions: Transaction[] = [];

  // Customer receipts for paid invoices
  invoices.filter(inv => inv.status === 'paid').forEach(inv => {
    transactions.push({
      id: `txn_recv_${inv.id}`,
      customerId: inv.customerId,
      date: inv.dueDate,
      amount: inv.amount,
      type: 'credit',
      description: `Payment received for ${inv.invoiceNumber}`,
      referenceId: inv.id,
      matched: true,
      paymentMode: 'NEFT',
      referenceNo: `UTR${Date.now().toString().slice(-8)}${inv.id.slice(-3)}`,
      category: 'Full payment',
    });
  });

  // Vendor advance payments
  trips.filter(t => t.tripType === 'market_hire' && t.vendorPayable?.advancePaid).forEach(t => {
    transactions.push({
      id: `txn_adv_${t.id}`,
      vendorId: t.vendorId,
      vendorName: t.vendorName,
      date: t.vendorPayable!.advanceDate || t.dispatchDate,
      amount: Math.round(t.vendorPayable!.advanceAmount),
      type: 'debit',
      description: `Advance ${t.vendorPayable!.advancePercentage}% for ${t.bookingRef} — ${t.origin} → ${t.destination}`,
      referenceId: t.bookingRef,
      matched: true,
      paymentMode: 'RTGS',
      referenceNo: `ADV${t.id.replace(/[^0-9]/g, '')}`,
      category: 'Advance',
    });
  });

  // Vendor balance payments (only for clean POD)
  trips.filter(t => t.tripType === 'market_hire' && t.vendorPayable?.balancePaid).forEach(t => {
    transactions.push({
      id: `txn_bal_${t.id}`,
      vendorId: t.vendorId,
      vendorName: t.vendorName,
      date: t.vendorPayable!.balanceDate || t.deliveredDate || t.dispatchDate,
      amount: Math.round(t.vendorPayable!.balanceAmount),
      type: 'debit',
      description: `Balance payment for ${t.bookingRef} (post clean POD)`,
      referenceId: t.bookingRef,
      matched: true,
      paymentMode: 'NEFT',
      referenceNo: `BAL${t.id.replace(/[^0-9]/g, '')}`,
      category: 'Balance',
    });
  });

  // Contracted vendor payments (full on invoice)
  trips.filter(t => t.tripType === 'contracted_vendor' && t.vendorPayable?.balancePaid).forEach(t => {
    transactions.push({
      id: `txn_cnt_${t.id}`,
      vendorId: t.vendorId,
      vendorName: t.vendorName,
      date: t.vendorPayable!.balanceDate || t.deliveredDate || t.dispatchDate,
      amount: Math.round(t.totalCost),
      type: 'debit',
      description: `Contract payment for ${t.bookingRef} [${t.vendorPayable!.invoiceNumber}]`,
      referenceId: t.bookingRef,
      matched: true,
      paymentMode: 'RTGS',
      referenceNo: t.vendorPayable!.invoiceNumber || `CNT${t.id.replace(/[^0-9]/g, '')}`,
      category: 'Full payment',
    });
  });

  return transactions;
}

// ── Derive Shipments (Breakeven Analysis) ───────────────────

function deriveShipments(trips: CompletedTrip[]): Shipment[] {
  const routeMap: Record<string, { revenue: number; cost: number; count: number }> = {};

  trips.forEach(t => {
    const route = `${t.origin}-${t.destination}`;
    if (!routeMap[route]) routeMap[route] = { revenue: 0, cost: 0, count: 0 };
    routeMap[route].revenue += t.revenueAmount;
    routeMap[route].cost += t.totalCost;
    routeMap[route].count++;
  });

  return Object.entries(routeMap).map(([route, data], i) => ({
    id: `shp_${i}`,
    route,
    currentRate: Math.round(data.revenue / data.count),
    breakevenRate: Math.round(data.cost / data.count),
    status: 'active' as const,
  }));
}

// ── Bank Feed ───────────────────────────────────────────────

function deriveBankFeed(transactions: Transaction[]): { bankAccounts: BankAccount[]; bankFeed: BankTransaction[] } {
  const bankAccounts: BankAccount[] = [
    { id: 'ba_1', bankName: 'HDFC Bank', accountNumber: '**** 4589', balance: 4500000, lastSynced: new Date().toISOString() },
    { id: 'ba_2', bankName: 'ICICI Bank', accountNumber: '**** 1234', balance: 1200000, lastSynced: new Date(Date.now() - 3600000).toISOString() },
  ];

  const bankFeed: BankTransaction[] = transactions.slice(0, 20).map((txn, i) => ({
    id: `bt_${txn.id}`,
    bankAccountId: i % 3 === 0 ? 'ba_2' : 'ba_1',
    date: txn.date,
    description: txn.type === 'credit'
      ? `NEFT Transfer from ${txn.description.includes('Payment') ? 'Customer' : 'Unknown'}`
      : `RTGS Payment to ${txn.vendorName || 'Vendor'}`,
    amount: txn.amount,
    type: txn.type === 'credit' ? 'credit' : 'debit',
    status: txn.matched ? 'matched' : 'unmatched',
  }));

  return { bankAccounts, bankFeed };
}

// ── Users ───────────────────────────────────────────────────

const FINANCE_USERS: SystemUser[] = [
  { id: 'u1', name: 'Rajesh Kumar', email: 'rajesh@optimile.com', role: 'Admin', status: 'Active' },
  { id: 'u2', name: 'Sunita Verma', email: 'sunita@optimile.com', role: 'Finance Manager', status: 'Active' },
  { id: 'u3', name: 'Priya Sharma', email: 'priya@optimile.com', role: 'Accountant', status: 'Active' },
  { id: 'u4', name: 'Amit Patel', email: 'amit@optimile.com', role: 'Viewer', status: 'Active' },
];


// ══════════════════════════════════════════════════════════
// MAIN EXPORT — derives everything from shared operational data
// ══════════════════════════════════════════════════════════

export const generateMockData = () => {
  const trips = COMPLETED_TRIPS;
  const customers = deriveCustomers();
  const bookings = deriveBookings(trips);
  const invoices = deriveInvoices(trips, customers);
  const vehicles = deriveVehicles();
  const vendors = deriveVendors();
  const expenses = deriveExpenses(trips, vehicles);
  const transactions = deriveTransactions(invoices, trips);
  const shipments = deriveShipments(trips);
  const { bankAccounts, bankFeed } = deriveBankFeed(transactions);
  const users = FINANCE_USERS;

  return {
    customers,
    invoices,
    vehicles,
    expenses,
    transactions,
    shipments,
    vendors,
    bankAccounts,
    bankFeed,
    users,
    bookings,
  };
};
