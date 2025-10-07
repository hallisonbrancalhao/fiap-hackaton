import { Routes } from '@angular/router';

export const hubRoutes: Routes = [
	{
		path: '',
		title: 'Fiap Farm | Painel',
		loadComponent: () => import('./lib/hub/hub.component').then(c => c.HubComponent),
	},
	{
		path: 'farms',
		title: 'Fiap Farm | Fazendas',
		loadComponent: () => import('./lib/farms/farms.component').then(c => c.FarmsComponent),
		children: [
			{
				path: '',
				title: 'Fiap Farm | Fazendas',
				pathMatch: 'full',
				redirectTo: 'list'
			},
			{
				path: 'list',
				title: 'Fiap Farm | Listagem',
				loadComponent: () => import('./lib/farms/features/list/farms-list.component').then(c => c.FarmsListComponent)
			},
			{
				path: 'detail/:id',
				title: 'Fiap Farm | Detalhes',
				loadComponent: () => import('./lib/farms/features/detail/farms-detail.component').then(c => c.FarmsDetailComponent)
			},
			{
				path: 'create',
				title: 'Fiap Farm | Criar',
				loadComponent: () => import('./lib/farms/features/create/create.component').then(c => c.CreateComponent)
			},
			{
				path: 'stats/:id',
				title: 'Fiap Farm | Relatório',
				loadComponent: () => import('./lib/farms/features/stats/farms-stats.component').then(c => c.FarmsStatsComponent)
			}
		]
	},
	{
		path: 'products',
		title: 'Fiap Farm | Produtos',
		loadComponent: () => import('@fiap-hackaton/dashboard-feature-products').then(c => c.ProductListComponent),
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
