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

export interface Prediction<S> {
  choices: string[];
  /** Index of the right choice, computed from the sim (never hard-coded). */
  correct: (sim: S) => number;
}

export interface LessonStep<S> {
  kind: StepKind;
  /** One sentence. If it needs more, the step is wrong. */
  instruction: string;
  /** Control ids visible during this step (max 3). */
  controls: string[];
  predict?: Prediction<S>;
  /** Recall steps: the answer, shown only after the user asks for it. */
  answer?: string;
}

export interface Mission<S> {
  id: string;
  /** Phrased as something to do, not something to answer. */
  text: string;
  isComplete: (sim: S) => boolean;
}

/** One mechanism's explanation. Stays locked until the user has touched that mechanism. */
export interface Explanation {
  id: string;
  name: string;
  /** The one-sentence truth. */
  truth: string;
  detail?: string;
}

export interface LabDefinition<S = unknown> {
  id: string;
  title: string;
  prerequisites: string[];
  renderMode: '3d' | '2d';
  /** What differs from real LLMs. Required and must be truthful. */
  simplifications: string[];
  steps: LessonStep<S>[];
  missions: Mission<S>[];
  breakIt: { hint: string; isBroken: (sim: S) => boolean };
  explanations: Explanation[];
  /** One line on how this lab feeds the next. */
  bigPicture: string;
}
