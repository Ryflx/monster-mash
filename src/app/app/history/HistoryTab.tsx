'use client';

import { useMemo, useTransition } from 'react';
import HistoryLog from '@/components/HistoryLog';
import { unmarkComplete } from '@/lib/actions/completions';
import type { HydratedWorkout } from '@/lib/queries/workouts';
import type { Workout, CompletedWorkout } from '@/types/workout';

type Entry = {
  id: string;
  workoutId: string;
  completedAt: string;
  rx: boolean;
  scaledWeight: string | null;
  timeSeconds: number | null;
  rounds: number | null;
  extraReps: number | null;
  scorePct: number | null;
  label: string;
  notes?: string;
};

type Props = {
  workouts: HydratedWorkout[];
  entries: Entry[];
  mode: 'solo' | 'team';
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

export default function HistoryTab({ workouts, entries, mode }: Props) {
  const legacy = useMemo(() => workouts.map(toLegacy), [workouts]);
  const [, startTransition] = useTransition();

  const history: CompletedWorkout[] = entries.map((e) => ({
    workoutId: e.workoutId,
    completedAt: e.completedAt,
    rx: e.rx,
    scaledWeight: e.scaledWeight,
    timeSeconds: e.timeSeconds,
    rounds: e.rounds,
    extraReps: e.extraReps,
    scorePct: e.scorePct,
  }));

  const handleUnmark = (workoutId: string) => {
    startTransition(async () => {
      await unmarkComplete(workoutId);
    });
  };

  return (
    <div className="space-y-4">
      <div className="font-display text-[10px] font-700 uppercase tracking-widest text-[#888]">
        {mode === 'solo' ? 'Your personal history' : 'Team session log'}
      </div>
      <HistoryLog history={history} allWorkouts={legacy} onUnmark={handleUnmark} />
    </div>
  );
}
