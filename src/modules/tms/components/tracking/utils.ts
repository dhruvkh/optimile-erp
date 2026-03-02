
import { VehicleTrackingState, GeoPosition, SourceHealth, TrackingSourceType, DashboardVehicle, VehicleStatusType } from './types';

// --- Kalman Filter Simulation ---
export class GPSSmoothing {
  private lastEstimate: number | null = null;
  private P = 1.0; // Estimation error
  private Q = 0.00001; // Process noise
  private R = 0.001; // Measurement noise
  private K = 0.0; // Kalman gain

  filter(measurement: number): number {
    if (this.lastEstimate === null) {
      this.lastEstimate = measurement;
      return measurement;
    }

    // Prediction
    const prediction = this.lastEstimate;
    this.P = this.P + this.Q;

    // Update
    this.K = this.P / (this.P + this.R);
    const estimate = prediction + this.K * (measurement - prediction);
    this.P = (1 - this.K) * this.P;

    this.lastEstimate = estimate;
    return estimate;
  }
}

// --- Priority Logic ---
export const determineActiveSource = (sources: { GPS: SourceHealth, App: SourceHealth, SIM: SourceHealth }): { source: TrackingSourceType | null, reason: string } => {
  // Priority 1: GPS Device
  if (sources.GPS.enabled && sources.GPS.status === 'Active') {
    return { source: 'GPS', reason: 'Primary device active' };
  }

  // Priority 2: App
  if (sources.App.enabled && sources.App.status === 'Active') {
    return { source: 'App', reason: 'GPS inactive, using Driver App' };
  }

  // Priority 3: SIM (Requires Consent)
  if (sources.SIM.enabled && sources.SIM.status === 'Active' && sources.SIM.consentGiven) {
    return { source: 'SIM', reason: 'Fallback to SIM triangulation' };
  }

  return { source: null, reason: 'No active tracking sources' };
};

// --- Mock Data Generator ---
export const generateMockTrackingState = (): VehicleTrackingState => {
  const now = new Date();

  // Base location (Mumbai coordinates)
  const baseLat = 19.0760;
  const baseLng = 72.8777;

  // Generate a history path
  const history: GeoPosition[] = Array.from({ length: 20 }).map((_, i) => ({
    latitude: baseLat + (i * 0.001) + (Math.random() * 0.0002),
    longitude: baseLng + (i * 0.001) + (Math.random() * 0.0002),
    accuracy: 10,
    speed: 40 + Math.random() * 10,
    heading: 45,
    timestamp: new Date(now.getTime() - (20 - i) * 30000).toISOString(),
    source: 'GPS',
    confidence: 95,
    isSmoothed: true
  }));

  return {
    vehicleId: 'VEH-1001',
    plateNumber: 'MH-01-AB-1234',
    activeSource: 'GPS',
    currentPosition: history[history.length - 1],
    sources: {
      GPS: {
        id: 'GPS',
        name: 'Telematics Unit',
        enabled: true,
        status: 'Active',
        lastPing: 'Just now',
        batteryLevel: 85,
        signalStrength: 4,
        accuracy: 5
      },
      App: {
        id: 'App',
        name: 'Driver App',
        enabled: true,
        status: 'Active',
        lastPing: '2 mins ago',
        batteryLevel: 62,
        accuracy: 15,
        message: 'Running in background'
      },
      SIM: {
        id: 'SIM',
        name: 'SIM Triangulation',
        enabled: true,
        status: 'Active',
        lastPing: '5 mins ago',
        accuracy: 500,
        consentGiven: true,
        consentExpiry: new Date(now.getTime() + 80 * 24 * 60 * 60 * 1000).toISOString() // 80 days left
      }
    },
    dataQuality: {
      score: 92,
      anomaliesDetected: 0,
      smoothingApplied: true
    },
    history,
    fallbackEvents: [
      {
        time: new Date(now.getTime() - 3600000).toISOString(),
        from: 'GPS',
        to: 'App',
        reason: 'GPS Signal Lost (Tunnel)'
      },
      {
        time: new Date(now.getTime() - 3000000).toISOString(),
        from: 'App',
        to: 'GPS',
        reason: 'GPS Signal Restored'
      }
    ]
  };
};


export const generateMockFleet = (): DashboardVehicle[] => {
  const now = new Date();

  // List of major Indian cities to guarantee vehicles stay within borders
  const indianCities = [
    { city: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { city: 'Delhi', lat: 28.7041, lng: 77.1025 },
    { city: 'Bangalore', lat: 12.9716, lng: 77.5946 },
    { city: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    { city: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { city: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    { city: 'Pune', lat: 18.5204, lng: 73.8567 },
    { city: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    { city: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    { city: 'Lucknow', lat: 26.8467, lng: 80.9462 },
    { city: 'Nagpur', lat: 21.1458, lng: 79.0882 },
    { city: 'Indore', lat: 22.7196, lng: 75.8577 },
    { city: 'Bhopal', lat: 23.2599, lng: 77.4126 },
    { city: 'Patna', lat: 25.5941, lng: 85.1376 },
    { city: 'Kochi', lat: 9.9312, lng: 76.2673 },
  ];

  const statuses: VehicleStatusType[] = ['moving', 'moving', 'moving', 'short_stop', 'long_stop', 'offline', 'deviated'];
  const routes = ['Mumbai - Delhi', 'Delhi - Jaipur', 'Bangalore - Chennai', 'Hyderabad - Pune', 'Kolkata - Patna', 'Ahmedabad - Surat', 'Lucknow - Kanpur'];

  return Array.from({ length: 25 }).map((_, i) => {
    // Pick a random city and add a small offset (approx max 50km radius)
    const baseLocation = indianCities[Math.floor(Math.random() * indianCities.length)];
    const randomLat = baseLocation.lat + (Math.random() - 0.5) * 0.5;
    const randomLng = baseLocation.lng + (Math.random() - 0.5) * 0.5;

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const speed = status === 'moving' ? 40 + Math.random() * 40 : 0;

    return {
      id: `VEH-${1000 + i}`,
      plateNumber: `MH-${Math.floor(Math.random() * 50).toString().padStart(2, '0')}-AB-${1000 + Math.floor(Math.random() * 9000)}`,
      driverName: `Driver ${i + 1}`,
      status,
      position: {
        latitude: randomLat,
        longitude: randomLng,
        accuracy: 10,
        speed,
        heading: Math.random() * 360,
        timestamp: now.toISOString(),
        source: 'GPS',
        confidence: 90 + Math.random() * 10
      },
      speed,
      lastUpdate: status === 'offline' ? new Date(now.getTime() - 3600000).toISOString() : now.toISOString(),
      route: routes[i % routes.length],
      tripDetails: {
        origin: routes[i % routes.length].split(' - ')[0],
        destination: routes[i % routes.length].split(' - ')[1],
        eta: new Date(now.getTime() + (Math.random() * 12 + 1) * 3600000).toISOString(),
        progress: Math.floor(Math.random() * 100)
      }
    };
  });
};
