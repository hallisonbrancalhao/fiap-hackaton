import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('@fiap-farm/login').then((m) => m.FeatureLogin),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('@fiap-farm/register').then((m) => m.FeatureRegister),
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('@fiap-farm/dashboard-shell').then((m) => m.dashboardRoutes),
      },
      {
        path: 'map',
        loadChildren: () => import('map/Routes').then((m) => m.remoteRoutes),
      },
    ],
  },
];
