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
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatResult(e: LeaderboardEntry, isAmrap: boolean): string {
  if (isAmrap && e.rounds != null) {
    return e.extraReps != null && e.extraReps > 0
      ? `${e.rounds}+${e.extraReps} rds`
      : `${e.rounds} rds`;
  }
  if (e.timeSeconds != null) return formatSecondsToTime(e.timeSeconds);
  return '—';
}

function formatScore(e: LeaderboardEntry): string {
  if (e.rx) return 'RX';
  if (e.scorePct != null) return `${Math.round(e.scorePct)}%`;
  return 'Scaled';
}

const MEDAL = ['🥇', '🥈', '🥉'];

export default function LeaderboardView({ boards, mode }: Props) {
  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">🏆</div>
        <p className="font-display text-xl font-700 uppercase tracking-widest text-[#333]">
          No rankings yet
        </p>
        <p className="text-sm text-[#444] mt-2 max-w-xs">
          {mode === 'team'
            ? 'Log workouts as a team to see who tops the board.'
            : 'Log workouts solo to track your PRs per WOD.'}
        </p>
      </div>
    );
  }

  const totalEntries = boards.reduce((a, b) => a + b.entries.length, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-800 uppercase tracking-widest text-white">
            {mode === 'team' ? 'Team Leaderboard' : 'Your PRs'}
          </h2>
          <p className="font-display text-[10px] font-700 uppercase tracking-widest text-[#555] mt-0.5">
            {boards.length} workouts · {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {boards.map((b) => (
          <div
            key={b.workoutId}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 space-y-3"
          >
            <div>
              <div className="font-display text-[10px] font-700 uppercase tracking-widest text-[#555]">
                {formatDate(b.workoutDate)}{b.isAmrap ? ' · AMRAP' : ''}
              </div>
              <div className="font-display text-base font-800 uppercase tracking-tight text-white leading-tight mt-0.5">
                {b.workoutTitle}
              </div>
            </div>

            <div className="space-y-1.5">
              {b.entries.slice(0, 10).map((e, idx) => (
                <div
                  key={e.completionId}
                  className={[
                    'flex items-center justify-between gap-2 px-3 py-2 rounded-lg',
                    idx === 0 ? 'bg-[#E63946]/10 border border-[#E63946]/20' : 'bg-[#0D0D0D]',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-display text-sm font-800 text-[#888] w-6 text-center flex-shrink-0">
                      {idx < 3 ? MEDAL[idx] : `${idx + 1}`}
                    </span>
                    <span className="font-display text-sm font-700 text-white truncate">
                      {e.userDisplayName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={[
                        'font-display text-[10px] font-800 uppercase tracking-widest px-2 py-0.5 rounded-full',
                        e.rx
                          ? 'text-[#E63946] bg-[#E63946]/10'
                          : 'text-[#F4A261] bg-[#F4A261]/10',
                      ].join(' ')}
                    >
                      {formatScore(e)}
                    </span>
                    <span className="font-display text-sm font-800 text-white font-mono w-16 text-right">
                      {formatResult(e, b.isAmrap)}
                    </span>
                  </div>
                </div>
              ))}
              {b.entries.length > 10 && (
                <div className="text-xs text-[#555] text-center pt-1">
                  +{b.entries.length - 10} more entries
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
