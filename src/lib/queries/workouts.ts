import 'server-only';
import { asc, desc, eq, inArray, notInArray } from 'drizzle-orm';
import { db } from '@/db';
import { workouts, segments, movements, personalCompletions, teamCompletions } from '@/db/schema';
import type { Mode } from '@/lib/mode';

export type HydratedWorkout = {
  id: string;
  date: string;
  title: string;
  sourceUrl: string | null;
  segments: {
    format: string;
    description: string;
    movements: {
      name: string;
      reps: string | null;
      weightKg: { male: number; female: number } | null;
      weightOriginal: string | null;
      equipment: string | null;
    }[];
  }[];
  movementNames: string[];
};

type WorkoutRow = typeof workouts.$inferSelect;
type SegmentRow = typeof segments.$inferSelect;
type MovementRow = typeof movements.$inferSelect;

async function hydrate(rows: WorkoutRow[]): Promise<HydratedWorkout[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const segRows = await db
    .select()
    .from(segments)
    .where(inArray(segments.workoutId, ids))
    .orderBy(asc(segments.workoutId), asc(segments.position));

  const segIds = segRows.map((s) => s.id);
  const mvRows: MovementRow[] =
    segIds.length === 0
      ? []
      : await db
          .select()
          .from(movements)
          .where(inArray(movements.segmentId, segIds))
          .orderBy(asc(movements.segmentId), asc(movements.position));

  const mvBySeg = new Map<number, MovementRow[]>();
  for (const m of mvRows) {
    const arr = mvBySeg.get(m.segmentId) ?? [];
    arr.push(m);
    mvBySeg.set(m.segmentId, arr);
  }

  const segByWorkout = new Map<string, SegmentRow[]>();
  for (const s of segRows) {
    const arr = segByWorkout.get(s.workoutId) ?? [];
    arr.push(s);
    segByWorkout.set(s.workoutId, arr);
  }

  return rows.map((w) => {
    const ws = segByWorkout.get(w.id) ?? [];
    const hydratedSegments = ws.map((s) => {
      const mvs = mvBySeg.get(s.id) ?? [];
      return {
        format: s.format,
        description: s.description,
        movements: mvs.map((m) => ({
          name: m.name,
          reps: m.reps,
          weightKg:
            m.weightKgMale != null && m.weightKgFemale != null
              ? { male: m.weightKgMale, female: m.weightKgFemale }
              : null,
          weightOriginal: m.weightOriginal,
          equipment: m.equipment,
        })),
      };
    });
    const movementNames = Array.from(
      new Set(hydratedSegments.flatMap((s) => s.movements.map((m) => m.name))),
    ).sort();
    return {
      id: w.id,
      date: w.date,
      title: w.title,
      sourceUrl: w.sourceUrl,
      segments: hydratedSegments,
      movementNames,
    };
  });
}

export async function listAllWorkouts(): Promise<HydratedWorkout[]> {
  const rows = await db.select().from(workouts).orderBy(desc(workouts.date));
  return hydrate(rows);
}

export async function getSpinPool(userId: number, mode: Mode): Promise<HydratedWorkout[]> {
  const excluded = new Set<string>();

  const personal = await db
    .select({ workoutId: personalCompletions.workoutId })
    .from(personalCompletions)
    .where(eq(personalCompletions.userId, userId));
  for (const r of personal) excluded.add(r.workoutId);

  if (mode.kind === 'team') {
    const team = await db
      .select({ workoutId: teamCompletions.workoutId })
      .from(teamCompletions)
      .where(eq(teamCompletions.teamId, mode.teamId));
    for (const r of team) excluded.add(r.workoutId);
  }

  const excludeList = Array.from(excluded);
  const rows =
    excludeList.length === 0
      ? await db.select().from(workouts).orderBy(desc(workouts.date))
      : await db
          .select()
          .from(workouts)
          .where(notInArray(workouts.id, excludeList))
          .orderBy(desc(workouts.date));

  return hydrate(rows);
}

export async function getCompletedWorkoutIds(userId: number, mode: Mode): Promise<Set<string>> {
  const ids = new Set<string>();

  const personal = await db
    .select({ workoutId: personalCompletions.workoutId })
    .from(personalCompletions)
    .where(eq(personalCompletions.userId, userId));
  for (const r of personal) ids.add(r.workoutId);

  if (mode.kind === 'team') {
    const team = await db
      .select({ workoutId: teamCompletions.workoutId })
      .from(teamCompletions)
      .where(eq(teamCompletions.teamId, mode.teamId));
    for (const r of team) ids.add(r.workoutId);
  }

  return ids;
}
