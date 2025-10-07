import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
	{
		path: '',
		loadChildren: () => import('@fiap-farm/dashboard-hub').then(m => m.hubRoutes)
	}
];
