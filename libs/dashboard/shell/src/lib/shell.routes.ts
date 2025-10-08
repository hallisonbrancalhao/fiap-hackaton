import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { ShellLayoutComponent } from './layout/shell-layout.component';

export const shellRoutes: Routes = [
	{
		path: '',
		redirectTo: 'auth/login',
		pathMatch: 'full',
	},
	{
		path: 'auth/login',
		title: 'Login - FIAP Farm',
		loadComponent: () =>
			import('@fiap-farm/login').then((m) => m.FeatureLogin),
	},
	{
		path: 'auth/register',
		title: 'Cadastro - FIAP Farm',
		loadComponent: () =>
			import('@fiap-farm/register').then((m) => m.FeatureRegister),
	},
	{
		path: '',
		component: ShellLayoutComponent, // ← Layout com header
		canActivate: [authGuard],
		children: [
			{
				path: 'dashboard',
				loadChildren: () => import('@fiap-farm/dashboard-hub').then(m => m.hubRoutes)
			},
			{
				path: 'map',
				loadChildren: () => import('map/Routes').then((m) => m.remoteRoutes),
			},
		]
	},
];
