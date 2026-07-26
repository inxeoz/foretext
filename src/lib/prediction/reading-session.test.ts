import { describe, it, expect, beforeAll, vi } from 'vitest';
import { ReadingSession } from './reading-session';

vi.mock('$lib/db/operations', () => ({
  initDB: () => Promise.resolve({} as IDBDatabase),
  getBook: () => Promise.resolve({
    id: 'b1',
    title: 'Test Book',
    author: 'Author',
    chapters: [
      { id: 'ch1', title: 'Ch1', paragraphCount: 1 },
    ],
    importedAt: Date.now(),
  }),
  addPrediction: () => Promise.resolve(1),
  getPredictions: () => Promise.resolve([]),
  loadChapters: () => Promise.resolve([
    { id: 'b1_ch1', bookId: 'b1', title: 'Ch1', paragraphs: ['The quick brown fox jumps over the lazy dog.'] },
  ]),
}));

describe('ReadingSession', () => {
  it('initializes and loads book and chapter', async () => {
    const session = new ReadingSession('b1', ['ch1']);
    expect(session.loading).toBe(true);

    await session.init();

    expect(session.loading).toBe(false);
    expect(session.error).toBeNull();
    expect(session.book).not.toBeNull();
    expect(session.book!.title).toBe('Test Book');
    expect(session.currentChapter).not.toBeNull();
    expect(session.currentChapter!.title).toBe('Ch1');
    expect(session.challengeSession).not.toBeNull();
  });

  it('starts at level 1', async () => {
    const session = new ReadingSession('b1', ['ch1']);
    await session.init();
    expect(session.level).toBe(1);
    expect(session.bestLevel).toBe(1);
    expect(session.chapterIdx).toBe(0);
    expect(session.chapterCount).toBe(1);
  });

  it('is not complete after init', async () => {
    const session = new ReadingSession('b1', ['ch1']);
    await session.init();
    expect(session.isComplete).toBe(false);
  });

  it('records prediction and updates level', async () => {
    const session = new ReadingSession('b1', ['ch1']);
    await session.init();
    await session.recordPrediction(0.95, 'test prediction', 'actual text');
    expect(session.level).toBeDefined();
    expect(session.bestLevel).toBeDefined();
  });

  it('advances chapter and becomes complete', async () => {
    const session = new ReadingSession('b1', ['ch1']);
    await session.init();
    const done = session.advanceChapter();
    expect(done).toBe(true);
    expect(session.isComplete).toBe(true);
  });
});
