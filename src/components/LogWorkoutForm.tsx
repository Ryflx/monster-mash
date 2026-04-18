'use client';

import { useEffect, useState, type FC } from 'react';
import { loadWorkoutVariants } from '@/lib/actions/variants';
import { computeScore, formatScorePct } from '@/lib/scoring';
import { parseTimeToSeconds } from '@/lib/time';
import type {
  CompletionInput,
  WorkoutVariantsPayload,
} from '@/types/workout';

interface LogWorkoutFormProps {
  workoutId: string;
  onSubmit: (input: CompletionInput, preview: { scorePct: number; rx: boolean }) => void;
  onCancel: () => void;
}

const chipBase =
  'px-2.5 py-1 rounded-md font-display text-[10px] font-700 uppercase tracking-widest border transition-colors whitespace-nowrap';
const chipActiveRx =
  'bg-[#E63946] border-[#E63946] text-white';
const chipActiveTier3 =
  'bg-[#F4A261] border-[#F4A261] text-[#0D0D0D]';
const chipActiveTier2 =
  'bg-[#888] border-[#888] text-white';
const chipActiveTier1 =
  'bg-[#555] border-[#555] text-white';
const chipIdle =
  'bg-transparent border-[#2A2A2A] text-[#888] hover:border-[#555]';

function chipActiveClass(tier: number, isRx: boolean): string {
  if (isRx) return chipActiveRx;
  if (tier === 3) return chipActiveTier3;
  if (tier === 2) return chipActiveTier2;
  return chipActiveTier1;
}

const LogWorkoutForm: FC<LogWorkoutFormProps> = ({ workoutId, onSubmit, onCancel }) => {
  const [payload, setPayload] = useState<WorkoutVariantsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Record<string, number>>({});
  const [timeInput, setTimeInput] = useState('');
  const [roundsInput, setRoundsInput] = useState('');
  const [extraRepsInput, setExtraRepsInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadWorkoutVariants(workoutId)
      .then((data) => {
        if (cancelled) return;
        setPayload(data);
        const defaults: Record<string, number> = {};
        for (const c of data.canonicals) {
          const rx = c.variants.find((v) => v.isRx);
          if (rx) defaults[String(c.canonicalId)] = rx.id;
        }
        setChosen(defaults);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workoutId]);

  const preview = payload ? computeScore(payload.canonicals, chosen) : null;

  const handleSubmit = () => {
    setFormError(null);
    if (!payload) return;

    let timeSeconds: number | null = null;
    const trimTime = timeInput.trim();
    if (trimTime) {
      const parsed = parseTimeToSeconds(trimTime);
      if (parsed == null) {
        setFormError('Time must be MM:SS (e.g. 12:34) or H:MM:SS');
        return;
      }
      timeSeconds = parsed;
    }

    let rounds: number | null = null;
    const trimRounds = roundsInput.trim();
    if (trimRounds) {
      const n = Number(trimRounds);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        setFormError('Rounds must be a non-negative integer');
        return;
      }
      rounds = n;
    }

    let extraReps: number | null = null;
    const trimReps = extraRepsInput.trim();
    if (trimReps) {
      const n = Number(trimReps);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        setFormError('Extra reps must be a non-negative integer');
        return;
      }
      extraReps = n;
    }

    const score = computeScore(payload.canonicals, chosen);
    onSubmit(
      {
        variantsChosen: chosen,
        timeSeconds,
        rounds,
        extraReps,
      },
      { scorePct: score.scorePct, rx: score.rx },
    );
  };

  return (
    <div
      className="px-4 pb-4 pt-1 border-t border-[#2A2A2A] space-y-4 bg-[#121212]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="pt-3 flex items-baseline justify-between">
        <div className="font-display text-[10px] font-800 uppercase tracking-widest text-[#888]">
          Log this workout
        </div>
        {preview && (
          <div className="font-display text-xs font-800 uppercase tracking-widest text-[#F4A261]">
            {formatScorePct(preview.scorePct)}{preview.rx ? ' · RX' : ''}
          </div>
        )}
      </div>

      {loading && (
        <div className="font-display text-[10px] uppercase tracking-widest text-[#555] py-4 text-center">
          Loading variants…
        </div>
      )}

      {error && (
        <div className="text-xs text-[#E63946]">Failed to load variants: {error}</div>
      )}

      {!loading && !error && payload && payload.canonicals.length === 0 && (
        <div className="text-xs text-[#555] italic">
          No recognised movements in this workout — defaulting to RX.
        </div>
      )}

      {!loading && !error && payload && payload.canonicals.length > 0 && (
        <div className="space-y-2.5">
          {payload.canonicals.map((c) => (
            <div key={c.canonicalId} className="space-y-1">
              <div className="font-display text-[10px] font-700 uppercase tracking-widest text-[#aaa]">
                {c.canonicalName}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c.variants.map((v) => {
                  const isChosen = chosen[String(c.canonicalId)] === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() =>
                        setChosen((prev) => ({ ...prev, [String(c.canonicalId)]: v.id }))
                      }
                      className={`${chipBase} ${isChosen ? chipActiveClass(v.tier, v.isRx) : chipIdle}`}
                      title={`Tier ${v.tier} · ${v.points} pts${v.isRx ? ' (RX)' : ''}`}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && payload && (
        <div className="grid grid-cols-1 gap-3 pt-1">
          {!payload.isAmrap && (
            <label className="block">
              <span className="font-display text-[10px] font-700 uppercase tracking-widest text-[#888]">
                Time {payload.isAmrap ? '' : '(optional)'}
              </span>
              <input
                type="text"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                placeholder="MM:SS (e.g. 12:34)"
                inputMode="numeric"
                className="mt-1 w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:border-[#E63946] outline-none text-sm font-mono"
              />
            </label>
          )}

          {payload.isAmrap && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="font-display text-[10px] font-700 uppercase tracking-widest text-[#888]">
                  Rounds
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={roundsInput}
                  onChange={(e) => setRoundsInput(e.target.value)}
                  placeholder="14"
                  className="mt-1 w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:border-[#E63946] outline-none text-sm font-mono"
                />
              </label>
              <label className="block">
                <span className="font-display text-[10px] font-700 uppercase tracking-widest text-[#888]">
                  Extra reps
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={extraRepsInput}
                  onChange={(e) => setExtraRepsInput(e.target.value)}
                  placeholder="3"
                  className="mt-1 w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:border-[#E63946] outline-none text-sm font-mono"
                />
              </label>
            </div>
          )}
        </div>
      )}

      {formError && <p className="text-xs text-[#E63946]">{formError}</p>}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-[#2A2A2A] text-[#888] font-display font-700 uppercase tracking-widest text-xs hover:text-white hover:border-[#555]"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !!error}
          className="flex-[2] py-2 rounded-lg bg-[#E63946] text-white font-display font-800 uppercase tracking-widest text-xs hover:bg-[#d12f3c] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Log it
        </button>
      </div>
    </div>
  );
};

export default LogWorkoutForm;
