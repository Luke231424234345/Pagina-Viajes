"use client";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260329_050842_be71947f-f16e-4a14-810c-06e83d23ddb5.mp4";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [destination, setDestination] = useState("");
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.src = VIDEO_URL;

    const fadeIn = () => {
      if (!overlayRef.current) return;
      let opacity = 1;
      const step = () => {
        if (!overlayRef.current) return;
        opacity = Math.max(0, opacity - 0.02);
        overlayRef.current.style.opacity = String(opacity);
        if (opacity > 0) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    };

    const onCanPlay = () => {
      setVideoReady(true);
      video.play().catch(() => {});
      fadeIn();
    };

    video.addEventListener("canplay", onCanPlay);
    video.load();

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0C0C0A", color: "#F0EDE6", fontFamily: "'Inter', sans-serif" }}>

      {/* ── HERO ── */}
      <section style={{ position: "relative", height: "100vh", minHeight: 680, overflow: "hidden" }}>

        {/* Video */}
        <video
          ref={videoRef}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />

        {/* Multi-layer overlay for contrast */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(12,12,10,0.72) 0%, rgba(12,12,10,0.35) 35%, rgba(12,12,10,0.55) 65%, rgba(12,12,10,0.88) 100%)",
          zIndex: 1,
        }} />

        {/* Fade cover (fades out when video loads) */}
        <div
          ref={overlayRef}
          style={{
            position: "absolute", inset: 0,
            background: "#0C0C0A",
            zIndex: 2,
            opacity: 1,
            pointerEvents: "none",
          }}
        />

        {/* ── NAV ── */}
        <header style={{
          position: "absolute", top: 0, left: 0, right: 0,
          zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "28px 56px",
        }}>
          {/* Logo */}
          <span style={{
            fontFamily: "'Schibsted Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#F0EDE6",
          }}>
            Atlas
          </span>

          {/* Links */}
          <nav style={{ display: "flex", gap: 40 }}>
            {["Explorar", "Destinos", "Comunidad", "Contacto"].map(item => (
              <a key={item} href="#"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  fontWeight: 400,
                  color: "rgba(240,237,230,0.65)",
                  textDecoration: "none",
                  letterSpacing: "0.025em",
                }}
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/dashboard"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(240,237,230,0.75)",
                textDecoration: "none",
                padding: "9px 22px",
                border: "1px solid rgba(240,237,230,0.2)",
                borderRadius: 2,
                letterSpacing: "0.025em",
                backdropFilter: "blur(4px)",
              }}
            >
              Ingresar
            </Link>
            <Link href="/dashboard"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: "#0C0C0A",
                textDecoration: "none",
                padding: "9px 22px",
                background: "#C9A86C",
                borderRadius: 2,
                letterSpacing: "0.025em",
              }}
            >
              Comenzar
            </Link>
          </div>
        </header>

        {/* ── HERO CONTENT ── */}
        <div style={{
          position: "relative", zIndex: 5,
          height: "100%",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center",
          padding: "80px 24px 40px",
        }}>

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            marginBottom: 36,
            padding: "7px 18px",
            border: "1px solid rgba(201,168,108,0.4)",
            borderRadius: 100,
            background: "rgba(201,168,108,0.1)",
            backdropFilter: "blur(8px)",
          }}>
            <span style={{ color: "#C9A86C", fontSize: 11 }}>✦</span>
            <span style={{ color: "#C9A86C", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em" }}>Nuevo</span>
            <span style={{ width: 1, height: 10, background: "rgba(201,168,108,0.35)" }} />
            <span style={{ color: "rgba(240,237,230,0.55)", fontSize: 11, letterSpacing: "0.05em" }}>Planifica tu próxima aventura</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'Fustat', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(54px, 8.5vw, 90px)",
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
            color: "#F0EDE6",
            marginBottom: 24,
            maxWidth: 720,
            textShadow: "0 2px 32px rgba(12,12,10,0.6)",
          }}>
            Cada viaje,<br />
            <span style={{ color: "#C9A86C" }}>perfectamente</span><br />
            orquestado.
          </h1>

          {/* Subtitle */}
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 15,
            fontWeight: 400,
            color: "rgba(240,237,230,0.6)",
            lineHeight: 1.8,
            maxWidth: 460,
            marginBottom: 44,
            textShadow: "0 1px 8px rgba(12,12,10,0.5)",
          }}>
            Inteligencia artificial que convierte tus destinos favoritos
            en un itinerario curado, día a día.
          </p>

          {/* Search box */}
          <div style={{
            width: "100%", maxWidth: 580,
            background: "rgba(16,16,14,0.82)",
            border: "1px solid rgba(240,237,230,0.1)",
            borderRadius: 6,
            backdropFilter: "blur(16px)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.45), 0 1px 0 rgba(240,237,230,0.05) inset",
            overflow: "hidden",
          }}>
            {/* Top row */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 20px",
              borderBottom: "1px solid rgba(240,237,230,0.07)",
            }}>
              <span style={{ fontSize: 11, color: "rgba(240,237,230,0.35)", letterSpacing: "0.04em", fontFamily: "'Inter', sans-serif" }}>
                5 viajes disponibles
              </span>
              <span style={{
                fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em",
                color: "#0C0C0A", background: "#C9A86C",
                padding: "2px 8px", borderRadius: 100,
                fontFamily: "'Inter', sans-serif",
              }}>Pro</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(240,237,230,0.28)", letterSpacing: "0.04em", fontFamily: "'Inter', sans-serif" }}>
                ✦ Impulsado por IA
              </span>
            </div>

            {/* Input */}
            <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", gap: 14 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,230,0.3)" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="¿A dónde quieres ir?"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && destination.trim()) window.location.href = `/dashboard?dest=${encodeURIComponent(destination.trim())}`; }}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#F0EDE6",
                  fontSize: 14,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  letterSpacing: "0.01em",
                }}
              />
              <Link
                href={destination.trim() ? `/dashboard?dest=${encodeURIComponent(destination.trim())}` : "/dashboard"}
                style={{
                  padding: "10px 22px",
                  background: "#C9A86C",
                  color: "#0C0C0A",
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                  textDecoration: "none",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Planificar
              </Link>
            </div>

            {/* Pills */}
            <div style={{
              display: "flex", gap: 8,
              padding: "10px 20px 14px",
            }}>
              {["✈ Destino", "⏱ Duración", "★ Intereses"].map(tag => (
                <button key={tag}
                  style={{
                    padding: "5px 14px",
                    background: "rgba(240,237,230,0.05)",
                    border: "1px solid rgba(240,237,230,0.09)",
                    borderRadius: 100,
                    color: "rgba(240,237,230,0.45)",
                    fontSize: 11,
                    fontFamily: "'Inter', sans-serif",
                    letterSpacing: "0.05em",
                    cursor: "pointer",
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Scroll hint */}
          <div style={{ marginTop: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: 0.35 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif" }}>Descubrir</span>
            <div style={{ width: 1, height: 32, background: "rgba(240,237,230,0.5)" }} />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "112px 56px", maxWidth: 1100, margin: "0 auto" }}>
        <p style={{
          fontSize: 10, textTransform: "uppercase", letterSpacing: "0.3em",
          color: "rgba(74,72,69,1)", textAlign: "center", marginBottom: 72,
          fontFamily: "'Inter', sans-serif",
        }}>
          Cómo funciona
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 64 }}>
          {[
            { num: "01", title: "Define tu viaje", desc: "Indica destino, duración e intereses. La IA construye el itinerario por ti." },
            { num: "02", title: "Itinerario curado", desc: "Lugares reales, horarios óptimos y rutas lógicas generadas en segundos." },
            { num: "03", title: "Mapa interactivo", desc: "Visualiza cada día en el mapa. Añade destinos e importa desde Excel." },
          ].map(f => (
            <div key={f.num} style={{ borderTop: "1px solid rgba(36,36,32,1)", paddingTop: 28 }}>
              <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "#C9A86C", marginBottom: 20, fontFamily: "'Inter', sans-serif" }}>{f.num}</p>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#F0EDE6", marginBottom: 12, fontFamily: "'Schibsted Grotesk', sans-serif", letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.85, color: "rgba(138,135,128,1)", fontFamily: "'Inter', sans-serif" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "0 56px 96px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{
          background: "#141412",
          border: "1px solid #242420",
          borderRadius: 4,
          padding: "72px 56px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Subtle gold glow */}
          <div style={{
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            width: 300, height: 1,
            background: "linear-gradient(90deg, transparent, rgba(201,168,108,0.4), transparent)",
          }} />
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.3em", color: "#C9A86C", marginBottom: 20, fontFamily: "'Inter', sans-serif" }}>
            Listo para empezar
          </p>
          <h2 style={{
            fontFamily: "'Fustat', sans-serif",
            fontWeight: 700,
            fontSize: "clamp(28px, 4vw, 42px)",
            letterSpacing: "-0.025em",
            color: "#F0EDE6",
            marginBottom: 36,
            lineHeight: 1.1,
          }}>
            Tu próximo viaje<br />empieza aquí.
          </h2>
          <Link href="/dashboard"
            style={{
              display: "inline-block",
              padding: "14px 40px",
              background: "#C9A86C",
              color: "#0C0C0A",
              borderRadius: 2,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
              textDecoration: "none",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Crear itinerario gratis
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: "24px 56px",
        borderTop: "1px solid #242420",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.25em", color: "#4A4845", fontFamily: "'Schibsted Grotesk', sans-serif" }}>
          Atlas
        </span>
        <p style={{ fontSize: 11, color: "#4A4845", fontFamily: "'Inter', sans-serif" }}>
          &copy; 2026 · Hecho para viajeros exigentes
        </p>
      </footer>

    </div>
  );
}
