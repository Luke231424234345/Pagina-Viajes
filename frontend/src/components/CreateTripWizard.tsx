"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateTripWizard({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    destination: "",
    duration: "3",
    interests: [] as string[],
    pace: "medium",
  });

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("https://pagina-viajes.onrender.com/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const data = await response.json();
        router.push(`/trips/${data.trip.id}`);
        onClose();
      }
    } catch (error) {
      console.error("Error generating trip:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const interests = [
    { id: "popular", label: "Populares" },
    { id: "nature", label: "Naturaleza" },
    { id: "history", label: "Historia" },
    { id: "museums", label: "Museos" },
    { id: "food", label: "Gastronomía" },
    { id: "shopping", label: "Compras" },
  ];

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "2px",
    color: "var(--text)",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(14,14,12,0.6)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "var(--surface)", borderRadius: "2px", width: "100%", maxWidth: "480px", border: "1px solid var(--border)" }}>

        {/* Header */}
        <div className="px-8 py-6 flex justify-between items-center" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: "var(--accent)", letterSpacing: "0.2em" }}>
              Paso {step} de 3
            </p>
            <h3 className="text-lg font-semibold" style={{ fontFamily: "Georgia, serif", color: "var(--text)" }}>
              {step === 1 && "Destino y duración"}
              {step === 2 && "Intereses"}
              {step === 3 && "Confirmar"}
            </h3>
          </div>
          <button onClick={onClose} className="text-xl leading-none transition-colors" style={{ color: "var(--text-muted)" }}>×</button>
        </div>

        {/* Body */}
        <div className="px-8 py-8 space-y-6">
          {step === 1 && (
            <>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-3" style={{ color: "var(--text-muted)", letterSpacing: "0.15em" }}>
                  Destino
                </label>
                <input
                  type="text"
                  placeholder="Tokio, París, Ciudad de México..."
                  style={inputStyle}
                  value={formData.destination}
                  onChange={e => setFormData({ ...formData, destination: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-3" style={{ color: "var(--text-muted)", letterSpacing: "0.15em" }}>
                  Duración — <span style={{ color: "var(--accent)" }}>{formData.duration} días</span>
                </label>
                <input
                  type="range" min="1" max="14"
                  className="w-full accent-[#B8975A]"
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: e.target.value })}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>1</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>14</span>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div>
              <label className="block text-xs tracking-widest uppercase mb-4" style={{ color: "var(--text-muted)", letterSpacing: "0.15em" }}>
                Selecciona tus intereses
              </label>
              <div className="grid grid-cols-2 gap-2">
                {interests.map(i => (
                  <button key={i.id} onClick={() => toggleInterest(i.id)}
                    className="py-3 px-4 text-sm font-medium text-left transition-all"
                    style={{
                      border: `1px solid ${formData.interests.includes(i.id) ? "var(--accent)" : "var(--border)"}`,
                      background: formData.interests.includes(i.id) ? "var(--accent-light)" : "transparent",
                      color: formData.interests.includes(i.id) ? "var(--accent)" : "var(--text-secondary)",
                      borderRadius: "2px",
                    }}
                  >
                    {i.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="py-8 text-center">
                <p className="text-3xl mb-4">✦</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  La IA generará un itinerario curado para
                </p>
                <p className="text-xl font-semibold mt-2" style={{ fontFamily: "Georgia, serif", color: "var(--text)" }}>
                  {formData.destination}
                </p>
              </div>
              <div className="p-4 space-y-2" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "2px" }}>
                {[
                  ["Destino", formData.destination],
                  ["Duración", `${formData.duration} días`],
                  ["Intereses", formData.interests.length > 0 ? formData.interests.join(", ") : "General"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span style={{ color: "var(--text-muted)" }}>{k}</span>
                    <span style={{ color: "var(--text)", fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 flex justify-between gap-3" style={{ borderTop: "1px solid var(--border)" }}>
          {step > 1
            ? <button onClick={() => setStep(step - 1)} className="text-sm font-medium transition-colors" style={{ color: "var(--text-secondary)" }}>← Atrás</button>
            : <div />
          }
          {step < 3
            ? <button onClick={() => setStep(step + 1)}
                disabled={!formData.destination && step === 1}
                className="px-8 py-2.5 text-sm font-medium tracking-wide transition-all disabled:opacity-40"
                style={{ background: "var(--text)", color: "var(--bg)", borderRadius: "2px" }}
              >
                Siguiente →
              </button>
            : <button onClick={handleGenerate} disabled={isGenerating}
                className="px-8 py-2.5 text-sm font-medium tracking-wide transition-all disabled:opacity-50"
                style={{ background: "var(--accent)", color: "var(--dark)", borderRadius: "2px" }}
              >
                {isGenerating ? "Generando itinerario..." : "Generar itinerario"}
              </button>
          }
        </div>
      </div>
    </div>
  );
}
