
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { useToast } from '../../../../shared/context/ToastContext';
import { BasicDetailsStep } from './steps/BasicDetailsStep';
import { CargoRouteStep } from './steps/CargoRouteStep';
import { RateVehicleStep } from './steps/RateVehicleStep';
import { ReviewSubmitStep } from './steps/ReviewSubmitStep';
import { ConsolidationStep } from './steps/ConsolidationStep';
import { Button } from '../ui/Button';
import { Check, ChevronRight, ChevronLeft, Save, Truck, Layers } from 'lucide-react';
import { Card } from '../ui/Card';
import { useOperationalData } from '../../../../shared/context/OperationalDataContext';

export const NewBookingWizard: React.FC = () => {
    const { currentStep, setStep, data, resetBooking } = useBooking();
    const { createTrip } = useOperationalData();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isLTL = data.bookingType === 'PTL';

    // Dynamic Steps Definition
    const steps = [
        { id: 1, title: 'Basic Details' },
        { id: 2, title: 'Route & Cargo' },
        ...(isLTL ? [{ id: 3, title: 'Consolidation' }] : []),
        { id: isLTL ? 4 : 3, title: 'Rate & Vehicle' },
        { id: isLTL ? 5 : 4, title: 'Review' },
    ];

    const totalSteps = steps.length;

    const nextStep = () => setStep(Math.min(currentStep + 1, totalSteps));
    const prevStep = () => setStep(Math.max(currentStep - 1, 1));

    const handleSaveDraft = () => {
        // Simulate API call
        const bookingId = `BK-DRAFT-${Math.floor(Math.random() * 1000)}`;
        showToast({
            type: 'success',
            title: 'Draft Saved',
            message: `Booking ${bookingId} saved as Draft. You can resume it later from the Pipeline.`
        });
    };

    const handleSubmit = () => {
        setIsSubmitting(true);

        const tripData = {
            bookingRef: data.customerReference || `REF-${Math.floor(Math.random() * 10000)}`,
            clientId: data.clientId || 'CLI-001',
            clientName: data.clientName || 'New Client',
            origin: data.originAddress || 'Origin',
            destination: data.destinationAddress || 'Destination',
            distanceKm: data.distanceKm > 0 ? data.distanceKm : 500,
            tripType: data.tripType,
            bookingMode: data.bookingType === 'FTL' ? 'FTL' as const : 'PARTIAL' as const,
            revenueAmount: data.baseRate + data.loadingCharges + data.unloadingCharges + data.tollCharges + data.otherCharges,
            // Vehicle — only populated when an own-fleet vehicle was selected
            vehicleId: data.selectedVehicleId || '',
            // Vendor — only populated for contracted/market-hire
            vendorId: data.marketHireVendorId,
            vendorName: data.marketHireVendorName,
        };

        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            createTrip(tripData);
            resetBooking();
            navigate('/tms/operations');
        }, 1500);
    };

    const renderStepContent = () => {
        // Map current step number to the correct component based on dynamic steps array
        const currentStepObj = steps.find(s => s.id === currentStep);

        if (!currentStepObj) return null;

        switch (currentStepObj.title) {
            case 'Basic Details': return <BasicDetailsStep />;
            case 'Route & Cargo': return <CargoRouteStep />;
            case 'Consolidation': return <ConsolidationStep />;
            case 'Rate & Vehicle': return <RateVehicleStep />;
            case 'Review': return <ReviewSubmitStep />;
            default: return null;
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-12">
            {/* Stepper Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                    {steps.map((step) => {
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;

                        return (
                            <div key={step.id} className="flex flex-col items-center bg-white px-4">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold transition-all duration-300 ${isActive ? 'border-primary bg-primary text-white shadow-lg scale-110' :
                                        isCompleted ? 'border-green-500 bg-green-500 text-white' :
                                            'border-gray-300 text-gray-400 bg-white'
                                        }`}
                                >
                                    {isCompleted ? <Check className="h-6 w-6" /> : step.id}
                                </div>
                                <span className={`mt-2 text-xs font-medium uppercase ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Card */}
            <Card className="min-h-[500px] flex flex-col justify-between transition-all duration-500 ease-in-out">
                <div className="mb-8">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            {steps.find(s => s.id === currentStep)?.title}
                        </h2>
                        {/* Step Context Indicators */}
                        {currentStep > 1 && (
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                {data.bookingType === 'FTL' ? <Truck className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
                                <span className="font-medium">{data.bookingType}</span>
                                <span className="mx-1">•</span>
                                <span>{data.clientName || 'New Client'}</span>
                            </div>
                        )}
                    </div>

                    {renderStepContent()}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                    <div className="flex items-center">
                        <Button variant="outline" className="mr-4 text-gray-500" onClick={handleSaveDraft}>
                            <Save className="h-4 w-4 mr-2" /> Save Draft
                        </Button>
                    </div>

                    <div className="flex space-x-3">
                        {currentStep > 1 && (
                            <Button variant="outline" onClick={prevStep}>
                                <ChevronLeft className="h-4 w-4 mr-1" /> Back
                            </Button>
                        )}

                        {currentStep < totalSteps ? (
                            // Only show Next button if NOT on Consolidation step (it handles its own navigation)
                            steps.find(s => s.id === currentStep)?.title !== 'Consolidation' && (
                                <Button onClick={nextStep} className="px-6">
                                    Next Step <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            )
                        ) : (
                            <Button onClick={handleSubmit} isLoading={isSubmitting} className="bg-green-600 hover:bg-green-700 px-8">
                                Confirm & Submit
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};
