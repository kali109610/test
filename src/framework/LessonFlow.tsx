import { useState } from 'react';
import clsx from 'clsx';
import type { LessonStep } from './types';

interface Props<S> {
  steps: LessonStep<S>[];
  index: number;
  sim: S;
  onIndex: (i: number) => void;
  /** Called on a wrong prediction so the lab can show what actually happens. */
  onShowWhatHappens?: () => void;
}

const KIND_LABEL: Record<LessonStep<unknown>['kind'], string> = {
  observe: 'Observe',
  predict: 'Predict',
  interact: 'Interact',
  discover: 'Discover',
  understand: 'Understand',
  inspect: 'Inspect',
  apply: 'Apply',
  recall: 'Recall',
};

export function LessonFlow<S>({ steps, index, sim, onIndex, onShowWhatHappens }: Props<S>) {
  const step = steps[index]!;
  const [picked, setPicked] = useState<{ step: number; choice: number; right: boolean } | null>(null);
  const [revealed, setRevealed] = useState<number | null>(null);
  const pick = picked?.step === index ? picked : null;
  const needsAnswer = !!step.predict && !pick?.right;

  const choose = (choice: number) => {
    const right = step.predict!.correct(sim) === choice;
    setPicked({ step: index, choice, right });
    if (!right) onShowWhatHappens?.();
  };

  return (
    <section aria-label="Lesson" className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-wider text-accent uppercase">
          {index + 1}/{steps.length} · {KIND_LABEL[step.kind]}
        </p>
        <ol className="flex gap-1" aria-hidden>
          {steps.map((_, i) => (
            <li key={i} className={clsx('h-1 w-3 rounded-full', i <= index ? 'bg-accent' : 'bg-line')} />
          ))}
        </ol>
      </div>
      <p className="mt-2 font-display text-[17px] leading-snug font-medium text-balance">{step.instruction}</p>

      {step.predict && (
        <div className="mt-3 flex flex-wrap gap-2">
          {step.predict.choices.map((c, i) => (
            <button
              key={c}
              type="button"
              onClick={() => choose(i)}
              className={clsx(
                'pressable rounded-lg border px-3 py-1.5 text-sm font-medium',
                pick?.choice === i ? (pick.right ? 'border-ok bg-ok/10' : 'border-bad bg-bad/10') : 'border-line',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      {pick && (
        <p className="mt-2 text-[13px]" role="status">
          {pick.right ? 'Yes. That is what the tokenizer did.' : 'Not quite. Look at what happened in the GPT-4o row, then try again.'}
        </p>
      )}

      {step.answer && (
        <div className="mt-3">
          {revealed === index ? (
            <p className="rounded-lg bg-paper p-3 text-[13px] leading-snug">{step.answer}</p>
          ) : (
            <button type="button" className="pressable btn" onClick={() => setRevealed(index)}>
              Say it out loud, then check
            </button>
          )}
        </div>
      )}

      <div className="mt-4 flex justify-between">
        <button type="button" className="pressable btn" disabled={index === 0} onClick={() => onIndex(index - 1)}>
          Back
        </button>
        <button
          type="button"
          className="pressable btn btn-primary"
          disabled={index === steps.length - 1 || needsAnswer}
          onClick={() => onIndex(index + 1)}
          title="Next (Space)"
        >
          Next
        </button>
      </div>
    </section>
  );
}
