import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'charts',
    loadComponent: () => import('./components/charts/charts.component').then(m => m.ChartsComponent),
  }
];
