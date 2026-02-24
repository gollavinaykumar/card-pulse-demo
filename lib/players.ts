// ── Data loader for player JSON files ─────────────────────────
import type { PlayerData } from "./playerUtils";

import mahomesData from "@/app/data/mahomes.json";
import allenData from "@/app/data/allen.json";
import burrowData from "@/app/data/burrow.json";
import jacksonData from "@/app/data/jackson.json";
import herbertData from "@/app/data/herbert.json";
import stroudData from "@/app/data/stroud.json";

const playersMap: Record<string, PlayerData> = {
  mahomes:  mahomesData  as unknown as PlayerData,
  allen:    allenData    as unknown as PlayerData,
  burrow:   burrowData   as unknown as PlayerData,
  jackson:  jacksonData  as unknown as PlayerData,
  herbert:  herbertData  as unknown as PlayerData,
  stroud:   stroudData   as unknown as PlayerData,
};

export function getPlayer(slug: string): PlayerData | null {
  return playersMap[slug] ?? null;
}

export function getAllPlayers(): PlayerData[] {
  return Object.values(playersMap);
}

export function getAllSlugs(): string[] {
  return Object.keys(playersMap);
}
