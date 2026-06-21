import { type PredictionLevel, type Chapter } from "$lib/types";
import { getEmbedding } from "$lib/ai/embedding";
import { cosineSimilarity } from "./similarity";

export interface Challenge {
  visibleText: string;
  chapterId: string;
  paragraphIndex: number;
  continuationStart: number;
  level: PredictionLevel;
}

export interface ChallengeResult {
  prediction: string;
  actual: string;
  similarity: number;
}

function getWords(text: string, start: number, count: number): string {
  const words = text.split(/\s+/);
  return words.slice(start, start + count).join(" ");
}

const CONTEXT_WORDS = 30;

export function generateChallenge(
  chapter: Chapter,
  paragraphIndex: number,
  wordOffset: number,
  level: PredictionLevel,
): Challenge | null {
  if (paragraphIndex >= chapter.paragraphs.length) return null;

  const currentPara = chapter.paragraphs[paragraphIndex];
  const words = currentPara.split(/\s+/);

  if (words.length <= 1) {
    return generateChallenge(chapter, paragraphIndex + 1, 0, level);
  }

  if (wordOffset >= words.length) {
    return generateChallenge(chapter, paragraphIndex + 1, 0, level);
  }

  const maxContextStart = words.length - 2;
  const wantedOffset = wordOffset < CONTEXT_WORDS
    ? Math.min(CONTEXT_WORDS, words.length - 1)
    : wordOffset;
  const effectiveOffset = Math.min(wantedOffset, maxContextStart);

  const visibleText = words.slice(0, effectiveOffset + 1).join(" ");

  return {
    visibleText,
    chapterId: chapter.id,
    paragraphIndex,
    continuationStart: effectiveOffset + 1,
    level,
  };
}

export function getContinuation(
  chapter: Chapter,
  paragraphIndex: number,
  wordOffset: number,
  level: PredictionLevel,
): string {
  if (paragraphIndex >= chapter.paragraphs.length) return "";

  const currentPara = chapter.paragraphs[paragraphIndex];

  if (level === "sentence") {
    const rest = currentPara.slice(wordOffset);
    const match = rest.match(/^.*?[.!?](?:\s|$)/);
    return match ? match[0].trim() : rest.trim();
  }

  const count = level as number;
  return getWords(currentPara, wordOffset, count);
}

export async function scorePrediction(
  prediction: string,
  actual: string,
): Promise<number> {
  const [predEmb, actualEmb] = await Promise.all([
    getEmbedding(prediction),
    getEmbedding(actual),
  ]);
  return cosineSimilarity(predEmb, actualEmb);
}
