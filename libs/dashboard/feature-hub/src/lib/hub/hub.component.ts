import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'fiap-farms-hub',
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
          Dashboard
        </h1>
        <p class="text-surface-600 dark:text-surface-400 mt-2">
          Bem-vindo ao FIAP FARM - Gerencie sua fazenda de forma eficiente
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Produtos Card -->
        <div
          (click)="navigate('/dashboard/products')"
          (keyup.enter)="navigate('/dashboard/products')"
          tabindex="0"
          role="button"
          class="cursor-pointer group bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 hover:shadow-lg transition-all p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="p-4 bg-primary-50 dark:bg-primary-900 rounded-lg group-hover:scale-110 transition-transform">
              <i class="pi pi-box text-3xl text-primary-600 dark:text-primary-400"></i>
            </div>
          </div>
          <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">
            Produtos
          </h3>
          <p class="text-surface-600 dark:text-surface-400 text-sm">
            Gerencie o catálogo de produtos da sua fazenda
          </p>
        </div>

        <!-- Vendas Card -->
        <div
          (click)="navigate('/dashboard/sales')"
          (keyup.enter)="navigate('/dashboard/sales')"
          tabindex="0"
          role="button"
          class="cursor-pointer group bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 hover:shadow-lg transition-all p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="p-4 bg-green-50 dark:bg-green-900 rounded-lg group-hover:scale-110 transition-transform">
              <i class="pi pi-shopping-cart text-3xl text-green-600 dark:text-green-400"></i>
            </div>
          </div>
          <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">
            Vendas
          </h3>
          <p class="text-surface-600 dark:text-surface-400 text-sm">
            Acompanhe suas vendas e receitas
          </p>
        </div>

        <!-- Analytics Card -->
        <div
          (click)="navigate('/dashboard/analytics')"
          (keyup.enter)="navigate('/dashboard/analytics')"
          tabindex="0"
          role="button"
          class="cursor-pointer group bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 hover:shadow-lg transition-all p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg group-hover:scale-110 transition-transform">
              <i class="pi pi-chart-line text-3xl text-blue-600 dark:text-blue-400"></i>
            </div>
          </div>
          <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">
            Análises
          </h3>
          <p class="text-surface-600 dark:text-surface-400 text-sm">
            Visualize relatórios e estatísticas
          </p>
        </div>

        <!-- Fazendas Card -->
        <div
          (click)="navigate('/dashboard/farms')"
          (keyup.enter)="navigate('/dashboard/farms')"
          tabindex="0"
          role="button"
          class="cursor-pointer group bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 hover:shadow-lg transition-all p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="p-4 bg-orange-50 dark:bg-orange-900 rounded-lg group-hover:scale-110 transition-transform">
              <i class="pi pi-map text-3xl text-orange-600 dark:text-orange-400"></i>
            </div>
          </div>
          <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">
            Fazendas
          </h3>
          <p class="text-surface-600 dark:text-surface-400 text-sm">
            Gerencie suas fazendas e propriedades
          </p>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
          <p class="text-sm opacity-90 mb-1">Produtos Cadastrados</p>
          <p class="text-3xl font-bold">-</p>
          <p class="text-sm opacity-75 mt-2">Acesse Produtos para mais detalhes</p>
        </div>
        <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <p class="text-sm opacity-90 mb-1">Vendas do Mês</p>
          <p class="text-3xl font-bold">-</p>
          <p class="text-sm opacity-75 mt-2">Acesse Vendas para mais detalhes</p>
        </div>
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <p class="text-sm opacity-90 mb-1">Receita Total</p>
          <p class="text-3xl font-bold">-</p>
          <p class="text-sm opacity-75 mt-2">Acesse Análises para mais detalhes</p>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HubComponent {
  private router = inject(Router);

  protected navigate(path: string): void {
    this.router.navigate([path]);
  }
}
