'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTeam, joinTeamByCode } from '@/lib/actions/teams';

type Team = { id: number; name: string; inviteCode: string; role: string };

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
        <h2 className="font-display text-lg font-800 uppercase tracking-widest text-white mb-3">
          Your teams
        </h2>
        {teams.length === 0 ? (
          <p className="text-sm text-[#555]">No teams yet. Create one or join with a code below.</p>
        ) : (
          <div className="space-y-2">
            {teams.map((t) => (
              <div key={t.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-display font-800 text-white">{t.name}</div>
                  <div className="font-display text-[10px] font-700 uppercase tracking-widest text-[#555] mt-0.5">
                    {t.role}
                  </div>
                </div>
                <div className="font-mono text-xs text-[#F4A261] bg-[#F4A261]/10 px-3 py-1.5 rounded-lg select-all">
                  {t.inviteCode}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
        <h3 className="font-display text-sm font-800 uppercase tracking-widest text-white">
          Create a team
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="The Monsters"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:border-[#E63946] outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={isPending || !newName.trim()}
            className="px-4 py-2 rounded-lg bg-[#E63946] text-white font-display font-800 uppercase tracking-widest text-xs disabled:opacity-30"
          >
            Create
          </button>
        </div>
      </section>

      <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
        <h3 className="font-display text-sm font-800 uppercase tracking-widest text-white">
          Join a team
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="MMASH-XXXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="flex-1 bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:border-[#E63946] outline-none font-mono"
          />
          <button
            onClick={handleJoin}
            disabled={isPending || !code.trim()}
            className="px-4 py-2 rounded-lg bg-[#F4A261] text-[#0D0D0D] font-display font-800 uppercase tracking-widest text-xs disabled:opacity-30"
          >
            Join
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-[#E63946]">{error}</p>}
    </div>
  );
}
