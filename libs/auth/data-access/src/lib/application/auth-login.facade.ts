import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, from, switchMap, catchError, throwError } from 'rxjs';
import { FarmUser } from '@fiap-hackaton/auth-domain';
import { FarmUserRepository } from '../infrastructure/farm-user.repository';
import { AuthStorageService } from '../infrastructure/auth-storage.service';
import { Auth, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';

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
  private auth = inject(Auth);

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

    // 1. Autenticar no Firebase Auth
    return from(signInWithEmailAndPassword(this.auth, credentials.email, credentials.password)).pipe(
      switchMap((userCredential) => {
        // 2. Buscar dados do usuário no Firestore (agora com auth válido)
        return this.repository.getByEmail(credentials.email).pipe(
          map((users) => {
            if (users.length === 0) {
              throw new Error('User not found in database');
            }
            const user = users[0];
            this.setUserSession(user);
            this.isLoading.set(false);

            return {
              user,
              token: userCredential.user.uid,
            };
          })
        );
      }),
      catchError((error) => {
        const errorMessage = error.message || 'Login failed';
        this.error.set(errorMessage);
        this.isLoading.set(false);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Realiza logout do usuário
   */
  logout(): void {
    signOut(this.auth).then(() => {
      this.currentUser.set(null);
      this.error.set(null);
      this.storage.clearUser();
    });
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
