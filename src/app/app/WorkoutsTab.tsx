'use client';

import { useMemo, useState, useTransition, useOptimistic } from 'react';
import SearchBar from '@/components/SearchBar';
import MovementFilter from '@/components/MovementFilter';
import WorkoutList from '@/components/WorkoutList';
import { markComplete, unmarkComplete } from '@/lib/actions/completions';
import type { HydratedWorkout } from '@/lib/queries/workouts';
import type { Workout } from '@/types/workout';

type Props = {
  workouts: HydratedWorkout[];
  completedIds: string[];
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

export default function WorkoutsTab({ workouts, completedIds }: Props) {
  const [search, setSearch] = useState('');
  const [selectedMovements, setSelectedMovements] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(
    new Set(completedIds),
    (current: Set<string>, action: { kind: 'mark' | 'unmark'; id: string }) => {
      const next = new Set(current);
      if (action.kind === 'mark') next.add(action.id);
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

  const handleMark = (id: string) => {
    startTransition(async () => {
      setOptimisticCompleted({ kind: 'mark', id });
      await markComplete(id);
    });
  };

  const handleUnmark = (id: string) => {
    startTransition(async () => {
      setOptimisticCompleted({ kind: 'unmark', id });
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
        isCompleted={(id) => optimisticCompleted.has(id)}
        onMarkComplete={handleMark}
        onUnmark={handleUnmark}
      />
    </div>
  );
}
