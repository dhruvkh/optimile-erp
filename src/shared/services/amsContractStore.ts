// ============================================================
// Optimile ERP — AMS Contract Store (Mock)
// ============================================================
// Simulates the AMS module providing finalized contract rates
// for specific lanes, vehicle types, and customers.
// Used by TMS for rate validation during booking, and by the
// FTL Rate Benchmarking service to compute contract vs market.
//
// Vehicle types use Indian body-size naming convention:
//   20 Ft, 24 Ft, 32 Ft SXL, 32 Ft MXL, 40 Ft
//
// Rates reflect Indian trucking market 2024-25.
// Contract mix is calibrated for demo: 5 Above Market,
// 4 At Market, 3 Below Market across 12 FTL lanes.
// ============================================================

export interface ContractRate {
    id: string;
    clientId: string;
    vendorId?: string;
    origin: string;
    destination: string;
    vehicleType: string;
    ratePerTrip: number;
    validUntil: string;
}

export const MOCK_AMS_CONTRACTS: ContractRate[] = [
    // ── Updated (aligned to new lane definitions) ─────────────────────────

    // Mumbai → Delhi | 32 Ft MXL — ABOVE MARKET (+17.5% vs P50 ₹57k)
    {
        id: 'CNT-001',
        clientId: 'CLI-001',
        origin: 'Mumbai',
        destination: 'Delhi',
        vehicleType: '32 Ft MXL',
        ratePerTrip: 67000,
        validUntil: '2027-12-31',
    },
    // Chennai → Bangalore | 40 Ft — ABOVE MARKET (+36.6% vs P50 ₹20.5k)
    {
        id: 'CNT-002',
        clientId: 'CLI-001',
        origin: 'Chennai',
        destination: 'Bangalore',
        vehicleType: '40 Ft',
        ratePerTrip: 28000,
        validUntil: '2027-12-31',
    },
    // Delhi → Jaipur | 20 Ft — AT MARKET (+4% vs P50 ₹7.5k)
    {
        id: 'CNT-003',
        clientId: 'CLI-001',
        origin: 'Delhi',
        destination: 'Jaipur',
        vehicleType: '20 Ft',
        ratePerTrip: 7800,
        validUntil: '2027-12-31',
    },

    // ── New contracts ─────────────────────────────────────────────────────

    // Delhi → Mumbai | 32 Ft MXL — AT MARKET (-7.4% vs P50 ₹54k)
    {
        id: 'CNT-004',
        clientId: 'CLI-001',
        origin: 'Delhi',
        destination: 'Mumbai',
        vehicleType: '32 Ft MXL',
        ratePerTrip: 50000,
        validUntil: '2027-12-31',
    },
    // Mumbai → Bangalore | 32 Ft SXL — BELOW MARKET (-15.8% vs P50 ₹38k)
    {
        id: 'CNT-005',
        clientId: 'CLI-001',
        origin: 'Mumbai',
        destination: 'Bangalore',
        vehicleType: '32 Ft SXL',
        ratePerTrip: 32000,
        validUntil: '2027-12-31',
    },
    // Delhi → Kolkata | 32 Ft MXL — AT MARKET (+3.6% vs P50 ₹56k)
    {
        id: 'CNT-006',
        clientId: 'CLI-001',
        origin: 'Delhi',
        destination: 'Kolkata',
        vehicleType: '32 Ft MXL',
        ratePerTrip: 58000,
        validUntil: '2027-12-31',
    },
    // Chennai → Hyderabad | 40 Ft — BELOW MARKET (-11.1% vs P50 ₹27k)
    {
        id: 'CNT-007',
        clientId: 'CLI-001',
        origin: 'Chennai',
        destination: 'Hyderabad',
        vehicleType: '40 Ft',
        ratePerTrip: 24000,
        validUntil: '2027-12-31',
    },
    // Mumbai → Hyderabad | 32 Ft SXL — ABOVE MARKET (+35.6% vs P50 ₹29.5k)
    {
        id: 'CNT-008',
        clientId: 'CLI-001',
        origin: 'Mumbai',
        destination: 'Hyderabad',
        vehicleType: '32 Ft SXL',
        ratePerTrip: 40000,
        validUntil: '2027-12-31',
    },
    // Ahmedabad → Mumbai | 24 Ft — BELOW MARKET (-12.5% vs P50 ₹16k)
    {
        id: 'CNT-009',
        clientId: 'CLI-001',
        origin: 'Ahmedabad',
        destination: 'Mumbai',
        vehicleType: '24 Ft',
        ratePerTrip: 14000,
        validUntil: '2027-12-31',
    },
    // Kolkata → Guwahati | 32 Ft MXL — ABOVE MARKET (+31.6% vs P50 ₹38k)
    {
        id: 'CNT-010',
        clientId: 'CLI-001',
        origin: 'Kolkata',
        destination: 'Guwahati',
        vehicleType: '32 Ft MXL',
        ratePerTrip: 50000,
        validUntil: '2027-12-31',
    },
    // Mumbai → Pune | 20 Ft — AT MARKET (-7.1% vs P50 ₹7k)
    {
        id: 'CNT-011',
        clientId: 'CLI-001',
        origin: 'Mumbai',
        destination: 'Pune',
        vehicleType: '20 Ft',
        ratePerTrip: 6500,
        validUntil: '2027-12-31',
    },
    // Delhi → Lucknow | 24 Ft — ABOVE MARKET (+17.5% vs P50 ₹15.75k)
    {
        id: 'CNT-012',
        clientId: 'CLI-001',
        origin: 'Delhi',
        destination: 'Lucknow',
        vehicleType: '24 Ft',
        ratePerTrip: 18500,
        validUntil: '2027-12-31',
    },
];

export const amsContractStore = {
    getContractRate(clientId: string, origin: string, destination: string, vehicleType: string): ContractRate | undefined {
        return MOCK_AMS_CONTRACTS.find(
            (c) =>
                c.clientId === clientId &&
                c.origin.toLowerCase() === origin.toLowerCase() &&
                c.destination.toLowerCase() === destination.toLowerCase() &&
                c.vehicleType.toLowerCase() === vehicleType.toLowerCase()
        );
    }
};
