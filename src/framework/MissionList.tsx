import clsx from 'clsx';
import type { Mission } from './types';

interface Props<S> {
  missions: Mission<S>[];
  done: string[];
  breakIt: { hint: string; broken: boolean };
}

export function MissionList<S>({ missions, done, breakIt }: Props<S>) {
  return (
    <section aria-label="Missions" className="w-full rounded-2xl border border-line bg-white/90 p-3 shadow-sm backdrop-blur">
      <h2 className="mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">Missions</h2>
      <ul className="flex flex-col gap-1.5">
        {missions.map((m) => {
          const isDone = done.includes(m.id);
          return (
            <li key={m.id} className="flex gap-2 text-[13px] leading-snug">
              <span
                aria-hidden
                className={clsx(
                  'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border text-[10px] transition-colors duration-200',
                  isDone ? 'border-ok bg-ok text-white' : 'border-line',
                )}
              >
                {isDone ? '✓' : ''}
              </span>
              <span className={clsx(isDone && 'text-muted line-through decoration-ok/60')}>
                {m.text}
                <span className="sr-only">{isDone ? ' (done)' : ''}</span>
              </span>
            </li>
          );
        })}
        <li className="mt-1 flex gap-2 border-t border-line pt-2 text-[13px] leading-snug">
          <span
            aria-hidden
            className={clsx(
              'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border text-[10px]',
              breakIt.broken ? 'border-bad bg-bad text-white' : 'border-bad/50 text-bad',
            )}
          >
            !
          </span>
          <span>
            <span className="font-semibold text-bad">Break it: </span>
            {breakIt.hint}
          </span>
        </li>
      </ul>
    </section>
  );
}
