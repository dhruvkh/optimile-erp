import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Phone, Calendar, ArrowUpRight, Crown, Search } from 'lucide-react';
import { Input } from '../ui/Input';

const CLIENTS = [
  {
    id: '1',
    name: 'Acme Corporation',
    tier: 'Premium',
    activeBookings: 8,
    monthlyRevenue: '₹2.4L',
    outstanding: '₹45,000',
    lastBooking: '2h ago',
    contact: 'John Doe'
  },
  {
    id: '2',
    name: 'TechStart Logistics',
    tier: 'Standard',
    activeBookings: 3,
    monthlyRevenue: '₹1.1L',
    outstanding: '₹0',
    lastBooking: '1d ago',
    contact: 'Sarah Smith'
  },
  {
    id: '3',
    name: 'Global Foods Inc',
    tier: 'Premium',
    activeBookings: 12,
    monthlyRevenue: '₹4.5L',
    outstanding: '₹12,000',
    lastBooking: '4h ago',
    contact: 'Mike Ross'
  },
  {
    id: '4',
    name: 'BuildRight Construction',
    tier: 'Basic',
    activeBookings: 1,
    monthlyRevenue: '₹55k',
    outstanding: '₹0',
    lastBooking: '3d ago',
    contact: 'David Lee'
  },
];

export const ClientPortfolio: React.FC = () => {
  return (
    <Card title="Client Portfolio" className="h-full">
      <div className="mb-4">
         <Input 
            placeholder="Search clients..." 
            icon={<Search className="h-4 w-4 text-gray-400" />}
            className="text-sm"
         />
      </div>
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {CLIENTS.map((client) => (
          <div key={client.id} className="border border-gray-100 rounded-lg p-3 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                 <h4 className="font-bold text-gray-900 text-sm mr-2">{client.name}</h4>
                 {client.tier === 'Premium' && (
                    <span className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded-full flex items-center">
                        <Crown className="h-3 w-3 mr-0.5" /> Premium
                    </span>
                 )}
              </div>
              <Button size="sm" variant="outline" className="h-6 text-xs px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Profile
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
               <div>
                  <span className="block text-gray-400">Revenue (Mo)</span>
                  <span className="font-medium text-gray-900">{client.monthlyRevenue}</span>
               </div>
               <div>
                  <span className="block text-gray-400">Outstanding</span>
                  <span className={`font-medium ${client.outstanding !== '₹0' ? 'text-red-600' : 'text-gray-900'}`}>
                    {client.outstanding}
                  </span>
               </div>
               <div>
                  <span className="block text-gray-400">Active Bookings</span>
                  <span className="font-medium text-gray-900">{client.activeBookings}</span>
               </div>
               <div>
                  <span className="block text-gray-400">Last Activity</span>
                  <span className="font-medium text-gray-900">{client.lastBooking}</span>
               </div>
            </div>

            <div className="flex space-x-2 pt-2 border-t border-gray-50">
               <button className="flex-1 flex items-center justify-center text-xs text-gray-600 hover:text-primary hover:bg-gray-50 py-1.5 rounded transition-colors">
                  <Phone className="h-3 w-3 mr-1" /> Call
               </button>
               <button className="flex-1 flex items-center justify-center text-xs text-primary bg-primary/5 hover:bg-primary/10 py-1.5 rounded transition-colors font-medium">
                  <Calendar className="h-3 w-3 mr-1" /> Book
               </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
          <button className="text-xs text-primary font-medium hover:underline flex items-center justify-center w-full">
            View All Clients <ArrowUpRight className="h-3 w-3 ml-1" />
          </button>
      </div>
    </Card>
  );
};
