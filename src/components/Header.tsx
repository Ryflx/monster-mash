import type { FC } from 'react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = ['Workouts', 'Spin', 'History'];

const Header: FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0D0D0D] border-b border-[#2A2A2A]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-baseline gap-2">
          <h1 className="font-display text-3xl font-900 tracking-tight leading-none">
            <span className="text-[#E63946]">MONSTER</span>
            <span className="text-white ml-2">MASH</span>
          </h1>
          {/* Lightning bolt accent */}
          <span className="text-[#F4A261] text-xl leading-none" aria-hidden>⚡</span>
        </div>
        <div className="text-[#555] text-xs font-display font-600 uppercase tracking-widest">
          WOD Tracker
        </div>
      </div>

      {/* Nav tabs */}
      <nav className="flex px-4">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={[
                'relative py-3 mr-6 font-display text-sm font-700 uppercase tracking-widest transition-colors duration-150',
                isActive
                  ? 'text-white'
                  : 'text-[#555] hover:text-[#888]',
              ].join(' ')}
            >
              {tab}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#E63946] to-[#F4A261] rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};

export default Header;
