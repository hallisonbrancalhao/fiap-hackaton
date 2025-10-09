import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductFacade } from '@fiap-hackaton/dashboard-data-access';
import { AuthLoginFacade } from '@fiap-hackaton/auth-data-access';
import { Product } from '@fiap-hackaton/dashboard-domain';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface InventoryItem extends Product {
  stockStatus: 'low' | 'medium' | 'high' | 'out';
  stockPercentage: number;
  valueInStock: number;
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
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Produtos em Estoque</p>
                <p class="text-2xl font-bold text-gray-800">{{ summary.totalProducts }}</p>
              </div>
              <div class="bg-blue-100 p-3 rounded-full">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Quantidade Total</p>
                <p class="text-2xl font-bold text-green-600">{{ summary.totalQuantity | number:'1.0-2' }}</p>
              </div>
              <div class="bg-green-100 p-3 rounded-full">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Valor em Estoque</p>
                <p class="text-2xl font-bold text-purple-600">R$ {{ summary.totalValue | number:'1.2-2' }}</p>
              </div>
              <div class="bg-purple-100 p-3 rounded-full">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Estoque Baixo</p>
                <p class="text-2xl font-bold text-red-600">{{ summary.lowStockCount }}</p>
              </div>
              <div class="bg-red-100 p-3 rounded-full">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
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
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque Atual</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque Mín/Máx</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo Médio</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor em Estoque</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @if (inventory$ | async; as items) {
                @if (items.length === 0) {
                  <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-gray-500">
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
                      <td class="px-6 py-4">
                        <div class="text-sm font-medium text-gray-900">{{ item.name }}</div>
                        <div class="text-sm text-gray-500">{{ item.variety || '-' }}</div>
                      </td>
                      <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {{ item.category }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center">
                          <span class="text-sm font-medium" [class.text-red-600]="item.stockStatus === 'low' || item.stockStatus === 'out'">
                            {{ item.currentStock | number:'1.0-2' }} {{ item.unit }}
                          </span>
                        </div>
                        <!-- Progress bar -->
                        @if (item.maxStockLevel && item.maxStockLevel > 0) {
                          <div class="w-32 h-2 bg-gray-200 rounded-full mt-2">
                            <div 
                              class="h-full rounded-full transition-all"
                              [class.bg-red-500]="item.stockStatus === 'low' || item.stockStatus === 'out'"
                              [class.bg-yellow-500]="item.stockStatus === 'medium'"
                              [class.bg-green-500]="item.stockStatus === 'high'"
                              [style.width.%]="item.stockPercentage">
                            </div>
                          </div>
                        }
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-500">
                        <div>Mín: {{ item.minStockLevel || 0 }}</div>
                        <div>Máx: {{ item.maxStockLevel || '-' }}</div>
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-900">
                        R$ {{ item.averageCost || 0 | number:'1.2-2' }}
                      </td>
                      <td class="px-6 py-4 text-sm font-medium text-green-600">
                        R$ {{ item.valueInStock | number:'1.2-2' }}
                      </td>
                      <td class="px-6 py-4">
                        @switch (item.stockStatus) {
                          @case ('out') {
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Sem Estoque
                            </span>
                          }
                          @case ('low') {
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Estoque Baixo
                            </span>
                          }
                          @case ('medium') {
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Estoque OK
                            </span>
                          }
                          @case ('high') {
                            <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Estoque Alto
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
    totalQuantity: number;
    totalValue: number;
    lowStockCount: number;
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
          const valueInStock = (product.currentStock || 0) * (product.averageCost || 0);

          return {
            ...product,
            stockStatus,
            stockPercentage,
            valueInStock
          } as InventoryItem;
        }).sort((a: InventoryItem, b: InventoryItem) => {
          // Ordenar por status: out > low > medium > high
          const statusOrder: Record<string, number> = { out: 0, low: 1, medium: 2, high: 3 };
          return statusOrder[a.stockStatus] - statusOrder[b.stockStatus];
        });
      })
    );

    this.summary$ = this.inventory$.pipe(
      map(items => ({
        totalProducts: items.length,
        totalQuantity: items.reduce((sum, item) => sum + (item.currentStock || 0), 0),
        totalValue: items.reduce((sum, item) => sum + item.valueInStock, 0),
        lowStockCount: items.filter(item => item.stockStatus === 'low' || item.stockStatus === 'out').length
      }))
    );
  }

  private getStockStatus(product: Product): 'low' | 'medium' | 'high' | 'out' {
    const currentStock = product.currentStock || 0;
    const minStock = product.minStockLevel || 0;
    const maxStock = product.maxStockLevel || 100;

    if (currentStock === 0) return 'out';
    if (currentStock <= minStock) return 'low';
    if (currentStock >= maxStock * 0.7) return 'high';
    return 'medium';
  }

  private getStockPercentage(product: Product): number {
    const currentStock = product.currentStock || 0;
    const maxStock = product.maxStockLevel || 100;
    
    return Math.min((currentStock / maxStock) * 100, 100);
  }

  navigateToNewProduct(): void {
    this.router.navigate(['/dashboard/products/new']);
  }

  viewProduct(id: string): void {
    this.router.navigate(['/dashboard/products', id]);
  }
}
