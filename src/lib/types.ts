export type PredictionLevel = 1 | 2 | 3 | 5 | 8 | 13 | 21 | "sentence";

export interface Book {
  id: string;
  title: string;
  author: string;
  cover?: string;
  chapters: ChapterMeta[];
  importedAt: number;
}

export interface ChapterMeta {
  id: string;
  title: string;
  paragraphCount: number;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  paragraphs: string[];
}

export interface Prediction {
  id: number;
  bookId: string;
  chapterId: string;
  level: PredictionLevel;
  prediction: string;
  actual: string;
  similarity: number;
  timestamp: number;
}

export interface AppStats {
  predictionsMade: number;
  averageScore: number;
  currentLevel: PredictionLevel;
  bestLevel: PredictionLevel;
  booksCompleted: number;
}

export const PREDICTION_LEVELS: PredictionLevel[] = [
  1, 2, 3, 5, 8, 13, 21, "sentence",
];

export const LEVEL_THRESHOLD_UP = 0.85;
export const LEVEL_THRESHOLD_DOWN = 0.6;
export const LEVEL_WINDOW = 20;
