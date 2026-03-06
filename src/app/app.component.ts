import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { WorkoutStorageService } from './core/services/workout-storage.service';
import { LanguageService } from './core/services/language.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private storage = inject(WorkoutStorageService);
  private breakpoints = inject(BreakpointObserver);
  readonly langService = inject(LanguageService);

  isMobile = false;
  sidenavOpened = true;
  sidenavMode: 'side' | 'over' = 'side';

  navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/dashboard' },
    { label: 'Exercices', icon: 'fitness_center', route: '/exercises' },
    { label: 'Programmes', icon: 'calendar_view_week', route: '/templates' },
    { label: 'Nouvelle séance', icon: 'add_circle', route: '/workout/new' },
    { label: 'Historique', icon: 'history', route: '/history' },
    { label: 'Progression', icon: 'show_chart', route: '/progress' },
  ];

  ngOnInit(): void {
    this.storage.init();
    this.breakpoints.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
      this.sidenavMode = result.matches ? 'over' : 'side';
      this.sidenavOpened = !result.matches;
    });
  }
}
