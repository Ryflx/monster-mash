'use client';

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type FC,
} from 'react';
import type { Workout, CompletionInput, CompletionLog } from '../types/workout';
import WorkoutCard from './WorkoutCard';

interface SpinWheelProps {
  workouts: Workout[];
  onSelect: (workouts: Workout[]) => void;
  getCompletion: (id: string) => CompletionLog | null;
  onLog: (
    id: string,
    input: CompletionInput,
    preview: { scorePct: number | null; rx: boolean },
  ) => void;
  onUnmark: (id: string) => void;
}

// Visual segment colors
const SEGMENT_FILLS = [
  '#1C1416', '#161A1C', '#1A1614', '#14181C',
  '#1C1618', '#161C18', '#1A1418', '#181C16',
  '#1C1A14', '#141C1A', '#181416', '#1C181A',
];
const ACCENT_COLORS = ['#FF5A1F', '#B8FF3C'];
const WHEEL_SLOTS = 12;

const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
const CANVAS_CSS = 340;
const CANVAS_PX = Math.round(CANVAS_CSS * DPR);

// Dramatic deceleration: fast start, long suspenseful tail
function easeOutExpo(t: number): number {
  const expo = t === 1 ? 1 : 1 - Math.pow(2, -12 * t);
  const quint = 1 - Math.pow(1 - t, 5);
  return 0.6 * expo + 0.4 * quint;
}

// ─── Canvas drawing ───────────────────────────────────────────────────────────

function drawWheel(
  ctx: CanvasRenderingContext2D,
  slots: string[],
  rotation: number,
  highlightIdx: number | null,
) {
  ctx.save();
  ctx.scale(DPR, DPR);
  const cx = CANVAS_CSS / 2;
  const cy = CANVAS_CSS / 2;
  const r = (CANVAS_CSS / 2) - 20;
  const ir = 30;
  const count = slots.length;
  const sliceAngle = (2 * Math.PI) / count;

  ctx.clearRect(0, 0, CANVAS_CSS, CANVAS_CSS);

  slots.forEach((label, i) => {
    const startAngle = rotation + i * sliceAngle - Math.PI / 2;
    const endAngle = startAngle + sliceAngle;
    const isHighlighted = highlightIdx === i;

    // Segment fill
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = isHighlighted ? '#2A1A1A' : SEGMENT_FILLS[i % SEGMENT_FILLS.length];
    ctx.fill();
    ctx.strokeStyle = '#0A0A0A';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Accent rim arc
    ctx.beginPath();
    ctx.arc(cx, cy, r - 3, startAngle + 0.03, endAngle - 0.03);
    ctx.strokeStyle = ACCENT_COLORS[i % 2];
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = isHighlighted ? 0.6 : 0.2;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Label
    const midAngle = startAngle + sliceAngle / 2;
    const lx = cx + Math.cos(midAngle) * r * 0.62;
    const ly = cy + Math.sin(midAngle) * r * 0.62;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(midAngle + Math.PI / 2);
    ctx.fillStyle = isHighlighted ? '#FFFFFF' : '#999999';
    ctx.font = `bold 11px "Rubik Mono One", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });

  // Center disc
  const grad = ctx.createRadialGradient(cx, cy, ir * 0.3, cx, cy, ir);
  grad.addColorStop(0, '#1C1C1C');
  grad.addColorStop(1, '#0A0A0A');
  ctx.beginPath();
  ctx.arc(cx, cy, ir, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#FF5A1F';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#FF5A1F';
  ctx.font = `900 13px "Rubik Mono One", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MM', cx, cy);

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#1C1C1C';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
}

function drawPointer(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.scale(DPR, DPR);
  ctx.clearRect(0, 0, CANVAS_CSS, CANVAS_CSS);
  const cx = CANVAS_CSS / 2;
  ctx.shadowColor = 'rgba(230, 57, 70, 0.5)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.moveTo(cx, 4);
  ctx.lineTo(cx - 12, 28);
  ctx.lineTo(cx + 12, 28);
  ctx.closePath();
  ctx.fillStyle = '#FF5A1F';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(cx, 9);
  ctx.lineTo(cx - 5, 22);
  ctx.lineTo(cx + 5, 22);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fill();
  ctx.restore();
}

function getWinnerIndex(count: number, rotation: number): number {
  if (count === 0) return 0;
  const sliceAngle = (2 * Math.PI) / count;
  const normalised = ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return Math.floor(((2 * Math.PI - normalised) % (2 * Math.PI)) / sliceAngle) % count;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SpinWheel: FC<SpinWheelProps> = ({
  workouts,
  onSelect,
  getCompletion,
  onLog,
  onUnmark,
}) => {
  const wheelCanvasRef = useRef<HTMLCanvasElement>(null);
  const pointerCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const rotationRef = useRef(0);

  const [spinning, setSpinning] = useState(false);
  const [count, setCount] = useState(3);
  const [selected, setSelected] = useState<Workout[]>([]);
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'done'>('idle');
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);

  // Wheel always shows 12 decorative slots — purely visual
  const slotLabels = useMemo(() => {
    const labels = [];
    for (let i = 0; i < WHEEL_SLOTS; i++) {
      labels.push(`MM #${Math.floor(Math.random() * 619) + 1}`);
    }
    return labels;
  }, []);

  const redrawWheel = useCallback((rotation: number, highlight: number | null = null) => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawWheel(ctx, slotLabels, rotation, highlight);
  }, [slotLabels]);

  // Initial draw + pointer
  useEffect(() => { redrawWheel(rotationRef.current); }, [redrawWheel]);
  useEffect(() => {
    const canvas = pointerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawPointer(ctx);
  }, []);

  // Idle drift
  useEffect(() => {
    if (spinning) return;
    let raf = 0;
    const start = performance.now();
    function drift(now: number) {
      const elapsed = (now - start) / 1000;
      const idleRotation = rotationRef.current + Math.sin(elapsed * 0.3) * 0.005;
      redrawWheel(idleRotation, highlightIdx);
      raf = requestAnimationFrame(drift);
    }
    raf = requestAnimationFrame(drift);
    return () => cancelAnimationFrame(raf);
  }, [spinning, redrawWheel, highlightIdx]);

  // Animate the wheel spin (visual only — doesn't determine the result)
  const spinWheel = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const extraTurns = (7 + Math.floor(Math.random() * 5)) * 2 * Math.PI;
      const randomAngle = Math.random() * 2 * Math.PI;
      const totalDelta = extraTurns + randomAngle;
      const duration = 5000 + Math.random() * 1500;
      const startTime = performance.now();
      const startRotation = rotationRef.current;
      let lastIdx = -1;

      function frame(now: number) {
        const t = Math.min((now - startTime) / duration, 1);
        const currentAngle = startRotation + totalDelta * easeOutExpo(t);
        rotationRef.current = currentAngle;
        const idx = getWinnerIndex(WHEEL_SLOTS, currentAngle);
        if (idx !== lastIdx) { lastIdx = idx; setHighlightIdx(idx); }
        redrawWheel(currentAngle, idx);
        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(frame);
        } else {
          rotationRef.current = startRotation + totalDelta;
          setHighlightIdx(idx);
          redrawWheel(startRotation + totalDelta, idx);
          resolve();
        }
      }
      animFrameRef.current = requestAnimationFrame(frame);
    });
  }, [redrawWheel]);

  const handleSpin = useCallback(async () => {
    if (spinning || workouts.length === 0) return;
    setSpinning(true);
    setSelected([]);
    setPhase('spinning');
    setHighlightIdx(null);

    // Spin the wheel (visual animation)
    await spinWheel();

    // Pick random workouts from the FULL pool — wheel is decorative
    const picks: Workout[] = [];
    const available = [...workouts];
    const numPicks = Math.min(count, available.length);
    for (let i = 0; i < numPicks; i++) {
      const idx = Math.floor(Math.random() * available.length);
      picks.push(available[idx]);
      available.splice(idx, 1); // no duplicates
    }

    setSelected(picks);
    onSelect(picks);
    setSpinning(false);
    setPhase('done');
  }, [spinning, workouts, count, spinWheel, onSelect]);

  useEffect(() => {
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Count selector */}
      <div className="flex gap-2">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            onClick={() => { setCount(n); setSelected([]); setPhase('idle'); }}
            disabled={spinning}
            className={[
              'px-5 py-2.5 rounded-lg font-display text-sm font-800 uppercase tracking-widest border transition-all duration-200',
              count === n
                ? 'bg-[#FF5A1F] border-[#FF5A1F] text-white shadow-[0_0_20px_rgba(255,90,31,0.3)]'
                : 'bg-transparent border-[#2A2A2A] text-[#555] hover:border-[#FF5A1F]/40 hover:text-white',
              spinning ? 'opacity-30 cursor-not-allowed' : '',
            ].join(' ')}
          >
            Pick {n}
          </button>
        ))}
      </div>

      {/* Wheel */}
      <div className="relative" style={{ width: CANVAS_CSS, height: CANVAS_CSS }}>
        <canvas ref={wheelCanvasRef} width={CANVAS_PX} height={CANVAS_PX}
          style={{ width: CANVAS_CSS, height: CANVAS_CSS }} className="absolute inset-0" />
        <canvas ref={pointerCanvasRef} width={CANVAS_PX} height={CANVAS_PX}
          style={{ width: CANVAS_CSS, height: CANVAS_CSS }} className="absolute inset-0 pointer-events-none" />
        {spinning && (
          <div className="absolute inset-[-8px] rounded-full pointer-events-none"
            style={{ boxShadow: '0 0 50px rgba(230, 57, 70, 0.25), 0 0 100px rgba(230, 57, 70, 0.08)' }} />
        )}
      </div>

      {/* Spin button */}
      <button
        onClick={handleSpin}
        disabled={spinning || workouts.length === 0}
        className={[
          'w-52 py-4 rounded-xl font-display text-xl font-900 uppercase tracking-[0.2em] transition-all duration-200',
          spinning || workouts.length === 0
            ? 'bg-[#1C1C1C] text-[#333] cursor-not-allowed border border-[#2A2A2A]'
            : 'bg-[#FF5A1F] text-white hover:bg-[#E64A10] glow-pulse active:scale-95 shadow-[0_4px_30px_rgba(255,90,31,0.4)]',
        ].join(' ')}
      >
        {spinning ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Spinning...
          </span>
        ) : 'SPIN'}
      </button>

      <p className="text-[10px] font-display font-600 uppercase tracking-[0.2em] text-[#333]">
        {workouts.length} workouts in the pool
      </p>

      {/* Results */}
      {phase === 'done' && selected.length > 0 && (
        <div className="w-full space-y-3 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#FF5A1F]/40 to-transparent" />
            <span className="font-display text-xs font-800 uppercase tracking-[0.2em] text-[#FF5A1F]">
              {selected.length === 1 ? "Today's WOD" : `Your ${selected.length} WODs`}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#FF5A1F]/40 to-transparent" />
          </div>
          {selected.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              completion={getCompletion(workout.id)}
              onLog={(input, preview) => onLog(workout.id, input, preview)}
              onUnmark={() => onUnmark(workout.id)}
              defaultExpanded={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SpinWheel;
