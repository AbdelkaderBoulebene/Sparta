import { Injectable } from '@angular/core';
import { Workout } from '../models/workout.model';

export interface ProgressPoint {
  date: string;
  maxWeight: number;
  totalVolume: number; // sum of weight * reps across all sets
}

export interface WeeklyFrequency {
  week: string; // e.g. "2025-W10"
  count: number;
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  getExerciseProgress(workouts: Workout[], exerciseId: string): ProgressPoint[] {
    const points: ProgressPoint[] = [];

    const sorted = [...workouts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const workout of sorted) {
      const ex = workout.exercises.find(e => e.exerciseId === exerciseId);
      if (!ex || ex.sets.length === 0) continue;

      const maxWeight = Math.max(...ex.sets.map(s => s.weight));
      const totalVolume = ex.sets.reduce((acc, s) => acc + s.weight * s.reps, 0);
      points.push({ date: workout.date, maxWeight, totalVolume });
    }

    return points;
  }

  getWeeklyFrequency(workouts: Workout[], weeks = 12): WeeklyFrequency[] {
    const result: WeeklyFrequency[] = [];
    const now = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() - i * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const count = workouts.filter(w => {
        const d = new Date(w.date);
        return d >= weekStart && d < weekEnd;
      }).length;

      const label = this.getWeekLabel(weekStart);
      result.push({ week: label, count });
    }

    return result;
  }

  private getWeekLabel(date: Date): string {
    const year = date.getFullYear();
    const start = new Date(year, 0, 1);
    const week = Math.ceil((((date.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);
    return `S${String(week).padStart(2, '0')}`;
  }

  getExercisesUsed(workouts: Workout[]): { id: string; name: string }[] {
    const map = new Map<string, string>();
    for (const w of workouts) {
      for (const ex of w.exercises) {
        if (!map.has(ex.exerciseId)) {
          map.set(ex.exerciseId, ex.exerciseName);
        }
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }
}
