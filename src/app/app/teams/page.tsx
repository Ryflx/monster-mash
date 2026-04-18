import { listMyTeams } from '@/lib/actions/teams';
import TeamsPanel from './TeamsPanel';

export default async function TeamsPage() {
  const teams = await listMyTeams();
  return <TeamsPanel teams={teams} />;
}
