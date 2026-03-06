import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Exercise } from '../models/exercise.model';
import { firstValueFrom } from 'rxjs';

const CACHE_KEY = 'sparta-exercises-v4';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours (données locales, stable)

interface CacheEntry {
  timestamp: number;
  bodyParts: string[];
}

@Injectable({ providedIn: 'root' })
export class ExerciseApiService {
  readonly exercises = signal<Exercise[]>([]);
  readonly loading = signal(false);
  readonly bodyParts = signal<string[]>([]);

  constructor(private http: HttpClient) {}

  async loadExercises(): Promise<void> {
    if (this.exercises().length > 0) return; // already loaded

    this.loading.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<Exercise[]>('assets/exercises.json')
      );
      const exercises = data ?? [];
      const bodyParts = this.extractBodyParts(exercises);
      this.exercises.set(exercises);
      this.bodyParts.set(bodyParts);
    } catch (err) {
      console.error('Failed to load exercises.json:', err);
    } finally {
      this.loading.set(false);
    }
  }

  private extractBodyParts(exercises: Exercise[]): string[] {
    const set = new Set<string>();
    for (const ex of exercises) {
      for (const part of ex.bodyParts) {
        set.add(part);
      }
    }
    return Array.from(set).sort();
  }

  clearCache(): void {
    // No-op for local assets — kept for UI compatibility
  }
}
