import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { BarChart3, Gauge, Minus, Navigation, Phone, Plus, Search, Truck, Zap } from 'lucide-react';
import { Driver, TelemetryEvent, Vehicle } from '../types';
import { DriverAPI, TelematicsAPI, VehicleAPI } from '../services/mockDatabase';
import { HistoryPlaybackModal, PlaybackAlertPoint, PlaybackPoint } from '../components/HistoryPlaybackModal';
import { useNavigate } from 'react-router-dom';

type LiveStatus = 'Moving' | 'Idle' | 'Stopped' | 'Offline';

interface LiveVehicle {
  vehicle: Vehicle;
  driver: Driver | null;
  latest: TelemetryEvent | null;
  history: TelemetryEvent[];
  status: LiveStatus;
  speed: number;
  ignitionOn: boolean;
  safetyScore: number;
  todaysRunKm: number;
  ignitionDurationText: string;
  position: [number, number];
}

const FALLBACK_POINTS: [number, number][] = [
  [18.5204, 73.8567],
  [19.076, 72.8777],
  [28.6139, 77.209],
  [12.9716, 77.5946],
  [22.5726, 88.3639],
  [17.385, 78.4867],
  [23.0225, 72.5714],
  [13.0827, 80.2707],
];

const mapToStatus = (latest: TelemetryEvent | null): LiveStatus => {
  if (!latest) return 'Offline';
  const ageMs = Date.now() - new Date(latest.event_timestamp).getTime();
  if (ageMs > 10 * 60 * 1000) return 'Offline';
  if (latest.speed > 5) return 'Moving';
  if (latest.speed <= 1 && !latest.ignition_status) return 'Stopped';
  return 'Idle';
};

const markerColor = (status: LiveStatus) => {
  if (status === 'Moving') return '#22c55e';
  if (status === 'Idle') return '#f59e0b';
  if (status === 'Stopped') return '#ef4444';
  return '#94a3b8';
};

const buildTruckIcon = (args: { status: LiveStatus; selected: boolean; moving: boolean; showBadge: boolean; registration: string }) =>
  L.divIcon({
    className: '',
    html: `<div class="truck-root">
      ${args.showBadge ? `<div class="truck-reg-badge">${args.registration}</div>` : ''}
      <div class="truck-marker ${args.moving ? 'truck-pulse' : ''}" style="
        width:48px;height:76px;border-radius:10px;
        background:${markerColor(args.status)};
        border:2px solid #fff; box-shadow:0 10px 22px rgba(0,0,0,.24);
        display:flex;align-items:flex-start;justify-content:center;
        position:relative;${args.selected ? 'outline:3px solid #2563eb;' : ''}
      ">
        <div style="margin-top:5px;width:32px;height:13px;background:#38bdf8;border-radius:4px"></div>
        <div style="position:absolute;bottom:6px;font-size:20px;line-height:1">🚚</div>
      </div>
    </div>`,
    iconSize: [120, 95],
    iconAnchor: [24, 70],
  });

const buildPlaybackPoints = (history: TelemetryEvent[]): PlaybackPoint[] =>
  history
    .slice()
    .sort((a, b) => new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime())
    .map((h) => ({ lat: h.latitude, lng: h.longitude, speed: Math.round(h.speed), timestamp: h.event_timestamp }));

const buildPlaybackAlerts = (history: TelemetryEvent[]): PlaybackAlertPoint[] => {
  const sorted = history.slice().sort((a, b) => new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime());
  const alerts: PlaybackAlertPoint[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const current = sorted[i];
    if (current.speed > 90) {
      alerts.push({ lat: current.latitude, lng: current.longitude, timestamp: current.event_timestamp, label: 'Overspeed alert', severity: 'High' });
    } else if (prev.speed - current.speed > 35) {
      alerts.push({ lat: current.latitude, lng: current.longitude, timestamp: current.event_timestamp, label: 'Harsh braking alert', severity: 'Medium' });
    } else if (!current.ignition_status && current.speed <= 1) {
      alerts.push({ lat: current.latitude, lng: current.longitude, timestamp: current.event_timestamp, label: 'Vehicle stop event', severity: 'Low' });
    }
    if (alerts.length >= 6) break;
  }
  return alerts;
};

const clusterIcon = (count: number, status: LiveStatus) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:44px;height:44px;border-radius:999px;background:${markerColor(status)};
      color:white;display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:13px;border:2px solid #fff;box-shadow:0 8px 18px rgba(0,0,0,.25)
    ">${count}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

const MapZoomWatcher: React.FC<{ onZoom: (zoom: number) => void }> = ({ onZoom }) => {
  useMapEvents({
    zoomend: (e) => onZoom(e.target.getZoom()),
  });
  return null;
};

export const LiveMapPage: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);

  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<LiveVehicle | null>(null);
  const [playbackOpen, setPlaybackOpen] = useState(false);
  const [mapZoom, setMapZoom] = useState(5);

  const selected = useMemo(() => {
    if (!selectedVehicle) return null;
    return vehicles.find((v) => v.vehicle.vehicle_id === selectedVehicle.vehicle.vehicle_id) || selectedVehicle;
  }, [vehicles, selectedVehicle]);

  const counts = useMemo(
    () => ({
      moving: vehicles.filter((v) => v.status === 'Moving').length,
      idle: vehicles.filter((v) => v.status === 'Idle').length,
      stopped: vehicles.filter((v) => v.status === 'Stopped').length,
      offline: vehicles.filter((v) => v.status === 'Offline').length,
      active: vehicles.filter((v) => v.status !== 'Offline').length,
    }),
    [vehicles],
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      try {
        const [v, d, t] = await Promise.all([VehicleAPI.getAll(), DriverAPI.getAll(), TelematicsAPI.getHistory()]);
        const usedFallbackPositions: Array<[number, number]> = [];

        const live = v.map((vehicle, i) => {
          const history = t.filter((e) => e.vehicle_id === vehicle.vehicle_id).sort((a, b) => new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime());
          const latest = history[0] || null;
          const driver = d.find((x) => x.driver_id === vehicle.assigned_driver_id) || d.find((x) => x.assigned_vehicle_id === vehicle.vehicle_id) || null;
          const status = mapToStatus(latest);
          const fallback = FALLBACK_POINTS[i % FALLBACK_POINTS.length];
          const ring = Math.floor(i / FALLBACK_POINTS.length);
          const latJitter = ((i % 5) - 2) * 0.11 + ring * 0.34;
          const lngJitter = ((i % 7) - 3) * 0.11 + ring * 0.27;
          let fallbackPosition: [number, number] = [fallback[0] + latJitter, fallback[1] + lngJitter];
          while (
            usedFallbackPositions.some(
              (p) => Math.abs(p[0] - fallbackPosition[0]) < 0.18 && Math.abs(p[1] - fallbackPosition[1]) < 0.18,
            )
          ) {
            fallbackPosition = [fallbackPosition[0] + 0.21, fallbackPosition[1] + 0.19];
          }
          const position: [number, number] = latest ? [latest.latitude, latest.longitude] : fallbackPosition;
          if (!latest) usedFallbackPositions.push(position);
          const ignitionEvents = history.filter((h) => h.ignition_status === (latest?.ignition_status ?? false));
          const ignitionDurationMin = ignitionEvents.length > 0 ? Math.max(1, Math.round((Date.now() - new Date(ignitionEvents[ignitionEvents.length - 1].event_timestamp).getTime()) / 60000)) : 0;
          const safetyScore = 75 + ((i * 7) % 21);
          const todaysRunKm = Math.max(0, Math.round(history.reduce((acc, item) => acc + item.speed * 0.08, 0)));

          return {
            vehicle,
            driver,
            latest,
            history,
            status,
            speed: Math.round(latest?.speed || 0),
            ignitionOn: !!latest?.ignition_status,
            safetyScore,
            todaysRunKm,
            ignitionDurationText: ignitionDurationMin > 60 ? `${Math.floor(ignitionDurationMin / 60)}h ${ignitionDurationMin % 60}m` : `${ignitionDurationMin}m`,
            position,
          } as LiveVehicle;
        });

        if (mounted) {
          setVehicles(live);
          setSelectedVehicle((prev) => {
            if (!prev) return null;
            return live.find((v) => v.vehicle.vehicle_id === prev.vehicle.vehicle_id) || null;
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const id = setInterval(load, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const visibleVehicles = useMemo(() => {
    if (!query.trim()) return vehicles;
    return vehicles.filter((v) => v.vehicle.registration_number.toLowerCase().includes(query.toLowerCase()));
  }, [vehicles, query]);

  const clusteredVehicles = useMemo(() => {
    if (mapZoom >= 8) return [];
    const cellSize = mapZoom <= 5 ? 1.2 : mapZoom <= 6 ? 0.7 : 0.45;
    const buckets = new Map<string, { lat: number; lng: number; vehicles: LiveVehicle[] }>();
    visibleVehicles.forEach((v) => {
      const cellLat = Math.floor(v.position[0] / cellSize);
      const cellLng = Math.floor(v.position[1] / cellSize);
      const key = `${cellLat}:${cellLng}`;
      const existing = buckets.get(key);
      if (!existing) {
        buckets.set(key, { lat: v.position[0], lng: v.position[1], vehicles: [v] });
      } else {
        existing.vehicles.push(v);
        existing.lat = existing.vehicles.reduce((a, x) => a + x.position[0], 0) / existing.vehicles.length;
        existing.lng = existing.vehicles.reduce((a, x) => a + x.position[1], 0) / existing.vehicles.length;
      }
    });
    return Array.from(buckets.values())
      .filter((cluster) => cluster.vehicles.length > 1)
      .map((cluster) => {
        const status = cluster.vehicles.some((v) => v.status === 'Stopped')
          ? 'Stopped'
          : cluster.vehicles.some((v) => v.status === 'Moving')
            ? 'Moving'
            : cluster.vehicles.some((v) => v.status === 'Idle')
              ? 'Idle'
              : 'Offline';
        return {
          position: [cluster.lat, cluster.lng] as [number, number],
          vehicles: cluster.vehicles,
          status: status as LiveStatus,
        };
      });
  }, [visibleVehicles, mapZoom]);

  const onSearchKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key !== 'Enter') return;
    const found = vehicles.find((v) => v.vehicle.registration_number.toLowerCase().includes(query.toLowerCase()));
    if (!found) return;
    setSelectedVehicle(found);
    mapRef.current?.flyTo(found.position, 13, { duration: 0.7 });
  };

  return (
    <div className="relative h-[calc(100vh-100px)] overflow-hidden rounded-3xl border border-gray-200">
      <style>{`
        .truck-root { position: relative; }
        .truck-reg-badge {
          position: absolute; top: -22px; left: 50%; transform: translateX(-50%);
          background: rgba(15,23,42,.92); color: #fff; border-radius: 999px;
          font-size: 10px; line-height: 1; padding: 5px 8px; white-space: nowrap;
          box-shadow: 0 6px 14px rgba(0,0,0,.2);
        }
        @keyframes truckPing {
          0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.55), 0 10px 22px rgba(0,0,0,.24); }
          70% { box-shadow: 0 0 0 18px rgba(34,197,94,0), 0 10px 22px rgba(0,0,0,.24); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0), 0 10px 22px rgba(0,0,0,.24); }
        }
        .truck-pulse { animation: truckPing 1.6s infinite; }
      `}</style>

      <MapContainer
        center={[22.5, 79]}
        zoom={5}
        minZoom={4}
        zoomControl={false}
        className="h-full w-full"
        ref={mapRef}
      >
        <MapZoomWatcher onZoom={setMapZoom} />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {mapZoom < 8
          ? clusteredVehicles.map((cluster, idx) => (
              <Marker
                key={`cluster-${idx}`}
                position={cluster.position}
                icon={clusterIcon(cluster.vehicles.length, cluster.status)}
                eventHandlers={{
                  click: () => mapRef.current?.flyTo(cluster.position, Math.min(11, mapZoom + 2), { duration: 0.5 }),
                }}
              />
            ))
          : visibleVehicles.map((v) => (
              <React.Fragment key={v.vehicle.vehicle_id}>
                <CircleMarker
                  center={v.position}
                  radius={28}
                  pathOptions={{ color: '#00000000', fillColor: '#00000000', fillOpacity: 0 }}
                  eventHandlers={{
                    click: () => setSelectedVehicle(v),
                    mousedown: () => setSelectedVehicle(v),
                    touchstart: () => setSelectedVehicle(v),
                  }}
                />
                <Marker
                  position={v.position}
                  icon={buildTruckIcon({
                    status: v.status,
                    selected: selectedVehicle?.vehicle.vehicle_id === v.vehicle.vehicle_id,
                    moving: v.status === 'Moving',
                    showBadge: hoveredId === v.vehicle.vehicle_id,
                    registration: v.vehicle.registration_number,
                  })}
                  interactive
                  eventHandlers={{
                    click: () => setSelectedVehicle(v),
                    touchstart: () => setSelectedVehicle(v),
                    mouseover: () => setHoveredId(v.vehicle.vehicle_id),
                    mouseout: () => setHoveredId((prev) => (prev === v.vehicle.vehicle_id ? null : prev)),
                  }}
                />
              </React.Fragment>
            ))}
      </MapContainer>

      <div className="absolute left-8 top-6 z-[1000] w-[320px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Search vehicle..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-2xl text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="absolute right-8 top-6 z-[1000] rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Total Active</p>
            <p className="text-4xl font-bold text-slate-900">
              {counts.active}
              <span className="text-2xl text-slate-400"> / {vehicles.length || 13}</span>
            </p>
          </div>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
            <Navigation className="h-5 w-5 text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 z-[1000] rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <h4 className="mb-2 text-2xl font-bold uppercase text-slate-700">Fleet Status</h4>
        <div className="space-y-1 text-2xl">
          <div className="flex items-center justify-between gap-8">
            <span className="inline-flex items-center gap-2 text-slate-700"><span className="h-3 w-3 rounded-full bg-emerald-500" />Moving</span>
            <span className="font-semibold text-slate-900">{counts.moving}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="inline-flex items-center gap-2 text-slate-700"><span className="h-3 w-3 rounded-full bg-amber-500" />Idle</span>
            <span className="font-semibold text-slate-900">{counts.idle}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="inline-flex items-center gap-2 text-slate-700"><span className="h-3 w-3 rounded-full bg-red-500" />Stopped</span>
            <span className="font-semibold text-slate-900">{counts.stopped}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="inline-flex items-center gap-2 text-slate-700"><span className="h-3 w-3 rounded-full bg-slate-400" />Offline</span>
            <span className="font-semibold text-slate-900">{counts.offline}</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-[1000] overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
        <button type="button" onClick={() => mapRef.current?.zoomIn()} className="block h-12 w-12 border-b border-gray-300 text-slate-800 hover:bg-gray-50" aria-label="Zoom in">
          <Plus className="mx-auto h-5 w-5" />
        </button>
        <button type="button" onClick={() => mapRef.current?.zoomOut()} className="block h-12 w-12 text-slate-800 hover:bg-gray-50" aria-label="Zoom out">
          <Minus className="mx-auto h-5 w-5" />
        </button>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[1100] pointer-events-none p-4">
          <div className="pointer-events-auto w-full max-w-[680px] overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl">
            <div className="bg-[#081a3c] px-8 py-7 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-6xl font-bold tracking-tight">{selected.vehicle.registration_number}</h3>
                  <p className="mt-2 text-5xl uppercase tracking-wide text-slate-300">{selected.vehicle.make || selected.vehicle.model || selected.vehicle.vehicle_type}</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <button type="button" onClick={() => setSelectedVehicle(null)} className="rounded p-1 text-slate-300 hover:bg-white/10">
                    <X className="h-5 w-5" />
                  </button>
                  <span className={`rounded-2xl px-4 py-2 text-4xl font-semibold uppercase ${
                    selected.status === 'Moving'
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/70'
                      : selected.status === 'Idle'
                        ? 'bg-amber-900/60 text-amber-300 border border-amber-700/70'
                        : selected.status === 'Stopped'
                          ? 'bg-red-900/60 text-red-300 border border-red-700/70'
                          : 'bg-slate-700/70 text-slate-200 border border-slate-500/70'
                  }`}>
                    {selected.status}
                  </span>
                  <Truck className="h-16 w-16 text-slate-600" />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-5xl font-bold text-slate-600">
                    {(selected.driver?.name || 'D').charAt(0)}
                    <span className="absolute -bottom-0 -right-0 h-5 w-5 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold uppercase tracking-wide text-slate-400">Assigned Driver</p>
                    <p className="text-5xl font-semibold text-slate-900">{selected.driver?.name || 'Unassigned'}</p>
                    <p className="inline-flex items-center gap-1 text-4xl font-semibold text-blue-600">
                      <Phone className="h-4 w-4" /> Contact
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-7xl font-bold text-emerald-600">{selected.safetyScore}</p>
                  <p className="text-3xl font-semibold uppercase tracking-wide text-slate-400">Safety Score</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 px-8 py-6">
              <h4 className="text-5xl font-semibold text-slate-900">LIVE TELEMETRY</h4>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-3xl border border-gray-200 bg-slate-50 p-5">
                  <div className="mb-2 flex items-start justify-between">
                    <p className="text-3xl font-semibold uppercase tracking-wide text-slate-400">Current Speed</p>
                    <Gauge className="h-10 w-10 text-slate-300" />
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(100, (selected.speed / 120) * 100)}%` }} />
                  </div>
                  <p className="mt-2 inline-flex items-end gap-1 text-8xl font-bold text-slate-900">
                    {selected.speed}
                    <span className="text-5xl font-medium text-slate-500">km/h</span>
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-slate-50 p-5">
                  <p className="text-3xl font-semibold uppercase tracking-wide text-slate-400">Ignition Status</p>
                  <p className={`mt-5 inline-flex items-center gap-2 text-6xl font-bold ${selected.ignitionOn ? 'text-emerald-700' : 'text-slate-500'}`}>
                    <span className={`inline-flex h-14 w-14 items-center justify-center rounded-full ${selected.ignitionOn ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                      <Zap className="h-8 w-8" />
                    </span>
                    {selected.ignitionOn ? 'Engine ON' : 'Engine OFF'}
                  </p>
                  <p className="mt-2 text-lg text-slate-500">for {selected.ignitionDurationText}</p>
                </div>

                <div className="col-span-2 rounded-3xl border border-gray-200 bg-slate-50 p-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-semibold uppercase tracking-wide text-slate-400">Today&apos;s Run</p>
                      <p className="mt-2 inline-flex items-end gap-1 text-8xl font-bold text-slate-900">
                        {selected.todaysRunKm}
                        <span className="text-5xl font-medium text-slate-500">km</span>
                      </p>
                    </div>
                    <BarChart3 className="h-12 w-12 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 px-8 py-6">
              <button type="button" onClick={() => navigate(`/fleet/vehicles`)} className="h-12 rounded-2xl border border-gray-300 bg-white text-2xl font-semibold text-slate-700 hover:bg-gray-50">
                View Details
              </button>
              <button type="button" onClick={() => setPlaybackOpen(true)} className="h-12 rounded-2xl bg-blue-600 text-2xl font-semibold text-white hover:bg-blue-700">
                ▶ Playback
              </button>
            </div>
          </div>
        </div>
      )}

      <HistoryPlaybackModal
        isOpen={playbackOpen}
        onClose={() => setPlaybackOpen(false)}
        vehicleRegistration={selected?.vehicle.registration_number || ''}
        driverName={selected?.driver?.name || 'Unassigned'}
        points={buildPlaybackPoints(selected?.history || [])}
        alertPoints={buildPlaybackAlerts(selected?.history || [])}
      />

      {loading && <div className="absolute inset-0 z-[1300] flex items-center justify-center bg-white/55 text-slate-700">Loading live map...</div>}
    </div>
  );
};
