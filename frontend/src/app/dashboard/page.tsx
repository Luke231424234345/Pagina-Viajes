"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import CreateTripWizard from "@/components/CreateTripWizard";
import ImportExcelModal from "@/components/ImportExcelModal";

export default function Dashboard() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [trips, setTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await fetch("https://pagina-viajes.onrender.com/api/trips");
        if (response.ok) setTrips(await response.json());
      } catch {}
      finally { setIsLoading(false); }
    };
    fetchTrips();
  }, [isWizardOpen]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-5xl mx-auto px-8 py-12">

        {/* Header */}
        <header className="flex justify-between items-end mb-16">
          <div>
            <Link href="/" className="text-xs tracking-widest uppercase mb-4 block transition-colors"
              style={{ color: "var(--text-muted)", letterSpacing: "0.2em" }}>
              ← Atlas
            </Link>
            <h1 className="text-3xl font-bold" style={{ letterSpacing: "-0.02em", fontFamily: "Georgia, serif", color: "var(--text)" }}>
              Mis Viajes
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Tu colección de itinerarios</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsExcelOpen(true)}
              className="px-5 py-2.5 text-sm font-medium tracking-wide transition-all flex items-center gap-2"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "2px", background: "var(--surface)" }}
            >
              Importar Excel
            </button>
            <button onClick={() => setIsWizardOpen(true)}
              className="px-5 py-2.5 text-sm font-medium tracking-wide transition-all"
              style={{ background: "var(--text)", color: "var(--bg)", borderRadius: "2px" }}
            >
              + Nuevo viaje
            </button>
          </div>
        </header>

        {/* Content */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-40 rounded-sm animate-pulse" style={{ background: "var(--border)" }} />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="py-24 text-center" style={{ border: "1px solid var(--border)", borderRadius: "2px", background: "var(--surface)" }}>
            <p className="text-xs tracking-widest uppercase mb-6" style={{ color: "var(--text-muted)", letterSpacing: "0.2em" }}>
              Sin itinerarios
            </p>
            <h3 className="text-2xl font-semibold mb-3" style={{ fontFamily: "Georgia, serif", color: "var(--text)" }}>
              Empieza a planificar
            </h3>
            <p className="text-sm mb-10" style={{ color: "var(--text-secondary)" }}>
              Crea tu primer itinerario con IA o importa desde Excel.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => setIsExcelOpen(true)}
                className="px-8 py-3 text-sm font-medium tracking-wide transition-all"
                style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "2px" }}
              >
                Importar desde Excel
              </button>
              <button onClick={() => setIsWizardOpen(true)}
                className="px-8 py-3 text-sm font-medium tracking-wide transition-all"
                style={{ background: "var(--text)", color: "var(--bg)", borderRadius: "2px" }}
              >
                Crear con IA
              </button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {trips.map(trip => (
              <Link key={trip.id} href={`/trips/${trip.id}`}>
                <div className="p-8 transition-all cursor-pointer group"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "2px" }}>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] tracking-widest uppercase px-2 py-1"
                      style={{ background: "var(--accent-light)", color: "var(--accent)", letterSpacing: "0.15em" }}>
                      {trip.status}
                    </span>
                    <span className="text-xs transition-colors" style={{ color: "var(--text-muted)" }}>→</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:opacity-70 transition-opacity"
                    style={{ fontFamily: "Georgia, serif", color: "var(--text)", letterSpacing: "-0.01em" }}>
                    {trip.name}
                  </h3>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {trip.destination} · {trip.numberOfDays} días
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateTripWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
      {isExcelOpen && <ImportExcelModal onClose={() => setIsExcelOpen(false)} />}
    </div>
  );
}
