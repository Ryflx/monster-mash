import { ensureUser } from '@/lib/auth';
import { getMode } from '@/lib/mode';
import { listAllWorkouts, getLatestCompletionsByWorkout } from '@/lib/queries/workouts';
import WorkoutsTab from './WorkoutsTab';

export default async function WorkoutsPage() {
  const user = await ensureUser();
  const mode = await getMode();
  const [workouts, completions] = await Promise.all([
    listAllWorkouts(),
    getLatestCompletionsByWorkout(user.id, mode),
  ]);

  return <WorkoutsTab workouts={workouts} completions={completions} />;
}
