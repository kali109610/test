import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import clsx from 'clsx';
import {
  CONTEXT_SIZES,
  pickableWords,
  PRESETS,
  TOKENIZERS,
  VOCAB_SIZES,
  type Token,
  type TokenizerKind,
  type TokenizerSim,
} from '../../sim/tokenizer';
import { useTokenizerLab } from './store';

const LANES: { kind: TokenizerKind; name: string; sub: string }[] = [
  { kind: 'char', name: 'Characters', sub: 'one token per character' },
  { kind: 'word', name: 'Whole words', sub: `toy list of ${VOCAB_SIZES.word} words` },
  { kind: 'bpe', name: 'GPT-4o', sub: `real BPE · ${VOCAB_SIZES.bpe.toLocaleString()} tokens` },
];

const HUES = 6;
const show = (t: string) => t.replace(/ /g, '·').replace(/\n/g, '↵');

function Chip({ token, i, big }: { token: Token; i: number; big?: boolean }) {
  const label = token.fragment && token.text === '' ? 'byte' : show(token.text) || '·';
  return (
    <span
      className={clsx(
        'tok inline-flex flex-col items-center rounded-md px-1 leading-tight',
        token.unknown ? 'tok-unk' : token.fragment ? 'tok-frag' : `tok-h${i % HUES}`,
        big ? 'piece py-1.5 text-xl' : 'py-0.5 text-[15px]',
      )}
      style={big ? ({ '--i': i } as React.CSSProperties) : undefined}
      title={`id ${token.id}${token.unknown ? ' · unknown word' : ''}${token.fragment ? ' · part of a character' : ''}`}
    >
      <span className={clsx('font-mono whitespace-pre', token.fragment && token.text === '' && 'text-[11px] italic opacity-70')}>
        {token.unknown ? '[UNK]' : label}
      </span>
      <span className="font-mono text-[9px] tabular-nums opacity-55">{token.id}</span>
    </span>
  );
}

function ContextBar({ count, limit }: { count: number; limit: number }) {
  const over = count > limit;
  const fill = Math.min(count, limit) / limit;
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-line" aria-hidden>
        <div
          className={clsx('h-full origin-left rounded-full transition-transform duration-150 ease-out', over ? 'bg-bad' : 'bg-accent')}
          style={{ transform: `scaleX(${fill})` }}
        />
      </div>
      <span className={clsx('w-28 text-right text-[12px] tabular-nums', over ? 'font-semibold text-bad' : 'text-muted')}>
        {over ? `${count - limit} over the limit` : `${count} / ${limit} tokens`}
      </span>
    </div>
  );
}

/** While dragging near the top/bottom edge of the scrolling scene (or window), scroll it. */
function autoScroll(y: number) {
  const main = document.querySelector('main');
  const scrolls = main && main.scrollHeight > main.clientHeight + 1;
  const r = scrolls ? main!.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
  const edge = 70;
  const dy = y > r.bottom - edge ? 14 : y < r.top + edge ? -14 : 0;
  if (!dy) return;
  if (scrolls) main!.scrollBy(0, dy);
  else window.scrollBy(0, dy);
}

interface Drag {
  word: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  /** Becomes true after a few pixels of movement, so a plain click stays a click. */
  moved: boolean;
  over: TokenizerKind | null;
}

export function Scene({ sim }: { sim: TokenizerSim }) {
  const { text, setText, drop, held, hold, replayKey, contextLimit } = useTokenizerLab();
  const [drag, setDrag] = useState<Drag | null>(null);
  const words = useMemo(() => pickableWords(text).slice(0, 24), [text]);
  const dragRef = useRef<Drag | null>(null);
  dragRef.current = drag;

  // While dragging, the lane under the pointer previews the split live.
  useEffect(() => {
    if (!drag) return;
    const laneAt = (x: number, y: number) =>
      ((document.elementFromPoint(x, y) as HTMLElement | null)?.closest('[data-lane]')?.getAttribute('data-lane') ??
        null) as TokenizerKind | null;
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      autoScroll(e.clientY);
      const moved = d.moved || Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 4;
      setDrag({ ...d, x: e.clientX, y: e.clientY, moved, over: moved ? laneAt(e.clientX, e.clientY) : null });
    };
    const up = (e: PointerEvent) => {
      const d = dragRef.current;
      const lane = laneAt(e.clientX, e.clientY);
      if (d?.moved && lane) drop(lane, d.word);
      setDrag(null);
      document.body.style.cursor = '';
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [drag !== null, drop]); // eslint-disable-line react-hooks/exhaustive-deps

  const startDrag = (word: string) => (e: RPointerEvent) => {
    if (e.button !== 0 || dragRef.current) return; // ignore extra fingers mid-drag
    e.preventDefault();
    document.body.style.cursor = 'grabbing';
    setDrag({ word, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false, over: null });
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="block">
        <span className="sr-only">Text to tokenize</span>
        <textarea
          id="tokenizer-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          spellCheck={false}
          className="tape w-full resize-y rounded-2xl border border-line bg-white px-4 py-3 font-mono text-[15px] leading-relaxed shadow-sm outline-none focus:border-accent"
        />
      </label>

      <div>
        <p className="mb-1.5 text-[12px] text-muted">
          Word tray · drag a word onto a machine{held ? ', or click a machine to drop it' : ' (or click it, then click a machine)'}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {words.map((w) => (
            <button
              key={w}
              type="button"
              onPointerDown={startDrag(w)}
              onClick={() => hold(held === w ? null : w)}
              className={clsx(
                'word-chip rounded-lg border bg-white px-2.5 py-1 text-sm font-medium touch-none select-none',
                held === w ? 'border-accent ring-2 ring-accent/30' : 'border-line',
                drag?.moved && drag.word === w && 'opacity-40',
              )}
            >
              {w}
            </button>
          ))}
          {words.length === 0 && <span className="text-sm text-muted">Type something above.</span>}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {LANES.map((lane) => {
          const tokens = sim.analysis[lane.kind];
          const preview = drag?.over === lane.kind ? TOKENIZERS[lane.kind](drag.word) : null;
          const dropped = sim.inspectedTokens[lane.kind];
          const pieces = preview ?? dropped;
          const word = preview ? drag!.word : sim.inspected[lane.kind];
          return (
            <section
              key={lane.kind}
              data-lane={lane.kind}
              aria-label={`${lane.name} tokenizer`}
              onClick={() => held && drop(lane.kind, held)}
              className={clsx(
                'lane rounded-2xl border bg-white p-4 shadow-sm',
                drag?.over === lane.kind || (held && 'cursor-copy')
                  ? 'border-accent ring-4 ring-accent/15'
                  : 'border-line',
              )}
            >
              <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-display text-lg font-semibold">
                  {lane.name} <span className="text-[12px] font-normal text-muted">{lane.sub}</span>
                </h2>
                <p className="font-display text-2xl font-semibold tabular-nums">
                  {tokens.length}
                  <span className="ml-1 text-[12px] font-normal text-muted">{tokens.length === 1 ? 'token' : 'tokens'}</span>
                </p>
              </header>

              <div
                className={clsx(
                  'drop mt-3 flex min-h-[68px] flex-wrap items-center gap-2 rounded-xl border-2 border-dashed px-3 py-2',
                  preview ? 'border-accent bg-accent/5' : 'border-line',
                )}
              >
                {pieces && word ? (
                  <>
                    <span className="mr-1 text-[12px] text-muted">
                      “{word}” → {pieces.length} {pieces.length === 1 ? 'piece' : 'pieces'}
                    </span>
                    <span key={`${replayKey}-${word}`} className="flex flex-wrap gap-1.5">
                      {pieces.map((t, i) => (
                        <Chip key={i} token={t} i={i} big />
                      ))}
                    </span>
                  </>
                ) : (
                  <span className="text-[13px] text-muted">Drop a word here</span>
                )}
              </div>

              <div className="mt-3 flex max-h-40 flex-wrap gap-0.5 overflow-y-auto" aria-label={`${lane.name} tokens`}>
                {tokens.slice(0, 400).map((t, i) => (
                  <span key={i} className={clsx('contents', i >= contextLimit && '[&>*]:opacity-30')}>
                    {i === contextLimit && (
                      <span className="mx-1 self-stretch border-l-2 border-bad" title="The context window ends here" />
                    )}
                    <Chip token={t} i={i} />
                  </span>
                ))}
                {tokens.length > 400 && <span className="self-center px-1 text-[12px] text-muted">+{tokens.length - 400} more</span>}
              </div>

              <div className="mt-3">
                <ContextBar count={tokens.length} limit={contextLimit} />
              </div>
            </section>
          );
        })}
      </div>

      {drag?.moved && (
        <div
          className="pointer-events-none fixed top-0 left-0 z-50 rounded-lg border border-accent bg-white px-2.5 py-1 text-sm font-medium shadow-lg"
          style={{ transform: `translate(${drag.x + 8}px, ${drag.y + 8}px) rotate(-2deg)` }}
        >
          {drag.word}
        </div>
      )}
    </div>
  );
}

export function PresetPicker() {
  const { presetId, setPreset } = useTokenizerLab();
  return (
    <fieldset>
      <legend className="mb-1 text-[11px] font-semibold tracking-wider text-muted uppercase">Text</legend>
      <div className="flex flex-wrap gap-1 rounded-xl bg-paper p-1">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPreset(p.id)}
            className={clsx(
              'pressable rounded-lg px-2.5 py-1 text-[13px] font-medium',
              presetId === p.id ? 'bg-white shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Drag the handle (or use arrow keys once selected) to resize the context window. */
export function ContextDial() {
  const { contextLimit, setContext, selected, select } = useTokenizerLab();
  const track = useRef<HTMLDivElement>(null);
  const idx = CONTEXT_SIZES.indexOf(contextLimit as (typeof CONTEXT_SIZES)[number]);
  const setFromX = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const next = CONTEXT_SIZES[Math.round(t * (CONTEXT_SIZES.length - 1))]!;
    if (next !== contextLimit) setContext(next);
  };
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold tracking-wider text-muted uppercase">
        Context window <span className="font-normal normal-case">· {contextLimit} tokens</span>
      </p>
      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label="Context window size in tokens"
        aria-valuemin={CONTEXT_SIZES[0]}
        aria-valuemax={CONTEXT_SIZES[CONTEXT_SIZES.length - 1]}
        aria-valuenow={contextLimit}
        onFocus={() => select('context')}
        onBlur={() => select(null)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          e.currentTarget.focus();
          setFromX(e.clientX);
        }}
        onPointerMove={(e) => e.buttons === 1 && setFromX(e.clientX)}
        className={clsx(
          'dial relative h-9 w-52 cursor-grab touch-none rounded-xl bg-paper outline-none active:cursor-grabbing',
          selected === 'context' && 'ring-2 ring-accent/40',
        )}
      >
        <div className="absolute inset-x-4 top-1/2 h-1 -translate-y-1/2 rounded-full bg-line" />
        {CONTEXT_SIZES.map((n, i) => (
          <span
            key={n}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-muted tabular-nums"
            style={{ left: `calc(1rem + (100% - 2rem) * ${i / (CONTEXT_SIZES.length - 1)})`, marginTop: 12 }}
          >
            {n}
          </span>
        ))}
        <span
          className="dial-thumb absolute top-1/2 size-5 rounded-full border-2 border-white bg-accent shadow-md"
          style={{
            left: `calc(1rem + (100% - 2rem) * ${idx / (CONTEXT_SIZES.length - 1)})`,
            transform: 'translate(-50%, -80%)',
          }}
        />
      </div>
    </div>
  );
}
