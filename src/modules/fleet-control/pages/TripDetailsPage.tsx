import React, { useState, useEffect } from 'react';
import { Trip, TripStatus, Vehicle, Driver } from '../types';
import { TripAPI, VehicleAPI, DriverAPI } from '../services/mockDatabase';
import { Button, Badge } from '../components/UI';
import { IconTruck, IconUsers, IconCalendar, IconMap, IconClock, IconCheck, IconArrowRight, IconX } from '../components/Icons';
import { MapPlaceholder } from '../components/MapPlaceholder';

interface TripDetailsPageProps {
  tripId: string;
  onBack: () => void;
}

export const TripDetailsPage: React.FC<TripDetailsPageProps> = ({ tripId, onBack }) => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadTripDetails();
  }, [tripId]);

  const loadTripDetails = async () => {
    setIsLoading(true);
    try {
      const tripData = await TripAPI.getById(tripId);
      if (tripData) {
        setTrip(tripData);
        if (tripData.vehicle_id) {
          const vData = await VehicleAPI.getById(tripData.vehicle_id);
          setVehicle(vData || null);
        }
        if (tripData.driver_id) {
          const dData = await DriverAPI.getById(tripData.driver_id);
          setDriver(dData || null);
        }
      }
    } catch (error) {
      console.error("Failed to load trip details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: TripStatus) => {
    if (!trip) return;
    setIsUpdating(true);
    try {
      // Validation for Dispatch
      if (newStatus === TripStatus.DISPATCHED && (!trip.vehicle_id || !trip.driver_id)) {
        alert("Cannot dispatch trip without assigning a vehicle and driver.");
        setIsUpdating(false);
        return;
      }

      await TripAPI.update(trip.trip_id, { status: newStatus });
      await loadTripDetails();
    } catch (error) {
      alert("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading trip details...</div>;
  if (!trip) return <div className="p-8 text-center text-red-500">Trip not found</div>;

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case TripStatus.PLANNED: return 'blue';
      case TripStatus.DISPATCHED: return 'yellow';
      case TripStatus.IN_TRANSIT: return 'green';
      case TripStatus.COMPLETED: return 'gray';
      default: return 'gray';
    }
  };

  const steps = [TripStatus.PLANNED, TripStatus.DISPATCHED, TripStatus.IN_TRANSIT, TripStatus.COMPLETED];
  const currentStepIndex = steps.indexOf(trip.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
            <IconArrowRight className="w-6 h-6 transform rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trip {trip.booking_reference}</h1>
            <p className="text-sm text-gray-500 flex items-center mt-1">
                <IconCalendar className="w-4 h-4 mr-1" />
                {new Date(trip.scheduled_start_time).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge color={getStatusColor(trip.status)}>{trip.status}</Badge>
          
          {trip.status === TripStatus.PLANNED && (
             <Button onClick={() => handleStatusUpdate(TripStatus.DISPATCHED)} isLoading={isUpdating} disabled={!trip.vehicle_id || !trip.driver_id}>
                Dispatch Trip
             </Button>
          )}
          {trip.status === TripStatus.DISPATCHED && (
             <Button onClick={() => handleStatusUpdate(TripStatus.IN_TRANSIT)} isLoading={isUpdating}>
                Start Trip
             </Button>
          )}
          {trip.status === TripStatus.IN_TRANSIT && (
             <Button onClick={() => handleStatusUpdate(TripStatus.COMPLETED)} isLoading={isUpdating} variant="primary">
                Complete Trip
             </Button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="relative flex items-center justify-between w-full">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
            {steps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                    <div key={step} className="flex flex-col items-center bg-white px-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-300 text-gray-300'}`}>
                            {isCompleted ? <IconCheck className="w-5 h-5" /> : <div className="w-2 h-2 bg-gray-300 rounded-full" />}
                        </div>
                        <span className={`mt-2 text-xs font-medium ${isCurrent ? 'text-primary-600' : 'text-gray-500'}`}>{step}</span>
                    </div>
                );
            })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-1 space-y-6">
            {/* Route Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <IconMap className="w-5 h-5 mr-2 text-gray-500" />
                    Route Details
                </h3>
                <div className="relative pl-4 border-l-2 border-gray-200 space-y-6">
                    <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-primary-100 border-2 border-primary-500"></div>
                        <p className="text-xs text-gray-500 uppercase">Origin</p>
                        <p className="text-sm font-medium text-gray-900">{trip.origin}</p>
                    </div>
                    <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-gray-100 border-2 border-gray-500"></div>
                        <p className="text-xs text-gray-500 uppercase">Destination</p>
                        <p className="text-sm font-medium text-gray-900">{trip.destination}</p>
                    </div>
                </div>
            </div>

            {/* Assignment Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <IconTruck className="w-5 h-5 mr-2 text-gray-500" />
                    Assignment
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Vehicle</p>
                        {vehicle ? (
                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <IconTruck className="w-8 h-8 text-primary-500 mr-3" />
                                <div>
                                    <p className="font-medium text-gray-900">{vehicle.registration_number}</p>
                                    <p className="text-xs text-gray-500">{vehicle.vehicle_type}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">No vehicle assigned</div>
                        )}
                    </div>
                    
                    <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Driver</p>
                        {driver ? (
                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <IconUsers className="w-8 h-8 text-primary-500 mr-3" />
                                <div>
                                    <p className="font-medium text-gray-900">{driver.name}</p>
                                    <p className="text-xs text-gray-500">{driver.phone}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">No driver assigned</div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Map */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full min-h-[400px]">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-medium text-gray-900">Live Map Tracking</h3>
                    <span className="flex items-center text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
                        Live
                    </span>
                </div>
                <MapPlaceholder origin={trip.origin} destination={trip.destination} className="h-full border-none" />
            </div>
        </div>
      </div>
    </div>
  );
};