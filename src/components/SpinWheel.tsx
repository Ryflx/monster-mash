import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type FC,
} from 'react';
import type { Workout } from '../types/workout';
import WorkoutCard from './WorkoutCard';

interface SpinWheelProps {
  workouts: Workout[];
  onSelect: (workouts: Workout[]) => void;
  isCompleted: (id: string) => boolean;
  onMarkComplete: (id: string) => void;
  onUnmark: (id: string) => void;
}

// 8 alternating dark segment colours
const SEGMENT_COLOURS = [
  '#1F1F1F',
  '#2A1A1A',
  '#1A1A2A',
  '#1A2A1A',
  '#251A1A',
  '#1A2525',
  '#25201A',
  '#201A25',
];

const ACCENT_COLOURS = [
  '#E63946',
  '#F4A261',
  '#E63946',
  '#F4A261',
  '#E63946',
  '#F4A261',
  '#E63946',
  '#F4A261',
];

const CANVAS_SIZE = 320;
const CENTER = CANVAS_SIZE / 2;
const RADIUS = CENTER - 16;

function drawWheel(
  ctx: CanvasRenderingContext2D,
  workouts: Workout[],
  rotation: number,
) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const count = workouts.length;
  if (count === 0) {
    // Empty state ring
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = '#2A2A2A';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#1A1A1A';
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No workouts', CENTER, CENTER);
    return;
  }

  const sliceAngle = (2 * Math.PI) / count;

  workouts.forEach((workout, i) => {
    const startAngle = rotation + i * sliceAngle - Math.PI / 2;
    const endAngle = startAngle + sliceAngle;

    // Segment fill
    ctx.beginPath();
    ctx.moveTo(CENTER, CENTER);
    ctx.arc(CENTER, CENTER, RADIUS, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = SEGMENT_COLOURS[i % SEGMENT_COLOURS.length];
    ctx.fill();

    // Segment border
    ctx.strokeStyle = '#0D0D0D';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Accent arc at rim
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, RADIUS - 4, startAngle + 0.02, endAngle - 0.02);
    ctx.strokeStyle = ACCENT_COLOURS[i % ACCENT_COLOURS.length];
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Label
    const midAngle = startAngle + sliceAngle / 2;
    const labelRadius = RADIUS * 0.65;
    const lx = CENTER + Math.cos(midAngle) * labelRadius;
    const ly = CENTER + Math.sin(midAngle) * labelRadius;

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(midAngle + Math.PI / 2);

    const label = workout.date.slice(5); // MM-DD
    ctx.fillStyle = '#CCCCCC';
    ctx.font = `bold ${count > 20 ? 8 : count > 12 ? 9 : 11}px "Barlow Condensed", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });

  // Center circle
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, 24, 0, Math.PI * 2);
  ctx.fillStyle = '#0D0D0D';
  ctx.fill();
  ctx.strokeStyle = '#E63946';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Center MM text
  ctx.fillStyle = '#E63946';
  ctx.font = 'bold 11px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MM', CENTER, CENTER);

  // Outer ring
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = '#2A2A2A';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawPointer(ctx: CanvasRenderingContext2D) {
  // Arrow pointing down into the top of the wheel
  const tipX = CENTER;
  const tipY = 10;
  const baseY = tipY + 20;
  const halfBase = 10;

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - halfBase, baseY);
  ctx.lineTo(tipX + halfBase, baseY);
  ctx.closePath();
  ctx.fillStyle = '#E63946';
  ctx.fill();
  ctx.shadowColor = '#E63946';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function getWinnerIndex(workouts: Workout[], finalRotation: number): number {
  const count = workouts.length;
  if (count === 0) return 0;
  const sliceAngle = (2 * Math.PI) / count;
  // Pointer is at top = -PI/2 from east = angle 0 in our system
  // We need to find which segment is at top after rotation
  // At rotation R, segment i occupies [R + i*slice - PI/2, R + (i+1)*slice - PI/2]
  // Top = 0 from east offset = -PI/2 + PI/2 = 0 normalized
  const normalised = ((finalRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  // The segment at top: rotate back
  const idx = Math.floor(((2 * Math.PI - normalised) % (2 * Math.PI)) / sliceAngle);
  return idx % count;
}

const SpinWheel: FC<SpinWheelProps> = ({
  workouts,
  onSelect,
  isCompleted,
  onMarkComplete,
  onUnmark,
}) => {
  const wheelCanvasRef = useRef<HTMLCanvasElement>(null);
  const pointerCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const rotationRef = useRef(0);

  const [spinning, setSpinning] = useState(false);
  const [count, setCount] = useState(1);
  const [selected, setSelected] = useState<Workout[]>([]);
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'done'>('idle');

  // Draw wheel on canvas whenever workouts or rotation changes
  const redrawWheel = useCallback((rotation: number) => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawWheel(ctx, workouts, rotation);
  }, [workouts]);

  // Initial draw
  useEffect(() => {
    redrawWheel(rotationRef.current);
  }, [redrawWheel]);

  // Draw pointer once
  useEffect(() => {
    const canvas = pointerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    drawPointer(ctx);
  }, []);

  const spinOnce = useCallback(
    (currentRotation: number): Promise<{ finalRotation: number; winner: Workout }> => {
      return new Promise((resolve) => {
        if (workouts.length === 0) return;

        // Random total spin: 5-9 full turns + random landing
        const extraTurns = (5 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
        const randomAngle = Math.random() * 2 * Math.PI;
        const totalDelta = extraTurns + randomAngle;
        const finalRotation = currentRotation + totalDelta;

        const duration = 3500 + Math.random() * 1000; // 3.5–4.5s
        const startTime = performance.now();
        const startRotation = currentRotation;

        function easeOut(t: number): number {
          // Cubic ease-out
          return 1 - Math.pow(1 - t, 3);
        }

        function frame(now: number) {
          const elapsed = now - startTime;
          const t = Math.min(elapsed / duration, 1);
          const easedT = easeOut(t);
          const currentAngle = startRotation + totalDelta * easedT;
          rotationRef.current = currentAngle;
          redrawWheel(currentAngle);

          if (t < 1) {
            animFrameRef.current = requestAnimationFrame(frame);
          } else {
            rotationRef.current = finalRotation;
            redrawWheel(finalRotation);
            const winnerIdx = getWinnerIndex(workouts, finalRotation);
            resolve({ finalRotation, winner: workouts[winnerIdx] });
          }
        }

        animFrameRef.current = requestAnimationFrame(frame);
      });
    },
    [workouts, redrawWheel],
  );

  const handleSpin = useCallback(async () => {
    if (spinning || workouts.length === 0) return;
    setSpinning(true);
    setSelected([]);
    setPhase('spinning');

    const winners: Workout[] = [];
    let currentRotation = rotationRef.current;
    const available = [...workouts];

    for (let i = 0; i < Math.min(count, workouts.length); i++) {
      // Rebuild wheel with remaining options if picking multiple
      // (simplified: always spin from all workouts, just pick non-repeat)
      const result = await spinOnce(currentRotation);
      currentRotation = result.finalRotation;
      // Avoid duplicates: find winner from available
      const winnerIdx = getWinnerIndex(available, currentRotation % (2 * Math.PI));
      const winner = available[winnerIdx % available.length] ?? result.winner;
      winners.push(winner);
      // Brief pause between spins
      if (i < count - 1) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    setSelected(winners);
    onSelect(winners);
    setSpinning(false);
    setPhase('done');
  }, [spinning, workouts, count, spinOnce, onSelect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
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
              'px-4 py-2 rounded-lg font-display text-sm font-800 uppercase tracking-widest border transition-all duration-150',
              count === n
                ? 'bg-[#E63946] border-[#E63946] text-white'
                : 'bg-transparent border-[#2A2A2A] text-[#555] hover:border-[#E63946]/40 hover:text-white',
              spinning ? 'opacity-40 cursor-not-allowed' : '',
            ].join(' ')}
          >
            Pick {n}
          </button>
        ))}
      </div>

      {/* Wheel container */}
      <div className="relative" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
        {/* Wheel canvas */}
        <canvas
          ref={wheelCanvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="absolute inset-0"
        />
        {/* Pointer canvas (on top) */}
        <canvas
          ref={pointerCanvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="absolute inset-0 pointer-events-none"
        />

        {/* Glow ring when spinning */}
        {spinning && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'transparent',
              boxShadow: '0 0 40px rgba(230, 57, 70, 0.3), 0 0 80px rgba(230, 57, 70, 0.1)',
            }}
          />
        )}
      </div>

      {/* Empty state */}
      {workouts.length === 0 && (
        <p className="text-[#555] font-display text-sm font-600 uppercase tracking-widest text-center">
          No workouts available to spin
        </p>
      )}

      {/* Spin button */}
      <button
        onClick={handleSpin}
        disabled={spinning || workouts.length === 0}
        className={[
          'w-48 py-4 rounded-xl font-display text-xl font-900 uppercase tracking-widest transition-all duration-200',
          spinning || workouts.length === 0
            ? 'bg-[#2A2A2A] text-[#444] cursor-not-allowed'
            : 'bg-[#E63946] text-white hover:bg-[#c62d39] glow-pulse active:scale-95',
        ].join(' ')}
      >
        {spinning ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Spinning
          </span>
        ) : (
          'SPIN'
        )}
      </button>

      {/* Results */}
      {phase === 'done' && selected.length > 0 && (
        <div className="w-full space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#2A2A2A]" />
            <span className="font-display text-xs font-700 uppercase tracking-widest text-[#E63946]">
              {selected.length === 1 ? "Today's WOD" : `Your ${selected.length} WODs`}
            </span>
            <div className="flex-1 h-px bg-[#2A2A2A]" />
          </div>
          {selected.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              isCompleted={isCompleted(workout.id)}
              onMarkComplete={() => onMarkComplete(workout.id)}
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
