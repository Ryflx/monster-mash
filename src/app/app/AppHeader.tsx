'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { UserButton } from '@clerk/nextjs';
import { setMode } from '@/lib/actions/mode';

type Team = { id: number; name: string };
type Props = {
  teams: Team[];
  currentMode: 'solo' | { teamId: number };
};

const TABS = [
  { href: '/app', label: 'Workouts' },
  { href: '/app/spin', label: 'Spin' },
  { href: '/app/history', label: 'History' },
  { href: '/app/teams', label: 'Teams' },
];

export default function AppHeader({ teams, currentMode }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    startTransition(async () => {
      if (value === 'solo') {
        await setMode({ kind: 'solo' });
      } else {
        await setMode({ kind: 'team', teamId: Number(value) });
      }
      router.refresh();
    });
  };

  const selectValue = currentMode === 'solo' ? 'solo' : String(currentMode.teamId);

  return (
    <header className="sticky top-0 z-50 bg-[#0D0D0D] border-b border-[#2A2A2A]">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-baseline gap-2">
          <h1 className="font-display text-3xl font-900 tracking-tight leading-none">
            <span className="text-[#E63946]">MONSTER</span>
            <span className="text-white ml-2">MASH</span>
          </h1>
          <span className="text-[#F4A261] text-xl leading-none" aria-hidden>⚡</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectValue}
            onChange={handleModeChange}
            disabled={isPending}
            className="bg-[#1A1A1A] border border-[#2A2A2A] text-white font-display text-xs font-700 uppercase tracking-widest rounded-md px-2 py-1"
          >
            <option value="solo">Solo</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <UserButton />
        </div>
      </div>

      <nav className="flex px-4">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                'relative py-3 mr-6 font-display text-sm font-700 uppercase tracking-widest transition-colors duration-150',
                isActive ? 'text-white' : 'text-[#555] hover:text-[#888]',
              ].join(' ')}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#E63946] to-[#F4A261] rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
