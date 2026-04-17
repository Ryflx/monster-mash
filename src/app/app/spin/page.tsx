import { ensureUser } from '@/lib/auth';
import { getMode } from '@/lib/mode';
import { getSpinPool, listAllWorkouts } from '@/lib/queries/workouts';
import SpinTab from './SpinTab';

export default async function SpinPage() {
  const user = await ensureUser();
  const mode = await getMode();
  const [pool, all] = await Promise.all([getSpinPool(user.id, mode), listAllWorkouts()]);
  return <SpinTab pool={pool} totalCount={all.length} />;
}
