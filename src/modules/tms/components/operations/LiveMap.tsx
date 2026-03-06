import React, { useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import { Search, Truck, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { useOperationalData } from '../../../../shared/context/OperationalDataContext';
import { HistoryPlaybackModal, PlaybackAlertPoint, PlaybackPoint } from '../../../fleet-control/components/HistoryPlaybackModal';
import 'leaflet/dist/leaflet.css';

interface VehicleMarker {
  id: string;
  tripId: string;
  lat: number;
  lng: number;
  status: 'Moving' | 'Idle' | 'Stopped' | 'Offline';
  plate: string;
  driver: string;
  route: string;
  eta: string;
  speed: number;
}

const BASE_POINTS: Array<{ lat: number; lng: number; status: VehicleMarker['status']; eta: string; speed: number }> = [
  { lat: 18.5604, lng: 73.8767, status: 'Moving', eta: '4h 20m', speed: 65 },
  { lat: 18.5004, lng: 73.7967, status: 'Stopped', eta: '2h 10m', speed: 0 },
  { lat: 18.4804, lng: 73.9267, status: 'Idle', eta: 'At checkpoint', speed: 8 },
  { lat: 18.6204, lng: 73.9367, status: 'Moving', eta: '6h 15m', speed: 58 },
  { lat: 18.6004, lng: 73.8267, status: 'Idle', eta: '3h 30m', speed: 12 },
  { lat: 18.5304, lng: 73.9567, status: 'Stopped', eta: 'Unknown', speed: 0 },
  { lat: 18.4504, lng: 73.8867, status: 'Moving', eta: '5h 00m', speed: 62 },
  { lat: 18.5804, lng: 73.7567, status: 'Offline', eta: 'No signal', speed: 0 },
];

interface LiveMapProps {
  onVehicleSelect?: (vehicleId: string) => void;
}

const statusColor = (status: VehicleMarker['status']) => {
  if (status === 'Moving') return '#22c55e';
  if (status === 'Idle') return '#eab308';
  if (status === 'Stopped') return '#ef4444';
  return '#94a3b8';
};

const truckIcon = (status: VehicleMarker['status']) =>
  new L.DivIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;border-radius:999px;background:${statusColor(status)};
      border:2px solid #fff;display:flex;align-items:center;justify-content:center;
      box-shadow:0 6px 14px rgba(0,0,0,.22)
    ">
      <span style="font-size:14px;line-height:1">🚚</span>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const clusterIcon = (count: number, status: VehicleMarker['status']) =>
  new L.DivIcon({
    className: '',
    html: `<div style="
      width:40px;height:40px;border-radius:999px;background:${statusColor(status)};
      color:#fff;border:2px solid #fff;display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;box-shadow:0 8px 16px rgba(0,0,0,.22)
    ">${count}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

const MapZoomWatcher: React.FC<{ onZoom: (zoom: number) => void }> = ({ onZoom }) => {
  useMapEvents({
    zoomend: (e) => onZoom(e.target.getZoom()),
  });
  return null;
};

export const LiveMap: React.FC<LiveMapProps> = ({ onVehicleSelect }) => {
  const mapRef = useRef<L.Map | null>(null);
  const { completedTrips } = useOperationalData();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleMarker | null>(null);
  const [query, setQuery] = useState('');
  const [zoom, setZoom] = useState(11);
  const [historyOpen, setHistoryOpen] = useState(false);

  const vehicles = useMemo<VehicleMarker[]>(() => {
    return completedTrips.slice(0, 8).map((trip, index) => {
      const point = BASE_POINTS[index % BASE_POINTS.length];
      return {
        id: String(index + 1),
        tripId: trip.id,
        lat: point.lat,
        lng: point.lng,
        status: point.status,
        plate: trip.vehicleRegNumber || 'Unassigned',
        driver: trip.driverName || 'Unassigned',
        route: `${trip.origin} → ${trip.destination}`,
        eta: point.eta,
        speed: point.speed,
      };
    });
  }, [completedTrips]);

  const filteredVehicles = useMemo(() => {
    if (!query.trim()) return vehicles;
    return vehicles.filter((v) => v.plate.toLowerCase().includes(query.toLowerCase()));
  }, [vehicles, query]);

  const clusters = useMemo(() => {
    if (zoom >= 13) return [];
    const cellSize = zoom <= 10 ? 0.04 : 0.02;
    const buckets = new Map<string, { lat: number; lng: number; items: VehicleMarker[] }>();

    filteredVehicles.forEach((v) => {
      const cellLat = Math.floor(v.lat / cellSize);
      const cellLng = Math.floor(v.lng / cellSize);
      const key = `${cellLat}:${cellLng}`;
      const existing = buckets.get(key);
      if (!existing) {
        buckets.set(key, { lat: v.lat, lng: v.lng, items: [v] });
      } else {
        existing.items.push(v);
        existing.lat = existing.items.reduce((acc, item) => acc + item.lat, 0) / existing.items.length;
        existing.lng = existing.items.reduce((acc, item) => acc + item.lng, 0) / existing.items.length;
      }
    });

    return Array.from(buckets.values())
      .filter((bucket) => bucket.items.length > 1)
      .map((bucket) => {
        const dominant = bucket.items.some((v) => v.status === 'Stopped')
          ? 'Stopped'
          : bucket.items.some((v) => v.status === 'Moving')
            ? 'Moving'
            : bucket.items.some((v) => v.status === 'Idle')
              ? 'Idle'
              : 'Offline';
        return {
          position: [bucket.lat, bucket.lng] as [number, number],
          items: bucket.items,
          status: dominant as VehicleMarker['status'],
        };
      });
  }, [filteredVehicles, zoom]);

  const counts = useMemo(() => {
    return {
      moving: vehicles.filter((v) => v.status === 'Moving').length,
      idle: vehicles.filter((v) => v.status === 'Idle').length,
      stopped: vehicles.filter((v) => v.status === 'Stopped').length,
      offline: vehicles.filter((v) => v.status === 'Offline').length,
    };
  }, [vehicles]);

  const historyPoints = useMemo<PlaybackPoint[]>(() => {
    if (!selectedVehicle) return [];
    return Array.from({ length: 32 }).map((_, idx) => {
      const timestamp = Date.now() - (31 - idx) * 8 * 60 * 1000;
      const drift = idx * 0.002;
      const speed = Math.max(0, Math.round(selectedVehicle.speed + (Math.random() - 0.5) * 20));
      return {
        lat: selectedVehicle.lat - 0.05 + drift + (Math.random() - 0.5) * 0.002,
        lng: selectedVehicle.lng - 0.05 + drift + (Math.random() - 0.5) * 0.002,
        speed,
        timestamp: new Date(timestamp).toISOString(),
      };
    });
  }, [selectedVehicle]);

  const historyAlerts = useMemo<PlaybackAlertPoint[]>(() => {
    const alerts: PlaybackAlertPoint[] = [];
    historyPoints.forEach((p, idx) => {
      if (p.speed > 85 && alerts.length < 2) alerts.push({ lat: p.lat, lng: p.lng, timestamp: p.timestamp, label: 'Overspeed alert', severity: 'High' });
      if (idx % 12 === 0 && alerts.length < 5) alerts.push({ lat: p.lat, lng: p.lng, timestamp: p.timestamp, label: 'Long idle', severity: 'Medium' });
    });
    return alerts;
  }, [historyPoints]);

  return (
    <Card className="h-full min-h-[500px] overflow-hidden border border-gray-200 p-0 shadow-md">
      <div className="relative h-full">
        <MapContainer center={[18.5204, 73.8567]} zoom={11} className="h-full w-full" zoomControl={false} ref={mapRef}>
          <MapZoomWatcher onZoom={setZoom} />
          <TileLayer attribution="&copy; OpenStreetMap contributors &copy; CARTO" url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

          {zoom < 13
            ? clusters.map((cluster, idx) => (
                <Marker
                  key={`cluster-${idx}`}
                  position={cluster.position}
                  icon={clusterIcon(cluster.items.length, cluster.status)}
                  eventHandlers={{
                    click: () => mapRef.current?.flyTo(cluster.position, Math.min(14, zoom + 2), { duration: 0.5 }),
                  }}
                />
              ))
            : filteredVehicles.map((v) => (
                <Marker key={v.id} position={[v.lat, v.lng]} icon={truckIcon(v.status)} eventHandlers={{ click: () => setSelectedVehicle(v) }}>
                  <Popup>
                    <div className="text-center text-xs">
                      <b>{v.plate}</b>
                      <br />
                      {v.status} ({Math.round(v.speed)} km/h)
                    </div>
                  </Popup>
                </Marker>
              ))}
        </MapContainer>

        <div className="absolute left-4 top-4 z-[1000] w-72">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vehicle..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-[1000] rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Fleet Status</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-8"><span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Moving</span><span>{counts.moving}</span></div>
            <div className="flex items-center justify-between gap-8"><span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />Idle</span><span>{counts.idle}</span></div>
            <div className="flex items-center justify-between gap-8"><span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Stopped</span><span>{counts.stopped}</span></div>
            <div className="flex items-center justify-between gap-8"><span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-400" />Offline</span><span>{counts.offline}</span></div>
          </div>
        </div>

        {selectedVehicle ? (
          <div className="absolute right-4 top-4 z-[1000] w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusColor(selectedVehicle.status) }} />
                <p className="text-sm font-semibold text-gray-900">{selectedVehicle.plate}</p>
              </div>
              <button type="button" onClick={() => setSelectedVehicle(null)} className="rounded p-1 text-gray-500 hover:bg-gray-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-semibold">{selectedVehicle.status}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="text-xs text-gray-500">Speed</p>
                  <p className="font-semibold">{selectedVehicle.speed} km/h</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Driver</p>
                <p className="font-medium text-gray-900">{selectedVehicle.driver}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Route</p>
                <p className="font-medium text-gray-900">{selectedVehicle.route}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onVehicleSelect && onVehicleSelect(selectedVehicle.tripId)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  View Trip Details
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(true)}
                  className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                >
                  History
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <HistoryPlaybackModal
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          vehicleRegistration={selectedVehicle?.plate || ''}
          driverName={selectedVehicle?.driver || 'Unassigned'}
          points={historyPoints}
          alertPoints={historyAlerts}
        />
      </div>
    </Card>
  );
};
