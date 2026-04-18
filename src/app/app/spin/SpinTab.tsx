'use client';

import { useMemo, useOptimistic, useTransition } from 'react';
import SpinWheel from '@/components/SpinWheel';
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
  const [, startTransition] = useTransition();
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
    preview: { scorePct: number; rx: boolean },
  ) => {
    startTransition(async () => {
      setCompleted({
        kind: 'log',
        id,
        log: {
          rx: preview.rx,
          scaledWeight: null,
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
        getCompletion={(id) => completed.get(id) ?? null}
        onLog={handleLog}
        onUnmark={handleUnmark}
      />
    </div>
  );
}
