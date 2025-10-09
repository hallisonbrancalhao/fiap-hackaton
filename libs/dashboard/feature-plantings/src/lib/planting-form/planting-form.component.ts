import { Component, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Timestamp } from '@angular/fire/firestore';
import { Product } from '@fiap-hackaton/dashboard-domain';
import { ProductionFacade, ProductFacade, PlantingInput } from '@fiap-hackaton/dashboard-data-access';
import { AuthLoginFacade } from '@fiap-hackaton/auth-data-access';

@Component({
  selector: 'lib-planting-form',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container mx-auto px-4 py-6 max-w-4xl">
      <div class="mb-6">
        <button
          (click)="goBack()"
          class="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-4">
          ← Voltar
        </button>
        <h1 class="text-3xl font-bold text-gray-800">Novo Plantio</h1>
        <p class="text-gray-600 mt-2">Registre um novo plantio em sua fazenda</p>
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p class="text-red-800">{{ error() }}</p>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <!-- Produto -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Produto *
          </label>
          <select
            formControlName="productId"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            data-testid="product-select">
            <option value="">Selecione um produto</option>
            @for (product of products(); track product.id) {
              <option [value]="product.id">{{ product.name }} ({{ product.unit }})</option>
            }
          </select>
          @if (form.get('productId')?.invalid && form.get('productId')?.touched) {
            <p class="text-red-600 text-sm mt-1">Selecione um produto</p>
          }
        </div>

        <!-- Quantidade e Data -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Quantidade e Período</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Quantidade Plantada *
              </label>
              <input
                type="number"
                formControlName="quantityPlanted"
                min="0"
                step="0.01"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Ex: 100"
                data-testid="quantity-input" />
              @if (form.get('quantityPlanted')?.invalid && form.get('quantityPlanted')?.touched) {
                <p class="text-red-600 text-sm mt-1">Informe a quantidade</p>
              }
            </div>
             <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Unidade de Medida *
              </label>
              <select
                formControlName="plantingUnit"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                data-testid="quantity-unit-select">
                <option value="kg">Quilogramas (kg)</option>
                <option value="un">Unidades (un)</option>
                <option value="saca">Sacas</option>
                <option value="t">Toneladas (t)</option>
                <option value="g">Gramas (g)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Data Prevista de Colheita *
              </label>
              <input
                type="date"
                formControlName="expectedHarvestDate"
                [min]="minHarvestDate"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                data-testid="harvest-date-input" />
              @if (form.get('expectedHarvestDate')?.invalid && form.get('expectedHarvestDate')?.touched) {
                <p class="text-red-600 text-sm mt-1">Selecione a data de colheita</p>
              }
            </div>
          </div>
        </div>

        <!-- Custos -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Custos de Produção</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Custo de Sementes
              </label>
              <input
                type="number"
                formControlName="seedCost"
                min="0"
                step="0.01"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="R$ 0,00" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Custo de Mão de Obra
              </label>
              <input
                type="number"
                formControlName="laborCost"
                min="0"
                step="0.01"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="R$ 0,00" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Custo de Fertilizantes
              </label>
              <input
                type="number"
                formControlName="fertilizerCost"
                min="0"
                step="0.01"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="R$ 0,00" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Custo de Irrigação
              </label>
              <input
                type="number"
                formControlName="irrigationCost"
                min="0"
                step="0.01"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="R$ 0,00" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Outros Custos
              </label>
              <input
                type="number"
                formControlName="otherCosts"
                min="0"
                step="0.01"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="R$ 0,00" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Custo Total
              </label>
              <input
                type="text"
                [value]="formatCurrency(calculateTotalCost())"
                readonly
                class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                data-testid="total-cost" />
            </div>
          </div>
        </div>

        <!-- Área -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Informações de Área</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Área Plantada
              </label>
              <input
                type="number"
                formControlName="areaPlanted"
                min="0"
                step="0.01"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: 2.5" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Unidade
              </label>
              <select
                formControlName="areaUnit"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="hectare">Hectare</option>
                <option value="m2">m²</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Localização do Lote
              </label>
              <input
                type="text"
                formControlName="plotLocation"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: Lote A1" />
            </div>
          </div>
        </div>

        <!-- Informações Agronômicas -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Informações Agronômicas</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Variedade/Cultivar
              </label>
              <input
                type="text"
                formControlName="varietyName"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: Variedade Premium" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Método de Plantio
              </label>
              <select
                formControlName="sowingMethod"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">Selecione</option>
                <option value="direct">Semeadura Direta</option>
                <option value="transplant">Transplante</option>
                <option value="seed">Mudas</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Produtividade Esperada ({{ productivityUnit() }})
              </label>
              <input
                type="number"
                formControlName="expectedYieldPerArea"
                min="0"
                step="0.01"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                [placeholder]="'Ex: 50 ' + productivityUnit()" />
            </div>
          </div>
        </div>

        <!-- Observações -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Observações
          </label>
          <textarea
            formControlName="notes"
            rows="3"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Informações adicionais sobre o plantio"></textarea>
        </div>

        <!-- Ações -->
        <div class="flex gap-4">
          <button
            type="submit"
            [disabled]="form.invalid || submitting()"
            class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
            data-testid="submit-btn">
            @if (submitting()) {
              Registrando...
            } @else {
              Registrar Plantio
            }
          </button>
          <button
            type="button"
            (click)="goBack()"
            class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  `,
})
export class PlantingFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private productionFacade = inject(ProductionFacade);
  private productFacade = inject(ProductFacade);
  private authFacade = inject(AuthLoginFacade);

  products = signal<Product[]>([]);
  submitting = signal(false);
  error = signal<string | null>(null);
  productivityUnit = signal<string>('kg/hectare');

  form: FormGroup;
  minHarvestDate: string;

  constructor() {
    // Data mínima: amanhã
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minHarvestDate = tomorrow.toISOString().split('T')[0];

    this.form = this.fb.group({
      productId: ['', Validators.required],
      quantityPlanted: [null, [Validators.required, Validators.min(0.01)]],
      plantingUnit: ['kg', Validators.required],
      expectedHarvestDate: ['', Validators.required],
      seedCost: [0],
      laborCost: [0],
      fertilizerCost: [0],
      irrigationCost: [0],
      otherCosts: [0],
      areaPlanted: [null],
      areaUnit: ['hectare'],
      plotLocation: [''],
      varietyName: [''],
      sowingMethod: [''],
      expectedYieldPerArea: [null],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.setupProductivityUnitUpdates();
  }

  private setupProductivityUnitUpdates(): void {
    // Atualizar unidade de produtividade quando mudar quantidade ou área
    this.form.get('plantingUnit')?.valueChanges.subscribe(() => {
      this.updateProductivityUnit();
    });
    
    this.form.get('areaUnit')?.valueChanges.subscribe(() => {
      this.updateProductivityUnit();
    });

    // Inicializar
    this.updateProductivityUnit();
  }

  private updateProductivityUnit(): void {
    const plantingUnit = this.form.get('plantingUnit')?.value || 'kg';
    const areaUnit = this.form.get('areaUnit')?.value || 'hectare';
    
    // Mapear unidades para formato legível
    const quantityMap: Record<string, string> = {
      'kg': 'kg',
      'un': 'un',
      'saca': 'sacas',
      't': 't',
      'g': 'g'
    };

    const areaMap: Record<string, string> = {
      'hectare': 'hectare',
      'm2': 'm²'
    };

    this.productivityUnit.set(`${quantityMap[plantingUnit]}/${areaMap[areaUnit]}`);
  }

  private loadProducts(): void {
    const currentUser = this.authFacade.currentUser();
    if (!currentUser?.id) {
      this.error.set('Usuário não autenticado');
      return;
    }

    this.productFacade.getByUserId(currentUser.id).subscribe({
      next: (products) => {
        this.products.set(products);
        if (products.length === 0) {
          this.error.set('Você precisa cadastrar produtos antes de criar um plantio.');
        }
      },
      error: () => {
        this.error.set('Erro ao carregar produtos. Tente novamente.');
      }
    });
  }

  calculateTotalCost(): number {
    const values = this.form.value;
    return (
      (values.seedCost || 0) +
      (values.laborCost || 0) +
      (values.fertilizerCost || 0) +
      (values.irrigationCost || 0) +
      (values.otherCosts || 0)
    );
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const currentUser = this.authFacade.currentUser();
    if (!currentUser?.id) {
      this.error.set('Usuário não autenticado');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const values = this.form.value;

    // Converter data para Timestamp
    const harvestDate = new Date(values.expectedHarvestDate);
    harvestDate.setHours(23, 59, 59, 999);

    const plantingInput: PlantingInput = {
      userId: currentUser.id,
      productId: values.productId,
      quantityPlanted: values.quantityPlanted,
      plantingUnit: values.plantingUnit,
      expectedHarvestDate: Timestamp.fromDate(harvestDate),
      seedCost: values.seedCost || 0,
      laborCost: values.laborCost || 0,
      fertilizerCost: values.fertilizerCost || 0,
      irrigationCost: values.irrigationCost || 0,
      otherCosts: values.otherCosts || 0,
      ...(values.areaPlanted && { areaPlanted: values.areaPlanted }),
      ...(values.areaUnit && { areaUnit: values.areaUnit }),
      ...(values.plotLocation?.trim() && { plotLocation: values.plotLocation.trim() }),
      ...(values.varietyName?.trim() && { varietyName: values.varietyName.trim() }),
      ...(values.sowingMethod && { sowingMethod: values.sowingMethod }),
      ...(values.expectedYieldPerArea && { expectedYieldPerArea: values.expectedYieldPerArea }),
      ...(values.notes?.trim() && { notes: values.notes.trim() }),
    };

    this.productionFacade.registerPlanting(plantingInput).subscribe({
      next: () => {
        this.router.navigate(['/dashboard/plantings']);
      },
      error: (err) => {
        this.error.set(`Erro ao registrar plantio: ${err.message || 'Tente novamente.'}`);
        this.submitting.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/plantings']);
  }
}
