import { ensureUser } from '@/lib/auth';
import { getMode } from '@/lib/mode';
import { listAllWorkouts, getCompletedWorkoutIds } from '@/lib/queries/workouts';
import WorkoutsTab from './WorkoutsTab';

export default async function WorkoutsPage() {
  const user = await ensureUser();
  const mode = await getMode();
  const [workouts, completedIds] = await Promise.all([
    listAllWorkouts(),
    getCompletedWorkoutIds(user.id, mode),
  ]);

  return <WorkoutsTab workouts={workouts} completedIds={Array.from(completedIds)} />;
}
