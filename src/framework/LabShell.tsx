import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useProgress } from '../store/progressStore';
import { ControlPanel } from './ControlPanel';
import { ExplanationPanel } from './ExplanationPanel';
import { InspectPanel } from './InspectPanel';
import { LessonFlow } from './LessonFlow';
import { MissionList } from './MissionList';
import type { LabDefinition } from './types';

interface Props<S> {
  lab: LabDefinition<S> & { order: number };
  sim: S;
  scene: ReactNode;
  controls: Record<string, ReactNode>;
  step: number;
  onStep: (i: number) => void;
  /** Most recently touched mechanism, to highlight its explanation. */
  lastTouched: string | null;
  onReset: () => void;
  onReplay: () => void;
  onEscape?: () => void;
  onNudge?: (dir: -1 | 1) => void;
  onShowWhatHappens?: () => void;
}

const EMPTY: string[] = [];
const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && !!t.closest('input, textarea, select, [contenteditable="true"]');

export function LabShell<S>(props: Props<S>) {
  const { lab, sim, step, onStep } = props;
  const done = useProgress((s) => s.missions[lab.id] ?? EMPTY);
  const opened = useProgress((s) => s.explanations[lab.id] ?? EMPTY);
  const completeMission = useProgress((s) => s.completeMission);

  // Missions are detected from sim state, never self-reported.
  useEffect(() => {
    for (const m of lab.missions) if (m.isComplete(sim)) completeMission(lab.id, m.id);
  }, [lab, sim, completeMission]);

  const { onReset, onEscape, onNudge } = props;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape?.();
        if (isTyping(e.target)) (e.target as HTMLElement).blur();
        return;
      }
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === ' ' && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        if (step < lab.steps.length - 1 && !lab.steps[step]!.predict) onStep(step + 1);
      } else if (e.key === 'r' || e.key === 'R') {
        onReset();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        if (onNudge) (e.preventDefault(), onNudge(-1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        if (onNudge) (e.preventDefault(), onNudge(1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lab, step, onStep, onReset, onEscape, onNudge]);

  const current = lab.steps[step]!;
  const controls = current.controls
    .filter((id) => props.controls[id])
    .map((id) => ({ id, node: props.controls[id] }));
  const touched = props.lastTouched ? [...opened.filter((id) => id !== props.lastTouched), props.lastTouched] : opened;

  return (
    <div className="flex min-h-full flex-col lg:h-full">
      <header className="flex items-center gap-3 border-b border-line bg-paper/80 px-4 py-3 backdrop-blur md:px-6">
        <Link to="/" className="pressable btn" aria-label="Back to the map">
          ← Map
        </Link>
        <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">Lab {lab.order}</p>
        <h1 className="font-display text-xl font-semibold">{lab.title}</h1>
      </header>

      <div className="grid flex-1 gap-4 p-4 md:p-6 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4 lg:min-h-0">
          <div className="lg:hidden">
            <LessonFlow steps={lab.steps} index={step} sim={sim} onIndex={onStep} onShowWhatHappens={props.onShowWhatHappens} />
          </div>
          {/* Scene scrolls on its own so the controls below stay put and never cover it. */}
          <main className="min-w-0 flex-1 lg:-mx-2 lg:overflow-y-auto lg:px-2 lg:pb-2">
            {props.scene}
            <p className="mt-4 text-[13px] text-muted">
              <span className="font-semibold text-ink">Where this goes next: </span>
              {lab.bigPicture}
            </p>
          </main>
          <ControlPanel controls={controls} onReset={onReset} onReplay={props.onReplay} />
        </div>

        <aside className="flex min-w-0 flex-col gap-3 lg:overflow-y-auto">
          <MissionList
            missions={lab.missions}
            done={done}
            breakIt={{ hint: lab.breakIt.hint, broken: lab.breakIt.isBroken(sim) }}
          />
          <div className="hidden lg:block">
            <LessonFlow steps={lab.steps} index={step} sim={sim} onIndex={onStep} onShowWhatHappens={props.onShowWhatHappens} />
          </div>
          <ExplanationPanel explanations={lab.explanations} touched={touched} />
          <InspectPanel simplifications={lab.simplifications} forceOpen={current.kind === 'inspect'} />
        </aside>
      </div>
    </div>
  );
}
