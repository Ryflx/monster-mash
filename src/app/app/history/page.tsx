import { ensureUser } from '@/lib/auth';
import { getMode } from '@/lib/mode';
import { listAllWorkouts } from '@/lib/queries/workouts';
import { getPersonalHistory, getTeamHistory } from '@/lib/queries/history';
import HistoryTab from './HistoryTab';

export default async function HistoryPage() {
  const user = await ensureUser();
  const mode = await getMode();
  const all = await listAllWorkouts();

  if (mode.kind === 'solo') {
    const history = await getPersonalHistory(user.id);
    return (
      <HistoryTab
        workouts={all}
        entries={history.map((h) => ({
          id: String(h.id),
          workoutId: h.workoutId,
          completedAt: h.completedAt.toISOString(),
          label: 'Solo',
        }))}
        mode="solo"
      />
    );
  }

  const history = await getTeamHistory(mode.teamId);
  return (
    <HistoryTab
      workouts={all}
      entries={history.map((h) => ({
        id: String(h.id),
        workoutId: h.workoutId,
        completedAt: h.completedAt.toISOString(),
        label: h.loggedByName ?? 'Team',
        notes: h.notes ?? undefined,
      }))}
      mode="team"
    />
  );
}
