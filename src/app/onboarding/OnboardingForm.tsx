'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { completeOnboarding } from './actions';

type Choice = 'create' | 'join' | 'solo';

export default function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [name, setName] = useState(defaultName);
  const [choice, setChoice] = useState<Choice>('solo');
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      try {
        await completeOnboarding({
          displayName: name.trim(),
          choice,
          teamName: teamName.trim(),
          inviteCode: inviteCode.trim(),
        });
        router.push('/app');
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const btnBase =
    'px-4 py-2 rounded-lg font-display font-700 uppercase tracking-widest text-xs border transition-colors';
  const btnActive = 'bg-[#E63946] border-[#E63946] text-white';
  const btnIdle = 'bg-transparent border-[#2A2A2A] text-[#888] hover:border-[#E63946]/40';

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="font-display text-[10px] font-700 uppercase tracking-widest text-[#888]">
          Display name
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:border-[#E63946] outline-none"
          placeholder="Liam"
        />
      </label>

      <div className="flex gap-2">
        <button onClick={() => setChoice('solo')} className={`${btnBase} ${choice === 'solo' ? btnActive : btnIdle}`}>Solo</button>
        <button onClick={() => setChoice('create')} className={`${btnBase} ${choice === 'create' ? btnActive : btnIdle}`}>Create team</button>
        <button onClick={() => setChoice('join')} className={`${btnBase} ${choice === 'join' ? btnActive : btnIdle}`}>Join team</button>
      </div>

      {choice === 'create' && (
        <label className="block">
          <span className="font-display text-[10px] font-700 uppercase tracking-widest text-[#888]">
            Team name
          </span>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="mt-1 w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:border-[#E63946] outline-none"
            placeholder="The Monsters"
          />
        </label>
      )}

      {choice === 'join' && (
        <label className="block">
          <span className="font-display text-[10px] font-700 uppercase tracking-widest text-[#888]">
            Invite code
          </span>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            className="mt-1 w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:border-[#E63946] outline-none"
            placeholder="MMASH-XXXXX"
          />
        </label>
      )}

      {error && <p className="text-sm text-[#E63946]">{error}</p>}

      <button
        onClick={submit}
        disabled={isPending || !name.trim() || (choice === 'create' && !teamName.trim()) || (choice === 'join' && !inviteCode.trim())}
        className="w-full py-3 rounded-lg bg-[#E63946] text-white font-display font-900 uppercase tracking-widest text-sm disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {isPending ? 'Finishing...' : 'Get started'}
      </button>
    </div>
  );
}
