"use client";
import { useMemo, useState } from "react";

// ── types ──────────────────────────────────────────────────────────────────
interface Activity {
  id: string;
  locationName: string;
  latitude: number;
  longitude: number;
  dayNumber: number;
  type?: string;
  startTime?: string;
}

interface Suggestion {
  dayNumbers: number[];
  suggestedByDay: Record<number, Activity[]>;
  currentDistKm: number;
  suggestedDistKm: number;
  improvementPct: number;
  moves: { activityId: string; dayNumber: number }[];
}

interface Props {
  days: { id: string; dayNumber: number; activities: any[] }[];
  tripId: string;
  onApplied: () => void;
}

// ── algorithm ──────────────────────────────────────────────────────────────
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(lat2 - lat1);
  const dLon = r(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function centroid(acts: Activity[]) {
  const v = acts.filter((a) => a.latitude !== 0 || a.longitude !== 0);
  if (!v.length) return { lat: 0, lng: 0 };
  return {
    lat: v.reduce((s, a) => s + a.latitude, 0) / v.length,
    lng: v.reduce((s, a) => s + a.longitude, 0) / v.length,
  };
}

function routeKm(acts: Activity[]) {
  const v = acts.filter((a) => a.latitude !== 0 || a.longitude !== 0);
  let total = 0;
  for (let i = 1; i < v.length; i++)
    total += haversine(v[i - 1].latitude, v[i - 1].longitude, v[i].latitude, v[i].longitude);
  return total;
}

function totalKm(byDay: Record<number, Activity[]>) {
  return Object.values(byDay).reduce((s, acts) => s + routeKm(acts), 0);
}

function buildSuggestion(days: Props["days"]): Suggestion | null {
  const allActs: Activity[] = days.flatMap((d) =>
    d.activities.map((a: any) => ({ ...a, dayNumber: d.dayNumber }))
  );

  const dayNums = [...new Set(allActs.map((a) => a.dayNumber))].sort((a, b) => a - b);
  const k = dayNums.length;
  const validActs = allActs.filter((a) => a.latitude !== 0 || a.longitude !== 0);

  if (k < 2 || validActs.length < 3) return null;

  // initialise centroids from current day centroids
  const origCentroids = dayNums.map((d) =>
    centroid(allActs.filter((a) => a.dayNumber === d))
  );
  let centers = origCentroids.map((c) =>
    c.lat === 0 && c.lng === 0 ? centroid(validActs) : c
  );

  // k-means
  let assignments = validActs.map((a) => {
    const dists = centers.map((c) => haversine(a.latitude, a.longitude, c.lat, c.lng));
    return dists.indexOf(Math.min(...dists));
  });

  for (let iter = 0; iter < 60; iter++) {
    const newCenters = Array.from({ length: k }, (_, i) => {
      const cluster = validActs.filter((_, j) => assignments[j] === i);
      return cluster.length > 0 ? centroid(cluster) : centers[i];
    });
    const newAss = validActs.map((a) => {
      const dists = newCenters.map((c) => haversine(a.latitude, a.longitude, c.lat, c.lng));
      return dists.indexOf(Math.min(...dists));
    });
    const changed = newAss.some((v, i) => v !== assignments[i]);
    assignments = newAss;
    centers = newCenters;
    if (!changed) break;
  }

  // map cluster → day number (greedy nearest original centroid)
  const clusterToDay: number[] = new Array(k).fill(-1);
  const usedIdx = new Set<number>();
  for (let ci = 0; ci < k; ci++) {
    let best = -1, bestD = Infinity;
    for (let di = 0; di < k; di++) {
      if (usedIdx.has(di)) continue;
      const d = haversine(centers[ci].lat, centers[ci].lng, origCentroids[di].lat, origCentroids[di].lng);
      if (d < bestD) { bestD = d; best = di; }
    }
    clusterToDay[ci] = dayNums[best];
    usedIdx.add(best);
  }

  // build suggested activity list
  const suggestedValid: Activity[] = validActs.map((a, i) => ({
    ...a,
    dayNumber: clusterToDay[assignments[i]],
  }));
  const noCoord = allActs.filter((a) => a.latitude === 0 && a.longitude === 0);
  const allSuggested = [...suggestedValid, ...noCoord];

  const currentByDay = dayNums.reduce<Record<number, Activity[]>>((acc, d) => {
    acc[d] = allActs.filter((a) => a.dayNumber === d);
    return acc;
  }, {});
  const suggestedByDay = dayNums.reduce<Record<number, Activity[]>>((acc, d) => {
    acc[d] = allSuggested.filter((a) => a.dayNumber === d);
    return acc;
  }, {});

  const currentDistKm = totalKm(currentByDay);
  const suggestedDistKm = totalKm(suggestedByDay);
  const improvementPct = currentDistKm > 0
    ? ((currentDistKm - suggestedDistKm) / currentDistKm) * 100
    : 0;

  const moves = allSuggested
    .filter((a) => {
      const orig = allActs.find((o) => o.id === a.id);
      return orig && orig.dayNumber !== a.dayNumber;
    })
    .map((a) => ({ activityId: a.id, dayNumber: a.dayNumber }));

  return { dayNumbers: dayNums, suggestedByDay, currentDistKm, suggestedDistKm, improvementPct, moves };
}

// ── component ──────────────────────────────────────────────────────────────
const TYPE_EMOJI: Record<string, string> = {
  restaurante: "🍽", hotel: "🏨", transporte: "🚉", compras: "🛍",
};
function emoji(type?: string) {
  const t = type?.toLowerCase() ?? "";
  for (const [k, v] of Object.entries(TYPE_EMOJI)) if (t.includes(k)) return v;
  return "📍";
}

export default function SuggestionsPanel({ days, tripId, onApplied }: Props) {
  const suggestion = useMemo(() => buildSuggestion(days), [days]);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  // original dayNumber lookup for "moved from" label
  const originalDay: Record<string, number> = {};
  days.forEach((d) => d.activities.forEach((a: any) => { originalDay[a.id] = d.dayNumber; }));

  const apply = async () => {
    if (!suggestion) return;
    setApplying(true);
    try {
      await fetch(`https://pagina-viajes.onrender.com/api/trips/${tripId}/reorganize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moves: suggestion.moves }),
      });
      setApplied(true);
      setTimeout(onApplied, 600);
    } catch {
      setApplying(false);
    }
  };

  // ── not enough data ──
  if (!suggestion) {
    return (
      <div style={{ padding: "32px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 16, opacity: 0.4 }}>🗺</div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
          Necesitas al menos 2 días con actividades geocodificadas para ver sugerencias de optimización.
        </p>
      </div>
    );
  }

  // ── already optimal ──
  if (suggestion.improvementPct < 8) {
    return (
      <div style={{ padding: "32px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 16 }}>✓</div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
          El itinerario ya está bien optimizado
        </p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
          Los lugares de cada día están geográficamente agrupados.
          No hay reorganización significativa que sugerir.
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>
          Distancia total estimada: {suggestion.currentDistKm.toFixed(1)} km
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Header metric */}
      <div style={{
        margin: "0 0 20px",
        padding: "14px 16px",
        background: "rgba(201,168,108,0.07)",
        border: "1px solid rgba(201,168,108,0.2)",
        borderRadius: 2,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            ✦ Reorganización sugerida
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
            -{suggestion.improvementPct.toFixed(0)}%
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 11, color: "var(--text-muted)" }}>
          <span style={{ textDecoration: "line-through" }}>{suggestion.currentDistKm.toFixed(1)} km</span>
          <span>→</span>
          <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{suggestion.suggestedDistKm.toFixed(1)} km</span>
          <span>· desplazamiento estimado</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
          {suggestion.moves.length} actividad{suggestion.moves.length !== 1 ? "es" : ""} cambiaría{suggestion.moves.length !== 1 ? "n" : ""} de día
        </div>
      </div>

      {/* Suggested days */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {suggestion.dayNumbers.map((d) => {
          const acts = suggestion.suggestedByDay[d] ?? [];
          const km = routeKm(acts);
          return (
            <div key={d}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700,
                    background: "var(--accent)", color: "#0C0C0A",
                    borderRadius: 2, flexShrink: 0,
                  }}>{d}</div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Día {d}</span>
                </div>
                <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                  {acts.length} paradas · {km > 0 ? `~${km.toFixed(1)} km` : "sin coords"}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginLeft: 28 }}>
                {acts.map((a, idx) => {
                  const fromDay = originalDay[a.id];
                  const moved = fromDay !== d;
                  return (
                    <div key={a.id} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 10px",
                      background: moved ? "rgba(201,168,108,0.05)" : "var(--bg)",
                      border: `1px solid ${moved ? "rgba(201,168,108,0.25)" : "var(--border)"}`,
                      borderRadius: 2,
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: moved ? "var(--accent)" : "var(--text-muted)", minWidth: 18 }}>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.locationName}
                      </span>
                      {moved && (
                        <span style={{
                          fontSize: 9, fontWeight: 600, letterSpacing: "0.08em",
                          color: "var(--accent)", background: "rgba(201,168,108,0.12)",
                          padding: "2px 6px", borderRadius: 2, whiteSpace: "nowrap", flexShrink: 0,
                        }}>
                          ← Día {fromDay}
                        </span>
                      )}
                      {!moved && (
                        <span style={{ fontSize: 13, opacity: 0.5, flexShrink: 0 }}>{emoji(a.type)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Apply button */}
      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          onClick={apply}
          disabled={applying || applied}
          style={{
            width: "100%", padding: "11px 0",
            background: applied ? "rgba(22,163,74,0.15)" : "var(--accent)",
            color: applied ? "#16a34a" : "#0C0C0A",
            border: applied ? "1px solid rgba(22,163,74,0.3)" : "none",
            borderRadius: 2, fontSize: 12, fontWeight: 700,
            letterSpacing: "0.07em", textTransform: "uppercase",
            cursor: applying || applied ? "default" : "pointer",
            opacity: applying ? 0.6 : 1,
            fontFamily: "inherit",
            transition: "all 0.2s",
          }}
        >
          {applied ? "✓ Aplicado" : applying ? "Aplicando..." : "Aplicar reorganización"}
        </button>
        <p style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", letterSpacing: "0.04em" }}>
          Puedes deshacer volviendo a importar el Excel
        </p>
      </div>
    </div>
  );
}
