// ── Player types shared across the app ─────────────────────────

export type SlabStatus = "fire" | "heating" | "cooling" | "neutral";
export type SignalStrength = "HIGH" | "MEDIUM" | "LOW";
export type NewsType = "signal" | "price" | "game" | "insight";

export interface SeasonStat {
  year: number;
  games: number;
  passing_yards: number;
  td: number;
  int: number;
  completion_pct: number;
  rating: number;
  rush_yards: number;
  rush_td: number;
  mvp?: boolean;
  super_bowl_win?: boolean;
  super_bowl_appearance?: boolean;
  injury?: boolean;
  rookie_oty?: boolean;
}

export interface RadarPoint {
  subject: string;
  A: number;
}

export interface Award {
  year: number;
  award: string;
  icon: string;
}

export interface NewsItem {
  id: string;
  ts: string; // ISO string
  type: NewsType;
  title: string;
  body: string;
  tag: string | null;
}

export interface PlayerData {
  player: {
    id: string;
    slug: string;
    name: string;
    team: string;
    teamColor: string;
    teamColorAlt: string;
    position: string;
    number: number;
    height: string;
    weight: string;
    dob: string;
    experience_years: number;
    initials: string;
    status: SlabStatus;
    priceChange: string;
    priceLabel: string;
    cardGrade: string;
    overallScore: number;
    featuredCard: string;
    lastGame: string;
  };
  career_summary: {
    games_played: number;
    wins: number;
    losses: number;
    passing_yards: number;
    passing_touchdowns: number;
    interceptions: number;
    completion_percentage: number;
    passer_rating: number;
    rushing_yards: number;
    rushing_touchdowns: number;
    super_bowls_won: number;
    mvps: number;
    super_bowl_mvps: number;
  };
  season_stats: SeasonStat[];
  advanced_metrics: {
    avg_yards_per_game: number;
    td_int_ratio: number;
    yards_per_attempt: number;
    qbr_estimate: number;
    clutch_rating: number;
    playoff_win_rate: number;
  };
  radar: RadarPoint[];
  awards: Award[];
  analytics_flags: {
    is_elite_qb: boolean;
    is_clutch_player: boolean;
    is_dynasty_player: boolean;
    injury_risk: string;
    consistency_score: number;
  };
  news_feed: NewsItem[];
}

// ── Status helpers ───────────────────────────────────────────────

export function statusLabel(s: SlabStatus): string {
  return { fire: "ON FIRE 🔥", heating: "HEATING UP", cooling: "COOLING", neutral: "NEUTRAL" }[s];
}

export function statusBadgeClass(s: SlabStatus): string {
  return { fire: "badge badge-fire", heating: "badge badge-heating", cooling: "badge badge-cooling", neutral: "badge badge-neutral" }[s];
}

export function glowColorClass(s: SlabStatus): string {
  return { fire: "glow-red glow-anim-red", heating: "glow-amber glow-anim-amber", cooling: "glow-blue glow-anim-blue", neutral: "glow-grey" }[s];
}

export function deltaColor(s: SlabStatus): string {
  if (s === "cooling") return "#3b82f6";
  if (s === "neutral") return "#9ca3af";
  return "#f59e0b";
}

export function glowColor(s: SlabStatus): string {
  return { fire: "rgba(239,68,68,0.55)", heating: "rgba(245,158,11,0.55)", cooling: "rgba(59,130,246,0.45)", neutral: "rgba(120,120,120,0.3)" }[s];
}

// ── Time formatting ──────────────────────────────────────────────

export function timeAgo(isoTs: string): string {
  const now = new Date();
  const then = new Date(isoTs);
  const diffMs = now.getTime() - then.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffM / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffM < 1)  return "just now";
  if (diffM < 60) return `${diffM}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD < 7)  return `${diffD}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatTimestamp(isoTs: string): string {
  const d = new Date(isoTs);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

// ── News type styling ────────────────────────────────────────────

export function newsTypeColor(t: NewsType): string {
  return { signal: "#f59e0b", price: "#10b981", game: "#06b6d4", insight: "#8b5cf6" }[t];
}

export function newsTypeLabel(t: NewsType): string {
  return { signal: "Signal", price: "Price", game: "Game", insight: "Insight" }[t];
}

// ── All players registry ─────────────────────────────────────────

export const ALL_PLAYER_SLUGS = ["mahomes", "allen", "burrow", "jackson", "herbert", "stroud"] as const;
export type PlayerSlug = typeof ALL_PLAYER_SLUGS[number];
