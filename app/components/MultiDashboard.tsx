"use client";
import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ScatterChart, Scatter, ZAxis, LineChart, Line,
  ComposedChart, Bar, Cell,
} from "recharts";
import { Signal, Bell, TrendingUp, Flame, DollarSign, BarChart3, ArrowUpRight, ArrowLeft, Clock, Eye, Zap, ChevronRight } from "lucide-react";
import { statusLabel, statusBadgeClass, timeAgo, newsTypeLabel, formatTimestamp, type PlayerData } from "@/lib/playerUtils";

const CARDS_MAP: Record<string, string> = {
  mahomes: "/mahomes.png", allen: "/JoshAllen.jpg", burrow: "/JoeBurrow.webp",
  jackson: "/LamarJackson.jpg", herbert: "/JustinHerbert.png",
};

// Format ISO date string → 'Feb 14'
function fmtDate(iso: string) {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

// Format ISO datetime → 'Feb 14, 10:14 AM'
function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

function daysAgo(iso: string) {
  return Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
}

// Flame positions & sizes (pre-computed for deterministic render)
const FLAMES = [
  { left: 8,  w: 28, h: 55, delay: 0,    dur: 0.85, color: "rgba(239,68,68,0.85)" },
  { left: 18, w: 40, h: 80, delay: 0.1,  dur: 1.0,  color: "rgba(245,158,11,0.8)" },
  { left: 28, w: 24, h: 48, delay: 0.25, dur: 0.75, color: "rgba(239,68,68,0.9)" },
  { left: 38, w: 36, h: 70, delay: 0.05, dur: 0.95, color: "rgba(251,191,36,0.75)" },
  { left: 48, w: 44, h: 90, delay: 0.15, dur: 1.1,  color: "rgba(239,68,68,0.8)" },
  { left: 58, w: 30, h: 62, delay: 0.3,  dur: 0.88, color: "rgba(245,158,11,0.85)" },
  { left: 68, w: 38, h: 75, delay: 0.08, dur: 0.92, color: "rgba(239,68,68,0.78)" },
  { left: 78, w: 26, h: 52, delay: 0.2,  dur: 0.82, color: "rgba(251,191,36,0.8)" },
  { left: 88, w: 34, h: 65, delay: 0.12, dur: 1.05, color: "rgba(239,68,68,0.88)" },
];
const EMBERS = [
  { left: 12, delay: 0,    dur: 1.6, alt: false },
  { left: 22, delay: 0.3,  dur: 1.9, alt: true  },
  { left: 35, delay: 0.1,  dur: 1.4, alt: false },
  { left: 45, delay: 0.5,  dur: 2.1, alt: true  },
  { left: 55, delay: 0.2,  dur: 1.7, alt: false },
  { left: 65, delay: 0.4,  dur: 1.5, alt: true  },
  { left: 75, delay: 0.15, dur: 1.8, alt: false },
  { left: 85, delay: 0.35, dur: 2.0, alt: true  },
];

function FireEffect() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", overflow: "hidden" }}>
      {/* Flickering base glow — bottom band */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "38%",
        background: "radial-gradient(ellipse 80% 100% at 50% 100%, rgba(239,68,68,0.32) 0%, rgba(245,158,11,0.16) 45%, transparent 75%)",
        animation: "fireGlowFlicker 0.28s ease-in-out infinite alternate",
      }} />
      {/* Second flicker layer offset */}
      <div style={{
        position: "absolute", bottom: 0, left: "5%", right: "5%", height: "28%",
        background: "radial-gradient(ellipse 60% 100% at 50% 100%, rgba(245,158,11,0.22) 0%, transparent 70%)",
        animation: "fireGlowFlicker 0.41s ease-in-out 0.14s infinite alternate",
      }} />
      {/* Flame tongues */}
      {FLAMES.map((f, i) => (
        <div key={i} style={{
          position: "absolute",
          bottom: 0,
          left: `${f.left}%`,
          width: f.w,
          height: f.h,
          background: `radial-gradient(ellipse 60% 100% at 50% 100%, ${f.color} 0%, transparent 80%)`,
          borderRadius: "50% 50% 30% 30%",
          filter: "blur(3px)",
          animation: `flameDance ${f.dur}s ease-in-out ${f.delay}s infinite`,
          transformOrigin: "bottom center",
        }} />
      ))}
      {/* Ember particles */}
      {EMBERS.map((e, i) => (
        <div key={i} style={{
          position: "absolute",
          bottom: "4%",
          left: `${e.left}%`,
          width: 3, height: 3,
          borderRadius: "50%",
          background: i % 2 === 0 ? "#ef4444" : "#f59e0b",
          boxShadow: `0 0 5px ${i % 2 === 0 ? "#ef4444" : "#f59e0b"}`,
          animation: `${e.alt ? "emberRise2" : "emberRise"} ${e.dur}s ease-out ${e.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

function HeatEffect() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "45%",
        background: "radial-gradient(ellipse 70% 100% at 50% 100%, rgba(245,158,11,0.2) 0%, rgba(239,68,68,0.08) 50%, transparent 75%)",
        animation: "heatShimmer 1.8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: "15%", right: "15%", height: "30%",
        background: "radial-gradient(ellipse 60% 100% at 50% 100%, rgba(245,158,11,0.14) 0%, transparent 70%)",
        animation: "heatShimmer 2.4s ease-in-out 0.6s infinite",
      }} />
    </div>
  );
}

const gradeBreakdown = [

  { grade: "PSA 10", pct: 8,  count: 124, avgPrice: "$36,500" },
  { grade: "PSA 9",  pct: 35, count: 543, avgPrice: "$13,050" },
  { grade: "PSA 8",  pct: 28, count: 434, avgPrice: "$4,200" },
  { grade: "PSA 7",  pct: 18, count: 279, avgPrice: "$1,850" },
  { grade: "Raw",    pct: 11, count: 170, avgPrice: "$680" },
];

const PriceTooltip = ({ active, payload, label, A }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0c0c0c", border: `1px solid ${A}44`, borderRadius: 12, padding: "10px 16px", color: "#f0f0f0", fontSize: "0.8rem", boxShadow: "0 8px 40px rgba(0,0,0,0.8)" }}>
      <p style={{ color: "#555", fontWeight: 700, fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>{label}</p>
      {payload.map((pp: any, i: number) => (
        <p key={i} style={{ fontWeight: 700, color: pp.name === "price" ? A : "#6b7280", marginBottom: 1 }}>
          {pp.name === "price" ? `$${pp.value.toLocaleString()}` : `${pp.value} sales`}
        </p>
      ))}
    </div>
  );
};

const MultiTooltip = ({ active, payload, label, A }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0c0c0c", border: `1px solid ${A}44`, borderRadius: 12, padding: "10px 16px", color: "#f0f0f0", fontSize: "0.8rem" }}>
      <p style={{ color: "#555", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>{label}</p>
      {payload.map((pp: any, i: number) => (
        <p key={i} style={{ fontWeight: 700, color: pp.color || A, marginBottom: 1 }}>{pp.name}: <strong>${Number(pp.value).toLocaleString()}</strong></p>
      ))}
    </div>
  );
};

interface Props {
  players: PlayerData[];
  A: string;
  AB: string;
  onBack: () => void;
  onNewRoster: () => void;
  vignette: string;
  themeName: string;
  themeGlow: string;
  initialPlayer?: string;
  buyPrices?: Record<string, number>;
}

export default function MultiDashboard({ players, A, AB, onBack, onNewRoster, vignette, themeName, themeGlow, initialPlayer, buyPrices = {} }: Props) {
  const [activePlayer, setActivePlayer] = useState<string>(initialPlayer ?? "all");
  const [priceRange, setPriceRange] = useState<"7d"|"30d">("30d");
  const [showFlash, setShowFlash] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  React.useEffect(() => { const t = setTimeout(() => setShowFlash(false), 700); return () => clearTimeout(t); }, []);

  // ── Live price simulation ──────────────────────────────────────
  const initPrices = () => Object.fromEntries(
    players.map(pd => {
      const h = (pd as any).price_history as { price: number }[];
      return [pd.player.slug, h[h.length - 1].price];
    })
  );
  const [livePrices, setLivePrices] = useState<Record<string, number>>(initPrices);
  const [priceDir, setPriceDir] = useState<Record<string, "up"|"down"|"">>({});

  React.useEffect(() => {
    const id = setInterval(() => {
      setLivePrices(prev => {
        const next = { ...prev };
        const dirs: Record<string, "up"|"down"> = {};
        players.forEach(pd => {
          const slug = pd.player.slug;
          // Status bias: fire/heating = slightly bullish, cooling = slightly bearish
          const bias =
            pd.player.status === "fire"    ?  0.30 :
            pd.player.status === "heating" ?  0.15 :
            pd.player.status === "cooling" ? -0.10 : 0;
          const pct = (Math.random() * 0.45 + 0.10 + bias) * (Math.random() > 0.48 ? 1 : -1);
          const delta = Math.round(prev[slug] * (pct / 100));
          next[slug] = Math.max(prev[slug] + delta, 100);
          dirs[slug] = delta >= 0 ? "up" : "down";
        });
        setPriceDir(dirs);
        // Clear flash after 600ms
        setTimeout(() => setPriceDir({}), 600);
        return next;
      });
    }, 2500);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players]);

  // One unique color per player slot (up to 5)
  const PCOLORS = ["#ef4444", "#22d3ee", "#a78bfa", "#34d399", "#fb923c"];

  const isAll = activePlayer === "all";
  const ap = isAll ? players[0] : (players.find(p => p.player.slug === activePlayer) ?? players[0]);
  const p = ap.player;
  const cardImage = CARDS_MAP[ap.player.slug] ?? "/mahomes.png";

  // Status-based background glow
  const statusColor =
    ap.player.status === "fire"    ? "239,68,68"  :
    ap.player.status === "heating" ? "245,158,11" :
    ap.player.status === "cooling" ? "96,165,250" :
                                     "148,163,184";
  const [glowOuter, glowInner] =
    ap.player.status === "fire"    ? ["0.20", "0.20"] :
    ap.player.status === "heating" ? ["0.13", "0.05"] :
    ap.player.status === "cooling" ? ["0.20", "0.20"] :
                                     ["0.07", "0.02"];
  const isSinglePlayer = !isAll;


  // Build per-player history from price_history field, format dates
  const allHistories = players.map((pd: any, i: number) => ({
    slug: pd.player.slug, name: pd.player.name, color: PCOLORS[i],
    history: (pd.price_history as { date: string; price: number; volume: number }[]).map(h => ({
      day: fmtDate(h.date), price: h.price, volume: h.volume,
    })),
  }));

  // Merged dataset for the all-players line chart (same x-axis)
  const merged = allHistories[0].history.map((_, di) => {
    const obj: Record<string, string|number> = { day: allHistories[0].history[di].day };
    allHistories.forEach(ph => { obj[ph.name] = ph.history[di]?.price ?? 0; });
    return obj;
  });

  // Single-player history (for AreaChart)
  const apHistory = (ap as any).price_history as { date: string; price: number; volume: number }[];
  const singleHist = apHistory.map(h => ({ day: fmtDate(h.date), price: h.price, volume: h.volume }));
  const displayPrices = priceRange === "7d" ? singleHist.slice(-7) : singleHist;
  const displayMerged = priceRange === "7d" ? merged.slice(-7) : merged;

  // Real PSA sales → scatter
  const apSales = (ap as any).psa_sales as { date: string; grade: string; price: number; platform: string }[];
  const singleScatter = apSales.map(s => ({
    price: s.price, daysAgo: daysAgo(s.date), volume: 6, label: s.grade, platform: s.platform,
    dateStr: fmtDateTime(s.date),
  }));
  const multiScatter = players.flatMap((pd: any, i: number) =>
    (pd.psa_sales as { date: string; grade: string; price: number; platform: string }[]).map(s => ({
      price: s.price, daysAgo: daysAgo(s.date), volume: 6,
      label: s.grade, platform: s.platform, playerName: pd.player.name, color: PCOLORS[i],
      dateStr: fmtDateTime(s.date),
    }))
  );
  const salesScatter = isAll ? multiScatter : singleScatter;

  const lastPrice = singleHist[singleHist.length - 1].price;
  const totalVol = singleHist.reduce((a, b) => a + b.volume, 0);
  const gradeColors = [A, AB, "#6b7280", "#4b5563", "#374151"];

  // 21D avg price
  const last21 = singleHist.slice(-21);
  const avg21d = Math.round(last21.reduce((s, h) => s + h.price, 0) / last21.length);
  // Volume spike detection: last 3d avg vs 30d avg
  const last3dVol = singleHist.slice(-3).reduce((s, h) => s + h.volume, 0) / 3;
  const avg30dVol = totalVol / singleHist.length;
  const isVolSpike = last3dVol > avg30dVol * 1.5;

  const dashKpis = isAll ? [
    { label: "ROSTER SIZE", value: String(players.length), sub: "Selected Players", icon: Signal, color: A, delta: `+${players.length}` },
    { label: "AVG SCORE", value: String(Math.round(players.reduce((s, pd) => s + pd.player.overallScore, 0) / players.length)), sub: "Overall Avg", icon: BarChart3, color: AB, delta: "+12%" },
    { label: "TOP GRADE", value: players.reduce((b, pd) => pd.player.overallScore > b.player.overallScore ? pd : b).player.cardGrade, sub: players.reduce((b, pd) => pd.player.overallScore > b.player.overallScore ? pd : b).player.name, icon: Flame, color: "#fff", delta: "+" },
    { label: "HOT CARDS", value: String(players.filter(pd => pd.player.status === "fire" || pd.player.status === "heating").length), sub: "Fire / Heating", icon: TrendingUp, color: A, delta: "🔥" },
  ] : [
    { label: "CURRENT PRICE", value: `$${(livePrices[p.slug] ?? lastPrice).toLocaleString()}`, sub: "PSA 9 · Live", icon: DollarSign, color: A, delta: p.priceChange },
    { label: "30D VOLUME", value: String(totalVol), sub: "Sales", icon: BarChart3, color: AB, delta: "+34%" },
    { label: "PRICE FLOOR", value: `$${Math.min(...singleHist.map(h => h.price)).toLocaleString()}`, sub: "30-day low", icon: TrendingUp, color: "#fff", delta: "+8.1%" },
    { label: "CARD GRADE", value: p.cardGrade, sub: `Score: ${p.overallScore}`, icon: Flame, color: A, delta: p.priceChange },
  ];

  const C: React.CSSProperties = {
    background: `linear-gradient(145deg, rgba(10,10,10,0.72), rgba(6,6,6,0.82))`,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: `1px solid rgba(${statusColor},0.14)`,
    borderRadius: 16,
    padding: 24,
    boxShadow: `0 4px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(10, 5, 5, 0.06)`,
  };


  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#050505", backgroundImage: vignette, paddingBottom: 60, position: "relative" }}>
      {/* Page-entry flash */}
      {showFlash && <div className="page-flash" />}
      {/* Status-based ambient glow — only for single player */}
      {isSinglePlayer && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(${statusColor},${glowOuter}) 0%, rgba(${statusColor},${glowInner}) 45%, transparent 75%)`,
          transition: "background 1.4s ease",
        }} />
      )}
      {/* NAVBAR */}
      <nav className="md-nav" style={{ backdropFilter: "blur(28px)", background: "rgba(5,5,5,0.92)", borderBottom: `1px solid ${A}1a` }}>
        <div className="nav-brand">
          <img src="/logo.png" alt="CardPulse" style={{ height: 44, objectFit: "contain", filter: `drop-shadow(0 0 10px ${themeGlow})` }} />
          <span style={{ background: `${A}14`, border: `1px solid ${A}33`, borderRadius: 5, padding: "2px 8px", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: AB, fontFamily: "Oswald, sans-serif" }}>{themeName}</span>
        </div>
        <div className="nav-actions">
          <button onClick={onBack} style={{ background: `${A}1a`, border: `1px solid ${A}44`, borderRadius: 8, padding: "6px 16px", fontSize: "0.72rem", fontWeight: 700, color: A, cursor: "pointer", fontFamily: "Oswald, sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>← Edit Roster</button>
          <button onClick={onNewRoster} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 16px", fontSize: "0.72rem", fontWeight: 700, color: "#666", cursor: "pointer", fontFamily: "Oswald, sans-serif", textTransform: "uppercase" }}>New Roster</button>
        </div>
      </nav>
      {/* LIVE indicator sub-bar — tinted with status color */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, padding: "5px 28px",  }}>

        <div style={{ width: 7, height: 7, borderRadius: 99, background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.8)", animation: "flicker 1.5s ease-in-out infinite" }} />
        <span style={{ fontSize: "0.6rem", color: "#22c55e", fontWeight: 700, fontFamily: "Oswald, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Live Market</span>
      </div>

      <div className="md-page-content" style={{ maxWidth: 1300, margin: "0 auto", padding: "28px 20px", display: "flex", flexDirection: "column", gap: 22 }}>
        {/* HERO */}
        {isAll ? (
          <div className="animate-fade-up hero-slam" style={{ ...C, position: "relative", overflow: "hidden", border: `1px solid ${A}33`, boxShadow: `0 0 20px ${A}33, 0 0 60px ${A}0d, inset 0 1px 0 rgba(255,255,255,0.06)` }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 120, height: "300%", background: `linear-gradient(90deg, transparent, ${A}0a 40%, rgba(255,255,255,0.03) 50%, ${A}0a 60%, transparent)`, pointerEvents: "none", animation: "spotlightSweep 6s ease-in-out infinite" }} />
            <h2 style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: "1.3rem", color: A, margin: "0 0 6px", textTransform: "uppercase" }}>ROSTER OVERVIEW</h2>
            <p style={{ color: "#555", fontSize: "0.75rem", marginBottom: 20 }}>Comparing {players.length} players — click a player in the sidebar to view individual analytics.</p>
            <div className="md-roster-grid" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))` }}>

              {players.map((pd, i) => {
                const statusClass =
                  pd.player.status === "fire" ? "card-status-fire" :
                  pd.player.status === "heating" ? "card-status-heating" : "";
                const statusEmoji =
                  pd.player.status === "fire" ? " 🔥" :
                  pd.player.status === "heating" ? " ⚡" :
                  pd.player.status === "cooling" ? " ❄️" : "";
                return (
                  <div key={pd.player.slug} onClick={() => setActivePlayer(pd.player.slug)}
                    className={statusClass}
                    style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, background: `${PCOLORS[i]}0d`, border: `1px solid ${PCOLORS[i]}33`, borderRadius: 12, padding: 12, cursor: "pointer", transition: "border-color 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = PCOLORS[i]; }}
                    onMouseLeave={e => { if (!statusClass) e.currentTarget.style.borderColor = `${PCOLORS[i]}33`; }}>
                    {/* Status badge top-right */}
                    <span className={statusBadgeClass(pd.player.status)} style={{ position: "absolute", top: 8, right: 8, fontSize: "0.48rem", padding: "1px 6px" }}>
                      {statusLabel(pd.player.status)}
                    </span>
                    <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: `2px solid ${PCOLORS[i]}66` }}>
                      <img src={CARDS_MAP[pd.player.slug] ?? "/mahomes.png"} alt={pd.player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f0f0f0", fontFamily: "Oswald, sans-serif", textTransform: "uppercase" }}>{pd.player.name}</div>
                      <div style={{ fontSize: "0.6rem", color: "#555" }}>{pd.player.team} · #{pd.player.number}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: `${PCOLORS[i]}1a`, color: PCOLORS[i], border: `1px solid ${PCOLORS[i]}33` }}>{pd.player.priceChange}</span>
                        {/* Live price with flash */}
                        <span style={{ fontSize: "0.55rem", fontWeight: 800, padding: "1px 6px", borderRadius: 4,
                          background: priceDir[pd.player.slug] === "up" ? "rgba(34,197,94,0.15)" : priceDir[pd.player.slug] === "down" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)",
                          color: priceDir[pd.player.slug] === "up" ? "#22c55e" : priceDir[pd.player.slug] === "down" ? "#ef4444" : "#888",
                          transition: "background 0.3s, color 0.3s",
                          fontFamily: "Oswald, sans-serif",
                        }}>
                          {priceDir[pd.player.slug] === "up" ? "▲ " : priceDir[pd.player.slug] === "down" ? "▼ " : ""}
                          ${(livePrices[pd.player.slug] ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );

              })}

            </div>
          </div>
        ) : (
          <div className="animate-fade-up md-hero-single" style={{ ...C, position: "relative", overflow: "hidden", border: `1px solid ${A}33`, boxShadow: `0 0 20px ${A}33, 0 0 60px ${A}0d, inset 0 1px 0 rgba(255,255,255,0.06)` }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 120, height: "300%", background: `linear-gradient(90deg, transparent, ${A}0a 40%, rgba(255,255,255,0.03) 50%, ${A}0a 60%, transparent)`, pointerEvents: "none", animation: "spotlightSweep 6s ease-in-out infinite" }} />
            <div style={{ display: "flex", alignItems: "center", zIndex: 1 }}>
              {/* 3D Rotating Card — alias.org style */}
              <div className="card-3d-scene" style={{ width: 200, height: 280 }}>
                <div className="card-3d-float" style={{ width: "100%", height: "100%" }}>
                  <div className="card-3d-rotate" style={{ animationDuration: "10s", width: "100%", height: "100%", position: "relative" }}>
                    {/* FRONT FACE — Player image */}
                    <div className="card-3d-face" style={{ position: "absolute", inset: 0, borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ position: "relative", width: "100%", height: "100%" }}>
                        <div className="card-slab-glow" style={{ inset: "-22%", background: `radial-gradient(circle, ${A}bb 0%, transparent 70%)` }} />
                        <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: `0 0 25px ${A}77, 0 8px 40px rgba(0,0,0,0.8)` }}>
                          <img src={cardImage} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }} />
                        </div>
                      </div>
                    </div>
                    {/* BACK FACE — Premium card back */}
                    <div className="card-3d-face" style={{ position: "absolute", inset: 0, transform: "rotateY(180deg)", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{
                        width: "100%", height: "100%",
                        background: "linear-gradient(160deg, #0a0a0a 0%, #111 40%, #0d0d0d 100%)",
                        border: `2px solid ${A}44`,
                        borderRadius: 10,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        padding: "16px 14px", gap: 8, position: "relative", overflow: "hidden",
                        boxShadow: `0 0 25px ${A}77, 0 8px 40px rgba(0,0,0,0.8)`,
                      }}>
                        {/* Inner border accent */}
                        <div style={{ position: "absolute", inset: 6, border: `1px solid ${A}22`, borderRadius: 6, pointerEvents: "none" }} />
                        {/* Top accent line */}
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${A}, transparent)` }} />
                        {/* Grade badge */}
                        <div style={{
                          width: 48, height: 48, borderRadius: "50%",
                          background: `linear-gradient(145deg, ${A}33, ${A}11)`,
                          border: `2px solid ${A}88`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: `0 0 20px ${A}44`,
                        }}>
                          <span className="digital-value" style={{ fontSize: "1rem", color: "#f0f0f0", textShadow: `0 0 12px ${A}88` }}>{p.cardGrade}</span>
                        </div>
                        {/* Auth label */}
                        <div className="stat-label-mono" style={{ fontSize: "0.5rem", color: A, letterSpacing: "0.2em" }}>AUTHENTICATED</div>
                        {/* Player name */}
                        <div style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontWeight: 700, fontSize: "0.78rem", color: "#e0e0e0", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center", lineHeight: 1.2 }}>
                          {p.name}
                        </div>
                        {/* Card details */}
                        <div className="stat-label-mono" style={{ fontSize: "0.38rem", color: "#444", textAlign: "center", lineHeight: 1.5 }}>
                          {p.featuredCard}<br/>#{p.number} · {p.team}
                        </div>
                        {/* Score bar */}
                        <div style={{ width: "65%", height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${p.overallScore}%`, height: "100%", background: `linear-gradient(90deg, ${A}, ${A}88)`, borderRadius: 2 }} />
                        </div>
                        <div className="digital-value" style={{ fontSize: "0.48rem", color: "#555", textShadow: "none" }}>
                          SCORE {p.overallScore}/100
                        </div>
                        {/* Auth pattern */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 1.5, opacity: 0.12, marginTop: 2 }}>
                          {Array.from({ length: 32 }).map((_, i) => (
                            <div key={i} style={{ width: 3.5, height: 3.5, background: i % 3 === 0 ? A : "#fff", borderRadius: 1 }} />
                          ))}
                        </div>
                        {/* Bottom accent */}
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${A}66, transparent)` }} />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Ground shadow */}
                <div className="card-3d-shadow" />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div><div style={{ fontSize: "3rem", fontFamily: "Oswald, sans-serif", fontWeight: 700, color: A, lineHeight: 1 }}>{p.priceChange}</div><div style={{ fontSize: "0.62rem", color: "#555", fontWeight: 600, marginTop: 3, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em" }}>{p.priceLabel}</div></div>
                <span className={statusBadgeClass(p.status)} style={{ fontSize: "0.72rem" }}>{statusLabel(p.status)}</span>
              </div>
              <div><h1 style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: "clamp(1.8rem,4vw,3rem)", color: "#f0f0f0", margin: 0, textTransform: "uppercase" }}>{p.name.split(" ")[0]} <span style={{ color: A }}>{p.name.split(" ").slice(1).join(" ").toUpperCase()}</span></h1>
                <p style={{ color: "#555", fontSize: "0.78rem", marginTop: 4 }}>#{p.number} · {p.team} · {p.featuredCard}</p></div>
              <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${A}66, ${A}99, ${A}66, transparent)` }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8 }}>
                {[
                  { l: "LIVE PRICE",  v: (livePrices[p.slug] ?? lastPrice), isLive: true },
                  { l: "30D HIGH",    v: Math.max(...singleHist.map(h => h.price)) },
                  { l: "30D LOW",     v: Math.min(...singleHist.map(h => h.price)) },
                  { l: "21D AVG",     v: avg21d },
                  { l: "VOLUME",      v: null, vStr: `${totalVol}` },
                  { l: "VOL SPIKE",   v: null, vStr: isVolSpike ? "▲ SPIKE" : "NORMAL", isSpike: isVolSpike },
                ].map(s => {
                  const dir = (s as any).isLive ? (priceDir[p.slug] ?? "") : "";
                  const spikeColor = (s as any).isSpike ? A : undefined;
                  return (
                  <div key={s.l} className="digital-tile" style={{ '--accent': dir === 'up' ? '#22c55e' : dir === 'down' ? '#ef4444' : spikeColor || A, transition: "all 0.3s ease" } as React.CSSProperties}>
                    <div className="stat-label-mono" style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                      {s.l}
                      {(s as any).isLive && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e", animation: "flicker 1.5s ease-in-out infinite", display: "inline-block" }} />}
                    </div>
                    <div className="digital-value" style={{ fontSize: "0.95rem",
                      color: dir === "up" ? "#22c55e" : dir === "down" ? "#ef4444" : (s as any).isSpike ? A : "#f0f0f0",
                      textShadow: dir === "up" ? '0 0 10px rgba(34,197,94,0.5)' : dir === "down" ? '0 0 10px rgba(239,68,68,0.5)' : (s as any).isSpike ? `0 0 10px ${A}55` : `0 0 8px ${A}33`,
                    }}>
                      {s.vStr ? s.vStr : `${dir === "up" ? "▲" : dir === "down" ? "▼" : ""}$${s.v!.toLocaleString()}`}
                    </div>
                  </div>);
                })}
              </div>
              {/* Milestones */}
              {(ap as any).awards && (ap as any).awards.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span className="stat-label-mono" style={{ color: A, marginRight: 4 }}>MILESTONES</span>
                  {(ap as any).awards.map((aw: {year: number; award: string; icon: string}, ai: number) => (
                    <span key={ai} className="milestone-tag" style={{ '--accent': A } as React.CSSProperties}>
                      <span className="milestone-year">{aw.year}</span> {aw.icon} {aw.award}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: `${A}0f`, border: `1px solid ${A}26`, borderRadius: 9, padding: "7px 12px" }}>
                <Zap size={13} color={A} />
                <span className="digital-value" style={{ fontSize: "0.72rem", color: "#777" }}><strong style={{ color: A }}>OUR TAKE:</strong> Grade {p.cardGrade} · Score {p.overallScore}/100</span>
              </div>
            </div>
          </div>
        )}

        {/* KPI STRIP */}
        <div className="md-kpi animate-fade-up-delay-1">
          {dashKpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className={`animate-fade-up-delay-${i + 1}`} style={{ ...C, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${kpi.color}14`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${kpi.color}25` }}><Icon size={16} color={kpi.color} strokeWidth={2} /></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}><ArrowUpRight size={12} color={A} /><span style={{ fontSize: "0.68rem", fontWeight: 700, color: A }}>{kpi.delta}</span></div>
                </div>
                <div className="digital-value" style={{ fontSize: "1.5rem", color: "#f0f0f0", textShadow: `0 0 12px ${kpi.color}55, 0 0 30px ${kpi.color}1a` }}>{kpi.value}</div>
                <div className="stat-label-mono" style={{ color: A, marginTop: 4 }}>{kpi.label}</div>
                <div style={{ fontSize: "0.52rem", color: "#444", marginTop: 2, fontFamily: "var(--font-digital), monospace" }}>{kpi.sub}</div>
              </div>
            );
          })}
        </div>

        {/* ── PORTFOLIO P&L ANALYTICS (only if buy prices entered) ── */}
        {Object.keys(buyPrices).length > 0 && (() => {
          // Scope to active player when one is selected, otherwise all players
          const plSource = isAll ? players : [ap];
          // Per-player P&L calculations
          const plData = plSource.map((pd, i) => {
            const hist = (pd as any).price_history as { price: number }[];
            const cur = livePrices[pd.player.slug] ?? hist[hist.length - 1].price;
            const paid = buyPrices[pd.player.slug];
            const gain = paid ? cur - paid : null;
            const pct = paid ? ((( cur - paid) / paid) * 100) : null;
            // Daily velocity: last 7d price diff / 7
            const weekAgo = hist[hist.length - 7]?.price ?? hist[0].price;
            const dailyVelocity = (cur - weekAgo) / 7;
            return { pd, cur, paid: paid ?? null, gain, pct, i, dailyVelocity, color: PCOLORS[i] };
          });
          const withPaid = plData.filter(d => d.paid !== null);
          const totalPaid = withPaid.reduce((s, d) => s + d.paid!, 0);
          const totalCur = withPaid.reduce((s, d) => s + d.cur, 0);
          const totalGain = totalCur - totalPaid;
          const totalPct = totalPaid ? ((totalGain / totalPaid) * 100).toFixed(1) : "0.0";
          const isPortfolioProfit = totalGain >= 0;
          const portfolioGainColor = isPortfolioProfit ? "#22c55e" : "#ef4444";
          const best = withPaid.reduce((a, b) => ((a.pct ?? -Infinity) > (b.pct ?? -Infinity) ? a : b), withPaid[0]);
          const worst = withPaid.reduce((a, b) => ((a.pct ?? Infinity) < (b.pct ?? Infinity) ? a : b), withPaid[0]);
          const maxAbsPct = Math.max(...withPaid.map(d => Math.abs(d.pct ?? 0)), 1);

          return (
            <div className="animate-fade-up-delay-2" style={{ ...C, border: `1px solid ${portfolioGainColor}22` }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <div>
                  <p style={{ fontSize: "0.62rem", color: A, fontFamily: "Oswald, sans-serif", letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 2px" }}>PORTFOLIO RETURNS</p>
                  <h2 style={{ fontFamily: "Oswald, sans-serif", fontSize: "1.15rem", color: "#f0f0f0", margin: 0, fontWeight: 700, textTransform: "uppercase" }}>YOUR P&amp;L DASHBOARD</h2>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 900, fontSize: "2rem", color: portfolioGainColor, lineHeight: 1 }}>
                    {isPortfolioProfit ? "+" : "-"}${Math.abs(totalGain).toLocaleString()}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: portfolioGainColor, fontWeight: 700 }}>{isPortfolioProfit ? "+" : ""}{totalPct}% Total ROI</div>
                </div>
              </div>

              {/* Summary strip */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 22 }}>
                {[
                  { label: "TOTAL INVESTED", value: `$${totalPaid.toLocaleString()}`, color: "#888" },
                  { label: "CURRENT VALUE", value: `$${totalCur.toLocaleString()}`, color: A },
                  { label: "UNREALISED GAIN", value: `${isPortfolioProfit ? "+" : "-"}$${Math.abs(totalGain).toLocaleString()}`, color: portfolioGainColor },
                ].map(s => (
                  <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ fontSize: "0.5rem", color: "#444", fontFamily: "Oswald, sans-serif", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 800, fontSize: "1.1rem", color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Per-player gain bars */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: "0.55rem", color: "#444", fontFamily: "Oswald, sans-serif", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>PER-PLAYER BREAKDOWN</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {plData.map(d => {
                    const gc = d.gain !== null ? (d.gain >= 0 ? "#22c55e" : "#ef4444") : "#444";
                    const barPct = d.pct !== null ? Math.abs(d.pct) / maxAbsPct * 100 : 0;
                    return (
                      <div key={d.pd.player.slug}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
                            <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: "0.78rem", color: "#f0f0f0", textTransform: "uppercase" }}>{d.pd.player.name}</span>
                            {d.paid && <span style={{ fontSize: "0.55rem", color: "#555" }}>paid ${d.paid.toLocaleString()} · now ${d.cur.toLocaleString()}</span>}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            {d.gain !== null ? (
                              <span style={{ fontFamily: "Oswald, sans-serif", fontWeight: 800, fontSize: "0.88rem", color: gc }}>
                                {d.gain >= 0 ? "+" : "-"}${Math.abs(d.gain).toLocaleString()} <span style={{ fontSize: "0.65rem" }}>({d.gain >= 0 ? "+" : ""}{d.pct!.toFixed(1)}%)</span>
                              </span>
                            ) : <span style={{ fontSize: "0.6rem", color: "#333", fontFamily: "Oswald, sans-serif" }}>No buy price</span>}
                          </div>
                        </div>
                        {/* Bar */}
                        <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${barPct}%`, background: `linear-gradient(90deg, ${gc}88, ${gc})`, borderRadius: 99, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)", boxShadow: `0 0 8px ${gc}66` }} />
                        </div>
                        {/* Daily velocity */}
                        {d.paid && <div style={{ fontSize: "0.52rem", color: "#444", marginTop: 3 }}>7-day avg: {d.dailyVelocity >= 0 ? "+" : "-"}${Math.abs(d.dailyVelocity).toFixed(0)}/day · At this rate, {d.dailyVelocity > 0 ? `doubles in ${Math.round(d.cur / d.dailyVelocity)} days` : d.dailyVelocity < 0 ? `hits breakeven in ${Math.round((d.cur - d.paid) / Math.abs(d.dailyVelocity))} days` : "steady"}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Best / Worst */}
              {withPaid.length > 1 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ fontSize: "0.52rem", color: "#22c55e", fontFamily: "Oswald, sans-serif", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>🏆 Best Performer</div>
                    <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0" }}>{best.pd.player.name}</div>
                    <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#22c55e" }}>{best.pct! >= 0 ? "+" : ""}{best.pct!.toFixed(1)}%</div>
                  </div>
                  <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ fontSize: "0.52rem", color: "#ef4444", fontFamily: "Oswald, sans-serif", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>📉 Needs Watch</div>
                    <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0" }}>{worst.pd.player.name}</div>
                    <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#ef4444" }}>{worst.pct! >= 0 ? "+" : ""}{worst.pct!.toFixed(1)}%</div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* TWO COLUMNS */}
        <div className="md-two-col">
          {/* LEFT — charts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Price trend */}
            <div className="animate-fade-up-delay-2" style={C}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div><p style={{ fontSize: "0.65rem", color: A, fontFamily: "Oswald, sans-serif", letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 2px" }}>PRICE TREND</p><h2 style={{ fontFamily: "Oswald, sans-serif", fontSize: "1.15rem", color: "#f0f0f0", margin: 0, fontWeight: 700, textTransform: "uppercase" }}>30-DAY PRICE HISTORY</h2></div>
                <div style={{ display: "flex", gap: 5 }}>
                  {(["7d","30d"] as const).map(r => (
                    <button key={r} onClick={() => setPriceRange(r)} style={{ padding: "4px 11px", borderRadius: 6, fontSize: "0.65rem", fontWeight: 700, border: priceRange === r ? `1px solid ${A}` : "1px solid rgba(255,255,255,0.06)", background: priceRange === r ? `${A}26` : "transparent", color: priceRange === r ? A : "#555", cursor: "pointer", textTransform: "uppercase", fontFamily: "Oswald, sans-serif" }}>{r}</button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                {isAll ? (
                  <LineChart data={displayMerged} margin={{ top: 15, right: 8, left: -5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin - 200","dataMax + 200"]} tickFormatter={v => `$${(Number(v)/1000).toFixed(1)}k`} />
                    <Tooltip content={<MultiTooltip A={A} />} />
                    {allHistories.map((ph, i) => (
                      <Line key={ph.slug} type="monotone" dataKey={ph.name} stroke={ph.color} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: ph.color, stroke: "#000" }} />
                    ))}
                  </LineChart>
                ) : (
                  <AreaChart data={displayPrices} margin={{ top: 4, right: 8, left: -5, bottom: 0 }}>
                    <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={A} stopOpacity={0.35} /><stop offset="100%" stopColor={A} stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin - 200","dataMax + 200"]} tickFormatter={v => `$${(Number(v)/1000).toFixed(1)}k`} />
                    <Tooltip content={<PriceTooltip A={A} />} />
                    <Area type="monotone" dataKey="price" stroke={A} strokeWidth={2.5} fill="url(#pg)" name="price" dot={{ fill: A, r: 3 }} activeDot={{ fill: AB, r: 5 }} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Scatter */}
            <div className="animate-fade-up-delay-3" style={C}>
              <p style={{ fontSize: "0.65rem", color: A, fontFamily: "Oswald, sans-serif", letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 2px" }}>SALES DISTRIBUTION</p>
              <h2 style={{ fontFamily: "Oswald, sans-serif", fontSize: "1.1rem", color: "#f0f0f0", margin: "0 0 18px", fontWeight: 700, textTransform: "uppercase" }}>PRICE VS RECENCY</h2>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="daysAgo" reversed tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="price" tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(Number(v)/1000).toFixed(0)}k`} domain={["dataMin - 500","dataMax + 500"]} />
                  <ZAxis dataKey="volume" range={[60,400]} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: "#0c0c0c", border: `1px solid ${A}44`, borderRadius: 12, padding: "10px 16px", color: "#f0f0f0", fontSize: "0.8rem" }}>
                        <p style={{ fontWeight: 800, color: A, marginBottom: 2 }}>{isAll && d.playerName ? `${d.playerName} – ${d.label}` : d.label}</p>
                        <p style={{ color: "#aaa" }}>Price: <strong>${d.price?.toLocaleString()}</strong></p>
                        <p style={{ color: "#aaa" }}>Volume: <strong>{d.volume}</strong></p>
                        <p style={{ color: "#555" }}>{d.dateStr ?? (d.daysAgo === 0 ? "Today" : `${d.daysAgo}d ago`)}{d.platform ? ` · ${d.platform}` : ""}</p>

                      </div>
                    );
                  }} />
                  {isAll ? players.map((pd, i) => (
                    <Scatter key={pd.player.slug} data={(salesScatter as any[]).filter((d:any) => d.playerName === pd.player.name)} fill={PCOLORS[i]} opacity={0.8} />
                  )) : (
                    <>
                      <Scatter data={salesScatter.filter((d:any) => d.label === "PSA 10")} fill={A} opacity={0.95} />
                      <Scatter data={salesScatter.filter((d:any) => d.label === "PSA 9")} fill="#fff" opacity={0.8} />
                      <Scatter data={salesScatter.filter((d:any) => d.label === "PSA 8")} fill="#6b7280" opacity={0.6} />
                    </>
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Grade Breakdown */}
            <div className="animate-fade-up-delay-4" style={C}>
              <p style={{ fontSize: "0.65rem", color: A, fontFamily: "Oswald, sans-serif", letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 2px" }}>POPULATION REPORT</p>
              <h2 style={{ fontFamily: "Oswald, sans-serif", fontSize: "1.1rem", color: "#f0f0f0", margin: "0 0 20px", fontWeight: 700, textTransform: "uppercase" }}>GRADE DISTRIBUTION</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {gradeBreakdown.map((g, gi) => (
                  <div key={g.grade}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: gradeColors[gi], minWidth: 55, fontFamily: "Oswald, sans-serif" }}>{g.grade}</span>
                        <span style={{ fontSize: "0.65rem", color: "#444" }}>{isAll ? g.count * players.length : g.count} graded</span>
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
          <div className="md-sidebar animate-fade-up-delay-2">
            {/* Events */}
            <div style={C}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <Bell size={15} color={A} />
                <h2 style={{ fontFamily: "Oswald, sans-serif", fontSize: "0.95rem", color: "#f0f0f0", margin: 0, fontWeight: 700, textTransform: "uppercase" }}>EVENTS TIMELINE</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {ap.news_feed.map((ev, i) => (
                  <div
                    key={ev.id}
                    style={{ display: "flex", gap: 12, position: "relative", cursor: "pointer", borderRadius: 8, padding: "4px 4px 4px 0", transition: "background 0.2s" }}
                    onClick={() => setSelectedEvent(ev)}
                    onMouseEnter={e => { e.currentTarget.style.background = `${A}0a`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 20 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 99, background: ev.type === "signal" || ev.type === "price" ? A : "#555", boxShadow: ev.type === "signal" ? `0 0 8px ${A}88` : "none", zIndex: 1 }} />
                      {i < ap.news_feed.length - 1 && <div style={{ width: 1.5, flex: 1, background: `${A}1a`, marginTop: 2 }} />}
                    </div>
                    <div style={{ paddingBottom: 18, flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: ev.type === "signal" || ev.type === "price" ? A : "#666", fontFamily: "Oswald, sans-serif" }}>{newsTypeLabel(ev.type)}</span>
                        <span style={{ fontSize: "0.5rem", color: "#333" }}>•</span>
                        <span style={{ fontSize: "0.6rem", color: "#444" }}>{timeAgo(ev.ts)}</span>
                        {ev.tag && <span style={{ fontSize: "0.5rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", padding: "1px 6px", borderRadius: 4, background: `${A}1f`, color: A, border: `1px solid ${A}4d`, fontFamily: "Oswald, sans-serif" }}>{ev.tag}</span>}
                      </div>
                      <p style={{ fontSize: "0.76rem", fontWeight: 700, color: "#e0e0e0", margin: "0 0 2px" }}>{ev.title}</p>
                      <p style={{ fontSize: "0.7rem", color: "#555", lineHeight: 1.5, margin: 0 }}>{ev.body}</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                        <p style={{ fontSize: "0.56rem", color: "#333", margin: 0, fontFamily: "var(--font-digital), monospace", letterSpacing: "0.04em" }}><Clock size={9} style={{ verticalAlign: "middle", display: "inline", marginRight: 3 }} />{formatTimestamp(ev.ts)}</p>
                        <span style={{ fontSize: "0.5rem", color: `${A}88`, display: "flex", alignItems: "center", gap: 2 }}>Details <ChevronRight size={10} /></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Roster Switcher */}
            <div style={C}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Signal size={15} color={A} />
                <h2 style={{ fontFamily: "Oswald, sans-serif", fontSize: "0.88rem", color: "#f0f0f0", margin: 0, fontWeight: 700, textTransform: "uppercase" }}>YOUR ROSTER</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {players.length > 1 && (
                  <div onClick={() => setActivePlayer("all")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: isAll ? `${A}1a` : "rgba(255,255,255,0.03)", borderRadius: 10, padding: 10, border: isAll ? `2px solid ${A}80` : "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "all 0.2s", color: isAll ? AB : "#888", fontFamily: "Oswald, sans-serif", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>
                    <Flame size={16} /> All Players (Combined)
                  </div>
                )}
                {players.map((pd, i) => {
                  const isActive = pd.player.slug === activePlayer;
                  return (
                    <div key={pd.player.slug} onClick={() => setActivePlayer(pd.player.slug)} style={{ display: "flex", alignItems: "center", gap: 10, background: isActive ? `${A}14` : `${A}08`, borderRadius: 10, padding: "8px 10px", border: isActive ? `2px solid ${A}66` : "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "all 0.2s", boxShadow: isActive ? `0 0 15px ${A}22` : "none" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, overflow: "hidden", border: isActive ? `2px solid ${A}` : "1px solid rgba(255,255,255,0.1)" }}>
                        <img src={CARDS_MAP[pd.player.slug] ?? "/mahomes.png"} alt={pd.player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: isActive ? "#f0f0f0" : "#e0e0e0" }}>{pd.player.name}</div>
                        <div style={{ fontSize: "0.6rem", color: "#444" }}>{pd.player.team}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: pd.player.priceChange.startsWith("+") ? A : "#6b7280" }}>{pd.player.priceChange}</div>
                        <span className={statusBadgeClass(pd.player.status)} style={{ fontSize: "0.48rem", padding: "1px 5px" }}>{statusLabel(pd.player.status).replace(" 🔥","")}</span>
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
                <span style={{ fontFamily: "Oswald, sans-serif", fontSize: "0.72rem", color: "#777", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>ROSTER PULSE</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "ON FIRE",  count: players.filter(pp => pp.player.status === "fire").length,    color: AB },
                  { label: "HEATING",  count: players.filter(pp => pp.player.status === "heating").length, color: A },
                  { label: "COOLING",  count: players.filter(pp => pp.player.status === "cooling").length, color: "#6b7280" },
                  { label: "NEUTRAL",  count: players.filter(pp => pp.player.status === "neutral").length, color: "#374151" },
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

        <div style={{ textAlign: "center", paddingTop: 20 }}>
          <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${A}66, ${A}99, ${A}66, transparent)`, maxWidth: 200, margin: "0 auto 12px" }} />
          <p style={{ color: "#333", fontSize: "0.62rem", fontFamily: "Oswald, sans-serif", letterSpacing: "0.14em", textTransform: "uppercase" }}>CARDPULSE ANALYTICS · DEMO V2.0</p>
        </div>
      </div>

      {/* ═══ EVENT DETAIL OVERLAY ═══ */}
      {selectedEvent && (() => {
        const ev = selectedEvent;
        const typeIcon = ev.type === "signal" ? <Signal size={18} /> : ev.type === "price" ? <DollarSign size={18} /> : ev.type === "game" ? <Flame size={18} /> : <TrendingUp size={18} />;
        const typeLabel = newsTypeLabel(ev.type);

        // Extended content based on event type
        const extSections = ev.type === "price" ? [
          { label: "MARKET INSIGHT", icon: <BarChart3 size={14} color={A} />, content: `This price movement reflects growing collector confidence. When key threshold prices hold firm for multiple consecutive sessions, it typically signals reduced sell-side pressure and strong institutional-level accumulation. The current bid-ask spread has tightened, which often precedes a breakout to new highs.` },
          { label: "WHAT THIS MEANS", icon: <TrendingUp size={14} color={A} />, content: `For holders, this is a strong validation signal. Price floors establish new baselines that future pullbacks tend to respect. Historical data shows that once a PSA-graded card holds a new price floor for 5+ consecutive days, the probability of a sustained move higher exceeds 72%.` },
          { label: "KEY TAKEAWAY", icon: <Eye size={14} color={A} />, content: `Current market conditions favor accumulation at these levels. Volume patterns suggest smart money is positioning ahead of potential catalysts. Consider this a high-conviction hold zone with asymmetric upside potential.` },
        ] : ev.type === "signal" ? [
          { label: "MOMENTUM ANALYSIS", icon: <BarChart3 size={14} color={A} />, content: `Volume surges of this magnitude typically precede sustained price appreciation. When transaction velocity increases by 40%+ while prices hold or rise, it indicates genuine demand rather than speculative froth. This pattern has historically led to 15-25% price appreciation within 30 days.` },
          { label: "SUPPLY & DEMAND", icon: <TrendingUp size={14} color={A} />, content: `The supply side is thinning — fewer sellers are willing to part with their holdings at current prices. This creates a supply squeeze dynamic where even moderate buying pressure can drive disproportionate price moves. Population reports show the total certified population remains stable, meaning no new supply influx is expected.` },
          { label: "OUR TAKE", icon: <Zap size={14} color={A} />, content: `This is a high-conviction momentum signal. The combination of rising volume, tightening supply, and positive sentiment creates an environment where significant upside is probable. We recommend maintaining positions and considering selective additions on any short-term dips.` },
        ] : ev.type === "game" ? [
          { label: "PERFORMANCE BREAKDOWN", icon: <BarChart3 size={14} color={A} />, content: `Elite-level performance with high efficiency metrics across the board. Completion percentage, yards per attempt, and passer rating all exceed season averages for this game. Zero turnovers adds a floor of safety to the investment thesis, as consistent play underpins long-term card value stability.` },
          { label: "CARD MARKET IMPACT", icon: <DollarSign size={14} color={A} />, content: `On-field performance directly correlates with card market activity. Top-tier stat lines typically generate a 3-7% bump in transaction volume within 48 hours. Sustained elite performance across 3+ consecutive games can trigger institutional-level buying and establish new price channels.` },
          { label: "SEASONAL OUTLOOK", icon: <Eye size={14} color={A} />, content: `Current trajectory projects a top-tier finish for the season. Historical data shows that QBs who maintain this performance level through the back half of the season see their premium card prices appreciate 20-35% into the playoff period. This is a strong hold signal.` },
        ] : [
          { label: "EXPERT ANALYSIS", icon: <BarChart3 size={14} color={A} />, content: `This insight reflects the consensus view among professional card market analysts. The long-term hold classification is assigned to assets with demonstrated resilience across market cycles, strong fundamentals, and significant brand value that transcends short-term market fluctuations.` },
          { label: "INVESTMENT THESIS", icon: <TrendingUp size={14} color={A} />, content: `Dynasty-level assets occupy a unique position in the sports card market. Unlike speculative plays, these holdings benefit from compounding narrative value — each additional achievement adds permanent value to the asset's floor price. The risk/reward profile strongly favors long-term holders.` },
          { label: "STRATEGIC VIEW", icon: <Eye size={14} color={A} />, content: `We recommend a core-holding approach for this asset. Tactical additions on dips of 10%+ represent high-value entry points. The probability of this asset's value declining below its current 52-week low is estimated at less than 8%, making it one of the lowest-risk holdings in the sports card universe.` },
        ];

        return (
          <div style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(2,2,2,0.96)",
            backdropFilter: "blur(20px)",
            overflowY: "auto",
            animation: "fadeSlideUp 0.35s ease-out both",
          }}>
            {/* Top bar */}
            <div style={{ position: "sticky", top: 0, zIndex: 10, background: "linear-gradient(to bottom, rgba(5,5,5,0.98) 70%, transparent)", padding: "16px 24px 24px", display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: `${A}14`, border: `1px solid ${A}33`, borderRadius: 10, padding: "8px 16px", cursor: "pointer", color: A, fontSize: "0.75rem", fontWeight: 700, fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em", textTransform: "uppercase", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = `${A}2a`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${A}14`; }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: "0.5rem", color: "#333", fontFamily: "var(--font-digital), monospace", letterSpacing: "0.1em" }}>EVENT DETAIL</span>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 60px" }}>
              {/* Event type & tag badges */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${A}14`, border: `1px solid ${A}33`, borderRadius: 8, padding: "6px 14px", color: A }}>
                  {typeIcon}
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "Oswald, sans-serif" }}>{typeLabel}</span>
                </div>
                {ev.tag && (
                  <span style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 12px", borderRadius: 6, background: `${A}22`, color: A, border: `1px solid ${A}55`, fontFamily: "Oswald, sans-serif" }}>{ev.tag}</span>
                )}
                <span className="digital-value" style={{ fontSize: "0.6rem", color: "#444", marginLeft: "auto" }}>
                  <Clock size={11} style={{ verticalAlign: "middle", display: "inline", marginRight: 4 }} />
                  {formatTimestamp(ev.ts)}
                </span>
              </div>

              {/* Title */}
              <h1 style={{ fontFamily: "Oswald, sans-serif", fontWeight: 800, fontSize: "clamp(1.5rem, 4vw, 2.4rem)", color: "#f0f0f0", margin: "0 0 8px", textTransform: "uppercase", lineHeight: 1.15 }}>
                {ev.title}
              </h1>

              {/* Accent divider */}
              <div style={{ height: 3, width: 80, background: `linear-gradient(90deg, ${A}, transparent)`, borderRadius: 2, marginBottom: 20 }} />

              {/* Player context */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 16px" }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", border: `2px solid ${A}55`, flexShrink: 0 }}>
                  <img src={cardImage} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div>
                  <div style={{ fontFamily: "Oswald, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#e0e0e0", textTransform: "uppercase" }}>{p.name}</div>
                  <div style={{ fontSize: "0.6rem", color: "#444" }}>#{p.number} · {p.team} · {p.featuredCard}</div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div className="digital-value" style={{ fontSize: "0.85rem", color: A, textShadow: `0 0 10px ${A}55` }}>{p.priceChange}</div>
                  <span className={statusBadgeClass(p.status)} style={{ fontSize: "0.5rem" }}>{statusLabel(p.status)}</span>
                </div>
              </div>

              {/* Main body */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "24px 24px", marginBottom: 24 }}>
                <p style={{ fontSize: "1rem", color: "#c0c0c0", lineHeight: 1.8, margin: 0 }}>
                  {ev.body}
                </p>
              </div>

              {/* Extended analysis sections */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {extSections.map((sec, idx) => (
                  <div key={idx} style={{
                    background: "rgba(255,255,255,0.02)", border: `1px solid ${A}14`,
                    borderRadius: 14, padding: "20px 22px", position: "relative", overflow: "hidden",
                  }}>
                    {/* Subtle top accent */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${A}44, transparent)` }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      {sec.icon}
                      <span className="stat-label-mono" style={{ fontSize: "0.6rem", color: A, letterSpacing: "0.15em" }}>{sec.label}</span>
                    </div>
                    <p style={{ fontSize: "0.82rem", color: "#888", lineHeight: 1.8, margin: 0 }}>
                      {sec.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bottom disclaimer */}
              <div style={{ marginTop: 32, padding: "14px 18px", background: `${A}08`, border: `1px solid ${A}14`, borderRadius: 10 }}>
                <p className="stat-label-mono" style={{ fontSize: "0.5rem", color: "#444", margin: 0, lineHeight: 1.7, letterSpacing: "0.08em" }}>
                  DISCLAIMER: This analysis is for informational purposes only and does not constitute financial advice. Past performance does not guarantee future results. Always conduct your own research before making investment decisions.
                </p>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
