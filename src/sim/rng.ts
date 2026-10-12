/**
 * Seeded PRNG (mulberry32). Every bit of randomness in every sim goes through here,
 * so "Reset" can restore the exact same run by re-creating the Rng with the same seed.
 */
export interface Rng {
  readonly seed: number;
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform float in [min, max). */
  uniform(min: number, max: number): number;
  /** Uniform integer in [min, max] (inclusive). */
  int(min: number, max: number): number;
  /** Standard normal sample (Box–Muller). */
  normal(mean?: number, std?: number): number;
  /** In-place Fisher–Yates shuffle. Returns the same array. */
  shuffle<T>(items: T[]): T[];
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    seed: seed >>> 0,
    next,
    uniform: (min, max) => min + (max - min) * next(),
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    normal: (mean = 0, std = 1) => {
      // 1 - next() is in (0, 1], so log never sees 0.
      const u1 = 1 - next();
      const u2 = next();
      return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    },
    shuffle: (items) => {
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const tmp = items[i]!;
        items[i] = items[j]!;
        items[j] = tmp;
      }
      return items;
    },
  };
}
