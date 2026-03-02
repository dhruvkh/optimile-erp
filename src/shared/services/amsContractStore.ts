// ============================================================
// Optimile ERP — AMS Contract Store (Mock)
// ============================================================
// Simulates the AMS module providing finalized contract rates
// for specific lanes, vehicle types, and customers.
// Used by TMS for rate validation during booking.
// ============================================================

export interface ContractRate {
    id: string;
    clientId: string;
    vendorId?: string; // If applicable
    origin: string;
    destination: string;
    vehicleType: string;
    ratePerTrip: number;
    validUntil: string;
}

export const MOCK_AMS_CONTRACTS: ContractRate[] = [
    {
        id: 'CNT-001',
        clientId: 'CLI-001',
        origin: 'Mumbai',
        destination: 'Delhi',
        vehicleType: 'Truck 6x4',
        ratePerTrip: 45000,
        validUntil: '2027-12-31',
    },
    {
        id: 'CNT-002',
        clientId: 'CLI-005',
        origin: 'Chennai',
        destination: 'Bangalore',
        vehicleType: 'Container 6x4',
        ratePerTrip: 18000,
        validUntil: '2027-12-31',
    },
    {
        id: 'CNT-003',
        clientId: 'CLI-006',
        origin: 'Delhi',
        destination: 'Jaipur',
        vehicleType: 'LCV',
        ratePerTrip: 8500,
        validUntil: '2027-12-31',
    }
];

export const amsContractStore = {
    getContractRate(clientId: string, origin: string, destination: string, vehicleType: string): ContractRate | undefined {
        // Case insensitive matching
        return MOCK_AMS_CONTRACTS.find(
            (c) =>
                c.clientId === clientId &&
                c.origin.toLowerCase() === origin.toLowerCase() &&
                c.destination.toLowerCase() === destination.toLowerCase() &&
                c.vehicleType.toLowerCase() === vehicleType.toLowerCase()
        );
    }
};
