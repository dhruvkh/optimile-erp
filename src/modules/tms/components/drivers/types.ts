export interface Driver {
  id: string;
  name: string;
  photo?: string;
  phone: string;
  email?: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  employmentType: 'Permanent' | 'Contract' | 'Trip-based';
  currentVehicle?: string;
  currentStatus: 'Available' | 'On Trip' | 'Off Duty' | 'On Leave';
  license: {
    number: string;
    type: string;
    validity: string; // ISO Date
    status: 'Valid' | 'Expiring Soon' | 'Expired';
  };
  rating: number;
  totalTrips: number;
  onTimeDelivery: number; // percentage
  safetyScore: number; // 0-100
  joinDate: string;
  location: string;
}

export const DRIVER_STATUSES = ['Active', 'On Leave', 'Inactive'];
export const EMPLOYMENT_TYPES = ['Permanent', 'Contract', 'Trip-based'];
export const LICENSE_TYPES = ['LMV', 'HMV', 'HGMV', 'HPMV/HTV'];
