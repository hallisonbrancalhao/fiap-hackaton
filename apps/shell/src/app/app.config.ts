import {
  ApplicationConfig,
  provideZoneChangeDetection,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import FarmTheme from '@fiap-farm/ui-components';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideShell } from '@fiap-farm/dashboard-shell';
import { initializeAuth } from '@fiap-hackaton/auth-data-access';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideRouter(appRoutes),
    providePrimeNG({
      theme: FarmTheme,
      ripple: true,
    }),
    ...provideShell(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      multi: true,
    },
  ],
};
