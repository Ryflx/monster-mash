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
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 w-full text-left mb-2"
      >
        <span
          className="uppercase text-bone-3 hover:text-bone transition-colors"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            letterSpacing: '1.5px',
          }}
        >
          Filter by movement
        </span>
        {hasSelected && (
          <span
            className="bg-monster text-pitch px-1.5 py-0.5 leading-none"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '10px',
              letterSpacing: '0.5px',
              borderRadius: '999px',
            }}
          >
            {selected.length}
          </span>
        )}
        <svg
          className={`w-3 h-3 text-bone-muted ml-auto transition-transform duration-[120ms] ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
          {hasSelected && (
            <button
              onClick={onClear}
              className="flex-shrink-0 px-3 py-1.5 uppercase border-2 border-blood text-blood hover:bg-blood/10 press-collapse"
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '10px',
                letterSpacing: '1px',
                borderRadius: '999px',
              }}
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
                  'flex-shrink-0 px-3 py-1.5 uppercase border-2 transition-all duration-[120ms] press-collapse',
                  isSelected
                    ? 'bg-monster border-pitch text-pitch'
                    : 'bg-transparent border-smoke text-bone-3 hover:border-bone-3 hover:text-bone',
                ].join(' ')}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '10px',
                  letterSpacing: '1px',
                  borderRadius: '999px',
                  boxShadow: isSelected ? '2px 2px 0 0 var(--color-pitch)' : undefined,
                }}
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
