import { useState, type FC } from 'react';
import type { Workout, Segment } from '../types/workout';
import { formatWeight } from '../utils/converter';

interface WorkoutCardProps {
  workout: Workout;
  isCompleted: boolean;
  onMarkComplete: () => void;
  onUnmark: () => void;
  defaultExpanded?: boolean;
  completedAt?: string;
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

function formatCompletedDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
    {segment.movements.length > 0 && (
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

const WorkoutCard: FC<WorkoutCardProps> = ({
  workout,
  isCompleted,
  onMarkComplete,
  onUnmark,
  defaultExpanded = false,
  completedAt,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showDumbbell, setShowDumbbell] = useState(false);

  const hasDumbbell = !!workout.dumbbell && workout.dumbbell.length > 0;
  const activeSegments = showDumbbell && hasDumbbell ? workout.dumbbell! : workout.segments;

  const previewDescription = workout.segments[0]?.description ?? '';
  const previewTruncated =
    previewDescription.length > 80
      ? previewDescription.slice(0, 80) + '…'
      : previewDescription;

  return (
    <div
      className={[
        'relative bg-[#1A1A1A] border rounded-xl overflow-hidden transition-all duration-200',
        isCompleted ? 'border-[#E63946]/30' : 'border-[#2A2A2A]',
        'animate-slide-up',
      ].join(' ')}
    >
      {/* Completed accent line at top */}
      {isCompleted && (
        <div className="h-[2px] bg-gradient-to-r from-[#E63946] to-[#F4A261]" />
      )}

      {/* Card header — always visible */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Completion toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            isCompleted ? onUnmark() : onMarkComplete();
          }}
          className={[
            'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 mt-0.5',
            isCompleted
              ? 'bg-[#E63946] border-[#E63946] text-white'
              : 'border-[#3A3A3A] text-transparent hover:border-[#E63946]/60',
          ].join(' ')}
          aria-label={isCompleted ? 'Unmark complete' : 'Mark complete'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path d="m5 13 4 4L19 7" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          {/* Date */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-display text-xs font-700 uppercase tracking-widest text-[#555]">
              {formatDate(workout.date)}
            </span>
            <div className="flex items-center gap-2">
              {isCompleted && (
                <span className="font-display text-[10px] font-800 uppercase tracking-wider text-[#E63946] bg-[#E63946]/10 px-2 py-0.5 rounded-full">
                  Done
                </span>
              )}
              {/* Link icon */}
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
              {/* Expand chevron */}
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

          {/* Title */}
          <h3 className="font-display text-lg font-800 uppercase tracking-tight text-white leading-tight mb-2">
            {workout.title}
          </h3>

          {/* Collapsed preview */}
          {!expanded && (
            <>
              {workout.segments[0] && (
                <p className="text-xs text-[#666] leading-relaxed mb-2 font-barlow">
                  <span className="text-[#F4A261]/80 font-display font-700 text-[10px] uppercase tracking-wider mr-1">
                    {workout.segments[0].format}
                  </span>
                  {previewTruncated}
                </p>
              )}
              {/* Movement tags */}
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

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Dumbbell toggle */}
          {hasDumbbell && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowDumbbell(false)}
                className={[
                  'flex-1 py-2 rounded-lg text-xs font-display font-700 uppercase tracking-widest border transition-all duration-150',
                  !showDumbbell
                    ? 'bg-[#E63946] border-[#E63946] text-white'
                    : 'bg-transparent border-[#2A2A2A] text-[#555] hover:border-[#E63946]/40',
                ].join(' ')}
              >
                Barbell
              </button>
              <button
                onClick={() => setShowDumbbell(true)}
                className={[
                  'flex-1 py-2 rounded-lg text-xs font-display font-700 uppercase tracking-widest border transition-all duration-150',
                  showDumbbell
                    ? 'bg-[#E63946] border-[#E63946] text-white'
                    : 'bg-transparent border-[#2A2A2A] text-[#555] hover:border-[#E63946]/40',
                ].join(' ')}
              >
                🏋️ Dumbbell
              </button>
            </div>
          )}

          {/* Segments */}
          <div className="space-y-4 divide-y divide-[#2A2A2A]">
            {activeSegments.map((seg, i) => (
              <div key={i} className={i > 0 ? 'pt-4' : ''}>
                <SegmentBlock segment={seg} />
              </div>
            ))}
          </div>

          {/* All movement tags in expanded view */}
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

          {/* Completed at */}
          {completedAt && (
            <p className="text-xs text-[#555] font-display font-600 uppercase tracking-wide">
              Completed {formatCompletedDate(completedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkoutCard;
