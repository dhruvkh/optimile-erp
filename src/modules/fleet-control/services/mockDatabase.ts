
import { 
  Vehicle, Driver, Trip, VehicleType, AxleConfiguration, VehicleStatus, DriverStatus, TripStatus,
  MaintenanceSchedule, WorkOrder, FuelEvent, CostEvent,
  MaintenanceType, WorkOrderStatus, ConfidenceFlag, CostCategory,
  TelemetryEvent, VehicleDocument, DriverBehaviorEvent, VehicleLiveStatus,
  DocumentType, DocumentStatus, BehaviorEventType, BehaviorSeverity, DerivedVehicleStatus,
  OpsException, ExceptionSeverity, ExceptionStatus, VehicleConfidence, OpsKPIs,
  DataCoverageStatus, CoverageStatus, ReconciliationRecord, ReconciliationStatus, HumanActionLog,
  VehicleComponent, ComponentType, ComponentStatus, OwnershipType, FuelType,
  DriverLicense, DriverSkill, DriverType, LicenseType, DriverDocument, DriverDocumentType,
  BulkValidationResult, MaintenanceTemplate, MaintenanceTemplateItem, VehicleMaintenanceItem, ComponentHistoryRecord,
  WorkOrderType, WorkshopType, IssueSource, MaintenanceHealthStatus, VehicleMaintenanceHealth, MaintenanceKPIs,
  TyreHealthSignal, TyreEventSignal, TyreSignalType, AdBlueEvent, EmissionStandard,
  EnergyAnomaly, EnergyAnomalyType, EnergyMetrics, EnergyMaintenanceSignal, EnergyMaintenanceSignalType, EnergySyncSummary,
  SparePart, InventoryStock, InventoryMovement, PartCategory, MovementType, WorkOrderPart, WorkOrderPartStatus, ReorderAlert, ReorderStatus
} from '../types';

// --- SEED DATA ---

const SEED_VEHICLES: Vehicle[] = [
  {
    vehicle_id: 'v1',
    registration_number: 'MH-46-BM-2849', 
    vehicle_type: VehicleType.TRUCK,
    axle_configuration: AxleConfiguration.AXLE_6X4,
    capacity_tons: 12.5,
    status: VehicleStatus.ACTIVE,
    assigned_driver_id: 'd1',
    created_at: new Date().toISOString(),
    chassis_number: 'MA123456789ABC',
    engine_number: 'E987654321',
    make: 'Tata Motors',
    model: 'Prima 2825.K',
    manufacturing_year: 2022,
    ownership_type: OwnershipType.OWNED,
    fuel_type: FuelType.DIESEL,
    emission_standard: EmissionStandard.BS6,
    gvw_tons: 28,
    body_type: 'Box Body',
    maintenance_template_id: 'mt1'
  },
  {
    vehicle_id: 'v2',
    registration_number: 'KA-51-HA-9231',
    vehicle_type: VehicleType.TRUCK,
    axle_configuration: AxleConfiguration.AXLE_4X2,
    capacity_tons: 8.0,
    status: VehicleStatus.MAINTENANCE,
    assigned_driver_id: null,
    created_at: new Date().toISOString(),
    chassis_number: 'KA987654321XYZ',
    engine_number: 'E123456789',
    make: 'Ashok Leyland',
    model: 'Ecomet 1215',
    manufacturing_year: 2019,
    ownership_type: OwnershipType.LEASED,
    fuel_type: FuelType.DIESEL,
    emission_standard: EmissionStandard.BS4,
    gvw_tons: 12,
    body_type: 'Open Body',
    maintenance_template_id: 'mt1'
  },
  {
    vehicle_id: 'v3',
    registration_number: 'DL-1L-XY-5544',
    vehicle_type: VehicleType.CONTAINER,
    axle_configuration: AxleConfiguration.AXLE_6X4,
    capacity_tons: 24.0,
    status: VehicleStatus.ACTIVE,
    assigned_driver_id: 'd2',
    created_at: new Date().toISOString(),
    chassis_number: 'DL456789123PQR',
    engine_number: 'E456123789',
    make: 'BharatBenz',
    model: '5528TT',
    manufacturing_year: 2023,
    ownership_type: OwnershipType.OWNED,
    fuel_type: FuelType.DIESEL,
    emission_standard: EmissionStandard.BS6,
    gvw_tons: 55,
    body_type: 'Container',
    maintenance_template_id: 'mt1'
  },
    {
  vehicle_id: 'v4',
  registration_number: 'MH-12-KL-9087',
  vehicle_type: VehicleType.TRUCK,
  axle_configuration: AxleConfiguration.AXLE_6X2,
  capacity_tons: 18,
  status: VehicleStatus.ACTIVE,
  assigned_driver_id: 'd3',
  created_at: new Date().toISOString(),
  chassis_number: 'MH6X2CHASSIS9087',
  engine_number: 'ENG90871234',
  make: 'Ashok Leyland',
  model: '1616',
  manufacturing_year: 2021,
  ownership_type: OwnershipType.OWNED,
  fuel_type: FuelType.DIESEL,
  emission_standard: EmissionStandard.BS6,
  gvw_tons: 16,
  body_type: 'Closed',
  maintenance_template_id: 'mt1'
},
{
  vehicle_id: 'v5',
  registration_number: 'MH-14-BG-2234',
  vehicle_type: VehicleType.TRUCK,
  axle_configuration: AxleConfiguration.AXLE_4X2,
  capacity_tons: 14,
  status: VehicleStatus.ACTIVE,
  assigned_driver_id: 'd1',
  created_at: new Date().toISOString(),
  chassis_number: 'MH4X2CHASSIS2234',
  engine_number: 'ENG22345678',
  make: 'Tata Motors',
  model: 'Ultra 1518',
  manufacturing_year: 2020,
  ownership_type: OwnershipType.OWNED,
  fuel_type: FuelType.DIESEL,
  emission_standard: EmissionStandard.BS6,
  gvw_tons: 15,
  body_type: 'Open',
  maintenance_template_id: 'mt1'
},
{
  vehicle_id: 'v6',
  registration_number: 'KA-01-ZX-9911',
  vehicle_type: VehicleType.TRUCK,
  axle_configuration: AxleConfiguration.AXLE_6X4,
  capacity_tons: 25,
  status: VehicleStatus.ACTIVE,
  assigned_driver_id: 'd2',
  created_at: new Date().toISOString(),
  chassis_number: 'KA6X4CHASSIS9911',
  engine_number: 'ENG99111234',
  make: 'Volvo',
  model: 'FM 420',
  manufacturing_year: 2019,
  ownership_type: OwnershipType.LEASED,
  fuel_type: FuelType.DIESEL,
  emission_standard: EmissionStandard.BS4,
  gvw_tons: 35,
  body_type: 'Container',
  maintenance_template_id: 'mt2'
},
{
  vehicle_id: 'v7',
  registration_number: 'DL-01-AA-7821',
  vehicle_type: VehicleType.TRUCK,
  axle_configuration: AxleConfiguration.AXLE_4X2,
  capacity_tons: 12,
  status: VehicleStatus.ACTIVE,
  assigned_driver_id: 'd4',
  created_at: new Date().toISOString(),
  chassis_number: 'DL4X2CHASSIS7821',
  engine_number: 'ENG78214567',
  make: 'Eicher',
  model: 'Pro 3015',
  manufacturing_year: 2022,
  ownership_type: OwnershipType.OWNED,
  fuel_type: FuelType.DIESEL,
  emission_standard: EmissionStandard.BS6,
  gvw_tons: 14,
  body_type: 'Closed',
  maintenance_template_id: 'mt1'
},
{
  vehicle_id: 'v8',
  registration_number: 'GJ-05-HJ-4455',
  vehicle_type: VehicleType.TRUCK,
  axle_configuration: AxleConfiguration.AXLE_6X2,
  capacity_tons: 19,
  status: VehicleStatus.ACTIVE,
  assigned_driver_id: 'd5',
  created_at: new Date().toISOString(),
  chassis_number: 'GJ6X2CHASSIS4455',
  engine_number: 'ENG44551234',
  make: 'BharatBenz',
  model: '3528CM',
  manufacturing_year: 2021,
  ownership_type: OwnershipType.OWNED,
  fuel_type: FuelType.DIESEL,
  emission_standard: EmissionStandard.BS6,
  gvw_tons: 31,
  body_type: 'Tipper',
  maintenance_template_id: 'mt2'
},
{
  vehicle_id: 'v9',
  registration_number: 'TN-10-MM-6677',
  vehicle_type: VehicleType.TRUCK,
  axle_configuration: AxleConfiguration.AXLE_4X2,
  capacity_tons: 10,
  status: VehicleStatus.MAINTENANCE,
  assigned_driver_id: 'd6',
  created_at: new Date().toISOString(),
  chassis_number: 'TN4X2CHASSIS6677',
  engine_number: 'ENG66773456',
  make: 'Ashok Leyland',
  model: 'Partner 1200',
  manufacturing_year: 2018,
  ownership_type: OwnershipType.OWNED,
  fuel_type: FuelType.DIESEL,
  emission_standard: EmissionStandard.BS4,
  gvw_tons: 12,
  body_type: 'Open',
  maintenance_template_id: 'mt3'
},
{
  vehicle_id: 'v10',
  registration_number: 'RJ-19-PP-3344',
  vehicle_type: VehicleType.TRUCK,
  axle_configuration: AxleConfiguration.AXLE_6X4,
  capacity_tons: 28,
  status: VehicleStatus.ACTIVE,
  assigned_driver_id: 'd7',
  created_at: new Date().toISOString(),
  chassis_number: 'RJ6X4CHASSIS3344',
  engine_number: 'ENG33447890',
  make: 'Scania',
  model: 'G410',
  manufacturing_year: 2020,
  ownership_type: OwnershipType.LEASED,
  fuel_type: FuelType.DIESEL,
  emission_standard: EmissionStandard.BS6,
  gvw_tons: 40,
  body_type: 'Container',
  maintenance_template_id: 'mt2'
},
{
  vehicle_id: 'v11',
  registration_number: 'UP-16-QW-5566',
  vehicle_type: VehicleType.TRUCK,
  axle_configuration: AxleConfiguration.AXLE_4X2,
  capacity_tons: 11,
  status: VehicleStatus.ACTIVE,
  assigned_driver_id: 'd8',
  created_at: new Date().toISOString(),
  chassis_number: 'UP4X2CHASSIS5566',
  engine_number: 'ENG55661234',
  make: 'Tata Motors',
  model: 'LPT 1109',
  manufacturing_year: 2019,
  ownership_type: OwnershipType.OWNED,
  fuel_type: FuelType.DIESEL,
  emission_standard: EmissionStandard.BS4,
  gvw_tons: 11,
  body_type: 'Closed',
  maintenance_template_id: 'mt1'
},
{
  vehicle_id: 'v12',
  registration_number: 'HR-38-YT-8899',
  vehicle_type: VehicleType.TRUCK,
  axle_configuration: AxleConfiguration.AXLE_6X2,
  capacity_tons: 20,
  status: VehicleStatus.ACTIVE,
  assigned_driver_id: 'd9',
  created_at: new Date().toISOString(),
  chassis_number: 'HR6X2CHASSIS8899',
  engine_number: 'ENG88994567',
  make: 'Mahindra',
  model: 'Blazo X 28',
  manufacturing_year: 2022,
  ownership_type: OwnershipType.OWNED,
  fuel_type: FuelType.DIESEL,
  emission_standard: EmissionStandard.BS6,
  gvw_tons: 28,
  body_type: 'Trailer',
  maintenance_template_id: 'mt2'
},
{
  vehicle_id: 'v13',
  registration_number: 'MP-09-CC-1122',
  vehicle_type: VehicleType.TRUCK,
  axle_configuration: AxleConfiguration.AXLE_4X2,
  capacity_tons: 9,
  status: VehicleStatus.RETIRED,
  assigned_driver_id: 'd10',
  created_at: new Date().toISOString(),
  chassis_number: 'MP4X2CHASSIS1122',
  engine_number: 'ENG11229876',
  make: 'Eicher',
  model: 'Canter',
  manufacturing_year: 2015,
  ownership_type: OwnershipType.OWNED,
  fuel_type: FuelType.DIESEL,
  emission_standard: EmissionStandard.BS3,
  gvw_tons: 9,
  body_type: 'Open',
  maintenance_template_id: 'mt3'
}

];

const SEED_DRIVERS: Driver[] = [
  {
    driver_id: 'd1',
    name: 'Ramesh Kumar',
    phone: '+91 98765 43210',
    license_number: 'MH14 20180000123',
    license_expiry_date: '2025-10-15',
    status: DriverStatus.ACTIVE,
    assigned_vehicle_id: 'v1',
    created_at: new Date().toISOString(),
    driver_type: DriverType.PERMANENT,
    home_location: 'Pune, MH'
  },
  {
    driver_id: 'd2',
    name: 'Suresh Singh',
    phone: '+91 98123 45678',
    license_number: 'DL04 20190000456',
    license_expiry_date: '2024-05-20',
    status: DriverStatus.ACTIVE,
    assigned_vehicle_id: 'v3',
    created_at: new Date().toISOString(),
    driver_type: DriverType.CONTRACT,
    home_location: 'Delhi, DL'
  },
{
  driver_id: 'd3',
  name: 'Mahesh Patil',
  phone: '+91 98230 77881',
  license_number: 'MH12 20170000987',
  license_expiry_date: '2026-01-10',
  status: DriverStatus.ACTIVE,
  assigned_vehicle_id: 'v4',
  created_at: new Date().toISOString(),
  driver_type: DriverType.PERMANENT,
  home_location: 'Mumbai, MH'
},
{
  driver_id: 'd4',
  name: 'Anil Yadav',
  phone: '+91 99301 22334',
  license_number: 'UP16 20160000444',
  license_expiry_date: '2024-11-05',
  status: DriverStatus.ACTIVE,
  assigned_vehicle_id: 'v5',
  created_at: new Date().toISOString(),
  driver_type: DriverType.CONTRACT,
  home_location: 'Noida, UP'
},
{
  driver_id: 'd5',
  name: 'Ravindra Jadhav',
  phone: '+91 97654 88990',
  license_number: 'MH20 20150000678',
  license_expiry_date: '2025-08-18',
  status: DriverStatus.ACTIVE,
  assigned_vehicle_id: 'v6',
  created_at: new Date().toISOString(),
  driver_type: DriverType.PERMANENT,
  home_location: 'Nashik, MH'
},
{
  driver_id: 'd6',
  name: 'Sunil Chauhan',
  phone: '+91 98987 55443',
  license_number: 'GJ05 20180000321',
  license_expiry_date: '2026-03-30',
  status: DriverStatus.ACTIVE,
  assigned_vehicle_id: 'v7',
  created_at: new Date().toISOString(),
  driver_type: DriverType.CONTRACT,
  home_location: 'Ahmedabad, GJ'
},
{
  driver_id: 'd7',
  name: 'Balwant Singh',
  phone: '+91 94678 11223',
  license_number: 'PB10 20140000888',
  license_expiry_date: '2024-07-12',
  status: DriverStatus.ACTIVE,
  assigned_vehicle_id: 'v8',
  created_at: new Date().toISOString(),
  driver_type: DriverType.PERMANENT,
  home_location: 'Ludhiana, PB'
},
{
  driver_id: 'd8',
  name: 'Kiran Rao',
  phone: '+91 98450 66778',
  license_number: 'KA01 20190000111',
  license_expiry_date: '2025-12-01',
  status: DriverStatus.ACTIVE,
  assigned_vehicle_id: 'v9',
  created_at: new Date().toISOString(),
  driver_type: DriverType.CONTRACT,
  home_location: 'Bengaluru, KA'
},
{
  driver_id: 'd9',
  name: 'Prakash Meena',
  phone: '+91 99822 33445',
  license_number: 'RJ19 20160000555',
  license_expiry_date: '2026-06-22',
  status: DriverStatus.ACTIVE,
  assigned_vehicle_id: 'v10',
  created_at: new Date().toISOString(),
  driver_type: DriverType.PERMANENT,
  home_location: 'Jaipur, RJ'
},
{
  driver_id: 'd10',
  name: 'Dinesh Solanki',
  phone: '+91 99041 77889',
  license_number: 'MP09 20130000999',
  license_expiry_date: '2024-04-14',
  status: DriverStatus.ACTIVE,
  assigned_vehicle_id: 'v11',
  created_at: new Date().toISOString(),
  driver_type: DriverType.CONTRACT,
  home_location: 'Indore, MP'
},
{
  driver_id: 'd11',
  name: 'Arjun Nair',
  phone: '+91 94472 55667',
  license_number: 'KL07 20170000222',
  license_expiry_date: '2025-09-09',
  status: DriverStatus.ACTIVE,
  assigned_vehicle_id: 'v12',
  created_at: new Date().toISOString(),
  driver_type: DriverType.PERMANENT,
  home_location: 'Kochi, KL'
},
{
  driver_id: 'd12',
  name: 'Vijay Kumar',
  phone: '+91 93041 99887',
  license_number: 'BR01 20180000777',
  license_expiry_date: '2026-02-17',
  status: DriverStatus.ACTIVE,
  assigned_vehicle_id: 'v13',
  created_at: new Date().toISOString(),
  driver_type: DriverType.CONTRACT,
  home_location: 'Patna, BR'
},
{
  driver_id: 'd13',
  name: 'Santosh Pawar',
  phone: '+91 98221 33456',
  license_number: 'MH11 20140000135',
  license_expiry_date: '2024-10-28',
  status: DriverStatus.ACTIVE,
  assigned_vehicle_id: 'v2',
  created_at: new Date().toISOString(),
  driver_type: DriverType.PERMANENT,
  home_location: 'Satara, MH'
},
{
  driver_id: 'd14',
  name: 'Imran Khan',
  phone: '+91 98910 44321',
  license_number: 'DL01 20190000876',
  license_expiry_date: '2025-07-19',
  status: DriverStatus.ACTIVE,
  assigned_vehicle_id: 'v6',
  created_at: new Date().toISOString(),
  driver_type: DriverType.CONTRACT,
  home_location: 'Ghaziabad, UP'
},
{
  driver_id: 'd15',
  name: 'Rohit Deshmukh',
  phone: '+91 97666 11223',
  license_number: 'MH31 20200000421',
  license_expiry_date: '2027-01-03',
  status: DriverStatus.ACTIVE,
  assigned_vehicle_id: 'v4',
  created_at: new Date().toISOString(),
  driver_type: DriverType.PERMANENT,
  home_location: 'Aurangabad, MH'
}
];

const SEED_BEHAVIOR_EVENTS: DriverBehaviorEvent[] = [
  {
    event_id: 'be1',
    driver_id: 'd1',
    vehicle_id: 'v1',
    event_type: BehaviorEventType.HARSH_BRAKING,
    event_timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    severity: BehaviorSeverity.HIGH,
    source: 'Telematics',
    details: 'Deceleration > 3.5m/s² detected at highway exit ramp.'
  },
  {
    event_id: 'be2',
    driver_id: 'd2',
    vehicle_id: 'v3',
    event_type: BehaviorEventType.OVERSPEED,
    event_timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    severity: BehaviorSeverity.MEDIUM,
    source: 'Telematics',
    details: 'Sustained speed 85 km/h in 60 km/h zone for 45s.'
  },
  {
    event_id: 'be3',
    driver_id: 'd1',
    vehicle_id: 'v1',
    event_type: BehaviorEventType.EXCESSIVE_IDLING,
    event_timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    severity: BehaviorSeverity.LOW,
    source: 'Telematics',
    details: 'Engine idle > 15 mins at unmapped location.'
  },
  {
    event_id: 'be4',
    driver_id: 'd2',
    vehicle_id: 'v3',
    event_type: BehaviorEventType.NIGHT_DRIVING,
    event_timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Yesterday
    severity: BehaviorSeverity.LOW,
    source: 'Telematics',
    details: 'Continuous driving between 02:00 AM and 04:00 AM.'
  },
  {
    event_id: 'be5',
    driver_id: 'd2',
    vehicle_id: 'v3',
    event_type: BehaviorEventType.ROUTE_DEVIATION,
    event_timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    severity: BehaviorSeverity.MEDIUM,
    source: 'Telematics',
    details: 'Deviated 5km from planned geo-corridor.'
  }
];

const SEED_MAINTENANCE_TEMPLATES: MaintenanceTemplate[] = [
  {
    template_id: 'mt1',
    name: 'Heavy Truck - Standard Diesel',
    applicable_vehicle_type: VehicleType.TRUCK,
    items: [
      {
        item_id: 'mti1',
        name: 'Engine Oil Change',
        item_type: 'Service',
        component_type: ComponentType.ENGINE,
        frequency_km: 20000,
        criticality: 'High'
      },
      {
        item_id: 'mti2',
        name: 'Brake Inspection',
        item_type: 'Inspection',
        frequency_km: 10000,
        criticality: 'High'
      }
    ]
  }
];

const SEED_WORK_ORDERS: WorkOrder[] = [
  {
    work_order_id: 'wo1',
    vehicle_id: 'v2',
    issue_type: 'Brake Pad Replacement',
    type: WorkOrderType.REPAIR,
    odometer_reading: 97500,
    workshop_name: 'City Garage Services',
    workshop_type: WorkshopType.THIRD_PARTY,
    start_date: '2024-02-10',
    status: WorkOrderStatus.IN_PROGRESS,
    reported_by: IssueSource.OPS,
    parts_cost_signal: 4500,
    labour_cost_signal: 1200,
    confidence_flag: ConfidenceFlag.ACTUAL
  },
  {
    work_order_id: 'wo2',
    vehicle_id: 'v1',
    issue_type: 'Engine Overheat - Breakdown',
    type: WorkOrderType.BREAKDOWN,
    odometer_reading: 145200,
    workshop_name: 'Highway Rescue 24x7',
    workshop_type: WorkshopType.ROADSIDE,
    start_date: '2024-02-18',
    status: WorkOrderStatus.OPEN,
    reported_by: IssueSource.DRIVER,
    location: 'NH48, Near Satara',
    is_immobilized: true,
    towing_required: true,
    confidence_flag: ConfidenceFlag.ESTIMATED
  }
];

const SEED_COMPONENTS: VehicleComponent[] = [
  {
    component_id: 'c1',
    vehicle_id: 'v1',
    component_type: ComponentType.ENGINE,
    serial_number: 'E987654321',
    make: 'Cummins',
    model: 'ISBe 6.7',
    installation_date: '2022-01-15',
    status: ComponentStatus.ACTIVE,
    remarks: 'OEM Installed'
  }
];

const SEED_ADBLUE_EVENTS: AdBlueEvent[] = [
    { adblue_event_id: 'ae1', vehicle_id: 'v1', event_date: '2024-02-15T10:00:00', quantity_liters: 20, odometer_reading: 25000, vendor_name: 'IOCL Highway', source_type: 'Actual', confidence_flag: ConfidenceFlag.ACTUAL },
    { adblue_event_id: 'ae2', vehicle_id: 'v3', event_date: '2024-02-18T14:00:00', quantity_liters: 5, odometer_reading: 15500, vendor_name: 'Shell', source_type: 'Actual', confidence_flag: ConfidenceFlag.ACTUAL }
];

const SEED_FUEL_EVENTS: FuelEvent[] = [
    { fuel_event_id: 'fe1', vehicle_id: 'v1', event_date: '2024-02-15T10:05:00', fuel_type: FuelType.DIESEL, fuel_quantity_liters: 200, odometer_reading: 25000, fuel_source: 'Pump', vendor_name: 'IOCL Highway', location: 'Pune', total_cost_signal: 19000, confidence_flag: ConfidenceFlag.ACTUAL, source_type: 'Actual' },
    { fuel_event_id: 'fe2', vehicle_id: 'v1', event_date: '2024-02-12T08:00:00', fuel_type: FuelType.DIESEL, fuel_quantity_liters: 180, odometer_reading: 24300, fuel_source: 'Fuel Card', vendor_name: 'HPCL', location: 'Mumbai', total_cost_signal: 17100, confidence_flag: ConfidenceFlag.ACTUAL, source_type: 'Actual' },
    { fuel_event_id: 'fe3', vehicle_id: 'v3', event_date: '2024-02-18T14:05:00', fuel_type: FuelType.DIESEL, fuel_quantity_liters: 300, odometer_reading: 15500, fuel_source: 'Pump', vendor_name: 'Shell', location: 'Gurgaon', total_cost_signal: 28500, confidence_flag: ConfidenceFlag.ACTUAL, source_type: 'Actual' },
    { fuel_event_id: 'fe4', vehicle_id: 'v3', event_date: '2024-02-14T09:00:00', fuel_type: FuelType.DIESEL, fuel_quantity_liters: 280, odometer_reading: 14500, fuel_source: 'Pump', vendor_name: 'Shell', location: 'Jaipur', total_cost_signal: 26600, confidence_flag: ConfidenceFlag.ACTUAL, source_type: 'Actual' }
];

const SEED_TYRE_HEALTH_SIGNALS: TyreHealthSignal[] = [
  { signal_id: 'ths1', vehicle_id: 'v2', tyre_id: 't1', position: 'L1', tread_depth: 3.5, abnormal_wear: true, generated_at: new Date().toISOString() },
  { signal_id: 'ths2', vehicle_id: 'v2', tyre_id: 't2', position: 'R1', tread_depth: 3.2, abnormal_wear: true, generated_at: new Date().toISOString() },
];

const SEED_TYRE_EVENT_SIGNALS: TyreEventSignal[] = [
  { signal_id: 'tes1', event_type: TyreSignalType.BURST, vehicle_id: 'v3', tyre_id: 't9', position: 'R2', severity: 'High', event_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), description: 'Tyre burst on highway' },
];

const SEED_ENERGY_ANOMALIES: EnergyAnomaly[] = [
    {
        anomaly_id: 'ea1',
        vehicle_id: 'v3',
        anomaly_type: EnergyAnomalyType.ADBLUE_UNDER_CONSUMPTION,
        description: 'AdBlue consumption ratio (1.6%) is significantly below target (3-6%) for BS6 vehicle.',
        severity: 'High',
        detected_at: new Date().toISOString(),
        confidence_flag: ConfidenceFlag.HIGH
    }
];

const SEED_ENERGY_MAINTENANCE_SIGNALS: EnergyMaintenanceSignal[] = [
    {
        signal_id: 'ems1',
        vehicle_id: 'v3',
        signal_type: EnergyMaintenanceSignalType.ADBLUE_SYSTEM_CHECK,
        severity: 'High',
        detected_at: new Date().toISOString(),
        description: 'Consistent AdBlue under-consumption detected.',
        recommendation: 'Inspect SCR system and dosing unit for blockages or tampering.',
        linked_exception_id: 'ea1'
    }
];

const SEED_SPARE_PARTS: SparePart[] = [
  { part_id: 'p1', part_name: '15W40 Engine Oil', part_category: PartCategory.FLUID, part_code: 'OIL-15W40-20L', unit_of_measure: 'Liters', is_consumable: true, compatible_vehicle_types: ['Truck', 'Container'], status: 'Active' },
  { part_id: 'p2', part_name: 'Air Filter Type A', part_category: PartCategory.FILTER, part_code: 'FLT-AIR-A', unit_of_measure: 'Nos', is_consumable: true, compatible_vehicle_types: ['Truck'], status: 'Active' },
  { part_id: 'p3', part_name: 'Brake Pad Set (Front)', part_category: PartCategory.BRAKE, part_code: 'BRK-PAD-F', unit_of_measure: 'Set', is_consumable: false, compatible_vehicle_types: ['Truck', 'Trailer'], status: 'Active' },
  { part_id: 'p4', part_name: 'Fuel Filter Primary', part_category: PartCategory.FILTER, part_code: 'FLT-FUEL-P', unit_of_measure: 'Nos', is_consumable: true, compatible_vehicle_types: ['Container'], status: 'Active' },
  { part_id: 'p5', part_name: 'Oil Filter Standard', part_category: PartCategory.FILTER, part_code: 'FLT-OIL-STD', unit_of_measure: 'Nos', is_consumable: true, compatible_vehicle_types: ['Truck'], status: 'Active' },
{ part_id: 'p6', part_name: 'Clutch Plate Assembly', part_category: PartCategory.CLUTCH, part_code: 'CLT-PLT-ASM', unit_of_measure: 'Set', is_consumable: false, compatible_vehicle_types: ['Truck', 'Trailer'], status: 'Active' },
{ part_id: 'p7', part_name: 'Gearbox Oil 80W90', part_category: PartCategory.FLUID, part_code: 'OIL-GBX-80W90', unit_of_measure: 'Liters', is_consumable: true, compatible_vehicle_types: ['Truck'], status: 'Active' },
{ part_id: 'p8', part_name: 'Radiator Coolant', part_category: PartCategory.FLUID, part_code: 'CLT-RAD-20L', unit_of_measure: 'Liters', is_consumable: true, compatible_vehicle_types: ['Truck', 'Container'], status: 'Active' },
{ part_id: 'p9', part_name: 'Alternator Belt', part_category: PartCategory.BELT, part_code: 'BLT-ALT-01', unit_of_measure: 'Nos', is_consumable: false, compatible_vehicle_types: ['Truck'], status: 'Active' },
{ part_id: 'p10', part_name: 'Rear Brake Shoe Set', part_category: PartCategory.BRAKE, part_code: 'BRK-SHOE-R', unit_of_measure: 'Set', is_consumable: false, compatible_vehicle_types: ['Truck', 'Trailer'], status: 'Active' },
{ part_id: 'p11', part_name: 'Hydraulic Oil ISO 68', part_category: PartCategory.FLUID, part_code: 'OIL-HYD-68', unit_of_measure: 'Liters', is_consumable: true, compatible_vehicle_types: ['Trailer'], status: 'Active' },
{ part_id: 'p12', part_name: 'Power Steering Pump', part_category: PartCategory.STEERING, part_code: 'STR-PMP-01', unit_of_measure: 'Nos', is_consumable: false, compatible_vehicle_types: ['Truck'], status: 'Active' },
{ part_id: 'p13', part_name: 'Wheel Bearing Kit', part_category: PartCategory.SUSPENSION, part_code: 'SUS-WHL-BRG', unit_of_measure: 'Set', is_consumable: false, compatible_vehicle_types: ['Truck', 'Trailer'], status: 'Active' },
{ part_id: 'p14', part_name: 'Starter Motor Assembly', part_category: PartCategory.ELECTRICAL, part_code: 'ELC-STR-MTR', unit_of_measure: 'Nos', is_consumable: false, compatible_vehicle_types: ['Truck', 'Container'], status: 'Active' }

];

const SEED_INVENTORY_STOCK: InventoryStock[] = [
  { stock_id: 's1', part_id: 'p1', hub_id: 'Pune Hub', available_quantity: 150, reserved_quantity: 20, minimum_quantity: 50, reorder_quantity: 100, last_updated_at: new Date().toISOString() },
  { stock_id: 's2', part_id: 'p2', hub_id: 'Pune Hub', available_quantity: 8, reserved_quantity: 2, minimum_quantity: 10, reorder_quantity: 20, last_updated_at: new Date().toISOString() },
  { stock_id: 's3', part_id: 'p3', hub_id: 'Pune Hub', available_quantity: 25, reserved_quantity: 0, minimum_quantity: 5, reorder_quantity: 10, last_updated_at: new Date().toISOString() },
  { stock_id: 's4', part_id: 'p4', hub_id: 'Pune Hub', available_quantity: 60, reserved_quantity: 5, minimum_quantity: 20, reorder_quantity: 40, last_updated_at: new Date().toISOString() },
{ stock_id: 's5', part_id: 'p5', hub_id: 'Pune Hub', available_quantity: 12, reserved_quantity: 3, minimum_quantity: 15, reorder_quantity: 30, last_updated_at: new Date().toISOString() },
{ stock_id: 's6', part_id: 'p6', hub_id: 'Pune Hub', available_quantity: 90, reserved_quantity: 10, minimum_quantity: 30, reorder_quantity: 60, last_updated_at: new Date().toISOString() },
{ stock_id: 's7', part_id: 'p7', hub_id: 'Pune Hub', available_quantity: 4, reserved_quantity: 1, minimum_quantity: 10, reorder_quantity: 25, last_updated_at: new Date().toISOString() },
{ stock_id: 's8', part_id: 'p8', hub_id: 'Pune Hub', available_quantity: 200, reserved_quantity: 35, minimum_quantity: 80, reorder_quantity: 150, last_updated_at: new Date().toISOString() },
{ stock_id: 's9', part_id: 'p9', hub_id: 'Pune Hub', available_quantity: 18, reserved_quantity: 4, minimum_quantity: 20, reorder_quantity: 40, last_updated_at: new Date().toISOString() },
{ stock_id: 's10', part_id: 'p10', hub_id: 'Pune Hub', available_quantity: 55, reserved_quantity: 5, minimum_quantity: 25, reorder_quantity: 50, last_updated_at: new Date().toISOString() },
{ stock_id: 's11', part_id: 'p11', hub_id: 'Pune Hub', available_quantity: 7, reserved_quantity: 2, minimum_quantity: 10, reorder_quantity: 20, last_updated_at: new Date().toISOString() },
{ stock_id: 's12', part_id: 'p12', hub_id: 'Pune Hub', available_quantity: 130, reserved_quantity: 15, minimum_quantity: 60, reorder_quantity: 120, last_updated_at: new Date().toISOString() },
{ stock_id: 's13', part_id: 'p13', hub_id: 'Pune Hub', available_quantity: 22, reserved_quantity: 0, minimum_quantity: 8, reorder_quantity: 16, last_updated_at: new Date().toISOString() }

];

const SEED_WORK_ORDER_PARTS: WorkOrderPart[] = [
    { wo_part_id: 'wop1', work_order_id: 'wo1', part_id: 'p3', quantity_required: 1, quantity_issued: 1, quantity_consumed: 0, status: WorkOrderPartStatus.ISSUED, hub_id: 'Pune Hub' }
];

const SEED_REORDER_ALERTS: ReorderAlert[] = [
    { 
        alert_id: 'ra1', 
        part_id: 'p2', 
        hub_id: 'Pune Hub', 
        current_quantity: 8, 
        minimum_quantity: 10, 
        suggested_reorder_quantity: 20, 
        status: ReorderStatus.OPEN, 
        created_at: new Date().toISOString() 
    }
];

const SEED_RECONCILIATION_RECORDS: ReconciliationRecord[] = [
    {
        reconciliation_id: 'rec1',
        vehicle_id: 'v1',
        period_start: '2024-02-01',
        period_end: '2024-02-29',
        total_cost_events: 12,
        estimated_events_count: 3,
        variance_amount: 4500,
        confidence_score: 'Medium',
        status: ReconciliationStatus.OPEN,
        notes: 'Variance in fuel costs vs estimated mileage.'
    },
    {
        reconciliation_id: 'rec2',
        vehicle_id: 'v3',
        period_start: '2024-02-01',
        period_end: '2024-02-29',
        total_cost_events: 8,
        estimated_events_count: 0,
        variance_amount: 0,
        confidence_score: 'High',
        status: ReconciliationStatus.RECONCILED,
        reconciled_by: 'System Auto-Match',
        reconciled_at: '2024-03-01T09:00:00Z'
    }
];

const SEED_DOCUMENTS: VehicleDocument[] = [
    { document_id: 'doc1', vehicle_id: 'v1', document_type: DocumentType.RC, document_number: 'MH46BM2849', issue_date: '2022-01-15', expiry_date: '2037-01-14', status: DocumentStatus.VALID, uploaded_by: 'System' },
    { document_id: 'doc2', vehicle_id: 'v1', document_type: DocumentType.INSURANCE, document_number: 'POL-123456789', issue_date: '2023-05-20', expiry_date: '2024-05-19', status: DocumentStatus.VALID, uploaded_by: 'System' },
    { document_id: 'doc3', vehicle_id: 'v1', document_type: DocumentType.PUC, document_number: 'PUC-98765', issue_date: '2023-11-10', expiry_date: '2024-05-10', status: DocumentStatus.VALID, uploaded_by: 'System' },
    { document_id: 'doc4', vehicle_id: 'v2', document_type: DocumentType.FITNESS, document_number: 'FIT-554433', issue_date: '2022-06-01', expiry_date: '2024-01-01', status: DocumentStatus.EXPIRED, uploaded_by: 'System' },
    { document_id: 'doc5', vehicle_id: 'v3', document_type: DocumentType.PERMIT, document_number: 'NP-112233', issue_date: '2023-01-01', expiry_date: '2028-01-01', status: DocumentStatus.VALID, uploaded_by: 'System' },
];

const SEED_TELEMETRY: TelemetryEvent[] = [
    { event_id: 't1', vehicle_id: 'v1', event_timestamp: new Date().toISOString(), latitude: 18.5204, longitude: 73.8567, speed: 45, ignition_status: true },
    { event_id: 't2', vehicle_id: 'v1', event_timestamp: new Date(Date.now() - 300000).toISOString(), latitude: 18.5100, longitude: 73.8500, speed: 40, ignition_status: true },
    { event_id: 't3', vehicle_id: 'v1', event_timestamp: new Date(Date.now() - 600000).toISOString(), latitude: 18.5000, longitude: 73.8400, speed: 0, ignition_status: false }, // Stopped
    { event_id: 't4', vehicle_id: 'v3', event_timestamp: new Date().toISOString(), latitude: 28.7041, longitude: 77.1025, speed: 60, ignition_status: true },
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class MockDatabase {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem('optimile_vehicles')) localStorage.setItem('optimile_vehicles', JSON.stringify(SEED_VEHICLES));
    if (!localStorage.getItem('optimile_drivers')) localStorage.setItem('optimile_drivers', JSON.stringify(SEED_DRIVERS));
    if (!localStorage.getItem('optimile_work_orders')) localStorage.setItem('optimile_work_orders', JSON.stringify(SEED_WORK_ORDERS));
    if (!localStorage.getItem('optimile_templates')) localStorage.setItem('optimile_templates', JSON.stringify(SEED_MAINTENANCE_TEMPLATES));
    if (!localStorage.getItem('optimile_components')) localStorage.setItem('optimile_components', JSON.stringify(SEED_COMPONENTS));
    if (!localStorage.getItem('optimile_fuel_events')) localStorage.setItem('optimile_fuel_events', JSON.stringify(SEED_FUEL_EVENTS));
    if (!localStorage.getItem('optimile_adblue_events')) localStorage.setItem('optimile_adblue_events', JSON.stringify(SEED_ADBLUE_EVENTS));
    if (!localStorage.getItem('optimile_tyre_health')) localStorage.setItem('optimile_tyre_health', JSON.stringify(SEED_TYRE_HEALTH_SIGNALS));
    if (!localStorage.getItem('optimile_tyre_events')) localStorage.setItem('optimile_tyre_events', JSON.stringify(SEED_TYRE_EVENT_SIGNALS));
    if (!localStorage.getItem('optimile_exceptions')) localStorage.setItem('optimile_exceptions', JSON.stringify([]));
    if (!localStorage.getItem('optimile_energy_anomalies')) localStorage.setItem('optimile_energy_anomalies', JSON.stringify(SEED_ENERGY_ANOMALIES));
    if (!localStorage.getItem('optimile_energy_maintenance_signals')) localStorage.setItem('optimile_energy_maintenance_signals', JSON.stringify(SEED_ENERGY_MAINTENANCE_SIGNALS));
    if (!localStorage.getItem('optimile_spare_parts')) localStorage.setItem('optimile_spare_parts', JSON.stringify(SEED_SPARE_PARTS));
    if (!localStorage.getItem('optimile_inventory_stock')) localStorage.setItem('optimile_inventory_stock', JSON.stringify(SEED_INVENTORY_STOCK));
    if (!localStorage.getItem('optimile_inventory_movements')) localStorage.setItem('optimile_inventory_movements', JSON.stringify([]));
    if (!localStorage.getItem('optimile_work_order_parts')) localStorage.setItem('optimile_work_order_parts', JSON.stringify(SEED_WORK_ORDER_PARTS));
    if (!localStorage.getItem('optimile_reorder_alerts')) localStorage.setItem('optimile_reorder_alerts', JSON.stringify(SEED_REORDER_ALERTS));
    // Seed behavior events
    if (!localStorage.getItem('optimile_behavior_events')) localStorage.setItem('optimile_behavior_events', JSON.stringify(SEED_BEHAVIOR_EVENTS));
    // Seed reconciliation records
    if (!localStorage.getItem('optimile_reconciliation')) localStorage.setItem('optimile_reconciliation', JSON.stringify(SEED_RECONCILIATION_RECORDS));
    // Seed documents
    if (!localStorage.getItem('optimile_documents')) localStorage.setItem('optimile_documents', JSON.stringify(SEED_DOCUMENTS));
    // Seed telemetry
    if (!localStorage.getItem('optimile_telemetry')) localStorage.setItem('optimile_telemetry', JSON.stringify(SEED_TELEMETRY));
  }

  // --- Getters ---
  getVehicles(): Vehicle[] { return JSON.parse(localStorage.getItem('optimile_vehicles') || '[]'); }
  getDrivers(): Driver[] { return JSON.parse(localStorage.getItem('optimile_drivers') || '[]'); }
  getWorkOrders(): WorkOrder[] { return JSON.parse(localStorage.getItem('optimile_work_orders') || '[]'); }
  getTemplates(): MaintenanceTemplate[] { return JSON.parse(localStorage.getItem('optimile_templates') || '[]'); }
  getComponents(): VehicleComponent[] { return JSON.parse(localStorage.getItem('optimile_components') || '[]'); }
  getFuelEvents(): FuelEvent[] { return JSON.parse(localStorage.getItem('optimile_fuel_events') || '[]'); }
  getAdBlueEvents(): AdBlueEvent[] { return JSON.parse(localStorage.getItem('optimile_adblue_events') || '[]'); }
  getTyreHealthSignals(): TyreHealthSignal[] { return JSON.parse(localStorage.getItem('optimile_tyre_health') || '[]'); }
  getTyreEventSignals(): TyreEventSignal[] { return JSON.parse(localStorage.getItem('optimile_tyre_events') || '[]'); }
  getExceptions(): OpsException[] { return JSON.parse(localStorage.getItem('optimile_exceptions') || '[]'); }
  getEnergyAnomalies(): EnergyAnomaly[] { return JSON.parse(localStorage.getItem('optimile_energy_anomalies') || '[]'); }
  getEnergyMaintenanceSignals(): EnergyMaintenanceSignal[] { return JSON.parse(localStorage.getItem('optimile_energy_maintenance_signals') || '[]'); }
  getSpareParts(): SparePart[] { return JSON.parse(localStorage.getItem('optimile_spare_parts') || '[]'); }
  getInventoryStock(): InventoryStock[] { return JSON.parse(localStorage.getItem('optimile_inventory_stock') || '[]'); }
  getInventoryMovements(): InventoryMovement[] { return JSON.parse(localStorage.getItem('optimile_inventory_movements') || '[]'); }
  getWorkOrderParts(): WorkOrderPart[] { return JSON.parse(localStorage.getItem('optimile_work_order_parts') || '[]'); }
  getReorderAlerts(): ReorderAlert[] { return JSON.parse(localStorage.getItem('optimile_reorder_alerts') || '[]'); }
  getBehaviorEvents(): DriverBehaviorEvent[] { return JSON.parse(localStorage.getItem('optimile_behavior_events') || '[]'); }
  getReconciliationRecords(): ReconciliationRecord[] { return JSON.parse(localStorage.getItem('optimile_reconciliation') || '[]'); }
  getDocuments(): VehicleDocument[] { return JSON.parse(localStorage.getItem('optimile_documents') || '[]'); }
  getTelemetry(): TelemetryEvent[] { return JSON.parse(localStorage.getItem('optimile_telemetry') || '[]'); }

  // --- Savers ---
  saveVehicles(data: Vehicle[]) { localStorage.setItem('optimile_vehicles', JSON.stringify(data)); }
  saveDrivers(data: Driver[]) { localStorage.setItem('optimile_drivers', JSON.stringify(data)); }
  saveWorkOrders(data: WorkOrder[]) { localStorage.setItem('optimile_work_orders', JSON.stringify(data)); }
  saveTemplates(data: MaintenanceTemplate[]) { localStorage.setItem('optimile_templates', JSON.stringify(data)); }
  saveFuelEvents(data: FuelEvent[]) { localStorage.setItem('optimile_fuel_events', JSON.stringify(data)); }
  saveAdBlueEvents(data: AdBlueEvent[]) { localStorage.setItem('optimile_adblue_events', JSON.stringify(data)); }
  saveExceptions(data: OpsException[]) { localStorage.setItem('optimile_exceptions', JSON.stringify(data)); }
  saveEnergyAnomalies(data: EnergyAnomaly[]) { localStorage.setItem('optimile_energy_anomalies', JSON.stringify(data)); }
  saveEnergyMaintenanceSignals(data: EnergyMaintenanceSignal[]) { localStorage.setItem('optimile_energy_maintenance_signals', JSON.stringify(data)); }
  saveSpareParts(data: SparePart[]) { localStorage.setItem('optimile_spare_parts', JSON.stringify(data)); }
  saveInventoryStock(data: InventoryStock[]) { localStorage.setItem('optimile_inventory_stock', JSON.stringify(data)); }
  saveInventoryMovements(data: InventoryMovement[]) { localStorage.setItem('optimile_inventory_movements', JSON.stringify(data)); }
  saveWorkOrderParts(data: WorkOrderPart[]) { localStorage.setItem('optimile_work_order_parts', JSON.stringify(data)); }
  saveReorderAlerts(data: ReorderAlert[]) { localStorage.setItem('optimile_reorder_alerts', JSON.stringify(data)); }
  saveBehaviorEvents(data: DriverBehaviorEvent[]) { localStorage.setItem('optimile_behavior_events', JSON.stringify(data)); }
  saveReconciliationRecords(data: ReconciliationRecord[]) { localStorage.setItem('optimile_reconciliation', JSON.stringify(data)); }
  saveDocuments(data: VehicleDocument[]) { localStorage.setItem('optimile_documents', JSON.stringify(data)); }
  saveTelemetry(data: TelemetryEvent[]) { localStorage.setItem('optimile_telemetry', JSON.stringify(data)); }
}

const db = new MockDatabase();

// ... [Existing APIs]

export const InventoryAPI = {
    getParts: async (): Promise<SparePart[]> => {
        await delay(400);
        return db.getSpareParts();
    },
    createPart: async (part: any) => {
        await delay(500);
        const newPart = { ...part, part_id: crypto.randomUUID() };
        const all = db.getSpareParts();
        db.saveSpareParts([...all, newPart]);
        return newPart;
    },
    getStock: async (hubId?: string): Promise<InventoryStock[]> => {
        await delay(400);
        const stock = db.getInventoryStock();
        return hubId ? stock.filter(s => s.hub_id === hubId) : stock;
    },
    getMovements: async (partId?: string, hubId?: string): Promise<InventoryMovement[]> => {
        await delay(400);
        let movs = db.getInventoryMovements();
        if (partId) movs = movs.filter(m => m.part_id === partId);
        if (hubId) movs = movs.filter(m => m.hub_id === hubId);
        return movs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    getReorderAlerts: async (hubId?: string): Promise<ReorderAlert[]> => {
        await delay(300);
        let alerts = db.getReorderAlerts();
        if (hubId) alerts = alerts.filter(a => a.hub_id === hubId);
        return alerts.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    updateAlertStatus: async (alertId: string, status: ReorderStatus) => {
        await delay(300);
        const all = db.getReorderAlerts();
        const idx = all.findIndex(a => a.alert_id === alertId);
        if (idx !== -1) {
            all[idx].status = status;
            db.saveReorderAlerts(all);
        }
    },
    runReorderScan: async () => {
        // Internal Logic to check stock vs min and generate alerts + exceptions
        const stock = db.getInventoryStock();
        const parts = db.getSpareParts();
        const existingAlerts = db.getReorderAlerts();
        const exceptions = db.getExceptions();
        const newAlerts: ReorderAlert[] = [];
        
        let alertsChanged = false;
        let exceptionsChanged = false;

        stock.forEach(item => {
            if (item.available_quantity <= item.minimum_quantity) {
                // Check if alert exists
                const existing = existingAlerts.find(a => a.part_id === item.part_id && a.hub_id === item.hub_id && a.status !== ReorderStatus.ORDERED);
                
                if (!existing) {
                    // Create new alert
                    const newAlert: ReorderAlert = {
                        alert_id: crypto.randomUUID(),
                        part_id: item.part_id,
                        hub_id: item.hub_id,
                        current_quantity: item.available_quantity,
                        minimum_quantity: item.minimum_quantity,
                        suggested_reorder_quantity: item.reorder_quantity,
                        status: ReorderStatus.OPEN,
                        created_at: new Date().toISOString()
                    };
                    existingAlerts.push(newAlert);
                    newAlerts.push(newAlert);
                    alertsChanged = true;

                    // Raise Exception
                    const partName = parts.find(p => p.part_id === item.part_id)?.part_name || 'Unknown Part';
                    const exception: OpsException = {
                        exception_id: crypto.randomUUID(),
                        exception_type: 'SPARE_PART_SHORTAGE',
                        entity_type: 'Inventory',
                        entity_id: item.part_id,
                        severity: ExceptionSeverity.HIGH,
                        detected_at: new Date().toISOString(),
                        status: ExceptionStatus.OPEN,
                        source_module: 'Inventory',
                        description: `Low Stock: ${partName} at ${item.hub_id}. Available: ${item.available_quantity}, Min: ${item.minimum_quantity}.`,
                        recommendation: `Procure ${item.reorder_quantity} units immediately to avoid maintenance delays.`
                    };
                    exceptions.push(exception);
                    exceptionsChanged = true;
                }
            }
        });

        if (alertsChanged) db.saveReorderAlerts(existingAlerts);
        if (exceptionsChanged) db.saveExceptions(exceptions);
        
        return newAlerts;
    },
    adjustStock: async (data: { 
        part_id: string, 
        hub_id: string, 
        type: MovementType, 
        quantity: number, 
        reference_type: 'WorkOrder' | 'Manual' | 'Vendor', 
        reference_id: string, 
        performed_by: string,
        reason?: string
    }) => {
        await delay(600);
        const stock = db.getInventoryStock();
        let item = stock.find(s => s.part_id === data.part_id && s.hub_id === data.hub_id);

        if (!item) {
            // Allow creation for IN/Manual, but not OUT
            if (data.type === MovementType.OUT || data.type === MovementType.RESERVE) {
                throw new Error("Cannot transact. Part not found in this Hub.");
            }
            item = {
                stock_id: crypto.randomUUID(),
                part_id: data.part_id,
                hub_id: data.hub_id,
                available_quantity: 0,
                reserved_quantity: 0,
                minimum_quantity: 0,
                reorder_quantity: 0,
                last_updated_at: new Date().toISOString()
            };
            stock.push(item);
        }

        // Transaction Logic
        if (data.type === MovementType.OUT) {
            if (item.available_quantity < data.quantity) {
                throw new Error(`Insufficient stock. Available: ${item.available_quantity}`);
            }
            item.available_quantity -= data.quantity;
        } else if (data.type === MovementType.IN) {
            item.available_quantity += data.quantity;
        } else if (data.type === MovementType.ADJUSTMENT) {
            item.available_quantity += data.quantity; 
            if(item.available_quantity < 0) item.available_quantity = 0; 
        } else if (data.type === MovementType.RESERVE) {
            // Issue: Available -> Reserved
            if (item.available_quantity < data.quantity) {
                throw new Error(`Insufficient available stock to reserve. Available: ${item.available_quantity}`);
            }
            item.available_quantity -= data.quantity;
            item.reserved_quantity += data.quantity;
        } else if (data.type === MovementType.CONSUME_RESERVED) {
            // Consume: Reserved -> Gone
            if (item.reserved_quantity < data.quantity) {
                throw new Error(`Not enough reserved stock to consume. Reserved: ${item.reserved_quantity}`);
            }
            item.reserved_quantity -= data.quantity;
        }

        item.last_updated_at = new Date().toISOString();
        db.saveInventoryStock(stock);

        // Log Movement
        const mov: InventoryMovement = {
            movement_id: crypto.randomUUID(),
            part_id: data.part_id,
            hub_id: data.hub_id,
            movement_type: data.type,
            quantity: data.quantity,
            reference_type: data.reference_type,
            reference_id: data.reference_id,
            performed_by: data.performed_by,
            timestamp: new Date().toISOString(),
            reason: data.reason
        };
        const allMovs = db.getInventoryMovements();
        db.saveInventoryMovements([mov, ...allMovs]);

        // TRIGGER REORDER SCAN if stock reduced
        if ([MovementType.OUT, MovementType.RESERVE, MovementType.CONSUME_RESERVED, MovementType.ADJUSTMENT].includes(data.type)) {
            await InventoryAPI.runReorderScan();
        }
    }
};

// ... [Existing APIs]

export const MaintenanceAPI = { 
    getSchedules: async () => {
        await delay(400);
        const vehicles = db.getVehicles();
        return vehicles.map((v, i) => ({
            schedule_id: `sch_${v.vehicle_id}`,
            vehicle_id: v.vehicle_id,
            maintenance_type: MaintenanceType.SERVICE,
            next_due_km: (i + 1) * 5000,
            next_due_date: i === 1 ? new Date(Date.now() - 5 * 86400000).toISOString() : 
                           i === 2 ? new Date(Date.now() + 3 * 86400000).toISOString() : 
                           new Date(Date.now() + 60 * 86400000).toISOString(),
            status: i === 1 ? 'Overdue' : 'Upcoming'
        } as MaintenanceSchedule));
    }, 
    getWorkOrders: async () => { await delay(500); return db.getWorkOrders(); }, 
    createWorkOrder: async (wo: any) => { 
        await delay(600); 
        const newWo = { ...wo, work_order_id: crypto.randomUUID() }; 
        const all = db.getWorkOrders(); 
        db.saveWorkOrders([newWo, ...all]);
        return newWo;
    }, 
    updateWorkOrder: async (id: string, updates: any) => { 
        await delay(400); 
        const all = db.getWorkOrders(); 
        const index = all.findIndex(w => w.work_order_id === id); 
        if (index === -1) throw new Error("Work Order not found"); 
        
        const updated = { ...all[index], ...updates }; 
        all[index] = updated; 
        db.saveWorkOrders(all); 
        return updated;
    }, 
    getTemplates: async () => { await delay(400); return db.getTemplates(); }, 
    createTemplate: async (template: any) => { 
        await delay(500);
        const newTemplate = { ...template, template_id: crypto.randomUUID() };
        const all = db.getTemplates();
        db.saveTemplates([...all, newTemplate]);
        return newTemplate;
    }, 
    getVehicleSchedule: async (vehicleId: string) => {
        await delay(300);
        const vehicle = db.getVehicles().find(v => v.vehicle_id === vehicleId);
        if (!vehicle || !vehicle.maintenance_template_id) return [];
        const template = db.getTemplates().find(t => t.template_id === vehicle.maintenance_template_id);
        if (!template) return [];
        
        return template.items.map((item, index) => ({
            ...item,
            last_performed_date: new Date(Date.now() - (index + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            last_performed_km: 10000 * (index + 1),
            next_due_date: new Date(Date.now() + (index + 1) * 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            next_due_km: 10000 * (index + 1) + item.frequency_km,
            status: index === 0 ? 'Due' : 'Ok'
        })) as VehicleMaintenanceItem[];
    }, 
    getComponentHistory: async (vehicleId: string) => {
        await delay(300);
        const wos = db.getWorkOrders().filter(w => w.vehicle_id === vehicleId && (w.status === WorkOrderStatus.CLOSED || w.status === WorkOrderStatus.COMPLETED));
        return wos.map(w => ({
            record_id: w.work_order_id,
            vehicle_id: w.vehicle_id,
            component_id: 'generic', 
            work_order_id: w.work_order_id,
            service_date: w.start_date,
            description: w.issue_type,
            odometer: w.odometer_reading
        }));
    }, 
    getVehicleHealth: async (vehicleId: string) => { 
        await delay(300);
        const workOrders = db.getWorkOrders().filter(w => w.vehicle_id === vehicleId);
        
        const now = new Date();
        const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const breakdowns30 = workOrders.filter(w => w.type === WorkOrderType.BREAKDOWN && new Date(w.start_date) >= last30);
        
        let status = MaintenanceHealthStatus.GOOD;
        const factors: string[] = [];

        if (breakdowns30.length > 0) {
            status = MaintenanceHealthStatus.CRITICAL;
            factors.push(`${breakdowns30.length} breakdown(s) in last 30 days`);
        }

        if (factors.length === 0) factors.push('Routine maintenance on track');

        return {
            vehicle_id: vehicleId,
            health_status: status,
            contributing_factors: factors,
            calculated_at: new Date().toISOString()
        };
    }, 
    getDashboardKPIs: async () => { 
        await delay(600);
        const vehicles = db.getVehicles();
        const workOrders = db.getWorkOrders();
        
        const overdueCount = 1; 
        
        const closedWOs = workOrders.filter(w => w.downtime_hours !== undefined);
        const totalDowntime = closedWOs.reduce((sum, w) => sum + (w.downtime_hours || 0), 0);
        const avgDowntime = closedWOs.length > 0 ? totalDowntime / closedWOs.length : 0;

        const now = new Date();
        const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const breakdowns30 = workOrders.filter(w => w.type === WorkOrderType.BREAKDOWN && new Date(w.start_date) >= last30).length;

        const vehicleStats = vehicles.map(v => {
            const vWos = workOrders.filter(w => w.vehicle_id === v.vehicle_id && w.type === WorkOrderType.BREAKDOWN);
            return {
                vehicle_id: v.vehicle_id,
                breakdown_count: vWos.length,
                total_downtime: vWos.reduce((sum, w) => sum + (w.downtime_hours || 0), 0)
            };
        }).sort((a,b) => b.breakdown_count - a.breakdown_count).slice(0, 5).filter(v => v.breakdown_count > 0);

        return {
            overdue_services_count: overdueCount,
            avg_downtime_hours: Math.round(avgDowntime * 10) / 10,
            breakdowns_last_7_days: 0, 
            breakdowns_last_30_days: breakdowns30,
            chronic_vehicles: vehicleStats
        };
    },
    // Parts Integration
    getParts: async (workOrderId: string): Promise<WorkOrderPart[]> => {
        await delay(300);
        return db.getWorkOrderParts().filter(p => p.work_order_id === workOrderId);
    },
    addPart: async (data: Omit<WorkOrderPart, 'wo_part_id' | 'status' | 'quantity_issued' | 'quantity_consumed'>) => {
        await delay(400);
        const newPart: WorkOrderPart = {
            ...data,
            wo_part_id: crypto.randomUUID(),
            status: WorkOrderPartStatus.PLANNED,
            quantity_issued: 0,
            quantity_consumed: 0
        };
        const all = db.getWorkOrderParts();
        db.saveWorkOrderParts([...all, newPart]);
        return newPart;
    },
    issuePart: async (woPartId: string) => {
        await delay(500);
        const all = db.getWorkOrderParts();
        const partIndex = all.findIndex(p => p.wo_part_id === woPartId);
        if (partIndex === -1) throw new Error("Part not found in WO");
        const part = all[partIndex];

        if (part.status !== WorkOrderPartStatus.PLANNED) throw new Error("Part already issued or consumed");

        // Reserve Stock
        await InventoryAPI.adjustStock({
            part_id: part.part_id,
            hub_id: part.hub_id || 'Pune Hub',
            type: MovementType.RESERVE,
            quantity: part.quantity_required,
            reference_type: 'WorkOrder',
            reference_id: part.work_order_id,
            performed_by: 'Current User',
            reason: 'Issued to WO'
        });

        part.status = WorkOrderPartStatus.ISSUED;
        part.quantity_issued = part.quantity_required;
        db.saveWorkOrderParts(all);
        return part;
    },
    consumePart: async (woPartId: string) => {
        await delay(500);
        const all = db.getWorkOrderParts();
        const partIndex = all.findIndex(p => p.wo_part_id === woPartId);
        if (partIndex === -1) throw new Error("Part not found in WO");
        const part = all[partIndex];

        if (part.status !== WorkOrderPartStatus.ISSUED) throw new Error("Part must be issued before consumption");

        // Consume Reserved Stock
        await InventoryAPI.adjustStock({
            part_id: part.part_id,
            hub_id: part.hub_id || 'Pune Hub',
            type: MovementType.CONSUME_RESERVED,
            quantity: part.quantity_issued,
            reference_type: 'WorkOrder',
            reference_id: part.work_order_id,
            performed_by: 'Current User',
            reason: 'Consumed in WO'
        });

        part.status = WorkOrderPartStatus.CONSUMED;
        part.quantity_consumed = part.quantity_issued;
        db.saveWorkOrderParts(all);
        return part;
    }
};

export const VehicleAPI = {
    getAll: async (): Promise<Vehicle[]> => { await delay(500); return db.getVehicles(); },
    getById: async (id: string): Promise<Vehicle | undefined> => { await delay(200); return db.getVehicles().find(v => v.vehicle_id === id); },
    create: async (vehicle: any) => { 
        await delay(500); 
        const newVehicle = { ...vehicle, vehicle_id: crypto.randomUUID(), created_at: new Date().toISOString() };
        const all = db.getVehicles();
        db.saveVehicles([newVehicle, ...all]);
    },
    update: async (id: string, updates: Partial<Vehicle>) => { 
        await delay(500); 
        const all = db.getVehicles(); 
        const index = all.findIndex(v => v.vehicle_id === id); 
        if (index !== -1) { 
            all[index] = { ...all[index], ...updates }; 
            db.saveVehicles(all); 
        } 
        return all[index];
    },
    delete: async (id: string) => { 
        await delay(500); 
        const all = db.getVehicles();
        db.saveVehicles(all.filter(v => v.vehicle_id !== id));
    },
    getBulkTemplate: async () => "#",
    validateBulkImport: async (file: File) => { await delay(1000); return { validCount: 1, errorCount: 0, warningCount: 0, errors: [], parsedData: [] }; },
    importBulk: async (data: any[]) => { await delay(1000); }
};

export const DriverAPI = { 
    getAll: async (): Promise<Driver[]> => { await delay(500); return db.getDrivers(); }, 
    getById: async (id: string): Promise<Driver | undefined> => { await delay(200); return db.getDrivers().find(d => d.driver_id === id); }, 
    create: async (data: any) => { 
        await delay(500); 
        const newDriver = { ...data, driver_id: crypto.randomUUID(), created_at: new Date().toISOString() };
        const all = db.getDrivers();
        db.saveDrivers([newDriver, ...all]);
        return newDriver;
    }, 
    update: async (id: string, updates: any) => { 
        await delay(500); 
        const all = db.getDrivers();
        const index = all.findIndex(d => d.driver_id === id);
        if (index !== -1) {
            all[index] = { ...all[index], ...updates };
            db.saveDrivers(all);
        }
        return all[index];
    }, 
    getBulkTemplate: async () => "#", 
    validateBulkImport: async (file: File) => { await delay(1000); return ({ validCount: 0, errorCount: 0, warningCount: 0, errors: [], parsedData: [] }); }, 
    importBulk: async (data: any[]) => { await delay(1000); } 
};

export const TripAPI = { 
    getAll: async (): Promise<Trip[]> => { await delay(500); return []; }, 
    getById: async (id: string): Promise<Trip | undefined> => { await delay(200); return undefined; }, 
    create: async (trip: any) => { await delay(500); return {} as any; }, 
    update: async (id: string, updates: any) => { await delay(500); return {} as any; } 
};

export const CostAPI = { getEvents: async () => [] };

export const TelematicsAPI = { 
    getLatestEvents: async () => [], 
    getHistory: async (vehicleId?: string) => {
        await delay(200);
        const history = db.getTelemetry();
        return vehicleId ? history.filter(h => h.vehicle_id === vehicleId) : history;
    }, 
    getVehicleStatus: async (vehicleId: string) => null 
};

export const ComplianceAPI = { 
    getAllDocuments: async () => {
        await delay(300);
        return db.getDocuments();
    }, 
    getDocuments: async (vehicleId?: string) => {
        await delay(300);
        const docs = db.getDocuments();
        return vehicleId ? docs.filter(d => d.vehicle_id === vehicleId) : docs;
    }, 
    uploadDocument: async (data: any) => {
        await delay(400);
        const newDoc = { ...data, document_id: crypto.randomUUID() };
        const all = db.getDocuments();
        db.saveDocuments([...all, newDoc]);
        return newDoc;
    } 
};

export const DriverComplianceAPI = { 
    getAllDocuments: async (): Promise<DriverDocument[]> => [], 
    getDocuments: async (_driverId: string): Promise<DriverDocument[]> => [], 
    uploadDocument: async (
        data: Omit<DriverDocument, 'document_id' | 'status'> & Partial<Pick<DriverDocument, 'status'>>
    ): Promise<DriverDocument> => ({
        ...data,
        document_id: crypto.randomUUID(),
        status: data.status ?? DocumentStatus.VALID
    }) 
};

export const BehaviorAPI = { 
    getEvents: async (): Promise<DriverBehaviorEvent[]> => {
        await delay(400);
        return db.getBehaviorEvents().sort((a,b) => new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime());
    } 
};

export const ExceptionAPI = { 
    getAll: async () => {
        await delay(500);
        return db.getExceptions();
    }, 
    updateStatus: async (id: string, status: string, notes?: string) => {
        const all = db.getExceptions();
        const idx = all.findIndex(e => e.exception_id === id);
        if (idx !== -1) {
            all[idx] = { ...all[idx], status: status as ExceptionStatus, resolution_notes: notes };
            db.saveExceptions(all);
        }
    }, 
    assignOwner: async (id: string, owner: string) => {} 
};

export const ConfidenceAPI = { 
    getVehicleConfidence: async (vehicleId: string) => ({ score: 'High' as any, details: [] } as any) 
};

export const OpsAPI = {
    getKPIs: async (): Promise<OpsKPIs> => {
        await delay(800);
        const vehicles = db.getVehicles();
        const exceptions = db.getExceptions();
        const fuelEvents = db.getFuelEvents(); // Needed for Cost Confidence proxy

        const totalVehicles = vehicles.length;
        const activeVehicles = vehicles.filter(v => v.status === VehicleStatus.ACTIVE).length;
        
        // Fleet Availability
        const availability = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;

        // Compliance Rate (Mock: Assume 90% for now or calculate based on documents if available)
        const complianceRate = 92; 

        // Critical Exceptions
        const criticalExceptions = exceptions.filter(e => e.severity === ExceptionSeverity.CRITICAL && e.status === ExceptionStatus.OPEN).length;

        // Cost Confidence (Proxy: High confidence flags / total fuel events)
        const highConfEvents = fuelEvents.filter(e => e.confidence_flag === ConfidenceFlag.ACTUAL || e.confidence_flag === ConfidenceFlag.HIGH).length;
        const costConfidence = fuelEvents.length > 0 ? Math.round((highConfEvents / fuelEvents.length) * 100) : 85; // Default to 85 if no data

        return {
            fleet_availability: availability,
            compliance_rate: complianceRate,
            open_critical_exceptions: criticalExceptions,
            cost_confidence: costConfidence,
            active_vehicles: activeVehicles
        };
    } 
};

export const DataCoverageAPI = { getAll: async () => [] };

export const ReconciliationAPI = { 
    getAll: async () => {
        await delay(600);
        return db.getReconciliationRecords();
    }, 
    updateStatus: async (id: string, status: string, notes?: string) => {
        await delay(400);
        const all = db.getReconciliationRecords();
        const idx = all.findIndex(r => r.reconciliation_id === id);
        if (idx !== -1) {
            all[idx].status = status as ReconciliationStatus;
            if (notes) all[idx].notes = notes;
            if (status === ReconciliationStatus.RECONCILED) {
                all[idx].reconciled_at = new Date().toISOString();
                all[idx].reconciled_by = 'Current User';
            }
            db.saveReconciliationRecords(all);
        }
    } 
};

export const HumanReviewAPI = { 
    logAction: async (action: any) => {} 
};

export const ComponentAPI = { 
    getByVehicleId: async (vehicleId: string) => db.getComponents().filter(c => c.vehicle_id === vehicleId), 
    add: async (data: any) => {
        // Mock add
        return data;
    } 
};

export const DriverLicenseAPI = { 
    getByDriverId: async (driverId: string) => [], 
    add: async (data: any) => ({}) as any 
};

export const DriverSkillAPI = { 
    getByDriverId: async (driverId: string) => [], 
    add: async (data: any) => ({}) as any 
};

export const TyreAPI = { 
    getHealthSignals: async (vehicleId?: string) => {
        await delay(300);
        const signals = db.getTyreHealthSignals();
        return vehicleId ? signals.filter(s => s.vehicle_id === vehicleId) : signals;
    }, 
    getEventSignals: async (vehicleId?: string) => {
        await delay(300);
        const signals = db.getTyreEventSignals();
        return vehicleId ? signals.filter(s => s.vehicle_id === vehicleId) : signals;
    } 
};

export const FuelAPI = {
    getEvents: async (): Promise<FuelEvent[]> => {
        await delay(400);
        return db.getFuelEvents();
    },
    addEvent: async (data: Omit<FuelEvent, 'fuel_event_id'>) => {
        await delay(500);
        const newEvent = { ...data, fuel_event_id: crypto.randomUUID() } as FuelEvent;
        const all = db.getFuelEvents();
        db.saveFuelEvents([newEvent, ...all]);
        return newEvent;
    }
};

export const AdBlueAPI = {
    getEvents: async (): Promise<AdBlueEvent[]> => {
        await delay(400);
        return db.getAdBlueEvents();
    },
    addEvent: async (data: Omit<AdBlueEvent, 'adblue_event_id'>) => {
        await delay(500);
        const newEvent = { ...data, adblue_event_id: crypto.randomUUID() } as AdBlueEvent;
        const all = db.getAdBlueEvents();
        db.saveAdBlueEvents([newEvent, ...all]);
        return newEvent;
    }
};

export const EnergyAPI = {
    getMetrics: async (vehicleId: string): Promise<EnergyMetrics> => {
        await delay(300);
        const fuelEvents = db.getFuelEvents().filter(e => e.vehicle_id === vehicleId);
        const adBlueEvents = db.getAdBlueEvents().filter(e => e.vehicle_id === vehicleId);
        
        const totalFuel = fuelEvents.reduce((acc, curr) => acc + curr.fuel_quantity_liters, 0);
        const totalAdBlue = adBlueEvents.reduce((acc, curr) => acc + curr.quantity_liters, 0);
        
        const avgKmpl = fuelEvents.length > 0 ? 3.5 : 0; // Simplified mock
        const ratio = totalFuel > 0 ? (totalAdBlue / totalFuel) * 100 : 0;

        return {
            vehicle_id: vehicleId,
            avg_km_per_liter: parseFloat(avgKmpl.toFixed(2)),
            adblue_to_fuel_ratio_pct: parseFloat(ratio.toFixed(2)),
            fuel_cost_per_km: 25.0,
            last_calculated_at: new Date().toISOString()
        };
    },
    getAnomalies: async (vehicleId?: string): Promise<EnergyAnomaly[]> => {
        await delay(400);
        const anomalies = db.getEnergyAnomalies();
        return vehicleId ? anomalies.filter(a => a.vehicle_id === vehicleId) : anomalies;
    },
    getMaintenanceSignals: async (): Promise<EnergyMaintenanceSignal[]> => {
        await delay(400);
        return db.getEnergyMaintenanceSignals();
    }
};

export const SyncAPI = { 
    getLiveStatus: async () => [], 
    getComplianceStatus: async () => [], 
    getBehaviorEvents: async () => [], 
    getExceptions: async () => [], 
    getOpsKPIs: async () => ({}), 
    getReconciliationData: async () => [], 
    getVehicleMaintenanceHealth: async () => [], 
    getMaintenanceEvents: async () => [], 
    getTyreMaintenanceSignals: async () => ({}) as any,
    
    // TMS Sync Read-Only
    getEnergySummary: async (): Promise<EnergySyncSummary[]> => {
        await delay(500);
        const vehicles = db.getVehicles();
        const results: EnergySyncSummary[] = [];
        for (const v of vehicles) {
            const metrics = await EnergyAPI.getMetrics(v.vehicle_id);
            const anomalies = await EnergyAPI.getAnomalies(v.vehicle_id);
            results.push({
                vehicle_id: v.vehicle_id,
                avg_kpl: metrics.avg_km_per_liter,
                adblue_compliance_status: anomalies.some(a => a.anomaly_type.includes('AdBlue')) ? 'Non-Compliant' : 'Compliant',
                active_anomalies_count: anomalies.length
            });
        }
        return results;
    },
    getEnergyAnomalies: async (): Promise<EnergyAnomaly[]> => {
        await delay(400);
        return db.getEnergyAnomalies();
    }
};
