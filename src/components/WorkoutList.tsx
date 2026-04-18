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
    preview: { scorePct: number; rx: boolean },
  ) => void;
  onUnmark: (id: string) => void;
}

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

  // Reset to page 0 when workouts list changes length significantly
  // (handled by key in parent if needed)

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">🏋️</div>
        <p className="font-display text-xl font-700 uppercase tracking-widest text-[#333]">
          No workouts found
        </p>
        <p className="text-sm text-[#444] mt-2">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Count bar */}
      <div className="flex items-center justify-between">
        <span className="font-display text-xs font-700 uppercase tracking-widest text-[#555]">
          Showing{' '}
          <span className="text-white">
            {start + 1}–{Math.min(start + PAGE_SIZE, workouts.length)}
          </span>{' '}
          of{' '}
          <span className="text-[#F4A261]">{workouts.length}</span>{' '}
          workouts
        </span>
        <span className="font-display text-xs font-700 uppercase tracking-widest text-[#555]">
          Page {currentPage + 1}/{totalPages}
        </span>
      </div>

      {/* Workout cards */}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={handlePrev}
            disabled={currentPage === 0}
            className={[
              'flex items-center gap-2 px-4 py-2.5 rounded-lg font-display text-xs font-700 uppercase tracking-widest border transition-all duration-150',
              currentPage === 0
                ? 'border-[#2A2A2A] text-[#333] cursor-not-allowed'
                : 'border-[#2A2A2A] text-[#888] hover:border-[#E63946]/50 hover:text-white',
            ].join(' ')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="m15 18-6-6 6-6" />
            </svg>
            Prev
          </button>

          {/* Page dots (up to 5 visible) */}
          <div className="flex gap-1.5">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Sliding window
              let pageIdx = i;
              if (totalPages > 5) {
                const offset = Math.min(
                  Math.max(0, currentPage - 2),
                  totalPages - 5
                );
                pageIdx = i + offset;
              }
              return (
                <button
                  key={pageIdx}
                  onClick={() => setPage(pageIdx)}
                  className={[
                    'w-2 h-2 rounded-full transition-all duration-150',
                    pageIdx === currentPage
                      ? 'bg-[#E63946] w-4'
                      : 'bg-[#2A2A2A] hover:bg-[#3A3A3A]',
                  ].join(' ')}
                  aria-label={`Page ${pageIdx + 1}`}
                />
              );
            })}
          </div>

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages - 1}
            className={[
              'flex items-center gap-2 px-4 py-2.5 rounded-lg font-display text-xs font-700 uppercase tracking-widest border transition-all duration-150',
              currentPage === totalPages - 1
                ? 'border-[#2A2A2A] text-[#333] cursor-not-allowed'
                : 'border-[#2A2A2A] text-[#888] hover:border-[#E63946]/50 hover:text-white',
            ].join(' ')}
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkoutList;
