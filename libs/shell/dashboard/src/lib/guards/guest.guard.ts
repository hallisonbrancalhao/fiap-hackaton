import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthLoginFacade } from '@fiap-hackaton/auth-data-access';

/**
 * Guard que permite acesso apenas para usuários NÃO autenticados.
 * Redireciona usuários autenticados para o dashboard.
 * 
 * Útil para páginas de login/registro.
 */
export const guestGuard: CanActivateFn = () => {
  const authFacade = inject(AuthLoginFacade);
  const router = inject(Router);

  if (!authFacade.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
