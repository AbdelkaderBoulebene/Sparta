import { Component, inject, signal, computed, effect, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';
import { WorkoutStorageService } from '../../core/services/workout-storage.service';
import { ProgressService } from '../../core/services/progress.service';
import { LanguageService } from '../../core/services/language.service';

Chart.register(...registerables);

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatCardModule, MatIconModule],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss',
})
export class ProgressComponent implements AfterViewInit {
  private storage = inject(WorkoutStorageService);
  private progressService = inject(ProgressService);
  lang = inject(LanguageService);

  @ViewChild('progressChart') progressChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('frequencyChart') frequencyChartRef!: ElementRef<HTMLCanvasElement>;

  private progressChart: Chart | null = null;
  private frequencyChart: Chart | null = null;

  readonly workouts = this.storage.workouts;
  readonly exercisesUsed = computed(() => this.progressService.getExercisesUsed(this.workouts()));

  selectedExerciseId = signal('');
  viewReady = signal(false);
  private initialized = false;

  // Auto-select first exercise when data loads from IndexedDB
  private autoSelectEffect = effect(() => {
    const exercises = this.exercisesUsed();
    if (!this.initialized && exercises.length > 0) {
      this.initialized = true;
      this.selectedExerciseId.set(exercises[0].id);
    }
  });

  // (Re)draw progress chart whenever selected exercise or view readiness changes
  private progressEffect = effect(() => {
    const id = this.selectedExerciseId();
    if (this.viewReady() && id) {
      this.initProgressChart(id);
    }
  });

  private frequencyEffect = effect(() => {
    if (this.viewReady()) {
      this.updateFrequencyChart();
    }
  });

  exName(ex: { name: string; nameFr?: string }): string {
    return this.lang.lang() === 'fr' ? (ex.nameFr || ex.name) : ex.name;
  }

  ngAfterViewInit(): void {
    this.initFrequencyChart();
    this.viewReady.set(true); // triggers progressEffect and frequencyEffect
  }

  onExerciseChange(id: string): void {
    this.selectedExerciseId.set(id); // progressEffect handles chart update
  }

  private initProgressChart(exerciseId: string): void {
    const points = this.progressService.getExerciseProgress(this.workouts(), exerciseId);

    if (this.progressChart) this.progressChart.destroy();

    const ctx = this.progressChartRef.nativeElement.getContext('2d')!;
    this.progressChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: points.map(p => p.date),
        datasets: [
          {
            label: 'Poids max (kg)',
            data: points.map(p => p.maxWeight),
            borderColor: '#e94560',
            backgroundColor: 'rgba(233,69,96,0.15)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#e94560',
          },
        ],
      },
      options: this.chartOptions('Poids max (kg)'),
    });
  }

  private updateProgressChart(exerciseId: string): void {
    if (!this.progressChart) return;
    const points = this.progressService.getExerciseProgress(this.workouts(), exerciseId);
    this.progressChart.data.labels = points.map(p => p.date);
    this.progressChart.data.datasets[0].data = points.map(p => p.maxWeight);
    this.progressChart.update();
  }

  private initFrequencyChart(): void {
    const freq = this.progressService.getWeeklyFrequency(this.workouts());
    if (this.frequencyChart) this.frequencyChart.destroy();

    const ctx = this.frequencyChartRef.nativeElement.getContext('2d')!;
    this.frequencyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: freq.map(f => f.week),
        datasets: [
          {
            label: 'Séances / semaine',
            data: freq.map(f => f.count),
            backgroundColor: 'rgba(0, 188, 212, 0.7)',
            borderColor: '#00bcd4',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: this.chartOptions('Séances'),
    });
  }

  private updateFrequencyChart(): void {
    if (!this.frequencyChart) return;
    const freq = this.progressService.getWeeklyFrequency(this.workouts());
    this.frequencyChart.data.labels = freq.map(f => f.week);
    this.frequencyChart.data.datasets[0].data = freq.map(f => f.count);
    this.frequencyChart.update();
  }

  private chartOptions(yLabel: string): object {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: 'rgba(255,255,255,0.7)' } },
      },
      scales: {
        x: {
          ticks: { color: 'rgba(255,255,255,0.5)' },
          grid: { color: 'rgba(255,255,255,0.05)' },
        },
        y: {
          ticks: { color: 'rgba(255,255,255,0.5)' },
          grid: { color: 'rgba(255,255,255,0.05)' },
          title: { display: true, text: yLabel, color: 'rgba(255,255,255,0.4)' },
        },
      },
    };
  }
}
