"use client";
import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Activity {
  id: string;
  startTime: string;
  note: string;
  locationName: string;
  latitude: number;
  longitude: number;
  dayNumber: number;
  type?: string;
}

const TYPE_COLORS: Record<string, string> = {
  "atracción": "#2563eb",
  "restaurante": "#ea580c",
  "hotel": "#16a34a",
  "transporte": "#7c3aed",
  "compras": "#db2777",
};

function markerColor(type?: string): string {
  const t = type?.toLowerCase().trim() ?? "";
  for (const [key, color] of Object.entries(TYPE_COLORS)) {
    if (t.includes(key)) return color;
  }
  return "#2563eb";
}

function createDayIcon(dayNumber: number, type?: string) {
  const color = markerColor(type);
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${dayNumber}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useMemo(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [50, 50], maxZoom: 15 });
    }
  }, [positions, map]);
  return null;
}

export default function InteractiveMap({ activities = [] }: { activities?: Activity[] }) {
  const validActivities = useMemo(
    () => activities.filter(a => a.latitude && a.longitude),
    [activities]
  );

  const center: [number, number] = useMemo(() => {
    if (validActivities.length === 0) return [40.41678, -3.70379];
    const lat = validActivities.reduce((s, a) => s + a.latitude, 0) / validActivities.length;
    const lng = validActivities.reduce((s, a) => s + a.longitude, 0) / validActivities.length;
    return [lat, lng];
  }, [validActivities]);

  const positions = useMemo(
    () => validActivities.map<[number, number]>(a => [a.latitude, a.longitude]),
    [validActivities]
  );

  const routePath = useMemo(
    () =>
      [...validActivities]
        .sort((a, b) => a.dayNumber - b.dayNumber)
        .map<[number, number]>(a => [a.latitude, a.longitude]),
    [validActivities]
  );

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-zinc-200 shadow-inner">
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validActivities.length > 0 && <FitBounds positions={positions} />}

        {validActivities.map(activity => (
          <Marker
            key={activity.id}
            position={[activity.latitude, activity.longitude]}
            icon={createDayIcon(activity.dayNumber, activity.type)}
          >
            <Popup>
              <div className="p-1">
                <p className="font-bold text-sm text-zinc-900">{activity.locationName}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{activity.startTime}</p>
                <p className="text-xs text-zinc-600 mt-1 italic">{activity.note}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {routePath.length > 1 && (
          <Polyline
            positions={routePath}
            pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.6, dashArray: "8 6" }}
          />
        )}
      </MapContainer>

      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-200 shadow-sm text-sm font-bold flex items-center gap-2 z-[1000]">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Mapa Interactivo
      </div>

      <div className="absolute bottom-8 left-4 bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-zinc-200 shadow-sm z-[1000] flex flex-col gap-1.5">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 text-xs font-medium text-zinc-700">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </div>
        ))}
      </div>
    </div>
  );
}
