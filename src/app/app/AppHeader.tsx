'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { UserButton } from '@clerk/nextjs';
import { setMode } from '@/lib/actions/mode';

type Team = { id: number; name: string };
type Props = {
  teams: Team[];
  currentMode: 'solo' | { teamId: number };
};

const TABS: { href: string; label: string; icon: string }[] = [
  { href: '/app', label: 'Today', icon: 'home' },
  { href: '/app/spin', label: 'Spin', icon: 'calendar' },
  { href: '/app/history', label: 'History', icon: 'flag' },
  { href: '/app/leaderboard', label: 'Board', icon: 'trophy' },
  { href: '/app/teams', label: 'Crew', icon: 'users' },
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
    <header className="sticky top-0 z-50 bg-pitch border-b-[3px] border-monster relative">
      {/* Hype bar */}
      <div className="bg-pitch border-b-2 border-monster/40 px-4 py-2 flex items-center justify-between">
        <span
          className="uppercase tracking-[0.2em] text-monster vhs-flicker"
          style={{ fontFamily: 'var(--font-display)', fontSize: '11px' }}
        >
          Monster Mash
        </span>
        <span
          className="text-slime uppercase tracking-[0.15em]"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}
        >
          ● ALL HYPE
        </span>
      </div>

      {/* Wordmark row */}
      <div className="flex items-end justify-between px-4 pt-3 pb-2 gap-3">
        <Link
          href="/app"
          className="leading-none block"
          aria-label="Monster Mash home"
        >
          <span
            className="block uppercase text-monster"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              letterSpacing: '-1.5px',
              lineHeight: 0.9,
              textShadow: '2px 2px 0 var(--color-pitch), 2px 2px 0 0 var(--color-slime)',
            }}
          >
            MONSTER
          </span>
          <span
            className="block uppercase text-bone"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              letterSpacing: '-1.5px',
              lineHeight: 0.9,
              marginTop: '2px',
            }}
          >
            MASH
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <select
            value={selectValue}
            onChange={handleModeChange}
            disabled={isPending}
            className="bg-pitch-2 border-2 border-bone text-bone uppercase rounded-[6px] px-2 py-1.5 disabled:opacity-50"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              letterSpacing: '0.5px',
            }}
          >
            <option value="solo">Solo</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8 border-2 border-monster rounded-[6px]',
              },
            }}
          />
        </div>
      </div>

      {/* Tab nav */}
      <nav className="grid grid-cols-5 gap-1 px-2 pb-2 pt-1">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                'flex flex-col items-center justify-center gap-1 py-2 rounded-[6px] border-2 transition-all duration-[120ms] press-collapse',
                isActive
                  ? 'bg-monster border-pitch text-pitch'
                  : 'bg-transparent border-smoke text-bone-3 hover:text-bone hover:border-bone-3',
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              <Image
                src={`/brand/icons/${tab.icon}.svg`}
                alt=""
                width={18}
                height={18}
                className={isActive ? '' : 'opacity-70'}
                style={{
                  filter: isActive
                    ? 'brightness(0)'
                    : 'brightness(0) invert(1) opacity(0.75)',
                }}
              />
              <span
                className="uppercase"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '9px',
                  letterSpacing: '1.2px',
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
