import { Injectable, inject, signal } from '@angular/core';
import { Observable, throwError, delay, tap, switchMap, from } from 'rxjs';
import { FarmUser, Location } from '@fiap-hackaton/auth-domain';
import { GeoCoordinate, GEO_FEATURE_TYPE, calculatePolygonArea } from '@fiap-hackaton/map-domain';
import { FarmUserRepository } from '../infrastructure/farm-user.repository';
import { FarmAreaRepository } from '@fiap-hackaton/map-data-access';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  farmName: string;
  phone?: string;
  location: Location;
  farmAreaCoordinates?: GeoCoordinate[]; // Polígono da fazenda
}

@Injectable({
  providedIn: 'root',
})
export class AuthRegisterFacade {
  // State signals
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  success = signal<boolean>(false);

  private repository = inject(FarmUserRepository);
  private farmAreaRepository = inject(FarmAreaRepository);

  /**
   * Registra novo usuário usando Firebase
   */
  register(data: RegisterData): Observable<string> {
    this.isLoading.set(true);
    this.error.set(null);
    this.success.set(false);

    // Verifica se email já existe
    return this.repository.getByEmail(data.email).pipe(
      delay(500),
      switchMap((users) => {
        if (users.length > 0) {
          this.error.set('Email already registered');
          this.isLoading.set(false);
          return throwError(() => new Error('Email already registered'));
        }

        // Cria novo usuário
        const newUser: Omit<FarmUser, 'id'> = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          farmName: data.farmName,
          location: data.location,
        };

        return this.repository.create(newUser).pipe(
          switchMap((userId) => {
            // Se tem coordenadas da fazenda, cria o FarmArea
            if (data.farmAreaCoordinates && data.farmAreaCoordinates.length >= 3) {
              return from(this.createFarmArea(userId, data)).pipe(
                switchMap((farmAreaId) => {
                  // Atualiza o usuário com o farmAreaId
                  return this.repository.update(userId, { farmAreaId }).pipe(
                    tap({
                      next: () => {
                        this.success.set(true);
                        this.isLoading.set(false);
                      },
                      error: (err) => {
                        this.error.set(err.message || 'Failed to link farm area');
                        this.isLoading.set(false);
                      },
                    }),
                    switchMap(() => from(Promise.resolve(userId)))
                  );
                })
              );
            }

            // Se não tem coordenadas, apenas retorna o userId
            this.success.set(true);
            this.isLoading.set(false);
            return from(Promise.resolve(userId));
          }),
          tap({
            error: (err) => {
              this.error.set(err.message || 'Registration failed');
              this.isLoading.set(false);
            },
          })
        );
      })
    );
  }

  /**
   * Cria a FarmArea no Firestore
   */
  private async createFarmArea(userId: string, data: RegisterData): Promise<string> {
    if (!data.farmAreaCoordinates) {
      throw new Error('Farm area coordinates are required');
    }

    const coordinates = data.farmAreaCoordinates;
    const areaM2 = calculatePolygonArea(coordinates);
    const areaHectares = areaM2 / 10000;

    const farmArea: Omit<import('@fiap-hackaton/domain').FarmArea, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      type: GEO_FEATURE_TYPE.POLYGON,
      coordinates: coordinates, // Array simples de coordenadas, não aninhado
      properties: {
        farmName: data.farmName,
        ownerName: data.name,
        totalAreaM2: areaM2,
        totalAreaHectares: areaHectares,
        address: data.location.address,
        color: '#10B981',
        fillColor: '#10B981',
        fillOpacity: 0.2,
      },
    };

    return await this.farmAreaRepository.createFarmArea(farmArea).toPromise() as string;
  }

  /**
   * Limpa mensagem de erro
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Reseta estado
   */
  reset(): void {
    this.isLoading.set(false);
    this.error.set(null);
    this.success.set(false);
  }
}
