import { redirect } from 'next/navigation';
import { getInternalUser } from '@/lib/auth';
import { listMyTeams } from '@/lib/actions/teams';
import { getMode } from '@/lib/mode';
import AppHeader from './AppHeader';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const internal = await getInternalUser();
  if (!internal) redirect('/onboarding');

  const teams = await listMyTeams();
  const mode = await getMode();
  const headerMode = mode.kind === 'solo' ? ('solo' as const) : { teamId: mode.teamId };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <AppHeader teams={teams.map((t) => ({ id: t.id, name: t.name }))} currentMode={headerMode} />
      <main className="px-4 py-5 max-w-2xl mx-auto">{children}</main>
    </div>
  );
}
