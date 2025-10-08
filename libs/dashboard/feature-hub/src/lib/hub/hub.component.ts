import { Component, ChangeDetectionStrategy, inject, signal, AfterViewInit, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardComponent, LoadingComponent } from '@fiap-hackaton/shared-ui';
import { HubFacade, DashboardStats } from '@fiap-hackaton/dashboard-data-access';
import { AuthLoginFacade } from '@fiap-hackaton/auth-data-access';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  gradient: string;
  iconColor: string;
}

@Component({
  selector: 'fiap-farms-hub',
  imports: [CommonModule, CardComponent, LoadingComponent, CurrencyPipe, ButtonModule],
  templateUrl: './hub.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HubComponent implements AfterViewInit {
  protected readonly dashboardCards: DashboardCard[] = [
    {
      id: 'products',
      title: 'Produtos',
      description: 'Gerencie o catálogo completo de produtos da sua fazenda',
      icon: 'pi pi-box',
      route: '/dashboard/products',
      gradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      id: 'sales',
      title: 'Vendas',
      description: 'Registre e acompanhe todas as suas vendas e receitas',
      icon: 'pi pi-shopping-cart',
      route: '/dashboard/sales',
      gradient: 'bg-gradient-to-br from-blue-50 to-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      id: 'analytics',
      title: 'Análises',
      description: 'Visualize relatórios detalhados e estatísticas avançadas',
      icon: 'pi pi-chart-line',
      route: '/dashboard/analytics',
      gradient: 'bg-gradient-to-br from-purple-50 to-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  protected stats = signal<DashboardStats>({
    totalProducts: 0,
    totalSales: 0,
    monthlyRevenue: 0,
    recentSalesCount: 0,
  });
  protected isLoadingStats = signal(false);

  private readonly hubFacade = inject(HubFacade);
  private readonly authFacade = inject(AuthLoginFacade);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    // Usar setTimeout para garantir que estamos no contexto de injeção correto
    setTimeout(() => this.loadDashboardStats(), 0);
  }

  protected navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  protected refreshStats(): void {
    this.loadDashboardStats();
  }

  private loadDashboardStats(): void {
    this.isLoadingStats.set(true);

    const currentUser = this.authFacade.currentUser();

    if (!currentUser?.id) {
      this.isLoadingStats.set(false);
      return;
    }

    const farmId = currentUser.id;

    this.hubFacade.getDashboardStats(farmId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => {
          this.stats.set(stats);
          this.isLoadingStats.set(false);
        },
        error: () => {
          this.isLoadingStats.set(false);
        },
      });
  }
}
