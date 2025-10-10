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
      label: 'Mapa',
      icon: 'pi pi-map',
      command: () => this.navigateToMap()
    },
    {
      label: 'Produtos',
      icon: 'pi pi-box',
      routerLink: '/dashboard/products'
    },
    {
      label: 'Estoque',
      icon: 'pi pi-warehouse',
      routerLink: '/dashboard/inventory'
    },
    {
      label: 'Plantios',
      icon: 'pi pi-sun',
      routerLink: '/dashboard/plantings'
    },
    {
      label: 'Vendas',
      icon: 'pi pi-shopping-cart',
      routerLink: '/dashboard/sales'
    }
  ]);

  protected navigateToMap(): void {
    const userId = this.currentUser()?.id;
    if (userId) {
      this.router.navigate(['/map', userId]);
    }
  }

  protected onLogout(): void {
    this.authFacade.logout();
    this.router.navigate(['/auth/login']);
  }
}
