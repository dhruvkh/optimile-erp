import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Gauge, MapPin, Minus, Navigation, Play, Plus, SkipBack, SkipForward, X } from 'lucide-react';

export interface PlaybackPoint {
  lat: number;
  lng: number;
  speed: number;
  timestamp: string;
}

export interface PlaybackAlertPoint {
  lat: number;
  lng: number;
  timestamp: string;
  label: string;
  severity: 'High' | 'Medium' | 'Low';
}

interface HistoryPlaybackModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleRegistration: string;
  driverName: string;
  points: PlaybackPoint[];
  alertPoints?: PlaybackAlertPoint[];
}

const playbackTruckIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:44px;height:72px;border-radius:8px;
    background:#22c55e;border:2px solid #fff;
    box-shadow:0 10px 22px rgba(0,0,0,.24);
    display:flex;align-items:flex-start;justify-content:center;
    position:relative;outline:3px solid #2563eb;
  ">
    <div style="margin-top:4px;width:30px;height:12px;background:#38bdf8;border-radius:4px"></div>
    <div style="position:absolute;bottom:6px;font-size:20px;line-height:1">🚚</div>
  </div>`,
  iconSize: [44, 72],
  iconAnchor: [22, 66],
});

const dayKey = (timestamp: string) => new Date(timestamp).toISOString().slice(0, 10);

export const HistoryPlaybackModal: React.FC<HistoryPlaybackModalProps> = ({
  isOpen,
  onClose,
  vehicleRegistration,
  driverName,
  points,
  alertPoints = [],
}) => {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const mapRef = useRef<L.Map | null>(null);

  const fallback = useMemo<PlaybackPoint[]>(() => [{ lat: 18.5204, lng: 73.8567, speed: 0, timestamp: new Date().toISOString() }], []);
  const availableDays = useMemo(() => {
    const days = Array.from(new Set(points.map((p) => dayKey(p.timestamp)))).sort((a, b) => (a < b ? 1 : -1));
    return days;
  }, [points]);

  const filteredPoints = useMemo(() => {
    if (selectedDay === 'all') return points;
    return points.filter((p) => dayKey(p.timestamp) === selectedDay);
  }, [points, selectedDay]);

  const filteredAlerts = useMemo(() => {
    if (selectedDay === 'all') return alertPoints;
    return alertPoints.filter((p) => dayKey(p.timestamp) === selectedDay);
  }, [alertPoints, selectedDay]);

  const safePoints = useMemo(() => (filteredPoints.length > 0 ? filteredPoints : fallback), [filteredPoints, fallback]);
  const active = safePoints[Math.min(index, safePoints.length - 1)];
  const polyline = safePoints.map((p) => [p.lat, p.lng] as [number, number]);

  useEffect(() => {
    if (!isOpen) {
      setIndex(0);
      setIsPlaying(false);
      setSelectedDay('all');
    }
  }, [isOpen]);

  useEffect(() => {
    setIndex(0);
    setIsPlaying(false);
  }, [selectedDay]);

  useEffect(() => {
    if (!isPlaying || !isOpen) return undefined;
    const timer = setInterval(() => {
      setIndex((current) => (current >= safePoints.length - 1 ? current : current + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, isOpen, safePoints.length]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo([active.lat, active.lng], Math.max(mapRef.current.getZoom(), 13), { duration: 0.6 });
    }
  }, [active]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/45 p-6">
      <div className="w-full max-w-[1700px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-4xl font-bold text-slate-900">Route History Playback</h3>
            <p className="text-2xl text-slate-500">
              Vehicle: <span className="font-semibold text-slate-700">{vehicleRegistration}</span> • Driver: {driverName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-slate-700 focus:border-primary-500 focus:outline-none"
            >
              <option value="all">All Days</option>
              {availableDays.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <button type="button" onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-gray-100">
              <X className="h-7 w-7" />
            </button>
          </div>
        </div>

        <div className="relative h-[620px] overflow-hidden border-b border-gray-200">
          <MapContainer
            center={[active.lat, active.lng]}
            zoom={13}
            zoomControl={false}
            className="h-full w-full"
            ref={mapRef}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors &copy; CARTO"
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <Polyline positions={polyline} pathOptions={{ color: '#94a3b8', dashArray: '8 8', weight: 4 }} />
            {filteredAlerts.map((alert, i) => (
              <CircleMarker
                key={`${alert.timestamp}-${alert.label}-${i}`}
                center={[alert.lat, alert.lng]}
                radius={7}
                pathOptions={{
                  color: '#ffffff',
                  weight: 2,
                  fillOpacity: 0.95,
                  fillColor: alert.severity === 'High' ? '#ef4444' : alert.severity === 'Medium' ? '#f59e0b' : '#3b82f6',
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-semibold">{alert.label}</p>
                    <p>{new Date(alert.timestamp).toLocaleString()}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
            <Marker position={[active.lat, active.lng]} icon={playbackTruckIcon} />
          </MapContainer>

          <div className="absolute left-4 top-4 z-[1000] overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm">
            <button type="button" onClick={() => mapRef.current?.zoomIn()} className="block h-10 w-10 border-b border-gray-300 hover:bg-gray-50" aria-label="Zoom in">
              <Plus className="mx-auto h-4 w-4" />
            </button>
            <button type="button" onClick={() => mapRef.current?.zoomOut()} className="block h-10 w-10 hover:bg-gray-50" aria-label="Zoom out">
              <Minus className="mx-auto h-4 w-4" />
            </button>
          </div>

          <div className="absolute right-6 top-4 z-[1000] w-[250px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            <p className="flex items-center justify-between"><span className="inline-flex items-center gap-1"><Gauge className="h-4 w-4" /> Time</span><span className="font-semibold">{new Date(active.timestamp).toLocaleTimeString()}</span></p>
            <p className="mt-2 flex items-center justify-between"><span className="inline-flex items-center gap-1"><Navigation className="h-4 w-4" /> Speed</span><span className="font-semibold text-blue-600">{active.speed} km/h</span></p>
            <p className="mt-2 inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> Alert markers: {filteredAlerts.length}</p>
          </div>
        </div>

        <div className="px-6 py-5">
          <input
            type="range"
            min={0}
            max={Math.max(0, safePoints.length - 1)}
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="mt-1 flex justify-between text-sm text-slate-400">
            <span>Start</span>
            <span>End</span>
          </div>

          <div className="mt-4 flex items-center justify-center gap-8">
            <button type="button" onClick={() => setIndex((v) => Math.max(0, v - 1))} className="rounded-full p-2 text-slate-500 hover:bg-gray-100" aria-label="Previous point">
              <SkipBack className="h-6 w-6" />
            </button>
            <button type="button" onClick={() => setIsPlaying((v) => !v)} className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700" aria-label="Play">
              <Play className="h-6 w-6" />
            </button>
            <button type="button" onClick={() => setIndex((v) => Math.min(safePoints.length - 1, v + 1))} className="rounded-full p-2 text-slate-500 hover:bg-gray-100" aria-label="Next point">
              <SkipForward className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
