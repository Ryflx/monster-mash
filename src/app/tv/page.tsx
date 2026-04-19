import { ensureUser } from '@/lib/auth';
import { getMode } from '@/lib/mode';
import { getSpinPool, listAllWorkouts } from '@/lib/queries/workouts';
import TVSpinView from './TVSpinView';

export default async function TVPage() {
  const user = await ensureUser();
  const mode = await getMode();
  const [pool, all] = await Promise.all([getSpinPool(user.id, mode), listAllWorkouts()]);
  return <TVSpinView pool={pool} totalCount={all.length} />;
}
