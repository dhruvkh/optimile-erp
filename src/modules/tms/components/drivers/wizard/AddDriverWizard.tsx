import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { User, FileText, Briefcase, Truck, ShieldCheck, Check, ChevronRight, ChevronLeft, Save, Upload, Camera, AlertCircle } from 'lucide-react';
import { useToast } from '../../../../../shared/context/ToastContext';

const STEPS = [
  { id: 1, title: 'Personal', icon: User },
  { id: 2, title: 'License', icon: FileText },
  { id: 3, title: 'Docs', icon: ShieldCheck },
  { id: 4, title: 'Employment', icon: Briefcase },
  { id: 5, title: 'Assignment', icon: Truck },
  { id: 6, title: 'Review', icon: Check },
];

interface AddDriverWizardProps {
  onClose?: () => void;
}

export const AddDriverWizard: React.FC<AddDriverWizardProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dob: '',
    licenseNumber: '',
    licenseExpiry: '',
    aadhaarNumber: '',
    employmentType: 'Permanent',
    homeBase: 'Mumbai',
  });

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = () => {
    setTimeout(() => {
        showToast({ type: 'success', title: 'Driver Onboarded' });
        if (onClose) onClose(); else navigate('/drivers');
    }, 1000);
  };

  // --- Steps ---

  const PersonalStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center space-x-6 mb-6">
            <div className="h-28 w-28 bg-gray-100 rounded-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50 relative group overflow-hidden">
                <Camera className="h-8 w-8 text-gray-400 mb-1" />
                <span className="text-[10px] text-gray-500">Upload Photo</span>
            </div>
            <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">Profile Photo</h4>
                <p className="text-xs text-gray-500 mt-1">
                    Upload a clear passport-size photo. White background preferred.
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="First Name" value={formData.firstName} onChange={e => updateForm('firstName', e.target.value)} />
            <Input label="Last Name" value={formData.lastName} onChange={e => updateForm('lastName', e.target.value)} />
            <Input label="Date of Birth" type="date" value={formData.dob} onChange={e => updateForm('dob', e.target.value)} />
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <div className="flex space-x-4">
                    {['Male', 'Female', 'Other'].map(g => (
                        <label key={g} className="flex items-center space-x-2 cursor-pointer border px-3 py-2 rounded-md flex-1 hover:bg-gray-50">
                            <input type="radio" name="gender" className="text-primary focus:ring-primary" />
                            <span className="text-sm">{g}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Primary Mobile" type="tel" placeholder="+91" value={formData.phone} onChange={e => updateForm('phone', e.target.value)} />
                <Input label="WhatsApp Number" type="tel" placeholder="Same as primary" />
                <Input label="Email (Optional)" type="email" value={formData.email} onChange={e => updateForm('email', e.target.value)} />
                <Input label="Emergency Contact" placeholder="Name & Phone" />
            </div>
        </div>
        
        <div className="border-t border-gray-100 pt-4">
             <h4 className="text-sm font-medium text-gray-900 mb-4">Address</h4>
             <div className="space-y-4">
                 <Input label="Street Address" placeholder="House No, Street, Locality" />
                 <div className="grid grid-cols-3 gap-4">
                     <Input label="City" />
                     <Input label="State" />
                     <Input label="Pincode" />
                 </div>
             </div>
        </div>
    </div>
  );

  const LicenseStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100 flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
            <p className="text-sm text-yellow-800">Please ensure license details match the uploaded image exactly for automated verification.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="License Number" value={formData.licenseNumber} onChange={e => updateForm('licenseNumber', e.target.value.toUpperCase())} />
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Type</label>
                <select className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 border">
                    <option>LMV (Light Motor Vehicle)</option>
                    <option>HMV (Heavy Motor Vehicle)</option>
                    <option>HGMV (Heavy Goods)</option>
                    <option>Transport Vehicle</option>
                </select>
            </div>
            <Input label="Issue Date" type="date" />
            <Input label="Expiry Date" type="date" value={formData.licenseExpiry} onChange={e => updateForm('licenseExpiry', e.target.value)} />
            <Input label="Issuing Authority" placeholder="e.g. RTO Mumbai West" />
            <Input label="State" placeholder="Maharashtra" />
        </div>

        <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Upload License Images</h4>
            <div className="grid grid-cols-2 gap-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 cursor-pointer">
                    <Camera className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-700">Front Side</span>
                    <span className="text-xs text-gray-500 mt-1">Click to upload</span>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 cursor-pointer">
                    <Camera className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-700">Back Side</span>
                    <span className="text-xs text-gray-500 mt-1">Click to upload</span>
                </div>
            </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Endorsements & Certifications</h4>
            <div className="grid grid-cols-2 gap-3">
                {['Hazmat', 'Tanker', 'Hill Driving', 'Night Driving'].map(cert => (
                    <label key={cert} className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                        <span className="text-sm text-gray-700">{cert}</span>
                    </label>
                ))}
            </div>
        </div>
    </div>
  );

  const DocsStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {[
            { name: 'Aadhaar Card', required: true },
            { name: 'PAN Card', required: true },
            { name: 'Police Verification', required: true },
            { name: 'Medical Certificate', required: true },
            { name: 'Address Proof', required: false }
        ].map((doc, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-lg mr-3">
                            <FileText className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">{doc.name}</h4>
                            {doc.required && <p className="text-[10px] text-red-500 font-medium">Required</p>}
                        </div>
                    </div>
                    <Button variant="outline" size="sm">
                        <Upload className="h-3 w-3 mr-1.5" /> Upload
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Document Number" className="text-xs" value={doc.name === 'Aadhaar Card' ? formData.aadhaarNumber : ''} onChange={e => doc.name === 'Aadhaar Card' && updateForm('aadhaarNumber', e.target.value)} />
                    {doc.name === 'Medical Certificate' && <Input label="Valid Until" type="date" className="text-xs" />}
                </div>
            </div>
        ))}
    </div>
  );

  const EmploymentStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                <select 
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm py-2 px-3 border"
                    value={formData.employmentType}
                    onChange={e => updateForm('employmentType', e.target.value)}
                >
                    <option>Permanent</option>
                    <option>Contractual</option>
                    <option>Trip-Based</option>
                </select>
            </div>
            <Input label="Date of Joining" type="date" />
            <Input label="Reporting Manager" placeholder="Search Manager" />
            <Input label="Department" placeholder="Logistics - West" />
        </div>

        <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Financial Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Bank Account Number" type="password" />
                <Input label="IFSC Code" />
                <Input label="Bank Name" />
                <Input label="Salary / Rate" type="number" placeholder="₹" />
            </div>
        </div>
    </div>
  );

  const AssignmentStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="text-sm font-bold text-blue-900 mb-2">Primary Vehicle Assignment</h4>
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-blue-800 mb-1">Select Vehicle</label>
                    <select className="block w-full border-blue-200 rounded-md text-sm py-2 px-3 border">
                        <option>None (Pool Driver)</option>
                        <option>MH-01-1234 (20T Closed)</option>
                        <option>DL-02-5678 (32T Trailer)</option>
                    </select>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Home Base Location" value={formData.homeBase} onChange={e => updateForm('homeBase', e.target.value)} />
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Routes</label>
                <div className="border border-gray-300 rounded-md p-2 h-24 overflow-y-auto">
                    {['Mumbai - Delhi', 'Mumbai - Pune', 'Bangalore - Chennai', 'Delhi - Jaipur'].map(r => (
                        <label key={r} className="flex items-center space-x-2 mb-1">
                            <input type="checkbox" className="rounded text-primary" />
                            <span className="text-sm text-gray-600">{r}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Availability & Preferences</h4>
            <div className="space-y-3">
                <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <span className="text-sm font-medium text-gray-700">Willing for Long Haul Trips (&gt;3 days)</span>
                    <input type="checkbox" className="rounded text-primary h-5 w-5" defaultChecked />
                </label>
                <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <span className="text-sm font-medium text-gray-700">Willing for Night Driving</span>
                    <input type="checkbox" className="rounded text-primary h-5 w-5" />
                </label>
            </div>
        </div>
    </div>
  );

  const ReviewStep = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Ready to Onboard</h3>
            <p className="text-sm text-gray-600">Please verify all details before submitting.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Personal Info">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Name</span> <span className="font-medium">{formData.firstName} {formData.lastName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Phone</span> <span className="font-medium">{formData.phone}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">DOB</span> <span className="font-medium">{formData.dob}</span></div>
                </div>
            </Card>
            <Card title="License">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Number</span> <span className="font-medium">{formData.licenseNumber}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Expiry</span> <span className="font-medium">{formData.licenseExpiry}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Status</span> <span className="text-green-600 font-bold">Verifying...</span></div>
                </div>
            </Card>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Compliance Checklist</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['Aadhaar Verified', 'PAN Verified', 'Medical Cleared', 'Police Verification Pending'].map((item, i) => (
                    <div key={i} className="flex items-center text-sm">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center mr-2 ${item.includes('Pending') ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                            {item.includes('Pending') ? <div className="w-2 h-2 bg-yellow-500 rounded-full"></div> : <Check className="w-3 h-3" />}
                        </div>
                        <span className={item.includes('Pending') ? 'text-gray-500' : 'text-gray-900'}>{item}</span>
                    </div>
                ))}
            </div>
        </div>

        <label className="flex items-center space-x-2 p-3 bg-gray-50 rounded text-sm text-gray-600">
            <input type="checkbox" className="rounded text-primary" defaultChecked />
            <span>Send welcome email and login credentials to driver</span>
        </label>
    </div>
  );

  const renderStep = () => {
    switch(currentStep) {
        case 1: return <PersonalStep />;
        case 2: return <LicenseStep />;
        case 3: return <DocsStep />;
        case 4: return <EmploymentStep />;
        case 5: return <AssignmentStep />;
        case 6: return <ReviewStep />;
        default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
          <div>
              <h1 className="text-2xl font-bold text-gray-900">Driver Onboarding</h1>
              <p className="text-sm text-gray-500">Add a new driver to your fleet</p>
          </div>
          <Button variant="outline" onClick={() => onClose ? onClose() : navigate('/drivers')}>Cancel</Button>
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
      <Card className="min-h-[450px] flex flex-col justify-between">
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
                  {currentStep < 6 ? (
                      <Button onClick={nextStep}>
                          Next Step <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                  ) : (
                      <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                          Submit Application
                      </Button>
                  )}
              </div>
          </div>
      </Card>
    </div>
  );
};
