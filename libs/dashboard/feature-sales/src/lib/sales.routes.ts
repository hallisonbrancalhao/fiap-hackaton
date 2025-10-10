import { Routes } from '@angular/router';

export const salesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./sale-list/sale-list.component').then((m) => m.SaleListComponent),
  },
  {
    path: 'new',
    title: 'Nova Venda',
    loadComponent: () =>
      import('./sale-form/sale-form.component').then((m) => m.SaleFormComponent),
  },
  {
    path: 'edit/:id',
    title: 'Editar Venda',
    loadComponent: () =>
      import('./sale-form/sale-form.component').then((m) => m.SaleFormComponent),
  },
];
