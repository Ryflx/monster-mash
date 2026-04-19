'use client';

import { useMemo, useState, useOptimistic, useTransition } from 'react';
import SpinWheel from '@/components/SpinWheel';
import MovementFilter from '@/components/MovementFilter';
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

export default function SpinTab({ pool, totalCount }: Props) {
  const legacy = useMemo(() => pool.map(toLegacy), [pool]);
  const [selectedMovements, setSelectedMovements] = useState<string[]>([]);
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
    setSelectedMovements((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
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
    <div className="space-y-6">
      <div className="text-center">
        <div
          className="uppercase text-monster mb-1"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '10px',
            letterSpacing: '2px',
          }}
        >
          PICK A MASH
        </div>
        <h2
          className="uppercase text-bone"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '40px',
            letterSpacing: '-1.5px',
            lineHeight: 0.9,
            textShadow: '3px 3px 0 var(--color-pitch), 3px 3px 0 0 var(--color-slime)',
          }}
        >
          SPIN IT
        </h2>
        <p
          className="uppercase text-bone-3 mt-2"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '15px' }}
        >
          {filtered.length} WODS IN THE POOL
          {excluded > 0 && <span className="text-bone-muted"> · {excluded} DONE</span>}
        </p>
      </div>
      {allMovements.length > 0 && (
        <MovementFilter
          movements={allMovements}
          selected={selectedMovements}
          onToggle={toggleMovement}
          onClear={() => setSelectedMovements([])}
        />
      )}
      <SpinWheel
        workouts={filtered}
        onSelect={() => {}}
        getCompletion={(id) => completed.get(id) ?? null}
        onLog={handleLog}
        onUnmark={handleUnmark}
      />
    </div>
  );
}
