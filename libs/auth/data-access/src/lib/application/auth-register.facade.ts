import { Injectable, inject, signal } from '@angular/core';
import { Observable, throwError, delay, tap, switchMap } from 'rxjs';
import { FarmUser, Location } from '@fiap-hackaton/auth-domain';
import { FarmUserRepository } from '../infrastructure/farm-user.repository';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  farmName: string;
  phone?: string;
  location: Location;
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
          tap({
            next: () => {
              this.success.set(true);
              this.isLoading.set(false);
            },
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
