import { Injectable, inject, signal } from '@angular/core';
import { Observable, throwError, tap, switchMap, from, catchError } from 'rxjs';
import { FarmUser, Location } from '@fiap-hackaton/auth-domain';
import { GeoCoordinate, GEO_FEATURE_TYPE, calculatePolygonArea } from '@fiap-hackaton/map-domain';
import { FarmUserRepository } from '../infrastructure/farm-user.repository';
import { FarmAreaRepository } from '@fiap-hackaton/map-data-access';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';

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
  private auth = inject(Auth);

  /**
   * Registra novo usuário usando Firebase Authentication + Firestore
   */
  register(data: RegisterData): Observable<string> {
    this.isLoading.set(true);
    this.error.set(null);
    this.success.set(false);

    // 1. Criar usuário no Firebase Authentication
    return from(createUserWithEmailAndPassword(this.auth, data.email, data.password)).pipe(
      switchMap((userCredential) => {
        const authUserId = userCredential.user.uid;

        // 2. Criar documento do usuário no Firestore usando o UID do Firebase Auth
        const newUser: Omit<FarmUser, 'id'> = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          farmName: data.farmName,
          location: data.location,
        };

        return this.repository.createWithId(authUserId, newUser).pipe(
          switchMap(() => {
            // 3. Se tem coordenadas da fazenda, cria o FarmArea
            if (data.farmAreaCoordinates && data.farmAreaCoordinates.length >= 3) {
              return from(this.createFarmArea(authUserId, data)).pipe(
                switchMap((farmAreaId) => {
                  // 4. Atualiza o usuário com o farmAreaId
                  return this.repository.update(authUserId, { farmAreaId }).pipe(
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
                    switchMap(() => from(Promise.resolve(authUserId)))
                  );
                })
              );
            }

            // Se não tem coordenadas, apenas retorna o userId
            this.success.set(true);
            this.isLoading.set(false);
            return from(Promise.resolve(authUserId));
          })
        );
      }),
      catchError((error) => {
        let errorMessage = 'Registration failed';

        // Traduzir erros comuns do Firebase Auth
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Email already registered';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Password is too weak (minimum 6 characters)';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address';
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.error.set(errorMessage);
        this.isLoading.set(false);
        return throwError(() => new Error(errorMessage));
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
