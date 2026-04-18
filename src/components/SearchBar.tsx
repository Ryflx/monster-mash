'use client';

import type { FC } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
}

const SearchBar: FC<SearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <svg
          className="w-4 h-4 text-bone-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="SEARCH WODS"
        className="w-full bg-pitch-2 border-2 border-smoke focus:border-monster outline-none pl-10 pr-10 py-2.5 text-bone placeholder-bone-muted uppercase"
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: '12px',
          letterSpacing: '1px',
          borderRadius: '6px',
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-3 flex items-center text-bone-muted hover:text-bone transition-colors"
          aria-label="Clear search"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
