import { Routes } from '@angular/router';

export const plantingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./planting-list/planting-list.component').then(m => m.PlantingListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./planting-form/planting-form.component').then(m => m.PlantingFormComponent),
  },
];
