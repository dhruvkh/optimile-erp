import React from 'react';
import { BookingCard, BookingPipelineItem } from './BookingCard';
import { MoreHorizontal, Plus } from 'lucide-react';

interface PipelineColumnProps {
  id: string;
  title: string;
  color: string; // Tailwind color class prefix e.g. 'gray', 'yellow'
  items: BookingPipelineItem[];
  selectedItems: string[];
  onSelectItem: (id: string, multi: boolean) => void;
  onDropItem: (id: string) => void;
  onCardClick: (item: BookingPipelineItem) => void;
}

export const PipelineColumn: React.FC<PipelineColumnProps> = ({ 
  id, 
  title, 
  color, 
  items, 
  selectedItems,
  onSelectItem,
  onDropItem,
  onCardClick
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    onDropItem(itemId);
  };

  const totalValue = items.reduce((sum, item) => sum + item.value, 0);

  // Map color prop to tailwind classes dynamically
  const getColorClasses = (c: string) => {
    const map: Record<string, string> = {
      gray: 'bg-gray-50 border-gray-200 text-gray-700',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      teal: 'bg-teal-50 border-teal-200 text-teal-800',
      red: 'bg-red-50 border-red-200 text-red-800',
    };
    return map[c] || map['gray'];
  };

  const headerClass = getColorClasses(color);

  return (
    <div 
      className="flex flex-col min-w-[300px] max-w-[300px] h-full rounded-lg bg-gray-100/50 border border-gray-200"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className={`p-3 rounded-t-lg border-b flex justify-between items-center ${headerClass}`}>
        <div className="flex items-center space-x-2">
           <h3 className="font-bold text-sm">{title}</h3>
           <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-bold">{items.length}</span>
        </div>
        <div className="flex items-center">
           <button className="text-current opacity-60 hover:opacity-100 p-1 rounded">
             <MoreHorizontal className="h-4 w-4" />
           </button>
        </div>
      </div>

      {/* Scrollable Card Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {items.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg m-2">
             <p>No bookings</p>
          </div>
        ) : (
          items.map((item) => (
            <BookingCard 
              key={item.id} 
              item={item} 
              isSelected={selectedItems.includes(item.id)}
              onSelect={onSelectItem}
              onDragStart={(e, id) => e.dataTransfer.setData('text/plain', id)}
              onClick={() => onCardClick(item)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-between items-center">
         <span className="text-xs text-gray-500 font-medium">Total Value</span>
         <span className="text-xs font-bold text-gray-900">₹ {(totalValue / 100000).toFixed(1)}L</span>
      </div>
    </div>
  );
};
