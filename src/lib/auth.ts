import 'server-only';
import { auth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { cache } from 'react';
import { db } from '@/db';
import { users, teamMembers } from '@/db/schema';

export const getInternalUser = cache(async () => {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  return existing[0] ?? null;
});

export async function ensureUser(): Promise<{ id: number; displayName: string }> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error('Not signed in');

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (existing[0]) return { id: existing[0].id, displayName: existing[0].displayName };

  const clerk = await clerkCurrentUser();
  const displayName =
    clerk?.firstName ??
    clerk?.username ??
    clerk?.emailAddresses[0]?.emailAddress ??
    'Monster';

  const [row] = await db
    .insert(users)
    .values({ clerkUserId, displayName })
    .returning();

  return { id: row.id, displayName: row.displayName };
}

export async function requireTeamMembership(userId: number, teamId: number) {
  const rows = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)))
    .limit(1);

  if (!rows[0]) throw new Error('Not a member of this team');
}
