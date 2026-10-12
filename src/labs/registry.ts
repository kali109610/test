/**
 * Hub-level metadata for every lab in the build order. A lab only gets a
 * `LabDefinition` (and `status: 'ready'`) once it is actually built.
 */
export interface LabMeta {
  id: string;
  order: number;
  title: string;
  /** One line: what you get to touch. */
  blurb: string;
  prerequisites: string[];
  renderMode: '3d' | '2d';
  status: 'ready' | 'not-built';
  /** Number of missions; 0 until the lab is built. */
  missionCount: number;
}

export const LABS: LabMeta[] = [
  {
    id: 'tokenizer',
    order: 1,
    title: 'Tokenizer',
    blurb: 'Watch text get chopped into the pieces a model actually reads.',
    prerequisites: [],
    renderMode: '2d',
    status: 'not-built',
    missionCount: 0,
  },
  {
    id: 'neural-net',
    order: 2,
    title: 'Neural net',
    blurb: 'Drag the weights of a tiny network and watch it learn, or fail to.',
    prerequisites: [],
    renderMode: '2d',
    status: 'not-built',
    missionCount: 0,
  },
  {
    id: 'attention',
    order: 3,
    title: 'Attention',
    blurb: 'See which words look at which, and why the future is hidden.',
    prerequisites: ['tokenizer', 'neural-net'],
    renderMode: '3d',
    status: 'not-built',
    missionCount: 0,
  },
  {
    id: 'inference',
    order: 4,
    title: 'Inference',
    blurb: 'Step real GPT-2 through choosing its next word.',
    prerequisites: ['attention'],
    renderMode: '2d',
    status: 'not-built',
    missionCount: 0,
  },
  {
    id: 'serving',
    order: 5,
    title: 'Serving',
    blurb: 'Pack requests onto GPUs until memory runs out.',
    prerequisites: ['inference'],
    renderMode: '3d',
    status: 'not-built',
    missionCount: 0,
  },
  {
    id: 'agent',
    order: 6,
    title: 'Agent',
    blurb: 'Hand an agent tools, take one away, and watch it get stuck.',
    prerequisites: ['inference'],
    renderMode: '2d',
    status: 'not-built',
    missionCount: 0,
  },
];

export const getLab = (id: string): LabMeta | undefined => LABS.find((l) => l.id === id);
