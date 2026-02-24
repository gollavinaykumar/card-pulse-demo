"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ScatterChart, Scatter, ZAxis,
  ComposedChart, Bar, Line, Cell,
} from "recharts";
import {
  Activity, Signal, Bell, ChevronRight, TrendingUp, Flame,
  Sparkles, DollarSign, BarChart3, ArrowUpRight,
  Clock, Eye, Zap, Shield,
} from "lucide-react";
import { getPlayer, getAllPlayers } from "@/lib/players";
import {
  statusLabel, statusBadgeClass,
  timeAgo, newsTypeColor, newsTypeLabel, formatTimestamp,
  type NewsItem,
} from "@/lib/playerUtils";

// ── COLOUR CONSTANTS ────────────────────────────────────────────
const GOLD = "#f59e0b";
const GOLD_BRIGHT = "#fbbf24";
const WHITE = "#f0f0f0";
const CHARCOAL = "#0c0c0c";
const DIM = "#3a3a3a";

// ── 30-day price history ────────────────────────────────────────
const priceHistory = [
  { day: "Jan 25", price: 11200, volume: 18 }, { day: "Jan 26", price: 11350, volume: 22 },
  { day: "Jan 27", price: 11100, volume: 15 }, { day: "Jan 28", price: 11400, volume: 30 },
  { day: "Jan 29", price: 11550, volume: 28 }, { day: "Jan 30", price: 11300, volume: 20 },
  { day: "Jan 31", price: 11600, volume: 24 }, { day: "Feb 1",  price: 11800, volume: 35 },
  { day: "Feb 2",  price: 11750, volume: 31 }, { day: "Feb 3",  price: 11900, volume: 26 },
  { day: "Feb 4",  price: 12000, volume: 40 }, { day: "Feb 5",  price: 11850, volume: 22 },
  { day: "Feb 6",  price: 12100, volume: 38 }, { day: "Feb 7",  price: 12050, volume: 29 },
  { day: "Feb 8",  price: 12200, volume: 33 }, { day: "Feb 9",  price: 12150, volume: 27 },
  { day: "Feb 10", price: 12300, volume: 42 }, { day: "Feb 11", price: 12250, volume: 30 },
  { day: "Feb 12", price: 12400, volume: 36 }, { day: "Feb 13", price: 12350, volume: 25 },
  { day: "Feb 14", price: 12500, volume: 45 }, { day: "Feb 15", price: 12480, volume: 34 },
  { day: "Feb 16", price: 12550, volume: 38 }, { day: "Feb 17", price: 12600, volume: 41 },
  { day: "Feb 18", price: 12450, volume: 29 }, { day: "Feb 19", price: 12700, volume: 48 },
  { day: "Feb 20", price: 12650, volume: 37 }, { day: "Feb 21", price: 12800, volume: 50 },
  { day: "Feb 22", price: 12750, volume: 44 }, { day: "Feb 23", price: 12900, volume: 52 },
  { day: "Feb 24", price: 13050, volume: 58 },
];

// Sales scatter data
const salesScatter = [
  { price: 11500, daysAgo: 28, volume: 4, label: "PSA 8" },
  { price: 12200, daysAgo: 24, volume: 8, label: "PSA 9" },
  { price: 13800, daysAgo: 22, volume: 3, label: "PSA 10" },
  { price: 11800, daysAgo: 20, volume: 5, label: "PSA 8" },
  { price: 12500, daysAgo: 18, volume: 7, label: "PSA 9" },
  { price: 14200, daysAgo: 16, volume: 2, label: "PSA 10" },
  { price: 12000, daysAgo: 14, volume: 6, label: "PSA 8" },
  { price: 12700, daysAgo: 12, volume: 9, label: "PSA 9" },
  { price: 14500, daysAgo: 10, volume: 2, label: "PSA 10" },
  { price: 12300, daysAgo: 8,  volume: 5, label: "PSA 8" },
  { price: 13000, daysAgo: 6,  volume: 10, label: "PSA 9" },
  { price: 15000, daysAgo: 4,  volume: 3, label: "PSA 10" },
  { price: 12600, daysAgo: 3,  volume: 8, label: "PSA 8" },
  { price: 13050, daysAgo: 1,  volume: 12, label: "PSA 9" },
  { price: 15800, daysAgo: 0,  volume: 4, label: "PSA 10" },
];

// Events
const eventsTimeline: (NewsItem & { playerName: string })[] = [
  { id: "e1", ts: "2025-02-24T19:15:00Z", type: "signal",  title: "SLAB MOMENTUM SURGING",     body: "Mahomes 2017 Prizm RC volume up 42% in 48 hours — market reacting to 3-peat narrative after dominant Week 8.", tag: "HEATING UP", playerName: "Patrick Mahomes" },
  { id: "e2", ts: "2025-02-24T16:30:00Z", type: "price",   title: "NEW PRICE FLOOR",            body: "2017 Prizm RC PSA 9 now holding firm above $12,500. Sellers drying up; buy-side depth increasing.", tag: "BREAKOUT", playerName: "Patrick Mahomes" },
  { id: "e3", ts: "2025-02-24T14:00:00Z", type: "price",   title: "PSA 10 AUCTION RECORD",      body: "2017 Prizm Gold /10 PSA 10 sold for $185,000 at Heritage — new all-time modern football record.", tag: "RECORD", playerName: "Patrick Mahomes" },
  { id: "e4", ts: "2025-02-23T21:30:00Z", type: "game",    title: "WEEK 8 DOMINATION",          body: "284 passing yards, 3 TDs, 0 INTs vs LV Raiders. Season passer rating climbs to 101.5.", tag: null, playerName: "Patrick Mahomes" },
  { id: "e5", ts: "2025-02-23T15:00:00Z", type: "insight", title: "DYNASTY STATUS CONFIRMED",   body: "CardPulse AI rates Mahomes as the #1 long-term QB slab hold across all formats.", tag: "ELITE HOLD", playerName: "Patrick Mahomes" },
  { id: "e6", ts: "2025-02-22T18:00:00Z", type: "signal",  title: "SMART MONEY ACCUMULATING",   body: "Institutional-grade buyers detected — 6 PSA 9 slabs purchased in a single 4-hour window.", tag: "BUY SIGNAL", playerName: "Patrick Mahomes" },
  { id: "e7", ts: "2025-02-22T10:00:00Z", type: "price",   title: "BGS 9.5 COMP UPDATE",        body: "2017 Prizm BGS 9.5 last sale: $18,200. Cross-grade premium maintained at 1.4×.", tag: null, playerName: "Patrick Mahomes" },
  { id: "e8", ts: "2025-02-21T09:00:00Z", type: "insight", title: "MARKET CYCLE ANALYSIS",      body: "Mahomes slabs tracking in Phase 3 (acceleration). Room for 15-20% upside.", tag: "BULLISH", playerName: "Patrick Mahomes" },
];

// KPIs
const dashKpis = [
  { label: "CURRENT PRICE", value: "$13,050", sub: "PSA 9 · Last Sale", icon: DollarSign, color: GOLD, delta: "+10.2%" },
  { label: "30D VOLUME",    value: "58",      sub: "Sales (↑34%)",      icon: BarChart3,  color: GOLD_BRIGHT, delta: "+34%" },
  { label: "PRICE FLOOR",   value: "$12,500", sub: "3-day support",     icon: TrendingUp, color: "#ffffff",  delta: "+8.1%" },
  { label: "PSA 10 PREM",   value: "2.8×",    sub: "vs PSA 9 avg",     icon: Flame,      color: GOLD, delta: "+0.3×" },
];

// Grade breakdown
const gradeBreakdown = [
  { grade: "PSA 10", pct: 8,  count: 124, color: GOLD,        avgPrice: "$36,500" },
  { grade: "PSA 9",  pct: 35, count: 543, color: GOLD_BRIGHT, avgPrice: "$13,050" },
  { grade: "PSA 8",  pct: 28, count: 434, color: "#6b7280",  avgPrice: "$4,200" },
  { grade: "PSA 7",  pct: 18, count: 279, color: "#4b5563",  avgPrice: "$1,850" },
  { grade: "Raw",    pct: 11, count: 170, color: "#374151",  avgPrice: "$680" },
];

// ── Tooltips ────────────────────────────────────────────────────
const PriceTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0c0c0c", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "10px 16px", color: WHITE, fontSize: "0.8rem", boxShadow: "0 8px 40px rgba(0,0,0,0.8)" }}>
      <p style={{ color: "#555", fontWeight: 700, fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4, fontFamily: "Oswald, sans-serif" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontWeight: 700, color: p.name === "price" ? GOLD : "#6b7280", marginBottom: 1 }}>
          {p.name === "price" ? `$${p.value.toLocaleString()}` : `${p.value} sales`}
        </p>
      ))}
    </div>
  );
};

const ScatterTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { price: number; daysAgo: number; volume: number; label: string } }[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#0c0c0c", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "10px 16px", color: WHITE, fontSize: "0.8rem", boxShadow: "0 8px 40px rgba(0,0,0,0.8)" }}>
      <p style={{ fontWeight: 800, color: GOLD, marginBottom: 2, fontFamily: "Oswald, sans-serif" }}>{d.label}</p>
      <p style={{ color: "#aaa", marginBottom: 1 }}>Price: <strong style={{ color: WHITE }}>${d.price.toLocaleString()}</strong></p>
      <p style={{ color: "#aaa", marginBottom: 1 }}>Volume: <strong style={{ color: WHITE }}>{d.volume}</strong></p>
      <p style={{ color: "#555" }}>{d.daysAgo === 0 ? "Today" : `${d.daysAgo}d ago`}</p>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
export default function HomePage() {
  const router = useRouter();
  const mahomes = getPlayer("mahomes")!;
  const allPlayers = getAllPlayers();
  const p = mahomes.player;
  const [priceRange, setPriceRange] = useState<"7d" | "30d" | "90d">("30d");

  const displayPrices = useMemo(() => {
    if (priceRange === "7d") return priceHistory.slice(-7);
    return priceHistory;
  }, [priceRange]);

  const C: React.CSSProperties = {
    background: "linear-gradient(145deg, rgba(14,14,14,0.95), rgba(8,8,8,0.98))",
    border: "1px solid rgba(245,158,11,0.1)",
    borderRadius: 16, padding: 24,
    boxShadow: "0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", paddingBottom: 60 }}>

      {/* ═══ NAVBAR ═══ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
        background: "rgba(5,5,5,0.92)",
        borderBottom: "1px solid rgba(245,158,11,0.1)",
        padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="CardPulse" style={{ height: 44, width: "auto", objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(245,158,11,0.4))" }} />
          <span style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 5, padding: "2px 8px", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, fontFamily: "Oswald, sans-serif" }}>LIVE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => router.push(`/classic/players/${p.slug}`)} style={{
            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 8, padding: "6px 16px", fontSize: "0.72rem", fontWeight: 700,
            color: GOLD, cursor: "pointer", fontFamily: "Oswald, sans-serif", textTransform: "uppercase", letterSpacing: "0.06em",
            transition: "all 0.2s",
          }}>Full Analytics →</button>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div className="live-dot" />
            <span style={{ fontSize: "0.65rem", color: GOLD, fontWeight: 700, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em" }}>LIVE</span>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "28px 20px", display: "flex", flexDirection: "column", gap: 22 }}>

        {/* ═══ HERO HEADER — ARENA STYLE ═══ */}
        <div className="animate-fade-up arena-card arena-card-glow" style={{
          display: "grid", gridTemplateColumns: "auto 1fr", gap: 28,
          padding: 28, position: "relative", overflow: "hidden", cursor: "pointer",
        }} onClick={() => router.push(`/classic/players/${p.slug}`)}>
          {/* Spotlight sweep */}
          <div className="arena-spotlight" />
          {/* Red flare orb */}
          <div style={{ position: "absolute", right: -80, top: -80, width: 350, height: 350, background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />

          {/* Slab */}
          <div style={{ display: "flex", alignItems: "center", zIndex: 1 }}>
            <div className="card-slab-wrap">
              <div className="card-slab-glow glow-red" style={{ inset: "-22%" }} />
              <div className="card-slab-frame glow-anim-red">
                <img src="/mahomes.png" alt="Mahomes Prizm PSA 9" width={180} height={260}
                  style={{ borderRadius: 8, objectFit: "cover" }} />
              </div>
            </div>
          </div>

          {/* Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, zIndex: 1 }}>
            {/* Price + status */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div className="arena-headline" style={{ fontSize: "3rem", color: GOLD, lineHeight: 1 }}>{p.priceChange}</div>
                <div style={{ fontSize: "0.62rem", color: "#555", fontWeight: 600, marginTop: 3, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em" }}>{p.priceLabel}</div>
              </div>
              <span className={statusBadgeClass(p.status)} style={{ fontSize: "0.72rem" }}>{statusLabel(p.status)}</span>
            </div>

            {/* Name */}
            <div>
              <h1 className="arena-headline" style={{ fontSize: "clamp(1.8rem,4vw,3rem)", color: WHITE, margin: 0 }}>
                PATRICK <span className="red-text">MAHOMES</span>
              </h1>
              <p style={{ color: "#555", fontSize: "0.78rem", marginTop: 4, fontWeight: 500 }}>
                #15 · Kansas City Chiefs · {p.featuredCard}
              </p>
            </div>

            {/* Red divider */}
            <div className="arena-divider" />

            {/* Mini KPIs */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { l: "LAST SALE", v: "$13,050" },
                { l: "30D HIGH", v: "$13,050" },
                { l: "30D LOW", v: "$11,100" },
                { l: "VOLUME", v: "58 sales" },
              ].map(s => (
                <div key={s.l} style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 10, padding: "6px 12px" }}>
                  <div style={{ fontSize: "0.52rem", color: GOLD, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, fontFamily: "Oswald, sans-serif" }}>{s.l}</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: WHITE, marginTop: 1 }}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* AI insight */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 9, padding: "7px 12px" }}>
              <Zap size={13} color={GOLD} />
              <span style={{ fontSize: "0.72rem", color: "#777" }}>
                <strong style={{ color: GOLD }}>AI SIGNAL:</strong> Phase 3 acceleration — 15-20% upside projected. Card Grade: S+
              </span>
            </div>
          </div>
        </div>

        {/* ═══ KPI STRIP ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
          {dashKpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className={`animate-fade-up-delay-${i + 1} arena-card arena-card-neon-edge`} style={{
                padding: 18, cursor: "default",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${kpi.color}14`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${kpi.color}25` }}>
                    <Icon size={16} color={kpi.color} strokeWidth={2} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <ArrowUpRight size={12} color={GOLD} />
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: GOLD }}>{kpi.delta}</span>
                  </div>
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: WHITE, lineHeight: 1, fontFamily: "Oswald, sans-serif" }}>{kpi.value}</div>
                <div className="arena-subhead" style={{ fontSize: "0.62rem", color: GOLD, marginTop: 4 }}>{kpi.label}</div>
                <div style={{ fontSize: "0.58rem", color: "#444", marginTop: 2, fontWeight: 500 }}>{kpi.sub}</div>
              </div>
            );
          })}
        </div>

        {/* ═══ TWO COLUMNS: CHARTS + EVENTS ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 18, alignItems: "start" }}>

          {/* LEFT: Charts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Price Trend */}
            <div className="animate-fade-up-delay-2 arena-card" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <p className="section-label">PRICE TREND</p>
                  <h2 className="arena-headline" style={{ fontSize: "1.15rem", color: WHITE, margin: 0 }}>30-DAY PRICE HISTORY</h2>
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  {(["7d", "30d", "90d"] as const).map(r => (
                    <button key={r} onClick={() => setPriceRange(r)} style={{
                      padding: "4px 11px", borderRadius: 6, fontSize: "0.65rem", fontWeight: 700,
                      border: priceRange === r ? `1px solid ${GOLD}` : "1px solid rgba(255,255,255,0.06)",
                      background: priceRange === r ? "rgba(245,158,11,0.15)" : "transparent",
                      color: priceRange === r ? GOLD : "#555",
                      cursor: "pointer", transition: "all 0.15s", textTransform: "uppercase",
                      fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em",
                    }}>{r}</button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={displayPrices} margin={{ top: 4, right: 8, left: -5, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "#444", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin - 200", "dataMax + 200"]} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
                  <Tooltip content={<PriceTooltip />} />
                  <Area type="monotone" dataKey="price" stroke={GOLD} strokeWidth={2.5} fill="url(#priceGrad)" name="price"
                    dot={{ fill: GOLD, strokeWidth: 0, r: 3 }}
                    activeDot={{ fill: GOLD_BRIGHT, strokeWidth: 2, stroke: GOLD, r: 5 }}
                    style={{ filter: "drop-shadow(0 0 8px rgba(245,158,11,0.5))" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Volume + Price Combo */}
            <div className="animate-fade-up-delay-3 arena-card" style={{ padding: 24 }}>
              <p className="section-label">TRADING VOLUME</p>
              <h2 className="arena-headline" style={{ fontSize: "1.1rem", color: WHITE, margin: 0, marginBottom: 18 }}>DAILY SALES ACTIVITY</h2>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={displayPrices} margin={{ top: 4, right: 8, left: -5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "#444", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis yAxisId="vol" orientation="left" tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="prc" orientation="right" tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin - 200", "dataMax + 200"]} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
                  <Tooltip content={<PriceTooltip />} />
                  <Bar yAxisId="vol" dataKey="volume" name="volume" radius={[3, 3, 0, 0]}>
                    {displayPrices.map((_, i) => <Cell key={i} fill={`rgba(245,158,11,${0.2 + (i / displayPrices.length) * 0.5})`} />)}
                  </Bar>
                  <Line yAxisId="prc" type="monotone" dataKey="price" name="price" stroke="#fff" strokeWidth={2} dot={false} style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.2))" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Scatter Chart */}
            <div className="animate-fade-up-delay-4 arena-card" style={{ padding: 24 }}>
              <p className="section-label">SALES DISTRIBUTION</p>
              <h2 className="arena-headline" style={{ fontSize: "1.1rem", color: WHITE, margin: 0, marginBottom: 18 }}>
                PRICE VS RECENCY <span style={{ fontSize: "0.72rem", color: "#555", fontWeight: 400, textTransform: "none", fontFamily: "Inter, sans-serif" }}>(dot size = volume)</span>
              </h2>
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="daysAgo" reversed tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: "Days Ago →", position: "insideBottom", offset: -5, fill: "#333", fontSize: 10, fontFamily: "Oswald, sans-serif" }} />
                  <YAxis dataKey="price" tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} domain={["dataMin - 500", "dataMax + 500"]} />
                  <ZAxis dataKey="volume" range={[60, 400]} />
                  <Tooltip content={<ScatterTooltip />} />
                  <Scatter data={salesScatter.filter(d => d.label === "PSA 10")} fill={GOLD} opacity={0.95} name="PSA 10" />
                  <Scatter data={salesScatter.filter(d => d.label === "PSA 9")} fill="#fff" opacity={0.8} name="PSA 9" />
                  <Scatter data={salesScatter.filter(d => d.label === "PSA 8")} fill="#6b7280" opacity={0.6} name="PSA 8" />
                </ScatterChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 10 }}>
                {[{ label: "PSA 10", color: GOLD }, { label: "PSA 9", color: "#fff" }, { label: "PSA 8", color: "#6b7280" }].map(g => (
                  <div key={g.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 99, background: g.color, boxShadow: `0 0 6px ${g.color}66` }} />
                    <span style={{ fontSize: "0.65rem", color: "#666", fontWeight: 600, fontFamily: "Oswald, sans-serif", letterSpacing: "0.04em" }}>{g.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grade Breakdown */}
            <div className="animate-fade-up-delay-5 arena-card" style={{ padding: 24 }}>
              <p className="section-label">POPULATION REPORT</p>
              <h2 className="arena-headline" style={{ fontSize: "1.1rem", color: WHITE, margin: 0, marginBottom: 20 }}>GRADE DISTRIBUTION</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {gradeBreakdown.map(g => (
                  <div key={g.grade}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: g.color, minWidth: 55, fontFamily: "Oswald, sans-serif", letterSpacing: "0.04em" }}>{g.grade}</span>
                        <span style={{ fontSize: "0.65rem", color: "#444", fontWeight: 500 }}>{g.count} graded</span>
                      </div>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: WHITE }}>{g.avgPrice}</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.03)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${g.pct}%`, background: `linear-gradient(90deg, ${g.color}88, ${g.color})`, borderRadius: 99, boxShadow: `0 0 8px ${g.color}44`, animation: "progressFill 1.2s cubic-bezier(0.65,0,0.35,1) 0.3s both" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: EVENTS TIMELINE + SIGNALS */}
          <div className="animate-fade-up-delay-2" style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 72 }}>

            {/* Events */}
            <div className="arena-card" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <Bell size={15} color={GOLD} />
                <h2 className="arena-headline" style={{ fontSize: "0.95rem", color: WHITE, margin: 0 }}>EVENTS TIMELINE</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {eventsTimeline.map((ev, i) => (
                  <div key={ev.id} style={{ display: "flex", gap: 12, position: "relative" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 20 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 99, background: ev.type === "signal" || ev.type === "price" ? GOLD : "#555", boxShadow: ev.type === "signal" || ev.type === "price" ? `0 0 8px ${GOLD}88` : "none", zIndex: 1, flexShrink: 0 }} />
                      {i < eventsTimeline.length - 1 && <div style={{ width: 1.5, flex: 1, background: "rgba(245,158,11,0.1)", marginTop: 2 }} />}
                    </div>
                    <div style={{ paddingBottom: 18, flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: ev.type === "signal" || ev.type === "price" ? GOLD : "#666", fontFamily: "Oswald, sans-serif" }}>{newsTypeLabel(ev.type)}</span>
                        <span style={{ fontSize: "0.5rem", color: "#333" }}>•</span>
                        <span style={{ fontSize: "0.6rem", color: "#444", fontWeight: 500 }}>{timeAgo(ev.ts)}</span>
                        {ev.tag && (
                          <span style={{
                            fontSize: "0.5rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
                            padding: "1px 6px", borderRadius: 4,
                            background: "rgba(245,158,11,0.12)", color: GOLD,
                            border: "1px solid rgba(245,158,11,0.3)",
                            fontFamily: "Oswald, sans-serif",
                          }}>{ev.tag}</span>
                        )}
                      </div>
                      <p style={{ fontSize: "0.76rem", fontWeight: 700, color: "#e0e0e0", margin: 0, marginBottom: 2 }}>{ev.title}</p>
                      <p style={{ fontSize: "0.7rem", color: "#555", lineHeight: 1.5, margin: 0 }}>{ev.body}</p>
                      <p style={{ fontSize: "0.56rem", color: "#333", margin: "4px 0 0 0" }}>
                        <Clock size={9} style={{ verticalAlign: "middle", marginRight: 3, display: "inline" }} />{formatTimestamp(ev.ts)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Other Players */}
            <div className="arena-card" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Signal size={15} color={GOLD} />
                <h2 className="arena-headline" style={{ fontSize: "0.88rem", color: WHITE, margin: 0 }}>OTHER PLAYERS</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {allPlayers.filter(pd => pd.player.slug !== "mahomes").map(pd => (
                  <div key={pd.player.slug} onClick={() => router.push(`/classic/players/${pd.player.slug}`)} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "rgba(245,158,11,0.03)", borderRadius: 10, padding: "8px 10px",
                    border: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "all 0.2s",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,158,11,0.2)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(245,158,11,0.06)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(245,158,11,0.03)"; }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: `rgba(245,158,11,0.15)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 900, color: WHITE, border: "1px solid rgba(245,158,11,0.2)", fontFamily: "Oswald, sans-serif" }}>{pd.player.initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e0e0e0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pd.player.name}</div>
                      <div style={{ fontSize: "0.6rem", color: "#444", fontWeight: 500 }}>{pd.player.team}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: pd.player.priceChange.startsWith("+") ? GOLD : "#6b7280" }}>{pd.player.priceChange}</div>
                      <span className={statusBadgeClass(pd.player.status)} style={{ fontSize: "0.48rem", padding: "1px 5px" }}>
                        {statusLabel(pd.player.status).replace(" 🔥", "")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Stats */}
            <div className="arena-card" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Eye size={13} color={GOLD} />
                <span className="arena-subhead" style={{ fontSize: "0.72rem", color: "#777" }}>MARKET PULSE</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "ON FIRE", count: allPlayers.filter(pp => pp.player.status === "fire").length, color: GOLD_BRIGHT },
                  { label: "HEATING", count: allPlayers.filter(pp => pp.player.status === "heating").length, color: GOLD },
                  { label: "COOLING", count: allPlayers.filter(pp => pp.player.status === "cooling").length, color: "#6b7280" },
                  { label: "NEUTRAL", count: allPlayers.filter(pp => pp.player.status === "neutral").length, color: "#374151" },
                ].map(stat => (
                  <div key={stat.label} style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.08)", borderRadius: 9, padding: "9px 10px", textAlign: "center" }}>
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
          <div className="arena-divider" style={{ maxWidth: 200, margin: "0 auto 12px" }} />
          <p className="arena-subhead" style={{ color: "#333", fontSize: "0.62rem" }}>CARDPULSE ANALYTICS · DEMO V2.0</p>
        </div>
      </div>
    </div>
  );
}
