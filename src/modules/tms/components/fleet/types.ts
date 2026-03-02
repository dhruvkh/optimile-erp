export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: string;
  subType?: string;
  status: 'Active' | 'Maintenance' | 'Inactive';
  capacity: {
    weight: number;
    unit: string;
    volume?: number;
  };
  ownership: 'Own' | 'Leased' | 'Third-party';
  driver?: {
    id: string;
    name: string;
    phone: string;
    rating?: number;
  };
  location: string;
  lastTrip?: string;
  totalTrips: number;
  documentsStatus: {
    allValid: boolean;
    expiringSoon: string[]; // e.g., 'Insurance'
    expired: string[];
  };
  maintenance: {
    last: string;
    nextDue: string;
    status: 'Good' | 'Due' | 'Overdue';
  };
  utilizationRate: number;
  fuelType: string;
  mileage: number;
  image?: string;
}

export const VEHICLE_TYPES = [
  { id: 'truck', label: 'Truck', icon: 'Truck' },
  { id: 'trailer', label: 'Trailer', icon: 'Truck' },
  { id: 'container', label: 'Container', icon: 'Box' },
  { id: 'tanker', label: 'Tanker', icon: 'Droplet' },
  { id: 'lcv', label: 'LCV', icon: 'Truck' },
];

export const FUEL_TYPES = ['Diesel', 'Petrol', 'CNG', 'Electric'];
