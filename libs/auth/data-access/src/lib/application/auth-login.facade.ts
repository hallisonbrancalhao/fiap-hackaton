import { Injectable, inject, signal } from '@angular/core';
import { Observable, delay, tap, map } from 'rxjs';
import { FarmUser } from '@fiap-hackaton/auth-domain';
import { FarmUserRepository } from '../infrastructure/farm-user.repository';
import { AuthStorageService } from '../infrastructure/auth-storage.service';

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
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  currentUser = signal<FarmUser | null>(null);

  private repository = inject(FarmUserRepository);
  private storage = inject(AuthStorageService);

  /**
   * Inicializa o facade, restaurando sessão se existir
   */
  constructor() {
    this.restoreSession();
  }

  /**
   * Realiza login do usuário
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.repository.getByEmail(credentials.email).pipe(
      delay(1000),
      tap({
        next: (users) => {
          if (users.length === 0) {
            this.error.set('User not found');
            throw new Error('User not found');
          }

          const user = users[0];
          this.setUserSession(user);
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
    this.storage.clearUser();
  }

  /**
   * Verifica se usuário está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  /**
   * Obtém o farmId do usuário autenticado.
   * Prioriza o campo farmId, usa id como fallback.
   * @returns farmId ou null se não autenticado
   */
  getCurrentFarmId(): string | null {
    const user = this.currentUser();
    if (!user) {
      return null;
    }

    return user.farmId || user.id || null;
  }

  /**
   * Limpa mensagem de erro
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Restaura sessão do usuário a partir do localStorage
   */
  private restoreSession(): void {
    const savedUser = this.storage.getUser();
    if (savedUser) {
      this.currentUser.set(savedUser);
    }
  }

  /**
   * Define a sessão do usuário (memória + localStorage)
   */
  private setUserSession(user: FarmUser): void {
    this.currentUser.set(user);
    this.storage.saveUser(user);
  }
}
