"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

interface ParsedRow {
  day: number;
  locationName: string;
  type: string;
  latitude?: number;
  longitude?: number;
  status: "pending" | "geocoding" | "ok" | "error";
}

interface Props {
  tripId?: string;
  existingDays?: number[];
  onClose: () => void;
  onImported?: (byDay: Record<number, any[]>) => void;
}

const TYPE_COLORS: Record<string, string> = {
  atracción: "#2563eb",
  restaurante: "#ea580c",
  hotel: "#16a34a",
  transporte: "#7c3aed",
  compras: "#db2777",
};

function typeColor(type: string) {
  const key = type?.toLowerCase().trim();
  for (const [k, v] of Object.entries(TYPE_COLORS)) {
    if (key?.includes(k)) return v;
  }
  return "#4A4845";
}

function typeEmoji(type: string) {
  const t = type?.toLowerCase() ?? "";
  if (t.includes("restaurante") || t.includes("comida") || t.includes("café") || t.includes("cafe")) return "🍽";
  if (t.includes("hotel") || t.includes("alojamiento") || t.includes("hostal")) return "🏨";
  if (t.includes("transporte") || t.includes("aeropuerto") || t.includes("estación")) return "🚉";
  if (t.includes("compras") || t.includes("mercado") || t.includes("tienda")) return "🛍";
  return "📍";
}

interface CityInfo { lat: number; lng: number; viewbox: string }

function distKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371, r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(lat2 - lat1), dLon = r(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getCityInfo(city: string): Promise<CityInfo | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      { headers: { "Accept-Language": "es" } }
    );
    const data = await res.json();
    if (!data[0]) return null;
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (data[0].boundingbox) {
      const [sLat, nLat, wLon, eLon] = data[0].boundingbox.map(Number);
      const lp = (nLat - sLat) * 0.5, op = (eLon - wLon) * 0.5;
      return { lat, lng, viewbox: `${wLon - op},${nLat + lp},${eLon + op},${sLat - lp}` };
    }
    // fallback: ~60 km box around center
    const d = 0.55;
    return { lat, lng, viewbox: `${lng - d},${lat + d},${lng + d},${lat - d}` };
  } catch {}
  return null;
}

async function geocode(
  locationName: string,
  city: string,
  cityInfo: CityInfo | null,
): Promise<{ lat: number; lng: number } | null> {
  const MAX_KM = 280; // reject anything farther than this from city center
  const H = { "Accept-Language": "es" };
  const base = `https://nominatim.openstreetmap.org/search?format=json&limit=3`;

  const bestInCity = (results: any[]): { lat: number; lng: number } | null => {
    for (const r of results) {
      const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
      if (!cityInfo || distKm(cityInfo.lat, cityInfo.lng, lat, lng) <= MAX_KM) {
        return { lat, lng };
      }
    }
    return null;
  };

  try {
    const q = encodeURIComponent(`${locationName}, ${city}`);

    // Pass 1: bounded to expanded city box
    if (cityInfo?.viewbox) {
      const d1 = await (await fetch(`${base}&q=${q}&viewbox=${cityInfo.viewbox}&bounded=1`, { headers: H })).json();
      const r1 = bestInCity(d1);
      if (r1) return r1;
      await sleep(150);
    }

    // Pass 2: prefer city area, not strictly bounded
    if (cityInfo?.viewbox) {
      const d2 = await (await fetch(`${base}&q=${q}&viewbox=${cityInfo.viewbox}`, { headers: H })).json();
      const r2 = bestInCity(d2);
      if (r2) return r2;
      await sleep(150);
    }

    // Pass 3: no viewbox — but still validate distance
    const d3 = await (await fetch(`${base}&q=${q}`, { headers: H })).json();
    return bestInCity(d3);
  } catch {}
  return null;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

const S = {
  overlay: {
    position: "fixed" as const, inset: 0, zIndex: 50,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    background: "rgba(12,12,10,0.75)", backdropFilter: "blur(6px)",
  },
  modal: {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4,
    width: "100%", maxWidth: 480, maxHeight: "90vh",
    display: "flex", flexDirection: "column" as const,
    boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
  },
  header: {
    padding: "24px 28px", borderBottom: "1px solid var(--border)",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0,
  },
  body: { flex: 1, overflowY: "auto" as const, padding: "28px 28px" },
  footer: { padding: "20px 28px", borderTop: "1px solid var(--border)", flexShrink: 0 },
  input: {
    width: "100%", padding: "10px 14px", boxSizing: "border-box" as const,
    background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 2,
    color: "var(--text)", fontSize: 14, outline: "none", fontFamily: "inherit",
  },
  btnPrimary: {
    width: "100%", padding: "11px 0", background: "var(--accent)",
    color: "#0C0C0A", border: "none", borderRadius: 2, fontSize: 13,
    fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const,
    cursor: "pointer", fontFamily: "inherit",
  },
  btnGhost: {
    padding: "11px 0", background: "transparent",
    color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 2,
    fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
  },
};

export default function ImportExcelModal({ tripId, existingDays, onClose, onImported }: Props) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [stage, setStage] = useState<"city" | "upload" | "preview" | "classifying" | "geocoding" | "saving" | "done">("city");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (raw.length < 2) { setError("El archivo está vacío."); return; }
        const headers = raw[0].map((h: any) => String(h).toLowerCase().trim());
        const dayCol = headers.findIndex((h: string) => h.includes("día") || h.includes("dia") || h === "day");
        const locCol = headers.findIndex((h: string) => h.includes("lugar") || h.includes("location") || h.includes("destino") || h.includes("place"));
        if (dayCol === -1 || locCol === -1) { setError(`Necesito las columnas "Día" y "Lugar".`); return; }
        let lastDay = 1;
        const parsed: ParsedRow[] = raw.slice(1)
          .filter(r => {
            const loc = String(r[locCol] ?? "").trim();
            return loc !== "" && loc !== "undefined";
          })
          .map(r => {
            const rawDay = String(r[dayCol] ?? "").trim();
            if (rawDay !== "" && !isNaN(Number(rawDay))) lastDay = Number(rawDay);
            return { day: lastDay, locationName: String(r[locCol]).trim(), type: "atracción", status: "pending" };
          });
        if (parsed.length === 0) { setError("No se encontraron filas con datos."); return; }
        setRows(parsed);
        setStage("preview");
      } catch { setError("No se pudo leer el archivo. Usa .xlsx o .xls."); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    setStage("classifying");
    setProgress(0);
    let updated = [...rows];
    try {
      const uniqueLocations = [...new Set(updated.map(r => r.locationName))];
      const res = await fetch("https://pagina-viajes.onrender.com/api/classify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations: uniqueLocations, city }),
      });
      if (res.ok) {
        const { map } = await res.json();
        updated = updated.map(r => ({ ...r, type: map[r.locationName] ?? "atracción" }));
        setRows([...updated]);
      }
    } catch {}

    setStage("geocoding");
    const cityInfo = await getCityInfo(city);
    await sleep(300);
    const cache: Record<string, { lat: number; lng: number } | null> = {};
    for (let i = 0; i < updated.length; i++) {
      const key = updated[i].locationName;
      setProgress(Math.round((i / updated.length) * 60));
      updated[i] = { ...updated[i], status: "geocoding" };
      setRows([...updated]);
      if (!(key in cache)) { cache[key] = await geocode(key, city, cityInfo); await sleep(300); }
      const coords = cache[key];
      updated[i] = { ...updated[i], latitude: coords?.lat ?? 0, longitude: coords?.lng ?? 0, status: coords ? "ok" : "error" };
      setRows([...updated]);
    }

    setStage("saving");
    const byDay: Record<number, any[]> = {};
    let resolvedTripId = tripId;
    if (!resolvedTripId) {
      const maxDay = Math.max(...updated.map(r => r.day));
      const res = await fetch("https://pagina-viajes.onrender.com/api/trips", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: city, duration: maxDay, interests: [], pace: "medium", skipAI: true }),
      });
      const data = await res.json();
      resolvedTripId = data.trip.id;
    }
    for (let i = 0; i < updated.length; i++) {
      const row = updated[i];
      setProgress(60 + Math.round((i / updated.length) * 40));
      try {
        const res = await fetch(`https://pagina-viajes.onrender.com/api/trips/${resolvedTripId}/days/${row.day}/activities`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locationName: row.locationName, startTime: "09:00", note: row.type, latitude: row.latitude ?? 0, longitude: row.longitude ?? 0, type: row.type }),
        });
        if (res.ok) {
          const act = await res.json();
          if (!byDay[row.day]) byDay[row.day] = [];
          byDay[row.day].push({ ...act, dayNumber: row.day, type: row.type });
        }
      } catch {}
    }
    setProgress(100);
    setStage("done");
    setTimeout(() => {
      if (onImported) { onImported(byDay); onClose(); }
      else { router.push(`/trips/${resolvedTripId}`); onClose(); }
    }, 800);
  };

  const dayGroups = rows.reduce<Record<number, ParsedRow[]>>((acc, r) => {
    if (!acc[r.day]) acc[r.day] = [];
    acc[r.day].push(r);
    return acc;
  }, {});

  const stageLabel = (s: string) => {
    if (s === "city") return "01";
    if (s === "upload") return "02";
    if (s === "preview") return "03";
    return "04";
  };

  return (
    <div style={S.overlay}>
      <div style={S.modal}>

        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--accent)", fontWeight: 600 }}>
                {stageLabel(stage)}
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", fontFamily: "Georgia, serif", letterSpacing: "-0.01em" }}>
                Importar desde Excel
              </h3>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.04em" }}>
              {city
                ? <span>✦ <strong style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{city}</strong></span>
                : "Columnas: Día · Lugar"}
            </p>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)", fontSize: 20, lineHeight: 1, background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            ×
          </button>
        </div>

        {/* Body */}
        <div style={S.body}>

          {/* STEP 1 — City */}
          {stage === "city" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>✈</div>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 320, margin: "0 auto" }}>
                  ¿A qué ciudad vas? Con este contexto ubico los lugares correctamente en el mapa.
                </p>
              </div>
              <input
                type="text"
                placeholder="Ej: Ciudad de México, Tokyo, París..."
                value={city}
                onChange={e => setCity(e.target.value)}
                onKeyDown={e => e.key === "Enter" && city.trim() && setStage("upload")}
                style={S.input}
                autoFocus
              />
              <button
                onClick={() => setStage("upload")}
                disabled={!city.trim()}
                style={{ ...S.btnPrimary, opacity: city.trim() ? 1 : 0.4 }}
              >
                Continuar →
              </button>
            </div>
          )}

          {/* STEP 2 — Upload */}
          {stage === "upload" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Format table */}
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 2, padding: "14px 16px" }}>
                <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
                  Formato del archivo
                </p>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Día", "Lugar"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "6px 12px 6px 0", color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[["1", "Torre Latinoamericana"], ["1", "El Cardenal"], ["2", "Teotihuacán"], ["2", "Hotel Zócalo Central"]].map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "6px 12px 6px 0", color: "var(--accent)", fontWeight: 600 }}>{r[0]}</td>
                        <td style={{ padding: "6px 12px 6px 0", color: "var(--text-secondary)" }}>{r[1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, letterSpacing: "0.03em" }}>
                  ✦ La IA clasifica el tipo automáticamente
                </p>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: "1px dashed var(--border)", borderRadius: 2, padding: "36px 24px",
                  textAlign: "center", cursor: "pointer",
                  background: "var(--bg)",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.6 }}>📂</div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                  Haz clic para seleccionar
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>.xlsx o .xls</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: "none" }} />
              </div>

              {error && <p style={{ fontSize: 12, color: "#dc2626", textAlign: "center" }}>{error}</p>}

              <button onClick={() => setStage("city")}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", letterSpacing: "0.05em" }}>
                ← Cambiar ciudad
              </button>
            </div>
          )}

          {/* STEP 3 — Preview */}
          {stage === "preview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", letterSpacing: "0.04em" }}>
                {rows.length} lugares · {Object.keys(dayGroups).length} días
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 340, overflowY: "auto" }}>
                {Object.entries(dayGroups).sort(([a], [b]) => Number(a) - Number(b)).map(([day, acts]) => (
                  <div key={day} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 2, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{
                        width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, background: "var(--accent)", color: "#0C0C0A",
                        borderRadius: 2, flexShrink: 0,
                      }}>{day}</div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", letterSpacing: "0.05em" }}>
                        Día {day}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {acts.map((a, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: typeColor(a.type), flexShrink: 0 }} />
                          <span style={{ color: "var(--text-secondary)", flex: 1 }}>{a.locationName}</span>
                          <span style={{ fontSize: 13 }}>{typeEmoji(a.type)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4 — Progress */}
          {(stage === "classifying" || stage === "geocoding" || stage === "saving" || stage === "done") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "12px 0" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{stage === "done" ? "✓" : "⏳"}</div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                  {stage === "classifying" && "Clasificando lugares con IA..."}
                  {stage === "geocoding" && "Buscando coordenadas..."}
                  {stage === "saving" && "Guardando en el mapa..."}
                  {stage === "done" && "¡Listo!"}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{progress}%</p>
              </div>

              {/* Progress bar */}
              <div style={{ background: "var(--bg)", borderRadius: 2, height: 3, border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "var(--accent)", width: `${progress}%`, transition: "width 0.3s ease" }} />
              </div>

              {stage === "geocoding" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
                  {rows.map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11 }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                        background: r.status === "ok" ? "#16a34a" : r.status === "error" ? "#dc2626" : r.status === "geocoding" ? "var(--accent)" : "var(--border)",
                      }} />
                      <span style={{ color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.locationName}</span>
                      <span style={{ fontSize: 12 }}>{typeEmoji(r.type)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — only on preview */}
        {stage === "preview" && (
          <div style={{ ...S.footer, display: "flex", gap: 10 }}>
            <button onClick={() => setStage("upload")} style={{ ...S.btnGhost, flex: "0 0 auto", padding: "11px 20px" }}>
              ← Atrás
            </button>
            <button onClick={handleImport} style={{ ...S.btnPrimary, flex: 1 }}>
              Importar {rows.length} lugares
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
