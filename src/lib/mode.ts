import 'server-only';
import { cookies } from 'next/headers';

export type Mode = { kind: 'solo' } | { kind: 'team'; teamId: number };

const COOKIE_NAME = 'mm_mode';

export async function getMode(): Promise<Mode> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw || raw === 'solo') return { kind: 'solo' };
  if (raw.startsWith('team:')) {
    const teamId = Number(raw.slice(5));
    if (Number.isFinite(teamId)) return { kind: 'team', teamId };
  }
  return { kind: 'solo' };
}

export async function setModeCookie(mode: Mode): Promise<void> {
  const jar = await cookies();
  const value = mode.kind === 'solo' ? 'solo' : `team:${mode.teamId}`;
  jar.set(COOKIE_NAME, value, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}
