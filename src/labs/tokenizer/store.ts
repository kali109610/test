import { create } from 'zustand';
import { CONTEXT_SIZES, PRESETS, type Inspected, type TokenizerKind } from '../../sim/tokenizer';

export type Mechanism = TokenizerKind | 'context';

interface TokenizerStore {
  text: string;
  presetId: string | null;
  contextLimit: number;
  inspected: Inspected;
  step: number;
  lastTouched: Mechanism | null;
  /** Word picked up by click/keyboard (alternative to dragging). */
  held: string | null;
  /** Control that arrow keys nudge. */
  selected: 'context' | null;
  select: (c: 'context' | null) => void;
  /** Bumped by Replay to re-run the split animation. */
  replayKey: number;
  setText: (text: string) => void;
  setPreset: (id: string) => void;
  setContext: (limit: number) => void;
  nudgeContext: (dir: -1 | 1) => void;
  drop: (kind: TokenizerKind, word: string) => void;
  hold: (word: string | null) => void;
  setStep: (i: number) => void;
  touch: (m: Mechanism) => void;
  replay: () => void;
  reset: () => void;
}

const initial = {
  text: PRESETS[0].text,
  presetId: PRESETS[0].id as string | null,
  contextLimit: 64,
  inspected: {} as Inspected,
  lastTouched: null as Mechanism | null,
  held: null as string | null,
  selected: null as 'context' | null,
  replayKey: 0,
};

export const useTokenizerLab = create<TokenizerStore>()((set, get) => ({
  ...initial,
  step: 0,
  setText: (text) => set({ text, presetId: PRESETS.find((p) => p.text === text)?.id ?? null }),
  setPreset: (id) => {
    const p = PRESETS.find((x) => x.id === id);
    if (p) set({ text: p.text, presetId: p.id, inspected: {} });
  },
  setContext: (contextLimit) => set({ contextLimit, lastTouched: 'context' }),
  nudgeContext: (dir) => {
    const i = CONTEXT_SIZES.indexOf(get().contextLimit as (typeof CONTEXT_SIZES)[number]);
    const next = CONTEXT_SIZES[Math.max(0, Math.min(CONTEXT_SIZES.length - 1, i + dir))]!;
    set({ contextLimit: next, lastTouched: 'context' });
  },
  drop: (kind, word) =>
    set((s) => ({ inspected: { ...s.inspected, [kind]: word }, lastTouched: kind, held: null, replayKey: s.replayKey + 1 })),
  hold: (held) => set({ held }),
  select: (selected) => set({ selected }),
  setStep: (step) => set({ step }),
  touch: (lastTouched) => set({ lastTouched }),
  replay: () => set((s) => ({ replayKey: s.replayKey + 1 })),
  reset: () => set({ ...initial, replayKey: get().replayKey + 1 }),
}));
