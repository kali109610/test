import { describe, expect, it } from 'vitest';
import { completeMission, emptyProgress, missionsDone, openExplanation, resetLab } from './progress';

describe('progress', () => {
  it('records a mission once', () => {
    let p = emptyProgress();
    p = completeMission(p, 'neural-net', 'overfit');
    const same = completeMission(p, 'neural-net', 'overfit');
    expect(same).toBe(p);
    expect(missionsDone(p, 'neural-net')).toBe(1);
    expect(missionsDone(p, 'tokenizer')).toBe(0);
  });

  it('tracks explanations separately from missions', () => {
    const p = openExplanation(emptyProgress(), 'attention', 'softmax');
    expect(p.explanations.attention).toEqual(['softmax']);
    expect(missionsDone(p, 'attention')).toBe(0);
  });

  it('resetLab clears only that lab', () => {
    let p = completeMission(emptyProgress(), 'a', 'm1');
    p = completeMission(p, 'b', 'm2');
    p = openExplanation(p, 'a', 'x');
    p = resetLab(p, 'a');
    expect(p.missions).toEqual({ b: ['m2'] });
    expect(p.explanations).toEqual({});
  });
});
