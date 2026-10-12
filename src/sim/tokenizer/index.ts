/**
 * Three ways to turn text into token ids, side by side:
 * - char: one token per Unicode code point; id = the code point.
 * - word: split on spaces/punctuation, look up a toy vocabulary; unknown → [UNK].
 * - bpe:  the real GPT-4o tokenizer (o200k_base, via gpt-tokenizer).
 */
import { decode, encode, vocabularySize } from 'gpt-tokenizer/encoding/o200k_base';
import { decoder as sharedDecoder } from 'gpt-tokenizer/BytePairEncodingCore';
import { WORD_VOCAB, WORD_VOCAB_SIZE, wordId } from './vocab';

export type TokenizerKind = 'char' | 'word' | 'bpe';

export interface Token {
  id: number;
  /** The text this token stands for. For byte fragments see `fragment`. */
  text: string;
  /** True for [UNK] in the word tokenizer. */
  unknown?: boolean;
  /**
   * BPE only: this token is part of a run of tokens that only spell a character together
   * (e.g. an emoji encoded as several byte-level tokens). `text` is '' for all but the last.
   */
  fragment?: boolean;
}

export const UNK = WORD_VOCAB[0]!;
export const VOCAB_SIZES = { char: 0x10ffff + 1, word: WORD_VOCAB_SIZE, bpe: vocabularySize } as const;

export function charTokenize(text: string): Token[] {
  return Array.from(text, (ch) => ({ id: ch.codePointAt(0)!, text: ch }));
}

// Letters/marks/digits/apostrophes form words; any other non-space char is its own token.
const WORD_RE = /[\p{L}\p{M}\p{N}]+(?:'[\p{L}]+)?|[^\s\p{L}\p{M}\p{N}]/gu;

export function wordTokenize(text: string): Token[] {
  return Array.from(text.matchAll(WORD_RE), (m) => {
    const id = wordId(m[0]);
    return id === 0 ? { id, text: m[0], unknown: true } : { id, text: m[0] };
  });
}

const BROKEN = /�/;

/**
 * gpt-tokenizer decodes through one shared streaming TextDecoder, so decoding a partial
 * character leaves bytes buffered that corrupt the next call. Flushing that decoder after
 * every call returns any incomplete bytes as U+FFFD and resets it.
 */
const decodeClean = (ids: number[]): string => decode(ids) + sharedDecoder.decode();

export function bpeTokenize(text: string): Token[] {
  const ids = encode(text);
  const out: Token[] = [];
  let i = 0;
  while (i < ids.length) {
    const single = decodeClean([ids[i]!]);
    if (single !== '' && !BROKEN.test(single)) {
      out.push({ id: ids[i]!, text: single });
      i++;
      continue;
    }
    // Byte fragment: grow the run until the bytes form whole characters again.
    let j = i + 1;
    let joined = decodeClean(ids.slice(i, j));
    while (j < ids.length && (joined === '' || BROKEN.test(joined))) {
      j++;
      joined = decodeClean(ids.slice(i, j));
    }
    for (let k = i; k < j; k++) {
      out.push({ id: ids[k]!, text: k === j - 1 ? joined : '', fragment: true });
    }
    i = j;
  }
  return out;
}

export const TOKENIZERS: Record<TokenizerKind, (text: string) => Token[]> = {
  char: charTokenize,
  word: wordTokenize,
  bpe: bpeTokenize,
};

export interface Analysis {
  char: Token[];
  word: Token[];
  bpe: Token[];
}

export function analyze(text: string): Analysis {
  return { char: charTokenize(text), word: wordTokenize(text), bpe: bpeTokenize(text) };
}

/** Words a user can pick up and drop onto a tokenizer (unique, in order of appearance). */
export function pickableWords(text: string): string[] {
  const seen = new Set<string>();
  for (const m of text.matchAll(/[\p{L}\p{M}\p{N}]+(?:'[\p{L}]+)?/gu)) seen.add(m[0]);
  return [...seen];
}

/**
 * The lab's toy context window. Real models have 8k–1M+ tokens; this is scaled down so you
 * can overflow it by typing.
 */
export const CONTEXT_SIZES = [16, 32, 64, 128] as const;

export type Inspected = Partial<Record<TokenizerKind, string | null>>;

export interface TokenizerSim {
  text: string;
  contextLimit: number;
  /** Word dropped onto each tokenizer, if any. */
  inspected: Inspected;
  analysis: Analysis;
  /** Each dropped word, run through the tokenizer it was dropped on. */
  inspectedTokens: Partial<Record<TokenizerKind, Token[]>>;
}

export function makeSim(text: string, contextLimit: number, inspected: Inspected = {}): TokenizerSim {
  const inspectedTokens: TokenizerSim['inspectedTokens'] = {};
  for (const kind of Object.keys(inspected) as TokenizerKind[]) {
    const word = inspected[kind];
    if (word) inspectedTokens[kind] = TOKENIZERS[kind](word);
  }
  return { text, contextLimit, inspected, analysis: analyze(text), inspectedTokens };
}

export const overflows = (sim: TokenizerSim, kind: TokenizerKind = 'bpe'): boolean =>
  sim.analysis[kind].length > sim.contextLimit;

export const PRESETS = [
  { id: 'english', label: 'English', text: 'The cat sat on the mat because it was tired.' },
  { id: 'rare', label: 'Rare word', text: 'My doctor said it was pneumonoultramicroscopic.' },
  { id: 'code', label: 'Code', text: 'for (let i = 0; i < 10; i++) {\n  total += i;\n}' },
  { id: 'mixed', label: 'Hindi + emoji', text: 'नमस्ते! My name is Priya 🦜' },
] as const;
