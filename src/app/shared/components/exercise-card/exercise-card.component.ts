import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Exercise } from '../../../core/models/exercise.model';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-exercise-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './exercise-card.component.html',
  styleUrl: './exercise-card.component.scss',
})
export class ExerciseCardComponent {
  @Input({ required: true }) exercise!: Exercise;
  @Input() selectable = false;
  @Output() selected = new EventEmitter<Exercise>();

  private lang = inject(LanguageService);

  get displayName(): string {
    return this.lang.lang() === 'fr'
      ? (this.exercise.nameFr || this.exercise.name)
      : this.exercise.name;
  }

  get mainImage(): string {
    return this.exercise.gifUrl ?? '';
  }

  get bodyPartLabel(): string {
    return this.lang.translateBodyPart(this.exercise.bodyParts[0] ?? '');
  }

  get muscles(): string {
    const all = [...this.exercise.targetMuscles, ...this.exercise.secondaryMuscles];
    return all.filter(Boolean).slice(0, 3).map(m => this.lang.translateMuscle(m)).join(', ') || 'Non précisé';
  }
}
