/** Pure progress logic. The Zustand store in progressStore.ts wraps this. */

export interface Progress {
  /** labId → completed mission ids */
  missions: Record<string, string[]>;
  /** labId → mechanism ids whose explanation has been opened */
  explanations: Record<string, string[]>;
}

export const emptyProgress = (): Progress => ({ missions: {}, explanations: {} });

const addUnique = (list: string[] | undefined, id: string): string[] =>
  list?.includes(id) ? list : [...(list ?? []), id];

export function completeMission(p: Progress, labId: string, missionId: string): Progress {
  const current = p.missions[labId];
  const next = addUnique(current, missionId);
  if (next === current) return p;
  return { ...p, missions: { ...p.missions, [labId]: next } };
}

export function openExplanation(p: Progress, labId: string, mechanismId: string): Progress {
  const current = p.explanations[labId];
  const next = addUnique(current, mechanismId);
  if (next === current) return p;
  return { ...p, explanations: { ...p.explanations, [labId]: next } };
}

export function missionsDone(p: Progress, labId: string): number {
  return p.missions[labId]?.length ?? 0;
}

export function resetLab(p: Progress, labId: string): Progress {
  const { [labId]: _m, ...missions } = p.missions;
  const { [labId]: _e, ...explanations } = p.explanations;
  return { missions, explanations };
}
