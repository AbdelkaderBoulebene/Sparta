export interface TemplateExercise {
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
}

export interface SessionTemplate {
  id?: number;
  name: string;
  sessionsPerWeek: number;
  exercises: TemplateExercise[];
  createdAt: number;
  updatedAt: number;
}
