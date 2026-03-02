import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useApp } from "../App";
import { Invoice, Booking } from '../types';
import { formatINR } from '../utils';
import { InvoiceTemplate } from './InvoiceTemplate';
import { useOperationalData } from '../../../shared/context/OperationalDataContext';
import { useToast } from '../../../shared/context/ToastContext';

// --- Types & Steps ---
const STEPS = ['Details', 'Select Trips', 'Summary', 'Preview'];

// --- Main Create Wizard ---

const CreateInvoice: React.FC = () => {
  const { state, dispatch } = useApp();
  const { completedTrips, markInvoiced: markOperationalInvoiced } = useOperationalData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(0);

  // Check for bookings passed from Pending Invoice Tab
  const preSelectedBookings: Booking[] = (location.state as any)?.selectedBookings || [];

  // State for selected booking IDs in Step 2
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(
    new Set(preSelectedBookings.map(b => b.id))
  );

  // Pre-fill customer details if bookings exist
  const initialCustomerId = preSelectedBookings.length > 0 ? preSelectedBookings[0].customerId : '';
  const initialCustomer = state.customers.find(c => c.id === initialCustomerId);

  // Form Setup
  const { register, control, watch, setValue, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(state.invoices.length + 1).padStart(4, '0')}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerId: initialCustomerId,
      customerName: initialCustomer?.name || '',
      customerTaxId: initialCustomer?.taxId || '',
      customerAddress: initialCustomer?.address || '',
      discount: 0,
    }
  });

  const discount = watch("discount");
  const selectedCustomerId = watch("customerId");

  // Real-time Credit Logic
  const selectedCustomer = state.customers.find(c => c.id === selectedCustomerId);
  const currentOutstanding = state.invoices
    .filter(i => i.customerId === selectedCustomerId && i.status !== 'paid')
    .reduce((acc, i) => acc + i.amount, 0);

  // Pending Trips for selected customer — from Finance state (historical data)
  const financeStatePendingTrips = state.bookings.filter(
    b => b.customerId === selectedCustomerId && b.status === 'pending'
  );

  // Pending Trips from the live TMS operational context (newly created trips this session).
  // Only include trips that have had their POD uploaded (pod_received) and are not yet invoiced,
  // AND are not already represented in the Finance state bookings (avoid duplicates).
  const financeBookingRefs = new Set(state.bookings.map(b => b.id));
  const operationalPendingTrips: Booking[] = completedTrips
    .filter(t =>
      !t.invoiced &&
      ['pod_received', 'delivered'].includes(t.status) &&
      t.clientId === selectedCustomerId &&
      !financeBookingRefs.has(t.bookingRef) // not already in Finance state
    )
    .map(t => ({
      id: t.id, // use the operational trip ID so markInvoiced can find it later
      customerId: t.clientId,
      customerName: t.clientName,
      origin: t.origin,
      destination: t.destination,
      distance: t.distanceKm,
      vehicleId: t.vehicleId,
      driverName: t.driverName,
      driverPhone: t.driverPhone,
      bookedDate: t.bookedDate,
      completedDate: t.deliveredDate || t.dispatchDate || t.bookedDate,
      amount: t.revenueAmount,
      expense: t.totalCost,
      status: 'pending' as const,
      podUrl: t.podUrl,
      podVerified: t.podVerified,
    }));

  const pendingTrips = [...financeStatePendingTrips, ...operationalPendingTrips];

  // If customer changes, clear selected bookings
  useEffect(() => {
    if (preSelectedBookings.length === 0) {
      setSelectedBookingIds(new Set());
    }
  }, [selectedCustomerId]);

  // Derived Line Items from selected bookings — search across both Finance state AND
  // operational trips (all eligible pending trips are already merged in pendingTrips).
  const allEligibleBookings = [...state.bookings, ...operationalPendingTrips];
  const selectedBookings = allEligibleBookings.filter(b => selectedBookingIds.has(b.id));
  const lineItems = selectedBookings.map(b => {
    const opTrip = completedTrips.find(t => t.id === b.id || t.bookingRef === b.id);
    const truckNo = (b as any).vehicleRegNumber || opTrip?.vehicleRegNumber || b.vehicleId || '–';
    const shippingDate = b.bookedDate || opTrip?.dispatchDate || '';
    const deliveryDate = b.completedDate || opTrip?.deliveredDate || '';
    const rawId = b.id.replace(/\D/g, '').slice(-4).padStart(4, '0');
    const lrNumber = shippingDate
      ? `LR-${shippingDate.replace(/-/g, '').substring(2, 8)}-${rawId}`
      : `LR-${rawId}`;
    return {
      id: `li_${b.id}`,
      description: `Freight: ${b.origin} → ${b.destination} (${b.distance} km) [${b.id}]`,
      quantity: 1,
      unitPrice: b.amount,
      taxRate: 18,
      total: b.amount,
      bkgId: b.id,
      shippingDate,
      deliveryDate,
      truckNo,
      lrNumber,
      placeOfOrigin: b.origin,
      placeOfDestination: b.destination,
      detentionCharges: 0,
      loadingCharges: 0,
      otherCharges: 0,
      advanceReceived: 0,
    };
  });

  const subTotal = lineItems.reduce((acc, item) => acc + item.total, 0);

  // Determine GST type: IGST for interstate trips, CGST+SGST for intrastate.
  // Extract state from "City, State" format; fall back to intrastate if unknown.
  const extractState = (cityState: string) => cityState.split(',').pop()?.trim().toLowerCase() || '';
  const tripStates = selectedBookings.map(b => {
    const opTrip = completedTrips.find(t => t.id === b.id || t.bookingRef === b.id);
    return {
      originState: extractState(opTrip?.origin || b.origin || ''),
      destState: extractState(opTrip?.destination || b.destination || ''),
    };
  });
  // If any selected trip is interstate, use IGST for the whole invoice
  const isInterstate = tripStates.some(s => s.originState && s.destState && s.originState !== s.destState);

  const cgstAmount = isInterstate ? 0 : subTotal * 0.09;
  const sgstAmount = isInterstate ? 0 : subTotal * 0.09;
  const igstAmount = isInterstate ? subTotal * 0.18 : 0;
  const taxAmount = isInterstate ? igstAmount : cgstAmount + sgstAmount; // Total 18% GST
  const grandTotal = subTotal + taxAmount - (discount || 0);

  const expectedTds = selectedCustomer?.tdsRate ? subTotal * (selectedCustomer.tdsRate / 100) : 0;

  const isCreditExceeded = selectedCustomer && (currentOutstanding + grandTotal > selectedCustomer.creditLimit);

  // Handlers
  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cust = state.customers.find(c => c.id === e.target.value);
    if (cust) {
      setValue("customerId", cust.id);
      setValue("customerName", cust.name);
      setValue("customerTaxId", cust.taxId);
      setValue("customerAddress", cust.address || 'Mumbai, India');
    } else {
      setValue("customerId", '');
      setValue("customerName", '');
      setValue("customerTaxId", '');
      setValue("customerAddress", '');
    }
  };

  const toggleBooking = (bookingId: string) => {
    const newSet = new Set(selectedBookingIds);
    if (newSet.has(bookingId)) {
      newSet.delete(bookingId);
    } else {
      newSet.add(bookingId);
    }
    setSelectedBookingIds(newSet);
  };

  // Builds the Invoice object from current form + selected trips
  const buildInvoice = (data: any, status: Invoice['status'] = 'sent'): Invoice => {
    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    return {
      id: invoiceId,
      customerId: data.customerId,
      customerName: data.customerName,
      invoiceNumber: data.invoiceNumber,
      status,
      date: data.date,
      dueDate: data.dueDate,
      amount: grandTotal,
      taxAmount: taxAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      isInterstate,
      discount: data.discount,
      lineItems: lineItems,
      paidAmount: 0,
      // E-invoice IRN placeholder — in production this calls the GST IRP API
      eInvoiceDetails: status === 'sent' ? {
        irn: `IRN${invoiceId.slice(-16).toUpperCase().padStart(16, '0')}`,
        ackNo: `${1000000000 + (state.invoices.length + 1)}`,
        ackDate: new Date().toISOString(),
      } : undefined,
    };
  };

  const onSubmit = (data: any) => {
    if (!data.customerId) {
      showToast({ type: 'warning', title: 'Customer Required', message: 'Please select a customer before submitting.' });
      return;
    }
    if (selectedBookingIds.size === 0) {
      showToast({ type: 'warning', title: 'No Trips Selected', message: 'Please select at least one trip to invoice.' });
      return;
    }

    const newInvoice = buildInvoice(data, 'sent');
    dispatch({ type: 'ADD_INVOICE', payload: newInvoice });
    dispatch({ type: 'MARK_BOOKINGS_INVOICED', payload: Array.from(selectedBookingIds) });

    // For trips that came from the live TMS operational context (not the Finance static
    // snapshot), mark them as invoiced in the shared OperationalDataContext so the
    // TMS Operations view reflects the updated state.
    Array.from(selectedBookingIds).forEach(bookingId => {
      const opTrip = completedTrips.find(t => t.id === bookingId);
      if (opTrip) markOperationalInvoiced(bookingId, newInvoice.id);
    });

    showToast({ type: 'success', title: 'Invoice Created', message: `${newInvoice.invoiceNumber} sent to ${data.customerName}.` });
    navigate('/finance/invoices');
  };

  const handleSaveDraft = (data: any) => {
    if (!data.customerId) {
      showToast({ type: 'warning', title: 'Customer Required', message: 'Please select a customer to save as draft.' });
      return;
    }
    const draft = buildInvoice(data, 'draft');
    dispatch({ type: 'ADD_INVOICE', payload: draft });
    showToast({ type: 'success', title: 'Draft Saved', message: `${draft.invoiceNumber} saved as draft.` });
    navigate('/finance/invoices');
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
        <div className="flex items-center mt-4">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center ${i <= step ? 'text-primary' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold ${i <= step ? 'border-primary bg-blue-50' : 'border-gray-300'}`}>
                  {i + 1}
                </div>
                <span className="ml-2 font-medium">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className="w-12 h-0.5 bg-gray-200 mx-4" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-[400px]">
        {/* Context info for booking conversion */}
        {preSelectedBookings.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 flex items-center justify-between">
            <div className="flex items-center">
              <span className="material-icons text-green-500 mr-3">receipt_long</span>
              <div>
                <h4 className="font-bold text-green-800">Generating Invoice from Bookings</h4>
                <p className="text-sm text-green-700 mt-1">
                  {preSelectedBookings.length} pending trips included. Customer details pre-filled.
                </p>
              </div>
            </div>
            <span className="text-sm font-bold text-green-900 bg-green-200 px-3 py-1 rounded-full">
              Total Value: {formatINR(subTotal)}
            </span>
          </div>
        )}

        {/* Credit Limit Warning */}
        {isCreditExceeded && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-start">
            <span className="material-icons text-red-500 mr-3">warning</span>
            <div>
              <h4 className="font-bold text-red-800">Credit Limit Exceeded</h4>
              <p className="text-sm text-red-700 mt-1">
                This invoice will push {selectedCustomer?.name} over their credit limit of {formatINR(selectedCustomer?.creditLimit || 0)}.
                <br />Current Outstanding: {formatINR(currentOutstanding)} + New Invoice: {formatINR(grandTotal)}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>

          {/* Step 1: Details */}
          <div className={step === 0 ? 'block' : 'hidden'}>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                <input {...register("invoiceNumber")} readOnly className="w-full bg-gray-50 border-gray-300 rounded-md p-2 text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                <input type="date" {...register("date")} className="w-full border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
                <select
                  disabled={preSelectedBookings.length > 0}
                  className={`w-full border-gray-300 rounded-md shadow-sm p-2 ${preSelectedBookings.length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  {...register("customerId", { onChange: handleCustomerChange })}
                >
                  <option value="">-- Choose Customer --</option>
                  {state.customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {preSelectedBookings.length > 0 && <p className="text-xs text-gray-500 mt-1">Customer locked for booking conversion.</p>}
              </div>
              {watch("customerName") && (
                <div className="col-span-2 bg-blue-50 p-4 rounded-md border border-blue-100">
                  <p className="font-bold text-blue-900">{watch("customerName")}</p>
                  <p className="text-sm text-blue-700">{watch("customerTaxId")}</p>
                  <p className="text-sm text-blue-700">{watch("customerAddress")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Select Trips */}
          <div className={step === 1 ? 'block' : 'hidden'}>
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Select pending trips to invoice</h3>

              {pendingTrips.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
                  <span className="material-icons text-gray-400 text-4xl mb-2">inbox</span>
                  <p className="text-gray-500">No pending trips found for this customer.</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingTrips.map(trip => (
                        <tr key={trip.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleBooking(trip.id)}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedBookingIds.has(trip.id)}
                              onChange={() => { }} // handled by tr click
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trip.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trip.origin} → {trip.destination}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trip.completedDate || trip.bookedDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">{formatINR(trip.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Summary */}
          <div className={step === 2 ? 'block' : 'hidden'}>
            <div className="max-w-sm ml-auto space-y-4 text-right">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Selected Trips ({selectedBookingIds.size})</span>
                <span className="font-bold text-lg">{formatINR(subTotal)}</span>
              </div>
              {isInterstate ? (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">IGST (18%) — Interstate</span>
                  <span className="font-bold text-gray-700">{formatINR(igstAmount)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">CGST (9%)</span>
                    <span className="font-bold text-gray-700">{formatINR(cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">SGST (9%)</span>
                    <span className="font-bold text-gray-700">{formatINR(sgstAmount)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Tax (GST 18%)</span>
                <span className="font-bold text-lg text-red-600">{formatINR(taxAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Discount</span>
                <input type="number" {...register("discount")} className="w-32 border-gray-300 rounded-md p-1 text-right" />
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Grand Total</span>
                <span className="text-2xl font-bold text-primary">{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Step 4: Preview */}
          <div className={step === 3 ? 'block' : 'hidden'}>
            <div className="bg-blue-50 border border-blue-200 p-4 mb-4 rounded-lg flex justify-between items-center">
              <div className="text-sm">
                <span className="font-bold text-blue-900">E-Invoice Generation Ready</span>
                <p className="text-blue-700">IRN and QR code will be generated automatically via IRP integration upon submission.</p>
              </div>
              <span className="material-icons text-blue-500 text-3xl">qr_code_2</span>
            </div>
            <div className="shadow-lg">
              <InvoiceTemplate data={{
                ...watch(), lineItems, cgstAmount, sgstAmount, tdsRate: selectedCustomer?.tdsRate, expectedTds, eInvoiceDetails: {
                  irn: 'IRN_PREVIEW_xxxxxxxxxxxxxxxxxxxxxxxx',
                  ackNo: 'ACK_PREVIEW_000000000',
                  ackDate: new Date().toISOString()
                }
              }} total={grandTotal} tax={taxAmount} />
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 disabled:opacity-50"
            >
              Back
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 0 && !watch("customerId")) {
                    showToast({ type: 'warning', title: 'Customer Required', message: 'Please select a customer first.' });
                    return;
                  }
                  if (step === 1 && selectedBookingIds.size === 0) {
                    showToast({ type: 'warning', title: 'No Trips Selected', message: 'Please select at least one trip to invoice.' });
                    return;
                  }
                  setStep(s => Math.min(3, s + 1));
                }}
                className="px-6 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <div className="space-x-4">
                <button
                  type="button"
                  onClick={handleSubmit(handleSaveDraft)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Save Draft
                </button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700">
                  {isCreditExceeded ? 'Save & Request Approval' : 'Send Invoice'}
                </button>
              </div>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateInvoice;
