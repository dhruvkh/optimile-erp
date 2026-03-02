
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface RiskFactor {
  score: number; // 0-25
  weight: number;
  details: {
    concern: string;
    [key: string]: any;
  };
}

export interface IndentRiskScore {
  indentId: string;
  overallRisk: RiskLevel;
  riskScore: number; // 0-100
  factors: {
    rateVariance: RiskFactor;
    carrierValidation: RiskFactor;
    capacityCheck: RiskFactor;
    routeRisk: RiskFactor;
    userProfile: RiskFactor;
  };
  flaggedIssues: string[];
  recommendations: string[];
  scoredAt: string;
}

export interface ApprovalRequest {
  id: string; // Indent ID
  bookingId: string;
  submittedBy: {
    name: string;
    role: string;
    avatar?: string;
  };
  submittedAt: string;
  client: string;
  route: {
    origin: string;
    destination: string;
    distance: number;
  };
  value: number;
  vehicleType: string;
  riskData: IndentRiskScore;
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Info Requested';
  auditTrail: AuditLogEntry[];
}

export interface AuditLogEntry {
  id: string;
  action: string;
  user: string;
  role: string;
  timestamp: string;
  details?: string;
  type: 'system' | 'user' | 'risk';
}
