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
  onLog: (input: CompletionInput, preview: { scorePct: number; rx: boolean }) => void;
  onUnmark: () => void;
  defaultExpanded?: boolean;
}

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

const SegmentBlock: FC<{ segment: Segment }> = ({ segment }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <span className="font-display text-xs font-800 uppercase tracking-widest text-[#F4A261] bg-[#F4A261]/10 px-2 py-0.5 rounded">
        {segment.format}
      </span>
    </div>
    <p className="text-sm text-[#CCCCCC] leading-relaxed font-barlow whitespace-pre-line">
      {segment.description}
    </p>
    {segment.movements.some((mv) => mv.reps || mv.weightKg || mv.equipment) && (
      <ul className="space-y-1 pt-1">
        {segment.movements.map((mv, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="text-[#E63946] mt-1 text-[10px]">▸</span>
            <span className="text-white font-600">
              {mv.reps && <span className="text-[#F4A261] mr-1">{mv.reps}</span>}
              {mv.name}
              {mv.weightKg && (
                <span className="text-[#555] ml-1 text-xs">
                  ({formatWeight(mv.weightKg)})
                </span>
              )}
              {mv.equipment && (
                <span className="text-[#444] ml-1 text-xs">· {mv.equipment}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

function buildDoneBadges(completion: CompletionLog): string[] {
  const out: string[] = [];
  if (completion.rx) {
    out.push('RX');
  } else if (completion.scorePct != null) {
    out.push(`${Math.round(completion.scorePct)}%`);
  } else {
    out.push('Scaled');
  }
  if (completion.rounds != null) {
    const r = completion.extraReps != null && completion.extraReps > 0
      ? `${completion.rounds}+${completion.extraReps}`
      : `${completion.rounds}`;
    out.push(`${r} rds`);
  }
  if (completion.timeSeconds != null) {
    out.push(formatSecondsToTime(completion.timeSeconds));
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
    previewDescription.length > 80
      ? previewDescription.slice(0, 80) + '…'
      : previewDescription;

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
    preview: { scorePct: number; rx: boolean },
  ) => {
    onLog(input, preview);
    setShowForm(false);
  };

  const doneBadges = completion ? buildDoneBadges(completion) : [];

  return (
    <div
      className={[
        'relative bg-[#1A1A1A] border rounded-xl overflow-hidden transition-all duration-200',
        isCompleted ? 'border-[#E63946]/30' : 'border-[#2A2A2A]',
        'animate-slide-up',
      ].join(' ')}
    >
      {isCompleted && (
        <div className="h-[2px] bg-gradient-to-r from-[#E63946] to-[#F4A261]" />
      )}

      <div
        className="flex items-start gap-3 p-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <button
          onClick={handleCircleClick}
          className={[
            'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 mt-0.5',
            isCompleted
              ? 'bg-[#E63946] border-[#E63946] text-white'
              : showForm
                ? 'border-[#E63946] text-[#E63946]'
                : 'border-[#3A3A3A] text-transparent hover:border-[#E63946]/60',
          ].join(' ')}
          aria-label={isCompleted ? 'Unmark complete' : showForm ? 'Cancel logging' : 'Log this workout'}
        >
          {isCompleted ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path d="m5 13 4 4L19 7" />
            </svg>
          ) : showForm ? (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path d="m5 13 4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-display text-xs font-700 uppercase tracking-widest text-[#555]">
              {formatDate(workout.date)}
            </span>
            <div className="flex items-center gap-2">
              {isCompleted && (
                <span className="font-display text-[10px] font-800 uppercase tracking-wider text-[#E63946] bg-[#E63946]/10 px-2 py-0.5 rounded-full">
                  {doneBadges.length > 0 ? doneBadges.join(' · ') : 'Done'}
                </span>
              )}
              <a
                href={workout.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[#444] hover:text-[#888] transition-colors"
                aria-label="View source"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              <svg
                className={`w-4 h-4 text-[#555] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          <h3 className="font-display text-lg font-800 uppercase tracking-tight text-white leading-tight mb-2">
            {workout.title}
          </h3>

          {!expanded && !showForm && (
            <>
              {workout.segments[0] && (
                <p className="text-xs text-[#666] leading-relaxed mb-2 font-barlow">
                  <span className="text-[#F4A261]/80 font-display font-700 text-[10px] uppercase tracking-wider mr-1">
                    {workout.segments[0].format}
                  </span>
                  {previewTruncated}
                </p>
              )}
              <div className="flex flex-wrap gap-1">
                {workout.movements.slice(0, 5).map((m) => (
                  <span
                    key={m}
                    className="font-display text-[10px] font-700 uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20"
                  >
                    {m}
                  </span>
                ))}
                {workout.movements.length > 5 && (
                  <span className="font-display text-[10px] font-700 uppercase tracking-wide px-2 py-0.5 rounded-full text-[#555]">
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
          <div className="space-y-4 divide-y divide-[#2A2A2A]">
            {activeSegments.map((seg, i) => (
              <div key={i} className={i > 0 ? 'pt-4' : ''}>
                <SegmentBlock segment={seg} />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1 pt-2 border-t border-[#2A2A2A]">
            {workout.movements.map((m) => (
              <span
                key={m}
                className="font-display text-[10px] font-700 uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20"
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
