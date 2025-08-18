import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'history',
    loadComponent: () => import('./components/historical/historical.component').then(m => m.HistoricalComponent),
  }
];
