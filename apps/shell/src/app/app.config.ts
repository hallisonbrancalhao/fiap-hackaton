import {
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import FarmTheme from '@fiap-farm/ui-components';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideShell } from '@fiap-hackaton/shell-dashboard';
import { MessageService } from 'primeng/api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideRouter(appRoutes),
    providePrimeNG({
      theme: FarmTheme,
      ripple: true,
    }),
    MessageService,
    ...provideShell(),
  ],
};
