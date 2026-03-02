
export type TrackingSourceType = 'GPS' | 'App' | 'SIM';
export type VehicleStatusType = 'moving' | 'short_stop' | 'long_stop' | 'offline' | 'deviated';

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number; // meters
  speed: number; // km/h
  heading: number; // degrees
  timestamp: string;
  source: TrackingSourceType;
  confidence: number; // 0-100
  isSmoothed?: boolean;
}

export interface SourceHealth {
  id: TrackingSourceType;
  name: string;
  enabled: boolean;
  status: 'Active' | 'Inactive' | 'Error' | 'Warning' | 'Pending';
  lastPing: string;
  batteryLevel?: number; // GPS & App
  signalStrength?: number; // GPS & App
  accuracy: number; // Typical accuracy
  message?: string;
  // SIM Specific
  consentGiven?: boolean;
  consentExpiry?: string;
}

export interface VehicleTrackingState {
  vehicleId: string;
  plateNumber: string;
  activeSource: TrackingSourceType | null;
  currentPosition: GeoPosition;
  sources: {
    GPS: SourceHealth;
    App: SourceHealth;
    SIM: SourceHealth;
  };
  dataQuality: {
    score: number; // 0-100
    anomaliesDetected: number;
    smoothingApplied: boolean;
  };
  history: GeoPosition[];
  fallbackEvents: {
    time: string;
    from: string;
    to: string;
    reason: string;
  }[];
}

export interface DashboardVehicle {
  id: string;
  plateNumber: string;
  driverName?: string;
  status: VehicleStatusType;
  position: GeoPosition;
  speed: number;
  lastUpdate: string;
  route: string;
  tripDetails?: {
    origin: string;
    destination: string;
    eta: string;
    progress: number;
  };
}
