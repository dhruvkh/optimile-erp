import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppProvider } from './App';
import { FinanceTMSBridge } from './FinanceTMSBridge';

export const FinanceLayout: React.FC = () => {
  return (
    <AppProvider>
      {/* FinanceTMSBridge: lives inside AppProvider so it can call useApp(),
          and reads OperationalDataContext to react to TMS/Fleet changes.
          Fires SYNC_FROM_TMS whenever trips or vendor payables update. */}
      <FinanceTMSBridge />
      <Outlet />
    </AppProvider>
  );
};
