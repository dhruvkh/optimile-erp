
import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import {
  PlatformVendor, TMSVendorExtension, TMSRateAgreement,
  EMPTY_PLATFORM_VENDOR, EMPTY_TMS_EXTENSION, VendorStatus,
} from '../../../../../shared/types/vendor';
import {
  User, Truck, IndianRupee, Save, Plus, Trash2, Building, MapPin,
  ShieldCheck, ShieldAlert, FileText
} from 'lucide-react';

interface VendorFormProps {
  initialData?: PlatformVendor | null;
  tmsExtension?: TMSVendorExtension | null;
  onSave: (vendor: PlatformVendor, tmsExt?: Partial<TMSVendorExtension>) => void;
  onCancel: () => void;
}

export const VendorForm: React.FC<VendorFormProps> = ({ initialData, tmsExtension, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'fleet' | 'finance' | 'compliance'>('profile');
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState<PlatformVendor>(() => {
    if (initialData) return { ...initialData };
    return {
      ...EMPTY_PLATFORM_VENDOR,
      status: 'ACTIVE' as VendorStatus,
      createdFrom: 'TMS',
      verificationLevel: 'BASIC',
    };
  });

  const [tmsExt, setTmsExt] = useState<TMSVendorExtension>(() => {
    if (tmsExtension) return { ...tmsExtension };
    return { ...EMPTY_TMS_EXTENSION };
  });

  const handleSave = () => {
    if (!formData.companyName || !formData.contactName || !formData.phone) {
      setFormError('Company Name, Contact Name, and Phone are required.');
      return;
    }
    setFormError('');
    onSave(formData, tmsExt);
  };

  // ── Rate helpers
  const addRate = () => {
    const newRate: TMSRateAgreement = {
      id: `RA-${Date.now()}`,
      vehicleType: '20FT',
      rateType: 'Per KM',
      rate: 0,
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
      status: 'Active',
    };
    setTmsExt(prev => ({ ...prev, rateAgreements: [...prev.rateAgreements, newRate] }));
  };

  const updateRate = (index: number, field: keyof TMSRateAgreement, value: any) => {
    const updated = [...tmsExt.rateAgreements];
    updated[index] = { ...updated[index], [field]: value };
    setTmsExt(prev => ({ ...prev, rateAgreements: updated }));
  };

  const removeRate = (index: number) => {
    const updated = [...tmsExt.rateAgreements];
    updated.splice(index, 1);
    setTmsExt(prev => ({ ...prev, rateAgreements: updated }));
  };

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === id
          ? 'border-primary text-primary bg-primary/5'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
    </button>
  );

  const isEditing = !!initialData;

  return (
    <Card className="h-full flex flex-col p-0 overflow-hidden" bodyClassName="p-0 h-full min-h-0 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? 'Edit Vendor' : 'Quick Add Vendor'}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            {isEditing && <span className="text-sm text-gray-500 font-mono">{formData.id}</span>}
            {formData.verificationLevel === 'FULL' ? (
              <span className="flex items-center text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded">
                <ShieldCheck className="h-3 w-3 mr-1" /> Fully Verified
              </span>
            ) : (
              <span className="flex items-center text-amber-600 text-xs bg-amber-50 px-2 py-0.5 rounded">
                <ShieldAlert className="h-3 w-3 mr-1" /> Basic Verification
              </span>
            )}
            <span className="text-xs text-gray-400">Source: {formData.createdFrom}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {formError && <p className="text-red-500 text-sm mt-1">{formError}</p>}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" /> {isEditing ? 'Update' : 'Create'} Vendor
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <TabButton id="profile" label="Identity & Contact" icon={User} />
        <TabButton id="fleet" label="Fleet & Rates" icon={Truck} />
        <TabButton id="finance" label="Banking & Payment" icon={IndianRupee} />
        <TabButton id="compliance" label="Compliance" icon={FileText} />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Company Name *"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              />
              <Input
                label="Legal Entity Name"
                value={formData.legalEntityName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, legalEntityName: e.target.value }))}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 border"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <option value="Company">Company</option>
                  <option value="Individual">Individual</option>
                  <option value="Broker">Broker</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 border"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as VendorStatus }))}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="BLACKLISTED">Blacklisted</option>
                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                <User className="h-4 w-4 mr-2" /> Primary Contact
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Contact Person Name *"
                  value={formData.contactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                />
                <Input
                  label="Phone Number *"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-4 w-4 mr-2" /> Address & Coverage
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="City"
                  value={formData.city || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                />
                <Input
                  label="State"
                  value={formData.state || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                />
                <Input
                  label="Pincode"
                  value={formData.pincode || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                />
                <div className="md:col-span-3">
                  <Input
                    label="Full Address"
                    value={formData.address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Zones Served</label>
                <div className="flex flex-wrap gap-2">
                  {['North', 'South', 'East', 'West', 'Central', 'North-East'].map(z => (
                    <label key={z} className="flex items-center space-x-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={formData.zonesServed.includes(z)}
                        onChange={(e) => {
                          const zones = e.target.checked
                            ? [...formData.zonesServed, z]
                            : formData.zonesServed.filter(s => s !== z);
                          setFormData(prev => ({ ...prev, zonesServed: zones }));
                        }}
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-sm text-gray-700">{z}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FLEET TAB */}
        {activeTab === 'fleet' && (
          <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-4">Fleet Capacity</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Fleet Size (Vehicles)"
                  type="number"
                  value={formData.fleetSize}
                  onChange={(e) => setFormData(prev => ({ ...prev, fleetSize: Number(e.target.value) }))}
                />
                {formData.type === 'Broker' && (
                  <Input
                    label="Broker Commission (%)"
                    type="number"
                    value={tmsExt.brokerCommission || 0}
                    onChange={(e) => setTmsExt(prev => ({ ...prev, brokerCommission: Number(e.target.value) }))}
                  />
                )}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Types Available</label>
                <div className="flex flex-wrap gap-2">
                  {['20FT', '32FT', 'Trailer', 'Container', 'LCV', 'Tanker', 'Open Body', 'Refer'].map(v => (
                    <label key={v} className="flex items-center space-x-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={formData.vehicleTypes.includes(v)}
                        onChange={(e) => {
                          const types = e.target.checked
                            ? [...formData.vehicleTypes, v]
                            : formData.vehicleTypes.filter(t => t !== v);
                          setFormData(prev => ({ ...prev, vehicleTypes: types }));
                        }}
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="text-sm text-gray-700">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-gray-900">TMS Rate Agreements</h4>
                <Button size="sm" variant="outline" onClick={addRate}>
                  <Plus className="h-4 w-4 mr-1" /> Add Rate
                </Button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                {tmsExt.rateAgreements.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No TMS rate agreements defined.</p>
                ) : (
                  <div className="space-y-3">
                    {tmsExt.rateAgreements.map((rate, index) => (
                      <div key={rate.id} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-100">
                        <Input
                          className="text-xs flex-1"
                          placeholder="Origin"
                          value={rate.origin || ''}
                          onChange={(e) => updateRate(index, 'origin', e.target.value)}
                        />
                        <span className="text-gray-400 text-xs">→</span>
                        <Input
                          className="text-xs flex-1"
                          placeholder="Destination"
                          value={rate.destination || ''}
                          onChange={(e) => updateRate(index, 'destination', e.target.value)}
                        />
                        <select
                          className="text-xs border-gray-300 rounded-md py-1.5"
                          value={rate.vehicleType}
                          onChange={(e) => updateRate(index, 'vehicleType', e.target.value)}
                        >
                          <option>20FT</option>
                          <option>32FT</option>
                          <option>Trailer</option>
                          <option>Container</option>
                          <option>LCV</option>
                        </select>
                        <select
                          className="text-xs border-gray-300 rounded-md py-1.5"
                          value={rate.rateType}
                          onChange={(e) => updateRate(index, 'rateType', e.target.value)}
                        >
                          <option>Per KM</option>
                          <option>Per Trip</option>
                          <option>Per Ton</option>
                        </select>
                        <div className="w-24 relative">
                          <span className="absolute left-2 top-1.5 text-gray-500 text-xs">₹</span>
                          <input
                            type="number"
                            className="w-full pl-5 text-xs border-gray-300 rounded-md py-1.5"
                            value={rate.rate}
                            onChange={(e) => updateRate(index, 'rate', Number(e.target.value))}
                          />
                        </div>
                        <button onClick={() => removeRate(index)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* BANKING TAB */}
        {activeTab === 'finance' && (
          <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                <select
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 border"
                  value={tmsExt.paymentTerms}
                  onChange={(e) => setTmsExt(prev => ({ ...prev, paymentTerms: e.target.value as any }))}
                >
                  <option>Weekly</option>
                  <option>Bi-weekly</option>
                  <option>Monthly</option>
                  <option>On Delivery</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                <select
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 border"
                  value={tmsExt.paymentMode}
                  onChange={(e) => setTmsExt(prev => ({ ...prev, paymentMode: e.target.value as any }))}
                >
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                  <option>Cash</option>
                  <option>UPI</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                <Building className="h-4 w-4 mr-2" /> Bank Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Beneficiary Name"
                  value={formData.bankDetails?.beneficiaryName || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails!, beneficiaryName: e.target.value },
                  }))}
                />
                <Input
                  label="Account Number"
                  type="password"
                  value={formData.bankDetails?.accountNumber || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails!, accountNumber: e.target.value },
                  }))}
                />
                <Input
                  label="IFSC Code"
                  value={formData.bankDetails?.ifsc || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails!, ifsc: e.target.value.toUpperCase() },
                  }))}
                  placeholder="HDFC0001234"
                />
                <Input
                  label="Bank Name"
                  value={formData.bankDetails?.bankName || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails!, bankName: e.target.value },
                  }))}
                />
                <div className="flex items-center mt-6">
                  {(formData.bankDetails?.ifsc || '').length === 11 ? (
                    <span className="text-green-600 text-sm flex items-center bg-green-50 px-2 py-1 rounded">
                      ✓ Valid IFSC Format
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Enter 11-digit IFSC</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMPLIANCE TAB */}
        {activeTab === 'compliance' && (
          <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              {formData.verificationLevel === 'FULL' ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Fully Verified via AMS</p>
                    <p className="text-xs text-gray-500">All documents verified through the AMS onboarding pipeline.</p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Basic Verification (TMS Quick-Add)</p>
                    <p className="text-xs text-gray-500">Upload documents below to enhance verification level. For full verification, use the AMS onboarding pipeline.</p>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="GSTIN"
                placeholder="e.g., 27AABCA1234A1ZA"
                value={formData.gstin || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
              />
              <div className="flex items-end gap-2">
                {(formData.gstin || '').length === 15 ? (
                  <span className="text-green-600 text-xs bg-green-50 px-2 py-1 rounded mb-1">✓ Valid length</span>
                ) : (formData.gstin || '').length > 0 ? (
                  <span className="text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded mb-1">15 chars required</span>
                ) : null}
              </div>
              <Input
                label="PAN"
                placeholder="e.g., AABCA1234A"
                value={formData.pan || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
              />
              <Input
                label="Transport License Number"
                value={formData.transportLicense || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, transportLicense: e.target.value }))}
              />
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-bold text-gray-900 mb-4">Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {formData.documents.map((doc, i) => (
                  <div key={doc.type} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{doc.type.replace(/_/g, ' ')}</p>
                      {doc.fileName && <p className="text-xs text-gray-500">{doc.fileName}</p>}
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${doc.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                        doc.status === 'UPLOADED' ? 'bg-blue-100 text-blue-700' :
                          doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                      }`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
                {formData.documents.length === 0 && (
                  <p className="text-sm text-gray-400 col-span-2 text-center py-4">No documents uploaded. For full verification, submit documents via the AMS onboarding portal.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </Card>
  );
};
