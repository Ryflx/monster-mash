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
      <div className="w-full max-w-md bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-900 uppercase tracking-tight">
            <span className="text-[#E63946]">Welcome</span>
          </h1>
          <p className="text-sm text-[#888] mt-1">
            Pick a name and either create a team or join one with an invite code. You can
            also skip and track workouts solo.
          </p>
        </div>
        <OnboardingForm defaultName={defaultName} />
      </div>
    </main>
  );
}
