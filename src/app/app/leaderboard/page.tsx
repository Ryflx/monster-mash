import { ensureUser } from '@/lib/auth';
import { getMode } from '@/lib/mode';
import { getPersonalLeaderboard, getTeamLeaderboard } from '@/lib/queries/leaderboard';
import LeaderboardView from './LeaderboardView';

export default async function LeaderboardPage() {
  const user = await ensureUser();
  const mode = await getMode();

  const boards =
    mode.kind === 'team'
      ? await getTeamLeaderboard(mode.teamId)
      : await getPersonalLeaderboard(user.id);

  return <LeaderboardView boards={boards} mode={mode.kind} />;
}
