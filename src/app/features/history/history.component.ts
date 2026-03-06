import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WorkoutStorageService } from '../../core/services/workout-storage.service';
import { Workout } from '../../core/models/workout.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent {
  private storage = inject(WorkoutStorageService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  readonly workouts = this.storage.workouts;

  viewWorkout(id: number): void {
    this.router.navigate(['/workout', id]);
  }

  async deleteWorkout(event: Event, id: number): Promise<void> {
    event.stopPropagation();
    await this.storage.delete(id);
    this.snackBar.open('Séance supprimée', undefined, { duration: 2000 });
  }

  totalVolume(workout: Workout): number {
    return workout.exercises.reduce((total, ex) =>
      total + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0
    );
  }

  countSets(workout: Workout): number {
    return workout.exercises.reduce((total, ex) => total + ex.sets.length, 0);
  }
}
