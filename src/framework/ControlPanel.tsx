import type { ReactNode } from 'react';

interface Props {
  /** Already filtered to this step's controls (max 3). */
  controls: { id: string; node: ReactNode }[];
  onReset: () => void;
  onReplay: () => void;
}

export function ControlPanel({ controls, onReset, onReplay }: Props) {
  return (
    <section
      aria-label="Controls"
      className="flex flex-wrap items-end gap-3 self-start rounded-2xl border border-line bg-white p-3 shadow-sm"
    >
      {controls.slice(0, 3).map((c) => (
        <div key={c.id}>{c.node}</div>
      ))}
      <div className="flex gap-1.5">
        <button type="button" onClick={onReplay} className="pressable btn" title="Replay the last split">
          Replay
        </button>
        <button type="button" onClick={onReset} className="pressable btn" title="Reset (R)">
          Reset
        </button>
      </div>
    </section>
  );
}
