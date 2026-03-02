
import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import {
  PlatformCustomer, CustomerTier, CustomerStatus, EMPTY_CUSTOMER,
} from '../../../../../shared/types/customer';
import {
  User, CreditCard, FileText, Settings, Building2,
  Save, AlertTriangle, Plus, Info
} from 'lucide-react';

interface ClientFormProps {
  initialData?: PlatformCustomer | null;
  onSave: (customer: PlatformCustomer) => void;
  onCancel: () => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ initialData, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'contacts' | 'financial' | 'contracts' | 'prefs'>('basic');
  const [formData, setFormData] = useState<PlatformCustomer>(() => {
    if (initialData) return { ...initialData };
    return { ...EMPTY_CUSTOMER };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Customer Name is required';

    // GSTIN validation (15 chars, Indian format)
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (formData.gstin && !gstinRegex.test(formData.gstin)) {
      newErrors.gstin = 'Invalid GSTIN format (expected: 29AAAAA0000A1Z5)';
    }

    // PAN validation (10 chars)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (formData.pan && !panRegex.test(formData.pan)) {
      newErrors.pan = 'Invalid PAN format (expected: AAAAA0000A)';
    }

    if (!formData.contacts.primary.name) newErrors.primaryContact = 'Primary Contact Name is required';
    if (!formData.contacts.primary.phone) newErrors.primaryPhone = 'Primary Phone is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(formData);
    } else {
      alert('Please fix validation errors');
    }
  };

  const updateFinancial = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, financial: { ...prev.financial, [field]: value } }));
  };

  const updateContact = (type: 'primary' | 'accounts' | 'logistics', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contacts: {
        ...prev.contacts,
        [type]: { ...prev.contacts[type], [field]: value }
      }
    }));
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
  const creditUtil = formData.financial.creditLimit > 0
    ? (formData.financial.outstanding / formData.financial.creditLimit * 100)
    : 0;

  return (
    <Card className="h-full flex flex-col p-0 overflow-hidden" bodyClassName="p-0 h-full min-h-0 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          {isEditing && <p className="text-sm text-gray-500">ID: {formData.id}</p>}
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" /> {isEditing ? 'Update' : 'Create'} Customer
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <TabButton id="basic" label="Identity & Tax" icon={Building2} />
        <TabButton id="contacts" label="Contacts" icon={User} />
        <TabButton id="financial" label="Credit & Billing" icon={CreditCard} />
        <TabButton id="contracts" label="Contracts" icon={FileText} />
        <TabButton id="prefs" label="Preferences" icon={Settings} />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">

        {/* BASIC INFO */}
        {activeTab === 'basic' && (
          <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Customer Name *"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                error={errors.name}
              />
              <Input
                label="Legal Name"
                value={formData.legalName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, legalName: e.target.value }))}
                placeholder="As per GST registration"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                <select
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 border"
                  value={formData.tier}
                  onChange={(e) => setFormData(prev => ({ ...prev, tier: e.target.value as CustomerTier }))}
                >
                  <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 border"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as CustomerStatus }))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              <Input
                label="Billing Address"
                value={formData.billingAddress || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, billingAddress: e.target.value }))}
              />
              <Input
                label="Relationship Manager"
                value={formData.relationshipManager || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, relationshipManager: e.target.value }))}
                placeholder="Internal account owner"
              />
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-bold text-gray-900 mb-4">Tax Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="GSTIN"
                    value={formData.gstin || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                    placeholder="29AAAAA0000A1Z5"
                    error={errors.gstin}
                  />
                  {(formData.gstin || '').length === 15 && !errors.gstin && (
                    <div className="mt-1 flex items-center gap-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.gstinVerified || false}
                          onChange={(e) => setFormData(prev => ({ ...prev, gstinVerified: e.target.checked }))}
                          className="rounded text-green-600 focus:ring-green-500 h-4 w-4"
                        />
                        <span className="text-xs text-gray-600">GST Verified on Portal</span>
                      </label>
                    </div>
                  )}
                </div>
                <Input
                  label="PAN"
                  value={formData.pan || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                  placeholder="AAAAA0000A"
                  error={errors.pan}
                />
              </div>
            </div>
          </div>
        )}

        {/* CONTACTS */}
        {activeTab === 'contacts' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {(['primary', 'accounts', 'logistics'] as const).map((type) => (
              <div key={type} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-bold text-gray-900 mb-3 capitalize flex items-center">
                  {type === 'primary' && <User className="h-4 w-4 mr-2" />}
                  {type === 'accounts' && <CreditCard className="h-4 w-4 mr-2" />}
                  {type === 'logistics' && <Building2 className="h-4 w-4 mr-2" />}
                  {type} Contact {type === 'primary' && <span className="text-red-500 ml-1">*</span>}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Name"
                    value={formData.contacts[type].name}
                    onChange={(e) => updateContact(type, 'name', e.target.value)}
                    error={type === 'primary' ? errors.primaryContact : undefined}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={formData.contacts[type].email}
                    onChange={(e) => updateContact(type, 'email', e.target.value)}
                  />
                  <Input
                    label="Phone"
                    value={formData.contacts[type].phone}
                    onChange={(e) => updateContact(type, 'phone', e.target.value)}
                    error={type === 'primary' ? errors.primaryPhone : undefined}
                  />
                  <Input
                    label="Designation"
                    value={formData.contacts[type].designation || ''}
                    onChange={(e) => updateContact(type, 'designation', e.target.value)}
                    placeholder="e.g., Logistics Head"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FINANCIALS */}
        {activeTab === 'financial' && (
          <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {/* Credit Health */}
            <div className={`border rounded-lg p-4 ${creditUtil > 100 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex">
                <CreditCard className={`h-5 w-5 mr-3 ${creditUtil > 100 ? 'text-red-600' : 'text-blue-600'}`} />
                <div className="flex-1">
                  <h3 className="text-sm font-medium">{creditUtil > 100 ? '⚠️ OVER CREDIT LIMIT' : 'Credit Health'}</h3>
                  <div className="mt-2">
                    <p className="text-sm">Outstanding: <strong>₹{formData.financial.outstanding.toLocaleString()}</strong> / ₹{formData.financial.creditLimit.toLocaleString()}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className={`h-2.5 rounded-full ${creditUtil > 100 ? 'bg-red-600' : creditUtil > 80 ? 'bg-yellow-500' : 'bg-blue-600'}`}
                        style={{ width: `${Math.min(creditUtil, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs">{creditUtil.toFixed(1)}% utilized</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Credit Limit (₹)"
                type="number"
                value={formData.financial.creditLimit}
                onChange={(e) => updateFinancial('creditLimit', Number(e.target.value))}
              />
              <Input
                label="Credit Days"
                type="number"
                value={formData.financial.creditDays}
                onChange={(e) => updateFinancial('creditDays', Number(e.target.value))}
              />
              <Input
                label="Current Outstanding (₹)"
                type="number"
                value={formData.financial.outstanding}
                onChange={(e) => updateFinancial('outstanding', Number(e.target.value))}
                disabled={isEditing}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Charge Type</label>
                <select
                  className="block w-full border-gray-300 rounded-md shadow-sm text-sm py-2 px-3 border"
                  value={formData.financial.gstChargeType}
                  onChange={(e) => updateFinancial('gstChargeType', e.target.value)}
                >
                  <option value="FORWARD">Forward Charge (12% GST on Transport)</option>
                  <option value="REVERSE">Reverse Charge Mechanism (5% RCM)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-bold text-gray-900 mb-4">TDS Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.financial.tdsApplicable}
                      onChange={(e) => updateFinancial('tdsApplicable', e.target.checked)}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">TDS Applicable</span>
                  </label>
                </div>
                {formData.financial.tdsApplicable && (
                  <Input
                    label="TDS Rate (%)"
                    type="number"
                    value={formData.financial.tdsRate}
                    onChange={(e) => updateFinancial('tdsRate', Number(e.target.value))}
                    placeholder="2"
                  />
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Format</label>
                  <select
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm py-2 px-3 border"
                    value={formData.financial.invoiceFormat}
                    onChange={(e) => updateFinancial('invoiceFormat', e.target.value)}
                  >
                    <option>PDF</option>
                    <option>Excel</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTRACTS */}
        {activeTab === 'contracts' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-gray-900">Active Contracts</h4>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add Contract</Button>
            </div>

            {formData.contracts.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-500">
                No active contracts found.
              </div>
            ) : (
              <div className="space-y-2">
                {formData.contracts.map((contract) => (
                  <div key={contract.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{contract.name}</p>
                      <p className="text-xs text-gray-500">{contract.validFrom} to {contract.validTo}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${contract.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {contract.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PREFERENCES */}
        {activeTab === 'prefs' && (
          <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Vehicle Types</label>
              <div className="grid grid-cols-2 gap-3">
                {['20FT', '32FT', 'Trailer', 'Container', 'LCV', 'Tanker', 'Open Body', 'Refer'].map(v => (
                  <label key={v} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-primary focus:ring-primary"
                      checked={formData.preferences.vehicleTypes.includes(v)}
                      onChange={(e) => {
                        const types = e.target.checked
                          ? [...formData.preferences.vehicleTypes, v]
                          : formData.preferences.vehicleTypes.filter(t => t !== v);
                        setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, vehicleTypes: types } }));
                      }}
                    />
                    <span className="text-sm text-gray-700">{v}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Communication Channel</label>
                <select
                  className="block w-full border-gray-300 rounded-md text-sm py-2 px-3 border"
                  value={formData.preferences.communicationChannel}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, communicationChannel: e.target.value as any } }))}
                >
                  <option>Email</option>
                  <option>SMS</option>
                  <option>WhatsApp</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Payment Mode</label>
                <select
                  className="block w-full border-gray-300 rounded-md text-sm py-2 px-3 border"
                  value={formData.preferences.defaultPaymentMode || 'Bank Transfer'}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, defaultPaymentMode: e.target.value as 'Bank Transfer' | 'Cheque' | 'UPI' } }))}
                >
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                  <option>Cash</option>
                  <option>UPI</option>
                </select>
              </div>
              <div className="flex items-center pt-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                    checked={formData.preferences.autoBooking}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, autoBooking: e.target.checked } }))}
                  />
                  <span className="text-sm font-medium text-gray-700">Allow Auto-Booking (API)</span>
                </label>
              </div>
            </div>
          </div>
        )}

      </div>
    </Card>
  );
};
