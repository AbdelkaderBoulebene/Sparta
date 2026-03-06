import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ExerciseApiService } from '../../core/services/exercise-api.service';
import { ExerciseCardComponent } from '../../shared/components/exercise-card/exercise-card.component';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-exercise-library',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    ExerciseCardComponent,
  ],
  templateUrl: './exercise-library.component.html',
  styleUrl: './exercise-library.component.scss',
})
export class ExerciseLibraryComponent implements OnInit {
  private api = inject(ExerciseApiService);
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

  onSearch(value: string): void {
    this.searchTerm.set(value);
  }

  onBodyPartChange(value: string): void {
    this.selectedBodyPart.set(value);
  }

  refreshCache(): void {
    this.api.clearCache();
    this.api.loadExercises();
  }
}
