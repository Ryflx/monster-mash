'use client';

import type { WorkoutBoard, LeaderboardEntry } from '@/lib/queries/leaderboard';
import { formatSecondsToTime } from '@/lib/time';

type Props = {
  boards: WorkoutBoard[];
  mode: 'solo' | 'team';
};

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d
    .toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    .toUpperCase();
}

function formatResult(e: LeaderboardEntry, isAmrap: boolean): string {
  if (isAmrap && e.rounds != null) {
    return e.extraReps != null && e.extraReps > 0
      ? `${e.rounds}+${e.extraReps}`
      : `${e.rounds}`;
  }
  if (e.timeSeconds != null) return formatSecondsToTime(e.timeSeconds);
  return '—';
}

function formatScore(e: LeaderboardEntry): string {
  if (e.rx) return 'RX';
  if (e.scorePct != null) return `${Math.round(e.scorePct)}%`;
  return 'SCALED';
}

export default function LeaderboardView({ boards, mode }: Props) {
  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div
          className="uppercase text-monster mb-1"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '40px',
            letterSpacing: '-1.5px',
            lineHeight: 0.9,
            textShadow: '3px 3px 0 var(--color-pitch), 3px 3px 0 0 var(--color-slime)',
          }}
        >
          NO<br />RANKINGS
        </div>
        <p
          className="text-bone-3 mt-6 max-w-xs uppercase"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '11px', letterSpacing: '1.5px' }}
        >
          {mode === 'team'
            ? 'Log as a team to climb the board.'
            : 'Log workouts solo to track your PRs.'}
        </p>
      </div>
    );
  }

  const totalEntries = boards.reduce((a, b) => a + b.entries.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <div
          className="uppercase text-monster"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '10px',
            letterSpacing: '2px',
          }}
        >
          Today's Monsters
        </div>
        <h1
          className="uppercase text-bone mt-1"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '48px',
            letterSpacing: '-1.5px',
            lineHeight: 0.9,
            textShadow: '3px 3px 0 var(--color-pitch), 3px 3px 0 0 var(--color-slime)',
          }}
        >
          BOARD
        </h1>
        <p
          className="uppercase text-bone-3 mt-2"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '16px' }}
        >
          {boards.length} WODS · {totalEntries} {totalEntries === 1 ? 'ENTRY' : 'ENTRIES'}
        </p>
      </div>

      <div className="space-y-4">
        {boards.map((b) => (
          <div
            key={b.workoutId}
            className="bg-pitch-2 border-2 border-smoke p-4 space-y-3"
            style={{ borderRadius: '8px', boxShadow: '4px 4px 0 0 var(--color-pitch)' }}
          >
            <div>
              <div
                className="uppercase text-monster"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '10px',
                  letterSpacing: '1.5px',
                }}
              >
                {formatDate(b.workoutDate)}
                {b.isAmrap ? ' · AMRAP' : ''}
              </div>
              <div
                className="uppercase text-bone leading-tight mt-0.5"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '16px',
                  letterSpacing: '-0.5px',
                }}
              >
                {b.workoutTitle}
              </div>
            </div>

            <div className="space-y-1.5">
              {b.entries.slice(0, 10).map((e, idx) => {
                const rank = idx + 1;
                const isTop = idx === 0;
                return (
                  <div
                    key={e.completionId}
                    className={[
                      'flex items-center gap-3 px-3 py-2.5 border-2 transition-all duration-[120ms]',
                      isTop
                        ? 'bg-pitch border-monster'
                        : 'bg-pitch border-smoke hover:border-bone-3',
                    ].join(' ')}
                    style={{
                      borderRadius: '6px',
                      boxShadow: isTop
                        ? '3px 3px 0 0 var(--color-monster)'
                        : '3px 3px 0 0 var(--color-pitch)',
                    }}
                  >
                    <div
                      className="flex-shrink-0 w-8 text-center"
                      style={{
                        fontFamily: 'var(--font-display-2)',
                        fontSize: '22px',
                        lineHeight: 1,
                        color: isTop ? 'var(--color-monster)' : 'var(--color-bone)',
                      }}
                    >
                      {String(rank).padStart(2, '0')}
                    </div>
                    <div
                      className="flex-1 min-w-0 uppercase truncate"
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        fontSize: '13px',
                        letterSpacing: '0.5px',
                        color: 'var(--color-bone)',
                      }}
                    >
                      {e.userDisplayName}
                    </div>
                    <span
                      className="flex-shrink-0 uppercase border-2 px-2 py-0.5"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '10px',
                        letterSpacing: '0.5px',
                        borderRadius: '4px',
                        background: e.rx ? 'var(--color-monster)' : 'var(--color-slime)',
                        color: 'var(--color-pitch)',
                        borderColor: 'var(--color-pitch)',
                      }}
                    >
                      {formatScore(e)}
                    </span>
                    <span
                      className="flex-shrink-0 w-20 text-right tabular-nums"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '20px',
                        color: 'var(--color-bone)',
                      }}
                    >
                      {formatResult(e, b.isAmrap)}
                    </span>
                  </div>
                );
              })}
              {b.entries.length > 10 && (
                <div
                  className="text-center pt-1 uppercase text-bone-muted"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '10px',
                    letterSpacing: '1.5px',
                  }}
                >
                  +{b.entries.length - 10} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
