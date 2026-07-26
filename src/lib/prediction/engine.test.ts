import { describe, it, expect, vi } from 'vitest';
import { generateChallenge, getContinuation, scorePrediction } from './engine';
import type { Chapter } from '$lib/types';

const mockChapter: Chapter = {
  id: 'ch1',
  bookId: 'b1',
  title: 'Test Chapter',
  paragraphs: [
    'The quick brown fox jumps over the lazy dog near the river bank.',
    'OneWordPara',
    'This is a longer paragraph with many words for testing purposes. It should have enough words to generate multiple challenges across different levels.',
  ],
};

vi.mock('$lib/ai/embedding', () => ({
  getEmbedding: (text: string) => {
    const vec = Array.from({ length: 256 }, (_, i) =>
      text.charCodeAt(i % text.length) / 255,
    );
    return Promise.resolve(vec);
  },
}));

describe('generateChallenge', () => {
  it('returns null when paragraphIndex is out of range', () => {
    expect(generateChallenge(mockChapter, 999, 0, 1)).toBeNull();
  });

  it('skips paragraphs with 1 or fewer words', () => {
    const result = generateChallenge(mockChapter, 1, 0, 1);
    expect(result).not.toBeNull();
    expect(result!.paragraphIndex).toBe(2);
  });

  it('returns a challenge with visible text and continuationStart', () => {
    const result = generateChallenge(mockChapter, 0, 0, 1);
    expect(result).not.toBeNull();
    expect(result!.chapterId).toBe('ch1');
    expect(result!.paragraphIndex).toBe(0);
    expect(result!.visibleText).toBeTruthy();
    expect(result!.continuationStart).toBeGreaterThan(0);
  });

  it('uses CONTEXT_WORDS context when wordOffset is small', () => {
    const result = generateChallenge(mockChapter, 0, 0, 1);
    const wordCount = result!.visibleText.split(/\s+/).length;
    expect(wordCount).toBeGreaterThan(0);
  });

  it('respects level in continuationStart calculation', () => {
    const level1 = generateChallenge(mockChapter, 2, 0, 1);
    const level5 = generateChallenge(mockChapter, 2, 0, 5);
    expect(level1).not.toBeNull();
    expect(level5).not.toBeNull();
  });
});

describe('getContinuation', () => {
  it('returns empty string for out of range paragraph', () => {
    expect(getContinuation(mockChapter, 999, 0, 1)).toBe('');
  });

  it('returns N words for numeric level', () => {
    const result = getContinuation(mockChapter, 0, 10, 3);
    expect(result.split(/\s+/).length).toBe(3);
  });

  it('returns a sentence for sentence level', () => {
    const result = getContinuation(mockChapter, 0, 5, 'sentence');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/[.!?]$/);
  });

  it('returns remaining text when wordOffset is near the end', () => {
    const para = mockChapter.paragraphs[0];
    const wordCount = para.split(/\s+/).length;
    const result = getContinuation(mockChapter, 0, wordCount - 2, 5);
    expect(result.split(/\s+/).length).toBeLessThanOrEqual(2);
  });
});

describe('scorePrediction', () => {
  it('returns a score between 0 and 1 with mocked embedding', async () => {
    const score = await scorePrediction('hello world', 'hello world');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('returns higher score for similar strings', async () => {
    const same = await scorePrediction('exact match', 'exact match');
    const diff = await scorePrediction('hello world', 'completely different text here');
    expect(same).toBeGreaterThan(diff);
  });
});
