import { Injectable, inject, signal } from '@angular/core';
import { Observable, delay, tap, map } from 'rxjs';
import { FarmUser } from '@fiap-hackaton/auth-domain';
import { FarmUserRepository } from '../infrastructure/farm-user.repository';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: FarmUser;
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthLoginFacade {
  // State signals
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  currentUser = signal<FarmUser | null>(null);

  private repository = inject(FarmUserRepository);

  /**
   * Simula login do usuário
   * TODO: Integrar com Firebase Authentication
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    // Simula validação por email
    return this.repository.getByEmail(credentials.email).pipe(
      delay(1000), // Simula latência de rede
      tap({
        next: (users) => {
          if (users.length === 0) {
            this.error.set('User not found');
            throw new Error('User not found');
          }

          const user = users[0];
          this.currentUser.set(user);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set(err.message || 'Login failed');
          this.isLoading.set(false);
        },
      }),
      map((users) => ({
        user: users[0],
        token: 'mock-token',
      }))
    );
  }

  /**
   * Realiza logout do usuário
   */
  logout(): void {
    this.currentUser.set(null);
    this.error.set(null);
  }

  /**
   * Verifica se usuário está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  /**
   * Limpa mensagem de erro
   */
  clearError(): void {
    this.error.set(null);
  }
}
