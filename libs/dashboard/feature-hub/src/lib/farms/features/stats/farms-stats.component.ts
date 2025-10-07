import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardComponent } from '@fiap-hackaton/shared-ui';

interface FarmStats {
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  averageRevenue: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

@Component({
  selector: 'fiap-farms-stats',
  imports: [CommonModule, ButtonModule, TableModule, CardComponent, CurrencyPipe],
  template: `
    <div class="p-6">
      <div class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
            Estatísticas da Fazenda
          </h1>
          <p class="text-surface-600 dark:text-surface-400 mt-2">
            Análise detalhada de desempenho
          </p>
        </div>
        <p-button
          label="Voltar"
          icon="pi pi-arrow-left"
          severity="secondary"
          [outlined]="true"
          (onClick)="onBack()"
        />
      </div>

      @if (stats()) {
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-primary-50 dark:bg-primary-900 p-6 rounded-lg border border-primary-200 dark:border-primary-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-primary-600 dark:text-primary-400 mb-1">Produtos Cadastrados</p>
                <p class="text-2xl font-bold text-primary-700 dark:text-primary-300">
                  {{ stats()?.totalProducts || 0 }}
                </p>
              </div>
              <i class="pi pi-box text-3xl text-primary-500 dark:text-primary-400"></i>
            </div>
          </div>

          <div class="bg-green-50 dark:bg-green-900 p-6 rounded-lg border border-green-200 dark:border-green-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-green-600 dark:text-green-400 mb-1">Total de Vendas</p>
                <p class="text-2xl font-bold text-green-700 dark:text-green-300">
                  {{ stats()?.totalSales || 0 }}
                </p>
              </div>
              <i class="pi pi-shopping-cart text-3xl text-green-500 dark:text-green-400"></i>
            </div>
          </div>

          <div class="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-blue-600 dark:text-blue-400 mb-1">Receita Total</p>
                <p class="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {{ stats()?.totalRevenue || 0 | currency }}
                </p>
              </div>
              <i class="pi pi-dollar text-3xl text-blue-500 dark:text-blue-400"></i>
            </div>
          </div>

          <div class="bg-orange-50 dark:bg-orange-900 p-6 rounded-lg border border-orange-200 dark:border-orange-700">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-orange-600 dark:text-orange-400 mb-1">Receita Média</p>
                <p class="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {{ stats()?.averageRevenue || 0 | currency }}
                </p>
              </div>
              <i class="pi pi-chart-line text-3xl text-orange-500 dark:text-orange-400"></i>
            </div>
          </div>
        </div>

        <!-- Top Products Table -->
        <lib-card title="Produtos Mais Vendidos" subtitle="Ranking de produtos por quantidade vendida">
          @if (stats()?.topProducts && stats()!.topProducts.length > 0) {
            <p-table [value]="stats()!.topProducts">
              <ng-template #header>
                <tr>
                  <th>Produto</th>
                  <th>Quantidade Vendida</th>
                  <th>Receita Gerada</th>
                </tr>
              </ng-template>
              <ng-template #body let-product let-index="rowIndex">
                <tr>
                  <td>
                    <div class="flex items-center">
                      <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm font-medium mr-2">
                        {{ index + 1 }}
                      </span>
                      {{ product.name }}
                    </div>
                  </td>
                  <td>{{ product.quantity }}</td>
                  <td>
                    <span class="font-semibold text-green-600 dark:text-green-400">
                      {{ product.revenue | currency }}
                    </span>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          } @else {
            <div class="text-center py-8">
              <i class="pi pi-inbox text-4xl text-surface-400 dark:text-surface-600"></i>
              <p class="mt-4 text-surface-600 dark:text-surface-400">
                Nenhum produto vendido ainda
              </p>
            </div>
          }
        </lib-card>
      } @else {
        <div class="text-center py-8">
          <i class="pi pi-spin pi-spinner text-4xl text-primary-500"></i>
          <p class="mt-4 text-surface-600 dark:text-surface-400">
            Carregando estatísticas...
          </p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmsStatsComponent implements OnInit {
  protected stats = signal<FarmStats | null>(null);
  private farmId = signal<string>('');

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.farmId.set(params['id']);
      this.loadStats();
    });
  }

  protected onBack(): void {
    this.router.navigate(['/dashboard/farms/detail', this.farmId()]);
  }

  private loadStats(): void {
    // TODO: Chamar serviço para carregar estatísticas
    // Simulando dados mockados
    setTimeout(() => {
      this.stats.set({
        totalProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
        averageRevenue: 0,
        topProducts: [],
      });
    }, 500);
  }
}
