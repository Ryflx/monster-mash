import type { CanonicalMovementForPicker } from '@/types/workout';

export type ScoreResult = {
  scorePct: number;
  rx: boolean;
  earned: number;
  max: number;
};

export function computeScore(
  canonicals: CanonicalMovementForPicker[],
  variantsChosen: Record<string, number>,
): ScoreResult {
  let earned = 0;
  let max = 0;
  let rx = true;

  for (const c of canonicals) {
    const maxPointsForCanonical = Math.max(...c.variants.map((v) => v.points));
    max += maxPointsForCanonical;

    const chosenId = variantsChosen[String(c.canonicalId)];
    const chosenVariant = chosenId != null ? c.variants.find((v) => v.id === chosenId) : undefined;

    if (!chosenVariant) {
      earned += maxPointsForCanonical;
      continue;
    }

    earned += chosenVariant.points;
    if (!chosenVariant.isRx) rx = false;
  }

  const scorePct = max === 0 ? 100 : (earned / max) * 100;
  return { scorePct, rx, earned, max };
}

export function formatScorePct(pct: number | null | undefined): string {
  if (pct == null) return '';
  return `${Math.round(pct)}%`;
}
