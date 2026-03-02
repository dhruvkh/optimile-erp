import { LucideIcon } from 'lucide-react';

export type Role = 'CEO' | 'Admin' | 'Operations Head' | 'Regional Manager' | 'Supervisor' | 'Driver';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  region?: string;
  permissions: string[];
  avatarUrl?: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  requiredPermissions?: string[];
}

export interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  color?: string;
}

export interface Booking {
  id: string;
  customer: string;
  origin: string;
  destination: string;
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Cancelled';
  date: string;
  amount: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  status: 'Available' | 'In Transit' | 'Maintenance';
  driver?: string;
  fuelLevel: number;
}
