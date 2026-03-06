import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'exercises',
    loadComponent: () =>
      import('./features/exercise-library/exercise-library.component').then(m => m.ExerciseLibraryComponent),
  },
  {
    path: 'templates',
    loadComponent: () =>
      import('./features/session-templates/session-templates.component').then(m => m.SessionTemplatesComponent),
  },
  {
    path: 'workout/new',
    loadComponent: () =>
      import('./features/workout-logger/workout-logger.component').then(m => m.WorkoutLoggerComponent),
  },
  {
    path: 'workout/:id',
    loadComponent: () =>
      import('./features/workout-logger/workout-logger.component').then(m => m.WorkoutLoggerComponent),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./features/history/history.component').then(m => m.HistoryComponent),
  },
  {
    path: 'progress',
    loadComponent: () =>
      import('./features/progress/progress.component').then(m => m.ProgressComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
