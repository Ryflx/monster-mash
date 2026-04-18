export interface WeightKg {
  male: number;
  female: number;
}

export interface Movement {
  name: string;
  reps?: string;
  weightKg?: WeightKg;
  weightOriginal?: string;
  equipment?: string;
}

export interface Segment {
  format: string;
  description: string;
  movements: Movement[];
}

export interface Workout {
  id: string;
  date: string;         // ISO: YYYY-MM-DD
  title: string;
  segments: Segment[];
  movements: string[];  // unique movement names for filtering
  sourceUrl: string;
}

export interface CompletedWorkout {
  workoutId: string;
  completedAt: string; // ISO datetime
  rx?: boolean;
  scaledWeight?: string | null;
  timeSeconds?: number | null;
  rounds?: number | null;
  extraReps?: number | null;
  scorePct?: number | null;
}

export interface CompletionLog {
  rx: boolean;
  scaledWeight: string | null;
  timeSeconds: number | null;
  rounds: number | null;
  extraReps: number | null;
  scorePct: number | null;
  variantsChosen: Record<string, number> | null; // "canonicalId" -> variantId
  completedAt: string;
}

export interface CompletionInput {
  variantsChosen: Record<string, number>; // "canonicalId" -> variantId
  timeSeconds?: number | null;
  rounds?: number | null;
  extraReps?: number | null;
}

export interface CanonicalMovementForPicker {
  canonicalId: number;
  canonicalName: string;
  category: string;
  variants: Array<{
    id: number;
    name: string;
    tier: number;
    points: number;
    isRx: boolean;
    sortOrder: number;
  }>;
}

export interface WorkoutVariantsPayload {
  workoutId: string;
  canonicals: CanonicalMovementForPicker[];
  isAmrap: boolean;
}
