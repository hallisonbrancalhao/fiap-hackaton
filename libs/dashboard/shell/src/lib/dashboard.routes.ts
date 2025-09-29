import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
	{
		path: '',
		title: 'Fiap Farm | Painel',
		loadComponent: () => import('@fiap-farm/dashboard-hub').then(c => c.HubComponent),
		loadChildren: () => import('@fiap-farm/dashboard-hub').then(m => m.hubRoutes)
	}
];
