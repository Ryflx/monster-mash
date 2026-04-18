export function parseTimeToSeconds(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(':').map((p) => p.trim());
  if (parts.some((p) => !/^\d+$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.length === 1) return nums[0];
  if (nums.length === 2) return nums[0] * 60 + nums[1];
  if (nums.length === 3) return nums[0] * 3600 + nums[1] * 60 + nums[2];
  return null;
}

export function formatSecondsToTime(seconds: number): string {
  if (seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${m}:${ss}`;
}
