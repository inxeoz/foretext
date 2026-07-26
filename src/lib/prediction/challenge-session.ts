import type { Chapter, PredictionLevel, WordData } from '$lib/types';
import {
  generateChallenge,
  getContinuation,
  scorePrediction,
  type Challenge,
} from './engine';

export interface CompletedParagraph {
  text: string;
  paraIdx: number;
}

type WordDataMap = Map<number, Map<number, WordData>>;

export class ChallengeSession {
  private _chapter: Chapter;
  private _level: PredictionLevel;
  private _challenge: Challenge | null;
  private _revealed: string | null = null;
  private _lastScore: number | null = null;
  private _completed: CompletedParagraph[] = [];
  private _wordData: WordDataMap = new Map();
  private _tick = 0;

  constructor(chapter: Chapter, level: PredictionLevel) {
    this._chapter = chapter;
    this._level = level;
    this._challenge = generateChallenge(chapter, 0, 0, level);
  }

  get challenge(): Challenge | null { return this._challenge; }
  get revealed(): string | null { return this._revealed; }
  get lastScore(): number | null { return this._lastScore; }
  get completedParagraphs(): CompletedParagraph[] { return this._completed; }
  get wordData(): WordDataMap { return this._wordData; }
  get currentParaIdx(): number { return this._challenge?.paragraphIndex ?? 0; }
  get tick(): number { return this._tick; }
  get isComplete(): boolean { return this._challenge === null; }

  async submitPrediction(text: string): Promise<{ score: number; prediction: string; actual: string }> {
    if (!this._challenge) throw new Error('No active challenge');

    const actual = getContinuation(
      this._chapter,
      this._challenge.paragraphIndex,
      this._challenge.continuationStart,
      this._level,
    );
    const score = await scorePrediction(text, actual);

    const pct = Math.round(score * 100);
    const actualPreview = actual.length > 60 ? actual.slice(0, 60) + '…' : actual;
    const predPreview = text.length > 60 ? text.slice(0, 60) + '…' : text;
    console.log(
      `%c📝 PREDICTION  %c"${predPreview}"  →  "${actualPreview}"  %c${pct}% `,
      'color:#a855f7;font-weight:bold',
      'color:#e2e8f0',
      'color:#e2e8f0',
      pct >= 80 ? 'color:#22c55e;font-weight:bold' :
      pct >= 60 ? 'color:#eab308;font-weight:bold' :
      'color:#ef4444;font-weight:bold',
      pct >= 80 ? '✓' : pct >= 60 ? '∼' : '✗',
    );

    const wordCount = actual.split(/\s+/).length;
    if (wordCount > 0) {
      if (!this._wordData.has(this._challenge.paragraphIndex)) {
        this._wordData.set(this._challenge.paragraphIndex, new Map());
      }
      const map = this._wordData.get(this._challenge.paragraphIndex)!;
      for (let i = 0; i < wordCount; i++) {
        map.set(this._challenge.continuationStart + i, { score, prediction: text });
      }
      this._tick++;
    }

    this._revealed = actual;
    this._lastScore = score;

    return { score, prediction: text, actual };
  }

  advance(level?: PredictionLevel): boolean {
    if (!this._challenge) return true;

    const effectiveLevel = level ?? this._level;
    const step = typeof effectiveLevel === 'number' ? effectiveLevel : 15;
    const nextWordOff = this._challenge.continuationStart + step;
    const next = generateChallenge(this._chapter, this._challenge.paragraphIndex, nextWordOff, effectiveLevel);

    if (next) {
      if (next.paragraphIndex > this._challenge.paragraphIndex) {
        this._completed = [...this._completed, { text: this._chapter.paragraphs[this._challenge.paragraphIndex], paraIdx: this._challenge.paragraphIndex }];
      }
      this._challenge = next;
      this._revealed = null;
      this._lastScore = null;
    } else if (this._challenge.paragraphIndex + 1 < this._chapter.paragraphs.length) {
      this._completed = [...this._completed, { text: this._chapter.paragraphs[this._challenge.paragraphIndex], paraIdx: this._challenge.paragraphIndex }];
      const nxt = generateChallenge(this._chapter, this._challenge.paragraphIndex + 1, 0, effectiveLevel);
      if (nxt) {
        this._challenge = nxt;
        this._revealed = null;
        this._lastScore = null;
      } else {
        this._challenge = null;
        return true;
      }
    } else {
      this._completed = [...this._completed, { text: this._chapter.paragraphs[this._challenge.paragraphIndex], paraIdx: this._challenge.paragraphIndex }];
      this._challenge = null;
      return true;
    }

    return false;
  }
}
