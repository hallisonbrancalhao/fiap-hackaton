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
			label: 'Dashboard',
			icon: 'pi pi-th-large',
			routerLink: '/dashboard'
		},
		{
			label: 'Início',
			icon: 'pi pi-home'
		},
		{
			label: 'Funcionalidades',
			icon: 'pi pi-star'
		},
		{
			label: 'Fazendas',
			icon: 'pi pi-search',
			items: [
				{
					label: 'Compras',
					icon: 'pi pi-shopping-cart'
				}
			]
		},
		{
			label: 'Contato',
			icon: 'pi pi-envelope'
		}
	]);
}
