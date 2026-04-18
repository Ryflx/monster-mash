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
}

export interface CompletionLog {
  rx: boolean;
  scaledWeight: string | null;
  timeSeconds: number | null;
  completedAt: string; // ISO
}

export interface CompletionInput {
  rx: boolean;
  scaledWeight?: string | null;
  timeSeconds?: number | null;
}
