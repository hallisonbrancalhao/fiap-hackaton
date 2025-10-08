import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardComponent } from '@fiap-hackaton/shared-ui';
import { FarmUserFacade } from '@fiap-hackaton/auth-data-access';
import { FarmUser } from '@fiap-hackaton/auth-domain';

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
            <div class="bg-surface-50 p-4 rounded-lg">
              <p class="text-sm text-surface-600 mb-1">Nome da Fazenda</p>
              <p class="text-lg font-semibold text-surface-900">
                {{ farm()?.farmName }}
              </p>
            </div>

            <div class="bg-surface-50 p-4 rounded-lg">
              <p class="text-sm text-surface-600 mb-1">Proprietário</p>
              <p class="text-lg font-semibold text-surface-900">
                {{ farm()?.name }}
              </p>
            </div>

            <div class="bg-surface-50 p-4 rounded-lg">
              <p class="text-sm text-surface-600 mb-1">Email</p>
              <p class="text-lg font-semibold text-surface-900">
                {{ farm()?.email }}
              </p>
            </div>

            <div class="bg-surface-50 p-4 rounded-lg">
              <p class="text-sm text-surface-600 mb-1">Telefone</p>
              <p class="text-lg font-semibold text-surface-900">
                {{ farm()?.phone || 'Não informado' }}
              </p>
            </div>

            <div class="bg-surface-50 p-4 rounded-lg md:col-span-2">
              <p class="text-sm text-surface-600 mb-1">Endereço</p>
              <p class="text-lg font-semibold text-surface-900">
                {{ farm()?.location?.address || 'Não informado' }}
              </p>
            </div>
          </div>

          <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start">
              <i class="pi pi-info-circle text-blue-600 mr-3 mt-1"></i>
              <div>
                <p class="text-sm font-medium text-blue-900">
                  Informação
                </p>
                <p class="text-sm text-blue-700 mt-1">
                  Esta fazenda foi cadastrada no sistema. Você pode visualizar estatísticas
                  detalhadas clicando no botão "Ver Estatísticas" acima.
                </p>
              </div>
            </div>
          </div>
        } @else {
          <div class="text-center py-8">
            <i class="pi pi-spin pi-spinner text-4xl text-primary-500"></i>
            <p class="mt-4 text-surface-600">
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
  protected farm = signal<FarmUser | null>(null);
  private farmId = signal<string>('');

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private farmUserFacade = inject(FarmUserFacade);

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
    this.farmUserFacade.getById(this.farmId()).subscribe({
      next: (farm) => {
        this.farm.set(farm);
      },
      error: (error) => {
        // eslint-disable-next-line no-console
        console.error('Erro ao carregar detalhes da fazenda:', error);
        this.router.navigate(['/dashboard/farms']);
      },
    });
  }
}
