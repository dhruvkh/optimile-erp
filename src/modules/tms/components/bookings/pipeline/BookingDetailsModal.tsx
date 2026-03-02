import React from 'react';
import { X, MapPin, Truck, Calendar, IndianRupee } from 'lucide-react';
import { BookingPipelineItem } from './BookingCard';

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingPipelineItem | null;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ isOpen, onClose, booking }) => {
  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Booking Details</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Booking ID</span>
            <span className="text-sm font-bold text-gray-900">{booking.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Client</span>
            <span className="text-sm font-semibold text-gray-900">{booking.clientName}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-700">{booking.origin}</span>
            <span className="text-gray-400">→</span>
            <span className="text-sm text-gray-700">{booking.destination}</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-700">{booking.vehicleType}</span>
            <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">{booking.bookingType}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-700">Pickup: {booking.pickupDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-sm font-semibold text-gray-900">
              {booking.value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Status</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">{booking.status}</span>
          </div>
          {booking.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {booking.tags.map(tag => (
                <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
