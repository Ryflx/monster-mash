'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { teams, teamMembers } from '@/db/schema';
import { ensureUser } from '@/lib/auth';
import { generateInviteCode } from '@/lib/invite-code';
import { setModeCookie } from '@/lib/mode';

export async function createTeam(name: string): Promise<{ id: number; inviteCode: string }> {
  const user = await ensureUser();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Team name is required');

  let inviteCode = generateInviteCode();
  for (let i = 0; i < 5; i++) {
    const clash = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.inviteCode, inviteCode))
      .limit(1);
    if (!clash[0]) break;
    inviteCode = generateInviteCode();
  }

  const [team] = await db
    .insert(teams)
    .values({ name: trimmed, inviteCode, createdBy: user.id })
    .returning();

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: user.id,
    role: 'owner',
  });

  await setModeCookie({ kind: 'team', teamId: team.id });
  revalidatePath('/app/teams');
  return { id: team.id, inviteCode };
}

export async function joinTeamByCode(code: string): Promise<{ id: number; name: string }> {
  const user = await ensureUser();
  const normalised = code.trim().toUpperCase();

  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.inviteCode, normalised))
    .limit(1);
  if (!team) throw new Error('Invite code not found');

  const existing = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, user.id)))
    .limit(1);

  if (!existing[0]) {
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: user.id,
      role: 'member',
    });
  }

  await setModeCookie({ kind: 'team', teamId: team.id });
  revalidatePath('/app/teams');
  return { id: team.id, name: team.name };
}

export async function listMyTeams(): Promise<{ id: number; name: string; inviteCode: string; role: string }[]> {
  const user = await ensureUser();
  return db
    .select({
      id: teams.id,
      name: teams.name,
      inviteCode: teams.inviteCode,
      role: teamMembers.role,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userId, user.id));
}
