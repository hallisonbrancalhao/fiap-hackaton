import { Component, OnInit, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Production, PRODUCTION_STATUS, calculatePlantingProgress, getDaysUntilHarvest } from '@fiap-hackaton/dashboard-domain';
import { ProductionFacade } from '@fiap-hackaton/dashboard-data-access';
import { AuthLoginFacade } from '@fiap-hackaton/auth-data-access';

@Component({
  selector: 'lib-planting-list',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container mx-auto px-4 py-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Meus Plantios</h1>
        <button
          (click)="navigateToNew()"
          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          data-testid="new-planting-btn">
          <span>+</span>
          Novo Plantio
        </button>
      </div>

      @if (loading()) {
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Carregando plantios...</p>
        </div>
      } @else if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800">{{ error() }}</p>
        </div>
      } @else if (plantings().length === 0) {
        <div class="bg-gray-50 rounded-lg p-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhum plantio encontrado</h3>
          <p class="mt-1 text-sm text-gray-500">Comece criando seu primeiro plantio.</p>
          <div class="mt-6">
            <button
              (click)="navigateToNew()"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
              Criar Plantio
            </button>
          </div>
        </div>
      } @else {
        <!-- Estatísticas -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-blue-50 rounded-lg p-4">
            <p class="text-blue-600 text-sm font-medium">Total de Plantios</p>
            <p class="text-2xl font-bold text-blue-900">{{ plantings().length }}</p>
          </div>
          <div class="bg-green-50 rounded-lg p-4">
            <p class="text-green-600 text-sm font-medium">Em Produção</p>
            <p class="text-2xl font-bold text-green-900">{{ activePlantings() }}</p>
          </div>
          <div class="bg-yellow-50 rounded-lg p-4">
            <p class="text-yellow-600 text-sm font-medium">Prontos para Colheita</p>
            <p class="text-2xl font-bold text-yellow-900">{{ readyForHarvest() }}</p>
          </div>
          <div class="bg-purple-50 rounded-lg p-4">
            <p class="text-purple-600 text-sm font-medium">Colhidos</p>
            <p class="text-2xl font-bold text-purple-900">{{ harvestedCount() }}</p>
          </div>
        </div>

        <!-- Lista de Plantios -->
        <div class="space-y-4">
          @for (planting of plantings(); track planting.id) {
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900">{{ planting.productName }}</h3>
                  <p class="text-sm text-gray-500">
                    {{ planting.quantityPlanted }} {{ planting.unit }}
                    @if (planting.varietyName) {
                      - {{ planting.varietyName }}
                    }
                  </p>
                </div>
                <span [class]="getStatusClass(planting.status)">
                  {{ getStatusLabel(planting.status) }}
                </span>
              </div>

              <!-- Barra de Progresso -->
              @if (planting.status === 'in_production' || planting.status === 'waiting') {
                <div class="mb-4">
                  <div class="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progresso</span>
                    <span>{{ getProgress(planting) }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      class="bg-green-600 h-2 rounded-full transition-all"
                      [style.width.%]="getProgress(planting)">
                    </div>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ getDaysRemaining(planting) }}
                  </p>
                </div>
              }

              <!-- Informações -->
              <div class="grid grid-cols-2 md:grid-cols-5 gap-5 text-sm">
                <div>
                  <p class="text-gray-500">Data de Plantio</p>
                  <p class="font-medium">{{ formatDate(planting.plantingDate) }}</p>
                </div>
                <div>
                  <p class="text-gray-500">Colheita Prevista</p>
                  <p class="font-medium">{{ formatDate(planting.expectedHarvestDate) }}</p>
                </div>
                @if (planting.areaPlanted) {
                  <div>
                    <p class="text-gray-500">Área</p>
                    <p class="font-medium">{{ planting.areaPlanted }} {{ planting.areaUnit }}</p>
                  </div>
                }
                <div>
                  <p class="text-gray-500">Quantidade Esperada</p>
                  <p class="font-medium">{{ planting.quantityPlanted }} {{ planting.unit }}/{{ planting.areaUnit }}</p>
                </div>
                <div>
                  <p class="text-gray-500">Custo Total</p>
                  <p class="font-medium">{{ formatCurrency(planting.totalCost) }}</p>
                </div>
              </div>

              <!-- Ações -->
              @if (planting.status === 'in_production') {
                <div class="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                  <button
                    (click)="completeHarvest(planting.id!)"
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
                    Registrar Colheita
                  </button>
                  <button
                    (click)="cancelPlanting(planting.id!)"
                    class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm">
                    Cancelar
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class PlantingListComponent implements OnInit {
  private router = inject(Router);
  private productionFacade = inject(ProductionFacade);
  private authFacade = inject(AuthLoginFacade);

  plantings = signal<Production[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  activePlantings = computed(() => 
    this.plantings().filter(p => 
      p.status === PRODUCTION_STATUS.IN_PRODUCTION || p.status === PRODUCTION_STATUS.WAITING
    ).length
  );

  readyForHarvest = computed(() => 
    this.plantings().filter(p => {
      if (p.status !== PRODUCTION_STATUS.IN_PRODUCTION) return false;
      return getDaysUntilHarvest(p) <= 0;
    }).length
  );

  harvestedCount = computed(() => 
    this.plantings().filter(p => p.status === PRODUCTION_STATUS.HARVESTED).length
  );

  ngOnInit(): void {
    this.loadPlantings();
  }

  private loadPlantings(): void {
    const currentUser = this.authFacade.currentUser();
    if (!currentUser?.id) {
      this.error.set('Usuário não autenticado');
      this.loading.set(false);
      return;
    }

    this.productionFacade.getByUserId(currentUser.id).subscribe({
      next: (plantings) => {
        // Ordenar por data de plantio (mais recentes primeiro)
        this.plantings.set(
          plantings.sort((a, b) => 
            b.plantingDate.toMillis() - a.plantingDate.toMillis()
          )
        );
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar plantios. Tente novamente.');
        this.loading.set(false);
      }
    });
  }

  navigateToNew(): void {
    this.router.navigate(['/dashboard/plantings/new']);
  }

  getProgress(planting: Production): number {
    return calculatePlantingProgress(planting);
  }

  getDaysRemaining(planting: Production): string {
    const days = getDaysUntilHarvest(planting);
    if (days < 0) return 'Pronto para colheita!';
    if (days === 0) return 'Colheita hoje!';
    if (days === 1) return '1 dia restante';
    return `${days} dias restantes`;
  }

  getStatusLabel(status: PRODUCTION_STATUS): string {
    const labels: Record<PRODUCTION_STATUS, string> = {
      [PRODUCTION_STATUS.WAITING]: 'Aguardando',
      [PRODUCTION_STATUS.IN_PRODUCTION]: 'Em Produção',
      [PRODUCTION_STATUS.HARVESTED]: 'Colhido',
      [PRODUCTION_STATUS.CANCELLED]: 'Cancelado',
    };
    return labels[status];
  }

  getStatusClass(status: PRODUCTION_STATUS): string {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-medium';
    const statusClasses: Record<PRODUCTION_STATUS, string> = {
      [PRODUCTION_STATUS.WAITING]: 'bg-yellow-100 text-yellow-800',
      [PRODUCTION_STATUS.IN_PRODUCTION]: 'bg-blue-100 text-blue-800',
      [PRODUCTION_STATUS.HARVESTED]: 'bg-green-100 text-green-800',
      [PRODUCTION_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
    };
    return `${baseClasses} ${statusClasses[status]}`;
  }

  formatDate(timestamp: any): string {
    return timestamp.toDate().toLocaleDateString('pt-BR');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  completeHarvest(plantingId: string): void {
    // TODO: Navegar para formulário de colheita
    this.router.navigate(['/dashboard/harvest/new'], { 
      queryParams: { plantingId } 
    });
  }

  cancelPlanting(plantingId: string): void {
    if (!confirm('Tem certeza que deseja cancelar este plantio?')) return;

    this.productionFacade.cancelProduction(plantingId).subscribe({
      next: () => {
        this.loadPlantings();
      },
      error: () => {
        alert('Erro ao cancelar plantio. Tente novamente.');
      }
    });
  }
}
