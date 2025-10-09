import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CardComponent, LoadingComponent } from '@fiap-hackaton/shared-ui';
import { Product, PRODUCT_CATEGORY, PRODUCT_UNIT } from '@fiap-hackaton/dashboard-domain';
import { ProductFacade } from '@fiap-hackaton/dashboard-data-access';
import { AuthLoginFacade } from '@fiap-hackaton/auth-data-access';

@Component({
  selector: 'lib-product-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    CardComponent,
    LoadingComponent,
  ],
  template: `
    <div class="p-6">
      <lib-card
        [title]="isEditMode() ? 'Editar Produto' : 'Novo Produto'"
        [subtitle]="isEditMode() ? 'Atualize as informações do produto' : 'Adicione um novo produto à sua fazenda'">

        @if (isLoading()) {
          <lib-loading message="Carregando produto..." />
        } @else {
          <form [formGroup]="productForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Nome -->
              <div class="flex flex-col gap-2">
                <label for="name" class="font-semibold">Nome *</label>
                <input
                  pInputText
                  id="name"
                  formControlName="name"
                  placeholder="Ex: Tomate"
                  data-testid="product-name-input"
                />
                @if (productForm.get('name')?.invalid && productForm.get('name')?.touched) {
                  <small class="text-red-500">Nome é obrigatório</small>
                }
              </div>

              <!-- Categoria -->
              <div class="flex flex-col gap-2">
                <label for="category" class="font-semibold">Categoria *</label>
                <p-select
                  id="category"
                  formControlName="category"
                  [options]="categoryOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Selecione uma categoria"
                  data-testid="product-category-select"
                />
                @if (productForm.get('category')?.invalid && productForm.get('category')?.touched) {
                  <small class="text-red-500">Categoria é obrigatória</small>
                }
              </div>

              <!-- Preço por Unidade -->
              <div class="flex flex-col gap-2">
                <label for="pricePerUnit" class="font-semibold">Preço por Unidade *</label>
                <p-inputNumber
                  inputId="pricePerUnit"
                  formControlName="pricePerUnit"
                  mode="currency"
                  currency="BRL"
                  locale="pt-BR"
                  [minFractionDigits]="2"
                  [min]="0"
                  placeholder="0,00"
                  data-testid="product-price-input"
                />
                @if (productForm.get('pricePerUnit')?.invalid && productForm.get('pricePerUnit')?.touched) {
                  <small class="text-red-500">Preço é obrigatório</small>
                }
              </div>

              <!-- Unidade -->
              <div class="flex flex-col gap-2">
                <label for="unit" class="font-semibold">Unidade *</label>
                <p-select
                  id="unit"
                  formControlName="unit"
                  [options]="unitOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Selecione uma unidade"
                  data-testid="product-unit-select"
                />
                @if (productForm.get('unit')?.invalid && productForm.get('unit')?.touched) {
                  <small class="text-red-500">Unidade é obrigatória</small>
                }
              </div>
            </div>

            <!-- Ações -->
            <div class="flex justify-end gap-2 pt-4">
              <p-button
                label="Cancelar"
                severity="secondary"
                [outlined]="true"
                (onClick)="onCancel()"
                data-testid="cancel-button"
              />
              <p-button
                label="Salvar"
                type="submit"
                [disabled]="productForm.invalid || isSaving()"
                [loading]="isSaving()"
                data-testid="save-button"
              />
            </div>
          </form>
        }
      </lib-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent implements OnInit {
  protected productForm: FormGroup;
  protected isLoading = signal(false);
  protected isSaving = signal(false);
  protected isEditMode = signal(false);

  protected categoryOptions = [
    { label: 'Vegetais', value: PRODUCT_CATEGORY.VEGETABLES },
    { label: 'Frutas', value: PRODUCT_CATEGORY.FRUITS },
    { label: 'Grãos', value: PRODUCT_CATEGORY.GRAINS },
    { label: 'Laticínios', value: PRODUCT_CATEGORY.DAIRY },
    { label: 'Carnes', value: PRODUCT_CATEGORY.MEAT },
    { label: 'Outros', value: PRODUCT_CATEGORY.OTHER },
  ];

  protected unitOptions = [
    { label: 'Kg', value: PRODUCT_UNIT.KG },
    { label: 'Unidade', value: PRODUCT_UNIT.UNIT },
    { label: 'Litro', value: PRODUCT_UNIT.LITER },
    { label: 'Maço', value: PRODUCT_UNIT.BUNCH },
  ];

  private productFacade = inject(ProductFacade);
  private authFacade = inject(AuthLoginFacade);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private productId: string | null = null;

  constructor() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      pricePerUnit: [0, [Validators.required, Validators.min(0)]],
      unit: ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode.set(true);
      this.loadProduct(this.productId);
    }
  }

  protected onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.productForm.value;

    const currentUser = this.authFacade.currentUser();
    
    if (!currentUser?.id) {
      this.isSaving.set(false);
      return;
    }

    const productData: Omit<Product, 'id'> = {
      ...formValue,
      userId: currentUser.id,
    };

    if (this.isEditMode() && this.productId) {
      this.productFacade.update(this.productId, productData).subscribe({
        next: () => {
          this.router.navigate(['/dashboard/products']);
        },
        error: () => {
          this.isSaving.set(false);
        },
      });
    } else {
      this.productFacade.create(productData).subscribe({
        next: () => {
          this.router.navigate(['/dashboard/products']);
        },
        error: () => {
          this.isSaving.set(false);
        },
      });
    }
  }

  protected onCancel(): void {
    this.router.navigate(['/dashboard/products']);
  }

  private loadProduct(id: string): void {
    this.isLoading.set(true);
    this.productFacade.getById(id).subscribe({
      next: (product) => {
        if (product) {
          this.productForm.patchValue({
            name: product.name,
            category: product.category,
            pricePerUnit: product.pricePerUnit,
            unit: product.unit,
            description: product.description || '',
          });
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard/products']);
      },
    });
  }
}
