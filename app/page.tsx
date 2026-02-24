"use client";

import { useRouter } from "next/navigation";
import { Flame, Sparkles } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      {/* Background glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: "20%", top: "30%", width: 500, height: 500, background: "radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", right: "20%", top: "30%", width: 500, height: 500, background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 60%)" }} />
      </div>

      <div style={{ maxWidth: 700, textAlign: "center", zIndex: 1 }}>
        {/* Logo */}
        <img src="/logo.png" alt="CardPulse" style={{ height: 60, width: "auto", objectFit: "contain", margin: "0 auto 28px", display: "block" }} />

        <h1 style={{
          fontFamily: "var(--font-oswald), Oswald, sans-serif",
          fontWeight: 700,
          fontSize: "clamp(2rem, 5vw, 3.2rem)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "#f0f0f0",
          lineHeight: 1.1,
          margin: "0 0 12px",
        }}>
          Choose Your <span style={{ color: "#dc2626" }}>Theme</span>
        </h1>

        <p style={{ color: "#555", fontSize: "0.9rem", marginBottom: 40, lineHeight: 1.6, maxWidth: 500, margin: "0 auto 40px" }}>
          Pick a visual style for the CardPulse dashboard. Both have the same data &mdash; just a different vibe.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 560, margin: "0 auto" }}>

          {/* WWE Arena */}
          <div
            onClick={() => router.push("/wwe")}
            style={{
              background: "linear-gradient(145deg, rgba(220,38,38,0.08), rgba(14,14,14,0.95))",
              border: "1px solid rgba(220,38,38,0.2)",
              borderRadius: 18,
              padding: "36px 24px",
              cursor: "pointer",
              transition: "all 0.25s",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(220,38,38,0.5)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 50px rgba(220,38,38,0.15)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(220,38,38,0.2)"; (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
          >
            <div style={{ position: "absolute", top: -40, right: -40, width: 150, height: 150, background: "radial-gradient(circle, rgba(220,38,38,0.12) 0%, transparent 60%)", pointerEvents: "none" }} />
            <Flame size={36} color="#dc2626" strokeWidth={2} style={{ marginBottom: 16 }} />
            <h2 style={{
              fontFamily: "var(--font-oswald), Oswald, sans-serif",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#dc2626",
              fontSize: "1.3rem",
              margin: "0 0 8px",
            }}>WWE Arena</h2>
            <p style={{ color: "#666", fontSize: "0.78rem", lineHeight: 1.5, margin: 0 }}>
              Black &amp; red cinematic theme. Aggressive typography, glow effects, neon borders.
            </p>
            <div style={{ height: 3, background: "linear-gradient(90deg, #dc2626, #ef4444)", borderRadius: 99, marginTop: 20, boxShadow: "0 0 10px rgba(220,38,38,0.4)" }} />
          </div>

          {/* Classic Amber */}
          <div
            onClick={() => router.push("/classic")}
            style={{
              background: "linear-gradient(145deg, rgba(245,158,11,0.08), rgba(14,14,14,0.95))",
              border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: 18,
              padding: "36px 24px",
              cursor: "pointer",
              transition: "all 0.25s",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,158,11,0.5)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 50px rgba(245,158,11,0.15)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,158,11,0.2)"; (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
          >
            <div style={{ position: "absolute", top: -40, right: -40, width: 150, height: 150, background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 60%)", pointerEvents: "none" }} />
            <Sparkles size={36} color="#f59e0b" strokeWidth={2} style={{ marginBottom: 16 }} />
            <h2 style={{
              fontFamily: "var(--font-oswald), Oswald, sans-serif",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#f59e0b",
              fontSize: "1.3rem",
              margin: "0 0 8px",
            }}>Classic Amber</h2>
            <p style={{ color: "#666", fontSize: "0.78rem", lineHeight: 1.5, margin: 0 }}>
              Warm gold tones with the same premium dark aesthetic and analytics.
            </p>
            <div style={{ height: 3, background: "linear-gradient(90deg, #f59e0b, #fbbf24)", borderRadius: 99, marginTop: 20, boxShadow: "0 0 10px rgba(245,158,11,0.4)" }} />
          </div>
        </div>

        <p style={{ color: "#333", fontSize: "0.6rem", marginTop: 32, fontFamily: "var(--font-oswald), Oswald, sans-serif", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          CARDPULSE ANALYTICS · DEMO V2.0
        </p>
      </div>
    </div>
  );
}
