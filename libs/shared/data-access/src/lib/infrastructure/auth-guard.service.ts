import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService {
  private router = inject(Router);

  /**
   * Valida se o usuário está autenticado antes de executar uma operação
   * @param userId - ID do usuário autenticado
   * @returns true se autenticado, false caso contrário
   */
  validateAuth(userId: string | undefined | null): boolean {
    if (!userId) {
      this.handleAuthError('Usuário não autenticado');
      return false;
    }
    return true;
  }

  /**
   * Wrapper para adicionar tratamento de erro de permissão em Observables
   * @param source$ - Observable fonte
   * @returns Observable com tratamento de erro
   */
  handlePermissionError<T>(source$: Observable<T>): Observable<T> {
    return source$.pipe(
      catchError((error) => {
        // Verifica se é erro de permissão do Firebase
        if (this.isPermissionError(error)) {
          this.handleAuthError('Sessão expirada ou permissões insuficientes');
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Verifica se o erro é de permissão/autenticação do Firebase
   */
  private isPermissionError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code?.toLowerCase() || '';

    return (
      errorMessage.includes('permission') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('insufficient') ||
      errorCode.includes('permission-denied') ||
      errorCode.includes('unauthenticated')
    );
  }

  /**
   * Desloga o usuário e redireciona para login
   */
  private handleAuthError(message: string): void {
    // Limpar dados do localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');

    // Redirecionar para login
    this.router.navigate(['/auth/login'], {
      queryParams: { sessionExpired: 'true', reason: message }
    });
  }
}
