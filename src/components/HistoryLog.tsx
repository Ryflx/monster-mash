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
  return d
    .toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase();
}

function buildBadges(entry: CompletedWorkout): { label: string; tone: 'rx' | 'scaled' }[] {
  const out: { label: string; tone: 'rx' | 'scaled' }[] = [];
  const rx = entry.rx ?? true;
  const tone: 'rx' | 'scaled' = rx ? 'rx' : 'scaled';
  if (rx) {
    out.push({ label: 'RX', tone: 'rx' });
  } else if (entry.scorePct != null) {
    out.push({ label: `${Math.round(entry.scorePct)}%`, tone: 'scaled' });
  } else {
    out.push({ label: 'SCALED', tone: 'scaled' });
  }
  if (!rx && entry.scaledWeight) {
    out.push({ label: entry.scaledWeight.toUpperCase(), tone });
  }
  if (entry.rounds != null) {
    const r =
      entry.extraReps != null && entry.extraReps > 0
        ? `${entry.rounds}+${entry.extraReps}`
        : `${entry.rounds}`;
    out.push({ label: `${r} RDS`, tone });
  }
  if (entry.timeSeconds != null) {
    out.push({ label: formatSecondsToTime(entry.timeSeconds), tone });
  }
  return out;
}

const StatCard: FC<{ value: number | string; label: string; accent?: 'monster' | 'slime' }> = ({
  value,
  label,
  accent,
}) => (
  <div
    className="flex-1 bg-pitch-2 border-2 border-smoke p-4 text-center"
    style={{ borderRadius: '8px', boxShadow: '3px 3px 0 0 var(--color-pitch)' }}
  >
    <div
      className="leading-none mb-1"
      style={{
        fontFamily: 'var(--font-display-2)',
        fontSize: '32px',
        color:
          accent === 'monster'
            ? 'var(--color-monster)'
            : accent === 'slime'
              ? 'var(--color-slime)'
              : 'var(--color-bone)',
      }}
    >
      {value}
    </div>
    <div
      className="uppercase text-bone-muted"
      style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: '10px',
        letterSpacing: '1.5px',
      }}
    >
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
        <div
          className="uppercase text-monster mb-3"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '40px',
            letterSpacing: '-1.5px',
            lineHeight: 0.9,
            textShadow: '3px 3px 0 var(--color-pitch), 3px 3px 0 0 var(--color-slime)',
          }}
        >
          NO<br />MASHES
          <br />YET
        </div>
        <p
          className="text-bone-3 mt-4 uppercase"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '11px',
            letterSpacing: '1.5px',
          }}
        >
          CHANGE THAT.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <StatCard value={history.length} label="Total" accent="monster" />
        <StatCard value={thisWeekCount} label="This week" accent="slime" />
        <StatCard value={thisMonthCount} label="This month" />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-[2px] bg-smoke" />
        <span
          className="uppercase text-bone-muted"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '10px',
            letterSpacing: '1.5px',
          }}
        >
          COMPLETED
        </span>
        <div className="flex-1 h-[2px] bg-smoke" />
      </div>

      <div className="space-y-3">
        {sorted.map((entry) => {
          const workout = workoutMap.get(entry.workoutId);
          const badges = buildBadges(entry);

          if (!workout) {
            return (
              <div
                key={entry.workoutId}
                className="bg-pitch-2 border-2 border-smoke p-4 flex items-center justify-between"
                style={{ borderRadius: '8px' }}
              >
                <div>
                  <p
                    className="text-bone-3"
                    style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13px' }}
                  >
                    Unknown workout
                  </p>
                  <p
                    className="uppercase text-bone-muted mt-0.5"
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '10px',
                      letterSpacing: '1.5px',
                    }}
                  >
                    {formatCompletedDate(entry.completedAt)}
                  </p>
                </div>
                <button
                  onClick={() => onUnmark(entry.workoutId)}
                  className="uppercase text-bone-muted hover:text-blood"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '11px',
                    letterSpacing: '1px',
                  }}
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
                <svg className="w-3 h-3 text-monster" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span
                  className="uppercase text-bone-muted"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '10px',
                    letterSpacing: '1.5px',
                  }}
                >
                  {formatCompletedDate(entry.completedAt)}
                </span>
                <div className="flex items-center gap-1 ml-auto">
                  {badges.map((b, i) => (
                    <span
                      key={i}
                      className={[
                        'px-2 py-0.5 uppercase border-2',
                        b.tone === 'rx'
                          ? 'bg-monster text-pitch border-pitch'
                          : 'bg-slime text-pitch border-pitch',
                      ].join(' ')}
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '10px',
                        letterSpacing: '0.5px',
                        borderRadius: '4px',
                      }}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
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
