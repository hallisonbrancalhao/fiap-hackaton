import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardComponent, LoadingComponent, EmptyStateComponent } from '@fiap-hackaton/shared-ui';
import { ProductAnalytics } from '@fiap-hackaton/dashboard-domain';
import { ProductAnalyticsFacade } from '@fiap-hackaton/dashboard-data-access';

@Component({
  selector: 'lib-analytics-dashboard',
  imports: [
    CommonModule,
    TableModule,
    CardComponent,
    LoadingComponent,
    EmptyStateComponent,
    CurrencyPipe,
  ],
  template: `
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
          Análise & Relatórios
        </h1>
        <p class="text-surface-600 dark:text-surface-400 mt-2">
          Acompanhe o desempenho e insights da sua fazenda
        </p>
      </div>

      @if (isLoading()) {
        <lib-loading message="Carregando análises..." />
      } @else {
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-primary-50 dark:bg-primary-900 p-6 rounded-lg border border-primary-200 dark:border-primary-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-primary-600 dark:text-primary-400 mb-1">Receita Total</p>
                <p class="text-2xl font-bold text-primary-700 dark:text-primary-300">
                  {{ getTotalRevenue() | currency }}
                </p>
              </div>
              <i class="pi pi-dollar text-3xl text-primary-500 dark:text-primary-400"></i>
            </div>
          </div>

          <div class="bg-green-50 dark:bg-green-900 p-6 rounded-lg border border-green-200 dark:border-green-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-green-600 dark:text-green-400 mb-1">Lucro Total</p>
                <p class="text-2xl font-bold text-green-700 dark:text-green-300">
                  {{ getTotalProfit() | currency }}
                </p>
              </div>
              <i class="pi pi-chart-line text-3xl text-green-500 dark:text-green-400"></i>
            </div>
          </div>

          <div class="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-blue-600 dark:text-blue-400 mb-1">Margem de Lucro Média</p>
                <p class="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {{ getAvgProfitMargin() }}%
                </p>
              </div>
              <i class="pi pi-percentage text-3xl text-blue-500 dark:text-blue-400"></i>
            </div>
          </div>

          <div class="bg-orange-50 dark:bg-orange-900 p-6 rounded-lg border border-orange-200 dark:border-orange-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-orange-600 dark:text-orange-400 mb-1">Produtos Analisados</p>
                <p class="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {{ analytics().length }}
                </p>
              </div>
              <i class="pi pi-box text-3xl text-orange-500 dark:text-orange-400"></i>
            </div>
          </div>
        </div>

        <!-- Top Profitable Products -->
        <lib-card
          title="Produtos Mais Lucrativos"
          subtitle="Produtos com maiores margens de lucro"
        >
          @if (analytics().length === 0) {
            <lib-empty-state
              icon="pi pi-chart-bar"
              title="Sem dados de análise"
              description="Comece vendendo produtos para ver análises"
            />
          } @else {
            <p-table [value]="analytics()">
              <ng-template #header>
                <tr>
                  <th>Produto</th>
                  <th>Receita</th>
                  <th>Custo</th>
                  <th>Lucro</th>
                  <th>Margem</th>
                  <th>Qtd Vendida</th>
                  <th>Preço Médio</th>
                </tr>
              </ng-template>
              <ng-template #body let-item>
                <tr>
                  <td>
                    <span class="font-medium">{{ item.productName }}</span>
                  </td>
                  <td>{{ item.totalRevenue | currency }}</td>
                  <td>{{ item.totalCost | currency }}</td>
                  <td>
                    <span class="font-semibold text-green-600 dark:text-green-400">
                      {{ item.profit | currency }}
                    </span>
                  </td>
                  <td>
                    <span
                      class="px-2 py-1 rounded text-sm font-medium"
                      [class.bg-green-100]="item.profitMargin > 30"
                      [class.text-green-700]="item.profitMargin > 30"
                      [class.bg-yellow-100]="item.profitMargin > 10 && item.profitMargin <= 30"
                      [class.text-yellow-700]="item.profitMargin > 10 && item.profitMargin <= 30"
                      [class.bg-red-100]="item.profitMargin <= 10"
                      [class.text-red-700]="item.profitMargin <= 10"
                    >
                      {{ item.profitMargin.toFixed(1) }}%
                    </span>
                  </td>
                  <td>{{ item.totalQuantitySold }}</td>
                  <td>{{ item.averagePrice | currency }}</td>
                </tr>
              </ng-template>
            </p-table>
          }
        </lib-card>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsDashboardComponent implements OnInit {
  protected analytics = signal<ProductAnalytics[]>([]);
  protected isLoading = signal(false);

  private analyticsFacade = inject(ProductAnalyticsFacade);

  ngOnInit(): void {
    this.loadAnalytics();
  }

  protected getTotalRevenue(): number {
    return this.analytics().reduce((sum, item) => sum + item.totalRevenue, 0);
  }

  protected getTotalProfit(): number {
    return this.analytics().reduce((sum, item) => sum + item.profit, 0);
  }

  protected getAvgProfitMargin(): number {
    const items = this.analytics();
    if (items.length === 0) return 0;
    const sum = items.reduce((total, item) => total + item.profitMargin, 0);
    return Math.round((sum / items.length) * 10) / 10;
  }

  private loadAnalytics(): void {
    this.isLoading.set(true);
    // TODO: Get userId from auth service
    const userId = 'test-user-id';

    this.analyticsFacade.getTopProfitableProducts(userId, 10).subscribe({
      next: (analytics) => {
        this.analytics.set(analytics);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
}
