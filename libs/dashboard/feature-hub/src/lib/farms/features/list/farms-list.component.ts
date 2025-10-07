import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardComponent, EmptyStateComponent } from '@fiap-hackaton/shared-ui';

interface Farm {
  id: string;
  name: string;
  city: string;
  state: string;
  area?: number;
}

@Component({
  selector: 'fiap-farms-list',
  imports: [CommonModule, TableModule, ButtonModule, CardComponent, EmptyStateComponent],
  template: `
    <div class="p-6">
      <lib-card title="Fazendas" subtitle="Gerencie suas propriedades rurais">
        <div class="mb-4 flex justify-end">
          <p-button
            label="Adicionar Fazenda"
            icon="pi pi-plus"
            (onClick)="onAddFarm()"
            data-testid="add-farm-button"
          />
        </div>

        @if (farms().length === 0) {
          <lib-empty-state
            icon="pi pi-map"
            title="Nenhuma fazenda cadastrada"
            description="Comece adicionando sua primeira fazenda"
            actionLabel="Adicionar Fazenda"
            (actionClick)="onAddFarm()"
          />
        } @else {
          <p-table [value]="farms()" [paginator]="true" [rows]="10">
            <ng-template #header>
              <tr>
                <th>Nome</th>
                <th>Cidade</th>
                <th>Estado</th>
                <th>Área (ha)</th>
                <th class="text-right">Ações</th>
              </tr>
            </ng-template>
            <ng-template #body let-farm>
              <tr>
                <td>{{ farm.name }}</td>
                <td>{{ farm.city }}</td>
                <td>{{ farm.state }}</td>
                <td>{{ farm.area || '-' }}</td>
                <td class="text-right">
                  <p-button
                    icon="pi pi-eye"
                    [text]="true"
                    [rounded]="true"
                    severity="secondary"
                    (onClick)="onViewFarm(farm)"
                    data-testid="view-farm-button"
                  />
                  <p-button
                    icon="pi pi-chart-line"
                    [text]="true"
                    [rounded]="true"
                    severity="info"
                    (onClick)="onViewStats(farm)"
                    data-testid="stats-farm-button"
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
export class FarmsListComponent {
  protected farms = signal<Farm[]>([]);
  private router = inject(Router);

  protected onAddFarm(): void {
    this.router.navigate(['/dashboard/farms/create']);
  }

  protected onViewFarm(farm: Farm): void {
    this.router.navigate(['/dashboard/farms/detail', farm.id]);
  }

  protected onViewStats(farm: Farm): void {
    this.router.navigate(['/dashboard/farms/stats', farm.id]);
  }
}
