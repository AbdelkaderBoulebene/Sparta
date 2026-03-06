export interface WorkoutSet {
  reps: number;
  weight: number; // in kg
  duration?: number; // in seconds (time-based exercises)
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  exerciseNameFr?: string;
  exerciseImage?: string;
  isTimeBased?: boolean;
  targetSets: number;
  minReps: number;
  maxReps: number;
  minDuration?: number; // in seconds
  maxDuration?: number; // in seconds
  targetWeight: number;
  sets: WorkoutSet[];
}

export interface Workout {
  id?: number;
  date: string; // ISO date string YYYY-MM-DD
  label: string;
  templateId?: number;
  durationMinutes?: number;
  exercises: WorkoutExercise[];
  completed: boolean;
  createdAt: number; // timestamp ms
}

export interface WorkoutStats {
  totalWorkouts: number;
  workoutsThisMonth: number;
  lastWorkoutDate: string | null;
  personalRecords: Record<string, { weight: number; reps: number; date: string }>;
}
