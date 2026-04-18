'use client';

import { useState, type FC } from 'react';
import type { Workout, CompletionInput, CompletionLog } from '../types/workout';
import WorkoutCard from './WorkoutCard';

const PAGE_SIZE = 20;

interface WorkoutListProps {
  workouts: Workout[];
  getCompletion: (id: string) => CompletionLog | null;
  onLog: (
    id: string,
    input: CompletionInput,
    preview: { scorePct: number | null; rx: boolean },
  ) => void;
  onUnmark: (id: string) => void;
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: '10px',
  letterSpacing: '1.5px',
};

const navBtnCls =
  'flex items-center gap-2 px-3 py-2 uppercase border-2 press-collapse transition-colors duration-[120ms]';
const navBtnIdle = 'border-smoke text-bone-3 hover:border-bone-3 hover:text-bone';
const navBtnDisabled = 'border-smoke text-bone-muted cursor-not-allowed';

const WorkoutList: FC<WorkoutListProps> = ({
  workouts,
  getCompletion,
  onLog,
  onUnmark,
}) => {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(workouts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * PAGE_SIZE;
  const pageWorkouts = workouts.slice(start, start + PAGE_SIZE);

  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div
          className="uppercase text-monster"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '40px',
            letterSpacing: '-1.5px',
            lineHeight: 0.9,
            textShadow:
              '3px 3px 0 var(--color-pitch), 3px 3px 0 0 var(--color-slime)',
          }}
        >
          NO<br />WODS
          <br />FOUND
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
          Try a different search.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="uppercase text-bone-muted" style={labelStyle}>
          <span className="text-bone">
            {start + 1}–{Math.min(start + PAGE_SIZE, workouts.length)}
          </span>{' '}
          of{' '}
          <span className="text-monster">{workouts.length}</span> WODs
        </span>
        <span className="uppercase text-bone-muted" style={labelStyle}>
          Page {currentPage + 1}/{totalPages}
        </span>
      </div>

      <div className="space-y-3">
        {pageWorkouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            completion={getCompletion(workout.id)}
            onLog={(input, preview) => onLog(workout.id, input, preview)}
            onUnmark={() => onUnmark(workout.id)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={handlePrev}
            disabled={currentPage === 0}
            className={`${navBtnCls} ${currentPage === 0 ? navBtnDisabled : navBtnIdle}`}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              letterSpacing: '0.5px',
              borderRadius: '6px',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path d="m15 18-6-6 6-6" />
            </svg>
            Prev
          </button>

          <div className="flex gap-1.5">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageIdx = i;
              if (totalPages > 5) {
                const offset = Math.min(
                  Math.max(0, currentPage - 2),
                  totalPages - 5,
                );
                pageIdx = i + offset;
              }
              const isActive = pageIdx === currentPage;
              return (
                <button
                  key={pageIdx}
                  onClick={() => setPage(pageIdx)}
                  className={[
                    'h-2 transition-all duration-[120ms]',
                    isActive ? 'bg-monster w-6' : 'bg-smoke hover:bg-bone-muted w-2',
                  ].join(' ')}
                  style={{ borderRadius: '2px' }}
                  aria-label={`Page ${pageIdx + 1}`}
                />
              );
            })}
          </div>

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages - 1}
            className={`${navBtnCls} ${currentPage === totalPages - 1 ? navBtnDisabled : navBtnIdle}`}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              letterSpacing: '0.5px',
              borderRadius: '6px',
            }}
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkoutList;
