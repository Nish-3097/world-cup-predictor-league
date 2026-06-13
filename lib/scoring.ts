import type { ResultPick } from "./supabaseClient";

export const RESULT_LABELS: Record<ResultPick, string> = {
  HOME: "Home win",
  DRAW: "Draw",
  AWAY: "Away win"
};

export function isGroupStage(stage: string) {
  return stage.trim().toLowerCase().includes("group");
}

export function calculatePoints(stage: string, prediction: ResultPick, actualResult: ResultPick | null) {
  if (!actualResult) return 0;
  if (!isGroupStage(stage)) return 0;
  return prediction === actualResult ? 3 : 0;
}

export function getPredictionStatus(
  kickoffAt: string,
  prediction: ResultPick,
  actualResult: ResultPick | null
) {
  if (actualResult) return prediction === actualResult ? "correct" : "wrong";
  return new Date(kickoffAt).getTime() <= Date.now() ? "locked" : "awaiting result";
}
