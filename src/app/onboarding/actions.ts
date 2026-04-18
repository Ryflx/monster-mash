'use server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { createTeam, joinTeamByCode } from '@/lib/actions/teams';

type Input = {
  displayName: string;
  choice: 'solo' | 'create' | 'join';
  teamName: string;
  inviteCode: string;
};

export async function completeOnboarding(input: Input): Promise<void> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error('Not signed in');
  if (!input.displayName) throw new Error('Display name required');

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(users)
      .set({ displayName: input.displayName })
      .where(eq(users.clerkUserId, clerkUserId));
  } else {
    await db.insert(users).values({ clerkUserId, displayName: input.displayName });
  }

  if (input.choice === 'create') {
    await createTeam(input.teamName);
  } else if (input.choice === 'join') {
    await joinTeamByCode(input.inviteCode);
  }
}
