import React, { createContext, useContext, useReducer } from 'react';
import { Customer, Invoice, Vehicle, Expense, Transaction, Vendor, BankAccount, BankTransaction, SystemUser, Booking, Notification, UserRole, AuditLog } from './types';
import { generateMockData, deriveBookings, deriveInvoiceForSingleTrip, deriveExpenses } from './mockData';
import { CompletedTrip, SharedVendor } from '../../shared/context/OperationalDataStore';

interface AppState {
  customers: Customer[];
  invoices: Invoice[];
  vehicles: Vehicle[];
  expenses: Expense[];
  transactions: Transaction[];
  vendors: Vendor[];
  bankAccounts: BankAccount[];
  bankFeed: BankTransaction[];
  users: SystemUser[];
  bookings: Booking[];
  shipments: any[];
  auditLogs: AuditLog[];
  currentUser: { id: string; name: string; email: string; role: UserRole };
  isLoading: boolean;
  notifications: Notification[];
  userProfile: any;
  searchQuery: string;
}

type AppAction =
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'UPDATE_INVOICE_STATUS'; payload: { id: string; status: any } }
  | { type: 'DELETE_INVOICE'; payload: string }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'RECORD_PAYMENT'; payload: any }
  | { type: 'RECORD_VENDOR_PAYMENT'; payload: any }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SWITCH_USER'; payload: UserRole }
  | { type: 'MATCH_BANK_TRANSACTION'; payload: string }
  | { type: 'COMPLETE_TRIP'; payload: { bookingId: string } }
  | { type: 'UPDATE_PROFILE'; payload: any }
  | { type: 'MARK_BOOKINGS_INVOICED'; payload: string[] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SEND_REMINDERS'; payload: string[] }
  | { type: 'SYNC_FROM_TMS'; payload: { trips: CompletedTrip[]; vendors: SharedVendor[] } };

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_INVOICE':
      return { ...state, invoices: [...state.invoices, action.payload] };

    case 'UPDATE_INVOICE_STATUS':
      return {
        ...state,
        invoices: state.invoices.map(inv =>
          inv.id === action.payload.id ? { ...inv, status: action.payload.status } : inv
        )
      };

    case 'DELETE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.filter(inv => inv.id !== action.payload)
      };

    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.payload] };

    case 'RECORD_PAYMENT': {
      const { invoiceId, amount, date, type, reference, category, autoTds } = action.payload;
      const targetInvoice = state.invoices.find(i => i.id === invoiceId);

      let addedPaid = type === 'credit' ? amount : -amount;
      let addedAdjustment = 0;

      if (autoTds && type === 'credit') {
        // Auto TDS calculates 2% TDS on the Gross amount. 
        // If amount is Net (98%), Gross = amount / 0.98
        addedAdjustment = Math.round((amount / 0.98) * 0.02);
      } else if (category === 'TDS') {
        addedPaid = 0;
        addedAdjustment = type === 'credit' ? amount : -amount;
      }

      return {
        ...state,
        invoices: state.invoices.map(inv => {
          if (inv.id !== invoiceId) return inv;

          const newPaid = (inv.paidAmount || 0) + addedPaid;
          const newAdj = (inv.adjustments || 0) + addedAdjustment;
          const newStatus = (newPaid + newAdj) >= inv.amount ? 'paid' : 'partial';

          return {
            ...inv,
            paidAmount: newPaid,
            adjustments: newAdj,
            status: newStatus
          };
        }),
        transactions: [
          ...state.transactions,
          {
            id: `txn_${Date.now()}`,
            customerId: targetInvoice?.customerId || '',
            amount,
            date,
            type,
            description: `Payment for Invoice ${targetInvoice?.invoiceNumber || invoiceId}`,
            referenceId: invoiceId,
            matched: true,
            paymentMode: category,
            referenceNo: reference,
            category: category || 'Payment'
          },
          ...(addedAdjustment > 0 ? [{
            id: `txn_tds_${Date.now()}`,
            customerId: targetInvoice?.customerId || '',
            amount: addedAdjustment,
            date,
            type: 'credit' as const,
            description: `TDS properly deducted for Invoice ${targetInvoice?.invoiceNumber || invoiceId}`,
            referenceId: invoiceId,
            matched: true,
            paymentMode: 'System',
            referenceNo: `TDS-${reference}`,
            category: 'TDS Adjustment'
          }] : [])
        ]
      };
    }

    case 'RECORD_VENDOR_PAYMENT': {
      const { vendorIds, date, amount, category, reference, bookingId } = action.payload;
      const ids: string[] = Array.isArray(vendorIds) ? vendorIds : (action.payload.vendorId ? [action.payload.vendorId] : []);
      const splitAmount = ids.length > 0 ? amount / ids.length : amount;
      const newVendorTxns = ids.map((vid: string) => {
        const vendor = state.vendors.find(v => v.id === vid);
        return {
          id: `txn_vnd_${Date.now()}_${vid}`,
          vendorId: vid,
          vendorName: vendor?.name || vid,
          date: date || new Date().toISOString().split('T')[0],
          amount: splitAmount,
          type: 'debit' as const,
          description: `Vendor payment${bookingId ? ` for trip ${bookingId}` : ''}`,
          referenceId: bookingId || vid,
          matched: true,
          paymentMode: category || 'NEFT',
          referenceNo: reference || '',
          category: category || 'Vendor Payment',
        };
      });
      return {
        ...state,
        vendors: state.vendors.map(v =>
          ids.includes(v.id) ? { ...v, balance: Math.max(0, v.balance - splitAmount) } : v
        ),
        transactions: [...state.transactions, ...newVendorTxns],
      };
    }

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, { ...action.payload, id: `notif_${Date.now()}` }]
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };

    case 'SWITCH_USER':
      const user = state.users.find(u => u.role === action.payload);
      return {
        ...state,
        currentUser: user ? { id: user.id, name: user.name, email: user.email, role: user.role } : state.currentUser
      };

    case 'MATCH_BANK_TRANSACTION':
      return {
        ...state,
        bankFeed: state.bankFeed.map(bt =>
          bt.id === action.payload ? { ...bt, status: 'matched' } : bt
        )
      };

    case 'COMPLETE_TRIP':
      return {
        ...state,
        bookings: state.bookings.map(b =>
          b.id === action.payload.bookingId ? { ...b, status: 'invoiced' } : b
        )
      };

    case 'UPDATE_PROFILE':
      return { ...state, userProfile: { ...state.userProfile, ...action.payload } };

    case 'MARK_BOOKINGS_INVOICED':
      return {
        ...state,
        bookings: state.bookings.map(b =>
          action.payload.includes(b.id) ? { ...b, status: 'invoiced' as const } : b
        )
      };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };

    case 'SEND_REMINDERS':
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            type: 'success',
            message: `Reminders sent to ${action.payload.length} customer(s)`,
            id: `notif_${Date.now()}`
          }
        ]
      };

    case 'SYNC_FROM_TMS': {
      const { trips, vendors: liveVendors } = action.payload;

      // 1. Re-derive ALL bookings from live trips (full replacement keeps status current)
      const freshBookings = deriveBookings(trips);

      // 2. Find trips that are newly invoiced but NOT yet in Finance invoices
      //    We match by the trip's invoiceId OR by our generated id pattern 'trip_inv_<tripId>'
      const existingInvoiceIds = new Set(state.invoices.map(i => i.id));
      const newlyInvoicedTrips = trips.filter(t =>
        t.invoiced &&
        t.invoiceId &&
        !existingInvoiceIds.has(t.invoiceId) &&
        !existingInvoiceIds.has(`trip_inv_${t.id}`)
      );
      const newInvoicesFromTrips: Invoice[] = newlyInvoicedTrips
        .map(t => deriveInvoiceForSingleTrip(t, state.customers))
        .filter((inv): inv is Invoice => inv !== null);

      // 3. Derive expenses for trips that have cost breakdowns and aren't tracked yet
      const existingExpIds = new Set(state.expenses.map(e => e.id));
      const newExpenses: Expense[] = deriveExpenses(trips, state.vehicles)
        .filter(e => !existingExpIds.has(e.id));

      // 4. Update vendor balances from live vendors (tracks TMS payable changes)
      const updatedVendors = state.vendors.map(v => {
        const live = liveVendors.find(lv => lv.id === v.id);
        return live ? { ...v, balance: live.balance } : v;
      });

      return {
        ...state,
        bookings: freshBookings,
        invoices: [...state.invoices, ...newInvoicesFromTrips],
        expenses: [...state.expenses, ...newExpenses],
        vendors: updatedVendors,
      };
    }

    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockData = generateMockData();

  const initialState: AppState = {
    ...mockData,
    bankFeed: mockData.bankFeed || [],
    auditLogs: [],
    shipments: mockData.shipments || [],
    currentUser: {
      id: 'u2',
      name: 'Sarah Connor',
      email: 'sarah@optimile.com',
      role: 'Finance Manager'
    },
    isLoading: false,
    notifications: [],
    userProfile: {
      companyName: 'Optimile Logistics',
      gstNumber: '27AABCU9603R1ZM',
      address: 'Mumbai, Maharashtra',
      email: 'finance@optimile.com'
    },
    searchQuery: ''
  };

  const [state, dispatch] = useReducer(appReducer, initialState);

  const value: AppContextType = {
    state,
    dispatch
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
