import { Component, signal, inject, computed } from '@angular/core';
import { Menubar } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { RouterLink, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { AuthLoginFacade } from '@fiap-hackaton/auth-data-access';

@Component({
  selector: 'ui-header',
  templateUrl: './header.component.html',
  imports: [Menubar, RouterLink, Button]
})
export class HeaderComponent {
  private authFacade = inject(AuthLoginFacade);
  private router = inject(Router);

  currentUser = this.authFacade.currentUser;
  userName = computed(() => this.currentUser()?.name || 'Usuário');

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

  protected onLogout(): void {
    this.authFacade.logout();
    this.router.navigate(['/login']);
  }
}
