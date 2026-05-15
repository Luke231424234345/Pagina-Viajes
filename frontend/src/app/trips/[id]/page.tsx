"use client";
import InteractiveMap from "@/components/InteractiveMap";
import AddActivityModal from "@/components/AddActivityModal";
import ImportExcelModal from "@/components/ImportExcelModal";
import SuggestionsPanel from "@/components/SuggestionsPanel";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

export default function TripDetail() {
  const params = useParams();
  const [tripData, setTripData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"itinerary" | "suggestions">("itinerary");

  const fetchTrip = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/trips/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setTripData(data);
        setSelectedDay(data.days?.[0]?.dayNumber ?? null);
      }
    } catch (error) {
      console.error("Error fetching trip:", error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) fetchTrip();
  }, [params.id, fetchTrip]);

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <p className="text-sm tracking-widest uppercase animate-pulse" style={{ color: "var(--text-muted)", letterSpacing: "0.2em" }}>
        Cargando itinerario...
      </p>
    </div>
  );

  if (!tripData) return (
    <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No se encontró el viaje.</p>
    </div>
  );

  const { trip, days } = tripData;

  const allActivities = days.flatMap((day: any) =>
    day.activities.map((act: any) => ({ ...act, dayNumber: day.dayNumber }))
  );

  const handleActivityAdded = (dayNumber: number, activity: any) => {
    setTripData((prev: any) => {
      const exists = prev.days.find((d: any) => d.dayNumber === dayNumber);
      const updatedDays = exists
        ? prev.days.map((d: any) => d.dayNumber === dayNumber ? { ...d, activities: [...d.activities, activity] } : d)
        : [...prev.days, { id: `day-${dayNumber}`, dayNumber, activities: [activity] }].sort((a: any, b: any) => a.dayNumber - b.dayNumber);
      return { ...prev, days: updatedDays };
    });
  };

  const handleExcelImported = (byDay: Record<number, any[]>) => {
    setTripData((prev: any) => {
      let updatedDays = [...prev.days];
      Object.entries(byDay).forEach(([dayNum, acts]) => {
        const dn = Number(dayNum);
        const exists = updatedDays.find((d: any) => d.dayNumber === dn);
        if (exists) {
          updatedDays = updatedDays.map((d: any) => d.dayNumber === dn ? { ...d, activities: [...d.activities, ...acts] } : d);
        } else {
          updatedDays.push({ id: `day-${dn}`, dayNumber: dn, activities: acts });
        }
      });
      return { ...prev, days: updatedDays.sort((a: any, b: any) => a.dayNumber - b.dayNumber) };
    });
  };

  const mapActivities = selectedDay === null
    ? allActivities
    : allActivities.filter((a: any) => a.dayNumber === selectedDay);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* Sidebar */}
      <div className="w-full md:w-[360px] shrink-0 flex flex-col h-full" style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}>

        {/* Header */}
        <div className="px-6 py-5 flex items-start justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <Link href="/dashboard" className="text-xs tracking-widest uppercase mb-3 block transition-opacity hover:opacity-60"
              style={{ color: "var(--text-muted)", letterSpacing: "0.15em" }}>
              ← Atlas
            </Link>
            <h1 className="text-xl font-semibold leading-tight" style={{ fontFamily: "Georgia, serif", color: "var(--text)", letterSpacing: "-0.01em" }}>
              {trip.name}
            </h1>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              {trip.destination} · {trip.numberOfDays} días
            </p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="w-8 h-8 flex items-center justify-center text-lg transition-all mt-6"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "2px", background: "var(--bg)" }}
            title="Añadir destino"
          >
            +
          </button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          {([["itinerary", "Itinerario"], ["suggestions", "Sugerencias"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSidebarTab(key)}
              className="flex-1 py-3 text-xs font-medium tracking-wide transition-all"
              style={{
                borderBottom: sidebarTab === key ? "2px solid var(--accent)" : "2px solid transparent",
                color: sidebarTab === key ? "var(--text)" : "var(--text-muted)",
                background: "transparent",
                letterSpacing: "0.06em",
              }}
            >
              {label}
              {key === "suggestions" && (
                <span style={{ marginLeft: 6, fontSize: 9, color: "var(--accent)", fontWeight: 700 }}>✦</span>
              )}
            </button>
          ))}
        </div>

        {/* Suggestions tab */}
        {sidebarTab === "suggestions" && (
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <SuggestionsPanel
              days={days}
              tripId={trip.id}
              onApplied={() => { fetchTrip(); setSidebarTab("itinerary"); }}
            />
          </div>
        )}

        {/* Itinerary tab — days list */}
        {sidebarTab === "itinerary" && (
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {days.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Sin actividades aún.</p>
              <button onClick={() => setShowAddModal(true)} className="text-sm mt-3 underline underline-offset-2" style={{ color: "var(--accent)" }}>
                Añadir destino
              </button>
            </div>
          ) : days.map((day: any) => (
            <div key={day.id}>
              <button
                className="w-full flex items-center justify-between mb-4 group"
                onClick={() => setSelectedDay(day.dayNumber === selectedDay ? null : day.dayNumber)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center text-[10px] font-bold transition-all"
                    style={{
                      background: selectedDay === day.dayNumber ? "var(--accent)" : "var(--bg)",
                      color: selectedDay === day.dayNumber ? "var(--dark)" : "var(--text-secondary)",
                      border: `1px solid ${selectedDay === day.dayNumber ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: "2px",
                    }}
                  >
                    {day.dayNumber}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    Día {day.dayNumber}
                  </span>
                </div>
                <span className="text-[10px] tracking-widest uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.15em" }}>
                  {day.activities.length} paradas
                </span>
              </button>

              <div className="space-y-2 ml-8">
                {day.activities.map((activity: any, idx: number) => (
                  <div key={activity.id} className="py-3 px-4 transition-all cursor-pointer"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "2px" }}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] tracking-widest uppercase font-medium" style={{ color: "var(--accent)", letterSpacing: "0.12em" }}>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{activity.startTime}</span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {activity.locationName || activity.note}
                    </p>
                    {activity.note && activity.note !== activity.locationName && (
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {activity.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Footer */}
        <div className="px-6 py-5" style={{ borderTop: "1px solid var(--border)" }}>
          <button className="w-full py-2.5 text-sm font-medium tracking-wide transition-all"
            style={{ background: "var(--accent)", color: "#0C0C0A", borderRadius: "2px" }}>
            Exportar itinerario
          </button>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddActivityModal
          tripId={trip.id}
          days={days}
          defaultDay={selectedDay ?? days[0]?.dayNumber}
          onClose={() => setShowAddModal(false)}
          onAdded={handleActivityAdded}
        />
      )}
      {showExcelModal && (
        <ImportExcelModal
          tripId={trip.id}
          existingDays={days.map((d: any) => d.dayNumber)}
          onClose={() => setShowExcelModal(false)}
          onImported={handleExcelImported}
        />
      )}

      {/* Map panel */}
      <div className="hidden md:flex flex-col flex-1">
        {/* Day selector bar */}
        <div className="flex items-center gap-2 px-5 py-3 overflow-x-auto shrink-0" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
          <button onClick={() => setShowExcelModal(true)}
            className="shrink-0 px-3 py-1.5 text-xs font-medium tracking-wide transition-all flex items-center gap-1.5"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "2px", background: "var(--bg)" }}
          >
            Excel
          </button>
          <div className="w-px h-4 shrink-0" style={{ background: "var(--border)" }} />
          <button onClick={() => setSelectedDay(null)}
            className="shrink-0 px-3 py-1.5 text-xs font-medium tracking-wide transition-all"
            style={{
              background: selectedDay === null ? "var(--dark)" : "transparent",
              color: selectedDay === null ? "var(--bg)" : "var(--text-secondary)",
              border: `1px solid ${selectedDay === null ? "var(--dark)" : "var(--border)"}`,
              borderRadius: "2px",
            }}
          >
            Todos
          </button>
          {days.map((day: any) => (
            <button key={day.dayNumber}
              onClick={() => setSelectedDay(day.dayNumber === selectedDay ? null : day.dayNumber)}
              className="shrink-0 px-3 py-1.5 text-xs font-medium tracking-wide transition-all"
              style={{
                background: selectedDay === day.dayNumber ? "var(--dark)" : "transparent",
                color: selectedDay === day.dayNumber ? "var(--bg)" : "var(--text-secondary)",
                border: `1px solid ${selectedDay === day.dayNumber ? "var(--dark)" : "var(--border)"}`,
                borderRadius: "2px",
              }}
            >
              Día {day.dayNumber}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <InteractiveMap activities={mapActivities} />
        </div>
      </div>
    </div>
  );
}
