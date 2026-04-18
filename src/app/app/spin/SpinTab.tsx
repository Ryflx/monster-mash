'use client';

import { useMemo, useOptimistic, useTransition } from 'react';
import SpinWheel from '@/components/SpinWheel';
import { markComplete, unmarkComplete } from '@/lib/actions/completions';
import type { HydratedWorkout } from '@/lib/queries/workouts';
import type { Workout } from '@/types/workout';

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

export default function SpinTab({ pool, totalCount }: Props) {
  const legacy = useMemo(() => pool.map(toLegacy), [pool]);
  const [, startTransition] = useTransition();
  const [completed, setCompleted] = useOptimistic(
    new Set<string>(),
    (set: Set<string>, action: { kind: 'mark' | 'unmark'; id: string }) => {
      const next = new Set(set);
      if (action.kind === 'mark') next.add(action.id);
      else next.delete(action.id);
      return next;
    },
  );

  const handleMark = (id: string) => {
    startTransition(async () => {
      setCompleted({ kind: 'mark', id });
      await markComplete(id);
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
        <h2 className="font-display text-2xl font-900 uppercase tracking-widest text-white mb-1">
          Spin the Wheel
        </h2>
        <p className="text-sm text-[#555]">
          {pool.length} workouts in the pool
          {excluded > 0 && <span className="text-[#444]"> · {excluded} already done</span>}
        </p>
      </div>
      <SpinWheel
        workouts={legacy}
        onSelect={() => {}}
        isCompleted={(id) => completed.has(id)}
        onMarkComplete={handleMark}
        onUnmark={handleUnmark}
      />
    </div>
  );
}
