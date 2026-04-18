'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { completeOnboarding } from './actions';

type Choice = 'create' | 'join' | 'solo';

const labelCls = 'uppercase text-bone-3';
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: '10px',
  letterSpacing: '1.5px',
};
const inputCls =
  'mt-1 w-full bg-pitch border-2 border-smoke text-bone focus:border-monster outline-none px-3 py-2';
const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  fontSize: '14px',
  borderRadius: '6px',
};

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

  const chipBase =
    'flex-1 px-3 py-2 uppercase border-2 press-collapse transition-all duration-[120ms]';
  const chipIdle = 'bg-transparent border-smoke text-bone-3 hover:border-bone-3 hover:text-bone';
  const chipActive: Record<Choice, string> = {
    solo: 'bg-monster border-pitch text-pitch',
    create: 'bg-slime border-pitch text-pitch',
    join: 'bg-bone border-pitch text-pitch',
  };
  const chipStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: '11px',
    letterSpacing: '0.5px',
    borderRadius: '6px',
  };

  const disabled =
    isPending ||
    !name.trim() ||
    (choice === 'create' && !teamName.trim()) ||
    (choice === 'join' && !inviteCode.trim());

  return (
    <div className="space-y-5">
      <label className="block">
        <span className={labelCls} style={labelStyle}>
          Display name
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          style={inputStyle}
          placeholder="Liam"
        />
      </label>

      <div className="flex gap-2">
        <button
          onClick={() => setChoice('solo')}
          className={`${chipBase} ${choice === 'solo' ? chipActive.solo : chipIdle}`}
          style={{
            ...chipStyle,
            boxShadow: choice === 'solo' ? '2px 2px 0 0 var(--color-pitch)' : undefined,
          }}
        >
          Solo
        </button>
        <button
          onClick={() => setChoice('create')}
          className={`${chipBase} ${choice === 'create' ? chipActive.create : chipIdle}`}
          style={{
            ...chipStyle,
            boxShadow: choice === 'create' ? '2px 2px 0 0 var(--color-pitch)' : undefined,
          }}
        >
          Create
        </button>
        <button
          onClick={() => setChoice('join')}
          className={`${chipBase} ${choice === 'join' ? chipActive.join : chipIdle}`}
          style={{
            ...chipStyle,
            boxShadow: choice === 'join' ? '2px 2px 0 0 var(--color-pitch)' : undefined,
          }}
        >
          Join
        </button>
      </div>

      {choice === 'create' && (
        <label className="block">
          <span className={labelCls} style={labelStyle}>
            Crew name
          </span>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className={inputCls}
            style={inputStyle}
            placeholder="The Monsters"
          />
        </label>
      )}

      {choice === 'join' && (
        <label className="block">
          <span className={labelCls} style={labelStyle}>
            Invite code
          </span>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            className={inputCls}
            style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: '16px' }}
            placeholder="MMASH-XXXXX"
          />
        </label>
      )}

      {error && (
        <p className="text-blood uppercase" style={labelStyle}>
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={disabled}
        className="w-full py-3 bg-monster border-2 border-pitch text-pitch uppercase disabled:opacity-30 disabled:cursor-not-allowed press-collapse"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '14px',
          letterSpacing: '0.5px',
          borderRadius: '6px',
          boxShadow: '4px 4px 0 0 var(--color-pitch)',
        }}
      >
        {isPending ? 'FINISHING…' : "LET'S GO"}
      </button>
    </div>
  );
}
