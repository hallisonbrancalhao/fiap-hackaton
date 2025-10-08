import { Component, signal } from '@angular/core';
import { Menubar } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';

@Component({
	selector: 'ui-header',
	templateUrl: './header.component.html',
	imports: [Menubar, RouterLink, Button]
})
export class HeaderComponent {
	items = signal<MenuItem[]>([
		{
			label: 'Início',
			icon: 'pi pi-home',
			routerLink: '/dashboard'
		},
		{
			label: 'Produtos',
			icon: 'pi pi-box',
			routerLink: '/dashboard/products'
		},
		{
			label: 'Vendas',
			icon: 'pi pi-shopping-cart',
			routerLink: '/dashboard/sales'
		},
		{
			label: 'Análises',
			icon: 'pi pi-chart-line',
			routerLink: '/dashboard/analytics'
		}
	]);
}
