import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { HarvestFacade } from '@fiap-hackaton/dashboard-data-access';
import { Harvest, HARVEST_QUALITY } from '@fiap-hackaton/dashboard-domain';
import { AuthLoginFacade } from '@fiap-hackaton/auth-data-access';

@Component({
  selector: 'lib-harvest-list',
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './harvest-list.component.html',
  styleUrls: ['./harvest-list.component.css'],
})
export class HarvestListComponent implements OnInit {
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private harvestFacade = inject(HarvestFacade);
  private authFacade = inject(AuthLoginFacade);

  harvests = signal<Harvest[]>([]);
  isLoading = signal(false);

  ngOnInit(): void {
    this.loadHarvests();
  }

  private loadHarvests(): void {
    this.isLoading.set(true);
    const userId = this.authFacade.currentUser()?.id;

    if (!userId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Usuário não autenticado',
      });
      this.router.navigate(['/auth/login']);
      return;
    }

    this.harvestFacade.getByUserId(userId).subscribe({
      next: (harvests) => {
        this.harvests.set(harvests);
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar colheitas',
        });
        this.isLoading.set(false);
      },
    });
  }

  onNewHarvest(): void {
    this.router.navigate(['/dashboard/harvest/new']);
  }

  onDelete(harvest: Harvest): void {
    this.confirmationService.confirm({
      message: `Deseja realmente excluir a colheita de ${harvest.productName}?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        if (harvest.id) {
          this.harvestFacade.delete(harvest.id).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Colheita excluída com sucesso',
              });
              this.loadHarvests();
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Erro ao excluir colheita',
              });
            },
          });
        }
      },
    });
  }

  formatDate(timestamp: unknown): string {
    if (!timestamp) return '-';
    const date = timestamp && typeof timestamp === 'object' && 'toDate' in timestamp
      ? (timestamp as { toDate: () => Date }).toDate()
      : new Date(timestamp as string);
    return date.toLocaleDateString('pt-BR');
  }

  getQualitySeverity(quality: HARVEST_QUALITY): 'success' | 'info' | 'warn' | 'danger' {
    switch (quality) {
      case HARVEST_QUALITY.EXCELLENT:
        return 'success';
      case HARVEST_QUALITY.GOOD:
        return 'info';
      case HARVEST_QUALITY.AVERAGE:
        return 'warn';
      case HARVEST_QUALITY.POOR:
        return 'danger';
      default:
        return 'info';
    }
  }

  getQualityLabel(quality: HARVEST_QUALITY): string {
    switch (quality) {
      case HARVEST_QUALITY.EXCELLENT:
        return 'Excelente';
      case HARVEST_QUALITY.GOOD:
        return 'Boa';
      case HARVEST_QUALITY.AVERAGE:
        return 'Média';
      case HARVEST_QUALITY.POOR:
        return 'Ruim';
      default:
        return quality;
    }
  }
}
