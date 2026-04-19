'use client';

import { useMemo, useState, useEffect, useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import SpinWheel from '@/components/SpinWheel';
import MovementFilter from '@/components/MovementFilter';
import WorkoutCard from '@/components/WorkoutCard';
import { markComplete, unmarkComplete } from '@/lib/actions/completions';
import type { HydratedWorkout } from '@/lib/queries/workouts';
import type { Workout, CompletionInput, CompletionLog } from '@/types/workout';

function toLegacy(w: HydratedWorkout): Workout {
  return {
    id: w.id,
    date: w.date,
    title: w.title,
    sourceUrl: w.sourceUrl ?? '',
    segments: w.segments.map((s) => ({
      format: s.format,
      description: s.description,
      movements: s.movements.map((m) => ({
        name: m.name,
        reps: m.reps ?? undefined,
        weightKg: m.weightKg ?? undefined,
        weightOriginal: m.weightOriginal ?? undefined,
        equipment: m.equipment ?? undefined,
      })),
    })),
    movements: w.movementNames,
  };
}

type Props = { pool: HydratedWorkout[]; totalCount: number };
type OptAction =
  | { kind: 'log'; id: string; log: CompletionLog }
  | { kind: 'unmark'; id: string };

export default function TVSpinView({ pool, totalCount }: Props) {
  const legacy = useMemo(() => pool.map(toLegacy), [pool]);
  const [selectedMovements, setSelectedMovements] = useState<string[]>([]);
  const [canvasSize, setCanvasSize] = useState(340);
  const [isLandscape, setIsLandscape] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    function updateSize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const landscape = w > h;
      setIsLandscape(landscape);
      if (landscape) {
        // Left column is ~half width; height minus header (~48px) and filter (~60px) and button (~60px)
        const colW = Math.floor(w * 0.45);
        setCanvasSize(Math.max(200, Math.min(colW - 32, h - 160)));
      } else {
        setCanvasSize(Math.min(Math.floor(w - 40), 400));
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  const [, startTransition] = useTransition();

  const allMovements = useMemo(() => {
    const set = new Set<string>();
    pool.forEach((w) => w.movementNames.forEach((m) => set.add(m)));
    return Array.from(set).sort();
  }, [pool]);

  const filtered = useMemo(() => {
    if (selectedMovements.length === 0) return legacy;
    return legacy.filter((w) => {
      const wMovements = w.movements.map((m) => m.toLowerCase());
      return selectedMovements.every((m) =>
        wMovements.some((wm) => wm.includes(m.toLowerCase())),
      );
    });
  }, [legacy, selectedMovements]);

  const toggleMovement = (m: string) =>
    setSelectedMovements((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );

  const [completed, setCompleted] = useOptimistic(
    new Map<string, CompletionLog>(),
    (current: Map<string, CompletionLog>, action: OptAction) => {
      const next = new Map(current);
      if (action.kind === 'log') next.set(action.id, action.log);
      else next.delete(action.id);
      return next;
    },
  );

  const handleLog = (
    id: string,
    input: CompletionInput,
    preview: { scorePct: number | null; rx: boolean },
  ) => {
    startTransition(async () => {
      setCompleted({
        kind: 'log',
        id,
        log: {
          rx: preview.rx,
          scaledWeight: preview.rx ? null : input.scaledWeight?.trim() || null,
          timeSeconds: input.timeSeconds ?? null,
          rounds: input.rounds ?? null,
          extraReps: input.extraReps ?? null,
          scorePct: preview.scorePct,
          variantsChosen: input.variantsChosen,
          completedAt: new Date().toISOString(),
        },
      });
      await markComplete(id, input);
    });
  };

  const handleUnmark = (id: string) => {
    startTransition(async () => {
      setCompleted({ kind: 'unmark', id });
      await unmarkComplete(id);
    });
  };

  const excluded = totalCount - pool.length;

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      {/* ── Top bar ── */}
      <header
        className="flex items-center justify-between px-5 py-3 border-b-2 border-smoke flex-shrink-0"
        style={{ background: 'var(--color-pitch-2)' }}
      >
        <Link
          href="/app/spin"
          className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '11px',
            letterSpacing: '1px',
            color: 'var(--color-bone-3)',
            textTransform: 'uppercase',
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          SPIN
        </Link>

        <span
          className="uppercase tracking-widest"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '14px',
            color: 'var(--color-monster)',
            letterSpacing: '2px',
          }}
        >
          MONSTER MASH
        </span>

        <span
          className="px-2 py-0.5 uppercase"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '10px',
            letterSpacing: '1.5px',
            background: 'var(--color-slime)',
            color: 'var(--color-pitch)',
            borderRadius: '4px',
          }}
        >
          TV
        </span>
      </header>

      {/* ── Movement filter (portrait only — in landscape it moves into left col) ── */}
      {!isLandscape && allMovements.length > 0 && (
        <div className="flex-shrink-0 px-5 pt-3 pb-1">
          <MovementFilter
            movements={allMovements}
            selected={selectedMovements}
            onToggle={toggleMovement}
            onClear={() => setSelectedMovements([])}
          />
        </div>
      )}

      {isLandscape ? (
        /* ── LANDSCAPE: two columns ── */
        <div className="flex flex-1 overflow-hidden">
          {/* Left: wheel */}
          <div className="flex flex-col items-center justify-center flex-shrink-0 px-4 gap-2 border-r-2 border-smoke" style={{ width: '45%' }}>
            {allMovements.length > 0 && (
              <div className="w-full">
                <MovementFilter
                  movements={allMovements}
                  selected={selectedMovements}
                  onToggle={toggleMovement}
                  onClear={() => setSelectedMovements([])}
                />
              </div>
            )}
            <SpinWheel
              workouts={filtered}
              onSelect={(picks) => setSelectedWorkout(picks[0] ?? null)}
              getCompletion={(id) => completed.get(id) ?? null}
              onLog={handleLog}
              onUnmark={handleUnmark}
              canvasSize={canvasSize}
              hideResult
            />
            {excluded > 0 && (
              <p className="uppercase" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '1.5px', color: 'var(--color-bone-3)', opacity: 0.5 }}>
                {excluded} DONE
              </p>
            )}
          </div>

          {/* Right: selected workout */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {selectedWorkout ? (
              <div className="space-y-3 animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-[2px] bg-monster/30" />
                  <span className="uppercase text-monster" style={{ fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '1px' }}>
                    Today's WOD
                  </span>
                  <div className="flex-1 h-[2px] bg-monster/30" />
                </div>
                {/* Import WorkoutCard at top of file */}
                <WorkoutCard
                  workout={selectedWorkout}
                  completion={completed.get(selectedWorkout.id) ?? null}
                  onLog={(input, preview) => handleLog(selectedWorkout.id, input, preview)}
                  onUnmark={() => handleUnmark(selectedWorkout.id)}
                  defaultExpanded
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
                <span className="uppercase" style={{ fontFamily: 'var(--font-display)', fontSize: '14px', letterSpacing: '2px', color: 'var(--color-bone-3)' }}>
                  Spin to reveal
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── PORTRAIT: single column ── */
        <div className="flex flex-col items-center justify-center flex-1 overflow-y-auto pt-2 pb-2 gap-2">
          <SpinWheel
            workouts={filtered}
            onSelect={(picks) => setSelectedWorkout(picks[0] ?? null)}
            getCompletion={(id) => completed.get(id) ?? null}
            onLog={handleLog}
            onUnmark={handleUnmark}
            canvasSize={canvasSize}
          />
          {excluded > 0 && (
            <p className="uppercase" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '1.5px', color: 'var(--color-bone-3)', opacity: 0.6 }}>
              {excluded} DONE
            </p>
          )}
        </div>
      )}
    </div>
  );
}
