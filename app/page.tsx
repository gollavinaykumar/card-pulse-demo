"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Signal, Bell, Flame, Sparkles, ArrowUpRight,
  Eye, Zap, Check, ArrowLeft, ChevronLeft, ChevronRight, TrendingUp, Play,
} from "lucide-react";
import MultiDashboard from "@/app/components/MultiDashboard";
import LoadingScreen from "@/app/components/LoadingScreen";
import { getPlayer } from "@/lib/players";
import {
  statusLabel, statusBadgeClass, timeAgo, newsTypeLabel,
  type PlayerData,
} from "@/lib/playerUtils";

// ── Card roster ───────────────────────────────────────────────────
const CARDS = [
  { slug: "mahomes", image: "/mahomes.png" },
  { slug: "allen",   image: "/JoshAllen.jpg" },
  { slug: "burrow",  image: "/JoeBurrow.webp" },
  { slug: "jackson", image: "/LamarJackson.jpg" },
  { slug: "herbert", image: "/JustinHerbert.png" },
];

// ── Themes ────────────────────────────────────────────────────────
const THEMES = {
  wwe: {
    name: "WWE Arena", accent: "#dc2626", accentBright: "#ef4444",
    gradient: "linear-gradient(145deg, rgba(220,38,38,0.08), rgba(14,14,14,0.95))",
    border: "rgba(220,38,38,0.2)", glow: "rgba(220,38,38,0.45)",
    textClass: "red-text", icon: Flame,
    desc: "Black & red cinematic theme with neon glow.",
    vignette: "radial-gradient(ellipse 90% 40% at 50% -5%, rgba(220,38,38,0.06) 0%, transparent 100%)",
  },
  classic: {
    name: "Classic Amber", accent: "#f59e0b", accentBright: "#fbbf24",
    gradient: "linear-gradient(145deg, rgba(245,158,11,0.08), rgba(14,14,14,0.95))",
    border: "rgba(245,158,11,0.2)", glow: "rgba(245,158,11,0.45)",
    textClass: "gold-text", icon: Sparkles,
    desc: "Warm gold tones with premium dark aesthetic.",
    vignette: "radial-gradient(ellipse 90% 40% at 50% -5%, rgba(245,158,11,0.06) 0%, transparent 100%)",
  },
};
type ThemeKey = keyof typeof THEMES;
type Step = "theme" | "select" | "analytics";

// ── Helpers ───────────────────────────────────────────────────────
function statusIcon(s: string) {
  if (s === "fire")    return "🔥";
  if (s === "heating") return "🚀";
  if (s === "cooling") return "❄️";
  return "·";
}

function buildTickerItems(players: PlayerData[]) {
  return players.map(pd => ({
    text: `${statusIcon(pd.player.status)} ${pd.player.name} is ${pd.player.status === "fire" ? "ON FIRE" : pd.player.status === "heating" ? "RISING" : pd.player.status === "cooling" ? "COOLING" : "NEUTRAL"} (${pd.player.priceChange})`,
    color: pd.player.status === "fire" ? "#ef4444" : pd.player.status === "heating" ? "#f59e0b" : pd.player.status === "cooling" ? "#60a5fa" : "#888",
  }));
}

// ── KPI block (digital readout) ───────────────────────────────────
function KPIBlock({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  const a = accent || "#dc2626";
  return (
    <div className="digital-tile" style={{ flex: 1, minWidth: 0, '--accent': a } as React.CSSProperties}>
      <div className="stat-label-mono" style={{ marginBottom: 4 }}>{label}</div>
      <div className="digital-value" style={{ fontSize: "1.3rem", fontWeight: 400, color: "#f0f0f0", textShadow: `0 0 10px ${a}44, 0 0 30px ${a}18` }}>{value}</div>
      {sub && <div style={{ fontSize: "0.48rem", color: "#444", marginTop: 3, fontFamily: "var(--font-digital), monospace", letterSpacing: "0.06em" }}>{sub}</div>}
    </div>
  );
}

// ── Skill bar ─────────────────────────────────────────────────────
function SkillBar({ label, value, accent }: { label: string; value: number; accent: string }) {
  const tier = value >= 95 ? "ELITE" : value >= 88 ? "PRO" : value >= 78 ? "SOLID" : "DEV";
  return (
    <div className="skill-row">
      <span className="skill-label">{label}</span>
      <div className="skill-bar-bg">
        <div className="skill-bar-fill" style={{ width: `${value}%`, background: `linear-gradient(90deg, ${accent}88, ${accent})`, boxShadow: `0 0 8px ${accent}66` }} />
      </div>
      <span style={{ width: 44, textAlign: "right", fontSize: "0.62rem", fontWeight: 700, color: "#aaa", fontFamily: "Oswald, sans-serif" }}>
        {value} <span style={{ color: value >= 95 ? "#ef4444" : value >= 88 ? "#f59e0b" : "#555", fontSize: "0.5rem" }}>{tier}</span>
      </span>
    </div>
  );
}

// ── Notification card ─────────────────────────────────────────────
function NotifCard({ ev, A, i }: { ev: PlayerData["news_feed"][0]; A: string; i: number }) {
  const icons: Record<string, string> = { signal: "🔥", price: "💰", game: "🏈", insight: "💡" };
  const typeColors: Record<string, string> = { signal: "#ef4444", price: "#10b981", game: "#06b6d4", insight: "#8b5cf6" };
  const tColor = typeColors[ev.type] || "#888";
  return (
    <div className={`notif-card type-${ev.type}`} style={{ animationDelay: `${i * 0.08}s`, borderLeftColor: tColor }}>
      <div style={{ fontSize: "1.4rem", flexShrink: 0, lineHeight: 1, marginTop: 2 }}>{icons[ev.type] || "📡"}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: tColor, fontFamily: "Oswald, sans-serif" }}>{newsTypeLabel(ev.type)}</span>
          {ev.tag && <span style={{ fontSize: "0.52rem", fontWeight: 800, padding: "1px 7px", borderRadius: 4, background: `${A}1f`, color: A, border: `1px solid ${A}4d`, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em" }}>{ev.tag}</span>}
          <span style={{ fontSize: "0.6rem", color: "#444", marginLeft: "auto" }}>{timeAgo(ev.ts)}</span>
        </div>
        <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e0e0e0", margin: "0 0 3px", fontFamily: "Oswald, sans-serif", textTransform: "uppercase", letterSpacing: "0.03em" }}>{ev.title}</p>
        <p style={{ fontSize: "0.72rem", color: "#555", lineHeight: 1.5, margin: 0 }}>{ev.body}</p>
      </div>
    </div>
  );
}

// ── Player Card (carousel item) ───────────────────────────────────
function PlayerCard({ pd, image, A, AB, idx, single }: { pd: PlayerData; image: string; A: string; AB: string; idx: number; single: boolean }) {
  const p = pd.player;
  const cs = pd.career_summary;
  const latest = pd.season_stats[pd.season_stats.length - 1];
  const accent = p.status === "fire" ? "#ef4444" : p.status === "heating" ? "#f59e0b" : p.status === "cooling" ? "#3b82f6" : "#6b7280";

  return (
    <div
      className="player-main-card"
      style={{
        animationDelay: `${idx * 0.12}s`,
        // Single mode: full centered, no scroll
        ...(single ? { flex: "0 0 min(440px, 90vw)", maxWidth: "min(440px, 90vw)" } : {}),
      }}
    >
      <div className="player-main-card-inner" style={{ borderColor: `${accent}33`, boxShadow: `0 10px 30px rgba(0,0,0,0.8), 0 0 0 1px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.05)` }}>
        {/* Spotlight sweep */}
        <div style={{ position: "absolute", top: 0, left: 0, width: 80, height: "300%", background: `linear-gradient(90deg, transparent 0%, ${accent}0a 50%, transparent 100%)`, pointerEvents: "none", animation: "spotlightSweep 5s ease-in-out infinite", animationDelay: `${idx * 1.2}s` }} />

        {/* Photo */}
        <div className="player-card-image-wrap">
          <img src={image} alt={p.name} className="player-card-image" />
          <div className="player-card-overlay" />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${p.teamColor}, ${p.teamColorAlt || accent})` }} />
          <div style={{ position: "absolute", top: 12, right: 12 }}>
            <span className={statusBadgeClass(p.status)} style={{ fontSize: "0.68rem", boxShadow: `0 0 16px ${accent}66` }}>
              {statusIcon(p.status)} {statusLabel(p.status).replace(" 🔥", "")}
            </span>
          </div>
          <div style={{ position: "absolute", bottom: 70, left: 16, background: "rgba(0,0,0,0.85)", border: `1px solid ${accent}55`, borderRadius: 7, padding: "2px 10px" }}>
            <span style={{ fontFamily: "Oswald, sans-serif", fontSize: "0.75rem", fontWeight: 800, color: accent, letterSpacing: "0.08em" }}>GRADE {p.cardGrade}</span>
          </div>
        </div>

        {/* Content */}
        <div className="player-card-content">
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: "1.5rem", textTransform: "uppercase", color: "#f0f0f0", margin: 0, lineHeight: 1, letterSpacing: "0.03em" }}>
              {p.name.split(" ")[0]} <span style={{ color: accent }}>{p.name.split(" ").slice(1).join(" ")}</span>
            </h3>
            <div style={{ fontSize: "0.65rem", color: "#555", marginTop: 3 }}>#{p.number} · {p.team} · {p.position}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: `${accent}14`, border: `1px solid ${accent}33`, borderRadius: 7, padding: "4px 10px" }}>
              <ArrowUpRight size={12} color={accent} />
              <span style={{ fontFamily: "Oswald, sans-serif", fontSize: "0.85rem", fontWeight: 800, color: accent }}>{p.priceChange}</span>
            </div>
            <span style={{ fontSize: "0.58rem", color: "#444" }}>{p.priceLabel}</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <KPIBlock label="Pass YDS" value={latest?.passing_yards?.toLocaleString() ?? "-"} sub="Last season" />
            <KPIBlock label="TDs" value={String(latest?.td ?? "-")} sub="Last season" />
            <KPIBlock label="RTG" value={latest?.rating?.toFixed(1) ?? "-"} sub="Rating" />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <KPIBlock label="Career YDS" value={(cs.passing_yards / 1000).toFixed(1) + "K"} />
            <KPIBlock label="Career TDs" value={String(cs.passing_touchdowns)} />
            <KPIBlock label="Score" value={String(p.overallScore)} sub="/ 100" />
          </div>
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accent}44, transparent)`, margin: "0 0 14px" }} />
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: "0.55rem", fontWeight: 700, color: accent, fontFamily: "Oswald, sans-serif", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 10 }}>SKILL RATINGS</div>
            {pd.radar.map((r, ri) => (
              <SkillBar key={r.subject} label={r.subject} value={r.A} accent={ri === 0 ? accent : ri % 2 === 0 ? A : AB} />
            ))}
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={11} color={accent} />
            <span style={{ fontSize: "0.65rem", color: "#666", fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>{p.lastGame}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
export default function HomePage() {
  const [step, setStep]         = useState<"theme"|"select"|"buy"|"analytics">("theme");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [theme, setTheme]       = useState<ThemeKey>("wwe");
  const [activePlayer, setActivePlayer] = useState<string>("");
  const [buyPrices, setBuyPrices] = useState<Record<string, string>>({});
  const carouselRef = useRef<HTMLDivElement>(null);

  const t  = THEMES[theme];
  const A  = t.accent;
  const AB = t.accentBright;

  const [showPageFlash, setShowPageFlash] = useState(false);

  const toggleCard = (slug: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const selectedPlayers = useMemo(
    () => Array.from(selected).map(s => getPlayer(s)!).filter(Boolean),
    [selected],
  );

  const isSingle = selectedPlayers.length === 1;

  const goToAnalytics = () => {
    setShowPageFlash(true);
    setTimeout(() => {
      setShowPageFlash(false);
      setStep("buy");
    }, 550);
  };

  const scrollCarousel = (dir: "left" | "right") => {
    if (!carouselRef.current) return;
    const el = carouselRef.current;
    el.scrollBy({ left: dir === "right" ? el.clientWidth : -el.clientWidth, behavior: "smooth" });
  };

  // Panel style helper
  const C: React.CSSProperties = {
    background: "linear-gradient(145deg, rgba(14,14,14,0.95), rgba(8,8,8,0.98))",
    border: `1px solid ${A}1a`, borderRadius: 16, padding: 24,
    boxShadow: "0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
  };

  // ════ STEP 1: THEME ════════════════════════════════════════════
  if (step === "theme") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#050505", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <LoadingScreen />

        <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: "20%", top: "30%", width: 500, height: 500, background: "radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 60%)" }} />
          <div style={{ position: "absolute", right: "20%", top: "30%", width: 500, height: 500, background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 60%)" }} />
        </div>
        <div style={{ maxWidth: 700, textAlign: "center", zIndex: 1 }}>
          <img src="/logo.png" alt="CardPulse" style={{ height: 60, width: "auto", objectFit: "contain", margin: "0 auto 28px", display: "block" }} />
          <h1 style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontWeight: 700, fontSize: "clamp(2rem, 5vw, 3.2rem)", textTransform: "uppercase", letterSpacing: "0.04em", color: "#f0f0f0", lineHeight: 1.1, margin: "0 0 12px" }}>
            Choose Your <span style={{ color: "#dc2626" }}>Theme</span>
          </h1>
          <p style={{ color: "#555", fontSize: "0.9rem", maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.6 }}>Pick a visual style — then select your players.</p>
          <div className="theme-grid">
            {(Object.keys(THEMES) as ThemeKey[]).map(key => {
              const th = THEMES[key]; const Icon = th.icon;
              return (
                <div key={key} onClick={() => { setTheme(key); setStep("select"); }}
                  style={{ background: th.gradient, border: `1px solid ${th.border}`, borderRadius: 18, padding: "36px 24px", cursor: "pointer", transition: "all 0.25s", position: "relative", overflow: "hidden" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = th.accent; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 20px 50px ${th.glow}`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = th.border; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                >
                  <div style={{ position: "absolute", top: -40, right: -40, width: 150, height: 150, background: `radial-gradient(circle, ${th.accent}1f 0%, transparent 60%)`, pointerEvents: "none" }} />
                  <Icon size={36} color={th.accent} strokeWidth={2} style={{ marginBottom: 16 }} />
                  <h2 style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: th.accent, fontSize: "1.3rem", margin: "0 0 8px" }}>{th.name}</h2>
                  <p style={{ color: "#666", fontSize: "0.78rem", lineHeight: 1.5, margin: 0 }}>{th.desc}</p>
                  <div style={{ height: 3, background: `linear-gradient(90deg, ${th.accent}, ${th.accentBright})`, borderRadius: 99, marginTop: 20, boxShadow: `0 0 10px ${th.glow}` }} />
                </div>
              );
            })}
          </div>
          <p style={{ color: "#333", fontSize: "0.6rem", marginTop: 32, fontFamily: "Oswald, sans-serif", letterSpacing: "0.12em", textTransform: "uppercase" }}>CARDPULSE ANALYTICS · DEMO V2.0</p>
        </div>
      </div>
    );
  }

  // ════ STEP 2: CARD SELECT ══════════════════════════════════════
  if (step === "select") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#050505", backgroundImage: t.vignette, padding: "40px 20px 120px" }}>
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: "10%", top: "20%", width: 600, height: 600, background: `radial-gradient(circle, ${A}0d 0%, transparent 60%)` }} />
          <div style={{ position: "absolute", right: "10%", bottom: "20%", width: 500, height: 500, background: `radial-gradient(circle, ${A}0a 0%, transparent 60%)` }} />
        </div>
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div onClick={() => { setStep("theme"); setSelected(new Set()); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", color: "#555", fontSize: "0.75rem", marginBottom: 20 }}>
              <ArrowLeft size={14} /> Change Theme
            </div>
            <h1 style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontWeight: 700, fontSize: "clamp(2rem, 5vw, 3.2rem)", textTransform: "uppercase", letterSpacing: "0.04em", color: "#f0f0f0", lineHeight: 1.1, margin: "0 0 12px" }}>
              Build Your <span style={{ color: A }}>Roster</span>
            </h1>
            <p style={{ color: "#555", fontSize: "0.9rem", maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
              Select <strong style={{ color: A }}>one or more players</strong> — then hit Get Started.
            </p>
            {/* Selected count badge */}
            {selected.size > 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16, background: `${A}14`, border: `1px solid ${A}44`, borderRadius: 8, padding: "4px 14px", animation: "fadeSlideUp 0.3s ease-out both" }}>
                <Flame size={12} color={A} />
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: A, fontFamily: "Oswald, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {selected.size} PLAYER{selected.size > 1 ? "S" : ""} SELECTED
                </span>
              </div>
            )}
          </div>

          {/* Cards grid */}
          <div className="card-grid">
            {CARDS.map((card, idx) => {
              const isSelected = selected.has(card.slug);
              const pd = getPlayer(card.slug)!;
              const p = pd.player;
              const isFire    = p.status === "fire";
              const isHeating = p.status === "heating";

              // Status class for glow on unselected cards
              const statusBurnClass = isFire ? "card-status-fire" : isHeating ? "card-status-heating" : "";

              // Selected state animation overrides status float
              const selectedAnim = isFire && isSelected
                ? "cardFireFloat 2s ease-in-out infinite"
                : isHeating && isSelected
                ? "cardHeatFloat 2.4s ease-in-out infinite"
                : "none";

              return (
                <div
                  key={card.slug}
                  className={`player-card-3d ${!isSelected ? statusBurnClass : ""}`}
                  onClick={() => toggleCard(card.slug)}
                  onMouseMove={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const cx = rect.width / 2, cy = rect.height / 2;
                    const rotX = ((y - cy) / cy) * -9;
                    const rotY = ((x - cx) / cx) * 9;
                    e.currentTarget.style.transition = "box-shadow 0.15s ease";
                    e.currentTarget.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px) scale(1.04)`;
                    const sh = e.currentTarget.querySelector(".card-shimmer-layer") as HTMLElement;
                    if (sh) { sh.style.opacity = "1"; sh.style.background = `radial-gradient(circle at ${(x / rect.width) * 100}% ${(y / rect.height) * 100}%, rgba(255,255,255,0.18) 0%, transparent 60%)`; }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transition = "all 0.45s cubic-bezier(0.4,0,0.2,1)";
                    e.currentTarget.style.transform = isSelected ? "translateY(-6px) scale(1.02)" : "translateY(0) scale(1)";
                    const sh = e.currentTarget.querySelector(".card-shimmer-layer") as HTMLElement;
                    if (sh) { sh.style.opacity = "0"; sh.style.background = "none"; }
                  }}
                  style={{
                    background: isSelected
                      ? `linear-gradient(145deg, ${A}1a, rgba(14,14,14,0.96))`
                      : "linear-gradient(145deg, rgba(14,14,14,0.95), rgba(8,8,8,0.98))",
                    border: `2px solid ${isSelected ? `${A}80` : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 18, overflow: "hidden",
                    transition: "all 0.45s cubic-bezier(0.4,0,0.2,1)",
                    transform: isSelected ? "translateY(-6px) scale(1.02)" : "translateY(0)",
                    boxShadow: isSelected
                      ? `0 20px 50px ${A}44, 0 0 30px ${A}22`
                      : "0 4px 30px rgba(0,0,0,0.5)",
                    animation: isSelected && (isFire || isHeating)
                      ? selectedAnim
                      : `fadeSlideUp 0.55s ease-out ${idx * 0.09}s both`,
                    position: "relative",
                  }}
                >
                  {/* Holographic shimmer follows mouse */}
                  <div className="card-shimmer-layer" style={{ position: "absolute", inset: 0, zIndex: 6, borderRadius: 18, pointerEvents: "none", opacity: 0, transition: "opacity 0.25s ease, background 0.08s ease" }} />

                  {/* Entry shimmer sweep (plays once on mount) */}
                  <div className="card-holo-entry" style={{ animationDelay: `${idx * 0.09 + 0.4}s` }} />

                  {/* Selected pulse ring */}
                  {isSelected && (
                    <div style={{ position: "absolute", inset: -2, borderRadius: 20, zIndex: 0, border: `2px solid ${A}99`, pointerEvents: "none", animation: "selectedRingPulse 2s ease-in-out infinite" }} />
                  )}

                  {/* Selected check badge */}
                  {isSelected && (
                    <div className="check-pop" style={{ position: "absolute", top: 12, right: 12, zIndex: 10, width: 32, height: 32, borderRadius: "50%", background: A, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px ${A}99` }}>
                      <Check size={18} color="#fff" strokeWidth={3} />
                    </div>
                  )}

                  {/* Player image */}
                  <div style={{ position: "relative", width: "100%", paddingTop: "130%", overflow: "hidden", zIndex: 2 }}>
                    <img src={card.image} alt={p.name} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", transition: "transform 0.5s ease" }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.07)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ""; }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", background: "linear-gradient(to top, #050505 10%, transparent 100%)" }} />
                    {/* Status glow on image for fire/heating */}
                    {(isFire || isHeating) && (
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: isFire ? "linear-gradient(to top, rgba(239,68,68,0.25), transparent)" : "linear-gradient(to top, rgba(239,68,68,0.15), transparent)", pointerEvents: "none", zIndex: 3 }} />
                    )}
                  </div>

                  {/* Card info */}
                  <div style={{ padding: "0 16px 18px", marginTop: -50, position: "relative", zIndex: 4 }}>
                    <h3 style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontWeight: 700, fontSize: "1.1rem", textTransform: "uppercase", color: "#f0f0f0", margin: "0 0 4px", letterSpacing: "0.03em" }}>
                      {p.name}
                      {isFire && <span style={{ marginLeft: 6, fontSize: "0.9rem" }}>🔥</span>}
                      {isHeating && <span style={{ marginLeft: 6, fontSize: "0.9rem" }}>⚡</span>}
                      {p.status === "cooling" && <span style={{ marginLeft: 6, fontSize: "0.9rem" }}>❄️</span>}
                    </h3>
                    <p style={{ color: "#555", fontSize: "0.7rem", margin: "0 0 10px" }}>#{p.number} · {p.team} · {p.position}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      <span className="digital-value" style={{ fontSize: "0.62rem", padding: "3px 9px", borderRadius: 5, background: `${A}1a`, color: A, border: `1px solid ${A}33`, textShadow: `0 0 8px ${A}55` }}>{p.priceChange}</span>
                      <span className="digital-value" style={{ fontSize: "0.62rem", padding: "3px 9px", borderRadius: 5, background: "rgba(255,255,255,0.04)", color: "#888", border: "1px solid rgba(255,255,255,0.06)" }}>{p.overallScore}<span style={{ fontSize: "0.48rem", color: "#555", marginLeft: 3 }}>/ 100</span></span>
                    </div>
                    <button style={{ width: "100%", padding: "10px 0", borderRadius: 10, fontFamily: "var(--font-oswald), Oswald, sans-serif", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer", border: isSelected ? `1px solid ${A}80` : "1px solid rgba(255,255,255,0.1)", background: isSelected ? `${A}33` : "rgba(255,255,255,0.04)", color: isSelected ? AB : "#888", transition: "all 0.25s" }}>
                      {isSelected ? "✓ Selected" : "Select"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Page-flash transition overlay — fires when Get Started clicked */}
        {showPageFlash && <div className="page-flash" />}

        {/* ── Floating GET STARTED bar ── */}

        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
          padding: "16px 24px 24px",
          background: "linear-gradient(to top, rgba(5,5,5,0.98) 0%, rgba(5,5,5,0.8) 80%, transparent 100%)",
          display: "flex", justifyContent: "center",
          transform: selected.size > 0 ? "translateY(0)" : "translateY(120%)",
          transition: "transform 0.45s cubic-bezier(0.2,0.8,0.2,1)",
        }}>
          <button
            onClick={goToAnalytics}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              background: `linear-gradient(135deg, ${A}, ${AB})`,
              border: "none", borderRadius: 14, padding: "16px 40px",
              fontFamily: "var(--font-oswald), Oswald, sans-serif", fontWeight: 700,
              fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.1em",
              color: "#fff", cursor: "pointer",
              boxShadow: `0 0 30px ${A}66, 0 8px 40px rgba(0,0,0,0.6)`,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = `0 0 50px ${A}99, 0 10px 60px rgba(0,0,0,0.8)`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 0 30px ${A}66, 0 8px 40px rgba(0,0,0,0.6)`; }}
          >
            <Play size={18} fill="#fff" />
            Get Started
            {selected.size > 0 && (
              <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "2px 10px", fontSize: "0.78rem", fontWeight: 800 }}>
                {selected.size}
              </span>
            )}
          </button>
        </div>

        <style>{`@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    );
  }

  // ════ STEP 2.5: BUY PRICE ENTRY ═══════════════════════════════
  if (step === "buy") {
    const parsedPrices: Record<string, number> = {};
    Object.entries(buyPrices).forEach(([slug, val]) => {
      const n = parseFloat(val.replace(/[^0-9.]/g, ""));
      if (!isNaN(n) && n > 0) parsedPrices[slug] = n;
    });

    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#050505", backgroundImage: t.vignette, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        {showPageFlash && <div className="page-flash" />}
        {/* Ambient glow */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: "20%", top: "20%", width: 600, height: 600, background: `radial-gradient(circle, ${A}0e 0%, transparent 60%)` }} />
          <div style={{ position: "absolute", right: "10%", bottom: "20%", width: 500, height: 500, background: `radial-gradient(circle, ${A}0a 0%, transparent 60%)` }} />
        </div>

        <div style={{ maxWidth: 860, width: "100%", zIndex: 1 }}>
          {/* Back */}
          <div onClick={() => setStep("select")} style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", color: "#555", fontSize: "0.75rem", marginBottom: 28 }}>
            <ArrowLeft size={14} /> Back to Selection
          </div>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h1 style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontWeight: 700, fontSize: "clamp(1.8rem,5vw,3rem)", textTransform: "uppercase", letterSpacing: "0.04em", color: "#f0f0f0", lineHeight: 1.1, margin: "0 0 10px" }}>
              Your <span style={{ color: A }}>Buy Price</span>
            </h1>
            <p style={{ color: "#555", fontSize: "0.88rem", lineHeight: 1.6, maxWidth: 480, margin: "0 auto" }}>
              Enter what you paid for each card — we'll show your live P&L in the dashboard.
            </p>
          </div>

          {/* Per-player inputs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 36 }}>
            {selectedPlayers.map((pd, i) => {
              const p = pd.player;
              const val = buyPrices[p.slug] ?? "";
              const paid = parseFloat(val.replace(/[^0-9.]/g, ""));
              const hasPaid = !isNaN(paid) && paid > 0;
              // Get last price from price_history
              const hist = (pd as any).price_history as { date: string; price: number }[];
              const cur = hist[hist.length - 1].price;
              const gain = hasPaid ? cur - paid : null;
              const pct = gain !== null ? ((gain / paid) * 100).toFixed(1) : null;
              const gainColor = gain !== null ? (gain >= 0 ? "#22c55e" : "#ef4444") : A;
              const PCOLORS = ["#ef4444", "#22d3ee", "#a78bfa", "#34d399", "#fb923c"];
              const accentC = PCOLORS[i % 5];

              return (
                <div key={p.slug} style={{ background: `linear-gradient(135deg, rgba(10,10,10,0.9), rgba(6,6,6,0.95))`, border: `1px solid ${accentC}33`, borderRadius: 18, padding: "20px 24px", display: "grid", gridTemplateColumns: "72px 1fr auto", gap: 20, alignItems: "center", backdropFilter: "blur(12px)", animation: `fadeSlideUp 0.4s ease-out ${i * 0.08}s both` }}>
                  {/* Avatar */}
                  <div style={{ width: 72, height: 72, borderRadius: 12, overflow: "hidden", border: `2px solid ${accentC}66`, flexShrink: 0 }}>
                    <img src={`/${p.slug === "allen" ? "JoshAllen.jpg" : p.slug === "burrow" ? "JoeBurrow.webp" : p.slug === "jackson" ? "LamarJackson.jpg" : p.slug === "herbert" ? "JustinHerbert.png" : "mahomes.png"}`} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                  </div>
                  {/* Player info + input */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "#f0f0f0", textTransform: "uppercase" }}>{p.name}</span>
                      <span style={{ fontSize: "0.6rem", color: accentC, background: `${accentC}1a`, border: `1px solid ${accentC}33`, borderRadius: 4, padding: "1px 7px", fontFamily: "Oswald, sans-serif", fontWeight: 700 }}>Now ${cur.toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "#555", marginBottom: 10 }}>#{p.number} · {p.team} · {p.featuredCard}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#555", fontWeight: 700, fontSize: "1.1rem", fontFamily: "Oswald, sans-serif" }}>$</span>
                      <input
                        type="number" placeholder="What did you pay? (e.g. 9500)"
                        value={val}
                        onChange={e => setBuyPrices(prev => ({ ...prev, [p.slug]: e.target.value }))}
                        style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${accentC}44`, borderRadius: 9, padding: "9px 14px", color: "#f0f0f0", fontSize: "0.95rem", fontWeight: 700, outline: "none", fontFamily: "Oswald, sans-serif", transition: "border-color 0.2s" }}
                        onFocus={e => { e.currentTarget.style.borderColor = accentC; }}
                        onBlur={e => { e.currentTarget.style.borderColor = `${accentC}44`; }}
                      />
                    </div>
                  </div>
                  {/* Live P&L preview */}
                  <div style={{ textAlign: "right", minWidth: 90 }}>
                    {gain !== null ? (
                      <>
                        <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 900, fontSize: "1.3rem", color: gainColor, lineHeight: 1 }}>
                          {gain >= 0 ? "+" : "-"}${Math.abs(gain).toLocaleString()}
                        </div>
                        <div style={{ fontSize: "0.6rem", color: gainColor, marginTop: 3, fontWeight: 700 }}>{gain >= 0 ? "+" : ""}{pct}% ROI</div>
                        <div style={{ fontSize: "0.55rem", color: "#444", marginTop: 2 }}>{gain >= 0 ? "🟢 In Profit" : "🔴 In Loss"}</div>
                      </>
                    ) : (
                      <div style={{ fontSize: "0.6rem", color: "#333", fontFamily: "Oswald, sans-serif" }}>ENTER PRICE</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary bar if any prices entered */}
          {Object.keys(parsedPrices).length > 0 && (() => {
            const totalPaid = Object.values(parsedPrices).reduce((s, v) => s + v, 0);
            const totalCur = selectedPlayers.reduce((s, pd) => {
              const hist = (pd as any).price_history as { price: number }[];
              return s + hist[hist.length - 1].price;
            }, 0);
            const totalGain = totalCur - totalPaid;
            const totalPct = ((totalGain / totalPaid) * 100).toFixed(1);
            const isProfit = totalGain >= 0;
            return (
              <div style={{ background: `linear-gradient(135deg, ${isProfit ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)"}, rgba(6,6,6,0.9))`, border: `1px solid ${isProfit ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 14, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, backdropFilter: "blur(8px)" }}>
                <div>
                  <div style={{ fontSize: "0.6rem", color: "#555", fontFamily: "Oswald, sans-serif", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Portfolio Summary</div>
                  <div style={{ fontSize: "0.8rem", color: "#777" }}>Invested <strong style={{ color: "#f0f0f0" }}>${totalPaid.toLocaleString()}</strong> · Current <strong style={{ color: "#f0f0f0" }}>${totalCur.toLocaleString()}</strong></div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 900, fontSize: "1.8rem", color: isProfit ? "#22c55e" : "#ef4444", lineHeight: 1 }}>{isProfit ? "+" : "-"}${Math.abs(totalGain).toLocaleString()}</div>
                  <div style={{ fontSize: "0.65rem", color: isProfit ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{isProfit ? "+" : ""}{totalPct}% Total ROI</div>
                </div>
              </div>
            );
          })()}

          {/* CTA */}
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => { setBuyPrices({}); setShowPageFlash(true); setTimeout(() => { setShowPageFlash(false); setActivePlayer("all"); setStep("analytics"); }, 400); }}
              style={{ flex: 1, padding: "14px 0", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#555", fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer" }}>
              Skip → Just Analytics
            </button>
            <button onClick={() => { setShowPageFlash(true); setTimeout(() => { setShowPageFlash(false); setActivePlayer("all"); setStep("analytics"); }, 400); }}
              style={{ flex: 2, padding: "14px 0", borderRadius: 12, background: `linear-gradient(135deg, ${A}, ${AB})`, border: "none", color: "#fff", fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", boxShadow: `0 0 30px ${A}55`, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Play size={16} fill="white" /> Launch Analytics
            </button>
          </div>
        </div>
        <style>{`@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    );
  }


  // Always use the full dashboard. Single player = show that player's charts.
  // Multiple players = color-coded lines/dots per player.
  return (
    <MultiDashboard
      players={selectedPlayers}
      A={A}
      AB={AB}
      onBack={() => setStep("select")}
      onNewRoster={() => { setStep("theme"); setSelected(new Set()); setBuyPrices({}); }}
      vignette={t.vignette}
      themeName={t.name}
      themeGlow={t.glow}
      initialPlayer={selectedPlayers.length === 1 ? selectedPlayers[0].player.slug : "all"}
      buyPrices={Object.fromEntries(Object.entries(buyPrices).map(([k, v]) => [k, parseFloat(v.replace(/[^0-9.]/g, ""))]).filter(([,v]) => !isNaN(v as number) && (v as number) > 0))}
    />
  );
}
