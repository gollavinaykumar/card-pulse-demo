"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ScatterChart, Scatter, ZAxis, LineChart,
  ComposedChart, Bar, Line, Cell,
} from "recharts";
import {
  Signal, Bell, TrendingUp, Flame,
  Sparkles, DollarSign, BarChart3, ArrowUpRight,
  Clock, Eye, Zap, Check, ArrowLeft,
} from "lucide-react";
import { getPlayer } from "@/lib/players";
import {
  statusLabel, statusBadgeClass,
  timeAgo, newsTypeLabel, formatTimestamp,
  type PlayerData,
} from "@/lib/playerUtils";

// ── Card data ───────────────────────────────────────────────────
const CARDS = [
  { slug: "mahomes", image: "/mahomes.png" },
  { slug: "allen", image: "/JoshAllen.jpg" },
  { slug: "burrow", image: "/JoeBurrow.webp" },
  { slug: "jackson", image: "/LamarJackson.jpg" },
  { slug: "herbert", image: "/JustinHerbert.png" },
];

// ── Theme configs ───────────────────────────────────────────────
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

// ── Fake price data generators ──────────────────────────────────
function generatePriceHistory(basePx: number, seed: number) {
  const days = ["Jan 25","Jan 26","Jan 27","Jan 28","Jan 29","Jan 30","Jan 31","Feb 1","Feb 2","Feb 3","Feb 4","Feb 5","Feb 6","Feb 7","Feb 8","Feb 9","Feb 10","Feb 11","Feb 12","Feb 13","Feb 14","Feb 15","Feb 16","Feb 17","Feb 18","Feb 19","Feb 20","Feb 21","Feb 22","Feb 23","Feb 24"];
  let px = basePx;
  return days.map((day, i) => {
    px += Math.round((Math.sin(i * seed) * 80) + (i * 12));
    return { day, price: px, volume: 15 + Math.round(Math.abs(Math.sin(i * 0.7 + seed)) * 40) };
  });
}
const PLAYER_PRICES: Record<string, number> = { mahomes: 11200, allen: 1500, burrow: 1800, jackson: 5200, herbert: 900 };

function generateScatter(basePrice: number) {
  return [
    { price: basePrice, daysAgo: 28, volume: 4, label: "PSA 8" },
    { price: Math.round(basePrice * 1.06), daysAgo: 24, volume: 8, label: "PSA 9" },
    { price: Math.round(basePrice * 1.2), daysAgo: 22, volume: 3, label: "PSA 10" },
    { price: Math.round(basePrice * 1.02), daysAgo: 18, volume: 5, label: "PSA 8" },
    { price: Math.round(basePrice * 1.1), daysAgo: 14, volume: 7, label: "PSA 9" },
    { price: Math.round(basePrice * 1.25), daysAgo: 10, volume: 2, label: "PSA 10" },
    { price: Math.round(basePrice * 1.08), daysAgo: 6, volume: 6, label: "PSA 8" },
    { price: Math.round(basePrice * 1.13), daysAgo: 3, volume: 10, label: "PSA 9" },
    { price: Math.round(basePrice * 1.35), daysAgo: 0, volume: 4, label: "PSA 10" },
  ];
}

const gradeBreakdown = [
  { grade: "PSA 10", pct: 8, count: 124, avgPrice: "$36,500" },
  { grade: "PSA 9", pct: 35, count: 543, avgPrice: "$13,050" },
  { grade: "PSA 8", pct: 28, count: 434, avgPrice: "$4,200" },
  { grade: "PSA 7", pct: 18, count: 279, avgPrice: "$1,850" },
  { grade: "Raw", pct: 11, count: 170, avgPrice: "$680" },
];

// ══════════════════════════════════════════════════════════════════
export default function HomePage() {
  const [step, setStep] = useState<Step>("theme");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [theme, setTheme] = useState<ThemeKey>("wwe");
  const [activePlayer, setActivePlayer] = useState<string>("");
  const [priceRange, setPriceRange] = useState<"7d" | "30d">("30d");

  const t = THEMES[theme];
  const A = t.accent;
  const AB = t.accentBright;

  const toggleCard = (slug: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else if (next.size < 3) next.add(slug);
      return next;
    });
  };

  const selectedPlayers = useMemo(() => {
    return Array.from(selected).map(s => getPlayer(s)!).filter(Boolean);
  }, [selected]);

  // Auto-advance to analytics when 3 cards are selected
  useEffect(() => {
    if (step === "select" && selected.size === 3) {
      const timer = setTimeout(() => {
        setActivePlayer("all");
        setStep("analytics");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [selected, step]);

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: THEME SELECTION (FIRST)
  // ═══════════════════════════════════════════════════════════════
  if (step === "theme") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#050505", backgroundImage: "none", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: "20%", top: "30%", width: 500, height: 500, background: "radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 60%)" }} />
          <div style={{ position: "absolute", right: "20%", top: "30%", width: 500, height: 500, background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 60%)" }} />
        </div>
        <div style={{ maxWidth: 700, textAlign: "center", zIndex: 1 }}>
          <img src="/logo.png" alt="CardPulse" style={{ height: 60, width: "auto", objectFit: "contain", margin: "0 auto 28px", display: "block" }} />
          <h1 style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontWeight: 700, fontSize: "clamp(2rem, 5vw, 3.2rem)", textTransform: "uppercase", letterSpacing: "0.04em", color: "#f0f0f0", lineHeight: 1.1, margin: "0 0 12px" }}>
            Choose Your <span style={{ color: "#dc2626" }}>Theme</span>
          </h1>
          <p style={{ color: "#555", fontSize: "0.9rem", marginBottom: 40, lineHeight: 1.6, maxWidth: 500, margin: "0 auto 40px" }}>
            Pick a visual style first — then build your roster of 3 cards.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 560, margin: "0 auto" }}>
            {(Object.keys(THEMES) as ThemeKey[]).map(key => {
              const th = THEMES[key]; const Icon = th.icon;
              return (
                <div key={key} onClick={() => { setTheme(key); setStep("select"); }} style={{
                  background: th.gradient, border: `1px solid ${th.border}`, borderRadius: 18, padding: "36px 24px",
                  cursor: "pointer", transition: "all 0.25s", position: "relative", overflow: "hidden",
                }}
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
          <p style={{ color: "#333", fontSize: "0.6rem", marginTop: 32, fontFamily: "var(--font-oswald), Oswald, sans-serif", letterSpacing: "0.12em", textTransform: "uppercase" }}>CARDPULSE ANALYTICS · DEMO V2.0</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: CARD SELECTION (THEMED)
  // ═══════════════════════════════════════════════════════════════
  if (step === "select") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#050505", backgroundImage: t.vignette, padding: "40px 20px" }}>
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: "10%", top: "20%", width: 600, height: 600, background: `radial-gradient(circle, ${A}0d 0%, transparent 60%)` }} />
          <div style={{ position: "absolute", right: "10%", bottom: "20%", width: 500, height: 500, background: `radial-gradient(circle, ${A}0a 0%, transparent 60%)` }} />
        </div>
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div onClick={() => { setStep("theme"); setSelected(new Set()); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", color: "#555", fontSize: "0.75rem", marginBottom: 20 }}>
              <ArrowLeft size={14} /> Change Theme
            </div>
            <h1 style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontWeight: 700, fontSize: "clamp(2rem, 5vw, 3.2rem)", textTransform: "uppercase", letterSpacing: "0.04em", color: "#f0f0f0", lineHeight: 1.1, margin: "0 0 12px" }}>
              Build Your <span style={{ color: A }}>Roster</span>
            </h1>
            <p style={{ color: "#555", fontSize: "0.9rem", maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
              Select <strong style={{ color: A }}>3 cards</strong> — analytics will load automatically.
            </p>
            {/* Theme badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 14, background: `${A}14`, border: `1px solid ${A}33`, borderRadius: 8, padding: "4px 14px" }}>
              <t.icon size={14} color={A} />
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: A, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.name}</span>
            </div>
            {/* Progress circles */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: selected.size >= i ? `${A}33` : "rgba(255,255,255,0.03)",
                  border: `2px solid ${selected.size >= i ? A : "rgba(255,255,255,0.08)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: 800, color: selected.size >= i ? A : "#444",
                  fontFamily: "Oswald, sans-serif", transition: "all 0.3s",
                  boxShadow: selected.size >= i ? `0 0 15px ${A}4d` : "none",
                }}>{selected.size >= i ? <Check size={16} /> : i}</div>
              ))}
              <span style={{ fontSize: "0.72rem", color: "#555", fontWeight: 600, marginLeft: 4, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em" }}>{selected.size}/3 SELECTED</span>
            </div>
          </div>

          {/* Card Grid — THEMED */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 20, maxWidth: 1060, margin: "0 auto" }}>
            {CARDS.map((card, idx) => {
              const isSelected = selected.has(card.slug);
              const pd = getPlayer(card.slug)!;
              const p = pd.player;
              const disabled = !isSelected && selected.size >= 3;
              return (
                <div key={card.slug} onClick={() => !disabled && toggleCard(card.slug)} style={{
                  background: isSelected ? `linear-gradient(145deg, ${A}1a, rgba(14,14,14,0.96))` : "linear-gradient(145deg, rgba(14,14,14,0.95), rgba(8,8,8,0.98))",
                  border: `2px solid ${isSelected ? `${A}80` : disabled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 18, overflow: "hidden", cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.4 : 1, transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
                  transform: isSelected ? "translateY(-6px) scale(1.02)" : "translateY(0)",
                  boxShadow: isSelected ? `0 20px 50px ${A}33, 0 0 30px ${A}1a` : "0 4px 30px rgba(0,0,0,0.5)",
                  position: "relative", animation: `fadeSlideUp 0.55s ease-out ${idx * 0.08}s both`,
                }}>
                  {isSelected && (
                    <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10, width: 32, height: 32, borderRadius: "50%", background: A, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px ${A}99` }}>
                      <Check size={18} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                  <div style={{ position: "relative", width: "100%", paddingTop: "130%", overflow: "hidden" }}>
                    <img src={card.image} alt={p.name} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: disabled ? "grayscale(0.8)" : "none", transition: "filter 0.3s" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", background: "linear-gradient(to top, #050505 10%, transparent 100%)" }} />
                  </div>
                  <div style={{ padding: "0 16px 18px", marginTop: -50, position: "relative", zIndex: 2 }}>
                    <h3 style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontWeight: 700, fontSize: "1.1rem", textTransform: "uppercase", color: "#f0f0f0", margin: "0 0 4px", letterSpacing: "0.03em" }}>{p.name}</h3>
                    <p style={{ color: "#555", fontSize: "0.7rem", margin: "0 0 10px", fontWeight: 500 }}>#{p.number} · {p.team} · {p.position}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: `${A}1a`, color: A, border: `1px solid ${A}33`, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em" }}>{p.priceChange}</span>
                      <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "rgba(255,255,255,0.04)", color: "#888", fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em" }}>SCORE {p.overallScore}</span>
                    </div>
                    <button style={{
                      width: "100%", padding: "10px 0", borderRadius: 10, fontFamily: "var(--font-oswald), Oswald, sans-serif",
                      fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em",
                      cursor: disabled ? "not-allowed" : "pointer",
                      border: isSelected ? `1px solid ${A}80` : "1px solid rgba(255,255,255,0.1)",
                      background: isSelected ? `${A}33` : "rgba(255,255,255,0.04)",
                      color: isSelected ? AB : "#888", transition: "all 0.25s",
                    }}>{isSelected ? "✓ Selected" : "Select"}</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Loading indicator when 3 selected */}
          {selected.size === 3 && (
            <div style={{ textAlign: "center", marginTop: 40, animation: "fadeSlideUp 0.4s ease-out both" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 36px", borderRadius: 12, background: `${A}1a`, border: `1px solid ${A}44` }}>
                <div style={{ width: 18, height: 18, border: `2px solid ${A}`, borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: A, textTransform: "uppercase", letterSpacing: "0.1em" }}>Loading Analytics...</span>
              </div>
            </div>
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 3: ANALYTICS — FULL WWE/AMBER STYLE DASHBOARD
  // ═══════════════════════════════════════════════════════════════
  const isAllMode = activePlayer === "all";
  const PCOLORS = [A, AB, "#8b5cf6"];

  // Per-player data
  const allPriceHistories = selectedPlayers.map((pd, i) => ({
    slug: pd.player.slug, name: pd.player.name, color: PCOLORS[i],
    history: generatePriceHistory(PLAYER_PRICES[pd.player.slug] ?? 5000, pd.player.slug.length * 0.3),
  }));

  // Merged multi-line chart data
  const mergedPrices = allPriceHistories[0].history.map((_, di) => {
    const obj: Record<string, string | number> = { day: allPriceHistories[0].history[di].day };
    allPriceHistories.forEach(ph => {
      const pt = ph.history[di];
      obj[ph.name] = pt.price;
      obj[ph.name + "_vol"] = pt.volume;
    });
    return obj;
  });
  const displayMerged = priceRange === "7d" ? mergedPrices.slice(-7) : mergedPrices;

  // Single player fallback
  const ap = isAllMode ? selectedPlayers[0] : getPlayer(activePlayer)!;
  const p = ap.player;
  const cardImage = CARDS.find(c => c.slug === (isAllMode ? selectedPlayers[0].player.slug : activePlayer))!.image;
  const singleHistory = isAllMode ? allPriceHistories[0].history : generatePriceHistory(PLAYER_PRICES[activePlayer] ?? 5000, activePlayer.length * 0.3);
  const displayPrices = priceRange === "7d" ? singleHistory.slice(-7) : singleHistory;
  const salesScatter = generateScatter(PLAYER_PRICES[isAllMode ? selectedPlayers[0].player.slug : activePlayer] ?? 5000);
  const lastPrice = singleHistory[singleHistory.length - 1].price;
  const totalVol = singleHistory.reduce((acc, b) => acc + b.volume, 0);
  const gradeColors = [A, AB, "#6b7280", "#4b5563", "#374151"];

  const dashKpis = isAllMode ? [
    { label: "ROSTER SIZE", value: "3", sub: "Selected Players", icon: Signal, color: A, delta: "+3" },
    { label: "AVG SCORE", value: String(Math.round(selectedPlayers.reduce((s, pd) => s + pd.player.overallScore, 0) / 3)), sub: "Overall Average", icon: BarChart3, color: AB, delta: "+12%" },
    { label: "TOP GRADE", value: selectedPlayers.reduce((best, pd) => pd.player.overallScore > best.player.overallScore ? pd : best).player.cardGrade, sub: selectedPlayers.reduce((best, pd) => pd.player.overallScore > best.player.overallScore ? pd : best).player.name, icon: Flame, color: "#ffffff", delta: "+" },
    { label: "HOT CARDS", value: String(selectedPlayers.filter(pd => pd.player.status === "fire" || pd.player.status === "heating").length), sub: "Fire / Heating", icon: TrendingUp, color: A, delta: "🔥" },
  ] : [
    { label: "CURRENT PRICE", value: `$${lastPrice.toLocaleString()}`, sub: "PSA 9 · Last Sale", icon: DollarSign, color: A, delta: p.priceChange },
    { label: "30D VOLUME", value: String(totalVol), sub: "Sales", icon: BarChart3, color: AB, delta: "+34%" },
    { label: "PRICE FLOOR", value: `$${Math.min(...singleHistory.map(h => h.price)).toLocaleString()}`, sub: "30-day low", icon: TrendingUp, color: "#ffffff", delta: "+8.1%" },
    { label: "CARD GRADE", value: p.cardGrade, sub: `Score: ${p.overallScore}`, icon: Flame, color: A, delta: p.priceChange },
  ];

  // Custom dot with player name label (for all mode)
  const NamedDot = (props: { cx?: number; cy?: number; playerName?: string; color?: string }) => {
    const { cx = 0, cy = 0, playerName = "", color = A } = props;
    const initials = playerName.split(" ").map(w => w[0]).join("");
    return (
      <g>
        <circle cx={cx} cy={cy} r={4} fill={color} stroke="#050505" strokeWidth={1.5} />
        <text x={cx} y={cy - 10} textAnchor="middle" fill={color} fontSize={9} fontWeight={700} fontFamily="Oswald, sans-serif">{initials}</text>
      </g>
    );
  };

  const MultiTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#0c0c0c", border: `1px solid ${A}44`, borderRadius: 12, padding: "10px 16px", color: "#f0f0f0", fontSize: "0.8rem", boxShadow: "0 8px 40px rgba(0,0,0,0.8)" }}>
        <p style={{ color: "#555", fontWeight: 700, fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4, fontFamily: "Oswald, sans-serif" }}>{label}</p>
        {payload.map((pp, i) => (
          <p key={i} style={{ fontWeight: 700, color: pp.color || A, marginBottom: 1 }}>{pp.name}: <strong>${Number(pp.value).toLocaleString()}</strong></p>
        ))}
      </div>
    );
  };

  const PriceTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#0c0c0c", border: `1px solid ${A}44`, borderRadius: 12, padding: "10px 16px", color: "#f0f0f0", fontSize: "0.8rem", boxShadow: "0 8px 40px rgba(0,0,0,0.8)" }}>
        <p style={{ color: "#555", fontWeight: 700, fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4, fontFamily: "Oswald, sans-serif" }}>{label}</p>
        {payload.map((pp, i) => (
          <p key={i} style={{ fontWeight: 700, color: pp.name === "price" ? A : "#6b7280", marginBottom: 1 }}>{pp.name === "price" ? `$${pp.value.toLocaleString()}` : `${pp.value} sales`}</p>
        ))}
      </div>
    );
  };

  const ScatterTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { price: number; daysAgo: number; volume: number; label: string } }[] }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: "#0c0c0c", border: `1px solid ${A}44`, borderRadius: 12, padding: "10px 16px", color: "#f0f0f0", fontSize: "0.8rem", boxShadow: "0 8px 40px rgba(0,0,0,0.8)" }}>
        <p style={{ fontWeight: 800, color: A, marginBottom: 2, fontFamily: "Oswald, sans-serif" }}>{d.label}</p>
        <p style={{ color: "#aaa" }}>Price: <strong style={{ color: "#f0f0f0" }}>${d.price.toLocaleString()}</strong></p>
        <p style={{ color: "#aaa" }}>Volume: <strong style={{ color: "#f0f0f0" }}>{d.volume}</strong></p>
        <p style={{ color: "#555" }}>{d.daysAgo === 0 ? "Today" : `${d.daysAgo}d ago`}</p>
      </div>
    );
  };

  const C: React.CSSProperties = {
    background: "linear-gradient(145deg, rgba(14,14,14,0.95), rgba(8,8,8,0.98))",
    border: `1px solid ${A}1a`, borderRadius: 16, padding: 24,
    boxShadow: "0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#050505", backgroundImage: t.vignette, paddingBottom: 60 }}>
      {/* ═══ NAVBAR ═══ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
        background: "rgba(5,5,5,0.92)", borderBottom: `1px solid ${A}1a`,
        padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="CardPulse" style={{ height: 44, width: "auto", objectFit: "contain", filter: `drop-shadow(0 0 10px ${t.glow})` }} />
          <span style={{ background: `${A}1a`, border: `1px solid ${A}44`, borderRadius: 5, padding: "2px 8px", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: A, fontFamily: "Oswald, sans-serif" }}>LIVE</span>
          <span style={{ background: `${A}14`, border: `1px solid ${A}33`, borderRadius: 5, padding: "2px 8px", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: AB, fontFamily: "Oswald, sans-serif" }}>{t.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => { setStep("theme"); setSelected(new Set()); }} style={{
            background: `${A}1a`, border: `1px solid ${A}44`, borderRadius: 8, padding: "6px 16px", fontSize: "0.72rem", fontWeight: 700,
            color: A, cursor: "pointer", fontFamily: "Oswald, sans-serif", textTransform: "uppercase", letterSpacing: "0.06em",
          }}>← New Roster</button>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: 99, background: "green", boxShadow: "0 0 8px rgba(0,128,0,0.7)", animation: "flicker 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize: "0.65rem", color: A, fontWeight: 700, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em" }}>LIVE</span>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "28px 20px", display: "flex", flexDirection: "column", gap: 22 }}>

        {/* ═══ HERO HEADER ═══ */}
        {isAllMode ? (
          <div className="animate-fade-up" style={{ ...C, position: "relative", overflow: "hidden", border: `1px solid ${A}33`, boxShadow: `0 0 20px ${A}33, 0 0 60px ${A}0d, inset 0 1px 0 rgba(255,255,255,0.06)` }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 120, height: "300%", background: `linear-gradient(90deg, transparent 0%, ${A}0a 40%, rgba(255,255,255,0.03) 50%, ${A}0a 60%, transparent 100%)`, pointerEvents: "none", animation: "spotlightSweep 6s ease-in-out infinite" }} />
            <h2 className="arena-headline" style={{ fontSize: "1.3rem", color: A, margin: "0 0 6px", zIndex: 1, position: "relative" }}>ROSTER OVERVIEW</h2>
            <p style={{ color: "#555", fontSize: "0.75rem", marginBottom: 20, zIndex: 1, position: "relative" }}>Comparing {selectedPlayers.length} players — click a player in the sidebar to view individual analytics.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, zIndex: 1, position: "relative" }}>
              {selectedPlayers.map((pd, i) => {
                const img = CARDS.find(c => c.slug === pd.player.slug)!.image;
                return (
                  <div key={pd.player.slug} onClick={() => setActivePlayer(pd.player.slug)} style={{ display: "flex", alignItems: "center", gap: 12, background: `${PCOLORS[i]}0d`, border: `1px solid ${PCOLORS[i]}33`, borderRadius: 12, padding: 12, cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = PCOLORS[i]; e.currentTarget.style.boxShadow = `0 0 20px ${PCOLORS[i]}33`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = `${PCOLORS[i]}33`; e.currentTarget.style.boxShadow = "none"; }}>
                    <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: `2px solid ${PCOLORS[i]}66` }}>
                      <img src={img} alt={pd.player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f0f0f0", fontFamily: "Oswald, sans-serif", textTransform: "uppercase" }}>{pd.player.name}</div>
                      <div style={{ fontSize: "0.6rem", color: "#555" }}>{pd.player.team} · #{pd.player.number}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: `${PCOLORS[i]}1a`, color: PCOLORS[i], border: `1px solid ${PCOLORS[i]}33` }}>{pd.player.priceChange}</span>
                        <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: "#888" }}>SCORE {pd.player.overallScore}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="animate-fade-up" style={{ ...C, display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, position: "relative", overflow: "hidden", border: `1px solid ${A}33`, boxShadow: `0 0 20px ${A}33, 0 0 60px ${A}0d, inset 0 1px 0 rgba(255,255,255,0.06)` }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 120, height: "300%", background: `linear-gradient(90deg, transparent 0%, ${A}0a 40%, rgba(255,255,255,0.03) 50%, ${A}0a 60%, transparent 100%)`, pointerEvents: "none", animation: "spotlightSweep 6s ease-in-out infinite" }} />
            <div style={{ position: "absolute", right: -80, top: -80, width: 350, height: 350, background: `radial-gradient(circle, ${A}14 0%, transparent 65%)`, pointerEvents: "none" }} />
            <div style={{ display: "flex", alignItems: "center", zIndex: 1 }}>
              <div className="card-slab-wrap"><div className="card-slab-glow" style={{ inset: "-22%", background: `radial-gradient(circle, ${A}bb 0%, transparent 70%)` }} />
                <div className="card-slab-frame" style={{ boxShadow: `0 0 25px ${A}77, 0 8px 40px rgba(0,0,0,0.8)` }}>
                  <img src={cardImage} alt={p.name} width={180} height={260} style={{ borderRadius: 8, objectFit: "cover" }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div><div className="arena-headline" style={{ fontSize: "3rem", color: A, lineHeight: 1 }}>{p.priceChange}</div><div style={{ fontSize: "0.62rem", color: "#555", fontWeight: 600, marginTop: 3, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em" }}>{p.priceLabel}</div></div>
                <span className={statusBadgeClass(p.status)} style={{ fontSize: "0.72rem" }}>{statusLabel(p.status)}</span>
              </div>
              <div><h1 className="arena-headline" style={{ fontSize: "clamp(1.8rem,4vw,3rem)", color: "#f0f0f0", margin: 0 }}>{p.name.split(" ")[0].toUpperCase()} <span className={t.textClass}>{p.name.split(" ").slice(1).join(" ").toUpperCase()}</span></h1>
                <p style={{ color: "#555", fontSize: "0.78rem", marginTop: 4, fontWeight: 500 }}>#{p.number} · {p.team} · {p.featuredCard}</p></div>
              <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${A}66, ${A}99, ${A}66, transparent)`, border: "none", margin: "4px 0" }} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[{ l: "LAST SALE", v: `$${lastPrice.toLocaleString()}` }, { l: "30D HIGH", v: `$${Math.max(...singleHistory.map(h => h.price)).toLocaleString()}` }, { l: "30D LOW", v: `$${Math.min(...singleHistory.map(h => h.price)).toLocaleString()}` }, { l: "VOLUME", v: `${totalVol} sales` }].map(s => (
                  <div key={s.l} style={{ background: `${A}0d`, border: `1px solid ${A}1f`, borderRadius: 10, padding: "6px 12px" }}><div style={{ fontSize: "0.52rem", color: A, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, fontFamily: "Oswald, sans-serif" }}>{s.l}</div><div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f0f0f0", marginTop: 1 }}>{s.v}</div></div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: `${A}0f`, border: `1px solid ${A}26`, borderRadius: 9, padding: "7px 12px" }}><Zap size={13} color={A} /><span style={{ fontSize: "0.72rem", color: "#777" }}><strong style={{ color: A }}>AI SIGNAL:</strong> Card Grade: {p.cardGrade} · Overall Score: {p.overallScore}/100</span></div>
            </div>
          </div>
        )}

        {/* ═══ KPI STRIP ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
          {dashKpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className={`animate-fade-up-delay-${i + 1}`} style={{ ...C, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${kpi.color}14`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${kpi.color}25` }}>
                    <Icon size={16} color={kpi.color} strokeWidth={2} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <ArrowUpRight size={12} color={A} />
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: A }}>{kpi.delta}</span>
                  </div>
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#f0f0f0", lineHeight: 1, fontFamily: "Oswald, sans-serif" }}>{kpi.value}</div>
                <div className="arena-subhead" style={{ fontSize: "0.62rem", color: A, marginTop: 4 }}>{kpi.label}</div>
                <div style={{ fontSize: "0.58rem", color: "#444", marginTop: 2, fontWeight: 500 }}>{kpi.sub}</div>
              </div>
            );
          })}
        </div>

        {/* ═══ TWO COLUMNS ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 18, alignItems: "start" }}>

          {/* LEFT: Charts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Price Trend */}
            <div className="animate-fade-up-delay-2" style={C}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <p className="section-label" style={{ color: A }}>PRICE TREND</p>
                  <h2 className="arena-headline" style={{ fontSize: "1.15rem", color: "#f0f0f0", margin: 0 }}>30-DAY PRICE HISTORY</h2>
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  {(["7d", "30d"] as const).map(r => (
                    <button key={r} onClick={() => setPriceRange(r)} style={{
                      padding: "4px 11px", borderRadius: 6, fontSize: "0.65rem", fontWeight: 700,
                      border: priceRange === r ? `1px solid ${A}` : "1px solid rgba(255,255,255,0.06)",
                      background: priceRange === r ? `${A}26` : "transparent",
                      color: priceRange === r ? A : "#555", cursor: "pointer", textTransform: "uppercase", fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em",
                    }}>{r}</button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                {isAllMode ? (
                  <LineChart data={displayMerged} margin={{ top: 15, right: 8, left: -5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "#444", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin - 200", "dataMax + 200"]} tickFormatter={v => `$${(Number(v) / 1000).toFixed(1)}k`} />
                    <Tooltip content={<MultiTooltip />} />
                    {allPriceHistories.map((ph, i) => (
                      <Line key={ph.slug} type="monotone" dataKey={ph.name} name={ph.name} stroke={ph.color} strokeWidth={2.5} dot={<NamedDot playerName={ph.name} color={ph.color} />} activeDot={{ r: 6, fill: ph.color, stroke: "#000", strokeWidth: 2 }} style={{ filter: `drop-shadow(0 0 8px ${ph.color}80)` }} />
                    ))}
                  </LineChart>
                ) : (
                  <AreaChart data={displayPrices} margin={{ top: 4, right: 8, left: -5, bottom: 0 }}>
                    <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={A} stopOpacity={0.35} /><stop offset="100%" stopColor={A} stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "#444", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin - 200", "dataMax + 200"]} tickFormatter={v => `$${(Number(v) / 1000).toFixed(1)}k`} />
                    <Tooltip content={<PriceTooltip />} />
                    <Area type="monotone" dataKey="price" stroke={A} strokeWidth={2.5} fill="url(#pg)" name="price" dot={{ fill: A, strokeWidth: 0, r: 3 }} activeDot={{ fill: AB, strokeWidth: 2, stroke: A, r: 5 }} style={{ filter: `drop-shadow(0 0 8px ${A}80)` }} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Volume Combo */}
            <div className="animate-fade-up-delay-3" style={C}>
              <p className="section-label" style={{ color: A }}>TRADING VOLUME</p>
              <h2 className="arena-headline" style={{ fontSize: "1.1rem", color: "#f0f0f0", margin: 0, marginBottom: 18 }}>DAILY SALES ACTIVITY</h2>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={isAllMode ? displayMerged : displayPrices} margin={{ top: 4, right: 8, left: -5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "#444", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis yAxisId="vol" orientation="left" tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="prc" orientation="right" tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin - 200", "dataMax + 200"]} tickFormatter={v => `$${(Number(v) / 1000).toFixed(1)}k`} />
                  <Tooltip content={isAllMode ? <MultiTooltip /> : <PriceTooltip />} />
                  {isAllMode ? (
                    allPriceHistories.map(ph => <Bar key={`b-${ph.slug}`} yAxisId="vol" dataKey={`${ph.name}_vol`} name={`${ph.name} vol`} fill={ph.color} stackId="a" />)
                  ) : (
                    <Bar yAxisId="vol" dataKey="volume" name="volume" radius={[3, 3, 0, 0]}>
                      {displayPrices.map((_, i) => <Cell key={i} fill={`${A}${Math.round((0.2 + (i / displayPrices.length) * 0.5) * 255).toString(16).padStart(2, '0')}`} />)}
                    </Bar>
                  )}
                  {isAllMode ? (
                    allPriceHistories.map(ph => <Line key={`l-${ph.slug}`} yAxisId="prc" type="monotone" dataKey={ph.name} name={ph.name} stroke={ph.color} strokeWidth={2} dot={false} />)
                  ) : (
                    <Line yAxisId="prc" type="monotone" dataKey="price" name="price" stroke="#fff" strokeWidth={2} dot={false} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Scatter */}
            <div className="animate-fade-up-delay-4" style={C}>
              <p className="section-label" style={{ color: A }}>SALES DISTRIBUTION</p>
              <h2 className="arena-headline" style={{ fontSize: "1.1rem", color: "#f0f0f0", margin: 0, marginBottom: 18 }}>PRICE VS RECENCY</h2>
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="daysAgo" reversed tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="price" tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(Number(v) / 1000).toFixed(0)}k`} domain={["dataMin - 500", "dataMax + 500"]} />
                  <ZAxis dataKey="volume" range={[60, 400]} />
                  <Tooltip content={<ScatterTooltip />} />
                  <Scatter data={salesScatter.filter(d => d.label === "PSA 10")} fill={A} opacity={0.95} name="PSA 10" />
                  <Scatter data={salesScatter.filter(d => d.label === "PSA 9")} fill="#fff" opacity={0.8} name="PSA 9" />
                  <Scatter data={salesScatter.filter(d => d.label === "PSA 8")} fill="#6b7280" opacity={0.6} name="PSA 8" />
                </ScatterChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 10 }}>
                {[{ label: "PSA 10", color: A }, { label: "PSA 9", color: "#fff" }, { label: "PSA 8", color: "#6b7280" }].map(g => (
                  <div key={g.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 99, background: g.color, boxShadow: `0 0 6px ${g.color}66` }} />
                    <span style={{ fontSize: "0.65rem", color: "#666", fontWeight: 600, fontFamily: "Oswald, sans-serif" }}>{g.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grade Breakdown */}
            <div className="animate-fade-up-delay-5" style={C}>
              <p className="section-label" style={{ color: A }}>POPULATION REPORT</p>
              <h2 className="arena-headline" style={{ fontSize: "1.1rem", color: "#f0f0f0", margin: 0, marginBottom: 20 }}>GRADE DISTRIBUTION</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {gradeBreakdown.map((g, gi) => (
                  <div key={g.grade}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: gradeColors[gi], minWidth: 55, fontFamily: "Oswald, sans-serif" }}>{g.grade}</span>
                        <span style={{ fontSize: "0.65rem", color: "#444", fontWeight: 500 }}>{g.count} graded</span>
                      </div>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f0f0f0" }}>{g.avgPrice}</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.03)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${g.pct}%`, background: `linear-gradient(90deg, ${gradeColors[gi]}88, ${gradeColors[gi]})`, borderRadius: 99, boxShadow: `0 0 8px ${gradeColors[gi]}44`, animation: "progressFill 1.2s cubic-bezier(0.65,0,0.35,1) 0.3s both" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="animate-fade-up-delay-2" style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 72 }}>
            {/* Events */}
            <div style={C}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <Bell size={15} color={A} />
                <h2 className="arena-headline" style={{ fontSize: "0.95rem", color: "#f0f0f0", margin: 0 }}>EVENTS TIMELINE</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {ap.news_feed.map((ev, i) => (
                  <div key={ev.id} style={{ display: "flex", gap: 12, position: "relative" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 20 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 99, background: ev.type === "signal" || ev.type === "price" ? A : "#555", boxShadow: ev.type === "signal" || ev.type === "price" ? `0 0 8px ${A}88` : "none", zIndex: 1 }} />
                      {i < ap.news_feed.length - 1 && <div style={{ width: 1.5, flex: 1, background: `${A}1a`, marginTop: 2 }} />}
                    </div>
                    <div style={{ paddingBottom: 18, flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: ev.type === "signal" || ev.type === "price" ? A : "#666", fontFamily: "Oswald, sans-serif" }}>{newsTypeLabel(ev.type)}</span>
                        <span style={{ fontSize: "0.5rem", color: "#333" }}>•</span>
                        <span style={{ fontSize: "0.6rem", color: "#444", fontWeight: 500 }}>{timeAgo(ev.ts)}</span>
                        {ev.tag && <span style={{ fontSize: "0.5rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", padding: "1px 6px", borderRadius: 4, background: `${A}1f`, color: A, border: `1px solid ${A}4d`, fontFamily: "Oswald, sans-serif" }}>{ev.tag}</span>}
                      </div>
                      <p style={{ fontSize: "0.76rem", fontWeight: 700, color: "#e0e0e0", margin: 0, marginBottom: 2 }}>{ev.title}</p>
                      <p style={{ fontSize: "0.7rem", color: "#555", lineHeight: 1.5, margin: 0 }}>{ev.body}</p>
                      <p style={{ fontSize: "0.56rem", color: "#333", margin: "4px 0 0 0" }}><Clock size={9} style={{ verticalAlign: "middle", marginRight: 3, display: "inline" }} />{formatTimestamp(ev.ts)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Roster Switcher */}
            <div style={C}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Signal size={15} color={A} />
                <h2 className="arena-headline" style={{ fontSize: "0.88rem", color: "#f0f0f0", margin: 0 }}>YOUR ROSTER</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div onClick={() => setActivePlayer("all")} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  background: isAllMode ? `${A}1a` : "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px",
                  border: isAllMode ? `2px solid ${A}80` : "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "all 0.2s",
                  boxShadow: isAllMode ? `0 0 20px ${A}33` : "none", color: isAllMode ? AB : "#888",
                  fontFamily: "Oswald, sans-serif", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase"
                }}>
                  <Flame size={16} /> All Players (Combined)
                </div>
                {selectedPlayers.map((pd, i) => {
                  const isActive = pd.player.slug === activePlayer;
                  const img = CARDS.find(c => c.slug === pd.player.slug)!.image;
                  return (
                    <div key={pd.player.slug} onClick={() => setActivePlayer(pd.player.slug)} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      background: isActive ? `${A}14` : `${A}08`, borderRadius: 10, padding: "8px 10px",
                      border: isActive ? `2px solid ${A}66` : "1px solid rgba(255,255,255,0.04)",
                      cursor: "pointer", transition: "all 0.2s",
                      boxShadow: isActive ? `0 0 15px ${A}22` : "none",
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, overflow: "hidden", border: isActive ? `2px solid ${A}` : "1px solid rgba(255,255,255,0.1)" }}>
                        <img src={img} alt={pd.player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: isActive ? "#f0f0f0" : "#e0e0e0" }}>{pd.player.name}</div>
                        <div style={{ fontSize: "0.6rem", color: "#444", fontWeight: 500 }}>{pd.player.team}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: pd.player.priceChange.startsWith("+") ? A : "#6b7280" }}>{pd.player.priceChange}</div>
                        <span className={statusBadgeClass(pd.player.status)} style={{ fontSize: "0.48rem", padding: "1px 5px" }}>{statusLabel(pd.player.status).replace(" 🔥", "")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Roster Pulse */}
            <div style={{ ...C, padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Eye size={13} color={A} />
                <span className="arena-subhead" style={{ fontSize: "0.72rem", color: "#777" }}>ROSTER PULSE</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "ON FIRE", count: selectedPlayers.filter(pp => pp.player.status === "fire").length, color: AB },
                  { label: "HEATING", count: selectedPlayers.filter(pp => pp.player.status === "heating").length, color: A },
                  { label: "COOLING", count: selectedPlayers.filter(pp => pp.player.status === "cooling").length, color: "#6b7280" },
                  { label: "NEUTRAL", count: selectedPlayers.filter(pp => pp.player.status === "neutral").length, color: "#374151" },
                ].map(stat => (
                  <div key={stat.label} style={{ background: `${A}0a`, border: `1px solid ${A}14`, borderRadius: 9, padding: "9px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: "1.3rem", fontWeight: 900, color: stat.color, lineHeight: 1, fontFamily: "Oswald, sans-serif" }}>{stat.count}</div>
                    <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#444", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 3, fontFamily: "Oswald, sans-serif" }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", paddingTop: 20 }}>
          <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${A}66, ${A}99, ${A}66, transparent)`, border: "none", maxWidth: 200, margin: "0 auto 12px" }} />
          <p className="arena-subhead" style={{ color: "#333", fontSize: "0.62rem" }}>CARDPULSE ANALYTICS · DEMO V2.0</p>
        </div>
      </div>
    </div>
  );
}
