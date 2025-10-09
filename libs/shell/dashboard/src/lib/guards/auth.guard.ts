import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthLoginFacade } from '@fiap-hackaton/auth-data-access';

export const authGuard: CanActivateFn = () => {
  const authFacade = inject(AuthLoginFacade);
  const router = inject(Router);

  if (authFacade.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
