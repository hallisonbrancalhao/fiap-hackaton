import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardComponent } from '@fiap-hackaton/shared-ui';
import { HubFacade } from '@fiap-hackaton/dashboard-data-access';
import { ProductFacade } from '@fiap-hackaton/dashboard-data-access';
import { SaleFacade } from '@fiap-hackaton/dashboard-data-access';
import { combineLatest, map } from 'rxjs';

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
          <h1 class="text-3xl font-bold text-surface-900">
            Estatísticas da Fazenda
          </h1>
          <p class="text-surface-600 mt-2">
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
          <div class="bg-primary-50 p-6 rounded-lg border border-primary-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-primary-600 mb-1">Produtos Cadastrados</p>
                <p class="text-2xl font-bold text-primary-700">
                  {{ stats()?.totalProducts || 0 }}
                </p>
              </div>
              <i class="pi pi-box text-3xl text-primary-500"></i>
            </div>
          </div>

          <div class="bg-green-50 p-6 rounded-lg border border-green-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-green-600 mb-1">Total de Vendas</p>
                <p class="text-2xl font-bold text-green-700">
                  {{ stats()?.totalSales || 0 }}
                </p>
              </div>
              <i class="pi pi-shopping-cart text-3xl text-green-500"></i>
            </div>
          </div>

          <div class="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-blue-600 mb-1">Receita Total</p>
                <p class="text-2xl font-bold text-blue-700">
                  {{ stats()?.totalRevenue || 0 | currency }}
                </p>
              </div>
              <i class="pi pi-dollar text-3xl text-blue-500"></i>
            </div>
          </div>

          <div class="bg-orange-50 p-6 rounded-lg border border-orange-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-orange-600 mb-1">Receita Média</p>
                <p class="text-2xl font-bold text-orange-700">
                  {{ stats()?.averageRevenue || 0 | currency }}
                </p>
              </div>
              <i class="pi pi-chart-line text-3xl text-orange-500"></i>
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
                      <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mr-2">
                        {{ index + 1 }}
                      </span>
                      {{ product.name }}
                    </div>
                  </td>
                  <td>{{ product.quantity }}</td>
                  <td>
                    <span class="font-semibold text-green-600">
                      {{ product.revenue | currency }}
                    </span>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          } @else {
            <div class="text-center py-8">
              <i class="pi pi-inbox text-4xl text-surface-400"></i>
              <p class="mt-4 text-surface-600">
                Nenhum produto vendido ainda
              </p>
            </div>
          }
        </lib-card>
      } @else {
        <div class="text-center py-8">
          <i class="pi pi-spin pi-spinner text-4xl text-primary-500"></i>
          <p class="mt-4 text-surface-600">
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
  private hubFacade = inject(HubFacade);
  private productFacade = inject(ProductFacade);
  private saleFacade = inject(SaleFacade);

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
    const farmId = this.farmId();
    
    combineLatest([
      this.productFacade.getByFarmId(farmId),
      this.saleFacade.getByFarmId(farmId),
    ])
      .pipe(
        map(([products, sales]) => {
          // Calcular receita total
          const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
          
          // Calcular produtos mais vendidos
          const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
          
          sales.forEach(sale => {
            sale.items.forEach(item => {
              const existing = productSales.get(item.productId);
              if (existing) {
                existing.quantity += item.quantity;
                existing.revenue += item.quantity * item.pricePerUnit;
              } else {
                const product = products.find(p => p.id === item.productId);
                productSales.set(item.productId, {
                  name: product?.name || 'Produto Desconhecido',
                  quantity: item.quantity,
                  revenue: item.quantity * item.pricePerUnit,
                });
              }
            });
          });
          
          // Ordenar por quantidade vendida
          const topProducts = Array.from(productSales.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
          
          return {
            totalProducts: products.length,
            totalSales: sales.length,
            totalRevenue,
            averageRevenue: sales.length > 0 ? totalRevenue / sales.length : 0,
            topProducts,
          };
        })
      )
      .subscribe({
        next: (stats) => {
          this.stats.set(stats);
        },
        error: (error) => {
          // eslint-disable-next-line no-console
          console.error('Erro ao carregar estatísticas:', error);
          this.stats.set({
            totalProducts: 0,
            totalSales: 0,
            totalRevenue: 0,
            averageRevenue: 0,
            topProducts: [],
          });
        },
      });
  }
}
