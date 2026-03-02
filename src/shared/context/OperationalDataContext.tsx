// ============================================================
// Optimile ERP — Operational Data Context
// ============================================================
// React context that provides shared operational data to all modules.
// Wraps the app so TMS, Fleet, and Finance share the same data.
// ============================================================

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
    SharedClient,
    SharedVendor,
    SharedVehicle,
    CompletedTrip,
    CostBreakdown,
    CostBreakdownConfig,
    SHARED_CLIENTS,
    SHARED_VENDORS,
    SHARED_VEHICLES,
    COMPLETED_TRIPS,
    DEFAULT_COST_BREAKDOWN,
    PayableStatus,
} from './OperationalDataStore';

// Minimal expense shape shared between TripExpenses UI and the context
export interface TripExpense {
    id: string;
    tripId: string;
    category: string;
    description: string;
    amount: number;
    quantity?: number;
    rate?: number;
    date: string;
    time: string;
    location?: { name: string; address: string };
    status: 'Pending' | 'Approved' | 'Rejected';
    rejectionReason?: string;
    submittedBy: { name: string; role: string; time: string };
    receiptUrl?: string;
    // Pre-trip advance fields
    isAdvance?: boolean;                                     // true for advance requests
    advanceType?: 'fuel' | 'driver_batta' | 'toll' | 'vendor_advance' | 'other';
    paymentStatus?: 'pending_payment' | 'paid';             // Finance tracks actual disbursement
    paidDate?: string;
    paidBy?: string;
}

interface OperationalDataContextType {
    // Data
    clients: SharedClient[];
    vendors: SharedVendor[];
    vehicles: SharedVehicle[];
    completedTrips: CompletedTrip[];
    costBreakdownConfig: CostBreakdownConfig;

    // Expense accessors & actions
    getTripExpenses: (tripId: string) => TripExpense[];
    addTripExpense: (tripId: string, expense: TripExpense) => void;
    updateTripExpense: (tripId: string, expenseId: string, updates: Partial<TripExpense>) => void;

    // Actions
    bookRevenue: (tripId: string) => void;
    requestAdvance: (tripId: string, percentage: number) => void;
    payAdvance: (tripId: string) => void;
    settleBalance: (tripId: string) => void;
    markPodReceived: (tripId: string, clean: boolean, remarks?: string) => void;
    markInvoiced: (tripId: string, invoiceId: string) => void;
    receiveVendorInvoice: (tripId: string, invoiceNumber: string) => void;
    updateCostBreakdownConfig: (config: Partial<CostBreakdownConfig>) => void;

    // TMS Actions
    createTrip: (tripData: Partial<CompletedTrip>) => string;
    assignVehicle: (tripId: string, vehicleId: string, vendorId?: string) => void;
    assignMarketHireVehicle: (tripId: string, vendorId: string, regNumber: string, driverName: string, driverPhone: string, freightAmount: number) => void;
    markDelivered: (tripId: string) => void;
    addVehicleToSharedPool: (vehicle: SharedVehicle) => void;
    updateTripStatus: (tripId: string, status: CompletedTrip['status']) => void;
    getAllPendingAdvances: () => (TripExpense & { trip: CompletedTrip })[];

    // Finance sync helpers
    applyApprovedAdvance: (tripId: string, expense: TripExpense) => void;
    updateVendorBalance: (vendorId: string, delta: number) => void;
}

const OperationalDataContext = createContext<OperationalDataContextType | null>(null);

export const useOperationalData = () => {
    const context = useContext(OperationalDataContext);
    if (!context) {
        throw new Error('useOperationalData must be used within OperationalDataProvider');
    }
    return context;
};

export const OperationalDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [clients] = useState<SharedClient[]>(SHARED_CLIENTS);
    const [vendors, setVendors] = useState<SharedVendor[]>(SHARED_VENDORS);
    const [vehicles, setVehicles] = useState<SharedVehicle[]>(SHARED_VEHICLES);
    const [completedTrips, setCompletedTrips] = useState<CompletedTrip[]>(COMPLETED_TRIPS);
    const [costBreakdownConfig, setCostBreakdownConfig] = useState<CostBreakdownConfig>(DEFAULT_COST_BREAKDOWN);
    // tripExpenses: a plain object used as a Map<tripId, TripExpense[]>
    const [tripExpensesMap, setTripExpensesMap] = useState<Record<string, TripExpense[]>>({});

    // ── Expense accessors ──────────────────────────────────

    const getTripExpenses = useCallback((tripId: string): TripExpense[] => {
        return tripExpensesMap[tripId] ?? [];
    }, [tripExpensesMap]);

    const addTripExpense = useCallback((tripId: string, expense: TripExpense) => {
        setTripExpensesMap(prev => {
            const existing = prev[tripId] ?? [];
            return { ...prev, [tripId]: [expense, ...existing] };
        });
        // Recalculate totalCost from all approved expenses for this trip
        setTripExpensesMap(prev => {
            const allExpenses = prev[tripId] ?? [];
            const approvedTotal = allExpenses
                .filter(e => e.status === 'Approved')
                .reduce((sum, e) => sum + e.amount, 0);
            // If no approved expenses yet, keep the 75% estimate
            if (approvedTotal > 0) {
                setCompletedTrips(trips => trips.map(t =>
                    t.id === tripId ? { ...t, totalCost: approvedTotal } : t
                ));
            }
            return prev;
        });
    }, []);

    const updateTripExpense = useCallback((tripId: string, expenseId: string, updates: Partial<TripExpense>) => {
        setTripExpensesMap(prev => {
            const existing = prev[tripId] ?? [];
            const updated = existing.map(e => e.id === expenseId ? { ...e, ...updates } : e);
            const approvedTotal = updated
                .filter(e => e.status === 'Approved')
                .reduce((sum, e) => sum + e.amount, 0);
            if (approvedTotal > 0) {
                setCompletedTrips(trips => trips.map(t =>
                    t.id === tripId ? { ...t, totalCost: approvedTotal } : t
                ));
            }
            return { ...prev, [tripId]: updated };
        });
    }, []);

    // ── Revenue & payables ─────────────────────────────────

    const bookRevenue = useCallback((tripId: string) => {
        setCompletedTrips(prev => prev.map(t =>
            t.id === tripId ? { ...t, status: 'invoiced' as const, invoiced: true } : t
        ));
    }, []);

    const requestAdvance = useCallback((tripId: string, percentage: number) => {
        setCompletedTrips(prev => prev.map(t => {
            if (t.id !== tripId || !t.vendorPayable) return t;
            const advanceAmount = t.totalCost * (percentage / 100);
            return {
                ...t,
                vendorPayable: {
                    ...t.vendorPayable,
                    advancePercentage: percentage,
                    advanceAmount,
                    balanceAmount: t.totalCost - advanceAmount,
                    status: 'pending_advance' as PayableStatus,
                }
            };
        }));
    }, []);

    const payAdvance = useCallback((tripId: string) => {
        setCompletedTrips(prev => prev.map(t => {
            if (t.id !== tripId || !t.vendorPayable) return t;
            return {
                ...t,
                vendorPayable: {
                    ...t.vendorPayable,
                    advancePaid: true,
                    advanceDate: new Date().toISOString().split('T')[0],
                    status: 'advance_paid' as PayableStatus,
                }
            };
        }));
        // Update vendor balance
        const trip = completedTrips.find(t => t.id === tripId);
        if (trip?.vendorId && trip?.vendorPayable) {
            setVendors(prev => prev.map(v =>
                v.id === trip.vendorId
                    ? { ...v, balance: v.balance + trip.vendorPayable!.advanceAmount }
                    : v
            ));
        }
    }, [completedTrips]);

    const settleBalance = useCallback((tripId: string) => {
        setCompletedTrips(prev => prev.map(t => {
            if (t.id !== tripId || !t.vendorPayable) return t;
            return {
                ...t,
                vendorPayable: {
                    ...t.vendorPayable,
                    balancePaid: true,
                    balanceDate: new Date().toISOString().split('T')[0],
                    status: 'fully_paid' as PayableStatus,
                }
            };
        }));
        const trip = completedTrips.find(t => t.id === tripId);
        if (trip?.vendorId && trip?.vendorPayable) {
            setVendors(prev => prev.map(v =>
                v.id === trip.vendorId
                    ? { ...v, balance: v.balance + trip.vendorPayable!.balanceAmount }
                    : v
            ));
        }
    }, [completedTrips]);

    const markPodReceived = useCallback((tripId: string, clean: boolean, remarks?: string) => {
        setCompletedTrips(prev => prev.map(t => {
            if (t.id !== tripId) return t;
            const update: Partial<CompletedTrip> = {
                podReceivedDate: new Date().toISOString().split('T')[0],
                podVerified: clean,
                status: 'pod_received' as const,
            };
            if (t.vendorPayable) {
                update.vendorPayable = {
                    ...t.vendorPayable,
                    podClean: clean,
                    podRemarks: remarks,
                    status: clean && t.vendorPayable.advancePaid ? 'pending_balance' as PayableStatus : t.vendorPayable.status,
                };
            }
            return { ...t, ...update };
        }));
    }, []);

    const markInvoiced = useCallback((tripId: string, invoiceId: string) => {
        // Recompute totalCost from all approved expenses so Finance receives accurate cost data
        const trip = completedTrips.find(t => t.id === tripId);
        const approvedExpenses = (tripExpensesMap[tripId] ?? []).filter(e => e.status === 'Approved');
        const approvedTotal = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);
        const finalCost = approvedTotal > 0 ? approvedTotal : (trip?.totalCost ?? 0);

        setCompletedTrips(prev => prev.map(t =>
            t.id === tripId ? { ...t, invoiced: true, invoiceId, status: 'invoiced' as const, totalCost: finalCost } : t
        ));
        // Release the vehicle back to available when trip is invoiced
        if (trip?.vehicleId) {
            setVehicles(prev => prev.map(v =>
                v.id === trip.vehicleId ? { ...v, status: 'available' as const } : v
            ));
        }
    }, [completedTrips, tripExpensesMap]);

    const receiveVendorInvoice = useCallback((tripId: string, invoiceNumber: string) => {
        setCompletedTrips(prev => prev.map(t => {
            if (t.id !== tripId || !t.vendorPayable) return t;
            return {
                ...t,
                vendorPayable: {
                    ...t.vendorPayable,
                    invoiceReceived: true,
                    invoiceNumber,
                    invoiceDate: new Date().toISOString().split('T')[0],
                }
            };
        }));
    }, []);

    const updateCostBreakdownConfig = useCallback((config: Partial<CostBreakdownConfig>) => {
        setCostBreakdownConfig(prev => ({ ...prev, ...config }));
    }, []);

    // ── Trip lifecycle ─────────────────────────────────────

    const createTrip = useCallback((tripData: Partial<CompletedTrip>) => {
        const tripId = `TRP-NEW-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        const isMarketHire = tripData.tripType === 'market_hire' || tripData.tripType === 'contracted_vendor';
        const newTrip: CompletedTrip = {
            id: tripId,
            // Auto-generate bookingRef if not supplied — Finance module uses this as the booking ID
            bookingRef: tripData.bookingRef || `BK-${new Date().getFullYear()}-${tripId.replace(/\D/g, '').slice(-4)}`,
            status: 'booked' as const,
            podVerified: false,
            invoiced: false,
            // For market hire / contracted vendor the vehicle is unknown at booking time;
            // leave as undefined so the trip shows "Pending Assignment" in operations.
            vehicleId: isMarketHire ? undefined : '',
            vehicleRegNumber: isMarketHire ? undefined : undefined,
            driverName: isMarketHire ? undefined : undefined,
            driverPhone: isMarketHire ? undefined : undefined,
            tripType: 'own_vehicle',
            bookingMode: 'FTL',
            bookedDate: new Date().toISOString().split('T')[0],
            dispatchDate: '',
            revenueAmount: 0,
            totalCost: 0,
            ...tripData
        } as CompletedTrip;

        setCompletedTrips(prev => [newTrip, ...prev]);
        return newTrip.id;
    }, []);

    const assignVehicle = useCallback((tripId: string, vehicleId: string, vendorId?: string) => {
        setCompletedTrips(prev => prev.map(t => {
            if (t.id !== tripId) return t;

            const vehicle = vehicles.find(v => v.id === vehicleId);
            const vendor = vendors.find(v => v.id === vendorId);

            let tripType = t.tripType;
            if (vendor) {
                tripType = vendor.hasContract ? 'contracted_vendor' : 'market_hire';
            } else if (vehicle && vehicle.ownershipType !== 'owned') {
                tripType = 'market_hire';
            } else {
                tripType = 'own_vehicle';
            }

            // Estimate cost at 75% of revenue; real expenses will override this
            const totalCost = t.revenueAmount > 0 ? t.revenueAmount * 0.75 : t.totalCost;

            return {
                ...t,
                status: 'in_transit' as const,
                dispatchDate: new Date().toISOString().split('T')[0],
                vehicleId: vehicleId || t.vehicleId,
                vehicleRegNumber: vehicle?.regNumber || 'Unknown',
                driverName: vehicle?.driverName || 'Unknown',
                driverPhone: vehicle?.driverPhone || '',
                tripType,
                vendorId: vendor?.id,
                vendorName: vendor?.name,
                totalCost,
            };
        }));
        // Mark the assigned vehicle as in_transit so it no longer shows as available
        if (vehicleId) {
            setVehicles(prev => prev.map(v =>
                v.id === vehicleId ? { ...v, status: 'in_transit' as const } : v
            ));
        }
    }, [vehicles, vendors]);

    // Assign a market hire / contracted vendor vehicle (not in own fleet)
    const assignMarketHireVehicle = useCallback((
        tripId: string,
        vendorId: string,
        regNumber: string,
        driverName: string,
        driverPhone: string,
        freightAmount: number
    ) => {
        const vendor = vendors.find(v => v.id === vendorId);
        const tripType: CompletedTrip['tripType'] = vendor?.hasContract ? 'contracted_vendor' : 'market_hire';
        const vehicleId = `MKT-${vendorId}-${Date.now()}`;
        setCompletedTrips(prev => prev.map(t => {
            if (t.id !== tripId) return t;
            return {
                ...t,
                status: 'in_transit' as const,
                dispatchDate: new Date().toISOString().split('T')[0],
                vehicleId,
                vehicleRegNumber: regNumber || 'Market Hire',
                driverName: driverName || 'Market Driver',
                driverPhone: driverPhone || '',
                tripType,
                vendorId,
                vendorName: vendor?.name || 'Unknown Vendor',
                totalCost: freightAmount || t.totalCost,
                vendorPayable: {
                    vendorId,
                    advancePercentage: 30,
                    status: 'pending_advance' as const,
                    advancePaid: false,
                    advanceAmount: Math.round(freightAmount * 0.3),
                    balancePaid: false,
                    balanceAmount: Math.round(freightAmount * 0.7),
                },
            };
        }));
    }, [vendors]);

    const markDelivered = useCallback((tripId: string) => {
        setCompletedTrips(prev => prev.map(t =>
            t.id === tripId ? {
                ...t,
                status: 'delivered' as const,
                deliveredDate: new Date().toISOString().split('T')[0]
            } : t
        ));
        // Release the vehicle back to available on delivery
        const trip = completedTrips.find(t => t.id === tripId);
        if (trip?.vehicleId) {
            setVehicles(prev => prev.map(v =>
                v.id === trip.vehicleId ? { ...v, status: 'available' as const } : v
            ));
        }
    }, [completedTrips]);

    const addVehicleToSharedPool = useCallback((vehicle: SharedVehicle) => {
        setVehicles(prev => {
            // Avoid duplicates
            if (prev.some(v => v.id === vehicle.id)) return prev;
            return [...prev, vehicle];
        });
    }, []);

    // ── Status sync — maps TripStatusCode milestones to business status ────
    const updateTripStatus = useCallback((tripId: string, status: CompletedTrip['status']) => {
        setCompletedTrips(prev => prev.map(t =>
            t.id === tripId ? { ...t, status } : t
        ));
        // Auto-release vehicle on delivery
        if (status === 'delivered') {
            const trip = completedTrips.find(t => t.id === tripId);
            if (trip?.vehicleId) {
                setVehicles(prev => prev.map(v =>
                    v.id === trip.vehicleId ? { ...v, status: 'available' as const } : v
                ));
            }
        }
    }, [completedTrips]);

    // ── Finance sync: apply an approved advance to shared state ───────────
    // For vendor_advance → increases SharedVendor.balance (FinanceTMSBridge picks up the
    // vendors change and syncs it to the Finance ledger automatically).
    // For own-fleet advance types → increments the matching costBreakdown field on the trip
    // (FinanceTMSBridge picks up completedTrips change → deriveExpenses creates Finance Expense).
    const applyApprovedAdvance = useCallback((tripId: string, expense: TripExpense) => {
        const trip = completedTrips.find(t => t.id === tripId);
        if (!trip) return;

        if (expense.advanceType === 'vendor_advance' && trip.vendorId) {
            setVendors(prev => prev.map(v =>
                v.id === trip.vendorId ? { ...v, balance: v.balance + expense.amount } : v
            ));
        } else {
            // Map advance type to costBreakdown field
            const fieldMap: Record<string, keyof CostBreakdown> = {
                fuel:         'fuel',
                driver_batta: 'driver',
                toll:         'toll',
                other:        'overhead',
            };
            const field = expense.advanceType ? fieldMap[expense.advanceType] : undefined;
            if (field && trip.costBreakdown) {
                setCompletedTrips(prev => prev.map(t =>
                    t.id === tripId
                        ? { ...t, costBreakdown: { ...t.costBreakdown!, [field]: (t.costBreakdown![field] || 0) + expense.amount } }
                        : t
                ));
            }
        }
    }, [completedTrips]);

    // ── Update a vendor's running balance directly (called by Finance VendorPaymentModal) ──
    const updateVendorBalance = useCallback((vendorId: string, delta: number) => {
        setVendors(prev => prev.map(v =>
            v.id === vendorId ? { ...v, balance: Math.max(0, v.balance + delta) } : v
        ));
    }, []);

    // ── Returns all pending advance expenses across all trips ──────────────
    const getAllPendingAdvances = useCallback((): (TripExpense & { trip: CompletedTrip })[] => {
        const result: (TripExpense & { trip: CompletedTrip })[] = [];
        completedTrips.forEach(trip => {
            const expenses = tripExpensesMap[trip.id] ?? [];
            expenses
                .filter(e => e.isAdvance && e.status === 'Pending')
                .forEach(e => result.push({ ...e, trip }));
        });
        return result;
    }, [completedTrips, tripExpensesMap]);

    const value: OperationalDataContextType = {
        clients,
        vendors,
        vehicles,
        completedTrips,
        costBreakdownConfig,
        getTripExpenses,
        addTripExpense,
        updateTripExpense,
        bookRevenue,
        requestAdvance,
        payAdvance,
        settleBalance,
        markPodReceived,
        markInvoiced,
        receiveVendorInvoice,
        updateCostBreakdownConfig,
        createTrip,
        assignVehicle,
        assignMarketHireVehicle,
        markDelivered,
        addVehicleToSharedPool,
        updateTripStatus,
        getAllPendingAdvances,
        applyApprovedAdvance,
        updateVendorBalance,
    };

    return (
        <OperationalDataContext.Provider value={value}>
            {children}
        </OperationalDataContext.Provider>
    );
};
