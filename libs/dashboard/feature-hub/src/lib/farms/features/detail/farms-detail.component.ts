import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardComponent } from '@fiap-hackaton/shared-ui';

interface FarmDetail {
  id: string;
  name: string;
  city: string;
  state: string;
  area?: number;
  address?: string;
  createdAt?: Date;
}

@Component({
  selector: 'fiap-farms-detail',
  imports: [CommonModule, ButtonModule, CardComponent],
  template: `
    <div class="p-6">
      <lib-card title="Detalhes da Fazenda" subtitle="Informações completas da propriedade">
        <div class="mb-4 flex gap-2 justify-end">
          <p-button
            label="Ver Estatísticas"
            icon="pi pi-chart-line"
            severity="info"
            (onClick)="onViewStats()"
          />
          <p-button
            label="Voltar"
            icon="pi pi-arrow-left"
            severity="secondary"
            [outlined]="true"
            (onClick)="onBack()"
          />
        </div>

        @if (farm()) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-surface-50 dark:bg-surface-700 p-4 rounded-lg">
              <p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Nome</p>
              <p class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                {{ farm()?.name }}
              </p>
            </div>

            <div class="bg-surface-50 dark:bg-surface-700 p-4 rounded-lg">
              <p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Localização</p>
              <p class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                {{ farm()?.city }}, {{ farm()?.state }}
              </p>
            </div>

            <div class="bg-surface-50 dark:bg-surface-700 p-4 rounded-lg">
              <p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Área</p>
              <p class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                {{ farm()?.area || '-' }} hectares
              </p>
            </div>

            <div class="bg-surface-50 dark:bg-surface-700 p-4 rounded-lg">
              <p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Endereço</p>
              <p class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                {{ farm()?.address || 'Não informado' }}
              </p>
            </div>
          </div>

          <div class="mt-6 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div class="flex items-start">
              <i class="pi pi-info-circle text-blue-600 dark:text-blue-400 mr-3 mt-1"></i>
              <div>
                <p class="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Informação
                </p>
                <p class="text-sm text-blue-700 dark:text-blue-200 mt-1">
                  Esta fazenda foi cadastrada no sistema. Você pode visualizar estatísticas
                  detalhadas clicando no botão "Ver Estatísticas" acima.
                </p>
              </div>
            </div>
          </div>
        } @else {
          <div class="text-center py-8">
            <i class="pi pi-spin pi-spinner text-4xl text-primary-500"></i>
            <p class="mt-4 text-surface-600 dark:text-surface-400">
              Carregando detalhes da fazenda...
            </p>
          </div>
        }
      </lib-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmsDetailComponent implements OnInit {
  protected farm = signal<FarmDetail | null>(null);
  private farmId = signal<string>('');

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.farmId.set(params['id']);
      this.loadFarmDetails();
    });
  }

  protected onViewStats(): void {
    this.router.navigate(['/dashboard/farms/stats', this.farmId()]);
  }

  protected onBack(): void {
    this.router.navigate(['/dashboard/farms']);
  }

  private loadFarmDetails(): void {
    // TODO: Chamar serviço para carregar detalhes da fazenda
    // Simulando dados mockados
    setTimeout(() => {
      this.farm.set({
        id: this.farmId(),
        name: 'Fazenda Exemplo',
        city: 'São Paulo',
        state: 'SP',
        area: 150,
        address: 'Estrada Rural, km 25',
        createdAt: new Date(),
      });
    }, 500);
  }
}
