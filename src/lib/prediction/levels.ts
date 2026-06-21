import {
  type PredictionLevel,
  PREDICTION_LEVELS,
  LEVEL_THRESHOLD_UP,
  LEVEL_THRESHOLD_DOWN,
} from "$lib/types";

export function calculateNewLevel(
  currentLevel: PredictionLevel,
  recentScores: number[],
): PredictionLevel {
  if (recentScores.length === 0) return currentLevel;

  const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const currentIdx = PREDICTION_LEVELS.indexOf(currentLevel);

  if (avg > LEVEL_THRESHOLD_UP && currentIdx < PREDICTION_LEVELS.length - 1) {
    return PREDICTION_LEVELS[currentIdx + 1];
  }

  if (avg < LEVEL_THRESHOLD_DOWN && currentIdx > 0) {
    return PREDICTION_LEVELS[currentIdx - 1];
  }

  return currentLevel;
}

export function getLevelLabel(level: PredictionLevel): string {
  if (level === "sentence") return "Sentence";
  return `${level} word${level === 1 ? "" : "s"}`;
}
