import { describe, it, expect, vi } from 'vitest';
import { ChallengeSession } from './challenge-session';
import type { Chapter } from '$lib/types';

vi.mock('$lib/ai/embedding', () => ({
  getEmbedding: (text: string) => {
    const vec = Array.from({ length: 256 }, (_, i) =>
      text.charCodeAt(i % text.length) / 255,
    );
    return Promise.resolve(vec);
  },
}));

function makeChapter(paragraphs: string[]): Chapter {
  return {
    id: 'ch1',
    bookId: 'b1',
    title: 'Test',
    paragraphs,
  };
}

describe('ChallengeSession', () => {
  it('creates an initial challenge on construction', () => {
    const chapter = makeChapter(['The quick brown fox jumps over the lazy dog.']);
    const session = new ChallengeSession(chapter, 1);
    expect(session.isComplete).toBe(false);
    expect(session.challenge).not.toBeNull();
    expect(session.challenge!.paragraphIndex).toBe(0);
    expect(session.revealed).toBeNull();
    expect(session.lastScore).toBeNull();
    expect(session.completedParagraphs).toEqual([]);
  });

  it('is complete when chapter has no valid paragraphs', () => {
    const chapter = makeChapter(['OneWord']);
    const session = new ChallengeSession(chapter, 1);
    expect(session.isComplete).toBe(true);
    expect(session.challenge).toBeNull();
  });

  it('returns a score after submitting a prediction', async () => {
    const chapter = makeChapter(['The quick brown fox jumps over the lazy dog.']);
    const session = new ChallengeSession(chapter, 1);
    const result = await session.submitPrediction('lazy dog');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.actual).toBeTruthy();
    expect(session.revealed).toBe(result.actual);
    expect(session.lastScore).toBe(result.score);
  });

  it('increments tick after submitPrediction', async () => {
    const chapter = makeChapter(['The quick brown fox jumps over the lazy dog.']);
    const session = new ChallengeSession(chapter, 1);
    const tickBefore = session.tick;
    await session.submitPrediction('test');
    expect(session.tick).toBeGreaterThan(tickBefore);
  });

  it('stores word data after submission', async () => {
    const chapter = makeChapter(['The quick brown fox jumps over the lazy dog.']);
    const session = new ChallengeSession(chapter, 1);
    await session.submitPrediction('test prediction');
    const paraIdx = session.currentParaIdx;
    const wordData = session.wordData.get(paraIdx);
    expect(wordData).toBeDefined();
    expect(wordData!.size).toBeGreaterThan(0);
  });

  it('advances to next challenge in same paragraph', async () => {
    const longPara = Array.from({ length: 50 }, (_, i) => `word${i}`).join(' ');
    const chapter = makeChapter([longPara]);
    const session = new ChallengeSession(chapter, 1);
    const paraBefore = session.currentParaIdx;
    await session.submitPrediction('test');
    const complete = session.advance(1);
    expect(complete).toBe(false);
    expect(session.currentParaIdx).toBe(paraBefore);
    expect(session.challenge).not.toBeNull();
    expect(session.revealed).toBeNull();
    expect(session.lastScore).toBeNull();
  });

  it('advances to next paragraph when word reaches end', async () => {
    const chapter = makeChapter([
      'Short para.',
      'A much longer paragraph with enough words to test paragraph advancement.',
    ]);
    const session = new ChallengeSession(chapter, 1);
    expect(session.currentParaIdx).toBe(0);
    await session.submitPrediction('test');
    session.advance(1);
    // Eventually paragraph 0 runs out of words and advances to paragraph 1
    expect(session.currentParaIdx).toBe(1);
  });

  it('accepts level parameter in advance for step calculation', async () => {
    const longPara = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ');
    const chapter = makeChapter([longPara]);
    const session = new ChallengeSession(chapter, 1);
    await session.submitPrediction('test');
    session.advance(3);
    expect(session.challenge).not.toBeNull();
  });

  it('throws if submitPrediction is called when complete', async () => {
    const chapter = makeChapter(['word']);
    const session = new ChallengeSession(chapter, 1);
    await expect(session.submitPrediction('test')).rejects.toThrow('No active challenge');
  });

  it('reports isComplete when null challenge', () => {
    const chapter = makeChapter(['word']);
    const session = new ChallengeSession(chapter, 1);
    expect(session.isComplete).toBe(true);
  });

  it('tracks completed paragraphs across advances', async () => {
    const chapter = makeChapter([
      'First paragraph with enough words for testing.',
      'Second paragraph that continues the content for the reader.',
    ]);
    const session = new ChallengeSession(chapter, 1);
    expect(session.completedParagraphs).toHaveLength(0);
    await session.submitPrediction('test words');
    session.advance(1);

    // The completed list might have entries for paragraphs we've finished
    expect(session.isComplete).toBe(false);

    // Advance through the rest
    while (!session.isComplete) {
      await session.submitPrediction('test');
      session.advance(1);
    }
    expect(session.completedParagraphs.length).toBeGreaterThanOrEqual(1);
  });
});
