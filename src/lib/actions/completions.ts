'use server';

import { and, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import {
  personalCompletions,
  teamCompletions,
  segments,
  movements,
  canonicalMovements,
  movementVariants,
} from '@/db/schema';
import { ensureUser, requireTeamMembership } from '@/lib/auth';
import { getMode } from '@/lib/mode';
import { computeScore } from '@/lib/scoring';
import type { CanonicalMovementForPicker, CompletionInput } from '@/types/workout';

async function loadCanonicalsForWorkout(
  workoutId: string,
): Promise<CanonicalMovementForPicker[]> {
  const segRows = await db
    .select({ id: segments.id })
    .from(segments)
    .where(eq(segments.workoutId, workoutId));
  if (segRows.length === 0) return [];

  const mvRows = await db
    .select({ canonicalId: movements.canonicalId })
    .from(movements)
    .where(inArray(movements.segmentId, segRows.map((s) => s.id)));

  const canonicalIdSet = new Set<number>();
  for (const m of mvRows) if (m.canonicalId != null) canonicalIdSet.add(m.canonicalId);
  if (canonicalIdSet.size === 0) return [];

  const canonicalIds = Array.from(canonicalIdSet);

  const canonRows = await db
    .select()
    .from(canonicalMovements)
    .where(inArray(canonicalMovements.id, canonicalIds));

  const variantRows = await db
    .select()
    .from(movementVariants)
    .where(inArray(movementVariants.canonicalId, canonicalIds));

  const variantsByCanonical = new Map<number, typeof variantRows>();
  for (const v of variantRows) {
    const arr = variantsByCanonical.get(v.canonicalId) ?? [];
    arr.push(v);
    variantsByCanonical.set(v.canonicalId, arr);
  }

  return canonRows.map((c) => ({
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
  }));
}

export async function markComplete(
  workoutId: string,
  input: CompletionInput,
): Promise<void> {
  const user = await ensureUser();
  const mode = await getMode();

  const canonicals = await loadCanonicalsForWorkout(workoutId);

  let rx: boolean;
  let scorePct: number | null;
  if (canonicals.length === 0) {
    rx = input.rx ?? true;
    scorePct = rx ? 100 : null;
  } else {
    const score = computeScore(canonicals, input.variantsChosen ?? {});
    rx = score.rx;
    scorePct = score.scorePct;
  }

  const scaledWeightTrimmed = input.scaledWeight?.trim() || null;

  const values = {
    rx,
    scaledWeight: rx ? null : scaledWeightTrimmed,
    timeSeconds: input.timeSeconds ?? null,
    rounds: input.rounds ?? null,
    extraReps: input.extraReps ?? null,
    scorePct,
    variantsChosen: input.variantsChosen ?? {},
  };

  if (mode.kind === 'solo') {
    await db.insert(personalCompletions).values({
      userId: user.id,
      workoutId,
      ...values,
    });
  } else {
    await requireTeamMembership(user.id, mode.teamId);
    await db.insert(teamCompletions).values({
      teamId: mode.teamId,
      workoutId,
      loggedBy: user.id,
      ...values,
    });
  }

  revalidatePath('/app');
  revalidatePath('/app/spin');
  revalidatePath('/app/history');
}

export async function unmarkComplete(workoutId: string): Promise<void> {
  const user = await ensureUser();
  const mode = await getMode();

  if (mode.kind === 'solo') {
    await db
      .delete(personalCompletions)
      .where(
        and(
          eq(personalCompletions.userId, user.id),
          eq(personalCompletions.workoutId, workoutId),
        ),
      );
  } else {
    await requireTeamMembership(user.id, mode.teamId);
    await db
      .delete(teamCompletions)
      .where(
        and(
          eq(teamCompletions.teamId, mode.teamId),
          eq(teamCompletions.workoutId, workoutId),
        ),
      );
  }

  revalidatePath('/app');
  revalidatePath('/app/spin');
  revalidatePath('/app/history');
}
