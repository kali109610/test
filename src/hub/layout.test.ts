import { describe, expect, it } from 'vitest';
import { LABS, type LabMeta } from '../labs/registry';
import { layoutLabs } from './layout';

const lab = (id: string, order: number, prerequisites: string[] = []): LabMeta => ({
  id,
  order,
  title: id,
  blurb: '',
  prerequisites,
  renderMode: '2d',
  status: 'not-built',
  missionCount: 0,
});

describe('layoutLabs', () => {
  it('places every registered lab after all its prerequisites', () => {
    const pos = new Map(layoutLabs(LABS).map((p) => [p.id, p]));
    expect(pos.size).toBe(LABS.length);
    for (const l of LABS) {
      for (const pre of l.prerequisites) {
        expect(pos.get(pre)!.x).toBeLessThan(pos.get(l.id)!.x);
      }
    }
  });

  it('stacks same-depth labs and centres them', () => {
    const out = layoutLabs([lab('a', 1), lab('b', 2), lab('c', 3, ['a', 'b'])], 2, 2);
    const a = out.find((p) => p.id === 'a')!;
    const b = out.find((p) => p.id === 'b')!;
    const c = out.find((p) => p.id === 'c')!;
    expect(a.x).toBe(b.x);
    expect(a.y).toBe(-b.y);
    expect(c.y).toBe(0);
    expect(c.depth).toBe(1);
  });

  it('rejects cycles and unknown prerequisites', () => {
    expect(() => layoutLabs([lab('a', 1, ['b']), lab('b', 2, ['a'])])).toThrow(/cycle/);
    expect(() => layoutLabs([lab('a', 1, ['nope'])])).toThrow(/Unknown/);
  });
});
