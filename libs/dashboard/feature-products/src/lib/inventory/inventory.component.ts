import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductFacade } from '@fiap-hackaton/dashboard-data-access';
import { AuthLoginFacade } from '@fiap-hackaton/auth-data-access';
import { Product } from '@fiap-hackaton/dashboard-domain';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface InventoryItem extends Product {
  stockStatus: 'out' | 'critical' | 'low' | 'ok' | 'high' | 'full';
  stockPercentage: number;
  stockLevel: string; // Descritivo do nível atual
  daysUntilMinStock?: number; // Estimativa baseada em consumo médio
}

@Component({
  selector: 'lib-inventory',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container mx-auto p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Controle de Estoque</h1>
        <p class="text-gray-600 mt-2">Gerencie e monitore seu inventário de produtos</p>
      </div>

      <!-- Summary Cards -->
      @if (summary$ | async; as summary) {
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <!-- Tipos de Produtos -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Tipos de Produtos</p>
                <p class="text-2xl font-bold text-gray-800">{{ summary.totalProducts }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ summary.productsWithStock }} com estoque</p>
              </div>
              <div class="bg-blue-100 p-3 rounded-full">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Capacidade de Armazenamento -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Capacidade Utilizada</p>
                <p class="text-2xl font-bold text-green-600">{{ summary.storagePercentage | number:'1.0-0' }}%</p>
                <p class="text-xs text-gray-500 mt-1">{{ summary.totalMaxCapacity | number:'1.0-0' }} unidades máx.</p>
              </div>
              <div class="bg-green-100 p-3 rounded-full">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Atenção Necessária -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Precisam Atenção</p>
                <p class="text-2xl font-bold text-orange-600">{{ summary.needsAttentionCount }}</p>
                <p class="text-xs text-gray-500 mt-1">Baixo ou crítico</p>
              </div>
              <div class="bg-orange-100 p-3 rounded-full">
                <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Produtos Sem Estoque -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Sem Estoque</p>
                <p class="text-2xl font-bold text-red-600">{{ summary.outOfStockCount }}</p>
                <p class="text-xs text-gray-500 mt-1">Necessitam colheita</p>
              </div>
              <div class="bg-red-100 p-3 rounded-full">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Inventory Table -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-6 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-800">Lista de Produtos</h2>
            <button 
              (click)="navigateToNewProduct()"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              + Novo Produto
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade em Estoque</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Níveis (Mín/Máx)</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nível Atual</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @if (inventory$ | async; as items) {
                @if (items.length === 0) {
                  <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                      </svg>
                      <p class="mt-2">Nenhum produto em estoque</p>
                      <button 
                        (click)="navigateToNewProduct()"
                        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Adicionar Produto
                      </button>
                    </td>
                  </tr>
                } @else {
                  @for (item of items; track item.id) {
                    <tr class="hover:bg-gray-50 transition-colors cursor-pointer" (click)="viewProduct(item.id!)">
                      <!-- Produto -->
                      <td class="px-6 py-4">
                        <div class="text-sm font-medium text-gray-900">{{ item.name }}</div>
                        <div class="text-sm text-gray-500">{{ item.variety || '-' }}</div>
                      </td>

                      <!-- Categoria -->
                      <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {{ item.category }}
                        </span>
                      </td>

                      <!-- Quantidade em Estoque -->
                      <td class="px-6 py-4">
                        <div class="flex flex-col">
                          <span class="text-lg font-bold"
                            [class.text-red-600]="item.stockStatus === 'out' || item.stockStatus === 'critical'"
                            [class.text-orange-600]="item.stockStatus === 'low'"
                            [class.text-blue-600]="item.stockStatus === 'ok'"
                            [class.text-green-600]="item.stockStatus === 'high' || item.stockStatus === 'full'">
                            {{ item.currentStock || 0 | number:'1.0-2' }}
                          </span>
                          <span class="text-xs text-gray-500">{{ item.unit }}</span>
                        </div>
                      </td>

                      <!-- Níveis Mín/Máx -->
                      <td class="px-6 py-4 text-sm text-gray-600">
                        <div class="flex flex-col gap-1">
                          <div>Mín: <span class="font-medium">{{ item.minStockLevel || 0 }} {{ item.unit }}</span></div>
                          <div>Máx: <span class="font-medium">{{ item.maxStockLevel || 'N/A' }}</span></div>
                        </div>
                      </td>

                      <!-- Nível Atual com Barra -->
                      <td class="px-6 py-4">
                        <div class="flex flex-col gap-2">
                          <span class="text-sm font-medium text-gray-700">{{ item.stockLevel }}</span>
                          @if (item.maxStockLevel && item.maxStockLevel > 0) {
                            <div class="w-full h-2 bg-gray-200 rounded-full">
                              <div
                                class="h-full rounded-full transition-all"
                                [class.bg-red-600]="item.stockStatus === 'out'"
                                [class.bg-red-500]="item.stockStatus === 'critical'"
                                [class.bg-orange-500]="item.stockStatus === 'low'"
                                [class.bg-blue-500]="item.stockStatus === 'ok'"
                                [class.bg-green-500]="item.stockStatus === 'high'"
                                [class.bg-green-600]="item.stockStatus === 'full'"
                                [style.width.%]="item.stockPercentage">
                              </div>
                            </div>
                            <span class="text-xs text-gray-500">{{ item.stockPercentage | number:'1.0-0' }}% da capacidade</span>
                          }
                        </div>
                      </td>

                      <!-- Status -->
                      <td class="px-6 py-4">
                        @switch (item.stockStatus) {
                          @case ('out') {
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Sem Estoque
                            </span>
                          }
                          @case ('critical') {
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                              Crítico
                            </span>
                          }
                          @case ('low') {
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              Baixo
                            </span>
                          }
                          @case ('ok') {
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Normal
                            </span>
                          }
                          @case ('high') {
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Bom
                            </span>
                          }
                          @case ('full') {
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-900">
                              Cheio
                            </span>
                          }
                        }
                      </td>
                    </tr>
                  }
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class InventoryComponent implements OnInit {
  private productFacade = inject(ProductFacade);
  private authFacade = inject(AuthLoginFacade);
  private router = inject(Router);

  inventory$!: Observable<InventoryItem[]>;
  summary$!: Observable<{
    totalProducts: number;
    productsWithStock: number;
    totalMaxCapacity: number;
    storagePercentage: number;
    needsAttentionCount: number;
    outOfStockCount: number;
  }>;

  ngOnInit(): void {
    this.loadInventory();
  }

  private loadInventory(): void {
    const currentUser = this.authFacade.currentUser();
    if (!currentUser?.id) {
      return;
    }

    this.inventory$ = this.productFacade.getByUserId(currentUser.id).pipe(
      map((products: Product[]) => {
        return products.map((product: Product) => {
          const stockStatus = this.getStockStatus(product);
          const stockPercentage = this.getStockPercentage(product);
          const stockLevel = this.getStockLevelDescription(product);

          return {
            ...product,
            stockStatus,
            stockPercentage,
            stockLevel
          } as InventoryItem;
        }).sort((a: InventoryItem, b: InventoryItem) => {
          // Ordenar por prioridade: out > critical > low > ok > high > full
          const statusOrder: Record<string, number> = {
            out: 0,
            critical: 1,
            low: 2,
            ok: 3,
            high: 4,
            full: 5
          };
          return statusOrder[a.stockStatus] - statusOrder[b.stockStatus];
        });
      })
    );

    this.summary$ = this.inventory$.pipe(
      map(items => {
        const productsWithStock = items.filter(item => (item.currentStock || 0) > 0).length;
        const totalMaxCapacity = items.reduce((sum, item) => sum + (item.maxStockLevel || 0), 0);
        const totalCurrentStock = items.reduce((sum, item) => sum + (item.currentStock || 0), 0);
        const storagePercentage = totalMaxCapacity > 0 ? (totalCurrentStock / totalMaxCapacity) * 100 : 0;
        const needsAttentionCount = items.filter(item =>
          item.stockStatus === 'critical' || item.stockStatus === 'low'
        ).length;
        const outOfStockCount = items.filter(item => item.stockStatus === 'out').length;

        return {
          totalProducts: items.length,
          productsWithStock,
          totalMaxCapacity,
          storagePercentage,
          needsAttentionCount,
          outOfStockCount
        };
      })
    );
  }

  /**
   * Determina o status do estoque baseado em níveis definidos pelo produtor
   *
   * Lógica do produtor:
   * - OUT: Sem produto (precisa colher urgente)
   * - CRITICAL: Abaixo do mínimo (risco de faltar antes da próxima colheita)
   * - LOW: Próximo ao mínimo (atenção necessária)
   * - OK: Entre mínimo e ideal (situação normal)
   * - HIGH: Próximo à capacidade máxima (estoque bom)
   * - FULL: Na capacidade máxima (armazenamento cheio)
   */
  private getStockStatus(product: Product): 'out' | 'critical' | 'low' | 'ok' | 'high' | 'full' {
    const currentStock = product.currentStock || 0;
    const minStock = product.minStockLevel || 0;
    const maxStock = product.maxStockLevel || 0;

    // Sem estoque
    if (currentStock === 0) {
      return 'out';
    }

    // Se não há níveis definidos, considerar OK
    if (maxStock === 0) {
      return currentStock > 0 ? 'ok' : 'out';
    }

    const percentage = (currentStock / maxStock) * 100;
    const minPercentage = (minStock / maxStock) * 100;

    // Estoque cheio (95% ou mais da capacidade)
    if (percentage >= 95) {
      return 'full';
    }

    // Estoque alto (70% - 94% da capacidade)
    if (percentage >= 70) {
      return 'high';
    }

    // Abaixo do nível mínimo definido pelo produtor
    if (currentStock < minStock) {
      // Crítico: menos de 50% do mínimo
      if (currentStock < minStock * 0.5) {
        return 'critical';
      }
      return 'low';
    }

    // Entre mínimo e 70% da capacidade
    if (percentage >= minPercentage && percentage < 70) {
      // Próximo ao mínimo (até 20% acima)
      if (currentStock <= minStock * 1.2) {
        return 'low';
      }
      return 'ok';
    }

    return 'ok';
  }

  /**
   * Calcula a porcentagem de ocupação do estoque
   */
  private getStockPercentage(product: Product): number {
    const currentStock = product.currentStock || 0;
    const maxStock = product.maxStockLevel || 0;

    if (maxStock === 0) return 0;
    return Math.min((currentStock / maxStock) * 100, 100);
  }

  /**
   * Retorna descrição textual do nível de estoque
   */
  private getStockLevelDescription(product: Product): string {
    const currentStock = product.currentStock || 0;
    const minStock = product.minStockLevel || 0;
    const maxStock = product.maxStockLevel || 0;

    if (currentStock === 0) {
      return 'Vazio';
    }

    if (maxStock === 0) {
      return currentStock > 0 ? 'Com estoque' : 'Vazio';
    }

    const percentage = (currentStock / maxStock) * 100;
    const difference = currentStock - minStock;

    if (percentage >= 95) {
      return 'Capacidade máxima';
    }

    if (percentage >= 70) {
      return 'Estoque bom';
    }

    if (currentStock < minStock) {
      if (difference < 0) {
        return `${Math.abs(difference).toFixed(0)} abaixo do mínimo`;
      }
      return 'Abaixo do mínimo';
    }

    if (currentStock <= minStock * 1.2) {
      return 'Próximo ao mínimo';
    }

    return 'Nível adequado';
  }

  navigateToNewProduct(): void {
    this.router.navigate(['/dashboard/products/new']);
  }

  viewProduct(id: string): void {
    this.router.navigate(['/dashboard/products', id]);
  }
}
