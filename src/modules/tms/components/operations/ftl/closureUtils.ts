
import { ClosureChecklist, ReconciliationMetric, FinancePayload } from './types';

export const getMockClosureChecklist = (tripId: string): ClosureChecklist => ({
  pod: {
    status: 'Received',
    softCopy: { received: true, date: '2024-02-11 17:30' },
    hardCopy: { received: false, required: false }
  },
  expenses: { total: 15, recorded: 15, approved: true },
  claims: { total: 0, resolved: 0, totalDeduction: 0 },
  issues: { total: 2, resolved: 2 },
  deductions: { amount: 0, status: 'Clear' },
  accessorialCharges: {
    detention: 0,
    toll: 0,
    loading: 0,
    unloading: 0,
  },
  reconciliation: { status: 'Pending' },
  financials: {
    plannedRevenue: 45000,
    actualRevenue: 45000,
    plannedCost: 35000,
    actualCost: 36350,
    netProfit: 8650,
    marginPercent: 19.2
  }
});

export const getMockReconciliation = (tripId: string): ReconciliationMetric[] => [
  { metric: 'Distance', planned: 1450, actual: 1465, unit: 'km', variance: 15, variancePercent: 1.0, reason: 'Detour on NH-48 due to road work', status: 'Minor Variance' },
  { metric: 'Duration', planned: 24, actual: 26.5, unit: 'hrs', variance: 2.5, variancePercent: 10.4, reason: 'Loading delay (1hr) + Traffic near Vadodara', status: 'Major Variance' },
  { metric: 'Fuel Cost', planned: 22800, actual: 23400, unit: '₹', variance: 600, variancePercent: 2.6, reason: 'Extra distance & AC usage', status: 'Minor Variance' },
  { metric: 'Toll Cost', planned: 2950, actual: 3150, unit: '₹', variance: 200, variancePercent: 6.8, reason: 'Detour route had additional toll', status: 'Major Variance' },
  { metric: 'Driver Pay', planned: 8000, actual: 8000, unit: '₹', variance: 0, variancePercent: 0, status: 'Match' },
  { metric: 'Other Costs', planned: 1250, actual: 1800, unit: '₹', variance: 550, variancePercent: 44, reason: 'Unplanned parking & weighbridge fees', status: 'Major Variance' },
];

export const mockSyncToFinance = async (payload: FinancePayload): Promise<{ success: boolean, invoiceId: string }> => {
  // Generate a unique, deterministic invoice ID based on the trip ID + current year.
  // In production this would be returned by the Finance backend after creating the record.
  const tripNum = (payload.tripId || '').replace(/\D/g, '').slice(-4).padStart(4, '0');
  const year = new Date().getFullYear();
  const invoiceId = `INV-${year}-${tripNum}`;
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true, invoiceId }), 1200);
  });
};