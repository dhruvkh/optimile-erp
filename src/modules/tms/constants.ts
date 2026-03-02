
import {
  LayoutDashboard,
  Package,
  Settings,
  Truck,
  Users,
  FileText,
  Activity,
  ShieldCheck,
  MapPin,
  Calculator,
  TowerControl
} from 'lucide-react';
import { NavItem, User } from './types';

export const APP_NAME = 'Optimile';

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/tms/dashboard',
    icon: LayoutDashboard
  },
  {
    label: 'Control Tower',
    path: '/tms/control-tower',
    icon: Activity, // Using Activity as a placeholder for TowerControl if not available, or import specific icon
    requiredPermissions: ['operations', 'regional-operations']
  },
  {
    label: 'Bookings',
    path: '/tms/bookings',
    icon: Package,
    requiredPermissions: ['bookings']
  },
  {
    label: 'HO Approvals',
    path: '/tms/approvals',
    icon: ShieldCheck,
    requiredPermissions: ['approvals']
  },
  {
    label: 'Operations',
    path: '/tms/operations',
    icon: MapPin,
    requiredPermissions: ['operations', 'regional-operations', 'loading-bay', 'vehicle-checkin']
  },
  {
    label: 'PTL Booking',
    path: '/tms/ptl/booking',
    icon: Package,
    requiredPermissions: ['bookings', 'operations']
  },
  {
    label: 'PTL Operations',
    path: '/tms/operations/ptl-consolidation',
    icon: Activity,
    requiredPermissions: ['operations', 'regional-operations']
  },
  {
    label: 'Live Tracking',
    path: '/tms/tracking',
    icon: MapPin,
    requiredPermissions: ['operations', 'regional-operations']
  },
  {
    label: 'Rate Calculator',
    path: '/tms/finance/calculator',
    icon: Calculator,
    requiredPermissions: ['operations', 'regional-operations']
  },
  {
    label: 'Fleet',
    path: '/tms/fleet',
    icon: Truck,
    requiredPermissions: ['vehicles', 'vehicle-checkin']
  },
  {
    label: 'Drivers',
    path: '/tms/drivers',
    icon: Users,
    requiredPermissions: ['drivers']
  },
  {
    label: 'Reports',
    path: '/tms/reports',
    icon: FileText,
    requiredPermissions: ['reports', 'regional-reports']
  },
  {
    label: 'Settings',
    path: '/tms/settings',
    icon: Settings,
    requiredPermissions: ['system-config'] // Admin only
  },
];

export const MOCK_USERS: (User & { password: string })[] = [
  {
    id: '1',
    email: 'ceo@company.com',
    password: 'password123',
    name: 'John Doe',
    role: 'CEO',
    permissions: ['all'],
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '2',
    email: 'admin@company.com',
    password: 'password123',
    name: 'Admin User',
    role: 'Admin',
    permissions: ['all'],
    avatarUrl: 'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '3',
    email: 'ops@company.com',
    password: 'password123',
    name: 'Sarah Smith',
    role: 'Operations Head',
    permissions: ['operations', 'approvals', 'bookings', 'vehicles', 'drivers', 'reports'],
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '4',
    email: 'regional@company.com',
    password: 'password123',
    name: 'Mike Johnson',
    role: 'Regional Manager',
    region: 'North',
    permissions: ['bookings', 'regional-operations', 'regional-reports'],
    avatarUrl: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '5',
    email: 'supervisor@company.com',
    password: 'password123',
    name: 'David Lee',
    role: 'Supervisor',
    permissions: ['loading-bay', 'vehicle-checkin'],
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  }
];
