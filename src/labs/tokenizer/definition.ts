import type { LabDefinition } from '../../framework/types';
import { bpeTokenize, overflows, type TokenizerSim } from '../../sim/tokenizer';

/** The word used in the Predict step. Its answer is computed by the real tokenizer. */
export const PREDICT_WORD = 'tokenization';

export const tokenizerLab: LabDefinition<TokenizerSim> = {
  id: 'tokenizer',
  title: 'Tokenizer',
  prerequisites: [],
  renderMode: '2d',
  bigPicture:
    'A model never sees letters, only these token ids. In Lab 2 a neural network takes numbers like these and learns from them.',
  simplifications: [
    'The GPT-4o row is the real GPT-4o tokenizer (o200k_base, about 200,000 tokens). Other models such as Llama, Claude or GPT-2 have different vocabularies and split the same text differently.',
    'The word tokenizer here knows about 300 words so you can hit [UNK] quickly. Real word-level tokenizers had 50,000+ words and still met words they had never seen.',
    'The word tokenizer lowercases before lookup. Real ones made different choices about case and punctuation.',
    'Character ids here are Unicode code points. Real character-level models usually learn a small alphabet of their own instead.',
    'The context window here is 16 to 128 tokens so you can fill it by typing. Real models hold thousands to over a million tokens.',
    'When text is too long, a real API rejects it, or a chat app drops the oldest messages. Here we only show where the limit falls.',
  ],
  explanations: [
    {
      id: 'char',
      name: 'Character tokenizer',
      truth: 'Every character is its own token, so nothing is ever unknown, but text costs a lot of tokens.',
      detail: 'Long sequences are slow and expensive for a model, which is why almost no modern LLM tokenizes this way.',
    },
    {
      id: 'word',
      name: 'Word tokenizer',
      truth: 'Each whole word is one token from a fixed list, and any word not on the list becomes [UNK].',
      detail: 'Once a word becomes [UNK], its meaning is gone. The model cannot tell "pneumonia" from "quokka".',
    },
    {
      id: 'bpe',
      name: 'Byte-pair encoding (BPE)',
      truth: 'Common chunks of text get their own token; rare words are built from several smaller chunks.',
      detail:
        'The chunks were learned from training data by repeatedly merging the most frequent pair of pieces. It starts from raw bytes, so any text can be encoded, even if an emoji takes several byte tokens.',
    },
    {
      id: 'context',
      name: 'Context window',
      truth: 'A model can only read a fixed number of tokens at once, and that limit is counted in tokens, not words.',
      detail: 'The same sentence can cost very different amounts in different languages, so the window fills at different speeds.',
    },
  ],
  steps: [
    {
      kind: 'observe',
      instruction: 'One sentence, read by three different machines. Compare how many pieces each one makes.',
      controls: [],
    },
    {
      kind: 'predict',
      instruction: `How many GPT-4o tokens is the word “${PREDICT_WORD}”?`,
      controls: [],
      predict: {
        choices: ['1', '2', '3 or more'],
        correct: () => Math.min(bpeTokenize(PREDICT_WORD).length, 3) - 1,
      },
    },
    {
      kind: 'interact',
      instruction: 'Drag a word from the tray onto each machine and watch it split.',
      controls: ['presets'],
    },
    {
      kind: 'discover',
      instruction: 'Switch presets. Which machine struggles with which kind of text?',
      controls: ['presets'],
    },
    {
      kind: 'understand',
      instruction: 'GPT keeps common words whole and builds rare ones from familiar chunks.',
      controls: ['presets'],
    },
    {
      kind: 'inspect',
      instruction: 'Read what this lab simplifies before you explain it to anyone.',
      controls: ['presets', 'context'],
    },
    {
      kind: 'apply',
      instruction: 'Shrink the window or keep typing until GPT-4o runs out of room.',
      controls: ['presets', 'context'],
    },
    {
      kind: 'recall',
      instruction: 'Why does GPT split “pneumonoultramicroscopic” but not “the”?',
      controls: ['presets', 'context'],
      answer:
        '“the” is so common in training data that it earned its own token. The rare word never did, so it is spelled out of smaller chunks the tokenizer does know. Nothing becomes unknown, it just costs more tokens.',
    },
  ],
  missions: [
    {
      id: 'split-3',
      text: 'Drop a word on GPT-4o that splits into 3 or more pieces.',
      isComplete: (s) => (s.inspectedTokens.bpe?.length ?? 0) >= 3,
    },
    {
      id: 'unk',
      text: 'Make the word machine meet a word it has never seen.',
      isComplete: (s) => s.analysis.word.some((t) => t.unknown) || !!s.inspectedTokens.word?.some((t) => t.unknown),
    },
    {
      id: 'fragment',
      text: 'Find a GPT-4o token that is only part of a character.',
      isComplete: (s) => s.analysis.bpe.some((t) => t.fragment) || !!s.inspectedTokens.bpe?.some((t) => t.fragment),
    },
  ],
  breakIt: {
    hint: 'Overflow the context window.',
    isBroken: (s) => overflows(s, 'bpe'),
  },
};
