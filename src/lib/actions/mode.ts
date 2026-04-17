'use server';

import { revalidatePath } from 'next/cache';
import { ensureUser, requireTeamMembership } from '@/lib/auth';
import { setModeCookie, type Mode } from '@/lib/mode';

export async function setMode(mode: Mode): Promise<void> {
  const user = await ensureUser();
  if (mode.kind === 'team') {
    await requireTeamMembership(user.id, mode.teamId);
  }
  await setModeCookie(mode);
  revalidatePath('/app');
  revalidatePath('/app/spin');
  revalidatePath('/app/history');
}
