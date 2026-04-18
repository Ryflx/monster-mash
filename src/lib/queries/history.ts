import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { personalCompletions, teamCompletions, users } from '@/db/schema';

export async function getPersonalHistory(userId: number) {
  return db
    .select({
      id: personalCompletions.id,
      workoutId: personalCompletions.workoutId,
      completedAt: personalCompletions.completedAt,
      rx: personalCompletions.rx,
      scaledWeight: personalCompletions.scaledWeight,
      timeSeconds: personalCompletions.timeSeconds,
    })
    .from(personalCompletions)
    .where(eq(personalCompletions.userId, userId))
    .orderBy(desc(personalCompletions.completedAt));
}

export async function getTeamHistory(teamId: number) {
  return db
    .select({
      id: teamCompletions.id,
      workoutId: teamCompletions.workoutId,
      completedAt: teamCompletions.completedAt,
      notes: teamCompletions.notes,
      rx: teamCompletions.rx,
      scaledWeight: teamCompletions.scaledWeight,
      timeSeconds: teamCompletions.timeSeconds,
      loggedByName: users.displayName,
    })
    .from(teamCompletions)
    .leftJoin(users, eq(users.id, teamCompletions.loggedBy))
    .where(eq(teamCompletions.teamId, teamId))
    .orderBy(desc(teamCompletions.completedAt));
}
