import { EnvironmentProviders, Provider } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth, browserLocalPersistence } from '@angular/fire/auth';
import { firebaseConfig } from '@fiap-hackaton/shared-environments';

export function provideShell(): (EnvironmentProviders | Provider)[] {
  return [
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => {
      const auth = getAuth();
      // Configurar persistência local (mantém sessão até logout explícito)
      auth.setPersistence(browserLocalPersistence);
      return auth;
    }),
    provideFirestore(() => getFirestore()),
  ];
}
