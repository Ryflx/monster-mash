'use client';

import type { FC } from 'react';
import type { CompletedWorkout, Workout, CompletionLog } from '../types/workout';
import { formatSecondsToTime } from '../lib/time';
import WorkoutCard from './WorkoutCard';

interface HistoryLogProps {
  history: CompletedWorkout[];
  allWorkouts: Workout[];
  onUnmark: (id: string) => void;
}

function isThisWeek(isoString: string): boolean {
  const d = new Date(isoString);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return d >= startOfWeek;
}

function isThisMonth(isoString: string): boolean {
  const d = new Date(isoString);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function formatCompletedDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function buildBadges(entry: CompletedWorkout): string[] {
  const badges: string[] = [];
  const rx = entry.rx ?? true;
  if (rx) {
    badges.push('RX');
  } else if (entry.scorePct != null) {
    badges.push(`${Math.round(entry.scorePct)}%`);
  } else {
    badges.push('Scaled');
  }
  if (entry.rounds != null) {
    const r = entry.extraReps != null && entry.extraReps > 0
      ? `${entry.rounds}+${entry.extraReps}`
      : `${entry.rounds}`;
    badges.push(`${r} rds`);
  }
  if (entry.timeSeconds != null) {
    badges.push(formatSecondsToTime(entry.timeSeconds));
  }
  return badges;
}

const StatCard: FC<{ value: number | string; label: string; accent?: boolean }> = ({
  value,
  label,
  accent = false,
}) => (
  <div className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-center">
    <div
      className={`font-display text-3xl font-900 leading-none mb-1 ${
        accent ? 'text-[#E63946]' : 'text-white'
      }`}
    >
      {value}
    </div>
    <div className="font-display text-[10px] font-700 uppercase tracking-widest text-[#555]">
      {label}
    </div>
  </div>
);

const HistoryLog: FC<HistoryLogProps> = ({ history, allWorkouts, onUnmark }) => {
  const workoutMap = new Map(allWorkouts.map((w) => [w.id, w]));

  const sorted = [...history].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );

  const thisWeekCount = history.filter((h) => isThisWeek(h.completedAt)).length;
  const thisMonthCount = history.filter((h) => isThisMonth(h.completedAt)).length;

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">📋</div>
        <p className="font-display text-xl font-700 uppercase tracking-widest text-[#333]">
          No completed workouts yet
        </p>
        <p className="text-sm text-[#444] mt-2">
          Mark workouts complete to track your progress
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <StatCard value={history.length} label="Total" accent />
        <StatCard value={thisWeekCount} label="This week" />
        <StatCard value={thisMonthCount} label="This month" />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#2A2A2A]" />
        <span className="font-display text-[10px] font-700 uppercase tracking-widest text-[#555]">
          Completed workouts
        </span>
        <div className="flex-1 h-px bg-[#2A2A2A]" />
      </div>

      <div className="space-y-3">
        {sorted.map((entry) => {
          const workout = workoutMap.get(entry.workoutId);
          const badges = buildBadges(entry);

          if (!workout) {
            return (
              <div
                key={entry.workoutId}
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-display text-sm font-700 text-[#555]">
                    Unknown workout
                  </p>
                  <p className="font-display text-xs text-[#333] uppercase tracking-widest mt-0.5">
                    Completed {formatCompletedDate(entry.completedAt)}
                  </p>
                </div>
                <button
                  onClick={() => onUnmark(entry.workoutId)}
                  className="text-xs font-display font-700 uppercase tracking-widest text-[#555] hover:text-[#E63946] transition-colors"
                >
                  Remove
                </button>
              </div>
            );
          }

          const completion: CompletionLog = {
            rx: entry.rx ?? true,
            scaledWeight: entry.scaledWeight ?? null,
            timeSeconds: entry.timeSeconds ?? null,
            rounds: entry.rounds ?? null,
            extraReps: entry.extraReps ?? null,
            scorePct: entry.scorePct ?? null,
            variantsChosen: null,
            completedAt: entry.completedAt,
          };

          return (
            <div key={entry.workoutId} className="space-y-1">
              <div className="flex items-center gap-2 px-1 flex-wrap">
                <svg className="w-3 h-3 text-[#E63946]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-display text-[10px] font-700 uppercase tracking-widest text-[#555]">
                  Completed {formatCompletedDate(entry.completedAt)}
                </span>
                <span className="font-display text-[10px] font-800 uppercase tracking-widest text-[#F4A261] bg-[#F4A261]/10 px-2 py-0.5 rounded-full">
                  {badges.join(' · ')}
                </span>
              </div>
              <WorkoutCard
                workout={workout}
                completion={completion}
                onLog={() => {}}
                onUnmark={() => onUnmark(entry.workoutId)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryLog;
