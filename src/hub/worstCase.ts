import type { LabMeta } from '../labs/registry';

/**
 * Dev-only break-ui fixture (`/?data=worst`). Realistic worst case for the hub:
 * long curriculum titles, more labs than today, mission counts of 0, 1 and many.
 */
const lab = (id: string, order: number, title: string, blurb: string, prerequisites: string[], ready: number): LabMeta => ({
  id,
  order,
  title,
  blurb,
  prerequisites,
  renderMode: '2d',
  status: ready > 0 ? 'ready' : 'not-built',
  missionCount: ready,
});

export const WORST_LABS: LabMeta[] = [
  lab('tokenizer', 1, 'Tokenizer', 'Watch text get chopped into pieces.', [], 1),
  lab('neural-net', 2, 'Neural net', 'Drag the weights of a tiny network and watch it learn, or fail to, on XOR and on a two-arm spiral that needs a hidden layer.', [], 4),
  lab('embeddings', 3, 'Embeddings & similarity search', 'Words as points.', ['tokenizer'], 3),
  lab('attention', 4, 'Multi-head self-attention', 'See which words look at which.', ['tokenizer', 'neural-net'], 0),
  lab('inference', 5, 'Inference', 'Step real GPT-2.', ['attention'], 0),
  lab('rag', 6, 'Retrieval-augmented generation (RAG)', 'Give the model a library card.', ['inference', 'embeddings'], 0),
  lab('serving', 7, 'Serving', 'Pack requests onto GPUs.', ['inference'], 0),
  lab('agent', 8, 'Agent', 'Hand an agent tools.', ['inference'], 0),
  lab('rlhf', 9, 'RLHF / preference fine-tuning', 'Teach it manners.', ['inference'], 0),
];

/** missions done per lab, chosen to hit 1 (plural) and "all done". */
export const WORST_DONE: Record<string, number> = { tokenizer: 1, 'neural-net': 4, embeddings: 0 };
