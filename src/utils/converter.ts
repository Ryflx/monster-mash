// Round to nearest 0.5kg
export function lbsToKg(lbs: number): number {
  const kg = lbs * 0.453592;
  return Math.round(kg * 2) / 2;
}

// Parse "275/185" → { male: 125, female: 84 }
export function parseWeightString(raw: string): { male: number; female: number } | null {
  const match = raw.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  return {
    male: lbsToKg(parseFloat(match[1])),
    female: lbsToKg(parseFloat(match[2])),
  };
}

export function formatWeight(w: { male: number; female: number }): string {
  return `${w.male}/${w.female}kg`;
}
