import { describe, it, expect } from 'vitest';
import { calculateNewLevel, getLevelLabel } from './levels';

describe('calculateNewLevel', () => {
  it('returns current level when scores array is empty', () => {
    expect(calculateNewLevel(1, [])).toBe(1);
  });

  it('advances to next level when average exceeds threshold', () => {
    const result = calculateNewLevel(1, [0.9, 0.95, 0.88]);
    expect(result).toBe(2);
  });

  it('drops to previous level when average is below threshold', () => {
    const result = calculateNewLevel(5, [0.5, 0.4, 0.55]);
    expect(result).toBe(3);
  });

  it('stays same when average is between thresholds', () => {
    const result = calculateNewLevel(5, [0.7, 0.75, 0.72]);
    expect(result).toBe(5);
  });

  it('does not advance beyond the last level', () => {
    const result = calculateNewLevel('sentence', [0.9, 0.95, 0.88]);
    expect(result).toBe('sentence');
  });

  it('does not drop below the first level', () => {
    const result = calculateNewLevel(1, [0.5, 0.4, 0.55]);
    expect(result).toBe(1);
  });
});

describe('getLevelLabel', () => {
  it('returns correct label for 1', () => {
    expect(getLevelLabel(1)).toBe('1 word');
  });

  it('returns correct label for 3', () => {
    expect(getLevelLabel(3)).toBe('3 words');
  });

  it('returns correct label for sentence', () => {
    expect(getLevelLabel('sentence')).toBe('Sentence');
  });
});
