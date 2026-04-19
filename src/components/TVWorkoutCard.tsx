import type { FC } from 'react';
import type { Workout } from '../types/workout';

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day)
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase();
}

const TVWorkoutCard: FC<{ workout: Workout }> = ({ workout }) => {
  const activeSegments = workout.segments.filter(
    (s) => s.format.toLowerCase() !== 'rest period',
  );

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Header */}
      <div>
        <p
          className="text-monster uppercase mb-1"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '10px', letterSpacing: '1.5px' }}
        >
          {formatDate(workout.date)}
        </p>
        <h2
          className="uppercase text-bone leading-none"
          style={{ fontFamily: 'var(--font-display)', fontSize: '22px', letterSpacing: '-0.5px' }}
        >
          {workout.title}
        </h2>
      </div>

      {/* Segments */}
      <div className="flex flex-col gap-3 flex-1">
        {activeSegments.map((seg, i) => (
          <div key={i}>
            {i > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px bg-smoke" />
                <span
                  className="uppercase text-bone-muted"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '9px', letterSpacing: '1.5px' }}
                >
                  Rest · 5 min
                </span>
                <div className="flex-1 h-px bg-smoke" />
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                {activeSegments.length > 1 && (
                  <span
                    className="uppercase text-bone-muted"
                    style={{ fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '2px' }}
                  >
                    Part {i + 1}
                  </span>
                )}
                <span
                  className="inline-block uppercase text-monster bg-monster/10 border border-monster/30 px-1.5 py-0.5"
                  style={{ fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.5px', borderRadius: '3px' }}
                >
                  {seg.format}
                </span>
              </div>
              <p
                className="text-bone leading-snug whitespace-pre-line"
                style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500 }}
              >
                {seg.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TVWorkoutCard;
