"use client";
import { useState } from "react";

interface Props {
  tripId: string;
  days: { dayNumber: number }[];
  defaultDay?: number;
  onClose: () => void;
  onAdded: (dayNumber: number, activity: any) => void;
}

export default function AddActivityModal({ tripId, days, defaultDay, onClose, onAdded }: Props) {
  const [locationName, setLocationName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [dayNumber, setDayNumber] = useState(defaultDay ?? days[0]?.dayNumber ?? 1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "2px",
    color: "var(--text)",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim()) return;
    setIsLoading(true);
    setError("");

    try {
      let latitude = 0, longitude = 0;
      try {
        const geo = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`,
          { headers: { "Accept-Language": "es" } }
        );
        const geoData = await geo.json();
        if (geoData[0]) { latitude = parseFloat(geoData[0].lat); longitude = parseFloat(geoData[0].lon); }
      } catch {}

      const response = await fetch(
        `http://localhost:3002/api/trips/${tripId}/days/${dayNumber}/activities`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locationName, startTime, note: "", latitude, longitude }),
        }
      );

      if (!response.ok) throw new Error();
      const newActivity = await response.json();
      onAdded(dayNumber, { ...newActivity, dayNumber });
      onClose();
    } catch {
      setError("No se pudo agregar. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(14,14,12,0.6)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "var(--surface)", borderRadius: "2px", width: "100%", maxWidth: "420px", border: "1px solid var(--border)" }}>

        <div className="px-8 py-6 flex justify-between items-center" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-lg font-semibold" style={{ fontFamily: "Georgia, serif", color: "var(--text)" }}>
            Añadir destino
          </h3>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: "var(--text-muted)" }}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          <div>
            <label className="block text-[10px] tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.15em" }}>Día</label>
            <select value={dayNumber} onChange={e => setDayNumber(Number(e.target.value))} style={inputStyle}>
              {days.map(d => <option key={d.dayNumber} value={d.dayNumber}>Día {d.dayNumber}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.15em" }}>Lugar</label>
            <input
              type="text"
              placeholder="Ej: Museo del Prado, Madrid"
              value={locationName}
              onChange={e => setLocationName(e.target.value)}
              style={inputStyle}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)", letterSpacing: "0.15em" }}>Hora</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />
          </div>

          {error && <p className="text-xs" style={{ color: "#dc2626" }}>{error}</p>}

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium transition-all"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "2px" }}>
              Cancelar
            </button>
            <button type="submit" disabled={isLoading || !locationName.trim()}
              className="flex-1 py-2.5 text-sm font-medium tracking-wide transition-all disabled:opacity-40"
              style={{ background: "var(--text)", color: "var(--bg)", borderRadius: "2px" }}>
              {isLoading ? "Añadiendo..." : "Añadir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
