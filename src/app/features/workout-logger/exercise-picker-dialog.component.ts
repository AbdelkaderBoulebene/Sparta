import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ExerciseApiService } from '../../core/services/exercise-api.service';
import { ExerciseCardComponent } from '../../shared/components/exercise-card/exercise-card.component';
import { Exercise } from '../../core/models/exercise.model';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-exercise-picker-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ExerciseCardComponent,
  ],
  template: `
    <h2 mat-dialog-title>Choisir un exercice</h2>

    <div class="picker-filters">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Rechercher</mat-label>
        <input matInput [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" />
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>
      <mat-form-field appearance="outline" class="cat-field">
        <mat-label>Groupe musculaire</mat-label>
        <mat-select [ngModel]="selectedBodyPart()" (ngModelChange)="selectedBodyPart.set($event)">
          <mat-option value="">Tous</mat-option>
          @for (part of bodyParts(); track part) {
            <mat-option [value]="part">{{ langService.translateBodyPart(part) }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    <mat-dialog-content>
      @if (loading()) {
        <div class="picker-loading">
          <mat-spinner diameter="36" color="accent"></mat-spinner>
        </div>
      } @else {
        <div class="picker-grid">
          @for (ex of filtered(); track ex.exerciseId) {
            <app-exercise-card [exercise]="ex" [selectable]="true" (selected)="pick(ex)" />
          }
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { max-height: 50vh; overflow-y: auto; }
    .picker-filters { display: flex; gap: 12px; flex-wrap: wrap; padding: 0 24px 4px; }
    .search-field { flex: 1; min-width: 180px; }
    .cat-field { width: 160px; }
    .picker-loading { display: flex; justify-content: center; padding: 32px; }
    .picker-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
    }
  `],
})
export class ExercisePickerDialogComponent implements OnInit {
  private api = inject(ExerciseApiService);
  private dialogRef = inject(MatDialogRef<ExercisePickerDialogComponent>);
  readonly langService = inject(LanguageService);

  readonly exercises = this.api.exercises;
  readonly loading = this.api.loading;
  readonly bodyParts = this.api.bodyParts;

  searchTerm = signal('');
  selectedBodyPart = signal('');

  readonly filtered = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const words = term.split(/\s+/).filter(Boolean);
    const part = this.selectedBodyPart();
    return this.exercises().filter(ex => {
      const nameEn = ex.name.toLowerCase();
      const nameFr = (ex.nameFr || '').toLowerCase();
      const matchesName = words.length === 0 || words.every(w => nameEn.includes(w) || nameFr.includes(w));
      const matchesPart = !part || ex.bodyParts.includes(part);
      return matchesName && matchesPart;
    });
  });

  ngOnInit(): void {
    this.api.loadExercises();
  }

  pick(exercise: Exercise): void {
    this.dialogRef.close(exercise);
  }
}
