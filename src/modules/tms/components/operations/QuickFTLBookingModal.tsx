import React, { useState } from 'react';
import { X, Truck, MapPin, Package, Calendar, User, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { SHARED_CLIENTS } from '../../../../shared/context/OperationalDataStore';
import { amsContractStore } from '../../../../shared/services/amsContractStore';
import { useToast } from '../../../../shared/context/ToastContext';

interface QuickFTLBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (booking: any) => void;
}

/**
 * Quick FTL Booking Modal
 *
 * Streamlined booking interface for operations team to quickly create FTL trips
 * without navigating away from the Operations dashboard.
 *
 * Captures only essential information:
 * - Customer
 * - Route (Origin → Destination)
 * - Cargo details
 * - Pickup date/time
 */
export const QuickFTLBookingModal: React.FC<QuickFTLBookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    customerId: '',
    origin: '',
    destination: '',
    cargoType: '',
    weight: '',
    volume: '',
    pickupDate: '',
    pickupTime: '',
    vehicleType: '',
    quotedRate: '',
    notes: ''
  });

  const [amsRate, setAmsRate] = useState<number | null>(null);
  const [hoApprovalNeeded, setHoApprovalNeeded] = useState(false);

  // Validate Rate against AMS Contract When form changes
  React.useEffect(() => {
    if (formData.customerId && formData.origin && formData.destination && formData.vehicleType) {
      const contract = amsContractStore.getContractRate(formData.customerId, formData.origin, formData.destination, formData.vehicleType);
      if (contract) {
        setAmsRate(contract.ratePerTrip);
        const quoted = parseFloat(formData.quotedRate) || 0;
        // Require HO Approval if quoted rate is > 5% above AMS ceiling
        if (quoted > 0 && quoted > contract.ratePerTrip * 1.05) {
          setHoApprovalNeeded(true);
        } else {
          setHoApprovalNeeded(false);
        }
      } else {
        setAmsRate(null);
        setHoApprovalNeeded(false);
      }
    } else {
      setAmsRate(null);
      setHoApprovalNeeded(false);
    }
  }, [formData.customerId, formData.origin, formData.destination, formData.vehicleType, formData.quotedRate]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const bookingId = `BK-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;

    const client = SHARED_CLIENTS.find(c => c.id === formData.customerId);

    if (onSubmit) {
      onSubmit({ ...formData, customerName: client?.name, bookingId, type: 'FTL', hoApprovalStatus: hoApprovalNeeded ? 'Pending' : 'N/A' });
    }

    if (hoApprovalNeeded) {
      showToast({
        type: 'warning',
        title: 'Booking Saved as Draft',
        message: `Rate deviation: +${Math.round(((parseFloat(formData.quotedRate) - amsRate!) / amsRate!) * 100)}% above AMS Contract. Routing to HO Approver for rate clearance.`
      });
    } else {
      showToast({
        type: 'success',
        title: 'FTL Booking Created',
        message: `Booking ${bookingId} for ${client?.name} — ${formData.origin} → ${formData.destination}. Ready for vehicle assignment.`
      });
    }

    // Reset form
    setFormData({
      customerId: '',
      origin: '',
      destination: '',
      cargoType: '',
      weight: '',
      volume: '',
      pickupDate: '',
      pickupTime: '',
      vehicleType: '',
      quotedRate: '',
      notes: ''
    });

    onClose();
  };

  if (!isOpen) return null;

  const isFormValid = formData.customerId && formData.origin && formData.destination &&
    formData.cargoType && formData.weight && formData.pickupDate && formData.vehicleType && formData.quotedRate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Quick FTL Booking</h2>
              <p className="text-xs text-blue-100 font-medium">Fast booking from Operations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Customer Details */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-4 w-4 text-slate-600" />
                <h3 className="font-black text-sm text-slate-900 uppercase">Customer Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Customer *
                  </label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => handleChange('customerId', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select Customer...</option>
                    {SHARED_CLIENTS.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {c.id}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Route Details */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-blue-600" />
                <h3 className="font-black text-sm text-blue-900 uppercase">Route Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-blue-700 mb-2">
                    Origin (Pickup) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.origin}
                    onChange={(e) => handleChange('origin', e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Mumbai"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-700 mb-2">
                    Destination (Drop) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => handleChange('destination', e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Delhi"
                  />
                </div>

                {/* Embedded Vehicle & Rate details for immediate AMS Lookup */}
                <div>
                  <label className="block text-xs font-bold text-blue-700 mb-2">
                    Vehicle Type *
                  </label>
                  <select
                    required
                    value={formData.vehicleType}
                    onChange={(e) => handleChange('vehicleType', e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="Truck 6x4">Truck 6x4</option>
                    <option value="Truck 4x2">Truck 4x2</option>
                    <option value="Container 6x4">Container 6x4</option>
                    <option value="LCV">LCV</option>
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-blue-700 mb-2">
                    Quoted Rate (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.quotedRate}
                    onChange={(e) => handleChange('quotedRate', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${hoApprovalNeeded ? 'border-red-500 focus:ring-red-500' : 'border-blue-300 focus:ring-blue-500'
                      }`}
                    placeholder="45000"
                  />
                </div>
              </div>

              {/* AMS Validation Banner */}
              {formData.customerId && formData.origin && formData.destination && formData.vehicleType && (
                <div className={`mt-4 p-3 rounded rounded-lg border text-sm flex justify-between items-center ${amsRate ? (hoApprovalNeeded ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800') : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                  <div>
                    <strong className="block mb-1">AMS Contract Status</strong>
                    {amsRate ? `Contract Found: ₹${amsRate.toLocaleString()}/trip` : 'No AMS Contract Found for Lane/Vehicle'}
                  </div>
                  {hoApprovalNeeded && (
                    <div className="text-right text-xs font-bold">
                      ⚠️ RATE DEVIATION<br />
                      HO Approval Required
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cargo Details */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-4 w-4 text-orange-600" />
                <h3 className="font-black text-sm text-orange-900 uppercase">Cargo Details</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-orange-700 mb-2">
                    Cargo Type *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cargoType}
                    onChange={(e) => handleChange('cargoType', e.target.value)}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Electronics, FMCG, Auto Parts"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-orange-700 mb-2">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.weight}
                    onChange={(e) => handleChange('weight', e.target.value)}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-orange-700 mb-2">
                    Volume (m³)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.volume}
                    onChange={(e) => handleChange('volume', e.target.value)}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="15.5"
                  />
                </div>
              </div>
            </div>

            {/* Pickup Schedule */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-green-600" />
                <h3 className="font-black text-sm text-green-900 uppercase">Pickup Schedule</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-green-700 mb-2">
                    Pickup Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.pickupDate}
                    onChange={(e) => handleChange('pickupDate', e.target.value)}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-green-700 mb-2">
                    Pickup Time
                  </label>
                  <input
                    type="time"
                    value={formData.pickupTime}
                    onChange={(e) => handleChange('pickupTime', e.target.value)}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special instructions, handling requirements, etc."
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <p className="text-xs text-slate-500">
            * Required fields
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`${hoApprovalNeeded ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'} text-white font-black uppercase tracking-wider flex items-center gap-2`}
            >
              <CheckCircle className="h-4 w-4" />
              {hoApprovalNeeded ? 'Request HO Approval' : 'Create FTL Booking'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
