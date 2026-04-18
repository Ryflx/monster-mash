'use client';

import { useMemo, useState, useTransition, useOptimistic } from 'react';
import SearchBar from '@/components/SearchBar';
import MovementFilter from '@/components/MovementFilter';
import WorkoutList from '@/components/WorkoutList';
import { markComplete, unmarkComplete } from '@/lib/actions/completions';
import type { HydratedWorkout, LatestCompletion } from '@/lib/queries/workouts';
import type { Workout, CompletionInput, CompletionLog } from '@/types/workout';

type Props = {
  workouts: HydratedWorkout[];
  completions: Record<string, LatestCompletion>;
};

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

type OptAction =
  | { kind: 'log'; id: string; log: CompletionLog }
  | { kind: 'unmark'; id: string };

export default function WorkoutsTab({ workouts, completions }: Props) {
  const [search, setSearch] = useState('');
  const [selectedMovements, setSelectedMovements] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  const initialMap = useMemo(() => {
    const m = new Map<string, CompletionLog>();
    for (const [id, c] of Object.entries(completions)) {
      m.set(id, {
        rx: c.rx,
        scaledWeight: c.scaledWeight,
        timeSeconds: c.timeSeconds,
        completedAt: c.completedAt,
      });
    }
    return m;
  }, [completions]);

  const [optimistic, applyOptimistic] = useOptimistic(
    initialMap,
    (current: Map<string, CompletionLog>, action: OptAction) => {
      const next = new Map(current);
      if (action.kind === 'log') next.set(action.id, action.log);
      else next.delete(action.id);
      return next;
    },
  );

  const legacy = useMemo(() => workouts.map(toLegacy), [workouts]);
  const allMovements = useMemo(() => {
    const set = new Set<string>();
    workouts.forEach((w) => w.movementNames.forEach((m) => set.add(m)));
    return Array.from(set).sort();
  }, [workouts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return legacy.filter((w) => {
      if (q) {
        const inTitle = w.title.toLowerCase().includes(q);
        const inSegments = w.segments.some((s) => s.description.toLowerCase().includes(q));
        if (!inTitle && !inSegments) return false;
      }
      if (selectedMovements.length > 0) {
        const wMovements = w.movements.map((m) => m.toLowerCase());
        const allMatch = selectedMovements.every((m) =>
          wMovements.some((wm) => wm.includes(m.toLowerCase())),
        );
        if (!allMatch) return false;
      }
      return true;
    });
  }, [search, selectedMovements, legacy]);

  const handleLog = (id: string, input: CompletionInput) => {
    startTransition(async () => {
      applyOptimistic({
        kind: 'log',
        id,
        log: {
          rx: input.rx,
          scaledWeight: input.rx ? null : input.scaledWeight ?? null,
          timeSeconds: input.timeSeconds ?? null,
          completedAt: new Date().toISOString(),
        },
      });
      await markComplete(id, input);
    });
  };

  const handleUnmark = (id: string) => {
    startTransition(async () => {
      applyOptimistic({ kind: 'unmark', id });
      await unmarkComplete(id);
    });
  };

  const toggleMovement = (m: string) =>
    setSelectedMovements((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={setSearch} />
      {allMovements.length > 0 && (
        <MovementFilter
          movements={allMovements}
          selected={selectedMovements}
          onToggle={toggleMovement}
          onClear={() => setSelectedMovements([])}
        />
      )}
      <WorkoutList
        workouts={filtered}
        getCompletion={(id) => optimistic.get(id) ?? null}
        onLog={handleLog}
        onUnmark={handleUnmark}
      />
    </div>
  );
}
