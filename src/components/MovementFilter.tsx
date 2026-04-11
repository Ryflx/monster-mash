'use client';

import { useState, type FC } from 'react';

interface MovementFilterProps {
  movements: string[];
  selected: string[];
  onToggle: (m: string) => void;
  onClear: () => void;
}

const MovementFilter: FC<MovementFilterProps> = ({ movements, selected, onToggle, onClear }) => {
  const [expanded, setExpanded] = useState(false);

  const hasSelected = selected.length > 0;

  return (
    <div className="w-full">
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 w-full text-left mb-2"
      >
        <span className="font-display text-xs font-700 uppercase tracking-widest text-[#555] hover:text-[#888] transition-colors">
          Filter by movement
        </span>
        {hasSelected && (
          <span className="bg-[#E63946] text-white text-[10px] font-display font-800 px-1.5 py-0.5 rounded-full leading-none">
            {selected.length}
          </span>
        )}
        <svg
          className={`w-3 h-3 text-[#555] ml-auto transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Chips row */}
      {expanded && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
          {/* Clear all chip */}
          {hasSelected && (
            <button
              onClick={onClear}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-display font-700 uppercase tracking-wide border border-[#E63946] text-[#E63946] hover:bg-[#E63946]/10 transition-colors"
            >
              Clear all
            </button>
          )}

          {movements.map((movement) => {
            const isSelected = selected.includes(movement);
            return (
              <button
                key={movement}
                onClick={() => onToggle(movement)}
                className={[
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-display font-700 uppercase tracking-wide transition-all duration-150',
                  isSelected
                    ? 'bg-[#E63946] text-white border border-[#E63946]'
                    : 'bg-transparent text-[#888] border border-[#2A2A2A] hover:border-[#E63946]/40 hover:text-white',
                ].join(' ')}
              >
                {movement}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MovementFilter;
