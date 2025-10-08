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

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Produtos Card -->
        <div
          (click)="navigate('/dashboard/products')"
          (keyup.enter)="navigate('/dashboard/products')"
          tabindex="0"
          role="button"
          class="cursor-pointer group bg-white dark:bg-surface-800 rounded-xl border-2 border-surface-200 dark:border-surface-700 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 p-8"
        >
          <div class="flex flex-col items-center text-center">
            <div class="mb-6 p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <i class="pi pi-box text-5xl text-emerald-600 dark:text-emerald-400"></i>
            </div>
            <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-3">
              Produtos
            </h3>
            <p class="text-surface-600 dark:text-surface-400">
              Gerencie o catálogo de produtos da sua fazenda
            </p>
          </div>
        </div>

        <!-- Vendas Card -->
        <div
          (click)="navigate('/dashboard/sales')"
          (keyup.enter)="navigate('/dashboard/sales')"
          tabindex="0"
          role="button"
          class="cursor-pointer group bg-white dark:bg-surface-800 rounded-xl border-2 border-surface-200 dark:border-surface-700 hover:border-blue-500 hover:shadow-xl transition-all duration-300 p-8"
        >
          <div class="flex flex-col items-center text-center">
            <div class="mb-6 p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <i class="pi pi-shopping-cart text-5xl text-blue-600 dark:text-blue-400"></i>
            </div>
            <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-3">
              Vendas
            </h3>
            <p class="text-surface-600 dark:text-surface-400">
              Acompanhe suas vendas e receitas
            </p>
          </div>
        </div>

        <!-- Analytics Card -->
        <div
          (click)="navigate('/dashboard/analytics')"
          (keyup.enter)="navigate('/dashboard/analytics')"
          tabindex="0"
          role="button"
          class="cursor-pointer group bg-white dark:bg-surface-800 rounded-xl border-2 border-surface-200 dark:border-surface-700 hover:border-purple-500 hover:shadow-xl transition-all duration-300 p-8"
        >
          <div class="flex flex-col items-center text-center">
            <div class="mb-6 p-5 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <i class="pi pi-chart-line text-5xl text-purple-600 dark:text-purple-400"></i>
            </div>
            <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-3">
              Análises
            </h3>
            <p class="text-surface-600 dark:text-surface-400">
              Visualize relatórios e estatísticas
            </p>
          </div>
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
