import { redirect } from 'next/navigation';
import { getInternalUser } from '@/lib/auth';

export default async function TVLayout({ children }: { children: React.ReactNode }) {
  const internal = await getInternalUser();
  if (!internal) redirect('/onboarding');

  return (
    <div className="h-dvh overflow-hidden bg-pitch text-bone">{children}</div>
  );
}
