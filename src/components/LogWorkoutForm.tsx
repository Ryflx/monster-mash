'use client';

import { useEffect, useState, type FC } from 'react';
import { loadWorkoutVariants } from '@/lib/actions/variants';
import { computeScore, formatScorePct } from '@/lib/scoring';
import { parseTimeToSeconds } from '@/lib/time';
import type { CompletionInput, WorkoutVariantsPayload } from '@/types/workout';

interface LogWorkoutFormProps {
  workoutId: string;
  onSubmit: (input: CompletionInput, preview: { scorePct: number | null; rx: boolean }) => void;
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

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '16px',
};

const labelCls = 'uppercase text-bone-3';
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
  const [fallbackRx, setFallbackRx] = useState(true);
  const [scaledWeight, setScaledWeight] = useState('');
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

  const hasCanonicals = !!payload && payload.canonicals.length > 0;
  const variantPreview = hasCanonicals ? computeScore(payload!.canonicals, chosen) : null;
  const previewRx = hasCanonicals ? !!variantPreview && variantPreview.rx : fallbackRx;
  const previewScorePct: number | null = hasCanonicals
    ? variantPreview?.scorePct ?? null
    : fallbackRx
      ? 100
      : null;

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

    onSubmit(
      {
        variantsChosen: hasCanonicals ? chosen : {},
        rx: hasCanonicals ? undefined : fallbackRx,
        scaledWeight: scaledWeight.trim() || null,
        timeSeconds,
        rounds,
        extraReps,
      },
      { scorePct: previewScorePct, rx: previewRx },
    );
  };

  return (
    <div
      className="px-4 pb-4 pt-1 border-t-2 border-smoke space-y-4 bg-pitch"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="pt-3 flex items-baseline justify-between">
        <div
          className="uppercase text-monster"
          style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '1px' }}
        >
          Log this mash
        </div>
        <div
          className="uppercase"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '13px',
            letterSpacing: '0.5px',
            color: previewRx ? 'var(--color-monster)' : 'var(--color-slime)',
          }}
        >
          {previewScorePct != null ? `${formatScorePct(previewScorePct)}${previewRx ? ' · RX' : ''}` : 'SCALED'}
        </div>
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
        <div
          className="text-blood uppercase"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '10px', letterSpacing: '1px' }}
        >
          Failed to load: {error}
        </div>
      )}

      {!loading && !error && hasCanonicals && (
        <div className="space-y-3">
          {payload!.canonicals.map((c) => (
            <div key={c.canonicalId} className="space-y-1.5">
              <div
                className="uppercase text-bone"
                style={{ fontFamily: 'var(--font-display-2)', fontSize: '12px', letterSpacing: '0.5px' }}
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

      {!loading && !error && payload && !hasCanonicals && (
        <div className="space-y-2">
          <div
            className="uppercase text-bone"
            style={{ fontFamily: 'var(--font-display-2)', fontSize: '12px', letterSpacing: '0.5px' }}
          >
            Did you RX it?
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setFallbackRx(true)}
              className={`${chipBase} ${fallbackRx ? 'bg-monster border-pitch text-pitch' : chipIdle}`}
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '10px',
                letterSpacing: '1px',
                borderRadius: '4px',
                boxShadow: fallbackRx ? '2px 2px 0 0 var(--color-pitch)' : undefined,
              }}
            >
              RX
            </button>
            <button
              onClick={() => setFallbackRx(false)}
              className={`${chipBase} ${!fallbackRx ? 'bg-slime border-pitch text-pitch' : chipIdle}`}
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '10px',
                letterSpacing: '1px',
                borderRadius: '4px',
                boxShadow: !fallbackRx ? '2px 2px 0 0 var(--color-pitch)' : undefined,
              }}
            >
              Scaled
            </button>
          </div>
        </div>
      )}

      {!loading && !error && payload && (
        <div className="grid grid-cols-1 gap-3 pt-1">
          {!hasCanonicals || !previewRx ? (
            <label className="block">
              <span className={labelCls} style={labelStyle}>
                Scaled to (optional)
              </span>
              <input
                type="text"
                value={scaledWeight}
                onChange={(e) => setScaledWeight(e.target.value)}
                placeholder="e.g. 70kg, banded PU, shorter ROM"
                className="mt-1 w-full bg-pitch-2 border-2 border-smoke text-bone px-3 py-2 focus:border-monster outline-none"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '14px', borderRadius: '6px' }}
              />
            </label>
          ) : null}

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
                style={{ ...inputStyle, borderRadius: '6px' }}
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
                  style={{ ...inputStyle, borderRadius: '6px' }}
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
                  style={{ ...inputStyle, borderRadius: '6px' }}
                />
              </label>
            </div>
          )}
        </div>
      )}

      {formError && (
        <p
          className="text-blood uppercase"
          style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '10px', letterSpacing: '1px' }}
        >
          {formError}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 border-2 border-smoke text-bone-3 uppercase hover:text-bone hover:border-bone-3 press-collapse"
          style={{ fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '1px', borderRadius: '6px' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !!error || !payload}
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
