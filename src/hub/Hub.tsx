import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import clsx from 'clsx';
import { LABS } from '../labs/registry';
import { useProgress } from '../store/progressStore';
import { layoutLabs } from './layout';
import { WORST_DONE, WORST_LABS } from './worstCase';

const worstCase = import.meta.env.DEV && new URLSearchParams(window.location.search).get('data') === 'worst';

// three.js is most of the bundle; the list on the right works before it arrives.
const HubScene = lazy(() => import('./HubScene').then((m) => ({ default: m.HubScene })));

/** If WebGL is unavailable the list on the right is still a complete menu. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="flex h-full items-center justify-center p-6 text-sm text-muted">
        The 3D map couldn't start in this browser. Use the list instead.
      </div>
    ) : (
      this.props.children
    );
  }
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export function Hub() {
  const navigate = useNavigate();
  const missions = useProgress((s) => s.missions);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const labs = useMemo(() => [...(worstCase ? WORST_LABS : LABS)].sort((a, b) => a.order - b.order), []);
  const narrow = useMediaQuery('(max-width: 767px)');
  // On phones the prerequisite flow runs top→bottom instead of left→right.
  const positions = useMemo(
    () => layoutLabs(labs).map((p) => (narrow ? { ...p, x: -p.y, y: -p.x } : p)),
    [labs, narrow],
  );
  const done = useMemo(
    () =>
      Object.fromEntries(
        labs.map((l) => [l.id, worstCase ? (WORST_DONE[l.id] ?? 0) : (missions[l.id]?.length ?? 0)]),
      ),
    [labs, missions],
  );
  const built = labs.filter((l) => l.status === 'ready').length;
  const totalDone = Object.values(done).reduce((a, b) => a + b, 0);

  const open = useCallback((id: string) => navigate(`/lab/${id}`), [navigate]);

  // Keyboard: arrows move through labs in build order, Enter opens, Esc deselects.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return;
      const idx = selected ? labs.findIndex((l) => l.id === selected) : -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected(labs[Math.min(idx + 1, labs.length - 1)]!.id);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected(labs[Math.max(idx - 1, 0)]!.id);
      } else if (e.key === 'Enter' && selected && !(e.target instanceof HTMLButtonElement)) {
        open(selected);
      } else if (e.key === 'Escape') {
        setSelected(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [labs, selected, open]);

  return (
    <div className="flex h-full flex-col md:flex-row">
      <section className="relative flex flex-1 flex-col">
        <header className="pointer-events-none absolute inset-x-0 top-0 z-10 p-5">
          <h1 className="text-lg font-semibold">AI Learning Lab</h1>
          <p className="text-sm text-muted">
            {built} of {labs.length} labs built · {totalDone} {totalDone === 1 ? 'mission' : 'missions'} done
          </p>
        </header>
        <div className="relative h-[560px] md:h-auto md:flex-1">
        <SceneBoundary>
          <Suspense fallback={null}>
            <HubScene
            labs={labs}
            positions={positions}
            done={done}
            hovered={hovered}
            selected={selected}
            onHover={setHovered}
            onOpen={open}
            />
          </Suspense>
        </SceneBoundary>
        </div>
        <p className="pointer-events-none inset-x-0 bottom-0 p-5 text-center text-xs text-muted md:absolute">
          Text becomes tokens → weights are trained → attention mixes context → inference picks the
          next word → agents call it → serving pays for it.
        </p>
      </section>

      <nav aria-label="Labs" className="border-line bg-white/60 p-4 md:w-80 md:border-l">
        <ol className="flex flex-col gap-2">
          {labs.map((lab) => {
            const active = hovered === lab.id || selected === lab.id;
            return (
              <li key={lab.id}>
                <button
                  type="button"
                  onClick={() => open(lab.id)}
                  onMouseEnter={() => setHovered(lab.id)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setSelected(lab.id)}
                  className={clsx(
                    'pressable w-full rounded-xl border px-3 py-2.5 text-left',
                    active ? 'border-accent bg-white' : 'border-line bg-white/70',
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 text-sm font-semibold">
                      <span className="mr-1.5 text-muted tabular-nums">{lab.order}</span>
                      {lab.title}
                    </span>
                    <span className="shrink-0 text-[11px] whitespace-nowrap text-muted tabular-nums">
                      {lab.status === 'ready' ? `${done[lab.id]}/${lab.missionCount}` : 'not built'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{lab.blurb}</p>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 text-[11px] text-muted">Arrow keys to move · Enter to open · Esc to clear</p>
      </nav>
    </div>
  );
}
