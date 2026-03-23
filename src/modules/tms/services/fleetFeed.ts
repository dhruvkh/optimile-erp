import { DashboardVehicle, VehicleStatusType } from '../components/tracking/types';

// Fleet state management service - single source of truth for all vehicle data
class FleetFeedService {
  private fleet: DashboardVehicle[] = [];
  private subscribers: Set<(fleet: DashboardVehicle[]) => void> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeFleet();
  }

  private initializeFleet() {
    if (this.isInitialized) return;

    this.fleet = this.generateMockFleet();
    this.isInitialized = true;
    this.startUpdateLoop();
  }

  private generateMockFleet(): DashboardVehicle[] {
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
          confidence: 90 + Math.random() * 10,
        },
        speed,
        lastUpdate: status === 'offline' ? new Date(now.getTime() - 3600000).toISOString() : now.toISOString(),
        route: routes[i % routes.length],
        tripDetails: {
          origin: routes[i % routes.length].split(' - ')[0],
          destination: routes[i % routes.length].split(' - ')[1],
          eta: new Date(now.getTime() + (Math.random() * 12 + 1) * 3600000).toISOString(),
          progress: Math.floor(Math.random() * 100),
        },
      };
    });
  }

  private startUpdateLoop() {
    if (this.updateInterval) return;

    this.updateInterval = setInterval(() => {
      this.updateFleetPositions();
    }, 5000);
  }

  private updateFleetPositions() {
    this.fleet = this.fleet.map((vehicle) => {
      // Simulate movement for 'moving' vehicles
      if (vehicle.status === 'moving') {
        return {
          ...vehicle,
          position: {
            ...vehicle.position,
            latitude: vehicle.position.latitude + (Math.random() - 0.5) * 0.001,
            longitude: vehicle.position.longitude + (Math.random() - 0.5) * 0.001,
          },
          lastUpdate: new Date().toISOString(),
        };
      }
      return vehicle;
    });

    // Notify all subscribers
    this.notifySubscribers();
  }

  private notifySubscribers() {
    this.subscribers.forEach((callback) => {
      callback(this.fleet);
    });
  }

  /**
   * Subscribe to fleet updates. Returns unsubscribe function.
   */
  subscribe(callback: (fleet: DashboardVehicle[]) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately call with current fleet state
    callback(this.fleet);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get current fleet snapshot
   */
  getFleet(): DashboardVehicle[] {
    return [...this.fleet];
  }

  /**
   * Get a specific vehicle by ID
   */
  getVehicleById(id: string): DashboardVehicle | undefined {
    return this.fleet.find((v) => v.id === id);
  }

  /**
   * Cleanup and stop update loop
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.subscribers.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const fleetFeed = new FleetFeedService();
