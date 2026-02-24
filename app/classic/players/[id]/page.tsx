"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import {
  Trophy, Zap, Target, TrendingUp, Shield, Star,
  Activity, Sparkles, ChevronRight, Flame, ArrowLeft, Signal,
} from "lucide-react";
import { getPlayer } from "@/lib/players";
import {
  statusLabel, statusBadgeClass, glowColor,
  timeAgo, newsTypeColor, newsTypeLabel,
  type SlabStatus,
} from "@/lib/playerUtils";

// ── ARENA COLOURS ───────────────────────────────────────────────
const GOLD = "#f59e0b";
const GOLD_B = "GOLD_B";
const WHITE = "#f0f0f0";
const GREY = "#6b7280";
const DARK = "#0c0c0c";

type MetricKey = "yards" | "td" | "rating" | "rushYards";
const chartColors: Record<MetricKey, string> = { yards: GOLD, td: GOLD_B, rating: WHITE, rushYards: GREY };
const metricLabels: Record<MetricKey, string> = { yards: "Passing Yards", td: "Touchdowns", rating: "Passer Rating", rushYards: "Rushing Yards" };

// ── Tooltips ────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: DARK, border: `1px solid rgba(245,158,11,0.3)`, borderRadius: 12, padding: "10px 16px", color: WHITE, fontSize: "0.82rem", boxShadow: "0 8px 40px rgba(0,0,0,0.8)" }}>
      <p style={{ color: "#555", marginBottom: 6, fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "Oswald, sans-serif" }}>SEASON {label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, marginBottom: 2, fontWeight: 600 }}>
          {p.name}: <span style={{ color: WHITE, fontWeight: 700 }}>{p.value > 500 ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (!active || !payload?.length) return null;
  return (<div style={{ background: DARK, border: `1px solid rgba(245,158,11,0.3)`, borderRadius: 12, padding: "8px 14px", color: WHITE, fontSize: "0.82rem" }}><p style={{ fontWeight: 700 }}>{payload[0].name}: {payload[0].value}</p></div>);
};

// ── Score ring ──────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 54, c = 2 * Math.PI * r, off = c - (score / 100) * c;
  return (
    <div style={{ position: "relative", width: 136, height: 136 }}>
      <svg width="136" height="136" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="68" cy="68" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="9" />
        <circle cx="68" cy="68" r={r} fill="none" stroke="url(#rGrad)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.65,0,0.35,1) 0.5s", filter: "drop-shadow(0 0 10px rgba(245,158,11,0.7))" }} />
        <defs><linearGradient id="rGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={GOLD} /><stop offset="100%" stopColor={GOLD_B} /></linearGradient></defs>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "2rem", fontWeight: 900, color: GOLD, lineHeight: 1, fontFamily: "Oswald, sans-serif" }}>{score}</span>
        <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em", color: "#555", textTransform: "uppercase", fontFamily: "Oswald, sans-serif" }}>OVERALL</span>
      </div>
    </div>
  );
}

// ── Metric bar ──────────────────────────────────────────────────
function MetricBar({ label, value, max, color, delay }: { label: string; value: number; max: number; color: string; delay: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: "0.78rem", color: "#666", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: "0.78rem", color, fontWeight: 700 }}>{value}{max === 100 ? "%" : ""}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.03)", borderRadius: 9999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 9999, boxShadow: `0 0 10px ${color}44`, animation: `progressFill 1.4s cubic-bezier(0.65,0,0.35,1) ${delay}s both` }} />
      </div>
    </div>
  );
}

// ── Hero slab — real image for Mahomes, SVG fallback for others ──
const CARD_IMAGES: Record<string, string> = { mahomes: "/mahomes.png" };

function HeroSlabMockup({ initials, jerseyColor, status, slug }: { initials: string; jerseyColor: string; status: SlabStatus; slug?: string }) {
  const gc = glowColor(status);
  const realImage = slug ? CARD_IMAGES[slug] : undefined;

  if (realImage) {
    return (
      <img src={realImage} alt={`${initials} card slab`} width={180} height={260}
        style={{ borderRadius: 10, filter: `drop-shadow(0 0 28px rgba(245,158,11,0.6))`, objectFit: "cover" }} />
    );
  }

  return (
    <svg width="180" height="252" viewBox="0 0 180 252" style={{ filter: `drop-shadow(0 0 28px ${gc})`, borderRadius: 12 }}>
      <rect x="3" y="3" width="174" height="246" rx="10" fill="#0a0a0a" stroke="rgba(245,158,11,0.2)" strokeWidth="2" />
      <rect x="3" y="3" width="174" height="26" rx="10" fill="#0c0c0c" /><rect x="3" y="20" width="174" height="9" fill="#0c0c0c" />
      <text x="90" y="20" textAnchor="middle" fill={GOLD} fontSize="9" fontWeight="800" fontFamily="Oswald, sans-serif" letterSpacing="0.12em">PANINI PRIZM</text>
      <rect x="12" y="33" width="156" height="155" rx="6" fill={jerseyColor} opacity="0.9" />
      <rect x="12" y="33" width="156" height="60" rx="6" fill="url(#shG)" opacity="0.25" />
      <text x="90" y="128" textAnchor="middle" fill="white" fontSize="52" fontWeight="900" fontFamily="Oswald, sans-serif" opacity="0.85">{initials}</text>
      <rect x="12" y="192" width="156" height="34" rx="5" fill="#0a0a0a" />
      <text x="90" y="206" textAnchor="middle" fill="#666" fontSize="8" fontWeight="600" fontFamily="Oswald, sans-serif" letterSpacing="0.08em">NEAR MINT-MINT</text>
      <text x="90" y="220" textAnchor="middle" fill={GOLD} fontSize="16" fontWeight="900" fontFamily="Oswald, sans-serif">PSA 9</text>
      <rect x="3" y="225" width="174" height="24" rx="10" fill="#0c0c0c" /><rect x="3" y="225" width="174" height="9" fill="#0c0c0c" />
      <text x="90" y="241" textAnchor="middle" fill="#e0e0e0" fontSize="9" fontWeight="800" fontFamily="Oswald, sans-serif" letterSpacing="0.06em">{initials}</text>
      <defs><linearGradient id="shG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="white" stopOpacity="0" /><stop offset="50%" stopColor="white" stopOpacity="0.5" /><stop offset="100%" stopColor="white" stopOpacity="0" /></linearGradient></defs>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
export default function PlayerPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.id as string;
  const data = getPlayer(slug);
  const [activeMetric, setActiveMetric] = useState<MetricKey>("yards");

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <span style={{ fontSize: "3rem" }}>🏈</span>
        <p className="arena-headline" style={{ color: "#555", fontSize: "1rem" }}>PLAYER NOT FOUND</p>
        <button onClick={() => router.push("/classic")} style={{ background: "rgba(245,158,11,0.12)", border: `1px solid rgba(245,158,11,0.3)`, color: GOLD, padding: "8px 18px", borderRadius: 8, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", fontFamily: "Oswald, sans-serif", textTransform: "uppercase" }}>← BACK HOME</button>
      </div>
    );
  }

  const p = data.player;
  const cs = data.career_summary;
  const am = data.advanced_metrics;
  const metricButtons: MetricKey[] = ["yards", "td", "rating", "rushYards"];
  const seasonChart = data.season_stats.map(s => ({ year: String(s.year), yards: s.passing_yards, td: s.td, rating: s.rating, rushYards: s.rush_yards }));
  const winLoss = [{ name: "Wins", value: cs.wins }, { name: "Losses", value: cs.losses }];

  const kpis = [
    { label: "CAREER YARDS",  value: cs.passing_yards.toLocaleString(), icon: TrendingUp, color: GOLD },
    { label: "TOUCHDOWNS",    value: String(cs.passing_touchdowns),     icon: Zap,         color: GOLD_B },
    { label: "CAREER WINS",   value: String(cs.wins),                   icon: Shield,      color: WHITE },
    { label: "SUPER BOWLS",   value: String(cs.super_bowls_won),        icon: Trophy,      color: GOLD },
    { label: "PASSER RATING", value: String(cs.passer_rating),          icon: Target,      color: GREY },
    { label: "CLUTCH SCORE",  value: `${am.clutch_rating}/100`,         icon: Flame,       color: GOLD_B },
  ];

  const metricBars = [
    { label: "Clutch Rating",    value: am.clutch_rating,                      max: 100, color: GOLD },
    { label: "Completion %",     value: Math.round(cs.completion_percentage),   max: 100, color: GOLD_B },
    { label: "Passer Rating",    value: Math.round(cs.passer_rating),          max: 158, color: WHITE },
    { label: "TD/INT Ratio",     value: Math.round(am.td_int_ratio * 20),      max: 100, color: GOLD },
    { label: "Yards / Attempt",  value: Math.round(am.yards_per_attempt * 10), max: 100, color: GREY },
    { label: "Playoff Win Rate", value: Math.round(am.playoff_win_rate * 100), max: 100, color: GOLD_B },
  ];

  const C: React.CSSProperties = {
    background: "linear-gradient(145deg, rgba(14,14,14,0.95), rgba(8,8,8,0.98))",
    border: "1px solid rgba(245,158,11,0.1)", borderRadius: 16, padding: 24,
    boxShadow: "0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", paddingBottom: 60 }}>
      {/* ── Navbar ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", background: "rgba(5,5,5,0.92)", borderBottom: "1px solid rgba(245,158,11,0.1)", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => router.push("/classic")} style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ArrowLeft size={16} color={GOLD} />
          </button>
          <img src="/logo.png" alt="CardPulse" style={{ height: 44, width: "auto", objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(245,158,11,0.4))" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div className="live-dot" />
          <span style={{ fontSize: "0.65rem", color: GOLD, fontWeight: 700, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em" }}>LIVE</span>
        </div>
      </nav>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "28px 20px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ═══ HERO ═══ */}
        <div className="animate-fade-up arena-card arena-card-glow" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, padding: 28, position: "relative", overflow: "hidden" }}>
          <div className="arena-spotlight" />
          <div style={{ position: "absolute", right: -80, top: -80, width: 350, height: 350, background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, zIndex: 1 }}>
            <div className="card-slab-wrap" style={{ padding: "16px 0" }}>
              <div className="card-slab-glow glow-red" style={{ inset: "-22%" }} />
              <div className="card-slab-frame glow-anim-red">
                <HeroSlabMockup initials={p.initials} jerseyColor={p.teamColor} status={p.status} slug={p.slug} />
              </div>
            </div>
            <span style={{ fontSize: "0.68rem", color: "#444", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "Oswald, sans-serif" }}>{p.lastGame}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div className="arena-headline" style={{ fontSize: "2.4rem", color: p.priceChange.startsWith("+") ? GOLD : GREY, lineHeight: 1 }}>{p.priceChange}</div>
                <div style={{ fontSize: "0.62rem", color: "#444", fontWeight: 600, marginTop: 3, fontFamily: "Oswald, sans-serif", letterSpacing: "0.08em" }}>{p.priceLabel}</div>
              </div>
              <span className={statusBadgeClass(p.status)} style={{ fontSize: "0.7rem" }}>{statusLabel(p.status)}</span>
            </div>

            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              <span style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 5, padding: "3px 11px", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, fontFamily: "Oswald, sans-serif" }}>{p.position}</span>
              <span style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 5, padding: "3px 11px", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", fontFamily: "Oswald, sans-serif" }}>{p.team}</span>
              {cs.super_bowls_won > 0 && <span style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 5, padding: "3px 11px", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD_B, fontFamily: "Oswald, sans-serif" }}>{cs.super_bowls_won}× SB CHAMPION</span>}
            </div>

            <div>
              <h1 className="arena-headline" style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", color: WHITE, margin: 0 }}>
                {p.name.split(" ")[0]} <span className="red-text">{p.name.split(" ").slice(1).join(" ")}</span>
              </h1>
              <p style={{ color: "#444", fontSize: "0.78rem", marginTop: 6, fontWeight: 500 }}>#{p.number} · DOB {p.dob} · {p.height} · {p.weight} · {p.experience_years} seasons</p>
            </div>

            <div className="arena-divider" />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "WIN RATE", value: `${Math.round((cs.wins / cs.games_played) * 100)}%` },
                { label: "CAREER TDs", value: String(cs.passing_touchdowns) },
                { label: "PLAYOFF W-RATE", value: `${Math.round(am.playoff_win_rate * 100)}%` },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 10, padding: "7px 13px" }}>
                  <div style={{ fontSize: "0.52rem", color: GOLD, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, fontFamily: "Oswald, sans-serif" }}>{s.label}</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: WHITE, marginTop: 2 }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 9, padding: "9px 13px" }}>
              <Zap size={13} color={GOLD} />
              <span style={{ fontSize: "0.74rem", color: "#666" }}>
                <strong style={{ color: GOLD }}>AI SIGNAL:</strong>{" "}
                {data.analytics_flags.is_elite_qb ? "Elite tier — " : "Rising — "}
                Consistency: {data.analytics_flags.consistency_score}/100. Grade: {p.cardGrade}.
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <ScoreRing score={p.overallScore} />
              <div>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < Math.round(p.overallScore / 20) ? GOLD : "#1a1a1a"} color={i < Math.round(p.overallScore / 20) ? GOLD : "#1a1a1a"} />)}
                </div>
                <span style={{ fontSize: "0.58rem", color: "#444", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "Oswald, sans-serif" }}>CARD GRADE: {p.cardGrade}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ KPI STRIP ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 14 }}>
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className={`animate-fade-up-delay-${i + 1} arena-card arena-card-neon-edge`} style={{ padding: 18, cursor: "default" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `${kpi.color}14`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${kpi.color}25` }}>
                    <Icon size={16} color={kpi.color} strokeWidth={2} />
                  </div>
                  <TrendingUp size={11} color={GOLD} />
                </div>
                <div style={{ fontSize: "1.45rem", fontWeight: 900, color: WHITE, lineHeight: 1, fontFamily: "Oswald, sans-serif" }}>{kpi.value}</div>
                <div className="arena-subhead" style={{ fontSize: "0.62rem", color: GOLD, marginTop: 5 }}>{kpi.label}</div>
              </div>
            );
          })}
        </div>

        {/* ═══ NEWS FEED ═══ */}
        <div className="animate-fade-up-delay-2 arena-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Signal size={15} color={GOLD} />
            <h2 className="arena-headline" style={{ fontSize: "0.95rem", color: WHITE, margin: 0 }}>LATEST ACTIVITY</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.news_feed.map(item => (
              <div key={item.id} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 16px", background: "rgba(245,158,11,0.03)", border: "1px solid rgba(245,158,11,0.06)", borderRadius: 12, transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,158,11,0.2)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(245,158,11,0.06)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,158,11,0.06)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(245,158,11,0.03)"; }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(245,158,11,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 99, background: GOLD, boxShadow: `0 0 8px ${GOLD}88` }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GOLD, fontFamily: "Oswald, sans-serif" }}>{newsTypeLabel(item.type)}</span>
                    <span style={{ fontSize: "0.5rem", color: "#333" }}>·</span>
                    <span style={{ fontSize: "0.6rem", color: "#444", fontWeight: 600 }}>{timeAgo(item.ts)}</span>
                    {item.tag && <span style={{ fontSize: "0.5rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", padding: "1px 7px", borderRadius: 4, background: "rgba(245,158,11,0.12)", color: GOLD, border: "1px solid rgba(245,158,11,0.3)", fontFamily: "Oswald, sans-serif" }}>{item.tag}</span>}
                  </div>
                  <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#e0e0e0", margin: 0, marginBottom: 3 }}>{item.title}</p>
                  <p style={{ fontSize: "0.76rem", color: "#555", lineHeight: 1.55, margin: 0 }}>{item.body}</p>
                </div>
                <ChevronRight size={14} color="#333" style={{ flexShrink: 0, marginTop: 6 }} />
              </div>
            ))}
          </div>
        </div>

        {/* ═══ SEASON CHART ═══ */}
        <div className="animate-fade-up-delay-3 arena-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
            <div>
              <p className="section-label">SEASON PERFORMANCE</p>
              <h2 className="arena-headline" style={{ fontSize: "1.1rem", color: WHITE, margin: 0 }}>YEAR-BY-YEAR BREAKDOWN</h2>
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {metricButtons.map(m => (
                <button key={m} onClick={() => setActiveMetric(m)} style={{ padding: "5px 13px", borderRadius: 6, fontSize: "0.68rem", fontWeight: 700, border: activeMetric === m ? `1px solid ${chartColors[m]}` : "1px solid rgba(255,255,255,0.06)", background: activeMetric === m ? `${chartColors[m]}18` : "transparent", color: activeMetric === m ? chartColors[m] : "#555", cursor: "pointer", transition: "all 0.18s", textTransform: "uppercase", fontFamily: "Oswald, sans-serif", letterSpacing: "0.06em" }}>
                  {metricLabels[m]}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={seasonChart} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <defs><linearGradient id="bGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chartColors[activeMetric]} stopOpacity={0.9} /><stop offset="100%" stopColor={chartColors[activeMetric]} stopOpacity={0.2} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="year" tick={{ fill: "#444", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey={activeMetric} fill="url(#bGrad)" radius={[5, 5, 0, 0]} name={metricLabels[activeMetric]} style={{ filter: `drop-shadow(0 0 6px ${chartColors[activeMetric]}44)` }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* ═══ RADAR + WIN-LOSS ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
          <div className="animate-fade-up-delay-4 arena-card" style={{ padding: 24 }}>
            <p className="section-label">SKILL ANALYSIS</p>
            <h2 className="arena-headline" style={{ fontSize: "1.05rem", color: WHITE, marginBottom: 18 }}>ATTRIBUTE RADAR</h2>
            <ResponsiveContainer width="100%" height={270}>
              <RadarChart data={data.radar} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="rgba(245,158,11,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#666", fontSize: 11, fontWeight: 600 }} />
                <Radar dataKey="A" stroke={GOLD} strokeWidth={2} fill={GOLD} fillOpacity={0.12} style={{ filter: "drop-shadow(0 0 10px rgba(245,158,11,0.5))" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="animate-fade-up-delay-5 arena-card" style={{ padding: 24 }}>
            <p className="section-label">WIN/LOSS RECORD</p>
            <h2 className="arena-headline" style={{ fontSize: "1.05rem", color: WHITE, marginBottom: 18 }}>{cs.games_played} CAREER GAMES</h2>
            <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie data={winLoss} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  <Cell fill={GOLD} style={{ filter: "drop-shadow(0 0 12px rgba(245,158,11,0.5))" }} /><Cell fill="rgba(255,255,255,0.05)" />
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend formatter={(v) => <span style={{ color: "#666", fontSize: "0.78rem", fontWeight: 600, fontFamily: "Oswald, sans-serif" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ═══ ADVANCED METRICS ═══ */}
        <div className="animate-fade-up-delay-5 arena-card" style={{ padding: 24 }}>
          <p className="section-label">ADVANCED METRICS</p>
          <h2 className="arena-headline" style={{ fontSize: "1.05rem", color: WHITE, marginBottom: 26 }}>PERFORMANCE INDEX</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0 40px" }}>
            {metricBars.map((m, i) => <MetricBar key={m.label} {...m} delay={0.4 + i * 0.1} />)}
          </div>
        </div>

        {/* ═══ AREA CHART ═══ */}
        <div className="animate-fade-up-delay-6 arena-card" style={{ padding: 24 }}>
          <p className="section-label">DUAL METRIC TREND</p>
          <h2 className="arena-headline" style={{ fontSize: "1.05rem", color: WHITE, marginBottom: 22 }}>PASSER RATING VS RUSHING YARDS</h2>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={seasonChart} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="rG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={GOLD} stopOpacity={0.3} /><stop offset="100%" stopColor={GOLD} stopOpacity={0} /></linearGradient>
                <linearGradient id="uG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={GREY} stopOpacity={0.3} /><stop offset="100%" stopColor={GREY} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="year" tick={{ fill: "#444", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="rating" stroke={GOLD} strokeWidth={2.5} fill="url(#rG)" name="Passer Rating" dot={{ fill: GOLD, strokeWidth: 0, r: 3.5 }} />
              <Area type="monotone" dataKey="rushYards" stroke={GREY} strokeWidth={2.5} fill="url(#uG)" name="Rush Yards" dot={{ fill: GREY, strokeWidth: 0, r: 3.5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ═══ AWARDS ═══ */}
        <div className="animate-fade-up-delay-7 arena-card" style={{ padding: 24 }}>
          <p className="section-label">CAREER ACHIEVEMENTS</p>
          <h2 className="arena-headline" style={{ fontSize: "1.05rem", color: WHITE, marginBottom: 24 }}>AWARDS TIMELINE</h2>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
            {data.awards.map((a, i) => (
              <div key={i} className="arena-card-neon-edge" style={{ minWidth: 160, background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(12,12,12,0.9))", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 14, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 7, flexShrink: 0, transition: "transform 0.2s, box-shadow 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 14px 40px rgba(245,158,11,0.12)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
              >
                <span style={{ fontSize: "1.9rem" }}>{a.icon}</span>
                <span style={{ fontSize: "0.6rem", color: GOLD, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "Oswald, sans-serif" }}>SEASON {a.year}</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: WHITE, lineHeight: 1.3 }}>{a.award}</span>
                <div style={{ height: 2.5, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_B})`, borderRadius: 99, marginTop: 4, boxShadow: `0 0 8px ${GOLD}44` }} />
              </div>
            ))}
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
