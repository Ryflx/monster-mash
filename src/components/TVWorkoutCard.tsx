import type { FC } from 'react';
import type { Workout } from '../types/workout';

type Part = { format: string; body: string };

function parseParts(segmentFormat: string, description: string): Part[] {
  const blocks = description
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const sectionCount = blocks.filter((b) => {
    if (/^\*?\s*rest\s/i.test(b)) return false;
    return b.split('\n')[0].trim().endsWith(':');
  }).length;

  if (sectionCount >= 2) {
    const parsed: Part[] = [];
    for (const block of blocks) {
      if (/^\*?\s*rest\s/i.test(block)) continue;
      const lines = block.split('\n');
      const firstLine = lines[0].trim();
      if (firstLine.endsWith(':')) {
        const fmt = firstLine.replace(/:\s*$/, '').replace(/\s+of$/i, '').trim();
        const body = lines.slice(1).join('\n').trim();
        parsed.push({ format: fmt, body });
      } else {
        parsed.push({ format: segmentFormat, body: block });
      }
    }
    return parsed;
  }

  // Single section — strip leading "Format:" header line and trailing rest note
  let body = description;
  if (body.split('\n')[0].trim().endsWith(':')) {
    body = body.split('\n').slice(1).join('\n').trim();
  }
  body = body.replace(/\n\s*\*?\s*rest[^\n]*$/i, '').trim();
  return [{ format: segmentFormat, body }];
}

const TVWorkoutCard: FC<{ workout: Workout }> = ({ workout }) => {
  const activeSegments = workout.segments.filter(
    (s) => s.format.toLowerCase() !== 'rest period',
  );
  const parts: Part[] = activeSegments.flatMap((s) => parseParts(s.format, s.description));

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Header */}
      <div>
        <h2
          className="uppercase text-bone leading-none"
          style={{ fontFamily: 'var(--font-display)', fontSize: '22px', letterSpacing: '-0.5px' }}
        >
          {workout.title.replace(/^MM #\d+\s*[-—–]\s*/, '')}
        </h2>
      </div>

      {/* Segments */}
      <div className="flex flex-col gap-3 flex-1">
        {parts.map((part, i) => (
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
                {parts.length > 1 && (
                  <span
                    className="uppercase text-bone-muted"
                    style={{ fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '2px' }}
                  >
                    Part {i + 1}
                  </span>
                )}
                {part.format && (
                  <span
                    className="inline-block uppercase text-monster bg-monster/10 border border-monster/30 px-1.5 py-0.5"
                    style={{ fontFamily: 'var(--font-display)', fontSize: '9px', letterSpacing: '0.5px', borderRadius: '3px' }}
                  >
                    {part.format}
                  </span>
                )}
              </div>
              <p
                className="text-bone leading-snug whitespace-pre-line"
                style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500 }}
              >
                {part.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TVWorkoutCard;
