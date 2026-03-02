// ============================================================
// FinanceTMSBridge — Cross-Module Live Sync
// ============================================================
// Lives INSIDE Finance AppProvider but reads OperationalDataContext.
// Dispatches SYNC_FROM_TMS whenever TMS trips or vendor payables
// change, keeping Finance ledgers, invoices and balances live.
// ============================================================

import React, { useEffect, useRef } from 'react';
import { useApp } from './App';
import { useOperationalData } from '../../shared/context/OperationalDataContext';

export const FinanceTMSBridge: React.FC = () => {
  const { completedTrips, vendors } = useOperationalData();
  const { dispatch } = useApp();

  // Store refs so we only dispatch when the actual data changes
  const lastTripsRef = useRef(completedTrips);
  const lastVendorsRef = useRef(vendors);

  useEffect(() => {
    // Skip if neither reference changed (same object)
    if (
      lastTripsRef.current === completedTrips &&
      lastVendorsRef.current === vendors
    ) {
      return;
    }
    lastTripsRef.current = completedTrips;
    lastVendorsRef.current = vendors;

    dispatch({
      type: 'SYNC_FROM_TMS',
      payload: { trips: completedTrips, vendors },
    });
  }, [completedTrips, vendors, dispatch]);

  return null; // Purely a side-effect component — renders nothing
};
