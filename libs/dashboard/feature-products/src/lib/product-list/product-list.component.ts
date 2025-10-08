import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardComponent, LoadingComponent, EmptyStateComponent } from '@fiap-hackaton/shared-ui';
import { Product, PRODUCT_CATEGORY } from '@fiap-hackaton/dashboard-domain';
import { ProductFacade } from '@fiap-hackaton/dashboard-data-access';
import { AuthLoginFacade } from '@fiap-hackaton/auth-data-access';
import { PRODUCT_CATEGORY_SEVERITIES } from './product-list.constants';

@Component({
  selector: 'lib-product-list',
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    CardComponent,
    LoadingComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="p-6">
      <lib-card title="Produtos" subtitle="Gerencie os produtos da sua fazenda">
        <div class="mb-4 flex justify-end">
          <p-button
            label="Adicionar Produto"
            icon="pi pi-plus"
            (onClick)="onAddProduct()"
            data-testid="add-product-button"
          />
        </div>

        @if (isLoading()) {
          <lib-loading message="Carregando produtos..." />
        } @else if (products().length === 0) {
          <lib-empty-state
            icon="pi pi-box"
            title="Nenhum produto ainda"
            description="Comece adicionando seu primeiro produto"
            actionLabel="Adicionar Produto"
            (actionClick)="onAddProduct()"
          />
        } @else {
          <p-table [value]="products()" [paginator]="true" [rows]="10">
            <ng-template #header>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Unit</th>
                <th class="text-right">Ações</th>
              </tr>
            </ng-template>
            <ng-template #body let-product>
              <tr>
                <td>{{ product.name }}</td>
                <td>
                  <p-tag [value]="product.category" [severity]="getCategorySeverity(product.category)" />
                </td>
                <td>{{ product.pricePerUnit | currency }}</td>
                <td>{{ product.unit }}</td>
                <td class="text-right">
                  <p-button
                    icon="pi pi-pencil"
                    [text]="true"
                    [rounded]="true"
                    severity="secondary"
                    (onClick)="onEditProduct(product)"
                    data-testid="edit-product-button"
                  />
                  <p-button
                    icon="pi pi-trash"
                    [text]="true"
                    [rounded]="true"
                    severity="danger"
                    (onClick)="onDeleteProduct(product)"
                    data-testid="delete-product-button"
                  />
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </lib-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent implements OnInit {
  protected products = signal<Product[]>([]);
  protected isLoading = signal(false);

  private productFacade = inject(ProductFacade);
  private authFacade = inject(AuthLoginFacade);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadProducts();
  }

  protected onAddProduct(): void {
    this.router.navigate(['/dashboard/products/new']);
  }

  protected onEditProduct(product: Product): void {
    this.router.navigate(['/dashboard/products/edit', product.id]);
  }

  protected onDeleteProduct(product: Product): void {
    if (!product.id || !confirm(`Excluir produto "${product.name}"?`)) {
      return;
    }

    this.productFacade.delete(product.id).subscribe({
      next: () => {
        this.loadProducts();
      },
    });
  }

  protected getCategorySeverity(category: PRODUCT_CATEGORY): 'success' | 'info' | 'warn' | 'secondary' | 'contrast' | 'danger' {
    return PRODUCT_CATEGORY_SEVERITIES[category] || 'info';
  }

  private loadProducts(): void {
    this.isLoading.set(true);

    const farmId = this.authFacade.getCurrentFarmId();

    if (!farmId) {
      this.isLoading.set(false);
      return;
    }

    this.productFacade.getByFarmId(farmId).subscribe({
      next: (products) => {
        this.products.set(products);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
}
