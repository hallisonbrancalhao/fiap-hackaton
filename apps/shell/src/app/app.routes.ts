import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'map',
    loadChildren: () => import('map/Routes').then((m) => m.remoteRoutes),
  },
  {
    path: '',
    loadChildren: () => import('@fiap-farm/dashboard-shell').then((m) => m.dashboardRoutes),
  },
];
