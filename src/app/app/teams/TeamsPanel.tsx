'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTeam, joinTeamByCode } from '@/lib/actions/teams';

type Team = { id: number; name: string; inviteCode: string; role: string };

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display-2)',
  fontSize: '24px',
  letterSpacing: '-0.5px',
};
const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '13px',
  letterSpacing: '0.5px',
};
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: '10px',
  letterSpacing: '1.5px',
};
const inputCls =
  'flex-1 bg-pitch border-2 border-smoke text-bone focus:border-monster outline-none px-3 py-2';

export default function TeamsPanel({ teams }: { teams: Team[] }) {
  const [newName, setNewName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      try {
        await createTeam(newName);
        setNewName('');
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const handleJoin = () => {
    setError(null);
    startTransition(async () => {
      try {
        await joinTeamByCode(code);
        setCode('');
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="uppercase text-bone mb-3" style={headingStyle}>
          THE PACK
        </h2>
        {teams.length === 0 ? (
          <p
            className="text-bone-3 uppercase"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '11px', letterSpacing: '1px' }}
          >
            No crew yet. Create one or join with a code below.
          </p>
        ) : (
          <div className="space-y-2">
            {teams.map((t) => (
              <div
                key={t.id}
                className="bg-pitch-2 border-2 border-smoke p-4 flex items-center justify-between"
                style={{ borderRadius: '8px', boxShadow: '3px 3px 0 0 var(--color-pitch)' }}
              >
                <div>
                  <div
                    className="uppercase text-bone"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '14px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    className="uppercase text-bone-muted mt-0.5"
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 700,
                      fontSize: '10px',
                      letterSpacing: '1.5px',
                    }}
                  >
                    {t.role}
                  </div>
                </div>
                <div
                  className="text-monster bg-monster/10 border-2 border-monster/40 px-3 py-1.5 select-all"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '16px',
                    letterSpacing: '1px',
                    borderRadius: '6px',
                  }}
                >
                  {t.inviteCode}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section
        className="bg-pitch-2 border-2 border-smoke p-4 space-y-3"
        style={{ borderRadius: '8px', boxShadow: '3px 3px 0 0 var(--color-pitch)' }}
      >
        <h3 className="uppercase text-bone" style={sectionHeadingStyle}>
          Create a crew
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="THE MONSTERS"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className={inputCls}
            style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '14px', borderRadius: '6px' }}
          />
          <button
            onClick={handleCreate}
            disabled={isPending || !newName.trim()}
            className="px-4 py-2 bg-monster border-2 border-pitch text-pitch uppercase disabled:opacity-30 press-collapse"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              letterSpacing: '0.5px',
              borderRadius: '6px',
              boxShadow: '3px 3px 0 0 var(--color-pitch)',
            }}
          >
            Create
          </button>
        </div>
      </section>

      <section
        className="bg-pitch-2 border-2 border-smoke p-4 space-y-3"
        style={{ borderRadius: '8px', boxShadow: '3px 3px 0 0 var(--color-pitch)' }}
      >
        <h3 className="uppercase text-bone" style={sectionHeadingStyle}>
          Join a crew
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="MMASH-XXXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className={inputCls}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', letterSpacing: '1px', borderRadius: '6px' }}
          />
          <button
            onClick={handleJoin}
            disabled={isPending || !code.trim()}
            className="px-4 py-2 bg-slime border-2 border-pitch text-pitch uppercase disabled:opacity-30 press-collapse"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              letterSpacing: '0.5px',
              borderRadius: '6px',
              boxShadow: '3px 3px 0 0 var(--color-pitch)',
            }}
          >
            Join
          </button>
        </div>
      </section>

      {error && (
        <p className="text-blood uppercase" style={labelStyle}>
          {error}
        </p>
      )}
    </div>
  );
}
