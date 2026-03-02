"use client";
import React, { useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ScatterChart, Scatter, ZAxis, LineChart, Line,
  ComposedChart, Bar, Cell,
} from "recharts";
import { Signal, Bell, TrendingUp, Flame, DollarSign, BarChart3, ArrowUpRight, Clock, Eye, Zap } from "lucide-react";
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
}

export default function MultiDashboard({ players, A, AB, onBack, onNewRoster, vignette, themeName, themeGlow, initialPlayer }: Props) {
  const [activePlayer, setActivePlayer] = useState<string>(initialPlayer ?? "all");
  const [priceRange, setPriceRange] = useState<"7d"|"30d">("30d");

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

  const dashKpis = isAll ? [
    { label: "ROSTER SIZE", value: String(players.length), sub: "Selected Players", icon: Signal, color: A, delta: `+${players.length}` },
    { label: "AVG SCORE", value: String(Math.round(players.reduce((s, pd) => s + pd.player.overallScore, 0) / players.length)), sub: "Overall Avg", icon: BarChart3, color: AB, delta: "+12%" },
    { label: "TOP GRADE", value: players.reduce((b, pd) => pd.player.overallScore > b.player.overallScore ? pd : b).player.cardGrade, sub: players.reduce((b, pd) => pd.player.overallScore > b.player.overallScore ? pd : b).player.name, icon: Flame, color: "#fff", delta: "+" },
    { label: "HOT CARDS", value: String(players.filter(pd => pd.player.status === "fire" || pd.player.status === "heating").length), sub: "Fire / Heating", icon: TrendingUp, color: A, delta: "🔥" },
  ] : [
    { label: "CURRENT PRICE", value: `$${lastPrice.toLocaleString()}`, sub: "PSA 9 · Last Sale", icon: DollarSign, color: A, delta: p.priceChange },
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
          <div className="animate-fade-up" style={{ ...C, position: "relative", overflow: "hidden", border: `1px solid ${A}33`, boxShadow: `0 0 20px ${A}33, 0 0 60px ${A}0d, inset 0 1px 0 rgba(255,255,255,0.06)` }}>
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
                        <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: "#888" }}>SCORE {pd.player.overallScore}</span>
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
              <div className="card-slab-wrap">
                <div className="card-slab-glow" style={{ inset: "-22%", background: `radial-gradient(circle, ${A}bb 0%, transparent 70%)` }} />
                <div className="card-slab-frame" style={{ boxShadow: `0 0 25px ${A}77, 0 8px 40px rgba(0,0,0,0.8)` }}>
                  <img src={cardImage} alt={p.name} className="md-hero-card-img" />
                </div>
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
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[{ l: "LAST SALE", v: `$${lastPrice.toLocaleString()}` }, { l: "30D HIGH", v: `$${Math.max(...singleHist.map(h => h.price)).toLocaleString()}` }, { l: "30D LOW", v: `$${Math.min(...singleHist.map(h => h.price)).toLocaleString()}` }, { l: "VOLUME", v: `${totalVol} sales` }].map(s => (
                  <div key={s.l} style={{ background: `${A}0d`, border: `1px solid ${A}1f`, borderRadius: 10, padding: "6px 12px" }}>
                    <div style={{ fontSize: "0.52rem", color: A, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, fontFamily: "Oswald, sans-serif" }}>{s.l}</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f0f0f0", marginTop: 1 }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: `${A}0f`, border: `1px solid ${A}26`, borderRadius: 9, padding: "7px 12px" }}>
                <Zap size={13} color={A} />
                <span style={{ fontSize: "0.72rem", color: "#777" }}><strong style={{ color: A }}>AI SIGNAL:</strong> Card Grade: {p.cardGrade} · Overall Score: {p.overallScore}/100</span>
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
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#f0f0f0", lineHeight: 1, fontFamily: "Oswald, sans-serif" }}>{kpi.value}</div>
                <div style={{ fontSize: "0.62rem", color: A, marginTop: 4, fontFamily: "Oswald, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>{kpi.label}</div>
                <div style={{ fontSize: "0.58rem", color: "#444", marginTop: 2 }}>{kpi.sub}</div>
              </div>
            );
          })}
        </div>

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
                  <div key={ev.id} style={{ display: "flex", gap: 12, position: "relative" }}>
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
                      <p style={{ fontSize: "0.56rem", color: "#333", margin: "4px 0 0" }}><Clock size={9} style={{ verticalAlign: "middle", display: "inline", marginRight: 3 }} />{formatTimestamp(ev.ts)}</p>
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
    </div>
  );
}
