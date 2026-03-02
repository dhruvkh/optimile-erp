import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleStatus, ExceptionSeverity, DocumentStatus, MaintenanceHealthStatus } from '../types';
import { VehicleAPI, ExceptionAPI, MaintenanceAPI, EnergyAPI, ComplianceAPI, ConfidenceAPI, SyncAPI, TyreAPI } from '../services/mockDatabase';
import { IconCheck, IconAlert, IconWrench, IconZap, IconShield, IconCircleDollar, IconTruck, IconArrowRight, IconSiren, IconTrendDown, IconTrendUp, IconMapPin, IconDroplet, IconTyre } from '../components/Icons';
import { Badge } from '../components/UI';
import { VehicleDetailsPage } from './VehicleDetailsPage';

interface DashboardPageProps {
  onNavigate: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  
  // KPIs
  const [kpiData, setKpiData] = useState({
    availabilityPct: 0,
    vehiclesAtRisk: 0,
    costHealth: { healthy: 0, watch: 0, critical: 0 },
    energyRiskCount: 0,
    maintenanceDueCount: 0,
    totalFleet: 0
  });

  // Intelligence Data
  const [intelData, setIntelData] = useState({
      avgKmpl: '0.0',
      adBlueCompliance: 0,
      chronicBreakdowns: 0,
      tyreAlerts: 0
  });

  // Snapshot Buckets & Vehicles for Map
  const [buckets, setBuckets] = useState({
    healthy: 0,
    atRisk: 0,
    maintenance: 0,
    nonCompliant: 0,
    offline: 0
  });
  const [mapVehicles, setMapVehicles] = useState<{ vehicle: Vehicle, status: string }[]>([]);

  // Live Alerts
  const [liveAlerts, setLiveAlerts] = useState<{ id: string, message: string, severity: 'Critical' | 'High' | 'Medium', type: string }[]>([]);

  useEffect(() => {
    loadHealthData();
    // Simulate live refresh
    const interval = setInterval(loadHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHealthData = async () => {
    setLoading(true);
    try {
      const [vehicles, exceptions, schedules, energyAnomalies, documents, energySync, maintKPIs, tyreSignals] = await Promise.all([
        VehicleAPI.getAll(),
        ExceptionAPI.getAll(),
        MaintenanceAPI.getSchedules(),
        EnergyAPI.getAnomalies(),
        ComplianceAPI.getAllDocuments(),
        SyncAPI.getEnergySummary(),
        MaintenanceAPI.getDashboardKPIs(),
        TyreAPI.getHealthSignals()
      ]);

      // --- 1. KPI Calculations ---
      
      const totalVehicles = vehicles.length;
      
      // Filter Active & Compliant
      const nonCompliantVehicleIds = new Set(
          documents.filter(d => d.status !== DocumentStatus.VALID).map(d => d.vehicle_id)
      );
      
      const availableVehicles = vehicles.filter(v => 
          v.status === VehicleStatus.ACTIVE && !nonCompliantVehicleIds.has(v.vehicle_id)
      ).length;

      const availabilityPct = totalVehicles > 0 ? Math.round((availableVehicles / totalVehicles) * 100) : 0;

      // Vehicles at Risk (Exceptions)
      const riskyVehicleIds = new Set(
          exceptions.filter(e => e.severity === ExceptionSeverity.CRITICAL || e.severity === ExceptionSeverity.HIGH).map(e => e.entity_id)
      );
      const vehiclesAtRisk = riskyVehicleIds.size;

      // Energy Risk
      const energyRiskVehicleIds = new Set(energyAnomalies.map(a => a.vehicle_id));
      const energyRiskCount = energyRiskVehicleIds.size;

      // Maintenance Due
      const maintenanceDueCount = schedules.filter(s => s.status === 'Due' || s.status === 'Overdue').length;

      // Cost Health (Mock logic based on Confidence)
      let costHealthy = 0, costWatch = 0, costCritical = 0;
      // We can iterate energySync for faster compliance/cost checks if extended, 
      // but sticking to mock logic for cost health
      await Promise.all(vehicles.map(async v => {
          const conf = await ConfidenceAPI.getVehicleConfidence(v.vehicle_id);
          if (conf.score === 'High') costHealthy++;
          else if (conf.score === 'Medium') costWatch++;
          else costCritical++;
      }));

      setKpiData({
        availabilityPct,
        vehiclesAtRisk,
        costHealth: { healthy: costHealthy, watch: costWatch, critical: costCritical },
        energyRiskCount,
        maintenanceDueCount,
        totalFleet: totalVehicles
      });

      // --- 2. Intelligence Data ---
      const totalKmpl = energySync.reduce((acc, curr) => acc + curr.avg_kpl, 0);
      const avgKmpl = energySync.length > 0 ? (totalKmpl / energySync.length).toFixed(1) : '0.0';
      
      const compliantAdBlue = energySync.filter(s => s.adblue_compliance_status === 'Compliant').length;
      const adBlueCompliance = energySync.length > 0 ? Math.round((compliantAdBlue / energySync.length) * 100) : 0;

      const tyreAlertVehicles = new Set(tyreSignals.filter(s => s.abnormal_wear).map(s => s.vehicle_id));

      setIntelData({
          avgKmpl,
          adBlueCompliance,
          chronicBreakdowns: maintKPIs.chronic_vehicles.length,
          tyreAlerts: tyreAlertVehicles.size
      });

      // --- 3. Fleet Status Buckets & Map Prep ---
      let bHealthy = 0, bRisk = 0, bMaint = 0, bNonComp = 0, bOffline = 0;
      const mapData: { vehicle: Vehicle, status: string }[] = [];

      vehicles.forEach(v => {
          let status = 'healthy';
          if (v.status === VehicleStatus.MAINTENANCE) {
              bMaint++;
              status = 'maintenance';
          } else if (v.status === VehicleStatus.INACTIVE || v.status === VehicleStatus.DRAFT) {
              bOffline++; // Treating inactive/draft as offline/parked
              status = 'offline';
          } else if (nonCompliantVehicleIds.has(v.vehicle_id)) {
              bNonComp++;
              status = 'nonCompliant';
          } else if (riskyVehicleIds.has(v.vehicle_id) || energyRiskVehicleIds.has(v.vehicle_id)) {
              bRisk++;
              status = 'atRisk';
          } else {
              bHealthy++;
          }
          mapData.push({ vehicle: v, status });
      });

      setBuckets({
          healthy: bHealthy,
          atRisk: bRisk,
          maintenance: bMaint,
          nonCompliant: bNonComp,
          offline: bOffline
      });
      setMapVehicles(mapData);

      // --- 4. Live Alerts Generation ---
      const alerts: any[] = [];
      
      // Energy Alerts
      energyAnomalies.forEach(a => {
          const v = vehicles.find(veh => veh.vehicle_id === a.vehicle_id);
          alerts.push({
              id: a.anomaly_id,
              message: `Energy Alert: ${a.anomaly_type} detected for ${v?.registration_number}`,
              severity: a.severity,
              type: 'fuel'
          });
      });

      // Critical Exceptions
      exceptions.filter(e => e.status === 'Open' && e.severity === 'Critical').forEach(e => {
           const v = vehicles.find(veh => veh.vehicle_id === e.entity_id);
           alerts.push({
               id: e.exception_id,
               message: `${e.exception_type}: ${v?.registration_number || 'Unknown'}`,
               severity: 'Critical',
               type: 'exception'
           });
      });

      // Maintenance Overdue
      schedules.filter(s => s.status === 'Overdue').forEach(s => {
          const v = vehicles.find(veh => veh.vehicle_id === s.vehicle_id);
          alerts.push({
              id: s.schedule_id,
              message: `Maintenance Overdue: ${v?.registration_number}`,
              severity: 'High',
              type: 'maintenance'
          });
      });

      setLiveAlerts(alerts.slice(0, 5)); // Top 5

    } catch (error) {
      console.error("Dashboard Load Failed", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Map Helpers ---
  const getMapDotColor = (status: string) => {
      switch(status) {
          case 'healthy': return 'bg-green-500';
          case 'atRisk': return 'bg-yellow-400';
          case 'maintenance': return 'bg-red-500';
          case 'nonCompliant': return 'bg-orange-500';
          default: return 'bg-gray-400';
      }
  };

  const getMapDotPosition = (index: number) => {
      // Deterministic pseudo-random position based on index to keep dots stable
      const top = (index * 13 + 7) % 85 + 5; 
      const left = (index * 29 + 11) % 90 + 5;
      return { top: `${top}%`, left: `${left}%` };
  };

  if (selectedVehicleId) {
      return <VehicleDetailsPage vehicleId={selectedVehicleId} onBack={() => setSelectedVehicleId(null)} />;
  }

  if (loading) return <div className="p-12 text-center text-gray-500">Analysing Fleet Health...</div>;

  return (
    <div className="space-y-8">
      {/* 1. Header & Live Alert Strip */}
      <div>
          <div className="flex justify-between items-end mb-4">
              <div>
                  <h1 className="text-2xl font-bold text-gray-900">Fleet Health Overview</h1>
                  <p className="text-sm text-gray-500 mt-1">Real-time operational readiness & risk assessment</p>
              </div>
              <div className="text-right">
                  <span className="text-xs font-medium text-gray-400">Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
          </div>

          {/* Live Alert Strip */}
          {liveAlerts.length > 0 && (
              <div className="bg-red-900 text-white rounded-md shadow-md overflow-hidden flex items-center h-12 relative">
                  <div className="bg-red-800 px-4 h-full flex items-center font-bold text-xs uppercase tracking-wider z-10 shrink-0">
                      <IconSiren className="w-4 h-4 mr-2 animate-pulse" />
                      Live Alerts
                  </div>
                  <div className="flex-1 overflow-hidden relative group cursor-pointer" onClick={() => onNavigate('exceptions')}>
                      <div className="animate-marquee whitespace-nowrap flex items-center h-full px-4">
                          {liveAlerts.map((alert, i) => (
                              <span key={i} className="mx-6 flex items-center text-sm font-medium">
                                  <span className={`w-2 h-2 rounded-full mr-2 ${alert.severity === 'Critical' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                  {alert.message}
                              </span>
                          ))}
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* 2. KPI Cards (Top Row) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          
          {/* Availability */}
          <div 
            onClick={() => onNavigate('fleet')}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-primary-300 transition-colors"
          >
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Readiness</span>
                  <IconCheck className={`w-5 h-5 ${kpiData.availabilityPct > 85 ? 'text-green-500' : 'text-yellow-500'}`} />
              </div>
              <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">{kpiData.availabilityPct}%</span>
                  <span className="ml-1 text-xs text-gray-500">Available</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1 mt-3">
                  <div className={`h-1 rounded-full ${kpiData.availabilityPct > 85 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${kpiData.availabilityPct}%` }}></div>
              </div>
          </div>

          {/* Operational Risk */}
          <div 
            onClick={() => onNavigate('exceptions')}
            className={`bg-white p-4 rounded-lg shadow-sm border cursor-pointer hover:border-red-300 transition-colors ${kpiData.vehiclesAtRisk > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
          >
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Ops Risk</span>
                  <IconAlert className={`w-5 h-5 ${kpiData.vehiclesAtRisk > 0 ? 'text-red-500' : 'text-green-500'}`} />
              </div>
              <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">{kpiData.vehiclesAtRisk}</span>
                  <span className="ml-1 text-xs text-gray-500">Vehicles</span>
              </div>
              <p className="text-xs text-red-600 mt-2 font-medium">{kpiData.vehiclesAtRisk > 0 ? 'Requires Attention' : 'Low Risk'}</p>
          </div>

          {/* Cost Health */}
          <div 
            onClick={() => onNavigate('cost')}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-blue-300 transition-colors"
          >
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Cost Confidence</span>
                  <IconCircleDollar className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex items-baseline space-x-1">
                  <div className="flex flex-col">
                      <span className="text-lg font-bold text-green-600">{kpiData.costHealth.healthy}</span>
                      <span className="text-[10px] text-gray-400">Good</span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <div className="flex flex-col">
                      <span className="text-lg font-bold text-yellow-600">{kpiData.costHealth.watch}</span>
                      <span className="text-[10px] text-gray-400">Watch</span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <div className="flex flex-col">
                      <span className="text-lg font-bold text-red-600">{kpiData.costHealth.critical}</span>
                      <span className="text-[10px] text-gray-400">Critical</span>
                  </div>
              </div>
          </div>

          {/* Energy Risk */}
          <div 
            onClick={() => onNavigate('fuel')}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-purple-300 transition-colors"
          >
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Energy Anomalies</span>
                  <IconZap className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">{kpiData.energyRiskCount}</span>
                  <span className="ml-1 text-xs text-gray-500">Active</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Fuel/AdBlue Theft Signals</p>
          </div>

          {/* Maintenance Due */}
          <div 
            onClick={() => onNavigate('maintenance')}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-orange-300 transition-colors"
          >
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Maint. Due</span>
                  <IconWrench className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">{kpiData.maintenanceDueCount}</span>
                  <span className="ml-1 text-xs text-gray-500">Vehicles</span>
              </div>
              <p className="text-xs text-orange-600 mt-2 font-medium">Overdue / Due &lt; 7 days</p>
          </div>
      </div>

      {/* 3. Fleet Status Snapshot */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <IconTruck className="w-5 h-5 mr-2 text-gray-500" />
              Fleet Status Distribution
          </h3>
          
          <div className="space-y-6">
              {/* Visual Bar */}
              <div className="flex h-8 rounded-full overflow-hidden w-full">
                  <div className="bg-green-500 hover:bg-green-600 transition-colors" style={{ width: `${(buckets.healthy / kpiData.totalFleet) * 100}%` }} title="Healthy"></div>
                  <div className="bg-yellow-400 hover:bg-yellow-500 transition-colors" style={{ width: `${(buckets.atRisk / kpiData.totalFleet) * 100}%` }} title="Active but At Risk"></div>
                  <div className="bg-red-500 hover:bg-red-600 transition-colors" style={{ width: `${(buckets.maintenance / kpiData.totalFleet) * 100}%` }} title="Under Maintenance"></div>
                  <div className="bg-orange-500 hover:bg-orange-600 transition-colors" style={{ width: `${(buckets.nonCompliant / kpiData.totalFleet) * 100}%` }} title="Non-Compliant"></div>
                  <div className="bg-gray-300 hover:bg-gray-400 transition-colors" style={{ width: `${(buckets.offline / kpiData.totalFleet) * 100}%` }} title="Offline / Parked"></div>
              </div>

              {/* Legend & Clickable Buckets */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="flex flex-col p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate('fleet')}>
                      <div className="flex items-center mb-1">
                          <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                          <span className="text-sm font-medium text-gray-700">Healthy</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900 ml-5">{buckets.healthy}</span>
                  </div>

                  <div className="flex flex-col p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate('exceptions')}>
                      <div className="flex items-center mb-1">
                          <span className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>
                          <span className="text-sm font-medium text-gray-700">At Risk</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900 ml-5">{buckets.atRisk}</span>
                  </div>

                  <div className="flex flex-col p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate('maintenance')}>
                      <div className="flex items-center mb-1">
                          <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                          <span className="text-sm font-medium text-gray-700">Maintenance</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900 ml-5">{buckets.maintenance}</span>
                  </div>

                  <div className="flex flex-col p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate('compliance')}>
                      <div className="flex items-center mb-1">
                          <span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span>
                          <span className="text-sm font-medium text-gray-700">Non-Compliant</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900 ml-5">{buckets.nonCompliant}</span>
                  </div>

                  <div className="flex flex-col p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate('fleet')}>
                      <div className="flex items-center mb-1">
                          <span className="w-3 h-3 rounded-full bg-gray-300 mr-2"></span>
                          <span className="text-sm font-medium text-gray-700">Offline</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900 ml-5">{buckets.offline}</span>
                  </div>
              </div>
          </div>
      </div>

      {/* 4. Fleet Intelligence & Drill Down Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Energy & Cost Health */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <IconZap className="w-5 h-5 mr-2 text-purple-600" />
                      Energy & Cost Intelligence
                  </h3>
                  <button onClick={() => onNavigate('fuel')} className="text-xs font-medium text-primary-600 hover:text-primary-800">View All</button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => onNavigate('fuel')}>
                      <p className="text-xs text-gray-500 mb-1">Avg Fleet Efficiency</p>
                      <div className="flex items-center">
                          <span className="text-xl font-bold text-gray-900">{intelData.avgKmpl}</span>
                          <span className="text-xs text-gray-500 ml-1">km/l</span>
                          <IconTrendUp className="w-3 h-3 text-green-500 ml-2" />
                      </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => onNavigate('fuel')}>
                      <p className="text-xs text-gray-500 mb-1">AdBlue Compliance</p>
                      <div className="flex items-center">
                          <span className={`text-xl font-bold ${intelData.adBlueCompliance < 90 ? 'text-orange-600' : 'text-green-600'}`}>
                              {intelData.adBlueCompliance}%
                          </span>
                      </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => onNavigate('cost')}>
                      <p className="text-xs text-gray-500 mb-1">Cost Critical</p>
                      <div className="flex items-center">
                          <span className={`text-xl font-bold ${kpiData.costHealth.critical > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                              {kpiData.costHealth.critical}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">vehs</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* Maintenance & Asset Health */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <IconWrench className="w-5 h-5 mr-2 text-blue-600" />
                      Maintenance & Asset Health
                  </h3>
                  <button onClick={() => onNavigate('maintenance')} className="text-xs font-medium text-primary-600 hover:text-primary-800">View All</button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => onNavigate('maintenance')}>
                      <p className="text-xs text-gray-500 mb-1">Overdue Service</p>
                      <div className="flex items-center">
                          <span className={`text-xl font-bold ${kpiData.maintenanceDueCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                              {kpiData.maintenanceDueCount}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">vehs</span>
                      </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => onNavigate('maintenance')}>
                      <p className="text-xs text-gray-500 mb-1">Chronic Issues</p>
                      <div className="flex items-center">
                          <span className="text-xl font-bold text-gray-900">{intelData.chronicBreakdowns}</span>
                          <span className="text-xs text-gray-500 ml-1">vehs</span>
                      </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => onNavigate('tyres')}>
                      <p className="text-xs text-gray-500 mb-1">Tyre Alerts</p>
                      <div className="flex items-center">
                          <span className={`text-xl font-bold ${intelData.tyreAlerts > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                              {intelData.tyreAlerts}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">flags</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* 5. Compact Live Map */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <IconMapPin className="w-5 h-5 mr-2 text-gray-500" />
                  Live Fleet View (Compact)
              </h3>
              <div className="flex space-x-3 text-xs">
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Healthy</span>
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-400 mr-1"></span> At Risk</span>
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-500 mr-1"></span> Non-Comp</span>
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span> Maint</span>
              </div>
          </div>
          
          <div className="relative h-64 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group cursor-crosshair">
              {/* Grid Lines for Visual Effect */}
              <div className="absolute inset-0 opacity-20" style={{ 
                  backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', 
                  backgroundSize: '40px 40px' 
              }}></div>

              {mapVehicles.map((item, index) => {
                  const pos = getMapDotPosition(index);
                  const colorClass = getMapDotColor(item.status);
                  return (
                      <div 
                          key={item.vehicle.vehicle_id}
                          className={`absolute w-3 h-3 rounded-full border border-white shadow-sm cursor-pointer transform hover:scale-150 transition-transform z-10 ${colorClass}`}
                          style={{ top: pos.top, left: pos.left }}
                          title={`${item.vehicle.registration_number} (${item.status})`}
                          onClick={() => setSelectedVehicleId(item.vehicle.vehicle_id)}
                      >
                          <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                              {item.vehicle.registration_number}
                          </span>
                      </div>
                  );
              })}
              
              <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded text-[10px] text-gray-500 border border-gray-200">
                  Click any dot to open Vehicle Profile
              </div>
          </div>
      </div>
      
      {/* Footer / Quick Actions Hint */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between">
              <div>
                  <h4 className="font-bold text-blue-900">Need to dispatch a trip?</h4>
                  <p className="text-sm text-blue-700">Check availability above and ensure driver compliance before assigning.</p>
              </div>
              <button 
                onClick={() => onNavigate('dispatch')}
                className="bg-white text-blue-700 font-medium px-4 py-2 rounded shadow-sm hover:bg-blue-50 border border-blue-200"
              >
                  Go to Dispatch
              </button>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 flex items-center justify-between">
              <div>
                  <h4 className="font-bold text-purple-900">IoT Simulator Active</h4>
                  <p className="text-sm text-purple-700">Test fleet connectivity and generate telemetry data.</p>
              </div>
              <button 
                onClick={() => onNavigate('iot-sim')}
                className="bg-white text-purple-700 font-medium px-4 py-2 rounded shadow-sm hover:bg-purple-50 border border-purple-200"
              >
                  Open Simulator
              </button>
          </div>
      </div>
    </div>
  );
};