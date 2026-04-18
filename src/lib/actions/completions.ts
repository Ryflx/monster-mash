'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { personalCompletions, teamCompletions } from '@/db/schema';
import { ensureUser, requireTeamMembership } from '@/lib/auth';
import { getMode } from '@/lib/mode';

export async function markComplete(workoutId: string): Promise<void> {
  const user = await ensureUser();
  const mode = await getMode();

  if (mode.kind === 'solo') {
    await db.insert(personalCompletions).values({ userId: user.id, workoutId });
  } else {
    await requireTeamMembership(user.id, mode.teamId);
    await db.insert(teamCompletions).values({
      teamId: mode.teamId,
      workoutId,
      loggedBy: user.id,
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
