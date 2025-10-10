import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { ShellLayoutComponent } from './layout/shell-layout.component';

export const shellRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth/login',
    title: 'Login - FIAP Farm',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('@fiap-farm/login').then((m) => m.FeatureLogin),
  },
  {
    path: 'auth/register',
    title: 'Cadastro - FIAP Farm',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('@fiap-farm/register').then((m) => m.FeatureRegister),
  },
  {
    path: '',
    component: ShellLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('@fiap-farm/dashboard-hub').then(m => m.hubRoutes)
      },
      {
        path: 'dashboard/inventory',
        title: 'Estoque - FIAP Farm',
        loadComponent: () => import('@fiap-hackaton/dashboard-feature-products').then(m => m.InventoryComponent)
      },
      {
        path: 'dashboard/plantings',
        loadChildren: () => import('@fiap-hackaton/dashboard-feature-plantings').then(m => m.plantingsRoutes)
      },
      {
        path: 'dashboard/sales',
        loadChildren: () => import('@fiap-hackaton/dashboard-feature-sales').then(m => m.salesRoutes)
      },
      {
        path: 'dashboard/harvest',
        loadChildren: () => import('@fiap-hackaton/dashboard-feature-harvest').then(m => m.harvestRoutes)
      },
      {
        path: 'map',
        loadChildren: () => import('map/Routes').then((m) => m.remoteRoutes),
      },
    ]
  },
  {
    path: 'mobile/map',
    loadChildren: () => import('@fiap-hackaton/shell-map').then(m => m.mobileMapRoutes),
  },
];
