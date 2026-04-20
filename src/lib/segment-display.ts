/**
 * Segment display helpers — shared by WorkoutCard and TVWorkoutCard.
 *
 * A segment's raw description often begins with a benchmark name (e.g.
 * "Nasty Girls") and/or a format header line (e.g. "3 Rounds for time of:").
 * Both are redundant with the orange format badge we render above, so we
 * strip them here and let the badge carry that information.
 */

export type DisplaySegment = {
  /** Text to put in the orange badge — benchmark name (upper-cased) or format. */
  badge: string;
  /** Description body with benchmark/format header lines removed. */
  body: string;
};

export function displaySegment(format: string, description: string): DisplaySegment {
  const lines = description.split('\n');
  let cursor = 0;
  let benchmark: string | null = null;

  // Line 1: a quoted benchmark name like "Nasty Girls" / "Murph" / "Fran"
  const first = lines[cursor]?.trim() ?? '';
  const quoted = first.match(/^["“]([^"”]+?)["”]$/);
  if (quoted) {
    benchmark = quoted[1].trim();
    cursor++;
  }

  // Next line: a format header like "3 Rounds for time of:" or "For time:"
  const next = lines[cursor]?.trim() ?? '';
  if (next.endsWith(':')) {
    cursor++;
  }

  const body = lines.slice(cursor).join('\n').trim();
  const badge = benchmark ? benchmark : format;
  return { badge, body: body || description };
}
