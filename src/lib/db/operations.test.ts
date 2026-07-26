import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initDB, importBook, loadChapters, computeOverallStats, getAllBooks } from './operations';
import type { Book, Chapter, Prediction } from '$lib/types';

beforeAll(async () => {
  // @ts-expect-error - fake-indexeddb has no types
  await import('fake-indexeddb/auto');
});

const testBook: Book = {
  id: 'book1',
  title: 'Test Book',
  author: 'Test Author',
  chapters: [
    { id: 'ch1', title: 'Chapter 1', paragraphCount: 2 },
    { id: 'ch2', title: 'Chapter 2', paragraphCount: 1 },
  ],
  importedAt: Date.now(),
};

const testChapters: Chapter[] = [
  { id: 'book1_ch1', bookId: 'book1', title: 'Chapter 1', paragraphs: ['Para one of ch1.', 'Para two of ch1.'] },
  { id: 'book1_ch2', bookId: 'book1', title: 'Chapter 2', paragraphs: ['Single para of ch2.'] },
];

describe('DB composite operations', () => {
  it('importBook saves book and all chapters', async () => {
    await importBook(testBook, testChapters);

    const books = await getAllBooks();
    expect(books).toHaveLength(1);
    expect(books[0].id).toBe('book1');
  });

  it('loadChapters returns correct chapters', async () => {
    const chapters = await loadChapters('book1', ['ch1', 'ch2']);
    expect(chapters).toHaveLength(2);
    expect(chapters[0].title).toBe('Chapter 1');
    expect(chapters[1].title).toBe('Chapter 2');
  });

  it('loadChapters returns empty array for missing book', async () => {
    const chapters = await loadChapters('nonexistent', ['ch1']);
    expect(chapters).toHaveLength(0);
  });

  it('computeOverallStats returns correct stats', async () => {
    const stats = await computeOverallStats();
    expect(stats.predictionsMade).toBe(0);
    expect(stats.averageScore).toBe(0);
    expect(stats.currentLevel).toBe(1);
    expect(stats.bestLevel).toBe(1);
    expect(stats.booksCompleted).toBe(1);
  });

  it('computeOverallStats with predictions', async () => {
    const { addPrediction } = await import('./operations');
    await addPrediction({
      bookId: 'book1',
      chapterId: 'book1_ch1',
      level: 1,
      prediction: 'test',
      actual: 'test',
      similarity: 0.95,
      timestamp: Date.now(),
    });

    const stats = await computeOverallStats();
    expect(stats.predictionsMade).toBe(1);
    expect(stats.averageScore).toBeGreaterThan(0);
  });
});
