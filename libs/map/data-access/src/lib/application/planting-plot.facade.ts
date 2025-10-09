import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, tap, catchError } from 'rxjs';
import { PlantingPlotRepository } from '../infrastructure/planting-plot.repository';
import {
  PlantingPlot,
  CreatePlantingPlotDto,
  UpdatePlantingPlotDto,
  calculatePolygonArea,
  convertM2ToHectares,
  isValidPlantingPlot,
  PLANTING_PLOT_STATUS,
  getPlotColorByStatus
} from '@fiap-hackaton/domain';

@Injectable()
export class PlantingPlotFacade {
  private readonly repository = inject(PlantingPlotRepository);

  private plantingPlotsSubject = new BehaviorSubject<PlantingPlot[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  readonly plantingPlots$ = this.plantingPlotsSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  /**
   * Carrega todos os talhões de plantio de um usuário
   */
  loadPlantingPlotsByUserId(userId: string): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.repository.getByUserId(userId).pipe(
      tap({
        next: (plots) => {
          this.plantingPlotsSubject.next(plots);
          this.loadingSubject.next(false);
        },
        error: () => {
          this.errorSubject.next('Erro ao carregar talhões de plantio');
          this.loadingSubject.next(false);
        }
      })
    ).subscribe();
  }

  /**
   * Carrega talhões por área de fazenda
   */
  loadPlantingPlotsByFarmAreaId(farmAreaId: string): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.repository.getByFarmAreaId(farmAreaId).pipe(
      tap({
        next: (plots) => {
          this.plantingPlotsSubject.next(plots);
          this.loadingSubject.next(false);
        },
        error: () => {
          this.errorSubject.next('Erro ao carregar talhões de plantio');
          this.loadingSubject.next(false);
        }
      })
    ).subscribe();
  }

  /**
   * Cria um novo talhão de plantio
   */
  createPlantingPlot(
    userId: string,
    dto: CreatePlantingPlotDto
  ): Observable<string> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    // Calcular área
    const areaM2 = calculatePolygonArea(dto.coordinates);
    const areaHectares = convertM2ToHectares(areaM2);

    // Definir cores baseado no status (disponível por padrão)
    const color = dto.color || getPlotColorByStatus(PLANTING_PLOT_STATUS.AVAILABLE);
    const fillColor = dto.fillColor || color;

    const createDto: CreatePlantingPlotDto & { userId: string } = {
      ...dto,
      userId,
      color,
      fillColor
    };

    // Validar estrutura básica
    const tempPlot: Partial<PlantingPlot> = {
      coordinates: [dto.coordinates],
      properties: {
        plotName: dto.plotName,
        areaM2,
        areaHectares,
        status: PLANTING_PLOT_STATUS.AVAILABLE
      }
    };

    if (!isValidPlantingPlot(tempPlot)) {
      this.errorSubject.next('Talhão de plantio inválido');
      this.loadingSubject.next(false);
      throw new Error('Invalid planting plot');
    }

    return this.repository.createPlantingPlot(createDto).pipe(
      tap({
        next: () => {
          // Recarregar os talhões
          this.loadPlantingPlotsByUserId(userId);
        },
        error: () => {
          this.errorSubject.next('Erro ao criar talhão de plantio');
          this.loadingSubject.next(false);
        }
      }),
      catchError(() => {
        this.errorSubject.next('Erro ao criar talhão de plantio');
        this.loadingSubject.next(false);
        throw new Error('Failed to create planting plot');
      })
    );
  }

  /**
   * Atualiza um talhão de plantio
   */
  updatePlantingPlot(
    id: string,
    dto: UpdatePlantingPlotDto
  ): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.repository.updatePlantingPlot(id, dto).pipe(
      tap({
        next: () => {
          this.loadingSubject.next(false);

          // Atualizar o subject local
          const currentPlots = this.plantingPlotsSubject.value;
          const updatedPlots = currentPlots.map(plot => {
            if (plot.id === id) {
              return {
                ...plot,
                ...dto,
                properties: {
                  ...plot.properties,
                  ...(dto.plotName && { plotName: dto.plotName }),
                  ...(dto.plotNumber && { plotNumber: dto.plotNumber }),
                  ...(dto.status && { status: dto.status }),
                  ...(dto.soilType && { soilType: dto.soilType }),
                  ...(dto.irrigation !== undefined && { irrigation: dto.irrigation }),
                  ...(dto.notes && { notes: dto.notes }),
                  ...(dto.color && { color: dto.color }),
                  ...(dto.fillColor && { fillColor: dto.fillColor })
                },
                ...(dto.productionId && { productionId: dto.productionId })
              };
            }
            return plot;
          });
          this.plantingPlotsSubject.next(updatedPlots);
        },
        error: () => {
          this.errorSubject.next('Erro ao atualizar talhão de plantio');
          this.loadingSubject.next(false);
        }
      })
    );
  }

  /**
   * Associa um talhão a um plantio (Production)
   */
  linkPlotToProduction(plotId: string, productionId: string): Observable<void> {
    return this.updatePlantingPlot(plotId, {
      productionId,
      status: PLANTING_PLOT_STATUS.PLANTED,
      color: getPlotColorByStatus(PLANTING_PLOT_STATUS.PLANTED),
      fillColor: getPlotColorByStatus(PLANTING_PLOT_STATUS.PLANTED)
    });
  }

  /**
   * Remove a associação de um talhão com um plantio
   */
  unlinkPlotFromProduction(plotId: string): Observable<void> {
    return this.updatePlantingPlot(plotId, {
      productionId: undefined,
      status: PLANTING_PLOT_STATUS.AVAILABLE,
      color: getPlotColorByStatus(PLANTING_PLOT_STATUS.AVAILABLE),
      fillColor: getPlotColorByStatus(PLANTING_PLOT_STATUS.AVAILABLE)
    });
  }

  /**
   * Atualiza o status de um talhão
   */
  updatePlotStatus(plotId: string, status: PLANTING_PLOT_STATUS): Observable<void> {
    const color = getPlotColorByStatus(status);
    return this.updatePlantingPlot(plotId, {
      status,
      color,
      fillColor: color
    });
  }

  /**
   * Deleta um talhão de plantio
   */
  deletePlantingPlot(id: string): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.repository.deletePlantingPlot(id).pipe(
      tap({
        next: () => {
          // Remover do subject local
          const currentPlots = this.plantingPlotsSubject.value;
          const updatedPlots = currentPlots.filter(plot => plot.id !== id);
          this.plantingPlotsSubject.next(updatedPlots);

          this.loadingSubject.next(false);
        },
        error: () => {
          this.errorSubject.next('Erro ao deletar talhão de plantio');
          this.loadingSubject.next(false);
        }
      })
    );
  }

  /**
   * Limpa o estado
   */
  clear(): void {
    this.plantingPlotsSubject.next([]);
    this.loadingSubject.next(false);
    this.errorSubject.next(null);
  }
}
