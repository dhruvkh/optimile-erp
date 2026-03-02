
import { ApprovalRequest, IndentRiskScore } from './types';

// Helper to generate mock risk data
export const generateMockApprovals = (): ApprovalRequest[] => {
  return [
    {
      id: 'IND-2024-1001',
      bookingId: 'BK-2024-1001',
      submittedBy: { name: 'Ramesh Kumar', role: 'Regional Manager' },
      submittedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      client: 'Acme Corporation',
      route: { origin: 'Mumbai', destination: 'Delhi', distance: 1450 },
      value: 45000,
      vehicleType: '20 Ton Closed Body',
      status: 'Pending',
      riskData: {
        indentId: 'IND-2024-1001',
        overallRisk: 'Critical',
        riskScore: 82, // High score
        scoredAt: new Date().toISOString(),
        flaggedIssues: [
          'Rate 22% BELOW market - severe revenue leakage risk',
          'Spot market vehicle - high risk',
          'No vehicles available in region'
        ],
        recommendations: [
          'Re-negotiate rate with customer (target: ₹55,000)',
          'Verify vehicle availability before confirming',
          'Request carrier insurance verification'
        ],
        factors: {
          rateVariance: { score: 25, weight: 0.25, details: { concern: 'Rate 22% below market average', variance: -22, marketRate: 57500 } },
          carrierValidation: { score: 15, weight: 0.25, details: { concern: 'Spot market vehicle, documents incomplete', carrierType: 'Spot Market' } },
          capacityCheck: { score: 20, weight: 0.20, details: { concern: 'No vehicles available in region', availability: 0 } },
          routeRisk: { score: 3, weight: 0.15, details: { concern: 'Standard route' } },
          userProfile: { score: 5, weight: 0.15, details: { concern: 'User has high rejection rate (15%)' } }
        }
      },
      auditTrail: [
        { id: '1', action: 'Submitted for Approval', user: 'Ramesh Kumar', role: 'Regional Manager', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), type: 'user' },
        { id: '2', action: 'Risk Assessment Completed', user: 'System AI', role: 'System', timestamp: new Date(Date.now() - 1000 * 60 * 119).toISOString(), details: 'Score: 82/100 (Critical)', type: 'risk' }
      ]
    },
    {
      id: 'IND-2024-1005',
      bookingId: 'BK-2024-1042',
      submittedBy: { name: 'Sarah Smith', role: 'Ops Head' },
      submittedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      client: 'Global Foods Inc',
      route: { origin: 'Pune', destination: 'Hyderabad', distance: 560 },
      value: 28000,
      vehicleType: 'Refrigerated Container',
      status: 'Pending',
      riskData: {
        indentId: 'IND-2024-1005',
        overallRisk: 'Medium',
        riskScore: 45,
        scoredAt: new Date().toISOString(),
        flaggedIssues: [
          'New Partner Carrier (First Trip)'
        ],
        recommendations: [
          'Monitor trip closely',
          'Ensure insurance is valid'
        ],
        factors: {
          rateVariance: { score: 5, weight: 0.25, details: { concern: 'Rate within acceptable range (+2%)', variance: 2 } },
          carrierValidation: { score: 12, weight: 0.25, details: { concern: 'New Partner, documents verified', carrierType: 'Partner' } },
          capacityCheck: { score: 5, weight: 0.20, details: { concern: 'Moderate demand' } },
          routeRisk: { score: 0, weight: 0.15, details: { concern: 'Standard route' } },
          userProfile: { score: 0, weight: 0.15, details: { concern: 'Senior user' } }
        }
      },
      auditTrail: [
        { id: '1', action: 'Submitted for Approval', user: 'Sarah Smith', role: 'Ops Head', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), type: 'user' },
        { id: '2', action: 'Risk Assessment Completed', user: 'System AI', role: 'System', timestamp: new Date(Date.now() - 1000 * 60 * 44).toISOString(), details: 'Score: 45/100 (Medium)', type: 'risk' }
      ]
    },
    {
      id: 'IND-2024-1008',
      bookingId: 'BK-2024-1055',
      submittedBy: { name: 'Mike Johnson', role: 'Regional Manager' },
      submittedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      client: 'TechStart',
      route: { origin: 'Bangalore', destination: 'Chennai', distance: 350 },
      value: 18500,
      vehicleType: '10 Ton Open',
      status: 'Pending',
      riskData: {
        indentId: 'IND-2024-1008',
        overallRisk: 'High',
        riskScore: 65,
        scoredAt: new Date().toISOString(),
        flaggedIssues: [
          'Route disruption alert (Monsoon)',
          'Rate 8% above market'
        ],
        recommendations: [
          'Verify route feasibility',
          'Check for weather delays'
        ],
        factors: {
          rateVariance: { score: 10, weight: 0.25, details: { concern: 'Rate 8% above market', variance: 8 } },
          carrierValidation: { score: 5, weight: 0.25, details: { concern: 'Verified Partner' } },
          capacityCheck: { score: 5, weight: 0.20, details: { concern: 'Normal availability' } },
          routeRisk: { score: 15, weight: 0.15, details: { concern: 'High risk: Heavy Rains reported' } },
          userProfile: { score: 0, weight: 0.15, details: { concern: 'Normal profile' } }
        }
      },
      auditTrail: [
        { id: '1', action: 'Submitted for Approval', user: 'Mike Johnson', role: 'Regional Manager', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), type: 'user' }
      ]
    }
  ];
};
