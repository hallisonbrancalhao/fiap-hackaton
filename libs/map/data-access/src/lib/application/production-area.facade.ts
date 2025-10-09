import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, tap, catchError, of, map } from 'rxjs';
import { ProductionAreaRepository } from '../infrastructure/production-area.repository';
import {
  ProductionArea,
  GeoCoordinate,
  GEO_FEATURE_TYPE,
  calculatePolygonArea,
  convertM2ToHectares,
  isValidProductionArea
} from '@fiap-hackaton/domain';

export interface CreateProductionAreaData {
  userId: string;
  productionId: string;
  productName: string;
  coordinates: GeoCoordinate[];
  farmAreaId?: string;
  plantingDate?: string;
  expectedHarvestDate?: string;
  quantityPlanted?: number;
  unit?: string;
  color?: string;
  fillColor?: string;
}

@Injectable()
export class ProductionAreaFacade {
  private readonly repository = inject(ProductionAreaRepository);

  private productionAreasSubject = new BehaviorSubject<ProductionArea[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  readonly productionAreas$ = this.productionAreasSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  /**
   * Carrega todas as áreas de produção ativas do usuário
   */
  loadActiveProductionAreas(userId: string): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.repository.getActiveProductionAreasByUserId(userId).pipe(
      tap({
        next: (areas) => {
          this.productionAreasSubject.next(areas);
          this.loadingSubject.next(false);
        },
        error: () => {
          this.errorSubject.next('Erro ao carregar áreas de produção');
          this.loadingSubject.next(false);
        }
      })
    ).subscribe();
  }

  /**
   * Carrega todas as áreas de produção do usuário (ativas e inativas)
   */
  loadAllProductionAreas(userId: string): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.repository.getAllProductionAreasByUserId(userId).pipe(
      tap({
        next: (areas) => {
          this.productionAreasSubject.next(areas);
          this.loadingSubject.next(false);
        },
        error: () => {
          this.errorSubject.next('Erro ao carregar áreas de produção');
          this.loadingSubject.next(false);
        }
      })
    ).subscribe();
  }

  /**
   * Busca a área de produção de um plantio específico
   */
  getProductionAreaByProductionId(
    userId: string,
    productionId: string
  ): Observable<ProductionArea | null> {
    return this.repository.getProductionAreaByProductionId(userId, productionId).pipe(
      catchError(() => {
        this.errorSubject.next('Erro ao buscar área de produção');
        return of(null);
      })
    );
  }

  /**
   * Cria uma nova área de produção vinculada a um plantio
   */
  createProductionArea(data: CreateProductionAreaData): Observable<string> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    // Calcular área
    const areaM2 = calculatePolygonArea(data.coordinates);
    const areaHectares = convertM2ToHectares(areaM2);

    const productionArea: Omit<ProductionArea, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: data.userId,
      type: GEO_FEATURE_TYPE.POLYGON,
      coordinates: data.coordinates,
      ...(data.farmAreaId && { farmAreaId: data.farmAreaId }),
      isActive: true,
      properties: {
        productionId: data.productionId,
        productName: data.productName,
        areaM2,
        areaHectares,
        plantingDate: data.plantingDate,
        expectedHarvestDate: data.expectedHarvestDate,
        quantityPlanted: data.quantityPlanted,
        unit: data.unit,
        color: data.color || '#3B82F6',
        fillColor: data.fillColor || '#3B82F6',
        fillOpacity: 0.3,
        strokeWeight: 2
      }
    };

    // Validar antes de criar
    if (!isValidProductionArea(productionArea)) {
      this.errorSubject.next('Área de produção inválida');
      this.loadingSubject.next(false);
      return of('').pipe(
        tap(() => {
          throw new Error('Invalid production area');
        })
      );
    }

    return this.repository.createProductionArea(productionArea).pipe(
      tap({
        next: () => {
          this.loadActiveProductionAreas(data.userId);
        },
        error: () => {
          this.errorSubject.next('Erro ao criar área de produção');
          this.loadingSubject.next(false);
        }
      }),
      catchError(() => {
        this.errorSubject.next('Erro ao criar área de produção');
        this.loadingSubject.next(false);
        throw new Error('Failed to create production area');
      })
    );
  }

  /**
   * Atualiza uma área de produção
   */
  updateProductionArea(
    id: string,
    updates: Partial<ProductionArea>
  ): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.repository.updateProductionArea(id, updates).pipe(
      tap({
        next: () => {
          this.loadingSubject.next(false);
          // Atualizar o array local
          const currentAreas = this.productionAreasSubject.value;
          const updatedAreas = currentAreas.map(area =>
            area.id === id ? { ...area, ...updates } : area
          );
          this.productionAreasSubject.next(updatedAreas);
        },
        error: () => {
          this.errorSubject.next('Erro ao atualizar área de produção');
          this.loadingSubject.next(false);
        }
      })
    );
  }

  /**
   * Desativa uma área de produção (quando o plantio é colhido/cancelado)
   */
  deactivateProductionArea(id: string): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.repository.deactivateProductionArea(id).pipe(
      tap({
        next: () => {
          this.loadingSubject.next(false);
          // Remover do array local (se estamos mostrando apenas ativos)
          const currentAreas = this.productionAreasSubject.value;
          const filteredAreas = currentAreas.filter(area => area.id !== id);
          this.productionAreasSubject.next(filteredAreas);
        },
        error: () => {
          this.errorSubject.next('Erro ao desativar área de produção');
          this.loadingSubject.next(false);
        }
      })
    );
  }

  /**
   * Desativa área de produção vinculada a um plantio específico
   */
  deactivateProductionAreaByProductionId(
    userId: string,
    productionId: string
  ): Observable<void> {
    return this.getProductionAreaByProductionId(userId, productionId).pipe(
      tap({
        next: (area) => {
          if (area && area.id) {
            this.deactivateProductionArea(area.id).subscribe();
          }
        },
        error: () => {
          this.errorSubject.next('Erro ao desativar área de produção');
        }
      }),
      map(() => undefined)
    );
  }

  /**
   * Deleta uma área de produção (hard delete)
   */
  deleteProductionArea(id: string): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.repository.deleteProductionArea(id).pipe(
      tap({
        next: () => {
          this.loadingSubject.next(false);
          // Remover do array local
          const currentAreas = this.productionAreasSubject.value;
          const filteredAreas = currentAreas.filter(area => area.id !== id);
          this.productionAreasSubject.next(filteredAreas);
        },
        error: () => {
          this.errorSubject.next('Erro ao deletar área de produção');
          this.loadingSubject.next(false);
        }
      })
    );
  }

  /**
   * Filtra áreas de produção por fazenda
   */
  getProductionAreasByFarmAreaId(
    userId: string,
    farmAreaId: string
  ): Observable<ProductionArea[]> {
    return this.repository.getProductionAreasByFarmAreaId(userId, farmAreaId).pipe(
      catchError(() => {
        this.errorSubject.next('Erro ao buscar áreas de produção da fazenda');
        return of([]);
      })
    );
  }

  /**
   * Retorna apenas áreas ativas do estado atual
   */
  getActiveAreas(): Observable<ProductionArea[]> {
    return this.productionAreas$.pipe(
      map(areas => areas.filter(area => area.isActive))
    );
  }

  /**
   * Calcula a área total plantada (soma de todas as áreas ativas)
   */
  getTotalPlantedArea(): Observable<{ m2: number; hectares: number }> {
    return this.productionAreas$.pipe(
      map(areas => {
        const activeAreas = areas.filter(area => area.isActive);
        const totalM2 = activeAreas.reduce((sum, area) => sum + area.properties.areaM2, 0);
        const totalHectares = activeAreas.reduce((sum, area) => sum + area.properties.areaHectares, 0);
        return { m2: totalM2, hectares: totalHectares };
      })
    );
  }

  /**
   * Limpa o estado
   */
  clear(): void {
    this.productionAreasSubject.next([]);
    this.loadingSubject.next(false);
    this.errorSubject.next(null);
  }
}
