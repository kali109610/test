import { useState } from 'react';
import clsx from 'clsx';

interface Props {
  simplifications: string[];
  forceOpen?: boolean;
}

/** "What's simplified here" — required on every lab. Will also hold the Anatomy figure. */
export function InspectPanel({ simplifications, forceOpen }: Props) {
  const [open, setOpen] = useState(false);
  const isOpen = open || !!forceOpen;
  return (
    <section aria-label="Inspect" className="rounded-2xl border border-line bg-white/90 shadow-sm">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
      >
        What's simplified here
        <span aria-hidden className={clsx('text-muted transition-transform duration-200', isOpen && 'rotate-180')}>
          ▾
        </span>
      </button>
      {isOpen && (
        <ul className="flex list-disc flex-col gap-1.5 px-4 pb-4 pl-8 text-[13px] leading-snug text-ink/80">
          {simplifications.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
