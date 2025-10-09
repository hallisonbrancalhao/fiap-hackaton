import { Route } from '@angular/router';

export const mapShellRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('@fiap-hackaton/map-feature-viewer').then(
        (m) => m.FarmMapViewerComponent
      ),
  },
];
