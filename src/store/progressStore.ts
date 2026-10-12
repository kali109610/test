import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { completeMission, emptyProgress, openExplanation, resetLab, type Progress } from './progress';

interface ProgressStore extends Progress {
  completeMission: (labId: string, missionId: string) => void;
  openExplanation: (labId: string, mechanismId: string) => void;
  resetLab: (labId: string) => void;
}

const pick = (s: Progress): Progress => ({ missions: s.missions, explanations: s.explanations });

export const useProgress = create<ProgressStore>()(
  persist<ProgressStore, [], [], Progress>(
    (set) => ({
      ...emptyProgress(),
      completeMission: (labId, missionId) => set((s) => completeMission(pick(s), labId, missionId)),
      openExplanation: (labId, mechanismId) => set((s) => openExplanation(pick(s), labId, mechanismId)),
      resetLab: (labId) => set((s) => resetLab(pick(s), labId)),
    }),
    { name: 'ai-lab-progress', version: 1, partialize: pick },
  ),
);
