import { Routes } from '@angular/router';

export const hubRoutes: Routes = [
	{
		path: '',
		title: 'Fiap Farm | Painel',
		loadComponent: () => import('./lib/hub/hub.component').then(c => c.HubComponent),
	},
	{
		path: 'products',
		title: 'Fiap Farm | Produtos',
		children: [
			{
				path: '',
				title: 'Fiap Farm | Produtos',
				loadComponent: () => import('@fiap-hackaton/dashboard-feature-products').then(c => c.ProductListComponent),
			},
			{
				path: 'new',
				title: 'Fiap Farm | Novo Produto',
				loadComponent: () => import('@fiap-hackaton/dashboard-feature-products').then(c => c.ProductFormComponent),
			},
			{
				path: 'edit/:id',
				title: 'Fiap Farm | Editar Produto',
				loadComponent: () => import('@fiap-hackaton/dashboard-feature-products').then(c => c.ProductFormComponent),
			}
		]
	},
	{
		path: 'sales',
		title: 'Fiap Farm | Vendas',
		loadComponent: () => import('@fiap-hackaton/dashboard-feature-sales').then(c => c.SaleListComponent),
	},
	{
		path: 'analytics',
		title: 'Fiap Farm | Analytics',
		loadComponent: () => import('@fiap-hackaton/dashboard-feature-analytics').then(c => c.AnalyticsDashboardComponent),
	}
];
