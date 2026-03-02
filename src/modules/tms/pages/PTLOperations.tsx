import React from 'react';
import { PTLConsolidationDashboard } from '../components/operations/ptl/PTLConsolidationDashboard';

/**
 * PTL (Part Truck Load) Operations Page
 *
 * Handles the complete PTL flow:
 * 1. First Mile: Multi-party pickup from different locations
 * 2. Hub Consolidation: Load optimization and vehicle type selection
 * 3. Inter-Hub FTL: Full truck load movement between hubs
 * 4. Last Mile: Multi-destination delivery
 */
export const PTLOperations: React.FC = () => {
  return <PTLConsolidationDashboard />;
};
