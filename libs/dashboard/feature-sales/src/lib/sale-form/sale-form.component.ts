import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CardComponent, LoadingComponent, ToastService } from '@fiap-hackaton/shared-ui';
import { SALE_STATUS, Product } from '@fiap-hackaton/dashboard-domain';
import { SaleFacade, ProductFacade, SaleInput } from '@fiap-hackaton/dashboard-data-access';
import { AuthLoginFacade } from '@fiap-hackaton/auth-data-access';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'lib-sale-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    CardComponent,
    LoadingComponent,
  ],
  template: `
    <div class="p-6">
      <lib-card
        title="Nova Venda - Item Único"
        subtitle="Registre uma venda de um produto">

        @if (isLoading()) {
          <lib-loading message="Carregando..." />
        } @else {
          <form [formGroup]="saleForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Customer Info -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <label for="customerName" class="font-semibold">Nome do Cliente *</label>
                <input
                  pInputText
                  id="customerName"
                  formControlName="customerName"
                  placeholder="Nome do cliente"
                />
                @if (saleForm.get('customerName')?.invalid && saleForm.get('customerName')?.touched) {
                  <small class="text-red-500">Nome é obrigatório</small>
                }
              </div>

              <div class="flex flex-col gap-2">
                <label for="customerContact" class="font-semibold">Contato</label>
                <input
                  pInputText
                  id="customerContact"
                  formControlName="customerContact"
                  placeholder="Telefone ou email"
                />
              </div>
            </div>

            <!-- Product Selection -->
            <div class="border border-surface-300 rounded-lg p-4 bg-blue-50">
              <h3 class="text-lg font-semibold mb-4">Produto</h3>

              <div class="flex flex-col gap-2 mb-4">
                <label for="productId" class="font-medium">Selecione o Produto *</label>
                <p-select
                  id="productId"
                  formControlName="productId"
                  [options]="productOptions()"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Escolha um produto"
                  (onChange)="onProductChange()"
                  [filter]="true"
                  filterPlaceholder="Buscar produto..."
                />
              </div>

              @if (selectedProduct(); as product) {
                <div class="mb-4 p-4 bg-white rounded border border-blue-200">
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span class="text-gray-600 block">Produto:</span>
                      <p class="font-semibold text-gray-900">{{ product.name }}</p>
                    </div>
                    <div>
                      <span class="text-gray-600 block">Estoque Disponível:</span>
                      <p class="font-semibold text-green-700">{{ product.currentStock || 0 | number:'1.0-2' }} {{ product.unit }}</p>
                    </div>
                    <div>
                      <span class="text-gray-600 block">Custo Médio:</span>
                      <p class="font-semibold text-gray-900">{{ product.averageCost || 0 | currency:'BRL' }}/{{ product.unit }}</p>
                    </div>
                    <div>
                      <span class="text-gray-600 block">Preço Sugerido:</span>
                      <p class="font-semibold text-blue-700">{{ product.pricePerUnit || 0 | currency:'BRL' }}/{{ product.unit }}</p>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- Quantidade -->
                  <div class="flex flex-col gap-2">
                    <label for="quantity" class="font-medium">
                      Quantidade *
                      <span class="text-gray-500 font-normal text-sm ml-2">
                        (Máx: {{ product.currentStock || 0 | number:'1.0-2' }} {{ product.unit }})
                      </span>
                    </label>
                    <p-inputNumber
                      inputId="quantity"
                      formControlName="quantity"
                      [min]="0.01"
                      [max]="product.currentStock || 0"
                      (onInput)="calculateTotal()"
                      placeholder="0.00"
                      [suffix]="' ' + product.unit"
                    />
                    @if (isQuantityExceedingStock()) {
                      <small class="text-red-500 font-semibold">
                        ⚠️ Quantidade excede o estoque disponível!
                      </small>
                    } @else if (saleForm.get('quantity')?.value > 0) {
                      <small class="text-green-600">
                        ✓ Quantidade válida
                      </small>
                    }
                  </div>

                  <!-- Preço Unitário -->
                  <div class="flex flex-col gap-2">
                    <label for="pricePerUnit" class="font-medium">
                      Preço Unitário *
                      <span class="text-gray-500 font-normal text-sm ml-2">
                        (Custo: {{ product.averageCost || 0 | currency:'BRL' }})
                      </span>
                    </label>
                    <p-inputNumber
                      inputId="pricePerUnit"
                      formControlName="pricePerUnit"
                      mode="currency"
                      currency="BRL"
                      locale="pt-BR"
                      [min]="0"
                      (onInput)="calculateTotal()"
                    />
                    @if (isPriceBelowCost()) {
                      <small class="text-orange-600 font-semibold">
                        ⚠️ Preço abaixo do custo! Margem negativa.
                      </small>
                    } @else if (saleForm.get('pricePerUnit')?.value > 0) {
                      <small class="text-blue-600">
                        Margem: {{ getProfitMargin() | number:'1.0-1' }}%
                      </small>
                    }
                  </div>

                  <!-- Total -->
                  <div class="flex flex-col justify-end">
                    <span class="font-medium block mb-2">Total da Venda</span>
                    <div class="p-3 bg-primary-50 rounded border border-primary-200">
                      <p class="text-2xl font-bold text-primary-700">{{ totalAmount() | currency:'BRL' }}</p>
                      @if (profit() !== null) {
                        <small
                          [class.text-green-600]="profit()! > 0"
                          [class.text-red-600]="profit()! < 0"
                          [class.font-semibold]="true">
                          {{ profit()! >= 0 ? '📈' : '📉' }} Lucro: {{ profit() | currency:'BRL' }}
                        </small>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Notes -->
            <div class="flex flex-col gap-2">
              <label for="notes" class="font-semibold">Observações</label>
              <textarea
                pInputTextarea
                id="notes"
                formControlName="notes"
                placeholder="Observações sobre a venda (opcional)"
                rows="3"
              ></textarea>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-2 pt-4">
              <p-button
                label="Cancelar"
                severity="secondary"
                [outlined]="true"
                (onClick)="onCancel()"
                type="button"
              />
              <p-button
                label="Registrar Venda"
                type="submit"
                [disabled]="saleForm.invalid || isSaving() || isQuantityExceedingStock()"
                [loading]="isSaving()"
              />
            </div>
          </form>
        }
      </lib-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleFormComponent implements OnInit {
  protected saleForm: FormGroup;
  protected isLoading = signal(false);
  protected isSaving = signal(false);
  protected productOptions = signal<Product[]>([]);

  // Signal para controlar qual produto está selecionado
  protected selectedProductId = signal<string | null>(null);

  private saleFacade = inject(SaleFacade);
  private productFacade = inject(ProductFacade);
  private authFacade = inject(AuthLoginFacade);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Computed signals baseados em signals reativos
  protected selectedProduct = computed(() => {
    const productId = this.selectedProductId();
    if (!productId) return null;
    return this.productOptions().find(p => p.id === productId) || null;
  });

  protected totalAmount = computed(() => {
    const quantity = this.saleForm.get('quantity')?.value || 0;
    const pricePerUnit = this.saleForm.get('pricePerUnit')?.value || 0;
    return quantity * pricePerUnit;
  });

  protected profit = computed(() => {
    const product = this.selectedProduct();
    if (!product) return null;

    const quantity = this.saleForm.get('quantity')?.value || 0;
    const pricePerUnit = this.saleForm.get('pricePerUnit')?.value || 0;
    const costPerUnit = product.averageCost || 0;

    return (pricePerUnit - costPerUnit) * quantity;
  });

  constructor() {
    this.saleForm = this.fb.group({
      customerName: ['', Validators.required],
      customerContact: [''],
      saleDate: [new Date(), Validators.required],
      status: [SALE_STATUS.COMPLETED, Validators.required],
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      pricePerUnit: [0, [Validators.required, Validators.min(0)]],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  protected onProductChange(): void {
    const productId = this.saleForm.get('productId')?.value;

    // Atualizar o signal para disparar o computed
    this.selectedProductId.set(productId);

    const product = this.selectedProduct();
    if (product) {
      this.saleForm.patchValue({
        pricePerUnit: product.pricePerUnit || 0,
        quantity: 1
      });
      this.calculateTotal();
    }
  }

  protected calculateTotal(): void {
    // Trigger recalculation (handled by computed signals)
    this.saleForm.updateValueAndValidity();
  }

  protected isQuantityExceedingStock(): boolean {
    const product = this.selectedProduct();
    if (!product) return false;

    const quantity = this.saleForm.get('quantity')?.value || 0;
    const maxStock = product.currentStock || 0;

    return quantity > maxStock;
  }

  protected isPriceBelowCost(): boolean {
    const product = this.selectedProduct();
    if (!product) return false;

    const pricePerUnit = this.saleForm.get('pricePerUnit')?.value || 0;
    const cost = product.averageCost || 0;

    return pricePerUnit < cost;
  }

  protected getProfitMargin(): number {
    const product = this.selectedProduct();
    if (!product) return 0;

    const pricePerUnit = this.saleForm.get('pricePerUnit')?.value || 0;
    const costPerUnit = product.averageCost || 0;

    if (pricePerUnit === 0) return 0;

    return ((pricePerUnit - costPerUnit) / pricePerUnit) * 100;
  }

  protected onSubmit(): void {
    if (this.saleForm.invalid) {
      this.saleForm.markAllAsTouched();
      this.toastService.warn('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (this.isQuantityExceedingStock()) {
      this.toastService.error('Quantidade excede o estoque disponível');
      return;
    }

    const currentUser = this.authFacade.currentUser() as { id?: string } | null;
    if (!currentUser?.id) {
      this.toastService.error('Usuário não autenticado');
      return;
    }

    this.isSaving.set(true);
    const formValue = this.saleForm.value;

    const saleInput: SaleInput = {
      userId: currentUser.id,
      items: [{
        productId: formValue.productId,
        quantity: formValue.quantity,
        pricePerUnit: formValue.pricePerUnit
      }],
      customerName: formValue.customerName,
      customerContact: formValue.customerContact || undefined,
      notes: formValue.notes || undefined,
      isPaid: true
    };

    this.saleFacade.createSimpleSale(saleInput).subscribe({
      next: () => {
        this.toastService.success('Venda registrada com sucesso!');
        this.router.navigate(['/dashboard/sales']);
      },
      error: () => {
        this.isSaving.set(false);
      },
    });
  }

  protected onCancel(): void {
    this.router.navigate(['/dashboard/sales']);
  }

  private loadProducts(): void {
    const currentUser = this.authFacade.currentUser() as { id?: string } | null;
    if (!currentUser?.id) {
      return;
    }

    this.isLoading.set(true);
    this.productFacade.getByUserId(currentUser.id).subscribe({
      next: (products) => {
        const availableProducts = products.filter(p => (p.currentStock || 0) > 0);
        this.productOptions.set(availableProducts);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Erro ao carregar produtos');
        this.productOptions.set([]);
        this.isLoading.set(false);
      }
    });
  }
}
