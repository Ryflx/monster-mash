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

const SEGMENT_FILLS = [
  '#1C1C1C', '#121212', '#1A1A1A', '#101010',
  '#1C1C1C', '#121212', '#1A1A1A', '#101010',
  '#1C1C1C', '#121212', '#1A1A1A', '#101010',
];
const WHEEL_SLOTS = 12;

const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
const CANVAS_CSS = 340;
const CANVAS_PX = Math.round(CANVAS_CSS * DPR);

function easeOutExpo(t: number): number {
  const expo = t === 1 ? 1 : 1 - Math.pow(2, -12 * t);
  const quint = 1 - Math.pow(1 - t, 5);
  return 0.6 * expo + 0.4 * quint;
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  rotation: number,
  highlightIdx: number | null,
) {
  ctx.save();
  ctx.scale(DPR, DPR);
  const cx = CANVAS_CSS / 2;
  const cy = CANVAS_CSS / 2;
  const r = CANVAS_CSS / 2 - 20;
  const ir = 42;
  const count = WHEEL_SLOTS;
  const sliceAngle = (2 * Math.PI) / count;

  ctx.clearRect(0, 0, CANVAS_CSS, CANVAS_CSS);

  for (let i = 0; i < count; i++) {
    const startAngle = rotation + i * sliceAngle - Math.PI / 2;
    const endAngle = startAngle + sliceAngle;
    const isHighlighted = highlightIdx === i;

    // Segment fill
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = isHighlighted ? '#2A1407' : SEGMENT_FILLS[i % SEGMENT_FILLS.length];
    ctx.fill();
    ctx.strokeStyle = '#0A0A0A';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Accent rim arc
    ctx.beginPath();
    ctx.arc(cx, cy, r - 4, startAngle + 0.04, endAngle - 0.04);
    ctx.strokeStyle = i % 2 === 0 ? '#FF5A1F' : '#B8FF3C';
    ctx.lineWidth = 3;
    ctx.globalAlpha = isHighlighted ? 0.9 : 0.22;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Label — slot number, Bowlby One reads clean at this size
    const midAngle = startAngle + sliceAngle / 2;
    const lx = cx + Math.cos(midAngle) * r * 0.7;
    const ly = cy + Math.sin(midAngle) * r * 0.7;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(midAngle + Math.PI / 2);
    ctx.fillStyle = isHighlighted ? '#FF5A1F' : '#5A564C';
    ctx.font = `700 18px "Bowlby One", Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1).padStart(2, '0'), 0, 0);
    ctx.restore();
  }

  // Center disc — solid pitch with orange border
  ctx.beginPath();
  ctx.arc(cx, cy, ir, 0, Math.PI * 2);
  ctx.fillStyle = '#0A0A0A';
  ctx.fill();
  ctx.strokeStyle = '#FF5A1F';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Center "MM" mark in Rubik Mono One
  ctx.fillStyle = '#FF5A1F';
  ctx.font = `400 18px "Rubik Mono One", "Arial Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MM', cx, cy);

  // Outer ring (bone)
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#F5F1E8';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
}

function drawPointer(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.scale(DPR, DPR);
  ctx.clearRect(0, 0, CANVAS_CSS, CANVAS_CSS);
  const cx = CANVAS_CSS / 2;
  ctx.beginPath();
  ctx.moveTo(cx, 4);
  ctx.lineTo(cx - 14, 32);
  ctx.lineTo(cx + 14, 32);
  ctx.closePath();
  ctx.fillStyle = '#FF5A1F';
  ctx.fill();
  ctx.strokeStyle = '#0A0A0A';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function getWinnerIndex(count: number, rotation: number): number {
  if (count === 0) return 0;
  const sliceAngle = (2 * Math.PI) / count;
  const normalised = ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return Math.floor(((2 * Math.PI - normalised) % (2 * Math.PI)) / sliceAngle) % count;
}

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
  const [selected, setSelected] = useState<Workout[]>([]);
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'done'>('idle');
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);

  const redrawWheel = useCallback(
    (rotation: number, highlight: number | null = null) => {
      const canvas = wheelCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      drawWheel(ctx, rotation, highlight);
    },
    [],
  );

  // Initial draw + pointer
  useEffect(() => {
    redrawWheel(rotationRef.current);
  }, [redrawWheel]);
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

  const spinWheel = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const extraTurns = (7 + Math.floor(Math.random() * 5)) * 2 * Math.PI;
      const randomAngle = Math.random() * 2 * Math.PI;
      const totalDelta = extraTurns + randomAngle;
      const duration = 4500 + Math.random() * 1200;
      const startTime = performance.now();
      const startRotation = rotationRef.current;
      let lastIdx = -1;

      function frame(now: number) {
        const t = Math.min((now - startTime) / duration, 1);
        const currentAngle = startRotation + totalDelta * easeOutExpo(t);
        rotationRef.current = currentAngle;
        const idx = getWinnerIndex(WHEEL_SLOTS, currentAngle);
        if (idx !== lastIdx) {
          lastIdx = idx;
          setHighlightIdx(idx);
        }
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

    await spinWheel();

    // Pick one random workout — wheel is decorative, actual pick from full pool
    const idx = Math.floor(Math.random() * workouts.length);
    const pick = workouts[idx];
    const picks = [pick];

    setSelected(picks);
    onSelect(picks);
    setSpinning(false);
    setPhase('done');
  }, [spinning, workouts, spinWheel, onSelect]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const spinDisabled = spinning || workouts.length === 0;

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        className="relative w-full"
        style={{ maxWidth: CANVAS_CSS, aspectRatio: '1 / 1' }}
      >
        <canvas
          ref={wheelCanvasRef}
          width={CANVAS_PX}
          height={CANVAS_PX}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
        <canvas
          ref={pointerCanvasRef}
          width={CANVAS_PX}
          height={CANVAS_PX}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      </div>

      <button
        onClick={handleSpin}
        disabled={spinDisabled}
        className={[
          'w-56 py-4 border-2 uppercase press-collapse',
          spinDisabled
            ? 'bg-pitch-2 border-smoke text-bone-muted cursor-not-allowed'
            : 'bg-monster border-pitch text-pitch hover:bg-monster-dk',
        ].join(' ')}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          letterSpacing: '0.5px',
          borderRadius: '8px',
          boxShadow: spinDisabled ? 'none' : '5px 5px 0 0 var(--color-pitch)',
        }}
      >
        {spinning ? 'SPINNING…' : 'SPIN'}
      </button>

      <p
        className="uppercase text-bone-muted"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', letterSpacing: '1px' }}
      >
        {workouts.length} WODs IN THE POOL
      </p>

      {phase === 'done' && selected.length > 0 && (
        <div className="w-full space-y-3 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[2px] bg-monster/30" />
            <span
              className="uppercase text-monster"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '12px',
                letterSpacing: '1px',
              }}
            >
              Today's WOD
            </span>
            <div className="flex-1 h-[2px] bg-monster/30" />
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
