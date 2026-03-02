import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Phone, Clock, MapPin, Package, AlertCircle, CheckCircle, Truck, ArrowRight } from 'lucide-react';

interface Vehicle {
  id: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  expectedArrival: string;
  actualArrival: string | null;
  client: string;
  destination: string;
  cargoType: string;
  status: 'Expected' | 'Arrived' | 'Checking-In' | 'Checked-In';
  priority: 'high' | 'normal';
}

const ARRIVALS: Vehicle[] = [
  {
    id: '1',
    vehicleNumber: 'MH-01-1234',
    driverName: 'Ramesh Sharma',
    driverPhone: '+91-98765-43210',
    expectedArrival: '10:30 AM',
    actualArrival: null,
    client: 'Acme Corp',
    destination: 'Delhi',
    cargoType: 'Electronics',
    status: 'Expected',
    priority: 'high'
  },
  {
    id: '2',
    vehicleNumber: 'DL-02-5678',
    driverName: 'Vijay Kumar',
    driverPhone: '+91-98765-43211',
    expectedArrival: '11:00 AM',
    actualArrival: '10:45 AM',
    client: 'TechStart Ltd',
    destination: 'Bangalore',
    cargoType: 'Machinery',
    status: 'Arrived',
    priority: 'normal'
  },
  {
    id: '3',
    vehicleNumber: 'KA-05-9988',
    driverName: 'Suresh R.',
    driverPhone: '+91-98765-43212',
    expectedArrival: '11:15 AM',
    actualArrival: '11:10 AM',
    client: 'Global Foods',
    destination: 'Pune',
    cargoType: 'Perishables',
    status: 'Checked-In',
    priority: 'high'
  }
];

interface ArrivalQueueProps {
  onCheckIn: (vehicleId: string) => void;
}

export const ArrivalQueue: React.FC<ArrivalQueueProps> = ({ onCheckIn }) => {
  const getStatusBadge = (status: Vehicle['status']) => {
    switch (status) {
      case 'Expected': return 'bg-blue-100 text-blue-800';
      case 'Arrived': return 'bg-yellow-100 text-yellow-800 animate-pulse';
      case 'Checking-In': return 'bg-purple-100 text-purple-800';
      case 'Checked-In': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderAction = (vehicle: Vehicle) => {
    if (vehicle.status === 'Expected') {
        return <Button size="sm" variant="outline" className="w-full">Mark Arrived</Button>;
    }
    if (vehicle.status === 'Arrived') {
        return <Button size="sm" onClick={() => onCheckIn(vehicle.id)} className="w-full bg-green-600 hover:bg-green-700">Start Check-in</Button>;
    }
    if (vehicle.status === 'Checked-In') {
        return <Button size="sm" variant="outline" className="w-full">Assign Bay</Button>;
    }
    return <Button size="sm" variant="secondary" className="w-full">Continue</Button>;
  };

  return (
    <Card title="Vehicle Arrival Queue" className="h-full">
      <div className="space-y-4">
        {ARRIVALS.map((vehicle) => (
          <div key={vehicle.id} className="border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow bg-white relative overflow-hidden">
             {/* Priority Indicator */}
             {vehicle.priority === 'high' && (
                 <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-bl-full"></div>
             )}
             
             <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                        <Truck className="h-6 w-6 text-gray-700" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-gray-900">{vehicle.vehicleNumber}</h4>
                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                            <span className="font-medium mr-2">{vehicle.driverName}</span>
                            <button className="text-primary hover:text-secondary p-1 rounded-full bg-blue-50">
                                <Phone className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadge(vehicle.status)}`}>
                    {vehicle.status}
                </span>
             </div>

             <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded-lg">
                <div className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                    <span className="text-xs">
                        {vehicle.actualArrival ? (
                            <span className="text-green-600 font-bold">{vehicle.actualArrival}</span>
                        ) : (
                            <span>Exp: {vehicle.expectedArrival}</span>
                        )}
                    </span>
                </div>
                <div className="flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                    <span className="text-xs truncate">{vehicle.destination}</span>
                </div>
                <div className="col-span-2 flex items-center">
                    <Package className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                    <span className="text-xs font-medium truncate">{vehicle.client} • {vehicle.cargoType}</span>
                </div>
             </div>

             <div className="flex gap-2">
                 {renderAction(vehicle)}
             </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
