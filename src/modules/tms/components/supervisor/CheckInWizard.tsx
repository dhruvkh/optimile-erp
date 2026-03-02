import React, { useState } from 'react';
import { X, Camera, Check, ChevronRight, ChevronLeft, Upload, User, Truck, FileText, Package } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CheckInWizardProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId?: string;
}

const STEPS = [
  { id: 1, label: 'Driver', icon: User },
  { id: 2, label: 'Vehicle', icon: Truck },
  { id: 3, label: 'Docs', icon: FileText },
  { id: 4, label: 'Cargo', icon: Package },
  { id: 5, label: 'Done', icon: Check },
];

export const CheckInWizard: React.FC<CheckInWizardProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);

  if (!isOpen) return null;

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true"></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
          
          {/* Header */}
          <div className="bg-primary px-4 py-3 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
              Vehicle Check-In
            </h3>
            <button onClick={onClose} className="bg-primary rounded-md text-blue-200 hover:text-white focus:outline-none">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Steps Indicator */}
          <div className="bg-gray-50 px-4 py-4 border-b border-gray-200">
             <div className="flex items-center justify-between px-2">
                {STEPS.map((step, index) => (
                    <div key={step.id} className="flex flex-col items-center relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-200 ${
                            currentStep >= step.id ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-400'
                        }`}>
                            <step.icon className="h-4 w-4" />
                        </div>
                        <span className={`text-[10px] mt-1 font-medium ${currentStep >= step.id ? 'text-primary' : 'text-gray-400'}`}>
                            {step.label}
                        </span>
                        {/* Connector Line */}
                        {index < STEPS.length - 1 && (
                            <div className={`absolute top-4 left-1/2 w-full h-0.5 -z-10 ${
                                currentStep > step.id ? 'bg-primary' : 'bg-gray-200'
                            }`} style={{ width: 'calc(100% + 2rem)' }}></div>
                        )}
                    </div>
                ))}
             </div>
          </div>

          {/* Body */}
          <div className="px-4 py-5 sm:p-6 min-h-[300px]">
            {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Driver Verification</h4>
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="h-24 w-24 bg-gray-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
                            <Camera className="h-8 w-8 text-gray-400" />
                            <span className="text-xs text-gray-500 mt-1">Take Photo</span>
                        </div>
                        <div className="flex-1 space-y-3">
                            <Input label="License Number" placeholder="DL-1234567890123" />
                            <Input label="Contact Number" placeholder="+91 98765 43210" />
                        </div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100">
                         <p className="text-sm text-yellow-800 flex items-center">
                             <span className="font-bold mr-1">Alert:</span> License expires in 45 days.
                         </p>
                    </div>
                </div>
            )}

            {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Vehicle Inspection</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Odometer Reading" placeholder="124,500" />
                        <Input label="Fuel Level (%)" placeholder="75" />
                    </div>
                    <div className="space-y-2 mt-4">
                        <p className="text-sm font-medium text-gray-700">Physical Condition Checks:</p>
                        <div className="grid grid-cols-2 gap-2">
                            <label className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" className="h-4 w-4 text-primary rounded" defaultChecked />
                                <span className="text-sm">Tyres OK</span>
                            </label>
                            <label className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" className="h-4 w-4 text-primary rounded" defaultChecked />
                                <span className="text-sm">Lights Working</span>
                            </label>
                            <label className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" className="h-4 w-4 text-primary rounded" defaultChecked />
                                <span className="text-sm">No Damage</span>
                            </label>
                             <label className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" className="h-4 w-4 text-primary rounded" defaultChecked />
                                <span className="text-sm">Clean</span>
                            </label>
                        </div>
                    </div>
                </div>
            )}

             {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Documentation</h4>
                    <div className="space-y-3">
                        {['Consignment Note', 'Invoice', 'E-Way Bill', 'Insurance'].map((doc) => (
                            <div key={doc} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center">
                                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                                    <span className="text-sm font-medium text-gray-700">{doc}</span>
                                </div>
                                <Button size="sm" variant="outline" className="flex items-center">
                                    <Upload className="h-3 w-3 mr-1.5" /> Upload
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {currentStep === 4 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Cargo Verification</h4>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-gray-500">Expected Type:</span> <span className="font-medium block">Electronics</span></div>
                            <div><span className="text-gray-500">Booked Weight:</span> <span className="font-medium block">15 Tons</span></div>
                        </div>
                    </div>
                    <Input label="Actual Weight (Tons)" placeholder="15.2" />
                    <Input label="Seal Number" placeholder="SEAL-998877" />
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cargo Photos</label>
                        <div className="flex space-x-2">
                            <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50">
                                <Camera className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {currentStep === 5 && (
                 <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                        <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Check-in Complete</h3>
                    <p className="text-sm text-gray-500 mt-2">The vehicle is now ready for loading bay assignment.</p>
                </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between">
            {currentStep > 1 && currentStep < 5 ? (
                <Button variant="outline" onClick={prevStep}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
            ) : <div></div>}
            
            {currentStep < 5 ? (
                <Button onClick={nextStep}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            ) : (
                <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                    Finish
                </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
