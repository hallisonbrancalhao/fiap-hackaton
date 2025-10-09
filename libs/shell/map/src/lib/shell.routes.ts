import { Route } from '@angular/router';

export const mapShellRoutes: Route[] = [
  {
    path: ':userId',
    loadComponent: () =>
      import('@fiap-hackaton/map-feature-viewer').then(
        (m) => m.FarmMapViewerComponent
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('@fiap-hackaton/map-feature-viewer').then(
        (m) => m.FarmMapViewerComponent
      ),
  },
];
