'use client';

import { useEffect, useState, type FC } from 'react';
import { loadWorkoutVariants } from '@/lib/actions/variants';
import { computeScore, formatScorePct } from '@/lib/scoring';
import { parseTimeToSeconds } from '@/lib/time';
import type { CompletionInput, WorkoutVariantsPayload } from '@/types/workout';

interface LogWorkoutFormProps {
  workoutId: string;
  onSubmit: (input: CompletionInput, preview: { scorePct: number; rx: boolean }) => void;
  onCancel: () => void;
}

const chipBase =
  'px-2.5 py-1 uppercase border-2 whitespace-nowrap press-collapse transition-all duration-[120ms]';
const chipIdle =
  'bg-transparent border-smoke text-bone-3 hover:border-bone-3 hover:text-bone';

function chipActiveClass(tier: number, isRx: boolean): string {
  if (isRx) return 'bg-monster border-pitch text-pitch';
  if (tier === 3) return 'bg-slime border-pitch text-pitch';
  if (tier === 2) return 'bg-bone-3 border-pitch text-pitch';
  return 'bg-smoke border-pitch text-bone';
}

function inputStyle(): React.CSSProperties {
  return {
    fontFamily: 'var(--font-mono)',
    fontSize: '16px',
  };
}

const labelCls =
  'uppercase text-bone-3';
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: '10px',
  letterSpacing: '1.5px',
};

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
        setFormError('TIME MUST BE MM:SS (E.G. 12:34)');
        return;
      }
      timeSeconds = parsed;
    }

    let rounds: number | null = null;
    const trimRounds = roundsInput.trim();
    if (trimRounds) {
      const n = Number(trimRounds);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        setFormError('ROUNDS MUST BE A WHOLE NUMBER');
        return;
      }
      rounds = n;
    }

    let extraReps: number | null = null;
    const trimReps = extraRepsInput.trim();
    if (trimReps) {
      const n = Number(trimReps);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        setFormError('REPS MUST BE A WHOLE NUMBER');
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
      className="px-4 pb-4 pt-1 border-t-2 border-smoke space-y-4 bg-pitch"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="pt-3 flex items-baseline justify-between">
        <div className="uppercase text-monster" style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '1px' }}>
          Log this mash
        </div>
        {preview && (
          <div
            className="uppercase"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '13px',
              letterSpacing: '0.5px',
              color: preview.rx ? 'var(--color-monster)' : 'var(--color-slime)',
            }}
          >
            {formatScorePct(preview.scorePct)}{preview.rx ? ' · RX' : ''}
          </div>
        )}
      </div>

      {loading && (
        <div
          className="text-bone-muted py-4 text-center uppercase"
          style={{ fontFamily: 'var(--font-body)', fontSize: '11px', letterSpacing: '1.5px' }}
        >
          Loading variants…
        </div>
      )}

      {error && (
        <div className="text-blood text-[11px] uppercase" style={{ fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '1px' }}>
          Failed to load: {error}
        </div>
      )}

      {!loading && !error && payload && payload.canonicals.length === 0 && (
        <div className="text-bone-muted text-[11px] italic" style={{ fontFamily: 'var(--font-body)' }}>
          No recognised movements — defaulting to RX.
        </div>
      )}

      {!loading && !error && payload && payload.canonicals.length > 0 && (
        <div className="space-y-3">
          {payload.canonicals.map((c) => (
            <div key={c.canonicalId} className="space-y-1.5">
              <div
                className="uppercase text-bone"
                style={{
                  fontFamily: 'var(--font-display-2)',
                  fontSize: '12px',
                  letterSpacing: '0.5px',
                }}
              >
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
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        fontSize: '10px',
                        letterSpacing: '1px',
                        borderRadius: '4px',
                        boxShadow: isChosen ? '2px 2px 0 0 var(--color-pitch)' : undefined,
                      }}
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
              <span className={labelCls} style={labelStyle}>
                Time (optional)
              </span>
              <input
                type="text"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                placeholder="MM:SS"
                inputMode="numeric"
                className="mt-1 w-full bg-pitch-2 border-2 border-smoke text-bone px-3 py-2 focus:border-monster outline-none"
                style={{ ...inputStyle(), borderRadius: '6px' }}
              />
            </label>
          )}

          {payload.isAmrap && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className={labelCls} style={labelStyle}>
                  Rounds
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={roundsInput}
                  onChange={(e) => setRoundsInput(e.target.value)}
                  placeholder="14"
                  className="mt-1 w-full bg-pitch-2 border-2 border-smoke text-bone px-3 py-2 focus:border-monster outline-none"
                  style={{ ...inputStyle(), borderRadius: '6px' }}
                />
              </label>
              <label className="block">
                <span className={labelCls} style={labelStyle}>
                  Extra reps
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={extraRepsInput}
                  onChange={(e) => setExtraRepsInput(e.target.value)}
                  placeholder="3"
                  className="mt-1 w-full bg-pitch-2 border-2 border-smoke text-bone px-3 py-2 focus:border-monster outline-none"
                  style={{ ...inputStyle(), borderRadius: '6px' }}
                />
              </label>
            </div>
          )}
        </div>
      )}

      {formError && (
        <p className="text-blood uppercase" style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '10px', letterSpacing: '1px' }}>
          {formError}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 border-2 border-smoke text-bone-3 uppercase hover:text-bone hover:border-bone-3 press-collapse"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            letterSpacing: '1px',
            borderRadius: '6px',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !!error}
          className="flex-[2] py-2 bg-monster border-2 border-pitch text-pitch uppercase disabled:opacity-30 disabled:cursor-not-allowed press-collapse"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '12px',
            letterSpacing: '0.5px',
            borderRadius: '6px',
            boxShadow: '4px 4px 0 0 var(--color-pitch)',
          }}
        >
          Log it
        </button>
      </div>
    </div>
  );
};

export default LogWorkoutForm;
