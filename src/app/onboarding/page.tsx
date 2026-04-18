import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import OnboardingForm from './OnboardingForm';

export default async function OnboardingPage() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect('/sign-in');

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  if (existing[0]) redirect('/app');

  const clerk = await currentUser();
  const defaultName =
    clerk?.firstName ??
    clerk?.username ??
    clerk?.emailAddresses[0]?.emailAddress?.split('@')[0] ??
    '';

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div
        className="w-full max-w-md bg-pitch-2 border-2 border-smoke p-6 space-y-6"
        style={{ borderRadius: '8px', boxShadow: '6px 6px 0 0 var(--color-monster)' }}
      >
        <div>
          <h1
            className="uppercase text-monster"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '48px',
              letterSpacing: '-1.5px',
              lineHeight: 0.9,
              textShadow: '3px 3px 0 var(--color-pitch), 3px 3px 0 0 var(--color-slime)',
            }}
          >
            LETS<br />GO!
          </h1>
          <p
            className="text-bone-3 mt-4 uppercase"
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '1.5px',
            }}
          >
            Grab your crew. Mash out a monster. Get after it.
          </p>
        </div>
        <OnboardingForm defaultName={defaultName} />
      </div>
    </main>
  );
}
