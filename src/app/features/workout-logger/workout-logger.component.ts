import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { WorkoutStorageService } from '../../core/services/workout-storage.service';
import { TemplateStorageService } from '../../core/services/template-storage.service';
import { LanguageService } from '../../core/services/language.service';
import { ExerciseApiService } from '../../core/services/exercise-api.service';
import { Workout, WorkoutExercise, WorkoutSet } from '../../core/models/workout.model';
import { SessionTemplate } from '../../core/models/session-template.model';
import { Exercise } from '../../core/models/exercise.model';
import { ExercisePickerDialogComponent } from './exercise-picker-dialog.component';

@Component({
  selector: 'app-workout-logger',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  templateUrl: './workout-logger.component.html',
  styleUrl: './workout-logger.component.scss',
})
export class WorkoutLoggerComponent implements OnInit {
  private storage = inject(WorkoutStorageService);
  private templateStorage = inject(TemplateStorageService);
  private exerciseApi = inject(ExerciseApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  readonly lang = inject(LanguageService);

  isViewMode = false;
  workoutId: number | null = null;
  selectedTemplateId = signal<number | null>(null);

  label = signal('');
  date = signal(new Date().toISOString().split('T')[0]);
  exercises = signal<WorkoutExercise[]>([]);

  get templates(): SessionTemplate[] {
    return this.templateStorage.templates();
  }

  isReadyToProgress(ex: WorkoutExercise): boolean {
    if (!ex.sets.length) return false;
    if (ex.isTimeBased) return ex.sets.every(s => (s.duration ?? 0) >= (ex.maxDuration ?? 0));
    return ex.sets.every(s => s.reps >= ex.maxReps);
  }

  toggleTimeBased(exIndex: number): void {
    this.exercises.update(list =>
      list.map((e, i) => i === exIndex ? { ...e, isTimeBased: !e.isTimeBased } : e),
    );
  }

  exDisplayName(ex: WorkoutExercise): string {
    return this.lang.lang() === 'fr' ? (ex.exerciseNameFr || ex.exerciseName) : ex.exerciseName;
  }

  async ngOnInit(): Promise<void> {
    this.exerciseApi.loadExercises();
    await this.templateStorage.init();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.workoutId = +id;
      this.isViewMode = true;
      await this.loadWorkout(this.workoutId);
      return;
    }

    const templateId = this.route.snapshot.queryParamMap.get('templateId');
    if (templateId) {
      const t = await this.templateStorage.getById(+templateId);
      if (t) this.loadTemplate(t);
    }
  }

  private async loadWorkout(id: number): Promise<void> {
    const w = await this.storage.getById(id);
    if (w) {
      this.label.set(w.label);
      this.date.set(w.date);
      this.exercises.set(w.exercises);
      this.selectedTemplateId.set(w.templateId ?? null);
    }
  }

  loadTemplate(template: SessionTemplate): void {
    this.selectedTemplateId.set(template.id!);
    this.label.set(template.name);
    this.exercises.set(
      template.exercises.map(te => ({
        exerciseId: te.exerciseId,
        exerciseName: te.exerciseName,
        exerciseNameFr: te.exerciseNameFr,
        exerciseImage: te.exerciseImage,
        targetSets: te.targetSets,
        minReps: te.minReps,
        maxReps: te.maxReps,
        targetWeight: te.targetWeight,
        sets: Array.from({ length: te.targetSets }, () => ({
          reps: te.minReps,
          weight: te.targetWeight,
        })),
      })),
    );
  }

  startFreeSession(): void {
    this.selectedTemplateId.set(null);
    this.label.set('');
    this.exercises.set([]);
  }

  openExercisePicker(): void {
    const ref = this.dialog.open(ExercisePickerDialogComponent, {
      width: '90vw',
      maxWidth: '700px',
      maxHeight: '80vh',
      panelClass: 'dark-dialog',
    });

    ref.afterClosed().subscribe((exercise: Exercise | undefined) => {
      if (!exercise) return;
      const newEx: WorkoutExercise = {
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.name,
        exerciseNameFr: exercise.nameFr,
        exerciseImage: exercise.gifUrl,
        targetSets: 4,
        minReps: 8,
        maxReps: 12,
        targetWeight: 0,
        sets: [{ reps: 8, weight: 0 }],
      };
      this.exercises.update(list => [...list, newEx]);
    });
  }

  addSet(exIndex: number): void {
    this.exercises.update(list =>
      list.map((e, i) => {
        if (i !== exIndex) return e;
        const lastSet = e.sets[e.sets.length - 1] ?? { reps: e.minReps, weight: e.targetWeight };
        return { ...e, sets: [...e.sets, { ...lastSet }] };
      }),
    );
  }

  removeSet(exIndex: number, setIndex: number): void {
    this.exercises.update(list =>
      list.map((e, i) => {
        if (i !== exIndex) return e;
        return { ...e, sets: e.sets.filter((_, si) => si !== setIndex) };
      }),
    );
  }

  removeExercise(exIndex: number): void {
    this.exercises.update(list => list.filter((_, i) => i !== exIndex));
  }

  updateSet(exIndex: number, setIndex: number, field: keyof WorkoutSet, value: number): void {
    this.exercises.update(list =>
      list.map((e, i) => {
        if (i !== exIndex) return e;
        const sets = e.sets.map((s, si) =>
          si === setIndex ? { ...s, [field]: value } : s,
        );
        return { ...e, sets };
      }),
    );
  }

  updateExerciseTarget(
    exIndex: number,
    field: 'targetSets' | 'minReps' | 'maxReps' | 'targetWeight' | 'minDuration' | 'maxDuration',
    value: number,
  ): void {
    this.exercises.update(list =>
      list.map((e, i) => (i === exIndex ? { ...e, [field]: value } : e)),
    );
  }

  async validate(): Promise<void> {
    if (!this.label()) {
      this.snackBar.open('Donnez un nom à la séance', 'OK', { duration: 3000 });
      return;
    }
    if (this.exercises().length === 0) {
      this.snackBar.open('Ajoutez au moins un exercice', 'OK', { duration: 3000 });
      return;
    }

    const workout: Workout = {
      label: this.label(),
      date: this.date(),
      templateId: this.selectedTemplateId() ?? undefined,
      exercises: this.exercises(),
      completed: true,
      createdAt: Date.now(),
    };

    await this.storage.save(workout);
    this.snackBar.open('Séance validée !', undefined, { duration: 2500 });
    this.router.navigate(['/history']);
  }
}
