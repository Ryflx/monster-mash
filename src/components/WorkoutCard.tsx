'use client';

import { useState, type FC, type MouseEvent } from 'react';
import type {
  Workout,
  Segment,
  CompletionLog,
  CompletionInput,
} from '../types/workout';
import { formatWeight } from '../utils/converter';
import { formatSecondsToTime } from '../lib/time';
import LogWorkoutForm from './LogWorkoutForm';

interface WorkoutCardProps {
  workout: Workout;
  completion: CompletionLog | null;
  onLog: (input: CompletionInput, preview: { scorePct: number | null; rx: boolean }) => void;
  onUnmark: () => void;
  defaultExpanded?: boolean;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d
    .toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase();
}

const SegmentBlock: FC<{ segment: Segment }> = ({ segment }) => (
  <div className="space-y-2">
    <span
      className="inline-block uppercase text-monster bg-monster/10 border-2 border-monster/30 px-2 py-0.5"
      style={{ fontFamily: 'var(--font-display)', fontSize: '10px', letterSpacing: '1px', borderRadius: '4px' }}
    >
      {segment.format}
    </span>
    <p className="text-bone-3 leading-relaxed whitespace-pre-line text-[13px]" style={{ fontFamily: 'var(--font-body)' }}>
      {segment.description}
    </p>
    {segment.movements.some((mv) => mv.reps || mv.weightKg || mv.equipment) && (
      <ul className="space-y-1 pt-1">
        {segment.movements.map((mv, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px]">
            <span className="text-monster mt-1 text-[10px]">▸</span>
            <span className="text-bone font-bold">
              {mv.reps && <span className="text-slime mr-1">{mv.reps}</span>}
              {mv.name}
              {mv.weightKg && (
                <span className="text-bone-muted ml-1 text-[11px]">
                  ({formatWeight(mv.weightKg)})
                </span>
              )}
              {mv.equipment && (
                <span className="text-bone-muted ml-1 text-[11px]">· {mv.equipment}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

function buildDoneBadges(completion: CompletionLog): { label: string; tone: 'rx' | 'scaled' }[] {
  const out: { label: string; tone: 'rx' | 'scaled' }[] = [];
  const tone: 'rx' | 'scaled' = completion.rx ? 'rx' : 'scaled';
  if (completion.rx) {
    out.push({ label: 'RX', tone: 'rx' });
  } else if (completion.scorePct != null) {
    out.push({ label: `${Math.round(completion.scorePct)}%`, tone: 'scaled' });
  } else {
    out.push({ label: 'SCALED', tone: 'scaled' });
  }
  if (!completion.rx && completion.scaledWeight) {
    out.push({ label: completion.scaledWeight.toUpperCase(), tone });
  }
  if (completion.rounds != null) {
    const r =
      completion.extraReps != null && completion.extraReps > 0
        ? `${completion.rounds}+${completion.extraReps}`
        : `${completion.rounds}`;
    out.push({ label: `${r} RDS`, tone });
  }
  if (completion.timeSeconds != null) {
    out.push({ label: formatSecondsToTime(completion.timeSeconds), tone });
  }
  return out;
}

const WorkoutCard: FC<WorkoutCardProps> = ({
  workout,
  completion,
  onLog,
  onUnmark,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showForm, setShowForm] = useState(false);

  const isCompleted = completion != null;
  const activeSegments = workout.segments;

  const previewDescription = workout.segments[0]?.description ?? '';
  const previewTruncated =
    previewDescription.length > 80 ? previewDescription.slice(0, 80) + '…' : previewDescription;

  const handleCircleClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (isCompleted) {
      onUnmark();
      return;
    }
    setShowForm((prev) => !prev);
  };

  const handleFormSubmit = (
    input: CompletionInput,
    preview: { scorePct: number | null; rx: boolean },
  ) => {
    onLog(input, preview);
    setShowForm(false);
  };

  const doneBadges = completion ? buildDoneBadges(completion) : [];

  return (
    <div
      className={[
        'relative bg-pitch-2 border-2 overflow-hidden animate-slide-up',
        isCompleted ? 'border-monster' : 'border-smoke hover:border-bone-3',
      ].join(' ')}
      style={{
        borderRadius: '8px',
        boxShadow: isCompleted ? '4px 4px 0 0 var(--color-monster)' : '4px 4px 0 0 var(--color-pitch)',
        transition: 'box-shadow 120ms, border-color 120ms',
      }}
    >
      <div
        className="flex items-start gap-3 p-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <button
          onClick={handleCircleClick}
          className={[
            'flex-shrink-0 w-8 h-8 border-2 flex items-center justify-center press-collapse',
            isCompleted
              ? 'bg-monster border-pitch text-pitch'
              : showForm
                ? 'bg-transparent border-monster text-monster'
                : 'bg-transparent border-bone-3 text-transparent hover:border-monster hover:text-monster',
          ].join(' ')}
          style={{
            borderRadius: '4px',
            boxShadow: isCompleted ? '2px 2px 0 0 var(--color-pitch)' : '2px 2px 0 0 transparent',
            transition: 'all 120ms',
            marginTop: '2px',
          }}
          aria-label={
            isCompleted ? 'Unmark complete' : showForm ? 'Cancel logging' : 'Log this workout'
          }
        >
          {isCompleted ? (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={3}
            >
              <path d="m5 13 4 4L19 7" />
            </svg>
          ) : showForm ? (
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={3}
            >
              <path d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={3}
            >
              <path d="m5 13 4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span
              className="text-monster uppercase"
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '10px',
                letterSpacing: '1.5px',
              }}
            >
              {formatDate(workout.date)}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isCompleted && (
                <div className="flex items-center gap-1">
                  {doneBadges.map((b, i) => (
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
              )}
              <a
                href={workout.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-bone-muted hover:text-bone transition-colors"
                aria-label="View source"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              <svg
                className={`w-4 h-4 text-bone-muted transition-transform duration-[120ms] ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          <h3
            className="uppercase text-bone leading-tight mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              letterSpacing: '-0.5px',
            }}
          >
            {workout.title}
          </h3>

          {!expanded && !showForm && (
            <>
              {workout.segments[0] && (
                <p
                  className="text-bone-3 leading-relaxed mb-2"
                  style={{ fontFamily: 'var(--font-body)', fontSize: '12px' }}
                >
                  <span
                    className="text-monster uppercase mr-1"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '10px',
                      letterSpacing: '1px',
                    }}
                  >
                    {workout.segments[0].format}
                  </span>
                  {previewTruncated}
                </p>
              )}
              <div className="flex flex-wrap gap-1">
                {workout.movements.slice(0, 5).map((m) => (
                  <span
                    key={m}
                    className="text-monster border-2 border-monster/30 bg-monster/10 uppercase px-2 py-0.5"
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 700,
                      fontSize: '9px',
                      letterSpacing: '1px',
                      borderRadius: '999px',
                    }}
                  >
                    {m}
                  </span>
                ))}
                {workout.movements.length > 5 && (
                  <span
                    className="text-bone-muted uppercase px-2 py-0.5"
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 700,
                      fontSize: '9px',
                      letterSpacing: '1px',
                    }}
                  >
                    +{workout.movements.length - 5}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showForm && !isCompleted && (
        <LogWorkoutForm
          workoutId={workout.id}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          <div className="space-y-4 divide-y-2 divide-smoke">
            {activeSegments.map((seg, i) => (
              <div key={i} className={i > 0 ? 'pt-4' : ''}>
                <SegmentBlock segment={seg} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 pt-2 border-t-2 border-smoke">
            {workout.movements.map((m) => (
              <span
                key={m}
                className="text-monster border-2 border-monster/30 bg-monster/10 uppercase px-2 py-0.5"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '9px',
                  letterSpacing: '1px',
                  borderRadius: '999px',
                }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutCard;
