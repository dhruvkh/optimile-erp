import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleType, AxleConfiguration, VehicleStatus, Driver, OwnershipType, FuelType, BulkValidationResult, MaintenanceTemplate, EmissionStandard } from '../types';
import { VehicleAPI, DriverAPI, MaintenanceAPI } from '../services/mockDatabase';
import { Button, Input, Select, Badge, Modal } from '../components/UI';
import { IconPlus, IconSearch, IconEdit, IconTrash, IconArrowRight, IconSave, IconFileExcel, IconUploadCloud, IconCheckCircle, IconXCircle, IconAlertTriangle } from '../components/Icons';
import { VehicleDetailsPage } from './VehicleDetailsPage';

export const FleetPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [templates, setTemplates] = useState<MaintenanceTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Bulk Import State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState<'upload' | 'review' | 'success'>('upload');
  const [bulkValidation, setBulkValidation] = useState<BulkValidationResult | null>(null);
  const [isBulkValidating, setIsBulkValidating] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  // Form State
  const initialFormState = {
    registration_number: '',
    chassis_number: '',
    engine_number: '',
    make: '',
    model: '',
    manufacturing_year: '',
    vehicle_type: VehicleType.TRUCK,
    ownership_type: OwnershipType.OWNED,
    fuel_type: FuelType.DIESEL,
    emission_standard: EmissionStandard.BS6,
    axle_configuration: AxleConfiguration.AXLE_4X2,
    gvw_tons: '',
    capacity_tons: '',
    body_type: '',
    status: VehicleStatus.DRAFT,
    assigned_driver_id: '',
    maintenance_template_id: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [vData, dData, tData] = await Promise.all([
        VehicleAPI.getAll(),
        DriverAPI.getAll(),
        MaintenanceAPI.getTemplates()
      ]);
      setVehicles(vData);
      setDrivers(dData);
      setTemplates(tData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        registration_number: vehicle.registration_number,
        chassis_number: vehicle.chassis_number || '',
        engine_number: vehicle.engine_number || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        manufacturing_year: vehicle.manufacturing_year?.toString() || '',
        vehicle_type: vehicle.vehicle_type,
        ownership_type: vehicle.ownership_type || OwnershipType.OWNED,
        fuel_type: vehicle.fuel_type || FuelType.DIESEL,
        emission_standard: vehicle.emission_standard || EmissionStandard.BS6,
        axle_configuration: vehicle.axle_configuration,
        gvw_tons: vehicle.gvw_tons?.toString() || '',
        capacity_tons: vehicle.capacity_tons.toString(),
        body_type: vehicle.body_type || '',
        status: vehicle.status,
        assigned_driver_id: vehicle.assigned_driver_id || '',
        maintenance_template_id: vehicle.maintenance_template_id || ''
      });
    } else {
      setEditingVehicle(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Basic Validation for Active Status
      if (formData.status === VehicleStatus.ACTIVE) {
          if (!formData.chassis_number || !formData.engine_number) {
              alert("Active vehicles must have Chassis Number (VIN) and Engine Number.");
              setIsSubmitting(false);
              return;
          }
      }

      const payload: any = {
        ...formData,
        capacity_tons: parseFloat(formData.capacity_tons),
        gvw_tons: formData.gvw_tons ? parseFloat(formData.gvw_tons) : undefined,
        manufacturing_year: formData.manufacturing_year ? parseInt(formData.manufacturing_year) : undefined,
        assigned_driver_id: formData.assigned_driver_id || null,
        maintenance_template_id: formData.maintenance_template_id || undefined
      };

      if (editingVehicle) {
        await VehicleAPI.update(editingVehicle.vehicle_id, payload);
      } else {
        await VehicleAPI.create(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert("Error saving vehicle");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      await VehicleAPI.delete(id);
      fetchData();
    }
  };

  // --- Bulk Import Handlers ---
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setIsBulkValidating(true);
          try {
              const result = await VehicleAPI.validateBulkImport(e.target.files[0]);
              setBulkValidation(result);
              setBulkStep('review');
          } catch(e) {
              alert("Error validating file");
          } finally {
              setIsBulkValidating(false);
          }
      }
  };

  const confirmBulkImport = async () => {
      if (!bulkValidation || bulkValidation.validCount === 0) return;
      setIsBulkImporting(true);
      try {
          await VehicleAPI.importBulk(bulkValidation.parsedData);
          setBulkStep('success');
          fetchData();
      } catch (e) {
          alert("Import failed");
      } finally {
          setIsBulkImporting(false);
      }
  };

  const closeBulkModal = () => {
      setIsBulkModalOpen(false);
      setBulkStep('upload');
      setBulkValidation(null);
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (v.chassis_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus ? v.status === filterStatus : true;
    const matchesType = filterType ? v.vehicle_type === filterType : true;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: VehicleStatus) => {
    switch(status) {
      case VehicleStatus.ACTIVE: return 'green';
      case VehicleStatus.INACTIVE: return 'red';
      case VehicleStatus.MAINTENANCE: return 'yellow';
      case VehicleStatus.DRAFT: return 'gray';
      case VehicleStatus.RETIRED: return 'gray';
      default: return 'gray';
    }
  };

  if (selectedVehicleId) {
      return <VehicleDetailsPage vehicleId={selectedVehicleId} onBack={() => setSelectedVehicleId(null)} />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Fleet Asset Registry</h1>
        <div className="flex space-x-3">
            <Button variant="secondary" onClick={() => setIsBulkModalOpen(true)}>
                <IconFileExcel className="w-5 h-5 mr-2" />
                Bulk Onboard
            </Button>
            <Button onClick={() => handleOpenModal()}>
                <IconPlus className="w-5 h-5 mr-2" />
                Onboard Vehicle
            </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IconSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Search by Reg No or VIN"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            {Object.values(VehicleType).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-48">
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {Object.values(VehicleStatus).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading fleet data...</div>
        ) : filteredVehicles.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No vehicles found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Config</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.vehicle_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{vehicle.registration_number}</div>
                        <div className="text-xs text-gray-500">VIN: {vehicle.chassis_number || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vehicle.vehicle_type}</div>
                        <div className="text-xs text-gray-500">{vehicle.axle_configuration}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{vehicle.make} {vehicle.model}</div>
                        <div className="text-xs">{vehicle.gvw_tons ? `GVW: ${vehicle.gvw_tons}t` : ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color={vehicle.emission_standard === EmissionStandard.BS6 ? 'green' : 'gray'}>
                            {vehicle.emission_standard || 'BS4'}
                        </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge color={getStatusColor(vehicle.status)}>{vehicle.status}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
                       <button onClick={() => setSelectedVehicleId(vehicle.vehicle_id)} className="text-gray-400 hover:text-gray-600">
                        <IconArrowRight className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleOpenModal(vehicle)} className="text-primary-600 hover:text-primary-900">
                        <IconEdit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(vehicle.vehicle_id)} className="text-red-600 hover:text-red-900">
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deep Onboarding Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingVehicle ? "Edit Asset" : "Onboard New Asset"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Identification */}
          <div>
              <h3 className="text-sm font-medium text-gray-900 border-b pb-1 mb-3">Identification</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input 
                    label="Registration Number" 
                    value={formData.registration_number}
                    onChange={e => setFormData({...formData, registration_number: e.target.value})}
                    required
                    placeholder="e.g. MH-12-AB-1234"
                />
                <Input 
                    label="Chassis Number (VIN)" 
                    value={formData.chassis_number}
                    onChange={e => setFormData({...formData, chassis_number: e.target.value})}
                    placeholder="Enter VIN"
                />
                <Input 
                    label="Engine Number" 
                    value={formData.engine_number}
                    onChange={e => setFormData({...formData, engine_number: e.target.value})}
                    placeholder="Enter Engine No"
                />
                <Select 
                    label="Ownership"
                    options={Object.values(OwnershipType).map(v => ({ label: v, value: v }))}
                    value={formData.ownership_type}
                    onChange={e => setFormData({...formData, ownership_type: e.target.value as OwnershipType})}
                />
              </div>
          </div>

          {/* Section 2: Technical Specs */}
          <div>
              <h3 className="text-sm font-medium text-gray-900 border-b pb-1 mb-3">Technical Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input 
                    label="Make" 
                    value={formData.make}
                    onChange={e => setFormData({...formData, make: e.target.value})}
                    placeholder="e.g. Tata"
                />
                <Input 
                    label="Model" 
                    value={formData.model}
                    onChange={e => setFormData({...formData, model: e.target.value})}
                    placeholder="e.g. Prima"
                />
                <Select 
                    label="Vehicle Type"
                    options={Object.values(VehicleType).map(v => ({ label: v, value: v }))}
                    value={formData.vehicle_type}
                    onChange={e => setFormData({...formData, vehicle_type: e.target.value as VehicleType})}
                    required
                />
                <Select 
                    label="Fuel Type"
                    options={Object.values(FuelType).map(v => ({ label: v, value: v }))}
                    value={formData.fuel_type}
                    onChange={e => setFormData({...formData, fuel_type: e.target.value as FuelType})}
                />
                <Select 
                    label="Emission Standard"
                    options={Object.values(EmissionStandard).map(v => ({ label: v, value: v }))}
                    value={formData.emission_standard}
                    onChange={e => setFormData({...formData, emission_standard: e.target.value as EmissionStandard})}
                    required
                />
                <Select 
                    label="Axle Config"
                    options={Object.values(AxleConfiguration).map(v => ({ label: v, value: v }))}
                    value={formData.axle_configuration}
                    onChange={e => setFormData({...formData, axle_configuration: e.target.value as AxleConfiguration})}
                    required
                />
                <Input 
                    label="Mfg Year" 
                    type="number"
                    value={formData.manufacturing_year}
                    onChange={e => setFormData({...formData, manufacturing_year: e.target.value})}
                    placeholder="YYYY"
                />
                <Input 
                    label="GVW (Tons)" 
                    type="number"
                    step="0.1"
                    value={formData.gvw_tons}
                    onChange={e => setFormData({...formData, gvw_tons: e.target.value})}
                />
                <Input 
                    label="Payload Capacity (Tons)" 
                    type="number"
                    step="0.1"
                    value={formData.capacity_tons}
                    onChange={e => setFormData({...formData, capacity_tons: e.target.value})}
                    required
                />
              </div>
          </div>

          {/* Section 3: Operational */}
          <div>
              <h3 className="text-sm font-medium text-gray-900 border-b pb-1 mb-3">Operational Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <Select 
                    label="Status"
                    options={Object.values(VehicleStatus).map(v => ({ label: v, value: v }))}
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as VehicleStatus})}
                    required
                />
                <Select 
                    label="Assigned Driver"
                    options={[
                    { label: 'Unassigned', value: '' },
                    ...drivers
                        .filter(d => d.status === 'Active' && (!d.assigned_vehicle_id || d.assigned_vehicle_id === editingVehicle?.vehicle_id))
                        .map(d => ({ label: d.name, value: d.driver_id }))
                    ]}
                    value={formData.assigned_driver_id}
                    onChange={e => setFormData({...formData, assigned_driver_id: e.target.value})}
                />
                <div className="col-span-2">
                    <Select 
                        label="Maintenance Template"
                        options={[
                            { label: 'No Template Selected', value: '' },
                            ...templates.map(t => ({ label: t.name, value: t.template_id }))
                        ]}
                        value={formData.maintenance_template_id}
                        onChange={e => setFormData({...formData, maintenance_template_id: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">Assigns preventive maintenance schedule automatically.</p>
                </div>
              </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            {formData.status === VehicleStatus.DRAFT ? (
                 <Button type="submit" isLoading={isSubmitting} variant="secondary">
                    <IconSave className="w-4 h-4 mr-2" />
                    Save Draft
                 </Button>
            ) : (
                <Button type="submit" isLoading={isSubmitting}>
                    {editingVehicle ? 'Update Asset' : 'Onboard Asset'}
                </Button>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};