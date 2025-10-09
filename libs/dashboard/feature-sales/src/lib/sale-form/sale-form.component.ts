import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CardComponent, LoadingComponent, ToastService } from '@fiap-hackaton/shared-ui';
import { SALE_STATUS, Product } from '@fiap-hackaton/dashboard-domain';
import { SaleFacade, ProductFacade, SaleInput } from '@fiap-hackaton/dashboard-data-access';
import { AuthLoginFacade } from '@fiap-hackaton/auth-data-access';
import { Timestamp } from '@angular/fire/firestore';

interface ProductOption extends Product {
  displayName: string;
}

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
        [title]="isEditMode() ? 'Visualizar Venda' : 'Nova Venda'"
        [subtitle]="isEditMode() ? 'Detalhes da venda' : 'Registre uma nova venda'">

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
                  data-testid="customer-name-input"
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
                  data-testid="customer-contact-input"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label for="saleDate" class="font-semibold">Data da Venda *</label>
                <p-datePicker
                  inputId="saleDate"
                  formControlName="saleDate"
                  [showIcon]="true"
                  dateFormat="dd/mm/yy"
                  placeholder="Selecione a data"
                  data-testid="sale-date-input"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label for="status" class="font-semibold">Status *</label>
                <p-select
                  id="status"
                  formControlName="status"
                  [options]="statusOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Selecione o status"
                  data-testid="status-select"
                />
              </div>
            </div>

            <!-- Items -->
            <div class="border border-surface-300 rounded-lg p-4">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">Itens da Venda</h3>
                <p-button
                  label="Adicionar Item"
                  icon="pi pi-plus"
                  size="small"
                  (onClick)="addItem()"
                  [disabled]="isEditMode()"
                  type="button"
                />
              </div>

              <div formArrayName="items" class="space-y-4">
                @for (item of items.controls; track $index) {
                  <div [formGroupName]="$index" class="p-4 bg-surface-50 rounded-lg border border-surface-200">
                    <!-- Informações do Produto Selecionado -->
                    @if (getSelectedProduct($index); as selectedProduct) {
                      <div class="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span class="text-gray-600">Produto:</span>
                            <p class="font-semibold text-gray-900">{{ selectedProduct.name }}</p>
                          </div>
                          <div>
                            <span class="text-gray-600">Estoque Total:</span>
                            <p class="font-semibold text-green-700">{{ selectedProduct.currentStock || 0 | number:'1.0-2' }} {{ selectedProduct.unit }}</p>
                          </div>
                          <div>
                            <span class="text-gray-600">Custo Médio:</span>
                            <p class="font-semibold text-gray-900">{{ selectedProduct.averageCost || 0 | currency:'BRL' }}/{{ selectedProduct.unit }}</p>
                          </div>
                          <div>
                            <span class="text-gray-600">Preço de Venda:</span>
                            <p class="font-semibold text-blue-700">{{ selectedProduct.pricePerUnit || 0 | currency:'BRL' }}/{{ selectedProduct.unit }}</p>
                          </div>
                        </div>
                      </div>
                    }

                    <!-- Campos do Item -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                      <!-- Produto -->
                      <div class="flex flex-col gap-2">
                        <label [for]="'productId-' + $index" class="text-sm font-medium">Produto *</label>
                        <p-select
                          [inputId]="'productId-' + $index"
                          formControlName="productId"
                          [options]="productOptions()"
                          optionLabel="name"
                          optionValue="id"
                          placeholder="Selecione o produto"
                          (onChange)="onProductChange($index)"
                          [disabled]="isEditMode()"
                        />
                      </div>

                      <!-- Quantidade -->
                      <div class="flex flex-col gap-2">
                        <label [for]="'quantity-' + $index" class="text-sm font-medium">
                          Quantidade *
                        </label>
                        <p-inputNumber
                          [inputId]="'quantity-' + $index"
                          formControlName="quantity"
                          [min]="0.01"
                          [max]="getMaxQuantity($index) || undefined"
                          [disabled]="isEditMode()"
                          (onInput)="calculateItemTotal($index)"
                          placeholder="0.00"
                        />
                        @if (isQuantityExceedingStock($index)) {
                          <small class="text-red-500">Máximo: {{ getMaxQuantity($index) }}</small>
                        } @else if (getMaxQuantity($index)) {
                          <small class="text-gray-500">Máximo: {{ getMaxQuantity($index) }}</small>
                        }
                      </div>

                      <!-- Preço Unitário -->
                      <div class="flex flex-col gap-2">
                        <label [for]="'pricePerUnit-' + $index" class="text-sm font-medium">
                          Preço Unitário *
                        </label>
                        <p-inputNumber
                          [inputId]="'pricePerUnit-' + $index"
                          formControlName="pricePerUnit"
                          mode="currency"
                          currency="BRL"
                          locale="pt-BR"
                          [min]="getMinPrice($index) || 0"
                          [disabled]="isEditMode()"
                          (onInput)="calculateItemTotal($index)"
                        />
                        @if (isPriceBelowCost($index)) {
                          <small class="text-orange-600">⚠ Abaixo do custo ({{ getMinPrice($index) | currency:'BRL' }})</small>
                        } @else if (getMinPrice($index)) {
                          <small class="text-gray-500">Custo: {{ getMinPrice($index) | currency:'BRL' }}</small>
                        }
                      </div>

                      <!-- Total e Ações -->
                      <div class="flex items-end gap-2">
                        <div class="flex-1">
                          <span class="text-sm font-medium block mb-1">Total</span>
                          <div class="flex flex-col">
                            <p class="text-lg font-bold text-primary-700">{{ getItemTotal($index) | currency:'BRL' }}</p>
                            @if (getItemProfit($index) !== null) {
                              <small [class.text-green-600]="getItemProfit($index)! > 0" [class.text-red-600]="getItemProfit($index)! < 0">
                                Lucro: {{ getItemProfit($index) | currency:'BRL' }}
                              </small>
                            }
                          </div>
                        </div>
                        @if (!isEditMode()) {
                          <p-button
                            icon="pi pi-trash"
                            severity="danger"
                            [text]="true"
                            (onClick)="removeItem($index)"
                            type="button"
                          />
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>

              @if (items.length === 0) {
                <p class="text-center text-surface-500 py-4">Nenhum item adicionado</p>
              }

              <div class="mt-4 pt-4 border-t border-surface-300">
                <div class="flex justify-between items-center">
                  <span class="text-lg font-semibold">Total da Venda:</span>
                  <span class="text-2xl font-bold text-primary-600">{{ getTotalAmount() | currency:'BRL' }}</span>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="flex flex-col gap-2">
              <label for="notes" class="font-semibold">Observações</label>
              <input
								pInputTextarea
                id="notes"
                formControlName="notes"
                placeholder="Observações sobre a venda (opcional)"
                [disabled]="isEditMode()"
              />
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-2 pt-4">
              <p-button
                label="Voltar"
                severity="secondary"
                [outlined]="true"
                (onClick)="onCancel()"
                type="button"
              />
              @if (!isEditMode()) {
                <p-button
                  label="Salvar"
                  type="submit"
                  [disabled]="saleForm.invalid || isSaving() || items.length === 0"
                  [loading]="isSaving()"
                />
              }
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
  protected isEditMode = signal(false);
  protected productOptions = signal<ProductOption[]>([]);

  protected statusOptions = [
    { label: 'Pendente', value: SALE_STATUS.PENDING },
    { label: 'Concluída', value: SALE_STATUS.COMPLETED },
    { label: 'Cancelada', value: SALE_STATUS.CANCELLED },
  ];

  private saleFacade = inject(SaleFacade);
  private productFacade = inject(ProductFacade);
  private authFacade = inject(AuthLoginFacade);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private saleId: string | null = null;

  constructor() {
    this.saleForm = this.fb.group({
      customerName: ['', Validators.required],
      customerContact: [''],
      saleDate: [new Date(), Validators.required],
      status: [SALE_STATUS.PENDING, Validators.required],
      items: this.fb.array([]),
      notes: [''],
    });
  }

  get items(): FormArray {
    return this.saleForm.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.loadProducts();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.saleId = id;
      this.isEditMode.set(true);
      this.loadSale(id);
    }
  }

  protected addItem(): void {
    const itemGroup = this.fb.group({
      productId: ['', Validators.required],
      productName: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit: [''],
      pricePerUnit: [0, [Validators.required, Validators.min(0)]],
      totalPrice: [0],
    });

    this.items.push(itemGroup);
  }

  protected removeItem(index: number): void {
    this.items.removeAt(index);
  }

  protected onProductChange(index: number): void {
    const item = this.items.at(index);
    const productId = item.get('productId')?.value;
    const product = this.productOptions().find(p => p.id === productId);

    if (product) {
      item.patchValue({
        productName: product.name,
        unit: product.unit,
        pricePerUnit: product.pricePerUnit,
      });
      this.calculateItemTotal(index);
    }
  }

  protected calculateItemTotal(index: number): void {
    const item = this.items.at(index);
    const quantity = item.get('quantity')?.value || 0;
    const pricePerUnit = item.get('pricePerUnit')?.value || 0;
    const totalPrice = quantity * pricePerUnit;

    item.patchValue({ totalPrice }, { emitEvent: false });
  }

  protected getItemTotal(index: number): number {
    const item = this.items.at(index);
    return item.get('totalPrice')?.value || 0;
  }

  protected getTotalAmount(): number {
    return this.items.controls.reduce((sum, item) => {
      return sum + (item.get('totalPrice')?.value || 0);
    }, 0);
  }

  protected getMaxQuantity(index: number): number | null {
    const item = this.items.at(index);
    const productId = item.get('productId')?.value;

    if (!productId) {
      return null;
    }

    const product = this.productOptions().find(p => p.id === productId);
    return product ? (product.currentStock || 0) : null;
  }

  protected isQuantityExceedingStock(index: number): boolean {
    const item = this.items.at(index);
    const quantity = item.get('quantity')?.value || 0;
    const maxQuantity = this.getMaxQuantity(index);

    if (maxQuantity === null) {
      return false;
    }

    return quantity > maxQuantity;
  }

  protected getSelectedProduct(index: number): Product | null {
    const item = this.items.at(index);
    const productId = item.get('productId')?.value;

    if (!productId) {
      return null;
    }

    return this.productOptions().find(p => p.id === productId) || null;
  }

  protected getMinPrice(index: number): number | null {
    const product = this.getSelectedProduct(index);
    return product ? (product.averageCost || 0) : null;
  }

  protected isPriceBelowCost(index: number): boolean {
    const item = this.items.at(index);
    const pricePerUnit = item.get('pricePerUnit')?.value || 0;
    const minPrice = this.getMinPrice(index);

    if (minPrice === null) {
      return false;
    }

    return pricePerUnit < minPrice;
  }

  protected getItemProfit(index: number): number | null {
    const item = this.items.at(index);
    const product = this.getSelectedProduct(index);

    if (!product) {
      return null;
    }

    const quantity = item.get('quantity')?.value || 0;
    const pricePerUnit = item.get('pricePerUnit')?.value || 0;
    const costPerUnit = product.averageCost || 0;

    return (pricePerUnit - costPerUnit) * quantity;
  }

  protected onSubmit(): void {
    if (this.saleForm.invalid || this.items.length === 0) {
      this.saleForm.markAllAsTouched();
      this.toastService.warn('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Validate stock for all items
    const hasStockIssues = this.items.controls.some((_, index) => this.isQuantityExceedingStock(index));
    if (hasStockIssues) {
      this.toastService.error('Um ou mais itens excedem o estoque disponível');
      return;
    }

    const currentUser = this.authFacade.currentUser() as any;
    if (!currentUser?.id) {
      this.toastService.error('Usuário não autenticado');
      return;
    }

    this.isSaving.set(true);
    const formValue = this.saleForm.value;

    // Prepare SaleInput for registerSale method
    const saleInput: SaleInput = {
      userId: currentUser.id,
      items: formValue.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit
      })),
      customerName: formValue.customerName,
      customerContact: formValue.customerContact,
      paymentMethod: formValue.paymentMethod || 'cash',
      isPaid: formValue.status === SALE_STATUS.COMPLETED,
      notes: formValue.notes
    };

    this.saleFacade.registerSale(saleInput).subscribe({
      next: (_id) => {
        this.toastService.success('Venda registrada com sucesso!');
        this.router.navigate(['/dashboard/sales']);
      },
      error: (_error) => {
        this.isSaving.set(false);
        // Error message already shown by facade
      },
    });
  }

  protected onCancel(): void {
    this.router.navigate(['/dashboard/sales']);
  }

  private loadProducts(): void {
    const currentUser = this.authFacade.currentUser() as any;
    if (!currentUser?.id) {
      return;
    }

    this.productFacade.getByUserId(currentUser.id).subscribe({
      next: (products) => {
        const availableProducts = products
          .filter(p => (p.currentStock || 0) > 0)
          .map(p => ({
            ...p,
            displayName: `${p.name} (Estoque: ${p.currentStock || 0} ${p.unit})`
          } as ProductOption));

        this.productOptions.set(availableProducts);
      },
      error: (_error) => {
        this.toastService.error('Erro ao carregar produtos. Recarregue a página.');
        this.productOptions.set([]);
      }
    });
  }

  private loadSale(id: string): void {
    this.isLoading.set(true);
    this.saleFacade.getById(id).subscribe({
      next: (sale) => {
        if (sale) {
          this.saleForm.patchValue({
            customerName: sale.customerName,
            customerContact: sale.customerContact,
            saleDate: sale.saleDate instanceof Timestamp ? sale.saleDate.toDate() : sale.saleDate,
            status: sale.status,
            notes: sale.notes,
          });

          sale.items.forEach(item => {
            const itemGroup = this.fb.group({
              productId: [item.productId],
              productName: [item.productName],
              quantity: [item.quantity],
              unit: [item.unit],
              pricePerUnit: [item.pricePerUnit],
              totalPrice: [item.totalPrice],
            });
            this.items.push(itemGroup);
          });

          this.saleForm.disable();
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Venda não encontrada');
        this.isLoading.set(false);
        this.router.navigate(['/dashboard/sales']);
      },
    });
  }
}
