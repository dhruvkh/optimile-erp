import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Truck, FileText, IndianRupee, Settings, Camera, Check, ChevronRight, ChevronLeft, Save, Upload, AlertCircle } from 'lucide-react';
import { useToast } from '../../../../../shared/context/ToastContext';

const STEPS = [
  { id: 1, title: 'Basic Info', icon: Truck },
  { id: 2, title: 'Specifications', icon: Settings },
  { id: 3, title: 'Documents', icon: FileText },
  { id: 4, title: 'Financials', icon: IndianRupee },
  { id: 5, title: 'Review', icon: Check },
];

interface AddVehicleWizardProps {
  onClose?: () => void;
}

export const AddVehicleWizard: React.FC<AddVehicleWizardProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    type: 'Truck',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    ownership: 'Own',
    weightCapacity: '',
    fuelType: 'Diesel',
    hasGps: false,
    hasFastag: true,
  });

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = () => {
    // Simulate API submission
    setTimeout(() => {
        showToast({ type: 'success', title: 'Vehicle Added' });
        if (onClose) onClose(); else navigate('/fleet/vehicles');
    }, 1000);
  };

  // --- Step Components (Inline for simplicity given file constraints) ---

  const BasicInfoStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
                label="Registration Number" 
                placeholder="MH-01-AB-1234" 
                value={formData.registrationNumber}
                onChange={(e) => updateForm('registrationNumber', e.target.value.toUpperCase())}
                required
            />
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ownership Type</label>
                <div className="flex space-x-4">
                    {['Own', 'Leased', 'Third-party'].map(type => (
                        <label key={type} className="flex items-center space-x-2 cursor-pointer border p-3 rounded-md flex-1 hover:bg-gray-50 transition-colors">
                            <input 
                                type="radio" 
                                name="ownership" 
                                checked={formData.ownership === type}
                                onChange={() => updateForm('ownership', type)}
                                className="text-primary focus:ring-primary h-4 w-4"
                            />
                            <span className="text-sm font-medium">{type}</span>
                        </label>
                    ))}
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                <select 
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 border"
                    value={formData.type}
                    onChange={(e) => updateForm('type', e.target.value)}
                >
                    <option>Truck</option>
                    <option>Trailer</option>
                    <option>Container</option>
                    <option>Tanker</option>
                    <option>LCV</option>
                </select>
            </div>

            <Input 
                label="Make (Manufacturer)" 
                placeholder="e.g. Tata Motors" 
                value={formData.make}
                onChange={(e) => updateForm('make', e.target.value)}
            />
            <Input 
                label="Model" 
                placeholder="e.g. Prima 2825" 
                value={formData.model}
                onChange={(e) => updateForm('model', e.target.value)}
            />
            <Input 
                label="Year of Manufacture" 
                type="number"
                value={formData.year}
                onChange={(e) => updateForm('year', e.target.value)}
            />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Chassis Number" placeholder="Enter Chassis No." />
            <Input label="Engine Number" placeholder="Enter Engine No." />
        </div>
    </div>
  );

  const SpecsStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <h4 className="font-medium text-gray-900 border-b border-gray-100 pb-2">Capacity & Dimensions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="Gross Vehicle Weight (kg)" type="number" placeholder="e.g. 28000" />
            <Input label="Payload Capacity (kg)" type="number" placeholder="e.g. 20000" />
            <Input label="Volume (Cu. Ft)" type="number" placeholder="e.g. 1200" />
        </div>
        <div className="grid grid-cols-3 gap-4">
            <Input label="Length (ft)" type="number" />
            <Input label="Width (ft)" type="number" />
            <Input label="Height (ft)" type="number" />
        </div>

        <h4 className="font-medium text-gray-900 border-b border-gray-100 pb-2 mt-4">Fuel & Engine</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                <select className="block w-full border-gray-300 rounded-md shadow-sm text-sm py-2 px-3 border">
                    <option>Diesel</option>
                    <option>Petrol</option>
                    <option>CNG</option>
                    <option>Electric</option>
                </select>
            </div>
            <Input label="Fuel Tank Capacity (L)" type="number" />
            <Input label="Avg Mileage (km/l)" type="number" />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Features & Equipment</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['GPS Tracking', 'Fastag', 'Temp Control', 'Hydraulic Lift', 'ABS', 'Sleeper Cabin'].map(feat => (
                    <label key={feat} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" className="rounded text-primary focus:ring-primary h-4 w-4" />
                        <span>{feat}</span>
                    </label>
                ))}
            </div>
        </div>
    </div>
  );

  const DocsStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="bg-blue-50 p-3 rounded-md border border-blue-100 flex items-start mb-4">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
                <p className="font-medium">Document Safety</p>
                <p>Uploaded documents are encrypted. You can set expiry alerts for automatic reminders.</p>
            </div>
        </div>

        {['RC Book', 'Insurance Policy', 'Fitness Certificate', 'PUC Certificate', 'National Permit'].map((doc, idx) => (
            <div key={doc} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-lg mr-3">
                            <FileText className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">{doc}</h4>
                            <p className="text-xs text-gray-500">Required</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm">
                        <Upload className="h-3 w-3 mr-1.5" /> Upload
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Document Number" className="text-xs" />
                    <Input label="Issue Date" type="date" className="text-xs" />
                    <Input label="Expiry Date" type="date" className="text-xs" />
                </div>
            </div>
        ))}
    </div>
  );

  const FinancialsStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Purchase Date" type="date" />
            <Input label="Purchase Cost (₹)" type="number" placeholder="0.00" />
            <Input label="Vendor / Dealer Name" placeholder="ABC Motors" />
            <Input label="Financed By (Bank)" placeholder="HDFC Bank" />
        </div>
        
        <h4 className="font-medium text-gray-900 border-b border-gray-100 pb-2 mt-4">Operational Costs (Estimates)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="Monthly EMI (₹)" type="number" />
            <Input label="Est. Maintenance / Month (₹)" type="number" />
            <Input label="Insurance Premium / Year (₹)" type="number" />
        </div>
    </div>
  );

  const ReviewStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Ready to Add Vehicle</h3>
            <p className="text-sm text-gray-600">Please review the information before submitting.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Summary">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-gray-500">Registration</dt>
                    <dd className="font-medium text-gray-900">{formData.registrationNumber || '-'}</dd>
                    <dt className="text-gray-500">Type</dt>
                    <dd className="font-medium text-gray-900">{formData.type}</dd>
                    <dt className="text-gray-500">Make/Model</dt>
                    <dd className="font-medium text-gray-900">{formData.make} {formData.model}</dd>
                    <dt className="text-gray-500">Ownership</dt>
                    <dd className="font-medium text-gray-900">{formData.ownership}</dd>
                </dl>
            </Card>
            <Card title="Photo Upload">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50">
                    <Camera className="h-8 w-8 mb-2" />
                    <span className="text-xs">Add Vehicle Photo</span>
                </div>
            </Card>
        </div>
        
        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <input type="checkbox" className="mt-1 h-4 w-4 text-primary rounded" />
            <p className="text-sm text-gray-600">
                I confirm that all uploaded documents are authentic and valid. The vehicle meets all safety and compliance standards required for operation.
            </p>
        </div>
    </div>
  );

  const renderStep = () => {
    switch(currentStep) {
        case 1: return <BasicInfoStep />;
        case 2: return <SpecsStep />;
        case 3: return <DocsStep />;
        case 4: return <FinancialsStep />;
        case 5: return <ReviewStep />;
        default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
          <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Vehicle</h1>
              <p className="text-sm text-gray-500">Onboard a new asset to your fleet</p>
          </div>
          <Button variant="outline" onClick={() => onClose ? onClose() : navigate('/fleet/vehicles')}>Cancel</Button>
      </div>

      {/* Stepper */}
      <div className="mb-8">
          <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
              {STEPS.map((step) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  const Icon = step.icon;
                  return (
                      <div key={step.id} className="flex flex-col items-center bg-background px-2 sm:px-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                              isActive ? 'border-primary bg-primary text-white scale-110 shadow-lg' : 
                              isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                              'border-gray-300 bg-white text-gray-400'
                          }`}>
                              {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                          </div>
                          <span className={`text-[10px] mt-2 font-medium uppercase ${isActive ? 'text-primary' : 'text-gray-500'}`}>{step.title}</span>
                      </div>
                  );
              })}
          </div>
      </div>

      {/* Form Content */}
      <Card className="min-h-[400px] flex flex-col justify-between">
          <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">{STEPS[currentStep - 1].title}</h2>
              {renderStep()}
          </div>

          <div className="flex justify-between border-t border-gray-100 pt-6">
              {currentStep > 1 ? (
                  <Button variant="outline" onClick={prevStep}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
              ) : <div></div>}

              <div className="flex space-x-3">
                  <Button variant="outline" className="text-gray-500">
                      <Save className="h-4 w-4 mr-2" /> Save Draft
                  </Button>
                  {currentStep < 5 ? (
                      <Button onClick={nextStep}>
                          Next Step <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                  ) : (
                      <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                          Add Vehicle
                      </Button>
                  )}
              </div>
          </div>
      </Card>
    </div>
  );
};
