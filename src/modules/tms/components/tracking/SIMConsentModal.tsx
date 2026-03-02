
import React, { useState } from 'react';
import { X, Shield, Lock, Smartphone, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface SIMConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: () => void;
  simNumber: string;
}

export const SIMConsentModal: React.FC<SIMConsentModalProps> = ({ isOpen, onClose, onConsent, simNumber }) => {
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          
          {/* Header */}
          <div className="bg-indigo-600 px-4 py-3 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-white flex items-center">
              <Shield className="h-5 w-5 mr-2" /> Location Tracking Consent
            </h3>
            <button onClick={onClose} className="text-indigo-200 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="px-4 py-5 sm:p-6">
            {step === 1 ? (
              <div className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <div className="flex">
                    <Smartphone className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-indigo-800">SIM-Based Tracking Request</h4>
                      <p className="text-xs text-indigo-700 mt-1">
                        Requesting consent for number: <span className="font-mono font-bold">{simNumber}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 space-y-3">
                  <p>
                    To ensure driver safety and provide accurate ETAs when GPS devices fail, we request permission to track the approximate location of this mobile number via the telecom network provider.
                  </p>
                  
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <h5 className="font-bold text-gray-800 mb-2 text-xs uppercase">How it works:</h5>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li>Used <strong>only</strong> when primary GPS/App tracking fails.</li>
                      <li>Accuracy is approximate (100m - 500m).</li>
                      <li>Tracking is active only during assigned trips.</li>
                      <li>Data is encrypted and shared only with Operations.</li>
                    </ul>
                  </div>

                  <div className="flex items-start p-3 bg-yellow-50 border border-yellow-100 rounded">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                    <p className="text-xs text-yellow-800">
                      <strong>Compliance Notice:</strong> This request complies with TRAI regulations and IT Act 2000. You will receive an SMS confirmation from your provider.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">
                      I am the authorized user of this number and I consent to location tracking for logistics purposes. I understand I can revoke this consent at any time.
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Consent Recorded</h3>
                <p className="mt-2 text-sm text-gray-500">
                  A verification SMS has been sent to {simNumber}. <br/>
                  Tracking will be enabled once verified by the network.
                </p>
                <p className="mt-4 text-xs text-gray-400">
                  Reference ID: SIM-AUTH-{Math.floor(Math.random()*10000)}
                </p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {step === 1 ? (
              <>
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!agreed}
                  className="w-full sm:w-auto sm:ml-3 bg-indigo-600 hover:bg-indigo-700"
                >
                  Grant Consent
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  Decline
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => {
                  onConsent();
                  onClose();
                }} 
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
