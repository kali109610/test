import { describe, expect, it } from 'vitest';
import {
  analyze,
  bpeTokenize,
  charTokenize,
  makeSim,
  overflows,
  pickableWords,
  PRESETS,
  wordTokenize,
} from './index';

const texts = (ts: { text: string }[]) => ts.map((t) => t.text);

describe('charTokenize', () => {
  it('is one token per code point, id = code point', () => {
    expect(charTokenize('Hi!')).toEqual([
      { id: 72, text: 'H' },
      { id: 105, text: 'i' },
      { id: 33, text: '!' },
    ]);
  });
  it('keeps an emoji as one code point, splits Hindi marks apart', () => {
    expect(charTokenize('🦜')).toHaveLength(1);
    expect(texts(charTokenize('स्ते'))).toEqual(['स', '्', 'त', 'े']);
  });
});

describe('wordTokenize', () => {
  it('splits on spaces and punctuation and looks up the toy vocab', () => {
    const toks = wordTokenize('The cat sat.');
    expect(texts(toks)).toEqual(['The', 'cat', 'sat', '.']);
    expect(toks.slice(0, 3).every((t) => !t.unknown && t.id > 0)).toBe(true);
  });
  it('knows every word and mark in the default English preset', () => {
    expect(wordTokenize(PRESETS[0].text).some((t) => t.unknown)).toBe(false);
  });
  it('maps out-of-vocabulary words to [UNK] (id 0)', () => {
    const [t] = wordTokenize('pneumonoultramicroscopic');
    expect(t).toMatchObject({ id: 0, unknown: true });
  });
  it('is case-insensitive for lookup but keeps original text', () => {
    expect(wordTokenize('HELLO')[0]).toMatchObject({ text: 'HELLO', id: wordTokenize('hello')[0]!.id });
  });
});

describe('bpeTokenize (real GPT-4o o200k_base)', () => {
  it('reassembles to the original text', () => {
    for (const p of PRESETS) {
      expect(texts(bpeTokenize(p.text)).join('')).toBe(p.text);
    }
  });
  it('uses known real token ids', () => {
    expect(bpeTokenize('Hello world')).toEqual([
      { id: 13225, text: 'Hello' },
      { id: 2375, text: ' world' },
    ]);
  });
  it('splits a rare word into several subword pieces', () => {
    expect(bpeTokenize('antidisestablishmentarianism').length).toBeGreaterThanOrEqual(3);
  });
  it('marks byte-level fragments for an emoji', () => {
    const toks = bpeTokenize('🦜');
    expect(toks.length).toBeGreaterThan(1);
    expect(toks.every((t) => t.fragment)).toBe(true);
    expect(texts(toks).join('')).toBe('🦜');
  });
});

describe('analysis + sim', () => {
  it('char ≥ bpe for English', () => {
    const a = analyze(PRESETS[0].text);
    expect(a.char.length).toBeGreaterThan(a.bpe.length);
  });
  it('pickableWords is unique and in order', () => {
    expect(pickableWords('the cat, the hat')).toEqual(['the', 'cat', 'hat']);
  });
  it('detects context overflow', () => {
    expect(overflows(makeSim('hi', 16))).toBe(false);
    expect(overflows(makeSim('word '.repeat(40), 16))).toBe(true);
  });
  it('runs each dropped word through only the tokenizer it was dropped on', () => {
    const sim = makeSim('hello there', 64, { char: 'there', bpe: 'antidisestablishmentarianism' });
    expect(sim.inspectedTokens.char).toHaveLength(5);
    expect(sim.inspectedTokens.bpe!.length).toBeGreaterThanOrEqual(3);
    expect(sim.inspectedTokens.word).toBeUndefined();
  });
});
