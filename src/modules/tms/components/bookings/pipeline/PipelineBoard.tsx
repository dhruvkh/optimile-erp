import React, { useState, useEffect } from 'react';
import { BookingPipelineItem } from './BookingCard';
import { PipelineColumn } from './PipelineColumn';
import { PipelineFilters } from './PipelineFilters';
import { BookingDetailsModal } from './BookingDetailsModal';
import { Button } from '../../ui/Button';
import { RefreshCw, Download, Layers } from 'lucide-react';

interface PipelineBoardProps {
  mode: 'FTL' | 'LTL';
}

// --- MOCK DATA GENERATOR ---
// Removed in favor of real context data

const COLUMNS = [
  { id: 'Draft', title: 'Draft', color: 'gray' },
  { id: 'Pending Verification', title: 'Pending Verification', color: 'yellow' },
  { id: 'Approved', title: 'Approved', color: 'green' },
  { id: 'Vehicle Assigned', title: 'Vehicle Assigned', color: 'blue' },
  { id: 'In-Transit', title: 'In-Transit', color: 'purple' },
  { id: 'Completed', title: 'Completed', color: 'teal' },
  { id: 'Cancelled', title: 'Cancelled', color: 'red' },
];

import { useOperationalData } from '../../../../../shared/context/OperationalDataContext';

export const PipelineBoard: React.FC<PipelineBoardProps> = ({ mode }) => {
  const { completedTrips } = useOperationalData();
  const [items, setItems] = useState<BookingPipelineItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filters, setFilters] = useState({ search: '', clients: [], priority: [] as string[] });
  const [modalItem, setModalItem] = useState<BookingPipelineItem | null>(null);

  useEffect(() => {
    const mapStatus = (status: string) => {
      switch (status) {
        case 'booked': return 'Approved';
        case 'in_transit': return 'In-Transit';
        case 'delivered':
        case 'pod_received':
        case 'invoiced': return 'Completed';
        case 'cancelled': return 'Cancelled';
        default: return 'Draft';
      }
    };

    const pipelineItems: BookingPipelineItem[] = completedTrips.map(trip => ({
      id: trip.id,
      clientName: trip.clientName,
      isPremium: false,
      origin: trip.origin,
      destination: trip.destination,
      value: trip.revenueAmount,
      vehicleType: trip.vehicleRegNumber !== 'Unassigned' ? trip.vehicleRegNumber : 'Unassigned',
      bookingType: trip.bookingMode === 'PARTIAL' || trip.bookingMode === 'LTL' ? 'LTL' : 'FTL',
      pickupDate: trip.bookedDate,
      status: mapStatus(trip.status),
      priority: 'Normal',
      createdAt: trip.bookedDate,
      tags: [trip.tripType.replace('_', ' ').toUpperCase()],
    }));
    setItems(pipelineItems);
  }, [completedTrips]);

  const handleSelectItem = (id: string, multi: boolean) => {
    if (multi) {
      setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setSelectedItems([id]);
    }
  };

  const handleDropItem = (itemId: string, newStatus: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        // Here you would typically add validation (e.g. can't move Draft -> In-Transit)
        return { ...item, status: newStatus };
      }
      return item;
    }));
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  // Filter Logic
  const filteredItems = items.filter(item => {
    // 1. Filter by Mode (FTL / LTL)
    if (item.bookingType !== mode) return false;

    // 2. Filter by Search
    const matchesSearch = !filters.search ||
      item.id.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.clientName.toLowerCase().includes(filters.search.toLowerCase());

    // 3. Filter by Priority
    const matchesPriority = filters.priority.length === 0 || filters.priority.includes(item.priority);

    return matchesSearch && matchesPriority;
  });

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">

      {/* Filters Bar */}
      <PipelineFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        activeCount={filteredItems.length}
      />

      {/* Bulk Actions Bar (Conditional) */}
      {selectedItems.length > 0 && (
        <div className="bg-primary text-white px-4 py-2 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
          <span className="text-sm font-medium">{selectedItems.length} items selected</span>
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors" onClick={() => window.alert(`${selectedItems.length} booking(s) approved successfully.`)}>Approve Selected</button>
            <button className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors" onClick={() => window.alert('Bulk priority change coming in the next release.')}>Change Priority</button>
            <button className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors" onClick={() => setSelectedItems([])}>Cancel</button>
          </div>
        </div>
      )}

      {/* Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 bg-slate-50">
        <div className="flex space-x-4 h-full min-w-max">
          {COLUMNS.map(col => (
            <PipelineColumn
              key={col.id}
              id={col.id}
              title={col.title}
              color={col.color}
              items={filteredItems.filter(i => i.status === col.id)}
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onDropItem={(itemId) => handleDropItem(itemId, col.id)}
              onCardClick={(item) => setModalItem(item)}
            />
          ))}
        </div>
      </div>

      {/* Details Modal */}
      <BookingDetailsModal
        isOpen={!!modalItem}
        onClose={() => setModalItem(null)}
        booking={modalItem}
      />
    </div>
  );
};