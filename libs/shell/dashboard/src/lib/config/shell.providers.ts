import { EnvironmentProviders, Provider } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { firebaseConfig } from '@fiap-hackaton/shared-environments';

export function provideShell(): (EnvironmentProviders | Provider)[] {
  return [
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ];
}
