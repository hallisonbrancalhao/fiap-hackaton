import { Route } from '@angular/router';

export const mobileMapRoutes: Route[] = [
  {
    path: 'viewer/:userId',
    loadComponent: () =>
      import('@fiap-hackaton/map-feature-viewer').then(
        (m) => m.FarmMapViewerComponent
      ),
    data: { mobile: true, hideHeader: true }
  },
  {
    path: 'area-selector/:userId',
    loadComponent: () =>
      import('@fiap-hackaton/map-ui').then(
        (m) => m.PlantingAreaSelectorComponent
      ),
    data: { mobile: true, hideHeader: true, fullscreen: true }
  }
];
