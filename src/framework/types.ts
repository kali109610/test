/** The lab contract. See CLAUDE.md → "The lab contract". */

export type StepKind =
  | 'observe'
  | 'predict'
  | 'interact'
  | 'discover'
  | 'understand'
  | 'inspect'
  | 'apply'
  | 'recall';

export interface LessonStep {
  kind: StepKind;
  /** One sentence. If it needs more, the step is wrong. */
  instruction: string;
  /** Control ids visible during this step (max 3). */
  controls: string[];
}

export interface Mission<S> {
  id: string;
  /** Phrased as something to do, not something to answer. */
  text: string;
  isComplete: (sim: S) => boolean;
}

export interface LabDefinition<S = unknown> {
  id: string;
  title: string;
  prerequisites: string[];
  renderMode: '3d' | '2d';
  /** What differs from real LLMs. Required and must be truthful. */
  simplifications: string[];
  steps: LessonStep[];
  missions: Mission<S>[];
  breakIt: { hint: string; isBroken: (sim: S) => boolean };
}
