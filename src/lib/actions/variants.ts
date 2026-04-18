'use server';

import { inArray, asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  segments,
  movements,
  canonicalMovements,
  movementVariants,
  workouts,
} from '@/db/schema';
import { ensureUser } from '@/lib/auth';
import type { CanonicalMovementForPicker, WorkoutVariantsPayload } from '@/types/workout';

const AMRAP_PATTERNS = [/amrap/i, /as\s+many\s+rounds/i, /as\s+many\s+reps/i];

export async function loadWorkoutVariants(workoutId: string): Promise<WorkoutVariantsPayload> {
  await ensureUser();

  const segRows = await db
    .select({ id: segments.id, format: segments.format })
    .from(segments)
    .where(eq(segments.workoutId, workoutId));

  if (segRows.length === 0) {
    return { workoutId, canonicals: [], isAmrap: false };
  }

  const isAmrap = segRows.some((s) => AMRAP_PATTERNS.some((r) => r.test(s.format)));

  const segIds = segRows.map((s) => s.id);
  const mvRows = await db
    .select({
      id: movements.id,
      canonicalId: movements.canonicalId,
    })
    .from(movements)
    .where(inArray(movements.segmentId, segIds));

  const canonicalIdSet = new Set<number>();
  for (const m of mvRows) {
    if (m.canonicalId != null) canonicalIdSet.add(m.canonicalId);
  }

  if (canonicalIdSet.size === 0) {
    return { workoutId, canonicals: [], isAmrap };
  }

  const canonicalIds = Array.from(canonicalIdSet);

  const canonRows = await db
    .select()
    .from(canonicalMovements)
    .where(inArray(canonicalMovements.id, canonicalIds));

  const variantRows = await db
    .select()
    .from(movementVariants)
    .where(inArray(movementVariants.canonicalId, canonicalIds))
    .orderBy(asc(movementVariants.canonicalId), asc(movementVariants.sortOrder));

  const variantsByCanonical = new Map<number, typeof variantRows>();
  for (const v of variantRows) {
    const arr = variantsByCanonical.get(v.canonicalId) ?? [];
    arr.push(v);
    variantsByCanonical.set(v.canonicalId, arr);
  }

  const canonicals: CanonicalMovementForPicker[] = canonRows
    .map((c) => ({
      canonicalId: c.id,
      canonicalName: c.name,
      category: c.category,
      variants: (variantsByCanonical.get(c.id) ?? []).map((v) => ({
        id: v.id,
        name: v.name,
        tier: v.tier,
        points: v.points,
        isRx: v.isRx,
        sortOrder: v.sortOrder,
      })),
    }))
    .sort((a, b) => a.canonicalName.localeCompare(b.canonicalName));

  return { workoutId, canonicals, isAmrap };
}
