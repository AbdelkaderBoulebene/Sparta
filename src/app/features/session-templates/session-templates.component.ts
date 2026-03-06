import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { TemplateStorageService } from '../../core/services/template-storage.service';
import { LanguageService } from '../../core/services/language.service';
import { ExercisePickerDialogComponent } from '../workout-logger/exercise-picker-dialog.component';
import { ExerciseApiService } from '../../core/services/exercise-api.service';
import { SessionTemplate, TemplateExercise } from '../../core/models/session-template.model';
import { Exercise } from '../../core/models/exercise.model';

@Component({
  selector: 'app-session-templates',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  templateUrl: './session-templates.component.html',
  styleUrl: './session-templates.component.scss',
})
export class SessionTemplatesComponent implements OnInit {
  private templateStorage = inject(TemplateStorageService);
  private exerciseApi = inject(ExerciseApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  readonly lang = inject(LanguageService);

  readonly templates = this.templateStorage.templates;

  // Form state
  isCreating = signal(false);
  editingId = signal<number | null>(null);

  formName = signal('');
  formSessionsPerWeek = signal(3);
  formExercises = signal<TemplateExercise[]>([]);

  ngOnInit(): void {
    this.exerciseApi.loadExercises();
    this.templateStorage.init();
  }

  startCreate(): void {
    this.editingId.set(null);
    this.formName.set('');
    this.formSessionsPerWeek.set(3);
    this.formExercises.set([]);
    this.isCreating.set(true);
  }

  startEdit(t: SessionTemplate): void {
    this.editingId.set(t.id!);
    this.formName.set(t.name);
    this.formSessionsPerWeek.set(t.sessionsPerWeek);
    this.formExercises.set(t.exercises.map(e => ({ ...e })));
    this.isCreating.set(true);
  }

  cancelForm(): void {
    this.isCreating.set(false);
    this.editingId.set(null);
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
      const newEx: TemplateExercise = {
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.name,
        exerciseNameFr: exercise.nameFr,
        exerciseImage: exercise.gifUrl,
        targetSets: 4,
        minReps: 8,
        maxReps: 10,
        targetWeight: 0,
      };
      this.formExercises.update(list => [...list, newEx]);
    });
  }

  removeFormExercise(index: number): void {
    this.formExercises.update(list => list.filter((_, i) => i !== index));
  }

  toggleFormExerciseTimeBased(index: number): void {
    this.formExercises.update(list =>
      list.map((e, i) => i === index ? { ...e, isTimeBased: !e.isTimeBased } : e),
    );
  }

  updateFormExercise(
    index: number,
    field: keyof TemplateExercise,
    value: string | number,
  ): void {
    this.formExercises.update(list =>
      list.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
    );
  }

  exDisplayName(ex: TemplateExercise): string {
    return this.lang.lang() === 'fr' ? (ex.exerciseNameFr || ex.exerciseName) : ex.exerciseName;
  }

  async saveTemplate(): Promise<void> {
    if (!this.formName().trim()) {
      this.snackBar.open('Donnez un nom au programme', 'OK', { duration: 3000 });
      return;
    }
    if (this.formExercises().length === 0) {
      this.snackBar.open('Ajoutez au moins un exercice', 'OK', { duration: 3000 });
      return;
    }

    const now = Date.now();
    const template: SessionTemplate = {
      name: this.formName().trim(),
      sessionsPerWeek: this.formSessionsPerWeek(),
      exercises: this.formExercises(),
      createdAt: now,
      updatedAt: now,
    };

    const id = this.editingId();
    if (id !== null) {
      await this.templateStorage.update({ ...template, id });
      this.snackBar.open('Programme mis à jour !', undefined, { duration: 2000 });
    } else {
      await this.templateStorage.save(template);
      this.snackBar.open('Programme créé !', undefined, { duration: 2000 });
    }

    this.isCreating.set(false);
    this.editingId.set(null);
  }

  async deleteTemplate(id: number): Promise<void> {
    await this.templateStorage.delete(id);
    this.snackBar.open('Programme supprimé', undefined, { duration: 2000 });
  }

  startSession(template: SessionTemplate): void {
    this.router.navigate(['/workout/new'], { queryParams: { templateId: template.id } });
  }

  daysLabel(n: number): string {
    return n === 1 ? '1 jour/semaine' : `${n} jours/semaine`;
  }
}
