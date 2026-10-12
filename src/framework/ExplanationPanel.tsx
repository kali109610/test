import type { Explanation } from './types';

interface Props {
  explanations: Explanation[];
  /** Mechanism ids the user has touched, most recent last. */
  touched: string[];
}

/** Discovery before explanation: each card stays locked until its mechanism is touched. */
export function ExplanationPanel({ explanations, touched }: Props) {
  if (touched.length === 0) {
    return (
      <section aria-label="Explanations" className="rounded-2xl border border-dashed border-line p-4 text-[13px] text-muted">
        Touch something first. Explanations unlock as you use each part.
      </section>
    );
  }
  const latest = touched[touched.length - 1];
  return (
    <section aria-label="Explanations" className="flex flex-col gap-2">
      {explanations.map((e) => {
        const unlocked = touched.includes(e.id);
        return (
          <article
            key={e.id}
            className={
              unlocked
                ? 'explain-in rounded-2xl border bg-white p-4 shadow-sm ' + (e.id === latest ? 'border-accent' : 'border-line')
                : 'rounded-2xl border border-dashed border-line px-4 py-2.5 text-[13px] text-muted'
            }
          >
            {unlocked ? (
              <>
                <h3 className="font-display text-base font-semibold">{e.name}</h3>
                <p className="mt-1 text-[13px] leading-snug">{e.truth}</p>
                {e.detail && <p className="mt-2 text-[12px] leading-snug text-muted">{e.detail}</p>}
              </>
            ) : (
              <>🔒 {e.name}</>
            )}
          </article>
        );
      })}
    </section>
  );
}
