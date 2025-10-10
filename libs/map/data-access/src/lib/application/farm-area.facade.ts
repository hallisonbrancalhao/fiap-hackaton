import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, tap, map, catchError, of } from 'rxjs';
import { FarmAreaRepository } from '../infrastructure/farm-area.repository';
import {
  FarmArea,
  GeoCoordinate,
  GEO_FEATURE_TYPE,
  calculatePolygonArea,
  convertM2ToHectares,
  calculateBoundingBox,
  calculateCentroid,
  isValidFarmArea
} from '@fiap-hackaton/domain';

@Injectable()
export class FarmAreaFacade {
  private readonly repository = inject(FarmAreaRepository);

  private farmAreaSubject = new BehaviorSubject<FarmArea | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  readonly farmArea$ = this.farmAreaSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  /**
   * Carrega a área da fazenda do usuário
   */
  loadFarmAreaByUserId(userId: string): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.repository.getFarmAreaByUserId(userId).pipe(
      tap({
        next: (farmArea) => {
          this.farmAreaSubject.next(farmArea);
          this.loadingSubject.next(false);
        },
        error: () => {
          this.errorSubject.next('Erro ao carregar área da fazenda');
          this.loadingSubject.next(false);
        }
      })
    ).subscribe();
  }

  /**
   * Cria uma nova área de fazenda
   */
  createFarmArea(
    userId: string,
    farmName: string,
    coordinates: GeoCoordinate[],
    additionalData?: Partial<FarmArea['properties']>
  ): Observable<string> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    // Calcular área
    const areaM2 = calculatePolygonArea(coordinates);
    const areaHectares = convertM2ToHectares(areaM2);

    // Calcular bounding box
    const boundingBox = calculateBoundingBox(coordinates);

    const farmArea: Omit<FarmArea, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      type: GEO_FEATURE_TYPE.POLYGON,
      coordinates: coordinates, // Simple array for Firestore compatibility
      boundingBox,
      properties: {
        farmName,
        ownerName: additionalData?.ownerName || '',
        totalAreaM2: areaM2,
        totalAreaHectares: areaHectares,
        address: additionalData?.address,
        city: additionalData?.city,
        state: additionalData?.state,
        zipCode: additionalData?.zipCode,
        registrationNumber: additionalData?.registrationNumber,
        color: additionalData?.color || '#10B981',
        fillColor: additionalData?.fillColor || '#10B981',
        fillOpacity: additionalData?.fillOpacity || 0.2,
        strokeWeight: additionalData?.strokeWeight || 2
      }
    };

    // Validar antes de criar
    if (!isValidFarmArea(farmArea)) {
      this.errorSubject.next('Área da fazenda inválida');
      this.loadingSubject.next(false);
      return of('').pipe(
        tap(() => {
          throw new Error('Invalid farm area');
        })
      );
    }

    return this.repository.createFarmArea(farmArea).pipe(
      tap({
        next: () => {
          // Recarregar a área da fazenda
          this.loadFarmAreaByUserId(userId);
        },
        error: () => {
          this.errorSubject.next('Erro ao criar área da fazenda');
          this.loadingSubject.next(false);
        }
      }),
      catchError(() => {
        this.errorSubject.next('Erro ao criar área da fazenda');
        this.loadingSubject.next(false);
        throw new Error('Failed to create farm area');
      })
    );
  }

  /**
   * Atualiza a área da fazenda
   */
  updateFarmArea(
    id: string,
    updates: Partial<FarmArea>
  ): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.repository.updateFarmArea(id, updates).pipe(
      tap({
        next: () => {
          this.loadingSubject.next(false);
          // Atualizar o subject local
          const currentFarmArea = this.farmAreaSubject.value;
          if (currentFarmArea && currentFarmArea.id === id) {
            this.farmAreaSubject.next({ ...currentFarmArea, ...updates });
          }
        },
        error: () => {
          this.errorSubject.next('Erro ao atualizar área da fazenda');
          this.loadingSubject.next(false);
        }
      })
    );
  }

  /**
   * Deleta a área da fazenda
   */
  deleteFarmArea(id: string): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.repository.deleteFarmArea(id).pipe(
      tap({
        next: () => {
          this.farmAreaSubject.next(null);
          this.loadingSubject.next(false);
        },
        error: () => {
          this.errorSubject.next('Erro ao deletar área da fazenda');
          this.loadingSubject.next(false);
        }
      })
    );
  }

  /**
   * Calcula o centro da área da fazenda atual
   */
  getFarmAreaCenter(): Observable<GeoCoordinate | null> {
    return this.farmArea$.pipe(
      map(farmArea => {
        if (!farmArea || !farmArea.coordinates || farmArea.coordinates.length === 0) {
          return null;
        }
        return calculateCentroid(farmArea.coordinates);
      })
    );
  }

  /**
   * Limpa o estado
   */
  clear(): void {
    this.farmAreaSubject.next(null);
    this.loadingSubject.next(false);
    this.errorSubject.next(null);
  }
}
