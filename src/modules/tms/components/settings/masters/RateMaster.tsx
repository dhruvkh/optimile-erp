
import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { 
  Plus, Search, Filter, Copy, Edit, Trash2, 
  MapPin, Truck, Calendar, IndianRupee, FileText,
  User, Download
} from 'lucide-react';
import { RateTemplate, INITIAL_RATE_TEMPLATE } from './types';
import { RateForm } from './RateForm';

// Mock Data
const MOCK_RATES: RateTemplate[] = [
  { 
    id: 'RATE-001', code: 'RT-NI-20T', name: 'Standard 20T - North India', 
    description: 'Standard rates for 20 Ton trucks in North India routes',
    applicableFor: { clients: ['All'], routes: ['ROU-001', 'ROU-003'], vehicleTypes: ['20 Ton Closed Body'] },
    rateStructure: { baseRate: 45000, unit: 'Per Trip', minimumCharge: 40000 },
    additionalCharges: { loading: 1500, unloading: 1500, detention: { afterHours: 2, ratePerHour: 500 }, toll: 'Actual' },
    fuelSurcharge: { type: 'Variable', baseDieselPrice: 92.72, calculation: '2% per Rs 3 increase' },
    specialConditions: { bulkDiscount: [{ minTrips: 10, discountPercent: 5 }] },
    validity: { from: '2024-01-01', to: '2024-12-31' },
    status: 'Active'
  },
  { 
    id: 'RATE-002', code: 'RT-ACME-SPL', name: 'Acme Corp Special Contract', 
    description: 'Negotiated rates for Acme Corp pan-India',
    applicableFor: { clients: ['CLI-001'], routes: [], vehicleTypes: ['Container 20ft'] },
    rateStructure: { baseRate: 32, unit: 'Per KM', minimumCharge: 5000 },
    additionalCharges: { loading: 0, unloading: 0, detention: { afterHours: 4, ratePerHour: 400 }, toll: 'Actual' },
    fuelSurcharge: { type: 'Fixed', baseDieselPrice: 0, calculation: 'No Surcharge' },
    specialConditions: { bulkDiscount: [] },
    validity: { from: '2024-02-01', to: '2025-01-31' },
    status: 'Active'
  },
  { 
    id: 'RATE-003', code: 'RT-LTL-EXP', name: 'LTL Express Rates', 
    description: 'Rates for Less-than-truckload express shipments',
    applicableFor: { clients: ['All'], routes: [], vehicleTypes: ['LCV'] },
    rateStructure: { baseRate: 8, unit: 'Per KM', minimumCharge: 1500 },
    additionalCharges: { loading: 500, unloading: 500, detention: { afterHours: 1, ratePerHour: 200 }, toll: 'Fixed', tollAmount: 500 },
    fuelSurcharge: { type: 'Percentage', baseDieselPrice: 0, calculation: '10% Flat' },
    specialConditions: { bulkDiscount: [] },
    validity: { from: '2023-01-01', to: '2023-12-31' },
    status: 'Inactive'
  }
];

export const RateMaster: React.FC = () => {
  const [rates, setRates] = useState<RateTemplate[]>(MOCK_RATES);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RateTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredRates = rates.filter(r => 
    (r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.code.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'All' || r.status === filterStatus)
  );

  const handleEdit = (template: RateTemplate) => {
    setSelectedTemplate(template);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedTemplate(null);
    setIsFormOpen(true);
  };

  const handleClone = (template: RateTemplate) => {
    const cloned = { 
      ...template, 
      id: `RATE-${Math.floor(Math.random() * 10000)}`,
      code: `${template.code}-COPY`,
      name: `${template.name} (Copy)`,
      status: 'Draft' as const 
    };
    setRates(prev => [...prev, cloned]);
  };

  const handleSave = (template: RateTemplate) => {
    if (selectedTemplate) {
      setRates(prev => prev.map(r => r.id === template.id ? template : r));
    } else {
      setRates(prev => [...prev, template]);
    }
    setIsFormOpen(false);
  };

  if (isFormOpen) {
    return <RateForm initialData={selectedTemplate} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-lg font-bold text-gray-900">Rate Templates</h2>
            <p className="text-sm text-gray-500">Manage standard rate cards and client-specific contracts.</p>
        </div>
        <div className="flex space-x-2">
            <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> Export Sheet
            </Button>
            <Button size="sm" onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" /> Create Template
            </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                  type="text" 
                  placeholder="Search rates..." 
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          <div className="flex items-center space-x-2">
              <select 
                  className="border-gray-300 rounded-md text-sm py-1.5 focus:ring-primary focus:border-primary border"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
              >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Draft">Draft</option>
              </select>
              <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" /> More Filters
              </Button>
          </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRates.map((rate) => (
              <div key={rate.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                      <div>
                          <div className="flex items-center space-x-2">
                              <h3 className="text-base font-bold text-gray-900 truncate max-w-[200px]" title={rate.name}>{rate.name}</h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  rate.status === 'Active' ? 'bg-green-100 text-green-700' : 
                                  rate.status === 'Draft' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                  {rate.status}
                              </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{rate.code}</p>
                      </div>
                      <div className="p-1.5 bg-white rounded border border-gray-200 text-gray-500">
                          <IndianRupee className="h-5 w-5" />
                      </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-4 flex-1">
                      {/* Rate Info */}
                      <div className="flex items-end justify-between">
                          <div>
                              <p className="text-xs text-gray-500 uppercase font-medium">Base Rate</p>
                              <p className="text-xl font-bold text-gray-900">
                                  ₹ {rate.rateStructure.baseRate.toLocaleString()}
                                  <span className="text-xs font-normal text-gray-500 ml-1">/ {rate.rateStructure.unit.replace('Per ', '')}</span>
                              </p>
                          </div>
                          <div className="text-right">
                              <p className="text-xs text-gray-500 uppercase font-medium">Min. Charge</p>
                              <p className="text-sm font-semibold text-gray-700">₹ {rate.rateStructure.minimumCharge.toLocaleString()}</p>
                          </div>
                      </div>

                      <div className="w-full h-px bg-gray-100"></div>

                      {/* Applicability */}
                      <div className="space-y-2 text-xs">
                          <div className="flex items-center text-gray-600">
                              <Truck className="h-3.5 w-3.5 mr-2 text-gray-400" />
                              <span className="truncate flex-1" title={rate.applicableFor.vehicleTypes.join(', ')}>
                                  {rate.applicableFor.vehicleTypes.length > 0 ? rate.applicableFor.vehicleTypes.join(', ') : 'All Vehicles'}
                              </span>
                          </div>
                          <div className="flex items-center text-gray-600">
                              <MapPin className="h-3.5 w-3.5 mr-2 text-gray-400" />
                              <span>{rate.applicableFor.routes.length > 0 ? `${rate.applicableFor.routes.length} specific routes` : 'All Routes'}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                              <User className="h-3.5 w-3.5 mr-2 text-gray-400" />
                              <span className={rate.applicableFor.clients.includes('All') ? '' : 'font-medium text-blue-600'}>
                                  {rate.applicableFor.clients.includes('All') ? 'All Clients' : `${rate.applicableFor.clients.length} Specific Clients`}
                              </span>
                          </div>
                          <div className="flex items-center text-gray-600">
                              <Calendar className="h-3.5 w-3.5 mr-2 text-gray-400" />
                              <span>Valid: {rate.validity.from} to {rate.validity.to}</span>
                          </div>
                      </div>
                  </div>

                  {/* Actions */}
                  <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center opacity-90 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" className="h-7 text-xs bg-white" onClick={() => handleEdit(rate)}>
                          <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <div className="flex space-x-1">
                          <button 
                              onClick={() => handleClone(rate)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" 
                              title="Clone Template"
                          >
                              <Copy className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded" title="Apply to Client">
                              <FileText className="h-4 w-4" />
                          </button>
                      </div>
                  </div>
              </div>
          ))}
          
          {/* Add New Card Placeholder */}
          <div 
              onClick={handleAddNew}
              className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all min-h-[300px]"
          >
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-sm transition-colors">
                  <Plus className="h-6 w-6 text-gray-400 group-hover:text-primary" />
              </div>
              <h3 className="font-bold text-gray-600 group-hover:text-primary">Create New Template</h3>
              <p className="text-xs text-gray-400 text-center mt-1 max-w-[200px]">Define a new rate structure for specific routes or clients.</p>
          </div>
      </div>
    </div>
  );
};
