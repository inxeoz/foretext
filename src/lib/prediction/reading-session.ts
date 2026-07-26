import type { Book, Chapter, ChapterMeta, PredictionLevel } from '$lib/types';
import { PREDICTION_LEVELS, LEVEL_WINDOW } from '$lib/types';
import { initDB, getBook, addPrediction, getPredictions, loadChapters } from '$lib/db/operations';
import { calculateNewLevel } from '$lib/prediction/levels';
import { ChallengeSession } from '$lib/prediction/challenge-session';

export class ReadingSession {
  private _bookId: string;
  private _selectedIds: string[];
  private _selectedChapters: ChapterMeta[] = [];
  private _chapterIdx = 0;
  private _level: PredictionLevel = 1;
  private _bestLevel: PredictionLevel = 1;
  private _book: Book | null = null;
  private _currentChapter: Chapter | null = null;
  private _challengeSession: ChallengeSession | null = null;
  private _loading = true;
  private _error: string | null = null;

  constructor(bookId: string, selectedIds: string[]) {
    this._bookId = bookId;
    this._selectedIds = selectedIds;
  }

  get book(): Book | null { return this._book; }
  get currentChapter(): Chapter | null { return this._currentChapter; }
  get level(): PredictionLevel { return this._level; }
  get bestLevel(): PredictionLevel { return this._bestLevel; }
  get chapterIdx(): number { return this._chapterIdx; }
  get loading(): boolean { return this._loading; }
  get error(): string | null { return this._error; }
  get challengeSession(): ChallengeSession | null { return this._challengeSession; }
  get chapterCount(): number { return this._selectedChapters.length; }
  get isComplete(): boolean { return this._chapterIdx >= this._selectedChapters.length; }

  async init(): Promise<void> {
    try {
      await initDB();
      const book = await getBook(this._bookId);
      if (!book) {
        this._error = 'Book not found';
        return;
      }
      this._book = book;
      this._selectedChapters = book.chapters.filter((ch) =>
        this._selectedIds.includes(ch.id),
      );
      if (this._selectedChapters.length === 0) {
        this._error = 'No chapters selected';
        return;
      }
      await this._loadChapter(0);
    } catch {
      this._error = 'Failed to load book';
    } finally {
      this._loading = false;
    }
  }

  private async _loadChapter(index: number): Promise<void> {
    if (index >= this._selectedChapters.length) {
      this._currentChapter = null;
      this._challengeSession = null;
      return;
    }
    const meta = this._selectedChapters[index];
    const chapters = await loadChapters(this._bookId, [meta.id]);
    if (chapters.length === 0) {
      this._currentChapter = null;
      this._challengeSession = null;
      return;
    }
    this._currentChapter = chapters[0];
    this._chapterIdx = index;
    this._challengeSession = new ChallengeSession(chapters[0], this._level);
  }

  async recordPrediction(score: number, prediction: string, actual: string): Promise<void> {
    if (!this._book || !this._currentChapter) return;

    await addPrediction({
      bookId: this._book.id,
      chapterId: this._currentChapter.id,
      level: this._level,
      prediction,
      actual,
      similarity: score,
      timestamp: Date.now(),
    });

    const recent = await getPredictions(this._book.id, LEVEL_WINDOW);
    const newLevel = calculateNewLevel(this._level, recent.map((p) => p.similarity));
    this._level = newLevel;
    if (PREDICTION_LEVELS.indexOf(newLevel) > PREDICTION_LEVELS.indexOf(this._bestLevel)) {
      this._bestLevel = newLevel;
    }
  }

  advanceChapter(): boolean {
    this._challengeSession = null;
    this._currentChapter = null;
    const next = this._chapterIdx + 1;
    if (next < this._selectedChapters.length) {
      this._loadChapter(next);
      return false;
    }
    this._chapterIdx = next;
    return true;
  }
}
