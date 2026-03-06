import { Injectable, signal } from '@angular/core';
import { getSpartaDb } from './sparta-db';
import { Workout, WorkoutStats } from '../models/workout.model';

const STORE_NAME = 'workouts';

@Injectable({ providedIn: 'root' })
export class WorkoutStorageService {
  readonly workouts = signal<Workout[]>([]);

  async init(): Promise<void> {
    await this.loadAll();
  }

  async loadAll(): Promise<void> {
    const db = await getSpartaDb();
    const all: Workout[] = await db.getAll(STORE_NAME);
    all.sort((a, b) => b.createdAt - a.createdAt);
    this.workouts.set(all);
  }

  async save(workout: Workout): Promise<number> {
    const db = await getSpartaDb();
    const id = await db.add(STORE_NAME, { ...workout, createdAt: Date.now() });
    await this.loadAll();
    return id as number;
  }

  async update(workout: Workout): Promise<void> {
    const db = await getSpartaDb();
    await db.put(STORE_NAME, workout);
    await this.loadAll();
  }

  async delete(id: number): Promise<void> {
    const db = await getSpartaDb();
    await db.delete(STORE_NAME, id);
    await this.loadAll();
  }

  async getById(id: number): Promise<Workout | undefined> {
    const db = await getSpartaDb();
    return db.get(STORE_NAME, id);
  }

  getStats(): WorkoutStats {
    const all = this.workouts();
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const workoutsThisMonth = all.filter(w => w.date.startsWith(monthStr)).length;
    const lastWorkoutDate = all.length > 0 ? all[0].date : null;

    const personalRecords: WorkoutStats['personalRecords'] = {};
    for (const workout of all) {
      for (const ex of workout.exercises) {
        for (const set of ex.sets) {
          const current = personalRecords[ex.exerciseId];
          if (!current || set.weight > current.weight || (set.weight === current.weight && set.reps > current.reps)) {
            personalRecords[ex.exerciseId] = { weight: set.weight, reps: set.reps, date: workout.date };
          }
        }
      }
    }

    return {
      totalWorkouts: all.length,
      workoutsThisMonth,
      lastWorkoutDate,
      personalRecords,
    };
  }
}
