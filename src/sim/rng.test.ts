import { describe, expect, it } from 'vitest';
import { createRng } from './rng';

const take = (n: number, f: () => number) => Array.from({ length: n }, f);

describe('createRng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect(take(100, a.next)).toEqual(take(100, b.next));
  });

  it('re-creating with the same seed replays the run (Reset)', () => {
    const first = take(10, createRng(7).next);
    const again = take(10, createRng(7).next);
    expect(again).toEqual(first);
  });

  it('differs across seeds', () => {
    expect(take(10, createRng(1).next)).not.toEqual(take(10, createRng(2).next));
  });

  it('next() stays in [0, 1) with a sane mean', () => {
    const xs = take(20000, createRng(3).next);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThan(1);
    const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
    expect(mean).toBeCloseTo(0.5, 1);
  });

  it('int() is inclusive and hits every value', () => {
    const rng = createRng(9);
    const seen = new Set(take(2000, () => rng.int(-2, 2)));
    expect([...seen].sort((a, b) => a - b)).toEqual([-2, -1, 0, 1, 2]);
  });

  it('uniform() respects bounds', () => {
    const rng = createRng(11);
    for (const x of take(1000, () => rng.uniform(-3, 5))) {
      expect(x).toBeGreaterThanOrEqual(-3);
      expect(x).toBeLessThan(5);
    }
  });

  it('normal() has roughly the requested mean and std', () => {
    const rng = createRng(5);
    const xs = take(20000, () => rng.normal(2, 0.5));
    const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
    const variance = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length;
    expect(mean).toBeCloseTo(2, 1);
    expect(Math.sqrt(variance)).toBeCloseTo(0.5, 1);
    expect(xs.every(Number.isFinite)).toBe(true);
  });

  it('shuffle() is a deterministic permutation', () => {
    const a = createRng(13).shuffle([1, 2, 3, 4, 5, 6]);
    const b = createRng(13).shuffle([1, 2, 3, 4, 5, 6]);
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
